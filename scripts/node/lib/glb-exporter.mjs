/**
 * GLB Exporter
 * Converts geometry data to GLB format using @gltf-transform/core.
 * Handles mesh creation, material assignment, and file output.
 */

import { Document, NodeIO } from '@gltf-transform/core';
import { dedup, prune } from '@gltf-transform/functions';
import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

// =============================================================================
// GLB Creation
// =============================================================================

/**
 * Create a GLB document from multiple named meshes
 * @param {Object.<string, GeometryData>} meshes - Map of mesh name to geometry data
 * @param {object} [options] - Export options
 * @param {string} [options.generator] - Generator name for metadata
 * @returns {Document}
 */
export function createGLBDocument(meshes, options = {}) {
  const doc = new Document();
  
  // Set generator metadata
  doc.getRoot().getAsset().generator = options.generator || 'music-visualisation-3d model generator';
  
  // Create a buffer to hold all binary data (required for GLB export)
  const buffer = doc.createBuffer('buffer');
  
  // Create a single scene
  const scene = doc.createScene('Scene');
  
  // Create meshes and nodes for each part
  for (const [name, geometry] of Object.entries(meshes)) {
    if (!geometry || !geometry.positions || geometry.positions.length === 0) {
      console.warn(`Skipping empty geometry: ${name}`);
      continue;
    }
    
    // Create accessor for positions
    const positionAccessor = doc.createAccessor(name + '_positions')
      .setType('VEC3')
      .setArray(geometry.positions)
      .setBuffer(buffer);
    
    // Create primitive
    const primitive = doc.createPrimitive()
      .setAttribute('POSITION', positionAccessor);
    
    // Add normals if present
    if (geometry.normals && geometry.normals.length > 0) {
      const normalAccessor = doc.createAccessor(name + '_normals')
        .setType('VEC3')
        .setArray(geometry.normals)
        .setBuffer(buffer);
      primitive.setAttribute('NORMAL', normalAccessor);
    }
    
    // Add indices if present
    if (geometry.indices && geometry.indices.length > 0) {
      const indexAccessor = doc.createAccessor(name + '_indices')
        .setType('SCALAR')
        .setArray(geometry.indices)
        .setBuffer(buffer);
      primitive.setIndices(indexAccessor);
    }
    
    // Create a simple unlit material (white color for wireframe)
    const material = doc.createMaterial(name + '_material')
      .setBaseColorFactor([1, 1, 1, 1])
      .setMetallicFactor(0)
      .setRoughnessFactor(1);
    
    primitive.setMaterial(material);
    
    // Create mesh with the primitive
    const mesh = doc.createMesh(name)
      .addPrimitive(primitive);
    
    // Create node for the mesh
    const node = doc.createNode(name)
      .setMesh(mesh);
    
    // Add node to scene
    scene.addChild(node);
  }
  
  return doc;
}

/**
 * Optimize a GLB document (deduplicate accessors, prune unused)
 * @param {Document} doc 
 * @returns {Promise<Document>}
 */
export async function optimizeDocument(doc) {
  // Remove duplicate accessors
  await doc.transform(dedup());
  
  // Remove unused nodes, meshes, etc.
  await doc.transform(prune());
  
  return doc;
}

/**
 * Write a GLB document to file
 * @param {Document} doc - The document to write
 * @param {string} filePath - Output file path
 * @returns {Promise<void>}
 */
export async function writeGLB(doc, filePath) {
  // Ensure directory exists
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
  
  // Create IO handler
  const io = new NodeIO();
  
  // Write to binary GLB
  const glb = await io.writeBinary(doc);
  
  // Write to file
  await writeFile(filePath, glb);
  
  console.log(`Written: ${filePath} (${(glb.byteLength / 1024).toFixed(1)} KB)`);
}

// =============================================================================
// High-Level Export Function
// =============================================================================

/**
 * Export multiple meshes to a GLB file
 * @param {Object.<string, GeometryData>} meshes - Map of mesh name to geometry data
 * @param {string} filePath - Output file path
 * @param {object} [options] - Export options
 * @param {boolean} [options.optimize=true] - Whether to optimize the document
 * @param {string} [options.generator] - Generator name for metadata
 * @returns {Promise<void>}
 */
export async function exportToGLB(meshes, filePath, options = {}) {
  const { optimize = true, generator } = options;
  
  // Create document
  let doc = createGLBDocument(meshes, { generator });
  
  // Optimize if requested
  if (optimize) {
    doc = await optimizeDocument(doc);
  }
  
  // Write to file
  await writeGLB(doc, filePath);
}

// =============================================================================
// Geometry Statistics
// =============================================================================

/**
 * Get statistics about a geometry
 * @param {GeometryData} geometry 
 * @returns {object}
 */
export function getGeometryStats(geometry) {
  const vertexCount = geometry.positions ? geometry.positions.length / 3 : 0;
  const triangleCount = geometry.indices ? geometry.indices.length / 3 : vertexCount / 3;
  const hasNormals = !!(geometry.normals && geometry.normals.length > 0);
  
  return {
    vertexCount,
    triangleCount,
    hasNormals,
    positionBytes: geometry.positions ? geometry.positions.byteLength : 0,
    normalBytes: geometry.normals ? geometry.normals.byteLength : 0,
    indexBytes: geometry.indices ? geometry.indices.byteLength : 0,
  };
}

/**
 * Print statistics for all meshes
 * @param {Object.<string, GeometryData>} meshes 
 */
export function printMeshStats(meshes) {
  console.log('\nMesh Statistics:');
  console.log('─'.repeat(60));
  
  let totalVertices = 0;
  let totalTriangles = 0;
  let totalBytes = 0;
  
  for (const [name, geometry] of Object.entries(meshes)) {
    const stats = getGeometryStats(geometry);
    const totalSize = stats.positionBytes + stats.normalBytes + stats.indexBytes;
    
    console.log(`  ${name}:`);
    console.log(`    Vertices: ${stats.vertexCount.toLocaleString()}`);
    console.log(`    Triangles: ${stats.triangleCount.toLocaleString()}`);
    console.log(`    Size: ${(totalSize / 1024).toFixed(1)} KB`);
    
    totalVertices += stats.vertexCount;
    totalTriangles += stats.triangleCount;
    totalBytes += totalSize;
  }
  
  console.log('─'.repeat(60));
  console.log(`  Total: ${totalVertices.toLocaleString()} vertices, ${totalTriangles.toLocaleString()} triangles, ${(totalBytes / 1024).toFixed(1)} KB`);
  console.log('');
}

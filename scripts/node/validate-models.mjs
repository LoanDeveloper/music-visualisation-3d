/**
 * GLB Model Validator & Optimizer
 * ================================
 * 
 * Validates and optimizes GLB models for the Human Layer feature.
 * 
 * Usage:
 *   node scripts/node/validate-models.mjs [--optimize] [--fix]
 * 
 * Options:
 *   --optimize  Apply optimizations (dedupe, quantize, prune)
 *   --fix       Attempt to fix common issues
 *   --verbose   Show detailed output
 */

import { readFile, writeFile, access, mkdir } from 'fs/promises';
import { constants } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  modelsDir: join(__dirname, '../../public/models/human'),
  requiredFiles: ['pose-open.glb', 'pose-closed.glb'],
  requiredMeshes: ['Body', 'Veins', 'Brain', 'Heart'],
  maxFileSizeMB: 5,
  maxTrianglesPerMesh: 50000,
  maxTotalTriangles: 150000,
};

// =============================================================================
// GLB Parsing (minimal implementation without external deps)
// =============================================================================

/**
 * Parse a GLB file and extract basic info
 * GLB format: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#glb-file-format-specification
 */
async function parseGLB(filePath) {
  const buffer = await readFile(filePath);
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  
  // GLB Header (12 bytes)
  const magic = view.getUint32(0, true);
  if (magic !== 0x46546C67) { // 'glTF' in little-endian
    throw new Error(`Invalid GLB magic: expected 0x46546C67, got 0x${magic.toString(16)}`);
  }
  
  const version = view.getUint32(4, true);
  if (version !== 2) {
    throw new Error(`Unsupported glTF version: ${version}`);
  }
  
  const length = view.getUint32(8, true);
  
  // JSON Chunk (first chunk)
  const chunk0Length = view.getUint32(12, true);
  const chunk0Type = view.getUint32(16, true);
  
  if (chunk0Type !== 0x4E4F534A) { // 'JSON' in little-endian
    throw new Error('First chunk is not JSON');
  }
  
  const jsonBytes = buffer.subarray(20, 20 + chunk0Length);
  const jsonString = new TextDecoder().decode(jsonBytes);
  const gltf = JSON.parse(jsonString);
  
  // Binary Chunk (second chunk, optional)
  let binBuffer = null;
  if (20 + chunk0Length < length) {
    const chunk1Offset = 20 + chunk0Length;
    const chunk1Length = view.getUint32(chunk1Offset, true);
    const chunk1Type = view.getUint32(chunk1Offset + 4, true);
    
    if (chunk1Type === 0x004E4942) { // 'BIN\0' in little-endian
      binBuffer = buffer.subarray(chunk1Offset + 8, chunk1Offset + 8 + chunk1Length);
    }
  }
  
  return {
    version,
    fileSize: buffer.length,
    gltf,
    binBuffer,
  };
}

/**
 * Extract mesh information from parsed glTF
 */
function extractMeshInfo(gltf, binBuffer) {
  const meshes = [];
  
  if (!gltf.meshes) {
    return meshes;
  }
  
  for (const mesh of gltf.meshes) {
    const meshInfo = {
      name: mesh.name || 'unnamed',
      primitives: [],
      totalVertices: 0,
      totalTriangles: 0,
    };
    
    for (const primitive of mesh.primitives) {
      const primInfo = {
        mode: primitive.mode ?? 4, // 4 = TRIANGLES
        attributes: {},
        indices: null,
      };
      
      // Get vertex count from POSITION attribute
      if (primitive.attributes?.POSITION !== undefined) {
        const accessor = gltf.accessors[primitive.attributes.POSITION];
        primInfo.attributes.POSITION = {
          count: accessor.count,
          type: accessor.type,
          componentType: accessor.componentType,
        };
        meshInfo.totalVertices += accessor.count;
      }
      
      // Get index count
      if (primitive.indices !== undefined) {
        const accessor = gltf.accessors[primitive.indices];
        primInfo.indices = {
          count: accessor.count,
        };
        // For triangles, triangle count = index count / 3
        if (primInfo.mode === 4) {
          meshInfo.totalTriangles += Math.floor(accessor.count / 3);
        }
      } else if (primInfo.attributes.POSITION) {
        // Non-indexed: triangle count = vertex count / 3
        if (primInfo.mode === 4) {
          meshInfo.totalTriangles += Math.floor(primInfo.attributes.POSITION.count / 3);
        }
      }
      
      meshInfo.primitives.push(primInfo);
    }
    
    meshes.push(meshInfo);
  }
  
  return meshes;
}

/**
 * Get node hierarchy with mesh references
 */
function extractNodeInfo(gltf) {
  const nodes = [];
  
  if (!gltf.nodes) {
    return nodes;
  }
  
  for (let i = 0; i < gltf.nodes.length; i++) {
    const node = gltf.nodes[i];
    nodes.push({
      index: i,
      name: node.name || `node_${i}`,
      meshIndex: node.mesh,
      children: node.children || [],
      translation: node.translation,
      rotation: node.rotation,
      scale: node.scale,
    });
  }
  
  return nodes;
}

// =============================================================================
// Validation
// =============================================================================

class ValidationResult {
  constructor(filename) {
    this.filename = filename;
    this.errors = [];
    this.warnings = [];
    this.info = [];
    this.meshes = [];
    this.fileSize = 0;
    this.valid = true;
  }
  
  addError(message) {
    this.errors.push(message);
    this.valid = false;
  }
  
  addWarning(message) {
    this.warnings.push(message);
  }
  
  addInfo(message) {
    this.info.push(message);
  }
}

async function validateModel(filePath) {
  const filename = filePath.split('/').pop();
  const result = new ValidationResult(filename);
  
  // Check file exists
  try {
    await access(filePath, constants.R_OK);
  } catch {
    result.addError(`File not found: ${filePath}`);
    return result;
  }
  
  // Parse GLB
  let parsed;
  try {
    parsed = await parseGLB(filePath);
  } catch (e) {
    result.addError(`Failed to parse GLB: ${e.message}`);
    return result;
  }
  
  result.fileSize = parsed.fileSize;
  result.addInfo(`File size: ${(parsed.fileSize / 1024 / 1024).toFixed(2)} MB`);
  
  // Check file size
  if (parsed.fileSize > CONFIG.maxFileSizeMB * 1024 * 1024) {
    result.addWarning(`File size exceeds ${CONFIG.maxFileSizeMB}MB - may impact load time`);
  }
  
  // Extract mesh info
  const meshes = extractMeshInfo(parsed.gltf, parsed.binBuffer);
  const nodes = extractNodeInfo(parsed.gltf);
  result.meshes = meshes;
  
  result.addInfo(`Found ${meshes.length} meshes, ${nodes.length} nodes`);
  
  // Check required meshes exist
  const meshNames = new Set(meshes.map(m => m.name));
  const nodeNames = new Set(nodes.map(n => n.name));
  const allNames = new Set([...meshNames, ...nodeNames]);
  
  for (const required of CONFIG.requiredMeshes) {
    // Check both mesh names and node names (Z-Anatomy might use nodes)
    const found = allNames.has(required) || 
                  [...allNames].some(n => n.toLowerCase() === required.toLowerCase());
    
    if (!found) {
      result.addError(`Missing required mesh: "${required}"`);
    } else {
      result.addInfo(`Found mesh: "${required}"`);
    }
  }
  
  // Check triangle counts
  let totalTriangles = 0;
  for (const mesh of meshes) {
    totalTriangles += mesh.totalTriangles;
    
    if (mesh.totalTriangles > CONFIG.maxTrianglesPerMesh) {
      result.addWarning(
        `Mesh "${mesh.name}" has ${mesh.totalTriangles} triangles ` +
        `(max recommended: ${CONFIG.maxTrianglesPerMesh})`
      );
    }
    
    result.addInfo(`  ${mesh.name}: ${mesh.totalVertices} vertices, ${mesh.totalTriangles} triangles`);
  }
  
  if (totalTriangles > CONFIG.maxTotalTriangles) {
    result.addWarning(
      `Total triangles (${totalTriangles}) exceeds recommended max (${CONFIG.maxTotalTriangles})`
    );
  }
  
  result.addInfo(`Total: ${totalTriangles} triangles`);
  
  return result;
}

// =============================================================================
// Report Generation
// =============================================================================

function printResult(result, verbose = false) {
  console.log('');
  console.log('─'.repeat(60));
  console.log(`📦 ${result.filename}`);
  console.log('─'.repeat(60));
  
  if (result.errors.length > 0) {
    console.log('');
    console.log('❌ ERRORS:');
    for (const error of result.errors) {
      console.log(`   • ${error}`);
    }
  }
  
  if (result.warnings.length > 0) {
    console.log('');
    console.log('⚠️  WARNINGS:');
    for (const warning of result.warnings) {
      console.log(`   • ${warning}`);
    }
  }
  
  if (verbose && result.info.length > 0) {
    console.log('');
    console.log('ℹ️  INFO:');
    for (const info of result.info) {
      console.log(`   ${info}`);
    }
  }
  
  console.log('');
  if (result.valid) {
    console.log('✅ Validation passed');
  } else {
    console.log('❌ Validation failed');
  }
}

function printSummary(results) {
  console.log('');
  console.log('═'.repeat(60));
  console.log('SUMMARY');
  console.log('═'.repeat(60));
  
  const passed = results.filter(r => r.valid).length;
  const total = results.length;
  
  console.log(`Validated: ${passed}/${total} models passed`);
  
  if (passed === total) {
    console.log('');
    console.log('🎉 All models are valid! Ready for use in the visualizer.');
  } else {
    console.log('');
    console.log('⚠️  Some models have issues. See above for details.');
    console.log('');
    console.log('To fix:');
    console.log('1. Re-run the Blender export script');
    console.log('2. Or manually fix mesh names in Blender');
    console.log('3. Ensure meshes are named: Body, Veins, Brain, Heart');
  }
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const optimize = args.includes('--optimize');
  const fix = args.includes('--fix');
  
  console.log('');
  console.log('═'.repeat(60));
  console.log('GLB Model Validator for Music Visualisation 3D');
  console.log('═'.repeat(60));
  console.log(`Models directory: ${CONFIG.modelsDir}`);
  
  // Check if models directory exists
  try {
    await access(CONFIG.modelsDir, constants.R_OK);
  } catch {
    console.log('');
    console.log('❌ Models directory not found!');
    console.log('');
    console.log('Please run the Blender export script first:');
    console.log('');
    console.log('  blender z_anatomy.blend --background \\');
    console.log('    --python scripts/blender/extract_anatomy.py \\');
    console.log('    -- --output public/models/human');
    console.log('');
    process.exit(1);
  }
  
  // Validate each required file
  const results = [];
  
  for (const file of CONFIG.requiredFiles) {
    const filePath = join(CONFIG.modelsDir, file);
    const result = await validateModel(filePath);
    results.push(result);
    printResult(result, verbose);
  }
  
  printSummary(results);
  
  // Optimization (placeholder - would use @gltf-transform in production)
  if (optimize) {
    console.log('');
    console.log('═'.repeat(60));
    console.log('OPTIMIZATION');
    console.log('═'.repeat(60));
    console.log('');
    console.log('⚠️  Optimization requires @gltf-transform/cli');
    console.log('');
    console.log('Install and run:');
    console.log('  npx @gltf-transform/cli optimize input.glb output.glb \\');
    console.log('    --compress draco --texture-compress webp');
    console.log('');
  }
  
  // Exit with appropriate code
  const allValid = results.every(r => r.valid);
  process.exit(allValid ? 0 : 1);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});

/**
 * Geometry Builder
 * Wrapper around primitive-geometry for creating and transforming 3D geometries.
 * Outputs data in a format compatible with gltf-transform.
 */

import * as Primitives from 'primitive-geometry';

// =============================================================================
// Constants
// =============================================================================

const DEG_TO_RAD = Math.PI / 180;

// =============================================================================
// Geometry Creation (wrappers around primitive-geometry)
// =============================================================================

/**
 * Create a capsule geometry
 * @param {object} options
 * @param {number} [options.height=0.5] - Height of cylindrical section
 * @param {number} [options.radius=0.25] - Radius
 * @param {number} [options.segments=16] - Radial segments
 * @param {number} [options.heightSegments=1] - Height segments
 * @param {number} [options.roundSegments=8] - Cap segments
 * @returns {GeometryData}
 */
export function createCapsule(options = {}) {
  const geo = Primitives.capsule({
    height: options.height ?? 0.5,
    radius: options.radius ?? 0.25,
    nx: options.segments ?? 16,
    ny: options.heightSegments ?? 1,
    roundSegments: options.roundSegments ?? 8,
  });
  return normalizeGeometry(geo);
}

/**
 * Create a sphere geometry
 * @param {object} options
 * @param {number} [options.radius=0.5] - Radius
 * @param {number} [options.widthSegments=32] - Horizontal segments
 * @param {number} [options.heightSegments=16] - Vertical segments
 * @returns {GeometryData}
 */
export function createSphere(options = {}) {
  const geo = Primitives.sphere({
    radius: options.radius ?? 0.5,
    nx: options.widthSegments ?? 32,
    ny: options.heightSegments ?? 16,
  });
  return normalizeGeometry(geo);
}

/**
 * Create an icosphere geometry (better for organic shapes)
 * @param {object} options
 * @param {number} [options.radius=0.5] - Radius
 * @param {number} [options.subdivisions=2] - Subdivision level (0-4)
 * @returns {GeometryData}
 */
export function createIcosphere(options = {}) {
  const geo = Primitives.icosphere({
    radius: options.radius ?? 0.5,
    subdivisions: options.subdivisions ?? 2,
  });
  return normalizeGeometry(geo);
}

/**
 * Create a cylinder geometry
 * @param {object} options
 * @param {number} [options.height=1] - Height
 * @param {number} [options.radius=0.25] - Radius
 * @param {number} [options.radiusTop=radius] - Top radius (for cones)
 * @param {number} [options.segments=16] - Radial segments
 * @param {number} [options.heightSegments=1] - Height segments
 * @param {boolean} [options.capTop=true] - Include top cap
 * @param {boolean} [options.capBottom=true] - Include bottom cap
 * @returns {GeometryData}
 */
export function createCylinder(options = {}) {
  const radius = options.radius ?? 0.25;
  const geo = Primitives.cylinder({
    height: options.height ?? 1,
    radius: radius,
    radiusApex: options.radiusTop ?? radius,
    nx: options.segments ?? 16,
    ny: options.heightSegments ?? 1,
    capApex: options.capTop ?? true,
    capBase: options.capBottom ?? true,
  });
  return normalizeGeometry(geo);
}

/**
 * Create a cone geometry
 * @param {object} options
 * @param {number} [options.height=1] - Height
 * @param {number} [options.radius=0.25] - Base radius
 * @param {number} [options.segments=16] - Radial segments
 * @returns {GeometryData}
 */
export function createCone(options = {}) {
  const geo = Primitives.cone({
    height: options.height ?? 1,
    radius: options.radius ?? 0.25,
    nx: options.segments ?? 16,
    ny: 1,
    capBase: true,
  });
  return normalizeGeometry(geo);
}

/**
 * Create a torus geometry
 * @param {object} options
 * @param {number} [options.radius=0.4] - Major radius
 * @param {number} [options.tube=0.1] - Tube radius
 * @param {number} [options.radialSegments=32] - Radial segments
 * @param {number} [options.tubularSegments=16] - Tubular segments
 * @returns {GeometryData}
 */
export function createTorus(options = {}) {
  const geo = Primitives.torus({
    radius: options.radius ?? 0.4,
    minorRadius: options.tube ?? 0.1,
    segments: options.radialSegments ?? 32,
    minorSegments: options.tubularSegments ?? 16,
  });
  return normalizeGeometry(geo);
}

/**
 * Create an ellipsoid geometry
 * @param {object} options
 * @param {number} [options.radius=0.5] - Base radius
 * @param {number} [options.rx=1] - X scale
 * @param {number} [options.ry=0.5] - Y scale
 * @param {number} [options.rz=0.5] - Z scale
 * @param {number} [options.segments=32] - Segments
 * @returns {GeometryData}
 */
export function createEllipsoid(options = {}) {
  const geo = Primitives.ellipsoid({
    radius: options.radius ?? 0.5,
    rx: options.rx ?? 1,
    ry: options.ry ?? 0.5,
    rz: options.rz ?? 0.5,
    nx: options.segments ?? 32,
    ny: Math.floor((options.segments ?? 32) / 2),
  });
  return normalizeGeometry(geo);
}

// =============================================================================
// Geometry Normalization
// =============================================================================

/**
 * Normalize primitive-geometry output to our standard format
 * @param {object} geo - primitive-geometry output
 * @returns {GeometryData}
 */
function normalizeGeometry(geo) {
  return {
    positions: new Float32Array(geo.positions),
    normals: geo.normals ? new Float32Array(geo.normals) : null,
    indices: geo.cells ? new Uint32Array(geo.cells) : null,
  };
}

// =============================================================================
// Geometry Transformation
// =============================================================================

/**
 * Apply a 4x4 transformation matrix to geometry positions and normals
 * @param {GeometryData} geo - Geometry to transform (mutated in place)
 * @param {Float32Array|number[]} matrix - 4x4 column-major matrix
 * @returns {GeometryData} The same geometry (for chaining)
 */
export function transformGeometry(geo, matrix) {
  const m = matrix;
  const positions = geo.positions;
  const normals = geo.normals;
  
  // Extract rotation part for normals (upper-left 3x3)
  const normalMatrix = [
    m[0], m[1], m[2],
    m[4], m[5], m[6],
    m[8], m[9], m[10],
  ];
  
  // Transform positions
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    
    positions[i]     = m[0] * x + m[4] * y + m[8]  * z + m[12];
    positions[i + 1] = m[1] * x + m[5] * y + m[9]  * z + m[13];
    positions[i + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
  }
  
  // Transform normals (without translation)
  if (normals) {
    for (let i = 0; i < normals.length; i += 3) {
      const x = normals[i];
      const y = normals[i + 1];
      const z = normals[i + 2];
      
      const nx = normalMatrix[0] * x + normalMatrix[3] * y + normalMatrix[6] * z;
      const ny = normalMatrix[1] * x + normalMatrix[4] * y + normalMatrix[7] * z;
      const nz = normalMatrix[2] * x + normalMatrix[5] * y + normalMatrix[8] * z;
      
      // Normalize
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (len > 0) {
        normals[i]     = nx / len;
        normals[i + 1] = ny / len;
        normals[i + 2] = nz / len;
      }
    }
  }
  
  return geo;
}

/**
 * Create a translation matrix
 * @param {number} x 
 * @param {number} y 
 * @param {number} z 
 * @returns {Float32Array} 4x4 column-major matrix
 */
export function translationMatrix(x, y, z) {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1,
  ]);
}

/**
 * Create a rotation matrix from Euler angles (XYZ order)
 * @param {number} rx - Rotation around X in degrees
 * @param {number} ry - Rotation around Y in degrees
 * @param {number} rz - Rotation around Z in degrees
 * @returns {Float32Array} 4x4 column-major matrix
 */
export function rotationMatrix(rx, ry, rz) {
  const x = rx * DEG_TO_RAD;
  const y = ry * DEG_TO_RAD;
  const z = rz * DEG_TO_RAD;
  
  const cx = Math.cos(x), sx = Math.sin(x);
  const cy = Math.cos(y), sy = Math.sin(y);
  const cz = Math.cos(z), sz = Math.sin(z);
  
  // Combined XYZ rotation
  return new Float32Array([
    cy * cz,                      cy * sz,                      -sy,     0,
    sx * sy * cz - cx * sz,       sx * sy * sz + cx * cz,       sx * cy, 0,
    cx * sy * cz + sx * sz,       cx * sy * sz - sx * cz,       cx * cy, 0,
    0,                            0,                            0,       1,
  ]);
}

/**
 * Create a scale matrix
 * @param {number} sx 
 * @param {number} sy 
 * @param {number} sz 
 * @returns {Float32Array} 4x4 column-major matrix
 */
export function scaleMatrix(sx, sy, sz) {
  return new Float32Array([
    sx, 0,  0,  0,
    0,  sy, 0,  0,
    0,  0,  sz, 0,
    0,  0,  0,  1,
  ]);
}

/**
 * Multiply two 4x4 matrices (column-major)
 * @param {Float32Array} a 
 * @param {Float32Array} b 
 * @returns {Float32Array}
 */
export function multiplyMatrices(a, b) {
  const result = new Float32Array(16);
  
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[row + k * 4] * b[k + col * 4];
      }
      result[row + col * 4] = sum;
    }
  }
  
  return result;
}

/**
 * Compose a transformation matrix from translation, rotation, and scale
 * @param {object} transform
 * @param {number[]} [transform.position=[0,0,0]] - Translation
 * @param {number[]} [transform.rotation=[0,0,0]] - Euler angles in degrees
 * @param {number[]} [transform.scale=[1,1,1]] - Scale
 * @returns {Float32Array} 4x4 column-major matrix
 */
export function composeMatrix(transform = {}) {
  const pos = transform.position ?? [0, 0, 0];
  const rot = transform.rotation ?? [0, 0, 0];
  const scl = transform.scale ?? [1, 1, 1];
  
  const T = translationMatrix(pos[0], pos[1], pos[2]);
  const R = rotationMatrix(rot[0], rot[1], rot[2]);
  const S = scaleMatrix(scl[0], scl[1], scl[2]);
  
  // TRS order
  return multiplyMatrices(T, multiplyMatrices(R, S));
}

// =============================================================================
// Geometry Merging
// =============================================================================

/**
 * Merge multiple geometries into one
 * @param {GeometryData[]} geometries - Array of geometries to merge
 * @returns {GeometryData}
 */
export function mergeGeometries(geometries) {
  if (geometries.length === 0) {
    return { positions: new Float32Array(0), normals: null, indices: null };
  }
  
  if (geometries.length === 1) {
    return geometries[0];
  }
  
  // Calculate total sizes
  let totalPositions = 0;
  let totalNormals = 0;
  let totalIndices = 0;
  let hasNormals = true;
  let hasIndices = true;
  
  for (const geo of geometries) {
    totalPositions += geo.positions.length;
    if (geo.normals) {
      totalNormals += geo.normals.length;
    } else {
      hasNormals = false;
    }
    if (geo.indices) {
      totalIndices += geo.indices.length;
    } else {
      hasIndices = false;
    }
  }
  
  // Allocate output arrays
  const positions = new Float32Array(totalPositions);
  const normals = hasNormals ? new Float32Array(totalNormals) : null;
  const indices = hasIndices ? new Uint32Array(totalIndices) : null;
  
  // Copy data
  let posOffset = 0;
  let normalOffset = 0;
  let indexOffset = 0;
  let vertexOffset = 0;
  
  for (const geo of geometries) {
    // Copy positions
    positions.set(geo.positions, posOffset);
    posOffset += geo.positions.length;
    
    // Copy normals
    if (hasNormals && geo.normals) {
      normals.set(geo.normals, normalOffset);
      normalOffset += geo.normals.length;
    }
    
    // Copy indices (with vertex offset)
    if (hasIndices && geo.indices) {
      for (let i = 0; i < geo.indices.length; i++) {
        indices[indexOffset + i] = geo.indices[i] + vertexOffset;
      }
      indexOffset += geo.indices.length;
    }
    
    // Update vertex offset for next geometry
    vertexOffset += geo.positions.length / 3;
  }
  
  return { positions, normals, indices };
}

// =============================================================================
// Geometry Modification
// =============================================================================

/**
 * Add noise/perturbation to vertex positions
 * @param {GeometryData} geo - Geometry to modify (mutated in place)
 * @param {object} options
 * @param {number} [options.amplitude=0.01] - Noise amplitude
 * @param {number} [options.frequency=1] - Noise frequency multiplier
 * @param {number} [options.seed=0] - Random seed
 * @returns {GeometryData}
 */
export function perturbVertices(geo, options = {}) {
  const amplitude = options.amplitude ?? 0.01;
  const frequency = options.frequency ?? 1;
  const seed = options.seed ?? 0;
  
  const positions = geo.positions;
  
  // Simple pseudo-random based on position
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    
    // Simple noise function (could be replaced with proper Perlin noise)
    const noise = pseudoNoise3D(x * frequency, y * frequency, z * frequency, seed);
    
    // Get normal direction (approximate from position for spherical shapes)
    const len = Math.sqrt(x * x + y * y + z * z);
    if (len > 0.001) {
      const nx = x / len;
      const ny = y / len;
      const nz = z / len;
      
      // Displace along normal
      positions[i]     += nx * noise * amplitude;
      positions[i + 1] += ny * noise * amplitude;
      positions[i + 2] += nz * noise * amplitude;
    }
  }
  
  // Recalculate normals would be needed for proper shading
  // For wireframe rendering, we can skip this
  
  return geo;
}

/**
 * Simple pseudo-random 3D noise function
 * @param {number} x 
 * @param {number} y 
 * @param {number} z 
 * @param {number} seed 
 * @returns {number} Value between -1 and 1
 */
function pseudoNoise3D(x, y, z, seed = 0) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 45.164 + seed) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;
}

/**
 * Create a tube/pipe along a path
 * @param {number[][]} path - Array of [x, y, z] points
 * @param {number} radius - Tube radius
 * @param {number} [segments=8] - Radial segments
 * @returns {GeometryData}
 */
export function createTubeAlongPath(path, radius, segments = 8) {
  if (path.length < 2) {
    return { positions: new Float32Array(0), normals: null, indices: null };
  }
  
  const positions = [];
  const normals = [];
  const indices = [];
  
  // Generate vertices along path
  for (let i = 0; i < path.length; i++) {
    const p = path[i];
    
    // Calculate tangent
    let tangent;
    if (i === 0) {
      tangent = normalize(subtract(path[1], path[0]));
    } else if (i === path.length - 1) {
      tangent = normalize(subtract(path[i], path[i - 1]));
    } else {
      tangent = normalize(subtract(path[i + 1], path[i - 1]));
    }
    
    // Calculate perpendicular vectors (using up vector trick)
    const up = Math.abs(tangent[1]) < 0.99 ? [0, 1, 0] : [1, 0, 0];
    const right = normalize(cross(tangent, up));
    const forward = normalize(cross(right, tangent));
    
    // Generate ring of vertices
    for (let j = 0; j < segments; j++) {
      const angle = (j / segments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      // Position on circle
      const nx = right[0] * cos + forward[0] * sin;
      const ny = right[1] * cos + forward[1] * sin;
      const nz = right[2] * cos + forward[2] * sin;
      
      positions.push(
        p[0] + nx * radius,
        p[1] + ny * radius,
        p[2] + nz * radius
      );
      
      normals.push(nx, ny, nz);
    }
  }
  
  // Generate indices
  for (let i = 0; i < path.length - 1; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * segments + j;
      const b = i * segments + (j + 1) % segments;
      const c = (i + 1) * segments + j;
      const d = (i + 1) * segments + (j + 1) % segments;
      
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }
  
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices),
  };
}

// =============================================================================
// Vector Utilities
// =============================================================================

function subtract(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function normalize(v) {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (len === 0) return [0, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

// =============================================================================
// Type Definitions (for documentation)
// =============================================================================

/**
 * @typedef {object} GeometryData
 * @property {Float32Array} positions - Vertex positions (x, y, z, ...)
 * @property {Float32Array|null} normals - Vertex normals (x, y, z, ...)
 * @property {Uint32Array|null} indices - Triangle indices
 */

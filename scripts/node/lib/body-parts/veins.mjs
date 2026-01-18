/**
 * Veins Part Generator
 * Creates a branched vascular network for the human body.
 * Uses recursive branching algorithm for realistic vessel paths.
 */

import {
  createTubeAlongPath,
  mergeGeometries,
} from '../geometry-builder.mjs';

// =============================================================================
// Configuration
// =============================================================================

// Vessel radius ranges
const RADIUS = {
  aorta: 0.018,
  major: 0.012,
  medium: 0.008,
  small: 0.005,
  capillary: 0.003,
};

// Tube segment quality (higher = smoother tubes)
const TUBE_SEGMENTS = 6;

// Path smoothness (points per unit length)
const PATH_DETAIL = 12;

// =============================================================================
// Path Generation Utilities
// =============================================================================

/**
 * Linear interpolation between two points
 */
function lerp3(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/**
 * Add two vectors
 */
function add3(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/**
 * Scale a vector
 */
function scale3(v, s) {
  return [v[0] * s, v[1] * s, v[2] * s];
}

/**
 * Create a smooth curved path between two points with control offset
 * @param {number[]} start - Start point [x, y, z]
 * @param {number[]} end - End point [x, y, z]
 * @param {number[]} [controlOffset] - Offset for control point
 * @param {number} [numPoints] - Number of points in path
 * @returns {number[][]} Array of points
 */
function createCurvedPath(start, end, controlOffset = [0, 0, 0], numPoints = 8) {
  const mid = lerp3(start, end, 0.5);
  const control = add3(mid, controlOffset);
  
  const path = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Quadratic Bezier
    const p1 = lerp3(start, control, t);
    const p2 = lerp3(control, end, t);
    path.push(lerp3(p1, p2, t));
  }
  return path;
}

/**
 * Create a straight path with slight organic wobble
 * @param {number[]} start 
 * @param {number[]} end 
 * @param {number} [numPoints]
 * @param {number} [wobble] - Amount of random displacement
 */
function createWobblyPath(start, end, numPoints = 6, wobble = 0.005) {
  const path = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const p = lerp3(start, end, t);
    
    // Add slight wobble (not at endpoints)
    if (i > 0 && i < numPoints) {
      const w = wobble * (0.5 + Math.random() * 0.5);
      p[0] += (Math.random() - 0.5) * w;
      p[1] += (Math.random() - 0.5) * w;
      p[2] += (Math.random() - 0.5) * w;
    }
    
    path.push(p);
  }
  return path;
}

/**
 * Generate branching paths from a parent path
 * @param {number[]} origin - Branch origin point
 * @param {number[]} direction - General direction [dx, dy, dz]
 * @param {number} length - Total branch length
 * @param {number} depth - Recursion depth (0 = stop)
 * @param {number} spread - Angular spread for child branches
 * @returns {object[]} Array of { path, radius } objects
 */
function generateBranches(origin, direction, length, depth, spread = 0.4) {
  if (depth <= 0 || length < 0.02) {
    return [];
  }
  
  const branches = [];
  
  // Normalize direction
  const dirLen = Math.sqrt(direction[0]**2 + direction[1]**2 + direction[2]**2);
  const dir = dirLen > 0 ? scale3(direction, 1/dirLen) : [0, -1, 0];
  
  // Calculate end point
  const end = add3(origin, scale3(dir, length));
  
  // Add some curve to the path
  const perpX = dir[2] * 0.3 - dir[1] * 0.1;
  const perpZ = dir[0] * 0.3 - dir[1] * 0.1;
  const controlOffset = [
    perpX * (Math.random() - 0.5) * 0.1,
    (Math.random() - 0.5) * 0.05,
    perpZ * (Math.random() - 0.5) * 0.1,
  ];
  
  const path = createCurvedPath(origin, end, controlOffset, Math.max(4, Math.floor(length * PATH_DETAIL)));
  
  // Determine radius based on depth
  let radius;
  if (depth >= 4) radius = RADIUS.major;
  else if (depth >= 3) radius = RADIUS.medium;
  else if (depth >= 2) radius = RADIUS.small;
  else radius = RADIUS.capillary;
  
  branches.push({ path, radius });
  
  // Generate child branches
  if (depth > 1) {
    const numChildren = depth > 2 ? 2 : 1;
    const childLength = length * (0.6 + Math.random() * 0.2);
    
    for (let i = 0; i < numChildren; i++) {
      // Vary direction for each child
      const angle = (i - (numChildren - 1) / 2) * spread + (Math.random() - 0.5) * 0.2;
      const childDir = [
        dir[0] + Math.sin(angle) * (1 - Math.abs(dir[1])),
        dir[1] * 0.8,
        dir[2] + Math.cos(angle) * 0.3 * (Math.random() - 0.5),
      ];
      
      // Start child branch from somewhere along the parent
      const branchPoint = lerp3(origin, end, 0.5 + Math.random() * 0.4);
      
      const childBranches = generateBranches(
        branchPoint,
        childDir,
        childLength,
        depth - 1,
        spread * 0.8
      );
      
      branches.push(...childBranches);
    }
  }
  
  return branches;
}

// =============================================================================
// Main Vessel Systems
// =============================================================================

/**
 * Create the main aorta and heart-connected vessels
 */
function createAorta() {
  const vessels = [];
  
  // Ascending aorta (from heart upward)
  const aortaStart = [0, 0.62, 0.04];  // Heart position
  const aortaArch = [0, 0.78, 0.02];   // Top of arch
  const aortaDesc = [0, 0.40, 0.02];   // Descending
  
  // Ascending aorta
  const ascending = createCurvedPath(
    aortaStart,
    aortaArch,
    [0.02, 0.05, 0.02],
    10
  );
  vessels.push({ path: ascending, radius: RADIUS.aorta });
  
  // Aortic arch (curves back)
  const arch = createCurvedPath(
    aortaArch,
    [0, 0.75, -0.01],
    [0, 0.02, 0.02],
    6
  );
  vessels.push({ path: arch, radius: RADIUS.aorta });
  
  // Descending aorta
  const descending = createCurvedPath(
    [0, 0.75, -0.01],
    aortaDesc,
    [0, 0, -0.02],
    12
  );
  vessels.push({ path: descending, radius: RADIUS.aorta });
  
  // Continue down to pelvis
  const abdominal = createWobblyPath(
    aortaDesc,
    [0, 0.25, 0.01],
    8,
    0.003
  );
  vessels.push({ path: abdominal, radius: RADIUS.major });
  
  return vessels;
}

/**
 * Create carotid arteries (neck to head)
 */
function createCarotids() {
  const vessels = [];
  
  // Left carotid
  const leftPath = createCurvedPath(
    [-0.03, 0.78, 0.01],
    [-0.04, 0.95, 0.01],
    [-0.01, 0.03, 0.01],
    8
  );
  vessels.push({ path: leftPath, radius: RADIUS.major });
  
  // Right carotid
  const rightPath = createCurvedPath(
    [0.03, 0.78, 0.01],
    [0.04, 0.95, 0.01],
    [0.01, 0.03, 0.01],
    8
  );
  vessels.push({ path: rightPath, radius: RADIUS.major });
  
  // Add branches into the head
  const leftHead = generateBranches([-0.04, 0.95, 0.01], [-0.2, 0.5, 0.1], 0.08, 2, 0.5);
  const rightHead = generateBranches([0.04, 0.95, 0.01], [0.2, 0.5, 0.1], 0.08, 2, 0.5);
  
  vessels.push(...leftHead, ...rightHead);
  
  return vessels;
}

/**
 * Create subclavian arteries and arm vessels
 * @param {string} pose - 'open' or 'closed'
 */
function createArmVessels(pose = 'open') {
  const vessels = [];
  
  const isOpen = pose === 'open';
  
  // Arm positions depend on pose
  // Open pose: arms horizontal (T-pose)
  // Closed pose: arms down
  
  for (const side of ['left', 'right']) {
    const xSign = side === 'left' ? -1 : 1;
    
    // Subclavian origin
    const subclavianStart = [xSign * 0.05, 0.76, 0.01];
    
    // Shoulder position
    const shoulderPos = [xSign * 0.32, isOpen ? 0.75 : 0.65, 0];
    
    // Subclavian to shoulder
    const subclavian = createCurvedPath(
      subclavianStart,
      shoulderPos,
      [xSign * 0.05, 0.02, 0.02],
      10
    );
    vessels.push({ path: subclavian, radius: RADIUS.major });
    
    // Brachial (upper arm)
    let elbowPos, wristPos;
    if (isOpen) {
      // T-pose: arms horizontal
      elbowPos = [xSign * 0.55, 0.73, 0];
      wristPos = [xSign * 0.78, 0.71, 0];
    } else {
      // Closed: arms down with slight bend
      elbowPos = [xSign * 0.30, 0.48, 0.02];
      wristPos = [xSign * 0.28, 0.25, 0.03];
    }
    
    const brachial = createCurvedPath(
      shoulderPos,
      elbowPos,
      [xSign * 0.02, isOpen ? 0.01 : -0.05, 0.01],
      10
    );
    vessels.push({ path: brachial, radius: RADIUS.medium });
    
    // Radial/Ulnar (forearm)
    const radial = createCurvedPath(
      elbowPos,
      wristPos,
      [xSign * 0.01, isOpen ? -0.01 : -0.03, 0.01],
      10
    );
    vessels.push({ path: radial, radius: RADIUS.small });
    
    // Hand vessels (branching)
    let handEnd;
    if (isOpen) {
      handEnd = [xSign * 0.85, 0.70, 0];
    } else {
      handEnd = [xSign * 0.26, 0.18, 0.04];
    }
    
    const handBranches = generateBranches(
      wristPos,
      [xSign * 0.5, isOpen ? -0.1 : -0.8, 0.1],
      0.06,
      2,
      0.6
    );
    vessels.push(...handBranches);
  }
  
  return vessels;
}

/**
 * Create femoral arteries and leg vessels
 */
function createLegVessels() {
  const vessels = [];
  
  for (const side of ['left', 'right']) {
    const xSign = side === 'left' ? -1 : 1;
    const xOffset = xSign * 0.08;
    
    // Iliac (from aorta split)
    const iliacStart = [0, 0.28, 0.01];
    const iliacEnd = [xOffset, 0.22, 0.02];
    
    const iliac = createCurvedPath(
      iliacStart,
      iliacEnd,
      [xSign * 0.02, -0.01, 0.01],
      6
    );
    vessels.push({ path: iliac, radius: RADIUS.major });
    
    // Femoral (thigh)
    const femoralMid = [xSign * 0.12, 0.0, 0.02];
    const kneePos = [xSign * 0.13, -0.15, 0.01];
    
    const femoralUpper = createCurvedPath(
      iliacEnd,
      femoralMid,
      [xSign * 0.02, -0.03, 0.02],
      10
    );
    vessels.push({ path: femoralUpper, radius: RADIUS.major });
    
    const femoralLower = createCurvedPath(
      femoralMid,
      kneePos,
      [xSign * 0.01, -0.02, 0.01],
      10
    );
    vessels.push({ path: femoralLower, radius: RADIUS.medium });
    
    // Popliteal (behind knee)
    const anklePos = [xSign * 0.13, -0.50, 0.02];
    
    const tibial = createCurvedPath(
      kneePos,
      anklePos,
      [xSign * 0.01, -0.05, -0.01],
      12
    );
    vessels.push({ path: tibial, radius: RADIUS.small });
    
    // Foot vessels
    const footBranches = generateBranches(
      anklePos,
      [xSign * 0.2, -0.3, 0.5],
      0.08,
      2,
      0.5
    );
    vessels.push(...footBranches);
  }
  
  return vessels;
}

/**
 * Create torso vessels (intercostal, etc.)
 */
function createTorsoVessels() {
  const vessels = [];
  
  // Intercostal arteries (ribs)
  for (let i = 0; i < 6; i++) {
    const y = 0.70 - i * 0.05;
    
    // Left side
    const leftStart = [0, y, 0];
    const leftEnd = [-0.14, y + 0.01, 0.03];
    vessels.push({
      path: createCurvedPath(leftStart, leftEnd, [0, 0.01, 0.02], 6),
      radius: RADIUS.small,
    });
    
    // Right side
    const rightStart = [0, y, 0];
    const rightEnd = [0.14, y + 0.01, 0.03];
    vessels.push({
      path: createCurvedPath(rightStart, rightEnd, [0, 0.01, 0.02], 6),
      radius: RADIUS.small,
    });
  }
  
  return vessels;
}

// =============================================================================
// Main Export
// =============================================================================

/**
 * Create complete vascular network geometry
 * @param {string} pose - 'open' or 'closed'
 * @returns {GeometryData}
 */
export function createVeins(pose = 'open') {
  // Collect all vessel definitions
  const allVessels = [
    ...createAorta(),
    ...createCarotids(),
    ...createArmVessels(pose),
    ...createLegVessels(),
    ...createTorsoVessels(),
  ];
  
  // Convert paths to tube geometries
  const geometries = [];
  
  for (const { path, radius } of allVessels) {
    if (path.length >= 2) {
      const tube = createTubeAlongPath(path, radius, TUBE_SEGMENTS);
      if (tube.positions.length > 0) {
        geometries.push(tube);
      }
    }
  }
  
  // Merge all tubes
  const merged = mergeGeometries(geometries);
  
  // Translate to match body (feet at y=0, need to offset based on body coords)
  // The body has its lowest point moved to y=0, veins are in body-local coords
  // We need to match the body offset (~0.07 based on foot position)
  const yOffset = 0.07;
  for (let i = 1; i < merged.positions.length; i += 3) {
    merged.positions[i] += yOffset;
  }
  
  return merged;
}

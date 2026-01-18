/**
 * Heart Part Generator
 * Creates a detailed anatomical heart geometry.
 * Uses parametric surfaces for the main chambers and vessels.
 */

import {
  createSphere,
  createCylinder,
  createTubeAlongPath,
  mergeGeometries,
  transformGeometry,
  composeMatrix,
  perturbVertices,
} from '../geometry-builder.mjs';

// =============================================================================
// Configuration
// =============================================================================

const HEART_CONFIG = {
  // Position in chest (relative to body coords)
  // Heart is slightly left of center
  position: [-0.02, 0.65, 0.05],
  
  // Overall scale
  scale: 1.0,
  
  // Main heart body parameters
  leftVentricle: {
    radius: 0.045,
    widthSegments: 24,
    heightSegments: 16,
    position: [-0.015, 0, 0.01],
    scale: [0.9, 1.1, 0.85],
  },
  
  rightVentricle: {
    radius: 0.04,
    widthSegments: 20,
    heightSegments: 14,
    position: [0.02, -0.01, 0.015],
    scale: [0.85, 0.95, 0.8],
  },
  
  leftAtrium: {
    radius: 0.032,
    widthSegments: 18,
    heightSegments: 12,
    position: [-0.02, 0.04, -0.01],
    scale: [0.9, 0.8, 0.85],
  },
  
  rightAtrium: {
    radius: 0.03,
    widthSegments: 18,
    heightSegments: 12,
    position: [0.025, 0.035, 0],
    scale: [0.85, 0.75, 0.8],
  },
  
  // Major vessels
  aorta: {
    radius: 0.018,
    segments: 8,
    path: [
      [0, 0.04, 0],
      [-0.01, 0.06, 0.01],
      [-0.005, 0.08, 0.005],
      [0.01, 0.095, 0],
      [0.015, 0.10, -0.01],
    ],
  },
  
  pulmonaryArtery: {
    radius: 0.015,
    segments: 8,
    path: [
      [0.02, 0.03, 0.02],
      [0.015, 0.055, 0.025],
      [0.005, 0.07, 0.02],
      [-0.01, 0.075, 0.015],
    ],
  },
  
  superiorVenaCava: {
    radius: 0.014,
    segments: 6,
    path: [
      [0.03, 0.04, -0.01],
      [0.035, 0.07, -0.01],
      [0.03, 0.095, -0.005],
    ],
  },
  
  inferiorVenaCava: {
    radius: 0.014,
    segments: 6,
    path: [
      [0.025, -0.02, 0],
      [0.03, -0.05, 0.005],
      [0.025, -0.07, 0.01],
    ],
  },
  
  pulmonaryVeins: {
    radius: 0.01,
    segments: 6,
    // Multiple small paths
    paths: [
      [[-0.025, 0.04, -0.015], [-0.04, 0.05, -0.02], [-0.055, 0.055, -0.025]],
      [[-0.02, 0.045, -0.02], [-0.035, 0.06, -0.03], [-0.05, 0.07, -0.035]],
    ],
  },
  
  // Surface detail
  perturbation: {
    amplitude: 0.002,
    frequency: 5,
    seed: 456,
  },
};

// =============================================================================
// Heart Creation Functions
// =============================================================================

/**
 * Create a heart chamber (ventricle or atrium)
 */
function createChamber(config) {
  const chamber = createSphere({
    radius: config.radius,
    widthSegments: config.widthSegments,
    heightSegments: config.heightSegments,
  });
  
  // Apply slight perturbation for organic look
  perturbVertices(chamber, {
    amplitude: HEART_CONFIG.perturbation.amplitude,
    frequency: HEART_CONFIG.perturbation.frequency,
    seed: HEART_CONFIG.perturbation.seed + Math.random() * 100,
  });
  
  // Transform
  transformGeometry(chamber, composeMatrix({
    position: config.position,
    scale: config.scale,
  }));
  
  return chamber;
}

/**
 * Create a blood vessel from path
 */
function createVessel(config) {
  return createTubeAlongPath(config.path, config.radius, config.segments);
}

/**
 * Create the apex (pointed bottom) of the heart
 */
function createApex() {
  // Use a stretched sphere for the apex
  const apex = createSphere({
    radius: 0.025,
    widthSegments: 16,
    heightSegments: 12,
  });
  
  // Stretch and position
  transformGeometry(apex, composeMatrix({
    position: [0, -0.045, 0.02],
    scale: [0.8, 1.3, 0.75],
    rotation: [15, 0, 10],  // Tilt toward left
  }));
  
  return apex;
}

/**
 * Create connecting tissue between chambers
 */
function createConnectiveTissue() {
  const parts = [];
  
  // Central body connecting all chambers
  const central = createSphere({
    radius: 0.035,
    widthSegments: 16,
    heightSegments: 12,
  });
  
  transformGeometry(central, composeMatrix({
    position: [0.005, 0.01, 0.01],
    scale: [1.0, 0.9, 0.85],
  }));
  
  parts.push(central);
  
  // Interventricular septum (wall between ventricles)
  const septum = createCylinder({
    height: 0.06,
    radius: 0.025,
    segments: 12,
    capTop: false,
    capBottom: false,
  });
  
  transformGeometry(septum, composeMatrix({
    position: [0, -0.01, 0.01],
    rotation: [0, 0, 5],
    scale: [0.3, 1.0, 0.8],
  }));
  
  parts.push(septum);
  
  return mergeGeometries(parts);
}

/**
 * Create coronary arteries (vessels on heart surface)
 */
function createCoronaryArteries() {
  const vessels = [];
  
  // Left coronary artery
  const leftCoronary = [
    [0, 0.03, 0.04],
    [-0.02, 0.02, 0.045],
    [-0.035, 0, 0.04],
    [-0.04, -0.025, 0.03],
    [-0.035, -0.04, 0.025],
  ];
  
  vessels.push(createTubeAlongPath(leftCoronary, 0.004, 6));
  
  // Left circumflex
  const circumflex = [
    [-0.02, 0.02, 0.045],
    [-0.035, 0.015, 0.035],
    [-0.04, 0.005, 0.02],
    [-0.035, -0.01, 0.005],
  ];
  
  vessels.push(createTubeAlongPath(circumflex, 0.003, 6));
  
  // Right coronary artery
  const rightCoronary = [
    [0.02, 0.025, 0.035],
    [0.035, 0.01, 0.03],
    [0.04, -0.01, 0.02],
    [0.035, -0.03, 0.01],
    [0.02, -0.04, 0.015],
  ];
  
  vessels.push(createTubeAlongPath(rightCoronary, 0.004, 6));
  
  // Posterior descending
  const posterior = [
    [0.02, -0.04, 0.015],
    [0.005, -0.045, 0.01],
    [-0.01, -0.04, 0.015],
  ];
  
  vessels.push(createTubeAlongPath(posterior, 0.003, 6));
  
  return mergeGeometries(vessels);
}

// =============================================================================
// Main Export
// =============================================================================

/**
 * Create complete heart geometry
 * @param {string} _pose - Pose (unused for heart, but kept for API consistency)
 * @returns {GeometryData}
 */
export function createHeart(_pose = 'open') {
  const parts = [];
  
  // Main chambers
  parts.push(createChamber(HEART_CONFIG.leftVentricle));
  parts.push(createChamber(HEART_CONFIG.rightVentricle));
  parts.push(createChamber(HEART_CONFIG.leftAtrium));
  parts.push(createChamber(HEART_CONFIG.rightAtrium));
  
  // Apex
  parts.push(createApex());
  
  // Connective tissue
  parts.push(createConnectiveTissue());
  
  // Major vessels
  parts.push(createVessel(HEART_CONFIG.aorta));
  parts.push(createVessel(HEART_CONFIG.pulmonaryArtery));
  parts.push(createVessel(HEART_CONFIG.superiorVenaCava));
  parts.push(createVessel(HEART_CONFIG.inferiorVenaCava));
  
  // Pulmonary veins
  for (const path of HEART_CONFIG.pulmonaryVeins.paths) {
    parts.push(createTubeAlongPath(
      path,
      HEART_CONFIG.pulmonaryVeins.radius,
      HEART_CONFIG.pulmonaryVeins.segments
    ));
  }
  
  // Coronary arteries
  parts.push(createCoronaryArteries());
  
  // Merge all parts
  const heart = mergeGeometries(parts);
  
  // Position in chest
  const pos = HEART_CONFIG.position;
  const scale = HEART_CONFIG.scale;
  
  for (let i = 0; i < heart.positions.length; i += 3) {
    heart.positions[i] = heart.positions[i] * scale + pos[0];
    heart.positions[i + 1] = heart.positions[i + 1] * scale + pos[1];
    heart.positions[i + 2] = heart.positions[i + 2] * scale + pos[2];
  }
  
  // Apply body offset (to match body.mjs which moves feet to y=0)
  const yOffset = 0.07;
  for (let i = 1; i < heart.positions.length; i += 3) {
    heart.positions[i] += yOffset;
  }
  
  return heart;
}

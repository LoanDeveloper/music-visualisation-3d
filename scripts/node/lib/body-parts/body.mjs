/**
 * Body Part Generator
 * Creates a stylized human body outline with articulated limbs.
 * Designed for wireframe/edge rendering.
 */

import {
  createCapsule,
  createSphere,
  createEllipsoid,
  mergeGeometries,
  transformGeometry,
  composeMatrix,
} from '../geometry-builder.mjs';

// =============================================================================
// Body Configuration
// =============================================================================

// Human proportions (normalized to ~1.8 units tall)
const BODY_CONFIG = {
  // Torso
  torso: {
    height: 0.45,
    radius: 0.14,
    segments: 24,
    roundSegments: 12,
    position: [0, 0.55, 0],
  },
  
  // Head
  head: {
    radius: 0.1,
    widthSegments: 24,
    heightSegments: 16,
    position: [0, 1.0, 0],
  },
  
  // Neck
  neck: {
    height: 0.08,
    radius: 0.04,
    segments: 12,
    position: [0, 0.85, 0],
  },
  
  // Shoulders (connection points)
  shoulderWidth: 0.32,
  shoulderY: 0.75,
  
  // Upper arms
  upperArm: {
    height: 0.28,
    radius: 0.035,
    segments: 12,
    roundSegments: 8,
  },
  
  // Lower arms (forearms)
  lowerArm: {
    height: 0.26,
    radius: 0.028,
    segments: 12,
    roundSegments: 8,
  },
  
  // Hands
  hand: {
    radius: 0.04,
    rx: 1.0,
    ry: 0.6,
    rz: 0.3,
    segments: 16,
  },
  
  // Hips
  hipWidth: 0.15,
  hipY: 0.35,
  
  // Upper legs (thighs)
  upperLeg: {
    height: 0.42,
    radius: 0.06,
    segments: 16,
    roundSegments: 10,
  },
  
  // Lower legs
  lowerLeg: {
    height: 0.38,
    radius: 0.045,
    segments: 14,
    roundSegments: 8,
  },
  
  // Feet
  foot: {
    height: 0.08,
    radius: 0.05,
    rx: 1.8,
    ry: 0.5,
    rz: 1.0,
    segments: 12,
  },
  
  // Pelvis/hip area
  pelvis: {
    radius: 0.12,
    rx: 1.3,
    ry: 0.5,
    rz: 0.9,
    segments: 20,
    position: [0, 0.38, 0],
  },
  
  // Chest area
  chest: {
    radius: 0.16,
    rx: 1.0,
    ry: 0.6,
    rz: 0.7,
    segments: 24,
    position: [0, 0.65, 0.02],
  },
};

// Pose definitions
const POSES = {
  open: {
    // T-pose: arms horizontal
    leftArm: {
      upperRotation: [0, 0, -85],  // Almost horizontal
      lowerRotation: [0, 0, -5],   // Slight bend
    },
    rightArm: {
      upperRotation: [0, 0, 85],
      lowerRotation: [0, 0, 5],
    },
    leftLeg: {
      upperRotation: [0, 0, -5],
      lowerRotation: [0, 0, 0],
    },
    rightLeg: {
      upperRotation: [0, 0, 5],
      lowerRotation: [0, 0, 0],
    },
  },
  closed: {
    // Relaxed pose: arms down
    leftArm: {
      upperRotation: [0, 0, -15],  // Slight angle
      lowerRotation: [15, 0, -10], // Slight bend forward
    },
    rightArm: {
      upperRotation: [0, 0, 15],
      lowerRotation: [15, 0, 10],
    },
    leftLeg: {
      upperRotation: [0, 0, -3],
      lowerRotation: [0, 0, 0],
    },
    rightLeg: {
      upperRotation: [0, 0, 3],
      lowerRotation: [0, 0, 0],
    },
  },
};

// =============================================================================
// Body Creation Functions
// =============================================================================

/**
 * Create the main torso
 */
function createTorso() {
  const cfg = BODY_CONFIG.torso;
  const geo = createCapsule({
    height: cfg.height,
    radius: cfg.radius,
    segments: cfg.segments,
    roundSegments: cfg.roundSegments,
  });
  
  return transformGeometry(geo, composeMatrix({
    position: cfg.position,
  }));
}

/**
 * Create the chest area (adds volume)
 */
function createChest() {
  const cfg = BODY_CONFIG.chest;
  const geo = createEllipsoid({
    radius: cfg.radius,
    rx: cfg.rx,
    ry: cfg.ry,
    rz: cfg.rz,
    segments: cfg.segments,
  });
  
  return transformGeometry(geo, composeMatrix({
    position: cfg.position,
  }));
}

/**
 * Create the pelvis/hip area
 */
function createPelvis() {
  const cfg = BODY_CONFIG.pelvis;
  const geo = createEllipsoid({
    radius: cfg.radius,
    rx: cfg.rx,
    ry: cfg.ry,
    rz: cfg.rz,
    segments: cfg.segments,
  });
  
  return transformGeometry(geo, composeMatrix({
    position: cfg.position,
  }));
}

/**
 * Create the head
 */
function createHead() {
  const cfg = BODY_CONFIG.head;
  const geo = createSphere({
    radius: cfg.radius,
    widthSegments: cfg.widthSegments,
    heightSegments: cfg.heightSegments,
  });
  
  return transformGeometry(geo, composeMatrix({
    position: cfg.position,
  }));
}

/**
 * Create the neck
 */
function createNeck() {
  const cfg = BODY_CONFIG.neck;
  const geo = createCapsule({
    height: cfg.height,
    radius: cfg.radius,
    segments: cfg.segments,
  });
  
  return transformGeometry(geo, composeMatrix({
    position: cfg.position,
  }));
}

/**
 * Create an arm (upper + lower + hand)
 * @param {string} side - 'left' or 'right'
 * @param {object} poseData - Pose configuration for this arm
 */
function createArm(side, poseData) {
  const isLeft = side === 'left';
  const xSign = isLeft ? -1 : 1;
  
  const parts = [];
  
  // Starting position at shoulder
  const shoulderX = xSign * BODY_CONFIG.shoulderWidth;
  const shoulderY = BODY_CONFIG.shoulderY;
  
  // Upper arm
  const upperCfg = BODY_CONFIG.upperArm;
  const upperArm = createCapsule({
    height: upperCfg.height,
    radius: upperCfg.radius,
    segments: upperCfg.segments,
    roundSegments: upperCfg.roundSegments,
  });
  
  // Calculate upper arm end position based on rotation
  const upperRotation = poseData.upperRotation;
  const upperAngleRad = upperRotation[2] * Math.PI / 180;
  const upperEndX = shoulderX + Math.sin(upperAngleRad) * upperCfg.height;
  const upperEndY = shoulderY - Math.cos(upperAngleRad) * upperCfg.height;
  
  // Position upper arm (centered on its length)
  const upperMidX = shoulderX + Math.sin(upperAngleRad) * (upperCfg.height / 2);
  const upperMidY = shoulderY - Math.cos(upperAngleRad) * (upperCfg.height / 2);
  
  transformGeometry(upperArm, composeMatrix({
    position: [upperMidX, upperMidY, 0],
    rotation: upperRotation,
  }));
  parts.push(upperArm);
  
  // Lower arm
  const lowerCfg = BODY_CONFIG.lowerArm;
  const lowerArm = createCapsule({
    height: lowerCfg.height,
    radius: lowerCfg.radius,
    segments: lowerCfg.segments,
    roundSegments: lowerCfg.roundSegments,
  });
  
  // Combined rotation for lower arm
  const lowerRotation = [
    upperRotation[0] + poseData.lowerRotation[0],
    upperRotation[1] + poseData.lowerRotation[1],
    upperRotation[2] + poseData.lowerRotation[2],
  ];
  const lowerAngleRad = lowerRotation[2] * Math.PI / 180;
  
  // Position lower arm from upper arm end
  const lowerMidX = upperEndX + Math.sin(lowerAngleRad) * (lowerCfg.height / 2);
  const lowerMidY = upperEndY - Math.cos(lowerAngleRad) * (lowerCfg.height / 2);
  const lowerEndX = upperEndX + Math.sin(lowerAngleRad) * lowerCfg.height;
  const lowerEndY = upperEndY - Math.cos(lowerAngleRad) * lowerCfg.height;
  
  transformGeometry(lowerArm, composeMatrix({
    position: [lowerMidX, lowerMidY, 0],
    rotation: lowerRotation,
  }));
  parts.push(lowerArm);
  
  // Hand
  const handCfg = BODY_CONFIG.hand;
  const hand = createEllipsoid({
    radius: handCfg.radius,
    rx: handCfg.rx,
    ry: handCfg.ry,
    rz: handCfg.rz,
    segments: handCfg.segments,
  });
  
  transformGeometry(hand, composeMatrix({
    position: [lowerEndX, lowerEndY, 0],
    rotation: lowerRotation,
  }));
  parts.push(hand);
  
  return mergeGeometries(parts);
}

/**
 * Create a leg (upper + lower + foot)
 * @param {string} side - 'left' or 'right'
 * @param {object} poseData - Pose configuration for this leg
 */
function createLeg(side, poseData) {
  const isLeft = side === 'left';
  const xSign = isLeft ? -1 : 1;
  
  const parts = [];
  
  // Starting position at hip
  const hipX = xSign * BODY_CONFIG.hipWidth;
  const hipY = BODY_CONFIG.hipY;
  
  // Upper leg
  const upperCfg = BODY_CONFIG.upperLeg;
  const upperLeg = createCapsule({
    height: upperCfg.height,
    radius: upperCfg.radius,
    segments: upperCfg.segments,
    roundSegments: upperCfg.roundSegments,
  });
  
  const upperRotation = poseData.upperRotation;
  const upperAngleRad = upperRotation[2] * Math.PI / 180;
  
  // Position upper leg
  const upperMidX = hipX + Math.sin(upperAngleRad) * (upperCfg.height / 2);
  const upperMidY = hipY - Math.cos(Math.abs(upperAngleRad)) * (upperCfg.height / 2) - upperCfg.height / 2;
  const upperEndX = hipX + Math.sin(upperAngleRad) * upperCfg.height;
  const upperEndY = hipY - upperCfg.height;
  
  transformGeometry(upperLeg, composeMatrix({
    position: [upperMidX, upperMidY + upperCfg.height / 2, 0],
    rotation: upperRotation,
  }));
  parts.push(upperLeg);
  
  // Lower leg
  const lowerCfg = BODY_CONFIG.lowerLeg;
  const lowerLeg = createCapsule({
    height: lowerCfg.height,
    radius: lowerCfg.radius,
    segments: lowerCfg.segments,
    roundSegments: lowerCfg.roundSegments,
  });
  
  const lowerRotation = [
    upperRotation[0] + poseData.lowerRotation[0],
    upperRotation[1] + poseData.lowerRotation[1],
    upperRotation[2] + poseData.lowerRotation[2],
  ];
  
  // Position lower leg
  const lowerMidY = upperEndY - lowerCfg.height / 2;
  const lowerEndY = upperEndY - lowerCfg.height;
  
  transformGeometry(lowerLeg, composeMatrix({
    position: [upperEndX, lowerMidY, 0],
    rotation: lowerRotation,
  }));
  parts.push(lowerLeg);
  
  // Foot
  const footCfg = BODY_CONFIG.foot;
  const foot = createEllipsoid({
    radius: footCfg.radius,
    rx: footCfg.rx,
    ry: footCfg.ry,
    rz: footCfg.rz,
    segments: footCfg.segments,
  });
  
  transformGeometry(foot, composeMatrix({
    position: [upperEndX, lowerEndY - footCfg.radius * 0.3, footCfg.radius * 0.5],
    rotation: [0, 0, 0],
  }));
  parts.push(foot);
  
  return mergeGeometries(parts);
}

// =============================================================================
// Main Export
// =============================================================================

/**
 * Create a complete human body geometry
 * @param {string} pose - Pose name ('open' or 'closed')
 * @returns {GeometryData}
 */
export function createBody(pose = 'open') {
  const poseConfig = POSES[pose] || POSES.open;
  
  const parts = [];
  
  // Core body parts
  parts.push(createTorso());
  parts.push(createChest());
  parts.push(createPelvis());
  parts.push(createHead());
  parts.push(createNeck());
  
  // Arms
  parts.push(createArm('left', poseConfig.leftArm));
  parts.push(createArm('right', poseConfig.rightArm));
  
  // Legs
  parts.push(createLeg('left', poseConfig.leftLeg));
  parts.push(createLeg('right', poseConfig.rightLeg));
  
  // Merge all parts
  const body = mergeGeometries(parts);
  
  // Center at origin (feet at y=0)
  // Find min Y and translate
  let minY = Infinity;
  for (let i = 1; i < body.positions.length; i += 3) {
    if (body.positions[i] < minY) {
      minY = body.positions[i];
    }
  }
  
  // Translate so feet are at y=0
  for (let i = 1; i < body.positions.length; i += 3) {
    body.positions[i] -= minY;
  }
  
  return body;
}

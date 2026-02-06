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
import {
  getBodyRigPoseData,
  buildBodyRigJoints,
} from '../body-rig.mjs';

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

function midpoint3(a, b) {
  return [
    (a[0] + b[0]) * 0.5,
    (a[1] + b[1]) * 0.5,
    (a[2] + b[2]) * 0.5,
  ];
}

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
function createChest(joints) {
  const cfg = BODY_CONFIG.chest;
  const geo = createEllipsoid({
    radius: cfg.radius,
    rx: cfg.rx,
    ry: cfg.ry,
    rz: cfg.rz,
    segments: cfg.segments,
  });
  
  return transformGeometry(geo, composeMatrix({
    position: joints.chest,
  }));
}

/**
 * Create the pelvis/hip area
 */
function createPelvis(joints) {
  const cfg = BODY_CONFIG.pelvis;
  const geo = createEllipsoid({
    radius: cfg.radius,
    rx: cfg.rx,
    ry: cfg.ry,
    rz: cfg.rz,
    segments: cfg.segments,
  });
  
  return transformGeometry(geo, composeMatrix({
    position: joints.pelvis,
  }));
}

/**
 * Create the head
 */
function createHead(joints) {
  const cfg = BODY_CONFIG.head;
  const geo = createSphere({
    radius: cfg.radius,
    widthSegments: cfg.widthSegments,
    heightSegments: cfg.heightSegments,
  });
  
  return transformGeometry(geo, composeMatrix({
    position: joints.head,
  }));
}

/**
 * Create the neck
 */
function createNeck(joints) {
  const cfg = BODY_CONFIG.neck;
  const geo = createCapsule({
    height: cfg.height,
    radius: cfg.radius,
    segments: cfg.segments,
  });
  
  return transformGeometry(geo, composeMatrix({
    position: joints.neck,
  }));
}

/**
 * Create an arm (upper + lower + hand)
 * @param {string} side - 'left' or 'right'
 * @param {object} poseData - Pose configuration for this arm
 */
function createArm(side, poseData, joints) {
  const armPose = poseData[`${side}Arm`];
  const shoulderPos = joints.shoulder[side];
  const elbowPos = joints.elbow[side];
  const wristPos = joints.wrist[side];
  const handPos = joints.hand[side];
  
  const parts = [];
  
  // Upper arm
  const upperCfg = BODY_CONFIG.upperArm;
  const upperArm = createCapsule({
    height: upperCfg.height,
    radius: upperCfg.radius,
    segments: upperCfg.segments,
    roundSegments: upperCfg.roundSegments,
  });
  
  const upperRotation = armPose.upperRotation;
  const upperMid = midpoint3(shoulderPos, elbowPos);
  
  transformGeometry(upperArm, composeMatrix({
    position: upperMid,
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
    upperRotation[0] + armPose.lowerRotation[0],
    upperRotation[1] + armPose.lowerRotation[1],
    upperRotation[2] + armPose.lowerRotation[2],
  ];
  const lowerMid = midpoint3(elbowPos, wristPos);
  
  transformGeometry(lowerArm, composeMatrix({
    position: lowerMid,
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
    position: handPos,
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
function createLeg(side, poseData, joints) {
  const legPose = poseData[`${side}Leg`];
  const hipPos = joints.hip[side];
  const kneePos = joints.knee[side];
  const anklePos = joints.ankle[side];
  const footPos = joints.foot[side];
  
  const parts = [];
  
  // Upper leg
  const upperCfg = BODY_CONFIG.upperLeg;
  const upperLeg = createCapsule({
    height: upperCfg.height,
    radius: upperCfg.radius,
    segments: upperCfg.segments,
    roundSegments: upperCfg.roundSegments,
  });
  
  const upperRotation = legPose.upperRotation;
  const upperMid = midpoint3(hipPos, kneePos);
  
  transformGeometry(upperLeg, composeMatrix({
    position: upperMid,
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
    upperRotation[0] + legPose.lowerRotation[0],
    upperRotation[1] + legPose.lowerRotation[1],
    upperRotation[2] + legPose.lowerRotation[2],
  ];
  const lowerMid = midpoint3(kneePos, anklePos);
  
  transformGeometry(lowerLeg, composeMatrix({
    position: lowerMid,
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
    position: footPos,
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
  const poseConfig = getBodyRigPoseData(pose);
  const joints = buildBodyRigJoints(poseConfig, {
    footRadius: BODY_CONFIG.foot.radius,
  });
  
  const parts = [];
  
  // Core body parts
  parts.push(createTorso());
  parts.push(createChest(joints));
  parts.push(createPelvis(joints));
  parts.push(createHead(joints));
  parts.push(createNeck(joints));
  
  // Arms
  parts.push(createArm('left', poseConfig, joints));
  parts.push(createArm('right', poseConfig, joints));
  
  // Legs
  parts.push(createLeg('left', poseConfig, joints));
  parts.push(createLeg('right', poseConfig, joints));
  
  // Merge all parts
  const body = mergeGeometries(parts);

  // Keep the same local reference frame as Veins/Brain/Heart.
  // HumanLayer recenters the whole pose group at load time, so per-part
  // normalization here would desynchronize layer alignment.
  return body;
}

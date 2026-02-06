/**
 * Shared Human Rig
 *
 * Centralizes pose rotations and procedural joint solving so Body and Veins
 * generators use identical limb anchors.
 */

// Base rig anchors in generator local space (~1.8 units tall human).
const DEFAULT_RIG_CONFIG = {
  shoulderWidth: 0.32,
  shoulderY: 0.75,
  hipWidth: 0.15,
  hipY: 0.35,
  head: [0, 1.0, 0],
  neck: [0, 0.85, 0],
  chest: [0, 0.65, 0.02],
  pelvis: [0, 0.38, 0],
  upperArmLength: 0.28,
  lowerArmLength: 0.26,
  upperLegLength: 0.42,
  lowerLegLength: 0.38,
  footRadius: 0.05,
};

// Pose definitions shared by all procedural body parts.
export const BODY_RIG_POSES = {
  open: {
    leftArm: {
      upperRotation: [0, 0, -85],
      lowerRotation: [0, 0, -5],
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
    leftArm: {
      upperRotation: [0, 0, -15],
      lowerRotation: [15, 0, -10],
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

function pointAlongAngle(start, angleDeg, distance) {
  const a = angleDeg * Math.PI / 180;
  return [
    start[0] + Math.sin(a) * distance,
    start[1] - Math.cos(a) * distance,
    start[2],
  ];
}

function clone3(v) {
  return [v[0], v[1], v[2]];
}

/**
 * Resolve pose data from either a pose id ('open'/'closed') or an already
 * selected pose object.
 */
export function getBodyRigPoseData(pose = 'open') {
  if (typeof pose === 'string') {
    return BODY_RIG_POSES[pose] || BODY_RIG_POSES.open;
  }
  return pose || BODY_RIG_POSES.open;
}

/**
 * Build all major joints for a pose. This is the single source of truth for
 * limb anchors used by Body and Veins generators.
 */
export function buildBodyRigJoints(pose = 'open', configOverrides = {}) {
  const poseData = getBodyRigPoseData(pose);
  const cfg = { ...DEFAULT_RIG_CONFIG, ...configOverrides };

  const shoulder = { left: null, right: null };
  const elbow = { left: null, right: null };
  const wrist = { left: null, right: null };
  const hand = { left: null, right: null };

  const hip = { left: null, right: null };
  const knee = { left: null, right: null };
  const ankle = { left: null, right: null };
  const foot = { left: null, right: null };

  for (const side of ['left', 'right']) {
    const sign = side === 'left' ? -1 : 1;

    // Arm joints.
    shoulder[side] = [sign * cfg.shoulderWidth, cfg.shoulderY, 0];
    const armPose = poseData[`${side}Arm`];
    const upperArmAngle = armPose.upperRotation[2];
    const lowerArmAngle = upperArmAngle + armPose.lowerRotation[2];
    elbow[side] = pointAlongAngle(shoulder[side], upperArmAngle, cfg.upperArmLength);
    wrist[side] = pointAlongAngle(elbow[side], lowerArmAngle, cfg.lowerArmLength);
    hand[side] = clone3(wrist[side]);

    // Leg joints.
    hip[side] = [sign * cfg.hipWidth, cfg.hipY, 0];
    const legPose = poseData[`${side}Leg`];
    const upperLegAngle = legPose.upperRotation[2];
    knee[side] = [
      hip[side][0] + Math.sin(upperLegAngle * Math.PI / 180) * cfg.upperLegLength,
      hip[side][1] - cfg.upperLegLength,
      0,
    ];
    ankle[side] = [knee[side][0], knee[side][1] - cfg.lowerLegLength, 0];
    foot[side] = [
      knee[side][0],
      ankle[side][1] - cfg.footRadius * 0.3,
      cfg.footRadius * 0.5,
    ];
  }

  return {
    pose: poseData,
    head: clone3(cfg.head),
    neck: clone3(cfg.neck),
    chest: clone3(cfg.chest),
    pelvis: clone3(cfg.pelvis),
    shoulder,
    elbow,
    wrist,
    hand,
    hip,
    knee,
    ankle,
    foot,
  };
}


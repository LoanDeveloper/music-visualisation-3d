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

export const BODY_RIG_METADATA_VERSION = 2;

// Pose definitions shared by all procedural body parts.
export const BODY_RIG_POSES = {
  open: {
    leftArm: {
      upperRotation: [0, 0, -72],
      lowerRotation: [0, 0, 22],
    },
    rightArm: {
      upperRotation: [0, 0, 72],
      lowerRotation: [0, 0, -22],
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
      upperRotation: [4, 0, -20],
      lowerRotation: [18, 0, 22],
    },
    rightArm: {
      upperRotation: [4, 0, 20],
      lowerRotation: [18, 0, -22],
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

function length3(a, b) {
  const x = b[0] - a[0];
  const y = b[1] - a[1];
  const z = b[2] - a[2];
  return Math.sqrt(x * x + y * y + z * z);
}

function angle3(a, b, c) {
  const abx = a[0] - b[0];
  const aby = a[1] - b[1];
  const abz = a[2] - b[2];
  const cbx = c[0] - b[0];
  const cby = c[1] - b[1];
  const cbz = c[2] - b[2];

  const dot = abx * cbx + aby * cby + abz * cbz;
  const lenAB = Math.sqrt(abx * abx + aby * aby + abz * abz);
  const lenCB = Math.sqrt(cbx * cbx + cby * cby + cbz * cbz);
  if (lenAB < 0.000001 || lenCB < 0.000001) {
    return 0;
  }
  const cos = Math.max(-1, Math.min(1, dot / (lenAB * lenCB)));
  return Math.acos(cos) * 180 / Math.PI;
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

function getJointPairSymmetry(left, right) {
  return {
    xMirrorError: Math.abs(left[0] + right[0]),
    yDrift: Math.abs(left[1] - right[1]),
    zDrift: Math.abs(left[2] - right[2]),
  };
}

function createRigMetadata(poseName, joints) {
  const shoulderWidth = Math.abs(joints.shoulder.left[0] - joints.shoulder.right[0]);
  const hipWidth = Math.abs(joints.hip.left[0] - joints.hip.right[0]);

  const leftArmLength = length3(joints.shoulder.left, joints.elbow.left) + length3(joints.elbow.left, joints.wrist.left);
  const rightArmLength = length3(joints.shoulder.right, joints.elbow.right) + length3(joints.elbow.right, joints.wrist.right);
  const leftLegLength = length3(joints.hip.left, joints.knee.left) + length3(joints.knee.left, joints.ankle.left);
  const rightLegLength = length3(joints.hip.right, joints.knee.right) + length3(joints.knee.right, joints.ankle.right);

  const avgArmLength = (leftArmLength + rightArmLength) * 0.5;
  const avgLegLength = (leftLegLength + rightLegLength) * 0.5;
  const bodyHeight = joints.head[1] - ((joints.ankle.left[1] + joints.ankle.right[1]) * 0.5);

  return {
    version: BODY_RIG_METADATA_VERSION,
    pose: poseName,
    joints,
    metrics: {
      shoulderWidth,
      hipWidth,
      bodyHeight,
      avgArmLength,
      avgLegLength,
      armToHeightRatio: bodyHeight > 0 ? avgArmLength / bodyHeight : 0,
      legToHeightRatio: bodyHeight > 0 ? avgLegLength / bodyHeight : 0,
      leftElbowAngle: angle3(joints.shoulder.left, joints.elbow.left, joints.wrist.left),
      rightElbowAngle: angle3(joints.shoulder.right, joints.elbow.right, joints.wrist.right),
      leftKneeAngle: angle3(joints.hip.left, joints.knee.left, joints.ankle.left),
      rightKneeAngle: angle3(joints.hip.right, joints.knee.right, joints.ankle.right),
      symmetry: {
        shoulders: getJointPairSymmetry(joints.shoulder.left, joints.shoulder.right),
        elbows: getJointPairSymmetry(joints.elbow.left, joints.elbow.right),
        wrists: getJointPairSymmetry(joints.wrist.left, joints.wrist.right),
        hips: getJointPairSymmetry(joints.hip.left, joints.hip.right),
        knees: getJointPairSymmetry(joints.knee.left, joints.knee.right),
        ankles: getJointPairSymmetry(joints.ankle.left, joints.ankle.right),
      },
      leftArmLength,
      rightArmLength,
      leftLegLength,
      rightLegLength,
    },
  };
}

export function buildBodyRigMetadata(pose = 'open', configOverrides = {}) {
  const poseData = getBodyRigPoseData(pose);
  const joints = buildBodyRigJoints(poseData, configOverrides);
  const poseName = typeof pose === 'string' ? pose : 'custom';
  return createRigMetadata(poseName, joints);
}

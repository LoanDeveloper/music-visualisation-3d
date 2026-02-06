/**
 * GLB Model Validator
 *
 * Validates Human Layer GLB models for mesh presence, size, topology budget,
 * and pose quality constraints (rig symmetry/proportions).
 */

import { access, readFile } from 'fs/promises';
import { constants } from 'fs';
import { basename, dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_MODELS_DIR = join(__dirname, '../../public/models/human');
const DEFAULT_REQUIRED_FILES = ['pose-open.glb', 'pose-closed.glb'];
const DEFAULT_REQUIRED_MESHES = ['Body', 'Veins', 'Brain', 'Heart'];

const CONFIG = {
  maxFileSizeMB: 5,
  maxTrianglesPerMesh: 50000,
  maxTotalTriangles: 150000,
  checks: {
    openArmMaxAngleDeg: 165,
    openArmMinAngleDeg: 120,
    openWristDropMin: 0.10,
    openWristDropMax: 0.40,
    symmetry: {
      xMirrorTolerance: 0.025,
      yDriftTolerance: 0.03,
      zDriftTolerance: 0.03,
      limbLengthDeltaRatio: 0.08,
    },
    proportions: {
      shoulderToHeight: [0.15, 0.50],
      hipToHeight: [0.08, 0.22],
      armToHeight: [0.26, 0.50],
      legToHeight: [0.36, 0.70],
      headToShoulderToHeight: [0.08, 0.25],
    },
    bodyVeinBounds: {
      widthRatio: [0.70, 1.30],
      heightRatio: [0.55, 1.20],
      centerOffsetXRatio: 0.18,
      centerOffsetYRatio: 0.20,
    },
  },
};

function getPoseIdFromFilename(filename) {
  const match = filename.match(/pose-(open|closed)\.glb$/i);
  return match ? match[1].toLowerCase() : null;
}

function vecSub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function vecLen(v) {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

function dist(a, b) {
  return vecLen(vecSub(a, b));
}

function angleDeg(a, b, c) {
  const ba = vecSub(a, b);
  const bc = vecSub(c, b);
  const lenBA = vecLen(ba);
  const lenBC = vecLen(bc);
  if (lenBA < 0.000001 || lenBC < 0.000001) {
    return 0;
  }
  const dot = ba[0] * bc[0] + ba[1] * bc[1] + ba[2] * bc[2];
  const cos = Math.max(-1, Math.min(1, dot / (lenBA * lenBC)));
  return Math.acos(cos) * 180 / Math.PI;
}

function ratioRangeCheck(value, [min, max]) {
  return value >= min && value <= max;
}

function getLimbLength(start, joint, end) {
  return dist(start, joint) + dist(joint, end);
}

function getJointPairSymmetry(left, right) {
  return {
    xMirrorError: Math.abs(left[0] + right[0]),
    yDrift: Math.abs(left[1] - right[1]),
    zDrift: Math.abs(left[2] - right[2]),
  };
}

/**
 * Parse a GLB file and extract base data.
 */
async function parseGLB(filePath) {
  const buffer = await readFile(filePath);
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  const magic = view.getUint32(0, true);
  if (magic !== 0x46546c67) {
    throw new Error(`Invalid GLB magic: expected 0x46546C67, got 0x${magic.toString(16)}`);
  }

  const version = view.getUint32(4, true);
  if (version !== 2) {
    throw new Error(`Unsupported glTF version: ${version}`);
  }

  const length = view.getUint32(8, true);
  const chunk0Length = view.getUint32(12, true);
  const chunk0Type = view.getUint32(16, true);

  if (chunk0Type !== 0x4e4f534a) {
    throw new Error('First chunk is not JSON');
  }

  const jsonBytes = buffer.subarray(20, 20 + chunk0Length);
  const gltf = JSON.parse(new TextDecoder().decode(jsonBytes));

  let binBuffer = null;
  if (20 + chunk0Length < length) {
    const chunk1Offset = 20 + chunk0Length;
    const chunk1Length = view.getUint32(chunk1Offset, true);
    const chunk1Type = view.getUint32(chunk1Offset + 4, true);
    if (chunk1Type === 0x004e4942) {
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

function getAccessorRange(gltf, accessorIndex) {
  const accessor = gltf.accessors?.[accessorIndex];
  if (!accessor || accessor.type !== 'VEC3') {
    return null;
  }
  if (
    !Array.isArray(accessor.min) || accessor.min.length < 3 ||
    !Array.isArray(accessor.max) || accessor.max.length < 3
  ) {
    return null;
  }
  return {
    min: [accessor.min[0], accessor.min[1], accessor.min[2]],
    max: [accessor.max[0], accessor.max[1], accessor.max[2]],
  };
}

function mergeBounds(boundsA, boundsB) {
  if (!boundsA) return boundsB;
  if (!boundsB) return boundsA;
  return {
    min: [
      Math.min(boundsA.min[0], boundsB.min[0]),
      Math.min(boundsA.min[1], boundsB.min[1]),
      Math.min(boundsA.min[2], boundsB.min[2]),
    ],
    max: [
      Math.max(boundsA.max[0], boundsB.max[0]),
      Math.max(boundsA.max[1], boundsB.max[1]),
      Math.max(boundsA.max[2], boundsB.max[2]),
    ],
  };
}

function findMeshIndexByName(gltf, meshName) {
  if (!Array.isArray(gltf.meshes)) return -1;
  const lower = meshName.toLowerCase();
  for (let i = 0; i < gltf.meshes.length; i++) {
    const name = (gltf.meshes[i]?.name || '').toLowerCase();
    if (name === lower) return i;
  }
  return -1;
}

function getMeshBounds(gltf, meshName) {
  const meshIndex = findMeshIndexByName(gltf, meshName);
  if (meshIndex < 0) return null;

  const mesh = gltf.meshes[meshIndex];
  if (!mesh?.primitives?.length) return null;

  let merged = null;
  for (const primitive of mesh.primitives) {
    const posAccessor = primitive.attributes?.POSITION;
    if (posAccessor === undefined) continue;
    const range = getAccessorRange(gltf, posAccessor);
    if (!range) continue;
    merged = mergeBounds(merged, range);
  }

  return merged;
}

function getBoundsMetrics(bounds) {
  if (!bounds) return null;
  const width = bounds.max[0] - bounds.min[0];
  const height = bounds.max[1] - bounds.min[1];
  const depth = bounds.max[2] - bounds.min[2];
  return {
    width,
    height,
    depth,
    center: [
      (bounds.min[0] + bounds.max[0]) * 0.5,
      (bounds.min[1] + bounds.max[1]) * 0.5,
      (bounds.min[2] + bounds.max[2]) * 0.5,
    ],
  };
}

function extractMeshInfo(gltf) {
  const meshes = [];
  if (!Array.isArray(gltf.meshes)) {
    return meshes;
  }

  for (const mesh of gltf.meshes) {
    const meshInfo = {
      name: mesh.name || 'unnamed',
      primitives: [],
      totalVertices: 0,
      totalTriangles: 0,
    };

    for (const primitive of mesh.primitives || []) {
      const primInfo = {
        mode: primitive.mode ?? 4,
        attributes: {},
        indices: null,
      };

      if (primitive.attributes?.POSITION !== undefined) {
        const accessor = gltf.accessors?.[primitive.attributes.POSITION];
        if (accessor) {
          primInfo.attributes.POSITION = {
            count: accessor.count,
            type: accessor.type,
            componentType: accessor.componentType,
          };
          meshInfo.totalVertices += accessor.count;
        }
      }

      if (primitive.indices !== undefined) {
        const accessor = gltf.accessors?.[primitive.indices];
        if (accessor) {
          primInfo.indices = { count: accessor.count };
          if (primInfo.mode === 4) {
            meshInfo.totalTriangles += Math.floor(accessor.count / 3);
          }
        }
      } else if (primInfo.attributes.POSITION && primInfo.mode === 4) {
        meshInfo.totalTriangles += Math.floor(primInfo.attributes.POSITION.count / 3);
      }

      meshInfo.primitives.push(primInfo);
    }

    meshes.push(meshInfo);
  }

  return meshes;
}

function extractNodeInfo(gltf) {
  const nodes = [];
  if (!Array.isArray(gltf.nodes)) return nodes;

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

function getRigMetadata(gltf) {
  const sceneIndex = gltf.scene ?? 0;
  const scene = gltf.scenes?.[sceneIndex] || gltf.scenes?.[0];

  if (scene?.extras?.humanRig) {
    return scene.extras.humanRig;
  }

  if (gltf.extras?.humanRig) {
    return gltf.extras.humanRig;
  }

  return null;
}

function hasValidJointShape(joint) {
  return Array.isArray(joint) && joint.length >= 3 &&
    Number.isFinite(joint[0]) && Number.isFinite(joint[1]) && Number.isFinite(joint[2]);
}

function hasValidSideJoints(group) {
  return !!group && hasValidJointShape(group.left) && hasValidJointShape(group.right);
}

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

function validateRigChecks(result, poseId, rigMetadata) {
  if (!rigMetadata || typeof rigMetadata !== 'object') {
    result.addError('Missing rig metadata object');
    return;
  }

  const joints = rigMetadata.joints;
  if (!joints || typeof joints !== 'object') {
    result.addError('Rig metadata is missing joints');
    return;
  }

  const requiredSideGroups = ['shoulder', 'elbow', 'wrist', 'hip', 'knee', 'ankle'];
  for (const group of requiredSideGroups) {
    if (!hasValidSideJoints(joints[group])) {
      result.addError(`Rig metadata missing valid ${group}.left/${group}.right joints`);
      return;
    }
  }

  if (!hasValidJointShape(joints.head)) {
    result.addError('Rig metadata missing valid head joint');
    return;
  }

  const leftElbowAngle = angleDeg(joints.shoulder.left, joints.elbow.left, joints.wrist.left);
  const rightElbowAngle = angleDeg(joints.shoulder.right, joints.elbow.right, joints.wrist.right);

  result.addInfo(`Rig elbow angles: left ${leftElbowAngle.toFixed(2)}°, right ${rightElbowAngle.toFixed(2)}°`);

  if (poseId === 'open') {
    if (leftElbowAngle >= CONFIG.checks.openArmMaxAngleDeg || rightElbowAngle >= CONFIG.checks.openArmMaxAngleDeg) {
      result.addError(
        `Open pose elbow angle too straight (max ${CONFIG.checks.openArmMaxAngleDeg}°): ` +
        `left ${leftElbowAngle.toFixed(2)}°, right ${rightElbowAngle.toFixed(2)}°`
      );
    }

    if (leftElbowAngle < CONFIG.checks.openArmMinAngleDeg || rightElbowAngle < CONFIG.checks.openArmMinAngleDeg) {
      result.addError(
        `Open pose elbow bend too sharp (min ${CONFIG.checks.openArmMinAngleDeg}°): ` +
        `left ${leftElbowAngle.toFixed(2)}°, right ${rightElbowAngle.toFixed(2)}°`
      );
    }

    const leftWristDrop = joints.shoulder.left[1] - joints.wrist.left[1];
    const rightWristDrop = joints.shoulder.right[1] - joints.wrist.right[1];
    const wristDropAvg = (leftWristDrop + rightWristDrop) * 0.5;
    result.addInfo(`Rig open wrist drop: ${wristDropAvg.toFixed(3)}`);

    if (
      wristDropAvg < CONFIG.checks.openWristDropMin ||
      wristDropAvg > CONFIG.checks.openWristDropMax
    ) {
      result.addError(
        `Open pose wrist drop out of range [${CONFIG.checks.openWristDropMin}, ${CONFIG.checks.openWristDropMax}]` +
        `: ${wristDropAvg.toFixed(3)}`
      );
    }
  }

  const symmetry = CONFIG.checks.symmetry;
  for (const jointName of requiredSideGroups) {
    const s = getJointPairSymmetry(joints[jointName].left, joints[jointName].right);
    if (s.xMirrorError > symmetry.xMirrorTolerance) {
      result.addError(`${jointName} symmetry x-mirror drift ${s.xMirrorError.toFixed(4)} > ${symmetry.xMirrorTolerance}`);
    }
    if (s.yDrift > symmetry.yDriftTolerance) {
      result.addError(`${jointName} symmetry y-drift ${s.yDrift.toFixed(4)} > ${symmetry.yDriftTolerance}`);
    }
    if (s.zDrift > symmetry.zDriftTolerance) {
      result.addError(`${jointName} symmetry z-drift ${s.zDrift.toFixed(4)} > ${symmetry.zDriftTolerance}`);
    }
  }

  const leftArmLength = getLimbLength(joints.shoulder.left, joints.elbow.left, joints.wrist.left);
  const rightArmLength = getLimbLength(joints.shoulder.right, joints.elbow.right, joints.wrist.right);
  const leftLegLength = getLimbLength(joints.hip.left, joints.knee.left, joints.ankle.left);
  const rightLegLength = getLimbLength(joints.hip.right, joints.knee.right, joints.ankle.right);

  const armLengthAvg = (leftArmLength + rightArmLength) * 0.5;
  const legLengthAvg = (leftLegLength + rightLegLength) * 0.5;

  const armDeltaRatio = armLengthAvg > 0 ? Math.abs(leftArmLength - rightArmLength) / armLengthAvg : 0;
  const legDeltaRatio = legLengthAvg > 0 ? Math.abs(leftLegLength - rightLegLength) / legLengthAvg : 0;

  if (armDeltaRatio > symmetry.limbLengthDeltaRatio) {
    result.addError(
      `Arm length asymmetry ${(armDeltaRatio * 100).toFixed(2)}% exceeds ${(symmetry.limbLengthDeltaRatio * 100).toFixed(1)}%`
    );
  }

  if (legDeltaRatio > symmetry.limbLengthDeltaRatio) {
    result.addError(
      `Leg length asymmetry ${(legDeltaRatio * 100).toFixed(2)}% exceeds ${(symmetry.limbLengthDeltaRatio * 100).toFixed(1)}%`
    );
  }

  const headY = joints.head[1];
  const ankleMidY = (joints.ankle.left[1] + joints.ankle.right[1]) * 0.5;
  const bodyHeight = headY - ankleMidY;

  if (!(bodyHeight > 0.5 && bodyHeight < 3.0)) {
    result.addError(`Rig body height invalid: ${bodyHeight.toFixed(3)}`);
    return;
  }

  const shoulderWidth = Math.abs(joints.shoulder.right[0] - joints.shoulder.left[0]);
  const hipWidth = Math.abs(joints.hip.right[0] - joints.hip.left[0]);
  const headToShoulder = headY - ((joints.shoulder.left[1] + joints.shoulder.right[1]) * 0.5);

  const shoulderRatio = shoulderWidth / bodyHeight;
  const hipRatio = hipWidth / bodyHeight;
  const armRatio = armLengthAvg / bodyHeight;
  const legRatio = legLengthAvg / bodyHeight;
  const headShoulderRatio = headToShoulder / bodyHeight;

  result.addInfo(
    `Rig proportions: shoulder=${shoulderRatio.toFixed(3)}, hip=${hipRatio.toFixed(3)}, ` +
    `arm=${armRatio.toFixed(3)}, leg=${legRatio.toFixed(3)}`
  );

  const ranges = CONFIG.checks.proportions;

  if (!ratioRangeCheck(shoulderRatio, ranges.shoulderToHeight)) {
    result.addError(
      `Shoulder/body ratio ${shoulderRatio.toFixed(3)} outside [${ranges.shoulderToHeight[0]}, ${ranges.shoulderToHeight[1]}]`
    );
  }

  if (!ratioRangeCheck(hipRatio, ranges.hipToHeight)) {
    result.addError(
      `Hip/body ratio ${hipRatio.toFixed(3)} outside [${ranges.hipToHeight[0]}, ${ranges.hipToHeight[1]}]`
    );
  }

  if (!ratioRangeCheck(armRatio, ranges.armToHeight)) {
    result.addError(
      `Arm/body ratio ${armRatio.toFixed(3)} outside [${ranges.armToHeight[0]}, ${ranges.armToHeight[1]}]`
    );
  }

  if (!ratioRangeCheck(legRatio, ranges.legToHeight)) {
    result.addError(
      `Leg/body ratio ${legRatio.toFixed(3)} outside [${ranges.legToHeight[0]}, ${ranges.legToHeight[1]}]`
    );
  }

  if (!ratioRangeCheck(headShoulderRatio, ranges.headToShoulderToHeight)) {
    result.addError(
      `Head-to-shoulder/body ratio ${headShoulderRatio.toFixed(3)} outside ` +
      `[${ranges.headToShoulderToHeight[0]}, ${ranges.headToShoulderToHeight[1]}]`
    );
  }
}

function validateBodyVeinBounds(result, gltf) {
  const bodyBounds = getMeshBounds(gltf, 'Body');
  const veinBounds = getMeshBounds(gltf, 'Veins');

  if (!bodyBounds || !veinBounds) {
    result.addWarning('Could not compute Body/Veins bounds from accessor min/max');
    return;
  }

  const body = getBoundsMetrics(bodyBounds);
  const veins = getBoundsMetrics(veinBounds);
  if (!body || !veins || body.width <= 0 || body.height <= 0) {
    result.addWarning('Invalid bounds metrics for Body/Veins proportion checks');
    return;
  }

  const checks = CONFIG.checks.bodyVeinBounds;

  const widthRatio = veins.width / body.width;
  const heightRatio = veins.height / body.height;
  const centerOffsetXRatio = Math.abs(veins.center[0] - body.center[0]) / body.width;
  const centerOffsetYRatio = Math.abs(veins.center[1] - body.center[1]) / body.height;

  result.addInfo(
    `Body/Veins bounds ratios: width=${widthRatio.toFixed(3)}, height=${heightRatio.toFixed(3)}, ` +
    `offsetX=${centerOffsetXRatio.toFixed(3)}, offsetY=${centerOffsetYRatio.toFixed(3)}`
  );

  if (!ratioRangeCheck(widthRatio, checks.widthRatio)) {
    result.addError(
      `Veins/body width ratio ${widthRatio.toFixed(3)} outside [${checks.widthRatio[0]}, ${checks.widthRatio[1]}]`
    );
  }

  if (!ratioRangeCheck(heightRatio, checks.heightRatio)) {
    result.addError(
      `Veins/body height ratio ${heightRatio.toFixed(3)} outside [${checks.heightRatio[0]}, ${checks.heightRatio[1]}]`
    );
  }

  if (centerOffsetXRatio > checks.centerOffsetXRatio) {
    result.addError(
      `Veins/body center X offset ratio ${centerOffsetXRatio.toFixed(3)} exceeds ${checks.centerOffsetXRatio}`
    );
  }

  if (centerOffsetYRatio > checks.centerOffsetYRatio) {
    result.addError(
      `Veins/body center Y offset ratio ${centerOffsetYRatio.toFixed(3)} exceeds ${checks.centerOffsetYRatio}`
    );
  }
}

export async function validateModel(filePath, options = {}) {
  const filename = basename(filePath);
  const result = new ValidationResult(filename);

  const requiredMeshes = options.requiredMeshes || DEFAULT_REQUIRED_MESHES;
  const requireRigMetadata = !!options.requireRigMetadata;
  const poseId = getPoseIdFromFilename(filename);

  try {
    await access(filePath, constants.R_OK);
  } catch {
    result.addError(`File not found: ${filePath}`);
    return result;
  }

  let parsed;
  try {
    parsed = await parseGLB(filePath);
  } catch (e) {
    result.addError(`Failed to parse GLB: ${e.message}`);
    return result;
  }

  result.fileSize = parsed.fileSize;
  result.addInfo(`File size: ${(parsed.fileSize / 1024 / 1024).toFixed(2)} MB`);

  if (parsed.fileSize > CONFIG.maxFileSizeMB * 1024 * 1024) {
    result.addWarning(`File size exceeds ${CONFIG.maxFileSizeMB}MB - may impact load time`);
  }

  const meshes = extractMeshInfo(parsed.gltf);
  const nodes = extractNodeInfo(parsed.gltf);
  result.meshes = meshes;

  result.addInfo(`Found ${meshes.length} meshes, ${nodes.length} nodes`);

  const meshNames = new Set(meshes.map((m) => m.name));
  const nodeNames = new Set(nodes.map((n) => n.name));
  const allNames = new Set([...meshNames, ...nodeNames]);

  for (const required of requiredMeshes) {
    const found = allNames.has(required) || [...allNames].some((n) => n.toLowerCase() === required.toLowerCase());
    if (!found) {
      result.addError(`Missing required mesh: "${required}"`);
    } else {
      result.addInfo(`Found mesh: "${required}"`);
    }
  }

  let totalTriangles = 0;
  for (const mesh of meshes) {
    totalTriangles += mesh.totalTriangles;

    if (mesh.totalTriangles > CONFIG.maxTrianglesPerMesh) {
      result.addWarning(
        `Mesh "${mesh.name}" has ${mesh.totalTriangles} triangles (max recommended: ${CONFIG.maxTrianglesPerMesh})`
      );
    }

    result.addInfo(`  ${mesh.name}: ${mesh.totalVertices} vertices, ${mesh.totalTriangles} triangles`);
  }

  if (totalTriangles > CONFIG.maxTotalTriangles) {
    result.addWarning(`Total triangles (${totalTriangles}) exceeds recommended max (${CONFIG.maxTotalTriangles})`);
  }

  result.addInfo(`Total: ${totalTriangles} triangles`);

  if (requiredMeshes.includes('Body') && requiredMeshes.includes('Veins')) {
    validateBodyVeinBounds(result, parsed.gltf);
  }

  if (poseId === 'open' || poseId === 'closed') {
    const rigMetadata = getRigMetadata(parsed.gltf);
    if (!rigMetadata) {
      if (requireRigMetadata) {
        result.addError('Missing scene extras.humanRig metadata (required for strict pose checks)');
      } else {
        result.addWarning('Missing scene extras.humanRig metadata, skipping strict pose checks');
      }
    } else {
      validateRigChecks(result, poseId, rigMetadata);
    }
  }

  return result;
}

export function printResult(result, verbose = false) {
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

export function printSummary(results) {
  console.log('');
  console.log('═'.repeat(60));
  console.log('SUMMARY');
  console.log('═'.repeat(60));

  const passed = results.filter((r) => r.valid).length;
  const total = results.length;

  console.log(`Validated: ${passed}/${total} models passed`);

  if (passed === total) {
    console.log('');
    console.log('🎉 All models are valid.');
  } else {
    console.log('');
    console.log('⚠️  Some models have issues. See above for details.');
  }
}

export async function validateModelsInDirectory(modelsDir, options = {}) {
  const requiredFiles = options.requiredFiles || DEFAULT_REQUIRED_FILES;
  const results = [];

  for (const file of requiredFiles) {
    const filePath = join(modelsDir, file);
    const result = await validateModel(filePath, options);
    results.push(result);
  }

  return {
    results,
    allValid: results.every((r) => r.valid),
  };
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    modelsDir: DEFAULT_MODELS_DIR,
    verbose: false,
    optimize: false,
    fix: false,
    requireRigMetadata: false,
    requiredFiles: [...DEFAULT_REQUIRED_FILES],
    requiredMeshes: [...DEFAULT_REQUIRED_MESHES],
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--dir':
      case '--models-dir':
        options.modelsDir = resolve(args[++i]);
        break;
      case '--file': {
        const filename = args[++i];
        options.requiredFiles = [filename];
        break;
      }
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--require-rig':
        options.requireRigMetadata = true;
        break;
      case '--optimize':
        options.optimize = true;
        break;
      case '--fix':
        options.fix = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        console.error(`Unknown argument: ${arg}`);
        process.exit(1);
    }
  }

  return options;
}

function printHelp() {
  console.log('');
  console.log('GLB Model Validator for Music Visualisation 3D');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/node/validate-models.mjs [options]');
  console.log('');
  console.log('Options:');
  console.log('  --dir <path>       Models directory (default: public/models/human)');
  console.log('  --file <name>      Validate only one file (e.g. pose-open.glb)');
  console.log('  --require-rig      Require extras.humanRig metadata for strict pose checks');
  console.log('  --verbose, -v      Show detailed info output');
  console.log('  --help, -h         Show this help');
}

async function main() {
  const options = parseArgs(process.argv);

  console.log('');
  console.log('═'.repeat(60));
  console.log('GLB Model Validator for Music Visualisation 3D');
  console.log('═'.repeat(60));
  console.log(`Models directory: ${options.modelsDir}`);

  if (options.optimize || options.fix) {
    console.log('');
    console.log('⚠️  --optimize and --fix are placeholders and currently no-op.');
  }

  try {
    await access(options.modelsDir, constants.R_OK);
  } catch {
    console.log('');
    console.log('❌ Models directory not found or not readable.');
    process.exit(1);
  }

  const { results, allValid } = await validateModelsInDirectory(options.modelsDir, options);

  for (const result of results) {
    printResult(result, options.verbose);
  }

  printSummary(results);
  process.exit(allValid ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
}

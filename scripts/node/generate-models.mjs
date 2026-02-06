#!/usr/bin/env node

/**
 * Generate Human Models
 *
 * Safe pipeline:
 * 1) Generate to staging by default.
 * 2) Validate staged files.
 * 3) Promote to live only when explicitly requested and validation passes.
 */

import { copyFile, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { createBody } from './lib/body-parts/body.mjs';
import { createVeins } from './lib/body-parts/veins.mjs';
import { createBrain } from './lib/body-parts/brain.mjs';
import { createHeart } from './lib/body-parts/heart.mjs';
import { buildBodyRigMetadata } from './lib/body-rig.mjs';

import { exportToGLB, printMeshStats } from './lib/glb-exporter.mjs';
import {
  validateModelsInDirectory,
  printResult,
  printSummary,
} from './validate-models.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../..');
const LIVE_MODELS_DIR = resolve(PROJECT_ROOT, 'public/models/human');
const DEFAULT_OUTPUT_DIR = resolve(LIVE_MODELS_DIR, '_staging');

const MESH_NAMES = {
  body: 'Body',
  veins: 'Veins',
  brain: 'Brain',
  heart: 'Heart',
};

const REQUIRED_MESHES = Object.values(MESH_NAMES);
const POSES = ['open', 'closed'];

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    pose: null,
    part: null,
    output: DEFAULT_OUTPUT_DIR,
    stats: false,
    promote: false,
    skipValidation: false,
    allowLiveOutput: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--pose':
        options.pose = args[++i];
        if (!POSES.includes(options.pose)) {
          console.error(`Invalid pose: ${options.pose}. Valid poses: ${POSES.join(', ')}`);
          process.exit(1);
        }
        break;

      case '--part':
        options.part = args[++i];
        if (!Object.keys(MESH_NAMES).includes(options.part)) {
          console.error(`Invalid part: ${options.part}. Valid parts: ${Object.keys(MESH_NAMES).join(', ')}`);
          process.exit(1);
        }
        break;

      case '--output':
        options.output = resolve(args[++i]);
        break;

      case '--stats':
        options.stats = true;
        break;

      case '--promote':
        options.promote = true;
        break;

      case '--skip-validation':
        options.skipValidation = true;
        break;

      case '--allow-live-output':
        options.allowLiveOutput = true;
        break;

      case '--help':
      case '-h':
        options.help = true;
        break;

      default:
        console.error(`Unknown argument: ${arg}`);
        process.exit(1);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Generate Human Models for Music Visualisation 3D

Usage:
  node scripts/node/generate-models.mjs [options]

Options:
  --pose <name>           Generate only one pose (open, closed)
  --part <name>           Generate only one part (body, veins, brain, heart)
  --output <dir>          Output directory (default: public/models/human/_staging)
  --stats                 Print detailed mesh stats
  --promote               Copy staged models to live directory if validation passes
  --skip-validation       Skip post-generation validation (not recommended)
  --allow-live-output     Allow writing directly to public/models/human
  --help                  Show this help

Examples:
  # Safe default: generate + validate in staging
  node scripts/node/generate-models.mjs

  # Generate one pose in staging, then promote if valid
  node scripts/node/generate-models.mjs --pose open --promote

  # Experimental output folder
  node scripts/node/generate-models.mjs --output /tmp/human-models
`);
}

function ensureSafeOutputDirectory(options) {
  const normalizedOutput = resolve(options.output);
  if (normalizedOutput === LIVE_MODELS_DIR && !options.allowLiveOutput) {
    throw new Error(
      `Refusing to write directly to live models directory (${LIVE_MODELS_DIR}). ` +
      'Use staging output or pass --allow-live-output explicitly.'
    );
  }
}

function generateParts(pose, partFilter = null) {
  const parts = {};

  const generators = {
    body: () => createBody(pose),
    veins: () => createVeins(pose),
    brain: () => createBrain(pose),
    heart: () => createHeart(pose),
  };

  for (const [key, generator] of Object.entries(generators)) {
    if (partFilter && partFilter !== key) {
      continue;
    }

    console.log(`  Generating ${key}...`);
    const start = performance.now();

    const geometry = generator();

    const elapsed = (performance.now() - start).toFixed(0);
    const vertexCount = geometry.positions.length / 3;
    console.log(`    Done: ${vertexCount.toLocaleString()} vertices (${elapsed}ms)`);

    parts[MESH_NAMES[key]] = geometry;
  }

  return parts;
}

async function generateModel(pose, outputDir, options) {
  console.log(`\nGenerating pose: ${pose}`);
  console.log('─'.repeat(40));

  const meshes = generateParts(pose, options.part);

  if (options.stats) {
    printMeshStats(meshes);
  }

  const rigMetadata = buildBodyRigMetadata(pose);
  const filePath = resolve(outputDir, `pose-${pose}.glb`);

  console.log('\nExporting to GLB...');
  await exportToGLB(meshes, filePath, {
    optimize: true,
    generator: 'music-visualisation-3d procedural generator v2.0',
    rootExtras: {
      modelFamily: 'human-layer',
      generatorVersion: '2.0',
    },
    sceneExtras: {
      humanRig: rigMetadata,
    },
  });
}

async function validateStaging(outputDir, poses, options) {
  const requiredFiles = poses.map((pose) => `pose-${pose}.glb`);
  const requiredMeshes = options.part ? [MESH_NAMES[options.part]] : REQUIRED_MESHES;

  console.log('\nRunning staged model validation...');
  console.log(`Validation directory: ${outputDir}`);

  const { results, allValid } = await validateModelsInDirectory(outputDir, {
    requiredFiles,
    requiredMeshes,
    requireRigMetadata: true,
  });

  for (const result of results) {
    printResult(result, options.stats);
  }
  printSummary(results);

  return allValid;
}

async function promoteModels(stagingDir, poses) {
  console.log('\nPromoting validated models to live directory...');
  await mkdir(LIVE_MODELS_DIR, { recursive: true });

  for (const pose of poses) {
    const filename = `pose-${pose}.glb`;
    const src = resolve(stagingDir, filename);
    const dest = resolve(LIVE_MODELS_DIR, filename);
    await copyFile(src, dest);
    console.log(`  Promoted: ${filename}`);
  }

  console.log(`\nLive directory updated: ${LIVE_MODELS_DIR}`);
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    return;
  }

  ensureSafeOutputDirectory(options);

  if (options.promote && options.part) {
    throw new Error('Cannot promote partial models generated with --part. Generate full models first.');
  }

  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Human Model Generator                    ║');
  console.log('║   Music Visualisation 3D                   ║');
  console.log('╚════════════════════════════════════════════╝');

  console.log(`\nStaging output directory: ${options.output}`);
  console.log(`Live directory: ${LIVE_MODELS_DIR}`);

  await mkdir(options.output, { recursive: true });

  const poses = options.pose ? [options.pose] : POSES;
  const startTime = performance.now();

  for (const pose of poses) {
    await generateModel(pose, options.output, options);
  }

  const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);

  let allValid = true;
  if (!options.skipValidation) {
    allValid = await validateStaging(options.output, poses, options);
    if (!allValid) {
      throw new Error('Staged models failed validation. Live models were not modified.');
    }
  } else {
    console.log('\nValidation skipped (--skip-validation). Live models were not modified.');
  }

  if (options.promote) {
    if (!allValid) {
      throw new Error('Promotion blocked: staged models are invalid.');
    }
    await promoteModels(options.output, poses);
  }

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   Generation Complete                      ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`\nTotal time: ${totalTime}s`);
  console.log('\nGenerated files (staging):');

  for (const pose of poses) {
    console.log(`  - ${options.output}/pose-${pose}.glb`);
  }

  if (options.promote) {
    console.log('\nPromotion: completed (validated staging -> live)');
  } else {
    console.log('\nPromotion: not performed (live models unchanged)');
    console.log('To promote later, run:');
    console.log('  npm run promote-models');
  }
}

main().catch((err) => {
  console.error('\nError:', err.message);
  if (err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
});

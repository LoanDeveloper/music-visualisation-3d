#!/usr/bin/env node

/**
 * Promote staged human models into the live public directory.
 * Promotion is blocked unless validation passes.
 */

import { copyFile, mkdir } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import {
  validateModelsInDirectory,
  printResult,
  printSummary,
} from './validate-models.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../..');
const LIVE_MODELS_DIR = resolve(PROJECT_ROOT, 'public/models/human');
const STAGING_MODELS_DIR = resolve(LIVE_MODELS_DIR, '_staging');
const POSES = ['open', 'closed'];

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    stagingDir: STAGING_MODELS_DIR,
    liveDir: LIVE_MODELS_DIR,
    poses: [...POSES],
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--staging':
        options.stagingDir = resolve(args[++i]);
        break;
      case '--live':
        options.liveDir = resolve(args[++i]);
        break;
      case '--pose': {
        const pose = args[++i];
        if (!POSES.includes(pose)) {
          console.error(`Invalid pose: ${pose}. Valid poses: ${POSES.join(', ')}`);
          process.exit(1);
        }
        options.poses = [pose];
        break;
      }
      case '--verbose':
      case '-v':
        options.verbose = true;
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
  console.log('Promote staged Human Layer models to live directory');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/node/promote-models.mjs [options]');
  console.log('');
  console.log('Options:');
  console.log('  --staging <dir>   Staging directory (default: public/models/human/_staging)');
  console.log('  --live <dir>      Live directory (default: public/models/human)');
  console.log('  --pose <name>     Promote only one pose (open or closed)');
  console.log('  --verbose, -v     Verbose validator output');
  console.log('  --help, -h        Show help');
}

async function promote(stagingDir, liveDir, poses) {
  await mkdir(liveDir, { recursive: true });
  for (const pose of poses) {
    const filename = `pose-${pose}.glb`;
    const src = resolve(stagingDir, filename);
    const dest = resolve(liveDir, filename);
    await copyFile(src, dest);
    console.log(`  Promoted: ${filename}`);
  }
}

async function main() {
  const options = parseArgs();
  const requiredFiles = options.poses.map((pose) => `pose-${pose}.glb`);

  console.log('');
  console.log('═'.repeat(60));
  console.log('Promote Human Models (staging -> live)');
  console.log('═'.repeat(60));
  console.log(`Staging directory: ${options.stagingDir}`);
  console.log(`Live directory: ${options.liveDir}`);

  const { results, allValid } = await validateModelsInDirectory(options.stagingDir, {
    requiredFiles,
    requiredMeshes: ['Body', 'Veins', 'Brain', 'Heart'],
    requireRigMetadata: true,
  });

  for (const result of results) {
    printResult(result, options.verbose);
  }
  printSummary(results);

  if (!allValid) {
    throw new Error('Promotion aborted: staging validation failed.');
  }

  console.log('\nValidation passed. Promoting files...');
  await promote(options.stagingDir, options.liveDir, options.poses);

  console.log('\nPromotion complete.');
}

main().catch((err) => {
  console.error('\nError:', err.message);
  if (err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
});

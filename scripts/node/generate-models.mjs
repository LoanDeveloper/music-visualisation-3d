#!/usr/bin/env node

/**
 * Generate Human Models
 * 
 * Main script that generates GLB models for the Human Layer feature.
 * Creates both pose variants (open and closed) with all body parts.
 * 
 * Usage:
 *   node scripts/node/generate-models.mjs [options]
 * 
 * Options:
 *   --pose <name>    Generate only specific pose (open, closed)
 *   --part <name>    Generate only specific part (body, veins, brain, heart)
 *   --output <dir>   Output directory (default: public/models/human)
 *   --stats          Print detailed statistics
 *   --help           Show help
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Body part generators
import { createBody } from './lib/body-parts/body.mjs';
import { createVeins } from './lib/body-parts/veins.mjs';
import { createBrain } from './lib/body-parts/brain.mjs';
import { createHeart } from './lib/body-parts/heart.mjs';

// GLB export utilities
import { exportToGLB, printMeshStats } from './lib/glb-exporter.mjs';

// =============================================================================
// Configuration
// =============================================================================

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../..');
const DEFAULT_OUTPUT_DIR = resolve(PROJECT_ROOT, 'public/models/human');

// Mesh names must match what HumanLayer.js expects
const MESH_NAMES = {
  body: 'Body',
  veins: 'Veins',
  brain: 'Brain',
  heart: 'Heart',
};

const POSES = ['open', 'closed'];

// =============================================================================
// Argument Parsing
// =============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    pose: null,      // Generate all poses by default
    part: null,      // Generate all parts by default
    output: DEFAULT_OUTPUT_DIR,
    stats: false,
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
  --pose <name>    Generate only specific pose (open, closed)
  --part <name>    Generate only specific part (body, veins, brain, heart)
  --output <dir>   Output directory (default: public/models/human)
  --stats          Print detailed statistics
  --help           Show this help

Examples:
  # Generate all models
  node scripts/node/generate-models.mjs

  # Generate only open pose
  node scripts/node/generate-models.mjs --pose open

  # Generate only body part for both poses
  node scripts/node/generate-models.mjs --part body

  # Generate with statistics
  node scripts/node/generate-models.mjs --stats
`);
}

// =============================================================================
// Model Generation
// =============================================================================

/**
 * Generate all body parts for a given pose
 * @param {string} pose - 'open' or 'closed'
 * @param {string|null} partFilter - If set, only generate this part
 * @returns {Object.<string, GeometryData>}
 */
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
    
    // Use the expected mesh name
    parts[MESH_NAMES[key]] = geometry;
  }
  
  return parts;
}

/**
 * Generate and export a model for a given pose
 * @param {string} pose 
 * @param {string} outputDir 
 * @param {object} options
 */
async function generateModel(pose, outputDir, options) {
  console.log(`\nGenerating pose: ${pose}`);
  console.log('─'.repeat(40));
  
  // Generate all parts
  const meshes = generateParts(pose, options.part);
  
  // Print statistics if requested
  if (options.stats) {
    printMeshStats(meshes);
  }
  
  // Export to GLB
  const filePath = resolve(outputDir, `pose-${pose}.glb`);
  
  console.log(`\nExporting to GLB...`);
  await exportToGLB(meshes, filePath, {
    optimize: true,
    generator: 'music-visualisation-3d procedural generator v1.0',
  });
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const options = parseArgs();
  
  if (options.help) {
    printHelp();
    return;
  }
  
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Human Model Generator                    ║');
  console.log('║   Music Visualisation 3D                   ║');
  console.log('╚════════════════════════════════════════════╝');
  
  console.log(`\nOutput directory: ${options.output}`);
  
  const poses = options.pose ? [options.pose] : POSES;
  const startTime = performance.now();
  
  for (const pose of poses) {
    await generateModel(pose, options.output, options);
  }
  
  const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   Generation Complete!                     ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`\nTotal time: ${totalTime}s`);
  console.log(`\nGenerated files:`);
  
  for (const pose of poses) {
    console.log(`  - ${options.output}/pose-${pose}.glb`);
  }
  
  console.log('\nNext steps:');
  console.log('  1. Run "npm run validate-models" to verify the GLB files');
  console.log('  2. Run "npm run dev" to test in the application');
}

// Run
main().catch((err) => {
  console.error('\nError:', err.message);
  console.error(err.stack);
  process.exit(1);
});

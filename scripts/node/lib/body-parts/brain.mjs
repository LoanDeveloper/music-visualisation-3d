/**
 * Brain Part Generator
 * Creates a detailed brain geometry using perturbed icospheres.
 * Includes cerebrum hemispheres and cerebellum.
 */

import {
  createIcosphere,
  createEllipsoid,
  mergeGeometries,
  transformGeometry,
  composeMatrix,
  perturbVertices,
} from '../geometry-builder.mjs';

// =============================================================================
// Configuration
// =============================================================================

const BRAIN_CONFIG = {
  // Position in head (relative to body coords, head center at y=1.0)
  position: [0, 1.02, 0.01],
  
  // Cerebrum (main brain hemispheres)
  cerebrum: {
    radius: 0.07,
    subdivisions: 4,  // High detail for organic look
    separation: 0.015, // Gap between hemispheres
    // Scaling to make it more brain-shaped (wider, flatter)
    scale: [1.1, 0.85, 1.0],
  },
  
  // Cerebellum (back lower part)
  cerebellum: {
    radius: 0.035,
    subdivisions: 3,
    position: [0, -0.04, -0.03], // Relative to brain center
    scale: [1.2, 0.7, 0.9],
  },
  
  // Brain stem
  brainstem: {
    radius: 0.015,
    rx: 0.8,
    ry: 2.0,
    rz: 0.8,
    segments: 16,
    position: [0, -0.06, -0.01],
  },
  
  // Surface perturbation for wrinkled appearance
  perturbation: {
    amplitude: 0.008,
    frequency: 8,
    seed: 42,
  },
  
  // Gyri (brain folds) - additional perturbation layers
  gyri: {
    amplitude: 0.004,
    frequency: 15,
    seed: 123,
  },
};

// =============================================================================
// Brain Creation Functions
// =============================================================================

/**
 * Create a brain hemisphere with perturbation
 * @param {string} side - 'left' or 'right'
 */
function createHemisphere(side) {
  const cfg = BRAIN_CONFIG.cerebrum;
  const isLeft = side === 'left';
  const xSign = isLeft ? -1 : 1;
  
  // Create base icosphere
  const hemisphere = createIcosphere({
    radius: cfg.radius,
    subdivisions: cfg.subdivisions,
  });
  
  // Apply first perturbation layer (major folds)
  perturbVertices(hemisphere, {
    amplitude: BRAIN_CONFIG.perturbation.amplitude,
    frequency: BRAIN_CONFIG.perturbation.frequency,
    seed: BRAIN_CONFIG.perturbation.seed + (isLeft ? 0 : 1000),
  });
  
  // Apply second perturbation layer (gyri - smaller wrinkles)
  perturbVertices(hemisphere, {
    amplitude: BRAIN_CONFIG.gyri.amplitude,
    frequency: BRAIN_CONFIG.gyri.frequency,
    seed: BRAIN_CONFIG.gyri.seed + (isLeft ? 0 : 1000),
  });
  
  // Flatten the inner side (where hemispheres meet)
  const positions = hemisphere.positions;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    
    // Compress points near the center line
    if ((isLeft && x > -cfg.separation) || (!isLeft && x < cfg.separation)) {
      const factor = 0.3; // How much to flatten
      if (isLeft) {
        positions[i] = Math.min(x, -cfg.separation * 0.5) * factor + x * (1 - factor);
      } else {
        positions[i] = Math.max(x, cfg.separation * 0.5) * factor + x * (1 - factor);
      }
    }
  }
  
  // Transform: scale to brain shape and position
  const xOffset = xSign * cfg.separation;
  transformGeometry(hemisphere, composeMatrix({
    position: [xOffset, 0, 0],
    scale: cfg.scale,
  }));
  
  return hemisphere;
}

/**
 * Create the cerebellum (lower back brain)
 */
function createCerebellum() {
  const cfg = BRAIN_CONFIG.cerebellum;
  
  // Create base icosphere
  const cerebellum = createIcosphere({
    radius: cfg.radius,
    subdivisions: cfg.subdivisions,
  });
  
  // Apply perturbation for folded texture
  perturbVertices(cerebellum, {
    amplitude: 0.003,
    frequency: 12,
    seed: 789,
  });
  
  // Transform
  transformGeometry(cerebellum, composeMatrix({
    position: cfg.position,
    scale: cfg.scale,
  }));
  
  return cerebellum;
}

/**
 * Create the brain stem
 */
function createBrainstem() {
  const cfg = BRAIN_CONFIG.brainstem;
  
  const brainstem = createEllipsoid({
    radius: cfg.radius,
    rx: cfg.rx,
    ry: cfg.ry,
    rz: cfg.rz,
    segments: cfg.segments,
  });
  
  transformGeometry(brainstem, composeMatrix({
    position: cfg.position,
  }));
  
  return brainstem;
}

/**
 * Add corpus callosum (connection between hemispheres)
 */
function createCorpusCallosum() {
  const callosum = createEllipsoid({
    radius: 0.02,
    rx: 0.5,
    ry: 0.3,
    rz: 1.5,
    segments: 12,
  });
  
  transformGeometry(callosum, composeMatrix({
    position: [0, -0.01, 0.01],
  }));
  
  return callosum;
}

// =============================================================================
// Main Export
// =============================================================================

/**
 * Create complete brain geometry
 * @param {string} _pose - Pose (unused for brain, but kept for API consistency)
 * @returns {GeometryData}
 */
export function createBrain(_pose = 'open') {
  const parts = [];
  
  // Create hemispheres
  parts.push(createHemisphere('left'));
  parts.push(createHemisphere('right'));
  
  // Create cerebellum
  parts.push(createCerebellum());
  
  // Create brain stem
  parts.push(createBrainstem());
  
  // Create corpus callosum
  parts.push(createCorpusCallosum());
  
  // Merge all parts
  const brain = mergeGeometries(parts);
  
  // Position in head
  const pos = BRAIN_CONFIG.position;
  for (let i = 0; i < brain.positions.length; i += 3) {
    brain.positions[i] += pos[0];
    brain.positions[i + 1] += pos[1];
    brain.positions[i + 2] += pos[2];
  }
  
  // Apply body offset (to match body.mjs which moves feet to y=0)
  // Body's head is at y=1.0, but body moves everything up by ~0.07
  const yOffset = 0.07;
  for (let i = 1; i < brain.positions.length; i += 3) {
    brain.positions[i] += yOffset;
  }
  
  return brain;
}

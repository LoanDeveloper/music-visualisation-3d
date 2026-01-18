import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  HUMAN_PRESETS,
  DEFAULT_PRESET,
  DEFAULT_POSE,
  POSES,
  REQUIRED_MESHES,
  SMOOTHING_FACTOR,
  EDGE_THRESHOLD_ANGLE,
  POSE_CROSSFADE_DURATION,
  getHumanPreset,
} from '../utils/humanPresets';

/**
 * HumanLayer class
 * Manages 3D human outline visualization with GLB loading,
 * line extraction, preset-driven animations, and pose switching.
 * 
 * Designed for allocation-free render loop.
 */
class HumanLayer {
  constructor(scene) {
    this.scene = scene;
    
    // State
    this.enabled = false;
    this.presetId = DEFAULT_PRESET;
    this.currentPose = DEFAULT_POSE;
    this.targetPose = DEFAULT_POSE;
    this.poseBlend = 1.0; // 1.0 = fully on currentPose
    
    // Smoothed frequency bands (allocation-free updates)
    this.sb = 0; // smoothed bass
    this.sm = 0; // smoothed mid
    this.sh = 0; // smoothed high
    
    // Loading state
    this.isLoading = false;
    this.loadError = null;
    this.modelsLoaded = {
      open: false,
      closed: false,
    };
    
    // GLB loader
    this.loader = new GLTFLoader();
    
    // Pose groups (container for each pose's line objects)
    this.poseGroups = {
      open: null,
      closed: null,
    };
    
    // Materials per layer per pose
    // Structure: { open: { body: Material, veins: Material, ... }, closed: { ... } }
    this.materials = {
      open: {},
      closed: {},
    };
    
    // Layer visibility tracking per pose
    // Structure: { open: { body: true, veins: true, ... }, closed: { ... } }
    this.layerAvailable = {
      open: {},
      closed: {},
    };
    
    // Heart mesh references for scaling (per pose)
    this.heartGroups = {
      open: null,
      closed: null,
    };
    
    // Veins flow phase (for optional shader animation)
    this.veinsFlowPhase = 0;
    
    // Warning deduplication
    this.warnedOnce = new Set();
    
    // Main container group (added to scene when enabled)
    this.mainGroup = new THREE.Group();
    this.mainGroup.visible = false;
    
    // Crossfade timing
    this.crossfadeStartTime = 0;
    this.isCrossfading = false;
  }
  
  /**
   * Warn once helper (deduplicate console warnings)
   * @param {string} key - Unique warning key
   * @param {string} message - Warning message
   */
  warnOnce(key, message) {
    if (!this.warnedOnce.has(key)) {
      console.warn(`[HumanLayer] ${message}`);
      this.warnedOnce.add(key);
    }
  }
  
  /**
   * Enable the human layer
   * Triggers lazy loading of models if not already loaded.
   */
  async setEnabled(enabled) {
    this.enabled = enabled;
    
    if (enabled) {
      // Lazy load models if not already loaded
      if (!this.modelsLoaded[this.currentPose]) {
        await this.loadPose(this.currentPose);
      }
      
      // Add main group to scene if not already
      if (!this.mainGroup.parent) {
        this.scene.add(this.mainGroup);
      }
      
      this.mainGroup.visible = true;
    } else {
      this.mainGroup.visible = false;
    }
    
    return !this.loadError;
  }
  
  /**
   * Set the current preset
   * @param {string} presetId - Preset ID from HUMAN_PRESETS
   */
  setPreset(presetId) {
    if (HUMAN_PRESETS[presetId]) {
      this.presetId = presetId;
    } else {
      this.warnOnce(`preset-${presetId}`, `Unknown preset: ${presetId}`);
    }
  }
  
  /**
   * Set the current pose with crossfade
   * @param {string} poseId - 'open' or 'closed'
   */
  async setPose(poseId) {
    if (!POSES[poseId]) {
      this.warnOnce(`pose-${poseId}`, `Unknown pose: ${poseId}`);
      return;
    }
    
    if (poseId === this.currentPose && !this.isCrossfading) {
      return; // Already at this pose
    }
    
    // Load target pose if not loaded
    if (!this.modelsLoaded[poseId]) {
      await this.loadPose(poseId);
    }
    
    if (!this.modelsLoaded[poseId]) {
      return; // Failed to load
    }
    
    // Start crossfade
    this.targetPose = poseId;
    this.crossfadeStartTime = performance.now();
    this.isCrossfading = true;
    
    // Make target pose visible (for crossfade)
    if (this.poseGroups[poseId]) {
      this.poseGroups[poseId].visible = true;
    }
  }
  
  /**
   * Load a pose's GLB model
   * @param {string} poseId - 'open' or 'closed'
   */
  async loadPose(poseId) {
    const pose = POSES[poseId];
    if (!pose) return;
    
    if (this.isLoading) return;
    this.isLoading = true;
    
    try {
      const gltf = await new Promise((resolve, reject) => {
        this.loader.load(
          pose.modelPath,
          resolve,
          undefined,
          reject
        );
      });
      
      // Create pose group
      const poseGroup = new THREE.Group();
      poseGroup.name = `human-pose-${poseId}`;
      
      // Process each required mesh
      for (const meshName of REQUIRED_MESHES) {
        const mesh = this.findMeshByName(gltf.scene, meshName);
        
        if (!mesh) {
          this.warnOnce(`mesh-${poseId}-${meshName}`, `Missing mesh "${meshName}" in ${poseId} pose. Layer disabled.`);
          this.layerAvailable[poseId][meshName.toLowerCase()] = false;
          continue;
        }
        
        // Create EdgesGeometry from mesh
        const edgesGeometry = new THREE.EdgesGeometry(
          mesh.geometry,
          EDGE_THRESHOLD_ANGLE
        );
        
        // Create material (white lines, matrix vibe)
        const material = new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.5,
          depthTest: true,
          depthWrite: false,
        });
        
        // Create LineSegments
        const lineSegments = new THREE.LineSegments(edgesGeometry, material);
        lineSegments.name = `${meshName}-lines`;
        
        // Copy transform from original mesh
        lineSegments.position.copy(mesh.position);
        lineSegments.rotation.copy(mesh.rotation);
        lineSegments.scale.copy(mesh.scale);
        
        // Store material reference
        this.materials[poseId][meshName.toLowerCase()] = material;
        this.layerAvailable[poseId][meshName.toLowerCase()] = true;
        
        // Store heart group reference for scaling
        if (meshName === 'Heart') {
          // Wrap in a group for easy scaling
          const heartGroup = new THREE.Group();
          heartGroup.add(lineSegments);
          this.heartGroups[poseId] = heartGroup;
          poseGroup.add(heartGroup);
        } else {
          poseGroup.add(lineSegments);
        }
      }
      
      // Store pose group
      this.poseGroups[poseId] = poseGroup;
      poseGroup.visible = poseId === this.currentPose;
      this.mainGroup.add(poseGroup);
      
      this.modelsLoaded[poseId] = true;
      this.loadError = null;
      
      console.log(`[HumanLayer] Loaded pose: ${poseId}`);
      
    } catch (error) {
      this.warnOnce(`load-${poseId}`, `Failed to load ${pose.modelPath}: ${error.message}`);
      this.loadError = error;
      this.modelsLoaded[poseId] = false;
    } finally {
      this.isLoading = false;
    }
  }
  
  /**
   * Find a mesh by name in a GLTF scene (recursive)
   * @param {THREE.Object3D} root 
   * @param {string} name 
   * @returns {THREE.Mesh|null}
   */
  findMeshByName(root, name) {
    let found = null;
    root.traverse((child) => {
      if (child.isMesh && child.name === name) {
        found = child;
      }
    });
    return found;
  }
  
  /**
   * Update frequency bands (called every frame when enabled)
   * Applies smoothing and updates visual parameters.
   * 
   * @param {number} bass - Raw bass value 0-1
   * @param {number} mid - Raw mid value 0-1
   * @param {number} high - Raw high value 0-1
   */
  updateFrequencyBands(bass, mid, high) {
    if (!this.enabled) return;
    
    // Apply smoothing (allocation-free)
    this.sb = this.sb + (bass - this.sb) * SMOOTHING_FACTOR;
    this.sm = this.sm + (mid - this.sm) * SMOOTHING_FACTOR;
    this.sh = this.sh + (high - this.sh) * SMOOTHING_FACTOR;
    
    // Handle crossfade
    this.updateCrossfade();
    
    // Get current preset
    const preset = getHumanPreset(this.presetId);
    if (!preset) return;
    
    // Compute layer parameters from preset
    const params = preset.compute(this.sb, this.sm, this.sh);
    
    // Update veins flow phase
    this.veinsFlowPhase += params.veinsFlowSpeed * 0.016; // ~60fps
    
    // Apply parameters to both poses (for crossfade)
    this.applyParams(params, 'open');
    this.applyParams(params, 'closed');
    
    // Apply crossfade opacities
    this.applyCrossfadeOpacity();
  }
  
  /**
   * Apply computed parameters to a pose's materials
   * @param {object} params - Computed preset parameters
   * @param {string} poseId - 'open' or 'closed'
   */
  applyParams(params, poseId) {
    const materials = this.materials[poseId];
    const available = this.layerAvailable[poseId];
    
    // Body
    if (available.body && materials.body) {
      materials.body.opacity = params.bodyOpacity;
    }
    
    // Veins
    if (available.veins && materials.veins) {
      materials.veins.opacity = params.veinsOpacity;
      // Optional: could add flow shader uniform here
    }
    
    // Brain
    if (available.brain && materials.brain) {
      materials.brain.opacity = params.brainOpacity;
    }
    
    // Heart
    if (available.heart && materials.heart) {
      materials.heart.opacity = params.heartOpacity;
    }
    
    // Heart scale
    if (this.heartGroups[poseId]) {
      this.heartGroups[poseId].scale.setScalar(params.heartScale);
    }
  }
  
  /**
   * Update crossfade state
   */
  updateCrossfade() {
    if (!this.isCrossfading) return;
    
    const elapsed = (performance.now() - this.crossfadeStartTime) / 1000;
    const t = Math.min(elapsed / POSE_CROSSFADE_DURATION, 1.0);
    
    // Smooth easing
    this.poseBlend = 1.0 - this.easeInOutCubic(t);
    
    if (t >= 1.0) {
      // Crossfade complete
      this.isCrossfading = false;
      
      // Hide old pose
      if (this.poseGroups[this.currentPose] && this.currentPose !== this.targetPose) {
        this.poseGroups[this.currentPose].visible = false;
      }
      
      this.currentPose = this.targetPose;
      this.poseBlend = 1.0;
    }
  }
  
  /**
   * Apply crossfade opacity to both poses
   */
  applyCrossfadeOpacity() {
    if (!this.isCrossfading) return;
    
    const currentOpacity = this.poseBlend;
    const targetOpacity = 1.0 - this.poseBlend;
    
    // Scale all materials in current pose
    this.scalePoseMaterialOpacity(this.currentPose, currentOpacity);
    
    // Scale all materials in target pose
    this.scalePoseMaterialOpacity(this.targetPose, targetOpacity);
  }
  
  /**
   * Scale a pose's material opacities by a factor
   * @param {string} poseId 
   * @param {number} factor - 0 to 1
   */
  scalePoseMaterialOpacity(poseId, factor) {
    const materials = this.materials[poseId];
    if (!materials) return;
    
    for (const key of Object.keys(materials)) {
      if (materials[key]) {
        // Store base opacity if not during crossfade
        if (!this._baseOpacity) {
          this._baseOpacity = {};
        }
        if (!this._baseOpacity[poseId]) {
          this._baseOpacity[poseId] = {};
        }
        
        // During crossfade, scale the current opacity
        materials[key].opacity *= factor;
      }
    }
  }
  
  /**
   * Easing function for smooth crossfade
   * @param {number} t - 0 to 1
   * @returns {number}
   */
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  /**
   * Get current state for UI
   * @returns {object}
   */
  getState() {
    return {
      enabled: this.enabled,
      presetId: this.presetId,
      pose: this.currentPose,
      isLoading: this.isLoading,
      hasError: !!this.loadError,
      modelsLoaded: { ...this.modelsLoaded },
    };
  }
  
  /**
   * Dispose all resources
   */
  dispose() {
    // Remove from scene
    if (this.mainGroup.parent) {
      this.scene.remove(this.mainGroup);
    }
    
    // Dispose pose groups
    for (const poseId of Object.keys(this.poseGroups)) {
      const group = this.poseGroups[poseId];
      if (group) {
        group.traverse((child) => {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            child.material.dispose();
          }
        });
      }
    }
    
    // Clear references
    this.poseGroups = { open: null, closed: null };
    this.materials = { open: {}, closed: {} };
    this.heartGroups = { open: null, closed: null };
    this.layerAvailable = { open: {}, closed: {} };
    this.modelsLoaded = { open: false, closed: false };
    
    console.log('[HumanLayer] Disposed');
  }
}

export default HumanLayer;

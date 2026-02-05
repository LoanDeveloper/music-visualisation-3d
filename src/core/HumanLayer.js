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
    
    // Target height in world units (matches particle cloud scale)
    this.targetHeight = 180;
    this.hasScaled = false;
    
    // Position at origin (pose groups are centered during load)
    this.mainGroup.position.set(0, 0, 0);
    
    // Flow field (music traveling through the body)
    this.flowFields = { open: null, closed: null };
    this.flowBaseOpacity = { open: 0, closed: 0 };
    this.flowTime = 0;

    // Body opacity control (keeps white edges visible)
    this.bodyOpacity = 1.0;
    this.lineOpacity = 1.0;
    this.flowOpacity = 1.0;
    this.humanOpacity = 1.0;
    this.bodyMinVisible = 0.25;
    this.bodyOutlineMin = 0.72;
    this.layerMinVisible = {
      veins: 0.04,
      brain: 0.03,
      heart: 0.05,
    };
    
    // Crossfade timing
    this.crossfadeStartTime = 0;
    this.isCrossfading = false;
    
    // Cache for base opacities (used during crossfade)
    this.baseOpacity = { open: {}, closed: {} };
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
      this.refreshAppearance();
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
      this.refreshAppearance();
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

    // If crossfade is disabled, switch immediately to avoid double limbs
    if (POSE_CROSSFADE_DURATION <= 0) {
      if (this.poseGroups[this.currentPose]) {
        this.poseGroups[this.currentPose].visible = false;
      }
      if (this.poseGroups[poseId]) {
        this.poseGroups[poseId].visible = true;
      }
      this.currentPose = poseId;
      this.targetPose = poseId;
      this.poseBlend = 1.0;
      this.isCrossfading = false;
      return;
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
   * Check if a model file exists before loading
   * @param {string} url - Model URL
   * @returns {Promise<boolean>}
   */
  async checkModelExists(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
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
      // Check if model file exists first (avoids cryptic JSON.parse errors)
      const exists = await this.checkModelExists(pose.modelPath);
      if (!exists) {
        throw new Error(`Model file not found: ${pose.modelPath}`);
      }
      
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
      let bodyFound = false;
      for (const meshName of REQUIRED_MESHES) {
        const mesh = this.findMeshByName(gltf.scene, meshName);
        
        if (!mesh) {
          this.warnOnce(`mesh-${poseId}-${meshName}`, `Missing mesh "${meshName}" in ${poseId} pose. Layer disabled.`);
          this.layerAvailable[poseId][meshName.toLowerCase()] = false;
          continue;
        }
        
        if (meshName === 'Body') {
          bodyFound = true;
        }
        
        // Create EdgesGeometry from mesh
        const edgesGeometry = new THREE.EdgesGeometry(
          mesh.geometry,
          EDGE_THRESHOLD_ANGLE
        );
        
        // Create material (white lines, matrix vibe)
        // Higher base opacity for better visibility
        const material = new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.7,
          depthTest: true,
          depthWrite: false,
        });
        
        // Create LineSegments
        const lineSegments = new THREE.LineSegments(edgesGeometry, material);
        lineSegments.name = `${meshName}-lines`;
        lineSegments.renderOrder = 3;

        if (meshName === 'Body') {
          // Keep silhouette readable above particles at all times.
          material.depthTest = false;
          material.opacity = 0.9;
          lineSegments.renderOrder = 20;
        }
        
        // Copy transform from original mesh
        lineSegments.position.copy(mesh.position);
        lineSegments.rotation.copy(mesh.rotation);
        lineSegments.scale.copy(mesh.scale);
        
        // Store material reference
        this.materials[poseId][meshName.toLowerCase()] = material;
        this.layerAvailable[poseId][meshName.toLowerCase()] = true;

        // Create stencil mask from Body mesh (for internal music only)
        if (meshName === 'Body') {
          const maskMaterial = new THREE.MeshBasicMaterial({
            colorWrite: false,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide,
            stencilWrite: true,
            stencilRef: 1,
            stencilFunc: THREE.AlwaysStencilFunc,
            stencilFail: THREE.KeepStencilOp,
            stencilZFail: THREE.KeepStencilOp,
            stencilZPass: THREE.ReplaceStencilOp,
          });
          const maskMesh = new THREE.Mesh(mesh.geometry, maskMaterial);
          maskMesh.name = `Body-mask-${poseId}`;
          maskMesh.position.copy(mesh.position);
          maskMesh.rotation.copy(mesh.rotation);
          maskMesh.scale.copy(mesh.scale);
          maskMesh.renderOrder = 1;
          poseGroup.add(maskMesh);
        }
        
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
      
      if (!bodyFound) {
        throw new Error(`Missing required mesh "Body" in ${poseId} pose.`);
      }

      // Store pose group
      this.poseGroups[poseId] = poseGroup;
      poseGroup.visible = poseId === this.currentPose;
      this.mainGroup.add(poseGroup);

      // Center pose group and scale main group once based on first loaded pose
      const bbox = new THREE.Box3().setFromObject(poseGroup);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      bbox.getSize(size);
      bbox.getCenter(center);

      // Center the pose around origin (so the body is properly aligned)
      poseGroup.position.set(-center.x, -center.y, -center.z);

      if (!this.hasScaled && size.y > 0) {
        const scale = this.targetHeight / size.y;
        this.mainGroup.scale.setScalar(scale);
        this.hasScaled = true;
      }

      // Create flow field inside the body (music traveling through)
      this.createFlowField(poseId, size);
      
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
    const flow = this.computeFlowParams(params, this.sb, this.sm, this.sh);
    this.flowTime += 0.016 * flow.speed;
    
    // Update veins flow phase
    this.veinsFlowPhase += params.veinsFlowSpeed * 0.016; // ~60fps
    
    // Apply parameters to both poses (for crossfade)
    this.applyParams(params, 'open');
    this.applyParams(params, 'closed');
    
    // Update flow field for both poses
    this.updateFlow(flow, 'open', this.flowTime);
    this.updateFlow(flow, 'closed', this.flowTime);
    
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
    const baseOpacity = this.baseOpacity[poseId];
    const globalOpacity = this.humanOpacity;
    const lineOpacity = this.lineOpacity;
    
    // Body
    if (available.body && materials.body) {
      const outlineFloor = this.bodyOutlineMin * globalOpacity * lineOpacity * (0.35 + 0.65 * this.bodyOpacity);
      const targetBody = this.clampOpacity(
        Math.max(
          Math.max(params.bodyOpacity, this.bodyMinVisible) *
            this.bodyOpacity *
            lineOpacity *
            globalOpacity,
          outlineFloor
        )
      );
      baseOpacity.body = targetBody;
      materials.body.opacity = targetBody;
    }
    
    // Veins
    if (available.veins && materials.veins) {
      const veinsOpacity = this.clampOpacity(
        Math.max(params.veinsOpacity, this.layerMinVisible.veins) *
          lineOpacity *
          globalOpacity
      );
      baseOpacity.veins = veinsOpacity;
      materials.veins.opacity = veinsOpacity;
      // Optional: could add flow shader uniform here
    }
    
    // Brain
    if (available.brain && materials.brain) {
      const brainOpacity = this.clampOpacity(
        Math.max(params.brainOpacity, this.layerMinVisible.brain) *
          lineOpacity *
          globalOpacity
      );
      baseOpacity.brain = brainOpacity;
      materials.brain.opacity = brainOpacity;
    }
    
    // Heart
    if (available.heart && materials.heart) {
      const heartOpacity = this.clampOpacity(
        Math.max(params.heartOpacity, this.layerMinVisible.heart) *
          lineOpacity *
          globalOpacity
      );
      baseOpacity.heart = heartOpacity;
      materials.heart.opacity = heartOpacity;
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
    const t = POSE_CROSSFADE_DURATION <= 0 ? 1.0 : Math.min(elapsed / POSE_CROSSFADE_DURATION, 1.0);
    
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
    
    // Scale flow field opacity
    this.scalePoseFlowOpacity(this.currentPose, currentOpacity);
    this.scalePoseFlowOpacity(this.targetPose, targetOpacity);
  }
  
  /**
   * Scale a pose's material opacities by a factor
   * @param {string} poseId 
   * @param {number} factor - 0 to 1
   */
  scalePoseMaterialOpacity(poseId, factor) {
    const materials = this.materials[poseId];
    const baseOpacity = this.baseOpacity[poseId];
    if (!materials) return;
    
    for (const key of Object.keys(materials)) {
      if (materials[key]) {
        const base = baseOpacity[key] ?? materials[key].opacity;
        materials[key].opacity = base * factor;
      }
    }
  }
  
  /**
   * Compute flow parameters based on audio
   */
  computeFlowParams(params, sb, sm, sh) {
    const intensity = Math.min(1, 0.2 + 0.9 * (0.5 * sb + 0.3 * sm + 0.2 * sh));
    const speed = 0.4 + 1.6 * (0.6 * sm + 0.4 * sb);
    const pulse = 0.08 + 0.2 * sh;
    return {
      intensity,
      speed,
      pulse,
      veinsBias: Math.min(1, params.veinsOpacity * 1.2),
    };
  }
  
  /**
   * Create flow points inside the body volume for a pose
   */
  createFlowField(poseId, size) {
    if (this.flowFields[poseId]) return;
    
    const pointCount = 1200;
    const positions = new Float32Array(pointCount * 3);
    const basePositions = new Float32Array(pointCount * 3);
    const phases = new Float32Array(pointCount);
    
    const halfX = size.x * 0.5;
    const halfY = size.y * 0.5;
    const halfZ = size.z * 0.5;
    
    for (let i = 0; i < pointCount; i++) {
      const i3 = i * 3;
      const x = (Math.random() * 2 - 1) * halfX * 0.6;
      const y = (Math.random() * 2 - 1) * halfY * 0.9;
      const z = (Math.random() * 2 - 1) * halfZ * 0.6;
      
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      
      basePositions[i3] = x;
      basePositions[i3 + 1] = y;
      basePositions[i3 + 2] = z;
      
      phases[i] = Math.random() * Math.PI * 2;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.2,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      stencilWrite: false,
      stencilTest: true,
      stencilRef: 1,
      stencilFunc: THREE.EqualStencilFunc,
      stencilFail: THREE.KeepStencilOp,
      stencilZFail: THREE.KeepStencilOp,
      stencilZPass: THREE.KeepStencilOp,
    });
    
    const points = new THREE.Points(geometry, material);
    points.name = `flow-points-${poseId}`;
    points.renderOrder = 2;
    
    this.flowFields[poseId] = {
      points,
      geometry,
      material,
      positions,
      basePositions,
      phases,
      minY: -halfY,
      maxY: halfY,
      sizeY: size.y,
    };
    
    // Attach to pose group
    if (this.poseGroups[poseId]) {
      this.poseGroups[poseId].add(points);
    }
  }
  
  /**
   * Update flow points (music traveling through the body)
   */
  updateFlow(flow, poseId, flowTime) {
    const field = this.flowFields[poseId];
    if (!field) return;
    
    const { positions, basePositions, phases, material, minY, maxY, sizeY } = field;
    const intensity = flow.intensity;
    const pulse = flow.pulse;
    
    const travel = (flowTime * sizeY) % sizeY;
    
    const count = phases.length;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      const baseX = basePositions[i3];
      const baseY = basePositions[i3 + 1];
      const baseZ = basePositions[i3 + 2];
      
      let y = baseY + travel;
      if (y > maxY) y = minY + (y - maxY);
      
      const wobble = 1 + intensity * 0.2 + Math.sin(flowTime + phases[i]) * pulse;
      
      positions[i3] = baseX * wobble;
      positions[i3 + 1] = y;
      positions[i3 + 2] = baseZ * wobble;
    }
    
    field.geometry.attributes.position.needsUpdate = true;
    
    const reactiveFlowOpacity = (0.18 + 0.62 * intensity) * this.flowOpacity * this.humanOpacity;
    const minFlowOpacity = 0.08 * this.flowOpacity * this.humanOpacity;
    const baseOpacity = this.clampOpacity(Math.max(reactiveFlowOpacity, minFlowOpacity));
    this.flowBaseOpacity[poseId] = baseOpacity;
    
    if (!this.isCrossfading) {
      material.opacity = baseOpacity;
    }
  }
  
  /**
   * Scale flow opacity during crossfade
   */
  scalePoseFlowOpacity(poseId, factor) {
    const field = this.flowFields[poseId];
    if (!field) return;
    
    const base = this.flowBaseOpacity[poseId] ?? field.material.opacity;
    field.material.opacity = base * factor;
  }

  /**
   * Set global body opacity multiplier
   * @param {number} value - 0 to 1
   */
  setBodyOpacity(value) {
    this.bodyOpacity = Math.max(0, Math.min(1, value));
    this.refreshAppearance();
  }

  /**
   * Set global human layer opacity multiplier
   * @param {number} value - 0 to 1
   */
  setHumanOpacity(value) {
    this.humanOpacity = Math.max(0, Math.min(1, value));
    this.refreshAppearance();
  }

  /**
   * Set global line opacity multiplier
   * @param {number} value - 0 to 1
   */
  setLineOpacity(value) {
    this.lineOpacity = Math.max(0, Math.min(1, value));
    this.refreshAppearance();
  }

  /**
   * Set flow opacity multiplier
   * @param {number} value - 0 to 1
   */
  setFlowOpacity(value) {
    this.flowOpacity = Math.max(0, Math.min(1, value));
    this.refreshAppearance();
  }

  /**
   * Clamp opacity for material safety
   * @param {number} value
   * @returns {number}
   */
  clampOpacity(value) {
    return Math.max(0, Math.min(1, value));
  }

  /**
   * Re-apply current preset/opacities immediately (without waiting next frame)
   */
  refreshAppearance() {
    if (!this.enabled) return;

    const preset = getHumanPreset(this.presetId);
    if (!preset) return;

    const params = preset.compute(this.sb, this.sm, this.sh);
    this.applyParams(params, 'open');
    this.applyParams(params, 'closed');

    const flow = this.computeFlowParams(params, this.sb, this.sm, this.sh);
    this.updateFlow(flow, 'open', this.flowTime);
    this.updateFlow(flow, 'closed', this.flowTime);

    if (this.isCrossfading) {
      this.applyCrossfadeOpacity();
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
    this.flowFields = { open: null, closed: null };
    
    console.log('[HumanLayer] Disposed');
  }
}

export default HumanLayer;

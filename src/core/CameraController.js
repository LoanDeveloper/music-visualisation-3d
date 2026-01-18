import * as THREE from 'three';

/**
 * CameraController class
 * Handles mouse and touch-based camera rotation and zoom
 */
class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Camera rotation state
    this.isRotating = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.rotation = { x: 0, y: 0 };

    // Camera position (spherical coordinates)
    this.distance = 300;
    this.minDistance = 100;
    this.maxDistance = 500;

    // Rotation constraints
    this.minPolarAngle = 0; // radians
    this.maxPolarAngle = Math.PI; // radians

    // Damping
    this.dampingFactor = 0.1;
    this.targetRotation = { x: 0, y: 0 };

    // Auto-rotation
    this.autoRotate = false;
    this.autoRotateSpeed = 0.5;

    // Sensitivity
    this.rotationSpeed = 0.005;
    this.zoomSpeed = 0.1;

    // Bind event handlers
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);

    // Cursor timeout reference
    this.cursorTimeout = null;

    // Initialize
    this.addEventListeners();
    this.updateCameraPosition();

    // Set default cursor
    this.domElement.style.cursor = 'grab';
  }

  addEventListeners() {
    this.domElement.addEventListener('mousedown', this.onMouseDown);
    this.domElement.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('mouseup', this.onMouseUp);
    this.domElement.addEventListener('wheel', this.onWheel);

    // Touch events
    this.domElement.addEventListener('touchstart', this.onTouchStart);
    this.domElement.addEventListener('touchmove', this.onTouchMove);
    this.domElement.addEventListener('touchend', this.onTouchEnd);
  }

  removeEventListeners() {
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('mouseup', this.onMouseUp);
    this.domElement.removeEventListener('wheel', this.onWheel);

    this.domElement.removeEventListener('touchstart', this.onTouchStart);
    this.domElement.removeEventListener('touchmove', this.onTouchMove);
    this.domElement.removeEventListener('touchend', this.onTouchEnd);
  }

  onMouseDown(event) {
    this.isRotating = true;
    this.previousMousePosition = {
      x: event.clientX,
      y: event.clientY,
    };
    this.domElement.style.cursor = 'grabbing';
  }

  onMouseMove(event) {
    if (!this.isRotating) return;

    const deltaX = event.clientX - this.previousMousePosition.x;
    const deltaY = event.clientY - this.previousMousePosition.y;

    this.targetRotation.y += deltaX * this.rotationSpeed;
    this.targetRotation.x += deltaY * this.rotationSpeed;

    // Clamp vertical rotation
    this.targetRotation.x = Math.max(
      this.minPolarAngle - Math.PI / 2,
      Math.min(this.maxPolarAngle - Math.PI / 2, this.targetRotation.x)
    );

    this.previousMousePosition = {
      x: event.clientX,
      y: event.clientY,
    };
  }

  onMouseUp() {
    this.isRotating = false;
    this.domElement.style.cursor = 'grab';
  }

  onWheel(event) {
    event.preventDefault();

    const delta = event.deltaY * this.zoomSpeed;
    this.distance = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.distance + delta)
    );

    // Update cursor based on zoom direction
    if (event.deltaY < 0) {
      // Zoom in
      this.domElement.style.cursor = 'zoom-in';
    } else {
      // Zoom out
      this.domElement.style.cursor = 'zoom-out';
    }

    // Reset cursor after a short delay
    clearTimeout(this.cursorTimeout);
    this.cursorTimeout = setTimeout(() => {
      this.domElement.style.cursor = 'grab';
    }, 150);
  }

  onTouchStart(event) {
    if (event.touches.length === 1) {
      event.preventDefault();
      this.isRotating = true;
      this.previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    }
  }

  onTouchMove(event) {
    if (event.touches.length === 1 && this.isRotating) {
      event.preventDefault();

      const deltaX = event.touches[0].clientX - this.previousMousePosition.x;
      const deltaY = event.touches[0].clientY - this.previousMousePosition.y;

      this.targetRotation.y += deltaX * this.rotationSpeed;
      this.targetRotation.x += deltaY * this.rotationSpeed;

      // Clamp vertical rotation
      this.targetRotation.x = Math.max(
        this.minPolarAngle - Math.PI / 2,
        Math.min(this.maxPolarAngle - Math.PI / 2, this.targetRotation.x)
      );

      this.previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    }
  }

  onTouchEnd() {
    this.isRotating = false;
  }

  updateCameraPosition() {
    // Convert spherical to Cartesian coordinates
    const x = this.distance * Math.sin(Math.PI / 2 + this.rotation.x) * Math.cos(this.rotation.y);
    const y = this.distance * Math.cos(Math.PI / 2 + this.rotation.x);
    const z = this.distance * Math.sin(Math.PI / 2 + this.rotation.x) * Math.sin(this.rotation.y);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  update() {
    // Apply damping
    this.rotation.x += (this.targetRotation.x - this.rotation.x) * this.dampingFactor;
    this.rotation.y += (this.targetRotation.y - this.rotation.y) * this.dampingFactor;

    // Auto-rotation
    if (this.autoRotate && !this.isRotating) {
      this.targetRotation.y += this.autoRotateSpeed * 0.01;
    }

    this.updateCameraPosition();
  }

  setAutoRotate(enabled) {
    this.autoRotate = enabled;
  }

  reset() {
    this.targetRotation = { x: 0, y: 0 };
    this.rotation = { x: 0, y: 0 };
    this.distance = 300;
    this.updateCameraPosition();
  }

  destroy() {
    this.removeEventListeners();
    clearTimeout(this.cursorTimeout);
  }
}

export default CameraController;

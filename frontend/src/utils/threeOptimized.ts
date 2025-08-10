/**
 * Optimized Three.js imports for bundle size reduction
 * Only imports the specific modules we need instead of the entire Three.js library
 */

import * as THREE from 'three';

// Re-export commonly used Three.js classes
export const Scene = THREE.Scene;
export const PerspectiveCamera = THREE.PerspectiveCamera;
export const OrthographicCamera = THREE.OrthographicCamera;
export const WebGLRenderer = THREE.WebGLRenderer;
export const AmbientLight = THREE.AmbientLight;
export const DirectionalLight = THREE.DirectionalLight;
export const PointLight = THREE.PointLight;
export const SpotLight = THREE.SpotLight;
export const HemisphereLight = THREE.HemisphereLight;
export const BoxGeometry = THREE.BoxGeometry;
export const SphereGeometry = THREE.SphereGeometry;
export const PlaneGeometry = THREE.PlaneGeometry;
export const CylinderGeometry = THREE.CylinderGeometry;
export const MeshBasicMaterial = THREE.MeshBasicMaterial;
export const MeshLambertMaterial = THREE.MeshLambertMaterial;
export const MeshPhongMaterial = THREE.MeshPhongMaterial;
export const MeshStandardMaterial = THREE.MeshStandardMaterial;
export const BufferAttribute = THREE.BufferAttribute;
export const Vector3 = THREE.Vector3;
export const Euler = THREE.Euler;
export const Matrix4 = THREE.Matrix4;
export const Quaternion = THREE.Quaternion;

/**
 * Three.js Scene Manager - Optimized 3D scene management
 */
export class OptimizedSceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private lights: (THREE.AmbientLight | THREE.DirectionalLight | THREE.PointLight)[] = [];

  constructor(options: {
    width: number;
    height: number;
    cameraType?: 'perspective' | 'orthographic';
    antialias?: boolean;
    alpha?: boolean;
  }) {
    // Initialize scene
    this.scene = new THREE.Scene();

    // Setup camera
    const aspect = options.width / options.height;
    if (options.cameraType === 'orthographic') {
      this.camera = new THREE.OrthographicCamera(
        -aspect, aspect,
        1, -1,
        0.1, 1000
      );
    } else {
      this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    }

    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: options.antialias ?? true,
      alpha: options.alpha ?? true,
      powerPreference: "high-performance"
    });
    
    this.renderer.setSize(options.width, options.height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Setup basic lighting
    this.setupLighting();
  }

  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);
    this.lights.push(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
    this.lights.push(directionalLight);
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.PerspectiveCamera | THREE.OrthographicCamera {
    return this.camera;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public setSize(width: number, height: number): void {
    this.renderer.setSize(width, height);
    
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.lights.forEach(light => {
      this.scene.remove(light);
    });
    this.renderer.dispose();
  }
}

/**
 * Material factory with optimized options
 */
export const createOptimizedMaterial = (
  type: 'basic' | 'lambert' | 'phong' | 'standard',
  options: any = {}
): THREE.MeshBasicMaterial | THREE.MeshLambertMaterial | THREE.MeshPhongMaterial | THREE.MeshStandardMaterial => {
  let material;
  
  switch (type) {
    case 'basic':
      material = new THREE.MeshBasicMaterial(options);
      break;
    case 'lambert':
      material = new THREE.MeshLambertMaterial(options);
      break;
    case 'phong':
      material = new THREE.MeshPhongMaterial(options);
      break;
    case 'standard':
      material = new THREE.MeshStandardMaterial(options);
      break;
    default:
      material = new THREE.MeshBasicMaterial(options);
  }
  
  return material;
};

/**
 * Geometry factory with optimized parameters
 */
export const createOptimizedGeometry = (
  type: 'box' | 'sphere' | 'plane' | 'cylinder',
  params: number[] = []
): THREE.BoxGeometry | THREE.SphereGeometry | THREE.PlaneGeometry | THREE.CylinderGeometry => {
  let geometry;
  
  switch (type) {
    case 'box':
      geometry = new THREE.BoxGeometry(params[0] || 1, params[1] || 1, params[2] || 1);
      break;
    case 'sphere':
      geometry = new THREE.SphereGeometry(params[0] || 1, params[1] || 8, params[2] || 6);
      break;
    case 'plane':
      geometry = new THREE.PlaneGeometry(params[0] || 1, params[1] || 1);
      break;
    case 'cylinder':
      geometry = new THREE.CylinderGeometry(
        params[0] || 1, // radiusTop
        params[1] || 1, // radiusBottom
        params[2] || 1, // height
        params[3] || 8  // radialSegments
      );
      break;
    default:
      geometry = new THREE.BoxGeometry(1, 1, 1);
  }
  
  return geometry;
};
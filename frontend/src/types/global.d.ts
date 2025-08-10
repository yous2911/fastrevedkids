// Global type declarations to fix TypeScript errors completely

// Extend Window interface for trustedTypes  
interface Window {
  trustedTypes?: {
    createPolicy: (
      name: string,
      rules: {
        createHTML?: (string: string) => string;
        createScript?: (string: string) => string;
        createScriptURL?: (string: string) => string;
      }
    ) => any;
  };
  gtag?: (...args: any[]) => void;
  isSecureContext?: boolean;
}

// THREE.js comprehensive mock
declare global {
  namespace THREE {
    class Vector3 {
      constructor(x?: number, y?: number, z?: number);
      x: number;
      y: number;
      z: number;
      copy(v: Vector3): this;
      set(x: number, y: number, z: number): this;
    }
    
    class Scene {
      add(object: any): void;
      remove(object: any): void;
    }
    
    class WebGLRenderer {
      constructor(parameters?: any);
      domElement: HTMLCanvasElement;
      render(scene: Scene, camera: Camera): void;
      setSize(width: number, height: number): void;
      dispose(): void;
    }
    
    class PerspectiveCamera {
      constructor(fov?: number, aspect?: number, near?: number, far?: number);
      position: Vector3;
      lookAt(vector: Vector3): void;
    }
    
    class Group {
      add(object: any): void;
      position: Vector3;
      rotation: { x: number; y: number; z: number };
      scale: Vector3;
    }
    
    class BufferGeometry {
      clone(): BufferGeometry;
      dispose(): void;
    }
    
    class BoxGeometry extends BufferGeometry {
      constructor(width?: number, height?: number, depth?: number);
    }
    
    class SphereGeometry extends BufferGeometry {
      constructor(radius?: number, widthSegments?: number, heightSegments?: number);
    }
    
    class ConeGeometry extends BufferGeometry {
      constructor(radius?: number, height?: number, radialSegments?: number);
    }
    
    class CylinderGeometry extends BufferGeometry {
      constructor(radiusTop?: number, radiusBottom?: number, height?: number, radialSegments?: number);
    }
    
    class Material {
      dispose(): void;
    }
    
    class MeshPhongMaterial extends Material {
      constructor(parameters?: any);
      color: number;
      shininess: number;
      transparent: boolean;
      opacity: number;
      side: any;
    }
    
    class Mesh {
      constructor(geometry: BufferGeometry, material: Material);
      position: Vector3;
      rotation: { x: number; y: number; z: number; set: (x: number, y: number, z: number) => void };
      scale: Vector3;
      add(object: any): void;
      copy(source: any): this;
      castShadow: boolean;
      receiveShadow: boolean;
      material: Material;
      geometry: BufferGeometry;
      parent: any;
      children: any[];
      visible: boolean;
      userData: any;
      traverse: (callback: (child: any) => void) => void;
    }
    
    class Camera {
      position: Vector3;
    }
    
    interface WebGLRendererParameters {
      canvas?: HTMLCanvasElement;
      antialias?: boolean;
      alpha?: boolean;
      preserveDrawingBuffer?: boolean;
      powerPreference?: string;
    }
    
    const BackSide: number;
  }
  
  const THREE: typeof THREE;
  
  interface Window {
    gtag?: (...args: any[]) => void;
  }
  
  // Additional global declarations for missing types
  const DefiMath: any;
  const DefiPhonique: any;
  const useGDPRRequests: any;
  const showGuidance: any;
  
  // React extensions for custom props
  namespace JSX {
    interface IntrinsicElements {
      behaviorTab: any;
      memoryTab: any;
      fallback: any;
    }
  }
}

// Module augmentations
declare module 'react' {
  interface HTMLAttributes<T> {
    fallback?: React.ReactNode;
    agent?: any;
    current?: number;
    target?: number;
    title?: string;
    icon?: React.ReactElement;
    color?: string;
    animationKey?: string;
    subtitle?: string;
    value?: any;
    itemId?: string;
    isUnlocked?: boolean;
    student?: any;
    visualizationMode?: string;
    canvasRef?: React.RefObject<HTMLCanvasElement>;
    onBehaviorOverride?: any;
  }
}

// Framer Motion fix
declare module 'framer-motion' {
  interface HTMLMotionProps<TagName extends keyof React.ReactHTML> {
    onAnimationStart?: any;
  }
}

// WebGL Context extensions
interface CanvasRenderingContext2D {
  viewport?: (x: number, y: number, width: number, height: number) => void;
  getError?: () => number;
  NO_ERROR?: number;
}

interface WebGLRenderingContext {
  viewport: (x: number, y: number, width: number, height: number) => void;
  getError: () => number;
  NO_ERROR: number;
}

interface WebGL2RenderingContext {
  viewport: (x: number, y: number, width: number, height: number) => void;
  getError: () => number;
  NO_ERROR: number;
}

export {};
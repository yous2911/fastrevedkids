import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';

interface SparkyMascot3DProps {
  mascotType: 'dragon' | 'fairy' | 'robot' | 'cat' | 'owl';
  emotion: 'idle' | 'happy' | 'thinking' | 'celebrating' | 'oops';
  items: string[]; // Array of collected items like ['crown', 'wand', 'glasses']
  xpLevel: number;
  size?: 'small' | 'medium' | 'large';
  enableInteraction?: boolean;
  onMascotClick?: () => void;
}

const SparkyMascot3D: React.FC<SparkyMascot3DProps> = ({
  mascotType,
  emotion,
  items = [],
  xpLevel,
  size = 'medium',
  enableInteraction = true,
  onMascotClick
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const mascotGroupRef = useRef<THREE.Group | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Size configurations
  const sizeConfig = useMemo(() => ({
    small: { scale: 0.8, containerSize: 120 },
    medium: { scale: 1.0, containerSize: 150 },
    large: { scale: 1.2, containerSize: 200 }
  }), []);

  // Mascot colors and characteristics
  const mascotConfig = useMemo(() => ({
    dragon: {
      primaryColor: 0x8A2BE2, // Magical violet
      secondaryColor: 0x4F46E5, // Magical blue
      eyes: 0xFFD700,
      personality: 'fierce'
    },
    fairy: {
      primaryColor: 0xEC4899, // Magical pink
      secondaryColor: 0x10B981, // Magical green
      eyes: 0x87CEEB,
      personality: 'gentle'
    },
    robot: {
      primaryColor: 0x6B7280, // Gray
      secondaryColor: 0x3B82F6, // Blue
      eyes: 0x00FFFF,
      personality: 'logical'
    },
    cat: {
      primaryColor: 0xF59E0B, // Orange
      secondaryColor: 0xFFFBEB, // Light cream
      eyes: 0x22C55E,
      personality: 'playful'
    },
    owl: {
      primaryColor: 0x8B4513, // Brown
      secondaryColor: 0xDEB887, // Light brown
      eyes: 0xFFD700,
      personality: 'wise'
    }
  }), []);

  // Create 3D mascot geometry
  const createMascotGeometry = (type: string) => {
    const group = new THREE.Group();
    const config = mascotConfig[type as keyof typeof mascotConfig];
    
    // Main body
    const bodyGeometry = new THREE.SphereGeometry(1, 16, 16);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: config.primaryColor,
      shininess: 30
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.scale.set(1, 1.2, 1);
    body.position.y = 0;
    group.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.7, 16, 16);
    const headMaterial = new THREE.MeshPhongMaterial({ 
      color: config.primaryColor,
      shininess: 30
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.5;
    group.add(head);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const eyeMaterial = new THREE.MeshPhongMaterial({ 
      color: config.eyes,
      emissive: config.eyes,
      emissiveIntensity: 0.3
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 1.6, 0.5);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 1.6, 0.5);
    group.add(rightEye);

    // Type-specific features
    switch (type) {
      case 'dragon':
        // Wings
        const wingGeometry = new THREE.ConeGeometry(0.5, 1.5, 8);
        const wingMaterial = new THREE.MeshPhongMaterial({ 
          color: config.secondaryColor,
          transparent: true,
          opacity: 0.8
        });
        
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-1.2, 0.5, -0.2);
        leftWing.rotation.z = Math.PI / 4;
        group.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(1.2, 0.5, -0.2);
        rightWing.rotation.z = -Math.PI / 4;
        group.add(rightWing);
        break;

      case 'fairy':
        // Fairy wings (more delicate)
        const fairyWingGeometry = new THREE.PlaneGeometry(0.8, 1.2);
        const fairyWingMaterial = new THREE.MeshPhongMaterial({ 
          color: config.secondaryColor,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide
        });
        
        const leftFairyWing = new THREE.Mesh(fairyWingGeometry, fairyWingMaterial);
        leftFairyWing.position.set(-0.8, 0.8, -0.2);
        group.add(leftFairyWing);
        
        const rightFairyWing = new THREE.Mesh(fairyWingGeometry, fairyWingMaterial);
        rightFairyWing.position.set(0.8, 0.8, -0.2);
        group.add(rightFairyWing);
        break;

      case 'robot':
        // Antenna
        const antennaGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8);
        const antennaMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.y = 2.3;
        group.add(antenna);
        
        // Antenna ball
        const ballGeometry = new THREE.SphereGeometry(0.1);
        const ballMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xFF0000,
          emissive: 0xFF0000,
          emissiveIntensity: 0.3
        });
        const ball = new THREE.Mesh(ballGeometry, ballMaterial);
        ball.position.y = 2.7;
        group.add(ball);
        break;

      case 'cat':
        // Ears
        const earGeometry = new THREE.ConeGeometry(0.3, 0.6, 8);
        const earMaterial = new THREE.MeshPhongMaterial({ color: config.primaryColor });
        
        const leftEar = new THREE.Mesh(earGeometry, earMaterial);
        leftEar.position.set(-0.3, 2.0, 0);
        group.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeometry, earMaterial);
        rightEar.position.set(0.3, 2.0, 0);
        group.add(rightEar);
        break;

      case 'owl':
        // Beak
        const beakGeometry = new THREE.ConeGeometry(0.15, 0.3, 8);
        const beakMaterial = new THREE.MeshPhongMaterial({ color: 0xFFA500 });
        const beak = new THREE.Mesh(beakGeometry, beakMaterial);
        beak.position.set(0, 1.4, 0.6);
        beak.rotation.x = Math.PI;
        group.add(beak);
        break;
    }

    return group;
  };

  // Add items to mascot
  const addItemsToMascot = (mascotGroup: THREE.Group, items: string[]) => {
    // Clear existing items
    const itemsToRemove = mascotGroup.children.filter(child => 
      (child as any).userData?.isItem
    );
    itemsToRemove.forEach(item => mascotGroup.remove(item));

    items.forEach((itemType, index) => {
      let itemMesh: THREE.Mesh;

      switch (itemType) {
        case 'crown':
          const crownGeometry = new THREE.CylinderGeometry(0.6, 0.4, 0.3, 8);
          const crownMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFD700,
            shininess: 100
          });
          itemMesh = new THREE.Mesh(crownGeometry, crownMaterial);
          itemMesh.position.set(0, 2.3, 0);
          break;

        case 'wand':
          const wandGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5);
          const wandMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
          itemMesh = new THREE.Mesh(wandGeometry, wandMaterial);
          itemMesh.position.set(1.5, 0, 0);
          itemMesh.rotation.z = -Math.PI / 4;
          
          // Add star to wand
          const starGeometry = new THREE.SphereGeometry(0.2);
          const starMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFD700,
            emissive: 0xFFD700,
            emissiveIntensity: 0.5
          });
          const star = new THREE.Mesh(starGeometry, starMaterial);
          star.position.set(0, 0.8, 0);
          itemMesh.add(star);
          break;

        case 'glasses':
          const glassGeometry = new THREE.TorusGeometry(0.25, 0.05, 8, 16);
          const glassMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 0.8
          });
          itemMesh = new THREE.Mesh(glassGeometry, glassMaterial);
          itemMesh.position.set(0, 1.6, 0.4);
          
          // Add second lens
          const rightLens = itemMesh.clone();
          rightLens.position.x = 0.5;
          mascotGroup.add(rightLens);
          (rightLens as any).userData = { isItem: true };
          
          itemMesh.position.x = -0.5;
          break;

        default:
          return; // Skip this item if type is not recognized
      }

      if (itemMesh) {
        (itemMesh as any).userData = { isItem: true };
        mascotGroup.add(itemMesh);
      }
    });
  };

  // Animation based on emotion
  const updateAnimation = (time: number) => {
    if (!mascotGroupRef.current) return;

    const mascot = mascotGroupRef.current;
    
    switch (emotion) {
      case 'idle':
        mascot.position.y = Math.sin(time * 0.002) * 0.1;
        mascot.rotation.y = Math.sin(time * 0.001) * 0.1;
        break;
        
      case 'happy':
        mascot.position.y = Math.sin(time * 0.01) * 0.3 + 0.2;
        mascot.rotation.z = Math.sin(time * 0.01) * 0.2;
        break;
        
      case 'thinking':
        mascot.rotation.y = Math.sin(time * 0.005) * 0.3;
        mascot.position.x = Math.sin(time * 0.003) * 0.1;
        break;
        
      case 'celebrating':
        mascot.position.y = Math.sin(time * 0.02) * 0.5 + 0.5;
        mascot.rotation.y = time * 0.01;
        mascot.scale.setScalar(1 + Math.sin(time * 0.01) * 0.1);
        break;
        
      case 'oops':
        mascot.rotation.x = Math.sin(time * 0.02) * 0.1;
        mascot.position.x = Math.sin(time * 0.05) * 0.1;
        break;
    }

    // Mouse following effect
    if (enableInteraction) {
      const targetRotationY = (mousePosition.x - 0.5) * 0.3;
      const targetRotationX = (mousePosition.y - 0.5) * 0.2;
      
      mascot.rotation.y += (targetRotationY - mascot.rotation.y) * 0.05;
      mascot.rotation.x += (targetRotationX - mascot.rotation.x) * 0.05;
    }
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    const config = sizeConfig[size];
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null; // Transparent background
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 4);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      premultipliedAlpha: false
    });
    renderer.setSize(config.containerSize, config.containerSize);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Point lights for magical effect
    const magicalLight1 = new THREE.PointLight(0x8A2BE2, 0.5, 10);
    magicalLight1.position.set(-3, 2, 3);
    scene.add(magicalLight1);

    const magicalLight2 = new THREE.PointLight(0xEC4899, 0.5, 10);
    magicalLight2.position.set(3, -2, 3);
    scene.add(magicalLight2);

    // Create mascot
    const mascotGroup = createMascotGeometry(mascotType);
    mascotGroup.scale.setScalar(config.scale);
    mascotGroup.castShadow = true;
    mascotGroup.receiveShadow = true;
    scene.add(mascotGroup);
    mascotGroupRef.current = mascotGroup;

    // Add items
    addItemsToMascot(mascotGroup, items);

    // Add particle system for magical effects
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 50;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 8;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xFFD700,
      size: 0.1,
      transparent: true,
      opacity: 0.6
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    mountRef.current.appendChild(renderer.domElement);

    // Animation loop
    const animate = (time: number) => {
      updateAnimation(time);
      
      // Animate particles
      particles.rotation.y = time * 0.001;
      particles.rotation.x = time * 0.0005;

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate(0);
    setIsLoaded(true);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [mascotType, size]);

  // Update items when they change
  useEffect(() => {
    if (mascotGroupRef.current) {
      addItemsToMascot(mascotGroupRef.current, items);
    }
  }, [items]);

  // Mouse tracking
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!enableInteraction) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    });
  };

  const handleClick = () => {
    if (enableInteraction && onMascotClick) {
      onMascotClick();
    }
  };

  return (
    <div className="relative">
      <div 
        ref={mountRef}
        className={`
          relative rounded-full overflow-hidden cursor-pointer
          transition-all duration-300 hover:scale-105
          ${!isLoaded ? 'bg-gradient-to-br from-purple-100 to-pink-100 animate-pulse' : ''}
          ${enableInteraction ? 'hover:shadow-2xl hover:shadow-purple-500/25' : ''}
        `}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        style={{
          width: sizeConfig[size].containerSize,
          height: sizeConfig[size].containerSize,
        }}
      />
      
      {/* XP Level indicator */}
      {xpLevel > 0 && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold text-white shadow-lg">
          {xpLevel}
        </div>
      )}
      
      {/* Magic sparkles overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-2 left-2 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
        <div className="absolute bottom-4 right-3 w-1 h-1 bg-pink-400 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 left-1 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};

export default SparkyMascot3D; 
import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { 
  validateMascotCustomization, 
  validateItemUnlockRequirements, 
  validateAssetPath,
  checkRateLimit,
  sanitizeTextInput 
} from '../utils/securityValidation';
import { 
  SecureTextureLoader, 
  validateAssetURL, 
  checkAssetLoadingRateLimit,
  applySecurity3DCSP 
} from '../utils/secureAssetLoader';

interface MascotWardrobe3DProps {
  mascotType: 'dragon' | 'fairy' | 'robot' | 'cat' | 'owl';
  emotion: 'idle' | 'happy' | 'thinking' | 'celebrating' | 'oops';
  equippedItems: string[]; // Array of equipped wardrobe item IDs
  xpLevel: number;
  size?: 'small' | 'medium' | 'large';
  enableInteraction?: boolean;
  onMascotClick?: () => void;
  onItemConflict?: (conflictingItems: string[]) => void;
  studentStats?: {
    xp: number;
    streak: number;
    exercisesCompleted: number;
    achievementsUnlocked: number;
  };
}

// Size configurations
const SIZE_CONFIG = {
  small: { scale: 0.8, containerSize: 120 },
  medium: { scale: 1.0, containerSize: 150 },
  large: { scale: 1.2, containerSize: 200 }
};

// Mascot COLORS and characteristics with positioning data
const MASCOT_CONFIG = {
  dragon: {
    primaryColor: 0x8A2BE2,
    secondaryColor: 0x4F46E5,
    eyes: 0xFFD700,
    personality: 'fierce',
    bodyScale: { x: 1, y: 1.2, z: 1 },
    headPosition: { x: 0, y: 1.5, z: 0 },
    wardrobeOffsets: {
      hat: { x: 0, y: 2.5, z: 0, scale: 1.0 },
      clothing: { x: 0, y: 0, z: 0, scale: 1.1 },
      accessory: { x: 1.2, y: 0.5, z: 0, scale: 1.0 },
      shoes: { x: 0, y: -1.5, z: 0, scale: 1.0 }
    }
  },
  fairy: {
    primaryColor: 0xEC4899,
    secondaryColor: 0x10B981,
    eyes: 0x87CEEB,
    personality: 'gentle',
    bodyScale: { x: 0.9, y: 1.1, z: 0.9 },
    headPosition: { x: 0, y: 1.4, z: 0 },
    wardrobeOffsets: {
      hat: { x: 0, y: 2.3, z: 0, scale: 0.9 },
      clothing: { x: 0, y: 0, z: 0, scale: 1.0 },
      accessory: { x: 1.0, y: 0.3, z: 0, scale: 0.8 },
      shoes: { x: 0, y: -1.3, z: 0, scale: 0.9 }
    }
  },
  robot: {
    primaryColor: 0x6B7280,
    secondaryColor: 0x3B82F6,
    eyes: 0x00FFFF,
    personality: 'logical',
    bodyScale: { x: 1.1, y: 1.3, z: 1.1 },
    headPosition: { x: 0, y: 1.6, z: 0 },
    wardrobeOffsets: {
      hat: { x: 0, y: 2.7, z: 0, scale: 1.1 },
      clothing: { x: 0, y: 0, z: 0, scale: 1.2 },
      accessory: { x: 1.3, y: 0.6, z: 0, scale: 1.1 },
      shoes: { x: 0, y: -1.7, z: 0, scale: 1.1 }
    }
  },
  cat: {
    primaryColor: 0xF59E0B,
    secondaryColor: 0xFFFBEB,
    eyes: 0x22C55E,
    personality: 'playful',
    bodyScale: { x: 0.8, y: 1.0, z: 0.8 },
    headPosition: { x: 0, y: 1.3, z: 0 },
    wardrobeOffsets: {
      hat: { x: 0, y: 2.1, z: 0, scale: 0.8 },
      clothing: { x: 0, y: 0, z: 0, scale: 0.9 },
      accessory: { x: 0.9, y: 0.2, z: 0, scale: 0.7 },
      shoes: { x: 0, y: -1.2, z: 0, scale: 0.8 }
    }
  },
  owl: {
    primaryColor: 0x8B4513,
    secondaryColor: 0xDEB887,
    eyes: 0xFFD700,
    personality: 'wise',
    bodyScale: { x: 0.9, y: 1.1, z: 0.9 },
    headPosition: { x: 0, y: 1.4, z: 0 },
    wardrobeOffsets: {
      hat: { x: 0, y: 2.2, z: 0, scale: 0.85 },
      clothing: { x: 0, y: 0, z: 0, scale: 0.95 },
      accessory: { x: 1.0, y: 0.4, z: 0, scale: 0.8 },
      shoes: { x: 0, y: -1.3, z: 0, scale: 0.85 }
    }
  }
};

// Item collision zones and compatibility
const ITEM_COMPATIBILITY = {
  wizard_hat: { conflicts: ['crown_gold', 'baseball_cap'], zone: 'head' },
  crown_gold: { conflicts: ['wizard_hat', 'baseball_cap'], zone: 'head' },
  baseball_cap: { conflicts: ['wizard_hat', 'crown_gold'], zone: 'head' },
  magic_wand: { conflicts: ['sword_epic'], zone: 'rightHand' },
  sword_epic: { conflicts: ['magic_wand'], zone: 'rightHand' },
  lab_coat: { conflicts: ['superhero_cape', 'rainbow_shirt'], zone: 'body' },
  superhero_cape: { conflicts: ['lab_coat'], zone: 'back' },
  rainbow_shirt: { conflicts: ['lab_coat'], zone: 'body' }
};

const MascotWardrobe3D: React.FC<MascotWardrobe3DProps> = ({
  mascotType,
  emotion,
  equippedItems,
  xpLevel,
  size = 'medium',
  enableInteraction = true,
  onMascotClick,
  onItemConflict,
  studentStats
}) => {
  // Sanitize and validate all input props
  const validatedProps = useMemo(() => {
    const validation = validateMascotCustomization({
      mascotType,
      emotion,
      equippedItems,
      xpLevel
    });

    if (!validation.isValid) {
      console.warn('Mascot customization validation failed:', validation.error);
      return {
        mascotType: 'dragon' as const,
        emotion: 'idle' as const,
        equippedItems: [] as string[],
        xpLevel: 1
      };
    }

    return {
      mascotType: validation.sanitized.mascotType || 'dragon',
      emotion: validation.sanitized.emotion || 'idle', 
      equippedItems: validation.sanitized.equippedItems || [],
      xpLevel: validation.sanitized.xpLevel || 1
    };
  }, [mascotType, emotion, equippedItems, xpLevel]);

  // Use validated props
  const safeMascotType = validatedProps.mascotType;
  const safeEmotion = validatedProps.emotion;
  const safeEquippedItems = validatedProps.equippedItems;
  const safeXPLevel = validatedProps.xpLevel;

  // Generate comprehensive alt text for mascot
  const generateMascotAltText = (): string => {
    let altText = `Mascotte 3D de type ${safeMascotType} avec une émotion ${safeEmotion}`;
    
    if (safeEquippedItems.length > 0) {
      altText += `. Objets équipés: ${safeEquippedItems.join(', ')}`;
    } else {
      altText += `. Aucun objet équipé`;
    }
    
    if (safeXPLevel > 0) {
      altText += `. Niveau d'expérience: ${safeXPLevel}`;
    }
    
    // Add description based on mascot type
    const MASCOT_DESCRIPTIONS = {
      dragon: 'Un dragon majestueux avec des ailes puissantes et des écailles brillantes',
      fairy: 'Une fée gracieuse avec des ailes délicates et une aura magique',
      robot: 'Un robot futuriste avec des composants technologiques avancés',
      cat: 'Un chat mignon avec des oreilles pointues et une queue expressive',
      owl: 'Un hibou sage avec de grands yeux perçants et des plumes douces'
    };
    
    altText += `. ${MASCOT_DESCRIPTIONS[safeMascotType]}`;
    
    // Add emotion-specific description
    const EMOTION_DESCRIPTIONS = {
      idle: 'dans une pose détendue',
      happy: 'exprimant la joie et l\'enthousiasme',
      thinking: 'dans une posture réfléchie',
      celebrating: 'en mode célébration avec des mouvements dynamiques',
      oops: 'montrant de la surprise ou de l\'embarras'
    };
    
    altText += ` ${EMOTION_DESCRIPTIONS[safeEmotion]}`;
    
    return altText;
  };
  
  // Generate detailed description for screen readers
  const generateDetailedDescription = (): string => {
    let description = `Cette mascotte 3D interactive représente un ${safeMascotType}. `;
    
    if (enableInteraction) {
      description += 'Vous pouvez cliquer ou appuyer sur Entrée pour interagir avec elle. ';
    }
    
    if (safeEquippedItems.length > 0) {
      description += `Elle porte actuellement ${safeEquippedItems.length} objet${safeEquippedItems.length > 1 ? 's' : ''}: `;
      safeEquippedItems.forEach((item, index) => {
        description += item;
        if (index < safeEquippedItems.length - 2) {
          description += ', ';
        } else if (index === safeEquippedItems.length - 2) {
          description += ' et ';
        }
      });
      description += '. ';
    }
    
    description += `Le niveau d'expérience affiché est ${safeXPLevel}. `;
    description += `L'état émotionnel actuel est ${safeEmotion}.`;
    
    return description;
  };
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>();
  const rendererRef = useRef<any>();
  const cameraRef = useRef<any>();
  const mascotGroupRef = useRef<any>();
  const wardrobeItemsRef = useRef<any>();
  const animationRef = useRef<number>();
  const cleanupRef = useRef<(() => void)[]>([]);
  const geometriesRef = useRef<any>([]);
  const materialsRef = useRef<any>([]);
  const texturesRef = useRef<any>([]);
  const itemPositionsRef = useRef<Map<string, any>>(new Map());
  const equippedItemsRef = useRef<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [itemConflicts, setItemConflicts] = useState<string[]>([]);
  
  // Secure texture loader instance
  const secureTextureLoader = useRef<SecureTextureLoader>(new SecureTextureLoader());

  const config = SIZE_CONFIG[size];
  
  // Secure asset loading function
  const loadAssetSecurely = async (assetPath: string, type: 'texture' | 'model' = 'texture'): Promise<any> => {
    // Rate limit asset loading to prevent abuse
    if (!checkAssetLoadingRateLimit(`${safeMascotType}-${type}`, 10, 60000)) {
      console.warn('Asset loading rate limit exceeded');
      throw new Error('Asset loading rate limit exceeded');
    }
    
    // Validate asset path
    const pathValidation = validateAssetURL(assetPath);
    if (!pathValidation.isValid) {
      console.error('Invalid asset path:', pathValidation.error);
      throw new Error(`Invalid asset path: ${pathValidation.error}`);
    }
    
    try {
      switch (type) {
        case 'texture':
          const texture = await secureTextureLoader.current.loadSecure(
            pathValidation.sanitizedURL!,
            undefined, // onLoad handled by Promise
            undefined, // onProgress
            undefined, // onError handled by Promise rejection
            {
              maxFileSize: 10 * 1024 * 1024, // 10MB for textures
              allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
              timeout: 15000
            }
          );
          trackTexture(texture);
          return texture;
        
        default:
          throw new Error('Unsupported asset type');
      }
    } catch (error) {
      console.error(`Failed to load ${type} asset:`, error);
      throw error;
    }
  };
  
  // Validate item unlock requirements with security validation
  const validateItemUnlock = (itemId: string, stats: { xp: number; streak: number; exercisesCompleted: number; achievementsUnlocked: number; }): boolean => {
    // First validate the itemId and stats for security
    const securityValidation = validateItemUnlockRequirements(itemId, stats);
    if (!securityValidation.isValid) {
      console.warn('Item unlock security validation failed:', securityValidation.error);
      return false;
    }

    // Sanitize itemId
    const sanitizedItemId = sanitizeTextInput(itemId).sanitizedValue;
    // This would typically reference the WARDROBE_ITEMS data
    // For now, implement basic validation
    const unlockRequirements: Record<string, { type: string; value: number }> = {
      'wizard_hat': { type: 'xp', value: 1000 },
      'crown_gold': { type: 'streak', value: 30 },
      'magic_wand': { type: 'exercises', value: 50 },
      'superhero_cape': { type: 'achievement', value: 5 },
      'lab_coat': { type: 'xp', value: 500 },
      'rainbow_shirt': { type: 'exercises', value: 25 }
    };
    
    const requirement = unlockRequirements[sanitizedItemId];
    if (!requirement) return true; // No requirement = always unlocked
    
    switch (requirement.type) {
      case 'xp':
        return stats.xp >= requirement.value;
      case 'streak':
        return stats.streak >= requirement.value;
      case 'exercises':
        return stats.exercisesCompleted >= requirement.value;
      case 'achievement':
        return stats.achievementsUnlocked >= requirement.value;
      default:
        return false;
    }
  };

  // Utility functions for memory management
  const trackGeometry = (geometry: THREE.BufferGeometry) => {
    geometriesRef.current.push(geometry);
    return geometry;
  };
  
  const trackMaterial = (material: THREE.Material) => {
    materialsRef.current.push(material);
    return material;
  };
  
  const trackTexture = (texture: THREE.Texture) => {
    texturesRef.current.push(texture);
    return texture;
  };
  
  const disposeResources = () => {
    // Dispose geometries
    geometriesRef.current.forEach(geometry => {
      geometry.dispose();
    });
    geometriesRef.current = [];
    
    // Dispose materials
    materialsRef.current.forEach(material => {
      if (material instanceof THREE.Material) {
        material.dispose();
      }
    });
    materialsRef.current = [];
    
    // Dispose textures
    texturesRef.current.forEach(texture => {
      texture.dispose();
    });
    texturesRef.current = [];
    
    // Run additional cleanup functions
    cleanupRef.current.forEach(cleanup => cleanup());
    cleanupRef.current = [];
  };

  // Detect mobile devices for optimization
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent) ||
                           window.innerWidth < 768 ||
                           navigator.maxTouchPoints > 1;
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Create optimized 3D mascot base geometry
  const createMascotGeometry = (type: string) => {
    // Sanitize mascot type
    const sanitizedType = sanitizeTextInput(type).sanitizedValue;
    const VALID_TYPES = ['dragon', 'fairy', 'robot', 'cat', 'owl'];
    const safeType = VALID_TYPES.includes(sanitizedType) ? sanitizedType : 'dragon';
    
    const group = new THREE.Group();
    const config = MASCOT_CONFIG[safeType as keyof typeof MASCOT_CONFIG];
    
    // Optimize geometry complexity based on device capability
    const segments = isMobile ? 8 : 16;
    const rings = isMobile ? 8 : 16;
    
    // Main body
    const bodyGeometry = trackGeometry(new THREE.SphereGeometry(1, segments, rings));
    const bodyMaterial = trackMaterial(new THREE.MeshPhongMaterial({ 
      color: config.primaryColor,
      shininess: 30
    }));
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.scale.set(1, 1.2, 1);
    body.position.y = 0;
    body.castShadow = !isMobile; // Disable shadows on mobile
    body.receiveShadow = !isMobile;
    group.add(body);

    // Head
    const headGeometry = trackGeometry(new THREE.SphereGeometry(0.7, segments, rings));
    const headMaterial = trackMaterial(new THREE.MeshPhongMaterial({ 
      color: config.primaryColor,
      shininess: 30
    }));
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.5;
    head.castShadow = !isMobile;
    head.receiveShadow = !isMobile;
    group.add(head);

    // Eyes with enhanced glow (optimized for mobile)
    const eyeSegments = isMobile ? 6 : 8;
    const eyeGeometry = trackGeometry(new THREE.SphereGeometry(0.15, eyeSegments, eyeSegments));
    const eyeMaterial = trackMaterial(new THREE.MeshPhongMaterial({ 
      color: config.eyes,
      emissive: config.eyes,
      emissiveIntensity: isMobile ? 0.2 : 0.4 // Reduce glow on mobile
    }));
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial.clone());
    trackMaterial(leftEye.material as THREE.Material);
    leftEye.position.set(-0.2, 1.6, 0.5);
    leftEye.castShadow = !isMobile;
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial.clone());
    trackMaterial(rightEye.material as THREE.Material);
    rightEye.position.set(0.2, 1.6, 0.5);
    rightEye.castShadow = !isMobile;
    group.add(rightEye);

    // Type-specific features with wardrobe compatibility
    switch (safeType) {
      case 'dragon':
        const wingSegments = isMobile ? 6 : 8;
        const wingGeometry = trackGeometry(new THREE.ConeGeometry(0.5, 1.5, wingSegments));
        const wingMaterial = trackMaterial(new THREE.MeshPhongMaterial({ 
          color: config.secondaryColor,
          transparent: true,
          opacity: isMobile ? 0.6 : 0.8 // Reduce transparency complexity on mobile
        }));
        
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial.clone());
        trackMaterial(leftWing.material as THREE.Material);
        leftWing.position.set(-1.2, 0.5, -0.2);
        leftWing.rotation.z = Math.PI / 4;
        leftWing.castShadow = !isMobile;
        group.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial.clone());
        trackMaterial(rightWing.material as THREE.Material);
        rightWing.position.set(1.2, 0.5, -0.2);
        rightWing.rotation.z = -Math.PI / 4;
        rightWing.castShadow = !isMobile;
        group.add(rightWing);
        break;

      case 'fairy':
        const fairyWingGeometry = trackGeometry(new THREE.PlaneGeometry(0.8, 1.2, isMobile ? 1 : 2, isMobile ? 1 : 2));
        const fairyWingMaterial = trackMaterial(new THREE.MeshPhongMaterial({ 
          color: config.secondaryColor,
          transparent: true,
          opacity: isMobile ? 0.4 : 0.6,
          side: THREE.DoubleSide
        }));
        
        const leftFairyWing = new THREE.Mesh(fairyWingGeometry, fairyWingMaterial);
        leftFairyWing.position.set(-0.8, 0.8, -0.2);
        leftFairyWing.castShadow = true;
        group.add(leftFairyWing);
        
        const rightFairyWing = new THREE.Mesh(fairyWingGeometry, fairyWingMaterial);
        rightFairyWing.position.set(0.8, 0.8, -0.2);
        rightFairyWing.castShadow = true;
        group.add(rightFairyWing);
        break;

      case 'robot':
        const antennaGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4);
        const antennaMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.y = 1.9;
        antenna.castShadow = true;
        group.add(antenna);
        
        const ballGeometry = new THREE.SphereGeometry(0.08);
        const ballMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xFF0000,
          emissive: 0xFF0000,
          emissiveIntensity: 0.3
        });
        const ball = new THREE.Mesh(ballGeometry, ballMaterial);
        ball.position.y = 2.1;
        ball.castShadow = true;
        group.add(ball);
        break;

      case 'cat':
        const earGeometry = new THREE.ConeGeometry(0.25, 0.5, 8);
        const earMaterial = new THREE.MeshPhongMaterial({ color: config.primaryColor });
        
        const leftEar = new THREE.Mesh(earGeometry, earMaterial);
        leftEar.position.set(-0.25, 1.9, 0);
        leftEar.castShadow = true;
        group.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeometry, earMaterial);
        rightEar.position.set(0.25, 1.9, 0);
        rightEar.castShadow = true;
        group.add(rightEar);
        
        const tailGeometry = new THREE.CylinderGeometry(0.1, 0.05, 1.2);
        const tail = new THREE.Mesh(tailGeometry, new THREE.MeshPhongMaterial({ color: config.primaryColor }));
        tail.position.set(0.8, -0.2, -0.8);
        tail.rotation.x = Math.PI / 3;
        tail.castShadow = true;
        group.add(tail);
        break;

      case 'owl':
        const beakGeometry = new THREE.ConeGeometry(0.12, 0.25, 8);
        const beakMaterial = new THREE.MeshPhongMaterial({ color: 0xFFA500 });
        const beak = new THREE.Mesh(beakGeometry, beakMaterial);
        beak.position.set(0, 1.4, 0.6);
        beak.rotation.x = Math.PI;
        beak.castShadow = true;
        group.add(beak);
        break;
    }

    return group;
  };

  // Wardrobe item geometry creators with input sanitization
  const createWardrobeItemGeometry = (itemId: string, mascotType: string): THREE.Object3D | null => {
    // Sanitize inputs
    const sanitizedItemId = sanitizeTextInput(itemId).sanitizedValue;
    const sanitizedMascotType = sanitizeTextInput(mascotType).sanitizedValue;
    
    // Validate item ID against whitelist
    const VALID_ITEM_IDS = [
      'wizard_hat', 'crown_gold', 'magic_wand', 'magic_glasses', 
      'rainbow_aura', 'superhero_cape', 'lab_coat', 'rainbow_shirt'
    ];
    
    if (!VALID_ITEM_IDS.includes(sanitizedItemId)) {
      console.warn(`Invalid item ID: ${sanitizedItemId}`);
      return null;
    }
    const group = new THREE.Group();
    
    switch (sanitizedItemId) {
      case 'wizard_hat':
        const hatSegments = isMobile ? 6 : 8;
        const hatGeometry = trackGeometry(new THREE.ConeGeometry(0.8, 1.2, hatSegments));
        const hatMaterial = trackMaterial(new THREE.MeshPhongMaterial({ 
          color: 0x4B0082,
          shininess: 50
        }));
        const hat = new THREE.Mesh(hatGeometry, hatMaterial);
        hat.position.set(0, 2.5, 0);
        hat.castShadow = !isMobile;
        
        // Add stars to wizard hat (fewer on mobile)
        const starCount = isMobile ? 4 : 8;
        const hatStarSegments = isMobile ? 4 : 6;
        for (let i = 0; i < starCount; i++) {
          const starGeometry = trackGeometry(new THREE.SphereGeometry(0.05, hatStarSegments, hatStarSegments));
          const starMaterial = trackMaterial(new THREE.MeshPhongMaterial({ 
            color: 0xFFD700,
            emissive: 0xFFD700,
            emissiveIntensity: isMobile ? 0.3 : 0.5
          }));
          const star = new THREE.Mesh(starGeometry, starMaterial);
          const angle = (i / starCount) * Math.PI * 2;
          const radius = 0.6;
          star.position.set(
            Math.cos(angle) * radius,
            2.5 + Math.sin(i * 0.8) * 0.3,
            Math.sin(angle) * radius
          );
          star.castShadow = !isMobile;
          group.add(star);
        }
        
        group.add(hat);
        group.userData.itemId = sanitizedItemId;
        return group;

      case 'crown_gold':
        const crownSegments = isMobile ? 6 : 8;
        const crownBase = trackGeometry(new THREE.CylinderGeometry(0.7, 0.6, 0.4, crownSegments));
        const crownMaterial = trackMaterial(new THREE.MeshPhongMaterial({ 
          color: 0xFFD700,
          shininess: 100,
          specular: 0x444444
        }));
        const crown = new THREE.Mesh(crownBase, crownMaterial);
        crown.position.set(0, 2.3, 0);
        crown.castShadow = !isMobile;
        
        // Add crown spikes (fewer on mobile)
        const spikeCount = isMobile ? 4 : 8;
        for (let i = 0; i < spikeCount; i++) {
          const spikeGeometry = trackGeometry(new THREE.ConeGeometry(0.1, 0.4, 4));
          const spike = new THREE.Mesh(spikeGeometry, crownMaterial.clone());
          trackMaterial(spike.material as THREE.Material);
          const angle = (i / spikeCount) * Math.PI * 2;
          spike.position.set(
            Math.cos(angle) * 0.65,
            2.7,
            Math.sin(angle) * 0.65
          );
          spike.castShadow = !isMobile;
          group.add(spike);
        }
        
        group.add(crown);
        group.userData.itemId = sanitizedItemId;
        return group;

      case 'magic_wand':
        const wandSegments = isMobile ? 4 : 8;
        const wandGeometry = trackGeometry(new THREE.CylinderGeometry(0.05, 0.05, 1.5, wandSegments));
        const wandMaterial = trackMaterial(new THREE.MeshPhongMaterial({ color: 0x8B4513 }));
        const wand = new THREE.Mesh(wandGeometry, wandMaterial);
        wand.position.set(1.2, 0.5, 0);
        wand.rotation.z = -0.3;
        wand.castShadow = !isMobile;
        
        // Wand star
        const wandStarSegments = isMobile ? 6 : 12;
        const starGeometry = trackGeometry(new THREE.SphereGeometry(0.2, wandStarSegments, wandStarSegments));
        const starMaterial = trackMaterial(new THREE.MeshPhongMaterial({ 
          color: 0xFFD700,
          emissive: 0xFFD700,
          emissiveIntensity: isMobile ? 0.4 : 0.7
        }));
        const star = new THREE.Mesh(starGeometry, starMaterial);
        star.position.set(1.8, 1.2, 0);
        star.castShadow = !isMobile;
        
        // Sparkle particles around wand (fewer on mobile)
        const sparkleCount = isMobile ? 6 : 12;
        const sparkleSegments = isMobile ? 3 : 4;
        for (let i = 0; i < sparkleCount; i++) {
          const sparkleGeometry = trackGeometry(new THREE.SphereGeometry(0.03, sparkleSegments, sparkleSegments));
          const sparkleMaterial = trackMaterial(new THREE.MeshPhongMaterial({ 
            color: 0xFFD700,
            emissive: 0xFFD700,
            emissiveIntensity: isMobile ? 0.4 : 0.8
          }));
          const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
          const angle = (i / sparkleCount) * Math.PI * 2;
          const radius = 0.4 + Math.random() * 0.3;
          sparkle.position.set(
            1.8 + Math.cos(angle) * radius,
            1.2 + Math.sin(angle) * radius,
            (Math.random() - 0.5) * 0.4
          );
          sparkle.castShadow = !isMobile;
          group.add(sparkle);
        }
        
        group.add(wand);
        group.add(star);
        group.userData.itemId = sanitizedItemId;
        return group;

      case 'magic_glasses':
        const frameGeometry = new THREE.TorusGeometry(0.25, 0.03, 8, 16);
        const frameMaterial = new THREE.MeshPhongMaterial({ color: 0x000080 });
        
        const leftLens = new THREE.Mesh(frameGeometry, frameMaterial);
        leftLens.position.set(-0.3, 1.6, 0.45);
        leftLens.rotation.y = Math.PI / 2;
        
        const rightLens = new THREE.Mesh(frameGeometry, frameMaterial);
        rightLens.position.set(0.3, 1.6, 0.45);
        rightLens.rotation.y = Math.PI / 2;
        
        // Bridge
        const bridgeGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.2);
        const bridge = new THREE.Mesh(bridgeGeometry, frameMaterial);
        bridge.position.set(0, 1.6, 0.45);
        bridge.rotation.z = Math.PI / 2;
        
        group.add(leftLens);
        group.add(rightLens);
        group.add(bridge);
        return group;

      case 'rainbow_aura':
        const auraGeometry = new THREE.SphereGeometry(2, 16, 16);
        const auraMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xFFFFFF,
          transparent: true,
          opacity: 0.1,
          emissive: 0xFF69B4,
          emissiveIntensity: 0.2
        });
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        aura.position.set(0, 0, 0);
        
        // Rainbow particles
        for (let i = 0; i < 30; i++) {
          const COLORS = [0xFF0000, 0xFF7F00, 0xFFFF00, 0x00FF00, 0x0000FF, 0x4B0082, 0x9400D3];
          const particleGeometry = new THREE.SphereGeometry(0.05);
          const particleMaterial = new THREE.MeshPhongMaterial({ 
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            emissive: COLORS[Math.floor(Math.random() * COLORS.length)],
            emissiveIntensity: 0.6
          });
          const particle = new THREE.Mesh(particleGeometry, particleMaterial);
          
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const radius = 1.5 + Math.random() * 0.5;
          
          particle.position.set(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
          );
          
          group.add(particle);
        }
        
        group.add(aura);
        return group;

      default:
        return null;
    }
  };

  // Check for item conflicts
  const checkItemConflicts = (items: string[]): string[] => {
    const conflicts: string[] = [];
    const equippedZones = new Map<string, string>();
    
    items.forEach(itemId => {
      const compatibility = ITEM_COMPATIBILITY[itemId as keyof typeof ITEM_COMPATIBILITY];
      if (compatibility) {
        const existingItem = equippedZones.get(compatibility.zone);
        if (existingItem && existingItem !== itemId) {
          conflicts.push(itemId);
        } else {
          equippedZones.set(compatibility.zone, itemId);
        }
        
        // Check for explicit conflicts
        compatibility.conflicts.forEach(conflictId => {
          if (items.includes(conflictId) && !conflicts.includes(itemId)) {
            conflicts.push(itemId);
          }
        });
      }
    });
    
    return conflicts;
  };
  
  // Get mascot-specific positioning for item
  const getMascotItemPosition = (itemId: string, itemType: string): { position: any; scale: number } => {
    const config = MASCOT_CONFIG[safeMascotType];
    const wardrobeOffset = config.wardrobeOffsets[itemType as keyof typeof config.wardrobeOffsets] || 
                          config.wardrobeOffsets.accessory;
    
    return {
      position: new THREE.Vector3(wardrobeOffset.x, wardrobeOffset.y, wardrobeOffset.z),
      scale: wardrobeOffset.scale * config.bodyScale.x // Adjust for mascot body scale
    };
  };

  // Update wardrobe items with conflict detection and proper positioning
  const updateWardrobeItems = (mascotGroup: THREE.Group, items: string[]) => {
    // Rate limit wardrobe updates to prevent abuse
    if (!checkRateLimit('wardrobe-update', 20, 5000)) {
      console.warn('Wardrobe update rate limit exceeded');
      return;
    }

    // Sanitize all item IDs
    const sanitizedItems = items
      .map(item => sanitizeTextInput(item, 50).sanitizedValue)
      .filter(item => item.length > 0);
    // Check for conflicts using sanitized items
    const conflicts = checkItemConflicts(sanitizedItems);
    if (conflicts.length > 0) {
      setItemConflicts(conflicts);
      if (onItemConflict) {
        onItemConflict(conflicts);
      }
    } else {
      setItemConflicts([]);
    }
    
    // Remove existing wardrobe items and dispose of their resources
    if (wardrobeItemsRef.current) {
      wardrobeItemsRef.current.traverse(child => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      mascotGroup.remove(wardrobeItemsRef.current);
    }

    // Create new wardrobe items group
    const wardrobeGroup = new THREE.Group();
    wardrobeItemsRef.current = wardrobeGroup;
    
    // Clear previous positions
    itemPositionsRef.current.clear();

    // Filter out conflicting items using sanitized items
    const validItems = sanitizedItems.filter(item => !conflicts.includes(item));
    
    validItems.forEach(itemId => {
      const itemGeometry = createWardrobeItemGeometry(itemId, safeMascotType);
      if (itemGeometry) {
        // Determine item type for positioning
        let itemType = 'accessory';
        if (itemId.includes('hat') || itemId.includes('crown') || itemId.includes('cap')) {
          itemType = 'hat';
        } else if (itemId.includes('coat') || itemId.includes('shirt') || itemId.includes('cape')) {
          itemType = 'clothing';
        } else if (itemId.includes('shoe') || itemId.includes('boot')) {
          itemType = 'shoes';
        }
        
        // Apply mascot-specific positioning
        const positioning = getMascotItemPosition(itemId, itemType);
        itemGeometry.position.copy(positioning.position);
        itemGeometry.scale.multiplyScalar(positioning.scale);
        
        // Store position for animation synchronization
        itemPositionsRef.current.set(itemId, positioning.position.clone());
        
        itemGeometry.castShadow = !isMobile;
        itemGeometry.receiveShadow = !isMobile;
        itemGeometry.userData.itemId = itemId;
        itemGeometry.userData.itemType = itemType;
        itemGeometry.userData.basePosition = positioning.position.clone();
        
        wardrobeGroup.add(itemGeometry);
      }
    });
    
    // Store current equipped items for persistence
    equippedItemsRef.current = validItems;
    
    // Save to localStorage for persistence (using sanitized mascot type)
    try {
      localStorage.setItem(`mascot_${safeMascotType}_wardrobe`, JSON.stringify(validItems));
    } catch (error) {
      console.warn('Failed to save wardrobe to localStorage:', error);
    }

    mascotGroup.add(wardrobeGroup);
  };

  // Enhanced animation system with synchronized wardrobe items
  const updateAnimation = (time: number) => {
    if (!mascotGroupRef.current) return;

    const mascot = mascotGroupRef.current;
    const wardrobeItems = wardrobeItemsRef.current;
    
    // Base mascot animation using validated emotion
    let baseYMovement = 0;
    let baseRotationY = 0;
    let baseRotationZ = 0;
    
    switch (safeEmotion) {
      case 'idle':
        baseYMovement = Math.sin(time * 0.002) * 0.1;
        baseRotationY = Math.sin(time * 0.001) * 0.1;
        mascot.position.y = baseYMovement;
        mascot.rotation.y = baseRotationY;
        break;
        
      case 'happy':
        baseYMovement = Math.sin(time * 0.01) * 0.3 + 0.2;
        baseRotationZ = Math.sin(time * 0.01) * 0.2;
        mascot.position.y = baseYMovement;
        mascot.rotation.z = baseRotationZ;
        break;
        
      case 'thinking':
        baseRotationY = Math.sin(time * 0.003) * 0.15;
        mascot.rotation.y = baseRotationY;
        break;
        
      case 'celebrating':
        baseYMovement = Math.sin(time * 0.015) * 0.4 + 0.3;
        baseRotationY = time * 0.005;
        mascot.position.y = baseYMovement;
        mascot.rotation.y = baseRotationY;
        mascot.scale.setScalar(1 + Math.sin(time * 0.01) * 0.1);
        break;
        
      case 'oops':
        baseRotationZ = Math.sin(time * 0.02) * 0.1;
        mascot.rotation.z = baseRotationZ;
        break;
        
      default:
        baseYMovement = Math.sin(time * 0.004) * 0.15;
        baseRotationY = Math.sin(time * 0.002) * 0.05;
        mascot.position.y = baseYMovement;
        mascot.rotation.y = baseRotationY;
    }
    
    // Synchronize wardrobe items with mascot movement
    if (wardrobeItems && wardrobeItems.children.length > 0) {
      wardrobeItems.children.forEach((item, index) => {
        const threeItem = item as THREE.Object3D;
        const itemId = threeItem.userData.itemId;
        const itemType = threeItem.userData.itemType;
        const basePosition = threeItem.userData.basePosition as any;
        
        if (!itemId || !basePosition) return;
        
        // Reset to base position
        threeItem.position.copy(basePosition);
        
        // Apply synchronized movement based on validated emotion
        switch (safeEmotion) {
          case 'idle':
            // Gentle floating for accessories
            if (itemType === 'accessory') {
              threeItem.position.y += Math.sin(time * 0.002 + index * 0.5) * 0.02;
            }
            // Hats follow head movement
            if (itemType === 'hat') {
              threeItem.rotation.y += baseRotationY * 0.8;
            }
            break;
            
          case 'happy':
            // Bounce with mascot
            threeItem.position.y += baseYMovement * 0.8;
            if (itemType === 'hat') {
              threeItem.rotation.z += baseRotationZ * 0.5;
            }
            // Special effects for magical items
            if (itemId === 'wizard_hat' || itemId === 'magic_wand') {
              threeItem.position.y += Math.sin(time * 0.02 + index) * 0.05;
              threeItem.rotation.y = time * 0.01;
            }
            break;
            
          case 'thinking':
            // Subtle head tilt affects hats
            if (itemType === 'hat') {
              threeItem.rotation.y += baseRotationY * 0.8;
            }
            break;
            
          case 'celebrating':
            // Dramatic movement for all items
            threeItem.position.y += baseYMovement * 0.9;
            threeItem.rotation.y += baseRotationY * 0.6;
            
            // Crown and hat special celebration
            if (itemId === 'crown_gold' || itemId === 'wizard_hat') {
              threeItem.position.y += Math.sin(time * 0.03) * 0.1;
              threeItem.rotation.y += time * 0.02;
            }
            break;
            
          case 'oops':
            // Slight wobble
            if (itemType === 'hat' || itemType === 'accessory') {
              threeItem.rotation.z += baseRotationZ * 0.7;
            }
            break;
        }
        
        // Apply mouse interaction effects
        if (enableInteraction && (itemType === 'hat' || itemType === 'accessory')) {
          const MOUSE_INFLUENCE = 0.1;
          threeItem.rotation.y += (mousePosition.x - 0.5) * MOUSE_INFLUENCE;
          threeItem.rotation.x += (mousePosition.y - 0.5) * MOUSE_INFLUENCE * 0.5;
        }
      });
    }

    // Mouse following effect for mascot
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
    
    // Apply security CSP for 3D assets
    applySecurity3DCSP();
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null; // Transparent background
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    // Renderer setup with mobile optimizations
    const renderer = new THREE.WebGLRenderer({ 
      antialias: !isMobile, // Disable antialiasing on mobile for performance
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: isMobile ? 'low-power' : 'high-performance',
      precision: isMobile ? 'mediump' : 'highp'
    });
    renderer.setSize(config.containerSize, config.containerSize);
    
    // Conditional shadow mapping for performance
    renderer.shadowMap.enabled = !isMobile;
    if (!isMobile) {
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    renderer.setClearColor(0x000000, 0);
    
    // Mobile performance optimizations
    if (isMobile) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    } else {
      renderer.setPixelRatio(window.devicePixelRatio);
    }
    
    rendererRef.current = renderer;

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Magical atmosphere lights
    const magicalLight1 = new THREE.PointLight(0x8A2BE2, 0.6, 15);
    magicalLight1.position.set(-4, 3, 4);
    scene.add(magicalLight1);

    const magicalLight2 = new THREE.PointLight(0xEC4899, 0.6, 15);
    magicalLight2.position.set(4, -2, 4);
    scene.add(magicalLight2);

    // Create mascot using validated type
    const mascotGroup = createMascotGeometry(safeMascotType);
    mascotGroup.scale.setScalar(config.scale);
    mascotGroup.castShadow = true;
    mascotGroup.receiveShadow = true;
    scene.add(mascotGroup);
    mascotGroupRef.current = mascotGroup;

    // Add wardrobe items using validated items
    updateWardrobeItems(mascotGroup, safeEquippedItems);

    mountRef.current.appendChild(renderer.domElement);

    // Animation loop
    const animate = (time: number) => {
      updateAnimation(time);
      
      // Animate magical lights
      magicalLight1.intensity = 0.6 + Math.sin(time * 0.003) * 0.2;
      magicalLight2.intensity = 0.6 + Math.cos(time * 0.004) * 0.2;

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate(0);
    setIsLoaded(true);

    // WebGL context loss handling
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setWebglError('WebGL context lost. Attempting to restore...');
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    
    const handleContextRestored = () => {
      setWebglError(null);
      // Reinitialize the scene
      if (mountRef.current) {
        setIsLoaded(false);
        // The useEffect will run again and reinitialize everything
      }
    };
    
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);
    
    cleanupRef.current.push(() => {
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
    });

    return () => {
      // Cancel animation frame
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
      
      // Remove DOM element
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose all tracked resources
      disposeResources();
      
      // Dispose renderer and scene
      renderer.dispose();
      scene.clear();
      
      // Clear references
      sceneRef.current = undefined;
      rendererRef.current = undefined;
      cameraRef.current = undefined;
      mascotGroupRef.current = undefined;
      wardrobeItemsRef.current = undefined;
    };
  }, [safeMascotType, size]);

  // Load persisted wardrobe items on mount
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem(`mascot_${safeMascotType}_wardrobe`);
      if (savedItems && savedItems !== 'null') {
        const parsedItems = JSON.parse(savedItems);
        // Validate that items are still unlocked
        if (studentStats) {
          const validItems = parsedItems.filter((itemId: string) => {
            // Validate item unlock requirements
            return validateItemUnlock(itemId, studentStats);
          });
          equippedItemsRef.current = validItems;
        } else {
          equippedItemsRef.current = parsedItems;
        }
      }
    } catch (error) {
      console.warn('Failed to load wardrobe from localStorage:', error);
    }
  }, [safeMascotType, studentStats]);
  
  // Update wardrobe items when they change
  useEffect(() => {
    if (mascotGroupRef.current && isLoaded) {
      // Merge equipped items with persisted items if not conflicting using validated items
      const itemsSet = new Set([...safeEquippedItems, ...equippedItemsRef.current]);
      const allItems = Array.from(itemsSet);
      updateWardrobeItems(mascotGroupRef.current, allItems);
    }
  }, [safeEquippedItems, isLoaded, safeMascotType]);

  // Mouse tracking for interaction
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
      
      // Announce interaction to screen readers
      const interactionMessage = `Interaction avec la mascotte ${safeMascotType}. ${safeEmotion === 'celebrating' ? 'La mascotte célèbre!' : ''}`;
      if (window.speechSynthesis) {
        // Use Web Speech API for immediate feedback
        const utterance = new SpeechSynthesisUtterance(interactionMessage);
        utterance.rate = 0.8;
        utterance.volume = 0.7;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (enableInteraction && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="relative" role="region" aria-label="Mascotte 3D interactive">
      {/* Hidden description for screen readers */}
      <div id="mascot-description" className="sr-only">
        {generateDetailedDescription()}
      </div>
      
      <div 
        ref={mountRef}
        className={`
          relative rounded-2xl overflow-hidden transition-all duration-500
          ${!isLoaded ? 'bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 animate-pulse' : ''}
          ${enableInteraction ? 'cursor-pointer hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 focus:scale-105 focus:shadow-2xl focus:outline-2 focus:outline-blue-500' : 'cursor-default'}
          shadow-xl shadow-purple-500/20
        `}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={enableInteraction ? 0 : -1}
        role={enableInteraction ? 'button' : 'img'}
        aria-label={generateMascotAltText()}
        aria-describedby="mascot-description"
        aria-live="polite"
        style={{
          width: config.containerSize,
          height: config.containerSize,
          background: !isLoaded ? undefined : 'radial-gradient(circle, rgba(138,43,226,0.05) 0%, rgba(236,72,153,0.05) 50%, rgba(59,130,246,0.05) 100%)'
        }}
      />
      
      {/* XP Level indicator */}
      {safeXPLevel > 0 && (
        <div 
          className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold text-white shadow-2xl shadow-yellow-500/50 animate-pulse"
          role="status"
          aria-label={`Niveau d'expérience: ${safeXPLevel}`}
        >
          {safeXPLevel}
        </div>
      )}
      
      {/* Equipped items count */}
      {safeEquippedItems.length > 0 && (
        <div 
          className="absolute -bottom-2 -left-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold text-white shadow-lg"
          role="status"
          aria-label={`${safeEquippedItems.length} objet${safeEquippedItems.length > 1 ? 's' : ''} équipé${safeEquippedItems.length > 1 ? 's' : ''}`}
        >
          {safeEquippedItems.length}
        </div>
      )}
      
      {/* Item conflict indicator */}
      {itemConflicts.length > 0 && (
        <div 
          className="absolute -top-2 -left-2 bg-red-500 rounded-full w-6 h-6 flex items-center justify-center text-xs text-white shadow-lg animate-pulse"
          role="alert"
          aria-label={`${itemConflicts.length} conflit${itemConflicts.length > 1 ? 's' : ''} d'objets détecté${itemConflicts.length > 1 ? 's' : ''}`}
        >
          <span role="img" aria-label="Avertissement">⚠️</span>
        </div>
      )}
      
      {/* Loading indicator */}
      {!isLoaded && !webglError && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          role="status"
          aria-label="Chargement de la mascotte 3D"
          aria-live="polite"
        >
          <div className="text-center">
            <div 
              className="text-4xl mb-2 animate-bounce"
              role="img"
              aria-label="Chargement en cours"
            >
              ✨
            </div>
            <div className="text-sm text-gray-600 font-medium">
              Préparation de la magie...
            </div>
          </div>
        </div>
      )}
      
      {/* WebGL Error indicator */}
      {webglError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-2xl">
          <div className="text-center p-4">
            <div className="text-3xl mb-2">⚠️</div>
            <div className="text-sm text-red-600 font-medium mb-2">Erreur WebGL</div>
            <div className="text-xs text-red-500">{webglError}</div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
            >
              Recharger
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MascotWardrobe3D; 
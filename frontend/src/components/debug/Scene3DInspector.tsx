/**
 * 3D Scene Inspector
 * Comprehensive debugging tool for 3D scene inspection, mascot positioning, and camera controls
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface Transform {
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
}

interface SceneObject {
  id: string;
  name: string;
  type: 'mesh' | 'light' | 'camera' | 'group' | 'mascot';
  transform: Transform;
  visible: boolean;
  material?: {
    color: string;
    opacity: number;
    wireframe: boolean;
    transparent: boolean;
  };
  geometry?: {
    type: string;
    vertices: number;
    faces: number;
  };
  children?: SceneObject[];
}

interface CameraControls {
  position: Vector3;
  target: Vector3;
  fov: number;
  near: number;
  far: number;
  zoom: number;
}

interface LightSettings {
  ambientColor: string;
  ambientIntensity: number;
  directionalColor: string;
  directionalIntensity: number;
  directionalPosition: Vector3;
  enableShadows: boolean;
  shadowQuality: 'low' | 'medium' | 'high';
}

interface MascotDebugData {
  emotion: string;
  animationState: string;
  equippedItems: string[];
  bodyParts: Record<string, Transform>;
  bones: Record<string, Transform>;
  morphTargets: Record<string, number>;
}

interface Scene3DInspectorProps {
  isVisible: boolean;
  onClose: () => void;
  sceneRef?: React.RefObject<any>;
  onSceneUpdate?: (updates: any) => void;
  onCameraUpdate?: (camera: CameraControls) => void;
  onLightUpdate?: (lights: LightSettings) => void;
}

export const Scene3DInspector: React.FC<Scene3DInspectorProps> = ({
  isVisible,
  onClose,
  sceneRef,
  onSceneUpdate,
  onCameraUpdate,
  onLightUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'transform' | 'camera' | 'lights' | 'mascot' | 'materials'>('hierarchy');
  const [sceneObjects, setSceneObjects] = useState<SceneObject[]>([]);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [cameraControls, setCameraControls] = useState<CameraControls>({
    position: { x: 0, y: 0, z: 5 },
    target: { x: 0, y: 0, z: 0 },
    fov: 75,
    near: 0.1,
    far: 1000,
    zoom: 1
  });
  const [lightSettings, setLightSettings] = useState<LightSettings>({
    ambientColor: '#404040',
    ambientIntensity: 0.6,
    directionalColor: '#ffffff',
    directionalIntensity: 0.8,
    directionalPosition: { x: 5, y: 5, z: 5 },
    enableShadows: true,
    shadowQuality: 'medium'
  });
  const [mascotDebugData, setMascotDebugData] = useState<MascotDebugData | null>(null);
  const [isGridVisible, setIsGridVisible] = useState(true);
  const [isWireframeMode, setIsWireframeMode] = useState(false);
  const [cameraMode, setCameraMode] = useState<'orbit' | 'fly' | 'first-person'>('orbit');
  
  const updateIntervalRef = useRef<NodeJS.Timeout>();

  // Real-time scene monitoring
  useEffect(() => {
    if (isVisible && sceneRef?.current) {
      updateIntervalRef.current = setInterval(() => {
        updateSceneHierarchy();
        updateMascotDebugData();
      }, 200); // Update 5 times per second
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isVisible, sceneRef]);

  // Update scene hierarchy from Three.js scene
  const updateSceneHierarchy = useCallback(() => {
    if (!sceneRef?.current) return;

    const scene = sceneRef.current;
    const objects: SceneObject[] = [];

    const traverseScene = (object: any, depth = 0): SceneObject => {
      const sceneObj: SceneObject = {
        id: object.uuid || Math.random().toString(36),
        name: object.name || `${object.type || 'Object'}_${objects.length}`,
        type: getObjectType(object),
        transform: {
          position: { x: object.position.x, y: object.position.y, z: object.position.z },
          rotation: { x: object.rotation.x, y: object.rotation.y, z: object.rotation.z },
          scale: { x: object.scale.x, y: object.scale.y, z: object.scale.z }
        },
        visible: object.visible,
        children: []
      };

      // Add material info for meshes
      if (object.material && object.type === 'Mesh') {
        sceneObj.material = {
          color: object.material.color ? `#${object.material.color.getHexString()}` : '#ffffff',
          opacity: object.material.opacity || 1,
          wireframe: object.material.wireframe || false,
          transparent: object.material.transparent || false
        };
      }

      // Add geometry info for meshes
      if (object.geometry && object.type === 'Mesh') {
        sceneObj.geometry = {
          type: object.geometry.type || 'Unknown',
          vertices: object.geometry.attributes?.position?.count || 0,
          faces: object.geometry.index ? object.geometry.index.count / 3 : 0
        };
      }

      // Recursively process children
      if (object.children && object.children.length > 0) {
        sceneObj.children = object.children.map((child: any) => traverseScene(child, depth + 1));
      }

      return sceneObj;
    };

    if (scene.children) {
      const hierarchyObjects = scene.children.map((child: any) => traverseScene(child));
      setSceneObjects(hierarchyObjects);
    }
  }, [sceneRef]);

  // Update mascot-specific debug data
  const updateMascotDebugData = useCallback(() => {
    if (!sceneRef?.current) return;

    const scene = sceneRef.current;
    const mascot = findMascotInScene(scene);

    if (mascot) {
      const debugData: MascotDebugData = {
        emotion: mascot.userData?.emotion || 'neutral',
        animationState: mascot.userData?.animationState || 'idle',
        equippedItems: mascot.userData?.equippedItems || [],
        bodyParts: extractBodyPartTransforms(mascot),
        bones: extractBoneTransforms(mascot),
        morphTargets: extractMorphTargets(mascot)
      };

      setMascotDebugData(debugData);
    }
  }, [sceneRef]);

  // Helper functions
  const getObjectType = (object: any): SceneObject['type'] => {
    if (object.type === 'Mesh' && object.name?.toLowerCase().includes('mascot')) return 'mascot';
    if (object.type === 'Mesh') return 'mesh';
    if (object.type === 'PerspectiveCamera' || object.type === 'OrthographicCamera') return 'camera';
    if (object.type?.includes('Light')) return 'light';
    if (object.type === 'Group' || object.type === 'Object3D') return 'group';
    return 'mesh';
  };

  const findMascotInScene = (scene: any): any => {
    let mascot = null;
    scene.traverse((object: any) => {
      if (object.name?.toLowerCase().includes('mascot') || object.userData?.isMascot) {
        mascot = object;
      }
    });
    return mascot;
  };

  const extractBodyPartTransforms = (mascot: any): Record<string, Transform> => {
    const bodyParts: Record<string, Transform> = {};
    
    mascot.traverse((child: any) => {
      if (child.name && ['head', 'body', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg', 'tail'].includes(child.name)) {
        bodyParts[child.name] = {
          position: { x: child.position.x, y: child.position.y, z: child.position.z },
          rotation: { x: child.rotation.x, y: child.rotation.y, z: child.rotation.z },
          scale: { x: child.scale.x, y: child.scale.y, z: child.scale.z }
        };
      }
    });

    return bodyParts;
  };

  const extractBoneTransforms = (mascot: any): Record<string, Transform> => {
    const bones: Record<string, Transform> = {};
    
    if (mascot.skeleton && mascot.skeleton.bones) {
      mascot.skeleton.bones.forEach((bone: any, index: number) => {
        bones[bone.name || `bone_${index}`] = {
          position: { x: bone.position.x, y: bone.position.y, z: bone.position.z },
          rotation: { x: bone.rotation.x, y: bone.rotation.y, z: bone.rotation.z },
          scale: { x: bone.scale.x, y: bone.scale.y, z: bone.scale.z }
        };
      });
    }

    return bones;
  };

  const extractMorphTargets = (mascot: any): Record<string, number> => {
    const morphTargets: Record<string, number> = {};
    
    if (mascot.morphTargetInfluences && mascot.geometry?.morphAttributes) {
      const morphNames = mascot.geometry.morphAttributes.position?.names || [];
      mascot.morphTargetInfluences.forEach((influence: number, index: number) => {
        const name = morphNames[index] || `morph_${index}`;
        morphTargets[name] = influence;
      });
    }

    return morphTargets;
  };

  // Handle transform updates
  const handleTransformUpdate = useCallback((objectId: string, transform: Partial<Transform>) => {
    if (!sceneRef?.current) return;

    const scene = sceneRef.current;
    let targetObject: any = null;

    scene.traverse((object: any) => {
      if (object.uuid === objectId) {
        targetObject = object;
      }
    });

    if (targetObject && transform) {
      if (transform.position) {
        targetObject.position.set(transform.position.x, transform.position.y, transform.position.z);
      }
      if (transform.rotation) {
        targetObject.rotation.set(transform.rotation.x, transform.rotation.y, transform.rotation.z);
      }
      if (transform.scale) {
        targetObject.scale.set(transform.scale.x, transform.scale.y, transform.scale.z);
      }
    }

    onSceneUpdate?.({ objectId, transform });
  }, [sceneRef, onSceneUpdate]);

  // Handle camera updates
  const handleCameraUpdate = useCallback((updates: Partial<CameraControls>) => {
    const NEW_CONTROLS = { ...cameraControls, ...updates };
    setCameraControls(NEW_CONTROLS);
    onCameraUpdate?.(NEW_CONTROLS);
  }, [cameraControls, onCameraUpdate]);

  // Handle light updates
  const handleLightUpdate = useCallback((updates: Partial<LightSettings>) => {
    const NEW_LIGHTS = { ...lightSettings, ...updates };
    setLightSettings(NEW_LIGHTS);
    onLightUpdate?.(NEW_LIGHTS);
  }, [lightSettings, onLightUpdate]);

  // Camera presets
  const cameraPresets = useMemo(() => ({
    front: { position: { x: 0, y: 0, z: 5 }, target: { x: 0, y: 0, z: 0 } },
    back: { position: { x: 0, y: 0, z: -5 }, target: { x: 0, y: 0, z: 0 } },
    left: { position: { x: -5, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } },
    right: { position: { x: 5, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } },
    top: { position: { x: 0, y: 5, z: 0 }, target: { x: 0, y: 0, z: 0 } },
    bottom: { position: { x: 0, y: -5, z: 0 }, target: { x: 0, y: 0, z: 0 } },
    isometric: { position: { x: 5, y: 5, z: 5 }, target: { x: 0, y: 0, z: 0 } }
  }), []);

  const selectedObjectData = useMemo(() => {
    if (!selectedObject) return null;
    
    const findObject = (objects: SceneObject[]): SceneObject | null => {
      for (const obj of objects) {
        if (obj.id === selectedObject) return obj;
        if (obj.children) {
          const found = findObject(obj.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findObject(sceneObjects);
  }, [selectedObject, sceneObjects]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-4 bg-gray-900 text-white rounded-lg shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">3D Scene Inspector</h2>
          <div className="text-sm opacity-80">
            Objects: {sceneObjects.length} • Camera: {cameraMode} • {isWireframeMode ? 'Wireframe' : 'Solid'} Mode
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsGridVisible(!isGridVisible)}
            variant="success"
            size="sm"
          >
            {isGridVisible ? '⊞ Grid On' : '⊡ Grid Off'}
          </Button>
          <Button
            onClick={() => setIsWireframeMode(!isWireframeMode)}
            variant="warning"
            size="sm"
          >
            {isWireframeMode ? '◈ Wireframe' : '◆ Solid'}
          </Button>
          <Button
            onClick={onClose}
            variant="danger"
            size="sm"
          >
            ✕
          </Button>
        </div>
      </div>

      <div className="flex h-full">
        {/* Tabs */}
        <div className="w-48 bg-gray-800 p-4 border-r border-gray-700">
          <div className="space-y-2">
            {[
              { id: 'hierarchy', label: 'Hierarchy', icon: '🌳' },
              { id: 'transform', label: 'Transform', icon: '📐' },
              { id: 'camera', label: 'Camera', icon: '📷' },
              { id: 'lights', label: 'Lights', icon: '💡' },
              { id: 'mascot', label: 'Mascot', icon: '🐉' },
              { id: 'materials', label: 'Materials', icon: '🎨' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Camera Mode Selector */}
          <div className="mt-6 p-3 bg-gray-700 rounded-lg">
            <h3 className="font-medium mb-2">Camera Mode</h3>
            <select
              value={cameraMode}
              onChange={(e) => setCameraMode(e.target.value as any)}
              className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-sm"
            >
              <option value="orbit">Orbit</option>
              <option value="fly">Fly</option>
              <option value="first-person">First Person</option>
            </select>
          </div>

          {/* Quick Camera Presets */}
          <div className="mt-4">
            <h3 className="font-medium mb-2">Camera Presets</h3>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(cameraPresets).map(([name, preset]) => (
                <button
                  key={name}
                  onClick={() => handleCameraUpdate(preset)}
                  className="text-xs p-1 bg-gray-600 hover:bg-gray-500 rounded capitalize"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              {activeTab === 'hierarchy' && (
                <HierarchyTab
                  objects={sceneObjects}
                  selectedObject={selectedObject}
                  onSelectObject={setSelectedObject}
                />
              )}

              {activeTab === 'transform' && (
                <TransformTab
                  selectedObject={selectedObjectData}
                  onTransformUpdate={handleTransformUpdate}
                />
              )}

              {activeTab === 'camera' && (
                <CameraTab
                  controls={cameraControls}
                  onUpdate={handleCameraUpdate}
                />
              )}

              {activeTab === 'lights' && (
                <LightsTab
                  settings={lightSettings}
                  onUpdate={handleLightUpdate}
                />
              )}

              {activeTab === 'mascot' && (
                <MascotTab
                  debugData={mascotDebugData}
                  onUpdate={(data) => console.log('Mascot update:', data)}
                />
              )}

              {activeTab === 'materials' && (
                <MaterialsTab
                  objects={sceneObjects}
                  onMaterialUpdate={(id, material) => console.log('Material update:', id, material)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// Hierarchy tab component
const HierarchyTab: React.FC<{
  objects: SceneObject[];
  selectedObject: string | null;
  onSelectObject: (id: string | null) => void;
}> = ({ objects, selectedObject, onSelectObject }) => {
  const renderObjectTree = (obj: SceneObject, depth = 0): React.ReactNode => {
    const isSelected = selectedObject === obj.id;
    const indent = depth * 16;

    return (
      <div key={obj.id} className="select-none">
        <div
          className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
            isSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-300'
          }`}
          style={{ marginLeft: indent }}
          onClick={() => onSelectObject(isSelected ? null : obj.id)}
        >
          <span className="w-6 text-xs">
            {obj.type === 'mesh' && '🔷'}
            {obj.type === 'light' && '💡'}
            {obj.type === 'camera' && '📷'}
            {obj.type === 'group' && '📁'}
            {obj.type === 'mascot' && '🐉'}
          </span>
          <span className="flex-1 text-sm">{obj.name}</span>
          <span className={`text-xs px-1 rounded ${
            obj.visible ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {obj.visible ? '👁' : '👁‍🗨'}
          </span>
        </div>
        {obj.children && obj.children.map(child => renderObjectTree(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-green-400">Scene Hierarchy</h3>
      <div className="bg-gray-800 rounded-lg p-4 max-h-96 overflow-auto">
        {objects.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No objects in scene
          </div>
        ) : (
          <div className="space-y-1">
            {objects.map(obj => renderObjectTree(obj))}
          </div>
        )}
      </div>
    </div>
  );
};

// Transform tab component
const TransformTab: React.FC<{
  selectedObject: SceneObject | null;
  onTransformUpdate: (id: string, transform: Partial<Transform>) => void;
}> = ({ selectedObject, onTransformUpdate }) => {
  if (!selectedObject) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-blue-400">Transform</h3>
        <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-500">
          Select an object from the hierarchy to edit its transform
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-blue-400">Transform - {selectedObject.name}</h3>
      
      {/* Position */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium mb-3">Position</h4>
        <div className="grid grid-cols-3 gap-4">
          <Vector3Input
            label="X"
            value={selectedObject.transform.position.x}
            onChange={(value) => onTransformUpdate(selectedObject.id, {
              position: { ...selectedObject.transform.position, x: value }
            })}
          />
          <Vector3Input
            label="Y"
            value={selectedObject.transform.position.y}
            onChange={(value) => onTransformUpdate(selectedObject.id, {
              position: { ...selectedObject.transform.position, y: value }
            })}
          />
          <Vector3Input
            label="Z"
            value={selectedObject.transform.position.z}
            onChange={(value) => onTransformUpdate(selectedObject.id, {
              position: { ...selectedObject.transform.position, z: value }
            })}
          />
        </div>
      </div>

      {/* Rotation */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium mb-3">Rotation (Radians)</h4>
        <div className="grid grid-cols-3 gap-4">
          <Vector3Input
            label="X"
            value={selectedObject.transform.rotation.x}
            onChange={(value) => onTransformUpdate(selectedObject.id, {
              rotation: { ...selectedObject.transform.rotation, x: value }
            })}
            step={0.01}
          />
          <Vector3Input
            label="Y"
            value={selectedObject.transform.rotation.y}
            onChange={(value) => onTransformUpdate(selectedObject.id, {
              rotation: { ...selectedObject.transform.rotation, y: value }
            })}
            step={0.01}
          />
          <Vector3Input
            label="Z"
            value={selectedObject.transform.rotation.z}
            onChange={(value) => onTransformUpdate(selectedObject.id, {
              rotation: { ...selectedObject.transform.rotation, z: value }
            })}
            step={0.01}
          />
        </div>
      </div>

      {/* Scale */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium mb-3">Scale</h4>
        <div className="grid grid-cols-3 gap-4">
          <Vector3Input
            label="X"
            value={selectedObject.transform.scale.x}
            onChange={(value) => onTransformUpdate(selectedObject.id, {
              scale: { ...selectedObject.transform.scale, x: value }
            })}
            step={0.1}
            min={0.1}
          />
          <Vector3Input
            label="Y"
            value={selectedObject.transform.scale.y}
            onChange={(value) => onTransformUpdate(selectedObject.id, {
              scale: { ...selectedObject.transform.scale, y: value }
            })}
            step={0.1}
            min={0.1}
          />
          <Vector3Input
            label="Z"
            value={selectedObject.transform.scale.z}
            onChange={(value) => onTransformUpdate(selectedObject.id, {
              scale: { ...selectedObject.transform.scale, z: value }
            })}
            step={0.1}
            min={0.1}
          />
        </div>
      </div>

      {/* Object Info */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium mb-3">Object Info</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Type:</span>
            <span className="ml-2 text-blue-400">{selectedObject.type}</span>
          </div>
          <div>
            <span className="text-gray-400">Visible:</span>
            <span className={`ml-2 ${selectedObject.visible ? 'text-green-400' : 'text-red-400'}`}>
              {selectedObject.visible ? 'Yes' : 'No'}
            </span>
          </div>
          {selectedObject.geometry && (
            <>
              <div>
                <span className="text-gray-400">Vertices:</span>
                <span className="ml-2 text-purple-400">{selectedObject.geometry.vertices}</span>
              </div>
              <div>
                <span className="text-gray-400">Faces:</span>
                <span className="ml-2 text-purple-400">{selectedObject.geometry.faces}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Camera tab component
const CameraTab: React.FC<{
  controls: CameraControls;
  onUpdate: (updates: Partial<CameraControls>) => void;
}> = ({ controls, onUpdate }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-yellow-400">Camera Controls</h3>

      {/* Position */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium mb-3">Position</h4>
        <div className="grid grid-cols-3 gap-4">
          <Vector3Input
            label="X"
            value={controls.position.x}
            onChange={(value) => onUpdate({ position: { ...controls.position, x: value } })}
          />
          <Vector3Input
            label="Y"
            value={controls.position.y}
            onChange={(value) => onUpdate({ position: { ...controls.position, y: value } })}
          />
          <Vector3Input
            label="Z"
            value={controls.position.z}
            onChange={(value) => onUpdate({ position: { ...controls.position, z: value } })}
          />
        </div>
      </div>

      {/* Target */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium mb-3">Target</h4>
        <div className="grid grid-cols-3 gap-4">
          <Vector3Input
            label="X"
            value={controls.target.x}
            onChange={(value) => onUpdate({ target: { ...controls.target, x: value } })}
          />
          <Vector3Input
            label="Y"
            value={controls.target.y}
            onChange={(value) => onUpdate({ target: { ...controls.target, y: value } })}
          />
          <Vector3Input
            label="Z"
            value={controls.target.z}
            onChange={(value) => onUpdate({ target: { ...controls.target, z: value } })}
          />
        </div>
      </div>

      {/* Camera Settings */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium mb-3">Settings</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">FOV</label>
            <input
              type="range"
              min={10}
              max={120}
              step={1}
              value={controls.fov}
              onChange={(e) => onUpdate({ fov: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="text-xs text-gray-400 mt-1">{controls.fov}°</div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Zoom</label>
            <input
              type="range"
              min={0.1}
              max={5}
              step={0.1}
              value={controls.zoom}
              onChange={(e) => onUpdate({ zoom: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="text-xs text-gray-400 mt-1">{controls.zoom}x</div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Near Plane</label>
            <input
              type="number"
              value={controls.near}
              onChange={(e) => onUpdate({ near: parseFloat(e.target.value) })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
              step={0.01}
              min={0.01}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Far Plane</label>
            <input
              type="number"
              value={controls.far}
              onChange={(e) => onUpdate({ far: parseFloat(e.target.value) })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
              step={100}
              min={1}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Lights tab component
const LightsTab: React.FC<{
  settings: LightSettings;
  onUpdate: (updates: Partial<LightSettings>) => void;
}> = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-orange-400">Lighting</h3>

      {/* Ambient Light */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium mb-3">Ambient Light</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <input
              type="color"
              value={settings.ambientColor}
              onChange={(e) => onUpdate({ ambientColor: e.target.value })}
              className="w-full h-8 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Intensity</label>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={settings.ambientIntensity}
              onChange={(e) => onUpdate({ ambientIntensity: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="text-xs text-gray-400 mt-1">{settings.ambientIntensity}</div>
          </div>
        </div>
      </div>

      {/* Directional Light */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium mb-3">Directional Light</h4>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <input
              type="color"
              value={settings.directionalColor}
              onChange={(e) => onUpdate({ directionalColor: e.target.value })}
              className="w-full h-8 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Intensity</label>
            <input
              type="range"
              min={0}
              max={3}
              step={0.1}
              value={settings.directionalIntensity}
              onChange={(e) => onUpdate({ directionalIntensity: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="text-xs text-gray-400 mt-1">{settings.directionalIntensity}</div>
          </div>
        </div>
        
        <h5 className="font-medium mb-2">Position</h5>
        <div className="grid grid-cols-3 gap-4">
          <Vector3Input
            label="X"
            value={settings.directionalPosition.x}
            onChange={(value) => onUpdate({ 
              directionalPosition: { ...settings.directionalPosition, x: value }
            })}
          />
          <Vector3Input
            label="Y"
            value={settings.directionalPosition.y}
            onChange={(value) => onUpdate({ 
              directionalPosition: { ...settings.directionalPosition, y: value }
            })}
          />
          <Vector3Input
            label="Z"
            value={settings.directionalPosition.z}
            onChange={(value) => onUpdate({ 
              directionalPosition: { ...settings.directionalPosition, z: value }
            })}
          />
        </div>
      </div>

      {/* Shadow Settings */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium mb-3">Shadows</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.enableShadows}
              onChange={(e) => onUpdate({ enableShadows: e.target.checked })}
              className="rounded"
            />
            <span>Enable Shadows</span>
          </label>
          
          <div>
            <label className="block text-sm font-medium mb-1">Shadow Quality</label>
            <select
              value={settings.shadowQuality}
              onChange={(e) => onUpdate({ shadowQuality: e.target.value as any })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mascot tab component
const MascotTab: React.FC<{
  debugData: MascotDebugData | null;
  onUpdate: (data: any) => void;
}> = ({ debugData, onUpdate }) => {
  if (!debugData) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-purple-400">Mascot Debug</h3>
        <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-500">
          No mascot found in scene
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-purple-400">Mascot Debug</h3>

      {/* Status */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium mb-3">Status</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Emotion:</span>
            <span className="ml-2 text-yellow-400">{debugData.emotion}</span>
          </div>
          <div>
            <span className="text-gray-400">Animation:</span>
            <span className="ml-2 text-green-400">{debugData.animationState}</span>
          </div>
        </div>
      </div>

      {/* Equipped Items */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium mb-3">Equipped Items</h4>
        <div className="flex flex-wrap gap-2">
          {debugData.equippedItems.length === 0 ? (
            <span className="text-gray-500">None</span>
          ) : (
            debugData.equippedItems.map(item => (
              <span key={item} className="px-2 py-1 bg-blue-600 rounded text-sm">
                {item}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Body Parts */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium mb-3">Body Parts</h4>
        <div className="max-h-32 overflow-auto">
          {Object.entries(debugData.bodyParts).map(([name, transform]) => (
            <div key={name} className="flex justify-between items-center py-1 text-sm">
              <span className="text-blue-400 capitalize">{name}</span>
              <span className="text-gray-400">
                ({transform.position.x.toFixed(2)}, {transform.position.y.toFixed(2)}, {transform.position.z.toFixed(2)})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Morph Targets */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium mb-3">Morph Targets</h4>
        <div className="max-h-32 overflow-auto">
          {Object.entries(debugData.morphTargets).map(([name, value]) => (
            <div key={name} className="flex justify-between items-center py-1 text-sm">
              <span className="text-purple-400">{name}</span>
              <span className="text-gray-400">{value.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Materials tab component
const MaterialsTab: React.FC<{
  objects: SceneObject[];
  onMaterialUpdate: (id: string, material: any) => void;
}> = ({ objects, onMaterialUpdate }) => {
  const materialsObjects = objects.filter(obj => obj.material);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-pink-400">Materials</h3>
      
      {materialsObjects.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-500">
          No materials found
        </div>
      ) : (
        <div className="space-y-4">
          {materialsObjects.map(obj => (
            <div key={obj.id} className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-3">{obj.name}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <input
                    type="color"
                    value={obj.material?.color || '#ffffff'}
                    onChange={(e) => onMaterialUpdate(obj.id, { color: e.target.value })}
                    className="w-full h-8 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Opacity</label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={obj.material?.opacity || 1}
                    onChange={(e) => onMaterialUpdate(obj.id, { opacity: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-400 mt-1">{obj.material?.opacity || 1}</div>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={obj.material?.wireframe || false}
                    onChange={(e) => onMaterialUpdate(obj.id, { wireframe: e.target.checked })}
                    className="rounded"
                  />
                  <span>Wireframe</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={obj.material?.transparent || false}
                    onChange={(e) => onMaterialUpdate(obj.id, { transparent: e.target.checked })}
                    className="rounded"
                  />
                  <span>Transparent</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Vector3 input component
const Vector3Input: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}> = ({ label, value, onChange, step = 0.1, min, max }) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
        step={step}
        min={min}
        max={max}
      />
    </div>
  );
};

export default Scene3DInspector;
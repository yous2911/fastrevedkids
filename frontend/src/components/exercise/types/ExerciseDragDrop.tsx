import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExercicePedagogique } from '../../../types/api.types';
import { Card } from '../../ui/Card';

export interface ExerciseDragDropProps {
  exercise: ExercicePedagogique;
  onAnswerChange: (answer: any) => void;
  disabled: boolean;
  currentAnswer: any;
  showValidation: boolean;
}

interface DragItem {
  id: string;
  content: string;
  category?: string;
  type: string;
}

interface DropZone {
  id: string;
  label: string;
  accepts?: string[];
  currentItem?: DragItem | null;
}

export const ExerciseDragDrop: React.FC<ExerciseDragDropProps> = ({
  exercise,
  onAnswerChange,
  disabled,
  currentAnswer,
  showValidation
}) => {
  const { question, items = [], zones = [] } = exercise.configuration;
  
  // Convert configuration to proper types
  const [dragItems, setDragItems] = useState<DragItem[]>(() => 
    items.map((item: any, index: number) => ({
      id: item.id || `item-${index}`,
      content: item.content || item.text || item.toString(),
      category: item.category || 'default',
      type: item.type || 'text'
    }))
  );
  
  const [dropZones, setDropZones] = useState<DropZone[]>(() =>
    zones.map((zone: any, index: number) => ({
      id: zone.id || `zone-${index}`,
      label: zone.label || zone.name || `Zone ${index + 1}`,
      accepts: zone.accepts || [],
      currentItem: zone.currentItem || null
    }))
  );

  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);

  // Update answer when zones change
  useEffect(() => {
    const answer = dropZones.reduce((acc, zone) => {
      if (zone.currentItem) {
        acc[zone.id] = zone.currentItem.id;
      }
      return acc;
    }, {} as Record<string, string>);
    
    onAnswerChange(answer);
  }, [dropZones, onAnswerChange]);

  const handleDragStart = useCallback((item: DragItem) => {
    if (disabled) return;
    setDraggedItem(item);
  }, [disabled]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverZone(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, zoneId: string) => {
    e.preventDefault();
    if (!disabled && draggedItem) {
      setDragOverZone(zoneId);
    }
  }, [disabled, draggedItem]);

  const handleDragLeave = useCallback(() => {
    setDragOverZone(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, zone: DropZone) => {
    e.preventDefault();
    if (!draggedItem || disabled) return;

    // Check if zone accepts this item type
    if (zone.accepts && zone.accepts.length > 0 && !zone.accepts.includes(draggedItem.category || 'default')) {
      setDraggedItem(null);
      setDragOverZone(null);
      return;
    }

    // Remove item from its current zone if it exists
    const updatedZones = dropZones.map(z => ({
      ...z,
      currentItem: z.currentItem?.id === draggedItem.id ? null : z.currentItem
    }));

    // Add item to the new zone
    const finalZones = updatedZones.map(z => 
      z.id === zone.id ? { ...z, currentItem: draggedItem } : z
    );

    setDropZones(finalZones);
    setDraggedItem(null);
    setDragOverZone(null);
  }, [draggedItem, disabled, dropZones]);

  const handleRemoveFromZone = useCallback((zoneId: string) => {
    if (disabled) return;
    
    setDropZones(prev => prev.map(zone => 
      zone.id === zoneId ? { ...zone, currentItem: null } : zone
    ));
  }, [disabled]);

  const getValidationStyle = (zone: DropZone) => {
    if (!showValidation) {
      if (dragOverZone === zone.id) {
        return 'border-blue-400 bg-blue-50 border-solid';
      }
      return zone.currentItem ? 'border-gray-300 bg-gray-50' : 'border-gray-200 bg-white';
    }
    
    // Validation logic - this would need to be customized based on exercise requirements
    if (zone.currentItem) {
      // Simple validation: check if item category matches zone id or accepts list
      const isCorrect = zone.accepts?.includes(zone.currentItem.category || '') || 
                       zone.currentItem.category === zone.id;
      
      if (isCorrect) {
        return 'border-green-500 bg-green-50';
      } else {
        return 'border-red-500 bg-red-50';
      }
    }
    
    return 'border-yellow-400 bg-yellow-50';
  };

  const getAvailableItems = () => {
    return dragItems.filter(item => 
      !dropZones.some(zone => zone.currentItem?.id === item.id)
    );
  };

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 leading-relaxed">
          {question}
        </h2>
        <p className="text-gray-600">
          Glisse les éléments dans les bonnes zones
        </p>
      </div>

      {/* Drag Items Pool */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
          📦 Éléments à placer :
        </h3>
        <div className="flex flex-wrap gap-3 justify-center min-h-[80px] p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <AnimatePresence>
            {getAvailableItems().map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={!disabled ? { scale: 1.05, y: -2 } : {}}
                whileDrag={{ scale: 1.1, zIndex: 1000, rotate: 5 }}
                draggable={!disabled}
                onDragStart={() => handleDragStart(item)}
                onDragEnd={handleDragEnd}
                className={`
                  px-4 py-2 bg-blue-100 border-2 border-blue-300 rounded-lg 
                  font-medium text-blue-800 select-none transition-all cursor-move
                  shadow-sm hover:shadow-md
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-200'}
                  ${draggedItem?.id === item.id ? 'opacity-50' : ''}
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🔸</span>
                  <span>{item.content}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {getAvailableItems().length === 0 && (
            <div className="text-gray-400 text-center py-4 w-full">
              <span className="text-2xl">✨</span>
              <p className="text-sm mt-2">Tous les éléments sont placés !</p>
            </div>
          )}
        </div>
      </div>

      {/* Drop Zones */}
      <div className="grid gap-4 max-w-4xl mx-auto">
        {dropZones.map((zone, index) => (
          <motion.div
            key={zone.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
              min-h-24 p-4 border-3 border-dashed rounded-xl transition-all duration-200
              ${getValidationStyle(zone)}
              ${!disabled ? 'hover:shadow-md' : ''}
            `}
            onDragOver={(e) => handleDragOver(e, zone.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, zone)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <h4 className="font-semibold text-gray-700">{zone.label}</h4>
              </div>
              
              {showValidation && zone.currentItem && (
                <div className="text-2xl">
                  {getValidationStyle(zone).includes('green') ? '✅' : '❌'}
                </div>
              )}
              
              {zone.accepts && zone.accepts.length > 0 && (
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Accepte: {zone.accepts.join(', ')}
                </div>
              )}
            </div>
            
            <AnimatePresence>
              {zone.currentItem ? (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="mt-3"
                >
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🔸</span>
                      <span className="font-medium">{zone.currentItem.content}</span>
                    </div>
                    {!disabled && (
                      <button
                        onClick={() => handleRemoveFromZone(zone.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                        title="Retirer cet élément"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="mt-2 text-gray-400 text-center italic border-2 border-dashed border-gray-200 p-4 rounded-lg">
                  <div className="text-2xl mb-2">📥</div>
                  <div>Glisse un élément ici</div>
                  {dragOverZone === zone.id && (
                    <div className="text-blue-500 font-medium mt-1">
                      Relâche pour placer l'élément
                    </div>
                  )}
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Progress Feedback */}
      {!showValidation && (
        <div className="text-center mt-6">
          <div className="inline-flex items-center gap-2 text-gray-600 bg-gray-100 px-4 py-2 rounded-full text-sm">
            <span>📊</span>
            Placés: {dropZones.filter(z => z.currentItem).length} / {dropZones.length}
          </div>
        </div>
      )}

      {/* Validation Feedback */}
      {showValidation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-8"
        >
          <Card className="max-w-md mx-auto p-6">
            {(() => {
              const correctPlacements = dropZones.filter(zone => {
                if (!zone.currentItem) return false;
                return zone.accepts?.includes(zone.currentItem.category || '') || 
                       zone.currentItem.category === zone.id;
              }).length;
              
              const totalZones = dropZones.length;
              const isComplete = correctPlacements === totalZones;
              
              return isComplete ? (
                <div className="text-green-600">
                  <div className="text-4xl mb-3">🎉</div>
                  <h3 className="font-bold text-lg mb-2">Parfait !</h3>
                  <p className="text-sm text-gray-600">
                    Tu as correctement placé tous les éléments !
                  </p>
                </div>
              ) : (
                <div className="text-orange-600">
                  <div className="text-4xl mb-3">🤔</div>
                  <h3 className="font-bold text-lg mb-2">Presque !</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {correctPlacements} sur {totalZones} éléments sont bien placés.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      💡 Vérifie les éléments marqués en rouge
                    </p>
                  </div>
                </div>
              );
            })()}
          </Card>
        </motion.div>
      )}

      {/* Instructions */}
      <div className="text-center text-sm text-gray-500 mt-6">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-1">
            <span>🖱️</span>
            <span>Glisse-dépose</span>
          </div>
          <div className="flex items-center gap-1">
            <span>✕</span>
            <span>Clic pour retirer</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🎯</span>
            <span>Zones de dépôt</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExercicePedagogique, ExerciseDragDropProps, DragItem, DropZone } from '../../../types/api.types';
import { Card } from '../../ui/Card';

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
    items.map((item, index) => ({
      id: item.id || `item-${index}`,
      content: item.content || String(item),
      category: item.category || 'default'
    }))
  );
  
  const [dropZones, setDropZones] = useState<DropZone[]>(() =>
    zones.map((zone, index) => ({
      id: zone.id || `zone-${index}`,
      label: zone.label || `Zone ${index + 1}`,
      accepts: zone.accepts || [],
      currentItem: zone.currentItem || null
    }))
  );

  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);

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
  }, []);

  const handleDrop = useCallback((zone: DropZone) => {
    if (!draggedItem || disabled) return;

    // Check if zone accepts this item type
    if (zone.accepts && zone.accepts.length > 0 && !zone.accepts.includes(draggedItem.category || 'default')) {
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
  }, [draggedItem, disabled, dropZones]);

  const handleRemoveFromZone = useCallback((zoneId: string) => {
    if (disabled) return;
    
    setDropZones(prev => prev.map(zone => 
      zone.id === zoneId ? { ...zone, currentItem: null } : zone
    ));
  }, [disabled]);

  const getValidationStyle = (zone: DropZone) => {
    if (!showValidation) return '';
    
    // This would need proper validation logic based on exercise configuration
    const isCorrect = zone.currentItem && zone.currentItem.category === zone.id;
    
    if (isCorrect) {
      return 'border-green-500 bg-green-50';
    } else if (zone.currentItem) {
      return 'border-red-500 bg-red-50';
    }
    
    return 'border-yellow-500 bg-yellow-50';
  };

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {question}
        </h2>
      </div>

      {/* Drag Items Pool */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Éléments à placer:</h3>
        <div className="flex flex-wrap gap-3 justify-center">
          {dragItems
            .filter(item => !dropZones.some(zone => zone.currentItem?.id === item.id))
            .map((item) => (
              <motion.div
                key={item.id}
                draggable={!disabled}
                onDragStart={() => handleDragStart(item)}
                onDragEnd={handleDragEnd}
                whileHover={!disabled ? { scale: 1.05 } : {}}
                whileDrag={{ scale: 1.1, zIndex: 1000 }}
                className={`
                  px-4 py-2 bg-blue-100 border-2 border-blue-300 rounded-lg cursor-move
                  font-medium text-blue-800 select-none transition-all
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-200'}
                  ${draggedItem?.id === item.id ? 'opacity-50' : ''}
                `}
              >
                {item.content}
              </motion.div>
            ))}
        </div>
      </div>

      {/* Drop Zones */}
      <div className="grid gap-4 max-w-4xl mx-auto">
        {dropZones.map((zone) => (
          <motion.div
            key={zone.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              min-h-24 p-4 border-3 border-dashed rounded-xl transition-all
              ${zone.currentItem ? 'border-solid' : 'border-dashed'}
              ${getValidationStyle(zone)}
              ${!zone.currentItem && !disabled ? 'border-gray-300 hover:border-blue-400 hover:bg-blue-50' : ''}
              ${draggedItem && !disabled ? 'border-blue-400 bg-blue-50' : ''}
            `}
            onDragOver={(e) => {
              e.preventDefault();
              if (!disabled) {
                e.currentTarget.style.borderColor = '#3B82F6';
                e.currentTarget.style.backgroundColor = '#EBF8FF';
              }
            }}
            onDragLeave={(e) => {
              if (!disabled) {
                e.currentTarget.style.borderColor = '';
                e.currentTarget.style.backgroundColor = '';
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = '';
              e.currentTarget.style.backgroundColor = '';
              handleDrop(zone);
            }}
          >
            <div className="flex items-center justify-between">
              <div className="font-medium text-gray-700">{zone.label}</div>
              {showValidation && zone.currentItem && (
                <div className="text-2xl">
                  {getValidationStyle(zone).includes('green') ? '✅' : '❌'}
                </div>
              )}
            </div>
            
            <AnimatePresence>
              {zone.currentItem && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="mt-3"
                >
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <span className="font-medium">{zone.currentItem.content}</span>
                    {!disabled && (
                      <button
                        onClick={() => handleRemoveFromZone(zone.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                        title="Retirer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {!zone.currentItem && (
              <div className="mt-2 text-gray-400 text-center italic">
                Glissez un élément ici
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}; 
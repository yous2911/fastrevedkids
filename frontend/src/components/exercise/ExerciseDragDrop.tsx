import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExercicePedagogique, DragItem, DropZone } from '../../types/api.types';

export interface ExerciseDragDropProps {
  exercise: ExercicePedagogique;
  onAnswerChange: (answer: any) => void;
  disabled: boolean;
  currentAnswer: any;
  showValidation: boolean;
}

export const ExerciseDragDrop: React.FC<ExerciseDragDropProps> = ({
  exercise,
  onAnswerChange,
  disabled,
  currentAnswer,
  showValidation
}) => {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dropZones, setDropZones] = useState<DropZone[]>(() => {
    // Initialize drop zones from exercise configuration
    return exercise.configuration.zones || [];
  });
  
  const dragRef = useRef<HTMLDivElement>(null);
  
  // Proper drag start handling
  const handleDragStart = useCallback((item: DragItem) => {
    if (disabled) return;
    setDraggedItem(item);
  }, [disabled]);
  
  // Proper drag end handling
  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);
  
  // Proper drop handling with validation
  const handleDrop = useCallback((zoneId: string) => {
    if (!draggedItem || disabled) return;
    
    const zone = dropZones.find(z => z.id === zoneId);
    if (!zone) return;
    
    // Check if item is accepted in this zone
    if (zone.accepts && !zone.accepts.includes(draggedItem.category || '')) {
      return;
    }
    
    // Update drop zones
    const updatedZones = dropZones.map(z => 
      z.id === zoneId 
        ? { ...z, currentItem: draggedItem }
        : z.currentItem?.id === draggedItem.id 
          ? { ...z, currentItem: null }
          : z
    );
    
    setDropZones(updatedZones);
    
    // Update answer
    const answer = updatedZones.reduce((acc, zone) => {
      if (zone.currentItem) {
        acc[zone.id] = zone.currentItem.id;
      }
      return acc;
    }, {} as Record<string, string>);
    
    onAnswerChange(answer);
    setDraggedItem(null);
  }, [draggedItem, disabled, dropZones, onAnswerChange]);
  
  // Remove item from zone
  const removeFromZone = useCallback((zoneId: string) => {
    if (disabled) return;
    
    const updatedZones = dropZones.map(z => 
      z.id === zoneId ? { ...z, currentItem: null } : z
    );
    
    setDropZones(updatedZones);
    
    const answer = updatedZones.reduce((acc, zone) => {
      if (zone.currentItem) {
        acc[zone.id] = zone.currentItem.id;
      }
      return acc;
    }, {} as Record<string, string>);
    
    onAnswerChange(answer);
  }, [disabled, dropZones, onAnswerChange]);
  
  const items: DragItem[] = exercise.configuration.items || [];
  
  return (
    <div className="exercise-drag-drop">
      <div className="drag-items-container mb-6">
        <h3 className="text-lg font-semibold mb-4">Éléments à déplacer :</h3>
        <div className="flex flex-wrap gap-3">
          {items.map(item => (
            <motion.div
              key={item.id}
              ref={dragRef}
              className={`
                drag-item p-3 rounded-lg border-2 cursor-move
                ${draggedItem?.id === item.id ? 'opacity-50' : ''}
                ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:shadow-lg'}
              `}
              draggable={!disabled}
              onDragStart={() => handleDragStart(item)}
              onDragEnd={handleDragEnd}
              whileHover={!disabled ? { scale: 1.05 } : {}}
              whileTap={!disabled ? { scale: 0.95 } : {}}
            >
              {item.content}
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="drop-zones-container">
        <h3 className="text-lg font-semibold mb-4">Zones de dépôt :</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dropZones.map(zone => (
            <div
              key={zone.id}
              className={`
                drop-zone min-h-[100px] p-4 border-2 border-dashed rounded-lg
                ${zone.currentItem ? 'border-green-400 bg-green-50' : 'border-gray-300'}
                ${showValidation && currentAnswer[zone.id] ? 'border-blue-400' : ''}
              `}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(zone.id);
              }}
            >
              <div className="text-sm font-medium text-gray-600 mb-2">
                {zone.label}
              </div>
              
              <AnimatePresence>
                {zone.currentItem && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="drop-zone-item p-2 bg-white rounded border flex justify-between items-center"
                  >
                    <span>{zone.currentItem.content}</span>
                    {!disabled && (
                      <button
                        onClick={() => removeFromZone(zone.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                        aria-label="Retirer"
                      >
                        ✕
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 
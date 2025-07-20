import React, { useState, useCallback } from 'react';
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
}

interface DropZone {
  id: string;
  label: string;
  accepts?: string[];
  content: DragItem | null;
}

export const ExerciseDragDrop: React.FC<ExerciseDragDropProps> = ({
  exercise,
  onAnswerChange,
  disabled,
  currentAnswer,
  showValidation
}) => {
  const config = exercise.configuration;
  
  // Initialize items and zones from exercise configuration
  const initializeState = () => {
    const items: DragItem[] = config.items || [
      { id: '1', content: 'Item 1', category: 'A' },
      { id: '2', content: 'Item 2', category: 'B' },
      { id: '3', content: 'Item 3', category: 'A' }
    ];
    
    const zones: DropZone[] = config.zones || [
      { id: 'zone1', label: 'Zone A', accepts: ['A'], content: null },
      { id: 'zone2', label: 'Zone B', accepts: ['B'], content: null }
    ];

    return { items, zones };
  };

  const [availableItems, setAvailableItems] = useState<DragItem[]>(() => initializeState().items);
  const [dropZones, setDropZones] = useState<DropZone[]>(() => initializeState().zones);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);

  // Update answer when zones change
  React.useEffect(() => {
    const answer = dropZones.reduce((acc, zone) => {
      if (zone.content) {
        acc[zone.id] = zone.content.id;
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

  const handleDrop = useCallback((zoneId: string) => {
    if (!draggedItem || disabled) return;

    const zone = dropZones.find(z => z.id === zoneId);
    if (!zone) return;

    // Check if item is accepted in this zone
    if (zone.accepts && !zone.accepts.includes(draggedItem.category || '')) {
      // Item not accepted, return to available items
      return;
    }

    // Remove item from current location
    setAvailableItems(prev => prev.filter(item => item.id !== draggedItem.id));
    setDropZones(prev => prev.map(z => {
      if (z.content?.id === draggedItem.id) {
        return { ...z, content: null };
      }
      return z;
    }));

    // Add previous item back to available if zone was occupied
    if (zone.content) {
      setAvailableItems(prev => [...prev, zone.content!]);
    }

    // Place item in new zone
    setDropZones(prev => prev.map(z => 
      z.id === zoneId ? { ...z, content: draggedItem } : z
    ));

    setDraggedItem(null);
  }, [draggedItem, disabled, dropZones]);

  const handleItemRemove = useCallback((zoneId: string) => {
    if (disabled) return;

    const zone = dropZones.find(z => z.id === zoneId);
    if (!zone?.content) return;

    // Return item to available items
    setAvailableItems(prev => [...prev, zone.content!]);
    
    // Clear zone
    setDropZones(prev => prev.map(z => 
      z.id === zoneId ? { ...z, content: null } : z
    ));
  }, [disabled, dropZones]);

  const getZoneStyle = (zone: DropZone) => {
    const baseStyle = 'min-h-[120px] border-2 border-dashed rounded-xl p-4 transition-all duration-200';
    
    if (showValidation) {
      const expectedItem = config.solution?.[zone.id];
      const actualItem = zone.content?.id;
      const isCorrect = expectedItem === actualItem;
      
      return `${baseStyle} ${isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`;
    }

    if (draggedItem) {
      const canAccept = !zone.accepts || zone.accepts.includes(draggedItem.category || '');
      return `${baseStyle} ${canAccept ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`;
    }

    return `${baseStyle} border-gray-300 bg-gray-50`;
  };

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {config.question || 'Glisse les éléments dans les bonnes zones'}
        </h2>
      </div>

      {/* Available Items */}
      <div className="max-w-4xl mx-auto">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Éléments disponibles
        </h3>
        <div className="flex flex-wrap gap-3 mb-8">
          {availableItems.map((item) => (
            <motion.div
              key={item.id}
              draggable={!disabled}
              onDragStart={() => handleDragStart(item)}
              onDragEnd={handleDragEnd}
              className={`
                px-4 py-2 bg-white border-2 border-gray-300 rounded-lg cursor-grab
                transition-all duration-200 hover:shadow-md
                ${disabled ? 'cursor-not-allowed opacity-50' : ''}
              `}
              whileHover={!disabled ? { scale: 1.05 } : undefined}
              whileTap={!disabled ? { scale: 0.95 } : undefined}
            >
              {item.content}
            </motion.div>
          ))}
        </div>

        {/* Drop Zones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dropZones.map((zone) => (
            <div
              key={zone.id}
              className={getZoneStyle(zone)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(zone.id)}
            >
              <h4 className="font-medium text-gray-700 mb-2">{zone.label}</h4>
              
              {zone.content ? (
                <div className="flex items-center justify-between">
                  <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg">
                    {zone.content.content}
                  </span>
                  {!disabled && (
                    <button
                      onClick={() => handleItemRemove(zone.id)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  Glisse un élément ici
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {showValidation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-6"
        >
          <Card variant="elevated" padding="md" className="max-w-md mx-auto">
            <div className="text-green-600">
              <span className="text-2xl">🎯</span>
              <p className="font-medium mt-2">Exercice terminé !</p>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}; 
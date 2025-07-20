import React from 'react';
import { motion } from 'framer-motion';

interface FloatingElementProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
}

interface FloatingElementsProps {
  elements: Array<{
    id: string;
    content: string | React.ReactNode;
    delay?: number;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  }>;
  className?: string;
}

export const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  delay = 0,
  duration = 3,
  distance = 20,
  className = ''
}) => {
  return (
    <motion.div
      className={`absolute ${className}`}
      animate={{
        y: [0, -distance, 0],
        rotate: [0, 5, -5, 0],
        scale: [1, 1.05, 1]
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
};

export const FloatingElements: React.FC<FloatingElementsProps> = ({
  elements,
  className = ''
}) => {
  const getPositionClasses = (position: string) => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      default:
        return 'top-4 left-4';
    }
  };

  return (
    <div className={`relative w-full h-full pointer-events-none ${className}`}>
      {elements.map((element, index) => (
        <FloatingElement
          key={element.id}
          delay={element.delay || index * 0.5}
          className={getPositionClasses(element.position || 'top-left')}
        >
          {typeof element.content === 'string' ? (
            <span className="text-2xl">{element.content}</span>
          ) : (
            element.content
          )}
        </FloatingElement>
      ))}
    </div>
  );
};

// Predefined floating element sets
export const SparkleElements: React.FC<{ className?: string }> = ({ className }) => (
  <FloatingElements
    elements={[
      { id: 'sparkle1', content: '✨', position: 'top-left', delay: 0 },
      { id: 'sparkle2', content: '⭐', position: 'top-right', delay: 0.5 },
      { id: 'sparkle3', content: '💫', position: 'bottom-left', delay: 1 },
      { id: 'sparkle4', content: '🌟', position: 'bottom-right', delay: 1.5 },
      { id: 'sparkle5', content: '✨', position: 'center', delay: 2 }
    ]}
    className={className}
  />
);

export const MagicElements: React.FC<{ className?: string }> = ({ className }) => (
  <FloatingElements
    elements={[
      { id: 'magic1', content: '🔮', position: 'top-left', delay: 0 },
      { id: 'magic2', content: '🪄', position: 'top-right', delay: 0.3 },
      { id: 'magic3', content: '✨', position: 'bottom-left', delay: 0.6 },
      { id: 'magic4', content: '💎', position: 'bottom-right', delay: 0.9 },
      { id: 'magic5', content: '🌈', position: 'center', delay: 1.2 }
    ]}
    className={className}
  />
);

export const CelebrationElements: React.FC<{ className?: string }> = ({ className }) => (
  <FloatingElements
    elements={[
      { id: 'celeb1', content: '🎉', position: 'top-left', delay: 0 },
      { id: 'celeb2', content: '🎊', position: 'top-right', delay: 0.2 },
      { id: 'celeb3', content: '🎈', position: 'bottom-left', delay: 0.4 },
      { id: 'celeb4', content: '🎁', position: 'bottom-right', delay: 0.6 },
      { id: 'celeb5', content: '🏆', position: 'center', delay: 0.8 }
    ]}
    className={className}
  />
); 
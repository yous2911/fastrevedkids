import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './index';

interface ConsentBannerProps {
  onAccept: () => void;
  onDecline: () => void;
  message?: string;
  show?: boolean;
  className?: string;
}

export const ConsentBanner: React.FC<ConsentBannerProps> = ({
  onAccept,
  onDecline,
  message = "Ce site utilise des cookies pour améliorer votre expérience.",
  show = true,
  className = ''
}) => {
  if (!show) return null;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg p-4 ${className}`}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <p className="text-sm text-gray-700 flex-1">{message}</p>
        <div className="flex gap-3">
          <Button
            onClick={onDecline}
            variant="ghost"
            size="sm"
          >
            Refuser
          </Button>
          <Button
            onClick={onAccept}
            variant="primary"
            size="sm"
          >
            Accepter
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ConsentBanner;
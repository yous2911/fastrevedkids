import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: string | number;
  disabled?: boolean;
}

export interface SidebarProps {
  items: SidebarItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  currentPath,
  onNavigate,
  className = ''
}) => {
  const { state, dispatch, logout } = useApp();
  const { sidebarOpen, currentStudent } = state;

  const handleItemClick = (item: SidebarItem) => {
    if (!item.disabled) {
      onNavigate(item.path);
      // Close sidebar on mobile after navigation
      if (window.innerWidth < 1024) {
        dispatch({ type: 'TOGGLE_SIDEBAR' });
      }
    }
  };

  const sidebarContent = (
    <motion.aside
      className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white 
        shadow-xl lg:shadow-md border-r border-gray-200 
        flex flex-col ${className}
      `}
      initial={{ x: -256 }}
      animate={{ x: 0 }}
      exit={{ x: -256 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* User Profile Section */}
      {currentStudent && (
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="text-3xl">
              {currentStudent.mascotteType === 'dragon' && '🐉'}
              {currentStudent.mascotteType === 'fairy' && '🧚‍♀️'}
              {currentStudent.mascotteType === 'robot' && '🤖'}
              {currentStudent.mascotteType === 'cat' && '🐱'}
              {currentStudent.mascotteType === 'owl' && '🦉'}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">
                {currentStudent.prenom}
              </h3>
              <p className="text-sm text-gray-600">
                {currentStudent.niveauActuel}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  {currentStudent.totalPoints} points
                </span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {currentStudent.serieJours} jours
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {items.map((item) => {
            const isActive = currentPath === item.path;
            const isDisabled = item.disabled;

            return (
              <li key={item.id}>
                <button
                  onClick={() => handleItemClick(item)}
                  disabled={isDisabled}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl 
                    transition-all duration-200 text-left
                    ${isActive 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : isDisabled
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium flex-1">{item.label}</span>
                  {item.badge && (
                    <span className={`
                      text-xs px-2 py-1 rounded-full
                      ${isActive 
                        ? 'bg-white bg-opacity-20 text-white' 
                        : 'bg-blue-100 text-blue-800'
                      }
                    `}>
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          fullWidth
          onClick={logout}
          icon={<span>🚪</span>}
          className="justify-start"
        >
          Déconnexion
        </Button>
      </div>
    </motion.aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="lg:hidden">
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            />
            {sidebarContent}
          </div>
        )}
      </AnimatePresence>
    </>
  );
}; 
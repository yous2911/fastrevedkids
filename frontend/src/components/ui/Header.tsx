import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Badge } from './index';

// =====================================================
// HEADER COMPONENT
// =====================================================

export interface HeaderAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  badge?: string | number;
}

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  actions?: HeaderAction[];
  className?: string;
  variant?: 'default' | 'gradient' | 'transparent' | 'magical';
  size?: 'sm' | 'md' | 'lg';
  sticky?: boolean;
  shadow?: boolean;
  animated?: boolean;
  breadcrumbs?: Array<{
    label: string;
    onClick?: () => void;
  }>;
  user?: {
    name: string;
    avatar?: string;
    role?: string;
    points?: number;
    level?: string;
  };
  notifications?: {
    count: number;
    onClick: () => void;
  };
  onMenuToggle?: () => void;
  showMenu?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  onBack,
  actions = [],
  className = '',
  variant = 'default',
  size = 'md',
  sticky = false,
  shadow = true,
  animated = true,
  breadcrumbs,
  user,
  notifications,
  onMenuToggle,
  showMenu = false
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const SIZE_CLASSES = {
    sm: 'py-3 px-4',
    md: 'py-4 px-6',
    lg: 'py-6 px-8'
  };

  const VARIANT_CLASSES = {
    default: 'bg-white border-b border-gray-200',
    gradient: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white',
    transparent: 'bg-transparent',
    magical: 'bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 text-white shadow-magical'
  };

  const actionVariantClasses = {
    default: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-purple-500 hover:bg-purple-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  };

  const handleActionClick = useCallback((action: HeaderAction) => {
    if (!action.disabled && !action.loading) {
      action.onClick();
    }
  }, []);

  const toggleUserMenu = useCallback(() => {
    setIsUserMenuOpen(prev => !prev);
  }, []);

  return (
    <motion.header
      className={`
        w-full z-30 transition-all duration-200
        ${sticky ? 'sticky top-0' : ''}
        ${shadow ? 'shadow-sm' : ''}
        ${VARIANT_CLASSES[variant]}
        ${SIZE_CLASSES[size]}
        ${className}
      `}
      initial={animated ? { y: -100, opacity: 0 } : false}
      animate={animated ? { y: 0, opacity: 1 } : false}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          
          {/* Left Section */}
          <div className="flex items-center gap-4">
            
            {/* Menu Toggle (Mobile) */}
            {onMenuToggle && (
              <button
                onClick={onMenuToggle}
                className={`
                  lg:hidden p-2 rounded-lg transition-colors
                  ${variant === 'default' ? 'hover:bg-gray-100' : 'hover:bg-white/20'}
                `}
                aria-label="Toggle menu"
              >
                <motion.div
                  animate={{ rotate: showMenu ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </motion.div>
              </button>
            )}

            {/* Back Button */}
            {showBackButton && onBack && (
              <motion.button
                onClick={onBack}
                className={`
                  p-2 rounded-lg transition-all duration-200
                  ${variant === 'default' 
                    ? 'hover:bg-gray-100 text-gray-600 hover:text-gray-800' 
                    : 'hover:bg-white/20 text-white/80 hover:text-white'
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Retour"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
            )}

            {/* Title Section */}
            <div className="flex-1 min-w-0">
              {/* Breadcrumbs */}
              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center space-x-2 text-sm mb-1" aria-label="Breadcrumb">
                  {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center">
                      {index > 0 && (
                        <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                      {crumb.onClick ? (
                        <button
                          onClick={crumb.onClick}
                          className={`
                            hover:underline transition-colors
                            ${variant === 'default' ? 'text-gray-500 hover:text-gray-700' : 'text-white/70 hover:text-white'}
                          `}
                        >
                          {crumb.label}
                        </button>
                      ) : (
                        <span className={variant === 'default' ? 'text-gray-900' : 'text-white'}>
                          {crumb.label}
                        </span>
                      )}
                    </div>
                  ))}
                </nav>
              )}

              {/* Title and Subtitle */}
              {title && (
                <div>
                  <motion.h1
                    className={`
                      font-bold truncate
                      ${size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl'}
                      ${variant === 'default' ? 'text-gray-900' : 'text-white'}
                    `}
                    initial={animated ? { opacity: 0, x: -20 } : false}
                    animate={animated ? { opacity: 1, x: 0 } : false}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    {title}
                  </motion.h1>
                  
                  {subtitle && (
                    <motion.p
                      className={`
                        text-sm truncate mt-1
                        ${variant === 'default' ? 'text-gray-600' : 'text-white/80'}
                      `}
                      initial={animated ? { opacity: 0, x: -20 } : false}
                      animate={animated ? { opacity: 1, x: 0 } : false}
                      transition={{ duration: 0.4, delay: 0.2 }}
                    >
                      {subtitle}
                    </motion.p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            
            {/* Actions */}
            {actions.length > 0 && (
              <div className="flex items-center gap-2">
                {actions.map((action) => (
                  <motion.button
                    key={action.id}
                    onClick={() => handleActionClick(action)}
                    disabled={action.disabled || action.loading}
                    className={`
                      relative px-4 py-2 rounded-lg font-medium transition-all duration-200
                      ${variant === 'default' || variant === 'transparent'
                        ? actionVariantClasses[action.variant || 'default']
                        : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
                      }
                      ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                      flex items-center gap-2
                    `}
                    whileTap={!action.disabled ? { scale: 0.95 } : undefined}
                    initial={animated ? { opacity: 0, scale: 0.8 } : false}
                    animate={animated ? { opacity: 1, scale: 1 } : false}
                    transition={{ duration: 0.2, delay: actions.indexOf(action) * 0.1 }}
                  >
                    {action.loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                      />
                    ) : action.icon ? (
                      <span>{action.icon}</span>
                    ) : null}
                    
                    <span>{action.label}</span>
                    
                    {/* Badge */}
                    {action.badge && (
                      <motion.span
                        className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        {action.badge}
                      </motion.span>
                    )}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Notifications */}
            {notifications && (
              <motion.button
                onClick={notifications.onClick}
                className={`
                  relative p-2 rounded-lg transition-all duration-200
                  ${variant === 'default' 
                    ? 'hover:bg-gray-100 text-gray-600 hover:text-gray-800' 
                    : 'hover:bg-white/20 text-white/80 hover:text-white'
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={animated ? { opacity: 0, scale: 0.8 } : false}
                animate={animated ? { opacity: 1, scale: 1 } : false}
                transition={{ duration: 0.2, delay: 0.3 }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5v-5a7 7 0 00-14 0v5l-5 5h5m0 0a3 3 0 006 0" />
                </svg>
                
                {notifications.count > 0 && (
                  <motion.span
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {notifications.count > 99 ? '99+' : notifications.count}
                  </motion.span>
                )}
              </motion.button>
            )}

            {/* User Menu */}
            {user && (
              <div className="relative">
                <motion.button
                  onClick={toggleUserMenu}
                  className={`
                    flex items-center gap-3 p-2 rounded-lg transition-all duration-200
                    ${variant === 'default' 
                      ? 'hover:bg-gray-100' 
                      : 'hover:bg-white/20'
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={animated ? { opacity: 0, scale: 0.8 } : false}
                  animate={animated ? { opacity: 1, scale: 1 } : false}
                  transition={{ duration: 0.2, delay: 0.4 }}
                >
                  {/* User Avatar */}
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full border-2 border-white/20"
                      />
                    ) : (
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                        ${variant === 'default' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white/20 text-white backdrop-blur-sm'
                        }
                      `}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    {/* User Info (Hidden on small screens) */}
                    <div className="hidden md:block text-left">
                      <div className={`
                        font-medium text-sm
                        ${variant === 'default' ? 'text-gray-900' : 'text-white'}
                      `}>
                        {user.name}
                      </div>
                      
                      {user.role && (
                        <div className={`
                          text-xs
                          ${variant === 'default' ? 'text-gray-500' : 'text-white/70'}
                        `}>
                          {user.role}
                        </div>
                      )}
                      
                      {(user.points !== undefined || user.level) && (
                        <div className={`
                          text-xs flex items-center gap-2
                          ${variant === 'default' ? 'text-gray-500' : 'text-white/70'}
                        `}>
                          {user.level && <span>Niveau {user.level}</span>}
                          {user.points !== undefined && (
                            <>
                              {user.level && <span>•</span>}
                              <span>{user.points} pts</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dropdown Arrow */}
                  <motion.svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={{ rotate: isUserMenuOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </motion.button>

                {/* User Dropdown Menu */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      className={`
                        absolute right-0 top-full mt-2 w-64 rounded-xl shadow-lg border z-50
                        ${variant === 'default' 
                          ? 'bg-white border-gray-200' 
                          : 'bg-white border-gray-200'
                        }
                      `}
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* User Info Section */}
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            {user.role && (
                              <div className="text-sm text-gray-500">{user.role}</div>
                            )}
                            
                            {(user.points !== undefined || user.level) && (
                              <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                {user.level && (
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                    Niveau {user.level}
                                  </span>
                                )}
                                {user.points !== undefined && (
                                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                                    {user.points} points
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-gray-700">Mon profil</span>
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-gray-700">Paramètres</span>
                        </Button>
                        
                        <div className="border-t border-gray-200 mt-2 pt-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full px-4 py-2 text-left hover:bg-red-50 transition-colors flex items-center gap-3 text-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Se déconnecter</span>
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

// =====================================================
// PAGE HEADER COMPONENT (Simplified version)
// =====================================================

export interface PageHeaderProps {
  title: string;
  description?: string;
  onBack?: () => void;
  actions?: HeaderAction[];
  variant?: 'default' | 'centered';
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  onBack,
  actions = [],
  variant = 'default',
  className = ''
}) => {
  const actionVariantClasses = {
    default: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-purple-500 hover:bg-purple-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  };

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={`
          ${variant === 'centered' 
            ? 'text-center' 
            : 'flex items-center justify-between'
          }
        `}>
          <div className={`${variant === 'centered' ? '' : 'flex items-center gap-4'}`}>
            {onBack && (
              <motion.button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
            )}
            
            <div>
              <motion.h1
                className="text-3xl font-bold text-gray-900"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {title}
              </motion.h1>
              
              {description && (
                <motion.p
                  className="mt-2 text-gray-600"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  {description}
                </motion.p>
              )}
            </div>
          </div>

          {actions.length > 0 && variant !== 'centered' && (
            <div className="flex items-center gap-3">
              {actions.map((action) => (
                <motion.button
                  key={action.id}
                  onClick={action.onClick}
                  disabled={action.disabled || action.loading}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2
                    ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                    ${actionVariantClasses[action.variant || 'default']}
                  `}
                  whileTap={!action.disabled ? { scale: 0.95 } : undefined}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: actions.indexOf(action) * 0.1 }}
                >
                  {action.loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                    />
                  ) : action.icon ? (
                    action.icon
                  ) : null}
                  {action.label}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =====================================================
// BREADCRUMBS COMPONENT
// =====================================================

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  variant?: 'default' | 'minimal';
  showHome?: boolean;
  homeIcon?: React.ReactNode;
  onHomeClick?: () => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className = '',
  variant = 'default',
  showHome = true,
  homeIcon,
  onHomeClick
}) => {
  const allItems = showHome 
    ? [
        { 
          label: 'Accueil', 
          onClick: onHomeClick,
          icon: homeIcon || (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          )
        },
        ...items
      ]
    : items;

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      {allItems.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          
          {item.onClick ? (
            <motion.button
              onClick={item.onClick}
              className={`
                flex items-center gap-1 transition-colors
                ${variant === 'minimal' 
                  ? 'text-gray-500 hover:text-gray-700' 
                  : 'text-blue-600 hover:text-blue-800 hover:underline'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {item.icon}
              {item.label}
            </motion.button>
          ) : (
            <span className={`
              flex items-center gap-1
              ${index === allItems.length - 1 
                ? 'text-gray-900 font-medium' 
                : 'text-gray-500'
              }
            `}>
              {item.icon}
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}; 
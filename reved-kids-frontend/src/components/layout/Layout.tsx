import React from 'react';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { Header, HeaderProps } from './Header';
import { Sidebar, SidebarProps } from './Sidebar';
import { useToast } from '../ui/Toast';
import { useApp } from '../../context/AppContext';

export interface LayoutProps extends Omit<HeaderProps, 'className'>, Omit<SidebarProps, 'className'> {
  children: React.ReactNode;
  sidebar?: boolean;
  className?: string;
  contentClassName?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  sidebar = true,
  className = '',
  contentClassName = '',
  // Header props
  title,
  showBackButton,
  onBack,
  actions,
  // Sidebar props
  items = [],
  currentPath = '',
  onNavigate = () => {},
}) => {
  const { ToastContainer } = useToast();
  const { state } = useApp();

  const defaultSidebarItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: '🏠',
      path: '/dashboard'
    },
    {
      id: 'exercises',
      label: 'Exercices',
      icon: '📚',
      path: '/exercises'
    },
    {
      id: 'progress',
      label: 'Progression',
      icon: '📈',
      path: '/progress'
    },
    {
      id: 'achievements',
      label: 'Réussites',
      icon: '🏆',
      path: '/achievements'
    },
    {
      id: 'profile',
      label: 'Profil',
      icon: '👤',
      path: '/profile'
    }
  ];

  const sidebarItems = items.length > 0 ? items : defaultSidebarItems;

  return (
    <ErrorBoundary>
      <div className={`min-h-screen bg-gray-50 flex ${className}`}>
        {/* Sidebar */}
        {sidebar && (
          <Sidebar
            items={sidebarItems}
            currentPath={currentPath}
            onNavigate={onNavigate}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <Header
            title={title}
            showBackButton={showBackButton}
            onBack={onBack}
            actions={actions}
          />

          {/* Main Content */}
          <main className={`flex-1 overflow-auto ${contentClassName}`}>
            {children}
          </main>
        </div>

        {/* Toast Notifications */}
        <ToastContainer />

        {/* Offline Indicator */}
        {!state.online && (
          <div className="fixed bottom-4 left-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            <span className="flex items-center gap-2">
              📱 Mode hors ligne
            </span>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}; 
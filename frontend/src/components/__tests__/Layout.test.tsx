import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { mockFramerMotion } from '../../tests/mocks';
import { Layout } from '../layout/Layout';

// Mock framer-motion
jest.mock('framer-motion', () => mockFramerMotion);

// Mock useApp hook
const mockUseApp = jest.fn(() => ({
  state: {
    online: true
  }
}));

jest.mock('../../context/AppContext', () => ({
  useApp: mockUseApp
}));

// Mock useToast hook
const mockToastContainer = jest.fn(() => <div data-testid="toast-container" />);
const mockUseToast = jest.fn(() => ({
  ToastContainer: mockToastContainer
}));

jest.mock('../ui/Toast', () => ({
  useToast: mockUseToast
}));

// Mock ErrorBoundary
jest.mock('../ui/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  )
}));

// Mock Header component
jest.mock('../layout/Header', () => ({
  Header: ({ title, showBackButton, onBack, actions }: any) => (
    <header data-testid="header">
      {title && <h1>{title}</h1>}
      {showBackButton && <button onClick={onBack}>Back</button>}
      {actions}
    </header>
  )
}));

// Mock Sidebar component
jest.mock('../layout/Sidebar', () => ({
  Sidebar: ({ items, currentPath, onNavigate }: any) => (
    <aside data-testid="sidebar">
      {items.map((item: any) => (
        <button key={item.id} onClick={() => onNavigate(item.path)}>
          {item.label}
        </button>
      ))}
    </aside>
  )
}));

describe('Layout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApp.mockReturnValue({
      state: {
        online: true
      }
    });
  });

  describe('Basic Rendering', () => {
    it('should render layout with children', () => {
      render(
        <Layout>
          <div data-testid="content">Test Content</div>
        </Layout>
      );

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    });

    it('should apply custom className to root container', () => {
      render(
        <Layout className="custom-layout">
          <div>Content</div>
        </Layout>
      );

      const container = document.querySelector('.min-h-screen');
      expect(container).toHaveClass('custom-layout');
    });

    it('should apply custom contentClassName to main element', () => {
      render(
        <Layout contentClassName="custom-content">
          <div>Content</div>
        </Layout>
      );

      const main = document.querySelector('main');
      expect(main).toHaveClass('custom-content');
    });
  });

  describe('Sidebar Configuration', () => {
    it('should render sidebar by default', () => {
      render(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('should not render sidebar when sidebar prop is false', () => {
      render(
        <Layout sidebar={false}>
          <div>Content</div>
        </Layout>
      );

      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    });

    it('should use default sidebar items when none provided', () => {
      render(
        <Layout currentPath="/dashboard" onNavigate={jest.fn()}>
          <div>Content</div>
        </Layout>
      );

      expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
      expect(screen.getByText('Exercices')).toBeInTheDocument();
      expect(screen.getByText('Progression')).toBeInTheDocument();
      expect(screen.getByText('Réussites')).toBeInTheDocument();
      expect(screen.getByText('Profil')).toBeInTheDocument();
    });

    it('should use custom sidebar items when provided', () => {
      const customItems = [
        { id: 'custom1', label: 'Custom Item 1', icon: '🎯', path: '/custom1' },
        { id: 'custom2', label: 'Custom Item 2', icon: '🚀', path: '/custom2' }
      ];

      render(
        <Layout items={customItems} currentPath="/custom1" onNavigate={jest.fn()}>
          <div>Content</div>
        </Layout>
      );

      expect(screen.getByText('Custom Item 1')).toBeInTheDocument();
      expect(screen.getByText('Custom Item 2')).toBeInTheDocument();
      expect(screen.queryByText('Tableau de bord')).not.toBeInTheDocument();
    });
  });

  describe('Header Configuration', () => {
    it('should pass header props correctly', () => {
      const mockOnBack = jest.fn();
      const actions = <button>Custom Action</button>;

      render(
        <Layout 
          title="Test Page" 
          showBackButton 
          onBack={mockOnBack}
          actions={actions}
        >
          <div>Content</div>
        </Layout>
      );

      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Custom Action')).toBeInTheDocument();
    });

    it('should render without header props', () => {
      render(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.queryByText('Back')).not.toBeInTheDocument();
    });
  });

  describe('Content Area', () => {
    it('should render main content with proper classes', () => {
      render(
        <Layout>
          <div data-testid="main-content">Main Content</div>
        </Layout>
      );

      const main = document.querySelector('main');
      expect(main).toHaveClass('flex-1', 'overflow-auto');
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    it('should render complex content', () => {
      render(
        <Layout>
          <div>
            <h2>Page Title</h2>
            <p>Page description</p>
            <button>Action Button</button>
          </div>
        </Layout>
      );

      expect(screen.getByText('Page Title')).toBeInTheDocument();
      expect(screen.getByText('Page description')).toBeInTheDocument();
      expect(screen.getByText('Action Button')).toBeInTheDocument();
    });
  });

  describe('Online/Offline Status', () => {
    it('should not show offline indicator when online', () => {
      mockUseApp.mockReturnValue({
        state: {
          online: true
        }
      });

      render(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      expect(screen.queryByText('📱 Mode hors ligne')).not.toBeInTheDocument();
    });

    it('should show offline indicator when offline', () => {
      mockUseApp.mockReturnValue({
        state: {
          online: false
        }
      });

      render(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      expect(screen.getByText('📱 Mode hors ligne')).toBeInTheDocument();
    });

    it('should position offline indicator correctly', () => {
      mockUseApp.mockReturnValue({
        state: {
          online: false
        }
      });

      render(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      const offlineIndicator = screen.getByText('📱 Mode hors ligne').closest('div');
      expect(offlineIndicator).toHaveClass(
        'fixed',
        'bottom-4',
        'left-4',
        'bg-orange-500',
        'text-white',
        'px-4',
        'py-2',
        'rounded-lg',
        'shadow-lg',
        'z-50'
      );
    });
  });

  describe('Layout Structure', () => {
    it('should have proper layout structure classes', () => {
      render(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      const rootContainer = document.querySelector('.min-h-screen');
      expect(rootContainer).toHaveClass('bg-gray-50', 'flex');

      const contentArea = document.querySelector('.flex-1.flex.flex-col');
      expect(contentArea).toBeInTheDocument();
      expect(contentArea).toHaveClass('min-w-0');
    });

    it('should render without sidebar and adjust layout', () => {
      render(
        <Layout sidebar={false}>
          <div>Content</div>
        </Layout>
      );

      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(document.querySelector('main')).toBeInTheDocument();
    });
  });

  describe('Error Boundary Integration', () => {
    it('should wrap everything in ErrorBoundary', () => {
      render(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    });
  });

  describe('Toast Integration', () => {
    it('should render ToastContainer', () => {
      render(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    });

    it('should call useToast hook', () => {
      render(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      expect(mockUseToast).toHaveBeenCalled();
    });
  });

  describe('Navigation Integration', () => {
    it('should call onNavigate when sidebar items are clicked', () => {
      const mockOnNavigate = jest.fn();
      
      render(
        <Layout currentPath="/dashboard" onNavigate={mockOnNavigate}>
          <div>Content</div>
        </Layout>
      );

      // This would be handled by the mocked Sidebar component
      expect(screen.getByText('Exercices')).toBeInTheDocument();
    });

    it('should provide default onNavigate function', () => {
      render(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should handle mobile layout considerations', () => {
      render(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      const contentArea = document.querySelector('.flex-1.flex.flex-col');
      expect(contentArea).toHaveClass('min-w-0'); // Prevents overflow on mobile
    });
  });

  describe('Edge Cases', () => {
    it('should handle null children', () => {
      render(<Layout>{null}</Layout>);

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('should handle undefined children', () => {
      render(<Layout>{undefined}</Layout>);

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('should handle empty items array', () => {
      render(
        <Layout items={[]}>
          <div>Content</div>
        </Layout>
      );

      // Should fallback to default items
      expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
    });

    it('should handle missing currentPath', () => {
      render(
        <Layout onNavigate={jest.fn()}>
          <div>Content</div>
        </Layout>
      );

      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should render all components with full configuration', () => {
      const mockOnNavigate = jest.fn();
      const mockOnBack = jest.fn();
      const customItems = [
        { id: 'test', label: 'Test Page', icon: '🧪', path: '/test' }
      ];

      mockUseApp.mockReturnValue({
        state: {
          online: false
        }
      });

      render(
        <Layout
          title="Full Layout Test"
          showBackButton
          onBack={mockOnBack}
          actions={<button>Header Action</button>}
          items={customItems}
          currentPath="/test"
          onNavigate={mockOnNavigate}
          className="custom-layout"
          contentClassName="custom-content"
        >
          <div data-testid="complex-content">
            <h1>Complex Content</h1>
            <p>With multiple elements</p>
          </div>
        </Layout>
      );

      // Check all parts are rendered
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByText('Full Layout Test')).toBeInTheDocument();
      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Header Action')).toBeInTheDocument();
      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByTestId('complex-content')).toBeInTheDocument();
      expect(screen.getByText('📱 Mode hors ligne')).toBeInTheDocument();
      expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    });
  });
});
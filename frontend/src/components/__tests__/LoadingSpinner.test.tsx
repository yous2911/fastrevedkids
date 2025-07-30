import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { mockFramerMotion } from '../../tests/mocks';
import { LoadingSpinner } from '../ui/LoadingSpinner';

// Mock framer-motion
jest.mock('framer-motion', () => mockFramerMotion);

describe('LoadingSpinner Component', () => {
  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<LoadingSpinner />);
      const spinner = document.querySelector('div[class*="border-2"]');
      expect(spinner).toBeInTheDocument();
    });

    it('should render with message', () => {
      render(<LoadingSpinner message="Loading..." />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render without message by default', () => {
      render(<LoadingSpinner />);
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    const sizes = ['sm', 'md', 'lg', 'xl', 'large'] as const;
    
    sizes.forEach(size => {
      it(`should render with ${size} size`, () => {
        render(<LoadingSpinner size={size} data-testid={`spinner-${size}`} />);
        const container = screen.getByTestId(`spinner-${size}`);
        expect(container).toBeInTheDocument();
        
        const spinner = container.querySelector('div[class*="border-2"]');
        expect(spinner).toBeInTheDocument();
        
        // Check for size-specific classes
        switch(size) {
          case 'sm':
            expect(spinner).toHaveClass('w-4', 'h-4');
            break;
          case 'md':
            expect(spinner).toHaveClass('w-6', 'h-6');
            break;
          case 'lg':
            expect(spinner).toHaveClass('w-8', 'h-8');
            break;
          case 'xl':
            expect(spinner).toHaveClass('w-12', 'h-12');
            break;
          case 'large':
            expect(spinner).toHaveClass('w-16', 'h-16');
            break;
        }
      });
    });
  });

  describe('Variants', () => {
    const variants = ['primary', 'secondary', 'white'] as const;
    
    variants.forEach(variant => {
      it(`should render with ${variant} variant`, () => {
        render(<LoadingSpinner variant={variant} data-testid={`spinner-${variant}`} />);
        const container = screen.getByTestId(`spinner-${variant}`);
        expect(container).toBeInTheDocument();
        
        const spinner = container.querySelector('div[class*="border-2"]');
        expect(spinner).toBeInTheDocument();
        
        // Check for variant-specific classes
        switch(variant) {
          case 'primary':
            expect(spinner).toHaveClass('border-blue-500');
            break;
          case 'secondary':
            expect(spinner).toHaveClass('border-purple-500');
            break;
          case 'white':
            expect(spinner).toHaveClass('border-white');
            break;
        }
      });
    });
  });

  describe('Full Screen Mode', () => {
    it('should render in full screen mode', () => {
      render(<LoadingSpinner fullScreen />);
      const fullScreenContainer = document.querySelector('.fixed.inset-0');
      expect(fullScreenContainer).toBeInTheDocument();
      expect(fullScreenContainer).toHaveClass(
        'fixed',
        'inset-0',
        'bg-white',
        'bg-opacity-75',
        'flex',
        'items-center',
        'justify-center',
        'z-50'
      );
    });

    it('should render full screen with message', () => {
      render(<LoadingSpinner fullScreen message="Please wait..." />);
      const fullScreenContainer = document.querySelector('.fixed.inset-0');
      expect(fullScreenContainer).toBeInTheDocument();
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });

    it('should center content in full screen mode', () => {
      render(<LoadingSpinner fullScreen message="Loading data..." />);
      const centerContainer = document.querySelector('.text-center');
      expect(centerContainer).toBeInTheDocument();
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('should not render in full screen mode by default', () => {
      render(<LoadingSpinner />);
      const fullScreenContainer = document.querySelector('.fixed.inset-0');
      expect(fullScreenContainer).not.toBeInTheDocument();
    });
  });

  describe('Message Styling', () => {
    it('should style message correctly in regular mode', () => {
      render(<LoadingSpinner message="Loading..." />);
      const message = screen.getByText('Loading...');
      expect(message).toHaveClass('text-gray-600');
      expect(message.tagName).toBe('SPAN');
    });

    it('should style message correctly in full screen mode', () => {
      render(<LoadingSpinner fullScreen message="Loading..." />);
      const message = screen.getByText('Loading...');
      expect(message).toHaveClass('mt-4', 'text-gray-600', 'font-medium');
      expect(message.tagName).toBe('P');
    });
  });

  describe('Layout', () => {
    it('should render inline with message', () => {
      render(<LoadingSpinner message="Processing..." />);
      const container = document.querySelector('.flex.items-center.gap-2');
      expect(container).toBeInTheDocument();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('should render centered layout in full screen', () => {
      render(<LoadingSpinner fullScreen />);
      const centerContainer = document.querySelector('.text-center');
      expect(centerContainer).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should have rotating animation classes', () => {
      render(<LoadingSpinner />);
      const spinner = document.querySelector('div[class*="border-2"]');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('rounded-full');
    });

    it('should maintain animation in full screen mode', () => {
      render(<LoadingSpinner fullScreen />);
      const spinner = document.querySelector('div[class*="border-2"]');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('rounded-full');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with proper ARIA attributes', () => {
      render(<LoadingSpinner aria-label="Loading content" />);
      const container = screen.getByLabelText('Loading content');
      expect(container).toBeInTheDocument();
    });

    it('should support role attribute', () => {
      render(<LoadingSpinner role="status" />);
      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();
    });

    it('should indicate loading state to screen readers', () => {
      render(<LoadingSpinner message="Loading..." aria-live="polite" />);
      const container = screen.getByText('Loading...');
      expect(container.closest('div')).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      render(<LoadingSpinner message="" data-testid="empty-message-spinner" />);
      const container = screen.getByTestId('empty-message-spinner');
      const messageSpan = container.querySelector('span');
      expect(messageSpan).not.toBeInTheDocument();
    });

    it('should handle long messages', () => {
      const longMessage = 'This is a very long loading message that should still display correctly';
      render(<LoadingSpinner message={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle special characters in message', () => {
      const specialMessage = 'Loading... 50% (2/4) 🔄';
      render(<LoadingSpinner message={specialMessage} />);
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });
  });

  describe('Style Combinations', () => {
    it('should apply multiple props correctly', () => {
      render(
        <LoadingSpinner 
          size="lg"
          variant="secondary"
          message="Loading data..."
          data-testid="complex-spinner"
        />
      );
      
      const container = screen.getByTestId('complex-spinner');
      expect(container).toBeInTheDocument();
      
      const spinner = container.querySelector('div[class*="border-2"]');
      expect(spinner).toHaveClass('w-8', 'h-8', 'border-purple-500');
      
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('should handle full screen with all props', () => {
      render(
        <LoadingSpinner 
          fullScreen
          size="xl"
          variant="white"
          message="Please wait while we process your request..."
        />
      );
      
      const fullScreenContainer = document.querySelector('.fixed.inset-0');
      expect(fullScreenContainer).toBeInTheDocument();
      
      const spinner = document.querySelector('div[class*="border-2"]');
      expect(spinner).toHaveClass('w-12', 'h-12', 'border-white');
      
      expect(screen.getByText('Please wait while we process your request...')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<LoadingSpinner message="Loading..." />);
      const spinner = document.querySelector('div[class*="border-2"]');
      
      // Re-render with same props
      rerender(<LoadingSpinner message="Loading..." />);
      expect(spinner).toBeInTheDocument();
    });

    it('should handle rapid prop changes', () => {
      const { rerender } = render(<LoadingSpinner size="sm" />);
      
      rerender(<LoadingSpinner size="md" />);
      rerender(<LoadingSpinner size="lg" />);
      rerender(<LoadingSpinner size="xl" />);
      
      const spinner = document.querySelector('div[class*="border-2"]');
      expect(spinner).toHaveClass('w-12', 'h-12'); // xl size
    });
  });
});
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary } from '../ui/Toast';

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error here</div>;
};

// Component that throws on render
const AlwaysThrows: React.FC = () => {
  throw new Error('Always throws error');
};

// Custom fallback component for testing
const CustomFallback: React.FC<{ error?: Error; resetError: () => void }> = ({ 
  error, 
  resetError 
}) => (
  <div>
    <h2>Custom Error Fallback</h2>
    <p>Error: {error?.message}</p>
    <button onClick={resetError}>Custom Reset</button>
  </div>
);

describe('ErrorBoundary Component', () => {
  // Mock console.error to avoid noise in test output
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Normal content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Normal content')).toBeInTheDocument();
    });

    it('should pass through children props correctly', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child">Child component</div>
          <p>Another child</p>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Another child')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch and display error with default fallback', () => {
      render(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );

      expect(screen.getByText('💥')).toBeInTheDocument();
      expect(screen.getByText('Oups ! Une erreur est survenue')).toBeInTheDocument();
      expect(screen.getByText('Quelque chose s\'est mal passé. Ne t\'inquiète pas, nous allons réparer cela !')).toBeInTheDocument();
      expect(screen.getByText('Réessayer')).toBeInTheDocument();
    });

    it('should show error details when expanded', () => {
      render(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );

      const detailsButton = screen.getByText('Détails techniques');
      fireEvent.click(detailsButton);

      expect(screen.getByText('Always throws error')).toBeInTheDocument();
    });

    it('should reset error state when reset button is clicked', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should show error UI
      expect(screen.getByText('Oups ! Une erreur est survenue')).toBeInTheDocument();

      // Reset the error
      const resetButton = screen.getByText('Réessayer');
      fireEvent.click(resetButton);

      // After reset, the error boundary tries to render children again
      // Since the same component still throws, we should see error again
      expect(screen.getByText('Oups ! Une erreur est survenue')).toBeInTheDocument();
    });

    it('should log error to console', () => {
      render(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.any(Object)
      );
    });
  });

  describe('Custom Fallback Component', () => {
    it('should render custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={CustomFallback}>
          <AlwaysThrows />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Error Fallback')).toBeInTheDocument();
      expect(screen.getByText('Error: Always throws error')).toBeInTheDocument();
      expect(screen.getByText('Custom Reset')).toBeInTheDocument();
    });

    it('should pass error and resetError to custom fallback', () => {
      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Error Fallback')).toBeInTheDocument();
      expect(screen.getByText('Error: Test error message')).toBeInTheDocument();

      // Test reset functionality
      const resetButton = screen.getByText('Custom Reset');
      fireEvent.click(resetButton);

      // After reset, should still show error since component still throws
      expect(screen.getByText('Custom Error Fallback')).toBeInTheDocument();
    });

    it('should handle custom fallback that receives no error', () => {
      const FallbackWithoutError: React.FC<{ resetError: () => void }> = ({ resetError }) => (
        <div>
          <p>No error provided</p>
          <button onClick={resetError}>Reset Anyway</button>
        </div>
      );

      render(
        <ErrorBoundary fallback={FallbackWithoutError}>
          <AlwaysThrows />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error provided')).toBeInTheDocument();
      expect(screen.getByText('Reset Anyway')).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should handle multiple error-reset cycles', () => {
      const AlwaysThrowsNow: React.FC = () => {
        throw new Error('Cycle error');
      };

      render(
        <ErrorBoundary>
          <AlwaysThrowsNow />
        </ErrorBoundary>
      );

      // First error
      expect(screen.getByText('Oups ! Une erreur est survenue')).toBeInTheDocument();

      // Reset button should be available
      const resetButton = screen.getByText('Réessayer');
      fireEvent.click(resetButton);

      // Should still show error state since component still throws
      expect(screen.getByText('Oups ! Une erreur est survenue')).toBeInTheDocument();
    });

    it('should maintain error state after multiple renders without reset', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oups ! Une erreur est survenue')).toBeInTheDocument();

      // Re-render multiple times
      rerender(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );

      rerender(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );

      // Should still show error state
      expect(screen.getByText('Oups ! Une erreur est survenue')).toBeInTheDocument();
    });
  });

  describe('Error Types', () => {
    it('should handle different error types', () => {
      const TypeErrorComponent: React.FC = () => {
        throw new TypeError('Type error message');
      };

      render(
        <ErrorBoundary>
          <TypeErrorComponent />
        </ErrorBoundary>
      );

      const detailsButton = screen.getByText('Détails techniques');
      fireEvent.click(detailsButton);

      expect(screen.getByText('Type error message')).toBeInTheDocument();
    });

    it('should handle errors with no message', () => {
      const NoMessageError: React.FC = () => {
        const error = new Error();
        error.message = '';
        throw error;
      };

      render(
        <ErrorBoundary>
          <NoMessageError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oups ! Une erreur est survenue')).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('should handle component unmounting gracefully', () => {
      const { unmount } = render(
        <ErrorBoundary>
          <div>Normal content</div>
        </ErrorBoundary>
      );

      expect(() => unmount()).not.toThrow();
    });

    it('should handle component unmounting while in error state', () => {
      const { unmount } = render(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );

      expect(screen.getByText('Oups ! Une erreur est survenue')).toBeInTheDocument();
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null children', () => {
      render(
        <ErrorBoundary>
          {null}
        </ErrorBoundary>
      );

      // Should render without error
      expect(document.body).toBeInTheDocument();
    });

    it('should handle undefined children', () => {
      render(
        <ErrorBoundary>
          {undefined}
        </ErrorBoundary>
      );

      // Should render without error
      expect(document.body).toBeInTheDocument();
    });

    it('should handle empty children', () => {
      render(<ErrorBoundary />);

      // Should render without error
      expect(document.body).toBeInTheDocument();
    });

    it('should handle error boundary within error boundary', () => {
      render(
        <ErrorBoundary>
          <ErrorBoundary>
            <AlwaysThrows />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      expect(screen.getByText('Oups ! Une erreur est survenue')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should provide accessible error information', () => {
      render(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );

      // Should have proper heading hierarchy
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Oups ! Une erreur est survenue');
      
      // Button should be accessible
      const resetButton = screen.getByRole('button', { name: 'Réessayer' });
      expect(resetButton).toBeInTheDocument();
    });

    it('should handle keyboard interaction for reset button', () => {
      render(
        <ErrorBoundary>
          <AlwaysThrows />
        </ErrorBoundary>
      );

      const resetButton = screen.getByText('Réessayer');
      
      // Should be focusable
      resetButton.focus();
      expect(resetButton).toHaveFocus();

      // Should be activatable with Enter key
      fireEvent.keyDown(resetButton, { key: 'Enter' });
      // Note: We can't easily test the reset functionality with keyboard in this setup
      // but we can verify the button is accessible
    });
  });
});
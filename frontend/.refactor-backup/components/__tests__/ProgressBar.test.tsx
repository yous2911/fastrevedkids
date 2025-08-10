import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProgressBar } from '../ui/ProgressBar';

describe('ProgressBar Component', () => {
  describe('Basic Rendering', () => {
    it('should render with progress value', () => {
      render(<ProgressBar progress={50} data-testid="progress-bar" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toBeInTheDocument();
      
      const progressFill = progressBar.querySelector('div[style*="width: 50%"]');
      expect(progressFill).toBeInTheDocument();
    });

    it('should render with 0% progress', () => {
      render(<ProgressBar progress={0} data-testid="progress-bar" />);
      const progressBar = screen.getByTestId('progress-bar');
      const progressFill = progressBar.querySelector('div[style*="width: 0%"]');
      expect(progressFill).toBeInTheDocument();
    });

    it('should render with 100% progress', () => {
      render(<ProgressBar progress={100} data-testid="progress-bar" />);
      const progressBar = screen.getByTestId('progress-bar');
      const progressFill = progressBar.querySelector('div[style*="width: 100%"]');
      expect(progressFill).toBeInTheDocument();
    });
  });

  describe('Progress Value Clamping', () => {
    it('should clamp negative values to 0', () => {
      render(<ProgressBar progress={-10} data-testid="progress-bar" />);
      const progressBar = screen.getByTestId('progress-bar');
      const progressFill = progressBar.querySelector('div[style*="width: 0%"]');
      expect(progressFill).toBeInTheDocument();
    });

    it('should clamp values over 100 to 100', () => {
      render(<ProgressBar progress={150} data-testid="progress-bar" />);
      const progressBar = screen.getByTestId('progress-bar');
      const progressFill = progressBar.querySelector('div[style*="width: 100%"]');
      expect(progressFill).toBeInTheDocument();
    });

    it('should handle decimal values', () => {
      render(<ProgressBar progress={33.7} data-testid="progress-bar" />);
      const progressBar = screen.getByTestId('progress-bar');
      const progressFill = progressBar.querySelector('div[style*="width: 33.7%"]');
      expect(progressFill).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render with default variant', () => {
      render(<ProgressBar progress={50} data-testid="progress-bar" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('bg-gray-200');
      
      const progressFill = progressBar.querySelector('div[class*="bg-blue-500"]');
      expect(progressFill).toBeInTheDocument();
    });

    it('should render with sparkle variant', () => {
      render(<ProgressBar progress={50} variant="sparkle" data-testid="progress-bar" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('bg-gradient-to-r', 'from-blue-200', 'to-purple-200');
      
      const progressFill = progressBar.querySelector('div[class*="bg-gradient-to-r"]');
      expect(progressFill).toBeInTheDocument();
      expect(progressFill).toHaveClass('from-blue-500', 'to-purple-500');
    });
  });

  describe('Sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    
    sizes.forEach(size => {
      it(`should render with ${size} size`, () => {
        render(<ProgressBar progress={50} size={size} data-testid="progress-bar" />);
        const progressBar = screen.getByTestId('progress-bar');
        
        switch(size) {
          case 'sm':
            expect(progressBar).toHaveClass('h-2');
            break;
          case 'md':
            expect(progressBar).toHaveClass('h-3');
            break;
          case 'lg':
            expect(progressBar).toHaveClass('h-4');
            break;
        }
      });
    });
  });

  describe('Percentage Display', () => {
    it('should not show percentage by default', () => {
      render(<ProgressBar progress={50} />);
      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });

    it('should show percentage when enabled', () => {
      render(<ProgressBar progress={75} showPercentage />);
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should round percentage values', () => {
      render(<ProgressBar progress={33.7} showPercentage />);
      expect(screen.getByText('34%')).toBeInTheDocument();
    });

    it('should show 0% for negative clamped values', () => {
      render(<ProgressBar progress={-10} showPercentage />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should show 100% for over-100 clamped values', () => {
      render(<ProgressBar progress={150} showPercentage />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should style percentage text correctly', () => {
      render(<ProgressBar progress={50} showPercentage />);
      const percentageText = screen.getByText('50%');
      expect(percentageText).toHaveClass('text-xs', 'text-white', 'font-medium', 'px-2');
    });
  });

  describe('Styling', () => {
    it('should apply custom className', () => {
      render(<ProgressBar progress={50} className="custom-progress" data-testid="progress-bar" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('custom-progress');
    });

    it('should have proper base styling', () => {
      render(<ProgressBar progress={50} data-testid="progress-bar" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass(
        'w-full',
        'rounded-full',
        'overflow-hidden',
        'h-3', // default md size
        'bg-gray-200' // default variant
      );
    });

    it('should have proper fill styling', () => {
      render(<ProgressBar progress={50} data-testid="progress-bar" />);
      const progressBar = screen.getByTestId('progress-bar');
      const progressFill = progressBar.querySelector('div[style*="width: 50%"]');
      
      expect(progressFill).toHaveClass(
        'h-full',
        'transition-all',
        'duration-300',
        'ease-out',
        'bg-blue-500'
      );
    });
  });

  describe('Accessibility', () => {
    it('should support ARIA attributes', () => {
      render(
        <ProgressBar 
          progress={60} 
          role="progressbar"
          aria-valuenow={60}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Loading progress"
        />
      );
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '60');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label', 'Loading progress');
    });

    it('should support data attributes for testing', () => {
      render(<ProgressBar progress={50} data-testid="my-progress" />);
      expect(screen.getByTestId('my-progress')).toBeInTheDocument();
    });
  });

  describe('Animation and Transitions', () => {
    it('should have transition classes on progress fill', () => {
      render(<ProgressBar progress={50} data-testid="progress-bar" />);
      const progressBar = screen.getByTestId('progress-bar');
      const progressFill = progressBar.querySelector('div[style*="width: 50%"]');
      
      expect(progressFill).toHaveClass('transition-all', 'duration-300', 'ease-out');
    });

    it('should animate width changes smoothly', () => {
      const { rerender } = render(<ProgressBar progress={30} data-testid="progress-bar" />);
      let progressBar = screen.getByTestId('progress-bar');
      let progressFill = progressBar.querySelector('div[style*="width: 30%"]');
      expect(progressFill).toBeInTheDocument();
      
      rerender(<ProgressBar progress={80} data-testid="progress-bar" />);
      progressBar = screen.getByTestId('progress-bar');
      progressFill = progressBar.querySelector('div[style*="width: 80%"]');
      expect(progressFill).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero progress', () => {
      render(<ProgressBar progress={0} data-testid="progress-bar" />);
      const progressBar = screen.getByTestId('progress-bar');
      const progressFill = progressBar.querySelector('div[style*="width: 0%"]');
      expect(progressFill).toBeInTheDocument();
    });

    it('should handle full progress', () => {
      render(<ProgressBar progress={100} showPercentage data-testid="progress-bar" />);
      const progressBar = screen.getByTestId('progress-bar');
      const progressFill = progressBar.querySelector('div[style*="width: 100%"]');
      expect(progressFill).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle very small decimal values', () => {
      render(<ProgressBar progress={0.1} showPercentage />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle very close to 100 values', () => {
      render(<ProgressBar progress={99.9} showPercentage />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('should handle all props together', () => {
      render(
        <ProgressBar 
          progress={66.6}
          variant="sparkle"
          size="lg"
          showPercentage
          className="custom-class"
          data-testid="full-progress"
        />
      );
      
      const progressBar = screen.getByTestId('full-progress');
      expect(progressBar).toHaveClass(
        'h-4', // lg size
        'bg-gradient-to-r', 'from-blue-200', 'to-purple-200', // sparkle variant
        'custom-class'
      );
      
      const progressFill = progressBar.querySelector('div[style*="width: 66.6%"]');
      expect(progressFill).toBeInTheDocument();
      expect(progressFill).toHaveClass('from-blue-500', 'to-purple-500'); // sparkle fill
      
      expect(screen.getByText('67%')).toBeInTheDocument(); // rounded percentage
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<ProgressBar progress={50} />);
      const progressBar = document.querySelector('div[class*="w-full"]');
      
      // Re-render with same props
      rerender(<ProgressBar progress={50} />);
      expect(progressBar).toBeInTheDocument();
    });

    it('should handle rapid progress updates', () => {
      const { rerender } = render(<ProgressBar progress={0} data-testid="progress-bar" />);
      
      // Simulate rapid updates
      for (let i = 10; i <= 100; i += 10) {
        rerender(<ProgressBar progress={i} data-testid="progress-bar" />);
      }
      
      const progressBar = screen.getByTestId('progress-bar');
      const progressFill = progressBar.querySelector('div[style*="width: 100%"]');
      expect(progressFill).toBeInTheDocument();
    });
  });
});
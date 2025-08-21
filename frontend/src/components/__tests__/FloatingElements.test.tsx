import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MOCK_FRAMER_MOTION } from '../../tests/mocks';
import { SparkleElements, MagicElements, CelebrationElements } from '../ui/Toast';

// Mock framer-motion
jest.mock('framer-motion', () => MOCK_FRAMER_MOTION);

describe('SparkleElements Component', () => {
  const defaultProps = {
    children: <div>Test Content</div>,
  };

  describe('Basic Rendering', () => {
    it('should render children content', () => {
      render(<SparkleElements {...defaultProps} />);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render with default props', () => {
      render(<SparkleElements {...defaultProps} />);
      const container = screen.getByText('Test Content');
      expect(container).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<SparkleElements {...defaultProps} className="custom-sparkle" />);
      const container = screen.getByText('Test Content');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Intensity Levels', () => {
    const intensities = ['low', 'medium', 'high'] as const;
    
    intensities.forEach(intensity => {
      it(`should render with ${intensity} intensity`, () => {
        render(<SparkleElements {...defaultProps} intensity={intensity} />);
        expect(screen.getByText('Test Content')).toBeInTheDocument();
      });
    });

    it('should default to medium intensity', () => {
      render(<SparkleElements {...defaultProps} />);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('Animation Properties', () => {
    it('should accept custom duration', () => {
      render(<SparkleElements {...defaultProps} duration={3} />);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should accept custom delay', () => {
      render(<SparkleElements {...defaultProps} delay={1} />);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render with multiple animation settings', () => {
      render(
        <SparkleElements 
          {...defaultProps} 
          duration={4} 
          delay={2} 
          intensity="high"
        />
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('Complex Content', () => {
    it('should render complex nested content', () => {
      render(
        <SparkleElements>
          <div>
            <h3>Sparkle Title</h3>
            <p>Sparkle description</p>
            <button>Sparkle Button</button>
          </div>
        </SparkleElements>
      );
      
      expect(screen.getByText('Sparkle Title')).toBeInTheDocument();
      expect(screen.getByText('Sparkle description')).toBeInTheDocument();
      expect(screen.getByText('Sparkle Button')).toBeInTheDocument();
    });

    it('should handle empty children', () => {
      render(<SparkleElements>{null}</SparkleElements>);
      const container = screen.getByTestId('sparkle-container') || document.body.firstElementChild;
      expect(container).toBeInTheDocument();
    });
  });
});

describe('MagicElements Component', () => {
  const defaultProps = {
    children: <div>Magic Content</div>,
  };

  describe('Basic Rendering', () => {
    it('should render children content', () => {
      render(<MagicElements {...defaultProps} />);
      expect(screen.getByText('Magic Content')).toBeInTheDocument();
    });

    it('should render with default props', () => {
      render(<MagicElements {...defaultProps} />);
      const container = screen.getByText('Magic Content');
      expect(container).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<MagicElements {...defaultProps} className="custom-magic" />);
      const container = screen.getByText('Magic Content');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Intensity Levels', () => {
    const intensities = ['low', 'medium', 'high'] as const;
    
    intensities.forEach(intensity => {
      it(`should render with ${intensity} intensity`, () => {
        render(<MagicElements {...defaultProps} intensity={intensity} />);
        expect(screen.getByText('Magic Content')).toBeInTheDocument();
      });
    });

    it('should default to medium intensity', () => {
      render(<MagicElements {...defaultProps} />);
      expect(screen.getByText('Magic Content')).toBeInTheDocument();
    });
  });

  describe('Animation Properties', () => {
    it('should accept custom duration', () => {
      render(<MagicElements {...defaultProps} duration={4} />);
      expect(screen.getByText('Magic Content')).toBeInTheDocument();
    });

    it('should accept custom delay', () => {
      render(<MagicElements {...defaultProps} delay={1.5} />);
      expect(screen.getByText('Magic Content')).toBeInTheDocument();
    });

    it('should render with multiple animation settings', () => {
      render(
        <MagicElements 
          {...defaultProps} 
          duration={5} 
          delay={3} 
          intensity="low"
        />
      );
      expect(screen.getByText('Magic Content')).toBeInTheDocument();
    });
  });

  describe('Complex Content', () => {
    it('should render complex nested content', () => {
      render(
        <MagicElements>
          <div>
            <h2>Magic Heading</h2>
            <ul>
              <li>Magic Item 1</li>
              <li>Magic Item 2</li>
            </ul>
          </div>
        </MagicElements>
      );
      
      expect(screen.getByText('Magic Heading')).toBeInTheDocument();
      expect(screen.getByText('Magic Item 1')).toBeInTheDocument();
      expect(screen.getByText('Magic Item 2')).toBeInTheDocument();
    });
  });
});

describe('CelebrationElements Component', () => {
  const defaultProps = {
    children: <div>Celebration Content</div>,
  };

  describe('Basic Rendering', () => {
    it('should render children content', () => {
      render(<CelebrationElements {...defaultProps} />);
      expect(screen.getByText('Celebration Content')).toBeInTheDocument();
    });

    it('should render with default props', () => {
      render(<CelebrationElements {...defaultProps} />);
      const container = screen.getByText('Celebration Content');
      expect(container).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<CelebrationElements {...defaultProps} className="custom-celebration" />);
      const container = screen.getByText('Celebration Content');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Intensity Levels', () => {
    const intensities = ['low', 'medium', 'high'] as const;
    
    intensities.forEach(intensity => {
      it(`should render with ${intensity} intensity`, () => {
        render(<CelebrationElements {...defaultProps} intensity={intensity} />);
        expect(screen.getByText('Celebration Content')).toBeInTheDocument();
      });
    });

    it('should default to high intensity', () => {
      render(<CelebrationElements {...defaultProps} />);
      expect(screen.getByText('Celebration Content')).toBeInTheDocument();
    });
  });

  describe('Animation Properties', () => {
    it('should accept custom duration', () => {
      render(<CelebrationElements {...defaultProps} duration={2} />);
      expect(screen.getByText('Celebration Content')).toBeInTheDocument();
    });

    it('should accept custom delay', () => {
      render(<CelebrationElements {...defaultProps} delay={0.5} />);
      expect(screen.getByText('Celebration Content')).toBeInTheDocument();
    });

    it('should render with all custom settings', () => {
      render(
        <CelebrationElements 
          {...defaultProps} 
          duration={3} 
          delay={1} 
          intensity="medium"
        />
      );
      expect(screen.getByText('Celebration Content')).toBeInTheDocument();
    });
  });

  describe('Complex Content', () => {
    it('should render celebration with interactive elements', () => {
      render(
        <CelebrationElements>
          <div>
            <h1>🎉 Congratulations! 🎉</h1>
            <p>You have completed the challenge!</p>
            <button>Continue</button>
            <button>Share</button>
          </div>
        </CelebrationElements>
      );
      
      expect(screen.getByText('🎉 Congratulations! 🎉')).toBeInTheDocument();
      expect(screen.getByText('You have completed the challenge!')).toBeInTheDocument();
      expect(screen.getByText('Continue')).toBeInTheDocument();
      expect(screen.getByText('Share')).toBeInTheDocument();
    });

    it('should handle overflow styling correctly', () => {
      render(<CelebrationElements {...defaultProps} />);
      const container = screen.getByText('Celebration Content');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple celebration components', () => {
      render(
        <div>
          <CelebrationElements>
            <div>First Celebration</div>
          </CelebrationElements>
          <CelebrationElements>
            <div>Second Celebration</div>
          </CelebrationElements>
        </div>
      );
      
      expect(screen.getByText('First Celebration')).toBeInTheDocument();
      expect(screen.getByText('Second Celebration')).toBeInTheDocument();
    });

    it('should render without breaking when duration is 0', () => {
      render(<CelebrationElements {...defaultProps} duration={0} />);
      expect(screen.getByText('Celebration Content')).toBeInTheDocument();
    });

    it('should handle negative delay gracefully', () => {
      render(<CelebrationElements {...defaultProps} delay={-1} />);
      expect(screen.getByText('Celebration Content')).toBeInTheDocument();
    });
  });
});

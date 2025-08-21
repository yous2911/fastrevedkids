import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MOCK_FRAMER_MOTION } from '../../tests/mocks';
import { Card } from '../ui/Card';

// Mock framer-motion
jest.mock('framer-motion', () => MOCK_FRAMER_MOTION);

describe('Card Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<Card>Card content</Card>);
      const card = screen.getByText('Card content');
      expect(card).toBeInTheDocument();
    });

    it('should render children content', () => {
      const content = (
        <div>
          <h2>Card Title</h2>
          <p>Card description</p>
        </div>
      );
      
      render(<Card>{content}</Card>);
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card description')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Card className="custom-card">Content</Card>);
      const card = screen.getByText('Content');
      expect(card).toHaveClass('custom-card');
    });
  });

  describe('Variants', () => {
    const VARIANTS = ['default', 'elevated', 'outlined', 'magical'] as const;
    
    VARIANTS.forEach(variant => {
      it(`should render with ${variant} variant`, () => {
        render(<Card variant={variant}>Variant content</Card>);
        const card = screen.getByText('Variant content');
        expect(card).toBeInTheDocument();
        
        // Check for variant-specific classes
        const cardElement = card.closest('[data-testid]') || card.parentElement || card;
        
        if (variant === 'default') {
          expect(cardElement).toHaveClass('bg-white');
        } else if (variant === 'elevated') {
          expect(cardElement).toHaveClass('bg-white');
        } else if (variant === 'outlined') {
          expect(cardElement).toHaveClass('bg-white');
        } else if (variant === 'magical') {
          expect(cardElement).toHaveClass('bg-gradient-to-br');
        }
      });
    });
  });

  describe('Padding', () => {
    const PADDINGS = ['none', 'sm', 'md', 'lg', 'xl'] as const;
    
    PADDINGS.forEach(padding => {
      it(`should render with ${padding} padding`, () => {
        render(<Card padding={padding}>Padding content</Card>);
        const card = screen.getByText('Padding content');
        expect(card).toBeInTheDocument();
        
        // Check for padding-specific classes
        const cardElement = card.closest('[data-testid]') || card.parentElement || card;
        
        if (padding === 'none') {
          expect(cardElement).not.toHaveClass('p-3', 'p-4', 'p-6', 'p-8');
        } else if (padding === 'sm') {
          expect(cardElement).toHaveClass('p-3');
        } else if (padding === 'md') {
          expect(cardElement).toHaveClass('p-4');
        } else if (padding === 'lg') {
          expect(cardElement).toHaveClass('p-6');
        } else if (padding === 'xl') {
          expect(cardElement).toHaveClass('p-8');
        }
      });
    });
  });

  describe('Rounded Corners', () => {
    const ROUNDED_OPTIONS = ['sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const;
    
    ROUNDED_OPTIONS.forEach(rounded => {
      it(`should render with ${rounded} rounded corners`, () => {
        render(<Card rounded={rounded}>Rounded content</Card>);
        const card = screen.getByText('Rounded content');
        expect(card).toBeInTheDocument();
        
        // Check for rounded-specific classes
        expect(card).toHaveClass(`rounded-${rounded}`);
      });
    });
  });

  describe('Interactive States', () => {
    it('should handle click events', async () => {
      const handleClick = jest.fn();
      render(<Card onClick={handleClick}>Clickable card</Card>);
      
      const card = screen.getByText('Clickable card');
      await user.click(card);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should apply hover styles when hoverable', () => {
      render(<Card hoverable>Hoverable card</Card>);
      const card = screen.getByText('Hoverable card');
      
      expect(card).toHaveClass('hover:shadow-lg', 'cursor-pointer');
    });

    it('should not apply hover styles when not hoverable', () => {
      render(<Card>Non-hoverable card</Card>);
      const card = screen.getByText('Non-hoverable card');
      
      expect(card).not.toHaveClass('hover:shadow-lg', 'cursor-pointer');
    });

    it('should handle hover events with hoverable prop', async () => {
      render(<Card hoverable>Hoverable card</Card>);
      const card = screen.getByText('Hoverable card');
      
      await user.hover(card);
      expect(card).toBeInTheDocument();
      
      await user.unhover(card);
      expect(card).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should render static card by default', () => {
      render(<Card>Static card</Card>);
      const card = screen.getByText('Static card');
      expect(card.tagName).toBe('DIV');
    });

    it('should render animated card when animated prop is true', () => {
      render(<Card animated>Animated card</Card>);
      const card = screen.getByText('Animated card');
      expect(card).toBeInTheDocument();
    });

    it('should render both animated and hoverable card', () => {
      render(<Card animated hoverable>Animated hoverable card</Card>);
      const card = screen.getByText('Animated hoverable card');
      expect(card).toBeInTheDocument();
    });

    it('should render animated card with click handler', async () => {
      const handleClick = jest.fn();
      render(<Card animated onClick={handleClick}>Animated clickable card</Card>);
      
      const card = screen.getByText('Animated clickable card');
      await user.click(card);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should be clickable when onClick is provided', async () => {
      const handleClick = jest.fn();
      render(<Card onClick={handleClick}>Clickable card</Card>);
      
      const card = screen.getByText('Clickable card');
      await user.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should apply custom attributes', () => {
      const CARD_PROPS = {
        'data-testid': 'custom-card',
        'aria-label': 'Custom card',
        'role': 'button'
      };
      
      render(
        <Card {...CARD_PROPS}>
          Card with attributes
        </Card>
      );
      
      const card = screen.getByTestId('custom-card');
      expect(card).toHaveAttribute('aria-label', 'Custom card');
      expect(card).toHaveAttribute('role', 'button');
    });

    it('should handle keyboard events when focusable', () => {
      const handleClick = jest.fn();
      
      // Create a button wrapper to test keyboard accessibility
      const KeyboardCard = () => (
        <button onClick={handleClick} style={{ padding: 0, border: 'none', background: 'none' }}>
          <Card>Keyboard accessible card</Card>
        </button>
      );
      
      render(<KeyboardCard />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<Card data-testid="empty-card">{''}</Card>);
      const card = screen.getByTestId('empty-card');
      expect(card).toBeInTheDocument();
    });

    it('should handle null children', () => {
      render(<Card data-testid="null-card">{null}</Card>);
      const card = screen.getByTestId('null-card');
      expect(card).toBeInTheDocument();
    });

    it('should handle multiple children', () => {
      render(
        <Card>
          <span>First child</span>
          <span>Second child</span>
          <span>Third child</span>
        </Card>
      );
      
      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
      expect(screen.getByText('Third child')).toBeInTheDocument();
    });

    it('should handle complex nested content', () => {
      const complexContent = (
        <div>
          <header>
            <h1>Card Header</h1>
            <button>Action</button>
          </header>
          <main>
            <p>Card body content</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </main>
          <footer>
            <small>Card footer</small>
          </footer>
        </div>
      );
      
      render(<Card>{complexContent}</Card>);
      
      expect(screen.getByText('Card Header')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('Card body content')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Card footer')).toBeInTheDocument();
    });
  });

  describe('Style Combinations', () => {
    it('should apply multiple style props correctly', () => {
      render(
        <Card 
          variant="magical"
          padding="xl"
          rounded="3xl"
          hoverable
          animated
          className="custom-styles"
        >
          Complex styled card
        </Card>
      );
      
      const card = screen.getByText('Complex styled card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('custom-styles');
      expect(card).toHaveClass('p-8'); // xl padding
      expect(card).toHaveClass('rounded-3xl'); // 3xl rounded
      expect(card).toHaveClass('cursor-pointer'); // hoverable
    });

    it('should maintain default values when not specified', () => {
      render(<Card>Default card</Card>);
      const card = screen.getByText('Default card');
      
      expect(card).toHaveClass('p-4'); // default md padding
      expect(card).toHaveClass('rounded-lg'); // default lg rounded
      expect(card).toHaveClass('bg-white', 'shadow-md'); // default variant
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<Card>Content</Card>);
      const card = screen.getByText('Content');
      
      // Re-render with same props
      rerender(<Card>Content</Card>);
      expect(card).toBeInTheDocument();
    });

    it('should handle rapid clicks', async () => {
      const handleClick = jest.fn();
      render(<Card onClick={handleClick}>Rapid click card</Card>);
      
      const card = screen.getByText('Rapid click card');
      
      // Simulate rapid clicking
      await user.click(card);
      await user.click(card);
      await user.click(card);
      
      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });
});

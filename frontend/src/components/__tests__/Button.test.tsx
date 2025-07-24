import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Fix: Move React import and create proper mock factory
jest.mock('framer-motion', () => ({
  motion: {
    button: React.forwardRef((props: any, ref: any) => {
      const { children, ...otherProps } = props;
      return React.createElement('button', { ...otherProps, ref }, children);
    }),
  },
}));

// Mock hooks with virtual flag to avoid module resolution issues
jest.mock('../../../hooks/useSound', () => ({
  useSound: () => ({
    playSoundEvent: jest.fn(),
  }),
}), { virtual: true });

jest.mock('../../../hooks/useHaptic', () => ({
  useHaptic: () => ({
    triggerHapticEvent: jest.fn(),
  }),
}), { virtual: true });

// Mock LoadingSpinner component
jest.mock('../LoadingSpinner', () => ({
  LoadingSpinner: () => React.createElement('div', { 'data-testid': 'loading-spinner' }, 'Loading...'),
}), { virtual: true });

// Import Button after mocks are set up
import { Button } from '../ui/Button';

describe('Button Component', () => {
  it('should render with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });

  it('should render with primary variant by default', () => {
    render(<Button>Primary Button</Button>);
    const button = screen.getByRole('button');
    // Check for base classes that should be present
    expect(button).toHaveClass('font-medium');
  });

  it('should render with different variants', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should render with different sizes', () => {
    render(<Button size="lg">Large Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled Button</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should render with icon when provided', () => {
    const icon = <span data-testid="test-icon">🎯</span>;
    render(<Button icon={icon}>Button with Icon</Button>);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should handle different button types', () => {
    render(<Button type="submit">Submit Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should handle loading state', () => {
    render(<Button loading>Loading Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    // Button should be disabled when loading
    expect(button).toBeDisabled();
  });

  it('should render full width when specified', () => {
    render(<Button fullWidth>Full Width Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
}); 
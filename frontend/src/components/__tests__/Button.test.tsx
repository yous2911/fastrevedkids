// src/components/__tests__/Button.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '../ui/Button';

// Mock sound and haptic hooks to prevent errors
jest.mock('../../hooks/useSound', () => ({
  useSound: () => ({
    playSound: jest.fn(),
    isMuted: false,
    volume: 1,
  }),
}));

jest.mock('../../hooks/useHaptic', () => ({
  useHaptic: () => ({
    triggerHaptic: jest.fn(),
    isEnabled: true,
  }),
}));

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Test Button</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('applies correct variant classes', () => {
    render(<Button variant="primary">Primary Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-primary');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('supports different sizes', () => {
    render(<Button size="lg">Large Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-lg');
  });

  it('can be disabled', () => {
    render(<Button disabled>Disabled Button</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('supports custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });
}); 
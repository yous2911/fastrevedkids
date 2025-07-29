import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../ui/Input';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    input: React.forwardRef(({ children, ...props }: any, ref) => <input ref={ref} {...props}>{children}</input>),
    label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock hooks
jest.mock('../../hooks/useSound', () => ({
  useSound: () => ({
    playSound: jest.fn(),
  }),
}));

jest.mock('../../hooks/useHaptic', () => ({
  useHaptic: () => ({
    triggerHaptic: jest.fn(),
  }),
}));

describe('Input Component', () => {
  it('should render with label', () => {
    render(<Input label="Test Label" />);
    
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
  });

  it('should render without label', () => {
    render(<Input placeholder="Test placeholder" />);
    
    expect(screen.getByPlaceholderText('Test placeholder')).toBeInTheDocument();
  });

  it('should display error message', () => {
    render(<Input label="Test" error="This is an error" />);
    
    expect(screen.getByText('This is an error')).toBeInTheDocument();
  });

  it('should display helper text', () => {
    render(<Input label="Test" helperText="This is help text" />);
    
    expect(screen.getByText('This is help text')).toBeInTheDocument();
  });

  it('should handle text input', () => {
    const mockOnChange = jest.fn();
    render(<Input label="Test" onChange={mockOnChange} />);
    
    const input = screen.getByLabelText('Test');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('should handle focus and blur events', () => {
    const mockOnFocus = jest.fn();
    const mockOnBlur = jest.fn();
    
    render(<Input label="Test" onFocus={mockOnFocus} onBlur={mockOnBlur} />);
    
    const input = screen.getByLabelText('Test');
    
    fireEvent.focus(input);
    expect(mockOnFocus).toHaveBeenCalled();
    
    fireEvent.blur(input);
    expect(mockOnBlur).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input label="Test" disabled />);
    
    const input = screen.getByLabelText('Test');
    expect(input).toBeDisabled();
  });

  it('should be required when required prop is true', () => {
    render(<Input label="Test" required />);
    
    const input = screen.getByLabelText('Test');
    expect(input).toBeRequired();
  });

  it('should render with different variants', () => {
    const { rerender } = render(<Input label="Test" variant="default" />);
    expect(screen.getByLabelText('Test')).toBeInTheDocument();

    rerender(<Input label="Test" variant="magical" />);
    expect(screen.getByLabelText('Test')).toBeInTheDocument();
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<Input label="Test" size="sm" />);
    expect(screen.getByLabelText('Test')).toBeInTheDocument();

    rerender(<Input label="Test" size="lg" />);
    expect(screen.getByLabelText('Test')).toBeInTheDocument();
  });

  it('should render with left icon', () => {
    const icon = <span data-testid="test-icon">🔍</span>;
    render(<Input label="Test" leftIcon={icon} />);
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('should handle password type input', () => {
    render(<Input label="Password" type="password" />);
    
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should handle email type input', () => {
    render(<Input label="Email" type="email" />);
    
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('should handle number type input', () => {
    render(<Input label="Number" type="number" />);
    
    const input = screen.getByLabelText('Number');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('should handle maxLength prop', () => {
    render(<Input label="Test" maxLength={100} />);
    
    const input = screen.getByLabelText('Test');
    expect(input).toHaveAttribute('maxLength', '100');
  });

  it('should handle controlled component', () => {
    const mockOnChange = jest.fn();
    render(<Input label="Test" value="controlled value" onChange={mockOnChange} />);
    
    const input = screen.getByLabelText('Test') as HTMLInputElement;
    expect(input.value).toBe('controlled value');
  });
}); 
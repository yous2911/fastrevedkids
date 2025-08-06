import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NextLevelXPSystem from '../NextLevelXPSystem';

// Mock pour Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

describe('NextLevelXPSystem', () => {
  const defaultProps = {
    currentXP: 150,
    level: 3,
    maxXP: 200,
    onLevelUp: jest.fn(),
    onXPGain: jest.fn(),
  };

  it('se rend sans erreur', () => {
    expect(() => {
      render(<NextLevelXPSystem {...defaultProps} />);
    }).not.toThrow();
  });

  it('affiche le niveau actuel', () => {
    render(<NextLevelXPSystem {...defaultProps} />);
    expect(screen.getByText(/Niveau 3/i)).toBeInTheDocument();
  });

  it('affiche l\'XP actuel', () => {
    render(<NextLevelXPSystem {...defaultProps} />);
    expect(screen.getByText(/150 XP/i)).toBeInTheDocument();
  });

  it('accepte différents niveaux', () => {
    const { rerender } = render(<NextLevelXPSystem {...defaultProps} />);
    
    rerender(<NextLevelXPSystem {...defaultProps} level={1} />);
    expect(screen.getByText(/Niveau 1/i)).toBeInTheDocument();
    
    rerender(<NextLevelXPSystem {...defaultProps} level={5} />);
    expect(screen.getByText(/Niveau 5/i)).toBeInTheDocument();
  });

  it('accepte différentes valeurs d\'XP', () => {
    const { rerender } = render(<NextLevelXPSystem {...defaultProps} />);
    
    rerender(<NextLevelXPSystem {...defaultProps} currentXP={50} />);
    expect(screen.getByText(/50 XP/i)).toBeInTheDocument();
    
    rerender(<NextLevelXPSystem {...defaultProps} currentXP={300} />);
    expect(screen.getByText(/300 XP/i)).toBeInTheDocument();
  });
}); 
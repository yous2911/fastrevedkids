import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdvancedMascotSystem from '../AdvancedMascotSystem';

// Mock pour Three.js
jest.mock('three', () => ({
  Scene: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    remove: jest.fn(),
  })),
  PerspectiveCamera: jest.fn().mockImplementation(() => ({
    position: { set: jest.fn() },
    lookAt: jest.fn(),
  })),
  WebGLRenderer: jest.fn().mockImplementation(() => ({
    setSize: jest.fn(),
    render: jest.fn(),
    domElement: document.createElement('canvas'),
  })),
  BoxGeometry: jest.fn(),
  SphereGeometry: jest.fn(),
  MeshPhongMaterial: jest.fn(),
  Mesh: jest.fn(),
  DirectionalLight: jest.fn(),
  AmbientLight: jest.fn(),
  Vector3: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    add: jest.fn(),
    multiplyScalar: jest.fn(),
  })),
}));

// Mock pour Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

describe('AdvancedMascotSystem', () => {
  const defaultProps = {
    studentName: 'Emma',
    currentXP: 150,
    level: 3,
    onInteraction: jest.fn(),
    onEmotionChange: jest.fn(),
  };

  it('se rend sans erreur', () => {
    expect(() => {
      render(<AdvancedMascotSystem {...defaultProps} />);
    }).not.toThrow();
  });

  it('affiche le nom de l\'élève', () => {
    render(<AdvancedMascotSystem {...defaultProps} />);
    expect(screen.getByText(/Emma/i)).toBeInTheDocument();
  });

  it('affiche le niveau actuel', () => {
    render(<AdvancedMascotSystem {...defaultProps} />);
    expect(screen.getByText(/Niveau 3/i)).toBeInTheDocument();
  });

  it('accepte différents noms d\'élèves', () => {
    const { rerender } = render(<AdvancedMascotSystem {...defaultProps} />);
    
    rerender(<AdvancedMascotSystem {...defaultProps} studentName="Lucas" />);
    expect(screen.getByText(/Lucas/i)).toBeInTheDocument();
    
    rerender(<AdvancedMascotSystem {...defaultProps} studentName="Sophie" />);
    expect(screen.getByText(/Sophie/i)).toBeInTheDocument();
  });

  it('accepte différents niveaux', () => {
    const { rerender } = render(<AdvancedMascotSystem {...defaultProps} />);
    
    rerender(<AdvancedMascotSystem {...defaultProps} level={1} />);
    expect(screen.getByText(/Niveau 1/i)).toBeInTheDocument();
    
    rerender(<AdvancedMascotSystem {...defaultProps} level={5} />);
    expect(screen.getByText(/Niveau 5/i)).toBeInTheDocument();
  });
}); 
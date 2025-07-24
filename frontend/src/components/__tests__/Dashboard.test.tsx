// src/components/__tests__/Dashboard.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Dashboard } from '../../pages/Dashboard';

// Mock API calls
jest.mock('../../services/api.service', () => ({
  get: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: 1,
      prenom: 'Alice',
      totalPoints: 150,
      serieJours: 3
    }
  })
}));

// Mock sound and haptic hooks
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

describe('Dashboard Component', () => {
  const mockProps = {
    onNavigate: jest.fn(),
    onStartExercise: jest.fn(),
    onLogout: jest.fn(),
  };

  it('renders loading state initially', () => {
    render(<Dashboard {...mockProps} />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays student information after loading', async () => {
    render(<Dashboard {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument(); // Points
      expect(screen.getByText('3')).toBeInTheDocument(); // Streak
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    const mockGet = require('../../services/api.service').get;
    mockGet.mockRejectedValueOnce(new Error('API Error'));

    render(<Dashboard {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
}); 
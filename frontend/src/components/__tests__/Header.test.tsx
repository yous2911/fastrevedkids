import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MOCK_FRAMER_MOTION } from '../../tests/mocks';
import { Header } from '../layout/Header';

// Mock framer-motion
jest.mock('framer-motion', () => MOCK_FRAMER_MOTION);

// Mock useApp hook
const mockDispatch = jest.fn();
const mockUseApp = jest.fn(() => ({
  state: {
    currentStudent: null as any,
    online: true
  },
  dispatch: mockDispatch
}));

jest.mock('../../context/AppContext', () => ({
  useApp: mockUseApp
}));

// Mock Button component
jest.mock('../ui/Button', () => ({
  Button: ({ onClick, children, icon, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {icon}
      {children}
    </button>
  ),
}));

describe('Header Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    mockUseApp.mockReturnValue({
      state: {
        currentStudent: null,
        online: true
      },
      dispatch: mockDispatch
    });
  });

  describe('Basic Rendering', () => {
    it('should render header with default props', () => {
      render(<Header />);
      
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('should render title when provided', () => {
      render(<Header title="Test Page" />);
      
      expect(screen.getByText('Test Page')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Page');
    });

    it('should not render title when not provided', () => {
      render(<Header />);
      
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Header className="custom-header" />);
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('Back Button', () => {
    it('should show back button when showBackButton is true', () => {
      render(<Header showBackButton />);
      
      expect(screen.getByText('←')).toBeInTheDocument();
    });

    it('should not show back button by default', () => {
      render(<Header />);
      
      expect(screen.queryByText('←')).not.toBeInTheDocument();
    });

    it('should call onBack when back button is clicked', async () => {
      const mockOnBack = jest.fn();
      render(<Header showBackButton onBack={mockOnBack} />);
      
      const backButton = screen.getByText('←');
      await user.click(backButton);
      
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Menu Toggle', () => {
    it('should render menu toggle button', () => {
      render(<Header />);
      
      const menuButton = screen.getByRole('button');
      expect(menuButton).toBeInTheDocument();
    });

    it('should dispatch TOGGLE_SIDEBAR when menu button is clicked', async () => {
      render(<Header />);
      
      const menuButton = screen.getByRole('button');
      await user.click(menuButton);
      
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'TOGGLE_SIDEBAR' });
    });

    it('should render hamburger menu icon', () => {
      render(<Header />);
      
      const menuLines = document.querySelectorAll('.w-full.h-0\\.5.bg-gray-600');
      expect(menuLines).toHaveLength(3);
    });
  });

  describe('Student Information', () => {
    beforeEach(() => {
      mockUseApp.mockReturnValue({
        state: {
          currentStudent: {
            id: 1,
            prenom: 'Alice',
            nom: 'Dupont',
            dateNaissance: '2015-01-01',
            niveauActuel: 'CE2',
            totalPoints: 1250,
            serieJours: 5,
            mascotteType: 'dragon',
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z'
          },
          online: true
        },
        dispatch: mockDispatch
      });
    });

    it('should display student info when currentStudent exists', () => {
      render(<Header />);
      
      expect(screen.getByText('Alice Dupont')).toBeInTheDocument();
      expect(screen.getByText('CE2 • 1250 points')).toBeInTheDocument();
    });

    it('should display correct mascot for dragon type', () => {
      render(<Header />);
      
      expect(screen.getByText('🐉')).toBeInTheDocument();
    });

    it('should display correct mascot for different types', () => {
      const MASCOT_TYPES = [
        { type: 'fairy', emoji: '🧚‍♀️' },
        { type: 'robot', emoji: '🤖' },
        { type: 'cat', emoji: '🐱' },
        { type: 'owl', emoji: '🦉' }
      ];

      MASCOT_TYPES.forEach(({ type, emoji }) => {
        mockUseApp.mockReturnValue({
          state: {
            currentStudent: {
              id: 1,
              prenom: 'Test',
              nom: 'User',
              dateNaissance: '2015-01-01',
              niveauActuel: 'CE2',
              totalPoints: 100,
              serieJours: 5,
              mascotteType: type,
              createdAt: '2023-01-01T00:00:00.000Z',
              updatedAt: '2023-01-01T00:00:00.000Z'
            },
            online: true
          },
          dispatch: mockDispatch
        });

        const { unmount } = render(<Header />);
        expect(screen.getByText(emoji)).toBeInTheDocument();
        unmount();
      });
    });

    it('should not display student info when currentStudent is null', () => {
      mockUseApp.mockReturnValue({
        state: {
          currentStudent: null,
          online: true
        },
        dispatch: mockDispatch
      });

      render(<Header />);
      
      expect(screen.queryByText(/points/)).not.toBeInTheDocument();
    });
  });

  describe('Connection Status', () => {
    it('should show online status when online is true', () => {
      mockUseApp.mockReturnValue({
        state: {
          currentStudent: null,
          online: true
        },
        dispatch: mockDispatch
      });

      render(<Header />);
      
      const statusIndicator = document.querySelector('.bg-green-500');
      expect(statusIndicator).toBeInTheDocument();
      expect(statusIndicator).toHaveAttribute('title', 'Connecté');
    });

    it('should show offline status when online is false', () => {
      mockUseApp.mockReturnValue({
        state: {
          currentStudent: null,
          online: false
        },
        dispatch: mockDispatch
      });

      render(<Header />);
      
      const statusIndicator = document.querySelector('.bg-red-500');
      expect(statusIndicator).toBeInTheDocument();
      expect(statusIndicator).toHaveAttribute('title', 'Hors ligne');
    });
  });

  describe('Actions and Settings', () => {
    it('should render custom actions when provided', () => {
      const customActions = (
        <button data-testid="custom-action">Custom Action</button>
      );

      render(<Header actions={customActions} />);
      
      expect(screen.getByTestId('custom-action')).toBeInTheDocument();
    });

    it('should render settings button', () => {
      render(<Header />);
      
      expect(screen.getByText('⚙️')).toBeInTheDocument();
    });

    it('should not render actions when not provided', () => {
      render(<Header />);
      
      expect(screen.queryByTestId('custom-action')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should have responsive classes for student info', () => {
      mockUseApp.mockReturnValue({
        state: {
          currentStudent: {
            id: 1,
            prenom: 'Alice',
            nom: 'Dupont',
            dateNaissance: '2015-01-01',
            niveauActuel: 'CE2',
            totalPoints: 1250,
            serieJours: 5,
            mascotteType: 'dragon',
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z'
          },
          online: true
        },
        dispatch: mockDispatch
      });

      render(<Header />);
      
      const studentInfo = screen.getByText('Alice Dupont').closest('div');
      expect(studentInfo).toHaveClass('hidden', 'md:flex');
    });

    it('should have responsive classes for menu button', () => {
      render(<Header />);
      
      const menuButton = screen.getByRole('button');
      expect(menuButton).toHaveClass('lg:hidden');
    });
  });

  describe('Layout and Styling', () => {
    it('should have proper header layout classes', () => {
      render(<Header />);
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass(
        'bg-white',
        'shadow-md',
        'border-b',
        'border-gray-200',
        'px-4',
        'py-3',
        'flex',
        'items-center',
        'justify-between'
      );
    });

    it('should have proper section layout', () => {
      render(<Header title="Test" />);
      
      const leftSection = screen.getByText('Test').closest('div');
      expect(leftSection).toHaveClass('flex', 'items-center', 'gap-4');
      
      const rightSection = screen.getByText('⚙️').closest('div');
      expect(rightSection).toHaveClass('flex', 'items-center', 'gap-3');
    });
  });

  describe('Integration', () => {
    it('should work with all props combined', async () => {
      const mockOnBack = jest.fn();
      const customActions = <button data-testid="custom">Action</button>;

      mockUseApp.mockReturnValue({
        state: {
          currentStudent: {
            id: 1,
            prenom: 'Alice',
            nom: 'Dupont',
            dateNaissance: '2015-01-01',
            niveauActuel: 'CE2',
            totalPoints: 1250,
            serieJours: 5,
            mascotteType: 'dragon',
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z'
          },
          online: false
        },
        dispatch: mockDispatch
      });

      render(
        <Header
          title="Complete Header"
          showBackButton
          onBack={mockOnBack}
          actions={customActions}
          className="custom-class"
        />
      );

      // Check all elements are present
      expect(screen.getByText('Complete Header')).toBeInTheDocument();
      expect(screen.getByText('←')).toBeInTheDocument();
      expect(screen.getByText('Alice Dupont')).toBeInTheDocument();
      expect(screen.getByText('🐉')).toBeInTheDocument();
      expect(screen.getByTestId('custom')).toBeInTheDocument();
      expect(screen.getByText('⚙️')).toBeInTheDocument();
      expect(document.querySelector('.bg-red-500')).toBeInTheDocument();

      // Test interactions
      await user.click(screen.getByText('←'));
      expect(mockOnBack).toHaveBeenCalled();

      await user.click(screen.getByRole('button'));
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'TOGGLE_SIDEBAR' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing mascot type gracefully', () => {
      mockUseApp.mockReturnValue({
        state: {
          currentStudent: {
            prenom: 'Alice',
            nom: 'Dupont',
            niveauActuel: 'CE2',
            totalPoints: 1250,
            mascotteType: 'unknown'
          },
          online: true
        },
        dispatch: mockDispatch
      });

      render(<Header />);
      
      expect(screen.getByText('Alice Dupont')).toBeInTheDocument();
      expect(screen.queryByText(/🐉|🧚‍♀️|🤖|🐱|🦉/)).not.toBeInTheDocument();
    });

    it('should handle very long titles', () => {
      const LONG_TITLE = 'This is a very long title that should be truncated properly';
      render(<Header title={LONG_TITLE} />);
      
      const titleElement = screen.getByText(LONG_TITLE);
      expect(titleElement).toHaveClass('truncate');
    });

    it('should handle null actions', () => {
      render(<Header actions={null} />);
      
      expect(screen.getByText('⚙️')).toBeInTheDocument();
    });
  });
});

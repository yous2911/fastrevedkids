import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConsentBanner } from '../gdpr/ConsentBanner';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
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

// Mock function for tests
const mockOnConsentChange = jest.fn();

// Mock UI components
jest.mock('../ui/AnimatedCard', () => ({
  AnimatedCard: ({ children, ...props }: any) => (
    <div data-testid="animated-card" {...props}>
      {children}
    </div>
  ),
}));

jest.mock('../ui/Button', () => ({
  Button: ({ children, onClick, variant, ...props }: any) => (
    <button onClick={onClick} data-variant={variant} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('../ui/Modal', () => ({
  Modal: ({ children, isOpen, title, ...props }: any) => (
    isOpen ? (
      <div data-testid="modal" {...props}>
        <h2>{title}</h2>
        {children}
      </div>
    ) : null
  ),
}));

jest.mock('lucide-react', () => ({
  X: () => <span data-testid="x-icon">X</span>,
  Shield: () => <span data-testid="shield-icon">🛡️</span>,
  Settings: () => <span data-testid="settings-icon">⚙️</span>,
  Eye: () => <span data-testid="eye-icon">👁️</span>,
  AlertTriangle: () => <span data-testid="alert-triangle-icon">⚠️</span>,
}));

describe('ConsentBanner', () => {
  const handleMockOnConsentChange= jest.fn();
  const DEFAULT_CONSENT = {
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
    personalization: false,
    timestamp: new Date(),
    version: '1.0',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  it('should render when showBanner is true', () => {
    render(
      <ConsentBanner
        onConsentChange={mockOnConsentChange}
        showBanner={true}
        currentConsent={DEFAULT_CONSENT}
      />
    );

    expect(screen.getByText(/Protection des données de votre enfant/i)).toBeInTheDocument();
  });

  it('should not render when showBanner is false', () => {
    render(
      <ConsentBanner
        onConsentChange={mockOnConsentChange}
        showBanner={false}
        currentConsent={DEFAULT_CONSENT}
      />
    );

    expect(screen.queryByText(/Protection des données de votre enfant/i)).not.toBeInTheDocument();
  });

  it('should call onConsentChange when accept all button is clicked', () => {
    render(
      <ConsentBanner
        onConsentChange={mockOnConsentChange}
        showBanner={true}
        currentConsent={DEFAULT_CONSENT}
      />
    );

    const acceptAllButton = screen.getByText('Tout accepter');
    fireEvent.click(acceptAllButton);

    expect(mockOnConsentChange).toHaveBeenCalledTimes(1);
  });

  it('should call onConsentChange when essential only button is clicked', () => {
    render(
      <ConsentBanner
        onConsentChange={mockOnConsentChange}
        showBanner={true}
        currentConsent={DEFAULT_CONSENT}
      />
    );

    const essentialButton = screen.getByText('Cookies essentiels uniquement');
    fireEvent.click(essentialButton);

    expect(mockOnConsentChange).toHaveBeenCalledTimes(1);
  });

  it('should open modal when customize button is clicked', () => {
    render(
      <ConsentBanner
        onConsentChange={mockOnConsentChange}
        showBanner={true}
        currentConsent={DEFAULT_CONSENT}
      />
    );

    const customizeButton = screen.getByText('Personnaliser');
    fireEvent.click(customizeButton);

    // The customize button opens a modal, doesn't directly call onConsentChange
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('should display privacy policy link', () => {
    render(
      <ConsentBanner
        onConsentChange={mockOnConsentChange}
        showBanner={true}
        currentConsent={DEFAULT_CONSENT}
      />
    );

    expect(screen.getByText(/politique de confidentialité/i)).toBeInTheDocument();
  });

  it('should show parental consent notice for minor users', () => {
    render(
      <ConsentBanner
        onConsentChange={mockOnConsentChange}
        showBanner={true}
        currentConsent={DEFAULT_CONSENT}
        isMinor={true}
      />
    );

    expect(screen.getByText(/consentement parental/i)).toBeInTheDocument();
  });

  it('should show parental consent requirement notice', () => {
    render(
      <ConsentBanner
        onConsentChange={mockOnConsentChange}
        showBanner={true}
        currentConsent={DEFAULT_CONSENT}
        parentalConsentRequired={true}
      />
    );

    expect(screen.getByText(/consentement parental requis/i)).toBeInTheDocument();
  });
}); 
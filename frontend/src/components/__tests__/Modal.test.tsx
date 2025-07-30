import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { mockFramerMotion } from '../../tests/mocks';
import { Modal } from '../ui/Modal';

// Mock framer-motion
jest.mock('framer-motion', () => mockFramerMotion);

// Mock createPortal
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
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

describe('Modal Component', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnClose = jest.fn();

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    // Reset body styles
    document.body.style.overflow = 'unset';
  });

  afterEach(() => {
    // Cleanup body styles
    document.body.style.overflow = 'unset';
  });

  describe('Basic Rendering', () => {
    it('should not render when closed', () => {
      render(
        <Modal isOpen={false} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );
      
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );
      
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should render with title', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should render without title', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );
      
      expect(screen.getByText('Modal content')).toBeInTheDocument();
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    const sizes = ['sm', 'md', 'lg', 'xl', 'full'] as const;
    
    sizes.forEach(size => {
      it(`should render with ${size} size`, () => {
        render(
          <Modal isOpen={true} onClose={mockOnClose} size={size}>
            <p>Modal content</p>
          </Modal>
        );
        
        const modal = screen.getByText('Modal content').closest('div[class*="max-w"]');
        expect(modal).toBeInTheDocument();
        
        // Check size classes
        switch(size) {
          case 'sm':
            expect(modal).toHaveClass('max-w-md');
            break;
          case 'md':
            expect(modal).toHaveClass('max-w-lg');
            break;
          case 'lg':
            expect(modal).toHaveClass('max-w-2xl');
            break;
          case 'xl':
            expect(modal).toHaveClass('max-w-4xl');
            break;
          case 'full':
            expect(modal).toHaveClass('max-w-screen-xl');
            break;
        }
      });
    });
  });

  describe('Close Button', () => {
    it('should show close button by default', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );
      
      const closeButton = screen.getByText('×');
      expect(closeButton).toBeInTheDocument();
    });

    it('should hide close button when showCloseButton is false', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal" showCloseButton={false}>
          <p>Modal content</p>
        </Modal>
      );
      
      expect(screen.queryByText('×')).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );
      
      const closeButton = screen.getByText('×');
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should show close button even without title when showCloseButton is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} showCloseButton={true}>
          <p>Modal content</p>
        </Modal>
      );
      
      expect(screen.getByText('×')).toBeInTheDocument();
    });
  });

  describe('Overlay Interactions', () => {
    it('should close on overlay click by default', async () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );
      
      const backdrop = document.querySelector('.bg-black');
      expect(backdrop).toBeInTheDocument();
      
      await user.click(backdrop as Element);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not close on overlay click when closeOnOverlayClick is false', async () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={false}>
          <p>Modal content</p>
        </Modal>
      );
      
      const backdrop = document.querySelector('.bg-black');
      expect(backdrop).toBeInTheDocument();
      
      await user.click(backdrop as Element);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should not close when clicking modal content', async () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );
      
      const content = screen.getByText('Modal content');
      await user.click(content);
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Interactions', () => {
    it('should close on Escape key press', async () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );
      
      await user.keyboard('{Escape}');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not close on other key presses', async () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );
      
      await user.keyboard('{Enter}');
      await user.keyboard('{Space}');
      await user.keyboard('a');
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should only respond to Escape when modal is open', async () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );
      
      await user.keyboard('{Escape}');
      expect(mockOnClose).not.toHaveBeenCalled();
      
      rerender(
        <Modal isOpen={true} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );
      
      await user.keyboard('{Escape}');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Body Scroll Prevention', () => {
    it('should prevent body scroll when modal is open by default', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );
      
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when modal closes', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );
      
      expect(document.body.style.overflow).toBe('hidden');
      
      rerender(
        <Modal isOpen={false} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );
      
      expect(document.body.style.overflow).toBe('unset');
    });

    it('should not prevent body scroll when preventBodyScroll is false', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} preventBodyScroll={false}>
          <p>Modal content</p>
        </Modal>
      );
      
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Styling and Layout', () => {
    it('should apply custom className', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} className="custom-modal">
          <p>Modal content</p>
        </Modal>
      );
      
      const modal = screen.getByText('Modal content').closest('div[class*="bg-white"]');
      expect(modal).toHaveClass('custom-modal');
    });

    it('should have proper modal structure', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );
      
      // Check for backdrop
      const backdrop = document.querySelector('.bg-black.bg-opacity-50');
      expect(backdrop).toBeInTheDocument();
      
      // Check for modal container
      const modal = screen.getByText('Modal content').closest('div[class*="bg-white"]');
      expect(modal).toHaveClass('relative', 'bg-white', 'rounded-2xl', 'shadow-2xl');
      
      // Check for header
      const header = screen.getByText('Test Modal').closest('div');
      expect(header).toHaveClass('border-b', 'border-gray-200');
    });

    it('should have scrollable content area', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div style={{ height: '2000px' }}>Very tall content</div>
        </Modal>
      );
      
      const contentArea = document.querySelector('.overflow-y-auto');
      expect(contentArea).toBeInTheDocument();
      expect(contentArea).toHaveClass('max-h-[calc(90vh-120px)]');
    });
  });

  describe('Accessibility', () => {
    it('should support ARIA attributes', () => {
      render(
        <Modal 
          isOpen={true} 
          onClose={mockOnClose}
          title="Accessible Modal"
          role="dialog"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          <p id="modal-description">Modal description</p>
        </Modal>
      );
      
      const modalContainer = document.querySelector('.fixed.inset-0');
      expect(modalContainer).toHaveAttribute('role', 'dialog');
      expect(modalContainer).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(modalContainer).toHaveAttribute('aria-describedby', 'modal-description');
    });

    it('should have proper focus management', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Focus Modal">
          <input type="text" placeholder="Focus test" />
          <button>Test button</button>
        </Modal>
      );
      
      const input = screen.getByPlaceholderText('Focus test');
      const button = screen.getByText('Test button');
      
      expect(input).toBeInTheDocument();
      expect(button).toBeInTheDocument();
    });
  });

  describe('Animation and Transitions', () => {
    it('should have proper animation classes', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <p>Animated content</p>
        </Modal>
      );
      
      // Check for backdrop animation
      const backdrop = document.querySelector('.bg-black');
      expect(backdrop).toBeInTheDocument();
      
      // Check for modal animation
      const modal = screen.getByText('Animated content').closest('div[class*="bg-white"]');
      expect(modal).toBeInTheDocument();
    });

    it('should handle modal state changes', async () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );
      
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
      
      rerender(
        <Modal isOpen={true} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );
      
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });
  });

  describe('Complex Content', () => {
    it('should render complex nested content', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Complex Modal">
          <div>
            <h3>Section Title</h3>
            <p>Some text content</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
            <button>Action Button</button>
          </div>
        </Modal>
      );
      
      expect(screen.getByText('Complex Modal')).toBeInTheDocument();
      expect(screen.getByText('Section Title')).toBeInTheDocument();
      expect(screen.getByText('Some text content')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Action Button')).toBeInTheDocument();
    });

    it('should handle forms inside modal', async () => {
      const mockSubmit = jest.fn((e) => e.preventDefault());
      
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Form Modal">
          <form onSubmit={mockSubmit}>
            <input type="text" placeholder="Name" />
            <textarea placeholder="Description"></textarea>
            <button type="submit">Submit</button>
          </form>
        </Modal>
      );
      
      const nameInput = screen.getByPlaceholderText('Name');
      const descriptionTextarea = screen.getByPlaceholderText('Description');
      const submitButton = screen.getByText('Submit');
      
      await user.type(nameInput, 'Test Name');
      await user.type(descriptionTextarea, 'Test Description');
      await user.click(submitButton);
      
      expect(mockSubmit).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple modals', () => {
      render(
        <>
          <Modal isOpen={true} onClose={mockOnClose} title="First Modal">
            <p>First modal content</p>
          </Modal>
          <Modal isOpen={true} onClose={jest.fn()} title="Second Modal">
            <p>Second modal content</p>
          </Modal>
        </>
      );
      
      expect(screen.getByText('First modal content')).toBeInTheDocument();
      expect(screen.getByText('Second modal content')).toBeInTheDocument();
    });

    it('should handle empty content', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Empty Modal">
          {null}
        </Modal>
      );
      
      expect(screen.getByText('Empty Modal')).toBeInTheDocument();
    });

    it('should cleanup event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('Performance', () => {
    it('should not render when closed to save performance', () => {
      render(
        <Modal isOpen={false} onClose={mockOnClose}>
          <div style={{ height: '10000px' }}>Expensive content</div>
        </Modal>
      );
      
      expect(screen.queryByText('Expensive content')).not.toBeInTheDocument();
    });

    it('should handle rapid open/close cycles', async () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );
      
      // Rapidly toggle modal
      for (let i = 0; i < 5; i++) {
        rerender(
          <Modal isOpen={true} onClose={mockOnClose}>
            <p>Modal content</p>
          </Modal>
        );
        
        rerender(
          <Modal isOpen={false} onClose={mockOnClose}>
            <p>Modal content</p>
          </Modal>
        );
      }
      
      // Final state should be closed
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });
  });
});
import { render, screen, fireEvent } from '@testing-library/react';
import { FrenchMathsGame } from './FrenchMathsGame';

// Mock audio dependencies
jest.mock('howler', () => ({
  Howl: jest.fn(() => ({
    play: jest.fn(),
    stop: jest.fn()
  }))
}));

describe('FrenchMathsGame', () => {
  it('renders game interface', () => {
    render(<FrenchMathsGame />);
    expect(screen.getByText(/mathématiques/i)).toBeInTheDocument();
  });

  it('displays math problem', () => {
    render(<FrenchMathsGame />);
    expect(screen.getByText(/\d+\s*[+\-×÷]\s*\d+/)).toBeInTheDocument();
  });

  it('handles correct answer', () => {
    render(<FrenchMathsGame />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(screen.getByText(/vérifier/i));
    expect(screen.getByText(/correct/i)).toBeInTheDocument();
  });

  it('handles incorrect answer', () => {
    render(<FrenchMathsGame />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '999' } });
    fireEvent.click(screen.getByText(/vérifier/i));
    expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { ExerciseCard } from './ExerciseCard';

describe('ExerciseCard', () => {
  it('renders exercise title', () => {
    render(<ExerciseCard titre="Test Exercise" />);
    expect(screen.getByText('Test Exercise')).toBeInTheDocument();
  });
});

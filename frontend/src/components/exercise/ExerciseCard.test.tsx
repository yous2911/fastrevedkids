import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ExerciseCard } from './ExerciseCard';
import { Exercise } from '../../types';

const mockExercise: Exercise = {
  id: '1',
  type: 'QCM',
  title: 'Test Exercise',
  instructions: 'Choose the correct answer.',
  data: {
    question: 'What is 2 + 2?',
    options: ['3', '4', '5'],
    correctAnswer: '4',
  },
};

describe('ExerciseCard', () => {
  it('renders exercise details correctly', () => {
    render(<ExerciseCard exercise={mockExercise} onSelect={() => {}} />);
    expect(screen.getByText('Test Exercise')).toBeInTheDocument();
    expect(screen.getByText('QCM')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(<ExerciseCard exercise={mockExercise} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(mockExercise);
  });

  it('is accessible', async () => {
    const { container } = render(<ExerciseCard exercise={mockExercise} onSelect={() => {}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

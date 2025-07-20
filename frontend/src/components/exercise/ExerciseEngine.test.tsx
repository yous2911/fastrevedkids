import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExerciseEngine } from './ExerciseEngine';
import { Exercise } from '../../types';
import { AppProvider } from '../../context/AppContext';

const mockQCMExercise: Exercise = {
  id: '1',
  type: 'QCM',
  title: 'QCM Exercise',
  instructions: 'Choose the correct answer.',
  data: {
    question: 'What is 2 + 2?',
    options: ['3', '4', '5'],
    correctAnswer: '4',
  },
};

const mockDragDropExercise: Exercise = {
  id: '2',
  type: 'DragDrop',
  title: 'Drag and Drop Exercise',
  instructions: 'Drag the items to the correct places.',
  data: {
    items: ['Apple', 'Banana'],
    targets: ['Fruit', 'Vegetable'],
    connections: { Apple: 'Fruit', Banana: 'Fruit' },
  },
};

const mockTextLibreExercise: Exercise = {
  id: '3',
  type: 'TextLibre',
  title: 'Free Text Exercise',
  instructions: 'Write a sentence.',
  data: {
    prompt: 'The quick brown fox...',
    validationKeywords: ['jumps', 'lazy', 'dog'],
  },
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(<AppProvider>{component}</AppProvider>);
};

describe('ExerciseEngine', () => {
  it('renders a QCM exercise and handles answers', () => {
    renderWithProvider(<ExerciseEngine exercise={mockQCMExercise} onComplete={() => {}} />);
    expect(screen.getByText('QCM Exercise')).toBeInTheDocument();
    fireEvent.click(screen.getByText('4'));
    // We need to mock the submission/validation logic to test scoring
  });

  it('renders a Drag and Drop exercise', () => {
    renderWithProvider(<ExerciseEngine exercise={mockDragDropExercise} onComplete={() => {}} />);
    expect(screen.getByText('Drag and Drop Exercise')).toBeInTheDocument();
    // More complex interaction testing needed here
  });

  it('renders a Free Text exercise', () => {
    renderWithProvider(<ExerciseEngine exercise={mockTextLibreExercise} onComplete={() => {}} />);
    expect(screen.getByText('Free Text Exercise')).toBeInTheDocument();
    // More complex interaction testing needed here
  });
});

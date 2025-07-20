import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login screen', () => {
  render(<App />);
  const titleElement = screen.getByText(/RevEd Kids/i);
  expect(titleElement).toBeInTheDocument();
});

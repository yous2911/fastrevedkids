import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login screen', () => {
  render(<App />);
  const linkElement = screen.getByText(/Connectez-vous pour commencer à apprendre/i);
  expect(linkElement).toBeInTheDocument();
});

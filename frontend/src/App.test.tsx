import { render, screen } from '@testing-library/react';
import App from './App';

test('renders without crashing', () => {
  render(<App />);
  // This test should pass if the app renders without errors
  expect(document.body).toBeInTheDocument();
});

test('basic math works', () => {
  expect(1 + 1).toBe(2);
  expect(5 * 5).toBe(25);
});

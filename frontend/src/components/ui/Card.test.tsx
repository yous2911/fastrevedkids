import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Card } from './Card';
import 'jest-axe/extend-expect';

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card><div>Card Content</div></Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Card><div>Content</div></Card>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

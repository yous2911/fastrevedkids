import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AppProviders } from '../context';

const AllTheProviders: React.FC = ({ children }) => {
  return <AppProviders>{children}</AppProviders>;
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

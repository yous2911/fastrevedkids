import { renderHook, waitFor } from '@testing-library/react';
import { useApiData } from './useApiData';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/test', (req, res, ctx) => {
    return res(ctx.json({ data: 'test' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useApiData', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useApiData('/api/test'));
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('fetches data successfully', async () => {
    const { result } = renderHook(() => useApiData('/api/test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ data: 'test' });
  });
});

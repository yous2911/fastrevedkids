import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { apiService } from './api.service';

const server = setupServer(
  rest.get('/api/test', (req, res, ctx) => {
    return res(ctx.json({ data: 'test' }));
  }),
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(ctx.json({ token: 'test-token' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('apiService', () => {
  it('makes GET request successfully', async () => {
    const result = await apiService.get('/api/test');
    expect(result.data).toBe('test');
  });

  it('handles network errors', async () => {
    server.use(
      rest.get('/api/error', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    await expect(apiService.get('/api/error')).rejects.toThrow();
  });
});

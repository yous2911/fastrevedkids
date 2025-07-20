import { http, HttpResponse } from 'msw';

export const handlers = [
  // Define your mock API handlers here
  http.get('/api/user', () => {
    return HttpResponse.json({
      firstName: 'John',
      lastName: 'Maverick',
    });
  }),
];

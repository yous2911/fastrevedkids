import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/user', () => {
    return HttpResponse.json({
      firstName: 'John',
      lastName: 'Maverick',
    });
  }),

  // Add CP 2025 specific handlers
  http.get('/api/exercises/by-competence/:code', () => {
    return HttpResponse.json({
      success: true,
      data: {
        exercises: [
          {
            id: 1,
            titre: 'Test Exercise',
            competenceCode: 'CP.FR.L1.1'
          }
        ]
      }
    });
  }),

  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      success: true,
      data: {
        token: 'test_token',
        student: {
          prenom: 'Alice',
          nom: 'Dupont'
        }
      }
    });
  })
];

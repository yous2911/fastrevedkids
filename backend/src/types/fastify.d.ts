import { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    redis?: any;
    jwt: {
      sign: (payload: any) => string;
      verify: (token: string) => any;
    };
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string;
      email: string;
      role: string;
    };
    user: {
      id: string;
      email: string;
      role: string;
    };
  }
}

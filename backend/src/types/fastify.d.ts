import 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    db: any;
    cache: any;
    broadcast: (message: any) => void;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user?: {
      studentId: number;
      prenom: string;
      nom: string;
      niveau: string;
    };
  }
}

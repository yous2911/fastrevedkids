import { FastifyInstance, FastifyRequest } from 'fastify';
import { Pool } from 'mysql2/promise';
import { Redis } from 'ioredis';
import { Student } from '../db/schema';
import { SpacedRepetitionService } from '../services/spaced-repetition.service';

declare module 'fastify' {
  interface FastifyInstance {
    db: Pool;
    redis: Redis;
    authenticate: (request: FastifyRequest) => Promise<void>;
    spacedRepetition: SpacedRepetitionService;
  }

  interface FastifyRequest {
    user: {
      id: number;
    };
  }
}

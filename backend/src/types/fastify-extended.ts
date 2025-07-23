import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/connection';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    db: typeof db;
  }

  interface FastifyRequest {
    user?: {
      id: number;
      prenom: string;
      nom: string;
      niveauActuel: string;
    };
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: number;
      prenom: string;
      nom: string;
      niveauActuel: string;
      iat?: number;
      exp?: number;
    };
    user: {
      id: number;
      prenom: string;
      nom: string;
      niveauActuel: string;
    };
  }
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: number;
    prenom: string;
    nom: string;
    niveauActuel: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    statusCode?: number;
    details?: any;
  };
  timestamp?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
  search?: string;
} 
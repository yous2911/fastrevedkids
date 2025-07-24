// src/tests/setup.ts - Test setup and configuration
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { build } from '../app-test';
import type { FastifyInstance } from 'fastify';

export let app: FastifyInstance;

beforeAll(async () => {
  app = await build();
  await app.ready();
});

afterAll(async () => {
  if (app) {
    await app.close();
  }
});

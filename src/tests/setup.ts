import { beforeAll, afterAll, beforeEach } from 'vitest';
import { connectDatabase, disconnectDatabase } from '../db/connection';

beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});

beforeEach(async () => {
  // Clean up test data if needed
}); 
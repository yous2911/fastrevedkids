import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectDatabase, disconnectDatabase, testConnection } from '../db/connection';

describe('Database Connection Race Condition Tests', () => {
  beforeAll(async () => {
    // Ensure clean state
    try {
      await disconnectDatabase();
    } catch (error) {
      // Ignore errors if not connected
    }
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should handle multiple concurrent connection attempts without race conditions', async () => {
    // Simulate multiple concurrent connection attempts
    const connectionPromises = Array.from({ length: 5 }, (_, i) => 
      connectDatabase().then(() => ({ success: true, index: i }))
        .catch(error => ({ success: false, index: i, error: error.message }))
    );

    const results = await Promise.all(connectionPromises);
    
    // All should succeed
    const successfulConnections = results.filter(r => r.success);
    expect(successfulConnections).toHaveLength(5);
    
    // Test that connection is actually working
    const isConnected = await testConnection();
    expect(isConnected).toBe(true);
  }, 30000);

  it('should handle rapid connect/disconnect cycles', async () => {
    for (let i = 0; i < 3; i++) {
      await connectDatabase();
      const isConnected = await testConnection();
      expect(isConnected).toBe(true);
      
      await disconnectDatabase();
      
      // Small delay to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }, 30000);

  it('should maintain connection state consistency', async () => {
    // First connection
    await connectDatabase();
    expect(await testConnection()).toBe(true);
    
    // Second connection attempt should not fail
    await connectDatabase();
    expect(await testConnection()).toBe(true);
    
    // Third connection attempt should also work
    await connectDatabase();
    expect(await testConnection()).toBe(true);
  }, 30000);
});

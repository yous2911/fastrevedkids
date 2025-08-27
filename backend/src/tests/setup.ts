// src/tests/setup.ts - Test setup and configuration
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { build } from '../app-test';
import { connectDatabase, disconnectDatabase, testConnection } from '../db/connection';
import type { FastifyInstance } from 'fastify';

export let app: FastifyInstance;
let dbConnected = false;
let setupComplete = false;

beforeAll(async () => {
  if (setupComplete) return; // Prevent multiple setups
  
  console.log('🔧 Setting up test environment...');
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  try {
    // Initialize database connection first with retries
    console.log('🔍 Initializing database connection...');
    let isConnected = false;
    
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        // Connect to database first
        await connectDatabase();
        
        // Then test the connection
        isConnected = await testConnection(1);
        if (isConnected) {
          dbConnected = true;
          break;
        }
      } catch (error) {
        console.log(`⚠️ Database connection attempt ${attempt} failed:`, error instanceof Error ? error.message : 'Unknown error');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (!isConnected) {
      throw new Error('Database connection failed after 5 attempts');
    }
    
    console.log('✅ Database connection successful');
    
    // Build the app with longer timeout
    console.log('🏗️ Building test app...');
    app = await build();
    
    // Wait for app to be ready with timeout
    const readyPromise = app.ready();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('App ready timeout')), 45000)
    );
    
    await Promise.race([readyPromise, timeoutPromise]);
    console.log('✅ Test app ready');
    
    setupComplete = true;
    
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    throw error;
  }
});

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    if (app) {
      // Close all active connections first
      await app.close();
      app = null as any;
    }
    if (dbConnected) {
      await disconnectDatabase();
      dbConnected = false;
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    setupComplete = false;
    console.log('✅ Test cleanup completed');
  } catch (error) {
    console.error('⚠️ Test cleanup warning:', error);
  }
});

// Global test timeout - reuse app instance
beforeEach(async () => {
  // Reuse existing app instance - don't rebuild unless necessary
  if (!app) {
    console.log('🔄 Rebuilding app for test...');
    app = await build();
    await app.ready();
  }
});

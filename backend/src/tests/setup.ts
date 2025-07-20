import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { connectDatabase, disconnectDatabase } from '../db/connection';

let dbConnected = false;

beforeAll(async () => {
  try {
    if (!dbConnected) {
      await connectDatabase();
      dbConnected = true;
    }
    
    // Setup test data if needed
    await setupTestData();
  } catch (error) {
    console.error('Test setup failed:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    if (dbConnected) {
      await disconnectDatabase();
      dbConnected = false;
    }
  } catch (error) {
    console.error('Test teardown failed:', error);
  }
});

beforeEach(async () => {
  // Clean slate for each test if needed
  await cleanTestData();
});

afterEach(async () => {
  // Cleanup after each test
  await cleanupTestResources();
});

// Test data setup functions
async function setupTestData() {
  // Create test students if they don't exist
  // This ensures tests have predictable data
  try {
    // Add test student data here
    console.log('Test data setup completed');
  } catch (error) {
    console.warn('Test data setup failed:', error);
  }
}

async function cleanTestData() {
  // Reset test data to known state
  try {
    // Clean up any test artifacts
  } catch (error) {
    console.warn('Test data cleanup failed:', error);
  }
}

async function cleanupTestResources() {
  // Cleanup any resources created during tests
  try {
    // Clear caches, close connections, etc.
  } catch (error) {
    console.warn('Resource cleanup failed:', error);
  }
}

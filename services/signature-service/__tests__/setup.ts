/**
 * @file setup.ts
 * @summary Jest setup for integration tests
 * @description Global setup for integration tests, including AWS service mocking
 */

import { mockAwsServices } from './integration/helpers/awsMocks';
import { setupTestEnvironment } from './integration/helpers/testConfig';

// Setup test environment variables
setupTestEnvironment();

// Mock AWS services before any tests run
mockAwsServices();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.AWS_REGION = 'us-east-1';
process.env.DYNAMODB_TABLE_NAME = 'test-signature-service';
process.env.S3_BUCKET_NAME = 'test-signature-service-bucket';
process.env.KMS_KEY_ID = 'test-key-id';
process.env.EVENT_BUS_NAME = 'test-event-bus';

// Increase timeout for integration tests
jest.setTimeout(30000);

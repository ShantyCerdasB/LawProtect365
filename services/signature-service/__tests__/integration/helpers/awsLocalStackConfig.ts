/**
 * @file awsLocalStackConfig.ts
 * @summary Configuration for using LocalStack real AWS services in integration tests
 * @description Configures environment variables to use real LocalStack AWS services
 * instead of mocks for more realistic integration testing. This provides actual
 * AWS service behavior while running locally.
 */

/**
 * Core LocalStack endpoint configuration
 * 
 * @description Sets the base configuration for all AWS services to use
 * LocalStack instead of real AWS endpoints.
 */
process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test';
process.env.AWS_SECRET_ACCESS_KEY = 'test';

/**
 * KMS service configuration for document signing
 * 
 * @description Configures KMS key settings for digital signature operations
 * in the signature service testing environment.
 */
process.env.KMS_SIGNER_KEY_ID = 'alias/test-key-id';
process.env.KMS_SIGNING_ALGORITHM = 'RSASSA_PSS_SHA_256';

/**
 * S3 service configuration for document storage
 * 
 * @description Defines S3 bucket names for storing evidence and signed documents
 * during integration tests.
 */
process.env.EVIDENCE_BUCKET = 'lawprotect365-sign-evidence-test';
process.env.SIGNED_BUCKET = 'lawprotect365-documents-test';

/**
 * EventBridge service configuration for event publishing
 * 
 * @description Configures event bus and source settings for event-driven
 * architecture testing in the signature service.
 */
process.env.EVENTS_BUS_NAME = 'lawprotect365-event-bus-test';
process.env.EVENTS_SOURCE = 'lawprotect365.signature-service';

/**
 * SSM service configuration for parameter storage
 * 
 * @description Sets the base path for SSM parameters used by the signature
 * service for configuration management.
 */
process.env.SSM_BASE_PATH = '/lawprotect365/test';

/**
 * Cognito service configuration for authentication
 * 
 * @description Configures JWT token settings and Cognito integration
 * for authentication testing in the signature service.
 */
process.env.COGNITO_USER_POOL_ID = 'us-east-1_test';
process.env.COGNITO_CLIENT_ID = 'test-client-id';
process.env.JWT_ISSUER = 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test';
process.env.JWT_AUDIENCE = 'test-client-id';
process.env.JWKS_URI = 'http://localhost:3000/.well-known/jwks.json';

/**
 * Logs the LocalStack configuration status
 * 
 * @description Outputs confirmation that LocalStack services are configured
 * and lists all available AWS services for integration testing.
 */
console.log('🔧 LocalStack configuration loaded for integration tests');
console.log('📋 Using real AWS services via LocalStack:');
console.log('   - KMS: http://localhost:4566');
console.log('   - S3: http://localhost:4566');
console.log('   - EventBridge: http://localhost:4566');
console.log('   - SSM: http://localhost:4566');
console.log('   - DynamoDB: http://localhost:8000 (DynamoDB Local)');

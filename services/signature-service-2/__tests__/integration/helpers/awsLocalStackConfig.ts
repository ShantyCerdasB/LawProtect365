/**
 * @file awsLocalStackConfig.ts
 * @summary Configuration for using LocalStack real AWS services in integration tests
 * @description Replaces mocks with real LocalStack services for more realistic testing
 */

// Configure environment variables for LocalStack
process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test';
process.env.AWS_SECRET_ACCESS_KEY = 'test';

// KMS Configuration
process.env.KMS_SIGNER_KEY_ID = 'alias/test-key-id';
process.env.KMS_SIGNING_ALGORITHM = 'RSASSA_PSS_SHA_256';

// S3 Configuration
process.env.EVIDENCE_BUCKET = 'lawprotect365-sign-evidence-test';
process.env.SIGNED_BUCKET = 'lawprotect365-documents-test';

// EventBridge Configuration
process.env.EVENTS_BUS_NAME = 'lawprotect365-event-bus-test';
process.env.EVENTS_SOURCE = 'lawprotect365.signature-service';

// SSM Configuration
process.env.SSM_BASE_PATH = '/lawprotect365/test';

// Cognito Configuration
process.env.COGNITO_USER_POOL_ID = 'us-east-1_test';
process.env.COGNITO_CLIENT_ID = 'test-client-id';
process.env.JWT_ISSUER = 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test';
process.env.JWT_AUDIENCE = 'test-client-id';
process.env.JWKS_URI = 'http://localhost:3000/.well-known/jwks.json';

console.log('🔧 LocalStack configuration loaded for integration tests');
console.log('📋 Using real AWS services via LocalStack:');
console.log('   - KMS: http://localhost:4566');
console.log('   - S3: http://localhost:4566');
console.log('   - EventBridge: http://localhost:4566');
console.log('   - SSM: http://localhost:4566');
console.log('   - DynamoDB: http://localhost:8000 (DynamoDB Local)');

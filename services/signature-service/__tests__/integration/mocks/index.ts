/**
 * @fileoverview MocksIndex - Central export for all test mocks
 * @summary Exports all mock implementations for integration tests
 * @description Central export file that provides access to all mock implementations
 * for AWS services and Cognito. This simplifies imports in test files and ensures
 * consistent mock loading across the test suite.
 */

// AWS Service Mocks
import './aws/kmsMock';
import './aws/eventBridgeMock';
import './aws/ssmMock';
import './aws/s3Mock';
import './aws/outboxMock';

// Service Mocks - No service mocks needed, only AWS mocks

// Cognito Mocks
import './cognito/jwksMock';

// Re-export commonly used functions
export { 
  startMockJwksServer, 
  stopMockJwksServer, 
  generateTestJwtToken,
  getJwks,
  getKeyMetadata 
} from './cognito/jwksMock';

export { cleanupS3MockStorage } from './aws/s3Cleanup';

// Export mock helpers
export { outboxMockHelpers } from './aws/outboxMock';

console.log('🔧 All mocks loaded - AWS services, Cognito JWKS, and SendEnvelope mocks ready for testing');

/**
 * @fileoverview SsmMock - Realistic SSM service mock for integration tests
 * @summary Provides comprehensive SSM mocking that simulates real AWS SSM behavior
 * @description Mock implementation of AWS SSM service that provides realistic behavior
 * for parameter retrieval operations. The mock returns test values for common parameters
 * used in the signature service.
 */

// Using global jest - no import needed in setupFiles

/**
 * Mock SSM service with realistic behavior
 * 
 * @description Provides comprehensive SSM mocking that simulates real AWS SSM behavior
 * for parameter retrieval operations. The mock returns test values for common parameters
 * used in the signature service.
 */
jest.mock('@aws-sdk/client-ssm', () => ({
  SSMClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockImplementation(async (command: any) => {
      const input = command?.input ?? {};
      const parameterName = input.Name;
      
      // Return test values for common parameters
      const testParameters: Record<string, string> = {
        '/lawprotect365/signature-service/jwt/issuer': 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test',
        '/lawprotect365/signature-service/jwt/audience': 'test-client-id',
        '/lawprotect365/signature-service/jwt/jwks-uri': 'http://localhost:3000/.well-known/jwks.json',
        '/lawprotect365/signature-service/kms/key-id': 'alias/test-key-id',
        '/lawprotect365/signature-service/kms/algorithm': 'RSASSA_PSS_SHA_256',
        '/lawprotect365/signature-service/s3/bucket': 'test-evidence',
        '/lawprotect365/signature-service/eventbridge/bus': 'test-bus',
        '/lawprotect365/signature-service/eventbridge/source': 'lawprotect365.signature-service.test'
      };
      
      const parameterValue = testParameters[parameterName] || 'test-value';
      
      return {
        Parameter: {
          Name: parameterName,
          Value: parameterValue,
          Type: 'String',
          Version: 1,
          LastModifiedDate: new Date(),
          ARN: `arn:aws:ssm:us-east-1:000000000000:parameter${parameterName}`
        }
      } as any;
    }),
  })),
  
  GetParameterCommand: jest.fn().mockImplementation((input: any) => ({ input })),
  GetParametersCommand: jest.fn().mockImplementation((input: any) => ({ input })),
}));

console.log('🔧 SSM mock loaded - realistic parameter retrieval behavior');

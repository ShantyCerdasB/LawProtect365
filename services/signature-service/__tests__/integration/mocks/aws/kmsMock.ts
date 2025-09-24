/**
 * @fileoverview KmsMock - Realistic KMS service mock for integration tests
 * @summary Provides comprehensive KMS mocking that simulates real AWS KMS behavior
 * @description Mock implementation of AWS KMS service that provides realistic behavior
 * for signing, verification, key creation, and alias management operations.
 * The mock detects operation types based on input parameters and returns
 * appropriate responses that match AWS KMS API structure.
 */

// Using global jest - no import needed in setupFiles

/**
 * Mock KMS service with realistic behavior
 * 
 * @description Provides comprehensive KMS mocking that simulates real AWS KMS behavior
 * for signing, verification, key creation, and alias management operations.
 * The mock detects operation types based on input parameters and returns
 * appropriate responses that match AWS KMS API structure.
 */
jest.mock('@aws-sdk/client-kms', () => ({
  KMSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockImplementation(async (command: any) => {
      const input = command?.input ?? {};
      
      // Detect Verify by presence of Signature + SigningAlgorithm
      if (input && (input.Signature && input.SigningAlgorithm)) {
        return { SignatureValid: true } as any;
      }
      
      // Detect Sign by presence of Message + SigningAlgorithm
      if (input && (input.Message || input.SigningAlgorithm)) {
        const message = input.Message ?? new Uint8Array();
        const bytes = typeof message === 'string' ? Buffer.from(message, 'utf8') : Buffer.from(message);
        const algorithm = input.SigningAlgorithm ?? 'RSASSA_PSS_SHA_256';
        const signature = Buffer.from(`mock-signature-${algorithm}-${bytes.toString('hex').substring(0, 8)}`);
        return {
          Signature: signature,
          SigningAlgorithm: algorithm,
          KeyId: input.KeyId || 'test-key-id'
        } as any;
      }

      // Simulate KMS key creation by presence of KeyUsage/CustomerMasterKeySpec
      if (input && (input.KeyUsage || input.CustomerMasterKeySpec)) {
        return {
          KeyMetadata: {
            KeyId: 'test-key-id',
            Arn: 'arn:aws:kms:us-east-1:000000000000:key/test-key-id',
            Description: input.Description || 'Test signing key',
            KeyUsage: input.KeyUsage || 'SIGN_VERIFY',
            CustomerMasterKeySpec: input.CustomerMasterKeySpec || 'RSA_2048',
            KeyState: 'Enabled',
            CreationDate: new Date(),
            Origin: 'AWS_KMS',
            Enabled: true
          }
        } as any;
      }

      // Simulate alias creation
      if (input && input.AliasName && input.TargetKeyId) {
        return {} as any;
      }

      // Default response for unknown operations
      return {} as any;
    }),
  })),
  
  SignCommand: jest.fn().mockImplementation((input: any) => ({ input })),
  VerifyCommand: jest.fn().mockImplementation((input: any) => ({ input })),
  CreateKeyCommand: jest.fn().mockImplementation((input: any) => ({ input })),
  CreateAliasCommand: jest.fn().mockImplementation((input: any) => ({ input })),
}));


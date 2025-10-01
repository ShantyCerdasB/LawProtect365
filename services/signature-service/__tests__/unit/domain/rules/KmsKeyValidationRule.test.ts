import { KmsKeyValidationRule } from '../../../../src/domain/rules/KmsKeyValidationRule';
import { KmsSigner } from '@lawprotect/shared-ts';
import { TestUtils } from '../../../helpers/testUtils';

describe('KmsKeyValidationRule', () => {
  let rule: KmsKeyValidationRule;
  let mockKmsSigner: jest.Mocked<KmsSigner>;

  beforeEach(() => {
    mockKmsSigner = {
      describeKey: jest.fn(),
      sign: jest.fn(),
      verify: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn()
    } as unknown as jest.Mocked<KmsSigner>;
    
    rule = new KmsKeyValidationRule(mockKmsSigner);
  });

  describe('validateKeyForSigning', () => {
    it('should validate successfully when key is enabled and configured for signing', async () => {
      const keyId = TestUtils.generateUuid();
      mockKmsSigner.describeKey.mockResolvedValue({
        keyId: keyId,
        enabled: true,
        keyState: 'Enabled',
        keyUsage: 'SIGN_VERIFY'
      });

      await expect(rule.validateKeyForSigning(keyId)).resolves.not.toThrow();
      expect(mockKmsSigner.describeKey).toHaveBeenCalledWith(keyId);
    });

    it('should throw when key is not enabled', async () => {
      const keyId = TestUtils.generateUuid();
      mockKmsSigner.describeKey.mockResolvedValue({
        keyId: keyId,
        enabled: false,
        keyState: 'Disabled',
        keyUsage: 'SIGN_VERIFY'
      });

      await expect(rule.validateKeyForSigning(keyId)).rejects.toThrow('KMS validation failed');
    });

    it('should throw when key is not configured for signing', async () => {
      const keyId = TestUtils.generateUuid();
      mockKmsSigner.describeKey.mockResolvedValue({
        keyId: keyId,
        enabled: true,
        keyState: 'Enabled',
        keyUsage: 'ENCRYPT_DECRYPT'
      });

      await expect(rule.validateKeyForSigning(keyId)).rejects.toThrow('KMS validation failed');
    });

    it('should throw when key is not found', async () => {
      const keyId = TestUtils.generateUuid();
      const notFoundError = new Error('NotFoundException: Key not found');
      mockKmsSigner.describeKey.mockRejectedValue(notFoundError);

      await expect(rule.validateKeyForSigning(keyId)).rejects.toThrow('KMS key not found');
    });

    it('should throw when access is denied', async () => {
      const keyId = TestUtils.generateUuid();
      const accessDeniedError = new Error('AccessDenied: Permission denied');
      mockKmsSigner.describeKey.mockRejectedValue(accessDeniedError);

      await expect(rule.validateKeyForSigning(keyId)).rejects.toThrow('KMS permission denied');
    });

    it('should throw when validation fails', async () => {
      const keyId = TestUtils.generateUuid();
      const validationError = new Error('validation failed');
      mockKmsSigner.describeKey.mockRejectedValue(validationError);

      await expect(rule.validateKeyForSigning(keyId)).rejects.toThrow('KMS validation failed');
    });

    it('should re-throw domain errors', async () => {
      const keyId = TestUtils.generateUuid();
      const domainError = new Error('Domain error');
      mockKmsSigner.describeKey.mockRejectedValue(domainError);

      await expect(rule.validateKeyForSigning(keyId)).rejects.toThrow('Domain error');
    });
  });

  describe('validateKeysForSigning', () => {
    it('should validate multiple keys successfully', async () => {
      const keyIds = [TestUtils.generateUuid(), TestUtils.generateUuid()];
      mockKmsSigner.describeKey.mockResolvedValue({
        keyId: keyIds[0],
        enabled: true,
        keyState: 'Enabled',
        keyUsage: 'SIGN_VERIFY'
      });

      await expect(rule.validateKeysForSigning(keyIds)).resolves.not.toThrow();
      expect(mockKmsSigner.describeKey).toHaveBeenCalledTimes(2);
    });

    it('should throw when any key validation fails', async () => {
      const keyIds = [TestUtils.generateUuid(), TestUtils.generateUuid()];
      mockKmsSigner.describeKey
        .mockResolvedValueOnce({
          keyId: keyIds[0],
          enabled: true,
          keyState: 'Enabled',
          keyUsage: 'SIGN_VERIFY'
        })
        .mockRejectedValueOnce(new Error('NotFoundException: Key not found'));

      await expect(rule.validateKeysForSigning(keyIds)).rejects.toThrow('KMS key not found');
    });

    it('should validate all keys when all are valid', async () => {
      const keyIds = [TestUtils.generateUuid(), TestUtils.generateUuid(), TestUtils.generateUuid()];
      mockKmsSigner.describeKey.mockResolvedValue({
        keyId: keyIds[0],
        enabled: true,
        keyState: 'Enabled',
        keyUsage: 'SIGN_VERIFY'
      });

      await expect(rule.validateKeysForSigning(keyIds)).resolves.not.toThrow();
      expect(mockKmsSigner.describeKey).toHaveBeenCalledTimes(3);
    });
  });
});

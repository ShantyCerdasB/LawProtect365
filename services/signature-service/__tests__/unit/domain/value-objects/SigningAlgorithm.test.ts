/**
 * @fileoverview SigningAlgorithm unit tests
 * @summary Tests for SigningAlgorithm value object
 * @description Comprehensive unit tests for SigningAlgorithm class methods
 */

import { SigningAlgorithm } from '../../../../src/domain/value-objects/SigningAlgorithm';
import { SigningAlgorithm as SigningAlgorithmEnum, SecurityLevel, ComplianceLevel } from '@lawprotect/shared-ts';
import { BadRequestError } from '@lawprotect/shared-ts';

// Mock the validation functions
jest.mock('@lawprotect/shared-ts', () => ({
  ...jest.requireActual('@lawprotect/shared-ts'),
  validateAlgorithmSecurityLevel: jest.fn(),
  validateAlgorithmCompliance: jest.fn(),
}));

import { validateAlgorithmSecurityLevel, validateAlgorithmCompliance } from '@lawprotect/shared-ts';

const mockValidateAlgorithmSecurityLevel = validateAlgorithmSecurityLevel as jest.MockedFunction<typeof validateAlgorithmSecurityLevel>;
const mockValidateAlgorithmCompliance = validateAlgorithmCompliance as jest.MockedFunction<typeof validateAlgorithmCompliance>;

describe('SigningAlgorithm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a SigningAlgorithm with valid algorithm', () => {
      const algorithm = SigningAlgorithmEnum.SHA256_RSA;
      const signingAlgorithm = new SigningAlgorithm(algorithm);
      
      expect(signingAlgorithm.getValue()).toBe(algorithm);
    });

    it('should throw BadRequestError for empty algorithm', () => {
      expect(() => {
        new SigningAlgorithm('' as any);
      }).toThrow(BadRequestError);
    });

    it('should throw BadRequestError for null algorithm', () => {
      expect(() => {
        new SigningAlgorithm(null as any);
      }).toThrow(BadRequestError);
    });

    it('should throw BadRequestError for algorithm not in allowed list', () => {
      const allowedAlgorithms = [SigningAlgorithmEnum.SHA256_RSA];
      const algorithm = SigningAlgorithmEnum.SHA384_RSA;
      
      expect(() => {
        new SigningAlgorithm(algorithm, allowedAlgorithms);
      }).toThrow(BadRequestError);
    });

    it('should not throw error for algorithm in allowed list', () => {
      const allowedAlgorithms = [SigningAlgorithmEnum.SHA256_RSA, SigningAlgorithmEnum.SHA384_RSA];
      const algorithm = SigningAlgorithmEnum.SHA256_RSA;
      
      expect(() => {
        new SigningAlgorithm(algorithm, allowedAlgorithms);
      }).not.toThrow();
    });

    it('should validate security level when provided', () => {
      const algorithm = SigningAlgorithmEnum.SHA256_RSA;
      const securityLevel = SecurityLevel.HIGH;
      
      mockValidateAlgorithmSecurityLevel.mockImplementation(() => {});
      
      new SigningAlgorithm(algorithm, [], securityLevel);
      
      expect(mockValidateAlgorithmSecurityLevel).toHaveBeenCalledWith(algorithm, securityLevel);
    });

    it('should throw BadRequestError when security level validation fails', () => {
      const algorithm = SigningAlgorithmEnum.SHA256_RSA;
      const securityLevel = SecurityLevel.HIGH;
      
      mockValidateAlgorithmSecurityLevel.mockImplementation(() => {
        throw new Error('Security level too low');
      });
      
      expect(() => {
        new SigningAlgorithm(algorithm, [], securityLevel);
      }).toThrow(BadRequestError);
    });

    it('should validate compliance level when provided', () => {
      const algorithm = SigningAlgorithmEnum.SHA256_RSA;
      const complianceLevel = ComplianceLevel.HIGH_SECURITY;
      
      mockValidateAlgorithmCompliance.mockImplementation(() => {});
      
      new SigningAlgorithm(algorithm, [], undefined, complianceLevel);
      
      expect(mockValidateAlgorithmCompliance).toHaveBeenCalledWith(algorithm, complianceLevel);
    });

    it('should throw BadRequestError when compliance level validation fails', () => {
      const algorithm = SigningAlgorithmEnum.SHA256_RSA;
      const complianceLevel = ComplianceLevel.HIGH_SECURITY;
      
      mockValidateAlgorithmCompliance.mockImplementation(() => {
        throw new Error('Compliance level not met');
      });
      
      expect(() => {
        new SigningAlgorithm(algorithm, [], undefined, complianceLevel);
      }).toThrow(BadRequestError);
    });
  });

  describe('fromString', () => {
    it('should create SigningAlgorithm from valid string', () => {
      const algorithm = SigningAlgorithm.fromString(SigningAlgorithmEnum.SHA256_RSA);
      
      expect(algorithm.getValue()).toBe(SigningAlgorithmEnum.SHA256_RSA);
    });

    it('should throw BadRequestError for invalid algorithm string', () => {
      expect(() => {
        SigningAlgorithm.fromString('INVALID_ALGORITHM');
      }).toThrow(BadRequestError);
    });

    it('should pass through allowed algorithms parameter', () => {
      const allowedAlgorithms = [SigningAlgorithmEnum.SHA256_RSA];
      
      expect(() => {
        SigningAlgorithm.fromString(SigningAlgorithmEnum.SHA384_RSA, allowedAlgorithms);
      }).toThrow(BadRequestError);
    });

    it('should pass through security level parameter', () => {
      const securityLevel = SecurityLevel.HIGH;
      
      mockValidateAlgorithmSecurityLevel.mockImplementation(() => {});
      
      SigningAlgorithm.fromString(SigningAlgorithmEnum.SHA256_RSA, [], securityLevel);
      
      expect(mockValidateAlgorithmSecurityLevel).toHaveBeenCalledWith(SigningAlgorithmEnum.SHA256_RSA, securityLevel);
    });

    it('should pass through compliance level parameter', () => {
      const complianceLevel = ComplianceLevel.HIGH_SECURITY;
      
      mockValidateAlgorithmCompliance.mockImplementation(() => {});
      
      SigningAlgorithm.fromString(SigningAlgorithmEnum.SHA256_RSA, [], undefined, complianceLevel);
      
      expect(mockValidateAlgorithmCompliance).toHaveBeenCalledWith(SigningAlgorithmEnum.SHA256_RSA, complianceLevel);
    });
  });

  describe('static factory methods', () => {
    it('should create SHA256-RSA algorithm', () => {
      const algorithm = SigningAlgorithm.sha256Rsa();
      
      expect(algorithm.getValue()).toBe(SigningAlgorithmEnum.SHA256_RSA);
    });

    it('should create SHA384-RSA algorithm', () => {
      const algorithm = SigningAlgorithm.sha384Rsa();
      
      expect(algorithm.getValue()).toBe(SigningAlgorithmEnum.SHA384_RSA);
    });

    it('should create SHA512-RSA algorithm', () => {
      const algorithm = SigningAlgorithm.sha512Rsa();
      
      expect(algorithm.getValue()).toBe(SigningAlgorithmEnum.SHA512_RSA);
    });

    it('should create ECDSA P-256 algorithm', () => {
      const algorithm = SigningAlgorithm.ecdsaP256();
      
      expect(algorithm.getValue()).toBe(SigningAlgorithmEnum.ECDSA_P256_SHA256);
    });

    it('should create ECDSA P-384 algorithm', () => {
      const algorithm = SigningAlgorithm.ecdsaP384();
      
      expect(algorithm.getValue()).toBe(SigningAlgorithmEnum.ECDSA_P384_SHA384);
    });
  });

  describe('isRsa', () => {
    it('should return true for RSA algorithms', () => {
      const rsaAlgorithms = [
        SigningAlgorithm.sha256Rsa(),
        SigningAlgorithm.sha384Rsa(),
        SigningAlgorithm.sha512Rsa()
      ];
      
      rsaAlgorithms.forEach(algorithm => {
        expect(algorithm.isRsa()).toBe(true);
      });
    });

    it('should return false for ECDSA algorithms', () => {
      const ecdsaAlgorithms = [
        SigningAlgorithm.ecdsaP256(),
        SigningAlgorithm.ecdsaP384()
      ];
      
      ecdsaAlgorithms.forEach(algorithm => {
        expect(algorithm.isRsa()).toBe(false);
      });
    });
  });

  describe('isEcdsa', () => {
    it('should return true for ECDSA algorithms', () => {
      const ecdsaAlgorithms = [
        SigningAlgorithm.ecdsaP256(),
        SigningAlgorithm.ecdsaP384()
      ];
      
      ecdsaAlgorithms.forEach(algorithm => {
        expect(algorithm.isEcdsa()).toBe(true);
      });
    });

    it('should return false for RSA algorithms', () => {
      const rsaAlgorithms = [
        SigningAlgorithm.sha256Rsa(),
        SigningAlgorithm.sha384Rsa(),
        SigningAlgorithm.sha512Rsa()
      ];
      
      rsaAlgorithms.forEach(algorithm => {
        expect(algorithm.isEcdsa()).toBe(false);
      });
    });
  });

  describe('getHashAlgorithm', () => {
    it('should return correct hash algorithm for RSA', () => {
      expect(SigningAlgorithm.sha256Rsa().getHashAlgorithm()).toBe('SHA256');
      expect(SigningAlgorithm.sha384Rsa().getHashAlgorithm()).toBe('SHA384');
      expect(SigningAlgorithm.sha512Rsa().getHashAlgorithm()).toBe('SHA512');
    });

    it('should return correct hash algorithm for ECDSA', () => {
      expect(SigningAlgorithm.ecdsaP256().getHashAlgorithm()).toBe('SHA256');
      expect(SigningAlgorithm.ecdsaP384().getHashAlgorithm()).toBe('SHA384');
    });
  });

  describe('getKeyAlgorithm', () => {
    it('should return RSA for RSA algorithms', () => {
      const rsaAlgorithms = [
        SigningAlgorithm.sha256Rsa(),
        SigningAlgorithm.sha384Rsa(),
        SigningAlgorithm.sha512Rsa()
      ];
      
      rsaAlgorithms.forEach(algorithm => {
        expect(algorithm.getKeyAlgorithm()).toBe('RSA');
      });
    });

    it('should return ECDSA for ECDSA algorithms', () => {
      const ecdsaAlgorithms = [
        SigningAlgorithm.ecdsaP256(),
        SigningAlgorithm.ecdsaP384()
      ];
      
      ecdsaAlgorithms.forEach(algorithm => {
        expect(algorithm.getKeyAlgorithm()).toBe('ECDSA');
      });
    });
  });

  describe('meetsSecurityLevel', () => {
    it('should return true when security level validation passes', () => {
      const algorithm = SigningAlgorithm.sha256Rsa();
      const securityLevel = SecurityLevel.HIGH;
      
      mockValidateAlgorithmSecurityLevel.mockImplementation(() => {});
      
      expect(algorithm.meetsSecurityLevel(securityLevel)).toBe(true);
      expect(mockValidateAlgorithmSecurityLevel).toHaveBeenCalledWith(algorithm.getValue(), securityLevel);
    });

    it('should return false when security level validation fails', () => {
      const algorithm = SigningAlgorithm.sha256Rsa();
      const securityLevel = SecurityLevel.HIGH;
      
      mockValidateAlgorithmSecurityLevel.mockImplementation(() => {
        throw new Error('Security level too low');
      });
      
      expect(algorithm.meetsSecurityLevel(securityLevel)).toBe(false);
    });
  });

  describe('meetsComplianceLevel', () => {
    it('should return true when compliance level validation passes', () => {
      const algorithm = SigningAlgorithm.sha256Rsa();
      const complianceLevel = ComplianceLevel.HIGH_SECURITY;
      
      mockValidateAlgorithmCompliance.mockImplementation(() => {});
      
      expect(algorithm.meetsComplianceLevel(complianceLevel)).toBe(true);
      expect(mockValidateAlgorithmCompliance).toHaveBeenCalledWith(algorithm.getValue(), complianceLevel);
    });

    it('should return false when compliance level validation fails', () => {
      const algorithm = SigningAlgorithm.sha256Rsa();
      const complianceLevel = ComplianceLevel.HIGH_SECURITY;
      
      mockValidateAlgorithmCompliance.mockImplementation(() => {
        throw new Error('Compliance level not met');
      });
      
      expect(algorithm.meetsComplianceLevel(complianceLevel)).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for equal algorithms', () => {
      const algorithm1 = SigningAlgorithm.sha256Rsa();
      const algorithm2 = SigningAlgorithm.sha256Rsa();
      
      expect(algorithm1.equals(algorithm2)).toBe(true);
    });

    it('should return false for different algorithms', () => {
      const algorithm1 = SigningAlgorithm.sha256Rsa();
      const algorithm2 = SigningAlgorithm.sha384Rsa();
      
      expect(algorithm1.equals(algorithm2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the algorithm string representation', () => {
      const algorithm = SigningAlgorithm.sha256Rsa();
      
      expect(algorithm.toString()).toBe(SigningAlgorithmEnum.SHA256_RSA);
      expect(algorithm.toString()).toBe(algorithm.getValue());
    });
  });

  describe('toJSON', () => {
    it('should return the algorithm string for JSON serialization', () => {
      const algorithm = SigningAlgorithm.sha256Rsa();
      
      expect(algorithm.toJSON()).toBe(SigningAlgorithmEnum.SHA256_RSA);
      expect(algorithm.toJSON()).toBe(algorithm.getValue());
    });
  });
});

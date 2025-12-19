/**
 * @fileoverview PatchMeUseCase Tests - Unit tests for PatchMeUseCase
 * @summary Tests for user profile update use case
 * @description Tests all methods in PatchMeUseCase including sanitization, validation, and audit logging.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { PatchMeUseCase } from '../../../../src/application/users/PatchMeUseCase';
import { UserService } from '../../../../src/services/UserService';
import { AuditService } from '../../../../src/services/AuditService';
import { Logger } from '@lawprotect/shared-ts';
import { UserId } from '../../../../src/domain/value-objects/UserId';
import { TestUtils } from '../../../helpers/testUtils';
import { UserProfileRules } from '../../../../src/domain/rules/UserProfileRules';

jest.mock('../../../../src/domain/rules/UserProfileRules');

describe('PatchMeUseCase', () => {
  let useCase: PatchMeUseCase;
  let userService: jest.Mocked<UserService>;
  let auditService: jest.Mocked<AuditService>;
  let logger: jest.Mocked<Logger>;

  beforeEach(() => {
    userService = {
      updateUserProfile: jest.fn()
    } as any;

    auditService = {
      userProfileUpdated: jest.fn()
    } as any;

    logger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    } as any;

    useCase = new PatchMeUseCase(userService, auditService, logger);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should update user profile successfully with name', async () => {
      const userId = TestUtils.generateUuid();
      const request = { name: 'John Doe' };
      const response = {
        meta: {
          changed: true,
          updatedAt: new Date().toISOString()
        }
      };

      (UserProfileRules.sanitizeString as jest.Mock).mockImplementation((s: any) => String(s).trim());
      (UserProfileRules.validateProfileUpdate as jest.Mock).mockImplementation(() => {});
      userService.updateUserProfile.mockResolvedValue(response as any);

      const result = await useCase.execute(userId, request);

      expect(UserProfileRules.validateProfileUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'John Doe' })
      );
      expect(userService.updateUserProfile).toHaveBeenCalledWith(
        new UserId(userId),
        expect.objectContaining({ name: 'John Doe' })
      );
      expect(auditService.userProfileUpdated).toHaveBeenCalledWith(
        userId,
        ['name'],
        expect.any(Object)
      );
      expect(result).toEqual(response);
    });

    it('should update user profile with givenName and lastName', async () => {
      const userId = TestUtils.generateUuid();
      const request = { givenName: 'John', lastName: 'Doe' };
      const response = {
        meta: {
          changed: true,
          updatedAt: new Date().toISOString()
        }
      };

      (UserProfileRules.sanitizeString as jest.Mock).mockImplementation((s: any) => String(s).trim());
      (UserProfileRules.validateProfileUpdate as jest.Mock).mockImplementation(() => {});
      userService.updateUserProfile.mockResolvedValue(response as any);

      await useCase.execute(userId, request);

      expect(auditService.userProfileUpdated).toHaveBeenCalledWith(
        userId,
        ['givenName', 'lastName'],
        expect.any(Object)
      );
    });

    it('should update user profile with personalInfo', async () => {
      const userId = TestUtils.generateUuid();
      const request = {
        personalInfo: {
          phone: '+1234567890',
          locale: 'en-US',
          timeZone: 'America/New_York'
        }
      };
      const response = {
        meta: {
          changed: true,
          updatedAt: new Date().toISOString()
        }
      };

      (UserProfileRules.validateProfileUpdate as jest.Mock).mockImplementation(() => {});
      userService.updateUserProfile.mockResolvedValue(response as any);

      await useCase.execute(userId, request);

      expect(auditService.userProfileUpdated).toHaveBeenCalledWith(
        userId,
        ['phone', 'locale', 'timeZone'],
        expect.any(Object)
      );
    });

    it('should sanitize string fields', async () => {
      const userId = TestUtils.generateUuid();
      const request = { name: '  John Doe  ', givenName: '  John  ' };
      const response = {
        meta: {
          changed: true,
          updatedAt: new Date().toISOString()
        }
      };

      (UserProfileRules.sanitizeString as jest.Mock).mockImplementation((s: any) => String(s).trim());
      (UserProfileRules.validateProfileUpdate as jest.Mock).mockImplementation(() => {});
      userService.updateUserProfile.mockResolvedValue(response as any);

      await useCase.execute(userId, request);

      expect(UserProfileRules.sanitizeString).toHaveBeenCalledWith('  John Doe  ');
      expect(UserProfileRules.sanitizeString).toHaveBeenCalledWith('  John  ');
    });

    it('should remove empty strings after sanitization', async () => {
      const userId = TestUtils.generateUuid();
      const request = { name: '   ', givenName: 'John' };
      const response = {
        meta: {
          changed: true,
          updatedAt: new Date().toISOString()
        }
      };

      (UserProfileRules.sanitizeString as jest.Mock).mockImplementation((s: any) => {
        const trimmed = String(s).trim();
        return trimmed.length > 0 ? trimmed : '';
      });
      (UserProfileRules.validateProfileUpdate as jest.Mock).mockImplementation(() => {});
      userService.updateUserProfile.mockResolvedValue(response as any);

      await useCase.execute(userId, request);

      expect(UserProfileRules.validateProfileUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          givenName: 'John'
        })
      );
      expect(UserProfileRules.validateProfileUpdate).toHaveBeenCalledWith(
        expect.not.objectContaining({
          name: expect.anything()
        })
      );
    });

    it('should trim personalInfo fields', async () => {
      const userId = TestUtils.generateUuid();
      const request = {
        personalInfo: {
          phone: '  +1234567890  ',
          locale: '  en-US  ',
          timeZone: '  America/New_York  '
        }
      };
      const response = {
        meta: {
          changed: true,
          updatedAt: new Date().toISOString()
        }
      };

      (UserProfileRules.validateProfileUpdate as jest.Mock).mockImplementation(() => {});
      userService.updateUserProfile.mockResolvedValue(response as any);

      await useCase.execute(userId, request);

      expect(userService.updateUserProfile).toHaveBeenCalledWith(
        new UserId(userId),
        expect.objectContaining({
          personalInfo: {
            phone: '+1234567890',
            locale: 'en-US',
            timeZone: 'America/New_York'
          }
        })
      );
    });

    it('should remove empty personalInfo fields after trimming', async () => {
      const userId = TestUtils.generateUuid();
      const request = {
        personalInfo: {
          phone: '   ',
          locale: 'en-US',
          timeZone: '   '
        }
      };
      const response = {
        meta: {
          changed: true,
          updatedAt: new Date().toISOString()
        }
      };

      (UserProfileRules.validateProfileUpdate as jest.Mock).mockImplementation(() => {});
      userService.updateUserProfile.mockResolvedValue(response as any);

      await useCase.execute(userId, request);

      expect(userService.updateUserProfile).toHaveBeenCalledWith(
        new UserId(userId),
        expect.objectContaining({
          personalInfo: {
            locale: 'en-US'
          }
        })
      );
    });

    it('should throw error when no fields provided after sanitization', async () => {
      const userId = TestUtils.generateUuid();
      const request = { name: '   ', givenName: '   ' };

      (UserProfileRules.sanitizeString as jest.Mock).mockImplementation((s: any) => {
        const trimmed = String(s).trim();
        return trimmed.length > 0 ? trimmed : '';
      });

      await expect(useCase.execute(userId, request)).rejects.toThrow();

      expect(userService.updateUserProfile).not.toHaveBeenCalled();
    });

    it('should throw error when only empty personalInfo provided', async () => {
      const userId = TestUtils.generateUuid();
      const request = {
        personalInfo: {
          phone: '   ',
          locale: '   ',
          timeZone: '   '
        }
      };

      await expect(useCase.execute(userId, request)).rejects.toThrow();

      expect(userService.updateUserProfile).not.toHaveBeenCalled();
    });

    it('should not create audit event when no changes made', async () => {
      const userId = TestUtils.generateUuid();
      const request = { name: 'John Doe' };
      const response = {
        meta: {
          changed: false,
          updatedAt: new Date().toISOString()
        }
      };

      (UserProfileRules.sanitizeString as jest.Mock).mockImplementation((s: any) => String(s).trim());
      (UserProfileRules.validateProfileUpdate as jest.Mock).mockImplementation(() => {});
      userService.updateUserProfile.mockResolvedValue(response as any);

      await useCase.execute(userId, request);

      expect(auditService.userProfileUpdated).not.toHaveBeenCalled();
    });

    it('should continue if audit event creation fails', async () => {
      const userId = TestUtils.generateUuid();
      const request = { name: 'John Doe' };
      const response = {
        meta: {
          changed: true,
          updatedAt: new Date().toISOString()
        }
      };

      (UserProfileRules.sanitizeString as jest.Mock).mockImplementation((s: any) => String(s).trim());
      (UserProfileRules.validateProfileUpdate as jest.Mock).mockImplementation(() => {});
      userService.updateUserProfile.mockResolvedValue(response as any);
      auditService.userProfileUpdated.mockRejectedValue(new Error('Audit error'));

      const result = await useCase.execute(userId, request);

      expect(result).toBeDefined();
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to create audit event for profile update',
        expect.any(Object)
      );
    });

    it('should throw error when validation fails', async () => {
      const userId = TestUtils.generateUuid();
      const request = { name: 'John Doe' };
      const validationError = new Error('Validation failed');

      (UserProfileRules.sanitizeString as jest.Mock).mockImplementation((s: any) => String(s).trim());
      (UserProfileRules.validateProfileUpdate as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await expect(useCase.execute(userId, request)).rejects.toThrow(validationError);

      expect(userService.updateUserProfile).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'Error in PatchMeUseCase',
        expect.objectContaining({ userId })
      );
    });

    it('should throw error when user service fails', async () => {
      const userId = TestUtils.generateUuid();
      const request = { name: 'John Doe' };
      const serviceError = new Error('Service error');

      (UserProfileRules.sanitizeString as jest.Mock).mockImplementation((s: any) => String(s).trim());
      (UserProfileRules.validateProfileUpdate as jest.Mock).mockImplementation(() => {});
      userService.updateUserProfile.mockRejectedValue(serviceError);

      await expect(useCase.execute(userId, request)).rejects.toThrow(serviceError);

      expect(logger.error).toHaveBeenCalledWith(
        'Error in PatchMeUseCase',
        expect.objectContaining({ userId })
      );
    });

    it('should log successful update', async () => {
      const userId = TestUtils.generateUuid();
      const request = { name: 'John Doe' };
      const response = {
        meta: {
          changed: true,
          updatedAt: new Date().toISOString()
        }
      };

      (UserProfileRules.sanitizeString as jest.Mock).mockImplementation((s: any) => String(s).trim());
      (UserProfileRules.validateProfileUpdate as jest.Mock).mockImplementation(() => {});
      userService.updateUserProfile.mockResolvedValue(response as any);

      await useCase.execute(userId, request);

      expect(logger.info).toHaveBeenCalledWith(
        'User profile updated successfully',
        expect.objectContaining({
          userId,
          changed: true
        })
      );
    });

    it('should include all changed fields in audit event', async () => {
      const userId = TestUtils.generateUuid();
      const request = {
        name: 'John Doe',
        givenName: 'John',
        lastName: 'Doe',
        personalInfo: {
          phone: '+1234567890',
          locale: 'en-US',
          timeZone: 'America/New_York'
        }
      };
      const response = {
        meta: {
          changed: true,
          updatedAt: new Date().toISOString()
        }
      };

      (UserProfileRules.sanitizeString as jest.Mock).mockImplementation((s: any) => String(s).trim());
      (UserProfileRules.validateProfileUpdate as jest.Mock).mockImplementation(() => {});
      userService.updateUserProfile.mockResolvedValue(response as any);

      await useCase.execute(userId, request);

      expect(auditService.userProfileUpdated).toHaveBeenCalledWith(
        userId,
        ['name', 'givenName', 'lastName', 'phone', 'locale', 'timeZone'],
        expect.objectContaining({
          source: 'PatchMeUseCase'
        })
      );
    });

    it('should handle error when error is not Error instance', async () => {
      const userId = TestUtils.generateUuid();
      const request = { givenName: 'John' };
      const stringError = 'String error';

      userService.updateUserProfile.mockRejectedValue(stringError);

      await expect(useCase.execute(userId, request)).rejects.toBe(stringError);
      expect(logger.error).toHaveBeenCalledWith(
        'Error in PatchMeUseCase',
        expect.objectContaining({
          userId,
          error: 'String error'
        })
      );
    });

    it('should handle error when error has stack', async () => {
      const userId = TestUtils.generateUuid();
      const request = { givenName: 'John' };
      const error = new Error('Database error');
      error.stack = 'Error stack trace';

      userService.updateUserProfile.mockRejectedValue(error);

      await expect(useCase.execute(userId, request)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(
        'Error in PatchMeUseCase',
        expect.objectContaining({
          userId,
          error: 'Database error',
          stack: 'Error stack trace'
        })
      );
    });

    it('should handle audit event creation failure gracefully', async () => {
      const userId = TestUtils.generateUuid();
      const request = { givenName: 'John' };
      const response = {
        meta: {
          changed: true,
          updatedAt: new Date().toISOString()
        }
      };

      (UserProfileRules.validateProfileUpdate as jest.Mock).mockImplementation(() => {});
      userService.updateUserProfile.mockResolvedValue(response as any);
      auditService.userProfileUpdated.mockRejectedValue(new Error('Audit error'));

      const result = await useCase.execute(userId, request);

      expect(result).toBe(response);
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to create audit event for profile update',
        expect.objectContaining({
          userId,
          error: 'Audit error'
        })
      );
    });
  });
});


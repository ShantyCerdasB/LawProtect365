/**
 * @fileoverview PreAuthenticationOrchestrator Tests - Unit tests for PreAuthenticationOrchestrator
 * @summary Tests for PreAuthentication orchestrator
 * @description Tests all methods in PreAuthenticationOrchestrator including user validation, MFA policy evaluation, and access control.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { PreAuthenticationOrchestrator } from '../../../../src/application/triggers/PreAuthenticationOrchestrator';
import { UserService } from '../../../../src/services/UserService';
import { CognitoService } from '../../../../src/services/CognitoService';
import { PreAuthEventBuilder } from '../../../helpers/builders';
import { userEntity } from '../../../helpers/builders/user';
import { CognitoSub } from '../../../../src/domain/value-objects/CognitoSub';
import { UserRole, UserAccountStatus, CognitoAttribute } from '../../../../src/domain/enums';
import { AuthServiceConfig } from '../../../../src/config/AppConfig';
import { CognitoEventData } from '../../../../src/domain/value-objects/CognitoEventData';
import { MfaPolicyRules, UserAccessRules } from '../../../../src/domain/rules';

jest.mock('../../../../src/domain/rules/MfaPolicyRules');
jest.mock('../../../../src/domain/rules/UserAccessRules');

describe('PreAuthenticationOrchestrator', () => {
  let orchestrator: PreAuthenticationOrchestrator;
  let userService: jest.Mocked<UserService>;
  let cognitoService: jest.Mocked<CognitoService>;
  let config: AuthServiceConfig;

  beforeEach(() => {
    userService = {
      findByCognitoSub: jest.fn()
    } as any;

    cognitoService = {
      adminGetUser: jest.fn(),
      parseMfaSettings: jest.fn()
    } as any;

    config = {
      features: {
        allowLoginWhenPendingVerification: true
      }
    } as AuthServiceConfig;

    orchestrator = new PreAuthenticationOrchestrator(
      userService,
      cognitoService,
      config
    );

    jest.clearAllMocks();
  });

  describe('processPreAuthentication', () => {
    it('should process event successfully', async () => {
      const event = new PreAuthEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const mfaSettings = {
        mfaEnabled: false,
        isMfaRequiredAttr: false
      };
      const user = userEntity({ cognitoSub: CognitoSub.fromString('test-cognito-sub') });

      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseMfaSettings.mockReturnValue(mfaSettings);
      userService.findByCognitoSub.mockResolvedValue(user);
      (MfaPolicyRules.validateMfaPolicy as jest.Mock).mockImplementation(() => {});
      (UserAccessRules.validateUserAccess as jest.Mock).mockImplementation(() => {});

      const result = await orchestrator.processPreAuthentication(event);

      expect(result).toBe(event);
      expect(cognitoService.adminGetUser).toHaveBeenCalledWith('test-cognito-sub');
    });
  });

  describe('processPreAuthenticationWithData', () => {
    it('should validate user successfully when user exists in database', async () => {
      const event = new PreAuthEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {},
        'test@example.com',
        'John',
        'Doe'
      );

      const mfaSettings = {
        mfaEnabled: false,
        isMfaRequiredAttr: false
      };
      const user = userEntity({
        cognitoSub: CognitoSub.fromString('test-cognito-sub'),
        role: UserRole.CUSTOMER,
        status: UserAccountStatus.ACTIVE
      });

      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseMfaSettings.mockReturnValue(mfaSettings);
      userService.findByCognitoSub.mockResolvedValue(user);
      (MfaPolicyRules.validateMfaPolicy as jest.Mock).mockImplementation(() => {});
      (UserAccessRules.validateUserAccess as jest.Mock).mockImplementation(() => {});

      const result = await orchestrator.processPreAuthenticationWithData(event, eventData);

      expect(result).toBe(event);
      expect(MfaPolicyRules.validateMfaPolicy).toHaveBeenCalledWith(
        UserRole.CUSTOMER,
        mfaSettings,
        undefined
      );
      expect(UserAccessRules.validateUserAccess).toHaveBeenCalledWith(
        UserAccountStatus.ACTIVE,
        true
      );
    });

    it('should validate user successfully when user does not exist in database', async () => {
      const event = new PreAuthEventBuilder()
        .withUserName('test-cognito-sub')
        .withRole(UserRole.CUSTOMER)
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {
          [CognitoAttribute.CUSTOM_ROLE]: UserRole.CUSTOMER
        },
        'test@example.com',
        'John',
        'Doe'
      );

      const mfaSettings = {
        mfaEnabled: false,
        isMfaRequiredAttr: false
      };

      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseMfaSettings.mockReturnValue(mfaSettings);
      userService.findByCognitoSub.mockResolvedValue(null);
      (MfaPolicyRules.validateMfaPolicy as jest.Mock).mockImplementation(() => {});
      (UserAccessRules.validateUserAccess as jest.Mock).mockImplementation(() => {});

      const result = await orchestrator.processPreAuthenticationWithData(event, eventData);

      expect(result).toBe(event);
      expect(MfaPolicyRules.validateMfaPolicy).toHaveBeenCalledWith(
        UserRole.CUSTOMER,
        mfaSettings,
        undefined
      );
      expect(UserAccessRules.validateUserAccess).toHaveBeenCalledWith(
        UserAccountStatus.ACTIVE,
        true
      );
    });

    it('should use UNASSIGNED role when role not in attributes and user not in database', async () => {
      const event = new PreAuthEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {},
        'test@example.com',
        'John',
        'Doe'
      );

      const mfaSettings = {
        mfaEnabled: false,
        isMfaRequiredAttr: false
      };

      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseMfaSettings.mockReturnValue(mfaSettings);
      userService.findByCognitoSub.mockResolvedValue(null);
      (MfaPolicyRules.validateMfaPolicy as jest.Mock).mockImplementation(() => {});
      (UserAccessRules.validateUserAccess as jest.Mock).mockImplementation(() => {});

      await orchestrator.processPreAuthenticationWithData(event, eventData);

      expect(MfaPolicyRules.validateMfaPolicy).toHaveBeenCalledWith(
        UserRole.UNASSIGNED,
        mfaSettings,
        undefined
      );
    });

    it('should use custom MFA required from attributes', async () => {
      const event = new PreAuthEventBuilder()
        .withUserName('test-cognito-sub')
        .withUserAttributes({
          [CognitoAttribute.CUSTOM_MFA_REQUIRED]: 'true'
        })
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {
          [CognitoAttribute.CUSTOM_MFA_REQUIRED]: 'true'
        },
        'test@example.com',
        'John',
        'Doe'
      );

      const mfaSettings = {
        mfaEnabled: false,
        isMfaRequiredAttr: false
      };
      const user = userEntity({
        cognitoSub: CognitoSub.fromString('test-cognito-sub'),
        role: UserRole.CUSTOMER
      });

      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseMfaSettings.mockReturnValue(mfaSettings);
      userService.findByCognitoSub.mockResolvedValue(user);
      (MfaPolicyRules.validateMfaPolicy as jest.Mock).mockImplementation(() => {});
      (UserAccessRules.validateUserAccess as jest.Mock).mockImplementation(() => {});

      await orchestrator.processPreAuthenticationWithData(event, eventData);

      expect(MfaPolicyRules.validateMfaPolicy).toHaveBeenCalledWith(
        UserRole.CUSTOMER,
        mfaSettings,
        true
      );
    });

    it('should handle database retrieval failure gracefully', async () => {
      const event = new PreAuthEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {},
        'test@example.com',
        'John',
        'Doe'
      );

      const mfaSettings = {
        mfaEnabled: false,
        isMfaRequiredAttr: false
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseMfaSettings.mockReturnValue(mfaSettings);
      userService.findByCognitoSub.mockRejectedValue(new Error('Database error'));
      (MfaPolicyRules.validateMfaPolicy as jest.Mock).mockImplementation(() => {});
      (UserAccessRules.validateUserAccess as jest.Mock).mockImplementation(() => {});

      const result = await orchestrator.processPreAuthenticationWithData(event, eventData);

      expect(result).toBe(event);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should throw error when Cognito data retrieval fails', async () => {
      const event = new PreAuthEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {},
        'test@example.com',
        'John',
        'Doe'
      );

      cognitoService.adminGetUser.mockRejectedValue(new Error('Cognito error'));

      await expect(
        orchestrator.processPreAuthenticationWithData(event, eventData)
      ).rejects.toThrow();
    });

    it('should throw error when MFA policy validation fails', async () => {
      const event = new PreAuthEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {},
        'test@example.com',
        'John',
        'Doe'
      );

      const mfaSettings = {
        mfaEnabled: false,
        isMfaRequiredAttr: false
      };
      const user = userEntity({
        cognitoSub: CognitoSub.fromString('test-cognito-sub'),
        role: UserRole.CUSTOMER
      });
      const policyError = new Error('MFA policy violation');

      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseMfaSettings.mockReturnValue(mfaSettings);
      userService.findByCognitoSub.mockResolvedValue(user);
      (MfaPolicyRules.validateMfaPolicy as jest.Mock).mockImplementation(() => {
        throw policyError;
      });

      await expect(
        orchestrator.processPreAuthenticationWithData(event, eventData)
      ).rejects.toThrow(policyError);
    });

    it('should throw error when user access validation fails', async () => {
      const event = new PreAuthEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {},
        'test@example.com',
        'John',
        'Doe'
      );

      const mfaSettings = {
        mfaEnabled: false,
        isMfaRequiredAttr: false
      };
      const user = userEntity({
        cognitoSub: CognitoSub.fromString('test-cognito-sub'),
        status: UserAccountStatus.SUSPENDED
      });
      const accessError = new Error('Access denied');

      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseMfaSettings.mockReturnValue(mfaSettings);
      userService.findByCognitoSub.mockResolvedValue(user);
      (MfaPolicyRules.validateMfaPolicy as jest.Mock).mockImplementation(() => {});
      (UserAccessRules.validateUserAccess as jest.Mock).mockImplementation(() => {
        throw accessError;
      });

      await expect(
        orchestrator.processPreAuthenticationWithData(event, eventData)
      ).rejects.toThrow(accessError);
    });

    it('should use allowPendingVerification from config', async () => {
      config.features.allowLoginWhenPendingVerification = false;

      const event = new PreAuthEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {},
        'test@example.com',
        'John',
        'Doe'
      );

      const mfaSettings = {
        mfaEnabled: false,
        isMfaRequiredAttr: false
      };
      const user = userEntity({
        cognitoSub: CognitoSub.fromString('test-cognito-sub'),
        status: UserAccountStatus.ACTIVE
      });

      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseMfaSettings.mockReturnValue(mfaSettings);
      userService.findByCognitoSub.mockResolvedValue(user);
      (MfaPolicyRules.validateMfaPolicy as jest.Mock).mockImplementation(() => {});
      (UserAccessRules.validateUserAccess as jest.Mock).mockImplementation(() => {});

      await orchestrator.processPreAuthenticationWithData(event, eventData);

      expect(UserAccessRules.validateUserAccess).toHaveBeenCalledWith(
        UserAccountStatus.ACTIVE,
        false
      );
    });

    it('should handle case when custom MFA required is false', async () => {
      const event = new PreAuthEventBuilder()
        .withUserName('test-cognito-sub')
        .withUserAttributes({
          [CognitoAttribute.CUSTOM_MFA_REQUIRED]: 'false'
        })
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {
          [CognitoAttribute.CUSTOM_MFA_REQUIRED]: 'false'
        },
        'test@example.com',
        'John',
        'Doe'
      );

      const mfaSettings = {
        mfaEnabled: false,
        isMfaRequiredAttr: false
      };
      const user = userEntity({
        cognitoSub: CognitoSub.fromString('test-cognito-sub'),
        role: UserRole.CUSTOMER
      });

      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseMfaSettings.mockReturnValue(mfaSettings);
      userService.findByCognitoSub.mockResolvedValue(user);
      (MfaPolicyRules.validateMfaPolicy as jest.Mock).mockImplementation(() => {});
      (UserAccessRules.validateUserAccess as jest.Mock).mockImplementation(() => {});

      await orchestrator.processPreAuthenticationWithData(event, eventData);

      expect(MfaPolicyRules.validateMfaPolicy).toHaveBeenCalledWith(
        UserRole.CUSTOMER,
        mfaSettings,
        false
      );
    });

    it('should handle case when custom MFA required is undefined', async () => {
      const event = new PreAuthEventBuilder()
        .withUserName('test-cognito-sub')
        .withUserAttributes({
          [CognitoAttribute.CUSTOM_MFA_REQUIRED]: 'invalid'
        })
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {
          [CognitoAttribute.CUSTOM_MFA_REQUIRED]: 'invalid'
        },
        'test@example.com',
        'John',
        'Doe'
      );

      const mfaSettings = {
        mfaEnabled: false,
        isMfaRequiredAttr: false
      };
      const user = userEntity({
        cognitoSub: CognitoSub.fromString('test-cognito-sub'),
        role: UserRole.CUSTOMER
      });

      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseMfaSettings.mockReturnValue(mfaSettings);
      userService.findByCognitoSub.mockResolvedValue(user);
      (MfaPolicyRules.validateMfaPolicy as jest.Mock).mockImplementation(() => {});
      (UserAccessRules.validateUserAccess as jest.Mock).mockImplementation(() => {});

      await orchestrator.processPreAuthenticationWithData(event, eventData);

      expect(MfaPolicyRules.validateMfaPolicy).toHaveBeenCalledWith(
        UserRole.CUSTOMER,
        mfaSettings,
        undefined
      );
    });
  });
});


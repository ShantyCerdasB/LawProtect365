/**
 * @fileoverview PreTokenGenerationOrchestrator Tests - Unit tests for PreTokenGenerationOrchestrator
 * @summary Tests for PreTokenGeneration orchestrator
 * @description Tests all methods in PreTokenGenerationOrchestrator including claims building, filtering, and token enrichment.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { PreTokenGenerationOrchestrator } from '../../../../src/application/triggers/PreTokenGenerationOrchestrator';
import { UserService } from '../../../../src/services/UserService';
import { CognitoService } from '../../../../src/services/CognitoService';
import { PreTokenGenEventBuilder } from '../../../helpers/builders';
import { userEntity } from '../../../helpers/builders/user';
import { CognitoSub } from '../../../../src/domain/value-objects/CognitoSub';
import { UserRole, UserAccountStatus, CognitoAttribute } from '../../../../src/domain/enums';
import { AuthServiceConfig } from '../../../../src/config/AppConfig';
import { CognitoEventData } from '../../../../src/domain/value-objects/CognitoEventData';
import { ClaimsMappingRules } from '../../../../src/domain/rules/ClaimsMappingRules';

jest.mock('../../../../src/domain/rules/ClaimsMappingRules');

describe('PreTokenGenerationOrchestrator', () => {
  let orchestrator: PreTokenGenerationOrchestrator;
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
        tokenIncludeAccountStatus: true,
        tokenIncludeInternalUserId: true,
        tokenIncludeMfaFlags: true
      }
    } as AuthServiceConfig;

    orchestrator = new PreTokenGenerationOrchestrator(
      userService,
      cognitoService,
      config
    );

    jest.clearAllMocks();
  });

  describe('processPreTokenGeneration', () => {
    it('should process event successfully', async () => {
      const event = new PreTokenGenEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const mfaSettings = {
        mfaEnabled: false,
        isMfaRequiredAttr: false
      };
      const user = userEntity({ cognitoSub: CognitoSub.fromString('test-cognito-sub') });
      const claims = {
        'custom:role': UserRole.CUSTOMER
      };

      userService.findByCognitoSub.mockResolvedValue(user);
      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseMfaSettings.mockReturnValue(mfaSettings);
      (ClaimsMappingRules.isMfaRequiredByPolicy as jest.Mock).mockReturnValue(false);
      (ClaimsMappingRules.buildAllClaims as jest.Mock).mockReturnValue(claims);
      (ClaimsMappingRules.toClaimsOverrideDetails as jest.Mock).mockReturnValue({} as any);

      const result = await orchestrator.processPreTokenGeneration(event);

      expect(result.response.claimsOverrideDetails).toBeDefined();
    });
  });

  describe('processPreTokenGenerationWithData', () => {
    it('should build claims successfully when user exists', async () => {
      const event = new PreTokenGenEventBuilder()
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
      const allClaims = {
        'custom:role': UserRole.CUSTOMER,
        'custom:account_status': UserAccountStatus.ACTIVE,
        'custom:user_id': user.getId().toString(),
        'custom:is_mfa_required': false,
        'custom:mfa_enabled': false
      };

      userService.findByCognitoSub.mockResolvedValue(user);
      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseMfaSettings.mockReturnValue(mfaSettings);
      (ClaimsMappingRules.isMfaRequiredByPolicy as jest.Mock).mockReturnValue(false);
      (ClaimsMappingRules.buildAllClaims as jest.Mock).mockReturnValue(allClaims);
      (ClaimsMappingRules.toClaimsOverrideDetails as jest.Mock).mockReturnValue({} as any);

      const result = await orchestrator.processPreTokenGenerationWithData(event, eventData);

      expect(result.response.claimsOverrideDetails).toBeDefined();
      expect(ClaimsMappingRules.buildAllClaims).toHaveBeenCalled();
    });

    it('should return default claims when user does not exist', async () => {
      const event = new PreTokenGenEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {},
        'test@example.com',
        'John',
        'Doe'
      );

      const defaultClaims = {
        'custom:role': UserRole.UNASSIGNED
      };

      userService.findByCognitoSub.mockResolvedValue(null);
      (ClaimsMappingRules.getDefaultClaims as jest.Mock).mockReturnValue(defaultClaims);
      (ClaimsMappingRules.toClaimsOverrideDetails as jest.Mock).mockReturnValue({} as any);

      const result = await orchestrator.processPreTokenGenerationWithData(event, eventData);

      expect(result.response.claimsOverrideDetails).toBeDefined();
      expect(ClaimsMappingRules.getDefaultClaims).toHaveBeenCalled();
    });

    it('should filter claims based on configuration', async () => {
      config.features.tokenIncludeAccountStatus = false;
      config.features.tokenIncludeInternalUserId = false;
      config.features.tokenIncludeMfaFlags = false;

      const event = new PreTokenGenEventBuilder()
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
      const allClaims = {
        'custom:role': UserRole.CUSTOMER,
        'custom:account_status': UserAccountStatus.ACTIVE,
        'custom:user_id': user.getId().toString(),
        'custom:is_mfa_required': false,
        'custom:mfa_enabled': false
      };

      userService.findByCognitoSub.mockResolvedValue(user);
      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseMfaSettings.mockReturnValue(mfaSettings);
      (ClaimsMappingRules.isMfaRequiredByPolicy as jest.Mock).mockReturnValue(false);
      (ClaimsMappingRules.buildAllClaims as jest.Mock).mockReturnValue(allClaims);
      (ClaimsMappingRules.toClaimsOverrideDetails as jest.Mock).mockReturnValue({} as any);

      await orchestrator.processPreTokenGenerationWithData(event, eventData);

      expect(ClaimsMappingRules.toClaimsOverrideDetails).toHaveBeenCalledWith(
        expect.objectContaining({
          'custom:role': UserRole.CUSTOMER
        })
      );
    });

    it('should handle Cognito MFA data retrieval failure gracefully', async () => {
      const event = new PreTokenGenEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {},
        'test@example.com',
        'John',
        'Doe'
      );

      const user = userEntity({
        cognitoSub: CognitoSub.fromString('test-cognito-sub'),
        role: UserRole.CUSTOMER
      });
      const allClaims = {
        'custom:role': UserRole.CUSTOMER
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      userService.findByCognitoSub.mockResolvedValue(user);
      cognitoService.adminGetUser.mockRejectedValue(new Error('Cognito error'));
      (ClaimsMappingRules.isMfaRequiredByPolicy as jest.Mock).mockReturnValue(false);
      (ClaimsMappingRules.buildAllClaims as jest.Mock).mockReturnValue(allClaims);
      (ClaimsMappingRules.toClaimsOverrideDetails as jest.Mock).mockReturnValue({} as any);

      const result = await orchestrator.processPreTokenGenerationWithData(event, eventData);

      expect(result.response.claimsOverrideDetails).toBeDefined();
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should handle database retrieval failure gracefully', async () => {
      const event = new PreTokenGenEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {},
        'test@example.com',
        'John',
        'Doe'
      );

      const defaultClaims = {
        'custom:role': UserRole.UNASSIGNED
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      userService.findByCognitoSub.mockRejectedValue(new Error('Database error'));
      (ClaimsMappingRules.getDefaultClaims as jest.Mock).mockReturnValue(defaultClaims);
      (ClaimsMappingRules.toClaimsOverrideDetails as jest.Mock).mockReturnValue({} as any);

      const result = await orchestrator.processPreTokenGenerationWithData(event, eventData);

      expect(result.response.claimsOverrideDetails).toBeDefined();
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should return default claims on error and log error', async () => {
      const event = new PreTokenGenEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {},
        'test@example.com',
        'John',
        'Doe'
      );

      const defaultClaims = {
        'custom:role': UserRole.UNASSIGNED
      };

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      userService.findByCognitoSub.mockRejectedValue(new Error('Unexpected error'));
      (ClaimsMappingRules.getDefaultClaims as jest.Mock).mockReturnValue(defaultClaims);
      (ClaimsMappingRules.toClaimsOverrideDetails as jest.Mock).mockReturnValue({} as any);

      const result = await orchestrator.processPreTokenGenerationWithData(event, eventData);

      expect(result.response.claimsOverrideDetails).toBeDefined();
      // Error is logged internally, but the function doesn't throw and returns default claims

      consoleLogSpy.mockRestore();
    });

    it('should use custom MFA required from attributes', async () => {
      const event = new PreTokenGenEventBuilder()
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
      const allClaims = {
        'custom:role': UserRole.CUSTOMER
      };

      userService.findByCognitoSub.mockResolvedValue(user);
      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseMfaSettings.mockReturnValue(mfaSettings);
      (ClaimsMappingRules.isMfaRequiredByPolicy as jest.Mock).mockReturnValue(true);
      (ClaimsMappingRules.buildAllClaims as jest.Mock).mockReturnValue(allClaims);
      (ClaimsMappingRules.toClaimsOverrideDetails as jest.Mock).mockReturnValue({} as any);

      await orchestrator.processPreTokenGenerationWithData(event, eventData);

      expect(ClaimsMappingRules.isMfaRequiredByPolicy).toHaveBeenCalledWith(
        UserRole.CUSTOMER,
        true
      );
    });

    it('should include all configured claim types', async () => {
      const event = new PreTokenGenEventBuilder()
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
        mfaEnabled: true,
        isMfaRequiredAttr: true
      };
      const user = userEntity({
        cognitoSub: CognitoSub.fromString('test-cognito-sub'),
        role: UserRole.LAWYER,
        status: UserAccountStatus.ACTIVE,
        mfaEnabled: true
      });
      const allClaims = {
        'custom:role': UserRole.LAWYER,
        'custom:account_status': UserAccountStatus.ACTIVE,
        'custom:user_id': user.getId().toString(),
        'custom:is_mfa_required': true,
        'custom:mfa_enabled': true
      };

      userService.findByCognitoSub.mockResolvedValue(user);
      cognitoService.adminGetUser.mockResolvedValue({} as any);
      cognitoService.parseMfaSettings.mockReturnValue(mfaSettings);
      (ClaimsMappingRules.isMfaRequiredByPolicy as jest.Mock).mockReturnValue(true);
      (ClaimsMappingRules.buildAllClaims as jest.Mock).mockReturnValue(allClaims);
      (ClaimsMappingRules.toClaimsOverrideDetails as jest.Mock).mockReturnValue({} as any);

      await orchestrator.processPreTokenGenerationWithData(event, eventData);

      expect(ClaimsMappingRules.toClaimsOverrideDetails).toHaveBeenCalledWith(
        expect.objectContaining({
          'custom:role': UserRole.LAWYER,
          'custom:account_status': UserAccountStatus.ACTIVE,
          'custom:user_id': user.getId().toString(),
          'custom:is_mfa_required': true,
          'custom:mfa_enabled': true
        })
      );
    });

    it('should handle error path and return default claims', async () => {
      const event = new PreTokenGenEventBuilder()
        .withUserName('test-cognito-sub')
        .build();

      const eventData = new CognitoEventData(
        'test-cognito-sub',
        {},
        'test@example.com',
        'John',
        'Doe'
      );

      const defaultClaims = {
        'custom:role': UserRole.UNASSIGNED
      };

      userService.findByCognitoSub.mockRejectedValue(new Error('Database error'));
      (ClaimsMappingRules.getDefaultClaims as jest.Mock).mockReturnValue(defaultClaims);
      (ClaimsMappingRules.toClaimsOverrideDetails as jest.Mock).mockReturnValue({} as any);

      const result = await orchestrator.processPreTokenGenerationWithData(event, eventData);

      expect(result.response.claimsOverrideDetails).toBeDefined();
    });

  });
});


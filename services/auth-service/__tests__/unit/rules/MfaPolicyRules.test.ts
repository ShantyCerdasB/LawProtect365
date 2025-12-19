/**
 * @fileoverview MfaPolicyRules Tests - Unit tests for MfaPolicyRules
 * @summary Tests for MFA policy evaluation rules
 * @description Tests all methods in MfaPolicyRules class.
 */

import { describe, it, expect } from '@jest/globals';
import { MfaPolicyRules } from '../../../src/domain/rules/MfaPolicyRules';
import { UserRole } from '../../../src/domain/enums';
import { MfaDecision, MfaReason, MfaSetting } from '../../../src/domain/enums';
import { CognitoMfaSettings } from '../../../src/domain/interfaces';

describe('MfaPolicyRules', () => {
  describe('isMfaRequired', () => {
    it('should return customMfaRequired when provided', () => {
      expect(MfaPolicyRules.isMfaRequired(UserRole.CUSTOMER, true)).toBe(true);
      expect(MfaPolicyRules.isMfaRequired(UserRole.CUSTOMER, false)).toBe(false);
    });

    it('should return true for SUPER_ADMIN when customMfaRequired not provided', () => {
      expect(MfaPolicyRules.isMfaRequired(UserRole.SUPER_ADMIN)).toBe(true);
    });

    it('should return false for non-SUPER_ADMIN when customMfaRequired not provided', () => {
      expect(MfaPolicyRules.isMfaRequired(UserRole.CUSTOMER)).toBe(false);
    });
  });

  describe('isMfaSatisfied', () => {
    it('should return false when MFA not enabled', () => {
      const settings: CognitoMfaSettings = { mfaEnabled: false, isMfaRequiredAttr: false };
      expect(MfaPolicyRules.isMfaSatisfied(settings)).toBe(false);
    });

    it('should return true when preferredMfaSetting is set', () => {
      const settings: CognitoMfaSettings = {
        mfaEnabled: true,
        isMfaRequiredAttr: false,
        preferredMfaSetting: MfaSetting.SOFTWARE_TOKEN_MFA
      };
      expect(MfaPolicyRules.isMfaSatisfied(settings)).toBe(true);
    });

    it('should return false when preferredMfaSetting is NOMFA', () => {
      const settings: CognitoMfaSettings = {
        mfaEnabled: true,
        isMfaRequiredAttr: false,
        preferredMfaSetting: MfaSetting.NOMFA
      };
      expect(MfaPolicyRules.isMfaSatisfied(settings)).toBe(false);
    });

    it('should return true when userMfaSettingList has valid MFA', () => {
      const settings: CognitoMfaSettings = {
        mfaEnabled: true,
        isMfaRequiredAttr: false,
        userMfaSettingList: [MfaSetting.SOFTWARE_TOKEN_MFA]
      };
      expect(MfaPolicyRules.isMfaSatisfied(settings)).toBe(true);
    });

    it('should return true when userMfaSettingList has SMS_MFA', () => {
      const settings: CognitoMfaSettings = {
        mfaEnabled: true,
        isMfaRequiredAttr: false,
        userMfaSettingList: [MfaSetting.SMS_MFA]
      };
      expect(MfaPolicyRules.isMfaSatisfied(settings)).toBe(true);
    });

    it('should return false when userMfaSettingList is empty', () => {
      const settings: CognitoMfaSettings = {
        mfaEnabled: true,
        isMfaRequiredAttr: false,
        userMfaSettingList: []
      };
      expect(MfaPolicyRules.isMfaSatisfied(settings)).toBe(false);
    });
  });

  describe('evaluateMfaDecision', () => {
    it('should return DENY when required but not satisfied', () => {
      expect(MfaPolicyRules.evaluateMfaDecision(true, false)).toBe(MfaDecision.DENY);
    });

    it('should return ALLOW when required and satisfied', () => {
      expect(MfaPolicyRules.evaluateMfaDecision(true, true)).toBe(MfaDecision.ALLOW);
    });

    it('should return ALLOW when not required', () => {
      expect(MfaPolicyRules.evaluateMfaDecision(false, false)).toBe(MfaDecision.ALLOW);
      expect(MfaPolicyRules.evaluateMfaDecision(false, true)).toBe(MfaDecision.ALLOW);
    });
  });

  describe('evaluateMfaPolicy', () => {
    it('should return DENY decision when MFA required but not satisfied', () => {
      const settings: CognitoMfaSettings = { mfaEnabled: false, isMfaRequiredAttr: false };
      const result = MfaPolicyRules.evaluateMfaPolicy(UserRole.SUPER_ADMIN, settings);
      expect(result.decision).toBe(MfaDecision.DENY);
      expect(result.required).toBe(true);
      expect(result.satisfied).toBe(false);
      expect(result.reason).toBe(MfaReason.MFA_REQUIRED);
    });

    it('should return ALLOW decision when MFA required and satisfied', () => {
      const settings: CognitoMfaSettings = {
        mfaEnabled: true,
        isMfaRequiredAttr: false,
        preferredMfaSetting: MfaSetting.SOFTWARE_TOKEN_MFA
      };
      const result = MfaPolicyRules.evaluateMfaPolicy(UserRole.SUPER_ADMIN, settings);
      expect(result.decision).toBe(MfaDecision.ALLOW);
      expect(result.required).toBe(true);
      expect(result.satisfied).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return ALLOW decision when MFA not required', () => {
      const settings: CognitoMfaSettings = { mfaEnabled: false, isMfaRequiredAttr: false };
      const result = MfaPolicyRules.evaluateMfaPolicy(UserRole.CUSTOMER, settings);
      expect(result.decision).toBe(MfaDecision.ALLOW);
      expect(result.required).toBe(false);
    });
  });

  describe('validateMfaPolicy', () => {
    it('should not throw when MFA policy allows access', () => {
      const settings: CognitoMfaSettings = {
        mfaEnabled: true,
        isMfaRequiredAttr: false,
        preferredMfaSetting: MfaSetting.SOFTWARE_TOKEN_MFA
      };
      expect(() => MfaPolicyRules.validateMfaPolicy(UserRole.SUPER_ADMIN, settings)).not.toThrow();
    });

    it('should throw error when MFA required but not satisfied', () => {
      const settings: CognitoMfaSettings = { mfaEnabled: false, isMfaRequiredAttr: false };
      expect(() => MfaPolicyRules.validateMfaPolicy(UserRole.SUPER_ADMIN, settings)).toThrow();
    });
  });

  describe('getMfaRequirementReason', () => {
    it('should return custom attribute reason when provided', () => {
      expect(MfaPolicyRules.getMfaRequirementReason(UserRole.CUSTOMER, true)).toBe('Custom attribute requires MFA');
      expect(MfaPolicyRules.getMfaRequirementReason(UserRole.CUSTOMER, false)).toBe('Custom attribute allows no MFA');
    });

    it('should return SUPER_ADMIN reason when role is SUPER_ADMIN', () => {
      expect(MfaPolicyRules.getMfaRequirementReason(UserRole.SUPER_ADMIN)).toBe('SUPER_ADMIN role requires MFA');
    });

    it('should return not required reason for other roles', () => {
      expect(MfaPolicyRules.getMfaRequirementReason(UserRole.CUSTOMER)).toBe('MFA not required for this role');
    });
  });

  describe('getMfaSatisfactionStatus', () => {
    it('should return not enabled status', () => {
      const settings: CognitoMfaSettings = { mfaEnabled: false, isMfaRequiredAttr: false };
      expect(MfaPolicyRules.getMfaSatisfactionStatus(settings)).toBe('MFA not enabled');
    });

    it('should return preferred setting status', () => {
      const settings: CognitoMfaSettings = {
        mfaEnabled: true,
        isMfaRequiredAttr: false,
        preferredMfaSetting: MfaSetting.SOFTWARE_TOKEN_MFA
      };
      expect(MfaPolicyRules.getMfaSatisfactionStatus(settings)).toContain(MfaSetting.SOFTWARE_TOKEN_MFA);
    });

    it('should return userMfaSettingList status', () => {
      const settings: CognitoMfaSettings = {
        mfaEnabled: true,
        isMfaRequiredAttr: false,
        userMfaSettingList: [MfaSetting.SOFTWARE_TOKEN_MFA, MfaSetting.SMS_MFA]
      };
      const status = MfaPolicyRules.getMfaSatisfactionStatus(settings);
      expect(status).toContain('MFA enabled with settings:');
    });

    it('should return no settings found status', () => {
      const settings: CognitoMfaSettings = {
        mfaEnabled: true,
        isMfaRequiredAttr: false,
        preferredMfaSetting: MfaSetting.NOMFA
      };
      expect(MfaPolicyRules.getMfaSatisfactionStatus(settings)).toBe('MFA enabled but no specific settings found');
    });
  });
});


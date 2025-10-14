/**
 * @fileoverview AppConfig - Application configuration for auth service
 * @summary Loads environment variables and provides configuration for auth service
 * @description Centralizes all configuration including AWS services, database settings,
 * authentication settings, and feature toggles for the auth service.
 */

import { buildAppConfig } from '@lawprotect/shared-ts';
import type { AppConfig } from '@lawprotect/shared-ts';

/**
 * Auth service specific configuration extending shared-ts AppConfig
 */
export interface AuthServiceConfig extends AppConfig {
  // AWS Configuration
  aws: {
    region: string;
    cognito: {
      userPoolId: string;
      clientId: string;
      clientSecret?: string;
    };
  };
  
  // Database Configuration
  database: {
    url: string;
    maxConnections: number;
  };
  
  // Authentication Configuration
  auth: {
    jwtSecret: string;
    jwtExpiration: string;
    mfaRequired: boolean;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
  };
  
  // Feature Toggles
  features: {
    mfaOptional: boolean;
    socialLoginEnabled: boolean;
    adminUserManagement: boolean;
    mfaEnforceForSuperAdmins: boolean;
    allowLoginWhenPendingVerification: boolean;
    mfaBypassClientIds: string[];
    // PreTokenGeneration features
    tokenIncludeAccountStatus: boolean;
    tokenIncludeMfaFlags: boolean;
    tokenIncludeInternalUserId: boolean;
    tokenAddToAccessOnly: boolean;
    tokenAddToIdOnly: boolean;
    // PostConfirmation features
    postConfirmationLinkProviders: boolean;
    postConfirmationAllowUpdateEmail: boolean;
  };
  
  // Security Configuration
  security: {
    maxLoginAttempts: number;
    lockoutDuration: number;
    sessionTimeout: number;
  };
  
  // EventBridge Configuration
  eventbridge: {
    busName: string;
    source: string;
  };
  
  // Outbox Configuration
  outbox: {
    tableName: string;
  };
  
  // Default Role Configuration
  defaultRole: string;
}

/**
 * Loads and validates configuration from environment variables
 * @returns Validated configuration object
 * @throws Error if required configuration is missing
 */
export const loadConfig = (): AuthServiceConfig => {
  const base = buildAppConfig();
  
  return {
    ...base,
    aws: {
      region: process.env.AWS_REGION || 'us-east-1',
      cognito: {
        userPoolId: process.env.COGNITO_USER_POOL_ID || '',
        clientId: process.env.COGNITO_CLIENT_ID || '',
        clientSecret: process.env.COGNITO_CLIENT_SECRET,
      },
    },
    
    database: {
      url: process.env.DATABASE_URL || '',
      maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10'),
    },
    
    auth: {
      jwtSecret: process.env.JWT_SECRET || '',
      jwtExpiration: process.env.JWT_EXPIRATION || '24h',
      mfaRequired: process.env.MFA_REQUIRED === 'true',
      passwordPolicy: {
        minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
        requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true',
        requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === 'true',
        requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS === 'true',
        requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL_CHARS === 'true',
      },
    },
    
    features: {
      mfaOptional: process.env.MFA_OPTIONAL === 'true',
      socialLoginEnabled: process.env.SOCIAL_LOGIN_ENABLED === 'true',
      adminUserManagement: process.env.ADMIN_USER_MANAGEMENT === 'true',
    mfaEnforceForSuperAdmins: process.env.MFA_ENFORCE_FOR_SUPERADMINS !== 'false', // Default true
    allowLoginWhenPendingVerification: process.env.ALLOW_LOGIN_WHEN_PENDING_VERIFICATION !== 'false', // Default true
    mfaBypassClientIds: process.env.MFA_BYPASS_CLIENT_IDS ? process.env.MFA_BYPASS_CLIENT_IDS.split(',') : [],
    // PreTokenGeneration features
    tokenIncludeAccountStatus: process.env.TOKEN_INCLUDE_ACCOUNT_STATUS !== 'false', // Default true
    tokenIncludeMfaFlags: process.env.TOKEN_INCLUDE_MFA_FLAGS !== 'false', // Default true
    tokenIncludeInternalUserId: process.env.TOKEN_INCLUDE_INTERNAL_USER_ID !== 'false', // Default true
    tokenAddToAccessOnly: process.env.TOKEN_ADD_TO_ACCESS_ONLY === 'true', // Default false
    tokenAddToIdOnly: process.env.TOKEN_ADD_TO_ID_ONLY === 'true', // Default false
    // PostConfirmation features
    postConfirmationLinkProviders: process.env.POSTCONFIRMATION_LINK_PROVIDERS !== 'false', // Default true
    postConfirmationAllowUpdateEmail: process.env.POSTCONFIRMATION_ALLOW_UPDATE_EMAIL !== 'false', // Default true
    },
    
    security: {
      maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
      lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900'), // 15 minutes
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600'), // 1 hour
    },
    
    eventbridge: {
      busName: process.env.EVENTBRIDGE_BUS_NAME || '',
      source: process.env.EVENTBRIDGE_SOURCE || `${base.projectName}.${base.serviceName}`,
    },
    
    outbox: {
      tableName: process.env.OUTBOX_TABLE_NAME || '',
    },
    
    defaultRole: process.env.DEFAULT_ROLE || 'CUSTOMER', // Changed from UNASSIGNED to CUSTOMER
  };
}

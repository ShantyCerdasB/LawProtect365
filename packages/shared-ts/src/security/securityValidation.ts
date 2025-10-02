/**
 * @file securityValidation.ts
 * @summary Reusable security validation utilities
 * @description Common security validation functions that can be used across multiple microservices
 * for IP validation, user agent filtering, access control, rate limiting, and permission validation.
 */

import type { SecurityConfig, RequestSecurityContext, SecurityValidationResult, SecurityValidationOptions } from './SecurityConfig.js';
import type { RateLimitStore, RateLimitWindow } from '../contracts/ratelimit/RateLimitStore.js';

/**
 * Validates that an IP address is not in the blocked list
 */
export function validateIPAddress(
  ipAddress: string,
  config: SecurityConfig
): SecurityValidationResult {
  if (!config.enableIPValidation) {
    return { isValid: true };
  }

  if (!ipAddress || ipAddress.trim().length === 0) {
    return {
      isValid: false,
      errorMessage: 'IP address is required',
      errorCode: 'IP_ADDRESS_REQUIRED'
    };
  }

  // Get blocked IPs from configuration
  const blockedIPs = config.blockedIPs || [];
  
  // Check if IP is in blocked list
  if (blockedIPs.includes(ipAddress)) {
    return {
      isValid: false,
      errorMessage: `IP address ${ipAddress} is blocked`,
      errorCode: 'IP_ADDRESS_BLOCKED'
    };
  }

  // Check if IP matches any blocked IP ranges (CIDR notation)
  const blockedRanges = config.blockedIPRanges || [];
  for (const range of blockedRanges) {
    if (isIPInRange(ipAddress, range)) {
      return {
        isValid: false,
        errorMessage: `IP address ${ipAddress} is in blocked range ${range}`,
        errorCode: 'IP_ADDRESS_BLOCKED'
      };
    }
  }

  return { isValid: true };
}

/**
 * Validates that a user agent is not blocked
 */
export function validateUserAgent(
  userAgent: string,
  config: SecurityConfig
): SecurityValidationResult {
  if (!config.enableUserAgentValidation) {
    return { isValid: true };
  }

  if (!userAgent || userAgent.trim().length === 0) {
    return {
      isValid: false,
      errorMessage: 'User agent is required',
      errorCode: 'USER_AGENT_REQUIRED'
    };
  }

  // Get blocked user agent patterns from configuration
  const blockedPatterns = config.blockedUserAgentPatterns || [];
  
  // Check if user agent matches any blocked patterns
  for (const pattern of blockedPatterns) {
    try {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(userAgent)) {
        return {
          isValid: false,
          errorMessage: `User agent is blocked: ${userAgent}`,
          errorCode: 'USER_AGENT_BLOCKED'
        };
      }
    } catch (error) {
      // Invalid regex pattern, skip it and log the specific error
      console.warn(`Invalid regex pattern in blocked user agents: ${pattern}`, error);
    }
  }

  // Check for suspicious user agents (bots, scrapers, etc.)
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /php/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(userAgent)) {
      return {
        isValid: false,
        errorMessage: `Suspicious user agent detected: ${userAgent}`,
        errorCode: 'USER_AGENT_BLOCKED'
      };
    }
  }

  return { isValid: true };
}

/**
 * Validates geographic location restrictions
 */
export function validateGeolocation(
  context: RequestSecurityContext,
  config: SecurityConfig
): SecurityValidationResult {
  if (!config.enableGeolocationValidation) {
    return { isValid: true };
  }

  if (!context.country) {
    return { isValid: true }; // Skip if country is not provided
  }

  // Get blocked countries from configuration
  const blockedCountries = config.blockedCountries || [];
  
  if (blockedCountries.includes(context.country)) {
    return {
      isValid: false,
      errorMessage: `Access from country ${context.country} is blocked`,
      errorCode: 'GEOLOCATION_BLOCKED'
    };
  }

  return { isValid: true };
}

/**
 * Validates device trust for sensitive operations
 */
export function validateDeviceTrust(
  context: RequestSecurityContext,
  config: SecurityConfig,
  sensitiveOperations: string[] = []
): SecurityValidationResult {
  if (!config.enableDeviceTrustValidation) {
    return { isValid: true };
  }

  // Only validate device trust for sensitive operations
  if (sensitiveOperations.length > 0 && !sensitiveOperations.includes(context.resourceType || '')) {
    return { isValid: true }; // Skip validation for non-sensitive operations
  }

  if (!context.deviceFingerprint) {
    return { isValid: true }; // Skip if device fingerprint is not provided
  }

  // Get trusted devices from configuration
  const trustedDevices = config.trustedDevices || [];
  
  if (trustedDevices.length > 0 && !trustedDevices.includes(context.deviceFingerprint)) {
    return {
      isValid: false,
      errorMessage: `Device ${context.deviceFingerprint} is not trusted`,
      errorCode: 'DEVICE_NOT_TRUSTED'
    };
  }

  return { isValid: true };
}

/**
 * Validates rate limiting for operations
 */
export async function validateRateLimit(
  context: RequestSecurityContext,
  operation: string,
  config: SecurityConfig,
  rateLimitStore: RateLimitStore,
  options?: SecurityValidationOptions
): Promise<SecurityValidationResult> {
  if (!config.enableRateLimiting || options?.skipRateLimiting) {
    return { isValid: true };
  }

  // Get rate limit configuration
  const rateLimitConfig = options?.customRateLimit || {
    limit: config.defaultRateLimit || 100,
    windowSeconds: config.defaultRateLimitWindow || 3600,
    enabled: true
  };

  if (!rateLimitConfig.enabled) {
    return { isValid: true };
  }
  
  // Create rate limit key (IP + operation)
  const rateLimitKey = `${context.ipAddress}:${operation}`;
  
  // Create rate limit window
  const window: RateLimitWindow = {
    windowSeconds: rateLimitConfig.windowSeconds,
    maxRequests: rateLimitConfig.limit,
    ttlSeconds: rateLimitConfig.windowSeconds + 60 // Add buffer for TTL
  };

  try {
    // Use the existing rate limit store
    const usage = await rateLimitStore.incrementAndCheck(rateLimitKey, window);
    
    if (usage.currentUsage > usage.maxRequests) {
      return {
        isValid: false,
        errorMessage: `Rate limit exceeded for operation ${operation}. Limit: ${usage.maxRequests} per ${window.windowSeconds} seconds`,
        errorCode: 'RATE_LIMIT_EXCEEDED'
      };
    }
  } catch (error) {
    // Log the specific error and return rate limit exceeded
    console.warn(`Rate limit validation failed for operation ${operation}:`, error);
    return {
      isValid: false,
      errorMessage: `Rate limit exceeded for operation ${operation}`,
      errorCode: 'RATE_LIMIT_EXCEEDED'
    };
  }

  return { isValid: true };
}

/**
 * Detects suspicious activity patterns
 */
export function validateSuspiciousActivity(
  context: RequestSecurityContext,
  config: SecurityConfig
): SecurityValidationResult {
  if (!config.enableSuspiciousActivityDetection) {
    return { isValid: true };
  }

  // Check for operations outside normal business hours (if configured)
  if (config.enforceBusinessHours) {
    const hour = context.timestamp.getHours();
    if (hour < 6 || hour > 22) {
      // Log suspicious activity but don't block (could be legitimate)
      console.warn(`Suspicious activity: Operation outside business hours from IP ${context.ipAddress}`);
    }
  }

  // Check for rapid successive operations (potential bot activity)
  // This would typically check against a store of recent operations
  // For now, we'll implement basic validation
  
  return { isValid: true };
}

/**
 * Validates access tokens for shared links and invitations
 */
export function validateAccessToken(
  token: string | undefined,
  accessType: string,
  config: SecurityConfig
): SecurityValidationResult {
  if (accessType === 'SYSTEM' || accessType === 'DIRECT') {
    return { isValid: true }; // Skip validation for system and direct access
  }

  if (!token || token.trim().length === 0) {
    return {
      isValid: false,
      errorMessage: 'Access token is required for this access type',
      errorCode: 'ACCESS_TOKEN_REQUIRED'
    };
  }

  // Basic token format validation
  if (token.length < 32) {
    return {
      isValid: false,
      errorMessage: 'Access token format is invalid',
      errorCode: 'INVALID_ACCESS_TOKEN'
    };
  }

  // Additional token validation would be implemented here
  // (e.g., JWT validation, database lookup, etc.)
  
  return { isValid: true };
}

/**
 * Comprehensive security validation for operations
 */
export async function validateSecurity(
  context: RequestSecurityContext,
  operation: string,
  config: SecurityConfig,
  dependencies: {
    rateLimitStore: RateLimitStore;
    accessToken?: string;
    sensitiveOperations?: string[];
  },
  options?: SecurityValidationOptions
): Promise<SecurityValidationResult> {
  // Validate basic security checks
  const basicValidationResult = await validateBasicSecurity(context, config, options);
  if (!basicValidationResult.isValid) return basicValidationResult;
  
  // Validate rate limiting
  const rateLimitResult = await validateRateLimit(context, operation, config, dependencies.rateLimitStore, options);
  if (!rateLimitResult.isValid) return rateLimitResult;
  
  // Validate advanced security checks
  const advancedValidationResult = await validateAdvancedSecurity(context, config, dependencies, options);
  if (!advancedValidationResult.isValid) return advancedValidationResult;

  return { isValid: true };
}

/**
 * Validates basic security checks (IP, user agent, geolocation)
 */
async function validateBasicSecurity(
  context: RequestSecurityContext,
  config: SecurityConfig,
  options?: SecurityValidationOptions
): Promise<SecurityValidationResult> {
  // Validate IP address
  if (!options?.skipIPValidation) {
    const ipResult = validateIPAddress(context.ipAddress, config);
    if (!ipResult.isValid) return ipResult;
  }
  
  // Validate user agent
  if (!options?.skipUserAgentValidation) {
    const userAgentResult = validateUserAgent(context.userAgent, config);
    if (!userAgentResult.isValid) return userAgentResult;
  }
  
  // Validate geolocation
  if (!options?.skipGeolocationValidation) {
    const geolocationResult = validateGeolocation(context, config);
    if (!geolocationResult.isValid) return geolocationResult;
  }

  return { isValid: true };
}

/**
 * Validates advanced security checks (device trust, access token, suspicious activity)
 */
async function validateAdvancedSecurity(
  context: RequestSecurityContext,
  config: SecurityConfig,
  dependencies: {
    accessToken?: string;
    sensitiveOperations?: string[];
  },
  options?: SecurityValidationOptions
): Promise<SecurityValidationResult> {
  // Validate device trust
  if (!options?.skipDeviceTrustValidation) {
    const deviceResult = validateDeviceTrust(context, config, dependencies.sensitiveOperations);
    if (!deviceResult.isValid) return deviceResult;
  }
  
  // Validate access token
  const tokenResult = validateAccessToken(dependencies.accessToken, context.accessType, config);
  if (!tokenResult.isValid) return tokenResult;
  
  // Validate suspicious activity
  if (!options?.skipSuspiciousActivityDetection) {
    const suspiciousResult = validateSuspiciousActivity(context, config);
    if (!suspiciousResult.isValid) return suspiciousResult;
  }

  return { isValid: true };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Checks if an IP address is within a CIDR range
 */
function isIPInRange(ip: string, cidr: string): boolean {
  try {
    // Simplified implementation - in production, use a proper CIDR library
    const [rangeIP, prefix] = cidr.split('/');
    const prefixLength = Number.parseInt(prefix);
    
    // This is a simplified check - proper implementation would handle all CIDR cases
    return ip.startsWith(rangeIP.split('.').slice(0, Math.floor(prefixLength / 8)).join('.'));
  } catch (error) {
    console.warn(`Invalid CIDR range: ${cidr}`, error);
    return false;
  }
}

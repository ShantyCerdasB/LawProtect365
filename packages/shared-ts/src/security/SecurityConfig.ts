/**
 * @file SecurityConfig.ts
 * @summary Security configuration interfaces and types
 * @description Generic security configuration interfaces that can be used across
 * all microservices for consistent security settings and validation rules.
 */

/**
 * Security configuration interface
 * 
 * Defines all security-related configuration options that can be applied
 * across microservices. All options are optional and can be configured
 * via environment variables.
 */
export interface SecurityConfig {
  /** List of blocked IP addresses */
  blockedIPs?: string[];
  /** List of blocked IP ranges (CIDR notation) */
  blockedIPRanges?: string[];
  /** List of blocked user agent patterns (regex) */
  blockedUserAgentPatterns?: string[];
  /** List of blocked countries (ISO codes) */
  blockedCountries?: string[];
  /** List of trusted device fingerprints */
  trustedDevices?: string[];
  /** Whether to enforce business hours */
  enforceBusinessHours?: boolean;
  /** Threshold for rapid operations detection */
  rapidOperationThreshold?: number;
  /** Window for rapid operations detection (seconds) */
  rapidOperationWindowSeconds?: number;
  /** Whether to enable IP validation */
  enableIPValidation?: boolean;
  /** Whether to enable user agent validation */
  enableUserAgentValidation?: boolean;
  /** Whether to enable geolocation validation */
  enableGeolocationValidation?: boolean;
  /** Whether to enable device trust validation */
  enableDeviceTrustValidation?: boolean;
  /** Whether to enable suspicious activity detection */
  enableSuspiciousActivityDetection?: boolean;
  /** Whether to enable rate limiting */
  enableRateLimiting?: boolean;
  /** Default rate limit per hour */
  defaultRateLimit?: number;
  /** Default rate limit window in seconds */
  defaultRateLimitWindow?: number;
}

/**
 * Request security context interface
 * 
 * Defines the context information available for security validation
 * across all microservices. This is different from the app-level SecurityContext.
 */
export interface RequestSecurityContext {
  /** User ID making the request */
  userId?: string;
  /** IP address of the request */
  ipAddress: string;
  /** User agent string */
  userAgent: string;
  /** Access type (direct, shared link, invitation, system) */
  accessType: string;
  /** User's permission level */
  permission: string;
  /** Device fingerprint (optional) */
  deviceFingerprint?: string;
  /** Geographic location (optional) */
  country?: string;
  /** Timestamp of the request */
  timestamp: Date;
  /** Resource ID being accessed (optional) */
  resourceId?: string;
  /** Resource type being accessed (optional) */
  resourceType?: string;
}

/**
 * Security rate limit configuration interface
 * Uses the existing RateLimitWindow from shared-ts
 */
export interface SecurityRateLimitConfig {
  /** Maximum number of requests allowed */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Whether to enable rate limiting */
  enabled: boolean;
}

/**
 * Security validation result interface
 */
export interface SecurityValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** Error message if validation failed */
  errorMessage?: string;
  /** Error code if validation failed */
  errorCode?: string;
  /** Additional context about the validation */
  context?: Record<string, any>;
}

/**
 * Security validation options interface
 */
export interface SecurityValidationOptions {
  /** Whether to skip IP validation */
  skipIPValidation?: boolean;
  /** Whether to skip user agent validation */
  skipUserAgentValidation?: boolean;
  /** Whether to skip geolocation validation */
  skipGeolocationValidation?: boolean;
  /** Whether to skip device trust validation */
  skipDeviceTrustValidation?: boolean;
  /** Whether to skip rate limiting */
  skipRateLimiting?: boolean;
  /** Whether to skip suspicious activity detection */
  skipSuspiciousActivityDetection?: boolean;
  /** Custom rate limit configuration */
  customRateLimit?: SecurityRateLimitConfig;
}

/**
 * @fileoverview ExternalIdpClaims - External IdP claims parser
 * @summary Parser and normalizer for external IdP claims
 * @description Parses and normalizes claims from external identity providers.
 */

import { EmailAddress } from "./EmailAddress";
import { validationFailed } from "@/UserServiceErrors";

/**
 * External IdP claims data interface
 */
interface ExternalIdpClaimsData {
  readonly sub: string;
  readonly email: EmailAddress;
  readonly emailVerified: boolean;
  readonly name?: string;
  readonly givenName?: string;
  readonly familyName?: string;
  readonly iss: string;
  readonly hd?: string;
  readonly scope: Set<string>;
}

/**
 * External IdP claims parser and normalizer
 * 
 * Parses and normalizes claims from external identity providers.
 * Provides getters for standardized access to claim data.
 * 
 * @example
 * ```ts
 * const claims = ExternalIdpClaims.parse(idTokenPayload);
 * console.log(claims.getEmail().getValue()); // "user@example.com"
 * ```
 */
export class ExternalIdpClaims {
  private readonly _data: ExternalIdpClaimsData;

  /**
   * Parses external IdP claims from a token payload
   * @param payload - The token payload object
   * @returns A new ExternalIdpClaims instance
   * @throws validationFailed when required claims are missing or invalid
   */
  static parse(payload: Record<string, unknown>): ExternalIdpClaims {
    // Extract and validate required fields
    const sub = this.extractString(payload, 'sub');
    const email = this.extractString(payload, 'email');
    const iss = this.extractString(payload, 'iss');

    if (!sub) {
      throw validationFailed("Missing required claim: sub", { payload });
    }

    if (!email) {
      throw validationFailed("Missing required claim: email", { payload });
    }

    if (!iss) {
      throw validationFailed("Missing required claim: iss", { payload });
    }

    // Validate email
    const emailVO = EmailAddress.create(email);

    // Extract optional fields
    const emailVerified = this.extractBoolean(payload, 'email_verified') ?? false;
    const name = this.extractString(payload, 'name');
    const givenName = this.extractString(payload, 'given_name');
    const familyName = this.extractString(payload, 'family_name');
    const hd = this.extractString(payload, 'hd');
    const scope = this.extractScope(payload);

    // Validate email_verified if present
    if (payload.hasOwnProperty('email_verified') && !emailVerified) {
      throw validationFailed("Email must be verified", { 
        email, 
        emailVerified 
      });
    }

    return new ExternalIdpClaims({
      sub,
      email: emailVO,
      emailVerified,
      name,
      givenName,
      familyName,
      iss,
      hd,
      scope
    });
  }

  /**
   * Extracts a string value from the payload
   * @param payload - The payload object
   * @param key - The key to extract
   * @returns The string value or undefined
   */
  private static extractString(payload: Record<string, unknown>, key: string): string | undefined {
    const value = payload[key];
    return typeof value === 'string' ? value : undefined;
  }

  /**
   * Extracts a boolean value from the payload
   * @param payload - The payload object
   * @param key - The key to extract
   * @returns The boolean value or undefined
   */
  private static extractBoolean(payload: Record<string, unknown>, key: string): boolean | undefined {
    const value = payload[key];
    return typeof value === 'boolean' ? value : undefined;
  }

  /**
   * Extracts scope from the payload
   * @param payload - The payload object
   * @returns A set of scope strings
   */
  private static extractScope(payload: Record<string, unknown>): Set<string> {
    const scopeValue = payload.scope;
    
    if (typeof scopeValue === 'string') {
      return new Set(scopeValue.split(' ').filter(s => s.length > 0));
    }
    
    if (Array.isArray(scopeValue)) {
      return new Set(scopeValue.filter(s => typeof s === 'string'));
    }
    
    return new Set();
  }

  /**
   * Private constructor - use static factory methods instead
   * @param data - The parsed claims data
   */
  private constructor(data: ExternalIdpClaimsData) {
    this._data = data;
  }

  /**
   * Gets the subject identifier
   * @returns The subject identifier
   */
  getSubject(): string {
    return this._data.sub;
  }

  /**
   * Gets the email address
   * @returns The email address value object
   */
  getEmail(): EmailAddress {
    return this._data.email;
  }

  /**
   * Gets the email verification status
   * @returns True if email is verified
   */
  getEmailVerified(): boolean {
    return this._data.emailVerified;
  }

  /**
   * Gets the full name
   * @returns The full name or undefined
   */
  getFullName(): string | undefined {
    return this._data.name;
  }

  /**
   * Gets the given name
   * @returns The given name or undefined
   */
  getGivenName(): string | undefined {
    return this._data.givenName;
  }

  /**
   * Gets the family name
   * @returns The family name or undefined
   */
  getFamilyName(): string | undefined {
    return this._data.familyName;
  }

  /**
   * Gets the display name (prefers full name, falls back to given + family)
   * @returns The display name
   */
  getDisplayName(): string {
    if (this._data.name) {
      return this._data.name;
    }
    
    const parts = [this._data.givenName, this._data.familyName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : this._data.email.getValue();
  }

  /**
   * Gets the issuer
   * @returns The issuer identifier
   */
  getIssuer(): string {
    return this._data.iss;
  }

  /**
   * Gets the hosted domain
   * @returns The hosted domain or undefined
   */
  getHostedDomain(): string | undefined {
    return this._data.hd;
  }

  /**
   * Gets the scope set
   * @returns A set of scope strings
   */
  getScopeSet(): Set<string> {
    return new Set(this._data.scope);
  }
}

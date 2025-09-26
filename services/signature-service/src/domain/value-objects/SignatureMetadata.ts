/**
 * @fileoverview SignatureMetadata value object - Represents signature metadata
 * @summary Encapsulates signature metadata validation and equality logic
 * @description The SignatureMetadata value object ensures signature metadata is valid
 * and provides type safety for signature metadata throughout the system.
 */

import { NetworkSecurityContext } from '@lawprotect/shared-ts';

/**
 * Signature metadata value object
 * 
 * Represents metadata associated with a signature including reason, location,
 * IP address, and user agent for audit and compliance purposes.
 */
export class SignatureMetadata {
  constructor(
    private readonly reason?: string,
    private readonly location?: string,
    private readonly ipAddress?: string,
    private readonly userAgent?: string
  ) {}

  /**
   * Gets the signing reason if provided
   */
  getReason(): string | undefined {
    return this.reason;
  }

  /**
   * Gets the signing location if provided
   */
  getLocation(): string | undefined {
    return this.location;
  }

  /**
   * Gets the IP address of the signer
   */
  getIpAddress(): string | undefined {
    return this.ipAddress;
  }

  /**
   * Gets the user agent of the signer
   */
  getUserAgent(): string | undefined {
    return this.userAgent;
  }

  /**
   * Checks if this metadata equals another metadata
   */
  equals(other: SignatureMetadata): boolean {
    return this.reason === other.reason &&
           this.location === other.location &&
           this.ipAddress === other.ipAddress &&
           this.userAgent === other.userAgent;
  }

  /**
   * Gets a copy of the metadata as a plain object
   */
  toObject() {
    return {
      reason: this.reason,
      location: this.location,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent
    };
  }

  /**
   * Creates SignatureMetadata from a plain object
   */
  static fromObject(obj: {
    reason?: string;
    location?: string;
  } & NetworkSecurityContext): SignatureMetadata {
    return new SignatureMetadata(
      obj.reason,
      obj.location,
      obj.ipAddress,
      obj.userAgent
    );
  }
}

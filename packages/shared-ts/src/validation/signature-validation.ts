/**
 * @fileoverview Signature validation utilities - Shared validation functions for signature operations
 * @summary Common validation utilities for signature hash, timestamp, and algorithm validation
 * @description This file provides shared validation utilities for signature operations
 * to ensure consistency across all microservices and avoid code duplication.
 */

import { AppError, ErrorCodes } from '../errors/index.js';
import { diffMs } from '../utils/date.js';
import { HashAlgorithm, getHashLength } from '../enums/HashAlgorithm.js';

/**
 * Validates IPv4 address format
 * @param ipAddress - The IP address to validate
 * @returns true if valid IPv4 address
 */
function isValidIpAddress(ipAddress: string): boolean {
  const parts = ipAddress.split('.');
  if (parts.length !== 4) {
    return false;
  }
  
  for (const part of parts) {
    const num = parseInt(part, 10);
    if (isNaN(num) || num < 0 || num > 255) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validates signature hash format based on algorithm
 * @param hash - The hash to validate
 * @param algorithm - The signing algorithm used
 * @throws {AppError} When hash format is invalid
 * @returns void
 */
export function validateSignatureHash(hash: string, algorithm: string): void {
  if (!hash || typeof hash !== 'string') {
    throw new AppError(
      ErrorCodes.COMMON_BAD_REQUEST,
      400,
      'Hash is required and must be a string'
    );
  }

  const expectedLength = getExpectedHashLength(algorithm);
  const hashRegex = new RegExp(`^[a-f0-9]{${expectedLength}}$`, 'i');
  
  if (!hashRegex.test(hash)) {
    throw new AppError(
      ErrorCodes.COMMON_BAD_REQUEST,
      400,
      `Invalid hash format for algorithm ${algorithm}. Expected ${expectedLength} character hex string`
    );
  }
}

/**
 * Validates signature timestamp
 * @param timestamp - The timestamp to validate
 * @param maxAgeHours - Maximum age of timestamp in hours (default: 24)
 * @throws {AppError} When timestamp is invalid
 * @returns void
 */
export function validateSignatureTimestamp(timestamp: Date, maxAgeHours: number = 24): void {
  if (!timestamp || !(timestamp instanceof Date)) {
    throw new AppError(
      ErrorCodes.COMMON_BAD_REQUEST,
      400,
      'Timestamp is required and must be a Date object'
    );
  }

  const now = new Date();
  
  // Validate timestamp is not in the future
  if (timestamp > now) {
    throw new AppError(
      ErrorCodes.COMMON_BAD_REQUEST,
      400,
      'Signature timestamp cannot be in the future'
    );
  }

  // Validate timestamp is not too old using date utilities
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  const ageMs = diffMs(now, timestamp);
  if (ageMs > maxAgeMs) {
    throw new AppError(
      ErrorCodes.COMMON_BAD_REQUEST,
      400,
      `Signature timestamp is too old. Maximum age: ${maxAgeHours} hours`
    );
  }

  // Validate timestamp is not too old (minimum date)
  const minTimestamp = new Date('2020-01-01');
  if (timestamp < minTimestamp) {
    throw new AppError(
      ErrorCodes.COMMON_BAD_REQUEST,
      400,
      'Signature timestamp is too old'
    );
  }
}

/**
 * Validates IP address format for signature operations
 * @param ipAddress - The IP address to validate
 * @throws {AppError} When IP address format is invalid
 * @returns void
 */
export function validateSignatureIpAddress(ipAddress: string): void {
  if (!ipAddress || typeof ipAddress !== 'string') {
    throw new AppError(
      ErrorCodes.COMMON_BAD_REQUEST,
      400,
      'IP address is required and must be a string'
    );
  }

  if (!isValidIpAddress(ipAddress)) {
    throw new AppError(
      ErrorCodes.COMMON_BAD_REQUEST,
      400,
      'Invalid IP address format'
    );
  }
}

/**
 * Validates user agent format for signature operations
 * @param userAgent - The user agent to validate
 * @param maxLength - Maximum length of user agent (default: 500)
 * @throws {AppError} When user agent format is invalid
 * @returns void
 */
export function validateSignatureUserAgent(userAgent: string, maxLength: number = 500): void {
  if (!userAgent || typeof userAgent !== 'string') {
    throw new AppError(
      ErrorCodes.COMMON_BAD_REQUEST,
      400,
      'User agent is required and must be a string'
    );
  }

  if (userAgent.length > maxLength) {
    throw new AppError(
      ErrorCodes.COMMON_BAD_REQUEST,
      400,
      `User agent is too long. Maximum length: ${maxLength} characters`
    );
  }
}

/**
 * Validates certificate fingerprint format
 * @param fingerprint - The certificate fingerprint to validate
 * @throws {AppError} When fingerprint format is invalid
 * @returns void
 */
export function validateCertificateFingerprint(fingerprint: string): void {
  if (!fingerprint || typeof fingerprint !== 'string') {
    throw new AppError(
      ErrorCodes.COMMON_BAD_REQUEST,
      400,
      'Certificate fingerprint is required and must be a string'
    );
  }

  // SHA-1 = 40 chars, SHA-256 = 64 chars
  const fingerprintRegex = /^[a-f0-9]{40}$|^[a-f0-9]{64}$/i;
  if (!fingerprintRegex.test(fingerprint)) {
    throw new AppError(
      ErrorCodes.COMMON_BAD_REQUEST,
      400,
      'Invalid certificate fingerprint format. Expected SHA-1 (40 chars) or SHA-256 (64 chars)'
    );
  }
}

/**
 * Gets expected hash length for a signing algorithm
 * @param algorithm - The signing algorithm
 * @returns Expected hash length in characters
 */
export function getExpectedHashLength(algorithm: string): number {
  const upperAlgorithm = algorithm.toUpperCase();
  
  if (upperAlgorithm.includes('SHA256') || upperAlgorithm.includes('ECDSA_P256')) {
    return getHashLength(HashAlgorithm.SHA256);
  }
  
  if (upperAlgorithm.includes('SHA384') || upperAlgorithm.includes('ECDSA_P384')) {
    return getHashLength(HashAlgorithm.SHA384);
  }
  
  if (upperAlgorithm.includes('SHA512')) {
    return getHashLength(HashAlgorithm.SHA512);
  }
  
  // Default to SHA-256
  return getHashLength(HashAlgorithm.SHA256);
}

/**
 * Validates hash format for a specific algorithm
 * @param hash - The hash to validate
 * @param algorithm - The signing algorithm
 * @throws {AppError} When hash format is invalid for the algorithm
 * @returns void
 */
export function validateHashForAlgorithm(hash: string, algorithm: string): void {
  const expectedLength = getExpectedHashLength(algorithm);
  const hashRegex = new RegExp(`^[a-f0-9]{${expectedLength}}$`, 'i');
  
  if (!hashRegex.test(hash)) {
    throw new AppError(
      ErrorCodes.COMMON_BAD_REQUEST,
      400,
      `Hash format is invalid for algorithm ${algorithm}. Expected ${expectedLength} character hex string`
    );
  }
}

/**
 * Validates IP address and user agent together
 * @param ipAddress - The IP address to validate
 * @param userAgent - The user agent to validate
 * @param maxUserAgentLength - Maximum length for user agent (default: 500)
 * @throws {AppError} When validation fails
 * @returns void
 */
export function validateIpAddressAndUserAgent(
  ipAddress: string, 
  userAgent: string, 
  maxUserAgentLength: number = 500
): void {
  validateSignatureIpAddress(ipAddress);
  validateSignatureUserAgent(userAgent, maxUserAgentLength);
}

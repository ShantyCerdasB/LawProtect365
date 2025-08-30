/**
 * @file Upload.rules.ts
 * @summary Domain rules for upload operations
 * @description Defines business rules for file uploads, evidence uploads, and multipart uploads
 */

import { AppError, ErrorCodes } from "@lawprotect/shared-ts";
import { FILE_SIZE_LIMITS, UPLOAD_RATE_LIMITS, ALLOWED_CONTENT_TYPES } from "../values/enums";

/**
 * @description Upload domain rules
 */
export const Upload = {
  /**
   * @description Validates file size against configured limits
   * @param sizeBytes - File size in bytes
   * @param type - Type of upload (evidence, pdf, etc.)
   * @throws AppError if file size exceeds limit
   */
  assertFileSize: (sizeBytes: number, type: "evidence" | "pdf"): void => {
    const limit = type === "evidence" ? FILE_SIZE_LIMITS.EVIDENCE : FILE_SIZE_LIMITS.PDF;
    
    if (sizeBytes > limit) {
      throw new AppError(
        ErrorCodes.COMMON_BAD_REQUEST,
        400,
        `File size ${sizeBytes} bytes exceeds maximum allowed size of ${limit} bytes for ${type}`
      );
    }
  },

  /**
   * @description Validates content type against allowed types
   * @param contentType - MIME type of the file
   * @param type - Type of upload (evidence, pdf, etc.)
   * @throws AppError if content type is not allowed
   */
  assertContentType: (contentType: string, type: "evidence" | "pdf"): void => {
    if (type === "pdf" && contentType !== "application/pdf") {
      throw new AppError(
        ErrorCodes.COMMON_BAD_REQUEST,
        400,
        `Content type ${contentType} is not allowed for PDF uploads`
      );
    }

    if (type === "evidence" && !ALLOWED_CONTENT_TYPES.includes(contentType as any)) {
      throw new AppError(
        ErrorCodes.COMMON_BAD_REQUEST,
        400,
        `Content type ${contentType} is not allowed for evidence uploads`
      );
    }
  },

  /**
   * @description Validates multipart part size
   * @param partSize - Size of the part in bytes
   * @throws AppError if part size exceeds limit
   */
  assertPartSize: (partSize: number): void => {
    if (partSize > FILE_SIZE_LIMITS.MULTIPART_PART) {
      throw new AppError(
        ErrorCodes.COMMON_BAD_REQUEST,
        400,
        `Part size ${partSize} bytes exceeds maximum allowed size of ${FILE_SIZE_LIMITS.MULTIPART_PART} bytes`
      );
    }
  },

  /**
   * @description Validates number of parts for multipart upload
   * @param parts - Number of parts
   * @throws AppError if number of parts is invalid
   */
  assertPartCount: (parts: number): void => {
    if (parts < 1 || parts > 10000) {
      throw new AppError(
        ErrorCodes.COMMON_BAD_REQUEST,
        400,
        `Number of parts ${parts} must be between 1 and 10000`
      );
    }
  },

  /**
   * @description Validates evidence upload rate limit
   * @param currentCount - Current number of uploads in the time period
   * @param period - Time period (hour, day)
   * @throws AppError if rate limit exceeded
   */
  assertEvidenceRateLimit: (currentCount: number, period: "hour" | "day"): void => {
    const limit = period === "hour" ? UPLOAD_RATE_LIMITS.EVIDENCE_PER_HOUR : UPLOAD_RATE_LIMITS.EVIDENCE_PER_DAY;
    
    if (currentCount >= limit) {
      throw new AppError(
        ErrorCodes.COMMON_TOO_MANY_REQUESTS,
        429,
        `Evidence upload rate limit exceeded: ${currentCount}/${limit} uploads per ${period}`
      );
    }
  },

  /**
   * @description Validates multipart upload rate limit
   * @param currentCount - Current number of multipart uploads today
   * @throws AppError if rate limit exceeded
   */
  assertMultipartRateLimit: (currentCount: number): void => {
    if (currentCount >= UPLOAD_RATE_LIMITS.MULTIPART_PER_DAY) {
      throw new AppError(
        ErrorCodes.COMMON_TOO_MANY_REQUESTS,
        429,
        `Multipart upload rate limit exceeded: ${currentCount}/${UPLOAD_RATE_LIMITS.MULTIPART_PER_DAY} uploads per day`
      );
    }
  },

  /**
   * @description Validates that envelope status allows uploads
   * @param status - Current envelope status
   * @throws AppError if envelope status doesn't allow uploads
   */
  assertEnvelopeAllowsUploads: (status: string): void => {
    const allowedStatuses = ["draft", "sent", "in_progress"];
    
    if (!allowedStatuses.includes(status)) {
      throw new AppError(
        ErrorCodes.COMMON_CONFLICT,
        409,
        `Uploads not allowed for envelope status: ${status}`
      );
    }
  },

  /**
   * @description Validates that envelope status allows evidence uploads
   * @param status - Current envelope status
   * @throws AppError if envelope status doesn't allow evidence uploads
   */
  assertEnvelopeAllowsEvidence: (status: string): void => {
    const allowedStatuses = ["draft", "sent"];
    
    if (!allowedStatuses.includes(status)) {
      throw new AppError(
        ErrorCodes.COMMON_CONFLICT,
        409,
        `Evidence uploads not allowed for envelope status: ${status}`
      );
    }
  },

  /**
   * @description Validates that envelope status allows PDF uploads
   * @param status - Current envelope status
   * @throws AppError if envelope status doesn't allow PDF uploads
   */
  assertEnvelopeAllowsPdfUpload: (status: string): void => {
    if (status !== "completed") {
      throw new AppError(
        ErrorCodes.COMMON_CONFLICT,
        409,
        `PDF uploads only allowed for completed envelopes, current status: ${status}`
      );
    }
  },
};

/**
 * @fileoverview API Error Interfaces - Types for API error translation
 * @summary Defines the structure for API errors that can be translated
 * @description
 * Contains interfaces for representing API errors that need to be translated
 * into user-friendly messages based on the current language.
 */

export interface ApiError {
  code: string;
  field?: string;
  params?: Record<string, unknown>;
}


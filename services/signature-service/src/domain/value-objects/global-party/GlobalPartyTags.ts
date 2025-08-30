/**
 * @file GlobalPartyTags.ts
 * @summary Global party tags value object for contacts
 * @description Global party tags value object for organizing contacts.
 * Provides validation and utilities for managing contact tags.
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description Global party tags schema for contacts.
 * Validates that tags are non-empty strings and unique.
 */
export const GlobalPartyTagsSchema = z.array(
  z.string().min(1, "Tag cannot be empty").max(50, "Tag too long")
).max(10, "Too many tags").optional();
export type GlobalPartyTags = z.infer<typeof GlobalPartyTagsSchema>;

/**
 * @description Validates that tags are unique.
 * 
 * @param tags - Array of tags to validate
 * @returns true if all tags are unique, false otherwise
 */
export const validateUniqueTags = (tags: string[]): boolean => {
  const uniqueTags = new Set(tags.map(tag => tag.toLowerCase()));
  return uniqueTags.size === tags.length;
};

/**
 * @description Normalizes tags by converting to lowercase and removing duplicates.
 * 
 * @param tags - Array of tags to normalize
 * @returns Normalized array of unique tags
 */
export const normalizeTags = (tags: string[]): string[] => {
  const normalized = tags.map(tag => tag.trim().toLowerCase());
  return [...new Set(normalized)];
};

/**
 * @description Creates tags from a string array, normalizing them.
 * 
 * @param tags - Array of tag strings
 * @returns Normalized GlobalPartyTags
 */
export const createGlobalPartyTags = (tags: string[]): GlobalPartyTags => {
  if (!tags || tags.length === 0) return undefined;
  return normalizeTags(tags);
};




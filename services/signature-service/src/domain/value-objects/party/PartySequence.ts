/**
 * @file PartySequence.ts
 * @summary Party sequence value object for envelope participants
 * @description Party sequence value object for managing signing order in envelopes.
 * Ensures sequential numbering (1..N) without gaps for proper signing flow.
 */

import { z } from "@lawprotect/shared-ts";

/**
 * @description Party sequence schema for envelope participants.
 * Validates that the sequence is a positive integer for signing order.
 */
export const PartySequenceSchema = z.number().int().positive();
export type PartySequence = z.infer<typeof PartySequenceSchema>;

/**
 * @description Validates that party sequences are sequential without gaps.
 * Ensures proper signing order (1, 2, 3, ...) without missing numbers.
 * 
 * @param sequences - Array of sequence numbers to validate
 * @returns true if sequences are sequential, false otherwise
 */
export const validateSequentialSequences = (sequences: number[]): boolean => {
  if (sequences.length === 0) return true;
  
  const sortedSequences = [...sequences].sort((a, b) => a - b);
  const minSequence = sortedSequences[0];
  const maxSequence = sortedSequences[sortedSequences.length - 1];
  
  // Check if sequences are consecutive from min to max
  for (let i = minSequence; i <= maxSequence; i++) {
    if (!sortedSequences.includes(i)) {
      return false;
    }
  }
  
  return true;
};

/**
 * @description Gets the next available sequence number.
 * Finds the first available sequence number starting from 1.
 * 
 * @param existingSequences - Array of existing sequence numbers
 * @returns Next available sequence number
 */
export const getNextSequence = (existingSequences: number[]): number => {
  if (existingSequences.length === 0) return 1;
  
  const sortedSequences = [...existingSequences].sort((a, b) => a - b);
  
  for (let i = 1; i <= sortedSequences.length + 1; i++) {
    if (!sortedSequences.includes(i)) {
      return i;
    }
  }
  
  return sortedSequences.length + 1;
};




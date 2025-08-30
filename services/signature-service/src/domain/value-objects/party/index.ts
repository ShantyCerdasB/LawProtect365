/**
 * @file index.ts
 * @summary Party value objects barrel export
 * @description Re-exports all party-related value objects for convenient importing.
 */

// Re-export existing party value objects
export * from "../Party";

// Export new party-specific value objects
export * from "./PartyMetadata";
export * from "./DelegationRecord";

// Re-export PartyId from Ids (already exists)
export type { PartyId } from "../Ids";
export { PartyIdSchema } from "../Ids";

// Re-export PartyEmail and PartyPhone (now in party folder)
export * from "./PartyEmail";
export * from "./PartyPhone";

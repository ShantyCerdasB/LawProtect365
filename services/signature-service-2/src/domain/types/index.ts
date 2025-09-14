/**
 * @file index.ts
 * @summary Domain types index
 * @description Exports all domain types
 */

export * from "./infrastructure";
export * from "./audit";
export * from "./certificate";
export * from "./common";
export * from "./consent";
// export * from "./core"; // Empty directory
// export * from "./delegation"; // Conflicts with common
export * from "./envelopes";
export * from "./global-parties";
export * from "./idempotency";
// export * from "./inputs"; // Moved to Documents Service
export * from "./outbox";
// export * from "./parties"; // Conflicts with consent
export * from "./requests";
export * from "./signing";
export * from "./s3";

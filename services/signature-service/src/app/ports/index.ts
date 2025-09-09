/**
 * @file index.ts
 * @summary Barrel export for all port types
 * @description Re-exports all port interfaces organized by domain
 * Includes: audit, certificate, consent, documents, envelopes, global-parties, inputs, parties, requests, signatures, signing
 */

// Core domain ports
export * from "./audit";
export * from "./certificate";
export * from "./consent";
export * from "./documents";
export * from "./envelopes";

// Party management ports
export * from "./global-parties";
export * from "./parties";

// Document and input ports
export * from "./inputs";

// Request and signing ports
export * from "./requests";
export * from "./signatures";
export * from "./signing";



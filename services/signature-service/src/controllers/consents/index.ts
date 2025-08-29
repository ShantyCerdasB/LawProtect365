/**
 * @file index.ts
 * @summary Exports all consent controllers
 * @description Centralized exports for all consent-related controllers
 */

export { handler as addConsent } from "./AddConsent.Controller";
export { handler as deleteConsent } from "./DeleteConsent.Controller";
export { handler as delegateConsent } from "./DelegateConsent.Controller";
export { handler as listConsents } from "./ListConsents.Controller";
export { handler as patchConsent } from "./PatchConsent.Controller";
export { handler as submitConsent } from "./submitConsent.Controller";

/**
 * @file index.ts
 * @summary Consent controllers exports
 * @description Exports all consent-related controllers
 */

export { handler as createConsent } from "./CreateConsent.Controller";
export { handler as listConsents } from "./ListConsents.Controller";
export { handler as updateConsent } from "./UpdateConsent.Controller";
export { handler as deleteConsent } from "./DeleteConsent.Controller";
export { handler as submitConsent } from "./SubmitConsent.Controller";
export { handler as delegateConsent } from "./DelegateConsent.Controller";

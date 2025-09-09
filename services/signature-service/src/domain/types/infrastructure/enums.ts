/**
 * @file enums.ts
 * @summary Infrastructure enums and constants
 * @description Shared enums and constants for infrastructure layer
 */

/**
 * @summary Audit entity type constant
 * @description Stable entity marker for audit items in DynamoDB
 */
export const AUDIT_ENTITY_TYPE = "AuditEvent" as const;

/**
 * @summary Envelope entity type constant
 * @description Stable entity marker for envelope items in DynamoDB
 */
export const ENVELOPE_ENTITY_TYPE = "Envelope" as const;

/**
 * @summary Party entity type constant
 * @description Stable entity marker for party items in DynamoDB
 */
export const PARTY_ENTITY_TYPE = "Party" as const;

/**
 * @summary Document entity type constant
 * @description Stable entity marker for document items in DynamoDB
 */
export const DOCUMENT_ENTITY_TYPE = "Document" as const;

/**
 * @summary Input entity type constant
 * @description Stable entity marker for input items in DynamoDB
 */
export const INPUT_ENTITY_TYPE = "Input" as const;

/**
 * @summary Consent entity type constant
 * @description Stable entity marker for consent items in DynamoDB
 */
export const CONSENT_ENTITY_TYPE = "Consent" as const;

/**
 * @summary Global party entity type constant
 * @description Stable entity marker for global party items in DynamoDB
 */
export const GLOBAL_PARTY_ENTITY_TYPE = "GlobalParty" as const;

/**
 * @summary Delegation entity type constant
 * @description Stable entity marker for delegation items in DynamoDB
 */
export const DELEGATION_ENTITY_TYPE = "Delegation" as const;

/**
 * @summary Idempotency entity type constant
 * @description Stable entity marker for idempotency items in DynamoDB
 */
export const IDEMPOTENCY_ENTITY_TYPE = "Idempotency" as const;

/**
 * @summary Outbox entity type constant
 * @description Stable entity marker for outbox items in DynamoDB
 */
export const OUTBOX_ENTITY_TYPE = "Outbox" as const;







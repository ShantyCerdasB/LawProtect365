/**
 * NOTE:
 * This file is part of the signature-service. Controllers are thin:
 * - validate (Zod from @lawprotect/shared-ts)
 * - authenticate/authorize
 * - call use-case
 * - map result -> HTTP response
 */
/** Map persistence <-> domain <-> DTO here to keep controllers clean */
export const toDto = (model: any) => model;
export const toDomain = (row: any) => row;

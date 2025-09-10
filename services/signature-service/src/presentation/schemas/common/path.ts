/**
 * @file Path.ts
 * @summary Reusable Zod schemas for common path params.
 */

import { z, UuidV4, OpaqueId } from "@lawprotect/shared-ts";

/** Envelope ids use UUIDv4 for production consistency. */
export const EnvelopeId = UuidV4;

/** Document ids inside envelope use UUIDv4 for production consistency. */
export const DocumentId = UuidV4;

/** Input id (field) use UUIDv4 for production consistency. */
export const InputId = UuidV4;

/** Party id use UUIDv4 for production consistency. */
export const PartyId = UuidV4;

/** Consent id use UUIDv4 for production consistency. */
export const ConsentId = UuidV4;

/** Public signing token (opaque). */
export const SigningToken = OpaqueId;

/**
 * Path parameter schema for envelope ID
 */
export const EnvelopeIdPath = z.object({
  id: UuidV4});

/**
 * Path parameter schema for document ID
 */
export const DocumentIdPath = z.object({
  id: UuidV4});

/**
 * Path parameter schema for party ID
 */
export const PartyIdPath = z.object({
  id: UuidV4});

/**
 * Path parameter schema for envelope and document IDs
 */
export const EnvelopeDocPath = z.object({
  envelopeId: UuidV4,
  docId: UuidV4});

/**
 * Path parameter schema for envelope, document, and page numbers
 */
export const EnvelopeDocPagePath = z.object({
  envelopeId: UuidV4,
  docId: UuidV4,
  pageNo: z.coerce.number().int().positive()});

/** /envelopes/{id}/inputs/{inputId} */
export const EnvelopeInputPath = z.object({ id: EnvelopeId, inputId: InputId });
export type EnvelopeInputPath = z.infer<typeof EnvelopeInputPath>;

/** /envelopes/{id}/parties/{partyId} */
export const EnvelopePartyPath = z.object({ id: EnvelopeId, partyId: PartyId });
export type EnvelopePartyPath = z.infer<typeof EnvelopePartyPath>;

/** /envelopes/{envelopeId}/consents/{consentId} */
export const EnvelopeConsentPath = z.object({
  envelopeId: EnvelopeId,
  consentId: ConsentId});
export type EnvelopeConsentPath = z.infer<typeof EnvelopeConsentPath>;

/** /envelopes/{id}/parties/{partyId}/delegate */
export const EnvelopePartyDelegatePath = EnvelopePartyPath;
export type EnvelopePartyDelegatePath = z.infer<typeof EnvelopePartyDelegatePath>;

/** /signing/{token} */
export const SigningTokenPath = z.object({ token: SigningToken });
export type SigningTokenPath = z.infer<typeof SigningTokenPath>;

/** /documents/{id}/certificate */
export const StandaloneDocumentIdPath = z.object({ id: DocumentId });
export type StandaloneDocumentIdPath = z.infer<typeof StandaloneDocumentIdPath>;


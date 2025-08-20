import { getContainer } from "./Container";

const c = getContainer();

export const envelopeRepository = c.repos.envelopes;
export const documentRepository = c.repos.documents;
export const eventPublisher = c.events.publisher;
export const kmsSigner = c.crypto.signer;
export const evidenceStorage = c.storage.evidence;
export const configProvider = c.configProvider;

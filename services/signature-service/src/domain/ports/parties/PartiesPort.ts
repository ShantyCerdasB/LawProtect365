/**
 * @file PartiesPort.ts
 * @summary Domain port for party reads.
 *
 * Email can be optional in domain (some parties could be placeholders).
 */

export interface PartyHead {
  partyId: string;
  envelopeId: string;
  email?: string;
}

export interface PartiesPort {
  getById(id: string): Promise<PartyHead | null>;
}

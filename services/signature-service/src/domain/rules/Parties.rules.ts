/**
 * @file Parties.rules.ts
 * @summary Domain rules for envelope-scoped parties
 * @description Domain rules and validation logic for envelope party management.
 * These rules ensure data integrity and business logic for envelope participants.
 * 
 * NOTE: These rules are currently commented out as they are not used and have
 * interface mismatches with the current port implementations.
 */

// import type { Party } from "../entities/Party";
// import type { Envelope } from "../entities/Envelope";
// import type { PartyId, EnvelopeId } from "../value-objects/Ids";
// import { PARTY_ROLES, PARTY_STATUSES } from "../values/enums";
// import { validateSequentialSequences } from "../value-objects/party/PartySequence";
// import { badRequest, partyNotFound, invalidPartyState, envelopeNotFound } from "../../shared/errors";
// import type { PartiesQueriesPort } from "../../app/ports/parties/PartiesQueriesPort";
// import type { EnvelopesQueriesPort } from "../../app/ports/envelopes/EnvelopesQueriesPort";

// All domain rules are currently commented out as they are not used and have
// interface mismatches with the current port implementations that require
// tenantId, envelopeId, and partyId parameters.
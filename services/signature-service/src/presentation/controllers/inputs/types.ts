/**
 * @file types.ts
 * @summary Inputs Controllers Types
 * @description Shared types for inputs controllers
 */

import type { EnvelopeId, InputId } from "@/domain/value-objects/Ids";

// Base controller input types (without tenantId and actor - added by factory)
export interface BaseInputControllerInput {
  envelopeId: EnvelopeId;
}

export interface InputWithIdControllerInput extends BaseInputControllerInput {
  inputId: InputId;
}

export interface CreateInputsControllerInput extends BaseInputControllerInput {
  documentId: string;
  inputs: any[];
}

export interface UpdateInputControllerInput extends InputWithIdControllerInput {
  updates: any;
}

export interface UpdateInputPositionsControllerInput extends BaseInputControllerInput {
  items: any[];
}

// Query controller input types
export interface GetInputQueryControllerInput extends InputWithIdControllerInput {
  // No additional fields needed for GET
}

export interface ListInputsQueryControllerInput extends BaseInputControllerInput {
  limit?: number;
  cursor?: string;
  documentId?: string;
  partyId?: string;
  type?: string;
  required?: boolean;
}

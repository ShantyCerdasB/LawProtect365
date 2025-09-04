/**
 * @file InputDdbTypes.ts
 * @summary DynamoDB types and utilities for Input entities
 * @description Defines DynamoDB-specific types, constants, and utilities for Input entities
 */

import { EnvelopeId, InputId, PartyId } from "@/domain/value-objects";
import type { Input } from "../../../domain/entities/Input";
import type { Mapper } from "@lawprotect/shared-ts";
import { BadRequestError, ErrorCodes } from "@lawprotect/shared-ts";

/**
 * DynamoDB entity type for Input items
 */
export const INPUT_ENTITY = "Input" as const;

/**
 * Partition key builder for Input items
 * @param envelopeId - The envelope identifier
 * @returns DynamoDB partition key
 */
export const inputPk = (envelopeId: string): string => `ENVELOPE#${envelopeId}`;

/**
 * Sort key builder for Input items
 * @param inputId - The input identifier
 * @returns DynamoDB sort key
 */
export const inputSk = (inputId: string): string => `INPUT#${inputId}`;

/**
 * Persisted DynamoDB item shape for Input entities
 * This is the exact structure stored in the table
 */
export type DdbInputItem = {
  pk: string;
  sk: string;
  type: typeof INPUT_ENTITY;

  inputId: InputId;
  envelopeId: EnvelopeId;
  partyId: PartyId;
  documentId: string;

  inputType: Input["type"];
  required: boolean;
  position: {
    page: number;
    x: number;
    y: number;
  };

  value?: string;

  createdAt: string; // ISO string
  updatedAt: string; // ISO string
};

/**
 * Type guard to check if an object is a valid DdbInputItem
 * @param v - Object to validate
 * @returns True if the object is a valid DdbInputItem
 */
export const isDdbInputItem = (v: unknown): v is DdbInputItem => {
  const o = v as Partial<DdbInputItem> | null | undefined;
  return Boolean(
    o &&
      typeof o.pk === "string" &&
      typeof o.sk === "string" &&
      o.type === INPUT_ENTITY &&
      typeof o.inputId === "string" &&
      typeof o.envelopeId === "string" &&
      typeof o.partyId === "string" &&
      typeof o.documentId === "string" &&
      typeof o.inputType === "string" &&
      typeof o.required === "boolean" &&
      o.position &&
      typeof o.position.page === "number" &&
      typeof o.position.x === "number" &&
      typeof o.position.y === "number" &&
      typeof o.createdAt === "string" &&
      typeof o.updatedAt === "string"
  );
};

/**
 * Maps domain Input entity to DynamoDB item
 * @param src - Domain Input entity
 * @returns DynamoDB item
 */
export const toInputItem = (src: Input): DdbInputItem => ({
  pk: inputPk(src.envelopeId),
  sk: inputSk(src.inputId),
  type: INPUT_ENTITY,

  inputId: src.inputId as InputId,
  envelopeId: src.envelopeId as EnvelopeId,
  partyId: src.partyId as PartyId,
  documentId: src.documentId,

  inputType: src.type,
  required: src.required,
  position: src.position,

  value: src.value,
  createdAt: src.createdAt,
  updatedAt: src.updatedAt,
});

/**
 * Maps DynamoDB item to domain Input entity
 * @param item - DynamoDB item
 * @returns Domain Input entity
 * @throws {BadRequestError} if the provided object is not a valid DdbInputItem
 */
export const fromInputItem = (item: unknown): Input => {
  if (!isDdbInputItem(item)) {
    throw new BadRequestError(
      "Invalid persistence object for Input",
      ErrorCodes.COMMON_BAD_REQUEST,
      { item }
    );
  }

  return Object.freeze<Input>({
    inputId: item.inputId,
    envelopeId: item.envelopeId,
    partyId: item.partyId,
    documentId: item.documentId,

    type: item.inputType,
    required: item.required,
    position: item.position,

    value: item.value,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  });
};

/**
 * Mapper for Input entities (Domain ↔ DynamoDB)
 */
export const inputItemMapper: Mapper<Input, DdbInputItem> = {
  toDTO: toInputItem,
  fromDTO: fromInputItem,
};

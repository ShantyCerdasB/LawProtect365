/**
 * @file Input ↔ DynamoDB item mapper.
 * @description
 * Maps domain `Input` entities (signature, consent, text fields) that belong to a Party
 * to/from their persisted representation in DynamoDB.
 *
 * DynamoDB single-table design:
 *  - PK = `ENVELOPE#<envelopeId>`
 *  - SK = `INPUT#<inputId>`
 */

import type { Input } from "../../../domain/entities/Input";
import type { Mapper } from "@lawprotect/shared-ts";
import { BadRequestError, ErrorCodes } from "@lawprotect/shared-ts";

export const INPUT_ENTITY = "Input" as const;

/** Partition/Sort key builders */
export const inputPk = (envelopeId: string): string => `ENVELOPE#${envelopeId}`;
export const inputSk = (inputId: string): string => `INPUT#${inputId}`;

/**
 * Persisted DynamoDB item shape for Input.
 * This is the exact structure stored in the table.
 */
export type DdbInputItem = {
  pk: string;
  sk: string;
  type: typeof INPUT_ENTITY;

  inputId: string;
  envelopeId: string;
  partyId: string;
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
 * Domain → DynamoDB item
 */
export const toInputItem = (src: Input): DdbInputItem => ({
  pk: inputPk(src.envelopeId),
  sk: inputSk(src.inputId),
  type: INPUT_ENTITY,

  inputId: src.inputId,
  envelopeId: src.envelopeId,
  partyId: src.partyId,
  documentId: src.documentId,

  inputType: src.type,
  required: src.required,
  position: src.position,

  value: src.value,
  createdAt: src.createdAt,
  updatedAt: src.updatedAt,
});

/**
 * Narrowing type guard for DdbInputItem.
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
 * DynamoDB item → Domain
 * @throws {BadRequestError} if the provided object is not a valid DdbInputItem.
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
 * Mapper export (Domain ↔ DTO)
 */
export const inputItemMapper: Mapper<Input, DdbInputItem> = {
  toDTO: toInputItem,
  fromDTO: fromInputItem,
};

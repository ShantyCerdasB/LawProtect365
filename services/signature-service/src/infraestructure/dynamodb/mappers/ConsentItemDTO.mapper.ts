import { InternalError, type ISODateString } from "@lawprotect/shared-ts";
import { ConsentItemDTOSchema, type ConsentItemDTO } from "../../../schemas/consents/ConsentItemDTO.schema";
import type { ConsentRepoRow } from "@/app/ports/shared/RepoTypes";

export const parseConsentItemDTO = (raw: unknown): ConsentItemDTO => {
  const parsed = ConsentItemDTOSchema.safeParse(raw);
  if (!parsed.success) {
    throw new InternalError("Invalid Consent item shape from DynamoDB", "INTERNAL_ERROR", {
      issues: parsed.error.issues,
    });
  }
  return parsed.data;
};

/** Brand helpers to satisfy ISODateString branded type */
const asIsoRequired = (s: string): ISODateString => {
  if (!Number.isFinite(Date.parse(s))) {
    throw new InternalError("Invalid ISO date in ConsentItemDTO", "INTERNAL_ERROR", { value: s });
  }
  return s as unknown as ISODateString;
};

const asIsoOptional = (s?: string): ISODateString | undefined => {
  if (typeof s === "undefined") return undefined;
  if (!Number.isFinite(Date.parse(s))) {
    throw new InternalError("Invalid ISO date in ConsentItemDTO", "INTERNAL_ERROR", { value: s });
  }
  return s as unknown as ISODateString;
};

export const dtoToConsentRow = (dto: ConsentItemDTO): ConsentRepoRow => ({
  consentId: dto.consentId,
  envelopeId: dto.envelopeId,
  tenantId: dto.tenantId,
  partyId: dto.partyId,
  consentType: dto.consentType,
  status: dto.status as ConsentRepoRow["status"],
  createdAt: asIsoRequired(dto.createdAt),
  updatedAt: asIsoOptional(dto.updatedAt),
  expiresAt: asIsoOptional(dto.expiresAt),
  metadata: dto.metadata,
});

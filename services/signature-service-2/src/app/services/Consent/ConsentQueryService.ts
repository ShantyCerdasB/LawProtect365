/**
 * @file ConsentQueryService.ts
 * @summary Simple query service wrapper for consent adapters
 * @description Acts as a bridge between controllers and consent query adapters
 */

import type { ConsentQueriesPort } from "../../ports/consent/ConsentQueriesPort";
import type { GetConsentAppInput, GetConsentAppResult, ListConsentsAppInput, ListConsentsAppResult } from "../../../domain/types/consent/AppServiceInputs";
import { NotFoundError } from "../../../shared/errors";

/**
 * @summary Simple query service for consent operations
 * @description Wrapper around consent query adapter to match factory interface
 */
export class ConsentQueryService {
  constructor(private readonly consentQueries: ConsentQueriesPort) {}

  /**
   * @summary Execute consent query operation
   * @description Routes to appropriate adapter method based on input type
   */
  async execute(input: GetConsentAppInput | ListConsentsAppInput): Promise<GetConsentAppResult | ListConsentsAppResult> {
    if ('consentId' in input) {
      // GetConsentAppInput
      const result = await this.consentQueries.getById(input);
      if (!result) {
        throw new NotFoundError('Consent not found', undefined, { consentId: input.consentId });
      }
      return result;
    } else {
      // ListConsentsAppInput
      return this.consentQueries.listByEnvelope(input);
    }
  }
};

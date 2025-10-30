/**
 * @fileoverview TestPatchMeHandler - Test handler for PATCH /me
 * @summary Test handler that uses TestCompositionRoot
 * @description Creates a test handler that uses the test composition root
 * instead of the production one for integration tests.
 */

import { AppError, ErrorCodes, isValidUserId, mapError } from '@lawprotect/shared-ts';
import { PatchMeBodySchema } from '../../src/domain/schemas/PatchMeSchema';
import { TestCompositionRoot } from './TestCompositionRoot';

export const testPatchMeHandler = async (evt: any) => {
  try {
    // Enforce content-type for JSON body
    const ct = evt?.headers?.['Content-Type'] ?? evt?.headers?.['content-type'];
    if (!ct || ct !== 'application/json') {
      throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 400, 'Content-Type must be application/json');
    }

    // Parse JSON body if string
    const rawBody = typeof evt.body === 'string' ? JSON.parse(evt.body) : (evt.body ?? {});
    // Zod validation to produce 422 on schema errors
    const body = PatchMeBodySchema.parse(rawBody);

    // Normalize nulls to undefined for PatchMeRequest compatibility
    const normalized: any = { ...body };
    if (normalized.name === null) delete normalized.name;
    if (normalized.givenName === null) delete normalized.givenName;
    if (normalized.lastName === null) delete normalized.lastName;
    if (normalized.personalInfo) {
      const pi: any = { ...normalized.personalInfo };
      if (pi.phone === null) delete pi.phone;
      if (pi.locale === null) delete pi.locale;
      if (pi.timeZone === null) delete pi.timeZone;
      if (Object.keys(pi).length === 0) delete normalized.personalInfo;
      else normalized.personalInfo = pi;
    }

    // Resolve userId from auth/authorizer
    const userId = evt?.auth?.userId || evt?.requestContext?.authorizer?.claims?.['custom:user_id'] || evt?.requestContext?.authorizer?.claims?.sub;
    if (!userId || !isValidUserId(userId)) {
      throw new AppError(ErrorCodes.COMMON_BAD_REQUEST, 400, 'Invalid request body', { field: 'userId' });
    }

    // Use the same use case as production
    const useCases = TestCompositionRoot.getInstance().createUseCases();
    const result = await useCases.patchMeUseCase.execute(userId, normalized);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch (err) {
    return mapError(err);
  }
};



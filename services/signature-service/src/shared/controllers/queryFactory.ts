/**
 * @file queryControllerFactory.ts
 * @summary Query controller factory using shared-ts middleware system
 * @description Factory for creating standardized query controllers (GET operations)
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { validateRequest, ok, created, noContent } from "@lawprotect/shared-ts";
import { tenantFromCtx } from "../../presentation/middleware/auth";
import { getContainer } from "../../core/Container";
import type { QueryControllerConfig } from "../contracts/controllers";
import { RESPONSE_TYPES } from "../../domain/values/enums";

/**
 * @summary Creates a query controller (GET operations)
 * @description Factory function that creates a standardized query controller
 * 
 * @param config - Configuration for the controller
 * @returns HandlerFn for the query operation
 */
export const createQueryController = <TInput, TOutput>(
  config: QueryControllerConfig<TInput, TOutput>
): HandlerFn => {
  return async (evt) => {
    const validationSchemas: any = {};
    if (config.pathSchema) validationSchemas.path = config.pathSchema;
    if (config.querySchema) validationSchemas.query = config.querySchema;
    
    const validated = validateRequest(evt, validationSchemas);
    const tenantId = tenantFromCtx(evt);
    
    const c = getContainer();
    const dependencies = config.createDependencies(c);
    const appService = new config.appServiceClass(dependencies);
    
    const params = config.extractParams(validated.path, validated.query);
    const result = await appService.execute({ tenantId, ...params });
    
    const responseData = config.transformResult ? config.transformResult(result) : result;
    
    switch (config.responseType) {
      case RESPONSE_TYPES[1]: // 'created'
        return created({ data: responseData });
      case RESPONSE_TYPES[2]: // 'noContent'
        return noContent();
      default: // 'ok'
        return ok({ data: responseData });
    }
  };
};

/**
 * @file createQueryController.ts
 * @summary Generic query controller factory
 * @description Universal factory for creating standardized query controllers (GET operations)
 */

import type { HandlerFn } from "../../http/httpTypes.js";
import { validateRequest } from "../../validation/requests.js";
import { ok, created, noContent } from "../../http/responses.js";
import type { QueryControllerConfig } from "../../contracts/controllers/index.js";

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
  return async (evt: any) => {
    const validationSchemas: any = {};
    if (config.pathSchema) validationSchemas.path = config.pathSchema;
    if (config.querySchema) validationSchemas.query = config.querySchema;
    
    const validated = validateRequest(evt, validationSchemas);
    
    const c = config.getContainer();
    const dependencies = config.createDependencies(c);
    const appService = new config.appServiceClass(dependencies);
    
    const params = config.extractParams(validated.path, validated.query);
    const result = await appService.execute(params);
    
    const responseData = config.transformResult ? config.transformResult(result) : result;
    
    switch (config.responseType) {
      case 'created':
        return created({ data: responseData });
      case 'noContent':
        return noContent();
      default: // 'ok'
        return ok({ data: responseData });
    }
  };
};

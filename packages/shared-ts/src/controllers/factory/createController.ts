/**
 * @file createController.ts
 * @summary Generic command controller factory
 * @description Universal factory for creating standardized command controllers (POST/PUT/PATCH/DELETE operations)
 */

import type { HandlerFn } from "../../http/httpTypes.js";
import { validateRequest } from "../../validation/requests.js";
import { ok, created, noContent } from "../../http/responses.js";
import { tenantFromCtx, actorFromCtx } from "../extractors/index.js";
import type { CommandControllerConfig } from "../../contracts/controllers/index.js";

/**
 * @summary Creates a command controller (POST/PUT/PATCH/DELETE operations)
 * @description Universal factory function that creates standardized command controllers
 * 
 * @param config - Configuration for the controller
 * @returns HandlerFn for the command operation
 */
export const createController = <TInput, TOutput>(
  config: CommandControllerConfig<TInput, TOutput>
): HandlerFn => {
  return async (evt: any) => {
    const validationSchemas: any = {};
    if (config.pathSchema) validationSchemas.path = config.pathSchema;
    if (config.bodySchema) validationSchemas.body = config.bodySchema;
    
    const validated = validateRequest(evt, validationSchemas);
    const tenantId = tenantFromCtx(evt);
    const actor = config.includeActor ? actorFromCtx(evt) : undefined;
    
    const c = config.getContainer();
    const dependencies = config.createDependencies(c);
    const appService = new config.appServiceClass(dependencies);
    
    const params = config.extractParams(validated.path, validated.body);
    const result = await appService.execute({ tenantId, actor, ...params });
    
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

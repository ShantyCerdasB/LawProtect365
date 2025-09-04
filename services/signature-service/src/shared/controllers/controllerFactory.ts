/**
 * @file controllerFactory.ts
 * @summary Universal controller factory using shared-ts middleware system
 * @description Factory for creating standardized controllers (POST/PUT/PATCH/DELETE operations)
 */

import type { HandlerFn } from "@lawprotect/shared-ts";
import { validateRequest, ok, created, noContent } from "@lawprotect/shared-ts";
import { tenantFromCtx, actorFromCtx } from "../../presentation/middleware/auth";
import { getContainer } from "../../core/Container";
import type { CommandControllerConfig } from "../contracts/controllers";
import { RESPONSE_TYPES } from "../../domain/values/enums";

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
  return async (evt) => {
    const validationSchemas: any = {};
    if (config.pathSchema) validationSchemas.path = config.pathSchema;
    if (config.bodySchema) validationSchemas.body = config.bodySchema;
    
    const validated = validateRequest(evt, validationSchemas);
    const tenantId = tenantFromCtx(evt);
    const actor = config.includeActor ? actorFromCtx(evt) : undefined;
    
    const c = getContainer();
    const dependencies = config.createDependencies(c);
    const appService = new config.appServiceClass(dependencies);
    
    const params = config.extractParams(validated.path, validated.body);
    const result = await appService.execute({ tenantId, actor, ...params });
    
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

// Alias for backward compatibility
export const createCommandController = createController;

/**
 * @file queryControllerFactory.ts
 * @summary Signature service specific query controller factory helpers
 * @description Helper functions for creating signature service specific query controller configurations
 */

import { createQueryController as createGenericQueryController } from "@lawprotect/shared-ts";
import { getContainer } from "../../core/Container";

/**
 * @summary Creates a query controller (GET operations)
 * @description Wrapper around the generic createQueryController that provides signature service specific configuration
 * 
 * @param config - Configuration for the controller
 * @returns HandlerFn for the query operation
 */
export const createQueryController = <TInput, TOutput>(config: any) => {
  return createGenericQueryController<TInput, TOutput>({
    ...config,
    getContainer});
};


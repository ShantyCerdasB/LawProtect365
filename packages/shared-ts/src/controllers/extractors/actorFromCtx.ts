/**
 * @file actorFromCtx.ts
 * @summary Actor context extraction from API Gateway context
 * @description Extracts actor context from API Gateway event context
 */

import type { APIGatewayProxyEvent, APIGatewayProxyEventV2 } from "aws-lambda";

/**
 * @summary Extracts actor context from API Gateway event context
 * @description Universal function to extract actor context from either v1 or v2 API Gateway events
 * 
 * @param evt - API Gateway event (v1 or v2)
 * @returns Actor context object
 * @throws Error if actor context is not found
 */
export const actorFromCtx = (evt: APIGatewayProxyEvent | APIGatewayProxyEventV2) => {
  // Handle v2 events
  if ('requestContext' in evt && 'authorizer' in evt.requestContext) {
    const authorizer = evt.requestContext.authorizer;
    if (authorizer && typeof authorizer === 'object' && 'actor' in authorizer) {
      return authorizer.actor;
    }
  }
  
  // Handle v1 events
  if ('requestContext' in evt && 'authorizer' in evt.requestContext) {
    const authorizer = evt.requestContext.authorizer;
    if (authorizer && typeof authorizer === 'object' && 'actor' in authorizer) {
      return authorizer.actor;
    }
  }
  
  throw new Error("Actor context not found in request context");
};






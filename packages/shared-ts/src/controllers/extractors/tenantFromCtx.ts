/**
 * @file tenantFromCtx.ts
 * @summary Tenant ID extraction from API Gateway context
 * @description Extracts tenant ID from API Gateway event context
 */

import type { APIGatewayProxyEvent, APIGatewayProxyEventV2 } from "aws-lambda";

/**
 * @summary Extracts tenant ID from API Gateway event context
 * @description Universal function to extract tenant ID from either v1 or v2 API Gateway events
 * 
 * @param evt - API Gateway event (v1 or v2)
 * @returns Tenant ID string
 * @throws Error if tenant ID is not found
 */
export const tenantFromCtx = (evt: APIGatewayProxyEvent | APIGatewayProxyEventV2): string => {
  // Handle v2 events
  if ('requestContext' in evt && 'authorizer' in evt.requestContext) {
    const authorizer = evt.requestContext.authorizer;
    if (authorizer && typeof authorizer === 'object' && 'tenantId' in authorizer) {
      return authorizer.tenantId as string;
    }
  }
  
  // Handle v1 events
  if ('requestContext' in evt && 'authorizer' in evt.requestContext) {
    const authorizer = evt.requestContext.authorizer;
    if (authorizer && typeof authorizer === 'object' && 'tenantId' in authorizer) {
      return authorizer.tenantId as string;
    }
  }
  
  throw new Error("Tenant ID not found in request context");
};



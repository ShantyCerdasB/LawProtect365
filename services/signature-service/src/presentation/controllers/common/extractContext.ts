/**
 * @file extractContext.ts
 * @summary Context extraction utilities
 * @description Utilities for extracting common context from Lambda events
 */

import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { TenantId } from "../../../domain/value-objects/Ids";

/**
 * @summary Extracts tenant ID from Lambda event
 * @description Extracts tenant ID from request context or headers
 * @param evt - The Lambda event containing HTTP request data
 * @returns Tenant ID from the event
 * @throws {Error} When tenant ID is not found
 */
export const extractTenantId = (evt: APIGatewayProxyEventV2): TenantId => {
  // Extract from request context (Cognito)
  const tenantId = evt.requestContext?.authorizer?.tenantId;
  if (tenantId) {
    return tenantId as TenantId;
  }

  // Extract from headers
  const headerTenantId = evt.headers["x-tenant-id"] || evt.headers["X-Tenant-Id"];
  if (headerTenantId) {
    return headerTenantId as TenantId;
  }

  throw new Error("Tenant ID not found in request");
};

/**
 * @summary Extracts actor information from Lambda event
 * @description Extracts actor details from request context or headers
 * @param evt - The Lambda event containing HTTP request data
 * @returns Actor information object
 */
export const extractActor = (evt: APIGatewayProxyEventV2) => {
  return {
    userId: evt.requestContext?.authorizer?.userId,
    email: evt.requestContext?.authorizer?.email,
    ip: evt.requestContext?.identity?.sourceIp,
    userAgent: evt.requestContext?.identity?.userAgent,
  };
};

/**
 * @summary Extracts common context from Lambda event
 * @description Extracts tenant ID and actor information from the event
 * @param evt - The Lambda event containing HTTP request data
 * @returns Object containing tenant ID and actor information
 */
export const extractContext = (evt: APIGatewayProxyEventV2) => {
  return {
    tenantId: extractTenantId(evt),
    actor: extractActor(evt),
  };
};

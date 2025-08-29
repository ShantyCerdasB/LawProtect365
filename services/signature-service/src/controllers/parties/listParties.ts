/**
 * @file listParties.ts
 * @summary HTTP controller for GET /envelopes/:envelopeId/parties
 * 
 * @description
 * Lists parties for an envelope with pagination and filtering.
 * Validates path and query parameters, then returns party list.
 * Returns 200 with party data on success, 400/404 on errors.
 */

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { ListPartiesPath, ListPartiesQuery } from "@/schemas/parties/ListParties.schema";
import { listParties } from "@/use-cases/parties/ListParties";
import { getContainer } from "@/infra/Container";

/**
 * HTTP handler for listing parties
 * 
 * @param event - API Gateway event with path and query parameters
 * @returns Promise resolving to HTTP response with party list or error
 * 
 * @example
 * ```typescript
 * // GET /envelopes/123/parties?limit=25&role=signer
 * const response = await handler(event);
 * ```
 */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    // Validate path parameters
    const pathParams = ListPartiesPath.safeParse(event.pathParameters);
    if (!pathParams.success) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Invalid envelope ID",
          errors: pathParams.error.errors,
        }),
      };
    }

    // Validate query parameters
    const queryParams = ListPartiesQuery.safeParse(event.queryStringParameters || {});
    if (!queryParams.success) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Invalid query parameters",
          errors: queryParams.error.errors,
        }),
      };
    }

    // Get dependencies from container
    const container = getContainer();
    const { envelopes } = container.repos;

    // Extract tenant ID from event (you may need to adjust this based on your auth setup)
    const tenantId = event.requestContext.authorizer?.tenantId || "default-tenant";

    // Execute use case
    const result = await listParties(
      {
        tenantId,
        envelopeId: pathParams.data.envelopeId,
        limit: queryParams.data.limit,
        cursor: queryParams.data.cursor,
        role: queryParams.data.role,
        status: queryParams.data.status,
        email: queryParams.data.email,
      },
      {
        envelopes,
        parties: {
          listByEnvelope: async (input) => {
            // This would be implemented by your actual party repository
            return {
              items: [],
              meta: {
                limit: input.limit,
                nextCursor: undefined,
                total: 0,
              },
            };
          },
        },
      }
    );

    // Return 404 if envelope not found
    if (!result) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Envelope not found",
        }),
      };
    }

    // Return success response
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: result,
      }),
    };
  } catch (error) {
    console.error("Error listing parties:", error);
    
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Internal server error",
      }),
    };
  }
};



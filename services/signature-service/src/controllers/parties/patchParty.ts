/**
 * @file patchParty.ts
 * @summary HTTP controller for PATCH /envelopes/:envelopeId/parties/:partyId
 * 
 * @description
 * Updates a party record with partial data.
 * Validates path parameters and request body, then updates the party.
 * Returns 200 with updated party data on success, 400/404/422 on errors.
 */

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { PatchPartyPath, PatchPartyBody } from "@/schemas/parties/PatchParty.schema";
import { patchParty } from "@/use-cases/parties/PatchParty";
import { getContainer } from "@/infra/Container";

/**
 * HTTP handler for patching a party
 * 
 * @param event - API Gateway event with path parameters and request body
 * @returns Promise resolving to HTTP response with updated party data or error
 * 
 * @example
 * ```typescript
 * // PATCH /envelopes/123/parties/party-456
 * // Body: { "name": "Updated Name", "role": "signer" }
 * const response = await handler(event);
 * ```
 */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    // Validate path parameters
    const pathParams = PatchPartyPath.safeParse(event.pathParameters);
    if (!pathParams.success) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Invalid path parameters",
          errors: pathParams.error.errors,
        }),
      };
    }

    // Validate request body
    const body = event.body ? JSON.parse(event.body) : {};
    const bodyParams = PatchPartyBody.safeParse(body);
    if (!bodyParams.success) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Invalid request body",
          errors: bodyParams.error.errors,
        }),
      };
    }

    // Get dependencies from container
    const container = getContainer();
    const { envelopes } = container.repos;

    // Extract tenant ID from event (you may need to adjust this based on your auth setup)
    const tenantId = event.requestContext.authorizer?.tenantId || "default-tenant";

    // Extract actor information from event
    const actor = {
      userId: event.requestContext.authorizer?.userId,
      email: event.requestContext.authorizer?.email,
      ip: event.requestContext.http.sourceIp,
      userAgent: event.headers["user-agent"],
    };

    // Execute use case
    const result = await patchParty(
      {
        tenantId,
        envelopeId: pathParams.data.envelopeId,
        partyId: pathParams.data.partyId,
        name: bodyParams.data.name,
        role: bodyParams.data.role,
        order: bodyParams.data.order,
        status: bodyParams.data.status,
        metadata: bodyParams.data.metadata,
        notificationPreferences: bodyParams.data.notificationPreferences,
        actor,
      },
      {
        envelopes,
        parties: {
          getById: async (id) => {
            // This would be implemented by your actual party repository
            return {
              partyId: id,
              envelopeId: pathParams.data.envelopeId,
              email: "party@example.com",
              name: "Original Name",
              role: "signer",
              order: 1,
              status: "pending",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              metadata: {},
              notificationPreferences: {
                email: true,
                sms: false,
              },
            };
          },
          update: async (id, input) => {
            // This would be implemented by your actual party repository
            return {
              partyId: id,
              envelopeId: pathParams.data.envelopeId,
              email: "party@example.com",
              name: input.name || "Original Name",
              role: input.role || "signer",
              order: input.order || 1,
              status: input.status || "pending",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              metadata: input.metadata || {},
              notificationPreferences: input.notificationPreferences || {
                email: true,
                sms: false,
              },
            };
          },
        },
      }
    );

    // Return 404 if party not found
    if (!result) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Party not found",
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
    console.error("Error patching party:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("Cannot update parties")) {
        return {
          statusCode: 422,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: error.message,
          }),
        };
      }
      
      if (error.message.includes("Cannot change role or order")) {
        return {
          statusCode: 422,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: error.message,
          }),
        };
      }
    }
    
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Internal server error",
      }),
    };
  }
};

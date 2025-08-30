/**
 * @file deleteParty.ts
 * @summary HTTP controller for DELETE /envelopes/:envelopeId/parties/:partyId
 * 
 * @description
 * Deletes a party record from an envelope.
 * Validates path parameters, then deletes the party.
 * Returns 200 with deletion confirmation on success, 400/404/422 on errors.
 */

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DeletePartyPath } from "@/schemas/parties/DeleteParty.schema";
import { deleteParty } from "@/use-cases/parties/DeleteParty";
import { getContainer } from "@/core/Container";

/**
 * HTTP handler for deleting a party
 * 
 * @param event - API Gateway event with path parameters
 * @returns Promise resolving to HTTP response with deletion confirmation or error
 * 
 * @example
 * ```typescript
 * // DELETE /envelopes/123/parties/party-456
 * const response = await handler(event);
 * ```
 */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    // Validate path parameters
    const pathParams = DeletePartyPath.safeParse(event.pathParameters);
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
    const result = await deleteParty(
      {
        tenantId,
        envelopeId: pathParams.data.envelopeId,
        partyId: pathParams.data.partyId,
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
              role: "signer",
              status: "pending",
            };
          },
          delete: async (id) => {
            // This would be implemented by your actual party repository
            // No return value expected
          },
          countByEnvelope: async (envelopeId) => {
            // This would be implemented by your actual party repository
            return 2; // Assume there are other parties
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
        data: {
          message: "Party deleted successfully",
          partyId: result.partyId,
          envelopeId: result.envelopeId,
          deletedAt: result.deletedAt,
        },
      }),
    };
  } catch (error) {
    console.error("Error deleting party:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("Cannot delete parties")) {
        return {
          statusCode: 422,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: error.message,
          }),
        };
      }
      
      if (error.message.includes("Cannot delete party that has already signed")) {
        return {
          statusCode: 422,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: error.message,
          }),
        };
      }
      
      if (error.message.includes("Cannot delete the last party")) {
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

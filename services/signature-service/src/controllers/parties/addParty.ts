/**
 * @file addParty.ts
 * @summary HTTP controller for POST /envelopes/:envelopeId/parties
 * 
 * @description
 * Adds a new party to an envelope.
 * Validates path parameters and request body, then creates the party.
 * Returns 201 with party data on success, 400/404/409 on errors.
 */

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { AddPartyPath, AddPartyBody } from "@/schemas/parties/AddParty.schema";
import { addParty } from "@/use-cases/parties/AddParty";
import { getContainer } from "@/infra/Container";

/**
 * HTTP handler for adding a party
 * 
 * @param event - API Gateway event with path parameters and request body
 * @returns Promise resolving to HTTP response with party data or error
 * 
 * @example
 * ```typescript
 * // POST /envelopes/123/parties
 * // Body: { "email": "john@example.com", "name": "John Doe", "role": "signer" }
 * const response = await handler(event);
 * ```
 */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    // Validate path parameters
    const pathParams = AddPartyPath.safeParse(event.pathParameters);
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

    // Validate request body
    const body = event.body ? JSON.parse(event.body) : {};
    const bodyParams = AddPartyBody.safeParse(body);
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
    const { envelopes, parties } = container.repos;

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
    const result = await addParty(
      {
        tenantId,
        envelopeId: pathParams.data.envelopeId,
        email: bodyParams.data.email,
        name: bodyParams.data.name,
        role: bodyParams.data.role,
        order: bodyParams.data.order,
        metadata: bodyParams.data.metadata,
        notificationPreferences: bodyParams.data.notificationPreferences,
        actor,
      },
      {
        envelopes,
        parties: {
          create: async (input) => {
            // This would be implemented by your actual party repository
            const partyId = `party-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            return {
              partyId,
              envelopeId: input.envelopeId,
              email: input.email,
              name: input.name,
              role: input.role,
              order: input.order,
              status: "pending",
              createdAt: new Date().toISOString(),
              metadata: input.metadata,
              notificationPreferences: input.notificationPreferences,
            };
          },
          listByEnvelope: async (input) => {
            // This would be implemented by your actual party repository
            return [];
          },
        },
        ids: {
          ulid: () => `party-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      }
    );

    // Return success response
    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: result,
      }),
    };
  } catch (error) {
    console.error("Error adding party:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return {
          statusCode: 404,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: error.message,
          }),
        };
      }
      
      if (error.message.includes("already exists")) {
        return {
          statusCode: 409,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: error.message,
          }),
        };
      }
      
      if (error.message.includes("Cannot add parties")) {
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



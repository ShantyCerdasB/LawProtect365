/**
 * @file delegateParty.ts
 * @summary HTTP controller for POST /envelopes/:envelopeId/parties/:partyId/delegate
 * 
 * @description
 * Delegates a party's signing authority to another person.
 * Validates path parameters and request body, then creates the delegation.
 * Returns 201 with delegation data on success, 400/404/422 on errors.
 */

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DelegatePartyPath, DelegatePartyBody } from "@/schemas/parties/DelegateParty.schema";
import { delegateParty } from "@/use-cases/parties/DelegateParty";
import { getContainer } from "@/infra/Container";

/**
 * HTTP handler for delegating a party
 * 
 * @param event - API Gateway event with path parameters and request body
 * @returns Promise resolving to HTTP response with delegation data or error
 * 
 * @example
 * ```typescript
 * // POST /envelopes/123/parties/party-456/delegate
 * // Body: { "delegateEmail": "delegate@example.com", "delegateName": "John Doe", "reason": "Temporary absence" }
 * const response = await handler(event);
 * ```
 */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    // Validate path parameters
    const pathParams = DelegatePartyPath.safeParse(event.pathParameters);
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
    const bodyParams = DelegatePartyBody.safeParse(body);
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
    const result = await delegateParty(
      {
        tenantId,
        envelopeId: pathParams.data.envelopeId,
        partyId: pathParams.data.partyId,
        delegateEmail: bodyParams.data.delegateEmail,
        delegateName: bodyParams.data.delegateName,
        reason: bodyParams.data.reason,
        expiresAt: bodyParams.data.expiresAt,
        metadata: bodyParams.data.metadata,
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
              email: "original@example.com",
              role: "signer",
              status: "pending",
            };
          },
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
            };
          },
        },
        delegations: {
          create: async (input) => {
            // This would be implemented by your actual delegation repository
            const delegationId = `delegation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            return {
              delegationId,
              envelopeId: input.envelopeId,
              originalPartyId: input.originalPartyId,
              delegatePartyId: input.delegatePartyId,
              reason: input.reason,
              status: "pending",
              createdAt: new Date().toISOString(),
              expiresAt: input.expiresAt,
              metadata: input.metadata,
            };
          },
        },
        ids: {
          ulid: () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: result,
      }),
    };
  } catch (error) {
    console.error("Error delegating party:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("Cannot delegate parties")) {
        return {
          statusCode: 422,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: error.message,
          }),
        };
      }
      
      if (error.message.includes("Cannot delegate party that has already signed")) {
        return {
          statusCode: 422,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: error.message,
          }),
        };
      }
      
      if (error.message.includes("Only signers can be delegated")) {
        return {
          statusCode: 422,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: error.message,
          }),
        };
      }
      
      if (error.message.includes("Cannot delegate to the same email address")) {
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




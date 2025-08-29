/**
 * @file declineSigning.controller.test.ts
 * @summary Unit tests for the declineSigning controller.
 *
 * @description
 * Tests the declineSigning controller with mocked dependencies.
 * Focuses on parsing, use-case execution, container wiring, and response shaping.
 */

import { validateJsonBody } from "@lawprotect/shared-ts";
import { DeclineSigningBody } from "../../../src/schemas/signing/DeclineSigning.schema";
import { executeDeclineSigning } from "../../../src/use-cases/signatures/DeclineSigning";
import { getContainer } from "../../../src/infra/Container";
import { requestTokenInvalid } from "../../../src/errors";

// --- Mocks ---
// Mock the HTTP wrapper to bypass real middleware and inject a minimal ctx.
jest.mock("@/middleware/http", () => {
  const wrapPublicController = jest.fn((fn: any) => {
    // Return a handler that injects ctx and calls the base function
    return async (evt: any) => {
      (evt as any).ctx = {
        requestId: "req-123",
        logger: {
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
          debug: jest.fn(),
        },
      };
      return fn(evt);
    };
  });
  const corsFromEnv = jest.fn(() => ({}));
  return { wrapPublicController, corsFromEnv };
});

// Mock domain schema, use-case and container
jest.mock("@lawprotect/shared-ts", () => ({
  validateJsonBody: jest.fn(),
}));
jest.mock("@/schemas/signing/DeclineSigning.schema", () => ({
  DeclineSigningBody: jest.fn(),
}));
jest.mock("@/use-cases/signatures/DeclineSigning", () => ({
  executeDeclineSigning: jest.fn(),
}));
jest.mock("@/infra/Container", () => ({
  getContainer: jest.fn(),
}));
jest.mock("@/errors", () => ({
  requestTokenInvalid: jest.fn(),
}));

// Import the handler AFTER setting up mocks
import { handler } from "../../../src/controllers/signing/declineSigning";

const mockValidateJsonBody = validateJsonBody as jest.MockedFunction<typeof validateJsonBody>;
const mockExecuteDeclineSigning = executeDeclineSigning as jest.MockedFunction<typeof executeDeclineSigning>;
const mockGetContainer = getContainer as jest.MockedFunction<typeof getContainer>;
const mockRequestTokenInvalid = requestTokenInvalid as jest.MockedFunction<typeof requestTokenInvalid>;

describe("declineSigning controller", () => {
  let mockContainer: any;
  let mockRepos: any;
  let mockEvents: any;
  let mockIdempotency: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepos = {
      envelopes: { getById: jest.fn(), update: jest.fn() },
      parties: { getById: jest.fn(), update: jest.fn() },
    };

    mockEvents = {
      publisher: { publish: jest.fn() },
    };

    mockIdempotency = {
      runner: { run: jest.fn() },
    };

    mockContainer = {
      repos: mockRepos,
      events: mockEvents,
      idempotency: mockIdempotency,
    };

    mockGetContainer.mockReturnValue(mockContainer);
  });

  describe("success cases", () => {
    it("successfully declines signing with valid request", async () => {
      const event: any = {
        body: JSON.stringify({
          envelopeId: "550e8400-e29b-41d4-a716-446655440000",
          signerId: "550e8400-e29b-41d4-a716-446655440001",
          reason: "I do not agree with the terms",
        }),
        headers: {
          "x-request-token": "valid-token",
          "x-forwarded-for": "192.168.1.1",
          "user-agent": "Mozilla/5.0",
          "accept-language": "en-US,en;q=0.9",
        },
      };

      const parsedBody = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        signerId: "550e8400-e29b-41d4-a716-446655440001",
        reason: "I do not agree with the terms",
      };

      const useCaseResult = {
        status: "declined" as const,
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        signerId: "550e8400-e29b-41d4-a716-446655440001",
        reason: "I do not agree with the terms",
        declinedAt: "2024-01-01T00:00:00.000Z",
      };

      mockValidateJsonBody.mockReturnValue(parsedBody);
      mockExecuteDeclineSigning.mockResolvedValue(useCaseResult);

      const response = await handler(event);

      expect(response).toEqual({
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "declined",
          envelopeId: "550e8400-e29b-41d4-a716-446655440000",
          signerId: "550e8400-e29b-41d4-a716-446655440001",
          reason: "I do not agree with the terms",
        }),
      });

      expect(mockValidateJsonBody).toHaveBeenCalledWith(event, DeclineSigningBody);
      expect(mockExecuteDeclineSigning).toHaveBeenCalledWith(
        {
          envelopeId: "550e8400-e29b-41d4-a716-446655440000",
          signerId: "550e8400-e29b-41d4-a716-446655440001",
          reason: "I do not agree with the terms",
          token: "valid-token",
          actor: {
            ip: "192.168.1.1",
            userAgent: "Mozilla/5.0",
            locale: "en-US",
          },
        },
        {
          repos: {
            envelopes: mockRepos.envelopes,
            parties: mockRepos.parties,
          },
          events: mockEvents.publisher,
          idempotency: mockIdempotency.runner,
          ids: {
            ulid: expect.any(Function),
          },
          time: {
            now: expect.any(Function),
          },
        }
      );
    });

    it("extracts actor information correctly from different header sources", async () => {
      const event: any = {
        body: JSON.stringify({
          envelopeId: "550e8400-e29b-41d4-a716-446655440000",
          signerId: "550e8400-e29b-41d4-a716-446655440001",
          reason: "Test reason",
        }),
        headers: {
          "x-request-token": "valid-token",
          "x-real-ip": "10.0.0.1",
          "user-agent": "TestAgent/1.0",
          "accept-language": "es-ES,es;q=0.9,en;q=0.8",
        },
        requestContext: {
          identity: {
            sourceIp: "172.16.0.1",
          },
        },
      };

      const parsedBody = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        signerId: "550e8400-e29b-41d4-a716-446655440001",
        reason: "Test reason",
      };

      const useCaseResult = {
        status: "declined" as const,
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        signerId: "550e8400-e29b-41d4-a716-446655440001",
        reason: "Test reason",
        declinedAt: "2024-01-01T00:00:00.000Z",
      };

      mockValidateJsonBody.mockReturnValue(parsedBody);
      mockExecuteDeclineSigning.mockResolvedValue(useCaseResult);

      await handler(event);

      expect(mockExecuteDeclineSigning).toHaveBeenCalledWith(
        expect.objectContaining({
          actor: {
            ip: "172.16.0.1", // Should prefer requestContext.identity.sourceIp
            userAgent: "TestAgent/1.0",
            locale: "es-ES",
          },
        }),
        expect.any(Object)
      );
    });
  });

  describe("error cases", () => {
    it("returns 400 for invalid request body", async () => {
      const event: any = {
        body: "invalid json",
        headers: {
          "x-request-token": "valid-token",
        },
      };

      const validationError = new Error("Invalid JSON");
      mockValidateJsonBody.mockImplementation(() => {
        throw validationError;
      });

      await expect(handler(event)).rejects.toThrow(validationError);
    });

    it("returns 401 when x-request-token header is missing", async () => {
      const event: any = {
        body: JSON.stringify({
          envelopeId: "550e8400-e29b-41d4-a716-446655440000",
          signerId: "550e8400-e29b-41d4-a716-446655440001",
          reason: "Test reason",
        }),
        headers: {},
      };

      const parsedBody = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        signerId: "550e8400-e29b-41d4-a716-446655440001",
        reason: "Test reason",
      };

      const tokenError = new Error("Invalid request token");
      mockValidateJsonBody.mockReturnValue(parsedBody);
      mockRequestTokenInvalid.mockImplementation(() => {
        throw tokenError;
      });

      await expect(handler(event)).rejects.toThrow(tokenError);
      expect(mockRequestTokenInvalid).toHaveBeenCalledWith({ header: "x-request-token" });
    });

    it("returns 401 when x-request-token header is not a string", async () => {
      const event: any = {
        body: JSON.stringify({
          envelopeId: "550e8400-e29b-41d4-a716-446655440000",
          signerId: "550e8400-e29b-41d4-a716-446655440001",
          reason: "Test reason",
        }),
        headers: {
          "x-request-token": 123, // Not a string
        },
      };

      const parsedBody = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        signerId: "550e8400-e29b-41d4-a716-446655440001",
        reason: "Test reason",
      };

      const tokenError = new Error("Invalid request token");
      mockValidateJsonBody.mockReturnValue(parsedBody);
      mockRequestTokenInvalid.mockImplementation(() => {
        throw tokenError;
      });

      await expect(handler(event)).rejects.toThrow(tokenError);
      expect(mockRequestTokenInvalid).toHaveBeenCalledWith({ header: "x-request-token" });
    });

    it("propagates domain errors from use case", async () => {
      const event: any = {
        body: JSON.stringify({
          envelopeId: "550e8400-e29b-41d4-a716-446655440000",
          signerId: "550e8400-e29b-41d4-a716-446655440001",
          reason: "Test reason",
        }),
        headers: {
          "x-request-token": "valid-token",
        },
      };

      const parsedBody = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        signerId: "550e8400-e29b-41d4-a716-446655440001",
        reason: "Test reason",
      };

      const domainError = new Error("Envelope not found");
      mockValidateJsonBody.mockReturnValue(parsedBody);
      mockExecuteDeclineSigning.mockRejectedValue(domainError);

      await expect(handler(event)).rejects.toThrow(domainError);
    });
  });

  describe("actor extraction", () => {
    it("handles missing headers gracefully", async () => {
      const event: any = {
        body: JSON.stringify({
          envelopeId: "550e8400-e29b-41d4-a716-446655440000",
          signerId: "550e8400-e29b-41d4-a716-446655440001",
          reason: "Test reason",
        }),
        headers: {
          "x-request-token": "valid-token",
        },
      };

      const parsedBody = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        signerId: "550e8400-e29b-41d4-a716-446655440001",
        reason: "Test reason",
      };

      const useCaseResult = {
        status: "declined" as const,
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        signerId: "550e8400-e29b-41d4-a716-446655440001",
        reason: "Test reason",
        declinedAt: "2024-01-01T00:00:00.000Z",
      };

      mockValidateJsonBody.mockReturnValue(parsedBody);
      mockExecuteDeclineSigning.mockResolvedValue(useCaseResult);

      await handler(event);

      expect(mockExecuteDeclineSigning).toHaveBeenCalledWith(
        expect.objectContaining({
          actor: {
            ip: undefined,
            userAgent: undefined,
            locale: "en-US", // Default fallback
          },
        }),
        expect.any(Object)
      );
    });

    it("handles x-forwarded-for with multiple IPs", async () => {
      const event: any = {
        body: JSON.stringify({
          envelopeId: "550e8400-e29b-41d4-a716-446655440000",
          signerId: "550e8400-e29b-41d4-a716-446655440001",
          reason: "Test reason",
        }),
        headers: {
          "x-request-token": "valid-token",
          "x-forwarded-for": "203.0.113.1, 70.41.3.18, 150.172.238.178",
          "user-agent": "TestAgent/1.0",
          "accept-language": "fr-FR,fr;q=0.9",
        },
      };

      const parsedBody = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        signerId: "550e8400-e29b-41d4-a716-446655440001",
        reason: "Test reason",
      };

      const useCaseResult = {
        status: "declined" as const,
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        signerId: "550e8400-e29b-41d4-a716-446655440001",
        reason: "Test reason",
        declinedAt: "2024-01-01T00:00:00.000Z",
      };

      mockValidateJsonBody.mockReturnValue(parsedBody);
      mockExecuteDeclineSigning.mockResolvedValue(useCaseResult);

      await handler(event);

      expect(mockExecuteDeclineSigning).toHaveBeenCalledWith(
        expect.objectContaining({
          actor: {
            ip: "203.0.113.1", // Should take the first IP
            userAgent: "TestAgent/1.0",
            locale: "fr-FR",
          },
        }),
        expect.any(Object)
      );
    });
  });
});

/**
 * @file DeclineSigning.usecase.test.ts
 * @summary Unit tests for the DeclineSigning use case.
 *
 * @description
 * Tests the DeclineSigning use case with mocked dependencies.
 * Focuses on domain logic, error handling, and event publishing.
 */

import { executeDeclineSigning } from "../../../src/use-cases/signatures/DeclineSigning";
import { assertRequestToken } from "../../../src/domain/rules/Token.rules";
import { assertCancelDeclineAllowed, assertReasonValid } from "../../../src/domain/rules/CancelDecline.rules";
import { 
  envelopeNotFound, 
  partyNotFound, 
  requestTokenInvalid
} from "../../../src/errors";

// --- Mocks ---
jest.mock("@/domain/rules/Token.rules", () => ({
  assertRequestToken: jest.fn(),
}));

jest.mock("@/domain/rules/CancelDecline.rules", () => ({
  assertCancelDeclineAllowed: jest.fn(),
  assertReasonValid: jest.fn(),
}));

jest.mock("@/errors", () => ({
  envelopeNotFound: jest.fn(),
  partyNotFound: jest.fn(),
  requestTokenInvalid: jest.fn(),
}));

const mockAssertRequestToken = assertRequestToken as jest.MockedFunction<typeof assertRequestToken>;
const mockAssertCancelDeclineAllowed = assertCancelDeclineAllowed as jest.MockedFunction<typeof assertCancelDeclineAllowed>;
const mockAssertReasonValid = assertReasonValid as jest.MockedFunction<typeof assertReasonValid>;
const mockEnvelopeNotFound = envelopeNotFound as jest.MockedFunction<typeof envelopeNotFound>;
const mockPartyNotFound = partyNotFound as jest.MockedFunction<typeof partyNotFound>;
const mockRequestTokenInvalid = requestTokenInvalid as jest.MockedFunction<typeof requestTokenInvalid>;

describe("DeclineSigning use case", () => {
  let mockRepos: any;
  let mockEvents: any;
  let mockIdempotency: any;
  let mockIds: any;
  let mockTime: any;
  let mockEnvelope: any;
  let mockParty: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock behaviors
    mockAssertRequestToken.mockImplementation(() => undefined); // Don't throw by default
    mockAssertCancelDeclineAllowed.mockImplementation(() => undefined); // Don't throw by default
    mockAssertReasonValid.mockImplementation((reason: unknown) => reason as string); // Return the reason by default

    mockEnvelope = {
      envelopeId: "550e8400-e29b-41d4-a716-446655440000",
      status: "sent",
      tenantId: "tenant-123",
      createdAt: "2024-01-01T00:00:00.000Z",
    };

    mockParty = {
      partyId: "550e8400-e29b-41d4-a716-446655440001",
      envelopeId: "550e8400-e29b-41d4-a716-446655440000",
      status: "sent",
      email: "signer@example.com",
      role: "signer",
    };

    mockRepos = {
      envelopes: {
        getById: jest.fn(),
        update: jest.fn(),
      },
      parties: {
        getById: jest.fn(),
        update: jest.fn(),
      },
    };

    mockEvents = {
      publish: jest.fn(),
    };

    mockIdempotency = {
      run: jest.fn(),
    };

    mockIds = {
      ulid: jest.fn().mockReturnValue("test-ulid"),
    };

    mockTime = {
      now: jest.fn().mockReturnValue(1704067200000), // 2024-01-01T00:00:00.000Z
    };
  });

  describe("success cases", () => {
    it("successfully declines signing for a signer", async () => {
      const input = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        signerId: "550e8400-e29b-41d4-a716-446655440001",
        reason: "I do not agree with the terms",
        token: "valid-token",
        actor: {
          ip: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          locale: "en-US",
        },
      };

      const ctx = {
        repos: mockRepos,
        events: mockEvents,
        idempotency: mockIdempotency,
        ids: mockIds,
        time: mockTime,
      };

      mockRepos.envelopes.getById.mockResolvedValue(mockEnvelope);
      mockRepos.parties.getById.mockResolvedValue(mockParty);

      const result = await executeDeclineSigning(input, ctx);

      expect(result).toEqual({
        status: "declined",
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        signerId: "550e8400-e29b-41d4-a716-446655440001",
        reason: "I do not agree with the terms",
        declinedAt: expect.any(String),
      });

      expect(mockAssertRequestToken).toHaveBeenCalledWith("valid-token", "signing", 1704067200000);
      expect(mockAssertCancelDeclineAllowed).toHaveBeenCalledWith("sent");
      expect(mockAssertReasonValid).toHaveBeenCalledWith("I do not agree with the terms");

      expect(mockRepos.parties.update).toHaveBeenCalledWith(
        { envelopeId: "550e8400-e29b-41d4-a716-446655440000", partyId: "550e8400-e29b-41d4-a716-446655440001" },
        { status: "declined" }
      );

      // Should not update envelope since not all parties declined
      expect(mockRepos.envelopes.update).not.toHaveBeenCalled();

      expect(mockEvents.publish).toHaveBeenCalledWith({
        name: "signing.declined",
        meta: {
          id: "test-ulid",
          ts: expect.any(String),
          source: "signature-service",
        },
        data: {
          envelopeId: "550e8400-e29b-41d4-a716-446655440000",
          signerId: "550e8400-e29b-41d4-a716-446655440001",
          reason: "I do not agree with the terms",
          actor: {
            ip: "192.168.1.1",
            userAgent: "Mozilla/5.0",
            locale: "en-US",
          },
        },
      });
    });

    it("updates envelope status to declined when all parties decline", async () => {
      const input = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        signerId: "550e8400-e29b-41d4-a716-446655440001",
        reason: "I do not agree with the terms",
        token: "valid-token",
        actor: {
          ip: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          locale: "en-US",
        },
      };

      const ctx = {
        repos: mockRepos,
        events: mockEvents,
        idempotency: mockIdempotency,
        ids: mockIds,
        time: mockTime,
      };

      // Mock the party as already declined (this is the last party to decline)
      const declinedParty = {
        ...mockParty,
        status: "declined",
      };

      mockRepos.envelopes.getById.mockResolvedValue(mockEnvelope);
      mockRepos.parties.getById.mockResolvedValue(declinedParty);

      const result = await executeDeclineSigning(input, ctx);

      expect(result).toEqual({
        status: "declined",
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        signerId: "550e8400-e29b-41d4-a716-446655440001",
        reason: "I do not agree with the terms",
        declinedAt: expect.any(String),
      });

      // Should update envelope status to declined since all parties are now declined
      expect(mockRepos.envelopes.update).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440000",
        {
          status: "declined",
          updatedAt: expect.any(String),
        }
      );

      // Should publish both signing.declined and envelope.declined events
      expect(mockEvents.publish).toHaveBeenCalledTimes(2);
      expect(mockEvents.publish).toHaveBeenNthCalledWith(1, {
        name: "signing.declined",
        meta: {
          id: "test-ulid",
          ts: expect.any(String),
          source: "signature-service",
        },
        data: {
          envelopeId: "550e8400-e29b-41d4-a716-446655440000",
          signerId: "550e8400-e29b-41d4-a716-446655440001",
          reason: "I do not agree with the terms",
          actor: {
            ip: "192.168.1.1",
            userAgent: "Mozilla/5.0",
            locale: "en-US",
          },
        },
      });
      expect(mockEvents.publish).toHaveBeenNthCalledWith(2, {
        name: "envelope.declined",
        meta: {
          id: "test-ulid",
          ts: expect.any(String),
          source: "signature-service",
        },
        data: {
          envelopeId: "550e8400-e29b-41d4-a716-446655440000",
          reason: "I do not agree with the terms",
          actor: {
            ip: "192.168.1.1",
            userAgent: "Mozilla/5.0",
            locale: "en-US",
          },
        },
      });
    });
  });

  describe("error cases", () => {
    it("throws 401 when token is invalid", async () => {
      const input = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        signerId: "550e8400-e29b-41d4-a716-446655440001",
        reason: "Test reason",
        token: "invalid-token",
        actor: {
          ip: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          locale: "en-US",
        },
      };

      const ctx = {
        repos: mockRepos,
        events: mockEvents,
        idempotency: mockIdempotency,
        ids: mockIds,
        time: mockTime,
      };

      const tokenError = new Error("Token scope mismatch");
      mockAssertRequestToken.mockImplementation(() => {
        throw tokenError;
      });

      const requestTokenError = new Error("Invalid request token");
      mockRequestTokenInvalid.mockImplementation(() => {
        throw requestTokenError;
      });

      await expect(executeDeclineSigning(input, ctx)).rejects.toThrow(requestTokenError);

      expect(mockRequestTokenInvalid).toHaveBeenCalledWith({ 
        token: "invalid-token", 
        error: tokenError 
      });
    });

    it("throws 404 when envelope not found", async () => {
      const input = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        signerId: "550e8400-e29b-41d4-a716-446655440001",
        reason: "Test reason",
        token: "valid-token",
        actor: {
          ip: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          locale: "en-US",
        },
      };

      const ctx = {
        repos: mockRepos,
        events: mockEvents,
        idempotency: mockIdempotency,
        ids: mockIds,
        time: mockTime,
      };

      mockRepos.envelopes.getById.mockResolvedValue(null);

      const envelopeNotFoundError = new Error("Envelope not found");
      mockEnvelopeNotFound.mockImplementation(() => {
        throw envelopeNotFoundError;
      });

      await expect(executeDeclineSigning(input, ctx)).rejects.toThrow(envelopeNotFoundError);

      expect(mockEnvelopeNotFound).toHaveBeenCalledWith({ 
        envelopeId: "550e8400-e29b-41d4-a716-446655440000" 
      });
    });

    it("throws 404 when party not found", async () => {
      const input = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        signerId: "550e8400-e29b-41d4-a716-446655440001",
        reason: "Test reason",
        token: "valid-token",
        actor: {
          ip: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          locale: "en-US",
        },
      };

      const ctx = {
        repos: mockRepos,
        events: mockEvents,
        idempotency: mockIdempotency,
        ids: mockIds,
        time: mockTime,
      };

      mockRepos.envelopes.getById.mockResolvedValue(mockEnvelope);
      mockRepos.parties.getById.mockResolvedValue(null);

      const partyNotFoundError = new Error("Party not found");
      mockPartyNotFound.mockImplementation(() => {
        throw partyNotFoundError;
      });

      await expect(executeDeclineSigning(input, ctx)).rejects.toThrow(partyNotFoundError);

      expect(mockPartyNotFound).toHaveBeenCalledWith({ 
        envelopeId: "550e8400-e29b-41d4-a716-446655440000", 
        partyId: "550e8400-e29b-41d4-a716-446655440001" 
      });
    });

    it("throws 409 when envelope status is not 'sent'", async () => {
      const input = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        signerId: "550e8400-e29b-41d4-a716-446655440001",
        reason: "Test reason",
        token: "valid-token",
        actor: {
          ip: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          locale: "en-US",
        },
      };

      const ctx = {
        repos: mockRepos,
        events: mockEvents,
        idempotency: mockIdempotency,
        ids: mockIds,
        time: mockTime,
      };

      const completedEnvelope = {
        ...mockEnvelope,
        status: "completed",
      };

      mockRepos.envelopes.getById.mockResolvedValue(completedEnvelope);
      mockRepos.parties.getById.mockResolvedValue(mockParty);

      const invalidStateError = new Error("Only sent envelopes can be cancelled or declined");
      mockAssertCancelDeclineAllowed.mockImplementation(() => {
        throw invalidStateError;
      });

      await expect(executeDeclineSigning(input, ctx)).rejects.toThrow(invalidStateError);

      expect(mockAssertCancelDeclineAllowed).toHaveBeenCalledWith("completed");
    });

    it("throws 400 when reason is invalid", async () => {
      const input = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        signerId: "550e8400-e29b-41d4-a716-446655440001",
        reason: "", // Invalid empty reason
        token: "valid-token",
        actor: {
          ip: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          locale: "en-US",
        },
      };

      const ctx = {
        repos: mockRepos,
        events: mockEvents,
        idempotency: mockIdempotency,
        ids: mockIds,
        time: mockTime,
      };

      mockRepos.envelopes.getById.mockResolvedValue(mockEnvelope);
      mockRepos.parties.getById.mockResolvedValue(mockParty);

      const reasonError = new Error("Reason cannot be empty");
      mockAssertReasonValid.mockImplementation(() => {
        throw reasonError;
      });

      await expect(executeDeclineSigning(input, ctx)).rejects.toThrow(reasonError);

      expect(mockAssertReasonValid).toHaveBeenCalledWith("");
    });
  });

  describe("edge cases", () => {
    it("handles missing actor information gracefully", async () => {
      const input = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        signerId: "550e8400-e29b-41d4-a716-446655440001",
        reason: "Test reason",
        token: "valid-token",
        // No actor provided
      };

      const ctx = {
        repos: mockRepos,
        events: mockEvents,
        idempotency: mockIdempotency,
        ids: mockIds,
        time: mockTime,
      };

      mockRepos.envelopes.getById.mockResolvedValue(mockEnvelope);
      mockRepos.parties.getById.mockResolvedValue(mockParty);

      const result = await executeDeclineSigning(input, ctx);

      expect(result).toEqual({
        status: "declined",
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        signerId: "550e8400-e29b-41d4-a716-446655440001",
        reason: "Test reason",
        declinedAt: expect.any(String),
      });

      expect(mockEvents.publish).toHaveBeenCalledWith({
        name: "signing.declined",
        meta: {
          id: "test-ulid",
          ts: expect.any(String),
          source: "signature-service",
        },
        data: {
          envelopeId: "550e8400-e29b-41d4-a716-446655440000",
          signerId: "550e8400-e29b-41d4-a716-446655440001",
          reason: "Test reason",
          actor: undefined,
        },
      });
    });

    it("sanitizes reason text", async () => {
      const input = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        signerId: "550e8400-e29b-41d4-a716-446655440001",
        reason: "   I do not agree with the terms   ", // Extra whitespace
        token: "valid-token",
        actor: {
          ip: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          locale: "en-US",
        },
      };

      const ctx = {
        repos: mockRepos,
        events: mockEvents,
        idempotency: mockIdempotency,
        ids: mockIds,
        time: mockTime,
      };

      mockRepos.envelopes.getById.mockResolvedValue(mockEnvelope);
      mockRepos.parties.getById.mockResolvedValue(mockParty);
      mockAssertReasonValid.mockReturnValue("I do not agree with the terms"); // Sanitized

      const result = await executeDeclineSigning(input, ctx);

      expect(result.reason).toBe("I do not agree with the terms");
      expect(mockAssertReasonValid).toHaveBeenCalledWith("   I do not agree with the terms   ");
    });
  });
});

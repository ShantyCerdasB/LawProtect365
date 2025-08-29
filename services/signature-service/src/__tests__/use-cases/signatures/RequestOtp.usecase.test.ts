/**
 * @file RequestOtp.usecase.test.ts
 * @summary Unit tests for the RequestOtp use case.
 */

import { executeRequestOtp } from "../../../use-cases/signatures/RequestOtp";
import { envelopeNotFound, partyNotFound, requestTokenInvalid } from "../../../errors";
import type { Repository } from "@lawprotect/shared-ts";
import type { Envelope } from "@/domain/entities/Envelope";
import type { Party } from "@/domain/entities/Party";
import type { IdempotencyRunner } from "@/adapters/idempotency/IdempotencyRunner";
import type { EventBridgePublisher } from "@/adapters/eventbridge/EventBridgePublisher";
import type { RateLimitStore } from "@/adapters/ratelimit/RateLimitStore";

// Mock the domain rules
jest.mock("../../../domain/rules/Token.rules", () => ({
  assertRequestToken: jest.fn(),
}));

const { assertRequestToken } = jest.requireMock("../../../domain/rules/Token.rules");

describe("executeRequestOtp", () => {
  let mockEnvelopeRepo: jest.Mocked<Repository<Envelope, string>>;
  let mockPartyRepo: jest.Mocked<Repository<Party, { envelopeId: string; partyId: string }>>;
  let mockIdempotencyRunner: jest.Mocked<IdempotencyRunner>;
  let mockEventPublisher: jest.Mocked<EventBridgePublisher>;
  let mockRateLimitStore: jest.Mocked<RateLimitStore>;
  let mockContext: any;

  const mockEnvelope: Envelope = {
    envelopeId: "test-envelope-id",
    tenantId: "test-tenant-id",
    ownerId: "test-owner-id",
    title: "Test Envelope",
    status: "draft",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    parties: [],
    documents: [],
  };

  const mockParty: Party = {
    partyId: "test-party-id",
    envelopeId: "test-envelope-id",
    name: "Test Party",
    email: "test@example.com",
    role: "signer",
    status: "pending",
    invitedAt: "2024-01-01T00:00:00.000Z",
    sequence: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockEnvelopeRepo = {
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockPartyRepo = {
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockIdempotencyRunner = {
      run: jest.fn(),
    };

    mockEventPublisher = {
      publish: jest.fn(),
    };

    mockRateLimitStore = {
      incrementAndCheck: jest.fn(),
    };

    mockContext = {
      repos: {
        envelopes: mockEnvelopeRepo,
        parties: mockPartyRepo,
      },
      idempotency: mockIdempotencyRunner,
      events: mockEventPublisher,
      rateLimit: mockRateLimitStore,
      ids: {
        ulid: jest.fn(() => "test-ulid"),
      },
      time: {
        now: jest.fn(() => Date.now()),
      },
    };
  });

  describe("Happy path", () => {
    it("should successfully request OTP for email delivery", async () => {
      const input = {
        envelopeId: "test-envelope-id",
        signerId: "test-party-id",
        delivery: "email" as const,
        token: "valid-token",
        actor: {
          ip: "192.168.1.1",
          userAgent: "test-agent",
          locale: "en-US",
        },
      };

      // Mock successful responses
      mockEnvelopeRepo.getById.mockResolvedValue(mockEnvelope);
      mockPartyRepo.getById.mockResolvedValue(mockParty);
      mockPartyRepo.update.mockResolvedValue(mockParty);
      mockRateLimitStore.incrementAndCheck.mockResolvedValue({
        currentUsage: 1,
        maxRequests: 5,
        windowStart: Date.now() / 1000,
        windowEnd: (Date.now() / 1000) + 60,
        resetInSeconds: 60,
      });
      mockEventPublisher.publish.mockResolvedValue({ eventId: "test-event-id" });

      const result = await executeRequestOtp(input, mockContext);

      expect(result).toEqual({
        channel: "email",
        expiresAt: expect.any(String),
        cooldownSeconds: 60,
      });

      expect(assertRequestToken).toHaveBeenCalledWith("valid-token", "signing", expect.any(Number));
      expect(mockEnvelopeRepo.getById).toHaveBeenCalledWith("test-envelope-id");
      expect(mockPartyRepo.getById).toHaveBeenCalledWith({
        envelopeId: "test-envelope-id",
        partyId: "test-party-id",
      });
      expect(mockRateLimitStore.incrementAndCheck).toHaveBeenCalledTimes(2); // minute and day
      expect(mockPartyRepo.update).toHaveBeenCalledWith(
        { envelopeId: "test-envelope-id", partyId: "test-party-id" },
        expect.objectContaining({
          otpState: expect.objectContaining({
            channel: "email",
            tries: 0,
            maxTries: 3,
          }),
        })
      );
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "otp.requested",
          data: expect.objectContaining({
            envelopeId: "test-envelope-id",
            partyId: "test-party-id",
            channel: "email",
            locale: "en-US",
          }),
        })
      );
    });

    it("should successfully request OTP for SMS delivery", async () => {
      const input = {
        envelopeId: "test-envelope-id",
        signerId: "test-party-id",
        delivery: "sms" as const,
        token: "valid-token",
        actor: {
          ip: "192.168.1.1",
          userAgent: "test-agent",
          locale: "en-US",
        },
      };

      mockEnvelopeRepo.getById.mockResolvedValue(mockEnvelope);
      mockPartyRepo.getById.mockResolvedValue(mockParty);
      mockPartyRepo.update.mockResolvedValue(mockParty);
      mockRateLimitStore.incrementAndCheck.mockResolvedValue({
        currentUsage: 1,
        maxRequests: 5,
        windowStart: Date.now() / 1000,
        windowEnd: (Date.now() / 1000) + 60,
        resetInSeconds: 60,
      });
      mockEventPublisher.publish.mockResolvedValue({ eventId: "test-event-id" });

      const result = await executeRequestOtp(input, mockContext);

      expect(result.channel).toBe("sms");
      expect(mockPartyRepo.update).toHaveBeenCalledWith(
        { envelopeId: "test-envelope-id", partyId: "test-party-id" },
        expect.objectContaining({
          otpState: expect.objectContaining({
            channel: "sms",
          }),
        })
      );
    });
  });

  describe("Error cases", () => {
    it("should throw requestTokenInvalid when token validation fails", async () => {
      const input = {
        envelopeId: "test-envelope-id",
        signerId: "test-party-id",
        delivery: "email" as const,
        token: "invalid-token",
        actor: {},
      };

      (assertRequestToken as jest.Mock).mockImplementation(() => {
        throw new Error("Token validation failed");
      });

      await expect(executeRequestOtp(input, mockContext)).rejects.toThrow();
      expect(assertRequestToken).toHaveBeenCalledWith("invalid-token", "signing", expect.any(Number));
    });

    it("should throw envelopeNotFound when envelope does not exist", async () => {
      const input = {
        envelopeId: "non-existent-envelope",
        signerId: "test-party-id",
        delivery: "email" as const,
        token: "valid-token",
        actor: {},
      };

      mockEnvelopeRepo.getById.mockResolvedValue(null);

      await expect(executeRequestOtp(input, mockContext)).rejects.toThrow();
      expect(mockEnvelopeRepo.getById).toHaveBeenCalledWith("non-existent-envelope");
    });

    it("should throw partyNotFound when party does not exist", async () => {
      const input = {
        envelopeId: "test-envelope-id",
        signerId: "non-existent-party",
        delivery: "email" as const,
        token: "valid-token",
        actor: {},
      };

      mockEnvelopeRepo.getById.mockResolvedValue(mockEnvelope);
      mockPartyRepo.getById.mockResolvedValue(null);

      await expect(executeRequestOtp(input, mockContext)).rejects.toThrow();
      expect(mockPartyRepo.getById).toHaveBeenCalledWith({
        envelopeId: "test-envelope-id",
        partyId: "non-existent-party",
      });
    });

    it("should throw rate limit error when minute limit is exceeded", async () => {
      const input = {
        envelopeId: "test-envelope-id",
        signerId: "test-party-id",
        delivery: "email" as const,
        token: "valid-token",
        actor: {},
      };

      mockEnvelopeRepo.getById.mockResolvedValue(mockEnvelope);
      mockPartyRepo.getById.mockResolvedValue(mockParty);

      const rateLimitError = new Error("Rate limit exceeded");
      (rateLimitError as any).statusCode = 429;
      mockRateLimitStore.incrementAndCheck.mockRejectedValue(rateLimitError);

      await expect(executeRequestOtp(input, mockContext)).rejects.toThrow("Rate limit exceeded");
      expect(mockRateLimitStore.incrementAndCheck).toHaveBeenCalled();
    });

    it("should throw rate limit error when daily limit is exceeded", async () => {
      const input = {
        envelopeId: "test-envelope-id",
        signerId: "test-party-id",
        delivery: "email" as const,
        token: "valid-token",
        actor: {},
      };

      mockEnvelopeRepo.getById.mockResolvedValue(mockEnvelope);
      mockPartyRepo.getById.mockResolvedValue(mockParty);

      // First call succeeds (minute limit), second call fails (daily limit)
      mockRateLimitStore.incrementAndCheck
        .mockResolvedValueOnce({
          currentUsage: 1,
          maxRequests: 5,
          windowStart: Date.now() / 1000,
          windowEnd: (Date.now() / 1000) + 60,
          resetInSeconds: 60,
        })
        .mockRejectedValueOnce(new Error("Daily rate limit exceeded"));

      await expect(executeRequestOtp(input, mockContext)).rejects.toThrow("Daily rate limit exceeded");
      expect(mockRateLimitStore.incrementAndCheck).toHaveBeenCalledTimes(2);
    });
  });

  describe("OTP generation and persistence", () => {
    it("should generate and persist OTP state with correct properties", async () => {
      const input = {
        envelopeId: "test-envelope-id",
        signerId: "test-party-id",
        delivery: "email" as const,
        token: "valid-token",
        actor: {},
      };

      mockEnvelopeRepo.getById.mockResolvedValue(mockEnvelope);
      mockPartyRepo.getById.mockResolvedValue(mockParty);
      mockPartyRepo.update.mockResolvedValue(mockParty);
      mockRateLimitStore.incrementAndCheck.mockResolvedValue({
        currentUsage: 1,
        maxRequests: 5,
        windowStart: Date.now() / 1000,
        windowEnd: (Date.now() / 1000) + 60,
        resetInSeconds: 60,
      });
      mockEventPublisher.publish.mockResolvedValue({ eventId: "test-event-id" });

      await executeRequestOtp(input, mockContext);

      expect(mockPartyRepo.update).toHaveBeenCalledWith(
        { envelopeId: "test-envelope-id", partyId: "test-party-id" },
        expect.objectContaining({
          otpState: expect.objectContaining({
            codeHash: expect.any(String),
            channel: "email",
            expiresAt: expect.any(String),
            tries: 0,
            maxTries: 3,
            createdAt: expect.any(String),
          }),
        })
      );
    });

    it("should publish correct event with metadata", async () => {
      const input = {
        envelopeId: "test-envelope-id",
        signerId: "test-party-id",
        delivery: "email" as const,
        token: "valid-token",
        actor: {
          ip: "192.168.1.1",
          userAgent: "test-agent",
          locale: "es-CR",
        },
      };

      mockEnvelopeRepo.getById.mockResolvedValue(mockEnvelope);
      mockPartyRepo.getById.mockResolvedValue(mockParty);
      mockPartyRepo.update.mockResolvedValue(mockParty);
      mockRateLimitStore.incrementAndCheck.mockResolvedValue({
        currentUsage: 1,
        maxRequests: 5,
        windowStart: Date.now() / 1000,
        windowEnd: (Date.now() / 1000) + 60,
        resetInSeconds: 60,
      });
      mockEventPublisher.publish.mockResolvedValue({ eventId: "test-event-id" });

      await executeRequestOtp(input, mockContext);

      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "otp.requested",
          meta: expect.objectContaining({
            id: "test-ulid",
            source: "signature-service",
          }),
          data: expect.objectContaining({
            envelopeId: "test-envelope-id",
            partyId: "test-party-id",
            channel: "email",
            locale: "es-CR",
            metadata: expect.objectContaining({
              ip: "192.168.1.1",
              userAgent: "test-agent",
              requestId: "test-ulid",
              expiresAt: expect.any(String),
              cooldownSeconds: 60,
            }),
          }),
        })
      );
    });
  });
});

/**
 * @file RequestOtp.usecase.test.ts
 * @summary Unit tests for the RequestOtp use case.
 */

import { executeRequestOtp } from "../../../src/use-cases/signatures/RequestOtp";
import { assertRequestToken } from "../../../src/domain/rules/Token.rules";

type Repository<T, Id> = {
  getById: jest.Mock<Promise<T | null>, [Id]>;
  exists: jest.Mock<Promise<boolean>, [Id]>;
  create: jest.Mock<Promise<T>, [Partial<T>]>;
  update: jest.Mock<Promise<T>, [any, Partial<T>]>;
  delete: jest.Mock<Promise<void>, [Id]>;
};

type IdempotencyRunner = { run: jest.Mock<any, any> };
type EventBridgePublisher = { publish: jest.Mock<any, any> };
type RateLimitStore = {
  incrementAndCheck: jest.Mock<
    Promise<any>,
    [key: string, window: { windowSeconds: number; maxRequests: number; ttlSeconds: number }]
  >;
};


jest.mock("../../../src/domain/rules/Token.rules", () => ({
  assertRequestToken: jest.fn(),
}));
const mockAssertRequestToken = assertRequestToken as jest.MockedFunction<typeof assertRequestToken>;

describe("executeRequestOtp", () => {
  let mockEnvelopeRepo: jest.Mocked<Repository<any, string>>;
  let mockPartyRepo: jest.Mocked<Repository<any, { envelopeId: string; partyId: string }>>;
  let mockIdempotencyRunner: jest.Mocked<IdempotencyRunner>;
  let mockEventPublisher: jest.Mocked<EventBridgePublisher>;
  let mockRateLimitStore: jest.Mocked<RateLimitStore>;
  let mockContext: any;

  const mockEnvelope = {
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

  const mockParty = {
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

    // Por defecto: token válido (la validación NO lanza)
    mockAssertRequestToken.mockReset();
    mockAssertRequestToken.mockImplementation(() => undefined);

    mockEnvelopeRepo = {
      getById: jest.fn(),
      exists: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockPartyRepo = {
      getById: jest.fn(),
      exists: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockIdempotencyRunner = { run: jest.fn() } as any;
    mockEventPublisher = { publish: jest.fn() } as any;

    mockRateLimitStore = {
      incrementAndCheck: jest.fn(),
    } as any;

    mockContext = {
      repos: {
        envelopes: mockEnvelopeRepo,
        parties: mockPartyRepo,
      },
      idempotency: mockIdempotencyRunner,
      events: mockEventPublisher,
      rateLimit: mockRateLimitStore,
      ids: { ulid: jest.fn(() => "test-ulid") },
      time: { now: jest.fn(() => Date.now()) },
    };
  });

  describe("Happy path", () => {
    it("should successfully request OTP for email delivery", async () => {
      const input = {
        envelopeId: "test-envelope-id",
        signerId: "test-party-id",
        delivery: "email" as const,
        token: "valid-token",
        actor: { ip: "192.168.1.1", userAgent: "test-agent", locale: "en-US" },
      };

      mockEnvelopeRepo.getById.mockResolvedValue(mockEnvelope);
      mockPartyRepo.getById.mockResolvedValue(mockParty);
      mockPartyRepo.update.mockResolvedValue(mockParty);


      mockRateLimitStore.incrementAndCheck.mockResolvedValue({
        currentUsage: 1,
        maxRequests: 5,
        windowStart: Math.floor(Date.now() / 1000),
        windowEnd: Math.floor(Date.now() / 1000) + 60,
        resetInSeconds: 60,
      });

      mockEventPublisher.publish.mockResolvedValue({ eventId: "test-event-id" });

      const result = await executeRequestOtp(input, mockContext);

      expect(result).toEqual({
        channel: "email",
        expiresAt: expect.any(String),
        cooldownSeconds: 60,
      });

      expect(mockEnvelopeRepo.getById).toHaveBeenCalledWith("test-envelope-id");
      expect(mockPartyRepo.getById).toHaveBeenCalledWith({
        envelopeId: "test-envelope-id",
        partyId: "test-party-id",
      });
      expect(mockRateLimitStore.incrementAndCheck).toHaveBeenCalledTimes(2);
      expect(mockPartyRepo.update).toHaveBeenCalledWith(
        { envelopeId: "test-envelope-id", partyId: "test-party-id" },
        expect.objectContaining({
          otpState: expect.objectContaining({
            channel: "email",
            tries: 0,
            maxTries: 3,
            expiresAt: expect.any(String),
            createdAt: expect.any(String),
            codeHash: expect.any(String),
          }),
        })
      );
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
            locale: "en-US",
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

    it("should successfully request OTP for SMS delivery", async () => {
      const input = {
        envelopeId: "test-envelope-id",
        signerId: "test-party-id",
        delivery: "sms" as const,
        token: "valid-token",
        actor: { ip: "192.168.1.1", userAgent: "test-agent", locale: "en-US" },
      };

      mockEnvelopeRepo.getById.mockResolvedValue(mockEnvelope);
      mockPartyRepo.getById.mockResolvedValue(mockParty);
      mockPartyRepo.update.mockResolvedValue(mockParty);
      mockRateLimitStore.incrementAndCheck.mockResolvedValue({
        currentUsage: 1,
        maxRequests: 5,
        windowStart: Math.floor(Date.now() / 1000),
        windowEnd: Math.floor(Date.now() / 1000) + 60,
        resetInSeconds: 60,
      });
      mockEventPublisher.publish.mockResolvedValue({ eventId: "test-event-id" });

      const result = await executeRequestOtp(input, mockContext);

      expect(result.channel).toBe("sms");
      expect(mockPartyRepo.update).toHaveBeenCalledWith(
        { envelopeId: "test-envelope-id", partyId: "test-party-id" },
        expect.objectContaining({
          otpState: expect.objectContaining({ channel: "sms" }),
        })
      );
    });
  });

  describe("Error cases", () => {
    it("should throw requestTokenInvalid when token validation fails", async () => {
      mockAssertRequestToken.mockImplementation(() => {
        throw new Error("bad token");
      });

      const input = {
        envelopeId: "test-envelope-id",
        signerId: "test-party-id",
        delivery: "email" as const,
        token: "invalid-token",
        actor: {},
      };

      await expect(executeRequestOtp(input, mockContext)).rejects.toThrow("Invalid request token");
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

      // Primera llamada (minuto) OK, segunda (día) falla
      mockRateLimitStore.incrementAndCheck
        .mockResolvedValueOnce({
          currentUsage: 1,
          maxRequests: 5,
          windowStart: Math.floor(Date.now() / 1000),
          windowEnd: Math.floor(Date.now() / 1000) + 60,
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
        windowStart: Math.floor(Date.now() / 1000),
        windowEnd: Math.floor(Date.now() / 1000) + 60,
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
        actor: { ip: "192.168.1.1", userAgent: "test-agent", locale: "es-CR" },
      };

      mockEnvelopeRepo.getById.mockResolvedValue(mockEnvelope);
      mockPartyRepo.getById.mockResolvedValue(mockParty);
      mockPartyRepo.update.mockResolvedValue(mockParty);
      mockRateLimitStore.incrementAndCheck.mockResolvedValue({
        currentUsage: 1,
        maxRequests: 5,
        windowStart: Math.floor(Date.now() / 1000),
        windowEnd: Math.floor(Date.now() / 1000) + 60,
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

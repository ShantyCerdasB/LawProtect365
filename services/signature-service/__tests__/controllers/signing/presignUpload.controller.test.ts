/**
 * @file presignUpload.controller.test.ts
 * @summary Unit tests for the presignUpload controller.
 *
 * @description
 * Tests the presignUpload controller with mocked dependencies.
 * Focuses on HTTP layer, request validation, and use case invocation.
 */

import { handler } from "../../../src/controllers/signing/presignUpload";
import { executePresignUpload } from "../../../src/use-cases/signatures/PresignUpload";
import { requestTokenInvalid } from "../../../src/errors";

// --- Mocks ---
jest.mock("@/use-cases/signatures/PresignUpload", () => ({
  executePresignUpload: jest.fn(),
}));

jest.mock("@/errors", () => ({
  requestTokenInvalid: jest.fn(),
}));

jest.mock("@/infra/Container", () => ({
  getContainer: jest.fn(),
}));

jest.mock("@/middleware/http", () => ({
  wrapPublicController: jest.fn((fn) => fn),
  corsFromEnv: jest.fn(() => (fn: any) => fn),
}));

jest.mock("@lawprotect/shared-ts", () => ({
  validateJsonBody: jest.fn(),
}));

const mockExecutePresignUpload = executePresignUpload as jest.MockedFunction<typeof executePresignUpload>;
const mockRequestTokenInvalid = requestTokenInvalid as jest.MockedFunction<typeof requestTokenInvalid>;

describe("presignUpload controller", () => {
  let mockContainer: any;
  let mockValidateJsonBody: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockContainer = {
      repos: {
        envelopes: {
          getById: jest.fn(),
        },
      },
      storage: {
        presigner: {
          putObjectUrl: jest.fn(),
        },
      },
      idempotency: {
        runner: {
          run: jest.fn(),
        },
      },
    };

    mockValidateJsonBody = require("@lawprotect/shared-ts").validateJsonBody;

    const { getContainer } = require("@/infra/Container");
    getContainer.mockReturnValue(mockContainer);
  });

  describe("success cases", () => {
    it("successfully processes valid request", async () => {
      const mockEvent = {
        headers: {
          "x-request-token": "valid-token",
          "x-forwarded-for": "192.168.1.1",
          "user-agent": "Mozilla/5.0",
          "accept-language": "en-US,en;q=0.9",
        },
        body: JSON.stringify({
          envelopeId: "550e8400-e29b-41d4-a716-446655440000",
          filename: "document.pdf",
          contentType: "application/pdf",
        }),
      };

      const mockBody = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        filename: "document.pdf",
        contentType: "application/pdf",
      };

      const mockUseCaseResult = {
        uploadUrl: "https://test-bucket.s3.amazonaws.com/presigned-url",
        objectKey: "uploads/550e8400-e29b-41d4-a716-446655440000/2024-01-01T00:00:00.000Z-test-ulid-document.pdf",
        expiresAt: "2024-01-01T00:15:00.000Z",
      };

      mockValidateJsonBody.mockReturnValue(mockBody);
      mockExecutePresignUpload.mockResolvedValue(mockUseCaseResult);

      const result = await handler(mockEvent as any);

      expect(result).toEqual({
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mockUseCaseResult),
      });

      expect(mockExecutePresignUpload).toHaveBeenCalledWith(
        {
          envelopeId: "550e8400-e29b-41d4-a716-446655440000",
          filename: "document.pdf",
          contentType: "application/pdf",
          token: "valid-token",
          actor: {
            ip: "192.168.1.1",
            userAgent: "Mozilla/5.0",
            locale: "en-US",
          },
        },
        expect.objectContaining({
          repos: {
            envelopes: mockContainer.repos.envelopes,
          },
          s3: mockContainer.storage.presigner,
          idempotency: mockContainer.idempotency.runner,
          ids: expect.any(Object),
          time: expect.any(Object),
          config: {
            uploadBucket: "lawprotect-uploads",
            uploadTtlSeconds: 900,
          },
        })
      );
    });

    it("handles missing actor headers gracefully", async () => {
      const mockEvent = {
        headers: {
          "x-request-token": "valid-token",
          // No actor headers
        },
        body: JSON.stringify({
          envelopeId: "550e8400-e29b-41d4-a716-446655440000",
          filename: "document.pdf",
          contentType: "application/pdf",
        }),
      };

      const mockBody = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        filename: "document.pdf",
        contentType: "application/pdf",
      };

      const mockUseCaseResult = {
        uploadUrl: "https://test-bucket.s3.amazonaws.com/presigned-url",
        objectKey: "uploads/550e8400-e29b-41d4-a716-446655440000/2024-01-01T00:00:00.000Z-test-ulid-document.pdf",
        expiresAt: "2024-01-01T00:15:00.000Z",
      };

      mockValidateJsonBody.mockReturnValue(mockBody);
      mockExecutePresignUpload.mockResolvedValue(mockUseCaseResult);

      const result = await handler(mockEvent as any);

      expect(result).toEqual({
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mockUseCaseResult),
      });

      expect(mockExecutePresignUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          actor: {
            ip: undefined,
            userAgent: undefined,
            locale: "en-US",
          },
        }),
        expect.any(Object)
      );
    });
  });

  describe("error cases", () => {
    it("throws 401 when request token is missing", async () => {
      const mockEvent = {
        headers: {
          // No x-request-token header
        },
        body: JSON.stringify({
          envelopeId: "550e8400-e29b-41d4-a716-446655440000",
          filename: "document.pdf",
          contentType: "application/pdf",
        }),
      };

      const mockBody = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        filename: "document.pdf",
        contentType: "application/pdf",
      };

      const tokenError = new Error("Invalid request token");
      mockRequestTokenInvalid.mockImplementation(() => {
        throw tokenError;
      });

      mockValidateJsonBody.mockReturnValue(mockBody);

      await expect(handler(mockEvent as any)).rejects.toThrow(tokenError);

      expect(mockRequestTokenInvalid).toHaveBeenCalledWith({ 
        header: "x-request-token" 
      });
    });

    it("throws 401 when request token is empty", async () => {
      const mockEvent = {
        headers: {
          "x-request-token": "",
        },
        body: JSON.stringify({
          envelopeId: "550e8400-e29b-41d4-a716-446655440000",
          filename: "document.pdf",
          contentType: "application/pdf",
        }),
      };

      const mockBody = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        filename: "document.pdf",
        contentType: "application/pdf",
      };

      const tokenError = new Error("Invalid request token");
      mockRequestTokenInvalid.mockImplementation(() => {
        throw tokenError;
      });

      mockValidateJsonBody.mockReturnValue(mockBody);

      await expect(handler(mockEvent as any)).rejects.toThrow(tokenError);

      expect(mockRequestTokenInvalid).toHaveBeenCalledWith({ 
        header: "x-request-token" 
      });
    });

    it("propagates use case errors", async () => {
      const mockEvent = {
        headers: {
          "x-request-token": "valid-token",
        },
        body: JSON.stringify({
          envelopeId: "550e8400-e29b-41d4-a716-446655440000",
          filename: "document.pdf",
          contentType: "application/pdf",
        }),
      };

      const mockBody = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        filename: "document.pdf",
        contentType: "application/pdf",
      };

      const useCaseError = new Error("Envelope not found");
      mockExecutePresignUpload.mockRejectedValue(useCaseError);

      mockValidateJsonBody.mockReturnValue(mockBody);

      await expect(handler(mockEvent as any)).rejects.toThrow(useCaseError);
    });
  });

  describe("actor extraction", () => {
    it("extracts IP from x-forwarded-for header", async () => {
      const mockEvent = {
        headers: {
          "x-request-token": "valid-token",
          "x-forwarded-for": "192.168.1.1, 10.0.0.1",
        },
        body: JSON.stringify({
          envelopeId: "550e8400-e29b-41d4-a716-446655440000",
          filename: "document.pdf",
          contentType: "application/pdf",
        }),
      };

      const mockBody = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        filename: "document.pdf",
        contentType: "application/pdf",
      };

      const mockUseCaseResult = {
        uploadUrl: "https://test-bucket.s3.amazonaws.com/presigned-url",
        objectKey: "uploads/550e8400-e29b-41d4-a716-446655440000/2024-01-01T00:00:00.000Z-test-ulid-document.pdf",
        expiresAt: "2024-01-01T00:15:00.000Z",
      };

      mockValidateJsonBody.mockReturnValue(mockBody);
      mockExecutePresignUpload.mockResolvedValue(mockUseCaseResult);

      await handler(mockEvent as any);

      expect(mockExecutePresignUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          actor: expect.objectContaining({
            ip: "192.168.1.1",
          }),
        }),
        expect.any(Object)
      );
    });

    it("extracts IP from x-real-ip header when x-forwarded-for is not available", async () => {
      const mockEvent = {
        headers: {
          "x-request-token": "valid-token",
          "x-real-ip": "203.0.113.1",
        },
        body: JSON.stringify({
          envelopeId: "550e8400-e29b-41d4-a716-446655440000",
          filename: "document.pdf",
          contentType: "application/pdf",
        }),
      };

      const mockBody = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        filename: "document.pdf",
        contentType: "application/pdf",
      };

      const mockUseCaseResult = {
        uploadUrl: "https://test-bucket.s3.amazonaws.com/presigned-url",
        objectKey: "uploads/550e8400-e29b-41d4-a716-446655440000/2024-01-01T00:00:00.000Z-test-ulid-document.pdf",
        expiresAt: "2024-01-01T00:15:00.000Z",
      };

      mockValidateJsonBody.mockReturnValue(mockBody);
      mockExecutePresignUpload.mockResolvedValue(mockUseCaseResult);

      await handler(mockEvent as any);

      expect(mockExecutePresignUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          actor: expect.objectContaining({
            ip: "203.0.113.1",
          }),
        }),
        expect.any(Object)
      );
    });

    it("extracts locale from accept-language header", async () => {
      const mockEvent = {
        headers: {
          "x-request-token": "valid-token",
          "accept-language": "es-ES,es;q=0.9,en;q=0.8",
        },
        body: JSON.stringify({
          envelopeId: "550e8400-e29b-41d4-a716-446655440000",
          filename: "document.pdf",
          contentType: "application/pdf",
        }),
      };

      const mockBody = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        filename: "document.pdf",
        contentType: "application/pdf",
      };

      const mockUseCaseResult = {
        uploadUrl: "https://test-bucket.s3.amazonaws.com/presigned-url",
        objectKey: "uploads/550e8400-e29b-41d4-a716-446655440000/2024-01-01T00:00:00.000Z-test-ulid-document.pdf",
        expiresAt: "2024-01-01T00:15:00.000Z",
      };

      mockValidateJsonBody.mockReturnValue(mockBody);
      mockExecutePresignUpload.mockResolvedValue(mockUseCaseResult);

      await handler(mockEvent as any);

      expect(mockExecutePresignUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          actor: expect.objectContaining({
            locale: "es-ES",
          }),
        }),
        expect.any(Object)
      );
    });

    it("uses default locale when accept-language is not available", async () => {
      const mockEvent = {
        headers: {
          "x-request-token": "valid-token",
          // No accept-language header
        },
        body: JSON.stringify({
          envelopeId: "550e8400-e29b-41d4-a716-446655440000",
          filename: "document.pdf",
          contentType: "application/pdf",
        }),
      };

      const mockBody = {
        envelopeId: "550e8400-e29b-41d4-a716-446655440000",
        filename: "document.pdf",
        contentType: "application/pdf",
      };

      const mockUseCaseResult = {
        uploadUrl: "https://test-bucket.s3.amazonaws.com/presigned-url",
        objectKey: "uploads/550e8400-e29b-41d4-a716-446655440000/2024-01-01T00:00:00.000Z-test-ulid-document.pdf",
        expiresAt: "2024-01-01T00:15:00.000Z",
      };

      mockValidateJsonBody.mockReturnValue(mockBody);
      mockExecutePresignUpload.mockResolvedValue(mockUseCaseResult);

      await handler(mockEvent as any);

      expect(mockExecutePresignUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          actor: expect.objectContaining({
            locale: "en-US",
          }),
        }),
        expect.any(Object)
      );
    });
  });
});

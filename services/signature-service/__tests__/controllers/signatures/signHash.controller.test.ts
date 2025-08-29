/**
 * @file signHash.controller.test.ts
 * @summary Unit tests for the signHash controller.
 *
 * @description
 * Tests the signHash controller with mocked dependencies.
 * Focuses on parsing, use-case execution, container wiring, and response shaping.
 */

import { parseSignHashRequest } from "../../../src/schemas/signing/SignHash.schema";
import { executeSignHash } from "../../../src/use-cases/signatures/SignHash";
import { getContainer } from "../../../src/infra/Container";
import { ok } from "@lawprotect/shared-ts";

// --- Mocks ---
// Mock the HTTP wrapper to bypass real middleware and inject a minimal ctx.
jest.mock("@/middleware/http", () => {
  const wrapController = jest.fn((fn: any) => {
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
  return { wrapController, corsFromEnv };
});

// Mock domain schema, use-case y container
jest.mock("@/schemas/signing/SignHash.schema", () => ({
  parseSignHashRequest: jest.fn(),
}));
jest.mock("@/use-cases/signatures/SignHash", () => ({
  executeSignHash: jest.fn(),
}));
jest.mock("@/infra/Container", () => ({
  getContainer: jest.fn(),
}));

// Solo necesitamos `ok` de shared-ts
jest.mock("@lawprotect/shared-ts", () => ({
  ok: jest.fn(),
}));

// Importa el handler DESPUÉS de configurar mocks
import { handler } from "../../../src/controllers/signatures/signHash";

const mockParseSignHashRequest =
  parseSignHashRequest as jest.MockedFunction<typeof parseSignHashRequest>;
const mockExecuteSignHash =
  executeSignHash as jest.MockedFunction<typeof executeSignHash>;
const mockGetContainer = getContainer as jest.MockedFunction<typeof getContainer>;
const mockOk = ok as jest.MockedFunction<typeof ok>;

describe("signHash controller", () => {
  let mockContainer: any;
  let mockSigner: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSigner = { sign: jest.fn() };

    // IMPORTANTE: el controller usa config.kms.signerKeyId y config.kms.signingAlgorithm
    mockContainer = {
      crypto: { signer: mockSigner },
      config: {
        kms: {
          signerKeyId: "arn:aws:kms:us-east-1:123456789012:key/default-key",
          signingAlgorithm: "RSASSA_PSS_SHA_256",
        },
      },
    };

    mockGetContainer.mockReturnValue(mockContainer);
  });

  describe("success cases", () => {
    it("successfully signs a hash digest (default key, allowedAlgorithms from config)", async () => {
      const event: any = {
        body: JSON.stringify({
          digest: { alg: "sha256", value: "dGVzdC1kaWdlc3QtdmFsdWU" },
          algorithm: "RSASSA_PSS_SHA_256",
        }),
        headers: { authorization: "Bearer valid-token" },
      };

      const parsedRequest = {
        digest: { alg: "sha256", value: "dGVzdC1kaWdlc3QtdmFsdWU" },
        algorithm: "RSASSA_PSS_SHA_256",
        // keyId opcional
      };

      const useCaseResult = {
        keyId: "arn:aws:kms:us-east-1:123456789012:key/default-key",
        algorithm: "RSASSA_PSS_SHA_256",
        signature: "dGVzdC1zaWduYXR1cmU",
      };

      const expectedResponse = {
        statusCode: 200,
        body: JSON.stringify(useCaseResult),
        headers: { "Content-Type": "application/json" },
      };

      mockParseSignHashRequest.mockReturnValue(parsedRequest as any);
      mockExecuteSignHash.mockResolvedValue(useCaseResult as any);
      mockOk.mockReturnValue(expectedResponse as any);

      const result = await handler(event);

      expect(result).toEqual(expectedResponse);
      expect(mockParseSignHashRequest).toHaveBeenCalledWith(event);
      expect(mockExecuteSignHash).toHaveBeenCalledWith(parsedRequest, {
        kms: mockSigner,
        defaultKeyId:
          "arn:aws:kms:us-east-1:123456789012:key/default-key",
        allowedAlgorithms: ["RSASSA_PSS_SHA_256"],
      });
      expect(mockOk).toHaveBeenCalledWith(useCaseResult);
    });

    it("successfully signs with custom key ID", async () => {
      const event: any = {
        body: JSON.stringify({
          digest: { alg: "sha384", value: "Y3VzdG9tLWRpZ2VzdC12YWx1ZQ" },
          algorithm: "RSASSA_PSS_SHA_384",
          keyId: "arn:aws:kms:us-east-1:123456789012:key/custom-key",
        }),
        headers: { authorization: "Bearer valid-token" },
      };

      const parsedRequest = {
        digest: { alg: "sha384", value: "Y3VzdG9tLWRpZ2VzdC12YWx1ZQ" },
        algorithm: "RSASSA_PSS_SHA_384",
        keyId: "arn:aws:kms:us-east-1:123456789012:key/custom-key",
      };

      const useCaseResult = {
        keyId: "arn:aws:kms:us-east-1:123456789012:key/custom-key",
        algorithm: "RSASSA_PSS_SHA_384",
        signature: "Y3VzdG9tLXNpZ25hdHVyZQ",
      };

      const expectedResponse = {
        statusCode: 200,
        body: JSON.stringify(useCaseResult),
        headers: { "Content-Type": "application/json" },
      };

      mockParseSignHashRequest.mockReturnValue(parsedRequest as any);
      mockExecuteSignHash.mockResolvedValue(useCaseResult as any);
      mockOk.mockReturnValue(expectedResponse as any);

      const result = await handler(event);

      expect(result).toEqual(expectedResponse);
      expect(mockExecuteSignHash).toHaveBeenCalledWith(parsedRequest, {
        kms: mockSigner,
        defaultKeyId:
          "arn:aws:kms:us-east-1:123456789012:key/default-key",
        allowedAlgorithms: ["RSASSA_PSS_SHA_256"],
      });
    });
  });

  describe("validation errors", () => {
    it("throws when request body is invalid", async () => {
      const event: any = {
        body: JSON.stringify({
          digest: { alg: "invalid", value: "xxx" },
          algorithm: "INVALID_ALGO",
        }),
        headers: { authorization: "Bearer valid-token" },
      };

      const validationError = new Error("Validation failed: Invalid algorithm");
      mockParseSignHashRequest.mockImplementation(() => {
        throw validationError;
      });

      await expect(handler(event)).rejects.toThrow(
        "Validation failed: Invalid algorithm"
      );

      expect(mockParseSignHashRequest).toHaveBeenCalledWith(event);
      expect(mockExecuteSignHash).not.toHaveBeenCalled();
      expect(mockOk).not.toHaveBeenCalled();
    });

    it("throws when request body is missing", async () => {
      const event: any = {
        body: null,
        headers: { authorization: "Bearer valid-token" },
      };

      const validationError = new Error("Missing request body");
      mockParseSignHashRequest.mockImplementation(() => {
        throw validationError;
      });

      await expect(handler(event)).rejects.toThrow("Missing request body");
      expect(mockParseSignHashRequest).toHaveBeenCalledWith(event);
      expect(mockExecuteSignHash).not.toHaveBeenCalled();
    });
  });

  describe("use case errors", () => {
    it("propagates use case failure", async () => {
      const event: any = {
        body: JSON.stringify({
          digest: { alg: "sha256", value: "dGVzdC1kaWdlc3QtdmFsdWU" },
          algorithm: "RSASSA_PSS_SHA_256",
        }),
        headers: { authorization: "Bearer valid-token" },
      };

      const parsedRequest = {
        digest: { alg: "sha256", value: "dGVzdC1kaWdlc3QtdmFsdWU" },
        algorithm: "RSASSA_PSS_SHA_256",
      };

      const useCaseError = new Error("KMS signing failed");

      mockParseSignHashRequest.mockReturnValue(parsedRequest as any);
      mockExecuteSignHash.mockRejectedValue(useCaseError);

      await expect(handler(event)).rejects.toThrow("KMS signing failed");

      expect(mockExecuteSignHash).toHaveBeenCalledWith(parsedRequest, {
        kms: mockSigner,
        defaultKeyId:
          "arn:aws:kms:us-east-1:123456789012:key/default-key",
        allowedAlgorithms: ["RSASSA_PSS_SHA_256"],
      });
    });
  });

  describe("container and configuration", () => {
    it("uses container signer and config (signerKeyId/signingAlgorithm)", async () => {
      const event: any = {
        body: JSON.stringify({
          digest: { alg: "sha256", value: "dGVzdC1kaWdlc3QtdmFsdWU" },
          algorithm: "RSASSA_PSS_SHA_256",
        }),
        headers: { authorization: "Bearer valid-token" },
      };

      const parsedRequest = {
        digest: { alg: "sha256", value: "dGVzdC1kaWdlc3QtdmFsdWU" },
        algorithm: "RSASSA_PSS_SHA_256",
      };

      const useCaseResult = {
        keyId: "arn:aws:kms:us-east-1:123456789012:key/default-key",
        algorithm: "RSASSA_PSS_SHA_256",
        signature: "dGVzdC1zaWduYXR1cmU",
      };

      const expectedResponse = {
        statusCode: 200,
        body: JSON.stringify(useCaseResult),
        headers: { "Content-Type": "application/json" },
      };

      mockParseSignHashRequest.mockReturnValue(parsedRequest as any);
      mockExecuteSignHash.mockResolvedValue(useCaseResult as any);
      mockOk.mockReturnValue(expectedResponse as any);

      const result = await handler(event);

      expect(result).toEqual(expectedResponse);
      expect(mockGetContainer).toHaveBeenCalled();
      expect(mockExecuteSignHash).toHaveBeenCalledWith(parsedRequest, {
        kms: mockSigner,
        defaultKeyId:
          "arn:aws:kms:us-east-1:123456789012:key/default-key",
        allowedAlgorithms: ["RSASSA_PSS_SHA_256"],
      });
    });
  });
});

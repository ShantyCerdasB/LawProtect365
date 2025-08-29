/**
 * @file SignHash.usecase.test.ts
 * @summary Unit tests for the SignHash use case.
 *
 * @description
 * Tests the executeSignHash function with a mocked KMS port and mocked domain rule.
 * Covers success scenarios, error handling, context handling, and base64url edge cases
 * to achieve 100% line/branch coverage for SignHash.ts.
 */

import { executeSignHash } from "../../../src/use-cases/signatures/SignHash";
import { assertKmsAlgorithmAllowed } from "../../../src/domain/rules/Signing.rules";
import type { KmsPort } from "@lawprotect/shared-ts";
import type {
  SignHashInput,
  SignHashContext,
} from "../../../src/use-cases/signatures/SignHash";

// Mock domain rule so we can assert calls and inject failures
jest.mock("../../../src/domain/rules/Signing.rules", () => ({
  assertKmsAlgorithmAllowed: jest.fn(),
}));

const mockAssertKmsAlgorithmAllowed =
  assertKmsAlgorithmAllowed as jest.MockedFunction<typeof assertKmsAlgorithmAllowed>;

describe("executeSignHash", () => {
  let mockKms: jest.Mocked<KmsPort>;
  let context: SignHashContext;

  beforeEach(() => {
    mockKms = {
      sign: jest.fn(),
    } as unknown as jest.Mocked<KmsPort>;

    context = {
      kms: mockKms,
      defaultKeyId: "arn:aws:kms:us-east-1:123456789012:key/default-key",
      allowedAlgorithms: [
        "RSASSA_PSS_SHA_256",
        "RSASSA_PSS_SHA_384",
        "RSASSA_PSS_SHA_512",
        "ECDSA_SHA_256",
      ],
    };

    // IMPORTANTE: resetear implementación Y llamadas
    mockAssertKmsAlgorithmAllowed.mockReset();
    // Implementación por defecto: NO lanzar
    mockAssertKmsAlgorithmAllowed.mockImplementation(() => undefined);
  });

  describe("success cases", () => {
    it("signs with default key (sha256, no padding needed)", async () => {
      const input: SignHashInput = {
        digest: { alg: "sha256", value: "dGVzdC1kaWdlc3QtdmFsdWU" }, // "test-digest-value"
        algorithm: "RSASSA_PSS_SHA_256",
      };

      const mockSignature = Buffer.from("test-signature");
      mockKms.sign.mockResolvedValue({ signature: mockSignature });

      const result = await executeSignHash(input, context);

      expect(result).toEqual({
        keyId: context.defaultKeyId,
        algorithm: "RSASSA_PSS_SHA_256",
        signature: "dGVzdC1zaWduYXR1cmU", // base64url("test-signature")
      });
      expect(mockAssertKmsAlgorithmAllowed).toHaveBeenCalledWith(
        "RSASSA_PSS_SHA_256",
        context.allowedAlgorithms
      );
      expect(mockKms.sign).toHaveBeenCalledWith({
        keyId: context.defaultKeyId,
        signingAlgorithm: "RSASSA_PSS_SHA_256",
        message: Buffer.from("test-digest-value"),
      });
    });

    it("signs with custom key (sha384)", async () => {
      const input: SignHashInput = {
        digest: { alg: "sha384", value: "Y3VzdG9tLWRpZ2VzdC12YWx1ZQ" }, // "custom-digest-value"
        algorithm: "RSASSA_PSS_SHA_384",
        keyId: "arn:aws:kms:us-east-1:123456789012:key/custom-key" as any,
      };

      const mockSignature = Buffer.from("custom-signature");
      mockKms.sign.mockResolvedValue({ signature: mockSignature });

      const result = await executeSignHash(input, context);

      expect(result).toEqual({
        keyId: "arn:aws:kms:us-east-1:123456789012:key/custom-key",
        algorithm: "RSASSA_PSS_SHA_384",
        signature: "Y3VzdG9tLXNpZ25hdHVyZQ", // base64url("custom-signature")
      });
      expect(mockAssertKmsAlgorithmAllowed).toHaveBeenCalledWith(
        "RSASSA_PSS_SHA_384",
        context.allowedAlgorithms
      );
      expect(mockKms.sign).toHaveBeenCalledWith({
        keyId: "arn:aws:kms:us-east-1:123456789012:key/custom-key",
        signingAlgorithm: "RSASSA_PSS_SHA_384",
        message: Buffer.from("custom-digest-value"),
      });
    });

    it("signs with sha512 algorithm", async () => {
      const input: SignHashInput = {
        digest: { alg: "sha512", value: "c2hhNTEyLWRpZ2VzdC12YWx1ZQ" }, // "sha512-digest-value"
        algorithm: "RSASSA_PSS_SHA_512",
      };

      const mockSignature = Buffer.from("sha512-signature");
      mockKms.sign.mockResolvedValue({ signature: mockSignature });

      const result = await executeSignHash(input, context);

      expect(result).toEqual({
        keyId: context.defaultKeyId,
        algorithm: "RSASSA_PSS_SHA_512",
        signature: "c2hhNTEyLXNpZ25hdHVyZQ", // base64url("sha512-signature")
      });
    });

    it("signs with ECDSA algorithm", async () => {
      const input: SignHashInput = {
        digest: { alg: "sha256", value: "ZWNkc2EtZGlnZXN0LXZhbHVl" }, // "ecdsa-digest-value"
        algorithm: "ECDSA_SHA_256",
      };

      // Return a Uint8Array to cover Buffer.from(Uint8Array) path as well
      const mockSignature = new Uint8Array(Buffer.from("ecdsa-signature"));
      mockKms.sign.mockResolvedValue({ signature: mockSignature });

      const result = await executeSignHash(input, context);

      expect(result).toEqual({
        keyId: context.defaultKeyId,
        algorithm: "ECDSA_SHA_256",
        signature: "ZWNkc2Etc2lnbmF0dXJl", // base64url("ecdsa-signature")
      });
    });
  });

  describe("error handling", () => {
    it("throws when algorithm is not allowed", async () => {
      const input: SignHashInput = {
        digest: { alg: "sha256", value: "dGVzdC1kaWdlc3QtdmFsdWU" },
        algorithm: "INVALID_ALGORITHM" as any,
      };

      // Solo en este test: forzar fallo de la regla
      mockAssertKmsAlgorithmAllowed.mockImplementation(() => {
        throw new Error("Algorithm not allowed");
      });

      await expect(executeSignHash(input, context)).rejects.toThrow(
        "Algorithm not allowed"
      );

      expect(mockAssertKmsAlgorithmAllowed).toHaveBeenCalledWith(
        "INVALID_ALGORITHM",
        context.allowedAlgorithms
      );
      expect(mockKms.sign).not.toHaveBeenCalled();
    });

    it("propagates KMS signing failure", async () => {
      const input: SignHashInput = {
        digest: { alg: "sha256", value: "dGVzdC1kaWdlc3QtdmFsdWU" },
        algorithm: "RSASSA_PSS_SHA_256",
      };

      // No tocar la regla aquí; por defecto NO lanza
      mockKms.sign.mockRejectedValue(new Error("KMS signing failed"));

      await expect(executeSignHash(input, context)).rejects.toThrow(
        "KMS signing failed"
      );

      expect(mockAssertKmsAlgorithmAllowed).toHaveBeenCalledWith(
        "RSASSA_PSS_SHA_256",
        context.allowedAlgorithms
      );
      expect(mockKms.sign).toHaveBeenCalledWith({
        keyId: context.defaultKeyId,
        signingAlgorithm: "RSASSA_PSS_SHA_256",
        message: Buffer.from("test-digest-value"),
      });
    });
  });

  describe("edge cases", () => {
    it("handles empty digest value (decodes to empty bytes)", async () => {
      const input: SignHashInput = {
        digest: { alg: "sha256", value: "" },
        algorithm: "RSASSA_PSS_SHA_256",
      };

      const mockSignature = Buffer.from("empty-signature");
      mockKms.sign.mockResolvedValue({ signature: mockSignature });

      const result = await executeSignHash(input, context);

      expect(result.signature).toBe("ZW1wdHktc2lnbmF0dXJl");
      expect(mockKms.sign).toHaveBeenCalledWith({
        keyId: context.defaultKeyId,
        signingAlgorithm: "RSASSA_PSS_SHA_256",
        message: Buffer.from(""), // empty buffer
      });
    });

    it("handles very long digest value", async () => {
      const longValue = "a".repeat(1000);
      const input: SignHashInput = {
        digest: {
          alg: "sha512",
          value: Buffer.from(longValue).toString("base64url"),
        },
        algorithm: "RSASSA_PSS_SHA_512",
      };

      const mockSignature = Buffer.from("long-signature");
      mockKms.sign.mockResolvedValue({ signature: mockSignature });

      const result = await executeSignHash(input, context);
      expect(result.signature).toBe("bG9uZy1zaWduYXR1cmU");
    });

    it("handles base64url with URL chars and padding needed", async () => {
      const input: SignHashInput = {
        digest: { alg: "sha256", value: "dGVzdA" }, // "test" (needs padding)
        algorithm: "RSASSA_PSS_SHA_256",
      };

      const mockSignature = Buffer.from("test-signature");
      mockKms.sign.mockResolvedValue({ signature: mockSignature });

      await executeSignHash(input, context);

      expect(mockKms.sign).toHaveBeenCalledWith({
        keyId: context.defaultKeyId,
        signingAlgorithm: "RSASSA_PSS_SHA_256",
        message: Buffer.from("test"),
      });
    });

    it("handles url-safe characters '-' and '_' in digest", async () => {
      const input: SignHashInput = {
        digest: { alg: "sha256", value: "c3BlY2lhbC1jaGFycy0tXw" }, // "special-chars--_"
        algorithm: "RSASSA_PSS_SHA_256",
      };

      const mockSignature = Buffer.from("special-chars-signature");
      mockKms.sign.mockResolvedValue({ signature: mockSignature });

      const result = await executeSignHash(input, context);

      expect(result.signature).toBe("c3BlY2lhbC1jaGFycy1zaWduYXR1cmU");
      expect(mockKms.sign).toHaveBeenCalledWith({
        keyId: context.defaultKeyId,
        signingAlgorithm: "RSASSA_PSS_SHA_256",
        message: Buffer.from("special-chars--_"),
      });
    });
  });

  describe("context handling", () => {
    it("passes context.allowedAlgorithms to domain rule", async () => {
      const input: SignHashInput = {
        digest: { alg: "sha256", value: "dGVzdC1kaWdlc3QtdmFsdWU" },
        algorithm: "RSASSA_PSS_SHA_256",
      };

      const mockSignature = Buffer.from("test-signature");
      mockKms.sign.mockResolvedValue({ signature: mockSignature });

      await executeSignHash(input, context);

      expect(mockAssertKmsAlgorithmAllowed).toHaveBeenCalledWith(
        "RSASSA_PSS_SHA_256",
        context.allowedAlgorithms
      );
    });

    it("works with a different default key and a narrower allow-list", async () => {
      const input: SignHashInput = {
        digest: { alg: "sha256", value: "dGVzdC1kaWdlc3QtdmFsdWU" },
        algorithm: "RSASSA_PSS_SHA_256",
      };

      const differentContext: SignHashContext = {
        kms: mockKms,
        defaultKeyId:
          "arn:aws:kms:us-east-1:123456789012:key/different-key",
        allowedAlgorithms: ["RSASSA_PSS_SHA_256"],
      };

      const mockSignature = Buffer.from("test-signature");
      mockKms.sign.mockResolvedValue({ signature: mockSignature });

      const result = await executeSignHash(input, differentContext);

      expect(result.keyId).toBe(
        "arn:aws:kms:us-east-1:123456789012:key/different-key"
      );
      expect(mockAssertKmsAlgorithmAllowed).toHaveBeenCalledWith(
        "RSASSA_PSS_SHA_256",
        ["RSASSA_PSS_SHA_256"]
      );
    });

    it("works when allowedAlgorithms is undefined", async () => {
      const input: SignHashInput = {
        digest: { alg: "sha256", value: "dGVzdC1kaWdlc3QtdmFsdWU" },
        algorithm: "RSASSA_PSS_SHA_256",
      };

      const unrestrictedContext: SignHashContext = {
        kms: mockKms,
        defaultKeyId:
          "arn:aws:kms:us-east-1:123456789012:key/default-key",
        allowedAlgorithms: undefined,
      };

      const mockSignature = Buffer.from("test-signature");
      mockKms.sign.mockResolvedValue({ signature: mockSignature });

      const result = await executeSignHash(input, unrestrictedContext);

      expect(result).toBeDefined();
      expect(result.signature).toBe("dGVzdC1zaWduYXR1cmU");
      expect(mockAssertKmsAlgorithmAllowed).toHaveBeenCalledWith(
        "RSASSA_PSS_SHA_256",
        undefined
      );
    });
  });
});

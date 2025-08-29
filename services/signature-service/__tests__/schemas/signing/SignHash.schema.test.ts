/**
 * @file SignHash.schema.test.ts
 * @summary Unit tests for SignHash schema validation.
 */

import { SignHashRequestSchema, SignHashResponseSchema, parseSignHashRequest } from "../../../src/schemas/signing/SignHash.schema";

describe("SignHashRequestSchema", () => {
  it("validates a valid request with all fields", () => {
    const validRequest = {
      digest: {
        alg: "sha256" as const,
        value: "dGVzdF9kaWdlc3RfdmFsdWU", // base64url for "test_digest_value"
      },
      algorithm: "RSASSA_PSS_SHA_256" as const,
      keyId: "arn:aws:kms:us-east-1:123456789012:key/test-key-id",
    };

    const result = SignHashRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validRequest);
    }
  });

  it("validates request with different hash algorithms", () => {
    const algorithms = ["sha256", "sha384", "sha512"] as const;
    
    algorithms.forEach(alg => {
      const request = {
        digest: {
          alg,
          value: "dGVzdF9kaWdlc3RfdmFsdWU",
        },
        algorithm: "RSASSA_PSS_SHA_256" as const,
        keyId: "arn:aws:kms:us-east-1:123456789012:key/test-key-id",
      };

      const result = SignHashRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });
  });

  it("validates request with different KMS algorithms", () => {
    const kmsAlgorithms = ["RSASSA_PSS_SHA_256", "RSASSA_PSS_SHA_384", "RSASSA_PSS_SHA_512"] as const;
    
    kmsAlgorithms.forEach(algorithm => {
      const request = {
        digest: {
          alg: "sha256" as const,
          value: "dGVzdF9kaWdlc3RfdmFsdWU",
        },
        algorithm,
        keyId: "arn:aws:kms:us-east-1:123456789012:key/test-key-id",
      };

      const result = SignHashRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });
  });

  it("rejects invalid hash algorithm", () => {
    const invalidRequest = {
      digest: {
        alg: "md5" as any, // Invalid algorithm
        value: "dGVzdF9kaWdlc3RfdmFsdWU",
      },
      algorithm: "RSASSA_PSS_SHA_256" as const,
      keyId: "arn:aws:kms:us-east-1:123456789012:key/test-key-id",
    };

    const result = SignHashRequestSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid KMS algorithm", () => {
    const invalidRequest = {
      digest: {
        alg: "sha256" as const,
        value: "dGVzdF9kaWdlc3RfdmFsdWU",
      },
      algorithm: "INVALID_ALGORITHM" as any,
      keyId: "arn:aws:kms:us-east-1:123456789012:key/test-key-id",
    };

    const result = SignHashRequestSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid base64url digest value", () => {
    const invalidRequest = {
      digest: {
        alg: "sha256" as const,
        value: "invalid-base64++", // Invalid base64url
      },
      algorithm: "RSASSA_PSS_SHA_256" as const,
      keyId: "arn:aws:kms:us-east-1:123456789012:key/test-key-id",
    };

    const result = SignHashRequestSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const invalidRequest = {
      digest: {
        alg: "sha256" as const,
        // Missing value
      },
      algorithm: "RSASSA_PSS_SHA_256" as const,
      keyId: "arn:aws:kms:us-east-1:123456789012:key/test-key-id",
    };

    const result = SignHashRequestSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
  });

  it("validates request without optional keyId", () => {
    const validRequest = {
      digest: {
        alg: "sha256" as const,
        value: "dGVzdF9kaWdlc3RfdmFsdWU",
      },
      algorithm: "RSASSA_PSS_SHA_256" as const,
      // keyId is optional
    };

    const result = SignHashRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });
});

describe("SignHashResponseSchema", () => {
  it("validates a valid response", () => {
    const validResponse = {
      signature: "dGVzdF9zaWduYXR1cmVfdmFsdWU", // base64url signature
      algorithm: "RSASSA_PSS_SHA_256" as const,
      keyId: "arn:aws:kms:us-east-1:123456789012:key/test-key-id",
    };

    const result = SignHashResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validResponse);
    }
  });

  it("validates response with different KMS algorithms", () => {
    const kmsAlgorithms = ["RSASSA_PSS_SHA_256", "RSASSA_PSS_SHA_384", "RSASSA_PSS_SHA_512"] as const;
    
    kmsAlgorithms.forEach(algorithm => {
      const response = {
        signature: "dGVzdF9zaWduYXR1cmVfdmFsdWU",
        algorithm,
        keyId: "arn:aws:kms:us-east-1:123456789012:key/test-key-id",
      };

      const result = SignHashResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  it("rejects invalid base64url signature", () => {
    const invalidResponse = {
      signature: "invalid-signature++", // Invalid base64url
      algorithm: "RSASSA_PSS_SHA_256" as const,
      keyId: "arn:aws:kms:us-east-1:123456789012:key/test-key-id",
    };

    const result = SignHashResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const invalidResponse = {
      // Missing signature
      algorithm: "RSASSA_PSS_SHA_256" as const,
      keyId: "arn:aws:kms:us-east-1:123456789012:key/test-key-id",
    };

    const result = SignHashResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });

  it("rejects missing algorithm", () => {
    const invalidResponse = {
      signature: "dGVzdF9zaWduYXR1cmVfdmFsdWU",
      // Missing algorithm
      keyId: "arn:aws:kms:us-east-1:123456789012:key/test-key-id",
    };

    const result = SignHashResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });

  it("rejects missing keyId", () => {
    const invalidResponse = {
      signature: "dGVzdF9zaWduYXR1cmVfdmFsdWU",
      algorithm: "RSASSA_PSS_SHA_256" as const,
      // Missing keyId
    };

    const result = SignHashResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });

  it("rejects invalid KMS algorithm in response", () => {
    const invalidResponse = {
      signature: "dGVzdF9zaWduYXR1cmVfdmFsdWU",
      algorithm: "INVALID_ALGORITHM" as any,
      keyId: "arn:aws:kms:us-east-1:123456789012:key/test-key-id",
    };

    const result = SignHashResponseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
  });
});

describe("parseSignHashRequest", () => {
  it("parses valid request body", () => {
    const requestBody = {
      digest: {
        alg: "sha256" as const,
        value: "dGVzdF9kaWdlc3RfdmFsdWU",
      },
      algorithm: "RSASSA_PSS_SHA_256" as const,
      keyId: "arn:aws:kms:us-east-1:123456789012:key/test-key-id",
    };

    const event = {
      body: JSON.stringify(requestBody),
    };

    const result = parseSignHashRequest(event);
    expect(result).toEqual(requestBody);
  });

  it("parses valid request body when body is already an object", () => {
    const requestBody = {
      digest: {
        alg: "sha256" as const,
        value: "dGVzdF9kaWdlc3RfdmFsdWU",
      },
      algorithm: "RSASSA_PSS_SHA_256" as const,
      keyId: "arn:aws:kms:us-east-1:123456789012:key/test-key-id",
    };

    const event = {
      body: requestBody,
    };

    const result = parseSignHashRequest(event);
    expect(result).toEqual(requestBody);
  });

  it("throws error for missing request body", () => {
    const event = {};

    expect(() => parseSignHashRequest(event)).toThrow("Missing request body");
  });

  it("throws error for null request body", () => {
    const event = {
      body: null,
    };

    expect(() => parseSignHashRequest(event)).toThrow("Missing request body");
  });

  it("throws error for undefined request body", () => {
    const event = {
      body: undefined,
    };

    expect(() => parseSignHashRequest(event)).toThrow("Missing request body");
  });

  it("throws error for invalid JSON", () => {
    const event = {
      body: "invalid-json",
    };

    expect(() => parseSignHashRequest(event)).toThrow("Invalid JSON in request body");
  });

  it("throws error for invalid request body", () => {
    const invalidBody = {
      digest: {
        alg: "invalid" as any,
        value: "dGVzdF9kaWdlc3RfdmFsdWU",
      },
      algorithm: "RSASSA_PSS_SHA_256" as const,
      keyId: "arn:aws:kms:us-east-1:123456789012:key/test-key-id",
    };

    const event = {
      body: JSON.stringify(invalidBody),
    };

    expect(() => parseSignHashRequest(event)).toThrow("Validation failed:");
  });

  it("throws error for request body with missing required fields", () => {
    const invalidBody = {
      digest: {
        alg: "sha256" as const,
        // Missing value
      },
      algorithm: "RSASSA_PSS_SHA_256" as const,
      keyId: "arn:aws:kms:us-east-1:123456789012:key/test-key-id",
    };

    const event = {
      body: JSON.stringify(invalidBody),
    };

    expect(() => parseSignHashRequest(event)).toThrow("Validation failed:");
  });
});

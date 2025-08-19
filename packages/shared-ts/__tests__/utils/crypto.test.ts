/**
 * @file crypto.test.ts
 * @summary Tests for cryptographic utilities (hashing, HMAC, base64url, and timing-safe compare).
 * @remarks
 * - Covers both native and fallback branches of `toBase64Url`.
 * - Verifies string vs Buffer inputs for hashing/HMAC.
 * - Ensures `randomBase64Url` returns properly encoded output and respects byte length.
 */

import * as nodeCrypto from "node:crypto";
import {
  sha256Hex,
  hmacSha256Hex,
  toBase64Url,
  randomBase64Url,
  timingSafeEqual,
} from "../../src/utils/crypto.js";

describe("sha256Hex", () => {
  it("produces the expected SHA-256 hex digest from string", () => {
    const input = "abc";
    const expected = nodeCrypto.createHash("sha256")
      .update(Buffer.from(input, "utf8"))
      .digest("hex");
    expect(sha256Hex(input)).toBe(expected);
  });

  it("accepts Buffer input and matches string result", () => {
    const buf = Buffer.from("The quick brown fox jumps over the lazy dog", "utf8");
    const asString = buf.toString("utf8");
    expect(sha256Hex(buf)).toBe(sha256Hex(asString));
  });
});

describe("hmacSha256Hex", () => {
  it("produces the expected HMAC-SHA256 hex digest (string key/data)", () => {
    const key = "key";
    const data = "abc";
    const expected = nodeCrypto.createHmac("sha256", Buffer.from(key, "utf8"))
      .update(Buffer.from(data, "utf8"))
      .digest("hex");
    expect(hmacSha256Hex(key, data)).toBe(expected);
  });

  it("accepts Buffer key/data and matches string-key/data output", () => {
    const keyStr = "another-key";
    const dataStr = "payload";
    const keyBuf = Buffer.from(keyStr, "utf8");
    const dataBuf = Buffer.from(dataStr, "utf8");
    expect(hmacSha256Hex(keyBuf, dataBuf)).toBe(hmacSha256Hex(keyStr, dataStr));
  });
});

describe("toBase64Url", () => {
  const patchIsEncoding = (value: boolean, fn: () => void) => {
    const orig = (Buffer as any).isEncoding;
    (Buffer as any).isEncoding = (enc: string) =>
      enc === "base64url" ? value : orig?.call(Buffer, enc);
    try {
      fn();
    } finally {
      (Buffer as any).isEncoding = orig;
    }
  };

  it("fallback branch: replaces '+' and '/' and strips '=' padding", () => {
    // Base64("+/8=") for bytes [0xfb, 0xff] should become "-_8"
    const buf = Buffer.from([0xfb, 0xff]);
    patchIsEncoding(false, () => {
      expect(toBase64Url(buf)).toBe("-_8");
    });

    // Single and double padding trimming cases: "f" -> "Zg", "fo" -> "Zm8", "foo" -> "Zm9v"
    patchIsEncoding(false, () => {
      expect(toBase64Url(Buffer.from("f", "utf8"))).toBe("Zg");
      expect(toBase64Url(Buffer.from("fo", "utf8"))).toBe("Zm8");
      expect(toBase64Url(Buffer.from("foo", "utf8"))).toBe("Zm9v");
    });
  });

  it("native branch: uses Buffer.toString('base64url') when supported", () => {
    if ((Buffer as any).isEncoding?.("base64url")) {
      const buf = Buffer.from([0xfb, 0xff]);
      const expected = buf.toString("base64url");
      expect(toBase64Url(buf)).toBe(expected);
    } else {
      // If the environment lacks native support, assert fallback still works
      const buf = Buffer.from([0xfb, 0xff]);
      patchIsEncoding(false, () => {
        expect(toBase64Url(buf)).toBe("-_8");
      });
    }
  });

  it("native and fallback produce the same result for arbitrary input", () => {
    const buf = nodeCrypto.randomBytes(32);

    let nativeOut: string;
    if ((Buffer as any).isEncoding?.("base64url")) {
      nativeOut = toBase64Url(buf);
    } else {
      // Reference via manual conversion
      const b64 = buf.toString("base64");
      nativeOut = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }

    let fallbackOut = "";
    patchIsEncoding(false, () => {
      fallbackOut = toBase64Url(buf);
    });

    expect(fallbackOut).toBe(nativeOut);
  });
});

describe("randomBase64Url", () => {
  it("returns a base64url string using allowed alphabet only", () => {
    const s = randomBase64Url(16);
    expect(/^[A-Za-z0-9\-_]+$/.test(s)).toBe(true);
  });

  it("respects the requested byte length (1 byte -> 2 base64url chars)", () => {
    const s = randomBase64Url(1);
    expect(s.length).toBe(2);
    expect(/^[A-Za-z0-9\-_]+$/.test(s)).toBe(true);
  });

  it("clamps non-positive sizes up to 1 byte", () => {
    const s0 = randomBase64Url(0 as any);
    const sNeg = randomBase64Url((-10) as any);
    expect(s0.length).toBe(2);
    expect(sNeg.length).toBe(2);
  });
});

describe("timingSafeEqual", () => {
  it("returns true for equal strings", () => {
    expect(timingSafeEqual("secret", "secret")).toBe(true);
  });

  it("returns false for different lengths (early return)", () => {
    expect(timingSafeEqual("a", "aa")).toBe(false);
  });

  it("returns false for same-length but different strings", () => {
    expect(timingSafeEqual("secret1", "secret2")).toBe(false);
  });
});

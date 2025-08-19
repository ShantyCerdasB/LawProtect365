/**
 * @file Tests for utils/id.ts
 * @remarks
 * - Covers both `uuid` branches (native vs. manual) and both `randomToken` branches (native base64url vs. manual conversion).
 * - Uses module mocks with `jest.isolateModulesAsync` to avoid reassigning read-only exports.
 */

/// Mock ULID deterministically before loading the SUT.
jest.mock("ulid", () => ({
  ulid: () => "01ARZ3NDEKTSV4RRFFQ69G5FAV",
}));

describe("utils/id", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it("uuid() uses crypto.randomUUID when available", async () => {
    // Mock node:crypto before importing the SUT.
    jest.doMock("node:crypto", () => {
      const actual = jest.requireActual<any>("node:crypto");
      return {
        ...actual,
        randomUUID: jest.fn(() => "11111111-2222-4333-8444-555555555555"),
      };
    });

    await jest.isolateModulesAsync(async () => {
      const { uuid } = await import("../../src/utils/id.js");
      const v = uuid();
      const mockedCrypto = await import("node:crypto");
      expect((mockedCrypto as any).randomUUID).toHaveBeenCalledTimes(1);
      expect(v).toBe("11111111-2222-4333-8444-555555555555");
    });
  });

  it("uuid() falls back to manual v4 when crypto.randomUUID is absent", async () => {
    jest.doMock("node:crypto", () => {
      const actual = jest.requireActual<any>("node:crypto");
      return {
        ...actual,
        randomUUID: undefined, // simulate absence
        randomBytes: jest.fn(() => Buffer.alloc(16, 0)),
      };
    });

    await jest.isolateModulesAsync(async () => {
      const { uuid } = await import("../../src/utils/id.js");
      const v = uuid();
      const mockedCrypto = await import("node:crypto");
      expect((mockedCrypto as any).randomBytes).toHaveBeenCalledWith(16);
      expect(v).toBe("00000000-0000-4000-8000-000000000000");
    });
  });

  it("ulid() returns the mocked deterministic value", async () => {
    await jest.isolateModulesAsync(async () => {
      const { ulid } = await import("../../src/utils/id.js");
      const v = ulid();
      expect(v).toBe("01ARZ3NDEKTSV4RRFFQ69G5FAV");
      expect(v).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    });
  });

  it("randomToken() uses native base64url when Buffer.isEncoding('base64url') is true", async () => {
    jest.doMock("node:crypto", () => {
      const actual = jest.requireActual<any>("node:crypto");
      return {
        ...actual,
        randomBytes: jest.fn(() => ({
          toString: (enc: BufferEncoding | "base64url") => {
            if (enc === "base64url") return "native_token_123";
            throw new Error("unexpected encoding");
          },
        })) as any,
      };
    });

    await jest.isolateModulesAsync(async () => {
      const spyIsEnc = jest.spyOn(Buffer as any, "isEncoding").mockReturnValue(true);
      const { randomToken } = await import("../../src/utils/id.js");
      const token = randomToken(7);

      const mockedCrypto = await import("node:crypto");
      expect(spyIsEnc).toHaveBeenCalledWith("base64url");
      expect((mockedCrypto as any).randomBytes).toHaveBeenCalledWith(7);
      expect(token).toBe("native_token_123");
    });
  });

  it("randomToken() falls back to manual base64→base64url conversion", async () => {
    const base64WithSymbols = "ab+/cd=="; // expected → "ab-_cd" (+→-, /→_, strip '=')

    jest.doMock("node:crypto", () => {
      const actual = jest.requireActual<any>("node:crypto");
      return {
        ...actual,
        randomBytes: jest.fn(
          () =>
            ({
              toString: (enc: BufferEncoding) => (enc === "base64" ? base64WithSymbols : ""),
            }) as any
        ),
      };
    });

    await jest.isolateModulesAsync(async () => {
      jest.spyOn(Buffer as any, "isEncoding").mockReturnValue(false);

      const { randomToken } = await import("../../src/utils/id.js");
      const token = randomToken(4);

      const mockedCrypto = await import("node:crypto");
      expect((mockedCrypto as any).randomBytes).toHaveBeenCalledWith(4);
      expect(token).toBe("ab-_cd"); // corrected expectation
    });
  });

  it("randomToken() defaults to 32 bytes when size is omitted", async () => {
    jest.doMock("node:crypto", () => {
      const actual = jest.requireActual<any>("node:crypto");
      return {
        ...actual,
        randomBytes: jest.fn(
          () =>
            ({
              toString: (enc: BufferEncoding) => (enc === "base64" ? "aaaa" : ""),
            }) as any
        ),
      };
    });

    await jest.isolateModulesAsync(async () => {
      jest.spyOn(Buffer as any, "isEncoding").mockReturnValue(false);

      const { randomToken } = await import("../../src/utils/id.js");
      const token = randomToken();

      const mockedCrypto = await import("node:crypto");
      expect((mockedCrypto as any).randomBytes).toHaveBeenCalledWith(32);
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });
  });
});

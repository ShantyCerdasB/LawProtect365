/**
 * @file app.index.test.ts
 * @summary Verifies that the app index re-exports public helpers from Maybe and Result.
 */

import * as app from "../../src/app/index";

describe("app/index re-exports", () => {
  it("re-exports Maybe helpers", () => {
    // maybeSome
    const some = (app as any).maybeSome(42);
    expect(some).toEqual({ kind: "some", value: 42 });

    // maybeNone (no generic args on an untyped call)
    const none = (app as any).maybeNone();
    expect(none).toEqual({ kind: "none" });

    // maybeFromNullable
    expect((app as any).maybeFromNullable(0)).toEqual({ kind: "some", value: 0 });
    expect((app as any).maybeFromNullable(null)).toEqual({ kind: "none" });

    // maybeMap
    const mapped = (app as any).maybeMap((app as any).maybeSome(3), (x: number) => x + 7);
    expect(mapped).toEqual({ kind: "some", value: 10 });

    // maybeUnwrapOr
    expect((app as any).maybeUnwrapOr((app as any).maybeSome("ok"), "fallback")).toBe("ok");
    expect((app as any).maybeUnwrapOr((app as any).maybeNone(), "fallback")).toBe("fallback");
  });

  it("re-exports Result helpers", () => {
    // resultOk / resultErr
    const ok = (app as any).resultOk(7);
    const err = (app as any).resultErr("bad");
    expect(ok).toEqual({ ok: true, value: 7 });
    expect(err).toEqual({ ok: false, error: "bad" });

    // resultMap (only maps Ok)
    const okMapped = (app as any).resultMap(ok, (n: number) => n * 3);
    const errMapped = (app as any).resultMap(err, (_: number) => 0);
    expect(okMapped).toEqual({ ok: true, value: 21 });
    expect(errMapped).toBe(err);

    // resultMapErr (only maps Err)
    const errMapped2 = (app as any).resultMapErr(err, (e: string) => `E:${e}`);
    const okMappedErr = (app as any).resultMapErr(ok, (_: unknown) => "nope");
    expect(errMapped2).toEqual({ ok: false, error: "E:bad" });
    expect(okMappedErr).toBe(ok);

    // resultAndThen
    const andThenOk = (app as any).resultAndThen(ok, (n: number) => (app as any).resultOk(n + 1));
    const andThenErr = (app as any).resultAndThen(err, (_: unknown) => (app as any).resultOk("x"));
    expect(andThenOk).toEqual({ ok: true, value: 8 });
    expect(andThenErr).toBe(err);

    // resultUnwrap / resultUnwrapOr
    expect((app as any).resultUnwrap((app as any).resultOk("v"))).toBe("v");
    expect((app as any).resultUnwrapOr((app as any).resultErr("x"), "fallback")).toBe("fallback");
    expect(() => (app as any).resultUnwrap((app as any).resultErr(new Error("boom")))).toThrow("boom");
  });

  it("has no default export", () => {
    expect((app as any).default).toBeUndefined();
  });
});

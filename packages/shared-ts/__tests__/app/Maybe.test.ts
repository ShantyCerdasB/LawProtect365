import {
  maybeSome,
  maybeNone,
  maybeFromNullable,
  maybeMap,
  maybeUnwrapOr,
  type Maybe} from "../../src/app/Maybe";

describe("Maybe", () => {
  it("creates Some with the provided value", () => {
    const m = maybeSome(42);
    expect(m.kind).toBe("some");
    // @ts-expect-no-error at runtime
    expect(m).toEqual({ kind: "some", value: 42 });
  });

  it("creates None", () => {
    const m = maybeNone<number>();
    expect(m.kind).toBe("none");
    // None carries no value property
    expect("value" in (m as any)).toBe(false);
  });

  it("fromNullable lifts values correctly", () => {
    expect(maybeFromNullable(0)).toEqual({ kind: "some", value: 0 });
    expect(maybeFromNullable("")).toEqual({ kind: "some", value: "" });
    expect(maybeFromNullable(false)).toEqual({ kind: "some", value: false });

    const n1 = maybeFromNullable<number | null>(null);
    const n2 = maybeFromNullable<number | undefined>(undefined);
    expect(n1.kind).toBe("none");
    expect(n2.kind).toBe("none");
  });

  it("map applies the function for Some", () => {
    const m = maybeSome(3);
    const r = maybeMap(m, (x) => x * 2);
    expect(r).toEqual({ kind: "some", value: 6 });
  });

  it("map is a no-op for None and does not call the mapper", () => {
    const n = maybeNone<number>();
    const fn = jest.fn((x: number) => x * 2);
    const r = maybeMap(n, fn);
    expect(fn).not.toHaveBeenCalled();
    expect(r.kind).toBe("none");
  });

  it("unwrapOr returns the contained value for Some", () => {
    const m = maybeSome("ok");
    expect(maybeUnwrapOr(m, "fallback")).toBe("ok");
  });

  it("unwrapOr returns the fallback for None", () => {
    const n = maybeNone<string>();
    expect(maybeUnwrapOr(n, "fallback")).toBe("fallback");
  });

  it("type compatibility: None is assignable across Maybe<U>", () => {
    const nNumber: Maybe<number> = maybeNone();
    // Should be assignable to Maybe<string> (the None branch)
    const nString: Maybe<string> = nNumber as unknown as Maybe<string>;
    expect(nString.kind).toBe("none");
  });
});

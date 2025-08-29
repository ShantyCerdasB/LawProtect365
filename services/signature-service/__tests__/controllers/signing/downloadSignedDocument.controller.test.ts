/**
 * @file downloadSignedDocument.controller.test.ts
 * @summary Unit tests for the downloadSignedDocument controller.
 */

import { handler } from "../../../src/controllers/signing/downloadSignedDocument";

describe("downloadSignedDocument controller", () => {
  it("should be defined", () => {
    expect(handler).toBeDefined();
  });
});

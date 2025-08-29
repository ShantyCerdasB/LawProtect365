/**
 * @file PresignUpload.usecase.test.ts
 * @summary Unit tests for the PresignUpload use case.
 */

import { executePresignUpload } from "../../../src/use-cases/signatures/PresignUpload";

describe("PresignUpload use case", () => {
  it("should be defined", () => {
    expect(executePresignUpload).toBeDefined();
  });
});

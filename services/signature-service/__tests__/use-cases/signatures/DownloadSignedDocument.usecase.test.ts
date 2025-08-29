/**
 * @file DownloadSignedDocument.usecase.test.ts
 * @summary Unit tests for the DownloadSignedDocument use case.
 */

import { executeDownloadSignedDocument } from "../../../src/use-cases/signatures/DownloadSignedDocument";

describe("DownloadSignedDocument use case", () => {
  it("should be defined", () => {
    expect(executeDownloadSignedDocument).toBeDefined();
  });
});

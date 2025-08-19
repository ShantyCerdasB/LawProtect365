/**
 * @file Document entity definition.
 *
 * Represents a document uploaded and associated with an envelope.
 * This is a domain-level model, independent of persistence.
 */
export class Document {
  /**
   * Unique identifier for the document.
   */
  readonly documentId: string;

  /**
   * Identifier of the envelope this document belongs to.
   */
  readonly envelopeId: string;

  /**
   * Human-readable name of the document (e.g., "contract.pdf").
   */
  readonly name: string;

  /**
   * MIME type of the document (e.g., "application/pdf").
   */
  readonly mimeType: string;

  /**
   * Size of the document in bytes.
   */
  readonly size: number;

  /**
   * S3 bucket name where the document is stored.
   */
  readonly bucket: string;

  /**
   * Storage key (path) within the bucket.
   */
  readonly key: string;

  /**
   * Current status of the document (e.g., "PENDING", "UPLOADED").
   */
  readonly status: string;

  /**
   * ISO 8601 timestamp when the document was created.
   */
  readonly createdAt: string;

  /**
   * ISO 8601 timestamp when the document was last updated.
   */
  readonly updatedAt: string;

  constructor(params: {
    documentId: string;
    envelopeId: string;
    name: string;
    mimeType: string;
    size: number;
    bucket: string;
    key: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }) {
    this.documentId = params.documentId;
    this.envelopeId = params.envelopeId;
    this.name = params.name;
    this.mimeType = params.mimeType;
    this.size = params.size;
    this.bucket = params.bucket;
    this.key = params.key;
    this.status = params.status;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
    Object.freeze(this);
  }
}

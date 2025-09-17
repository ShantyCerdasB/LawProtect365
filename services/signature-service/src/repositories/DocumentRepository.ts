/**
 * @fileoverview DocumentRepository - Read-only access to shared Documents table
 * @summary Minimal repository to read document metadata by documentId from the shared table
 * @description Used by EnvelopeService business rules to validate document existence/state/ownership.
 */

import type { DdbClientLike } from '@lawprotect/shared-ts';

export interface DocumentRecord {
  documentId: string;
  status: string;
  s3Key: string;
  ownerId: string;
}

/**
 * Read-only repository for Documents table (owned by documents-service).
 */
export class DocumentRepository {
  constructor(
    private readonly tableName: string,
    private readonly ddb: DdbClientLike
  ) {}

  /**
   * Gets the latest document by documentId using GSI1 (gsi1pk = DOCUMENT#<documentId>).
   */
  async getByDocumentId(documentId: string): Promise<DocumentRecord | null> {
    const gsi1pk = `DOCUMENT#${documentId}`;

    // Query GSI1 for latest record (ScanIndexForward: false and Limit 1)
    const res = await this.ddb.query!({
      TableName: this.tableName,
      IndexName: 'gsi1',
      KeyConditionExpression: '#gsi1pk = :doc',
      ExpressionAttributeNames: { '#gsi1pk': 'gsi1pk' },
      ExpressionAttributeValues: { ':doc': gsi1pk },
      ScanIndexForward: false,
      Limit: 1
    });

    const item = (res.Items ?? [])[0] as any;
    if (!item) return null;

    return {
      documentId: item.documentId || documentId,
      status: item.status,
      s3Key: item.s3Key,
      ownerId: item.ownerId
    };
  }
}



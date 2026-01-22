/**
 * @fileoverview DOCUMENT_SIGNED Event Implementation Guide
 * @summary Implementation guide for handling DOCUMENT_SIGNED events from Signature Service
 * @description This document describes what needs to be implemented in Document Service
 * to handle DOCUMENT_SIGNED events published by Signature Service via EventBridge.
 * The event is published as a fallback when synchronous HTTP notification fails,
 * ensuring eventual consistency between services.
 */

# DOCUMENT_SIGNED Event Implementation Guide

## Overview

The Signature Service publishes `DOCUMENT_SIGNED` events to EventBridge when a document is successfully signed. This event is used as a fallback mechanism when the synchronous HTTP call to Document Service fails, ensuring eventual consistency.

## Event Structure

The `DOCUMENT_SIGNED` event has the following structure:

```typescript
{
  id: string;                    // Unique event ID (ULID)
  type: 'DOCUMENT_SIGNED';
  occurredAt: string;            // ISO timestamp
  payload: {
    documentId: string;           // Document ID in Document Service
    envelopeId: string;           // Envelope ID from Signature Service
    signedPdfS3Key: string;      // S3 key where signed PDF is stored
    signatureHash: string;         // SHA-256 hash of the signature
    signedAt: string;             // ISO timestamp when signature was created
  };
  metadata?: {
    'x-trace-id'?: string;       // Optional trace ID for distributed tracing
  };
}
```

## Implementation Requirements

### 1. EventBridge Rule

Create an EventBridge rule to filter `DOCUMENT_SIGNED` events:

**Terraform Configuration:**
```hcl
resource "aws_cloudwatch_event_rule" "document_signed_rule" {
  name        = "${var.project_name}-document-signed-${var.env}"
  description = "Captures DOCUMENT_SIGNED events from Signature Service"
  
  event_pattern = jsonencode({
    source      = ["${var.project_name}.${var.env}.outbox-stream"]
    detail-type = ["DOCUMENT_SIGNED"]
  })
  
  tags = var.tags
}

resource "aws_cloudwatch_event_target" "document_signed_target" {
  rule      = aws_cloudwatch_event_rule.document_signed_rule.name
  target_id = "DocumentSignedHandler"
  arn       = module.document_signed_handler.lambda_function_arn
}
```

### 2. Lambda Handler

Create a Lambda function to process `DOCUMENT_SIGNED` events:

**Handler Structure:**
```typescript
/**
 * @fileoverview DocumentSignedEventHandler - Lambda handler for DOCUMENT_SIGNED events
 * @summary Processes DOCUMENT_SIGNED events from Signature Service
 * @description Downloads signed PDF from S3 and updates document status in Document Service
 */

import { EventBridgeEvent } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DocumentSignedPayload } from './types/events';

export const handler = async (
  event: EventBridgeEvent<'DOCUMENT_SIGNED', DocumentSignedPayload>
): Promise<void> => {
  const { documentId, signedPdfS3Key, signatureHash, signedAt, envelopeId } = event.detail;
  
  // 1. Download signed PDF from S3
  const signedPdf = await downloadPdfFromS3(signedPdfS3Key);
  
  // 2. Update document in Document Service
  await updateDocumentStatus({
    documentId,
    envelopeId,
    signedPdfContent: signedPdf,
    signatureHash,
    signedAt: new Date(signedAt),
  });
};
```

### 3. Service Implementation

Create a service to handle the document finalization:

**Service Structure:**
```typescript
/**
 * @fileoverview FinalizeSignedDocumentService - Service for finalizing signed documents
 * @summary Handles document finalization when receiving DOCUMENT_SIGNED events
 * @description Downloads signed PDF from S3 and updates document metadata
 */

export class FinalizeSignedDocumentService {
  /**
   * @description
   * Finalizes a signed document by downloading the PDF from S3 and updating
   * the document status in the database.
   * @param {object} params - Finalization parameters
   * @param {string} params.documentId - Document ID
   * @param {string} params.envelopeId - Envelope ID
   * @param {string} params.signedPdfS3Key - S3 key where signed PDF is stored
   * @param {string} params.signatureHash - SHA-256 hash of the signature
   * @param {Date} params.signedAt - Timestamp when signature was created
   * @returns {Promise<void>} Promise that resolves when document is finalized
   */
  async finalizeSignedDocument(params: {
    documentId: string;
    envelopeId: string;
    signedPdfS3Key: string;
    signatureHash: string;
    signedAt: Date;
  }): Promise<void> {
    // 1. Download PDF from S3
    const signedPdfContent = await this.downloadPdfFromS3(params.signedPdfS3Key);
    
    // 2. Update document in database
    await this.documentRepository.updateDocument({
      documentId: params.documentId,
      signedPdfContent,
      signatureHash: params.signatureHash,
      signedAt: params.signedAt,
      envelopeId: params.envelopeId,
      status: 'SIGNED',
    });
  }
  
  private async downloadPdfFromS3(s3Key: string): Promise<Buffer> {
    // Implementation to download PDF from S3
  }
}
```

### 4. Database Schema Updates

Ensure the document table has the following fields:

- `signedPdfContent` (Binary/BLOB) - Signed PDF content
- `signatureHash` (String) - SHA-256 hash of the signature
- `signedAt` (DateTime) - Timestamp when document was signed
- `envelopeId` (String) - Envelope ID from Signature Service
- `status` (Enum) - Document status (e.g., 'DRAFT', 'SIGNED', 'FINALIZED')

### 5. S3 Permissions

Ensure the Lambda function has permissions to read from the Signature Service S3 bucket:

**IAM Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::signature-service-bucket/*"
    }
  ]
}
```

## Event Flow

1. **Signature Service** signs document and stores PDF in S3
2. **Signature Service** attempts synchronous HTTP call to Document Service
3. If HTTP fails, **Signature Service** publishes `DOCUMENT_SIGNED` event to outbox
4. **OutboxStreamHandler Lambda** (in event-publisher-service) processes outbox and publishes to EventBridge
5. **EventBridge** triggers Document Service Lambda via rule
6. **Document Service Lambda** downloads PDF from S3 and updates document status

## Error Handling

- **S3 Download Failures**: Log error and retry (EventBridge will retry automatically)
- **Database Update Failures**: Log error and retry (EventBridge will retry automatically)
- **Invalid Event Payload**: Log error and skip (don't retry)
- **Document Not Found**: Log warning and skip (document may have been deleted)

## Testing

1. **Unit Tests**: Test service methods with mocked S3 and database
2. **Integration Tests**: Test Lambda handler with sample EventBridge events
3. **End-to-End Tests**: Test complete flow from Signature Service event to Document Service update

## Monitoring

Monitor the following metrics:

- **Event Processing Latency**: Time from event receipt to document update
- **Event Processing Errors**: Number of failed event processing attempts
- **S3 Download Errors**: Number of S3 download failures
- **Database Update Errors**: Number of database update failures

## Dependencies

- AWS SDK v3 (`@aws-sdk/client-s3`)
- EventBridge event types
- Document repository/DAO
- S3 bucket access (read-only for Signature Service bucket)




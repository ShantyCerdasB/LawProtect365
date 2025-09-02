/**
 * @file Container.ts
 * @summary Core container and dependency injection contracts
 * @description Shared contracts for dependency injection container and service management
 */

import type { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import type { S3Client } from "@aws-sdk/client-s3";
import type { KMSClient } from "@aws-sdk/client-kms";
import type { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import type { SSMClient } from "@aws-sdk/client-ssm";

import type { SignatureServiceConfig } from "./Config";
import type { DocumentRepositoryDdb } from "../../../infrastructure/dynamodb/DocumentRepositoryDdb";
import type { EnvelopeRepositoryDdb } from "../../../infrastructure/dynamodb/EnvelopeRepositoryDb";
import type { InputRepositoryDdb } from "../../../infrastructure/dynamodb/InputRepositoryDdb";
import type { PartyRepositoryDdb } from "../../../infrastructure/dynamodb/PartyRepositoryDdb";
import type { GlobalPartyRepositoryDdb } from "../../../infrastructure/dynamodb/GlobalPartyRepositoryDdb";
import type { IdempotencyStoreDdb } from "../../../infrastructure/dynamodb/IdempotencyStoreDdb";
import type { AuditRepositoryDdb } from "../../../infrastructure/dynamodb/AuditRepositoryDdb";
import type { ConsentRepositoryDdb } from "../../../infrastructure/dynamodb/ConsentRepositoryDdb";
import type { DelegationRepositoryDdb } from "../../../infrastructure/dynamodb/DelegationRepositoryDdb";
import type { OutboxPort } from "@lawprotect/shared-ts";
import type { IdempotencyKeyHasher } from "../../../infrastructure/idempotency/IdempotencyKeyHasher";
import type { IdempotencyRunner } from "../../../infrastructure/idempotency/IdempotencyRunner";
import type { RateLimitStoreDdb } from "../../../infrastructure/ratelimit/RateLimitStoreDdb";
import type { S3EvidenceStorage } from "../../../infrastructure/s3/S3EvidenceStorage";
import type { S3Presigner } from "../../../infrastructure/s3/S3Presigner";
import type { S3SignedPdfIngestor } from "../../../infrastructure/s3/S3SignedPdfIngestor";
import type { KmsSigner } from "../../../infrastructure/kms/KmsSigner";

import type { SsmParamConfigProvider } from "../../../infrastructure/ssm/SsmParamConfigProvider";
import type { Services } from "./Services";
import type { AuditContext } from "../../../domain/entities/AuditContext";
import type { EventPublisher } from "@lawprotect/shared-ts";

/**
 * @summary Root DI container type
 * @description Contains all infrastructure dependencies and application services
 */
export interface Container {
  /** Application configuration */
  readonly config: SignatureServiceConfig;

  /** AWS SDK clients */
  readonly aws: {
    readonly ddb: DynamoDBClient;
    readonly s3: S3Client;
    readonly kms: KMSClient;
    readonly evb: EventBridgeClient;
    readonly ssm: SSMClient;
  };

  /** DynamoDB repositories */
  readonly repos: {
    readonly documents: DocumentRepositoryDdb;
    readonly envelopes: EnvelopeRepositoryDdb;
    readonly inputs: InputRepositoryDdb;
    readonly parties: PartyRepositoryDdb;
    readonly globalParties: GlobalPartyRepositoryDdb;
    readonly audit: AuditRepositoryDdb;
    readonly idempotency: IdempotencyStoreDdb;
    readonly consents: ConsentRepositoryDdb;
    readonly delegations: DelegationRepositoryDdb;
    readonly outbox: OutboxPort;
  };

  /** Idempotency helpers */
  readonly idempotency: {
    readonly hasher: IdempotencyKeyHasher;
    readonly runner: IdempotencyRunner;
  };

  /** Rate limiting helpers */
  readonly rateLimit: {
    readonly otpStore: RateLimitStoreDdb;
  };

  /** S3 storage helpers */
  readonly storage: {
    readonly evidence: S3EvidenceStorage;
    readonly presigner: S3Presigner;
    readonly pdfIngestor: S3SignedPdfIngestor;
  };

  /** Cryptography helpers */
  readonly crypto: {
    readonly signer: KmsSigner;
  };

  /** Event publishing */
  readonly events: {
    readonly eventPublisher: EventPublisher;
  };

  /** Audit service */
  readonly audit: {
    /**
     * @summary Log an audit event with context
     * @description Logs an audit event with the provided context information
     * @param action - The action being audited
     * @param details - Additional details about the action
     * @param context - Context information for the audit event
     */
    log(action: string, details: any, context: AuditContext): Promise<void>;
  };

  /** Configuration provider */
  readonly configProvider: SsmParamConfigProvider;

  /** High-level application services */
  readonly services: Services;

  /** ID generation utilities */
  readonly ids: {
    readonly ulid: () => string;
    readonly uuid: () => string;
    readonly token: (bytes?: number) => string;
  };

  /** Time utilities */
  readonly time: {
    readonly now: () => number;
  };
}

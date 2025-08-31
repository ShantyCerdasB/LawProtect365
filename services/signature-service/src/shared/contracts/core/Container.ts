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
import type { DocumentRepositoryDdb } from "../../../../adapters/dynamodb/DocumentRepositoryDdb";
import type { EnvelopeRepositoryDdb } from "../../../../adapters/dynamodb/EnvelopeRepositoryDb";
import type { InputRepositoryDdb } from "../../../../adapters/dynamodb/InputRepositoryDdb";
import type { PartyRepositoryDdb } from "../../../../adapters/dynamodb/PartyRepositoryDdb";
import type { GlobalPartyRepositoryDdb } from "../../../../adapters/dynamodb/GlobalPartyRepositoryDdb";
import type { IdempotencyStoreDdb } from "../../../../adapters/dynamodb/IdempotencyStoreDdb";
import type { AuditRepositoryDdb } from "../../../../infraestructure/dynamodb/AuditRepositoryDdb";
import type { ConsentRepositoryDdb } from "../../../../adapters/dynamodb/index";
import type { DelegationRepositoryDdb } from "../../../../adapters/dynamodb/DelegationRepositoryDdb";
import type { IdempotencyKeyHasher } from "../../../../adapters/idempotency/IdempotencyKeyHasher";
import type { IdempotencyRunner } from "../../../../adapters/idempotency/IdempotencyRunner";
import type { RateLimitStoreDdb } from "../../../../adapters/ratelimit/RateLimitStoreDdb";
import type { S3EvidenceStorage } from "../../../../adapters/s3/S3EvidenceStorage";
import type { S3Presigner } from "../../../../adapters/s3/S3Presigner";
import type { S3SignedPdfIngestor } from "../../../../adapters/s3/S3SignedPdfIngestor";
import type { KmsSigner } from "../../../../adapters/kms/KmsSigner";
import type { EventBridgePublisher } from "../../../../adapters/eventbridge/EventBridgePublisher";
import type { SsmParamConfigProvider } from "../../../../adapters/ssm/SsmParamConfigProvider";
import type { Services } from "./Services";
import type { AuditContext } from "./AuditContext";

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
    readonly publisher: EventBridgePublisher;
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

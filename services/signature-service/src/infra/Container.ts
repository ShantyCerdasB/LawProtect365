/**
 * @file Container.ts
 * @summary Dependency Injection (DI) container for the signature-service.
 *
 * @description
 * Provides a singleton container for infrastructure dependencies:
 * - AWS clients (DynamoDB, S3, KMS, EventBridge, SSM)
 * - DynamoDB repositories
 * - Idempotency (store + runner)
 * - S3 storage helpers (evidence, presigner, signed-PDF ingestor)
 * - Cryptography (KMS signer)
 * - Event publishing (EventBridge)
 * - Config provider (SSM-backed)
 * - High-level application services (use cases)
 *
 * Note: This file only adds documentation and organizational comments; business logic
 * and code behavior remain unchanged.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  UpdateCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { KMSClient } from "@aws-sdk/client-kms";
import {
  EventBridgeClient,
  PutEventsCommand,
  type PutEventsCommandInput,
  type PutEventsCommandOutput,
} from "@aws-sdk/client-eventbridge";
import { SSMClient } from "@aws-sdk/client-ssm";

import { loadConfig, type SignatureServiceConfig } from "./Config";

import { DocumentRepositoryDdb } from "../adapters/dynamodb/DocumentRepositoryDdb.js";
import { EnvelopeRepositoryDdb } from "../adapters/dynamodb/EnvelopeRepositoryDb.js";
import { InputRepositoryDdb } from "../adapters/dynamodb/InputRepositoryDdb.js";
import { PartyRepositoryDdb } from "../adapters/dynamodb/PartyRepositoryDdb.js";
import { IdempotencyStoreDdb } from "../adapters/dynamodb/IdempotencyStoreDdb.js";

import { IdempotencyKeyHasher } from "../adapters/idempotency/IdempotencyKeyHasher.js";
import { IdempotencyRunner } from "../adapters/idempotency/IdempotencyRunner.js";

import { S3EvidenceStorage } from "../adapters/s3/S3EvidenceStorage.js";
import { S3Presigner } from "../adapters/s3/S3Presigner.js";
import { S3SignedPdfIngestor } from "../adapters/s3/S3SignedPdfIngestor.js";

import { KmsSigner } from "../adapters/kms/KmsSigner.js";

import { EventBridgePublisher } from "../adapters/eventbridge/EventBridgePublisher.js";
import { SsmParamConfigProvider } from "../adapters/ssm/SsmParamConfigProvider.js";

import type { Envelope } from "@/domain/entities/Envelope";
import type { TenantId, UserId } from "@/domain/value-objects/Ids";
import { createEnvelope } from "@/use-cases/envelopes/CreateEnvelope";
import type { ISODateString, EventEnvelope, DomainEvent } from "@lawprotect/shared-ts";

/**
 * Minimal DynamoDB client contract used by repositories and stores.
 *
 * @public
 * @remarks
 * This lightweight interface allows injecting custom or mocked implementations
 * (e.g., for testing) that wrap `DynamoDBDocumentClient`.
 */
export interface DdbClientLike {
  /**
   * Read a single item by primary key.
   * @param params Table name, key, and optional consistent read flag.
   * @returns Object containing the optional `Item`.
   */
  get(params: {
    TableName: string;
    Key: Record<string, unknown>;
    ConsistentRead?: boolean;
  }): Promise<{ Item?: Record<string, unknown> }>;

  /**
   * Put (insert or replace) an item.
   * @param params Table name, item, and optional condition expression.
   */
  put(params: {
    TableName: string;
    Item: Record<string, unknown>;
    ConditionExpression?: string;
  }): Promise<unknown>;

  /**
   * Delete an item by primary key.
   * @param params Table name, key, and optional condition expression.
   */
  delete(params: {
    TableName: string;
    Key: Record<string, unknown>;
    ConditionExpression?: string;
  }): Promise<unknown>;

  /**
   * Update attributes of an existing item.
   * @param params Update expression, names, values, optional condition and return settings.
   * @returns Optional `Attributes`, depending on `ReturnValues`.
   */
  update?(params: {
    TableName: string;
    Key: Record<string, unknown>;
    UpdateExpression: string;
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, unknown>;
    ConditionExpression?: string;
    ReturnValues?: "ALL_NEW" | "ALL_OLD" | "UPDATED_NEW" | "UPDATED_OLD" | "NONE";
  }): Promise<{ Attributes?: Record<string, unknown> }>;

  /**
   * Query items via key condition (table or index).
   * @param params Key condition, optional index and pagination settings.
   * @returns Items and optional `LastEvaluatedKey` for pagination.
   */
  query?(params: {
    TableName: string;
    IndexName?: string;
    KeyConditionExpression: string;
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, unknown>;
    Limit?: number;
    ScanIndexForward?: boolean;
    ExclusiveStartKey?: Record<string, unknown>;
  }): Promise<{ Items?: Record<string, unknown>[]; LastEvaluatedKey?: Record<string, unknown> }>;
}

/**
 * Application services exposed to controllers.
 *
 * @public
 */
export interface Services {
  envelopes: {
    /**
     * Creates a new envelope (draft) with optional idempotency and emits a domain event.
     *
     * @param input Envelope metadata and optional actor context.
     * @param opts Optional idempotency key and TTL for idempotency record.
     * @returns Newly created envelope.
     */
    create(
      input: {
        tenantId: TenantId;
        ownerId: UserId;
        title: string;
        actor?: {
          userId?: string;
          email?: string;
          ip?: string;
          userAgent?: string;
          locale?: string;
        };
      },
      opts?: { idempotencyKey?: string; ttlSeconds?: number }
    ): Promise<{ envelope: Envelope }>;
  };
}

/**
 * Root DI container type.
 *
 * @public
 */
export interface Container {
  /** Loaded static configuration. */
  config: SignatureServiceConfig;

  /** Low-level AWS SDK clients. */
  aws: {
    ddb: DynamoDBClient;
    s3: S3Client;
    kms: KMSClient;
    evb: EventBridgeClient;
    ssm: SSMClient;
  };

  /** Data access layer (repositories & stores). */
  repos: {
    documents: DocumentRepositoryDdb;
    envelopes: EnvelopeRepositoryDdb;
    inputs: InputRepositoryDdb;
    parties: PartyRepositoryDdb;
    idempotency: IdempotencyStoreDdb;
  };

  /** Idempotency utilities. */
  idempotency: {
    hasher: IdempotencyKeyHasher;
    runner: IdempotencyRunner;
  };

  /** Storage helpers (S3 presigning, evidence storage, PDF ingestion). */
  storage: {
    evidence: S3EvidenceStorage;
    presigner: S3Presigner;
    pdfIngestor: S3SignedPdfIngestor;
  };

  /** Cryptographic utilities. */
  crypto: {
    signer: KmsSigner;
  };

  /** Event publishing utilities. */
  events: {
    publisher: EventBridgePublisher;
  };

  /** Configuration provider backed by SSM Parameter Store (with env fallback). */
  configProvider: SsmParamConfigProvider;

  /** High-level application services. */
  services: Services;
}

let singleton: Container | undefined;

/**
 * Returns the singleton DI container for the signature-service.
 *
 * @remarks
 * Lazily initializes all dependencies on first call:
 * - Loads configuration
 * - Instantiates AWS clients
 * - Wraps DynamoDB with `DynamoDBDocumentClient` and adapts it to `DdbClientLike`
 * - Constructs repositories, idempotency utilities, storage helpers, crypto utilities,
 *   event publisher, and SSM-backed configuration provider
 * - Wires application services (e.g., `envelopes.create`)
 *
 * Subsequent calls return the same instance.
 */
export const getContainer = (): Container => {
  if (singleton) return singleton;

  const config = loadConfig();

  // AWS SDK clients
  const ddb = new DynamoDBClient({ region: config.region });
  const s3 = new S3Client({ region: config.region });
  const kms = new KMSClient({ region: config.region });
  const evb = new EventBridgeClient({ region: config.region });
  const ssm = new SSMClient({ region: config.region });

  // DynamoDB Document wrapper
  const doc = DynamoDBDocumentClient.from(ddb, {
    marshallOptions: { removeUndefinedValues: true },
  });

  const ddbLike: DdbClientLike = {
    async get(p) {
      const out = await doc.send(new GetCommand(p));
      return { Item: out.Item as Record<string, unknown> | undefined };
    },
    async put(p) {
      await doc.send(new PutCommand(p));
    },
    async delete(p) {
      await doc.send(new DeleteCommand(p));
    },
    async update(p) {
      const out = await doc.send(new UpdateCommand(p));
      return { Attributes: out.Attributes as Record<string, unknown> | undefined };
    },
    async query(p) {
      const out = await doc.send(new QueryCommand(p));
      return {
        Items: (out.Items ?? []) as Record<string, unknown>[],
        LastEvaluatedKey: out.LastEvaluatedKey as Record<string, unknown> | undefined,
      };
    },
  };

  // Repositories
  const documents = new DocumentRepositoryDdb(config.ddb.documentsTable, ddbLike);
  const envelopes = new EnvelopeRepositoryDdb(config.ddb.envelopesTable, ddbLike);
  const inputs = new InputRepositoryDdb(config.ddb.inputsTable, ddbLike);
  const parties = new PartyRepositoryDdb(config.ddb.partiesTable, ddbLike);
  const idempotencyStore = new IdempotencyStoreDdb(config.ddb.idempotencyTable, ddbLike);

  // Idempotency helpers
  const hasher = new IdempotencyKeyHasher();
  const runner = new IdempotencyRunner(idempotencyStore, { defaultTtlSeconds: 300 });

  // S3 helpers
  const presigner = new S3Presigner(s3, {
    defaultTtl: config.s3.presignTtlSeconds,
    defaultAcl: config.s3.defaultPublicAcl ? "public-read" : "private",
    defaultCacheControl: config.s3.defaultCacheControl,
    defaultKmsKeyId: config.s3.sseKmsKeyId,
  });

  const evidence = new S3EvidenceStorage(s3, {
    maxAttempts: Number(process.env.S3_MAX_ATTEMPTS ?? 3),
    defaultBucket: config.s3.evidenceBucket,
    defaultKmsKeyId: config.s3.sseKmsKeyId,
    defaultCacheControl: config.s3.defaultCacheControl,
    defaultAcl: config.s3.defaultPublicAcl ? "public-read" : "private",
  });

  const pdfIngestor = new S3SignedPdfIngestor(evidence, {
    defaultBucket: config.s3.signedBucket || config.s3.evidenceBucket,
    defaultRegion: config.region,
    defaultKmsKeyId: config.s3.sseKmsKeyId,
  });

  // KMS signer
  const signer = new KmsSigner(kms, {
    signerKeyId: config.kms.signerKeyId,
    signingAlgorithm: config.kms.signingAlgorithm,
  });

  // EventBridge publisher
  const evbCompat: {
    putEvents: (input: PutEventsCommandInput) => Promise<PutEventsCommandOutput>;
  } = {
    putEvents: (input) => evb.send(new PutEventsCommand(input)),
  };

  const publisher = new EventBridgePublisher({
    busName: config.events.busName,
    source: config.events.source,
    client: evbCompat,
  });

  // SSM-backed config provider
  const configProvider = new SsmParamConfigProvider(ssm, {
    envFallbackPrefix: process.env.SSM_FALLBACK_PREFIX,
    maxAttempts: Number(process.env.SSM_MAX_ATTEMPTS ?? 3),
    defaultTtlMs: Number(process.env.SSM_DEFAULT_TTL_MS ?? 30_000),
  });

  // High-level services
  const services: Services = {
    envelopes: {
      async create(input, opts): Promise<{ envelope: Envelope }> {
        const exec = async () => {
          const out = await createEnvelope(
            {
              tenantId: input.tenantId,
              ownerId: input.ownerId,
              title: input.title,
              actor: input.actor,
            },
            {
              repos: { envelopes },
              ids: {
                ulid: () =>
                  (globalThis as any).crypto?.randomUUID?.() ??
                  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`,
              },
            }
          );

          // Publish domain events to EventBridge
          for (const evt of out.events as Array<DomainEvent<Record<string, unknown>>>) {
            const data: Record<string, unknown> = {
              tenantId: out.envelope.tenantId,
              ...(evt.payload ?? {}), // payload is Record<string, unknown> thanks to the cast above
            };

            const envelope: EventEnvelope = {
              name: evt.type, // (Previously you used "name")
              meta: {
                id:
                  (globalThis as any).crypto?.randomUUID?.() ??
                  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`,
                ts: evt.occurredAt as unknown as ISODateString,
                source: config.events.source,
              },
              data,
            };
            await publisher.publish(envelope);
          }

          return { envelope: out.envelope };
        };

        if (opts?.idempotencyKey) {
          return runner.run(opts.idempotencyKey, exec, opts.ttlSeconds);
        }
        return exec();
      },
    },
  };

  singleton = {
    config,
    aws: { ddb, s3, kms, evb, ssm },
    repos: { documents, envelopes, inputs, parties, idempotency: idempotencyStore },
    idempotency: { hasher, runner },
    storage: { evidence, presigner, pdfIngestor },
    crypto: { signer },
    events: { publisher },
    configProvider,
    services,
  };

  return singleton;
};

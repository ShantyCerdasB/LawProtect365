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
import { AuditRepositoryDdb, ConsentRepositoryDdb } from "../adapters/dynamodb/index";

import { IdempotencyKeyHasher } from "../adapters/idempotency/IdempotencyKeyHasher.js";
import { IdempotencyRunner } from "../adapters/idempotency/IdempotencyRunner.js";
import { RateLimitStoreDdb } from "../adapters/ratelimit/RateLimitStoreDdb.js";

import { S3EvidenceStorage } from "../adapters/s3/S3EvidenceStorage.js";
import { S3Presigner } from "../adapters/s3/S3Presigner.js";
import { S3SignedPdfIngestor } from "../adapters/s3/S3SignedPdfIngestor.js";

import { KmsSigner } from "../adapters/kms/KmsSigner.js";

import { EventBridgePublisher } from "../adapters/eventbridge/EventBridgePublisher.js";
import { SsmParamConfigProvider } from "../adapters/ssm/SsmParamConfigProvider.js";
import { DelegationRepositoryDdb } from "../adapters/dynamodb/DelegationRepositoryDdb.js";
import type { Envelope } from "@/domain/entities/Envelope";
import type { TenantId, UserId } from "@/domain/value-objects/Ids";
import { createEnvelope } from "@/use-cases/envelopes/CreateEnvelope";
import { type ISODateString, type EventEnvelope, type DomainEvent, randomToken, uuid, ulid, DdbClientLike } from "@lawprotect/shared-ts";

/**
 * @description Application services exposed to controllers.
 * Provides high-level business operations for envelope management.
 *
 * @public
 */
export interface Services {
  /** Envelope-related business operations */
  envelopes: {
    /**
     * @description Creates a new envelope with the specified parameters.
     *
     * @param input - Envelope creation parameters including tenant, owner, title, and actor
     * @param opts - Optional idempotency and TTL settings
     * @returns Promise resolving to the created envelope
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
 * @description Root DI container type.
 * Contains all infrastructure dependencies and application services.
 *
 * @public
 */
export interface Container {
  /** Application configuration */
  config: SignatureServiceConfig;

  aws: {
    ddb: DynamoDBClient;
    s3: S3Client;
    kms: KMSClient;
    evb: EventBridgeClient;
    ssm: SSMClient;
  };

  repos: {
    documents: DocumentRepositoryDdb;
    envelopes: EnvelopeRepositoryDdb;
    inputs: InputRepositoryDdb;
    parties: PartyRepositoryDdb;
    audit: AuditRepositoryDdb;
    idempotency: IdempotencyStoreDdb;
    consents: ConsentRepositoryDdb;
    delegations: DelegationRepositoryDdb;
  };

  idempotency: {
    hasher: IdempotencyKeyHasher;
    runner: IdempotencyRunner;
  };

  rateLimit: {
    otpStore: RateLimitStoreDdb;
  };

  storage: {
    evidence: S3EvidenceStorage;
    presigner: S3Presigner;
    pdfIngestor: S3SignedPdfIngestor;
  };

  crypto: {
    signer: KmsSigner;
  };

  events: {
    publisher: EventBridgePublisher;
  };

  configProvider: SsmParamConfigProvider;

  services: Services;

  ids: {
    ulid(): string;
    uuid(): string;
    token(bytes?: number): string;
  };

  time: {
    now(): number;
  };
}

let singleton: Container;

/**
 * Returns the singleton DI container for the signature-service.
 *
 * @remarks
 * Lazily initializes all dependencies on first call and reuses them afterwards.
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
  const audit = new AuditRepositoryDdb({
    tableName: config.ddb.auditTable || config.ddb.envelopesTable,
    client: ddbLike,
  });
  const idempotencyStore = new IdempotencyStoreDdb(config.ddb.idempotencyTable, ddbLike);
  const consents = new ConsentRepositoryDdb(config.ddb.envelopesTable, ddbLike);

  // Idempotency helpers
  const hasher = new IdempotencyKeyHasher();
  const runner = new IdempotencyRunner(idempotencyStore, { defaultTtlSeconds: 300 });

  // Rate limiting helpers
  const otpRateLimitStore = new RateLimitStoreDdb(config.ddb.idempotencyTable, ddbLike);
  const delegations = new DelegationRepositoryDdb(config.ddb.envelopesTable, ddbLike);

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
                ulid: () => ulid(),
              },
            }
          );

          for (const evt of out.events as Array<DomainEvent<Record<string, unknown>>>) {
            const data: Record<string, unknown> = {
              tenantId: out.envelope.tenantId,
              ...(evt.payload ?? {}),
            };

            const envelope: EventEnvelope = {
              name: evt.type,
              meta: {
                id: ulid(),
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

  const ids = {
    ulid,
    uuid,
    token: (bytes = 32) => randomToken(bytes),
  };

  const time = { now: () => Date.now() };

  singleton = {
    config,
    aws: { ddb, s3, kms, evb, ssm },
    repos: { documents, envelopes, inputs, parties, audit, idempotency: idempotencyStore, consents, delegations },
    idempotency: { hasher, runner },
    rateLimit: { otpStore: otpRateLimitStore },
    storage: { evidence, presigner, pdfIngestor },
    crypto: { signer },
    events: { publisher },
    configProvider,
    services,
    ids,
    time,
  };

  return singleton;
};

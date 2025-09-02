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
} from "@aws-sdk/client-eventbridge";
import { SSMClient } from "@aws-sdk/client-ssm";

import { loadConfig } from "./Config";

import { DocumentRepositoryDdb } from "../infrastructure/dynamodb/DocumentRepositoryDdb";
import { EnvelopeRepositoryDdb } from "../infrastructure/dynamodb/EnvelopeRepositoryDb";
import { InputRepositoryDdb } from "../infrastructure/dynamodb/InputRepositoryDdb";
import { PartyRepositoryDdb } from "../infrastructure/dynamodb/PartyRepositoryDdb";
import { GlobalPartyRepositoryDdb } from "../infrastructure/dynamodb/GlobalPartyRepositoryDdb";
import { IdempotencyStoreDdb } from "../infrastructure/dynamodb/IdempotencyStoreDdb";
import { AuditRepositoryDdb } from "../infrastructure/dynamodb/AuditRepositoryDdb";
import { ConsentRepositoryDdb } from "../infrastructure/dynamodb/index";

import { IdempotencyKeyHasher } from "../infrastructure/idempotency/IdempotencyKeyHasher";
import { IdempotencyRunner } from "../infrastructure/idempotency/IdempotencyRunner";
import { RateLimitStoreDdb } from "../infrastructure/ratelimit/RateLimitStoreDdb";

import { S3EvidenceStorage } from "../infrastructure/s3/S3EvidenceStorage";
import { S3Presigner } from "../infrastructure/s3/S3Presigner";
import { S3SignedPdfIngestor } from "../infrastructure/s3/S3SignedPdfIngestor";

import { KmsSigner } from "../infrastructure/kms/KmsSigner";

import { SsmParamConfigProvider } from "../infrastructure/ssm/SsmParamConfigProvider";
import { DelegationRepositoryDdb } from "../infrastructure/dynamodb/DelegationRepositoryDdb";

import { randomToken, uuid, ulid, DdbClientLike, makeEventPublisher } from "@lawprotect/shared-ts";
import type { Container, Services } from "../shared/contracts";

import { OutboxRepositoryDdb } from "../infrastructure/dynamodb/OutboxRepositoryDdb";
import { EventBusPortAdapter } from "../infrastructure/eventbridge/EventBusPortAdapter";
import { OutboxProcessor } from "../infrastructure/workers/OutboxProcessor";
import { MetricsService } from "../shared/services";

// EventBridge types
import type { EventBridgeClientPort, PutEventsRequest, PutEventsResponse } from "../shared/contracts/eventbridge/EventBridgeClientPort";

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
  const globalParties = new GlobalPartyRepositoryDdb(config.ddb.partiesTable, ddbLike);
  const audit = new AuditRepositoryDdb(
    config.ddb.auditTable || config.ddb.envelopesTable,
    ddbLike
  );
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
  const evbCompat: EventBridgeClientPort = {
    putEvents: async (input: PutEventsRequest): Promise<PutEventsResponse> => {
      const result = await evb.send(new PutEventsCommand({
        Entries: input.Entries.map(entry => ({
          Source: entry.Source,
          DetailType: entry.DetailType,
          Detail: entry.Detail,
          EventBusName: entry.EventBusName,
          Time: entry.Time,
          Region: entry.Region,
          Resources: entry.Resources,
          TraceHeader: entry.TraceHeader,
        }))
      }));
      
      return {
        FailedEntryCount: result.FailedEntryCount || 0,
        FailedEntries: [],
        Entries: [],
      };
    },
  };

  // SSM-backed config provider
  const configProvider = new SsmParamConfigProvider(ssm, {
    envFallbackPrefix: process.env.SSM_FALLBACK_PREFIX,
    maxAttempts: Number(process.env.SSM_MAX_ATTEMPTS ?? 3),
    defaultTtlMs: Number(process.env.SSM_DEFAULT_TTL_MS ?? 30_000),
  });

  // High-level services
  const services: Services = {
    envelopes: {
      async create(input, opts): Promise<{ envelope: any }> {
        // TODO: Implement envelope creation logic
        // For now, return a placeholder to avoid compilation errors
        throw new Error("Envelope creation not yet implemented");
      },
    },
  };

  const ids = {
    ulid,
    uuid,
    token: (bytes = 32) => randomToken(bytes),
  };

  const time = { now: () => Date.now() };

  // Metrics service for CloudWatch custom metrics
  const metricsService = new MetricsService({
    namespace: config.metrics.namespace,
    region: config.metrics.region,
    enabled: config.metrics.enableOutboxMetrics,
  });

  // Event bus adapter
  const eventBus = new EventBusPortAdapter({
    busName: config.events.busName,
    source: config.events.source,
    client: evbCompat,
  });

  // Outbox repository for reliable event publishing
  const outbox = new OutboxRepositoryDdb({
    tableName: config.ddb.outboxTable,
    client: ddbLike,
  });

  // Create event publisher using makeEventPublisher from shared-ts
  const eventPublisher = makeEventPublisher(eventBus, outbox);

  singleton = {
    config,
    aws: { ddb, s3, kms, evb, ssm },
    repos: { documents, envelopes, inputs, parties, globalParties, audit, idempotency: idempotencyStore, consents, delegations, outbox },
    idempotency: { hasher, runner },
    rateLimit: { otpStore: otpRateLimitStore },
    storage: { evidence, presigner, pdfIngestor },
    crypto: { signer },
    events: { eventPublisher },
    audit: {
      log: async (action: string, details: any, context: any) => {
        // Use the audit repository to log audit events
        await audit.record({
          type: action,
          metadata: details,
          actor: context,
          occurredAt: new Date().toISOString(),
          tenantId: context?.tenantId || "default",
          envelopeId: context?.envelopeId || "system",
        });
      }
    },
    configProvider,
    services,
    ids,
    time,
  };

  return singleton;
};

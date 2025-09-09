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
import { InputRepositoryDdb } from "../infrastructure/dynamodb/InputRepositoryDdb";
import { PartyRepositoryDdb } from "../infrastructure/dynamodb/PartyRepositoryDdb";

import { 
  IdempotencyStoreDdb, 
  IdempotencyKeyHasher, 
  IdempotencyRunner,
  RateLimitStoreDdb, 
  S3EvidenceStorage, 
  S3Presigner,
  KmsSigner, 
  SsmParamConfigProvider,
  randomToken, 
  uuid, 
  ulid, 
  DdbClientLike, 
  makeEventPublisher,
  OutboxRepositoryDdb, 
  EventBusPortAdapter, 
  MetricsService,
  type EventBridgeClientPort, 
  type PutEventsRequest, 
  type PutEventsResponse
} from "@lawprotect/shared-ts";
import { AuditRepositoryDdb } from "../infrastructure/dynamodb/AuditRepositoryDdb";
import { ConsentRepositoryDdb } from "../infrastructure/dynamodb/index";
import { GlobalPartiesRepositoryDdb } from "../infrastructure/dynamodb/GlobalPartiesRepositoryDdb";
import { S3SignedPdfIngestor } from "../infrastructure/s3/S3SignedPdfIngestor";
import { DelegationRepositoryDdb } from "../infrastructure/dynamodb/DelegationRepositoryDdb";
import type { Container } from "../infrastructure/contracts/core";

import { ConsentValidationService } from "../app/services/Consent/ConsentValidationService";
import { ConsentAuditService } from "../app/services/Consent/ConsentAuditService";
import { ConsentEventService } from "../app/services/Consent/ConsentEventService";
import { makeConsentQueryPort } from "../app/adapters/consent/MakeConsentQueryPort";

import { DefaultGlobalPartiesValidationService } from "../app/services/GlobalParties/GlobalPartiesValidationService";
import { GlobalPartiesAuditService } from "../app/services/GlobalParties/GlobalPartiesAuditService";
import { GlobalPartiesEventService } from "../app/services/GlobalParties/GlobalPartiesEventService";
import { makeGlobalPartiesCommandsPort } from "../app/adapters/global-parties/MakeGlobalPartiesCommandsPort";
import { makeGlobalPartiesQueriesPort } from "../app/adapters/global-parties/MakeGlobalPartiesQueriesPort";

import { PartiesValidationService } from "../app/services/Parties/PartiesValidationService";
import { PartiesAuditService } from "../app/services/Parties/PartiesAuditService";
import { PartiesEventService } from "../app/services/Parties/PartiesEventService";
import { PartiesRateLimitService } from "../app/services/Parties/PartiesRateLimitService";
import { makePartiesCommandsPort } from "../app/adapters/parties/MakePartiesCommandsPort";
import { makePartiesQueriesPort } from "../app/adapters/parties/MakePartiesQueriesPort";
import { EnvelopeRepositoryDdb } from "@/infrastructure/dynamodb/EnvelopeRepositoryDdb";

// Envelopes services
import { EnvelopesValidationService } from "../app/services/envelopes/EnvelopesValidationService";
import { EnvelopesAuditService } from "../app/services/envelopes/EnvelopesAuditService";
import { EnvelopesEventService } from "../app/services/envelopes/EnvelopesEventService";
import { makeEnvelopesCommandsPort } from "../app/adapters/envelopes/makeEnvelopesCommandsPort";
import { makeEnvelopesQueriesPort } from "../app/adapters/envelopes/MakeEnvelopesQueriesPort";

// Documents services
import { DefaultDocumentsValidationService } from "../app/services/Documents/DocumentsValidationService";
import { DefaultDocumentsAuditService } from "../app/services/Documents/DocumentsAuditService";
import { DefaultDocumentsEventService } from "../app/services/Documents/DocumentsEventService";
import { DefaultDocumentsRateLimitService } from "../app/services/Documents/DocumentsRateLimitService";
import { DefaultDocumentsS3Service } from "../app/services/Documents/DocumentsS3Service";
import { makeDocumentsCommandsPort } from "../app/adapters/documents/makeDocumentsCommandsPort";
import { makeDocumentsQueriesPort } from "../app/adapters/documents/makeDocumentsQueriesPort";

// Inputs services
import { InputsValidationService } from "../app/services/Inputs/InputsValidationService";
import { InputsAuditService } from "../app/services/Inputs/InputsAuditService";
import { InputsEventService } from "../app/services/Inputs/InputsEventService";
import { makeInputsCommandsPort } from "../app/adapters/inputs/makeInputsCommandsPort";
import { makeInputsQueriesPort } from "../app/adapters/inputs/makeInputsQueriesPort";

// Requests services
import { DefaultRequestsValidationService } from "../app/services/Requests/RequestsValidationService";
import { DefaultRequestsAuditService } from "../app/services/Requests/RequestsAuditService";
import { DefaultRequestsEventService } from "../app/services/Requests/RequestsEventService";
import { DefaultRequestsRateLimitService } from "../app/services/Requests/RequestsRateLimitService";
import { makeRequestsCommandsPort } from "../app/adapters/requests/makeRequestsCommandsPort";
import { makeSigningCommandsPort } from "../app/adapters/signing/makeSigningCommandsPort";
import { makeSignaturesCommandsPort } from "../app/adapters/signatures/makeSignaturesCommandsPort";

// Certificate services
import { DefaultCertificateValidationService } from "../app/services/Certificate";

// Audit services
import { makeAuditCommandsPort, makeAuditQueriesPort } from "../app/adapters/audit";

// Signing services
import { 
  DefaultSigningValidationService,
  DefaultSigningCommandService,
  DefaultSigningEventService,
  DefaultSigningAuditService,
  DefaultSigningRateLimitService,
  DefaultSigningS3Service
} from "../app/services/Signing";

// Signatures services
import { DefaultSignaturesCommandService } from "../app/services/Signatures";
import { makeCertificateQueriesPort } from "../app/adapters/certificate/makeCertificateQueriesPort";

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
  const globalParties = new GlobalPartiesRepositoryDdb(config.ddb.envelopesTable, ddbLike);
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

  // Consent services - instantiate with correct dependencies
  const consentQueries = makeConsentQueryPort(consents);
  const consentValidation = new ConsentValidationService(consentQueries);
  const consentAudit = new ConsentAuditService(audit);
  const consentEvents = new ConsentEventService(outbox);

  // Global Parties services - instantiate with correct dependencies
  const globalPartiesValidation = new DefaultGlobalPartiesValidationService();
  const globalPartiesAudit = new GlobalPartiesAuditService(audit);
  const globalPartiesEvents = new GlobalPartiesEventService(outbox);
  
  const globalPartiesCommands = makeGlobalPartiesCommandsPort({
    globalParties,
    ids,
    validationService: globalPartiesValidation,
    auditService: globalPartiesAudit,
    eventService: globalPartiesEvents,
  });
  const globalPartiesQueries = makeGlobalPartiesQueriesPort({ globalParties });

  // Parties services - instantiate with correct dependencies
  const partiesValidation = new PartiesValidationService();
  const partiesAudit = new PartiesAuditService(audit);
  const partiesEvents = new PartiesEventService(outbox);
  
  // ✅ RATE LIMITING - Configuración por tenant
  const partiesRateLimit = new PartiesRateLimitService(
    otpRateLimitStore,
    { 
      maxPartiesPerEnvelope: 50, 
      windowSeconds: 3600, // 1 hora
      ttlSeconds: 7200     // 2 horas
    }
  );
  
  const partiesCommands = makePartiesCommandsPort(
    parties,
    ids,
    partiesValidation,
    partiesAudit,
    partiesEvents,
    // ✅ IDEMPOTENCY - PATRÓN REUTILIZABLE
    runner,
    // ✅ RATE LIMITING - PATRÓN REUTILIZABLE
    partiesRateLimit
  );
  const partiesQueries = makePartiesQueriesPort(parties);

  // Documents services - instantiate with correct dependencies
  const documentsValidation = new DefaultDocumentsValidationService();
  const documentsAudit = new DefaultDocumentsAuditService(audit);
  const documentsEvents = new DefaultDocumentsEventService(outbox);
  const documentsRateLimit = new DefaultDocumentsRateLimitService(otpRateLimitStore);

  // Envelopes services - instantiate with correct dependencies
  const envelopesValidation = new EnvelopesValidationService();
  const envelopesAudit = new EnvelopesAuditService(audit);
  const envelopesEvents = new EnvelopesEventService(outbox);
  
  const envelopesCommands = makeEnvelopesCommandsPort({
    envelopesRepo: envelopes,
    ids,
    config: config as any, // Cast to resolve type mismatch between core/Config and shared/types/core/config
    partiesRepo: parties,
    inputsRepo: inputs,
    validationService: envelopesValidation,
    auditService: envelopesAudit,
    eventService: envelopesEvents,
    rateLimitService: documentsRateLimit // Use DocumentsRateLimitService for envelope operations
  });
  const envelopesQueries = makeEnvelopesQueriesPort(envelopes);

  // Inputs services - instantiate with correct dependencies
  const inputsValidation = new InputsValidationService();
  const inputsAudit = new InputsAuditService(audit);
  const inputsEvents = new InputsEventService(outbox);
  
  const inputsCommands = makeInputsCommandsPort({
    inputsRepo: inputs,
    ids,
    partiesRepo: parties,
    documentsRepo: documents,
    envelopesRepo: envelopes,
    validationService: inputsValidation,
    auditService: inputsAudit,
    eventService: inputsEvents,
    idempotencyRunner: runner
  });
  const inputsQueries = makeInputsQueriesPort(
    inputs,
    inputsValidation,
    inputsAudit
  );

  // Create S3 adapter for DocumentsS3Service
  const documentsS3Adapter = {
    putObjectUrl: async (bucket: string, key: string, contentType: string, expiresIn?: number) => {
      return await presigner.putObjectUrl({
        bucket,
        key,
        contentType,
        expiresInSeconds: expiresIn,
      });
    },
    getObjectUrl: async (bucket: string, key: string, expiresIn?: number) => {
      return await presigner.getObjectUrl({
        bucket,
        key,
        expiresInSeconds: expiresIn,
      });
    },
  };
  
  const documentsS3 = new DefaultDocumentsS3Service(documentsS3Adapter);
  
  const documentsCommands = makeDocumentsCommandsPort({
    documentsRepo: documents,
    envelopesRepo: envelopes,
    ids,
    s3Service: documentsS3,
    s3Config: {
      evidenceBucket: config.s3.evidenceBucket,
      signedBucket: config.s3.signedBucket,
    },
  });
  const documentsQueries = makeDocumentsQueriesPort(documents);

  // Requests services - instantiate with correct dependencies
  const requestsValidation = new DefaultRequestsValidationService(inputs);
  const requestsAudit = new DefaultRequestsAuditService(audit);
  const requestsEvents = new DefaultRequestsEventService(outbox);
  const requestsRateLimit = new DefaultRequestsRateLimitService(otpRateLimitStore);
  
  const requestsCommands = makeRequestsCommandsPort({
    repositories: {
      envelopes,
      parties,
      inputs
    },
    services: {
      validation: requestsValidation,
      audit: requestsAudit,
      event: requestsEvents,
      rateLimit: requestsRateLimit
    },
    infrastructure: {
      ids,
      s3Presigner: presigner
    }
  });

  // Certificate services - instantiate with correct dependencies
  const certificateValidation = new DefaultCertificateValidationService();
  
  const certificateQueries = makeCertificateQueriesPort(
    audit,
    envelopes,
    certificateValidation
  );

  // Audit services - instantiate with correct dependencies
  const auditCommands = makeAuditCommandsPort({ auditRepo: audit });
  const auditQueries = makeAuditQueriesPort({ 
    auditRepo: audit,
    defaultPageSize: config.audit?.defaultPageSize ?? 50
  });

  // Signing services - instantiate with correct dependencies
  const signingValidation = new DefaultSigningValidationService();
  const signingEvent = new DefaultSigningEventService(outbox);
  const signingAudit = new DefaultSigningAuditService(audit);
  const signingRateLimit = new DefaultSigningRateLimitService(otpRateLimitStore);
  const signingS3 = new DefaultSigningS3Service(
    presigner,
    config.s3.evidenceBucket,
    config.s3.signedBucket,
    config.s3.presignTtlSeconds,
    config.s3.presignTtlSeconds
  );

  const signingCommands = makeSigningCommandsPort(
    envelopes,
    parties,
    documents,
    {
      events: eventBus,
      ids,
      time,
      rateLimit: signingRateLimit,
      signer,
      idempotency: runner,
      signingConfig: {
        defaultKeyId: config.kms.signerKeyId,
        allowedAlgorithms: [config.kms.signingAlgorithm],
      },
      uploadConfig: {
        uploadBucket: config.s3.evidenceBucket,
        uploadTtlSeconds: config.s3.presignTtlSeconds,
      },
      downloadConfig: {
        signedBucket: config.s3.signedBucket,
        downloadTtlSeconds: config.s3.presignTtlSeconds,
      },
      s3Service: signingS3,
    }
  );

  const signingCommand = new DefaultSigningCommandService(signingCommands);

  // Signatures services - instantiate with correct dependencies
  const signaturesCommands = makeSignaturesCommandsPort(
    signer,
    {
      defaultKeyId: config.kms.signerKeyId,
      allowedAlgorithms: [config.kms.signingAlgorithm],
    }
  );

  const signaturesCommand = new DefaultSignaturesCommandService(signaturesCommands);

  singleton = {
    config,
    aws: { ddb, s3, kms, evb, ssm },
    repos: { documents, envelopes, inputs, parties, globalParties, audit, idempotency: idempotencyStore, consents, delegations, outbox },
    idempotency: { hasher, runner },
    rateLimit: { otpStore: otpRateLimitStore },
    storage: { evidence, presigner, pdfIngestor },
    crypto: { signer },
    events: { eventPublisher },
    consent: {
      validation: consentValidation,
      audit: consentAudit,
      events: consentEvents,
      party: globalParties,
    },
    globalParties: {
      commandsPort: globalPartiesCommands,
      queriesPort: globalPartiesQueries,
      validationService: globalPartiesValidation,
      auditService: globalPartiesAudit,
      eventService: globalPartiesEvents,
    },
            parties: {
          commandsPort: partiesCommands,
          queriesPort: partiesQueries,
          validationService: partiesValidation,
          auditService: partiesAudit,
          eventService: partiesEvents,
          rateLimitService: partiesRateLimit,
        },
        envelopes: {
          commandsPort: envelopesCommands,
          queriesPort: envelopesQueries,
          validationService: envelopesValidation,
          auditService: envelopesAudit,
          eventService: envelopesEvents,
        },
        inputs: {
          commandsPort: inputsCommands,
          queriesPort: inputsQueries,
          validationService: inputsValidation,
          auditService: inputsAudit,
          eventService: inputsEvents,
        },
        documents: {
          commandsPort: documentsCommands,
          queriesPort: documentsQueries,
          validationService: documentsValidation,
          auditService: documentsAudit,
          eventService: documentsEvents,
          rateLimitService: documentsRateLimit,
          s3Service: documentsS3,
        },
        requests: {
          commandsPort: requestsCommands,
          validationService: requestsValidation,
          auditService: requestsAudit,
          eventService: requestsEvents,
          rateLimitService: requestsRateLimit,
        },
        certificate: {
          queriesPort: certificateQueries,
          validationService: certificateValidation,
        },
        signing: {
          commandsPort: signingCommands,
          command: signingCommand,
          validationService: signingValidation,
          eventService: signingEvent,
          auditService: signingAudit,
          rateLimitService: signingRateLimit,
          s3Service: signingS3,
        },
        signatures: {
          commandsPort: signaturesCommands,
          command: signaturesCommand,
        },
        audit: {
          commandsPort: auditCommands,
          queriesPort: auditQueries,
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
    ids,
    time,
    metricsService,
  };

  return singleton;
};








import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  UpdateCommand,
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

export interface DdbClientLike {
  get(params: { TableName: string; Key: Record<string, unknown>; ConsistentRead?: boolean }): Promise<{ Item?: Record<string, unknown> }>;
  put(params: { TableName: string; Item: Record<string, unknown>; ConditionExpression?: string }): Promise<unknown>;
  delete(params: { TableName: string; Key: Record<string, unknown>; ConditionExpression?: string }): Promise<unknown>;
  update?(params: {
    TableName: string;
    Key: Record<string, unknown>;
    UpdateExpression: string;
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, unknown>;
    ConditionExpression?: string;
    ReturnValues?: "ALL_NEW" | "ALL_OLD" | "UPDATED_NEW" | "UPDATED_OLD" | "NONE";
  }): Promise<{ Attributes?: Record<string, unknown> }>;
}

export interface Container {
  config: SignatureServiceConfig;
  aws: { ddb: DynamoDBClient; s3: S3Client; kms: KMSClient; evb: EventBridgeClient; ssm: SSMClient };
  repos: {
    documents: DocumentRepositoryDdb;
    envelopes: EnvelopeRepositoryDdb;
    inputs: InputRepositoryDdb;
    parties: PartyRepositoryDdb;
    idempotency: IdempotencyStoreDdb;
  };
  idempotency: { hasher: IdempotencyKeyHasher; runner: IdempotencyRunner };
  storage: { evidence: S3EvidenceStorage; presigner: S3Presigner; pdfIngestor: S3SignedPdfIngestor };
  crypto: { signer: KmsSigner };
  events: { publisher: EventBridgePublisher };
  configProvider: SsmParamConfigProvider;
}

let singleton: Container | undefined;

export const getContainer = (): Container => {
  if (singleton) return singleton;

  const config = loadConfig();

  // AWS clients
  const ddb = new DynamoDBClient({ region: config.region });
  const s3 = new S3Client({ region: config.region });
  const kms = new KMSClient({ region: config.region });
  const evb = new EventBridgeClient({ region: config.region });
  const ssm = new SSMClient({ region: config.region });

  // DDB wrapper (cumple DdbClientLike)
  const doc = DynamoDBDocumentClient.from(ddb);
  const ddbLike: DdbClientLike = {
    async get(p) { const out = await doc.send(new GetCommand(p)); return { Item: out.Item as any }; },
    async put(p) { await doc.send(new PutCommand(p)); },
    async delete(p) { await doc.send(new DeleteCommand(p)); },
    async update(p) { const out = await doc.send(new UpdateCommand(p)); return { Attributes: out.Attributes as any }; },
  };

  // Repos: (tableName, ddb)
  const documents = new DocumentRepositoryDdb(config.ddb.documentsTable, ddbLike);
  const envelopes = new EnvelopeRepositoryDdb(config.ddb.envelopesTable, ddbLike);
  const inputs = new InputRepositoryDdb(config.ddb.inputsTable, ddbLike);
  const parties = new PartyRepositoryDdb(config.ddb.partiesTable, ddbLike);
  const idempotencyStore = new IdempotencyStoreDdb(config.ddb.idempotencyTable, ddbLike);

  // Idempotency
  const hasher = new IdempotencyKeyHasher();
  const runner = new IdempotencyRunner(idempotencyStore, hasher);

  // S3 helpers: (client, options)
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

  const pdfIngestor = new S3SignedPdfIngestor(s3, {
    defaultBucket: config.s3.signedBucket || config.s3.evidenceBucket,
    defaultKmsKeyId: config.s3.sseKmsKeyId,
  });

  // KMS
  const signer = new KmsSigner(kms, {
    signerKeyId: config.kms.signerKeyId,
    signingAlgorithm: config.kms.signingAlgorithm,
  });

  // EventBridge
  const evbCompat: { putEvents: (input: PutEventsCommandInput) => Promise<PutEventsCommandOutput> } = {
    putEvents: (input) => evb.send(new PutEventsCommand(input)),
  };
  const publisher = new EventBridgePublisher(evbCompat, config.events.busName, config.events.source);

  // SSM
  const configProvider = new SsmParamConfigProvider(ssm, {
    envFallbackPrefix: process.env.SSM_FALLBACK_PREFIX,
    maxAttempts: Number(process.env.SSM_MAX_ATTEMPTS ?? 3),
    defaultTtlMs: Number(process.env.SSM_DEFAULT_TTL_MS ?? 30_000),
    basePath: config.ssm?.basePath,
  });

  singleton = {
    config,
    aws: { ddb, s3, kms, evb, ssm },
    repos: { documents, envelopes, inputs, parties, idempotency: idempotencyStore },
    idempotency: { hasher, runner },
    storage: { evidence, presigner, pdfIngestor },
    crypto: { signer },
    events: { publisher },
    configProvider,
  };

  return singleton;
};

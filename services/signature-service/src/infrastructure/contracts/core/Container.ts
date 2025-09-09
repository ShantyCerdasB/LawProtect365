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

import type { SignatureServiceConfig } from "../../../core/Config";
import type { DocumentRepositoryDdb } from "../../../infrastructure/dynamodb/DocumentRepositoryDdb";
import type { InputRepositoryDdb } from "../../../infrastructure/dynamodb/InputRepositoryDdb";
import type { PartyRepositoryDdb } from "../../../infrastructure/dynamodb/PartyRepositoryDdb";
import type { GlobalPartiesRepositoryDdb } from "../../../infrastructure/dynamodb/GlobalPartiesRepositoryDdb";
import type { IdempotencyStoreDdb, EventPublisher, IdempotencyKeyHasher, IdempotencyRunner, RateLimitStoreDdb, S3EvidenceStorage, S3Presigner, KmsSigner, SsmParamConfigProvider, AuditContext, MetricsService } from "@lawprotect/shared-ts";
import type { AuditRepositoryDdb } from "../../../infrastructure/dynamodb/AuditRepositoryDdb";
import type { ConsentRepositoryDdb } from "../../../infrastructure/dynamodb/ConsentRepositoryDdb";
import type { DelegationRepositoryDdb } from "../../../infrastructure/dynamodb/DelegationRepositoryDdb";
import type { OutboxPort } from "@lawprotect/shared-ts";
import type { S3SignedPdfIngestor } from "../../../infrastructure/s3/S3SignedPdfIngestor";

// Consent service types
import type { ConsentValidationService } from "../../../app/services/Consent/ConsentValidationService";
import type { ConsentAuditService } from "../../../app/services/Consent/ConsentAuditService";
import type { ConsentEventService } from "../../../app/services/Consent/ConsentEventService";
import type { GlobalPartiesRepository } from "../../../domain/contracts/repositories/global-parties/GlobalPartiesRepository";
import type { EnvelopeRepositoryDdb } from "../../../infrastructure/dynamodb/EnvelopeRepositoryDdb";

// Port types
import type { GlobalPartiesCommandsPort } from "../../../app/ports/global-parties/GlobalPartiesCommandsPort";
import type { GlobalPartiesQueriesPort } from "../../../app/ports/global-parties/GlobalPartiesQueriesPort";
import type { GlobalPartiesValidationService } from "../../../app/services/GlobalParties/GlobalPartiesValidationService";
import type { GlobalPartiesAuditService } from "../../../app/services/GlobalParties/GlobalPartiesAuditService";
import type { GlobalPartiesEventService } from "../../../app/services/GlobalParties/GlobalPartiesEventService";

import type { PartiesCommandsPort } from "../../../app/ports/parties/PartiesCommandsPort";
import type { PartiesQueriesPort } from "../../../app/ports/parties/PartiesQueriesPort";
import type { PartiesValidationService } from "../../../app/services/Parties/PartiesValidationService";
import type { PartiesAuditService } from "../../../app/services/Parties/PartiesAuditService";
import type { PartiesEventService } from "../../../app/services/Parties/PartiesEventService";
import type { PartiesRateLimitService } from "../../../app/services/Parties/PartiesRateLimitService";

import type { EnvelopesCommandsPort } from "../../../app/ports/envelopes/EnvelopesCommandsPort";
import type { EnvelopesQueriesPort } from "../../../app/ports/envelopes/EnvelopesQueriesPort";
import type { EnvelopesValidationService } from "../../../app/services/envelopes/EnvelopesValidationService";
import type { EnvelopesAuditService } from "../../../app/services/envelopes/EnvelopesAuditService";
import type { EnvelopesEventService } from "../../../app/services/envelopes/EnvelopesEventService";

import type { InputsCommandsPort } from "../../../app/ports/inputs/InputsCommandsPort";
import type { InputsQueriesPort } from "../../../app/ports/inputs/InputsQueriesPort";
import type { InputsValidationService } from "../../../app/services/Inputs/InputsValidationService";
import type { InputsAuditService } from "../../../app/services/Inputs/InputsAuditService";
import type { InputsEventService } from "../../../app/services/Inputs/InputsEventService";

import type { DocumentsCommandsPort } from "../../../app/ports/documents/DocumentsCommandsPort";
import type { DocumentsQueriesPort } from "../../../app/ports/documents/DocumentsQueriesPort";
import type { DefaultDocumentsValidationService } from "../../../app/services/Documents/DocumentsValidationService";
import type { DefaultDocumentsAuditService } from "../../../app/services/Documents/DocumentsAuditService";
import type { DefaultDocumentsEventService } from "../../../app/services/Documents/DocumentsEventService";
import type { DefaultDocumentsRateLimitService } from "../../../app/services/Documents/DocumentsRateLimitService";
import type { DefaultDocumentsS3Service } from "../../../app/services/Documents/DocumentsS3Service";

import type { RequestsCommandsPort } from "../../../app/ports/requests/RequestsCommandsPort";
import type { RequestsValidationService } from "../../../app/services/Requests/RequestsValidationService";
import type { RequestsAuditService } from "../../../app/services/Requests/RequestsAuditService";
import type { RequestsEventService } from "../../../app/services/Requests/RequestsEventService";
import type { RequestsRateLimitService } from "../../../app/services/Requests/RequestsRateLimitService";

import type { CertificateQueriesPort } from "../../../app/ports/certificate/CertificateQueriesPort";
import type { DefaultCertificateValidationService } from "../../../app/services/Certificate";

import type { SigningCommandsPort } from "../../../app/ports/signing/SigningCommandsPort";
import type { SigningCommandService, SigningValidationService, SigningEventService, SigningAuditService, SigningRateLimitService, SigningS3Service } from "../../../app/services/Signing";

import type { SignaturesCommandsPort } from "../../../app/ports/signatures/SignaturesCommandsPort";
import type { SignaturesCommandService } from "../../../app/services/Signatures";

import type { AuditCommandsPort } from "../../../app/ports/audit/AuditCommandsPort";
import type { AuditQueriesPort } from "../../../app/ports/audit/AuditQueriesPort";

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
    readonly globalParties: GlobalPartiesRepositoryDdb;
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

  /** Consent services */
  readonly consent: {
    readonly validation: ConsentValidationService;
    readonly audit: ConsentAuditService;
    readonly events: ConsentEventService;
    readonly party: GlobalPartiesRepository;
  };

  /** Global Parties services */
  readonly globalParties: {
    readonly commandsPort: GlobalPartiesCommandsPort;
    readonly queriesPort: GlobalPartiesQueriesPort;
    readonly validationService: GlobalPartiesValidationService;
    readonly auditService: GlobalPartiesAuditService;
    readonly eventService: GlobalPartiesEventService;
  };

  /** Parties services */
  readonly parties: {
    readonly commandsPort: PartiesCommandsPort;
    readonly queriesPort: PartiesQueriesPort;
    readonly validationService: PartiesValidationService;
    readonly auditService: PartiesAuditService;
    readonly eventService: PartiesEventService;
    readonly rateLimitService: PartiesRateLimitService;
  };

  /** Envelopes services */
  readonly envelopes: {
    readonly commandsPort: EnvelopesCommandsPort;
    readonly queriesPort: EnvelopesQueriesPort;
    readonly validationService: EnvelopesValidationService;
    readonly auditService: EnvelopesAuditService;
    readonly eventService: EnvelopesEventService;
  };

  /** Inputs services */
  readonly inputs: {
    readonly commandsPort: InputsCommandsPort;
    readonly queriesPort: InputsQueriesPort;
    readonly validationService: InputsValidationService;
    readonly auditService: InputsAuditService;
    readonly eventService: InputsEventService;
  };

  /** Documents services */
  readonly documents: {
    readonly commandsPort: DocumentsCommandsPort;
    readonly queriesPort: DocumentsQueriesPort;
    readonly validationService: DefaultDocumentsValidationService;
    readonly auditService: DefaultDocumentsAuditService;
    readonly eventService: DefaultDocumentsEventService;
    readonly rateLimitService: DefaultDocumentsRateLimitService;
    readonly s3Service: DefaultDocumentsS3Service;
  };

  /** Requests services */
  readonly requests: {
    readonly commandsPort: RequestsCommandsPort;
    readonly validationService: RequestsValidationService;
    readonly auditService: RequestsAuditService;
    readonly eventService: RequestsEventService;
    readonly rateLimitService: RequestsRateLimitService;
  };

  /** Certificate services */
  readonly certificate: {
    readonly queriesPort: CertificateQueriesPort;
    readonly validationService: DefaultCertificateValidationService;
  };

  /** Signing services */
  readonly signing: {
    readonly commandsPort: SigningCommandsPort;
    readonly command: SigningCommandService;
    readonly validationService: SigningValidationService;
    readonly eventService: SigningEventService;
    readonly auditService: SigningAuditService;
    readonly rateLimitService: SigningRateLimitService;
    readonly s3Service: SigningS3Service;
  };

  /** Signatures services */
  readonly signatures: {
    readonly commandsPort: SignaturesCommandsPort;
    readonly command: SignaturesCommandService;
  };

  /** Audit service */
  readonly audit: {
    /** Audit commands port */
    readonly commandsPort: AuditCommandsPort;
    /** Audit queries port */
    readonly queriesPort: AuditQueriesPort;
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
  /** Metrics service */
  readonly metricsService: MetricsService;
}

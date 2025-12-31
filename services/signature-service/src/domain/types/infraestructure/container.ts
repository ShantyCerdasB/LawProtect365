/**
 * @fileoverview Container - Dependency injection container types
 * @summary Type definitions for service and use case dependency injection
 * @description This module defines the container types for dependency injection,
 * providing type-safe interfaces for services and use cases used throughout
 * the signature service application.
 */

import {
  EnvelopeSignerService,
  InvitationTokenService,
  AuditEventService,
  EnvelopeNotificationService,
  KmsService,
  S3Service,
  ConsentService,
  SignerReminderTrackingService,
  EnvelopeHashService,
  EnvelopeAccessService,
  EnvelopeStateService,
  EnvelopeCrudService,
  EnvelopeDownloadService,
} from '@/services/index';
import { PdfDigitalSignatureEmbedder } from '@/services/pdfService';
import type { DocumentServicePort } from '@/app/ports/documents/DocumentServicePort';
import type { UserPersonalInfoRepository } from '@lawprotect/shared-ts';

import {
  CreateEnvelopeUseCase,
  CancelEnvelopeUseCase,
  UpdateEnvelopeUseCase,
  SendEnvelopeUseCase,
  ShareDocumentViewUseCase,
  SendRemindersUseCase,
  DeclineSignerUseCase,
  DownloadDocumentUseCase,
  GetAuditTrailUseCase,
  GetEnvelopeUseCase,
  ListEnvelopesByUserUseCase,
  SignDocumentUseCase,
} from '@/services/orchestrators';

/**
 * Container type for all service dependencies
 * @description Defines the service layer dependencies required for dependency injection
 */
export type Services = {
  envelopeSignerService: EnvelopeSignerService;
  invitationTokenService: InvitationTokenService;
  auditEventService: AuditEventService;
  s3Service: S3Service;
  consentService: ConsentService;
  kmsService: KmsService;
  signerReminderTrackingService: SignerReminderTrackingService;
  envelopeNotificationService: EnvelopeNotificationService;
  envelopeHashService: EnvelopeHashService;
  envelopeAccessService: EnvelopeAccessService;
  envelopeStateService: EnvelopeStateService;
  envelopeCrudService: EnvelopeCrudService;
  envelopeDownloadService: EnvelopeDownloadService;
  pdfDigitalSignatureEmbedder: PdfDigitalSignatureEmbedder;
  documentServicePort: DocumentServicePort;
  userPersonalInfoRepository: UserPersonalInfoRepository;
};

/**
 * Container type for all use case dependencies
 * @description Defines the use case layer dependencies required for dependency injection
 */
export type UseCases = {
  createEnvelopeUseCase: CreateEnvelopeUseCase;
  cancelEnvelopeUseCase: CancelEnvelopeUseCase;
  updateEnvelopeUseCase: UpdateEnvelopeUseCase;
  sendEnvelopeUseCase: SendEnvelopeUseCase;
  shareDocumentViewUseCase: ShareDocumentViewUseCase;
  sendRemindersUseCase: SendRemindersUseCase;
  declineSignerUseCase: DeclineSignerUseCase;
  downloadDocumentUseCase: DownloadDocumentUseCase;
  getAuditTrailUseCase: GetAuditTrailUseCase;
  getEnvelopeUseCase: GetEnvelopeUseCase;
  listEnvelopesByUserUseCase: ListEnvelopesByUserUseCase;
  signDocumentUseCase: SignDocumentUseCase;
};

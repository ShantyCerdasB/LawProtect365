import {
  SignatureEnvelopeService,
  EnvelopeSignerService,
  InvitationTokenService,
  AuditEventService,
  EnvelopeNotificationService,
  KmsService,
  S3Service,
  ConsentService,
  SignerReminderTrackingService,
} from '@/services/index';

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

export type Services = {
  signatureEnvelopeService: SignatureEnvelopeService;
  envelopeSignerService: EnvelopeSignerService;
  invitationTokenService: InvitationTokenService;
  auditEventService: AuditEventService;
  s3Service: S3Service;
  consentService: ConsentService;
  kmsService: KmsService;
  signerReminderTrackingService: SignerReminderTrackingService;
  envelopeNotificationService: EnvelopeNotificationService;
};

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

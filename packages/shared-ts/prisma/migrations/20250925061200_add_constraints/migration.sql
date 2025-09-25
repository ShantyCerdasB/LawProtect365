-- =========================
-- EnvelopeSigner
-- =========================
-- Identity: must be an internal user OR an external contact (email+fullName)
ALTER TABLE "EnvelopeSigner"
  ADD CONSTRAINT envelope_signer_identity_chk
  CHECK (
    "userId" IS NOT NULL
    OR ("email" IS NOT NULL AND "fullName" IS NOT NULL)
  );

-- Status ↔ timestamps
ALTER TABLE "EnvelopeSigner"
  ADD CONSTRAINT envelope_signer_signed_consistency_chk
  CHECK (NOT ("status" = 'SIGNED'::"SignerStatus" AND "signedAt" IS NULL));

ALTER TABLE "EnvelopeSigner"
  ADD CONSTRAINT envelope_signer_declined_consistency_chk
  CHECK (NOT ("status" = 'DECLINED'::"SignerStatus" AND "declinedAt" IS NULL));

-- Consent coherence
ALTER TABLE "EnvelopeSigner"
  ADD CONSTRAINT envelope_signer_consent_coherence_chk
  CHECK (
    ("consentGiven" IS NULL AND "consentTimestamp" IS NULL)
    OR (NOT "consentGiven" AND "consentTimestamp" IS NULL)
    OR ("consentGiven" AND "consentTimestamp" IS NOT NULL)
  );

-- Valid IP format if provided
ALTER TABLE "EnvelopeSigner"
  ADD CONSTRAINT envelope_signer_ip_chk
  CHECK ("ipAddress" IS NULL OR "ipAddress"::inet IS NOT NULL);


-- =========================
-- SignatureEnvelope
-- =========================
-- SHA-256 hex format (64 lowercase hex chars) if provided
-- Using consistent regex pattern for SHA-256 validation: '^[0-9a-f]{64}$'
-- This pattern ensures exactly 64 lowercase hexadecimal characters
ALTER TABLE "SignatureEnvelope"
  ADD CONSTRAINT signature_envelope_source_sha_chk
  CHECK ("sourceSha256" IS NULL OR "sourceSha256" ~ '^[0-9a-f]{64}$');

-- Using same SHA-256 regex pattern as above for consistency
ALTER TABLE "SignatureEnvelope"
  ADD CONSTRAINT signature_envelope_flattened_sha_chk
  CHECK ("flattenedSha256" IS NULL OR "flattenedSha256" ~ '^[0-9a-f]{64}$');

-- Using same SHA-256 regex pattern as above for consistency
ALTER TABLE "SignatureEnvelope"
  ADD CONSTRAINT signature_envelope_signed_sha_chk
  CHECK ("signedSha256" IS NULL OR "signedSha256" ~ '^[0-9a-f]{64}$');

-- Status ↔ timestamps
ALTER TABLE "SignatureEnvelope"
  ADD CONSTRAINT signature_envelope_completed_chk
  CHECK (NOT ("status" = 'COMPLETED'::"EnvelopeStatus" AND "completedAt" IS NULL));

ALTER TABLE "SignatureEnvelope"
  ADD CONSTRAINT signature_envelope_declined_chk
  CHECK (NOT ("status" = 'DECLINED'::"EnvelopeStatus"
              AND ("declinedAt" IS NULL OR "declinedBySignerId" IS NULL)));

ALTER TABLE "SignatureEnvelope"
  ADD CONSTRAINT signature_envelope_cancelled_chk
  CHECK (NOT ("status" = 'CANCELLED'::"EnvelopeStatus" AND "cancelledAt" IS NULL));

ALTER TABLE "SignatureEnvelope"
  ADD CONSTRAINT signature_envelope_expired_chk
  CHECK (NOT ("status" = 'EXPIRED'::"EnvelopeStatus" AND "expiresAt" IS NULL));

-- READY_FOR_SIGNATURE requires sentAt
ALTER TABLE "SignatureEnvelope"
  ADD CONSTRAINT signature_envelope_ready_sent_chk
  CHECK ("status" <> 'READY_FOR_SIGNATURE'::"EnvelopeStatus" OR "sentAt" IS NOT NULL);

-- TEMPLATE origin requires templateId
ALTER TABLE "SignatureEnvelope"
  ADD CONSTRAINT signature_envelope_template_chk
  CHECK ("originType" <> 'TEMPLATE'::"DocumentOriginType" OR "templateId" IS NOT NULL);


-- =========================
-- InvitationToken
-- =========================
-- Non-negative counters
ALTER TABLE "InvitationToken"
  ADD CONSTRAINT invitation_token_resend_nonneg_chk
  CHECK ("resendCount" >= 0);

ALTER TABLE "InvitationToken"
  ADD CONSTRAINT invitation_token_view_nonneg_chk
  CHECK ("viewCount" >= 0);

-- Status ↔ timestamps
ALTER TABLE "InvitationToken"
  ADD CONSTRAINT invitation_token_signed_consistency_chk
  CHECK (NOT ("status" = 'SIGNED'::"InvitationTokenStatus" AND "signedAt" IS NULL));

ALTER TABLE "InvitationToken"
  ADD CONSTRAINT invitation_token_revoked_consistency_chk
  CHECK (NOT ("status" = 'REVOKED'::"InvitationTokenStatus" AND "revokedAt" IS NULL));

ALTER TABLE "InvitationToken"
  ADD CONSTRAINT invitation_token_expired_consistency_chk
  CHECK (NOT ("status" = 'EXPIRED'::"InvitationTokenStatus" AND "expiresAt" IS NULL));

-- VIEWED requires evidence
ALTER TABLE "InvitationToken"
  ADD CONSTRAINT invitation_token_viewed_consistency_chk
  CHECK ("status" <> 'VIEWED'::"InvitationTokenStatus" OR ("lastViewedAt" IS NOT NULL OR "viewCount" > 0));

-- lastViewedAt must not be before sentAt (when both exist)
ALTER TABLE "InvitationToken"
  ADD CONSTRAINT invitation_token_viewed_after_sent_chk
  CHECK ("lastViewedAt" IS NULL OR "sentAt" IS NULL OR "lastViewedAt" >= "sentAt");

-- Valid IP / ISO country code
ALTER TABLE "InvitationToken"
  ADD CONSTRAINT invitation_token_ip_chk
  CHECK ("ipAddress" IS NULL OR "ipAddress"::inet IS NOT NULL);

ALTER TABLE "InvitationToken"
  ADD CONSTRAINT invitation_token_country_chk
  CHECK ("country" IS NULL OR char_length("country") = 2);

-- Exactly one ACTIVE token per signer (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS invitation_token_one_active_per_signer_uidx
  ON "InvitationToken" ("signerId")
  WHERE "status" = 'ACTIVE'::"InvitationTokenStatus";


-- =========================
-- Consent
-- =========================
ALTER TABLE "Consent"
  ADD CONSTRAINT consent_country_chk
  CHECK ("country" IS NULL OR char_length("country") = 2);

ALTER TABLE "Consent"
  ADD CONSTRAINT consent_ip_chk
  CHECK ("ipAddress"::inet IS NOT NULL);

ALTER TABLE "Consent"
  ADD CONSTRAINT consent_timestamp_not_null_chk
  CHECK ("consentTimestamp" IS NOT NULL);


-- =========================
-- SignatureAuditEvent
-- =========================
-- eventType is TEXT in the current schema; allow non-blank only
ALTER TABLE "SignatureAuditEvent"
  ADD CONSTRAINT signature_audit_eventtype_not_blank_chk
  CHECK (length(trim("eventType")) > 0);

ALTER TABLE "SignatureAuditEvent"
  ADD CONSTRAINT signature_audit_ip_chk
  CHECK ("ipAddress" IS NULL OR "ipAddress"::inet IS NOT NULL);

ALTER TABLE "SignatureAuditEvent"
  ADD CONSTRAINT signature_audit_country_chk
  CHECK ("country" IS NULL OR char_length("country") = 2);


-- =========================
-- User
-- =========================
-- DELETED status requires deletedAt; non-DELETED requires deletedAt null
-- Note: 'DELETED' is defined in the UserAccountStatus enum in init migration
ALTER TABLE "User"
  ADD CONSTRAINT user_deleted_status_consistency_chk
  CHECK (
    ("status" <> 'DELETED'::"UserAccountStatus" AND "deletedAt" IS NULL)
    OR ("status" = 'DELETED'::"UserAccountStatus" AND "deletedAt" IS NOT NULL)
  );


-- =========================
-- OAuthAccount
-- =========================
-- providerAccountId must be non-blank
ALTER TABLE "OAuthAccount"
  ADD CONSTRAINT oauth_provider_accountid_not_blank_chk
  CHECK (length(trim("providerAccountId")) > 0);


-- =========================
-- SignerReminderTracking
-- =========================
-- Non-negative reminder count
ALTER TABLE "SignerReminderTracking"
  ADD CONSTRAINT signer_reminder_count_nonneg_chk
  CHECK ("reminderCount" >= 0);

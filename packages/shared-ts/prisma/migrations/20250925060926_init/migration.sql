CREATE EXTENSION IF NOT EXISTS "citext";
-- CreateEnum
CREATE TYPE "UserAccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "UserAuditAction" AS ENUM ('USER_REGISTERED', 'ROLE_CHANGED', 'MFA_TOGGLED', 'ACCOUNT_STATUS_CHANGED', 'LINKED_IDP', 'UNLINKED_IDP');

-- CreateEnum
CREATE TYPE "EnvelopeStatus" AS ENUM ('DRAFT', 'READY_FOR_SIGNATURE', 'COMPLETED', 'DECLINED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SigningOrderType" AS ENUM ('OWNER_FIRST', 'INVITEES_FIRST');

-- CreateEnum
CREATE TYPE "SignerStatus" AS ENUM ('PENDING', 'SIGNED', 'DECLINED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('LAWYER', 'CUSTOMER', 'ADMIN', 'SUPER_ADMIN', 'EXTERNAL_USER');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('SIGNER', 'VIEWER');

-- CreateEnum
CREATE TYPE "InvitationTokenStatus" AS ENUM ('ACTIVE', 'VIEWED', 'SIGNED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DocumentOriginType" AS ENUM ('USER_UPLOAD', 'TEMPLATE');

-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('GOOGLE', 'MICROSOFT_365', 'APPLE');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "name" TEXT NOT NULL,
    "givenName" TEXT,
    "lastName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "status" "UserAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "suspendedUntil" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "deactivationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthAccount" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" "OAuthProvider" NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignatureEnvelope" (
    "id" UUID NOT NULL,
    "createdBy" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "EnvelopeStatus" NOT NULL DEFAULT 'DRAFT',
    "signingOrderType" "SigningOrderType" NOT NULL DEFAULT 'OWNER_FIRST',
    "originType" "DocumentOriginType" NOT NULL,
    "templateId" TEXT,
    "templateVersion" TEXT,
    "sourceKey" TEXT,
    "metaKey" TEXT,
    "flattenedKey" TEXT,
    "signedKey" TEXT,
    "sourceSha256" TEXT,
    "flattenedSha256" TEXT,
    "signedSha256" TEXT,
    "sentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "declinedBySignerId" UUID,
    "declinedReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignatureEnvelope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvelopeSigner" (
    "id" UUID NOT NULL,
    "envelopeId" UUID NOT NULL,
    "userId" UUID,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "email" CITEXT,
    "fullName" TEXT,
    "invitedByUserId" UUID,
    "participantRole" "ParticipantRole" NOT NULL DEFAULT 'SIGNER',
    "order" INTEGER NOT NULL,
    "status" "SignerStatus" NOT NULL DEFAULT 'PENDING',
    "signedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "consentGiven" BOOLEAN DEFAULT false,
    "consentTimestamp" TIMESTAMP(3),
    "documentHash" TEXT,
    "signatureHash" TEXT,
    "signedS3Key" TEXT,
    "kmsKeyId" TEXT,
    "algorithm" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvelopeSigner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" UUID NOT NULL,
    "envelopeId" UUID NOT NULL,
    "signerId" UUID NOT NULL,
    "signatureId" UUID,
    "consentGiven" BOOLEAN NOT NULL,
    "consentTimestamp" TIMESTAMP(3) NOT NULL,
    "consentText" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitationToken" (
    "id" UUID NOT NULL,
    "envelopeId" UUID NOT NULL,
    "signerId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "InvitationTokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "lastSentAt" TIMESTAMP(3),
    "resendCount" INTEGER NOT NULL DEFAULT 0,
    "usedAt" TIMESTAMP(3),
    "usedBy" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "signedBy" UUID,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "createdBy" UUID,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvitationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignatureAuditEvent" (
    "id" UUID NOT NULL,
    "envelopeId" UUID NOT NULL,
    "signerId" UUID,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignatureAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAuditEvent" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" "UserAuditAction" NOT NULL,
    "description" TEXT,
    "actorId" UUID,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignerReminderTracking" (
    "id" UUID NOT NULL,
    "signerId" UUID NOT NULL,
    "envelopeId" UUID NOT NULL,
    "lastReminderAt" TIMESTAMP(3),
    "reminderCount" INTEGER NOT NULL DEFAULT 0,
    "lastReminderMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignerReminderTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "OAuthAccount_userId_provider_idx" ON "OAuthAccount"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_providerAccountId_key" ON "OAuthAccount"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_userId_provider_key" ON "OAuthAccount"("userId", "provider");

-- CreateIndex
CREATE INDEX "SignatureEnvelope_status_idx" ON "SignatureEnvelope"("status");

-- CreateIndex
CREATE INDEX "SignatureEnvelope_createdBy_idx" ON "SignatureEnvelope"("createdBy");

-- CreateIndex
CREATE INDEX "EnvelopeSigner_envelopeId_order_idx" ON "EnvelopeSigner"("envelopeId", "order");

-- CreateIndex
CREATE INDEX "EnvelopeSigner_userId_idx" ON "EnvelopeSigner"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EnvelopeSigner_envelopeId_email_key" ON "EnvelopeSigner"("envelopeId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "envelope_signer_unique_envelope_user_uidx" ON "EnvelopeSigner"("envelopeId", "userId");

-- CreateIndex
CREATE INDEX "Consent_signatureId_idx" ON "Consent"("signatureId");

-- CreateIndex
CREATE UNIQUE INDEX "Consent_envelopeId_signerId_key" ON "Consent"("envelopeId", "signerId");

-- CreateIndex
CREATE UNIQUE INDEX "InvitationToken_tokenHash_key" ON "InvitationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "InvitationToken_envelopeId_signerId_idx" ON "InvitationToken"("envelopeId", "signerId");

-- CreateIndex
CREATE INDEX "InvitationToken_signerId_status_idx" ON "InvitationToken"("signerId", "status");

-- CreateIndex
CREATE INDEX "InvitationToken_status_expiresAt_idx" ON "InvitationToken"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "SignatureAuditEvent_envelopeId_createdAt_idx" ON "SignatureAuditEvent"("envelopeId", "createdAt");

-- CreateIndex
CREATE INDEX "SignatureAuditEvent_signerId_idx" ON "SignatureAuditEvent"("signerId");

-- CreateIndex
CREATE INDEX "SignatureAuditEvent_eventType_createdAt_idx" ON "SignatureAuditEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "UserAuditEvent_userId_createdAt_idx" ON "UserAuditEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserAuditEvent_action_createdAt_idx" ON "UserAuditEvent"("action", "createdAt");

-- CreateIndex
CREATE INDEX "SignerReminderTracking_envelopeId_idx" ON "SignerReminderTracking"("envelopeId");

-- CreateIndex
CREATE INDEX "SignerReminderTracking_signerId_idx" ON "SignerReminderTracking"("signerId");

-- CreateIndex
CREATE UNIQUE INDEX "SignerReminderTracking_signerId_envelopeId_key" ON "SignerReminderTracking"("signerId", "envelopeId");

-- AddForeignKey
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureEnvelope" ADD CONSTRAINT "SignatureEnvelope_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureEnvelope" ADD CONSTRAINT "SignatureEnvelope_declinedBySignerId_fkey" FOREIGN KEY ("declinedBySignerId") REFERENCES "EnvelopeSigner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvelopeSigner" ADD CONSTRAINT "EnvelopeSigner_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "SignatureEnvelope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvelopeSigner" ADD CONSTRAINT "EnvelopeSigner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "SignatureEnvelope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "EnvelopeSigner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_signatureId_fkey" FOREIGN KEY ("signatureId") REFERENCES "EnvelopeSigner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationToken" ADD CONSTRAINT "InvitationToken_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "EnvelopeSigner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureAuditEvent" ADD CONSTRAINT "SignatureAuditEvent_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "SignatureEnvelope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureAuditEvent" ADD CONSTRAINT "SignatureAuditEvent_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "EnvelopeSigner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAuditEvent" ADD CONSTRAINT "UserAuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignerReminderTracking" ADD CONSTRAINT "SignerReminderTracking_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "EnvelopeSigner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignerReminderTracking" ADD CONSTRAINT "SignerReminderTracking_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "SignatureEnvelope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

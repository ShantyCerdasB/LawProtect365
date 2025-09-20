-- CreateEnum
CREATE TYPE "EnvelopeStatus" AS ENUM ('DRAFT', 'READY_FOR_SIGNATURE', 'COMPLETED', 'DECLINED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SigningOrderType" AS ENUM ('OWNER_FIRST', 'INVITEES_FIRST');

-- CreateEnum
CREATE TYPE "SignerStatus" AS ENUM ('PENDING', 'SIGNED', 'DECLINED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('LAWYER', 'CUSTOMER', 'ADMIN', 'SUPER_ADMIN', 'EXTERNAL_USER');

-- CreateEnum
CREATE TYPE "InvitationTokenStatus" AS ENUM ('ACTIVE', 'USED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DocumentOriginType" AS ENUM ('USER_UPLOAD', 'TEMPLATE');

-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('GOOGLE', 'MICROSOFT_365', 'APPLE');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
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
    "participantRole" TEXT NOT NULL DEFAULT 'SIGNER',
    "order" INTEGER NOT NULL,
    "status" "SignerStatus" NOT NULL DEFAULT 'PENDING',
    "signedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "documentHash" TEXT,
    "signatureHash" TEXT,
    "signedS3Key" TEXT,
    "kmsKeyId" TEXT,
    "algorithm" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "reason" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvelopeSigner_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "OAuthAccount_userId_provider_idx" ON "OAuthAccount"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_providerAccountId_key" ON "OAuthAccount"("provider", "providerAccountId");

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

-- AddForeignKey
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureEnvelope" ADD CONSTRAINT "SignatureEnvelope_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvelopeSigner" ADD CONSTRAINT "EnvelopeSigner_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "SignatureEnvelope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvelopeSigner" ADD CONSTRAINT "EnvelopeSigner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureAuditEvent" ADD CONSTRAINT "SignatureAuditEvent_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "SignatureEnvelope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureAuditEvent" ADD CONSTRAINT "SignatureAuditEvent_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "EnvelopeSigner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

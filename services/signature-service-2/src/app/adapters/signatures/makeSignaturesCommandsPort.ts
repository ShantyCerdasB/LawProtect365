/**
 * @file makeSignaturesCommandsPort.adapter.ts
 * @summary Factory for SignaturesCommandsPort
 * @description Creates and configures the SignaturesCommandsPort implementation,
 * adapting between the app service layer and use cases. Handles dependency injection
 * and type conversions for signature command operations.
 */

import type { SignaturesCommandsPort, SignHashCommand, SignHashResult, SignHashWithContextCommand, SignHashWithContextResult } from "../../ports/signatures/SignaturesCommandsPort";
import type { KmsSigner } from "@lawprotect/shared-ts";
import { assertKmsAlgorithmAllowed } from "../../../domain/rules/Signing.rules";
import { assertSignatureContextValid } from "../../../domain/rules/SignatureContext.rules";
import { HashDigestSchema, KmsAlgorithmSchema } from "../../../domain/value-objects/index";
import * as crypto from "crypto";

/**
 * Creates a SignaturesCommandsPort implementation for cryptographic signature operations
 * @param signer - KMS signer service for cryptographic operations
 * @param config - Signing configuration containing default key ID and allowed algorithms
 * @returns Configured SignaturesCommandsPort implementation
 */
export const makeSignaturesCommandsPort = (
  signer: KmsSigner,
  config: {
    defaultKeyId: string;
    allowedAlgorithms: readonly string[];
  }
): SignaturesCommandsPort => {
  return {
    /**
     * Signs a hash digest using KMS cryptographic service
     * @param command - The hash signing command containing digest, algorithm, and optional key ID
     * @returns Promise resolving to signing result with signature, algorithm, and key ID
     */
    async signHash(command: SignHashCommand): Promise<SignHashResult> {
      // Validate digest using domain value object
      const validatedDigest = HashDigestSchema.parse(command.digest);
      
      // Validate KMS algorithm using domain value object
      const validatedAlgorithm = KmsAlgorithmSchema.parse(command.algorithm);
      
      // Use domain rule to check if algorithm is allowed
      assertKmsAlgorithmAllowed(validatedAlgorithm, config.allowedAlgorithms);
      
      // Use the provided keyId or default
      const keyId = command.keyId || config.defaultKeyId;
      
      // Sign the hash using KMS
      const result = await signer.sign({
        message: Buffer.from(validatedDigest.value, 'hex'),
        signingAlgorithm: validatedAlgorithm,
        keyId: keyId});

      return {
        signature: Buffer.from(result.signature).toString('base64'),
        algorithm: validatedAlgorithm,
        keyId: keyId};
    },

    /**
     * Signs a hash digest using KMS with complete context for legal compliance
     * @param command - The hash signing command with context containing digest, algorithm, and complete signing context
     * @returns Promise resolving to signing result with context and verification hash
     */
    async signHashWithContext(command: SignHashWithContextCommand): Promise<SignHashWithContextResult> {
      // Validate digest using domain value object
      const validatedDigest = HashDigestSchema.parse(command.digest);
      
      // Validate KMS algorithm using domain value object
      const validatedAlgorithm = KmsAlgorithmSchema.parse(command.algorithm);
      
      // Use domain rule to check if algorithm is allowed
      assertKmsAlgorithmAllowed(validatedAlgorithm, config.allowedAlgorithms);
      
      // Use the provided keyId or default
      const keyId = command.keyId || config.defaultKeyId;
      
      // Create complete signature context
      const signatureContext = {
        signerEmail: command.signerEmail,
        signerName: command.signerName,
        signerId: command.signerId,
        ipAddress: command.ipAddress,
        userAgent: command.userAgent,
        timestamp: command.timestamp,
        consentGiven: command.consentGiven,
        consentTimestamp: command.consentTimestamp,
        consentText: command.consentText,
        invitedBy: command.invitedBy,
        invitedByName: command.invitedByName,
        invitationMessage: command.invitationMessage,
        envelopeId: command.envelopeId,
        documentDigest: validatedDigest.value,
        documentHashAlgorithm: validatedDigest.alg,
        signingAlgorithm: validatedAlgorithm,
        kmsKeyId: keyId
      };
      
      // Validate signature context using domain rules
      assertSignatureContextValid(signatureContext);
      
      // Create hash of the context for verification
      const contextHash = crypto.createHash('sha256')
        .update(JSON.stringify(signatureContext))
        .digest('hex');
      
      // Combine document digest with context hash
      const combinedMessage = Buffer.from(validatedDigest.value + contextHash, 'hex');
      
      // Sign the combined message using KMS
      const result = await signer.sign({
        message: combinedMessage,
        signingAlgorithm: validatedAlgorithm,
        keyId: keyId
      });

      return {
        signature: Buffer.from(result.signature).toString('base64'),
        algorithm: validatedAlgorithm,
        keyId: keyId,
        context: signatureContext,
        contextHash: contextHash
      };
    }
  };
};

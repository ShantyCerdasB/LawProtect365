/**
 * @file makeSignaturesCommandsPort.adapter.ts
 * @summary Factory for SignaturesCommandsPort
 * @description Creates and configures the SignaturesCommandsPort implementation,
 * adapting between the app service layer and use cases. Handles dependency injection
 * and type conversions for signature command operations.
 */

import type { SignaturesCommandsPort, SignHashCommand, SignHashResult } from "../../ports/signatures/SignaturesCommandsPort";
import type { KmsSigner } from "@lawprotect/shared-ts";
import { assertKmsAlgorithmAllowed } from "../../../domain/rules/Signing.rules";
import { HashDigestSchema, KmsAlgorithmSchema } from "../../../domain/value-objects/index";

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
    }};
};

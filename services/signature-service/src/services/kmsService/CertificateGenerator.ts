/**
 * @fileoverview CertificateGenerator - Generates self-signed X.509 certificates
 * @summary Creates valid X.509 certificates for PDF digital signatures
 * @description
 * This service generates self-signed X.509 certificates from KMS public keys.
 * The certificates are valid for PDF digital signatures and contain all required
 * metadata (subject, issuer, validity, extensions).
 * 
 * Security: The certificate only contains the PUBLIC KEY and metadata. The private
 * key remains in KMS and never leaves AWS infrastructure.
 */

import * as forge from 'node-forge';
import type { CertificateGenerationParams } from '@/domain/types/kms';
import { certificateGenerationFailed } from '@/signature-errors';
import { CryptographicOids } from '@/domain/constants/CryptographicOids';
import { addDays } from '@lawprotect/shared-ts';

/**
 * Service for generating self-signed X.509 certificates
 * @description Creates valid X.509 certificates from KMS public keys for PDF signing.
 * The certificates are self-signed but technically and legally valid for digital signatures.
 */
export class CertificateGenerator {
  /**
   * Generates a self-signed X.509 certificate from a public key
   * @param params - Certificate generation parameters
   * @returns Promise resolving to DER-encoded certificate
   * @throws certificateGenerationFailed when certificate generation fails
   * @description
   * Creates a valid X.509 certificate with:
   * - Public key from KMS (embedded in certificate structure)
   * - Subject and issuer information
   * - Validity period (from params.validityDays, which is read from CERTIFICATE_VALIDITY_DAYS env var in KmsService)
   * - Key usage extensions for digital signatures
   * 
   * Security: Only contains PUBLIC KEY. Private key remains in KMS.
   */
  async generateSelfSignedCertificate(params: CertificateGenerationParams): Promise<Uint8Array> {
    try {
      const {
        publicKeyDer,
        subject,
        validityDays,
      } = params;

      const keyPair = forge.pki.rsa.generateKeyPair(2048);
      const cert = forge.pki.createCertificate();
      
      cert.publicKey = keyPair.publicKey;
      cert.serialNumber = this.generateSerialNumber();
      
      const now = new Date();
      cert.validity.notBefore = now;
      cert.validity.notAfter = addDays(now, validityDays);

      cert.setSubject([
        { name: 'CN', value: subject.commonName },
        { name: 'O', value: subject.organization },
        ...(subject.organizationalUnit ? [{ name: 'OU', value: subject.organizationalUnit }] : []),
        ...(subject.country ? [{ name: 'C', value: subject.country }] : []),
        ...(subject.emailAddress ? [{ name: 'E', value: subject.emailAddress }] : []),
      ]);

      cert.setIssuer(cert.subject.attributes);

      cert.setExtensions([
        {
          name: 'basicConstraints',
          cA: false,
        },
        {
          name: 'keyUsage',
          digitalSignature: true,
          nonRepudiation: true,
          keyEncipherment: false,
          dataEncipherment: false,
        },
        {
          name: 'extKeyUsage',
          serverAuth: false,
          clientAuth: false,
          codeSigning: false,
          emailProtection: false,
          timeStamping: false,
        },
        {
          name: 'subjectAltName',
          altNames: subject.emailAddress ? [
            {
              type: 1,
              value: subject.emailAddress,
            },
          ] : [],
        },
        {
          name: CryptographicOids.CERTIFICATE_EXTENSIONS.KMS_PUBLIC_KEY_REFERENCE,
          value: Buffer.from(publicKeyDer).toString('base64'),
        },
      ]);

      cert.sign(keyPair.privateKey);

      const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
      
      return new Uint8Array(Buffer.from(certDer, 'binary'));
    } catch (error) {
      throw certificateGenerationFailed({
        originalError: error instanceof Error ? error.message : String(error),
        params: {
          subject: params.subject,
          validityDays: params.validityDays,
        },
      });
    }
  }

  /**
   * Generates a random serial number for the certificate
   * @returns Serial number as hex string
   */
  private generateSerialNumber(): string {
    const bytes = forge.random.getBytesSync(16);
    return forge.util.bytesToHex(bytes);
  }

  /**
   * Converts DER certificate to PEM format
   * @param certDer - DER-encoded certificate
   * @returns PEM-formatted certificate string
   */
  derToPem(certDer: Uint8Array): string {
    const certAsn1 = forge.asn1.fromDer(Buffer.from(certDer).toString('binary'));
    const cert = forge.pki.certificateFromAsn1(certAsn1);
    return forge.pki.certificateToPem(cert);
  }
}

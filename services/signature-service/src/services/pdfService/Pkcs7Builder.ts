/**
 * @fileoverview Pkcs7Builder - Builds PKCS#7/CMS SignedData structures
 * @summary Constructs complete PKCS#7 SignedData for PDF signatures
 * @description
 * Builds PKCS#7/CMS SignedData structures according to RFC 5652 for embedding
 * in PDF documents. Packages pre-computed signatures from KMS with certificate chains
 * and signer metadata into a format that PDF readers can verify.
 * 
 * Uses:
 * - pkijs: For PKCS#7/CMS structures
 * - @peculiar/x509: For X.509 certificate parsing
 * - asn1js: For ASN.1 encoding
 */

import * as x509 from '@peculiar/x509';
import {
  SignedData,
  EncapsulatedContentInfo,
  SignerInfo,
  IssuerAndSerialNumber,
  AlgorithmIdentifier,
  Attribute,
  SignedAndUnsignedAttributes,
} from 'pkijs';
import * as asn1js from 'asn1js';
import type { Pkcs7BuildParams } from '@/domain/types/pdf';
import { CryptographicOids } from '@/domain/constants/CryptographicOids';
import { pdfSignatureEmbeddingFailed } from '@/signature-errors';
import { SignatureErrorCodes } from '@/signature-errors/codes';

/**
 * @description
 * Service for building PKCS#7/CMS SignedData structures. Constructs complete
 * PKCS#7 SignedData that can be embedded in PDF documents for digital signatures.
 */
export class Pkcs7Builder {
  /**
   * @description
   * Builds a complete PKCS#7 SignedData structure according to RFC 5652.
   * Packages signature bytes, certificate chain, and signer metadata into
   * a DER-encoded structure ready for PDF embedding.
   * @param {Pkcs7BuildParams} params - Parameters for building SignedData
   * @returns {Promise<Uint8Array>} Promise resolving to DER-encoded SignedData
   * @throws {InternalError} when building fails (pdfSignatureEmbeddingFailed)
   */
  async buildSignedData(params: Pkcs7BuildParams): Promise<Uint8Array> {
    try {
      const certificates = this.parseCertificates(params.certificateChain);
      
      if (certificates.length === 0) {
        throw pdfSignatureEmbeddingFailed('Certificate chain is required for PKCS#7 SignedData');
      }
      
      const leafCert = certificates[0];
      const signedAttrs = this.buildSignedAttributes(params);
      
      const signerInfo = new SignerInfo();
      signerInfo.version = 1;
      signerInfo.sid = new IssuerAndSerialNumber({
        issuer: this.parseIssuerName(leafCert) as any,
        serialNumber: this.parseSerialNumber(leafCert),
      });
      signerInfo.digestAlgorithm = new AlgorithmIdentifier({
        algorithmId: CryptographicOids.HASH_ALGORITHMS.SHA_256,
      });
      signerInfo.signatureAlgorithm = new AlgorithmIdentifier({
        algorithmId: CryptographicOids.SIGNATURE_ALGORITHMS.ECDSA_SHA_256,
      });
      if (signedAttrs.attributes.length > 0) {
        signerInfo.signedAttrs = signedAttrs as any;
      }
      const signatureHex = params.signatureBytes.buffer.slice(
        params.signatureBytes.byteOffset,
        params.signatureBytes.byteOffset + params.signatureBytes.byteLength
      ) as unknown as ArrayBuffer;
      signerInfo.signature = new asn1js.OctetString({ valueHex: signatureHex });
      
      const signedData = new SignedData();
      signedData.version = 1;
      signedData.digestAlgorithms = [
        new AlgorithmIdentifier({
          algorithmId: CryptographicOids.HASH_ALGORITHMS.SHA_256,
        }),
      ];
      signedData.encapContentInfo = new EncapsulatedContentInfo({
        eContentType: CryptographicOids.PKCS7_CONTENT_TYPES.ID_DATA,
      });
      signedData.signerInfos = [signerInfo];
      
      signedData.certificates = certificates.map(cert => {
        const raw = this.getCertificateRaw(cert);
        const result = asn1js.fromBER(raw);
        if (result.result instanceof asn1js.Sequence) {
          return result.result as any;
        }
        throw pdfSignatureEmbeddingFailed('Failed to parse certificate as ASN.1 sequence');
      }) as any;
      
      const signedDataSchema = signedData.toSchema();
      const signedDataDER = signedDataSchema.toBER(false);
      
      return new Uint8Array(signedDataDER);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === SignatureErrorCodes.PDF_SIGNATURE_EMBEDDING_FAILED) {
        throw error;
      }
      throw pdfSignatureEmbeddingFailed(
        `Failed to build PKCS#7 SignedData: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * @description
   * Parses certificate chain from DER-encoded bytes to X.509 certificate objects.
   * @param {Uint8Array[]} certificateChain - Array of DER-encoded certificate bytes
   * @returns {x509.X509Certificate[]} Array of parsed X.509 certificates
   * @throws {InternalError} when certificate parsing fails
   */
  private parseCertificates(certificateChain: Uint8Array[]): x509.X509Certificate[] {
    return certificateChain.map((certBytes, index) => {
      try {
        const text = Buffer.from(certBytes).toString('utf-8');
        // Prefer PEM parse when it looks like PEM
        if (text.includes('BEGIN CERTIFICATE')) {
          return new x509.X509Certificate(text);
        }
        // Try DER parse
        const buffer = new Uint8Array(certBytes).buffer;
        return new x509.X509Certificate(buffer as any);
      } catch (_directError) {
        try {
          // Fallback: wrap DER as PEM and parse
          const b64 = Buffer.from(certBytes).toString('base64');
          const pem = `-----BEGIN CERTIFICATE-----\n${b64}\n-----END CERTIFICATE-----`;
          return new x509.X509Certificate(pem);
        } catch (error) {
        throw pdfSignatureEmbeddingFailed(
          `Failed to parse certificate at index ${index}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      }
    });
  }

  /**
   * @description
   * Extracts raw certificate bytes from X.509 certificate object. Handles different
   * internal representations of certificate data in @peculiar/x509.
   * @param {x509.X509Certificate} cert - X.509 certificate object
   * @returns {ArrayBuffer} Raw certificate bytes as ArrayBuffer
   */
  private getCertificateRaw(cert: x509.X509Certificate): ArrayBuffer {
    const anyCert = cert as any;
    const rawData = anyCert.rawData ?? anyCert.raw;
    if (rawData instanceof ArrayBuffer) {
      return rawData;
    }
    if (rawData instanceof Uint8Array) {
      return rawData.buffer.slice(rawData.byteOffset, rawData.byteOffset + rawData.byteLength) as unknown as ArrayBuffer;
    }

    const certString = cert.toString();
    if (typeof certString === 'string' && certString.includes('BEGIN CERTIFICATE')) {
      const b64 = certString
        .replace(/-----BEGIN CERTIFICATE-----/g, '')
        .replace(/-----END CERTIFICATE-----/g, '')
        .replace(/\s+/g, '');
      const buf = Buffer.from(b64, 'base64');
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as unknown as ArrayBuffer;
    }

    // Fallback: treat as base64 string
    const sanitized = typeof certString === 'string' ? certString.replace(/\s+/g, '') : '';
    if (sanitized && /^[A-Za-z0-9+/=]+$/.test(sanitized)) {
      const buf = Buffer.from(sanitized, 'base64');
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as unknown as ArrayBuffer;
    }

    throw pdfSignatureEmbeddingFailed('Failed to extract raw certificate bytes');
  }

  /**
   * @description
   * Parses issuer name from X.509 certificate and creates ASN.1 structure
   * for PKCS#7 SignerInfo. Uses simplified structure with Common Name (CN) only.
   * @param {x509.X509Certificate} cert - X.509 certificate object
   * @returns {asn1js.Sequence} ASN.1 sequence representing issuer name
   */
  private parseIssuerName(cert: x509.X509Certificate): asn1js.Sequence {
    const issuerName = cert.issuer;
    
    return new asn1js.Sequence({
      value: [
        new asn1js.Set({
          value: [
            new asn1js.Sequence({
              value: [
                new asn1js.ObjectIdentifier({ value: CryptographicOids.X500_ATTRIBUTES.COMMON_NAME }),
                new asn1js.Utf8String({ value: issuerName }),
              ],
            }),
          ],
        }),
      ],
    });
  }

  /**
   * @description
   * Parses serial number from X.509 certificate and converts it to ASN.1 Integer
   * format required for PKCS#7 SignerInfo issuer and serial number.
   * @param {x509.X509Certificate} cert - X.509 certificate object
   * @returns {asn1js.Integer} ASN.1 Integer representing certificate serial number
   */
  private parseSerialNumber(cert: x509.X509Certificate): asn1js.Integer {
    const serial = (cert as any).serialNumber;
    if (typeof serial === 'string') {
      const cleanHex = serial.replace(/[^0-9a-fA-F]/g, '');
      const hex = cleanHex.length % 2 === 0 ? cleanHex : `0${cleanHex}`;
      const buf = Buffer.from(hex || '00', 'hex');
      return new asn1js.Integer({
        valueHex: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as unknown as ArrayBuffer,
      });
    }

    if (serial instanceof Uint8Array) {
      return new asn1js.Integer({
        valueHex: serial.buffer.slice(serial.byteOffset, serial.byteOffset + serial.byteLength) as unknown as ArrayBuffer,
      });
    }

    if (serial instanceof ArrayBuffer) {
      return new asn1js.Integer({ valueHex: serial });
    }

    return new asn1js.Integer({ value: 0 });
  }

  /**
   * @description
   * Builds signed attributes for PKCS#7 SignerInfo according to RFC 5652.
   * Includes content type, message digest, and signing time attributes.
   * @param {Pkcs7BuildParams} params - Parameters containing document hash and timestamp
   * @returns {{ attributes: Attribute[] }} Object containing array of signed attributes
   */
  private buildSignedAttributes(params: Pkcs7BuildParams): SignedAndUnsignedAttributes {
    const attrs: Attribute[] = [];
    
    const contentTypeAttr = new Attribute();
    contentTypeAttr.type = CryptographicOids.PKCS7_ATTRIBUTES.CONTENT_TYPE;
    contentTypeAttr.values = [
      new asn1js.ObjectIdentifier({ value: CryptographicOids.PKCS7_CONTENT_TYPES.ID_DATA }),
    ];
    attrs.push(contentTypeAttr);
    
    const digestAttr = new Attribute();
    digestAttr.type = CryptographicOids.PKCS7_ATTRIBUTES.MESSAGE_DIGEST;
    const documentHashHex = params.documentHash.buffer.slice(
      params.documentHash.byteOffset,
      params.documentHash.byteOffset + params.documentHash.byteLength
    ) as unknown as ArrayBuffer;
    digestAttr.values = [
      new asn1js.OctetString({ valueHex: documentHashHex }),
    ];
    attrs.push(digestAttr);
    
    const timeAttr = new Attribute();
    timeAttr.type = CryptographicOids.PKCS7_ATTRIBUTES.SIGNING_TIME;
    timeAttr.values = [
      this.dateToAsn1Time(params.timestamp),
    ];
    attrs.push(timeAttr);
    
    return new SignedAndUnsignedAttributes({
      type: 0,
      attributes: attrs,
    });
  }

  /**
   * @description
   * Converts JavaScript Date to ASN.1 UTCTime format required for PKCS#7
   * signing time attribute. Format: YYMMDDHHMMSSZ (UTC time).
   * @param {Date} date - Date object to convert
   * @returns {asn1js.UTCTime} ASN.1 UTCTime object
   */
  private dateToAsn1Time(date: Date): asn1js.UTCTime {
    return new asn1js.UTCTime({ valueDate: date });
  }
}

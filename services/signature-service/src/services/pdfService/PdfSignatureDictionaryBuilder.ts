/**
 * @fileoverview PdfSignatureDictionaryBuilder - Builds PDF signature dictionaries
 * @summary Creates PDF signature dictionary objects for embedding digital signatures
 * @description
 * Service that builds PDF signature dictionaries according to PDF 1.7 specification (ISO 32000-1).
 * Creates signature dictionary objects containing PKCS#7 SignedData, byte ranges, and signer
 * metadata. Also serializes dictionaries to PDF object format for embedding in PDF documents.
 * 
 * The signature dictionary is a PDF object that defines:
 * - The cryptographic signature (PKCS#7 SignedData in Contents field)
 * - Which parts of the PDF are covered by the signature (ByteRange)
 * - Signer metadata (name, location, reason, contact info)
 * - Signing timestamp in PDF date format
 * 
 * Used by PdfSignatureManipulator during the signature embedding process.
 */

import type { SignatureDictionary, SignatureDictionaryParams } from '@/domain/types/pdf';

/**
 * @description
 * Service for building PDF signature dictionaries. Constructs signature dictionary objects
 * according to PDF 1.7 specification and serializes them to PDF object format for embedding.
 */
export class PdfSignatureDictionaryBuilder {
  /**
   * @description
   * Builds a PDF signature dictionary object according to PDF 1.7 specification.
   * Converts PKCS#7 SignedData to hex format, formats timestamp to PDF date format,
   * and includes signer metadata (name, location, reason, contact info).
   * @param {SignatureDictionaryParams} params - Parameters for building dictionary
   * @returns {SignatureDictionary} Complete signature dictionary object ready for PDF embedding
   */
  buildDictionary(params: SignatureDictionaryParams): SignatureDictionary {
    const contentsHex = this.uint8ArrayToHex(params.signedDataDER);
    const pdfDate = this.formatPdfDate(params.timestamp);
    
    const dict: SignatureDictionary = {
      Type: '/Sig',
      Filter: '/Adobe.PPKLite',
      SubFilter: '/ETSI.CAdES.detached',
      Contents: `<${contentsHex}>`,
      ByteRange: params.byteRanges,
      M: pdfDate,
      Name: params.signerInfo.name,
    };
    
    if (params.signerInfo.location) {
      dict.Location = params.signerInfo.location;
    }
    
    if (params.signerInfo.reason) {
      dict.Reason = params.signerInfo.reason;
    }
    
    if (params.signerInfo.email) {
      dict.ContactInfo = params.signerInfo.email;
    }
    
    return dict;
  }

  /**
   * @description
   * Serializes signature dictionary to PDF object format. Converts the dictionary object
   * to a PDF object string that can be embedded in a PDF document. Handles escaping of
   * special characters in string values according to PDF specification.
   * @param {SignatureDictionary} dict - Signature dictionary to serialize
   * @param {number} objectNumber - PDF object number for this dictionary
   * @param {number} generation - Object generation number (default: 0)
   * @returns {string} Serialized PDF object string ready for embedding
   */
  serializeToPdfObject(
    dict: SignatureDictionary,
    objectNumber: number,
    generation: number = 0
  ): string {
    const lines: string[] = [];
    lines.push(`${objectNumber} ${generation} obj`);
    lines.push('<<');
    lines.push(`  /Type ${dict.Type}`);
    lines.push(`  /Filter ${dict.Filter}`);
    lines.push(`  /SubFilter ${dict.SubFilter}`);
    lines.push(`  /Contents ${dict.Contents}`);
    lines.push(`  /ByteRange [${dict.ByteRange.join(' ')}]`);
    
    if (dict.Location) {
      lines.push(`  /Location (${this.escapePdfString(dict.Location)})`);
    }
    
    if (dict.Reason) {
      lines.push(`  /Reason (${this.escapePdfString(dict.Reason)})`);
    }
    
    if (dict.ContactInfo) {
      lines.push(`  /ContactInfo (${this.escapePdfString(dict.ContactInfo)})`);
    }
    
    lines.push(`  /M ${dict.M}`);
    lines.push(`  /Name (${this.escapePdfString(dict.Name)})`);
    lines.push('>>');
    lines.push('endobj');
    
    return lines.join('\n') + '\n';
  }

  /**
   * @description
   * Converts Uint8Array to hexadecimal string. Used to encode PKCS#7 SignedData
   * in hex format for the Contents field of the signature dictionary.
   * @param {Uint8Array} bytes - Bytes to convert to hex
   * @returns {string} Hexadecimal string representation
   */
  private uint8ArrayToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * @description
   * Formats JavaScript Date to PDF date format according to PDF 1.7 specification.
   * Format: D:YYYYMMDDHHmmSSOHH'mm' where O is UTC offset indicator (Z for UTC).
   * @param {Date} date - Date to format
   * @returns {string} PDF date string in format D:YYYYMMDDHHmmSSOHH'mm'
   */
  private formatPdfDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    
    return `D:${year}${month}${day}${hours}${minutes}${seconds}Z00'00'`;
  }

  /**
   * @description
   * Escapes special characters in strings for PDF format. Handles backslashes,
   * parentheses, and other characters that have special meaning in PDF strings.
   * @param {string} str - String to escape
   * @returns {string} Escaped string safe for PDF format
   */
  private escapePdfString(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }
}






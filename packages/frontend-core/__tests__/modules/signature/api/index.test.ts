/**
 * @fileoverview Signature API Barrel Tests - Ensures barrel re-exports work correctly
 * @summary Tests for modules/signature/api/index.ts barrel exports
 */

import * as SignatureApi from '../../../../src/modules/signature/api/index';

describe('modules/signature/api index (barrel) re-exports', () => {
  it('re-exports all signature API functions', () => {
    expect(typeof SignatureApi.createEnvelope).toBe('function');
    expect(typeof SignatureApi.getEnvelope).toBe('function');
    expect(typeof SignatureApi.getEnvelopesByUser).toBe('function');
    expect(typeof SignatureApi.updateEnvelope).toBe('function');
    expect(typeof SignatureApi.sendEnvelope).toBe('function');
    expect(typeof SignatureApi.cancelEnvelope).toBe('function');
    expect(typeof SignatureApi.signDocument).toBe('function');
    expect(typeof SignatureApi.declineSigner).toBe('function');
    expect(typeof SignatureApi.downloadDocument).toBe('function');
    expect(typeof SignatureApi.shareDocumentView).toBe('function');
    expect(typeof SignatureApi.getAuditTrail).toBe('function');
    expect(typeof SignatureApi.sendNotification).toBe('function');
  });
});


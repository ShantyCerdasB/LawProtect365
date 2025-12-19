/**
 * @fileoverview Signature API Tests - Unit tests for signature API functions
 * @summary Tests for signature module API client functions
 */

import {
  createEnvelope,
  getEnvelope,
  getEnvelopesByUser,
  updateEnvelope,
  sendEnvelope,
  cancelEnvelope,
  signDocument,
  declineSigner,
  downloadDocument,
  shareDocumentView,
  getAuditTrail,
  sendNotification,
} from '../../../../src/modules/signature/api/signatureApi';
import { createMockHttpClient } from '../../../helpers/mocks';
import { assertHttpClientCall } from '../../../helpers/test-helpers';
import type { HttpClient } from '../../../../src/foundation/http/httpClient';

describe('signatureApi', () => {
  let mockClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    mockClient = createMockHttpClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createEnvelope', () => {
    it('should call client.post with /envelopes path and body', async () => {
      const body = { title: 'Test Envelope', documents: [] };
      mockClient.post.mockResolvedValue({ id: 'env-1', status: 'draft' });

      await createEnvelope(mockClient, body);

      assertHttpClientCall(mockClient, 'post', '/envelopes', body);
    });
  });

  describe('getEnvelope', () => {
    it('should call client.get with envelope ID', async () => {
      mockClient.get.mockResolvedValue({ id: 'env-1', status: 'sent' });

      await getEnvelope(mockClient, 'env-1');

      expect(mockClient.get).toHaveBeenCalledWith('/envelopes/env-1', undefined);
    });

    it('should include query parameters when provided', async () => {
      mockClient.get.mockResolvedValue({ id: 'env-1', status: 'sent' });

      await getEnvelope(mockClient, 'env-1', { includeSigners: true });

      expect(mockClient.get).toHaveBeenCalledWith('/envelopes/env-1?includeSigners=true', undefined);
    });
  });

  describe('getEnvelopesByUser', () => {
    it('should call client.get with /envelopes path', async () => {
      mockClient.get.mockResolvedValue({ items: [], total: 0 });

      await getEnvelopesByUser(mockClient);

      expect(mockClient.get).toHaveBeenCalledWith('/envelopes', undefined);
    });

    it('should include query parameters when provided', async () => {
      mockClient.get.mockResolvedValue({ items: [], total: 0 });

      await getEnvelopesByUser(mockClient, {
        status: 'sent',
        limit: 10,
        cursor: 'cursor-123',
        includeSigners: true,
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        '/envelopes?status=sent&limit=10&cursor=cursor-123&includeSigners=true',
        undefined
      );
    });

    it('should handle cursor pagination', async () => {
      mockClient.get.mockResolvedValue({ items: [], cursor: 'next-cursor' });

      await getEnvelopesByUser(mockClient, { cursor: 'current-cursor' });

      expect(mockClient.get).toHaveBeenCalledWith('/envelopes?cursor=current-cursor', undefined);
    });
  });

  describe('updateEnvelope', () => {
    it('should call client.post with envelope ID and body', async () => {
      const body = { title: 'Updated Title' };
      mockClient.post.mockResolvedValue({ id: 'env-1', title: 'Updated Title' });

      await updateEnvelope(mockClient, 'env-1', body);

      assertHttpClientCall(mockClient, 'post', '/envelopes/env-1', body);
    });
  });

  describe('sendEnvelope', () => {
    it('should call client.post with /envelopes/:id/send path and body', async () => {
      const body = { message: 'Please sign', sendToAll: true };
      mockClient.post.mockResolvedValue({ success: true });

      await sendEnvelope(mockClient, 'env-1', body);

      assertHttpClientCall(mockClient, 'post', '/envelopes/env-1/send', body);
    });
  });

  describe('cancelEnvelope', () => {
    it('should call client.post with /envelopes/:id/cancel path', async () => {
      mockClient.post.mockResolvedValue({ success: true });

      await cancelEnvelope(mockClient, 'env-1');

      expect(mockClient.post).toHaveBeenCalledWith('/envelopes/env-1/cancel', undefined, undefined);
    });

    it('should include body when provided', async () => {
      const body = { reason: 'No longer needed' };
      mockClient.post.mockResolvedValue({ success: true });

      await cancelEnvelope(mockClient, 'env-1', body);

      assertHttpClientCall(mockClient, 'post', '/envelopes/env-1/cancel', body);
    });
  });

  describe('signDocument', () => {
    it('should call client.post with /envelopes/:id/sign path and body', async () => {
      const body = { consent: true, signature: 'base64-signature' };
      mockClient.post.mockResolvedValue({ success: true });

      await signDocument(mockClient, 'env-1', body);

      assertHttpClientCall(mockClient, 'post', '/envelopes/env-1/sign', body);
    });
  });

  describe('declineSigner', () => {
    it('should call client.post with /envelopes/:id/signers/:signerId/decline path and body', async () => {
      const body = { reason: 'Not authorized' };
      mockClient.post.mockResolvedValue({ success: true });

      await declineSigner(mockClient, 'env-1', 'signer-1', body);

      assertHttpClientCall(mockClient, 'post', '/envelopes/env-1/signers/signer-1/decline', body);
    });
  });

  describe('downloadDocument', () => {
    it('should call client.get with /envelopes/:id/download path', async () => {
      mockClient.get.mockResolvedValue({ url: 'https://example.com/doc.pdf' });

      await downloadDocument(mockClient, 'env-1');

      expect(mockClient.get).toHaveBeenCalledWith('/envelopes/env-1/download', undefined);
    });

    it('should include query parameters when provided', async () => {
      mockClient.get.mockResolvedValue({ url: 'https://example.com/doc.pdf' });

      await downloadDocument(mockClient, 'env-1', { invitationToken: 'token-123', expiresIn: 3600 });

      expect(mockClient.get).toHaveBeenCalledWith('/envelopes/env-1/download?invitationToken=token-123&expiresIn=3600', undefined);
    });
  });

  describe('shareDocumentView', () => {
    it('should call client.post with /envelopes/:id/share-view path and body', async () => {
      const body = { signerId: 'signer-1' };
      mockClient.post.mockResolvedValue({ url: 'https://example.com/view' });

      await shareDocumentView(mockClient, 'env-1', body);

      assertHttpClientCall(mockClient, 'post', '/envelopes/env-1/share-view', body);
    });
  });

  describe('getAuditTrail', () => {
    it('should call client.get with /envelopes/:id/audit-trail path', async () => {
      mockClient.get.mockResolvedValue({ events: [] });

      await getAuditTrail(mockClient, 'env-1');

      expect(mockClient.get).toHaveBeenCalledWith('/envelopes/env-1/audit-trail', undefined);
    });

    it('should call client.get with audit trail path', async () => {
      mockClient.get.mockResolvedValue({ events: [] });

      await getAuditTrail(mockClient, 'env-1');

      expect(mockClient.get).toHaveBeenCalledWith('/envelopes/env-1/audit-trail', undefined);
    });
  });

  describe('sendNotification', () => {
    it('should call client.post with /notifications/send path and body', async () => {
      const body = { recipient: 'user@example.com', type: 'reminder' };
      mockClient.post.mockResolvedValue({ success: true });

      await sendNotification(mockClient, body);

      assertHttpClientCall(mockClient, 'post', '/notifications/send', body);
    });
  });
});


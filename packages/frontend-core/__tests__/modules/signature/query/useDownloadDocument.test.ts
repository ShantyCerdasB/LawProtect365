/**
 * @fileoverview useDownloadDocument Hook Tests - Unit tests for download document mutation hook
 * @summary Tests for useDownloadDocument.ts module
 * @jest-environment jsdom
 */

import { useDownloadDocument } from '../../../../src/modules/signature/query/useDownloadDocument';
import { downloadDocument } from '../../../../src/modules/signature/api';
import { createMockHttpClient } from '../../../helpers/mocks';

jest.mock('../../../../src/modules/signature/api');

describe('useDownloadDocument', () => {
  let mockClient: ReturnType<typeof createMockHttpClient>;

  beforeEach(() => {
    mockClient = createMockHttpClient();
    jest.clearAllMocks();
  });

  it('should download document with params (lines 35-42)', () => {
    const mockResult = { downloadUrl: 'https://example.com/doc.pdf' };
    (downloadDocument as jest.Mock).mockResolvedValue(mockResult);

    const { mutate } = useDownloadDocument({ httpClient: mockClient });

    const params = {
      envelopeId: 'env-1',
      invitationToken: 'token-123',
      expiresIn: 3600,
    };

    mutate(params);

    expect(downloadDocument).toHaveBeenCalledWith(mockClient, 'env-1', {
      invitationToken: 'token-123',
      expiresIn: 3600,
    });
  });

  it('should download document without optional params', () => {
    const mockResult = { downloadUrl: 'https://example.com/doc.pdf' };
    (downloadDocument as jest.Mock).mockResolvedValue(mockResult);

    const { mutate } = useDownloadDocument({ httpClient: mockClient });

    mutate({ envelopeId: 'env-1' });

    expect(downloadDocument).toHaveBeenCalledWith(mockClient, 'env-1', {});
  });
});

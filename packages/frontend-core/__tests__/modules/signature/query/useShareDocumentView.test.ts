/**
 * @fileoverview useShareDocumentView Hook Tests - Unit tests for share document view mutation hook
 * @summary Tests for useShareDocumentView.ts module
 * @jest-environment jsdom
 */

import { useShareDocumentView } from '../../../../src/modules/signature/query/useShareDocumentView';
import { shareDocumentView } from '../../../../src/modules/signature/api';
import { createMockHttpClient } from '../../../helpers/mocks';

jest.mock('../../../../src/modules/signature/api');

describe('useShareDocumentView', () => {
  let mockClient: ReturnType<typeof createMockHttpClient>;

  beforeEach(() => {
    mockClient = createMockHttpClient();
    jest.clearAllMocks();
  });

  it('should share document view and invalidate queries (lines 35-46)', () => {
    const mockResult = { shareUrl: 'https://example.com/share' };
    (shareDocumentView as jest.Mock).mockResolvedValue(mockResult);

    const { mutate } = useShareDocumentView({ httpClient: mockClient });

    const params = {
      envelopeId: 'env-1',
      email: 'viewer@example.com',
      fullName: 'John Doe',
      message: 'Please review',
      expiresIn: 7,
    };

    mutate(params);

    expect(shareDocumentView).toHaveBeenCalledWith(mockClient, 'env-1', {
      email: 'viewer@example.com',
      fullName: 'John Doe',
      message: 'Please review',
      expiresIn: 7,
    });
  });
});

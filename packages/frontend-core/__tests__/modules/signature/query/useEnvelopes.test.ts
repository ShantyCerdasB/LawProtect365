/**
 * @fileoverview useEnvelopes Hook Tests - Unit tests for envelopes query hook
 * @summary Tests for useEnvelopes.ts module
 * @jest-environment jsdom
 */

import { useEnvelopes } from '../../../../src/modules/signature/query/useEnvelopes';
import { getEnvelopesByUser } from '../../../../src/modules/signature/api';
import { createMockHttpClient } from '../../../helpers/mocks';

jest.mock('../../../../src/modules/signature/api');

describe('useEnvelopes', () => {
  let mockClient: ReturnType<typeof createMockHttpClient>;

  beforeEach(() => {
    mockClient = createMockHttpClient();
    jest.clearAllMocks();
  });

  it('should fetch envelopes without params (lines 34-43)', () => {
    const mockEnvelopes = { items: [], total: 0 };
    (getEnvelopesByUser as jest.Mock).mockResolvedValue(mockEnvelopes);

    useEnvelopes({ httpClient: mockClient });

    expect(getEnvelopesByUser).toHaveBeenCalledWith(mockClient, undefined);
  });

  it('should fetch envelopes with params', () => {
    const mockEnvelopes = { items: [{ id: 'env-1' }], total: 1 };
    (getEnvelopesByUser as jest.Mock).mockResolvedValue(mockEnvelopes);

    const params = { status: 'sent', limit: 10, cursor: 'cursor-123' };
    useEnvelopes({ httpClient: mockClient }, params);

    expect(getEnvelopesByUser).toHaveBeenCalledWith(mockClient, params);
  });
});

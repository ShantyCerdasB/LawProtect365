/**
 * @fileoverview useEnvelope Hook Tests - Unit tests for envelope query hook
 * @summary Tests for useEnvelope.ts module
 * @jest-environment jsdom
 */

import { useEnvelope } from '../../../../src/modules/signature/query/useEnvelope';
import { getEnvelope } from '../../../../src/modules/signature/api';
import { createMockHttpClient } from '../../../helpers/mocks';

jest.mock('../../../../src/modules/signature/api');

describe('useEnvelope', () => {
  let mockClient: ReturnType<typeof createMockHttpClient>;

  beforeEach(() => {
    mockClient = createMockHttpClient();
    jest.clearAllMocks();
  });

  it('should fetch envelope with envelopeId (lines 34-44)', () => {
    const mockEnvelope = { id: 'env-1', status: 'sent' };
    (getEnvelope as jest.Mock).mockResolvedValue(mockEnvelope);

    useEnvelope({ httpClient: mockClient }, { envelopeId: 'env-1', includeSigners: true });

    expect(getEnvelope).toHaveBeenCalledWith(mockClient, 'env-1', {
      invitationToken: undefined,
      includeSigners: true,
    });
  });

  it('should include invitationToken when provided', () => {
    const mockEnvelope = { id: 'env-1', status: 'sent' };
    (getEnvelope as jest.Mock).mockResolvedValue(mockEnvelope);

    useEnvelope({ httpClient: mockClient }, { envelopeId: 'env-1', invitationToken: 'token-123' });

    expect(getEnvelope).toHaveBeenCalledWith(mockClient, 'env-1', {
      invitationToken: 'token-123',
      includeSigners: true,
    });
  });

  it('should be disabled when envelopeId is empty', () => {
    useEnvelope({ httpClient: mockClient }, { envelopeId: '' });

    // Query is disabled, so queryFn should not be called
    expect(getEnvelope).not.toHaveBeenCalled();
  });

  it('should use default includeSigners value', () => {
    const mockEnvelope = { id: 'env-1', status: 'sent' };
    (getEnvelope as jest.Mock).mockResolvedValue(mockEnvelope);

    useEnvelope({ httpClient: mockClient }, { envelopeId: 'env-1' });

    expect(getEnvelope).toHaveBeenCalledWith(mockClient, 'env-1', {
      invitationToken: undefined,
      includeSigners: true,
    });
  });
});

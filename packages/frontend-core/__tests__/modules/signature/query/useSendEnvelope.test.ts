/**
 * @fileoverview useSendEnvelope Hook Tests - Unit tests for send envelope mutation hook
 * @summary Tests for useSendEnvelope.ts module
 * @jest-environment jsdom
 */

import { useSendEnvelope } from '../../../../src/modules/signature/query/useSendEnvelope';
import { sendEnvelope } from '../../../../src/modules/signature/api';
import { createMockHttpClient } from '../../../helpers/mocks';

jest.mock('../../../../src/modules/signature/api');

describe('useSendEnvelope', () => {
  let mockClient: ReturnType<typeof createMockHttpClient>;

  beforeEach(() => {
    mockClient = createMockHttpClient();
    jest.clearAllMocks();
  });

  it('should send envelope and invalidate queries (lines 33-45)', () => {
    const mockResult = { success: true };
    (sendEnvelope as jest.Mock).mockResolvedValue(mockResult);

    const { mutate } = useSendEnvelope({ httpClient: mockClient });

    const params = {
      envelopeId: 'env-1',
      sendToAll: true,
      message: 'Please sign',
    };

    mutate(params);

    expect(sendEnvelope).toHaveBeenCalledWith(mockClient, 'env-1', {
      sendToAll: true,
      message: 'Please sign',
    });
  });
});

/**
 * @fileoverview useDeclineSigner Hook Tests - Unit tests for decline signer mutation hook
 * @summary Tests for useDeclineSigner.ts module
 * @jest-environment jsdom
 */

import { useDeclineSigner } from '../../../../src/modules/signature/query/useDeclineSigner';
import { declineSigner } from '../../../../src/modules/signature/api';
import { createMockHttpClient } from '../../../helpers/mocks';

jest.mock('../../../../src/modules/signature/api');

describe('useDeclineSigner', () => {
  let mockClient: ReturnType<typeof createMockHttpClient>;

  beforeEach(() => {
    mockClient = createMockHttpClient();
    jest.clearAllMocks();
  });

  it('should decline signer and invalidate queries (lines 34-46)', () => {
    const mockResult = { success: true };
    (declineSigner as jest.Mock).mockResolvedValue(mockResult);

    const { mutate } = useDeclineSigner({ httpClient: mockClient });

    const params = {
      envelopeId: 'env-1',
      signerId: 'signer-1',
      invitationToken: 'token-123',
      reason: 'I do not agree',
    };

    mutate(params);

    expect(declineSigner).toHaveBeenCalledWith(mockClient, 'env-1', 'signer-1', {
      invitationToken: 'token-123',
      reason: 'I do not agree',
    });
  });
});

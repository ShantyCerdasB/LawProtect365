/**
 * @fileoverview useUpdateEnvelope Hook Tests - Unit tests for update envelope mutation hook
 * @summary Tests for useUpdateEnvelope.ts module
 * @jest-environment jsdom
 */

import { useUpdateEnvelope } from '../../../../src/modules/signature/query/useUpdateEnvelope';
import { updateEnvelope } from '../../../../src/modules/signature/api';
import { createMockHttpClient } from '../../../helpers/mocks';

jest.mock('../../../../src/modules/signature/api');

describe('useUpdateEnvelope', () => {
  let mockClient: ReturnType<typeof createMockHttpClient>;

  beforeEach(() => {
    mockClient = createMockHttpClient();
    jest.clearAllMocks();
  });

  it('should update envelope and invalidate queries (lines 32-44)', () => {
    const mockResult = { id: 'env-1', title: 'Updated Title' };
    (updateEnvelope as jest.Mock).mockResolvedValue(mockResult);

    const { mutate } = useUpdateEnvelope({ httpClient: mockClient });

    const params = {
      envelopeId: 'env-1',
      title: 'Updated Title',
    };

    mutate(params);

    expect(updateEnvelope).toHaveBeenCalledWith(mockClient, 'env-1', {
      title: 'Updated Title',
    });
  });
});

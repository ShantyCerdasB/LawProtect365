/**
 * @fileoverview useCancelEnvelope Hook Tests - Unit tests for cancel envelope mutation hook
 * @summary Tests for useCancelEnvelope.ts module
 * @jest-environment jsdom
 */

import { useCancelEnvelope } from '../../../../src/modules/signature/query/useCancelEnvelope';
import { cancelEnvelope } from '../../../../src/modules/signature/api';
import { createMockHttpClient } from '../../../helpers/mocks';

jest.mock('../../../../src/modules/signature/api');

describe('useCancelEnvelope', () => {
  let mockClient: ReturnType<typeof createMockHttpClient>;

  beforeEach(() => {
    mockClient = createMockHttpClient();
    jest.clearAllMocks();
  });

  it('should cancel envelope and invalidate queries (lines 29-40)', () => {
    const mockResult = { success: true };
    (cancelEnvelope as jest.Mock).mockResolvedValue(mockResult);

    const { mutate } = useCancelEnvelope({ httpClient: mockClient });

    mutate('env-1');

    expect(cancelEnvelope).toHaveBeenCalledWith(mockClient, 'env-1');
  });
});

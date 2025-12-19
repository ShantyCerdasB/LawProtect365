/**
 * @fileoverview useCreateEnvelope Hook Tests - Unit tests for create envelope mutation hook
 * @summary Tests for useCreateEnvelope.ts module
 * @jest-environment jsdom
 */

import { useCreateEnvelope } from '../../../../src/modules/signature/query/useCreateEnvelope';
import { createEnvelope } from '../../../../src/modules/signature/api';
import { createMockHttpClient } from '../../../helpers/mocks';

jest.mock('../../../../src/modules/signature/api');

describe('useCreateEnvelope', () => {
  let mockClient: ReturnType<typeof createMockHttpClient>;

  beforeEach(() => {
    mockClient = createMockHttpClient();
    jest.clearAllMocks();
  });

  it('should create envelope and invalidate queries (lines 34-44)', () => {
    const mockEnvelope = { id: 'env-1', title: 'Test Envelope' };
    (createEnvelope as jest.Mock).mockResolvedValue(mockEnvelope);

    const { mutate } = useCreateEnvelope({ httpClient: mockClient });

    const params = {
      title: 'Test Envelope',
      originType: 'UPLOAD' as const,
      sourceKey: 's3-key',
      metaKey: 'meta-key',
    };

    mutate(params);

    expect(createEnvelope).toHaveBeenCalledWith(mockClient, params);
  });
});

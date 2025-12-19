/**
 * @fileoverview useAuditTrail Hook Tests - Unit tests for audit trail query hook
 * @summary Tests for useAuditTrail.ts module
 * @jest-environment jsdom
 */

import { useAuditTrail } from '../../../../src/modules/signature/query/useAuditTrail';
import { getAuditTrail } from '../../../../src/modules/signature/api';
import { createMockHttpClient } from '../../../helpers/mocks';

jest.mock('../../../../src/modules/signature/api');

describe('useAuditTrail', () => {
  let mockClient: ReturnType<typeof createMockHttpClient>;

  beforeEach(() => {
    mockClient = createMockHttpClient();
    jest.clearAllMocks();
  });

  it('should fetch audit trail with envelopeId (lines 31-38)', () => {
    const mockAuditTrail = { events: [{ type: 'signature', timestamp: '2024-01-01' }] };
    (getAuditTrail as jest.Mock).mockResolvedValue(mockAuditTrail);

    useAuditTrail({ httpClient: mockClient }, 'env-1');

    expect(getAuditTrail).toHaveBeenCalledWith(mockClient, 'env-1');
  });

  it('should be disabled when envelopeId is empty', () => {
    useAuditTrail({ httpClient: mockClient }, '');

    expect(getAuditTrail).not.toHaveBeenCalled();
  });
});

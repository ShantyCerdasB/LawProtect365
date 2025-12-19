/**
 * @fileoverview useSignDocument Hook Tests - Unit tests for sign document mutation hook
 * @summary Tests for useSignDocument.ts module
 * @jest-environment jsdom
 */

import { useSignDocument } from '../../../../src/modules/signature/query/useSignDocument';
import { signDocument } from '../../../../src/modules/signature/api';
import { createMockHttpClient } from '../../../helpers/mocks';

jest.mock('../../../../src/modules/signature/api');

describe('useSignDocument', () => {
  let mockClient: ReturnType<typeof createMockHttpClient>;

  beforeEach(() => {
    mockClient = createMockHttpClient();
    jest.clearAllMocks();
  });

  it('should sign document and invalidate queries (lines 38-50)', () => {
    const mockResult = { success: true };
    (signDocument as jest.Mock).mockResolvedValue(mockResult);

    const { mutate } = useSignDocument({ httpClient: mockClient });

    const params = {
      envelopeId: 'env-1',
      invitationToken: 'token-123',
      signedDocument: 'base64-pdf',
      consent: {
        given: true,
        timestamp: new Date().toISOString(),
        text: 'I consent',
      },
    };

    mutate(params);

    expect(signDocument).toHaveBeenCalledWith(mockClient, 'env-1', {
      invitationToken: 'token-123',
      signedDocument: 'base64-pdf',
      consent: params.consent,
    });
  });
});

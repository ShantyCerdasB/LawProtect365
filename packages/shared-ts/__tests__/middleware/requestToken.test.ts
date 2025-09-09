import { requireRequestToken } from '../../src/middleware/requestToken.js';

// Mock the requireHeaderToken function
jest.mock('../../src/http/headers.js', () => ({
  requireHeaderToken: jest.fn(),
}));

describe('requireRequestToken', () => {
  const mockRequireHeaderToken = require('../../src/http/headers.js').requireHeaderToken as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('with ApiEvent', () => {
    const mockEvent = {
      headers: {
        'x-request-token': 'test-token-123',
      },
    } as any;

    it('should call requireHeaderToken with default header name', () => {
      mockRequireHeaderToken.mockReturnValue('test-token-123');

      const result = requireRequestToken(mockEvent);

      expect(mockRequireHeaderToken).toHaveBeenCalledWith(
        mockEvent.headers,
        'x-request-token',
        16
      );
      expect(result).toBe('test-token-123');
    });

    it('should call requireHeaderToken with custom header name', () => {
      mockRequireHeaderToken.mockReturnValue('custom-token-456');

      const result = requireRequestToken(mockEvent, 'x-custom-token');

      expect(mockRequireHeaderToken).toHaveBeenCalledWith(
        mockEvent.headers,
        'x-custom-token',
        16
      );
      expect(result).toBe('custom-token-456');
    });

    it('should call requireHeaderToken with custom min length', () => {
      mockRequireHeaderToken.mockReturnValue('short-token');

      const result = requireRequestToken(mockEvent, 'x-request-token', 8);

      expect(mockRequireHeaderToken).toHaveBeenCalledWith(
        mockEvent.headers,
        'x-request-token',
        8
      );
      expect(result).toBe('short-token');
    });

    it('should call requireHeaderToken with both custom header and min length', () => {
      mockRequireHeaderToken.mockReturnValue('custom-length-token');

      const result = requireRequestToken(mockEvent, 'x-auth-token', 12);

      expect(mockRequireHeaderToken).toHaveBeenCalledWith(
        mockEvent.headers,
        'x-auth-token',
        12
      );
      expect(result).toBe('custom-length-token');
    });
  });

  describe('error handling', () => {
    const mockEvent = {
      headers: {},
    } as any;

    it('should propagate errors from requireHeaderToken', () => {
      const error = new Error('Token not found');
      mockRequireHeaderToken.mockImplementation(() => {
        throw error;
      });

      expect(() => requireRequestToken(mockEvent)).toThrow('Token not found');
    });

    it('should propagate validation errors from requireHeaderToken', () => {
      const error = new Error('Token too short');
      mockRequireHeaderToken.mockImplementation(() => {
        throw error;
      });

      expect(() => requireRequestToken(mockEvent, 'x-request-token', 32)).toThrow('Token too short');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined headers', () => {
      const mockEvent = {} as any;
      mockRequireHeaderToken.mockReturnValue('fallback-token');

      const result = requireRequestToken(mockEvent);

      expect(mockRequireHeaderToken).toHaveBeenCalledWith(
        undefined,
        'x-request-token',
        16
      );
      expect(result).toBe('fallback-token');
    });

    it('should handle null headers', () => {
      const mockEvent = { headers: null } as any;
      mockRequireHeaderToken.mockReturnValue('null-headers-token');

      const result = requireRequestToken(mockEvent);

      expect(mockRequireHeaderToken).toHaveBeenCalledWith(
        null,
        'x-request-token',
        16
      );
      expect(result).toBe('null-headers-token');
    });

    it('should handle empty string header name', () => {
      const mockEvent = {
        headers: { '': 'empty-header-token' },
      } as any;
      mockRequireHeaderToken.mockReturnValue('empty-header-token');

      const result = requireRequestToken(mockEvent, '');

      expect(mockRequireHeaderToken).toHaveBeenCalledWith(
        mockEvent.headers,
        '',
        16
      );
      expect(result).toBe('empty-header-token');
    });

    it('should handle zero min length', () => {
      const mockEvent = {
        headers: { 'x-request-token': 'any-token' },
      } as any;
      mockRequireHeaderToken.mockReturnValue('any-token');

      const result = requireRequestToken(mockEvent, 'x-request-token', 0);

      expect(mockRequireHeaderToken).toHaveBeenCalledWith(
        mockEvent.headers,
        'x-request-token',
        0
      );
      expect(result).toBe('any-token');
    });
  });
});
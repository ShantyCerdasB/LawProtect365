import { tenantFromCtx } from '../../../src/controllers/extractors/tenantFromCtx.js';
import type { APIGatewayProxyEvent, APIGatewayProxyEventV2 } from 'aws-lambda';

describe('tenantFromCtx', () => {
  it('should extract tenant ID from API Gateway v1 event', () => {
    const mockEvent: APIGatewayProxyEvent = {
      requestContext: {
        authorizer: {
          tenantId: 'tenant-123',
        },
      },
    } as any;

    const result = tenantFromCtx(mockEvent);

    expect(result).toBe('tenant-123');
  });

  it('should extract tenant ID from API Gateway v2 event', () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      requestContext: {
        authorizer: {
          tenantId: 'tenant-456',
        },
      },
    } as any;

    const result = tenantFromCtx(mockEvent);

    expect(result).toBe('tenant-456');
  });

  it('should throw error when tenant ID is not found in v1 event', () => {
    const mockEvent: APIGatewayProxyEvent = {
      requestContext: {
        authorizer: {},
      },
    } as any;

    expect(() => tenantFromCtx(mockEvent)).toThrow('Tenant ID not found in request context');
  });

  it('should throw error when tenant ID is not found in v2 event', () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      requestContext: {
        authorizer: {},
      },
    } as any;

    expect(() => tenantFromCtx(mockEvent)).toThrow('Tenant ID not found in request context');
  });

  it('should throw error when authorizer is not an object in v1 event', () => {
    const mockEvent: APIGatewayProxyEvent = {
      requestContext: {
        authorizer: 'invalid',
      },
    } as any;

    expect(() => tenantFromCtx(mockEvent)).toThrow('Tenant ID not found in request context');
  });

  it('should throw error when authorizer is not an object in v2 event', () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      requestContext: {
        authorizer: 'invalid',
      },
    } as any;

    expect(() => tenantFromCtx(mockEvent)).toThrow('Tenant ID not found in request context');
  });

  it('should throw error when requestContext is missing', () => {
    const mockEvent = {} as any;

    expect(() => tenantFromCtx(mockEvent)).toThrow('Tenant ID not found in request context');
  });

  it('should throw error when authorizer is missing', () => {
    const mockEvent = {
      requestContext: {},
    } as any;

    expect(() => tenantFromCtx(mockEvent)).toThrow('Tenant ID not found in request context');
  });

  it('should throw error when authorizer exists but has no tenantId property in v1 event', () => {
    const mockEvent: APIGatewayProxyEvent = {
      requestContext: {
        authorizer: {
          actor: { userId: 'user-123' },
          otherProperty: 'value',
        },
      },
    } as any;

    expect(() => tenantFromCtx(mockEvent)).toThrow('Tenant ID not found in request context');
  });

  it('should throw error when authorizer exists but has no tenantId property in v2 event', () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      requestContext: {
        authorizer: {
          actor: { userId: 'user-123' },
          otherProperty: 'value',
        },
      },
    } as any;

    expect(() => tenantFromCtx(mockEvent)).toThrow('Tenant ID not found in request context');
  });
});

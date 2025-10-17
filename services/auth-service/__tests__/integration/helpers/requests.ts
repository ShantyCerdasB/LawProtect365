/**
 * @fileoverview requests - HTTP request builders for integration tests
 * @summary Builders for constructing HTTP requests to handlers
 * @description Provides utilities for building HTTP requests with proper
 * authentication context and headers for integration tests.
 */

import { APIGatewayProxyEvent } from 'aws-lambda';

/**
 * Authentication context for requests
 */
export interface AuthContext {
  sub: string;
  email: string;
  role: string;
  userId: string;
}

/**
 * Request options for building HTTP requests
 */
export interface RequestOptions {
  auth: AuthContext;
  body?: any;
  headers?: Record<string, string>;
  pathParameters?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
}

/**
 * HTTP request builders for different endpoints
 */
export class RequestBuilder {
  /**
   * Builds a PATCH /me request
   * @param options - Request options
   * @returns APIGatewayProxyEvent for PATCH /me
   */
  static patchMe(options: RequestOptions): APIGatewayProxyEvent {
    return {
      httpMethod: 'PATCH',
      path: '/me',
      resource: '/me',
      pathParameters: options.pathParameters || {},
      queryStringParameters: options.queryStringParameters || null,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.createMockToken(options.auth)}`,
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : null,
      isBase64Encoded: false,
      requestContext: {
        requestId: 'test-request-id',
        accountId: 'test-account',
        apiId: 'test-api',
        stage: 'test',
        requestTime: new Date().toISOString(),
        requestTimeEpoch: Date.now(),
        path: '/me',
        resourceId: 'test-resource',
        resourcePath: '/me',
        httpMethod: 'PATCH',
        protocol: 'HTTP/1.1',
        identity: {
          sourceIp: '127.0.0.1',
          userAgent: 'test-user-agent'
        },
        authorizer: {
          claims: {
            sub: options.auth.sub,
            email: options.auth.email,
            'custom:role': options.auth.role,
            'custom:user_id': options.auth.userId
          }
        }
      } as any,
      multiValueHeaders: {},
      multiValueQueryStringParameters: {},
      stageVariables: null
    };
  }

  /**
   * Builds a GET /me request
   * @param options - Request options
   * @returns APIGatewayProxyEvent for GET /me
   */
  static getMe(options: Omit<RequestOptions, 'body'>): APIGatewayProxyEvent {
    return {
      httpMethod: 'GET',
      path: '/me',
      resource: '/me',
      pathParameters: options.pathParameters || {},
      queryStringParameters: options.queryStringParameters || null,
      headers: {
        'Authorization': `Bearer ${this.createMockToken(options.auth)}`,
        ...options.headers
      },
      body: null,
      isBase64Encoded: false,
      requestContext: {
        requestId: 'test-request-id',
        accountId: 'test-account',
        apiId: 'test-api',
        stage: 'test',
        requestTime: new Date().toISOString(),
        requestTimeEpoch: Date.now(),
        path: '/me',
        resourceId: 'test-resource',
        resourcePath: '/me',
        httpMethod: 'GET',
        protocol: 'HTTP/1.1',
        identity: {
          sourceIp: '127.0.0.1',
          userAgent: 'test-user-agent'
        },
        authorizer: {
          claims: {
            sub: options.auth.sub,
            email: options.auth.email,
            'custom:role': options.auth.role,
            'custom:user_id': options.auth.userId
          }
        }
      } as any,
      multiValueHeaders: {},
      multiValueQueryStringParameters: {},
      stageVariables: null
    };
  }

  /**
   * Creates a mock JWT token for testing
   * @param auth - Authentication context
   * @returns Mock JWT token
   */
  private static createMockToken(auth: AuthContext): string {
    // In a real implementation, this would be a properly signed JWT
    // For tests, we just need a string that looks like a token
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      sub: auth.sub,
      email: auth.email,
      'custom:role': auth.role,
      'custom:user_id': auth.userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    })).toString('base64url');
    const signature = 'mock-signature';
    
    return `${header}.${payload}.${signature}`;
  }
}

/**
 * Convenience methods for building specific requests
 */
export const requests = {
  /**
   * Builds a PATCH /me request for updating user profile
   * @param auth - Authentication context
   * @param body - Request body
   * @param headers - Optional headers
   * @returns APIGatewayProxyEvent
   */
  users: {
    patchMe: (auth: AuthContext, body: any, headers?: Record<string, string>) => 
      RequestBuilder.patchMe({ auth, body, headers }),
    
    getMe: (auth: AuthContext, headers?: Record<string, string>) => 
      RequestBuilder.getMe({ auth, headers })
  }
};

/**
 * Creates a request with If-Match header for optimistic concurrency
 * @param auth - Authentication context
 * @param body - Request body
 * @param etag - ETag value for If-Match header
 * @returns APIGatewayProxyEvent with If-Match header
 */
export function createRequestWithIfMatch(
  auth: AuthContext,
  body: any,
  etag: string
): APIGatewayProxyEvent {
  return RequestBuilder.patchMe({
    auth,
    body,
    headers: {
      'If-Match': etag
    }
  });
}

/**
 * Creates a request with invalid authentication
 * @param body - Request body
 * @returns APIGatewayProxyEvent with invalid auth
 */
export function createRequestWithInvalidAuth(body: any): APIGatewayProxyEvent {
  return {
    httpMethod: 'PATCH',
    path: '/me',
    resource: '/me',
    pathParameters: {},
    queryStringParameters: null,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid-token'
    },
    body: JSON.stringify(body),
    isBase64Encoded: false,
    requestContext: {
      requestId: 'test-request-id',
      accountId: 'test-account',
      apiId: 'test-api',
      stage: 'test',
      requestTime: new Date().toISOString(),
      requestTimeEpoch: Date.now(),
      path: '/me',
      resourceId: 'test-resource',
      resourcePath: '/me',
      httpMethod: 'PATCH',
      protocol: 'HTTP/1.1',
      identity: {
        sourceIp: '127.0.0.1',
        userAgent: 'test-user-agent'
      },
      authorizer: null
    } as any,
    multiValueHeaders: {},
    multiValueQueryStringParameters: {},
    stageVariables: null
  };
}

/**
 * Creates a request with missing authentication
 * @param body - Request body
 * @returns APIGatewayProxyEvent without auth
 */
export function createRequestWithoutAuth(body: any): APIGatewayProxyEvent {
  return {
    httpMethod: 'PATCH',
    path: '/me',
    resource: '/me',
    pathParameters: {},
    queryStringParameters: null,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    isBase64Encoded: false,
    requestContext: {
      requestId: 'test-request-id',
      accountId: 'test-account',
      apiId: 'test-api',
      stage: 'test',
      requestTime: new Date().toISOString(),
      requestTimeEpoch: Date.now(),
      path: '/me',
      resourceId: 'test-resource',
      resourcePath: '/me',
      httpMethod: 'PATCH',
      protocol: 'HTTP/1.1',
      identity: {
        sourceIp: '127.0.0.1',
        userAgent: 'test-user-agent'
      },
      authorizer: null
    } as any,
    multiValueHeaders: {},
    multiValueQueryStringParameters: {},
    stageVariables: null
  };
}

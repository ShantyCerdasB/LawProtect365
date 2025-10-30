/**
 * @fileoverview requests - HTTP request builders for integration tests
 * @summary Builders for constructing HTTP requests to handlers
 * @description Provides utilities for building HTTP requests with proper
 * authentication context and headers for integration tests.
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { uuid } from '@lawprotect/shared-ts';

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
    const evt: any = {
      httpMethod: 'PATCH',
      path: '/me',
      resource: '/me',
      pathParameters: options.pathParameters || {},
      queryStringParameters: options.queryStringParameters || null,
      headers: {
        'Content-Type': 'application/json',
        // SecurityContextMiddleware requires country and user agent
        'x-country': 'US',
        'User-Agent': 'jest-test-agent',
        'user-agent': 'jest-test-agent',
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
          userAgent: 'jest-test-agent'
        },
        http: {
          sourceIp: '127.0.0.1',
          userAgent: 'jest-test-agent',
          method: 'PATCH',
          path: '/me'
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

    // Pre-populate auth to bypass real JWT verification in tests
    evt.auth = {
      userId: options.auth.userId,
      roles: [options.auth.role],
      scopes: [],
      permissions: undefined,
      rawClaims: {
        sub: options.auth.sub,
        email: options.auth.email,
        'custom:user_id': options.auth.userId,
        'custom:role': options.auth.role,
      },
      token: 'test-token',
      email: options.auth.email,
      tokenType: 'TEST'
    };

    return evt as APIGatewayProxyEvent;
  }

  /**
   * Builds a POST /me/providers:link request
   * @param options - Request options
   * @returns APIGatewayProxyEvent for POST /me/providers:link
   */
  static linkProvider(options: RequestOptions): APIGatewayProxyEvent {
    const evt: any = {
      httpMethod: 'POST',
      path: '/me/providers:link',
      resource: '/me/providers:link',
      pathParameters: options.pathParameters || {},
      queryStringParameters: options.queryStringParameters || null,
      headers: {
        'Content-Type': 'application/json',
        // SecurityContextMiddleware requires country and user agent
        'x-country': 'US',
        'User-Agent': 'jest-test-agent',
        'user-agent': 'jest-test-agent',
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
        path: '/me/providers:link',
        resourceId: 'test-resource',
        resourcePath: '/me/providers:link',
        httpMethod: 'POST',
        protocol: 'HTTP/1.1',
        identity: {
          sourceIp: '127.0.0.1',
          userAgent: 'jest-test-agent'
        },
        http: {
          sourceIp: '127.0.0.1',
          userAgent: 'jest-test-agent',
          method: 'POST',
          path: '/me/providers:link'
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

    // Pre-populate auth to bypass real JWT verification in tests
    evt.auth = {
      userId: options.auth.userId,
      roles: [options.auth.role],
      scopes: [],
      permissions: undefined,
      rawClaims: {
        sub: options.auth.sub,
        email: options.auth.email,
        'custom:user_id': options.auth.userId,
        'custom:role': options.auth.role,
      },
      token: 'test-token',
      email: options.auth.email,
      tokenType: 'TEST'
    };

    return evt as APIGatewayProxyEvent;
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

  /**
   * Extracts userId from access token or user object
   * @param accessTokenLike - Access token or user object with userId
   * @returns User ID string
   */
  private static extractUserId(accessTokenLike: any): string {
    if (typeof accessTokenLike === 'string') {
      return accessTokenLike;
    }
    if (accessTokenLike && accessTokenLike.userId) {
      return accessTokenLike.userId;
    }
    throw new Error('Invalid access token or user object');
  }

  /**
   * Creates a GET /me request
   * @param accessTokenLike - Access token or user object with userId
   * @param queryParams - Optional query parameters
   * @returns APIGatewayProxyEvent for GET /me
   */
  static getMe(accessTokenLike: any, queryParams: { include?: string } = {}): APIGatewayProxyEvent {
    const userId = this.extractUserId(accessTokenLike);
    
    return {
      resource: '/me',
      path: '/me',
      httpMethod: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-country': 'CR',
        'User-Agent': 'test-user-agent'
      },
      multiValueHeaders: {},
      queryStringParameters: queryParams,
      multiValueQueryStringParameters: {},
      pathParameters: null,
      stageVariables: null,
      requestContext: {
        resourceId: 'test-resource',
        resourcePath: '/me',
        httpMethod: 'GET',
        requestId: uuid(),
        protocol: 'HTTP/1.1',
        accountId: 'test-account',
        apiId: 'test-api',
        stage: 'test',
        requestTime: new Date().toISOString(),
        requestTimeEpoch: Date.now(),
        path: '/me',
        identity: {
          sourceIp: '127.0.0.1',
          userAgent: 'test-user-agent'
        },
        authorizer: {
          claims: {
            sub: `test-cognito-${userId}`,
            'custom:user_id': userId
          }
        }
      } as any,
      body: null,
      isBase64Encoded: false
    };
  }

  /**
   * Creates a GET /admin/users/{id} request
   * @param accessTokenLike - Access token or user object with userId
   * @param userId - Target user ID
   * @param queryParams - Optional query parameters
   * @returns APIGatewayProxyEvent for GET /admin/users/{id}
   */
  static getUserById(accessTokenLike: any, userId: string, queryParams: { include?: string } = {}): APIGatewayProxyEvent {
    const viewerUserId = this.extractUserId(accessTokenLike);
    
    return {
      resource: '/admin/users/{id}',
      path: `/admin/users/${userId}`,
      httpMethod: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-country': 'CR',
        'User-Agent': 'test-user-agent'
      },
      multiValueHeaders: {},
      queryStringParameters: queryParams,
      multiValueQueryStringParameters: {},
      pathParameters: { id: userId },
      stageVariables: null,
      requestContext: {
        resourceId: 'test-resource',
        resourcePath: '/admin/users/{id}',
        httpMethod: 'GET',
        requestId: uuid(),
        protocol: 'HTTP/1.1',
        accountId: 'test-account',
        apiId: 'test-api',
        stage: 'test',
        requestTime: new Date().toISOString(),
        requestTimeEpoch: Date.now(),
        path: `/admin/users/${userId}`,
        identity: {
          sourceIp: '127.0.0.1',
          userAgent: 'test-user-agent'
        },
        authorizer: {
          claims: {
            sub: `test-cognito-${viewerUserId}`,
            'custom:user_id': viewerUserId,
            'custom:role': accessTokenLike.role || 'ADMIN'
          }
        }
      } as any,
      body: null,
      isBase64Encoded: false
    };
  }

  /**
   * Creates a POST /admin/users/{id}:set-role request
   * @param accessTokenLike - Access token or user object with userId
   * @param userId - Target user ID
   * @param body - Request body with role change parameters
   * @returns APIGatewayProxyEvent for POST /admin/users/{id}:set-role
   */
  static setUserRole(accessTokenLike: any, userId: string, body: any): APIGatewayProxyEvent {
    const actorUserId = this.extractUserId(accessTokenLike);
    
    return {
      resource: '/admin/users/{id}:set-role',
      path: `/admin/users/${userId}:set-role`,
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-country': 'CR',
        'User-Agent': 'test-user-agent'
      },
      multiValueHeaders: {},
      queryStringParameters: null,
      multiValueQueryStringParameters: {},
      pathParameters: { id: userId },
      stageVariables: null,
      requestContext: {
        resourceId: 'test-resource',
        resourcePath: '/admin/users/{id}:set-role',
        httpMethod: 'POST',
        requestId: uuid(),
        protocol: 'HTTP/1.1',
        accountId: 'test-account',
        apiId: 'test-api',
        stage: 'test',
        requestTime: new Date().toISOString(),
        requestTimeEpoch: Date.now(),
        path: `/admin/users/${userId}:set-role`,
        identity: {
          sourceIp: '127.0.0.1',
          userAgent: 'test-user-agent'
        },
        authorizer: {
          claims: {
            sub: `test-cognito-${actorUserId}`,
            'custom:user_id': actorUserId,
            'custom:role': accessTokenLike.role || 'ADMIN'
          }
        }
      } as any,
      body: JSON.stringify(body),
      isBase64Encoded: false
    };
  }

  /**
   * Creates a GET /admin/users request
   * @param accessTokenLike - Access token or user object with userId
   * @param queryParams - Optional query parameters
   * @returns APIGatewayProxyEvent for GET /admin/users
   */
  static getUsers(accessTokenLike: any, queryParams: Record<string, any> = {}): APIGatewayProxyEvent {
    const viewerUserId = this.extractUserId(accessTokenLike);
    
    return {
      resource: '/admin/users',
      path: '/admin/users',
      httpMethod: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-country': 'CR',
        'User-Agent': 'test-user-agent'
      },
      multiValueHeaders: {},
      queryStringParameters: queryParams,
      multiValueQueryStringParameters: {},
      pathParameters: null,
      stageVariables: null,
      requestContext: {
        resourceId: 'test-resource',
        resourcePath: '/admin/users',
        httpMethod: 'GET',
        requestId: uuid(),
        protocol: 'HTTP/1.1',
        accountId: 'test-account',
        apiId: 'test-api',
        stage: 'test',
        requestTime: new Date().toISOString(),
        requestTimeEpoch: Date.now(),
        path: '/admin/users',
        identity: {
          sourceIp: '127.0.0.1',
          userAgent: 'test-user-agent'
        },
        authorizer: {
          claims: {
            sub: `test-cognito-${viewerUserId}`,
            'custom:user_id': viewerUserId,
            'custom:role': accessTokenLike.role || 'ADMIN'
          }
        }
      } as any,
      body: null,
      isBase64Encoded: false
    };
  }

  /**
   * Creates a POST /admin/users/{id}:set-status request
   * @param accessTokenLike - Access token or user object with userId
   * @param userId - Target user ID
   * @param body - Request body with status change parameters
   * @returns APIGatewayProxyEvent for POST /admin/users/{id}:set-status
   */
  static setUserStatus(accessTokenLike: any, userId: string, body: any): APIGatewayProxyEvent {
    const actorUserId = this.extractUserId(accessTokenLike);
    
    return {
      resource: '/admin/users/{id}:set-status',
      path: `/admin/users/${userId}:set-status`,
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-country': 'CR',
        'User-Agent': 'test-user-agent'
      },
      multiValueHeaders: {},
      queryStringParameters: null,
      multiValueQueryStringParameters: {},
      pathParameters: { id: userId },
      stageVariables: null,
      requestContext: {
        resourceId: 'test-resource',
        resourcePath: '/admin/users/{id}:set-status',
        httpMethod: 'POST',
        requestId: uuid(),
        protocol: 'HTTP/1.1',
        accountId: 'test-account',
        apiId: 'test-api',
        stage: 'test',
        requestTime: new Date().toISOString(),
        requestTimeEpoch: Date.now(),
        path: `/admin/users/${userId}:set-status`,
        identity: {
          sourceIp: '127.0.0.1',
          userAgent: 'test-user-agent'
        },
        authorizer: {
          claims: {
            sub: `test-cognito-${actorUserId}`,
            'custom:user_id': actorUserId,
            'custom:role': accessTokenLike.role || 'ADMIN'
          }
        }
      } as any,
      body: JSON.stringify(body),
      isBase64Encoded: false
    };
  }

  /**
   * Creates a POST /me/providers:unlink request
   * @param accessTokenLike - Access token or user object with userId
   * @param body - Request body with unlinking parameters
   * @returns APIGatewayProxyEvent for POST /me/providers:unlink
   */
  static unlinkProvider(accessTokenLike: any, body: any): APIGatewayProxyEvent {
    const userId = this.extractUserId(accessTokenLike);
    
    return {
      resource: '/me/providers:unlink',
      path: '/me/providers:unlink',
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-country': 'CR',
        'User-Agent': 'test-user-agent'
      },
      multiValueHeaders: {},
      queryStringParameters: null,
      multiValueQueryStringParameters: {},
      pathParameters: null,
      stageVariables: null,
      requestContext: {
        resourceId: 'test-resource',
        resourcePath: '/me/providers:unlink',
        httpMethod: 'POST',
        requestId: uuid(),
        protocol: 'HTTP/1.1',
        accountId: 'test-account',
        apiId: 'test-api',
        stage: 'test',
        requestTime: new Date().toISOString(),
        requestTimeEpoch: Date.now(),
        path: '/me/providers:unlink',
        identity: {
          sourceIp: '127.0.0.1',
          userAgent: 'test-user-agent'
        },
        authorizer: {
          claims: {
            sub: `test-cognito-${userId}`,
            'custom:user_id': userId
          }
        }
      } as any,
      body: JSON.stringify(body),
      isBase64Encoded: false
    };
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
    
    getMe: (auth: AuthContext, queryParams?: { include?: string }) => 
      RequestBuilder.getMe(auth, queryParams),
    
    linkProvider: (auth: AuthContext, body: any, headers?: Record<string, string>) => 
      RequestBuilder.linkProvider({ auth, body, headers }),
    
            unlinkProvider: (auth: AuthContext, body: any) => 
              RequestBuilder.unlinkProvider(auth, body),
            
            getUserById: (auth: AuthContext, userId: string, queryParams?: { include?: string }) => 
              RequestBuilder.getUserById(auth, userId, queryParams),
            
            setUserRole: (auth: AuthContext, userId: string, body: any) => 
              RequestBuilder.setUserRole(auth, userId, body),
            
            setUserStatus: (auth: AuthContext, userId: string, body: any) => 
              RequestBuilder.setUserStatus(auth, userId, body),
            
            getUsers: (auth: AuthContext, queryParams?: Record<string, any>) => 
              RequestBuilder.getUsers(auth, queryParams)
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

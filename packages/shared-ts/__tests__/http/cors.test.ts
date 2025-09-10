import { buildCorsHeaders, isPreflight, preflightResponse } from '../../src/http/cors.js';
import { CorsConfig } from '../../src/types/corsConfig.js';

describe('buildCorsHeaders', () => {
  it('should build basic CORS headers with string origin', () => {
    const config: CorsConfig = {
      allowOrigins: ['https://example.com']};

    const headers = buildCorsHeaders(config);

    expect(headers).toEqual({
      'Access-Control-Allow-Origin': 'https://example.com',
      'Vary': 'Origin'});
  });

  it('should build CORS headers with array of origins', () => {
    const config: CorsConfig = {
      allowOrigins: ['https://example.com', 'https://app.example.com']};

    const headers = buildCorsHeaders(config);

    expect(headers).toEqual({
      'Access-Control-Allow-Origin': 'https://example.com,https://app.example.com',
      'Vary': 'Origin'});
  });

  it('should include allow methods when provided', () => {
    const config: CorsConfig = {
      allowOrigins: ['https://example.com'],
      allowMethods: ['GET', 'POST', 'PUT']};

    const headers = buildCorsHeaders(config);

    expect(headers).toEqual({
      'Access-Control-Allow-Origin': 'https://example.com',
      'Vary': 'Origin',
      'Access-Control-Allow-Methods': 'GET,POST,PUT'});
  });

  it('should include allow headers when provided', () => {
    const config: CorsConfig = {
      allowOrigins: ['https://example.com'],
      allowHeaders: ['Content-Type', 'Authorization']};

    const headers = buildCorsHeaders(config);

    expect(headers).toEqual({
      'Access-Control-Allow-Origin': 'https://example.com',
      'Vary': 'Origin',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization'});
  });

  it('should include expose headers when provided', () => {
    const config: CorsConfig = {
      allowOrigins: ['https://example.com'],
      exposeHeaders: ['X-Total-Count', 'X-Page-Size']};

    const headers = buildCorsHeaders(config);

    expect(headers).toEqual({
      'Access-Control-Allow-Origin': 'https://example.com',
      'Vary': 'Origin',
      'Access-Control-Expose-Headers': 'X-Total-Count,X-Page-Size'});
  });

  it('should include allow credentials when true', () => {
    const config: CorsConfig = {
      allowOrigins: ['https://example.com'],
      allowCredentials: true};

    const headers = buildCorsHeaders(config);

    expect(headers).toEqual({
      'Access-Control-Allow-Origin': 'https://example.com',
      'Vary': 'Origin',
      'Access-Control-Allow-Credentials': 'true'});
  });

  it('should include max age when provided', () => {
    const config: CorsConfig = {
      allowOrigins: ['https://example.com'],
      maxAgeSeconds: 3600};

    const headers = buildCorsHeaders(config);

    expect(headers).toEqual({
      'Access-Control-Allow-Origin': 'https://example.com',
      'Vary': 'Origin',
      'Access-Control-Max-Age': '3600'});
  });

  it('should build complete CORS headers with all options', () => {
    const config: CorsConfig = {
      allowOrigins: ['https://example.com', 'https://app.example.com'],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposeHeaders: ['X-Total-Count'],
      allowCredentials: true,
      maxAgeSeconds: 86400};

    const headers = buildCorsHeaders(config);

    expect(headers).toEqual({
      'Access-Control-Allow-Origin': 'https://example.com,https://app.example.com',
      'Vary': 'Origin',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
      'Access-Control-Expose-Headers': 'X-Total-Count',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400'});
  });

  it('should not include optional headers when not provided', () => {
    const config: CorsConfig = {
      allowOrigins: ['https://example.com']};

    const headers = buildCorsHeaders(config);

    expect(headers).not.toHaveProperty('Access-Control-Allow-Methods');
    expect(headers).not.toHaveProperty('Access-Control-Allow-Headers');
    expect(headers).not.toHaveProperty('Access-Control-Expose-Headers');
    expect(headers).not.toHaveProperty('Access-Control-Allow-Credentials');
    expect(headers).not.toHaveProperty('Access-Control-Max-Age');
  });

  it('should not include allow methods when empty array', () => {
    const config: CorsConfig = {
      allowOrigins: ['https://example.com'],
      allowMethods: []};

    const headers = buildCorsHeaders(config);

    expect(headers).not.toHaveProperty('Access-Control-Allow-Methods');
  });

  it('should not include allow headers when empty array', () => {
    const config: CorsConfig = {
      allowOrigins: ['https://example.com'],
      allowHeaders: []};

    const headers = buildCorsHeaders(config);

    expect(headers).not.toHaveProperty('Access-Control-Allow-Headers');
  });

  it('should not include expose headers when empty array', () => {
    const config: CorsConfig = {
      allowOrigins: ['https://example.com'],
      exposeHeaders: []};

    const headers = buildCorsHeaders(config);

    expect(headers).not.toHaveProperty('Access-Control-Expose-Headers');
  });

  it('should not include allow credentials when false', () => {
    const config: CorsConfig = {
      allowOrigins: ['https://example.com'],
      allowCredentials: false};

    const headers = buildCorsHeaders(config);

    expect(headers).not.toHaveProperty('Access-Control-Allow-Credentials');
  });

  it('should not include max age when not a number', () => {
    const config: CorsConfig = {
      allowOrigins: ['https://example.com'],
      maxAgeSeconds: undefined};

    const headers = buildCorsHeaders(config);

    expect(headers).not.toHaveProperty('Access-Control-Max-Age');
  });
});

describe('isPreflight', () => {
  it('should return true for OPTIONS method', () => {
    const event = {
      version: '2.0',
      routeKey: 'GET /test',
      rawPath: '/test',
      rawQueryString: '',
      headers: {},
      requestContext: {
        http: {
          method: 'OPTIONS'}}} as any;

    expect(isPreflight(event)).toBe(true);
  });

  it('should return true for lowercase options method', () => {
    const event = {
      version: '2.0',
      routeKey: 'GET /test',
      rawPath: '/test',
      rawQueryString: '',
      headers: {},
      requestContext: {
        http: {
          method: 'options'}}} as any;

    expect(isPreflight(event)).toBe(true);
  });

  it('should return false for GET method', () => {
    const event = {
      version: '2.0',
      routeKey: 'GET /test',
      rawPath: '/test',
      rawQueryString: '',
      headers: {},
      requestContext: {
        http: {
          method: 'GET'}}} as any;

    expect(isPreflight(event)).toBe(false);
  });

  it('should return false for POST method', () => {
    const event = {
      version: '2.0',
      routeKey: 'POST /test',
      rawPath: '/test',
      rawQueryString: '',
      headers: {},
      requestContext: {
        http: {
          method: 'POST'}}} as any;

    expect(isPreflight(event)).toBe(false);
  });

  it('should return false when method is undefined', () => {
    const event = {
      version: '2.0',
      routeKey: 'GET /test',
      rawPath: '/test',
      rawQueryString: '',
      headers: {},
      requestContext: {
        http: {}}} as any;

    expect(isPreflight(event)).toBe(false);
  });

  it('should return false when method is null', () => {
    const event = {
      version: '2.0',
      routeKey: 'GET /test',
      rawPath: '/test',
      rawQueryString: '',
      headers: {},
      requestContext: {
        http: {
          method: null}}} as any;

    expect(isPreflight(event)).toBe(false);
  });

  it('should return false when method is empty string', () => {
    const event = {
      version: '2.0',
      routeKey: 'GET /test',
      rawPath: '/test',
      rawQueryString: '',
      headers: {},
      requestContext: {
        http: {
          method: ''}}} as any;

    expect(isPreflight(event)).toBe(false);
  });
});

describe('preflightResponse', () => {
  it('should create preflight response with headers', () => {
    const headers = {
      'Access-Control-Allow-Origin': 'https://example.com',
      'Access-Control-Allow-Methods': 'GET,POST'};

    const response = preflightResponse(headers);

    expect(response).toEqual({
      statusCode: 204,
      headers,
      body: ''});
  });

  it('should create preflight response with empty headers', () => {
    const headers = {};

    const response = preflightResponse(headers);

    expect(response).toEqual({
      statusCode: 204,
      headers: {},
      body: ''});
  });

  it('should create preflight response with complex headers', () => {
    const headers = {
      'Access-Control-Allow-Origin': 'https://example.com',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '3600'};

    const response = preflightResponse(headers);

    expect(response).toEqual({
      statusCode: 204,
      headers,
      body: ''});
  });
});
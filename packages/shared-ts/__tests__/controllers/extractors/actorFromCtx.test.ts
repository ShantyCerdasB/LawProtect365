import { actorFromCtx } from '../../../src/controllers/extractors/actorFromCtx.js';
import type { APIGatewayProxyEvent, APIGatewayProxyEventV2 } from 'aws-lambda';

describe('actorFromCtx', () => {
  it('should extract actor from API Gateway v1 event', () => {
    const mockEvent: APIGatewayProxyEvent = {
      requestContext: {
        authorizer: {
          actor: {
            userId: 'user-123',
            email: 'user@example.com'}}}} as any;

    const result = actorFromCtx(mockEvent);

    expect(result).toEqual({
      userId: 'user-123',
      email: 'user@example.com'});
  });

  it('should extract actor from API Gateway v2 event', () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      requestContext: {
        authorizer: {
          actor: {
            userId: 'user-456',
            email: 'user2@example.com'}}}} as any;

    const result = actorFromCtx(mockEvent);

    expect(result).toEqual({
      userId: 'user-456',
      email: 'user2@example.com'});
  });

  it('should throw error when actor is not found in v1 event', () => {
    const mockEvent: APIGatewayProxyEvent = {
      requestContext: {
        authorizer: {}}} as any;

    expect(() => actorFromCtx(mockEvent)).toThrow('Actor context not found in request context');
  });

  it('should throw error when actor is not found in v2 event', () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      requestContext: {
        authorizer: {}}} as any;

    expect(() => actorFromCtx(mockEvent)).toThrow('Actor context not found in request context');
  });

  it('should throw error when authorizer is not an object in v1 event', () => {
    const mockEvent: APIGatewayProxyEvent = {
      requestContext: {
        authorizer: 'invalid'}} as any;

    expect(() => actorFromCtx(mockEvent)).toThrow('Actor context not found in request context');
  });

  it('should throw error when authorizer is not an object in v2 event', () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      requestContext: {
        authorizer: 'invalid'}} as any;

    expect(() => actorFromCtx(mockEvent)).toThrow('Actor context not found in request context');
  });

  it('should throw error when requestContext is missing', () => {
    const mockEvent = {} as any;

    expect(() => actorFromCtx(mockEvent)).toThrow('Actor context not found in request context');
  });

  it('should throw error when authorizer is missing', () => {
    const mockEvent = {
      requestContext: {}} as any;

    expect(() => actorFromCtx(mockEvent)).toThrow('Actor context not found in request context');
  });

  it('should throw error when authorizer exists but has no actor property in v1 event', () => {
    const mockEvent: APIGatewayProxyEvent = {
      requestContext: {
        authorizer: {
          otherProperty: 'value'}}} as any;

    expect(() => actorFromCtx(mockEvent)).toThrow('Actor context not found in request context');
  });

  it('should throw error when authorizer exists but has no actor property in v2 event', () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      requestContext: {
        authorizer: {
          otherProperty: 'value'}}} as any;

    expect(() => actorFromCtx(mockEvent)).toThrow('Actor context not found in request context');
  });
});

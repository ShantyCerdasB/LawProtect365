/**
 * @file ListConsents.Controller.ts
 * @summary Controller for listing consents with rate limiting and caching
 * @description Handles GET /envelopes/:envelopeId/consents requests with rate limiting and simple cache
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { makeConsentQueryPort } from "../../../app/adapters/consent/MakeConsentQueryPort";
import { ConsentQueryService } from "../../../app/services/Consent/ConsentQueryService";
import type { ListConsentsControllerInput } from "../../../shared/types/consent/ControllerInputs";
import type { ListConsentsAppResult } from "../../../shared/types/consent/AppServiceInputs";
import { ListConsentsPath, ListConsentsQuery } from "../../schemas/consents/ListConsents.schema";
import type { EnvelopeId, PartyId } from "../../../domain/value-objects/Ids";
import type { ConsentType, ConsentStatus } from "../../../domain/values/enums";
import { getContainer } from "../../../core/Container";
import { TooManyRequestsError } from "../../../shared/errors";

/**
 * @summary Rate limit configuration for ListConsents
 * @description Defines rate limits per tenant and envelope
 */
const RATE_LIMIT_CONFIG = {
  REQUESTS_PER_MINUTE: 60,
  REQUESTS_PER_HOUR: 1000,
  CACHE_TTL_SECONDS: 300, // 5 minutes
} as const;

/**
 * @summary Generates cache key for consent listing
 * @description Creates a unique cache key based on query parameters
 */
const generateCacheKey = (
  tenantId: string,
  envelopeId: string,
  query: Record<string, unknown>
): string => {
  const queryHash = JSON.stringify(query);
  return `consents:${tenantId}:${envelopeId}:${Buffer.from(queryHash).toString('base64').slice(0, 16)}`;
};

/**
 * @summary Checks rate limit for the request
 * @description Validates if the request is within rate limits
 */
const checkRateLimit = async (
  tenantId: string,
  envelopeId: string
): Promise<void> => {
  const container = getContainer();
  const rateLimitStore = container.rateLimit.otpStore;
  
  // Check per-minute limit
  const minuteKey = `consents:${tenantId}:${envelopeId}:minute:${Math.floor(Date.now() / 60000)}`;
  const minuteUsage = await rateLimitStore.incrementAndCheck(minuteKey, {
    windowSeconds: 60,
    maxRequests: RATE_LIMIT_CONFIG.REQUESTS_PER_MINUTE,
    ttlSeconds: 60, // Add missing ttlSeconds
  });
  
  if (minuteUsage.currentUsage > minuteUsage.maxRequests) {
    throw new TooManyRequestsError(
      'Rate limit exceeded for this envelope',
      undefined,
      { 
        resetInSeconds: minuteUsage.resetInSeconds,
        currentUsage: minuteUsage.currentUsage,
        maxRequests: minuteUsage.maxRequests
      }
    );
  }
  
  // Check per-hour limit
  const hourKey = `consents:${tenantId}:${envelopeId}:hour:${Math.floor(Date.now() / 3600000)}`;
  const hourUsage = await rateLimitStore.incrementAndCheck(hourKey, {
    windowSeconds: 3600,
    maxRequests: RATE_LIMIT_CONFIG.REQUESTS_PER_HOUR,
    ttlSeconds: 3600, // Add missing ttlSeconds
  });
  
  if (hourUsage.currentUsage > hourUsage.maxRequests) {
    throw new TooManyRequestsError(
      'Hourly rate limit exceeded for this envelope',
      undefined,
      { 
        resetInSeconds: hourUsage.resetInSeconds,
        currentUsage: hourUsage.currentUsage,
        maxRequests: hourUsage.maxRequests
      }
    );
  }
};

/**
 * @summary Gets cached result if available
 * @description Retrieves cached consent listing result
 */
const getCachedResult = async (
  cacheKey: string
): Promise<ListConsentsAppResult | null> => {
  try {
    const container = getContainer();
    // Use the DynamoDB client directly from the container
    const ddbClient = container.aws.ddb;
    
    // For now, skip cache if no dedicated cache table is configured
    // TODO: Add cache table configuration to Config.ts
    return null;
  } catch (error) {
    // Cache errors should not break the main flow
    console.warn('Cache retrieval failed:', error);
    return null;
  }
};

/**
 * @summary Caches the result for future requests
 * @description Stores the consent listing result in cache
 */
const cacheResult = async (
  cacheKey: string,
  result: ListConsentsAppResult
): Promise<void> => {
  try {
    const container = getContainer();
    // Use the DynamoDB client directly from the container
    const ddbClient = container.aws.ddb;
    
    // For now, skip cache if no dedicated cache table is configured
    // TODO: Add cache table configuration to Config.ts
  } catch (error) {
    // Cache errors should not break the main flow
    console.warn('Cache storage failed:', error);
  }
};

/**
 * @summary Main handler for ListConsents with rate limiting and caching
 * @description Processes the request with rate limiting, caching, and validation
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const container = getContainer();
    
    // Extract and validate path parameters using Zod directly
    const pathParams = ListConsentsPath.parse(event.pathParameters || {});
    const queryParams = ListConsentsQuery.parse(event.queryStringParameters || {});
    
    // Extract tenant ID from headers or context
    const tenantId = event.headers['x-tenant-id'] || 'default';
    
    // Check rate limits
    await checkRateLimit(tenantId, pathParams.envelopeId);
    
    // Generate cache key
    const cacheKey = generateCacheKey(tenantId, pathParams.envelopeId, queryParams);
    
    // Try to get cached result
    const cachedResult = await getCachedResult(cacheKey);
    if (cachedResult) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'X-Cache-TTL': RATE_LIMIT_CONFIG.CACHE_TTL_SECONDS.toString(),
        },
        body: JSON.stringify({
          success: true,
          data: cachedResult,
          cached: true,
        }),
      };
    }
    
    // Create dependencies and extract parameters
    const consentQueryPort = makeConsentQueryPort(container.repos.consents);
    const consentQueryService = new ConsentQueryService(consentQueryPort);
    
    // Create input with tenantId (we'll need to add this to the type)
    const input = {
      tenantId: tenantId as any, // TODO: Use proper TenantId type
      envelopeId: pathParams.envelopeId,
      limit: queryParams.limit,
      cursor: queryParams.cursor,
      status: queryParams.status,
      type: queryParams.consentType,
      partyId: queryParams.partyId,
    };
    
    // Execute the query
    const result = await consentQueryService.execute(input);
    
    // Cache the result
    await cacheResult(cacheKey, result as ListConsentsAppResult);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'X-Cache-TTL': RATE_LIMIT_CONFIG.CACHE_TTL_SECONDS.toString(),
      },
      body: JSON.stringify({
        success: true,
        data: result,
        cached: false,
      }),
    };
    
  } catch (error) {
    console.error('ListConsents error:', error);
    
    if (error instanceof TooManyRequestsError) {
      return {
        statusCode: 429,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Too Many Requests',
          message: error.message,
          details: error.details,
        }),
      };
    }
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      }),
    };
  }
};

import { SecurityContext } from '../../types/security.js';
import { UserId } from '../../types/brand.js';

export interface RequestData {
  headers?: Record<string, string | undefined>;
  requestContext?: any;
  securityContext?: any;
  requestBody?: any;
}

export class SecurityContextBuilder {
  build(request: RequestData): SecurityContext {
    const baseContext = this.extractBaseContext(request);
    
    if (this.isInvitationToken(request)) {
      return this.buildInvitationContext(baseContext, request);
    }
    
    return this.buildAuthenticatedContext(baseContext, request);
  }

  private extractBaseContext(request: RequestData): Partial<SecurityContext> {
    const { headers, requestContext, securityContext, requestBody } = request;

    const ipAddress =
      headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      headers?.['x-real-ip']?.trim() ||
      securityContext?.ipAddress ||
      requestContext?.http?.sourceIp ||
      requestBody?.metadata?.ipAddress;

    const userAgent =
      headers?.['user-agent'] ||
      securityContext?.userAgent ||
      requestContext?.http?.userAgent ||
      requestBody?.metadata?.userAgent;

    const country =
      headers?.['x-country'] ||
      headers?.['X-Country'] ||
      headers?.['cf-ipcountry'] ||
      headers?.['CF-IPCountry'] ||
      (requestBody?.metadata?.country as string | undefined);

    return {
      ipAddress,
      userAgent,
      country,
    };
  }

  private isInvitationToken(request: RequestData): boolean {
    // Check authorization header first
    const authHeader = request.headers?.['authorization'];
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      if (token.startsWith('invitation_')) return true;
    }
    
    // Check request body for invitation token
    if (request.requestBody) {
      try {
        const body = typeof request.requestBody === 'string' 
          ? JSON.parse(request.requestBody) 
          : request.requestBody;
        if (body?.invitationToken && typeof body.invitationToken === 'string') {
          // Any string in invitationToken field is considered valid (no prefix check needed)
          return true;
        }
      } catch (e) {
        // Log parsing errors for debugging but continue with default behavior
        console.warn('Failed to parse request body for invitation token check:', e instanceof Error ? e.message : 'Unknown error');
      }
    }
    
    return false;
  }

  private buildInvitationContext(baseContext: Partial<SecurityContext>, request: RequestData): SecurityContext {
    let token = '';
    
    // Try to get token from authorization header first
    const authHeader = request.headers?.['authorization'];
    if (authHeader) {
      token = authHeader.replace('Bearer ', '');
    }
    
    // If no token in header, try to get from request body
    if (!token && request.requestBody) {
      try {
        const body = typeof request.requestBody === 'string' 
          ? JSON.parse(request.requestBody) 
          : request.requestBody;
        if (body?.invitationToken && typeof body.invitationToken === 'string') {
          token = body.invitationToken;
        }
      } catch (e) {
        // Log parsing errors for debugging but continue with default behavior
        console.warn('Failed to parse request body for invitation token extraction:', e instanceof Error ? e.message : 'Unknown error');
      }
    }

    return {
      ...baseContext,
      userId: 'external-user' as UserId,
      ipAddress: baseContext.ipAddress!,
      userAgent: baseContext.userAgent!,
      country: baseContext.country!,
      accessType: 'INVITATION' as const,
      tokenType: 'INVITATION' as const,
      invitationToken: token,
      permissions: [],
      roles: [],
    } as SecurityContext;
  }

  private buildAuthenticatedContext(baseContext: Partial<SecurityContext>, request: RequestData): SecurityContext {
    const merged = {
      ...baseContext,
      ...request.securityContext,
    } as Partial<SecurityContext>;

    return {
      userId: (merged as any).userId,
      roles: (merged as any).roles || [],
      scopes: (merged as any).scopes,
      permissions: (merged as any).permissions,
      ipAddress: merged.ipAddress!,
      userAgent: merged.userAgent!,
      country: merged.country!,
      accessType: 'DIRECT' as const,
      tokenType: 'JWT' as const,
      invitationToken: undefined
    } as SecurityContext;
  }
}

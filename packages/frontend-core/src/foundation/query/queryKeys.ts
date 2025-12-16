/**
 * @description Centralized React Query keys to avoid string literals across the app.
 */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const
  },
  signature: {
    envelopes: (params?: { status?: string; limit?: number; cursor?: string }) => 
      ['signature', 'envelopes', params] as const,
    envelope: (envelopeId: string, params?: { invitationToken?: string }) => 
      ['signature', 'envelope', envelopeId, params] as const,
    auditTrail: (envelopeId: string) => 
      ['signature', 'audit-trail', envelopeId] as const
  }
};


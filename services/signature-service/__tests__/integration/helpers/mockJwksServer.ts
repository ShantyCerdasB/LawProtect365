/**
 * @file mockJwksServer.ts
 * @summary Improved mock JWKS server for integration tests
 * @description Creates a robust mock JWKS server that simulates Cognito for testing RS256 JWT tokens.
 * This server provides realistic JWT tokens that match Cognito's format and behavior.
 */

import { generateKeyPairSync } from 'crypto';
import { SignJWT, importPKCS8, exportJWK, importSPKI } from 'jose';
import express from 'express';

/**
 * Generate RSA key pair for testing (matching Cognito's key specifications)
 * @description Creates a 2048-bit RSA key pair with proper encoding for JWT signing and verification
 */
const { publicKey, privateKey } = generateKeyPairSync('rsa', { 
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

/**
 * Convert private key to jose format for signing
 * @description Imports the private key in PKCS8 format for use with the jose library
 */
const josePrivateKey = importPKCS8(privateKey, 'RS256');

/**
 * Store key metadata for better debugging
 * @description Contains metadata about the generated key pair for logging and debugging purposes
 */
const keyMetadata = {
  keyId: 'test-key-id',
  algorithm: 'RS256',
  keyType: 'RSA',
  keySize: 2048,
  createdAt: new Date().toISOString()
};

/**
 * Create JWKS (JSON Web Key Set) with the public key
 * @description Global variable to store the JWKS object after initialization
 */
const jwksState = { value: null as any };

/**
 * Initialize JWKS with proper format (matching Cognito's JWKS structure)
 * 
 * @returns Promise that resolves when JWKS is initialized
 * @description Creates the JSON Web Key Set object with the public key in the format
 * expected by JWT verification libraries, matching Cognito's JWKS structure.
 */
const initializeJwks = async () => {
  const josePublicKey = await importSPKI(publicKey, 'RS256');
  const jwk = await exportJWK(josePublicKey);
  
  jwksState.value = {
    keys: [{
      ...jwk,
      kid: keyMetadata.keyId,
      use: 'sig',
      alg: keyMetadata.algorithm,
      key_ops: ['verify'],
      x5t: keyMetadata.keyId, // Thumbprint for compatibility
      'x5t#S256': keyMetadata.keyId // SHA-256 thumbprint
    }]
  };
  
  console.log('🔑 JWKS initialized with key:', {
    keyId: keyMetadata.keyId,
    algorithm: keyMetadata.algorithm,
    keyType: keyMetadata.keyType,
    keySize: keyMetadata.keySize
  });
};

/**
 * Create Express server
 * @description Express application instance for serving JWKS endpoints
 */
const app = express();

/**
 * Server port configuration
 * @description Port number for the mock JWKS server
 */
const PORT = 3000;

/**
 * Serve JWKS endpoint (matching Cognito's endpoint structure)
 * @description Express route handler for serving the JSON Web Key Set at the standard JWKS endpoint
 */
app.get('/.well-known/jwks.json', (_req, res) => {
  if (!jwksState.value) {
    console.error('❌ JWKS not initialized when requested');
    res.status(500).json({ error: 'JWKS not initialized' });
    return;
  }
  
  // Add CORS headers for cross-origin requests
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  console.log('🔍 JWKS requested, serving key:', keyMetadata.keyId);
  res.json(jwksState.value);
});

/**
 * Health check endpoint
 * @description Express route handler for server health status and key metadata information
 */
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Improved mock JWKS server running',
    keyMetadata: keyMetadata,
    timestamp: new Date().toISOString()
  });
});

/**
 * Add error handling middleware
 * @description Express error handling middleware for catching and logging server errors
 */
app.use((error: any, _req: any, res: any, _next: any) => {
  console.error('❌ Mock JWKS server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

/**
 * Start server
 * @description Global variable to store the Express server instance
 */
const serverState = { value: null as any };

/**
 * Start the mock JWKS server
 * 
 * @returns Promise that resolves when the server is successfully started
 * @description Initializes the JWKS and starts the Express server on the configured port.
 * The server provides JWKS endpoint and health check endpoint for JWT verification testing.
 */
export const startMockJwksServer = async (): Promise<void> => {
  // Initialize JWKS first
  await initializeJwks();
  
  return new Promise((resolve, reject) => {
    try {
      serverState.value = app.listen(PORT, () => {
        console.log(`🔐 Improved mock JWKS server running on http://localhost:${PORT}`);
        console.log(`📋 Available endpoints:`);
        console.log(`   - JWKS: http://localhost:${PORT}/.well-known/jwks.json`);
        console.log(`   - Health: http://localhost:${PORT}/health`);
        console.log(`🔑 Key metadata:`, keyMetadata);
        resolve();
      });
      
      serverState.value.on('error', (error: any) => {
        console.error('❌ Failed to start mock JWKS server:', error);
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Stop the mock JWKS server
 * 
 * @returns Promise that resolves when the server is successfully stopped
 * @description Gracefully shuts down the Express server and cleans up resources.
 * Safe to call even if the server is not running.
 */
export const stopMockJwksServer = (): Promise<void> => {
  return new Promise((resolve) => {
    if (serverState.value) {
      serverState.value.close(() => {
        console.log('🔐 Improved mock JWKS server stopped');
        resolve();
      });
    } else {
      console.log('🔐 Mock JWKS server was not running');
      resolve();
    }
  });
};

/**
 * Generate RS256 JWT token for testing (matching Cognito's token format)
 * 
 * @param payload - JWT payload with user information
 * @param expiresIn - Token expiration time (default: '1h')
 * @returns Promise resolving to RS256 JWT token string
 * @description Creates a cryptographically signed JWT token using the mock server's private key.
 * The token payload matches Cognito's format exactly for realistic testing scenarios.
 */
export const generateRS256Token = async (
  payload: {
    sub: string;
    email: string;
    roles?: string[];
    scopes?: string[];
    [key: string]: any;
  },
  expiresIn: string = '1h'
): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (expiresIn === '1h' ? 3600 : 86400); // 1 hour or 1 day

  // Create token payload matching Cognito's format exactly
  const tokenPayload = {
    ...payload,
    iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test',
    aud: 'test-client-id',
    exp: exp,
    iat: now,
    token_use: 'access',
    scope: 'aws.cognito.signin.user.admin',
    auth_time: now,
    'cognito:groups': payload.roles || ['customer'],
    'cognito:username': payload.sub,
    'cognito:roles': payload.roles || ['customer'],
    'cognito:preferred_role': payload.roles?.[0] || 'customer',
    client_id: 'test-client-id',
    username: payload.sub,
    jti: `test-jti-${now}-${Math.random().toString(36).substr(2, 9)}` // Unique JWT ID
  };

  console.log('🔍 [TOKEN DEBUG] Generating RS256 token with payload:', {
    sub: tokenPayload.sub,
    email: tokenPayload.email,
    roles: tokenPayload['cognito:groups'],
    exp: new Date(exp * 1000).toISOString(),
    jti: tokenPayload.jti
  });

  const token = await new SignJWT(tokenPayload)
    .setProtectedHeader({ alg: 'RS256', kid: keyMetadata.keyId })
    .setIssuer('https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test')
    .setAudience('test-client-id')
    .setExpirationTime(expiresIn)
    .setJti(tokenPayload.jti)
    .sign(await josePrivateKey);

  console.log('🔍 [TOKEN DEBUG] Generated token (first 50 chars):', token.substring(0, 50) + '...');
  console.log('🔍 [TOKEN DEBUG] Token length:', token.length);

  return token;
};

/**
 * Export the private key for advanced testing scenarios
 * @description Exports the generated key pair and JWKS for advanced testing scenarios
 * where direct access to keys or JWKS is required.
 */
export { privateKey, publicKey, jwksState };

/**
 * @file mockJwksServer.ts
 * @summary Mock JWKS server for integration tests
 * @description Creates a mock JWKS server that simulates Cognito for testing RS256 JWT tokens
 */

import { generateKeyPairSync } from 'crypto';
import { SignJWT, importPKCS8, exportJWK, importSPKI } from 'jose';
import express from 'express';

// Generate RSA key pair for testing
const { publicKey, privateKey } = generateKeyPairSync('rsa', { 
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

// Convert private key to jose format
const josePrivateKey = importPKCS8(privateKey, 'RS256');

// Create JWKS (JSON Web Key Set) with the public key
let jwks: any = null;

// Initialize JWKS with proper format
const initializeJwks = async () => {
  const josePublicKey = await importSPKI(publicKey, 'RS256');
  const jwk = await exportJWK(josePublicKey);
  jwks = {
    keys: [{
      ...jwk,
      kid: 'test-key-id',
      use: 'sig',
      alg: 'RS256'
    }]
  };
};

// Create Express server
const app = express();
const PORT = 3000;

// Serve JWKS endpoint
app.get('/.well-known/jwks.json', (_req, res) => {
  if (!jwks) {
    res.status(500).json({ error: 'JWKS not initialized' });
    return;
  }
  res.json(jwks);
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Mock JWKS server running' });
});

// Start server
let server: any = null;

export const startMockJwksServer = async (): Promise<void> => {
  // Initialize JWKS first
  await initializeJwks();
  
  return new Promise((resolve, reject) => {
    try {
      server = app.listen(PORT, () => {
        console.log(`Mock JWKS server running on http://localhost:${PORT}`);
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
};

export const stopMockJwksServer = (): Promise<void> => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('Mock JWKS server stopped');
        resolve();
      });
    } else {
      resolve();
    }
  });
};

/**
 * Generate RS256 JWT token for testing
 * @param payload - JWT payload
 * @param expiresIn - Token expiration time (default: '1h')
 * @returns RS256 JWT token
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

  const token = await new SignJWT({
    ...payload,
    iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test',
    aud: 'test-client-id',
    exp: exp,
    iat: now,
    token_use: 'access',
    scope: 'aws.cognito.signin.user.admin',
    auth_time: now,
    'cognito:groups': payload.roles || ['customer'],
    'cognito:username': payload.sub
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key-id' })
    .setIssuer('https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test')
    .setAudience('test-client-id')
    .setExpirationTime(expiresIn)
    .sign(await josePrivateKey);

  return token;
};

// Export the private key for advanced testing scenarios
export { privateKey, publicKey, jwks };

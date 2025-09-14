/**
 * @file mockJwksServer.ts
 * @summary Improved mock JWKS server for integration tests
 * @description Creates a robust mock JWKS server that simulates Cognito for testing RS256 JWT tokens.
 * This server provides realistic JWT tokens that match Cognito's format and behavior.
 */

import { generateKeyPairSync } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { SignJWT, importPKCS8, exportJWK, importSPKI } from 'jose';
import express from 'express';

// Generate or load a persistent RSA key pair for testing, shared across workers
const KEYS_DIR = join(process.cwd(), '.jest-jwks');
const PRIV_PATH = join(KEYS_DIR, 'private.pem');
const PUB_PATH = join(KEYS_DIR, 'public.pem');

if (!existsSync(KEYS_DIR)) {
  mkdirSync(KEYS_DIR, { recursive: true });
}

let privateKey: string;
let publicKey: string;

if (existsSync(PRIV_PATH) && existsSync(PUB_PATH)) {
  privateKey = readFileSync(PRIV_PATH, 'utf-8');
  publicKey = readFileSync(PUB_PATH, 'utf-8');
} else {
  const pair = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  privateKey = pair.privateKey;
  publicKey = pair.publicKey;
  writeFileSync(PRIV_PATH, privateKey, 'utf-8');
  writeFileSync(PUB_PATH, publicKey, 'utf-8');
}

// Convert private key to jose format for signing
const josePrivateKey = importPKCS8(privateKey, 'RS256');

// Store key metadata for better debugging
const keyMetadata = {
  keyId: 'test-key-id',
  algorithm: 'RS256',
  keyType: 'RSA',
  keySize: 2048,
  createdAt: new Date().toISOString()
};

// Create JWKS (JSON Web Key Set) with the public key
let jwks: any = null;

// Initialize JWKS with proper format (matching Cognito's JWKS structure)
const initializeJwks = async () => {
  const josePublicKey = await importSPKI(publicKey, 'RS256');
  const jwk = await exportJWK(josePublicKey);
  
  jwks = {
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

// Create Express server
const app = express();
const PORT = 3000;

// Serve JWKS endpoint (matching Cognito's endpoint structure)
app.get('/.well-known/jwks.json', (_req, res) => {
  if (!jwks) {
    console.error('❌ JWKS not initialized when requested');
    res.status(500).json({ error: 'JWKS not initialized' });
    return;
  }
  
  // Add CORS headers for cross-origin requests
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  if (process.env.DEBUG_JWKS === '1') {
    console.log('🔍 JWKS requested, serving key:', keyMetadata.keyId);
  }
  res.json(jwks);
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Improved mock JWKS server running',
    keyMetadata: keyMetadata,
    timestamp: new Date().toISOString()
  });
});

// Add error handling middleware
app.use((error: any, _req: any, res: any, _next: any) => {
  console.error('❌ Mock JWKS server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
let server: any = null;

export const startMockJwksServer = async (): Promise<void> => {
  // Initialize JWKS first
  await initializeJwks();
  
  return new Promise((resolve, reject) => {
    try {
      server = app.listen(PORT, () => {
        console.log(`🔐 Improved mock JWKS server running on http://localhost:${PORT}`);
        console.log(`📋 Available endpoints:`);
        console.log(`   - JWKS: http://localhost:${PORT}/.well-known/jwks.json`);
        console.log(`   - Health: http://localhost:${PORT}/health`);
        console.log(`🔑 Key metadata:`, keyMetadata);
        resolve();
      });
      if (typeof server.unref === 'function') {
        server.unref();
      }
      
      server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          // Port already in use: assume an existing JWKS server is healthy and continue without logging after tests
          resolve();
        } else {
          console.error('❌ Failed to start mock JWKS server:', error);
          reject(error);
        }
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

  if (process.env.DEBUG_JWKS === '1') {
    console.log('🔍 [TOKEN DEBUG] Generated token (first 50 chars):', token.substring(0, 50) + '...');
    console.log('🔍 [TOKEN DEBUG] Token length:', token.length);
  }

  return token;
};

// Export the private key for advanced testing scenarios
export { privateKey, publicKey, jwks };

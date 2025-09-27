/**
 * @fileoverview JwksMock - Realistic Cognito JWKS server mock for integration tests
 * @summary Creates a robust mock JWKS server that simulates Cognito for testing RS256 JWT tokens
 * @description Mock implementation of Cognito JWKS server that provides realistic JWT tokens
 * matching Cognito's format and behavior. Generates RSA key pairs and serves JWKS endpoints
 * for JWT token validation during integration tests.
 */

import { generateKeyPairSync } from 'crypto';
import { SignJWT, importPKCS8, exportJWK, importSPKI } from 'jose';
import express from 'express';

/**
 * Generate RSA key pair for testing (matching Cognito's key specifications)
 * 
 * @description Creates a 2048-bit RSA key pair with proper encoding for JWT signing and verification
 */
const { publicKey, privateKey } = generateKeyPairSync('rsa', { 
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

/**
 * Convert private key to jose format for signing
 * 
 * @description Imports the private key in PKCS8 format for use with the jose library
 */
let josePrivateKey: any;

/**
 * Store key metadata for better debugging
 * 
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
 * 
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
const initializeJwks = async (): Promise<void> => {
  // Import private key for signing
  josePrivateKey = await importPKCS8(privateKey, 'RS256');
  
  // Import public key for JWKS
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
  
  // JWKS initialized successfully
};

/**
 * Create Express server
 * 
 * @description Express application instance for serving JWKS endpoints
 */
const app = express();

// Security: Disable headers that reveal framework version information
app.disable('x-powered-by');
app.use((req, res, next) => {
  // Remove server identification headers to prevent version disclosure
  res.removeHeader('Server');
  next();
});

/**
 * Server port configuration
 * 
 * @description Port number for the mock JWKS server
 */
const PORT = 3000;

/**
 * Serve JWKS endpoint (matching Cognito's endpoint structure)
 * 
 * @description Express route handler for serving the JSON Web Key Set at the standard JWKS endpoint
 */
app.get('/.well-known/jwks.json', (req, res) => {
  if (!jwksState.value) {
    return res.status(500).json({ error: 'JWKS not initialized' });
  }
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour like real Cognito
  res.json(jwksState.value);
});

/**
 * Health check endpoint
 * 
 * @description Simple health check endpoint for server monitoring
 */
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

/**
 * Server instance for management
 * 
 * @description Stores the server instance for start/stop operations
 */
let server: any = null;

/**
 * Start the mock JWKS server
 * 
 * @description Starts the Express server on the configured port and initializes JWKS
 * @returns Promise that resolves when server is started
 * @throws Error if server fails to start
 */
export async function startMockJwksServer(): Promise<void> {
  if (server) {
    return;
  }
  
  try {
    await initializeJwks();
    
    server = app.listen(PORT, () => {
    });
    
    // Handle server errors
    server.on('error', (error: any) => {
      console.error('JWKS mock server error:', error);
    });
    
  } catch (error) {
    // Re-throw the error to be handled by the caller
    throw error;
  }
}

/**
 * Stop the mock JWKS server
 * 
 * @description Stops the Express server and cleans up resources
 * @returns Promise that resolves when server is stopped
 */
export async function stopMockJwksServer(): Promise<void> {
  if (!server) {
    return;
  }
  
  return new Promise((resolve) => {
    server.close(() => {
      server = null;
      resolve();
    });
  });
}

/**
 * Generate a test JWT token with realistic Cognito claims
 * 
 * @param userId - User ID for the token
 * @param additionalClaims - Additional claims to include in the token
 * @returns Promise that resolves to a signed JWT token
 * @description Creates a realistic JWT token that matches Cognito's token structure
 * with proper claims and RS256 signature using the mock private key.
 */
export async function generateTestJwtToken(
  userId: string = 'test-user-id',
  additionalClaims: Record<string, any> = {}
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  const token = await new SignJWT({
    sub: userId,
    aud: 'test-client-id',
    iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test',
    token_use: 'access',
    scope: 'aws.cognito.signin.user.admin',
    auth_time: now,
    iat: now,
    exp: now + 3600, // 1 hour expiration
    ...additionalClaims
  })
    .setProtectedHeader({ alg: 'RS256', kid: keyMetadata.keyId })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(josePrivateKey);
  
  return token;
}

/**
 * Get the current JWKS for verification
 * 
 * @returns JWKS object or null if not initialized
 * @description Returns the current JWKS object for JWT verification purposes
 */
export function getJwks(): any {
  return jwksState.value;
}

/**
 * Get key metadata for debugging
 * 
 * @returns Key metadata object
 * @description Returns metadata about the generated key pair for debugging purposes
 */
export function getKeyMetadata(): typeof keyMetadata {
  return keyMetadata;
}

// Cognito JWKS mock loaded - realistic JWT token generation and validation

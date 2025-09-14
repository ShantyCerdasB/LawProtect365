/**
 * @file cognitoTokenHelper.ts
 * @summary Helper for generating real Cognito JWT tokens using LocalStack
 * @description Creates real JWT tokens using Cognito User Pool in LocalStack for testing
 */

import AWS from 'aws-sdk';

// Configure AWS SDK for LocalStack
const localstackEndpoint = 'http://localhost:4566';
const region = 'us-east-1';

const cognito = new AWS.CognitoIdentityServiceProvider({
  endpoint: localstackEndpoint,
  region: region,
  accessKeyId: 'test',
  secretAccessKey: 'test'
});

/**
 * Generate a real JWT token using Cognito User Pool
 * @param email - User email
 * @param password - User password
 * @param userPoolId - Cognito User Pool ID
 * @param clientId - Cognito Client ID
 * @returns JWT access token
 */
export async function generateCognitoToken(
  email: string,
  password: string,
  userPoolId: string,
  clientId: string
): Promise<string> {
  try {
    // Authenticate user with Cognito
    const authResult = await cognito.adminInitiateAuth({
      UserPoolId: userPoolId,
      ClientId: clientId,
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    }).promise();

    const accessToken = authResult.AuthenticationResult?.AccessToken;
    if (!accessToken) {
      throw new Error('Failed to get access token from Cognito');
    }

    return accessToken;
  } catch (error) {
    console.error('❌ Failed to generate Cognito token:', error);
    throw error;
  }
}

/**
 * Generate a test user token for integration tests
 * @param userType - Type of test user ('owner', 'signer1', 'signer2')
 * @returns JWT access token
 */
export async function generateTestUserToken(userType: 'owner' | 'signer1' | 'signer2'): Promise<string> {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;

  if (!userPoolId || !clientId) {
    throw new Error('Cognito User Pool ID and Client ID must be set in environment variables');
  }

  const testUsers = {
    owner: {
      email: 'test-owner@lawprotect365.com',
      password: 'TestPassword123!',
      role: 'customer' // Cognito role
    },
    signer1: {
      email: 'test-signer1@lawprotect365.com',
      password: 'TestPassword123!',
      role: 'customer' // Cognito role
    },
    signer2: {
      email: 'test-signer2@lawprotect365.com',
      password: 'TestPassword123!',
      role: 'customer' // Cognito role
    }
  };

  const user = testUsers[userType];
  return await generateCognitoToken(user.email, user.password, userPoolId, clientId);
}

/**
 * Create a test user in Cognito User Pool
 * @param email - User email
 * @param password - User password
 * @param groupName - User group (optional)
 * @returns User object
 */
export async function createTestUser(
  email: string,
  password: string,
  groupName?: string
): Promise<any> {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  
  if (!userPoolId) {
    throw new Error('Cognito User Pool ID must be set in environment variables');
  }

  try {
    // Create user
    const createResult = await cognito.adminCreateUser({
      UserPoolId: userPoolId,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' }
      ],
      TemporaryPassword: password,
      MessageAction: 'SUPPRESS'
    }).promise();

    // Set permanent password
    await cognito.adminSetUserPassword({
      UserPoolId: userPoolId,
      Username: email,
      Password: password,
      Permanent: true
    }).promise();

    // Add to group if specified
    if (groupName) {
      await cognito.adminAddUserToGroup({
        UserPoolId: userPoolId,
        Username: email,
        GroupName: groupName
      }).promise();
    }

    console.log(`✅ Test user created: ${email}`);
    return createResult.User;
  } catch (error) {
    if (error.code === 'UsernameExistsException') {
      console.log(`⚠️  User ${email} already exists`);
      return null;
    }
    throw error;
  }
}

/**
 * Get user information from Cognito
 * @param email - User email
 * @returns User object
 */
export async function getTestUser(email: string): Promise<any> {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  
  if (!userPoolId) {
    throw new Error('Cognito User Pool ID must be set in environment variables');
  }

  try {
    const result = await cognito.adminGetUser({
      UserPoolId: userPoolId,
      Username: email
    }).promise();

    return result;
  } catch (error) {
    if (error.code === 'UserNotFoundException') {
      return null;
    }
    throw error;
  }
}

/**
 * Delete a test user from Cognito
 * @param email - User email
 */
export async function deleteTestUser(email: string): Promise<void> {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  
  if (!userPoolId) {
    throw new Error('Cognito User Pool ID must be set in environment variables');
  }

  try {
    await cognito.adminDeleteUser({
      UserPoolId: userPoolId,
      Username: email
    }).promise();

    console.log(`✅ Test user deleted: ${email}`);
  } catch (error) {
    if (error.code === 'UserNotFoundException') {
      console.log(`⚠️  User ${email} not found`);
      return;
    }
    throw error;
  }
}

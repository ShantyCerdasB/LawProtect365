/**
 * @file setupLocalStack.ts
 * @summary Setup AWS resources in LocalStack
 * @description Creates Cognito User Pool, S3 buckets, KMS keys, and other AWS resources for testing
 */

import AWS from 'aws-sdk';
import { startLocalStack } from './startLocalStack';

// Configure AWS SDK for LocalStack
const localstackEndpoint = 'http://localhost:4566';
const region = 'us-east-1';

const cognito = new AWS.CognitoIdentityServiceProvider({
  endpoint: localstackEndpoint,
  region: region,
  accessKeyId: 'test',
  secretAccessKey: 'test'
});

const s3 = new AWS.S3({
  endpoint: localstackEndpoint,
  region: region,
  accessKeyId: 'test',
  secretAccessKey: 'test',
  s3ForcePathStyle: true
});

const kms = new AWS.KMS({
  endpoint: localstackEndpoint,
  region: region,
  accessKeyId: 'test',
  secretAccessKey: 'test'
});

const eventbridge = new AWS.EventBridge({
  endpoint: localstackEndpoint,
  region: region,
  accessKeyId: 'test',
  secretAccessKey: 'test'
});

const ssm = new AWS.SSM({
  endpoint: localstackEndpoint,
  region: region,
  accessKeyId: 'test',
  secretAccessKey: 'test'
});

async function setupLocalStack() {
  console.log('🔧 Setting up AWS resources in LocalStack...');
  
  try {
    // Start LocalStack first
    await startLocalStack();
    
    // Wait a bit for services to be fully ready
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Setup Cognito User Pool
    await setupCognitoUserPool();
    
    // Setup S3 buckets
    await setupS3Buckets();
    
    // Setup KMS keys
    await setupKMSKeys();
    
    // Setup EventBridge
    await setupEventBridge();
    
    // Setup SSM parameters
    await setupSSMParameters();
    
    console.log('✅ LocalStack setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to setup LocalStack:', error);
    process.exit(1);
  }
}

async function setupCognitoUserPool() {
  console.log('🔐 Setting up Cognito User Pool...');
  
  try {
    // Create User Pool (matching Terraform configuration)
    const userPoolParams = {
      PoolName: 'lawprotect365-test-user-pool',
      MfaConfiguration: 'OPTIONAL',
      AutoVerifiedAttributes: ['email'],
      UsernameAttributes: ['email'],
      Schema: [
        {
          Name: 'email',
          AttributeDataType: 'String',
          Required: true,
          Mutable: true
        }
      ],
      Policies: {
        PasswordPolicy: {
          MinimumLength: 8,
          RequireUppercase: true,
          RequireLowercase: true,
          RequireNumbers: true,
          RequireSymbols: false
        }
      }
    };
    
    const userPoolResult = await cognito.createUserPool(userPoolParams).promise();
    const userPoolId = userPoolResult.UserPool?.Id;
    
    if (!userPoolId) {
      throw new Error('Failed to create User Pool');
    }
    
    console.log(`✅ User Pool created: ${userPoolId}`);
    
    // Create User Pool Client (matching Terraform configuration)
    const clientParams = {
      UserPoolId: userPoolId,
      ClientName: 'lawprotect365-test-app-client',
      GenerateSecret: true, // Terraform sets this to true
      ExplicitAuthFlows: [
        'ALLOW_USER_SRP_AUTH',
        'ALLOW_REFRESH_TOKEN_AUTH'
      ],
      SupportedIdentityProviders: ['COGNITO'],
      CallbackURLs: ['http://localhost:3000/callback'],
      LogoutURLs: ['http://localhost:3000/logout'],
      AllowedOAuthFlows: ['code'],
      AllowedOAuthScopes: [
        'openid',
        'email', 
        'profile',
        'aws.cognito.signin.user.admin'
      ],
      AllowedOAuthFlowsUserPoolClient: true
    };
    
    const clientResult = await cognito.createUserPoolClient(clientParams).promise();
    const clientId = clientResult.UserPoolClient?.ClientId;
    
    if (!clientId) {
      throw new Error('Failed to create User Pool Client');
    }
    
    console.log(`✅ User Pool Client created: ${clientId}`);
    
    // Store configuration in environment variables for tests
    process.env.COGNITO_USER_POOL_ID = userPoolId;
    process.env.COGNITO_CLIENT_ID = clientId;
    process.env.COGNITO_ISSUER = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    
    // Update JWT configuration for tests
    process.env.JWT_ISSUER = process.env.COGNITO_ISSUER;
    process.env.JWT_AUDIENCE = clientId;
    process.env.JWKS_URI = `http://localhost:4566/.well-known/jwks.json`;
    
    // Create user groups (matching Terraform configuration)
    await createUserGroups(userPoolId);
    
    // Create test users
    await createTestUsers(userPoolId);
    
  } catch (error) {
    console.error('❌ Failed to setup Cognito:', error);
    throw error;
  }
}

async function createUserGroups(userPoolId: string) {
  console.log('👥 Creating user groups...');
  
  const groups = [
    {
      GroupName: 'SuperAdmin',
      Description: 'Full platform super-administrator'
    },
    {
      GroupName: 'Admin', 
      Description: 'Platform administrator with elevated privileges'
    },
    {
      GroupName: 'Lawyer',
      Description: 'Verified lawyer user'
    },
    {
      GroupName: 'Customer',
      Description: 'End-user customer'
    }
  ];
  
  for (const group of groups) {
    try {
      await cognito.createGroup({
        UserPoolId: userPoolId,
        GroupName: group.GroupName,
        Description: group.Description
      }).promise();
      
      console.log(`✅ User group created: ${group.GroupName}`);
    } catch (error) {
      console.log(`⚠️  User group ${group.GroupName} might already exist:`, error.message);
    }
  }
}

async function createTestUsers(userPoolId: string) {
  console.log('👥 Creating test users...');
  
  const testUsers = [
    {
      username: 'test-owner@lawprotect365.com',
      email: 'test-owner@lawprotect365.com',
      password: 'TestPassword123!',
      groups: ['customer'] // Cognito role
    },
    {
      username: 'test-signer1@lawprotect365.com',
      email: 'test-signer1@lawprotect365.com',
      password: 'TestPassword123!',
      groups: ['customer'] // Cognito role
    },
    {
      username: 'test-signer2@lawprotect365.com',
      email: 'test-signer2@lawprotect365.com',
      password: 'TestPassword123!',
      groups: ['customer'] // Cognito role
    }
  ];
  
  for (const user of testUsers) {
    try {
      // Create user
      await cognito.adminCreateUser({
        UserPoolId: userPoolId,
        Username: user.username,
        UserAttributes: [
          { Name: 'email', Value: user.email },
          { Name: 'email_verified', Value: 'true' }
        ],
        TemporaryPassword: user.password,
        MessageAction: 'SUPPRESS'
      }).promise();
      
      // Set permanent password
      await cognito.adminSetUserPassword({
        UserPoolId: userPoolId,
        Username: user.username,
        Password: user.password,
        Permanent: true
      }).promise();
      
      console.log(`✅ Test user created: ${user.email}`);
    } catch (error) {
      console.log(`⚠️  User ${user.email} might already exist:`, error.message);
    }
  }
}

async function setupS3Buckets() {
  console.log('🪣 Setting up S3 buckets...');
  
  // Buckets matching Terraform configuration
  const buckets = [
    {
      name: 'lawprotect365-sign-evidence-test',
      enableVersioning: true,
      enableEncryption: true
    },
    {
      name: 'lawprotect365-documents-test', 
      enableVersioning: true,
      enableEncryption: true
    }
  ];
  
  for (const bucket of buckets) {
    try {
      // Create bucket
      await s3.createBucket({
        Bucket: bucket.name,
        CreateBucketConfiguration: {
          LocationConstraint: region
        }
      }).promise();
      
      console.log(`✅ S3 bucket created: ${bucket.name}`);
      
      // Enable versioning (matching Terraform)
      if (bucket.enableVersioning) {
        await s3.putBucketVersioning({
          Bucket: bucket.name,
          VersioningConfiguration: {
            Status: 'Enabled'
          }
        }).promise();
        console.log(`✅ Versioning enabled for: ${bucket.name}`);
      }
      
      // Enable server-side encryption (matching Terraform)
      if (bucket.enableEncryption) {
        await s3.putBucketEncryption({
          Bucket: bucket.name,
          ServerSideEncryptionConfiguration: {
            Rules: [{
              ApplyServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }]
          }
        }).promise();
        console.log(`✅ Encryption enabled for: ${bucket.name}`);
      }
      
      // Set lifecycle configuration (matching Terraform)
      await s3.putBucketLifecycleConfiguration({
        Bucket: bucket.name,
        LifecycleConfiguration: {
          Rules: [{
            ID: 'expire-noncurrent-versions',
            Status: 'Enabled',
            NoncurrentVersionExpiration: {
              NoncurrentDays: 30
            },
            Filter: {}
          }]
        }
      }).promise();
      console.log(`✅ Lifecycle configuration set for: ${bucket.name}`);
      
    } catch (error) {
      if (error.code === 'BucketAlreadyOwnedByYou') {
        console.log(`⚠️  S3 bucket already exists: ${bucket.name}`);
      } else {
        console.error(`❌ Failed to create S3 bucket ${bucket.name}:`, error);
      }
    }
  }
}

async function setupKMSKeys() {
  console.log('🔑 Setting up KMS keys...');
  
  try {
    // Create signing key (matching Terraform configuration)
    const signingKeyParams = {
      Description: 'Test signing key for LawProtect365',
      KeyUsage: 'SIGN_VERIFY',
      CustomerMasterKeySpec: 'RSA_2048'
    };
    
    const signingKeyResult = await kms.createKey(signingKeyParams).promise();
    const signingKeyId = signingKeyResult.KeyMetadata?.KeyId;
    
    if (!signingKeyId) {
      throw new Error('Failed to create KMS signing key');
    }
    
    console.log(`✅ KMS signing key created: ${signingKeyId}`);
    
    // Create alias for signing key (matching Terraform)
    await kms.createAlias({
      AliasName: 'alias/lawprotect365-sign-key-test',
      TargetKeyId: signingKeyId
    }).promise();
    
    console.log(`✅ KMS alias created: alias/lawprotect365-sign-key-test`);
    
    // Store key ID for tests
    process.env.KMS_SIGNER_KEY_ID = signingKeyId;
    process.env.KMS_SIGNER_KEY_ARN = `arn:aws:kms:${region}:000000000000:key/${signingKeyId}`;
    
  } catch (error) {
    console.error('❌ Failed to setup KMS:', error);
    throw error;
  }
}

async function setupEventBridge() {
  console.log('📡 Setting up EventBridge...');
  
  try {
    // Create event bus (matching Terraform configuration)
    const eventBusParams = {
      Name: 'lawprotect365-event-bus-test'
    };
    
    await eventbridge.createEventBus(eventBusParams).promise();
    
    console.log('✅ EventBridge event bus created: lawprotect365-event-bus-test');
    
    // Store event bus ARN for tests
    process.env.EVENT_BUS_ARN = `arn:aws:events:${region}:000000000000:event-bus/lawprotect365-event-bus-test`;
    
  } catch (error) {
    if (error.code === 'ResourceAlreadyExistsException') {
      console.log('⚠️  EventBridge event bus already exists: lawprotect365-event-bus-test');
    } else {
      console.error('❌ Failed to setup EventBridge:', error);
      throw error;
    }
  }
}

async function setupSSMParameters() {
  console.log('🔧 Setting up SSM parameters...');
  
  // Parameters matching Terraform configuration
  const parameters = [
    {
      Name: '/lawprotect365/test/cognito/user-pool-id',
      Value: process.env.COGNITO_USER_POOL_ID || '',
      Type: 'String',
      Description: 'Cognito User Pool ID for testing'
    },
    {
      Name: '/lawprotect365/test/cognito/client-id',
      Value: process.env.COGNITO_CLIENT_ID || '',
      Type: 'String',
      Description: 'Cognito Client ID for testing'
    },
    {
      Name: '/lawprotect365/test/kms/signer-key-arn',
      Value: process.env.KMS_SIGNER_KEY_ARN || '',
      Type: 'String',
      Description: 'KMS Signer Key ARN for testing'
    },
    {
      Name: '/lawprotect365/test/event-bus-arn',
      Value: process.env.EVENT_BUS_ARN || '',
      Type: 'String',
      Description: 'EventBridge Event Bus ARN for testing'
    }
  ];
  
  for (const param of parameters) {
    try {
      await ssm.putParameter(param).promise();
      console.log(`✅ SSM parameter created: ${param.Name}`);
    } catch (error) {
      console.log(`⚠️  SSM parameter ${param.Name} might already exist:`, error.message);
    }
  }
}

// Run if called directly
if (require.main === module) {
  setupLocalStack();
}

export { setupLocalStack };

#!/bin/bash

# Script to create placeholder ZIPs for Terraform deployment
# This allows Terraform to create Lambda functions without S3 key errors

set -e

echo "🚀 Creating placeholder ZIPs for Terraform deployment..."

# Configuration
BUCKET_NAME="${AWS_S3_BUCKET:-lawprotect365-code-${AWS_ENV:-dev}}"
REGION="${AWS_REGION:-us-east-1}"

# Create temporary directory
TEMP_DIR="temp-placeholder"
mkdir -p $TEMP_DIR

# Create placeholder Lambda function code
cat > $TEMP_DIR/index.js << 'EOF'
exports.handler = async (event) => {
    console.log('Placeholder Lambda function - waiting for real code');
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Placeholder function - real code will be deployed via CodePipeline',
            timestamp: new Date().toISOString()
        })
    };
};
EOF

# Create package.json for placeholder
cat > $TEMP_DIR/package.json << 'EOF'
{
  "name": "placeholder-lambda",
  "version": "1.0.0",
  "description": "Placeholder Lambda function",
  "main": "index.js",
  "dependencies": {}
}
EOF

echo "📦 Creating placeholder ZIPs..."

# 1. Shared-TS Layer
echo "  - Creating shared-ts-layer.zip..."
mkdir -p shared-ts-layer/nodejs
cp -r $TEMP_DIR/* shared-ts-layer/nodejs/
cd shared-ts-layer && zip -r ../shared-ts-layer.zip . && cd ..
rm -rf shared-ts-layer

# 2. OutboxStreamHandler
echo "  - Creating outbox-stream-handler.zip..."
cp -r $TEMP_DIR outbox-stream-handler
cd outbox-stream-handler && zip -r ../outbox-stream-handler.zip . && cd ..
rm -rf outbox-stream-handler

# 3. Signature Service Handlers
echo "  - Creating signature service handler ZIPs..."
HANDLERS=(
    "create-envelope"
    "get-envelope" 
    "send-envelope"
    "sign-document"
    "decline-signer"
    "share-document"
    "send-notification"
    "get-audit-trail"
    "get-envelopes-by-user"
    "update-envelope"
    "cancel-envelope"
    "download-document"
)

for handler in "${HANDLERS[@]}"; do
    echo "    - Creating sign-$handler.zip..."
    cp -r $TEMP_DIR temp-$handler
    cd temp-$handler && zip -r ../sign-$handler.zip . && cd ..
    rm -rf temp-$handler
done

echo "☁️ Uploading placeholder ZIPs to S3..."

# Upload to S3
aws s3 cp shared-ts-layer.zip s3://$BUCKET_NAME/ --region $REGION
aws s3 cp outbox-stream-handler.zip s3://$BUCKET_NAME/ --region $REGION

for handler in "${HANDLERS[@]}"; do
    aws s3 cp sign-$handler.zip s3://$BUCKET_NAME/ --region $REGION
done

echo "🧹 Cleaning up temporary files..."
rm -rf $TEMP_DIR
rm -f *.zip

echo "✅ Placeholder ZIPs created and uploaded successfully!"
echo "📋 Next steps:"
echo "   1. Run: terraform apply"
echo "   2. Push to GitHub: git push origin main"
echo "   3. CodePipeline will replace placeholder ZIPs with real code"

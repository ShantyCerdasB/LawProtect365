# PowerShell script to create and upload minimal Lambda ZIPs for auth-service
# Usage: .\upload-auth-lambdas.ps1

$ErrorActionPreference = "Stop"

# Configure AWS Profile
$env:AWS_PROFILE = "shantyCB"

# Configuration
$BUCKET_NAME = "lawprotect365-code"  # Adjust if different
$AWS_REGION = "us-east-1"  # Adjust if different
$SERVICE_DIR = "services/auth-service"
$TEMP_DIR = "__temp_auth_zip"

# List of all auth-service Lambda functions with their handler names
$Lambdas = @(
    @{ Name = "auth-get-me.zip"; Handler = "getMe" },
    @{ Name = "auth-patch-me.zip"; Handler = "patchMe" },
    @{ Name = "auth-link-provider.zip"; Handler = "linkProvider" },
    @{ Name = "auth-unlink-provider.zip"; Handler = "unlinkProvider" },
    @{ Name = "auth-get-users-admin.zip"; Handler = "getUsersAdmin" },
    @{ Name = "auth-get-user-by-id-admin.zip"; Handler = "getUserByIdAdmin" },
    @{ Name = "auth-set-user-role-admin.zip"; Handler = "setUserRoleAdmin" },
    @{ Name = "auth-set-user-status-admin.zip"; Handler = "setUserStatusAdmin" },
    @{ Name = "auth-pre-authentication.zip"; Handler = "preAuthentication" },
    @{ Name = "auth-post-authentication.zip"; Handler = "postAuthentication" },
    @{ Name = "auth-post-confirmation.zip"; Handler = "postConfirmation" },
    @{ Name = "auth-pre-token-generation.zip"; Handler = "preTokenGeneration" }
)

Write-Host "=== Creating and uploading auth-service Lambda ZIPs ===" -ForegroundColor Green
Write-Host "Bucket: $BUCKET_NAME" -ForegroundColor Cyan
Write-Host "Region: $AWS_REGION" -ForegroundColor Cyan
Write-Host ""

# Ensure we're in the project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Verify AWS credentials
Write-Host "Verifying AWS credentials..." -ForegroundColor Yellow
$caller = aws sts get-caller-identity --profile $env:AWS_PROFILE 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to verify AWS credentials. Please check your profile." -ForegroundColor Red
    Write-Host $caller -ForegroundColor Red
    exit 1
}
Write-Host "AWS credentials verified" -ForegroundColor Green
Write-Host ""

# Verify bucket exists
Write-Host "Verifying S3 bucket exists..." -ForegroundColor Yellow
$bucketCheck = aws s3 ls "s3://$BUCKET_NAME" --profile $env:AWS_PROFILE 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Bucket $BUCKET_NAME does not exist or is not accessible." -ForegroundColor Red
    Write-Host $bucketCheck -ForegroundColor Red
    exit 1
}
Write-Host "Bucket verified" -ForegroundColor Green
Write-Host ""

# Function to create minimal ZIP
function Create-MinimalZip {
    param(
        [string]$ZipName,
        [string]$HandlerName
    )
    
    Write-Host "Creating $ZipName..." -ForegroundColor Yellow
    
    # Create temp directory
    if (Test-Path $TEMP_DIR) {
        Remove-Item -Recurse -Force $TEMP_DIR
    }
    New-Item -ItemType Directory -Path $TEMP_DIR | Out-Null
    
    # Create index.js
    $indexJs = @"
const { webcrypto } = require('node:crypto');
if (!globalThis.crypto) {
    globalThis.crypto = webcrypto;
}

// Import from auth-core layer (will be available at runtime)
const core = require('@lawprotect/auth-core');

// Resolve handler with fallbacks
const root = (core && (core.handlers || (core.default && core.default.handlers))) 
    ? (core.handlers || core.default.handlers) 
    : (core || {});

// Try different handler name patterns
let fn = root['${HandlerName}'] || 
         root['${HandlerName}Handler'] || 
         root[`${HandlerName}Handler`] ||
         (typeof root === 'function' ? root : null);

if (!fn) {
    throw new Error(`Handler ${HandlerName} not found in @lawprotect/auth-core. Available: ${Object.keys(root).join(', ')}`);
}

exports.handler = fn;
"@
    
    $indexJs | Out-File -FilePath "$TEMP_DIR/index.js" -Encoding utf8
    
    # Create package.json
    $packageJson = @"
{
  "type": "commonjs"
}
"@
    $packageJson | Out-File -FilePath "$TEMP_DIR/package.json" -Encoding utf8
    
    # Create ZIP (PowerShell 5.1+ compatible)
    $zipPath = Join-Path (Get-Location) $ZipName
    if (Test-Path $zipPath) {
        Remove-Item -Force $zipPath
    }
    
    # Use .NET compression (works on Windows)
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($TEMP_DIR, $zipPath)
    
    # Verify ZIP was created
    if (-not (Test-Path $zipPath)) {
        Write-Host "ERROR: Failed to create $ZipName" -ForegroundColor Red
        Remove-Item -Recurse -Force $TEMP_DIR
        return $false
    }
    
    $zipSize = (Get-Item $zipPath).Length
    Write-Host "  Created $ZipName ($zipSize bytes)" -ForegroundColor Green
    
    # Clean up temp directory
    Remove-Item -Recurse -Force $TEMP_DIR
    
    return $true
}

# Function to upload ZIP to S3
function Upload-ToS3 {
    param(
        [string]$ZipName
    )
    
    Write-Host "Uploading $ZipName to s3://$BUCKET_NAME/$ZipName..." -ForegroundColor Yellow
    
    $uploadResult = aws s3 cp $ZipName "s3://$BUCKET_NAME/$ZipName" --profile $env:AWS_PROFILE 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to upload $ZipName" -ForegroundColor Red
        Write-Host $uploadResult -ForegroundColor Red
        return $false
    }
    
    Write-Host "  Uploaded successfully" -ForegroundColor Green
    return $true
}

# Process each Lambda
$successCount = 0
$failCount = 0

foreach ($lambda in $Lambdas) {
    Write-Host ""
    Write-Host "Processing: $($lambda.Name)" -ForegroundColor Cyan
    
    if (Create-MinimalZip -ZipName $lambda.Name -HandlerName $lambda.Handler) {
        if (Upload-ToS3 -ZipName $lambda.Name) {
            # Clean up local ZIP after successful upload
            Remove-Item -Force $lambda.Name -ErrorAction SilentlyContinue
            $successCount++
        } else {
            $failCount++
        }
    } else {
        $failCount++
    }
}

# Final summary
Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Green
Write-Host "Successful: $successCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "All Lambda ZIPs uploaded successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some uploads failed. Please review the errors above." -ForegroundColor Red
    exit 1
}


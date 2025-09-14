# Script to fix remaining imports that weren't caught by the first script
Write-Host "Fixing remaining imports..."

# Get all TypeScript files
$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts" | Where-Object { $_.FullName -notlike "*node_modules*" }

$processedFiles = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Fix remaining Ids imports (case sensitive)
    $content = $content -replace 'from "@/domain/value-objects/Ids"', 'from "@/domain/value-objects/ids"'
    
    # Fix remaining Audit imports (case sensitive)
    $content = $content -replace 'from "@/domain/value-objects/Audit"', 'from "@/domain/value-objects/audit"'
    $content = $content -replace 'from "../../../domain/value-objects/Audit"', 'from "@/domain/value-objects/audit"'
    $content = $content -replace 'from "../../../../domain/value-objects/Audit"', 'from "@/domain/value-objects/audit"'
    $content = $content -replace 'from "../../domain/value-objects/Audit"', 'from "@/domain/value-objects/audit"'
    
    # Fix remaining other value object imports
    $content = $content -replace 'from "@/domain/value-objects/EnvelopeStatus"', 'from "@/domain/value-objects/envelope"'
    $content = $content -replace 'from "@/domain/value-objects/DocumentStatus"', 'from "@/domain/value-objects/document"'
    $content = $content -replace 'from "@/domain/value-objects/ContentType"', 'from "@/domain/value-objects/document"'
    $content = $content -replace 'from "@/domain/value-objects/Geometry"', 'from "@/domain/value-objects/document"'
    $content = $content -replace 'from "@/domain/value-objects/HashDigest"', 'from "@/domain/value-objects/document"'
    $content = $content -replace 'from "@/domain/value-objects/InputType"', 'from "@/domain/value-objects/document"'
    $content = $content -replace 'from "@/domain/value-objects/S3ObjectRef"', 'from "@/domain/value-objects/storage"'
    $content = $content -replace 'from "@/domain/value-objects/Kms"', 'from "@/domain/value-objects/security"'
    $content = $content -replace 'from "@/domain/value-objects/RequestToken"', 'from "@/domain/value-objects/security"'
    $content = $content -replace 'from "@/domain/value-objects/ConsentRecord"', 'from "@/domain/value-objects/consent"'
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.Name)"
    }
    
    $processedFiles++
}

Write-Host "Remaining import fixes completed! Processed $processedFiles files."

# Script to fix all value-objects imports using @ alias
Write-Host "Starting import fixes..."

# Get all TypeScript files
$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts" | Where-Object { $_.FullName -notlike "*node_modules*" }

$totalFiles = $files.Count
$processedFiles = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Fix Ids imports (most common)
    $content = $content -replace 'from "@/domain/value-objects/Ids"', 'from "@/domain/value-objects/ids"'
    $content = $content -replace 'from "../../../domain/value-objects/Ids"', 'from "@/domain/value-objects/ids"'
    $content = $content -replace 'from "../../../../domain/value-objects/Ids"', 'from "@/domain/value-objects/ids"'
    $content = $content -replace 'from "../value-objects/Ids"', 'from "@/domain/value-objects/ids"'
    $content = $content -replace 'from "../../domain/value-objects/Ids"', 'from "@/domain/value-objects/ids"'
    
    # Fix common value objects
    $content = $content -replace 'from "@/domain/value-objects/Email"', 'from "@/domain/value-objects/common"'
    $content = $content -replace 'from "@/domain/value-objects/PersonName"', 'from "@/domain/value-objects/common"'
    $content = $content -replace 'from "@/domain/value-objects/Reason"', 'from "@/domain/value-objects/common"'
    $content = $content -replace 'from "@/domain/value-objects/FileSize"', 'from "@/domain/value-objects/common"'
    $content = $content -replace 'from "@/domain/value-objects/Page"', 'from "@/domain/value-objects/common"'
    $content = $content -replace 'from "@/domain/value-objects/PaginationCursor"', 'from "@/domain/value-objects/common"'
    $content = $content -replace 'from "@/domain/value-objects/ObjectVersion"', 'from "@/domain/value-objects/common"'
    
    # Fix document value objects
    $content = $content -replace 'from "@/domain/value-objects/ContentType"', 'from "@/domain/value-objects/document"'
    $content = $content -replace 'from "@/domain/value-objects/DocumentStatus"', 'from "@/domain/value-objects/document"'
    $content = $content -replace 'from "@/domain/value-objects/Geometry"', 'from "@/domain/value-objects/document"'
    $content = $content -replace 'from "@/domain/value-objects/HashDigest"', 'from "@/domain/value-objects/document"'
    $content = $content -replace 'from "@/domain/value-objects/InputType"', 'from "@/domain/value-objects/document"'
    
    # Fix other value objects
    $content = $content -replace 'from "@/domain/value-objects/EnvelopeStatus"', 'from "@/domain/value-objects/envelope"'
    $content = $content -replace 'from "@/domain/value-objects/S3ObjectRef"', 'from "@/domain/value-objects/storage"'
    $content = $content -replace 'from "@/domain/value-objects/Kms"', 'from "@/domain/value-objects/security"'
    $content = $content -replace 'from "@/domain/value-objects/RequestToken"', 'from "@/domain/value-objects/security"'
    $content = $content -replace 'from "@/domain/value-objects/Audit"', 'from "@/domain/value-objects/audit"'
    $content = $content -replace 'from "@/domain/value-objects/ConsentRecord"', 'from "@/domain/value-objects/consent"'
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.Name)"
    }
    
    $processedFiles++
    if ($processedFiles % 50 -eq 0) {
        Write-Host "Processed $processedFiles/$totalFiles files..."
    }
}

Write-Host "Import fixes completed! Processed $processedFiles files."

# Script para arreglar los imports finales
Write-Host "Arreglando imports finales..."

# Arreglar imports con casing incorrecto
$replacements = @(
    @{from="@/domain/value-objects/Ids"; to="@/domain/value-objects/ids"},
    @{from="@/domain/value-objects/Audit"; to="@/domain/value-objects/audit"},
    @{from="@/domain/value-objects/Party"; to="@/domain/value-objects/party"},
    @{from="@/domain/value-objects/EnvelopeStatus"; to="@/domain/value-objects/envelope"},
    @{from="@/domain/value-objects/Email"; to="@/domain/value-objects/common"},
    @{from="@/domain/value-objects/PersonName"; to="@/domain/value-objects/common"},
    @{from="@/domain/value-objects/Reason"; to="@/domain/value-objects/common"},
    @{from="@/domain/value-objects/FileSize"; to="@/domain/value-objects/common"},
    @{from="@/domain/value-objects/Page"; to="@/domain/value-objects/common"},
    @{from="@/domain/value-objects/PaginationCursor"; to="@/domain/value-objects/common"},
    @{from="@/domain/value-objects/ObjectVersion"; to="@/domain/value-objects/common"},
    @{from="@/domain/value-objects/ContentType"; to="@/domain/value-objects/document"},
    @{from="@/domain/value-objects/DocumentStatus"; to="@/domain/value-objects/document"},
    @{from="@/domain/value-objects/Geometry"; to="@/domain/value-objects/document"},
    @{from="@/domain/value-objects/HashDigest"; to="@/domain/value-objects/document"},
    @{from="@/domain/value-objects/InputType"; to="@/domain/value-objects/document"},
    @{from="@/domain/value-objects/S3ObjectRef"; to="@/domain/value-objects/storage"},
    @{from="@/domain/value-objects/Kms"; to="@/domain/value-objects/security"},
    @{from="@/domain/value-objects/RequestToken"; to="@/domain/value-objects/security"},
    @{from="@/domain/value-objects/ConsentRecord"; to="@/domain/value-objects/consent"},
    @{from="@/domain/value-objects/Party"; to="@/domain/value-objects/party"},
    @{from="@/domain/value-objects/PartyAuth"; to="@/domain/value-objects/party"},
    @{from="@/domain/value-objects/PartyEmail"; to="@/domain/value-objects/party"},
    @{from="@/domain/value-objects/PartyMetadata"; to="@/domain/value-objects/party"},
    @{from="@/domain/value-objects/PartyPhone"; to="@/domain/value-objects/party"},
    @{from="@/domain/value-objects/PartySequence"; to="@/domain/value-objects/party"},
    @{from="@/domain/value-objects/DelegationRecord"; to="@/domain/value-objects/party"},
    @{from="@/domain/value-objects/PartyId"; to="@/domain/value-objects/ids"},
    @{from="@/domain/value-objects/EnvelopeId"; to="@/domain/value-objects/ids"},
    @{from="@/domain/value-objects/TenantId"; to="@/domain/value-objects/ids"},
    @{from="@/domain/value-objects/UserId"; to="@/domain/value-objects/ids"},
    @{from="@/domain/value-objects/DocumentId"; to="@/domain/value-objects/ids"},
    @{from="@/domain/value-objects/InputId"; to="@/domain/value-objects/ids"},
    @{from="@/domain/value-objects/ConsentId"; to="@/domain/value-objects/ids"},
    @{from="@/domain/value-objects/AuditEventId"; to="@/domain/value-objects/ids"},
    @{from="@/domain/value-objects/IpAddress"; to="@/domain/value-objects/ids"},
    @{from="@/domain/value-objects/PartyIdSchema"; to="@/domain/value-objects/ids"},
    @{from="@/domain/value-objects/EnvelopeIdSchema"; to="@/domain/value-objects/ids"},
    @{from="@/domain/value-objects/TenantIdSchema"; to="@/domain/value-objects/ids"},
    @{from="@/domain/value-objects/UserIdSchema"; to="@/domain/value-objects/ids"},
    @{from="@/domain/value-objects/DocumentIdSchema"; to="@/domain/value-objects/ids"},
    @{from="@/domain/value-objects/InputIdSchema"; to="@/domain/value-objects/ids"},
    @{from="@/domain/value-objects/ConsentIdSchema"; to="@/domain/value-objects/ids"},
    @{from="@/domain/value-objects/AuditEventIdSchema"; to="@/domain/value-objects/ids"},
    @{from="@/domain/value-objects/IpAddressSchema"; to="@/domain/value-objects/ids"},
    @{from="@/domain/value-objects/EmailSchema"; to="@/domain/value-objects/common"},
    @{from="@/domain/value-objects/PersonNameSchema"; to="@/domain/value-objects/common"},
    @{from="@/domain/value-objects/ReasonSchema"; to="@/domain/value-objects/common"},
    @{from="@/domain/value-objects/FileSizeSchema"; to="@/domain/value-objects/common"},
    @{from="@/domain/value-objects/PageSchema"; to="@/domain/value-objects/common"},
    @{from="@/domain/value-objects/PaginationCursorSchema"; to="@/domain/value-objects/common"},
    @{from="@/domain/value-objects/ObjectVersionSchema"; to="@/domain/value-objects/common"},
    @{from="@/domain/value-objects/ContentTypeSchema"; to="@/domain/value-objects/document"},
    @{from="@/domain/value-objects/DocumentStatusSchema"; to="@/domain/value-objects/document"},
    @{from="@/domain/value-objects/GeometrySchema"; to="@/domain/value-objects/document"},
    @{from="@/domain/value-objects/HashDigestSchema"; to="@/domain/value-objects/document"},
    @{from="@/domain/value-objects/InputTypeSchema"; to="@/domain/value-objects/document"},
    @{from="@/domain/value-objects/EnvelopeStatusSchema"; to="@/domain/value-objects/envelope"},
    @{from="@/domain/value-objects/S3ObjectRefSchema"; to="@/domain/value-objects/storage"},
    @{from="@/domain/value-objects/KmsSchema"; to="@/domain/value-objects/security"},
    @{from="@/domain/value-objects/RequestTokenSchema"; to="@/domain/value-objects/security"},
    @{from="@/domain/value-objects/ConsentRecordSchema"; to="@/domain/value-objects/consent"},
    @{from="@/domain/value-objects/PartySchema"; to="@/domain/value-objects/party"},
    @{from="@/domain/value-objects/PartyAuthSchema"; to="@/domain/value-objects/party"},
    @{from="@/domain/value-objects/PartyEmailSchema"; to="@/domain/value-objects/party"},
    @{from="@/domain/value-objects/PartyMetadataSchema"; to="@/domain/value-objects/party"},
    @{from="@/domain/value-objects/PartyPhoneSchema"; to="@/domain/value-objects/party"},
    @{from="@/domain/value-objects/PartySequenceSchema"; to="@/domain/value-objects/party"},
    @{from="@/domain/value-objects/DelegationRecordSchema"; to="@/domain/value-objects/party"},
    @{from="@/domain/value-objects/AuditEventSchema"; to="@/domain/value-objects/audit"},
    @{from="@/domain/value-objects/AuditEventIdSchema"; to="@/domain/value-objects/audit"}
)

# Arreglar imports relativos
$relativeReplacements = @(
    @{from="../../../domain/value-objects/EnvelopeStatus"; to="@/domain/value-objects/envelope"},
    @{from="../../../domain/value-objects/Email"; to="@/domain/value-objects/common"},
    @{from="../../../domain/value-objects/PersonName"; to="@/domain/value-objects/common"},
    @{from="../../../domain/value-objects/Reason"; to="@/domain/value-objects/common"},
    @{from="../../../domain/value-objects/FileSize"; to="@/domain/value-objects/common"},
    @{from="../../../domain/value-objects/Page"; to="@/domain/value-objects/common"},
    @{from="../../../domain/value-objects/PaginationCursor"; to="@/domain/value-objects/common"},
    @{from="../../../domain/value-objects/ObjectVersion"; to="@/domain/value-objects/common"},
    @{from="../../../domain/value-objects/ContentType"; to="@/domain/value-objects/document"},
    @{from="../../../domain/value-objects/DocumentStatus"; to="@/domain/value-objects/document"},
    @{from="../../../domain/value-objects/Geometry"; to="@/domain/value-objects/document"},
    @{from="../../../domain/value-objects/HashDigest"; to="@/domain/value-objects/document"},
    @{from="../../../domain/value-objects/InputType"; to="@/domain/value-objects/document"},
    @{from="../../../domain/value-objects/S3ObjectRef"; to="@/domain/value-objects/storage"},
    @{from="../../../domain/value-objects/Kms"; to="@/domain/value-objects/security"},
    @{from="../../../domain/value-objects/RequestToken"; to="@/domain/value-objects/security"},
    @{from="../../../domain/value-objects/ConsentRecord"; to="@/domain/value-objects/consent"},
    @{from="../../../domain/value-objects/Party"; to="@/domain/value-objects/party"},
    @{from="../../../domain/value-objects/PartyAuth"; to="@/domain/value-objects/party"},
    @{from="../../../domain/value-objects/PartyEmail"; to="@/domain/value-objects/party"},
    @{from="../../../domain/value-objects/PartyMetadata"; to="@/domain/value-objects/party"},
    @{from="../../../domain/value-objects/PartyPhone"; to="@/domain/value-objects/party"},
    @{from="../../../domain/value-objects/PartySequence"; to="@/domain/value-objects/party"},
    @{from="../../../domain/value-objects/DelegationRecord"; to="@/domain/value-objects/party"},
    @{from="../../../domain/value-objects/Ids"; to="@/domain/value-objects/ids"},
    @{from="../../../domain/value-objects/Audit"; to="@/domain/value-objects/audit"}
)

# Obtener todos los archivos TypeScript
$tsFiles = Get-ChildItem -Path "src" -Recurse -Filter "*.ts" | Where-Object { $_.Name -ne "index.ts" -or $_.Directory.Name -eq "value-objects" }

$totalFiles = $tsFiles.Count
$processedFiles = 0

foreach ($file in $tsFiles) {
    $processedFiles++
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Aplicar reemplazos de imports con @
    foreach ($replacement in $replacements) {
        $content = $content -replace [regex]::Escape($replacement.from), $replacement.to
    }
    
    # Aplicar reemplazos de imports relativos
    foreach ($replacement in $relativeReplacements) {
        $content = $content -replace [regex]::Escape($replacement.from), $replacement.to
    }
    
    # Solo escribir si hubo cambios
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Actualizado: $($file.FullName)"
    }
    
    if ($processedFiles % 50 -eq 0) {
        Write-Host "Procesados $processedFiles de $totalFiles archivos..."
    }
}

Write-Host "Script completado. Procesados $totalFiles archivos."
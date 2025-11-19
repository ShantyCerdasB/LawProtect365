# Script para verificar que los triggers de Cognito están configurados correctamente
# Usage: .\verify-cognito-triggers.ps1 -UserPoolId <POOL_ID> [-Profile <AWS_PROFILE>]

param(
    [Parameter(Mandatory=$true)]
    [string]$UserPoolId,
    
    [string]$Profile = "shantyCB"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Verificando triggers de Cognito User Pool ===" -ForegroundColor Green
Write-Host "User Pool ID: $UserPoolId" -ForegroundColor Cyan
Write-Host "AWS Profile: $Profile" -ForegroundColor Cyan
Write-Host ""

# Configurar perfil AWS si se especificó
if ($Profile) {
    $env:AWS_PROFILE = $Profile
}

try {
    # Obtener configuración del User Pool
    Write-Host "Obteniendo configuración del User Pool..." -ForegroundColor Yellow
    $userPool = aws cognito-idp describe-user-pool --user-pool-id $UserPoolId --profile $Profile | ConvertFrom-Json
    
    if (-not $userPool.UserPool) {
        Write-Host "ERROR: No se encontró el User Pool" -ForegroundColor Red
        exit 1
    }
    
    # Verificar triggers Lambda
    $lambdaConfig = $userPool.UserPool.LambdaConfig
    
    Write-Host ""
    Write-Host "=== Triggers Lambda Configurados ===" -ForegroundColor Green
    Write-Host ""
    
    if ($lambdaConfig.PreAuthentication) {
        Write-Host "✓ PreAuthentication: $($lambdaConfig.PreAuthentication)" -ForegroundColor Green
    } else {
        Write-Host "✗ PreAuthentication: NO CONFIGURADO" -ForegroundColor Red
    }
    
    if ($lambdaConfig.PostAuthentication) {
        Write-Host "✓ PostAuthentication: $($lambdaConfig.PostAuthentication)" -ForegroundColor Green
    } else {
        Write-Host "✗ PostAuthentication: NO CONFIGURADO" -ForegroundColor Red
    }
    
    if ($lambdaConfig.PostConfirmation) {
        Write-Host "✓ PostConfirmation: $($lambdaConfig.PostConfirmation)" -ForegroundColor Green
    } else {
        Write-Host "✗ PostConfirmation: NO CONFIGURADO" -ForegroundColor Red
    }
    
    if ($lambdaConfig.PreTokenGeneration) {
        Write-Host "✓ PreTokenGeneration: $($lambdaConfig.PreTokenGeneration)" -ForegroundColor Green
    } else {
        Write-Host "✗ PreTokenGeneration: NO CONFIGURADO" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "=== Resumen ===" -ForegroundColor Green
    $configuredCount = 0
    if ($lambdaConfig.PreAuthentication) { $configuredCount++ }
    if ($lambdaConfig.PostAuthentication) { $configuredCount++ }
    if ($lambdaConfig.PostConfirmation) { $configuredCount++ }
    if ($lambdaConfig.PreTokenGeneration) { $configuredCount++ }
    
    Write-Host "Triggers configurados: $configuredCount / 4" -ForegroundColor $(if ($configuredCount -eq 4) { "Green" } else { "Yellow" })
    
    # Verificar que las funciones Lambda existen y tienen el alias 'live'
    Write-Host ""
    Write-Host "=== Verificando Lambda Functions ===" -ForegroundColor Green
    Write-Host ""
    
    $triggers = @(
        @{ Name = "PreAuthentication"; Arn = $lambdaConfig.PreAuthentication },
        @{ Name = "PostAuthentication"; Arn = $lambdaConfig.PostAuthentication },
        @{ Name = "PostConfirmation"; Arn = $lambdaConfig.PostConfirmation },
        @{ Name = "PreTokenGeneration"; Arn = $lambdaConfig.PreTokenGeneration }
    )
    
    foreach ($trigger in $triggers) {
        if ($trigger.Arn) {
            # Extraer nombre de función y alias del ARN
            if ($trigger.Arn -match ':function:([^:]+):(.+)$') {
                $functionName = $matches[1]
                $aliasName = $matches[2]
                
                Write-Host "$($trigger.Name):" -ForegroundColor Cyan
                Write-Host "  Function: $functionName" -ForegroundColor White
                Write-Host "  Alias: $aliasName" -ForegroundColor White
                
                # Verificar que la función existe
                try {
                    $function = aws lambda get-function --function-name $functionName --qualifier $aliasName --profile $Profile 2>&1 | ConvertFrom-Json
                    if ($function.Configuration) {
                        Write-Host "  Status: ✓ Existe" -ForegroundColor Green
                        Write-Host "  Runtime: $($function.Configuration.Runtime)" -ForegroundColor White
                        Write-Host "  Handler: $($function.Configuration.Handler)" -ForegroundColor White
                    }
                } catch {
                    Write-Host "  Status: ✗ Error al verificar función" -ForegroundColor Red
                    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
                }
            } else {
                Write-Host "$($trigger.Name): ARN inválido - $($trigger.Arn)" -ForegroundColor Red
            }
        }
    }
    
    Write-Host ""
    Write-Host "=== Verificación completada ===" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Posibles causas:" -ForegroundColor Yellow
    Write-Host "1. El User Pool ID es incorrecto" -ForegroundColor White
    Write-Host "2. No tienes permisos para describir el User Pool" -ForegroundColor White
    Write-Host "3. El perfil AWS no está configurado correctamente" -ForegroundColor White
    Write-Host ""
    Write-Host "Para obtener el User Pool ID, ejecuta:" -ForegroundColor Cyan
    Write-Host "  aws cognito-idp list-user-pools --max-results 10 --profile $Profile" -ForegroundColor White
    exit 1
}


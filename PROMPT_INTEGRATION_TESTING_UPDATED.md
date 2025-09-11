# 🚀 Prompt para Integration Testing - Signature Service (Versión Actualizada)

## 📋 Contexto del Proyecto:

Estoy trabajando en un **microservicio de firmas digitales** (como Rocket Lawyer) que maneja el flujo completo de firma de documentos. El servicio está construido con **Clean Architecture/Hexagonal Architecture** y usa **TypeScript**.

## 🏗️ Estructura del Proyecto:

```
services/signature-service/
├── src/
│   ├── presentation/controllers/     # Controllers HTTP
│   │   ├── envelopes/               # CRUD de envelopes
│   │   ├── parties/                 # CRUD de parties
│   │   ├── requests/                # Invitaciones, recordatorios, cancelaciones
│   │   ├── signing/                 # Firma de documentos
│   │   ├── consents/                # Gestión de consentimientos
│   │   └── global-parties/          # Parties globales
│   ├── app/                        # Application layer
│   │   ├── services/               # Business logic
│   │   ├── adapters/               # Port implementations
│   │   └── ports/                  # Interfaces
│   ├── domain/                     # Domain layer
│   │   ├── entities/               # Domain entities
│   │   ├── rules/                  # Business rules
│   │   └── values/                 # Value objects
│   ├── infrastructure/             # Infrastructure layer
│   │   └── dynamodb/               # DynamoDB repositories
│   └── core/                       # Dependency injection
├── __tests__/integration/          # Integration tests
└── package.json
```

## 🧪 Filosofía de Testing:

- **NO MOCKEAR CASI NADA** - Usamos repositorios reales con DynamoDB local
- **Encontrar errores de lógica** - No hacer que los tests pasen, sino validar que la app funciona correctamente
- **Errores informativos** - Si hay un error, analizar la causa raíz, no hacer workarounds
- **Validación completa** - Probar todos los flujos y edge cases

## 🔧 Configuración Técnica:

- **DynamoDB Local** - Revisa `package.json` para scripts de setup de tablas
- **Cognito Token** - Tenemos un servidor que simula tokens de Cognito
- **Repositorios Reales** - No mocks, usamos la infraestructura real
- **AWS Services** - Solo se mockean servicios externos (S3, KMS, etc.)

## 📊 Controllers y sus Funciones Específicas:

### 1. ENVELOPES (7 controllers):
- `CreateEnvelope` - Crear envelope vacío (solo metadata)
- `UpdateEnvelope` - Actualizar metadata del envelope
- `DeleteEnvelope` - Eliminar envelope
- `GetEnvelope` - Obtener envelope completo por ID
- `GetEnvelopeStatus` - Obtener solo el status del envelope
- `ListEnvelopes` - Listar envelopes con paginación y filtros

### 2. PARTIES (7 controllers):
- `CreateParty` - Crear party en un envelope específico (status: "pending")
- `UpdateParty` - Actualizar información del party
- `DeleteParty` - Eliminar party del envelope
- `GetParty` - Obtener party específico por ID
- `ListParties` - Listar todos los parties de un envelope
- `SearchPartiesByEmail` - Buscar parties por email en un envelope

### 3. REQUESTS (7 controllers):
- `InviteParties` - Invitar parties existentes a firmar (genera tokens, status: "invited")
- `AddViewer` - Agregar viewer (solo lectura, no puede firmar)
- `RemindParties` - Enviar recordatorios a parties pendientes
- `RequestSignature` - Solicitar firma específica a un party
- `CancelEnvelope` - Cancelar envelope (no se puede firmar más)
- `DeclineEnvelope` - Rechazar envelope completo
- `FinaliseEnvelope` - Finalizar envelope (generar certificados)

### 4. SIGNING (9 controllers):
- `CompleteSigning` - Firmar documento (usuario autenticado)
- `CompleteSigningWithToken` - Firmar documento (usuario sin auth, con token)
- `ValidateInvitationToken` - Validar token de invitación
- `RecordConsent` - Registrar consentimiento (usuario autenticado)
- `RecordConsentWithToken` - Registrar consentimiento (usuario sin auth)
- `PrepareSigning` - Preparar proceso de firma
- `DeclineSigning` - Rechazar firma específica
- `DownloadSignedDocument` - Descargar documento ya firmado
- `PresignUpload` - Generar URL de upload para documentos

### 5. CONSENTS (6 controllers):
- `CreateConsent` - Crear consentimiento personalizado
- `UpdateConsent` - Actualizar consentimiento existente
- `DeleteConsent` - Eliminar consentimiento
- `ListConsents` - Listar consentimientos de un envelope
- `SubmitConsent` - Enviar consentimiento para aprobación
- `DelegateConsent` - Delegar consentimiento a otro usuario

### 6. GLOBAL PARTIES (7 controllers):
- `CreateGlobalParty` - Crear party global (reutilizable)
- `UpdateGlobalParty` - Actualizar party global
- `DeleteGlobalParty` - Eliminar party global
- `GetGlobalParty` - Obtener party global por ID
- `ListGlobalParties` - Listar parties globales
- `SearchGlobalPartiesByEmail` - Buscar parties globales por email

### 7. CERTIFICATE (1 controller):
- `GetCertificate` - Obtener certificado de firma

### 8. AUDIT (3 controllers):
- `GetAuditEvent` - Obtener evento específico de auditoría
- `GetAuditTrail` - Obtener trail completo de auditoría
- `RecordAuditEvent` - Registrar evento de auditoría

## ⚠️ IMPORTANTE - Responsabilidades Clarificadas:

### **Controllers NO Duplicados (Diferentes Flujos de Autenticación):**
- `CompleteSigning` vs `CompleteSigningWithToken` - Uno requiere auth, otro usa token
- `RecordConsent` vs `RecordConsentWithToken` - Uno requiere auth, otro usa token

### **Controllers con Responsabilidades Específicas:**
- `CreateParty` - **SOLO** crear party (status: "pending")
- `InviteParties` - **SOLO** invitar parties existentes (status: "invited") + generar tokens

### **Consentimiento OBLIGATORIO:**
- **TODAS las firmas deben llevar consentimiento** para validez legal
- Es un paso obligatorio en todos los flujos de firma

## 🎯 Flujos de Testing Específicos (CORREGIDOS):

### A. FLUJO DE FIRMA PERSONAL (1 persona, sin invitaciones):
```
1. CreateEnvelope (crear envelope vacío)
2. CreateParty (crear party con role: 'signer' - el mismo usuario)
3. RecordConsent (registrar consentimiento - usuario autenticado)
4. CompleteSigning (firmar documento - usuario autenticado)
5. DownloadSignedDocument (descargar documento firmado)
```

### B. FLUJO DE FIRMA INDIVIDUAL CON INVITACIÓN (1 persona invitada):
```
1. CreateEnvelope (crear envelope vacío)
2. CreateParty (crear party con role: 'signer')
3. InviteParties (invitar party existente, genera token)
4. ValidateInvitationToken (validar token)
5. RecordConsentWithToken (registrar consentimiento)
6. CompleteSigningWithToken (firmar documento)
7. DownloadSignedDocument (descargar documento firmado)
```

### C. FLUJO DE FIRMA MÚLTIPLE (3+ personas):
```
1. CreateEnvelope (crear envelope vacío)
2. CreateParty (crear múltiples parties con role: 'signer')
3. InviteParties (invitar todos los parties existentes)
4. Para cada party:
   a. ValidateInvitationToken
   b. RecordConsentWithToken
   c. CompleteSigningWithToken
5. FinaliseEnvelope (finalizar cuando todos firmen)
6. DownloadSignedDocument (descargar documento final)
```

### D. FLUJO DE INVITACIONES:
```
1. CreateEnvelope (crear envelope vacío)
2. CreateParty (crear parties)
3. InviteParties (invitar parties existentes)
4. ValidateInvitationToken (validar token)
5. RemindParties (enviar recordatorios si es necesario)
```

### E. FLUJO DE CONSENTIMIENTOS:
```
1. CreateEnvelope (crear envelope vacío)
2. CreateParty (crear parties)
3. CreateConsent (crear consentimiento personalizado)
4. SubmitConsent (enviar para aprobación)
5. RecordConsent (registrar consentimiento)
6. CompleteSigning (firmar con consentimiento)
```

### F. FLUJO DE GLOBAL PARTIES:
```
1. CreateGlobalParty (crear party global)
2. CreateEnvelope (crear envelope vacío)
3. CreateParty (usar party global como base)
4. InviteParties (invitar party existente)
5. CompleteSigning (firmar)
```

### G. FLUJO DE VIEWERS:
```
1. CreateEnvelope (crear envelope vacío)
2. CreateParty (crear party con role: 'signer')
3. AddViewer (agregar viewer)
4. InviteParties (invitar party existente)
5. CompleteSigning (firmar)
6. GetEnvelope (viewer puede ver pero no firmar)
```

### H. FLUJO DE CANCELACIÓN/DECLINACIÓN:
```
1. CreateEnvelope (crear envelope vacío)
2. CreateParty (crear parties)
3. InviteParties (invitar parties existentes)
4. CancelEnvelope (cancelar envelope)
5. ValidateInvitationToken (debe fallar)
6. CompleteSigningWithToken (debe fallar)
```

### I. FLUJO DE AUDITORÍA:
```
1. CreateEnvelope (crear envelope vacío)
2. CreateParty (crear parties)
3. InviteParties (invitar parties existentes)
4. CompleteSigning (firmar)
5. GetAuditTrail (verificar trail de auditoría)
6. GetAuditEvent (verificar eventos específicos)
```

## ⚠️ Edge Cases Críticos a Probar:

### 1. Seguridad de Firma:
- Firmar en input que no está asignado al usuario
- Usar token inválido/expirado
- Intentar firmar envelope cancelado
- Intentar firmar sin ser invitado
- Intentar firmar con finalPdfUrl incorrecto

### 2. Validaciones de Inputs:
- Invitar con hasInputs: false
- Invitar con signatureInputs: 0
- Invitar party no en assignedSigners
- Finalizar con inputCount: 0

### 3. Autorización:
- Usuario no autorizado accediendo a envelope
- Permisos incorrectos para operaciones
- Acceso a envelope de otro usuario

### 4. Concurrencia:
- Múltiples usuarios firmando simultáneamente
- Race conditions en actualizaciones de estado
- Estado inconsistente por operaciones concurrentes

### 5. Consentimientos:
- Firmar sin consentimiento registrado
- Consentimiento expirado
- Consentimiento inválido

### 6. Flujos Incorrectos:
- Intentar invitar party que no existe
- Intentar firmar sin ser invitado
- Intentar finalizar envelope sin todas las firmas

## 📋 Reglas Importantes:

1. **NO HACER WORKAROUNDS** - Si hay un error, analizar la causa raíz
2. **EXPLICAR CAMBIOS** - Si vas a cambiar código, explicar por qué antes de empezar
3. **ERRORES INFORMATIVOS** - Validar que los errores son claros y útiles
4. **COBERTURA COMPLETA** - Usar TODOS los controllers en los tests
5. **FLUJOS REALES** - Probar flujos completos, no solo unidades
6. **CONSENTIMIENTOS OBLIGATORIOS** - Recordar que el consentimiento es crucial para firma válida
7. **RESPONSABILIDADES CLARAS** - CreateParty solo crea, InviteParties solo invita
8. **ORDEN CORRECTO** - Siempre crear party antes de invitar

## 🎯 Objetivo:

Crear integration tests que:
- **Validen la lógica de negocio** completa
- **Encuentren errores** de implementación
- **Prueben edge cases** críticos
- **Verifiquen la integridad** de los datos
- **Confirmen la seguridad** de las operaciones
- **Validen el flujo completo** de cada escenario
- **Respeten las responsabilidades** de cada controller

**¿Estás listo para empezar? Primero revisa el `package.json` para entender la configuración de DynamoDB local y luego propón la estructura de tests que vamos a implementar.**

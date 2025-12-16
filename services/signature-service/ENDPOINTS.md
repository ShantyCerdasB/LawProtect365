# Signature Service - Endpoints Documentation

Este documento describe todos los endpoints disponibles en el Signature Service, su propósito y los payloads esperados.

## Autenticación

- **JWT Required**: Requiere token JWT válido con roles de Cognito
- **Optional JWT**: Permite acceso sin autenticación para usuarios externos (con invitation tokens)
- **Token-based**: Acceso mediante invitation tokens (sin JWT)

---

## 1. Gestión de Envelopes

### 1.1. Crear Envelope
**Endpoint:** `POST /envelopes`  
**Autenticación:** JWT Required  
**Handler:** `CreateEnvelopeHandler`

**Propósito:** Crea un nuevo envelope (sobre) de firma con metadatos. Los signers se agregan por separado o durante la creación.

**Payload (Body):**
```json
{
  "title": "string (max 255 caracteres, requerido)",
  "description": "string (max 1000 caracteres, opcional)",
  "signingOrderType": "OWNER_FIRST" | "INVITEES_FIRST" (opcional, default: OWNER_FIRST)",
  "originType": "UPLOAD" | "TEMPLATE" | "GENERATED" (requerido)",
  "templateId": "string (opcional, requerido si originType es TEMPLATE)",
  "templateVersion": "string (opcional, requerido si originType es TEMPLATE)",
  "expiresAt": "ISO 8601 date string (opcional)",
  "sourceKey": "string (requerido, S3 key del documento fuente)",
  "metaKey": "string (requerido, S3 key de los metadatos)"
}
```

**Respuesta (201 Created):**
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "status": "DRAFT",
  "signingOrderType": "OWNER_FIRST" | "INVITEES_FIRST",
  "originType": "UPLOAD" | "TEMPLATE" | "GENERATED",
  "createdBy": "string (userId)",
  "sourceKey": "string",
  "metaKey": "string",
  "expiresAt": "ISO 8601 date string",
  "createdAt": "ISO 8601 date string",
  "templateId": "string (solo si originType es TEMPLATE)",
  "templateVersion": "string (solo si originType es TEMPLATE)"
}
```

---

### 1.2. Listar Envelopes por Usuario
**Endpoint:** `GET /envelopes`  
**Autenticación:** JWT Required  
**Handler:** `GetEnvelopesByUserHandler`

**Propósito:** Lista todos los envelopes del usuario autenticado con paginación cursor-based y filtrado por estado.

**Query Parameters:**
```
status: "DRAFT" | "SENT" | "COMPLETED" | "CANCELLED" | "DECLINED" (opcional)
limit: number (1-100, requerido)
cursor: string (opcional, para paginación)
includeSigners: "true" | "false" (opcional, default: true)
```

**Respuesta (200 OK):**
```json
{
  "envelopes": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "status": "string",
      "signingOrderType": "string",
      "originType": "string",
      "createdBy": "string",
      "expiresAt": "ISO 8601 date string",
      "createdAt": "ISO 8601 date string",
      "updatedAt": "ISO 8601 date string",
      "templateId": "string (solo si originType es TEMPLATE)",
      "templateVersion": "string (solo si originType es TEMPLATE)"
    }
  ],
  "signers": [
    [
      {
        "id": "uuid",
        "email": "string",
        "fullName": "string",
        "isExternal": "boolean",
        "order": "number",
        "status": "string",
        "userId": "string",
        "signedAt": "ISO 8601 date string",
        "declinedAt": "ISO 8601 date string",
        "declineReason": "string",
        "consentGiven": "boolean",
        "consentTimestamp": "ISO 8601 date string"
      }
    ]
  ],
  "nextCursor": "string (opcional, para siguiente página)"
}
```

---

### 1.3. Obtener Envelope por ID
**Endpoint:** `GET /envelopes/{id}`  
**Autenticación:** Optional JWT (permite invitation tokens)  
**Handler:** `GetEnvelopeHandler`

**Propósito:** Obtiene los detalles completos de un envelope, incluyendo información de todos los signers. Soporta acceso para usuarios autenticados (owners) y usuarios externos (con invitation tokens).

**Path Parameters:**
```
id: uuid (requerido)
```

**Query Parameters:**
```
invitationToken: string (opcional, para usuarios externos)
includeSigners: "true" | "false" (opcional, default: true)
```

**Respuesta (200 OK):**
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "status": "string",
  "signingOrderType": "string",
  "originType": "string",
  "createdBy": "string",
  "sourceKey": "string",
  "metaKey": "string",
  "expiresAt": "ISO 8601 date string",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string",
  "accessType": "OWNER" | "EXTERNAL",
  "templateId": "string (solo si originType es TEMPLATE)",
  "templateVersion": "string (solo si originType es TEMPLATE)",
  "signers": [
    {
      "id": "uuid",
      "email": "string",
      "fullName": "string",
      "isExternal": "boolean",
      "order": "number",
      "status": "string",
      "userId": "string",
      "signedAt": "ISO 8601 date string",
      "declinedAt": "ISO 8601 date string",
      "declineReason": "string",
      "consentGiven": "boolean",
      "consentTimestamp": "ISO 8601 date string"
    }
  ]
}
```

---

### 1.4. Actualizar Envelope
**Endpoint:** `PATCH /envelopes/{id}`  
**Autenticación:** JWT Required  
**Handler:** `UpdateEnvelopeHandler`

**Propósito:** Actualiza los metadatos de un envelope en estado DRAFT. Permite modificar título, descripción, fecha de expiración, orden de firma, y agregar/remover signers.

**Path Parameters:**
```
id: uuid (requerido)
```

**Payload (Body):**
```json
{
  "title": "string (max 255 caracteres, opcional)",
  "description": "string (max 1000 caracteres, opcional)",
  "expiresAt": "ISO 8601 date string (opcional)",
  "signingOrderType": "OWNER_FIRST" | "INVITEES_FIRST" (opcional)",
  "sourceKey": "string (opcional)",
  "metaKey": "string (opcional)",
  "addSigners": [
    {
      "email": "string (email válido, requerido)",
      "fullName": "string (max 255 caracteres, requerido)",
      "order": "number (min 1, opcional)",
      "isExternal": "boolean (requerido)",
      "userId": "string (opcional)"
    }
  ],
  "removeSignerIds": ["uuid"] (opcional),
  "customFields": {} (opcional, objeto JSON),
  "tags": ["string"] (opcional),
  "reminders": {
    "daysBeforeExpiration": "number (1-365, opcional)",
    "firstReminderDays": "number (1-30, opcional)",
    "secondReminderDays": "number (1-30, opcional)"
  } (opcional)
}
```

**Respuesta (200 OK):**
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "status": "string",
  "signingOrderType": "string",
  "originType": "string",
  "createdBy": "string",
  "sourceKey": "string",
  "metaKey": "string",
  "expiresAt": "ISO 8601 date string",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string",
  "templateId": "string (solo si originType es TEMPLATE)",
  "templateVersion": "string (solo si originType es TEMPLATE)",
  "signers": [
    {
      "id": "uuid",
      "email": "string",
      "fullName": "string",
      "isExternal": "boolean",
      "order": "number",
      "status": "string",
      "userId": "string"
    }
  ]
}
```

---

### 1.5. Enviar Envelope
**Endpoint:** `POST /envelopes/{id}/send`  
**Autenticación:** JWT Required  
**Handler:** `SendEnvelopeHandler`

**Propósito:** Envía el envelope a los signers, generando invitation tokens y enviando notificaciones por email. Solo funciona si el envelope está en estado DRAFT.

**Path Parameters:**
```
id: uuid (requerido)
```

**Payload (Body):**
```json
{
  "message": "string (opcional, mensaje general para todos los signers)",
  "sendToAll": "boolean (opcional, default: false, envía a todos los signers externos)",
  "signers": [
    {
      "signerId": "uuid (requerido)",
      "message": "string (opcional, mensaje personalizado para este signer)"
    }
  ] (opcional, requerido si sendToAll es false)
}
```

**Nota:** Debe proporcionarse `sendToAll: true` O un array `signers` con al menos un elemento.

**Respuesta (200 OK):**
```json
{
  "success": "boolean",
  "message": "string",
  "envelopeId": "uuid",
  "status": "string",
  "tokensGenerated": "number",
  "signersNotified": "number",
  "tokens": ["string"] (opcional, array de tokens generados)
}
```

---

### 1.6. Cancelar Envelope
**Endpoint:** `POST /envelopes/{id}/cancel`  
**Autenticación:** JWT Required  
**Handler:** `CancelEnvelopeHandler`

**Propósito:** Cancela un envelope, revocando todos los invitation tokens y actualizando el estado a CANCELLED. Solo el creador del envelope puede cancelarlo.

**Path Parameters:**
```
id: uuid (requerido)
```

**Payload (Body):**
```json
{}
```
(No requiere body, solo el ID en el path)

**Respuesta (200 OK):**
```json
{
  "success": true,
  "message": "Envelope cancelled successfully",
  "envelope": {
    "id": "uuid",
    "status": "CANCELLED",
    "title": "string",
    "cancelledAt": "ISO 8601 date string"
  }
}
```

---

### 1.7. Obtener Audit Trail
**Endpoint:** `GET /envelopes/{id}/audit-trail`  
**Autenticación:** JWT Required  
**Handler:** `GetAuditTrailHandler`

**Propósito:** Obtiene el historial completo de eventos de auditoría de un envelope en orden cronológico.

**Path Parameters:**
```
id: uuid (requerido)
```

**Query Parameters:** Ninguno

**Respuesta (200 OK):**
```json
{
  "envelopeId": "uuid",
  "events": [
    {
      "id": "uuid",
      "eventType": "string",
      "description": "string",
      "userEmail": "string (opcional)",
      "userName": "string (opcional)",
      "createdAt": "ISO 8601 date string",
      "metadata": {} (opcional, objeto JSON con información adicional)
    }
  ]
}
```

---

## 2. Gestión de Documentos

### 2.1. Descargar Documento
**Endpoint:** `GET /envelopes/{envelopeId}/download`  
**Autenticación:** Optional JWT (permite invitation tokens)  
**Handler:** `DownloadDocumentHandler`

**Propósito:** Genera una URL presignada de S3 para descargar el documento firmado. Soporta usuarios autenticados y externos (con invitation tokens).

**Path Parameters:**
```
envelopeId: uuid (requerido)
```

**Query Parameters:**
```
invitationToken: string (opcional, para usuarios externos)
expiresIn: number (opcional, segundos, debe estar entre min y max configurados)
```

**Respuesta (200 OK):**
```json
{
  "success": true,
  "message": "Document download URL generated successfully",
  "downloadUrl": "string (URL presignada de S3)",
  "expiresIn": "number (segundos)",
  "expiresAt": "ISO 8601 date string"
}
```

**Respuesta de Error:**
```json
{
  "success": false,
  "message": "string (mensaje de error)",
  "downloadUrl": "",
  "expiresIn": 0,
  "expiresAt": "ISO 8601 date string"
}
```

---

## 3. Operaciones de Firma

### 3.1. Firmar Documento
**Endpoint:** `POST /envelopes/{id}/sign`  
**Autenticación:** Optional JWT (permite invitation tokens)  
**Handler:** `SignDocumentHandler`

**Propósito:** Firma un documento del envelope. Soporta usuarios autenticados (owners) y usuarios externos (con invitation tokens). Requiere consentimiento ESIGN/UETA.

**Path Parameters:**
```
id: uuid (requerido)
```

**Payload (Body):**
```json
{
  "invitationToken": "string (opcional, para usuarios externos)",
  "envelopeId": "uuid (opcional, requerido si no hay invitationToken)",
  "signerId": "uuid (opcional, requerido si no hay invitationToken)",
  "flattenedKey": "string (opcional, S3 key del PDF aplanado)",
  "signedDocument": "string (opcional, Base64 del PDF firmado)",
  "consent": {
    "given": true (requerido, debe ser true),
    "timestamp": "ISO 8601 date string (requerido)",
    "text": "string (requerido, texto del consentimiento)",
    "ipAddress": "string (opcional)",
    "userAgent": "string (opcional)",
    "country": "string (opcional)"
  } (requerido)
}
```

**Nota:** Debe proporcionarse `invitationToken` O (`envelopeId` y `signerId`).

**Respuesta (200 OK):**
```json
{
  "message": "string",
  "signature": {
    "id": "uuid",
    "signerId": "uuid",
    "envelopeId": "uuid",
    "signedAt": "ISO 8601 date string",
    "algorithm": "string",
    "hash": "string"
  },
  "envelope": {
    "id": "uuid",
    "status": "string",
    "progress": "number (0-100)"
  }
}
```

---

### 3.2. Rechazar Firma
**Endpoint:** `POST /envelopes/{id}/signers/{signerId}/decline`  
**Autenticación:** Optional JWT (permite invitation tokens)  
**Handler:** `DeclineSignerHandler`

**Propósito:** Permite a un signer rechazar firmar el documento, proporcionando una razón. Actualiza el estado del envelope a DECLINED si corresponde.

**Path Parameters:**
```
id: uuid (requerido, envelopeId)
signerId: uuid (requerido)
```

**Payload (Body):**
```json
{
  "invitationToken": "string (requerido para usuarios externos)",
  "reason": "string (min 1, max 500 caracteres, requerido)",
  "metadata": {
    "ipAddress": "string (IP válida, opcional)",
    "userAgent": "string (opcional)",
    "timestamp": "ISO 8601 date string (opcional)"
  } (opcional)
}
```

**Respuesta (200 OK):**
```json
{
  "message": "string",
  "decline": {
    "signerId": "uuid",
    "envelopeId": "uuid",
    "reason": "string",
    "declinedAt": "ISO 8601 date string",
    "envelopeStatus": "string"
  }
}
```

---

## 4. Compartir Vista de Documento

### 4.1. Compartir Vista de Documento
**Endpoint:** `POST /envelopes/{envelopeId}/share-view`  
**Autenticación:** JWT Required  
**Handler:** `ShareDocumentViewHandler`

**Propósito:** Comparte acceso de solo lectura (viewer) a un documento con un usuario externo. Crea un viewer participant, genera un invitation token y envía notificación por email.

**Path Parameters:**
```
envelopeId: uuid (requerido)
```

**Payload (Body):**
```json
{
  "email": "string (email válido, requerido)",
  "fullName": "string (min 1 caracter, requerido)",
  "message": "string (opcional, mensaje personalizado)",
  "expiresIn": "number (min 1, max 365 días, opcional, default: 7 días)"
}
```

**Respuesta (201 Created):**
```json
{
  "success": true,
  "message": "string",
  "envelopeId": "uuid",
  "viewerEmail": "string",
  "viewerName": "string",
  "token": "string (invitation token generado)",
  "expiresAt": "ISO 8601 date string",
  "expiresInDays": "number"
}
```

---

## 5. Notificaciones

### 5.1. Enviar Notificación
**Endpoint:** `POST /notifications`  
**Autenticación:** JWT Required  
**Handler:** `SendNotificationHandler`

**Propósito:** Endpoint interno para enviar notificaciones. Normalmente se usa mediante eventos de EventBridge, no directamente desde el cliente.

**Nota:** Este endpoint es principalmente para uso interno del sistema de notificaciones.

---

## Resumen de Autenticación

| Endpoint | Autenticación | Notas |
|----------|---------------|-------|
| `POST /envelopes` | JWT Required | Solo usuarios autenticados |
| `GET /envelopes` | JWT Required | Solo usuarios autenticados |
| `GET /envelopes/{id}` | Optional JWT | Permite invitation tokens |
| `PATCH /envelopes/{id}` | JWT Required | Solo usuarios autenticados |
| `POST /envelopes/{id}/send` | JWT Required | Solo usuarios autenticados |
| `POST /envelopes/{id}/cancel` | JWT Required | Solo el creador |
| `GET /envelopes/{id}/audit-trail` | JWT Required | Solo usuarios autenticados |
| `GET /envelopes/{envelopeId}/download` | Optional JWT | Permite invitation tokens |
| `POST /envelopes/{id}/sign` | Optional JWT | Permite invitation tokens |
| `POST /envelopes/{id}/signers/{signerId}/decline` | Optional JWT | Permite invitation tokens |
| `POST /envelopes/{envelopeId}/share-view` | JWT Required | Solo usuarios autenticados |

---

## Tipos de Datos Comunes

### SigningOrderType
- `OWNER_FIRST`: El owner firma primero, luego los invitados
- `INVITEES_FIRST`: Los invitados firman primero, luego el owner

### DocumentOriginType
- `UPLOAD`: Documento subido por el usuario
- `TEMPLATE`: Documento generado desde una plantilla
- `GENERATED`: Documento generado automáticamente

### EnvelopeStatus
- `DRAFT`: Envelope en borrador
- `SENT`: Envelope enviado a signers
- `COMPLETED`: Todos los signers han firmado
- `CANCELLED`: Envelope cancelado
- `DECLINED`: Al menos un signer rechazó firmar

---

## Notas Importantes

1. **Invitation Tokens**: Los usuarios externos acceden mediante invitation tokens generados cuando se envía el envelope. Estos tokens tienen expiración y se revocan cuando el envelope se cancela.

2. **Consentimiento**: Todas las firmas requieren consentimiento ESIGN/UETA explícito con timestamp y texto del consentimiento.

3. **Estados del Envelope**: Los envelopes solo pueden modificarse en estado DRAFT. Una vez enviados (SENT), no se pueden modificar.

4. **Paginación**: La lista de envelopes usa paginación cursor-based para mejor rendimiento.

5. **Auditoría**: Todos los eventos importantes se registran en el audit trail para cumplimiento legal.

6. **Seguridad**: Los documentos se almacenan en S3 con URLs presignadas con expiración. Los invitation tokens tienen expiración configurable.


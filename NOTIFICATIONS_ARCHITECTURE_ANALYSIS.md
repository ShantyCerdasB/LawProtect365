# Análisis de Arquitectura: Notifications Service

## 📋 Resumen Ejecutivo

Este documento analiza la arquitectura de notificaciones, define responsabilidades del `notifications-service`, y recomienda la mejor estrategia para notificaciones en tiempo real (WebSocket).

---

## 1. 🗑️ Eliminación de Código de Polling (EventPublisherService)

### Estado Actual

**Código a eliminar:**
- `packages/shared-ts/src/services/EventPublisher.ts` - Clase completa
- `packages/shared-ts/src/services/EventServiceFactory.ts` - Método `createEventPublisherService`
- `packages/shared-ts/src/events/EventsPublisher.ts` - `makeEventPublisher` (alternativa funcional)
- Referencias en `services/signature-service` y `services/auth-service` (solo se crea, nunca se usa)

**Código a mantener:**
- ✅ `OutboxEventPublisher` (guarda en DynamoDB)
- ✅ `OutboxStreamProcessor` (procesa DynamoDB Streams)
- ✅ `OutboxStreamHandler` (Lambda handler)

### Razón

- **No se usa en producción**: Solo se crea pero nunca se invoca
- **DynamoDB Streams es superior**: Procesamiento en tiempo real vs polling cada X minutos
- **Menos código = menos mantenimiento**: Eliminar código muerto

---

## 2. 🏗️ Arquitectura de Notifications Service

### Responsabilidades del Notifications Service

#### ✅ **DEBE hacer:**

1. **Consumir eventos de EventBridge**
   - Escuchar eventos de dominio (ENVELOPE_INVITATION, KYC_COMPLETED, etc.)
   - Procesar eventos de forma idempotente

2. **Enviar notificaciones por email (SES/Pinpoint)**
   - Renderizar plantillas de email
   - Enviar emails transaccionales
   - Manejar bounces y quejas

3. **Enviar notificaciones por SMS (Pinpoint)**
   - SMS para códigos OTP
   - SMS para alertas críticas

4. **Publicar eventos de notificación (opcional)**
   - Eventos como `NOTIFICATION_SENT`, `NOTIFICATION_FAILED`
   - Para otros servicios que necesiten tracking

5. **Gestionar plantillas de notificación**
   - Plantillas de email (HTML/text)
   - Plantillas de SMS
   - Variables dinámicas

#### ❌ **NO debe hacer:**

1. **No gestiona WebSocket directamente**
   - WebSocket requiere conexiones persistentes
   - Mejor separado en servicio dedicado

2. **No procesa eventos del Outbox**
   - Eso es responsabilidad de `event-publisher-service`

3. **No gestiona preferencias de usuario**
   - Eso es responsabilidad de `user-service` o `preferences-service`

---

## 3. 🔌 WebSocket para Notificaciones en Tiempo Real

### Análisis: ¿Parte de notifications-service o separado?

#### Opción A: WebSocket dentro de notifications-service ❌

**Problemas:**
- **Acoplamiento**: Notificaciones push y WebSocket tienen diferentes necesidades
- **Escalabilidad**: WebSocket requiere conexiones persistentes (API Gateway WebSocket)
- **Complejidad**: Mezcla dos dominios diferentes
- **Deployment**: Cambios en WebSocket afectan todo el servicio

#### Opción B: WebSocket como servicio separado ✅ **RECOMENDADO**

**Ventajas:**
- **Separación de responsabilidades**: Cada servicio tiene un propósito claro
- **Escalabilidad independiente**: WebSocket puede escalar diferente
- **Tecnología específica**: API Gateway WebSocket vs Lambda HTTP
- **Mantenimiento**: Cambios aislados

### Arquitectura Recomendada

```
┌─────────────────────────────────────────────────────────┐
│ EventBridge                                              │
│ - ENVELOPE_INVITATION                                   │
│ - KYC_COMPLETED                                         │
│ - DOCUMENT_SIGNED                                       │
└──────────────┬──────────────────────────┬───────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│ notifications-service     │  │ websocket-service         │
│                          │  │                          │
│ - Consume EventBridge    │  │ - API Gateway WebSocket   │
│ - Envía emails (SES)     │  │ - Gestiona conexiones    │
│ - Envía SMS (Pinpoint)   │  │ - Publica a clientes     │
│ - Publica eventos        │  │ - Escucha EventBridge    │
└──────────────────────────┘  └──────────────────────────┘
```

### Flujo de Notificación en Tiempo Real

```
1. signature-service → EventBridge (KYC_COMPLETED)
2. EventBridge → notifications-service → Envía email
3. EventBridge → websocket-service → Publica a WebSocket
4. Cliente móvil recibe notificación en tiempo real
```

**Beneficios:**
- ✅ Desacoplamiento total
- ✅ Cada servicio escala independientemente
- ✅ Fácil de mantener y testear
- ✅ Permite múltiples canales (email, SMS, push, WebSocket)

---

## 4. 📦 Estructura del Notifications Service

### Variables de Entorno

```typescript
// AWS Configuration
AWS_REGION=us-east-1
EVENT_BUS_NAME=lawprotect365-events-stg
EVENT_SOURCE=lawprotect365.notifications-service

// Email Configuration (SES)
SES_FROM_EMAIL=noreply@lawprotect365.com
SES_REPLY_TO_EMAIL=support@lawprotect365.com
SES_CONFIGURATION_SET=lawprotect365-email-config

// SMS Configuration (Pinpoint)
PINPOINT_APPLICATION_ID=xxx
PINPOINT_SENDER_ID=LawProtect

// Database
DATABASE_URL=postgresql://...
DB_MAX_CONNECTIONS=10

// Feature Flags
ENABLE_EMAIL=true
ENABLE_SMS=true
ENABLE_PUSH=false  // Para futuro

// Retry Configuration
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_MS=1000

// Monitoring
LOG_LEVEL=info
METRICS_NAMESPACE=NotificationsService
```

### Estructura de Directorios

```
services/notifications-service/
├── src/
│   ├── config/
│   │   └── AppConfig.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Notification.ts
│   │   │   └── NotificationTemplate.ts
│   │   ├── enums/
│   │   │   ├── NotificationChannel.ts
│   │   │   ├── NotificationStatus.ts
│   │   │   └── NotificationType.ts
│   │   ├── value-objects/
│   │   │   ├── EmailAddress.ts
│   │   │   ├── PhoneNumber.ts
│   │   │   └── NotificationId.ts
│   │   └── rules/
│   │       └── NotificationValidationRule.ts
│   ├── handlers/
│   │   └── EventBridgeHandler.ts  # Consume eventos
│   ├── infrastructure/
│   │   ├── adapters/
│   │   │   ├── SesEmailAdapter.ts
│   │   │   ├── PinpointSmsAdapter.ts
│   │   │   └── EventBridgePublisher.ts
│   │   └── factories/
│   │       └── CompositionRoot.ts
│   ├── repositories/
│   │   └── NotificationRepository.ts
│   └── services/
│       ├── EmailNotificationService.ts
│       ├── SmsNotificationService.ts
│       ├── TemplateService.ts
│       └── NotificationOrchestrator.ts
├── infra/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
└── package.json
```

---

## 5. 🎯 Eventos que Consume Notifications Service

### Eventos de Signature Service

```typescript
// ENVELOPE_INVITATION
{
  source: "sign.service",
  "detail-type": "ENVELOPE_INVITATION",
  detail: {
    envelopeId: "env-123",
    signerEmail: "user@example.com",
    signerName: "John Doe",
    message: "Please sign this document",
    invitationToken: "token-xyz"
  }
}

// SIGNER_DECLINED
{
  source: "sign.service",
  "detail-type": "SIGNER_DECLINED",
  detail: {
    envelopeId: "env-123",
    signerEmail: "user@example.com",
    declineReason: "Not interested"
  }
}

// ENVELOPE_CANCELLED
{
  source: "sign.service",
  "detail-type": "ENVELOPE_CANCELLED",
  detail: {
    envelopeId: "env-123",
    cancelledByUserId: "user-456"
  }
}

// REMINDER_NOTIFICATION
{
  source: "sign.service",
  "detail-type": "REMINDER_NOTIFICATION",
  detail: {
    envelopeId: "env-123",
    signerId: "signer-789",
    reminderCount: 1
  }
}
```

### Eventos de Otros Servicios (Futuro)

```typescript
// KYC_COMPLETED (kyc-service)
{
  source: "kyc.service",
  "detail-type": "KYC_COMPLETED",
  detail: {
    userId: "user-123",
    kycStatus: "APPROVED"
  }
}

// PAYMENT_RECEIVED (payments-service)
{
  source: "payments.service",
  "detail-type": "PAYMENT_RECEIVED",
  detail: {
    userId: "user-123",
    amount: 100.00,
    currency: "USD"
  }
}
```

---

## 6. 📧 Implementación de Email (SES)

### Configuración

```typescript
// Usar AWS SES para emails transaccionales
// Configurar dominio verificado
// Usar Configuration Sets para tracking
```

### Plantillas

```typescript
// templates/envelope-invitation.html
<h1>You have been invited to sign a document</h1>
<p>Hello {{signerName}},</p>
<p>{{message}}</p>
<a href="{{signingUrl}}">Sign Document</a>
```

---

## 7. 📱 Implementación de SMS (Pinpoint)

### Configuración

```typescript
// Usar AWS Pinpoint para SMS
// Configurar Sender ID
// Manejar códigos de país
```

---

## 8. 🔄 Eventos que Publica Notifications Service

### Para Tracking y Auditoría

```typescript
// NOTIFICATION_SENT
{
  source: "notifications.service",
  "detail-type": "NOTIFICATION_SENT",
  detail: {
    notificationId: "notif-123",
    channel: "EMAIL",
    recipient: "user@example.com",
    eventType: "ENVELOPE_INVITATION",
    status: "SENT",
    sentAt: "2024-01-01T00:00:00Z"
  }
}

// NOTIFICATION_FAILED
{
  source: "notifications.service",
  "detail-type": "NOTIFICATION_FAILED",
  detail: {
    notificationId: "notif-123",
    channel: "EMAIL",
    recipient: "user@example.com",
    error: "Bounce: Invalid email",
    retryCount: 3
  }
}
```

---

## 9. ✅ Recomendaciones Finales

### Inmediatas

1. ✅ **Eliminar EventPublisherService** (polling) de shared-ts
2. ✅ **Crear notifications-service** con estructura DDD
3. ✅ **Implementar consumo de EventBridge**
4. ✅ **Implementar envío de emails (SES)**
5. ✅ **Implementar envío de SMS (Pinpoint)**

### Futuras

1. 🔮 **Crear websocket-service** separado para notificaciones en tiempo real
2. 🔮 **Implementar push notifications** (FCM/APNS)
3. 🔮 **Dashboard de notificaciones** (estadísticas, retries)
4. 🔮 **Preferencias de usuario** (canales preferidos, horarios)

---

## 10. 📊 Comparación de Opciones

| Aspecto | WebSocket en notifications-service | WebSocket separado |
|---------|-----------------------------------|-------------------|
| **Acoplamiento** | ❌ Alto | ✅ Bajo |
| **Escalabilidad** | ❌ Limitada | ✅ Independiente |
| **Mantenimiento** | ❌ Complejo | ✅ Simple |
| **Deployment** | ❌ Acoplado | ✅ Independiente |
| **Tecnología** | ❌ Mezclada | ✅ Específica |
| **Testing** | ❌ Difícil | ✅ Fácil |

**Conclusión: WebSocket debe ser un servicio separado**

---

## 11. 🚀 Plan de Implementación

### Fase 1: Limpieza (Semana 1)
- [ ] Eliminar EventPublisherService de shared-ts
- [ ] Eliminar referencias en signature-service y auth-service
- [ ] Actualizar documentación

### Fase 2: Notifications Service Base (Semana 2-3)
- [ ] Crear estructura DDD
- [ ] Implementar EventBridge handler
- [ ] Implementar Email service (SES)
- [ ] Implementar SMS service (Pinpoint)
- [ ] Crear Terraform infrastructure

### Fase 3: Integración (Semana 4)
- [ ] Conectar con EventBridge
- [ ] Probar con eventos de signature-service
- [ ] Implementar retry logic
- [ ] Monitoreo y alertas

### Fase 4: WebSocket Service (Futuro)
- [ ] Diseñar websocket-service
- [ ] Implementar API Gateway WebSocket
- [ ] Conectar con EventBridge
- [ ] Cliente móvil integration

---

## 📝 Notas Finales

- **Separación de responsabilidades** es clave para mantenibilidad
- **WebSocket separado** permite escalar y evolucionar independientemente
- **EventBridge** como backbone de eventos permite desacoplamiento total
- **DDD** mantiene el código organizado y testeable


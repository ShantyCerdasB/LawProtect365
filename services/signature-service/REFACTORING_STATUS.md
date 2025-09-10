# Status de Refactorización: Eliminación de TenantId y Flujo de Invitaciones

## ✅ COMPLETADO

### 1. Nuevos Componentes de Invitaciones
- ✅ **Errores personalizados**: `InvitationErrors.ts` con errores específicos para invitaciones
- ✅ **Enums**: Estados de invitaciones, roles y consentimiento en `enums.ts`
- ✅ **Entidades**: `Invitation.ts` y `InvitationConsent.ts`
- ✅ **Schemas**: Schemas de validación para invitaciones y consentimiento
- ✅ **Repositorios**: Interfaces para `InvitationsRepository` y `InvitationConsentRepository`
- ✅ **Eventos**: Tipos de eventos para `InvitationCreatedEvent` y `InvitationUsedEvent`
- ✅ **Servicios**: `InvitationsEventService` para publicar eventos a EventBridge
- ✅ **Comandos**: `InvitationsCommandService` con lógica de negocio completa
- ✅ **Controladores**: Controladores para crear invitaciones, registrar consentimiento y completar firma
- ✅ **Tests básicos**: Tests que verifican que los componentes existen

### 2. Modificaciones a Entidades Existentes
- ✅ **Envelope**: Cambiado `ownerId` → `ownerEmail`, eliminado `tenantId`
- ✅ **Party**: Eliminado `tenantId`

## ⚠️ PENDIENTE (Errores de Build)

### 1. Adapters y Servicios
- ❌ **makeEnvelopesCommandsPort.ts**: Requiere `tenantId` en varios lugares
- ❌ **MakeEnvelopesQueriesPort.ts**: Validaciones de tenant boundary
- ❌ **MakePartiesCommandsPort.ts**: Contextos de auditoría requieren `tenantId`
- ❌ **makeSigningCommandsPort.ts**: `buildEvidencePath` requiere `tenantId`

### 2. Tipos de DynamoDB
- ❌ **DdbEnvelopeItem**: Falta `ownerEmail`, tiene `ownerId`
- ❌ **DdbPartyItem**: Requiere `tenantId` pero Party ya no lo tiene
- ❌ **Mappers**: `toPartyItem` y `fromPartyItem` necesitan ajustes

### 3. Servicios de Auditoría y Eventos
- ❌ **EnvelopesAuditService**: Requiere `tenantId` en contextos
- ❌ **EnvelopesEventService**: Requiere `tenantId` en contextos
- ❌ **AuditContext**: Requiere `tenantId` en shared-ts

## 🔧 ESTRATEGIA DE ARREGLADO

### Opción 1: Refactorización Completa (Recomendada)
1. Actualizar todos los tipos de DynamoDB para usar `ownerEmail` en lugar de `ownerId`
2. Hacer `tenantId` opcional en todos los contextos de auditoría
3. Actualizar todos los adapters para usar `ownerEmail`
4. Crear migración de datos para convertir `ownerId` → `ownerEmail`

### Opción 2: Enfoque Híbrido (Más Rápido)
1. Mantener `tenantId` como 'default-tenant' temporalmente
2. Agregar `ownerEmail` junto a `ownerId` en DynamoDB
3. Actualizar gradualmente los controladores para usar `ownerEmail`
4. Mantener compatibilidad hacia atrás

### Opción 3: Revertir y Enfoque Incremental
1. Revertir cambios a entidades existentes
2. Crear flujo de invitaciones como sistema separado
3. Integrar gradualmente con el sistema existente

## 📋 PRÓXIMOS PASOS RECOMENDADOS

1. **Decidir estrategia**: ¿Refactorización completa o híbrida?
2. **Arreglar tipos de DynamoDB**: Actualizar `DdbEnvelopeItem` y `DdbPartyItem`
3. **Actualizar contextos de auditoría**: Hacer `tenantId` opcional
4. **Crear tests de integración**: Para el flujo completo de invitaciones
5. **Documentar migración**: Plan para convertir datos existentes

## 🧪 TESTS FUNCIONANDO

- ✅ `BasicInvitationTest.test.ts`: Tests básicos que verifican componentes
- ❌ `InvitationFlow.test.ts`: Test completo (requiere build funcionando)
- ❌ `SimpleInvitationTest.test.ts`: Test simple (requiere build funcionando)

## 📝 NOTAS TÉCNICAS

- El flujo de invitaciones está diseñado como Rocket Lawyer (sin tenants)
- Usa tokens JWT para autenticación de invitados
- Publica eventos a EventBridge para notificaciones
- Requiere consentimiento con IP y User-Agent para auditoría
- Soporta roles de 'signer' y 'viewer'

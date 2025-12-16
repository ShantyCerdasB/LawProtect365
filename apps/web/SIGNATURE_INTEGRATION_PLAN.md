# Plan de Integración de Signature Service - Frontend

## Análisis de Estado Actual

### ✅ Lo que ya existe:

1. **Frontend-Core (packages/frontend-core)**:
   - ✅ API functions en `signature/api/signatureApi.ts`
   - ✅ React Query hooks en `signature/query/`
   - ✅ Interfaces y tipos en `signature/interfaces/`

2. **Web App (apps/web)**:
   - ✅ Página básica de firma: `SignDocumentPage.tsx`
   - ✅ Componentes de UI: Modal, TextField, Select, Button
   - ✅ Componentes de PDF: PDFViewer, SignatureCanvas

### ❌ Lo que falta:

#### 1. Módulo Signature en Web
- ❌ Módulo `signature` en `apps/web/src/modules/signature/`
- ❌ Páginas:
  - ❌ `EnvelopesListPage.tsx` - Listar envelopes con filtros
  - ❌ `CreateEnvelopePage.tsx` - Crear nuevo envelope
  - ❌ `EnvelopeDetailsPage.tsx` - Ver detalles y gestionar envelope
- ❌ Componentes:
  - ❌ `InviteSignerModal.tsx` - Modal para invitar signers
  - ❌ `SendEnvelopeModal.tsx` - Modal para enviar envelope
  - ❌ `CancelEnvelopeModal.tsx` - Modal para cancelar envelope
  - ❌ `SignersList.tsx` - Componente para mostrar lista de signers
  - ❌ `AuditTrailView.tsx` - Componente para ver audit trail
- ❌ Rutas en `signature/routes.tsx`

#### 2. Mejoras en SignDocumentPage
- ❌ Integrar con endpoint real de signing
- ❌ Agregar consentimiento ESIGN/UETA
- ❌ Manejar invitation tokens
- ❌ Mostrar estado del envelope
- ❌ Integrar con `useSignDocument` hook

#### 3. Configuración de HttpClient
- ❌ Verificar cómo se crea/proporciona httpClient en web
- ❌ Crear contexto o provider para httpClient si no existe
- ❌ Integrar con hooks de signature

#### 4. Componentes Reutilizables
- ❌ Mover tipos/interfaces comunes a frontend-core si aplica
- ❌ Crear componentes de UI reutilizables para signature

## Plan de Implementación

### Fase 1: Configuración Base
1. Verificar/crear configuración de httpClient en web
2. Crear módulo signature en web con estructura básica
3. Configurar rutas básicas

### Fase 2: Páginas Principales
1. **EnvelopesListPage**: Listar envelopes con filtros y paginación
2. **CreateEnvelopePage**: Formulario para crear envelope
3. **EnvelopeDetailsPage**: Vista detallada con acciones

### Fase 3: Modales y Componentes
1. **InviteSignerModal**: Invitar signers a envelope
2. **SendEnvelopeModal**: Enviar envelope con mensajes
3. **CancelEnvelopeModal**: Confirmar cancelación
4. **SignersList**: Mostrar lista de signers con estados
5. **AuditTrailView**: Ver historial de eventos

### Fase 4: Integración y Mejoras
1. Mejorar SignDocumentPage con endpoints reales
2. Agregar manejo de errores y loading states
3. Mejorar UX con feedback visual
4. Agregar validaciones de formularios

### Fase 5: Optimización
1. Mover código reutilizable a frontend-core
2. Optimizar rendimiento
3. Agregar tests

## Estructura de Archivos Propuesta

```
apps/web/src/modules/signature/
├── components/
│   ├── InviteSignerModal.tsx
│   ├── SendEnvelopeModal.tsx
│   ├── CancelEnvelopeModal.tsx
│   ├── SignersList.tsx
│   ├── AuditTrailView.tsx
│   ├── EnvelopeStatusBadge.tsx
│   └── index.ts
├── pages/
│   ├── EnvelopesListPage.tsx
│   ├── CreateEnvelopePage.tsx
│   ├── EnvelopeDetailsPage.tsx
│   └── index.ts
├── hooks/
│   ├── useSignatureHttpClient.ts
│   └── index.ts
├── types/
│   └── index.ts
├── routes.tsx
└── index.ts
```

## Endpoints a Integrar

### Ya implementados en hooks:
- ✅ `useEnvelopes` - Listar envelopes
- ✅ `useEnvelope` - Obtener envelope
- ✅ `useCreateEnvelope` - Crear envelope
- ✅ `useUpdateEnvelope` - Actualizar envelope
- ✅ `useSendEnvelope` - Enviar envelope
- ✅ `useCancelEnvelope` - Cancelar envelope
- ✅ `useSignDocument` - Firmar documento
- ✅ `useDeclineSigner` - Rechazar firma
- ✅ `useDownloadDocument` - Descargar documento
- ✅ `useShareDocumentView` - Compartir vista
- ✅ `useAuditTrail` - Obtener audit trail

## Próximos Pasos

1. Verificar configuración de httpClient
2. Crear estructura de módulo signature
3. Implementar páginas principales
4. Crear modales y componentes
5. Integrar con SignDocumentPage
6. Testing y refinamiento


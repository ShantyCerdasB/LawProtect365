# TODO: DocumentService Architecture Analysis & Implementation Plan

## 📋 **ANÁLISIS ACTUAL DE DOCUMENTS-SERVICE**

### **✅ LO QUE YA ESTÁ IMPLEMENTADO:**

#### **1. Arquitectura Hexagonal Completa:**
- **Domain Layer**: Entities, Value Objects, Rules
- **Application Layer**: Services, Ports, Adapters
- **Infrastructure Layer**: Repositories, S3, DynamoDB
- **Presentation Layer**: Controllers, Schemas

#### **2. Operaciones CRUD Completas:**
- ✅ **Create**: `CreateDocumentCommand` - Crear documentos
- ✅ **Read**: `GetDocument`, `ListDocuments` - Leer documentos
- ✅ **Update**: `UpdateDocumentCommand`, `UpdateDocumentBinaryCommand` - Actualizar documentos
- ✅ **Delete**: `DeleteDocumentCommand` - Eliminar documentos
- ✅ **Upload**: `UploadDocumentCommand` - Subir documentos con presigned URLs

#### **3. Funcionalidades Avanzadas:**
- ✅ **Document Locking**: Sistema de locks para prevenir modificaciones concurrentes
- ✅ **S3 Integration**: Almacenamiento en S3 con presigned URLs
- ✅ **Audit Trail**: Servicio de auditoría para todas las operaciones
- ✅ **Event Publishing**: Sistema de eventos para notificaciones
- ✅ **Validation**: Reglas de negocio para tipos de contenido y tamaños

#### **4. Infraestructura Sólida:**
- ✅ **S3SignedPdfIngestor**: Para manejar PDFs firmados
- ✅ **DocumentRepository**: Persistencia en DynamoDB
- ✅ **S3EvidenceStorage**: Almacenamiento de evidencias
- ✅ **EventBridge Integration**: Publicación de eventos

---

## 🔴 **PROBLEMAS IDENTIFICADOS CON SIGNATURE-SERVICE**

### **1. Duplicación de Responsabilidades:**
- **SignatureService.S3Service** maneja almacenamiento de documentos
- **DocumentService** también maneja almacenamiento de documentos
- **Conflicto**: Ambos servicios intentan manejar el mismo dominio

### **2. Tabla Compartida Problemática:**
- **SignatureService** y **DocumentService** comparten la misma tabla DynamoDB
- **Riesgo**: Operaciones concurrentes pueden causar conflictos
- **Problema**: SignatureService no debería manejar documentos directamente

### **3. Operaciones de Delete Inapropiadas:**
- **SignatureService** tenía `deleteDocument` (ya eliminado)
- **DocumentService** tiene `deleteDocument` (correcto)
- **Conflicto**: SignatureService no debería eliminar documentos

---

## 🎯 **PLAN DE IMPLEMENTACIÓN Y CORRECCIÓN**

### **FASE 1: Separación de Responsabilidades**

#### **1.1 DocumentService - Responsabilidades Correctas:**
```
✅ MANTENER:
- Document lifecycle management (create, read, update, delete)
- Document storage in S3
- Document metadata management
- Document locking system
- Document validation rules
- Document audit trail
- Document event publishing

❌ NO DEBERÍA HACER:
- Signature creation/validation (eso es SignatureService)
- Cryptographic operations (eso es SignatureService)
- Envelope management (eso es SignatureService)
```

#### **1.2 SignatureService - Responsabilidades Correctas:**
```
✅ MANTENER:
- Digital signature creation/validation
- KMS operations
- Signature metadata management
- Signature audit trail
- Signature event publishing

❌ NO DEBERÍA HACER:
- Document storage/retrieval (eso es DocumentService)
- Document deletion (eso es DocumentService)
- Document lifecycle management (eso es DocumentService)
```

### **FASE 2: Integración Entre Servicios**

#### **2.1 Flujo de Trabajo Correcto:**
```
1. DocumentService:
   - Crea documento en S3
   - Retorna documentId y S3 key
   - Publica evento 'document.created'

2. SignatureService:
   - Recibe documentId y S3 key
   - Crea firma digital
   - Actualiza documento con firma
   - Publica evento 'signature.created'

3. DocumentService:
   - Recibe evento 'signature.created'
   - Actualiza metadata del documento
   - Publica evento 'document.signed'
```

#### **2.2 Comunicación Entre Servicios:**
```
✅ IMPLEMENTAR:
- EventBridge para comunicación asíncrona
- API calls para operaciones síncronas
- Shared types para contratos
- Idempotency para operaciones críticas

❌ EVITAR:
- Acceso directo a tablas compartidas
- Operaciones de delete desde SignatureService
- Duplicación de lógica de almacenamiento
```

### **FASE 3: Refactoring de SignatureService**

#### **3.1 Eliminar S3Service de SignatureService:**
```typescript
// ❌ ELIMINAR de SignatureService:
- S3Service (mover a DocumentService)
- Operaciones de documento
- Almacenamiento de documentos

// ✅ MANTENER en SignatureService:
- KmsService (firmas digitales)
- SignatureRepository (metadatos de firmas)
- SignatureEventService (eventos de firma)
```

#### **3.2 Crear DocumentClient en SignatureService:**
```typescript
// ✅ CREAR en SignatureService:
interface DocumentClient {
  getDocument(documentId: string): Promise<Document>;
  getDocumentS3Key(documentId: string): Promise<string>;
  updateDocumentMetadata(documentId: string, metadata: any): Promise<void>;
}
```

### **FASE 4: Implementación de DocumentEventService**

#### **4.1 Crear DocumentEventService:**
```typescript
// ✅ CREAR en DocumentService:
class DocumentEventService extends EventService {
  async publishDocumentCreated(document: Document): Promise<void>
  async publishDocumentUpdated(document: Document): Promise<void>
  async publishDocumentDeleted(documentId: string): Promise<void>
  async publishDocumentSigned(document: Document, signature: Signature): Promise<void>
}
```

#### **4.2 Eventos de Documento:**
```typescript
// ✅ IMPLEMENTAR eventos:
- 'document.created'
- 'document.updated'
- 'document.deleted'
- 'document.signed'
- 'document.locked'
- 'document.unlocked'
```

---

## 🚀 **IMPLEMENTACIÓN PASO A PASO**

### **PASO 1: Análisis de Dependencias**
- [ ] Mapear todas las dependencias entre SignatureService y DocumentService
- [ ] Identificar operaciones que requieren comunicación entre servicios
- [ ] Documentar flujos de trabajo actuales

### **PASO 2: Refactoring de SignatureService**
- [ ] Eliminar S3Service de SignatureService
- [ ] Crear DocumentClient para comunicación con DocumentService
- [ ] Actualizar KmsService para usar DocumentClient
- [ ] Migrar operaciones de documento a DocumentService

### **PASO 3: Mejoras en DocumentService**
- [ ] Implementar DocumentEventService
- [ ] Agregar eventos de documento
- [ ] Mejorar validaciones de negocio
- [ ] Optimizar operaciones de S3

### **PASO 4: Integración y Testing**
- [ ] Implementar comunicación entre servicios
- [ ] Crear tests de integración
- [ ] Validar flujos de trabajo end-to-end
- [ ] Optimizar rendimiento

### **PASO 5: Documentación y Deployment**
- [ ] Documentar nueva arquitectura
- [ ] Crear guías de migración
- [ ] Implementar monitoreo
- [ ] Deploy a producción

---

## 📊 **MÉTRICAS DE ÉXITO**

### **Arquitectura:**
- ✅ Separación clara de responsabilidades
- ✅ Comunicación asíncrona entre servicios
- ✅ Eliminación de duplicación de código
- ✅ Mejora en mantenibilidad

### **Funcionalidad:**
- ✅ Documentos se crean/actualizan correctamente
- ✅ Firmas se crean/validan correctamente
- ✅ Eventos se publican correctamente
- ✅ Audit trail funciona correctamente

### **Rendimiento:**
- ✅ Operaciones de documento < 500ms
- ✅ Operaciones de firma < 1s
- ✅ Eventos se publican < 100ms
- ✅ Sin errores de concurrencia

---

## 🔧 **HERRAMIENTAS Y TECNOLOGÍAS**

### **Comunicación:**
- **EventBridge**: Para eventos asíncronos
- **API Gateway**: Para llamadas síncronas
- **Lambda**: Para procesamiento de eventos

### **Almacenamiento:**
- **S3**: Para documentos
- **DynamoDB**: Para metadatos
- **KMS**: Para firmas digitales

### **Monitoreo:**
- **CloudWatch**: Para logs y métricas
- **X-Ray**: Para tracing distribuido
- **EventBridge**: Para eventos de sistema

---

## 📝 **NOTAS IMPORTANTES**

### **Consideraciones Legales:**
- Las firmas digitales son inmutables por ley
- Los documentos firmados no se pueden eliminar
- Se requiere audit trail completo
- Cumplimiento con ESIGN Act

### **Consideraciones Técnicas:**
- Idempotencia en operaciones críticas
- Manejo de errores y retry logic
- Versionado de documentos
- Backup y recuperación

### **Consideraciones de Seguridad:**
- Encriptación en tránsito y reposo
- Control de acceso basado en roles
- Validación de integridad
- Logging de seguridad

---

## 🎯 **PRÓXIMOS PASOS INMEDIATOS**

1. **Revisar y aprobar este plan**
2. **Crear DocumentClient en SignatureService**
3. **Implementar DocumentEventService en DocumentService**
4. **Refactorizar KmsService para usar DocumentClient**
5. **Eliminar S3Service de SignatureService**
6. **Crear tests de integración**
7. **Implementar monitoreo y alertas**

---

*Este TODO será actualizado conforme se implementen las mejoras.*

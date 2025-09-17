# TODO: Implementación Inmediata - DocumentService Integration

## 🚨 **PRIORIDAD ALTA - IMPLEMENTAR INMEDIATAMENTE**

### **1. CREAR DocumentEventService**

#### **Archivo: `src/app/services/Documents/DocumentEventService.ts`**
```typescript
/**
 * @fileoverview DocumentEventService - Event service for document operations
 * @summary Publishes document-related events using the outbox pattern
 * @description This service handles all document event publishing including
 * creation, updates, deletion, and signing events.
 */

import { EventService } from '@lawprotect/shared-ts';
import type { Document } from '../../domain/entities/Document';
import type { DocumentId } from '../../domain/value-objects/ids';

export class DocumentEventService extends EventService {
  /**
   * Publishes document created event
   */
  async publishDocumentCreated(document: Document): Promise<void> {
    await this.publishStandardizedEvent('document.created', {
      documentId: document.documentId,
      envelopeId: document.envelopeId,
      name: document.name,
      contentType: document.contentType,
      size: document.size,
      s3Ref: document.s3Ref,
      createdAt: document.createdAt
    }, this.createActorFromDocument(document));
  }

  /**
   * Publishes document updated event
   */
  async publishDocumentUpdated(document: Document): Promise<void> {
    await this.publishStandardizedEvent('document.updated', {
      documentId: document.documentId,
      envelopeId: document.envelopeId,
      name: document.name,
      status: document.status,
      updatedAt: document.updatedAt
    }, this.createActorFromDocument(document));
  }

  /**
   * Publishes document deleted event
   */
  async publishDocumentDeleted(documentId: DocumentId, envelopeId: string): Promise<void> {
    await this.publishStandardizedEvent('document.deleted', {
      documentId: documentId,
      envelopeId: envelopeId,
      deletedAt: new Date().toISOString()
    }, this.createSystemActor());
  }

  /**
   * Publishes document signed event
   */
  async publishDocumentSigned(document: Document, signatureId: string, signerId: string): Promise<void> {
    await this.publishStandardizedEvent('document.signed', {
      documentId: document.documentId,
      envelopeId: document.envelopeId,
      signatureId: signatureId,
      signerId: signerId,
      signedAt: new Date().toISOString()
    }, this.createActorFromDocument(document));
  }

  private createActorFromDocument(document: Document) {
    return {
      userId: 'system', // TODO: Get from context
      userType: 'system',
      permissions: ['document:manage']
    };
  }

  private createSystemActor() {
    return {
      userId: 'system',
      userType: 'system',
      permissions: ['document:manage']
    };
  }
}
```

### **2. CREAR DocumentClient para SignatureService**

#### **Archivo: `services/signature-service/src/clients/DocumentClient.ts`**
```typescript
/**
 * @fileoverview DocumentClient - Client for DocumentService communication
 * @summary Provides interface for SignatureService to communicate with DocumentService
 * @description This client handles all communication between SignatureService and DocumentService
 * for document operations, including retrieval, updates, and event handling.
 */

import { DocumentId } from '../domain/value-objects/DocumentId';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';

export interface DocumentInfo {
  documentId: string;
  envelopeId: string;
  name: string;
  contentType: string;
  size: number;
  s3Key: string;
  s3Bucket: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentClient {
  /**
   * Gets document information by ID
   */
  getDocument(documentId: DocumentId): Promise<DocumentInfo>;

  /**
   * Gets document S3 information for signing
   */
  getDocumentS3Info(documentId: DocumentId): Promise<{
    s3Key: string;
    s3Bucket: string;
    contentType: string;
  }>;

  /**
   * Updates document metadata after signing
   */
  updateDocumentAfterSigning(
    documentId: DocumentId,
    signatureId: string,
    signerId: string,
    signedS3Key: string
  ): Promise<void>;

  /**
   * Validates document exists and is ready for signing
   */
  validateDocumentForSigning(documentId: DocumentId): Promise<boolean>;
}

export class HttpDocumentClient implements DocumentClient {
  constructor(
    private readonly documentServiceUrl: string,
    private readonly apiKey: string
  ) {}

  async getDocument(documentId: DocumentId): Promise<DocumentInfo> {
    // TODO: Implement HTTP call to DocumentService
    throw new Error('Not implemented');
  }

  async getDocumentS3Info(documentId: DocumentId): Promise<{
    s3Key: string;
    s3Bucket: string;
    contentType: string;
  }> {
    // TODO: Implement HTTP call to DocumentService
    throw new Error('Not implemented');
  }

  async updateDocumentAfterSigning(
    documentId: DocumentId,
    signatureId: string,
    signerId: string,
    signedS3Key: string
  ): Promise<void> {
    // TODO: Implement HTTP call to DocumentService
    throw new Error('Not implemented');
  }

  async validateDocumentForSigning(documentId: DocumentId): Promise<boolean> {
    // TODO: Implement HTTP call to DocumentService
    throw new Error('Not implemented');
  }
}
```

### **3. REFACTORIZAR KmsService para usar DocumentClient**

#### **Archivo: `services/signature-service/src/services/KmsService.ts`**
```typescript
// Agregar al constructor:
constructor(
  private readonly kmsSigner: KmsSigner,
  private readonly signatureRepository: SignatureRepository,
  private readonly auditService: AuditService,
  private readonly eventService: SignatureEventService,
  private readonly documentClient: DocumentClient, // ← NUEVO
  private readonly kmsKeyId: string
) {}

// Modificar createSignature para usar DocumentClient:
async createSignature(request: KmsCreateSignatureRequest): Promise<Signature> {
  try {
    // Validate input
    this.validateCreateSignatureRequest(request);

    // Get document info from DocumentService
    const documentInfo = await this.documentClient.getDocumentS3Info(request.documentId);
    
    // Validate document exists and is ready for signing
    const isValidForSigning = await this.documentClient.validateDocumentForSigning(request.documentId);
    if (!isValidForSigning) {
      throw new BadRequestError(
        'Document is not ready for signing',
        ErrorCodes.COMMON_BAD_REQUEST
      );
    }

    // Create signature using KMS
    const signatureResult = await this.kmsSigner.sign({
      keyId: request.kmsKeyId,
      message: new TextEncoder().encode(request.documentHash)
    });

    // Create signature request for repository
    const createRequest: DomainCreateSignatureRequest = {
      id: request.signatureId,
      envelopeId: request.envelopeId,
      signerId: request.signerId,
      documentHash: request.documentHash,
      signatureHash: new TextDecoder().decode(signatureResult.signature),
      s3Key: documentInfo.s3Key, // Use S3 key from DocumentService
      kmsKeyId: request.kmsKeyId,
      algorithm: request.algorithm,
      timestamp: new Date(),
      status: SignatureStatus.SIGNED,
      ipAddress: request.metadata?.ipAddress,
      userAgent: request.metadata?.userAgent,
      reason: request.metadata?.reason,
      location: request.metadata?.location
    };

    // Store signature in repository
    const createdSignature = await this.signatureRepository.create(createRequest);

    // Update document in DocumentService
    await this.documentClient.updateDocumentAfterSigning(
      request.documentId,
      request.signatureId.getValue(),
      request.signerId.getValue(),
      documentInfo.s3Key
    );

    // Log audit event
    await this.auditService.createEvent({
      envelopeId: request.envelopeId.getValue(),
      description: `Digital signature created for signer ${request.signerId.getValue()}`,
      type: AuditEventType.SIGNATURE_CREATED,
      userId: request.signerId.getValue(),
      metadata: {
        signatureId: request.signatureId.getValue(),
        algorithm: request.algorithm,
        kmsKeyId: request.kmsKeyId
      }
    });

    // Publish signature created event
    await this.eventService.publishEvent('signature.created', {
      signatureId: request.signatureId.getValue(),
      signerId: request.signerId.getValue(),
      envelopeId: request.envelopeId.getValue(),
      algorithm: request.algorithm,
      status: SignatureStatus.SIGNED
    });

    return createdSignature;
  } catch (error) {
    throw mapAwsError(error, 'KmsService.createSignature');
  }
}
```

### **4. ELIMINAR S3Service de SignatureService**

#### **Archivo: `services/signature-service/src/services/S3Service.ts`**
```typescript
// ❌ ELIMINAR COMPLETAMENTE este archivo
// Las operaciones de S3 ahora las maneja DocumentService
```

#### **Archivo: `services/signature-service/src/infrastructure/Container.ts`**
```typescript
// ❌ ELIMINAR:
- S3Service registration
- S3Service dependencies
- S3Service configuration

// ✅ AGREGAR:
- DocumentClient registration
- DocumentClient configuration
- DocumentClient dependencies
```

### **5. CREAR API Endpoints en DocumentService**

#### **Archivo: `services/documents-service/src/presentation/controllers/documents/GetDocumentS3Info.Controller.ts`**
```typescript
/**
 * @file GetDocumentS3Info.Controller.ts
 * @summary Get Document S3 Info controller
 * @description Returns S3 information for a document (used by SignatureService)
 */

import { createQueryController } from "../../../shared/controllers/controllerFactory";
import { makeDocumentsQueriesPort } from "../../../app/adapters/documents/makeDocumentsQueriesPort";
import { DefaultDocumentsQueryService } from "../../../app/services/Documents";
import { DocumentIdPath } from "../../../presentation/schemas/common/path";

export const GetDocumentS3InfoController = createQueryController<{ documentId: string }, {
  s3Key: string;
  s3Bucket: string;
  contentType: string;
}>({
  pathSchema: DocumentIdPath,
  appServiceClass: DefaultDocumentsQueryService,
  createDependencies: (c: any) => makeDocumentsQueriesPort({
    documentsRepo: c.repos.documents,
    s3Service: c.documents.s3Service
  }),
  extractParams: (path: any) => ({ documentId: path.id }),
  responseType: "json",
  includeActor: true
});

export const handler = GetDocumentS3InfoController;
```

#### **Archivo: `services/documents-service/src/presentation/controllers/documents/UpdateDocumentAfterSigning.Controller.ts`**
```typescript
/**
 * @file UpdateDocumentAfterSigning.Controller.ts
 * @summary Update Document After Signing controller
 * @description Updates document metadata after signing (used by SignatureService)
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { makeDocumentsCommandsPort } from "../../../app/adapters/documents/makeDocumentsCommandsPort";
import { DefaultDocumentsCommandService } from "../../../app/services/Documents";
import { DocumentIdPath } from "../../../presentation/schemas/common/path";

export const UpdateDocumentAfterSigningController = createCommandController<{
  documentId: string;
  signatureId: string;
  signerId: string;
  signedS3Key: string;
}, void>({
  pathSchema: DocumentIdPath,
  appServiceClass: DefaultDocumentsCommandService,
  createDependencies: (c: any) => makeDocumentsCommandsPort({
    documentsRepo: c.repos.documents,
    envelopesRepo: c.repos.envelopes,
    ids: c.ids,
    s3Service: c.documents.s3Service,
    s3Config: {
      evidenceBucket: c.config.s3.evidenceBucket,
      signedBucket: c.config.s3.signedBucket
    }
  }),
  extractParams: (path: any, body: any) => ({
    documentId: path.id,
    signatureId: body.signatureId,
    signerId: body.signerId,
    signedS3Key: body.signedS3Key
  }),
  responseType: "noContent",
  includeActor: true
});

export const handler = UpdateDocumentAfterSigningController;
```

---

## 📋 **CHECKLIST DE IMPLEMENTACIÓN**

### **FASE 1: DocumentService (Prioridad Alta)**
- [ ] Crear `DocumentEventService.ts`
- [ ] Implementar eventos de documento
- [ ] Crear `GetDocumentS3Info.Controller.ts`
- [ ] Crear `UpdateDocumentAfterSigning.Controller.ts`
- [ ] Agregar endpoints a API Gateway
- [ ] Crear tests unitarios

### **FASE 2: SignatureService (Prioridad Alta)**
- [ ] Crear `DocumentClient.ts`
- [ ] Implementar `HttpDocumentClient`
- [ ] Refactorizar `KmsService` para usar `DocumentClient`
- [ ] Eliminar `S3Service` de SignatureService
- [ ] Actualizar `Container.ts` con nuevas dependencias
- [ ] Crear tests de integración

### **FASE 3: Testing y Validación (Prioridad Media)**
- [ ] Crear tests end-to-end
- [ ] Validar flujos de trabajo
- [ ] Probar comunicación entre servicios
- [ ] Validar manejo de errores
- [ ] Optimizar rendimiento

### **FASE 4: Deployment (Prioridad Media)**
- [ ] Actualizar infraestructura
- [ ] Deploy a staging
- [ ] Validar en staging
- [ ] Deploy a producción
- [ ] Monitorear en producción

---

## 🚨 **RIESGOS Y MITIGACIONES**

### **Riesgo 1: Breaking Changes**
- **Mitigación**: Implementar versionado de API
- **Mitigación**: Mantener compatibilidad hacia atrás
- **Mitigación**: Deploy gradual con feature flags

### **Riesgo 2: Comunicación Entre Servicios**
- **Mitigación**: Implementar retry logic
- **Mitigación**: Circuit breaker pattern
- **Mitigación**: Timeout y fallback strategies

### **Riesgo 3: Performance**
- **Mitigación**: Caching en DocumentClient
- **Mitigación**: Optimizar queries
- **Mitigación**: Monitoreo de latencia

---

## 📊 **MÉTRICAS DE ÉXITO**

### **Funcionalidad:**
- ✅ Documentos se crean correctamente
- ✅ Firmas se crean correctamente
- ✅ Eventos se publican correctamente
- ✅ Comunicación entre servicios funciona

### **Rendimiento:**
- ✅ Operaciones de documento < 500ms
- ✅ Operaciones de firma < 1s
- ✅ Comunicación entre servicios < 200ms
- ✅ Sin errores de timeout

### **Calidad:**
- ✅ Tests unitarios > 90% coverage
- ✅ Tests de integración pasan
- ✅ Sin errores de compilación
- ✅ Código limpio y documentado

---

*Este TODO será actualizado conforme se implementen las mejoras.*


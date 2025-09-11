/**
 * @file CreateDocument.Controller.ts
 * @summary Create Document controller
 * @description Handles document creation within envelopes
 */

import { createCommandController } from "../../../shared/controllers/controllerFactory";
import { DefaultDocumentsCommandService } from "../../../app/services/Documents";
import { CreateDocumentBody } from "../../../presentation/schemas/documents/CreateDocument.schema";
import { EnvelopeIdPath } from "../../../presentation/schemas/common/path";
import type { CreateDocumentCommand, CreateDocumentResult } from "../../../app/ports/documents/DocumentsCommandsPort";
import { extractDocumentCreateParams } from "../../../shared/controllers/helpers";

/**
 * @description Create Document controller
 */
export const CreateDocumentController = createCommandController<CreateDocumentCommand, CreateDocumentResult>({
  bodySchema: CreateDocumentBody,
  pathSchema: EnvelopeIdPath,
  appServiceClass: DefaultDocumentsCommandService,
  createDependencies: (c: any) => c.documents.command, // Use the service from container
  extractParams: (path: any, body: any, context: any) => {
    const params = extractDocumentCreateParams(path, body);
    
    // Add authorization validation
    if (context?.actor?.email) {
      (params as any).actorEmail = context.actor.email;
    }
    
    return params;
  },
  responseType: "created",
  includeActor: true,
  methodName: "create"});

// Export handler for backward compatibility
export const handler = CreateDocumentController;


/**
 * @file documentItemMapper.ts
 * @summary Document ↔ DynamoDB item mapper
 * @description Re-exports Document DynamoDB types and utilities from shared location
 */

// Re-export all Document DynamoDB types and utilities from shared location
export {
  DOCUMENT_ENTITY,
  documentPk,
  documentSk,
  type DdbDocumentItem,
  isDdbDocumentItem,
  toDocumentItem,
  fromDocumentItem,
  documentItemMapper} from "../../../domain/types/infrastructure/DocumentDdbTypes";


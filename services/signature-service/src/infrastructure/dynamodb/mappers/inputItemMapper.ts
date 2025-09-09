/**
 * @file inputItemMapper.ts
 * @summary Input ↔ DynamoDB item mapper
 * @description Re-exports Input DynamoDB types and utilities from shared location
 */

// Re-export all Input DynamoDB types and utilities from shared location
export {
  INPUT_ENTITY,
  inputPk,
  inputSk,
  type DdbInputItem,
  isDdbInputItem,
  toInputItem,
  fromInputItem,
  inputItemMapper,
} from "../../../domain/types/infrastructure/InputDdbTypes";







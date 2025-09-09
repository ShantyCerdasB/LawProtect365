/**
 * @file index.ts
 * @description Barrel export for all Inputs app services
 */

// ✅ SERVICIOS CONSOLIDADOS - PATRÓN REUTILIZABLE
export * from "./InputsCommandService";
export * from "./InputsQueryService";

// ✅ SERVICIOS OPCIONALES - PATRÓN REUTILIZABLE
export * from "./InputsValidationService";
export * from "./InputsAuditService";
export * from "./InputsEventService";







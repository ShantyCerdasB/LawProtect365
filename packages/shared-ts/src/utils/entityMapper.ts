/**
 * @fileoverview EntityMapper - Utility for mapping domain entities to persistence models
 * @summary Centralized entity mapping utility to reduce code duplication
 * @description Provides a declarative approach to map domain entities to Prisma update inputs,
 * reducing cognitive complexity and eliminating code duplication across repositories.
 */

/**
 * Configuration for mapping a single field from entity to persistence model
 */
export interface FieldMapping {
  /** The target field name in the persistence model */
  field: string;
  /** The getter method name on the entity (optional) */
  getter?: string;
  /** Custom value extractor function (optional) */
  valueExtractor?: (value: unknown) => unknown;
}

/**
 * Utility class for mapping domain entities to persistence models
 * Reduces cognitive complexity by providing a declarative mapping approach
 */
export class EntityMapper {
  /**
   * Maps entity fields to Prisma update input using a declarative approach
   * @param patch - Entity or DTO to map
   * @param mappings - Array of field mappings
   * @returns Prisma update input
   * @example
   * const updateInput = EntityMapper.toUpdateModel(entity, [
   *   { field: 'name', getter: 'getName' },
   *   { field: 'email', getter: 'getEmail', valueExtractor: (v) => v?.getValue?.() }
   * ]);
   */
  static toUpdateModel<T extends Record<string, unknown>>(
    patch: unknown,
    mappings: FieldMapping[]
  ): T {
    const p = patch as any;
    const out = {} as T;
    const has = (k: string) => Object.hasOwn(p, k);
    const set = (k: string, v: unknown) => { if (v !== undefined) (out as any)[k] = v; };
  
    for (const mapping of mappings) {
      const getterValue = mapping.getter ? p[mapping.getter]?.() : undefined;
      const directValue = has(mapping.field) ? p[mapping.field] : undefined;
  
      // Prefer getter; si viene undefined, usa DTO
      const raw = getterValue === undefined ? directValue : getterValue;
  
      if (raw !== undefined) {
        // valueExtractor con Fallback: si no aplica, devuelve el mismo valor
        const extracted = mapping.valueExtractor ? mapping.valueExtractor(raw) : raw;
  
        // Si el extractor devolvió undefined, conserva el valor crudo
        set(mapping.field, extracted === undefined ? raw : extracted);
      }
    }
  
    return out;
  }
  
}

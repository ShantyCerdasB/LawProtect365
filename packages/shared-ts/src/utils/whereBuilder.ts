/**
 * @fileoverview WhereBuilder - Declarative query builder for Prisma where clauses
 * @summary Provides a fluent API for building complex where conditions
 * @description This utility class allows building Prisma where clauses in a declarative way,
 * reducing cognitive complexity and improving readability of repository whereFromSpec methods.
 */

type AnyWhere = Record<string, unknown>;

/**
 * WhereBuilder - Declarative query builder for Prisma where clauses
 * 
 * Provides a fluent API for building complex where conditions with support for
 * equality, ranges, boolean flags, OR/AND logic, and common patterns like "not expired".
 */
export class WhereBuilder<W extends AnyWhere> {
  private AND: W[] = [];
  private OR: W[] = [];
  
  constructor(private readonly now: () => Date = () => new Date()) {}

  /**
   * Adds equality condition if value is not undefined nor null
   * @param field - Field name to match
   * @param value - Value to match against
   * @returns This builder instance for chaining
   */
  eq<K extends keyof W>(field: K & string, value: unknown): this {
    if (value !== undefined && value !== null) {
      this.AND.push({ [field]: value } as W);
    }
    return this;
  }

  /**
   * Adds range condition with only present limits
   * @param field - Field name for range
   * @param opts - Range options (lt, lte, gt, gte)
   * @returns This builder instance for chaining
   */
  range<K extends keyof W>(
    field: K & string,
    opts: { lt?: Date; lte?: Date; gt?: Date; gte?: Date }
  ): this {
    const clause = Object.fromEntries(
      Object.entries(opts).filter(([, v]) => v !== undefined)
    );
    if (Object.keys(clause).length) {
      this.AND.push({ [field]: clause } as W);
    }
    return this;
  }

  /**
   * Adds OR compound condition
   * @param clauses - Array of where clauses to OR together
   * @returns This builder instance for chaining
   */
  or(...clauses: W[]): this {
    const flat = clauses.filter(Boolean) as W[];
    if (flat.length) {
      this.OR.push(...flat);
    }
    return this;
  }

  /**
   * Adds AND compound condition (semantic helper)
   * @param clause - Where clause to add
   * @returns This builder instance for chaining
   */
  and(clause: W | undefined): this {
    if (clause && Object.keys(clause).length) {
      this.AND.push(clause);
    }
    return this;
  }

  /**
   * Adds boolean flag condition (trueClause/falseClause)
   * @param flag - Boolean flag value
   * @param trueClause - Clause to add when flag is true
   * @param falseClause - Optional clause to add when flag is false
   * @returns This builder instance for chaining
   */
  flag(flag: boolean | undefined, trueClause: W, falseClause?: W): this {
    if (flag === true) {
      this.AND.push(trueClause);
    } else if (flag === false && falseClause) {
      this.AND.push(falseClause);
    }
    return this;
  }

  /**
   * Adds "not expired" condition: status != EXPIRED and (expiresAt null or >= now)
   * @param statusField - Field name for status (default: 'status')
   * @param expiresField - Field name for expiration (default: 'expiresAt')
   * @param expiredValue - Value that represents expired status (default: 'EXPIRED')
   * @returns This builder instance for chaining
   */
  notExpired(
    statusField = 'status', 
    expiresField = 'expiresAt', 
    expiredValue = 'EXPIRED' as any
  ): this {
    this.AND.push({ [statusField]: { not: expiredValue } } as W);
    this.AND.push({ 
      OR: [
        { [expiresField]: null }, 
        { [expiresField]: { gte: this.now() } }
      ] 
    } as unknown as W);
    return this;
  }

  /**
   * Builds the final where clause
   * @returns Complete where clause with AND/OR conditions
   */
  build(): W {
    const out: AnyWhere = {};
    if (this.AND.length) out.AND = this.AND;
    if (this.OR.length) out.OR = this.OR;
    return out as W;
  }
}

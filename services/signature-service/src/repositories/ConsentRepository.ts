/**
 * @fileoverview ConsentRepository - Repository for Consent entity operations
 * @summary Handles all database operations for consents using Prisma
 * @description This repository provides comprehensive data access methods for consents,
 * including CRUD operations, compliance queries, and consent lifecycle management. It follows
 * the repository pattern and extends RepositoryBase for consistent data access patterns.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { RepositoryBase, Page, textContainsInsensitive, rangeFilter } from '@lawprotect/shared-ts';
import { Consent } from '../domain/entities/Consent';
import { ConsentId } from '../domain/value-objects/ConsentId';
import { EnvelopeId } from '../domain/value-objects/EnvelopeId';
import { SignerId } from '../domain/value-objects/SignerId';
import { ConsentSpec } from '../domain/types/consent';
import { 
  repositoryError
} from '../signature-errors';

/**
 * Repository for managing Consent entities
 * 
 * This repository handles all database operations for consents, including
 * CRUD operations, compliance queries, and consent lifecycle management. It provides
 * methods for finding consents by various criteria, updating consent status, and managing
 * consent compliance tracking.
 */
export class ConsentRepository extends RepositoryBase<Consent, ConsentId, ConsentSpec> {
  
  constructor(protected readonly prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Maps Prisma model to domain entity
   * @param model - Prisma model data
   * @returns Domain entity
   */
  protected toDomain(model: Prisma.ConsentUncheckedCreateInput | Prisma.ConsentGetPayload<any> | unknown): Consent {
    try {
      return Consent.fromPersistence(model as any);
    } catch (error) {
      throw repositoryError({
        operation: 'toDomain',
        consentId: (model as any)?.id,
        cause: error
      });
    }
  }

  /**
   * Maps domain entity to Prisma create input
   * @param entity - Domain entity
   * @returns Prisma create input data
   */
  protected toCreateModel(entity: Consent): Prisma.ConsentUncheckedCreateInput {
    return {
      id: entity.getId().getValue(),
      envelopeId: entity.getEnvelopeId().getValue(),
      signerId: entity.getSignerId().getValue(),
      signatureId: entity.getSignatureId()?.getValue() || null,
      consentGiven: entity.getConsentGiven(),
      consentTimestamp: entity.getConsentTimestamp(),
      consentText: entity.getConsentText(),
      ipAddress: entity.getIpAddress(),
      userAgent: entity.getUserAgent(),
      country: entity.getCountry()
    };
  }


  protected toUpdateModel(patch: Partial<Consent> | Record<string, unknown>): Prisma.ConsentUncheckedUpdateInput {
    const p: any = patch;
    const out: any = {};
    const has = (k: string) => Object.prototype.hasOwnProperty.call(p, k);
    const set = (k: string, v: unknown) => { if (v !== undefined) out[k] = v; };

    set('envelopeId', p.getEnvelopeId?.()?.getValue?.() ?? (has('envelopeId') ? p.envelopeId : undefined));
    set('signerId',   p.getSignerId?.()?.getValue?.()   ?? (has('signerId')   ? p.signerId   : undefined));

    const sigGetterVal = p.getSignatureId?.()?.getValue?.();
    const sigDtoVal    = has('signatureId') ? p.signatureId : undefined; // allow string or null
    if (sigGetterVal !== undefined || sigDtoVal !== undefined) out.signatureId = sigGetterVal ?? sigDtoVal;

    set('consentGiven',     p.getConsentGiven?.()     ?? (has('consentGiven')     ? p.consentGiven     : undefined));
    set('consentTimestamp', p.getConsentTimestamp?.() ?? (has('consentTimestamp') ? p.consentTimestamp : undefined));
    set('consentText',      p.getConsentText?.()      ?? (has('consentText')      ? p.consentText      : undefined));
    set('ipAddress',        p.getIpAddress?.()        ?? (has('ipAddress')        ? p.ipAddress        : undefined));
    set('userAgent',        p.getUserAgent?.()        ?? (has('userAgent')        ? p.userAgent        : undefined));
    set('country',          p.getCountry?.()          ?? (has('country')          ? p.country          : undefined));

    return out;
  }

  /**
   * Creates where clause for ID-based queries
   * @param id - Consent ID
   * @returns Where clause
   */
  protected whereById(id: ConsentId): { id: string } {
    return { id: id.getValue() };
  }

  /**
   * Creates where clause from specification
   * @param spec - Query specification
   * @returns Where clause
   */
  protected whereFromSpec(spec: ConsentSpec): any {
    const where: any = {};
    const unwrap = (v: any) => v?.getValue ? v.getValue() : v;

    if (spec.envelopeId) where.envelopeId = unwrap(spec.envelopeId);
    if (spec.signerId)   where.signerId   = unwrap(spec.signerId);
    if (spec.signatureId)where.signatureId= unwrap(spec.signatureId);
    if (spec.consentGiven !== undefined) where.consentGiven = spec.consentGiven;

    where.consentText = textContainsInsensitive(spec.consentText);
    if (spec.ipAddress) where.ipAddress = spec.ipAddress;
    where.userAgent = textContainsInsensitive(spec.userAgent);

    const tsRange = rangeFilter(spec.consentBefore, spec.consentAfter);
    if (tsRange) where.consentTimestamp = tsRange;

    const createdRange = rangeFilter(spec.createdBefore, spec.createdAfter);
    if (createdRange) where.createdAt = createdRange;

    return where;
  }

  /**
   * Finds a consent by ID
   * @param id - Consent ID
   * @returns Consent entity or null
   */
  async findById(id: ConsentId): Promise<Consent | null> {
    try {
      const consent = await this.prisma.consent.findUnique({
        where: this.whereById(id)
      });
      return consent ? this.toDomain(consent) : null;
    } catch (error) {
      throw repositoryError({
        operation: 'findById',
        consentId: id.getValue(),
        cause: error
      });
    }
  }

  /**
   * Creates a new consent
   * @param entity - Consent entity
   * @returns Created consent entity
   */
  async create(entity: Consent, tx?: Prisma.TransactionClient): Promise<Consent> {
    try {
      const modelData = this.toCreateModel(entity);
      const created = await (tx || this.prisma).consent.create({
        data: modelData
      });
      return this.toDomain(created);
    } catch (error) {
      throw repositoryError({
        operation: 'create',
        consentId: entity.getId().getValue(),
        cause: error
      });
    }
  }

  /**
   * Updates a consent
   * @param id - Consent ID
   * @param entity - Updated consent entity
   * @returns Updated consent entity
   */
  async update(id: ConsentId, entity: Partial<Consent>, tx?: Prisma.TransactionClient): Promise<Consent> {
    try {
      const updated = await (tx || this.prisma).consent.update({
        where: this.whereById(id),
        data: this.toUpdateModel(entity)
      });
      return this.toDomain(updated);
    } catch (error) {
      throw repositoryError({
        operation: 'update',
        consentId: id.getValue(),
        cause: error
      });
    }
  }

  /**
   * Deletes a consent
   * @param id - Consent ID
   * @param tx - Optional transactional context
   */
  async delete(id: ConsentId, tx?: Prisma.TransactionClient): Promise<void> {
    try {
      await (tx || this.prisma).consent.delete({
        where: this.whereById(id)
      });
    } catch (error) {
      throw repositoryError({
        operation: 'delete',
        consentId: id.getValue(),
        cause: error
      });
    }
  }


  /**
   * Lists consents using cursor-based pagination.
   * Results are ordered by createdAt DESC, id DESC.
   * @param {ConsentSpec} spec - Filter specification.
   * @param {number} [limit=20] - Maximum number of results to return.
   * @param {string} [cursor] - Opaque pagination cursor.
   * @returns {Promise<Page<Consent>>} Page with items and nextCursor.
   */
  async list(spec: ConsentSpec, limit: number = 20, cursor?: string): Promise<Page<Consent>> {
    return this.listWithCursorPagination(
      this.prisma.consent,
      spec,
      limit,
      cursor
    );
  }

  /**
   * Finds consents by envelope identifier
   * @param envelopeId - The envelope identifier value object
   * @returns Array of consent entities ordered by creation date
   */
  async findByEnvelopeId(envelopeId: EnvelopeId): Promise<Consent[]> {
    try {
      const consents = await this.prisma.consent.findMany({
        where: { envelopeId: envelopeId.getValue() },
        orderBy: { createdAt: 'desc' }
      });
      return consents.map((consent: any) => this.toDomain(consent));
    } catch (error) {
      throw repositoryError({
        operation: 'findByEnvelopeId',
        envelopeId: envelopeId.getValue(),
        cause: error
      });
    }
  }

  /**
   * Finds consents by signer identifier
   * @param signerId - The signer identifier value object
   * @returns Array of consent entities ordered by creation date
   */
  async findBySignerId(signerId: SignerId): Promise<Consent[]> {
    try {
      const consents = await this.prisma.consent.findMany({
        where: { signerId: signerId.getValue() },
        orderBy: { createdAt: 'desc' }
      });
      return consents.map((consent: any) => this.toDomain(consent));
    } catch (error) {
      throw repositoryError({
        operation: 'findBySignerId',
        signerId: signerId.getValue(),
        cause: error
      });
    }
  }

  /**
   * Finds consent by signer and envelope combination using composite unique key
   * @param signerId - The signer identifier value object
   * @param envelopeId - The envelope identifier value object
   * @returns Consent entity or null when not found
   */
  async findBySignerAndEnvelope(signerId: SignerId, envelopeId: EnvelopeId): Promise<Consent | null> {
    try {
      const consent = await this.prisma.consent.findUnique({
        where: { 
          envelopeId_signerId: { 
            envelopeId: envelopeId.getValue(),
            signerId: signerId.getValue() 
          }
        }
      });
      return consent ? this.toDomain(consent) : null;
    } catch (error) {
      throw repositoryError({
        operation: 'findBySignerAndEnvelope',
        signerId: signerId.getValue(),
        envelopeId: envelopeId.getValue(),
        cause: error
      });
    }
  }

  /**
   * Finds consent by the signer who acted as the actual signer.
   * Note: signatureId is not unique, so this returns the first match found.
   * @param actingSignerId - The ID of the EnvelopeSigner who performed the signing action
   * @returns Consent entity or null when not found
   */
  async findByActingSignerId(actingSignerId: SignerId): Promise<Consent | null> {
    try {
      const consent = await this.prisma.consent.findFirst({
        where: { signatureId: actingSignerId.getValue() }
      });
      return consent ? this.toDomain(consent) : null;
    } catch (error) {
      throw repositoryError({
        operation: 'findByActingSignerId',
        actingSignerId: actingSignerId.getValue(),
        cause: error
      });
    }
  }
  /**
   * Counts consents by envelope identifier
   * @param envelopeId - The envelope identifier value object
   * @returns Number of consents for the envelope
   */
  async countByEnvelopeId(envelopeId: EnvelopeId): Promise<number> {
    try {
      return await this.prisma.consent.count({
        where: { envelopeId: envelopeId.getValue() }
      });
    } catch (error) {
      throw repositoryError({
        operation: 'countByEnvelopeId',
        envelopeId: envelopeId.getValue(),
        cause: error
      });
    }
  }

  /**
   * Checks if consent exists for signer and envelope combination
   * @param signerId - The signer identifier value object
   * @param envelopeId - The envelope identifier value object
   * @returns True if consent exists, false otherwise
   */
  async existsBySignerAndEnvelope(signerId: SignerId, envelopeId: EnvelopeId): Promise<boolean> {
    try {
      return (await this.prisma.consent.count({
        where: { 
          signerId: signerId.getValue(),
          envelopeId: envelopeId.getValue()
        }
      })) > 0;
    } catch (error) {
      throw repositoryError({
        operation: 'existsBySignerAndEnvelope',
        signerId: signerId.getValue(),
        envelopeId: envelopeId.getValue(),
        cause: error
      });
    }
  }

  /**
   * Updates a consent entity using a function that returns the new instance.
   * @param {ConsentId} id - The consent identifier.
   * @param {(consent: Consent) => Consent} updateFn - Pure updater returning a new entity.
   * @param {Prisma.TransactionClient} [tx] - Optional transaction client.
   * @returns {Promise<Consent>} The updated consent.
   */
  async updateWithEntity(
    id: ConsentId,
    updateFn: (consent: Consent) => Consent,
    tx?: Prisma.TransactionClient
  ): Promise<Consent> {
    try {
      const current = await this.findById(id);
      if (!current) {
        throw repositoryError({ operation: 'updateWithEntity', consentId: id.getValue(), cause: new Error('Consent not found') });
      }
      const next = updateFn(current) ?? current;
      const updated = await (tx || this.prisma).consent.update({
        where: this.whereById(id),
        data: this.toUpdateModel(next),
      });
      return this.toDomain(updated);
    } catch (error) {
      throw repositoryError({ operation: 'updateWithEntity', consentId: id.getValue(), cause: error });
    }
  }
}

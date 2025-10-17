/**
 * @fileoverview UserPersonalInfoRepository - Repository for UserPersonalInfo entity
 * @summary Data access layer for user personal information
 * @description Handles persistence operations for user personal information including
 * phone, locale, and timezone data with proper error handling and type safety.
 */

import { PrismaClient } from '@prisma/client';
import { RepositoryBase } from '@lawprotect/shared-ts';
import { UserPersonalInfo } from '../domain/entities/UserPersonalInfo';
import { UserId } from '../domain/value-objects/UserId';
import { repositoryError } from '../auth-errors/factories';
import { uuid } from '@lawprotect/shared-ts';

export class UserPersonalInfoRepository extends RepositoryBase<UserPersonalInfo, string, any> {
  constructor(protected readonly prisma: PrismaClient) {
    super(prisma);
  }

  protected toDomain(model: any): UserPersonalInfo {
    try {
      return UserPersonalInfo.fromPersistence(model);
    } catch (error) {
      throw repositoryError({
        operation: 'toDomain',
        userPersonalInfoId: model?.id,
        cause: error
      });
    }
  }

  protected toCreateModel(entity: UserPersonalInfo): any {
    return entity.toPersistence();
  }

  protected toUpdateModel(entity: UserPersonalInfo): any {
    return entity.toPersistence();
  }

  protected whereById(id: string): any {
    return { id };
  }

  protected whereFromSpec(spec: any): any {
    return spec;
  }

  async findById(id: string, tx?: any): Promise<UserPersonalInfo | null> {
    try {
      const personalInfo = await (tx || this.prisma).userPersonalInfo.findUnique({
        where: { id }
      });
      return personalInfo ? this.toDomain(personalInfo) : null;
    } catch (error) {
      throw repositoryError({
        operation: 'findById',
        userPersonalInfoId: id,
        cause: error
      });
    }
  }

  async delete(id: string, tx?: any): Promise<void> {
    try {
      await (tx || this.prisma).userPersonalInfo.delete({
        where: { id }
      });
    } catch (error) {
      throw repositoryError({
        operation: 'delete',
        userPersonalInfoId: id,
        cause: error
      });
    }
  }

  async list(spec: any, limit: number, cursor?: string, tx?: any): Promise<{ items: UserPersonalInfo[]; nextCursor?: string }> {
    try {
      const personalInfos = await (tx || this.prisma).userPersonalInfo.findMany({
        where: this.whereFromSpec(spec),
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined
      });
      const items = personalInfos.map((info: any) => this.toDomain(info));
      const nextCursor = personalInfos.length === limit ? personalInfos[personalInfos.length - 1]?.id : undefined;
      return { items, nextCursor };
    } catch (error) {
      throw repositoryError({
        operation: 'list',
        cause: error
      });
    }
  }

  /**
   * Finds personal info by user ID
   * @param userId - The user ID
   * @param tx - Optional transaction
   * @returns UserPersonalInfo or null
   */
  async findByUserId(userId: UserId, tx?: any): Promise<UserPersonalInfo | null> {
    try {
      const personalInfo = await (tx || this.prisma).userPersonalInfo.findFirst({
        where: {
          userId: userId.toString()
        }
      });
      return personalInfo ? this.toDomain(personalInfo) : null;
    } catch (error) {
      throw repositoryError({
        operation: 'findByUserId',
        userId: userId.toString(),
        cause: error
      });
    }
  }

  /**
   * Creates new personal info
   * @param personalInfo - The personal info entity
   * @param tx - Optional transaction
   * @returns Created UserPersonalInfo
   */
  async create(personalInfo: UserPersonalInfo, tx?: any): Promise<UserPersonalInfo> {
    try {
      const data = personalInfo.toPersistence();
      const created = await (tx || this.prisma).userPersonalInfo.create({
        data
      });
      return this.toDomain(created);
    } catch (error) {
      throw repositoryError({
        operation: 'create',
        userPersonalInfoId: personalInfo.getId(),
        cause: error
      });
    }
  }

  /**
   * Updates personal info
   * @param id - The personal info ID
   * @param patch - Partial updates
   * @param tx - Optional transaction
   * @returns Updated UserPersonalInfo
   */
  async update(id: string, patch: Partial<UserPersonalInfo>, tx?: any): Promise<UserPersonalInfo> {
    try {
      const updated = await (tx || this.prisma).userPersonalInfo.update({
        where: { id },
        data: patch
      });
      return this.toDomain(updated);
    } catch (error) {
      throw repositoryError({
        operation: 'update',
        userPersonalInfoId: id,
        cause: error
      });
    }
  }

  /**
   * Upserts personal info (create or update)
   * @param personalInfo - The personal info entity
   * @param tx - Optional transaction
   * @returns Upserted UserPersonalInfo
   */
  async upsert(personalInfo: UserPersonalInfo, tx?: any): Promise<UserPersonalInfo> {
    try {
      const data = personalInfo.toPersistence();
      const upserted = await (tx || this.prisma).userPersonalInfo.upsert({
        where: { userId: personalInfo.getUserId().toString() },
        update: {
          phone: data.phone,
          locale: data.locale,
          timeZone: data.timeZone,
          updatedAt: data.updatedAt
        },
        create: data
      });
      return this.toDomain(upserted);
    } catch (error) {
      throw repositoryError({
        operation: 'upsert',
        userPersonalInfoId: personalInfo.getId(),
        cause: error
      });
    }
  }

  /**
   * Deletes personal info by user ID
   * @param userId - The user ID
   * @param tx - Optional transaction
   */
  async deleteByUserId(userId: UserId, tx?: any): Promise<void> {
    try {
      await (tx || this.prisma).userPersonalInfo.deleteMany({
        where: {
          userId: userId.toString()
        }
      });
    } catch (error) {
      throw repositoryError({
        operation: 'deleteByUserId',
        userId: userId.toString(),
        cause: error
      });
    }
  }

  /**
   * Upserts personal info by user ID
   * @param userId - User ID
   * @param personalInfoData - Personal info data to upsert
   * @returns Upserted personal info entity
   */
  async upsertByUserId(
    userId: UserId,
    personalInfoData: {
      phone?: string;
      locale?: string;
      timeZone?: string;
    }
  ): Promise<UserPersonalInfo> {
    try {
      // Check if personal info exists
      const existing = await this.findByUserId(userId);
      
      if (existing) {
        // Update existing
        if (personalInfoData.phone !== undefined) {
          (existing as any).phone = personalInfoData.phone;
        }
        if (personalInfoData.locale !== undefined) {
          (existing as any).locale = personalInfoData.locale;
        }
        if (personalInfoData.timeZone !== undefined) {
          (existing as any).timeZone = personalInfoData.timeZone;
        }
        
        (existing as any).updatedAt = new Date();
        
        return await this.update(existing.getId(), existing);
      } else {
        // Create new
        const personalInfo = new UserPersonalInfo(
          uuid(),
          userId,
          personalInfoData.phone || null,
          personalInfoData.locale || null,
          personalInfoData.timeZone || null,
          new Date(),
          new Date()
        );
        
        return await this.create(personalInfo);
      }
    } catch (error) {
      throw repositoryError({
        operation: 'upsertByUserId',
        userId: userId.toString(),
        cause: error
      });
    }
  }

}

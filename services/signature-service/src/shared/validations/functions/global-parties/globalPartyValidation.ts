/**
 * @file globalPartyValidation.ts
 * @summary Global Party validation functions
 * @description Utility functions for validating Global Party data
 */

import { BadRequestError, ErrorCodes } from "@lawprotect/shared-ts";
import {
  CreateGlobalPartySchema,
  UpdateGlobalPartySchema,
  GetGlobalPartySchema,
  ListGlobalPartiesSchema,
  DeleteGlobalPartySchema,
} from "../../schemas/global-parties/index";

/**
 * @description Validates Global Party creation data
 * @param data - Data to validate
 * @returns Validated data
 * @throws BadRequestError if validation fails
 */
export const validateCreateGlobalParty = (data: unknown) => {
  try {
    return CreateGlobalPartySchema.parse(data);
  } catch (error) {
    throw new BadRequestError(
      "Invalid Global Party creation data",
      ErrorCodes.COMMON_BAD_REQUEST,
      { data, error }
    );
  }
};

/**
 * @description Validates Global Party update data
 * @param data - Data to validate
 * @returns Validated data
 * @throws BadRequestError if validation fails
 */
export const validateUpdateGlobalParty = (data: unknown) => {
  try {
    return UpdateGlobalPartySchema.parse(data);
  } catch (error) {
    throw new BadRequestError(
      "Invalid Global Party update data",
      ErrorCodes.COMMON_BAD_REQUEST,
      { data, error }
    );
  }
};

/**
 * @description Validates Global Party retrieval data
 * @param data - Data to validate
 * @returns Validated data
 * @throws BadRequestError if validation fails
 */
export const validateGetGlobalParty = (data: unknown) => {
  try {
    return GetGlobalPartySchema.parse(data);
  } catch (error) {
    throw new BadRequestError(
      "Invalid Global Party retrieval data",
      ErrorCodes.COMMON_BAD_REQUEST,
      { data, error }
    );
  }
};

/**
 * @description Validates Global Parties listing data
 * @param data - Data to validate
 * @returns Validated data
 * @throws BadRequestError if validation fails
 */
export const validateListGlobalParties = (data: unknown) => {
  try {
    return ListGlobalPartiesSchema.parse(data);
  } catch (error) {
    throw new BadRequestError(
      "Invalid Global Parties listing data",
      ErrorCodes.COMMON_BAD_REQUEST,
      { data, error }
    );
  }
};

/**
 * @description Validates Global Party deletion data
 * @param data - Data to validate
 * @returns Validated data
 * @throws BadRequestError if validation fails
 */
export const validateDeleteGlobalParty = (data: unknown) => {
  try {
    return DeleteGlobalPartySchema.parse(data);
  } catch (error) {
    throw new BadRequestError(
      "Invalid Global Party deletion data",
      ErrorCodes.COMMON_BAD_REQUEST,
      { data, error }
    );
  }
};


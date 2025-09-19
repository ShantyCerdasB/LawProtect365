/**
 * @file metadataValidation.ts
 * @summary Reusable metadata validation utilities for business rules
 * @description Common metadata validation functions that can be used across multiple microservices
 * for validating custom fields, tags, and other metadata structures.
 */


/**
 * Configuration for custom fields validation
 */
export interface CustomFieldsConfig {
  /** Maximum number of custom fields allowed */
  maxFields: number;
  /** Maximum length for field keys */
  maxKeyLength: number;
  /** Maximum length for field values */
  maxValueLength: number;
  /** Allowed field key patterns (regex) */
  allowedKeyPattern?: RegExp;
  /** Allowed field value types */
  allowedValueTypes?: ('string' | 'number' | 'boolean')[];
}

/**
 * Configuration for tags validation
 */
export interface TagsConfig {
  /** Maximum number of tags allowed */
  maxTags: number;
  /** Maximum length for individual tags */
  maxTagLength: number;
  /** Whether to allow duplicate tags (case insensitive) */
  allowDuplicates: boolean;
  /** Allowed tag patterns (regex) */
  allowedTagPattern?: RegExp;
  /** Whether to trim whitespace from tags */
  trimWhitespace: boolean;
}

/**
 * Validates custom fields metadata
 * 
 * @param customFields - The custom fields object to validate
 * @param config - Configuration for validation rules
 * @param fieldName - Name of the field for error messages
 * @throws Error when custom fields are invalid
 */
export function validateCustomFields(
  customFields: Record<string, any> | undefined,
  config: CustomFieldsConfig,
  fieldName: string = "custom fields"
): void {
  if (!customFields) {
    return; // Optional field
  }

  validateCustomFieldsCount(customFields, config, fieldName);
  validateCustomFieldsEntries(customFields, config, fieldName);
}

/**
 * Validates the count of custom fields
 */
function validateCustomFieldsCount(
  customFields: Record<string, any>,
  config: CustomFieldsConfig,
  fieldName: string
): void {
  const fieldKeys = Object.keys(customFields);
  
  if (fieldKeys.length > config.maxFields) {
    throw new Error(
      `${fieldName} cannot have more than ${config.maxFields} field${config.maxFields !== 1 ? 's' : ''}`
    );
  }
}

/**
 * Validates each custom field entry
 */
function validateCustomFieldsEntries(
  customFields: Record<string, any>,
  config: CustomFieldsConfig,
  fieldName: string
): void {
  for (const [key, value] of Object.entries(customFields)) {
    validateCustomFieldKey(key, config, fieldName);
    validateCustomFieldValue(key, value, config, fieldName);
  }
}

/**
 * Validates a custom field key
 */
function validateCustomFieldKey(
  key: string,
  config: CustomFieldsConfig,
  fieldName: string
): void {
  // Validate field key length
  if (key.length > config.maxKeyLength) {
    throw new Error(
      `${fieldName} key "${key}" exceeds maximum length of ${config.maxKeyLength} characters`
    );
  }

  // Validate field key pattern
  if (config.allowedKeyPattern && !config.allowedKeyPattern.test(key)) {
    throw new Error(
      `${fieldName} key "${key}" does not match allowed pattern`
    );
  }
}

/**
 * Validates a custom field value
 */
function validateCustomFieldValue(
  key: string,
  value: any,
  config: CustomFieldsConfig,
  fieldName: string
): void {
  // Validate field value type
  if (config.allowedValueTypes) {
    const valueType = typeof value;
    if (!config.allowedValueTypes.includes(valueType as any)) {
      throw new Error(
        `${fieldName} value for "${key}" must be one of: ${config.allowedValueTypes.join(', ')}`
      );
    }
  }

  // Validate field value length (for strings)
  if (typeof value === 'string' && value.length > config.maxValueLength) {
    throw new Error(
      `${fieldName} value for "${key}" exceeds maximum length of ${config.maxValueLength} characters`
    );
  }
}

/**
 * Validates tags metadata
 * 
 * @param tags - The tags array to validate
 * @param config - Configuration for validation rules
 * @param fieldName - Name of the field for error messages
 * @throws Error when tags are invalid
 */
export function validateTags(
  tags: string[] | undefined,
  config: TagsConfig,
  fieldName: string = "tags"
): void {
  if (!tags) {
    return; // Optional field
  }

  validateTagsCount(tags, config, fieldName);
  
  const processedTags = processTags(tags, config);
  validateTagsContent(processedTags, config, fieldName);
  validateTagsDuplicates(processedTags, config, fieldName);
}

/**
 * Validates the count of tags
 */
function validateTagsCount(
  tags: string[],
  config: TagsConfig,
  fieldName: string
): void {
  if (tags.length > config.maxTags) {
    throw new Error(
      `${fieldName} cannot have more than ${config.maxTags} tag${config.maxTags !== 1 ? 's' : ''}`
    );
  }
}

/**
 * Processes tags (trim if configured)
 */
function processTags(tags: string[], config: TagsConfig): string[] {
  return config.trimWhitespace 
    ? tags.map(tag => tag.trim())
    : tags;
}

/**
 * Validates the content of each tag
 */
function validateTagsContent(
  processedTags: string[],
  config: TagsConfig,
  fieldName: string
): void {
  for (const tag of processedTags) {
    validateTagLength(tag, config, fieldName);
    validateTagNotEmpty(tag, fieldName);
    validateTagPattern(tag, config, fieldName);
  }
}

/**
 * Validates tag length
 */
function validateTagLength(
  tag: string,
  config: TagsConfig,
  fieldName: string
): void {
  if (tag.length > config.maxTagLength) {
    throw new Error(
      `${fieldName} tag "${tag}" exceeds maximum length of ${config.maxTagLength} characters`
    );
  }
}

/**
 * Validates tag is not empty
 */
function validateTagNotEmpty(tag: string, fieldName: string): void {
  if (tag.length === 0) {
    throw new Error(`${fieldName} cannot contain empty tags`);
  }
}

/**
 * Validates tag pattern
 */
function validateTagPattern(
  tag: string,
  config: TagsConfig,
  fieldName: string
): void {
  if (config.allowedTagPattern && !config.allowedTagPattern.test(tag)) {
    throw new Error(
      `${fieldName} tag "${tag}" does not match allowed pattern`
    );
  }
}

/**
 * Validates no duplicates (if configured)
 */
function validateTagsDuplicates(
  processedTags: string[],
  config: TagsConfig,
  fieldName: string
): void {
  if (!config.allowDuplicates) {
    const normalizedTags = processedTags.map(tag => tag.toLowerCase());
    const uniqueTags = new Set(normalizedTags);
    if (uniqueTags.size !== processedTags.length) {
      throw new Error(`${fieldName} cannot contain duplicate tags`);
    }
  }
}

/**
 * Validates that a string field is within length limits
 * 
 * @param value - The string value to validate
 * @param maxLength - Maximum allowed length
 * @param fieldName - Name of the field for error messages
 * @param allowEmpty - Whether to allow empty strings
 * @throws Error when string is invalid
 */
export function validateStringField(
  value: string | undefined,
  maxLength: number,
  fieldName: string,
  allowEmpty: boolean = false
): void {
  if (!value) {
    if (allowEmpty) {
      return; // Optional field
    }
    throw new Error(`${fieldName} is required`);
  }

  if (value.length > maxLength) {
    throw new Error(
      `${fieldName} exceeds maximum length of ${maxLength} characters`
    );
  }

  if (!allowEmpty && value.trim().length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
}

/**
 * Validates that a number field is within range
 * 
 * @param value - The number value to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @param fieldName - Name of the field for error messages
 * @param allowUndefined - Whether to allow undefined values
 * @throws Error when number is invalid
 */
export function validateNumberField(
  value: number | undefined,
  min: number,
  max: number,
  fieldName: string,
  allowUndefined: boolean = false
): void {
  if (value === undefined) {
    if (allowUndefined) {
      return; // Optional field
    }
    throw new Error(`${fieldName} is required`);
  }

  if (!Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a valid number`);
  }

  if (value < min || value > max) {
    throw new Error(
      `${fieldName} must be between ${min} and ${max}`
    );
  }
}

/**
 * Validates that a boolean field is valid
 * 
 * @param value - The boolean value to validate
 * @param fieldName - Name of the field for error messages
 * @param allowUndefined - Whether to allow undefined values
 * @throws Error when boolean is invalid
 */
export function validateBooleanField(
  value: boolean | undefined,
  fieldName: string,
  allowUndefined: boolean = false
): void {
  if (value === undefined) {
    if (allowUndefined) {
      return; // Optional field
    }
    throw new Error(`${fieldName} is required`);
  }

  if (typeof value !== 'boolean') {
    throw new Error(`${fieldName} must be a boolean value`);
  }
}

/**
 * Validates that an array field is within size limits
 * 
 * @param value - The array value to validate
 * @param maxLength - Maximum allowed array length
 * @param fieldName - Name of the field for error messages
 * @param allowEmpty - Whether to allow empty arrays
 * @throws Error when array is invalid
 */
export function validateArrayField(
  value: any[] | undefined,
  maxLength: number,
  fieldName: string,
  allowEmpty: boolean = true
): void {
  if (!value) {
    if (allowEmpty) {
      return; // Optional field
    }
    throw new Error(`${fieldName} is required`);
  }

  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`);
  }

  if (value.length > maxLength) {
    throw new Error(
      `${fieldName} cannot have more than ${maxLength} item${maxLength !== 1 ? 's' : ''}`
    );
  }

  if (!allowEmpty && value.length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
}

/**
 * Validates that an object field has the required structure
 * 
 * @param value - The object value to validate
 * @param requiredKeys - Array of required keys
 * @param fieldName - Name of the field for error messages
 * @param allowEmpty - Whether to allow empty objects
 * @throws Error when object is invalid
 */
export function validateObjectField(
  value: Record<string, any> | undefined,
  requiredKeys: string[],
  fieldName: string,
  allowEmpty: boolean = true
): void {
  if (!value) {
    if (allowEmpty) {
      return; // Optional field
    }
    throw new Error(`${fieldName} is required`);
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${fieldName} must be an object`);
  }

  if (!allowEmpty && Object.keys(value).length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }

  // Validate required keys
  for (const key of requiredKeys) {
    if (!(key in value)) {
      throw new Error(`${fieldName} is missing required key: ${key}`);
    }
  }
}

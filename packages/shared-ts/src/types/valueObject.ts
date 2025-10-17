/**
 * @file valueObject.ts
 * @summary Abstract base class for value objects in Domain-Driven Design
 * @description Provides common functionality for value objects including equality comparison,
 * serialization, and validation patterns.
 */

/**
 * Abstract base class for value objects
 * 
 * Value objects are immutable objects that are defined by their attributes rather than
 * their identity. They should implement value equality and be immutable.
 * 
 * @typeParam T The underlying value type (string, number, etc.)
 */
export abstract class ValueObject<T> {
  protected readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  /**
   * Gets the underlying value
   */
  getValue(): T {
    return this.value;
  }

  /**
   * Checks if this value object equals another value object
   * Must be implemented by subclasses to define equality logic
   */
  abstract equals(other: ValueObject<T>): boolean;

  /**
   * Returns the string representation of the value object
   * Must be implemented by subclasses
   */
  abstract toString(): string;

  /**
   * Returns the JSON representation of the value object
   * Must be implemented by subclasses
   */
  abstract toJSON(): T;

  /**
   * Creates a value object from a string value
   * Must be implemented by subclasses that support string construction
   */
  static fromString?(value: string): ValueObject<string>;

  /**
   * Generates a new value object with a random value
   * Must be implemented by subclasses that support generation (like IDs)
   */
  static generate?(): ValueObject<string>;
}

/**
 * Abstract base class for identifier value objects
 * 
 * Specialized base class for value objects that represent unique identifiers.
 * Provides common patterns for ID generation and validation.
 * 
 * **Required Methods to Implement:**
 * - `equals(other: Identifier<T>): boolean` - Compare with another identifier
 * - `toString(): string` - String representation
 * - `toJSON(): T` - JSON serialization
 * - `static fromString(value: string): Identifier<string>` - Create from string
 * - `static generate(): Identifier<string>` - Generate new identifier
 * 
 * @typeParam T The underlying identifier type (usually string)
 */
export abstract class Identifier<T> extends ValueObject<T> {

  /**
   * Creates an identifier from a string value
   */
  static fromString(_value: string): Identifier<string> {
    throw new Error('fromString must be implemented by subclass');
  }

  /**
   * Generates a new identifier with a random value
   */
  static generate(): Identifier<string> {
    throw new Error('generate must be implemented by subclass');
  }
}

/**
 * Abstract base class for string-based value objects
 * 
 * Provides common functionality for value objects that wrap string values.
 * Includes validation and normalization patterns.
 * 
 * **Included Methods (no need to implement):**
 * - `equals(other: StringValueObject): boolean` - Compare with another string value object
 * - `toString(): string` - String representation
 * - `toJSON(): string` - JSON serialization
 * - `getValue(): string` - Get the underlying string value
 * 
 * **Required Methods to Implement:**
 * - `static fromString(value: string): StringValueObject` - Create from string
 * 
 * @example
 * ```ts
 * class Email extends StringValueObject {
 *   constructor(value: string) {
 *     // Validate email format
 *     super(value.trim().toLowerCase());
 *   }
 *   
 *   static fromString(value: string): Email {
 *     return new Email(value);
 *   }
 * }
 * ```
 */
export abstract class StringValueObject extends ValueObject<string> {

  /**
   * Creates a string value object from a string value
   */
  static fromString(_value: string): StringValueObject {
    throw new Error('fromString must be implemented by subclass');
  }

  /**
   * Checks if this string value object equals another
   */
  equals(other: StringValueObject): boolean {
    return this.value === other.value;
  }

  /**
   * Returns the string representation
   */
  toString(): string {
    return this.value;
  }

  /**
   * Returns the JSON representation
   */
  toJSON(): string {
    return this.value;
  }
}

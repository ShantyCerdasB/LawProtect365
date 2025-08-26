/**
 * @file ToJsonObject.test.ts
 * @summary Unit tests for ToJsonObject utility
 */

import { toJsonObject } from "@/utils/ToJsonObject";

describe("ToJsonObject utility", () => {
  describe("toJsonObject", () => {
    it("should remove undefined values from object", () => {
      // Arrange
      const input = {
        name: "John Doe",
        age: 30,
        email: undefined,
        address: "123 Main St",
        phone: null,
        active: true,
      };

      // Act
      const result = toJsonObject(input);

      // Assert
      expect(result).toEqual({
        name: "John Doe",
        age: 30,
        address: "123 Main St",
        phone: null,
        active: true,
      });
      expect(result).not.toHaveProperty("email");
    });

    it("should handle empty object", () => {
      // Arrange
      const input = {};

      // Act
      const result = toJsonObject(input);

      // Assert
      expect(result).toEqual({});
    });

    it("should handle object with only undefined values", () => {
      // Arrange
      const input = {
        name: undefined,
        age: undefined,
        email: undefined,
      };

      // Act
      const result = toJsonObject(input);

      // Assert
      expect(result).toEqual({});
    });

    it("should handle object with mixed value types", () => {
      // Arrange
      const input = {
        string: "test",
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, 2, 3],
        object: { key: "value" },
      };

      // Act
      const result = toJsonObject(input);

      // Assert
      expect(result).toEqual({
        string: "test",
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: { key: "value" },
      });
      expect(result).not.toHaveProperty("undefined");
    });

    it("should handle object with nested undefined values", () => {
      // Arrange
      const input = {
        level1: {
          level2: {
            value: "test",
            undefined: undefined,
          },
          undefined: undefined,
        },
        topLevel: "value",
      };

      // Act
      const result = toJsonObject(input);

      // Assert
      expect(result).toEqual({
        level1: {
          level2: {
            value: "test",
            undefined: undefined,
          },
          undefined: undefined,
        },
        topLevel: "value",
      });
    });

    it("should handle object with zero values", () => {
      // Arrange
      const input = {
        zero: 0,
        emptyString: "",
        false: false,
        undefined: undefined,
      };

      // Act
      const result = toJsonObject(input);

      // Assert
      expect(result).toEqual({
        zero: 0,
        emptyString: "",
        false: false,
      });
      expect(result).not.toHaveProperty("undefined");
    });

    it("should handle object with special characters in keys", () => {
      // Arrange
      const input = {
        "key-with-dash": "value",
        "key_with_underscore": "value",
        "key with space": "value",
        "keyWithCamelCase": "value",
        undefined: undefined,
      };

      // Act
      const result = toJsonObject(input);

      // Assert
      expect(result).toEqual({
        "key-with-dash": "value",
        "key_with_underscore": "value",
        "key with space": "value",
        "keyWithCamelCase": "value",
      });
      expect(result).not.toHaveProperty("undefined");
    });

    it("should handle object with function values", () => {
      // Arrange
      const input = {
        func: () => "test",
        value: "test",
        undefined: undefined,
      };

      // Act
      const result = toJsonObject(input);

      // Assert
      expect(result).toEqual({
        func: expect.any(Function),
        value: "test",
      });
      expect(result).not.toHaveProperty("undefined");
    });

    it("should handle object with symbol values", () => {
      // Arrange
      const input = {
        symbol: Symbol("test"),
        value: "test",
        undefined: undefined,
      };

      // Act
      const result = toJsonObject(input);

      // Assert
      expect(result).toEqual({
        symbol: expect.any(Symbol),
        value: "test",
      });
      expect(result).not.toHaveProperty("undefined");
    });

    it("should handle object with all falsy values except undefined", () => {
      // Arrange
      const input = {
        zero: 0,
        emptyString: "",
        false: false,
        null: null,
        undefined: undefined,
      };

      // Act
      const result = toJsonObject(input);

      // Assert
      expect(result).toEqual({
        zero: 0,
        emptyString: "",
        false: false,
        null: null,
      });
      expect(result).not.toHaveProperty("undefined");
    });
  });
});


const base = require("../../jest.base.cjs");

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  displayName: "documents-service",
  roots: ["<rootDir>/tests"],
  coverageDirectory: "<rootDir>/coverage",
  moduleNameMapper: {
    // si usas aliases locales en el servicio
    "^@app/(.*)$": "<rootDir>/src/$1",
    // para resolver el shared package por path si lo necesitas en tests
    "^@lawprotect/shared-ts/(.*)$": "<rootDir>/../../node_modules/@lawprotect/shared-ts/dist/$1"
  }
};

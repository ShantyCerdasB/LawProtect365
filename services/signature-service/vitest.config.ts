import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",                
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage", 
      all: true,                      
      exclude: [
        "vitest.config.*",
        "vite.config.*",
        "src/**/__mocks__/**",
        "src/**/*.d.ts",
        "src/**/*.schema.*",
        "src/**/index.ts",
      ],
    },
  },
});

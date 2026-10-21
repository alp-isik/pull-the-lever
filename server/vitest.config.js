import { defineConfig } from "vitest/config";

export default defineConfig({
  // Keep the test cache in the shared node_modules at the project root.
  cacheDir: "../node_modules/.vite",
  test: {
    // Tests use a fresh database in memory and fixed settings, never your .env.
    env: {
      DATABASE_FILE: ":memory:",
      ADMIN_PASSWORD: "test-admin-password",
      JWT_SECRET: "test-jwt-secret",
    },
  },
});

import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Every module that touches auth, Mongo or Pusher is mocked per file, so
    // no test here needs a database or network.
    clearMocks: true,
  },
});

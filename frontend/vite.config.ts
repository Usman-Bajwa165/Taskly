// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig(async () => {
  // dynamic ESM import so esbuild won't try to require() the ESM-only package
  const reactPlugin = (await import("@vitejs/plugin-react")).default;

  return {
    plugins: [reactPlugin()],
    server: { port: 5173 },
  };
});

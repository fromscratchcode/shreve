import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "lib" ? "./" : "/",
  publicDir: mode === "lib" ? false : undefined,
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  build:
    mode === "lib"
      ? {
          lib: {
            entry: "./src/index.ts",
            formats: ["es"],
            fileName: () => "index.js",
            cssFileName: "memphis-react",
          },
          rollupOptions: {
            external: [
              "react",
              "react-dom",
              "react/jsx-runtime",
              "react/jsx-dev-runtime",
            ],
          },
        }
      : undefined,
}));

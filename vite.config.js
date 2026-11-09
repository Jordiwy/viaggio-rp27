import { defineConfig } from "vite";

export default defineConfig({
  root: "web",
  build: { outDir: "../dist", emptyOutDir: true, target: "es2020", assetsInlineLimit: 0 },
  server: { proxy: { "/api": "http://localhost:8787" } },
});

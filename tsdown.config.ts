import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: ["src/content.ts"],
    format: "iife",
    outDir: "scripts",
    clean: true,
    minify: false,
    treeshake: true,
  },
  {
    entry: ["src/background.ts"],
    format: "iife",
    outDir: "scripts",
    clean: false, // Don't clean on second build
    minify: false,
    treeshake: true,
  },
]);

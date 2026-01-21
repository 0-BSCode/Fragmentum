import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: ["src/background.ts"],
    format: "iife",
    outDir: "scripts",
    clean: true,
    minify: false,
    treeshake: true,
  },
  {
    entry: ["src/popup/popup.ts"],
    format: "iife",
    outDir: "scripts",
    clean: false,
    minify: false,
    treeshake: true,
  },
]);

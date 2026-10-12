import globals from "globals"
import js from "@eslint/js"
import { defineConfig } from "eslint/config"

export default defineConfig([
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "commonjs" },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: { sourceType: "module" },
  },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    extends: [js.configs.recommended],
    rules: {
      "no-var": "error",
      "prefer-const": "error",
    },
  },
])

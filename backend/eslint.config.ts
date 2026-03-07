import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import { defineConfig } from 'eslint/config';

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/array-type': 'error',
      'max-lines-per-function': ["error", {max: 51, skipBlankLines: true, skipComments: true}],
      'max-lines': ["error", {max: 501, skipBlankLines: true, skipComments: true}],
    },
  },
);

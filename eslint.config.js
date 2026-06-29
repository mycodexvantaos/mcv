// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Enforce no hardcoded production domains outside config
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "Literal[value=/mycodexvantaos\\.com/]",
          message:
            "Do not hardcode production domain strings. Use domain config module instead: import { domains } from '@mycodexvantaos/config/domains'",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".next/**",
      "coverage/**",
      "outputs/**",
      "*.config.js",
      "*.config.ts",
    ],
  }
);

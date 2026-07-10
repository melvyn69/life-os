import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "src/types/database.ts",
      "supabase/functions/_shared/database.ts"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}", "vite.config.ts", "vitest.config.ts", "tests/**/*.ts"],
    languageOptions: {
      globals: globals.browser
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }]
    }
  },
  {
    files: ["supabase/functions/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.browser,
        Deno: "readonly"
      }
    }
  },
  {
    files: ["scripts/**/*.{js,mjs}"],
    languageOptions: {
      globals: globals.node
    }
  }
);

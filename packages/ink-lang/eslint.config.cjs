const tseslint = require("@typescript-eslint/eslint-plugin");
const typescript = require("@typescript-eslint/parser");
const prettier = require("eslint-config-prettier");
const unusedImports = require("eslint-plugin-unused-imports");
const eslintPluginPrettier = require("eslint-plugin-prettier");

const plugins = {
  "@typescript-eslint": tseslint,
  "unused-imports": unusedImports,
  prettier: eslintPluginPrettier,
};

const rules = {
  "@typescript-eslint/interface-name-prefix": "off",
  "@typescript-eslint/explicit-function-return-type": "off",
  "@typescript-eslint/explicit-module-boundary-types": "off",
  "@typescript-eslint/no-explicit-any": "off",
  "no-undefined": "off",
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      vars: "all",
      varsIgnorePattern: "^_",
      args: "after-used",
      argsIgnorePattern: "^_",
    },
  ],
  "@typescript-eslint/no-use-before-define": [
    "error",
    {
      functions: false,
      classes: false,
      variables: false,
    },
  ],
  "unused-imports/no-unused-imports": "error",
  "no-console": [
    "error",
    {
      allow: ["error", "warn", "info"],
    },
  ],
  ...eslintPluginPrettier.configs.recommended.rules,
};

module.exports = [
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: typescript,
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
      },
    },
    plugins,
    rules,
  },
  {
    files: ["test/**/*.{ts,tsx}", "examples/**/*.{ts,tsx}"],
    languageOptions: {
      parser: typescript,
      parserOptions: {
        project: "./tsconfig.test.json",
        sourceType: "module",
      },
    },
    plugins,
    rules,
  },
  prettier,
];

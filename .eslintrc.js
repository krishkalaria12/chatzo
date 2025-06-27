module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
    "react-native/react-native": true,
  },
  extends: [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:react-native/all",
    "plugin:prettier/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: [
    "react",
    "react-hooks",
    "react-native",
    "@typescript-eslint",
    "prettier",
  ],
  rules: {
    // Prettier integration
    "prettier/prettier": "error",

    // React rules
    "react/react-in-jsx-scope": "off", // Not needed in React 17+
    "react/prop-types": "off", // Using TypeScript for prop validation
    "react/display-name": "off",

    // TypeScript rules
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-non-null-assertion": "warn",

    // React Native specific
    "react-native/no-unused-styles": "warn",
    "react-native/split-platform-components": "off",
    "react-native/no-inline-styles": "warn",
    "react-native/no-color-literals": "warn",
    "react-native/no-raw-text": "off", // Allow raw text in components

    // General rules
    "no-console": "off", // Allow console logs
    "prefer-const": "error",
    "no-var": "error",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  overrides: [
    // Convex backend specific rules
    {
      files: ["packages/backend/**/*.ts"],
      env: {
        node: true,
        browser: false,
      },
      rules: {
        "react-native/no-unused-styles": "off",
        "react-native/split-platform-components": "off",
        "react-native/no-inline-styles": "off",
        "react-native/no-color-literals": "off",
        "react-native/no-raw-text": "off",
        "react/jsx-uses-react": "off",
        "react/jsx-uses-vars": "off",
      },
    },
    // Expo/React Native app specific rules
    {
      files: ["apps/native/**/*.{ts,tsx}"],
      env: {
        "react-native/react-native": true,
      },
      rules: {
        "react-native/no-unused-styles": "warn",
        "react-native/no-inline-styles": "warn",
      },
    },
    // Generated files - disable all rules
    {
      files: ["**/_generated/**/*", "**/node_modules/**/*"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "react/prop-types": "off",
        "prettier/prettier": "off",
      },
    },
  ],
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "build/",
    ".expo/",
    ".turbo/",
    "_generated/",
    "*.d.ts",
  ],
};

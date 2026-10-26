import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

// ESLint finds likely bugs, such as unused variables and wrong use of React hooks.
// Prettier does the formatting, so no style rules here.
export default [
  { ignores: ["**/dist/", "**/node_modules/"] },

  js.configs.recommended,

  // The React app runs in the browser.
  {
    files: ["client/**/*.{js,jsx}"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ["client/src/**/*.jsx"],
    ...reactHooks.configs.flat.recommended,
  },

  // The API and the config files run in Node.
  {
    files: ["server/**/*.js", "*.js", "client/vite.config.js"],
    languageOptions: { globals: globals.node },
  },
];

/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  "root": true,
  "extends": ["plugin:vue/vue3-essential", "@vue/eslint-config-prettier"],
  rules: {
    "no-console": ["error", {
      allow: ["warn", "error"]
    }],
  },
  "env": {
    "node": true,
    "commonjs": true,
    "vue/setup-compiler-macros": true,
  }
};

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default [
  // 1. 基础推荐配置
  js.configs.recommended,
  ...tseslint.configs.recommended,
  
  // 2. 全局配置
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    // 这些规则对 packages 下所有文件生效
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "warn"
    }
  },

  // 3. 忽略文件 (类似 .eslintignore)
  {
    ignores: ["**/dist", "**/node_modules", "**/.git"]
  }
];
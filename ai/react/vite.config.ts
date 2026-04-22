import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import { visualizer } from "rollup-plugin-visualizer";
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // lifecycleLoggerPlugin(),
    // visualizer({
    //   open: true,
    //   filename: "dist/stats.html", // 明确放到打包产物目录下
    //   gzipSize: true,
    //   brotliSize: true,
    // }),
  ],
  build: {
    target: "es2018",
    minify: "esbuild",
    sourcemap: false,
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          // 1. 精确匹配 React 核心库（注意前后的斜杠）
          if (
            id.includes("/node_modules/react/") ||
            id.includes("/node_modules/react-dom/")
          ) {
            return "react-core";
          }

          // 2. 将 Markdown 解析、语法高亮及它们的底层依赖全部打包到一起
          if (
            id.includes("/node_modules/react-markdown/") ||
            id.includes("/node_modules/remark-") ||
            id.includes("/node_modules/rehype-") ||
            id.includes("/node_modules/hast-") || // Markdown 底层抽象语法树依赖
            id.includes("/node_modules/unist-") || // Markdown 底层抽象语法树依赖
            id.includes("/node_modules/highlight.js/") || // 真正的体积巨兽
            id.includes("/node_modules/lowlight/") // rehype-highlight 的底层
          ) {
            return "markdown-parser";
          }

          // 3. 剩下的第三方库（比如 react-virtuoso）放到 vendor 里
          return undefined;
        },
      },
    },

    modulePreload: {
      resolveDependencies: (filename, deps, context) => {
        void filename;
        void context;
        // 过滤掉 markdown-parser，不让它在首屏预加载
        return deps.filter(dep => !dep.includes('markdown-parser'));
      }
    },
  },
});

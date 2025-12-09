import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react-swc";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  mode:'development',
  plugins: [
    react(),
    visualizer({
      filename: "dist/stats.html",
      open: true,
      // gzipSize: true,
      // brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },

  root: resolve(__dirname),
  base: "/",
  publicDir: resolve(__dirname, "public"),
  build: {
    outDir: resolve(__dirname, "dist"),
    assetsDir: "assets",
    rollupOptions: {
      output: {
        // 自定义手动分包逻辑
        manualChunks(id) {
          if (
            id.includes("antd") ||
            id.includes("rc-") ||
            id.includes("@ant-design/")
          ) {
            return "antd-vendor"; // 所有 Antd 相关的打成一个包
          }
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
});

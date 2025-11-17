import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { logFilenamePlugin } from "./vite-plugin-log-filename";
const path = require('path')



// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), logFilenamePlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

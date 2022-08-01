import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron/renderer";

export default defineConfig({
  plugins: [
    vue(),
    electron({
      main: {
        entry: "electron/electron.js",
        vite: {
          build: {
            sourcemap: false,
            outDir: "dist/electron"
          }
        }
      }
    }),
    renderer()
  ]
});

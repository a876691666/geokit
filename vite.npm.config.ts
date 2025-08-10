import { defineConfig } from "vite";
import path from "path";
import dts from "vite-plugin-dts";
import { fileURLToPath } from "url";
import packageJson from "./package.json";
import vue from "@vitejs/plugin-vue";
import { templateCompilerOptions } from "@tresjs/core";
import { visualizer } from "rollup-plugin-visualizer";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [
    vue({
      ...templateCompilerOptions,
    }),
    dts({
      outDir: "dist",
      tsconfigPath: "./tsconfig.app.json",
    }),
    // visualizer({
    //   gzipSize: true,
    //   brotliSize: true,
    //   emitFile: false,
    //   filename: "test.html", //分析图生成的文件名
    //   open: true, //如果存在本地服务端口，将在打包后自动展示
    // }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: packageJson.name,
      formats: ["umd", "es"],
      fileName: (format) => `index.${format}.js`,
    },
    minify: true,
    outDir: "dist", // 输出目录为 dist
    copyPublicDir: false, // 不拷贝静态资源
    rollupOptions: {
      external: ["three", "vue", "@tresjs/core", "@tresjs/post-processing"], // Specify external dependencies here
      output: {
        globals: {}, // Provide global variable names for external dependencies
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});

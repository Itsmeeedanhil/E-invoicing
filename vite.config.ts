import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      // Ignore database files, logs, and backend source files to avoid reload loops
      ignored: [
        "**/src-tauri/**",
        "**/data/**",
        "**/*.db",
        "**/*.db-journal",
        "**/*.accdb",
        "**/*.csv",
        "**/*.log",
        "**/*.ps1"
      ],
    },
  },
}));

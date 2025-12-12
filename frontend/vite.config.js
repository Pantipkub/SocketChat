import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // allow access from other devices on the LAN when running `npm run dev`
    host: true,
    proxy: {
      "/api": {
        // backend dev server
        target: "http://192.168.1.113:3001",
        changeOrigin: true
      }
    }
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the build works from any sub-path (GitHub Pages serves it at /prototype/northbridge-plan-insights/).
export default defineConfig({
  plugins: [react()],
  base: "./",
});

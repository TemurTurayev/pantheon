import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  resolve: {
    // Ensure Mol*'s internal React usage resolves to the same React as the app.
    dedupe: ["react", "react-dom"],
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/molstar/lib/mol-plugin-ui")) return "molstar-ui";
          if (id.includes("node_modules/molstar/lib/mol-plugin-state")) return "molstar-ui";
          if (id.includes("node_modules/molstar/lib/mol-repr")) return "molstar-repr";
          if (id.includes("node_modules/molstar/lib/mol-geo")) return "molstar-repr";
          if (id.includes("node_modules/molstar")) return "molstar-core";
          if (id.includes("node_modules/react-router")) return "react-vendor";
          if (id.includes("node_modules/react")) return "react-vendor";
          if (id.includes("node_modules/recharts")) return "recharts-vendor";
          return null;
        },
      },
    },
  },
});

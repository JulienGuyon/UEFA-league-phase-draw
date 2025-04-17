import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// defineConfig can be a factory that receives { command }
export default defineConfig(({ command }) => {
  const isDev = command === "serve"; // `npm run dev` → serve, `vite build` → build
  return {
    base: isDev ? "/" : "/UEFA-league-phase-draw/",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

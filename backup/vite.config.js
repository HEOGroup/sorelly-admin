import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// Modo "artefato": gera UM arquivo HTML só (tudo dentro), para publicar como Artifact. Roteamento em memória (ver main.js).
export default defineConfig(({ mode }) => mode === "artefato" ? {
  plugins: [react(), tailwindcss(), viteSingleFile()],
  base: "./",
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: { target: "es2020", outDir: "dist-artefato", assetsInlineLimit: 100000000, cssCodeSplit: false },
} : {
  plugins: [react(), tailwindcss()],
  server: { port: Number(process.env.PORT) || 5173 },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    target: "es2020",
    // Cada página vira um chunk próprio (React.lazy nas rotas).
    // Aqui só isolamos o que é comum a todas elas, para o browser cachear uma vez.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react-router")) return "vendor-router";
            return "vendor-react";
          }
          if (id.includes("/src/shared/")) return "shared-ui";
        },
      },
    },
  },
});

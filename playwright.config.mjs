// Sorelly Admin · playwright.config.mjs
// FOTOS DE REFERÊNCIA (trava dura do padrão visual, 29/10/2026). Cada tela aprovada pelo Marcus tem uma foto guardada em
// tests/fotos/referencia/. O robô abre a tela, tira outra foto e compara pixel a pixel: mudou sem querer, reprova (local e no CI do GitHub).
//   npm run fotos          → compara (precisa do servidor da porta 3000 ligado; no CI ele sobe sozinho com `next start`)
//   npm run fotos:aprovar  → grava as fotos novas como referência (só depois que o Marcus aprovou a tela)
//   npm run fotos:ver      → abre o relatório com antes/depois/diferença
// A foto tem o nome da tela + o sistema (-win32 no PC do Marcus, -linux no GitHub): cada ambiente compara com a sua.
// No GitHub o sistema sobe SEM servidor de dados (NEXT_PUBLIC_API_URL vazio = modo antigo, dados de demonstração), então a foto é sempre a mesma.
// No PC do Marcus o servidor tem login: tests/fotos lê FOTOS_EMAIL e FOTOS_SENHA do .env.local para entrar.
import { defineConfig } from "@playwright/test";

try { process.loadEnvFile(".env.local"); } catch (x) { /* sem .env.local (CI) */ }
var CI = !!process.env.CI;

export default defineConfig({
  testDir: "tests/fotos",
  snapshotPathTemplate: "{testDir}/referencia/{arg}-{platform}{ext}",
  timeout: 90000,
  retries: CI ? 1 : 0,
  workers: 1,
  reporter: CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.FOTOS_URL || "http://localhost:3000",
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    colorScheme: "dark",
    screenshot: "off",
    trace: CI ? "retain-on-failure" : "off",
  },
  expect: { toHaveScreenshot: { animations: "disabled", caret: "hide", maxDiffPixelRatio: 0.002, scale: "css" } },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  // No CI o build já foi feito pelo passo anterior; aqui só liga o servidor. No PC, usa o servidor único da porta 3000 (regra: ninguém sobe outro).
  webServer: CI ? { command: "npx next start -p 3000", url: "http://localhost:3000/", reuseExistingServer: false, timeout: 120000 } : undefined,
});

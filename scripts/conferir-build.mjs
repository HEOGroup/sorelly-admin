// Confere se o sistema gera o build sem erro (o mesmo que o Leonardo pede antes de subir para a master),
// SEM mexer na pasta .next do servidor que está ligado na porta 3000. Uso: npm run conferir
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const saida = ".next-conferencia";
fs.rmSync(saida, { recursive: true, force: true });
spawnSync("node", ["scripts/gerar-locais.mjs"], { stdio: "inherit" });
const r = spawnSync("npx", ["next", "build"], { stdio: "inherit", shell: true, env: { ...process.env, NEXT_DIST_DIR: saida } });
fs.rmSync(saida, { recursive: true, force: true });
console.log(r.status === 0 ? "\nCONFERIDO: build sem erro. Pode subir para o Git." : "\nERRO NO BUILD: não suba para o Git.");
process.exit(r.status ?? 1);

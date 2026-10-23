// Gera src/generated/locais.js: registro estático dos arquivos "*.local.js" (dados reais, fora do Git).
// Substitui o import.meta.glob do Vite. Arquivo que não existe simplesmente não entra (o sistema usa os dados de demonstração).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(raiz, "src");
const achados = [];
(function andar(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) andar(p);
    else if (/\.local\.js$/.test(f.name)) achados.push(path.relative(src, p).split(path.sep).join("/"));
  }
})(src);
achados.sort();

const linhas = ["// GERADO por scripts/gerar-locais.mjs — não editar, não commitar.", ""];
achados.forEach((a, i) => linhas.push(`import * as m${i} from "@/${a}";`));
linhas.push("", "export const LOCAIS = {");
achados.forEach((a, i) => linhas.push(`  "${a}": m${i},`));
linhas.push("};", "");
fs.mkdirSync(path.join(src, "generated"), { recursive: true });
fs.writeFileSync(path.join(src, "generated", "locais.js"), linhas.join("\n"));
console.log(`[locais] ${achados.length} arquivo(s) .local.js registrados`);

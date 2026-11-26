// Point (fornecedor): chave Pix FIXA até segunda ordem, com favorecido e texto da folha (pedido do Marcus, 26/11/2026).
// Só acrescenta campos em cp.chaves["forn|Point"]; a chave e o banco não mudam.
// Uso: node --env-file-if-exists=.env.local scripts/chave-point-fixa.mjs [--gravar]
import { consulta, pool } from "../src/server/db.js";
import { gravarModulo } from "../src/server/estado-modulo.js";
const GRAVAR = process.argv.includes("--gravar");
const ID = "forn|Point";
const lido = (await consulta("select conteudo from sorelly.estado_modulo where modulo = 'cp'")).rows[0].conteudo;
const atual = (lido.chaves || {})[ID];
if (!atual || !atual.chave) { console.log("Point sem chave. Parei."); await pool().end(); process.exit(1); }
const novo = Object.assign({}, atual, { favorecido: "Prime Brutos Ltda", folha: "PIX - POINT", regra: "fixa", regraEm: Date.now(), regraPor: "Marcus 26/11/2026" });
console.log("Antes:", JSON.stringify(atual));
console.log("Depois:", JSON.stringify(novo));
if (!GRAVAR) { console.log("Simulação. Nada gravado. Rode com --gravar."); await pool().end(); process.exit(0); }
await gravarModulo("cp", {}, "patch", "chave-point-fixa-26-11", (g, n) => Object.assign({}, n, { chaves: Object.assign({}, (g && g.chaves) || {}, { [ID]: novo }) }));
const dep = (await consulta("select conteudo from sorelly.estado_modulo where modulo = 'cp'")).rows[0].conteudo;
console.log("Conferido:", JSON.stringify(dep.chaves[ID]), "| total de chaves:", Object.keys(dep.chaves).length, "(antes:", Object.keys(lido.chaves).length + ")");
await pool().end();

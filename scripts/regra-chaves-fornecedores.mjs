// Regra da chave Pix dos fornecedores (Marcus, 26/11/2026): fixa até segunda ordem para todos, menos Pontual (vale até o fim de cada pedido; Charme e Linda também, mas ainda sem chave cadastrada).
// Só acrescenta regra/regraEm/regraPor em cp.chaves["forn|..."]. Uso: node --env-file-if-exists=.env.local scripts/regra-chaves-fornecedores.mjs [--gravar]
import { consulta, pool } from "../src/server/db.js";
import { gravarModulo } from "../src/server/estado-modulo.js";
const GRAVAR = process.argv.includes("--gravar");
const PEDIDO = ["forn|Pontual"];
const lido = (await consulta("select conteudo from sorelly.estado_modulo where modulo = 'cp'")).rows[0].conteudo;
const alvo = {};
for (const id of Object.keys(lido.chaves || {})) if (id.startsWith("forn|") && id !== "forn|davila" && lido.chaves[id].chave) alvo[id] = PEDIDO.includes(id) ? "pedido" : "fixa";
console.table(Object.keys(alvo).map((id) => ({ id, antes: lido.chaves[id].regra || "", depois: alvo[id] })));
if (!GRAVAR) { console.log("Simulação."); await pool().end(); process.exit(0); }
await gravarModulo("cp", {}, "patch", "regra-chaves-fornecedores-26-11", (g, n) => {
  const ch = Object.assign({}, (g && g.chaves) || {});
  for (const id of Object.keys(alvo)) if (ch[id]) ch[id] = Object.assign({}, ch[id], { regra: alvo[id], regraEm: ch[id].regraEm || Date.now(), regraPor: ch[id].regraPor || "Marcus 26/11/2026" });
  return Object.assign({}, n, { chaves: ch });
});
const dep = (await consulta("select conteudo from sorelly.estado_modulo where modulo = 'cp'")).rows[0].conteudo;
console.table(Object.keys(alvo).map((id) => ({ id, regra: dep.chaves[id].regra, chave: !!dep.chaves[id].chave })));
console.log("Total de chaves:", Object.keys(dep.chaves).length, "(antes:", Object.keys(lido.chaves).length + ")");
await pool().end();

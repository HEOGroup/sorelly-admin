// Charme, Linda e Tucano: chave Pix "até o final de cada pedido" (Marcus, 26/11/2026). Sem chave fixa: a chave vem do pedido (Negociações).
// Uso: node --env-file-if-exists=.env.local scripts/regra-charme-linda-tucano.mjs [--gravar]
import { consulta, pool } from "../src/server/db.js";
import { gravarModulo } from "../src/server/estado-modulo.js";
const GRAVAR = process.argv.includes("--gravar");
const NOVOS = { "forn|Charme": "Bruto", "forn|Linda": "Bruto", "forn|Tucano": "Bruto" };
const lido = (await consulta("select conteudo from sorelly.estado_modulo where modulo = 'cp'")).rows[0].conteudo;
console.log("Já existem:", Object.keys(NOVOS).filter((id) => (lido.chaves || {})[id]));
if (!GRAVAR) { console.log("Simulação."); await pool().end(); process.exit(0); }
await gravarModulo("cp", {}, "patch", "regra-charme-linda-tucano-26-11", (g, n) => {
  const ch = Object.assign({}, (g && g.chaves) || {});
  for (const id of Object.keys(NOVOS)) ch[id] = Object.assign({ nome: id.slice(5), grupo: "forn", servico: NOVOS[id], banco: "" }, ch[id], { regra: "pedido", regraEm: Date.now(), regraPor: "Marcus 26/11/2026" });
  return Object.assign({}, n, { chaves: ch });
});
const dep = (await consulta("select conteudo from sorelly.estado_modulo where modulo = 'cp'")).rows[0].conteudo;
console.log(Object.keys(NOVOS).map((id) => id + " → " + JSON.stringify(dep.chaves[id])).join("\n"), "\nTotal:", Object.keys(dep.chaves).length, "(antes:", Object.keys(lido.chaves).length + ")");
await pool().end();

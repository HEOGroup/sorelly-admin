// Pontual (Banho) e Devmaster: a chave muda a cada período de pagamento (Lucas/Marcus, 26/11/2026). Só troca o campo "regra".
// Uso: node --env-file-if-exists=.env.local scripts/regra-periodo-pontual-devmaster.mjs [--gravar]
import { consulta, pool } from "../src/server/db.js";
import { gravarModulo } from "../src/server/estado-modulo.js";
const GRAVAR = process.argv.includes("--gravar");
const IDS = ["forn|Pontual", "forn|Devmaster"];
const lido = (await consulta("select conteudo from sorelly.estado_modulo where modulo = 'cp'")).rows[0].conteudo;
const novos = {};
for (const id of IDS) {
  const a = (lido.chaves || {})[id];
  if (!a) { console.log("Falta", id); await pool().end(); process.exit(1); }
  novos[id] = Object.assign({}, a, { regra: "periodo", regraEm: Date.now(), regraPor: "Lucas/Marcus 26/11/2026" });
  console.log(id, ":", a.regra, "->", "periodo");
}
if (!GRAVAR) { console.log("Simulação."); await pool().end(); process.exit(0); }
await gravarModulo("cp", {}, "patch", "regra-periodo-26-11", (g, n) => Object.assign({}, n, { chaves: Object.assign({}, (g && g.chaves) || {}, novos) }));
const dep = (await consulta("select conteudo from sorelly.estado_modulo where modulo = 'cp'")).rows[0].conteudo;
for (const id of IDS) console.log("Conferido", id, dep.chaves[id].regra);
await pool().end();

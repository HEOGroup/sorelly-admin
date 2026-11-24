// Provisiona o Lucas Castilho (Pix de revendedora, dia 10 = R$ 2.000,00 e dia 23 = R$ 2.500,00) de jan/2027 a dez/2027 no Pagamentos a fornecedores.
// Pedido do Marcus em 24/11/2026: "provisionar o Castilho para o mês que vem e até o final de 2027" ("todo mês"). Dez/2026 já existe (pedido 126). Cada mês é um pedido igual ao 126, parcelas Pendentes.
// Só ACRESCENTA pedidos; não mexe nos existentes; pula o mês que já tem pedido do fornecedor com parcela naquele mês. Guarda cópia antes. Uso:
//   node --env-file-if-exists=.env.local scripts/provisionar-lucas-castilho-2027.mjs            (só mostra)
//   node --env-file-if-exists=.env.local scripts/provisionar-lucas-castilho-2027.mjs --gravar
import fs from "node:fs";
import { consulta, pool } from "../src/server/db.js";
import { gravarModulo } from "../src/server/estado-modulo.js";
const GRAVAR = process.argv.includes("--gravar");
const FORN = 18, MESES = [];
for (let m = 1; m <= 12; m++) MESES.push("2027-" + String(m).padStart(2, "0"));
const lido = (await consulta("select conteudo from sorelly.estado_modulo where modulo = 'pf'")).rows[0].conteudo;
const f = (lido.fornecedores || []).find((x) => x.id === FORN);
if (!f || f.nome !== "Lucas Castilho") { console.log("Fornecedor 18 não é o Lucas Castilho. Parei."); await pool().end(); process.exit(1); }
const jaTem = (ym, pedidos) => (pedidos || []).some((p) => p.fornId === FORN && (p.parcelas || []).some((q) => String(q.venc).slice(0, 7) === ym));
const faltam = MESES.filter((ym) => !jaTem(ym, lido.pedidos));
console.log("Meses que já têm pedido:", MESES.filter((ym) => !faltam.includes(ym)).join(", ") || "nenhum");
console.log("Meses a criar:", faltam.join(", ") || "nenhum");
if (!faltam.length) { await pool().end(); process.exit(0); }
if (!GRAVAR) { console.log("Simulação. Nada gravado. Rode com --gravar."); await pool().end(); process.exit(0); }
fs.writeFileSync("scripts/_copia-pf-antes-castilho-2027.json", JSON.stringify({ seq: lido.seq, totalPedidos: lido.pedidos.length }, null, 1));
await gravarModulo("pf", {}, "patch", "provisao-castilho-2027-24-11", (g, n) => {
  const pedidos = (g && g.pedidos) || [], seq = Object.assign({}, (g && g.seq) || {});
  const novos = [];
  for (const ym of MESES) {
    if (jaTem(ym, pedidos)) continue;
    novos.push({ id: seq.P++, ref: "", cnpj: "Sem NF", data: ym + "-01", comNF: 0, nfNum: "", semNF: 4500, total: 4500, fornId: FORN, limite: ym + "-23", nfTipo: "sem", numero: "---", pixMin: 1,
      aprov: "aprovado", aprovEm: "2026-11-24", aprovPor: "Previsão pedida pelo Marcus (24/11/2026)",
      parcelas: [{ venc: ym + "-10", conta: "—", forma: "pix_revendedora", valor: 2000, status: "Pendente" }, { venc: ym + "-23", conta: "—", forma: "pix_revendedora", valor: 2500, status: "Pendente" }],
      descricao: "Serviços Marketing (previsão)" });
  }
  return Object.assign({}, n, { pedidos: [...pedidos, ...novos], seq });
});
const dep = (await consulta("select conteudo from sorelly.estado_modulo where modulo = 'pf'")).rows[0].conteudo;
console.log("Pedidos do Lucas Castilho agora:", dep.pedidos.filter((p) => p.fornId === FORN).length, "| seq.P:", dep.seq.P);
await pool().end();

// Fecha a dívida do Breno (sobra de R$ 3,60) no Financeiro familiar, igual ao botão "Fechar dívida" da tela Prestadores (op divida_fechar):
// acrescenta uma linha negativa "Fechada no valor atual" ligada à dívida. Nada é apagado. Pedido do Marcus em 24/11/2026: "Breno liquida esse valor de 3 e poucos reais".
// Uso: node --env-file-if-exists=.env.local scripts/fechar-divida-breno.mjs [--gravar]
import fs from "node:fs";
import { consulta, pool } from "../src/server/db.js";
import { gravarModulo } from "../src/server/estado-modulo.js";
const GRAVAR = process.argv.includes("--gravar");
const lido = (await consulta("select conteudo from sorelly.estado_modulo where modulo = 'ff'")).rows[0].conteudo;
const pr = (lido.prest || []).find((p) => p.nome === "Breno");
const dv = pr && (lido.dividas || []).find((d) => d.prestId === pr.id && d.valor > 0);
if (!dv) { console.log("Dívida do Breno não encontrada."); await pool().end(); process.exit(1); }
const pago = (lido.repasses || []).filter((r) => r.prestId === pr.id).reduce((t, r) => t + (Number(r.valor) || 0), 0)
  - (lido.dividas || []).filter((d) => d.prestId === pr.id && d.valor < 0).reduce((t, d) => t + d.valor, 0);
const falta = Math.round((dv.valor - pago) * 100) / 100;
console.log(`Breno: dívida ${dv.valor}, pago ${Math.round(pago * 100) / 100}, falta ${falta}`);
if (!(falta > 0.005 && falta < 20)) { console.log("Falta fora do esperado (3 e poucos reais). Parei."); await pool().end(); process.exit(1); }
if (!GRAVAR) { console.log("Simulação. Nada gravado. Rode com --gravar."); await pool().end(); process.exit(0); }
fs.writeFileSync("scripts/_copia-ff-breno-antes.json", JSON.stringify({ dividas: (lido.dividas || []).filter((d) => d.prestId === pr.id) }, null, 1));
const novo = { id: "dv" + Date.now().toString(36), prestId: pr.id, valor: -falta, data: new Date().toISOString().slice(0, 10), prazo: "", descricao: "Fechada no valor atual", divId: dv.id, fechamento: true };
await gravarModulo("ff", {}, "patch", "fechar-divida-breno-24-11", (g, n) => Object.assign({}, n, { dividas: [...((g && g.dividas) || []), novo] }));
console.log("Gravado:", JSON.stringify(novo));
await pool().end();

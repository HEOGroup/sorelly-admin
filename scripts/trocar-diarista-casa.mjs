// Troca as 3 contas "Diarista" da Casa (Família › Contas a pagar; R$ 315, R$ 315 e R$ 312 por mês) por UMA conta só, paga POR DIA.
// Pedido do Marcus em 24/11/2026: "deixa uma só, é pago por dia". Regra: a diarista vai 2 vezes por semana na casa, R$ 312,00 por dia (R$ 300,00 + vale-transporte), em dinheiro.
// Previsão do mês = quintas do mês x 2 dias x R$ 312,00 = quintas x R$ 624,00 (nov/2026 a dez/2027). Os pagamentos já feitos em novembro passam para a conta nova (nada se perde).
// As 3 contas antigas NÃO são apagadas: só ganham fim em out/2026 (encerraEm), então o histórico fica. Guarda cópia antes.
// Uso: node --env-file-if-exists=.env.local scripts/trocar-diarista-casa.mjs [--gravar]
import fs from "node:fs";
import { consulta, pool } from "../src/server/db.js";
import { gravarModulo } from "../src/server/estado-modulo.js";
const GRAVAR = process.argv.includes("--gravar");
const ANTIGAS = ["c127", "c134", "o_47dc"], NOVA = "diaria_casa", DIA = 312, VEZES = 2;
const quintas = (ym) => { const [y, m] = ym.split("-").map(Number); let n = 0; for (let d = new Date(y, m - 1, 1); d.getMonth() === m - 1; d.setDate(d.getDate() + 1)) if (d.getDay() === 4) n++; return n; };
const MESES = []; for (let y = 2026; y <= 2027; y++) for (let m = (y === 2026 ? 11 : 1); m <= 12; m++) MESES.push(y + "-" + String(m).padStart(2, "0"));
const lido = (await consulta("select conteudo from sorelly.estado_modulo where modulo = 'ff'")).rows[0].conteudo;
const velhas = ANTIGAS.map((id) => (lido.contas || []).find((c) => c.id === id)).filter(Boolean);
if (velhas.length !== 3 || velhas.some((c) => c.descricao !== "Diarista" || c.personaId !== "casaalphaville" || c.forma !== "Dinheiro")) { console.log("As 3 contas não conferem. Parei.", velhas.map((c) => c.id)); await pool().end(); process.exit(1); }
if ((lido.contas || []).some((c) => c.id === NOVA)) { console.log("A conta nova já existe. Nada a fazer."); await pool().end(); process.exit(0); }
const pagosNov = ANTIGAS.flatMap((id) => (((lido.parcelas || {})[id] || {})["2026-11"] || {}).pagamentos || []);
console.log("Pagamentos de novembro que passam para a conta nova:", pagosNov.length, "= R$", pagosNov.reduce((t, p) => t + p.valor, 0).toFixed(2));
console.log("Previsão por mês:", MESES.map((ym) => ym + " " + quintas(ym) * VEZES * DIA).join(" | "));
if (!GRAVAR) { console.log("Simulação. Nada gravado. Rode com --gravar."); await pool().end(); process.exit(0); }
fs.writeFileSync("scripts/_copia-ff-diarista-antes.json", JSON.stringify({ contas: velhas, parcelas: Object.fromEntries(ANTIGAS.map((id) => [id, (lido.parcelas || {})[id]])) }, null, 1));
await gravarModulo("ff", {}, "patch", "diarista-casa-24-11", (g, n) => {
  const contas = ((g && g.contas) || []).map((c) => ANTIGAS.includes(c.id) ? Object.assign({}, c, { encerraEm: "2026-10", obs: ((c.obs ? c.obs + " · " : "") + "Trocada pela conta única 'Diarista' paga por dia (Marcus, 24/11/2026)").slice(0, 200) }) : c);
  const modelo = velhas[0];
  contas.push({ id: NOVA, dia: 26, obs: "Diarista da casa: 2 dias por semana, R$ 312,00 por dia (R$ 300,00 + vale-transporte), pago por dia em dinheiro. Previsão = quintas do mês x R$ 624,00 (Marcus, 24/11/2026).", forma: "Dinheiro", categoria: "CASA", descricao: "Diarista", encerraEm: null, personaId: "casaalphaville", contaBancId: modelo.contaBancId || "", beneficiario: "" });
  const parcelas = Object.assign({}, (g && g.parcelas) || {});
  parcelas[NOVA] = {}; MESES.forEach((ym) => { parcelas[NOVA][ym] = { valor: quintas(ym) * VEZES * DIA, pagamentos: ym === "2026-11" ? pagosNov : [] }; });
  const hist = ((g && g.hist) || []).concat([{ em: Date.now(), id: "hdiaria" + Date.now().toString(36), por: "Claude (pedido do Marcus 24/11/2026)", acao: "Trocou contas", alvo: "Diarista · Casa", area: "Contas a pagar", detalhe: "3 contas (R$ 315, R$ 315 e R$ 312 por mês) viraram 1, paga por dia (R$ 312,00, 2 vezes por semana)" }]);
  return Object.assign({}, n, { contas, parcelas, hist });
});
const dep = (await consulta("select conteudo from sorelly.estado_modulo where modulo = 'ff'")).rows[0].conteudo;
console.log("Conta nova:", !!(dep.contas || []).find((c) => c.id === NOVA), "| parcelas:", Object.keys(dep.parcelas[NOVA] || {}).length, "| nov:", JSON.stringify(dep.parcelas[NOVA]["2026-11"]).slice(0, 160));
await pool().end();

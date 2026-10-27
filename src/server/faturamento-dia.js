// Atualização AUTOMÁTICA do faturamento do DIA ANTERIOR (pedido do Marcus, 27/10/2026): todo dia às 10h, sem a Amanda lançar,
// o servidor pergunta à DevMaster o faturamento do mês até ontem (ver faturamento.js) e grava.
// Mesmo mecanismo do total de revendedoras (revendedoras-dia.js): grava em sorelly.estado_modulo (módulo "fatdia"), o navegador
// recebe pela sincronização de sempre e o reducer junta em s.faturamentoDiario[dia].recebido — só o VALOR; acertos e revendedoras
// daquele dia continuam como já estavam (revendedoras já é automático à parte; acertos ainda é de outra fonte, a confirmar com o Marcus).
import { faturamentoMesAte } from "./faturamento.js";
import { consulta } from "./db.js";

const HORA_EXECUCAO = 10;   // 10h, horário de Brasília (pedido do Marcus)
const CONFERIR_A_CADA = 15 * 60 * 1000;

function isoOntemBR() {
  const ontem = new Date(Date.now() - 86400000);
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(ontem);
  const g = (t) => p.find((x) => x.type === t).value;
  return g("year") + "-" + g("month") + "-" + g("day");
}
function horaAgoraBR() {
  return Number(new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", hour12: false }).format(new Date()));
}

export async function atualizarFaturamentoDoDia({ forcar = false } = {}) {
  const dia = isoOntemBR();
  if (!forcar) {
    const ja = await consulta("select conteudo->'diario'->$1 as v from sorelly.estado_modulo where modulo = 'fatdia'", [dia]);
    if (ja.rows[0] && ja.rows[0].v !== null) return { ja: true, dia };
  }
  const { valor, notas } = await faturamentoMesAte(dia);
  const patch = { diario: { [dia]: valor }, atualizadoEm: { [dia]: new Date().toISOString() } };
  await consulta(
    `insert into sorelly.estado_modulo (modulo, conteudo, versao, atualizado_por) values ('fatdia', $1::jsonb, 1, 'automatico')
     on conflict (modulo) do update set conteudo = sorelly.estado_modulo.conteudo || excluded.conteudo, versao = sorelly.estado_modulo.versao + 1, atualizado_por = excluded.atualizado_por, atualizado_em = now()`,
    [JSON.stringify(patch)]
  );
  return { ja: false, dia, valor, notas };
}

export function agendarFaturamentoDiario() {
  if (globalThis.__sorellyFatDiaAgendado) return;
  globalThis.__sorellyFatDiaAgendado = true;
  const checar = async () => {
    try { if (horaAgoraBR() >= HORA_EXECUCAO) await atualizarFaturamentoDoDia(); }
    catch (e) { console.error("[faturamento-dia] falhou:", e && e.message); }
  };
  checar();
  setInterval(checar, CONFERIR_A_CADA);
}

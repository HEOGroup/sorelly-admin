// Atualização AUTOMÁTICA do total de revendedoras do dia (pedido do Marcus, 27/10/2026): todo dia, sem ninguém preencher,
// o servidor pergunta à DevMaster quantas revendedoras têm condicional aberto dentro da janela de 90 dias (ver revendedoras.js)
// e grava o resultado. Isso substitui o lançamento manual (Visão geral → "Atualizar hoje" de Revendedoras).
// Gravado em sorelly.estado_modulo (módulo "revdia"), do mesmo jeito que os outros módulos (ver app/api/estado/[modulo]/route.js);
// o navegador recebe pela sincronização de sempre (lib/sync-modulos.js) e o reducer guarda em s.revendedorasDiario / s.revAtualizadoEm.
import { contarRevendedorasHoje } from "./revendedoras.js";
import { consulta } from "./db.js";

const HORA_EXECUCAO = 18;   // 18h, horário de Brasília — fim de tarde, como o Marcus pediu (depois do movimento do dia, antes do fechamento)
const CONFERIR_A_CADA = 15 * 60 * 1000;

function isoDiaHoje() {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const g = (t) => p.find((x) => x.type === t).value;
  return g("year") + "-" + g("month") + "-" + g("day");
}
function horaAgoraBR() {
  return Number(new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", hour12: false }).format(new Date()));
}

// Roda a contagem e grava, a não ser que hoje já tenha sido gravado (uma vez por dia; `forcar` ignora isso).
export async function atualizarRevendedorasDoDia({ forcar = false } = {}) {
  const dia = isoDiaHoje();
  if (!forcar) {
    const ja = await consulta("select conteudo->'diario'->$1 as v from sorelly.estado_modulo where modulo = 'revdia'", [dia]);
    if (ja.rows[0] && ja.rows[0].v !== null) return { ja: true, dia };
  }
  const quantidade = await contarRevendedorasHoje();
  const patch = { diario: { [dia]: quantidade }, atualizadoEm: { [dia]: new Date().toISOString() } };
  await consulta(
    `insert into sorelly.estado_modulo (modulo, conteudo, versao, atualizado_por) values ('revdia', $1::jsonb, 1, 'automatico')
     on conflict (modulo) do update set conteudo = sorelly.estado_modulo.conteudo || excluded.conteudo, versao = sorelly.estado_modulo.versao + 1, atualizado_por = excluded.atualizado_por, atualizado_em = now()`,
    [JSON.stringify(patch)]
  );
  return { ja: false, dia, quantidade };
}

// Liga o relógio: confere a cada 15 min e, a partir das 18h (Brasília), atualiza (só uma vez por dia). Chamado 1x, no boot do servidor (instrumentation.js).
export function agendarRevendedorasDiarias() {
  if (globalThis.__sorellyRevDiaAgendado) return;
  globalThis.__sorellyRevDiaAgendado = true;
  const checar = async () => {
    try { if (horaAgoraBR() >= HORA_EXECUCAO) await atualizarRevendedorasDoDia(); }
    catch (e) { console.error("[revendedoras-dia] falhou:", e && e.message); }
  };
  checar();
  setInterval(checar, CONFERIR_A_CADA);
}

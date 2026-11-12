// Atualização AUTOMÁTICA DIÁRIA, às 10h (Marcus, 09/11/2026: "precisa atualizar sozinho", o número não pode depender de ele abrir o sistema).
// Faz duas coisas, as duas sem apagar o que a pessoa digitou:
//   1. Total de revendedoras do dia (DevMaster, revendedoras-dia.js).
//   2. Faturamento e acertos do relatório de notas fiscais, acumulado do mês até ONTEM (faturamento-nf.js). Dias do mês que ficaram sem lançamento também são preenchidos.
// Quem chama: (a) o agendador da Vercel (vercel.json, 13h UTC = 10h de Brasília, com a chave CRON_SECRET); (b) o próprio sistema, quando alguém abre depois das 10h e o dia ainda não foi feito;
// (c) o relógio interno do servidor local (instrumentation.js). Tudo é idempotente: só grava o que mudou.
import { consulta } from "./db.js";
import { faturamentoNFDoMes } from "./faturamento-nf.js";
import { atualizarRevendedorasDoDia } from "./revendedoras-dia.js";
import { atualizarEstoqueDoDia } from "./estoque-dia.js";
import { sincronizarFotosDm } from "./fotos-dm.js";
import { copiaDiaria } from "./estado-modulo.js";

export const HORA_AUTOMATICA = 10;

const partesBR = (d) => { const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false }).formatToParts(d); const g = (t) => p.find((x) => x.type === t).value; return { iso: g("year") + "-" + g("month") + "-" + g("day"), hora: Number(g("hour")) % 24 }; };
export const agoraBR = () => partesBR(new Date());
const ontemBR = () => partesBR(new Date(Date.now() - 86400000)).iso;
const r2 = (v) => Math.round(v * 100) / 100;

// grava no módulo "fd" (faturamentoDiario e contasPagasDiario) com trava de versão, para não pisar em quem está lançando na mesma hora
async function gravarFaturamento(dias) {
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const r = await consulta("select conteudo, versao from sorelly.estado_modulo where modulo = 'fd'");
    if (!r.rows[0]) return { mudou: 0, motivo: "módulo fd ainda não existe" };
    const c = r.rows[0].conteudo || {}, fd = Object.assign({}, c.faturamentoDiario), cp = Object.assign({}, c.contasPagasDiario);
    let mudou = 0, ant = { valor: 0, acertos: 0 };
    const mes = dias.length ? dias[0].dia.slice(0, 7) : "";
    // o dia anterior ao primeiro da lista vale como base do "dia" (acumulado de ontem do mesmo mês)
    for (const d of dias) {
      const atual = fd[d.dia] || {};
      if (atual.travado) { ant = { valor: Number(atual.recebido) || d.valor, acertos: Number(atual.acertos) || d.acertos }; continue; }
      const igual = r2(Number(atual.recebido)) === d.valor && Number(atual.acertos) === d.acertos;
      if (!igual) {
        fd[d.dia] = Object.assign({}, atual, { recebido: d.valor, acertos: d.acertos, fixadoEm: Date.now(), parcial: false, automatico: true });
        cp[d.dia] = Object.assign({ cnpjs: {}, contasPorFora: 0 }, cp[d.dia], { faturado: r2(d.valor - ant.valor), acertos: d.acertos - ant.acertos });
        mudou++;
      }
      ant = { valor: d.valor, acertos: d.acertos };
    }
    if (!mudou) return { mudou: 0, mes };
    const u = await consulta("update sorelly.estado_modulo set conteudo = conteudo || $1::jsonb, versao = versao + 1, atualizado_por = 'automatico', atualizado_em = now() where modulo = 'fd' and versao = $2",
      [JSON.stringify({ faturamentoDiario: fd, contasPagasDiario: cp }), r.rows[0].versao]);
    if (u.rowCount) return { mudou, mes };
  }
  return { mudou: 0, motivo: "outra pessoa gravou ao mesmo tempo; tenta de novo na próxima" };
}

// marca de "dia feito" (11/11/2026): cada tela aberta chama esta rotina a cada 30 min e ela relia DevMaster e notas fiscais toda vez (custo da Vercel).
// Feito o dia sem erro, a tela recebe {jaFeito:true} na hora. O agendador da Vercel (cron) e o ?forcar=1 rodam sempre.
async function diaFeito(dia) {
  try { const r = await consulta("select conteudo->>'dia' as dia from sorelly.estado_modulo where modulo = 'autodia'"); return !!r.rows[0] && r.rows[0].dia === dia; } catch (e) { return false; }
}
async function marcarDia(dia) {
  await consulta("insert into sorelly.estado_modulo (modulo, conteudo, versao, atualizado_por) values ('autodia', $1::jsonb, 1, 'automatico') on conflict (modulo) do update set conteudo = excluded.conteudo, versao = sorelly.estado_modulo.versao + 1, atualizado_em = now()", [JSON.stringify({ dia })]);
}

export async function rodarAutomaticoDoDia({ forcar = false, cron = false } = {}) {
  const agora = agoraBR();
  if (!forcar && agora.hora < HORA_AUTOMATICA) return { esperando: true, hora: agora.hora, ate: HORA_AUTOMATICA };
  if (!forcar && !cron && await diaFeito(agora.iso)) return { dia: agora.iso, jaFeito: true };
  const out = { dia: agora.iso };
  try { out.copia = await copiaDiaria(agora.iso); } catch (e) { out.copia = { erro: e && e.message }; }   // cópia de segurança de todos os módulos (uma por dia, 30 dias)
  try { out.revendedoras = await atualizarRevendedorasDoDia({ forcar: false }); } catch (e) { out.revendedoras = { erro: e && e.message }; }
  try { out.estoque = await atualizarEstoqueDoDia({ forcar: false }); } catch (e) { out.estoque = { erro: e && e.message }; }
  try { out.fotos = await sincronizarFotosDm(); } catch (e) { out.fotos = { erro: e && e.message }; }   // Fotos de catálogo (10/11/2026): produtos novos da DevMaster
  try {
    const ontem = ontemBR();
    const dias = await faturamentoNFDoMes(ontem);
    out.faturamento = await gravarFaturamento(dias);
    out.faturamento.ate = ontem;
    if (dias.length) out.faturamento.ultimo = dias[dias.length - 1];
  } catch (e) { out.faturamento = { erro: e && e.message }; }
  const comErro = ["revendedoras", "estoque", "faturamento", "copia"].some((k) => out[k] && out[k].erro);
  if (!comErro) await marcarDia(agora.iso).catch(() => {});
  return out;
}

// relógio do servidor local: confere a cada 15 minutos e roda a partir das 10h (idempotente)
export function agendarAutomaticoDiario() {
  if (globalThis.__sorellyAutoDiaAgendado) return;
  globalThis.__sorellyAutoDiaAgendado = true;
  const checar = async () => { try { await rodarAutomaticoDoDia(); } catch (e) { console.error("[automatico-dia] falhou:", e && e.message); } };
  setTimeout(checar, 20000);
  setInterval(checar, 15 * 60 * 1000);
}

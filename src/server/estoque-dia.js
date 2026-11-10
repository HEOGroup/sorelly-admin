// Estoque Sorelly, preenchimento AUTOMÁTICO (Marcus, 09/11/2026): todo dia, sem ninguém digitar, o servidor lê na DevMaster (API 2, só leitura)
// o que está COM AS REVENDEDORAS e grava no módulo "es": uma linha por dia em `diarias` (dia a dia) e, no mês que ainda não tem foto, a foto do mês em `posicoes`.
// Conta usada (bateu com o número que o Marcus tirou na mão: 2.099 revendedoras, R$ 20,73 mi, 246 mil peças, 2.960 condicionais):
//   condicionais ABERTOS (dmafi, afi_status "A"), devolução prevista até 31/12 do ano atual (fora ficam os expositores, que têm data de anos à frente),
//   sem vendedor 04 (Expositor) e 91 (Encomendas), que não são representantes. Peças = afi_qtditens; venda = afi_valormerc; revendedoras = clientes diferentes.
// NÃO preenche (continua manual): custo com as revendedoras e todo o estoque interno (falta achar o relatório de estoque da DevMaster).
// Nunca apaga o que a pessoa digitou: na foto do mês só entram campos vazios, e mês travado não é tocado.
// Quem chama: automatico-dia.js (agendador da Vercel às 10h e de novo às 14h; só roda se o dia ainda não foi gravado).
import { consulta } from "./db.js";
import { todasAsPaginas } from "./devmaster2.js";

const NAO_REPRESENTANTE = new Set(["04", "91"]);
const r2 = (v) => Math.round(v * 100) / 100;
const partes = (d) => { const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d); const g = (t) => p.find((x) => x.type === t).value; return { dia: g("year") + "-" + g("month") + "-" + g("day"), hora: g("hour") + ":" + g("minute"), ano: Number(g("year")), mes: Number(g("month")), dd: Number(g("day")) }; };

// lê a DevMaster e devolve os números do dia
export async function lerEstoqueRevendedoras(ano) {
  const campos = ["afi_codigo", "afi_cliente", "afi_vendedor", "afi_prevdevol", "afi_qtditens", "afi_valormerc", "afi_status"];
  const todos = await todasAsPaginas("dmafi", { filtro: { afi_status: "A" }, campos });
  const lista = todos.filter((x) => Number(String(x.afi_prevdevol || "").slice(0, 4)) <= ano && !NAO_REPRESENTANTE.has(String(x.afi_vendedor).trim()));
  if (!lista.length) throw new Error("A DevMaster não devolveu nenhum condicional aberto.");
  return {
    qtdRevendedoras: new Set(lista.map((x) => x.afi_cliente)).size,
    revPecas: lista.reduce((s, x) => s + (Number(x.afi_qtditens) || 0), 0),
    revVenda: r2(lista.reduce((s, x) => s + (Number(x.afi_valormerc) || 0), 0)),
    condicionais: lista.length,
  };
}

// grava com trava de versão (não pisa em quem está lançando na mesma hora)
async function gravar(mexer) {
  for (let t = 0; t < 4; t++) {
    const r = await consulta("select conteudo, versao from sorelly.estado_modulo where modulo = 'es'");
    if (!r.rows[0]) return { erro: "módulo es ainda não existe no servidor" };
    const es = r.rows[0].conteudo || {};
    const novo = mexer(JSON.parse(JSON.stringify(es)));
    const u = await consulta("update sorelly.estado_modulo set conteudo = conteudo || $1::jsonb, versao = versao + 1, atualizado_por = 'automatico', atualizado_em = now() where modulo = 'es' and versao = $2",
      [JSON.stringify({ diarias: novo.diarias, posicoes: novo.posicoes, auto: novo.auto }), r.rows[0].versao]);
    if (u.rowCount) return { ok: true };
  }
  return { erro: "outra pessoa gravou ao mesmo tempo; tenta de novo na próxima" };
}

export async function atualizarEstoqueDoDia({ forcar = false } = {}) {
  const agora = partes(new Date());
  const atual = await consulta("select conteudo from sorelly.estado_modulo where modulo = 'es'");
  const es0 = (atual.rows[0] && atual.rows[0].conteudo) || {};
  const jaTem = (es0.diarias || []).some((d) => d.id === agora.dia && d.origem === "automatico");
  if (jaTem && !forcar) return { ja: true, dia: agora.dia };
  let nums;
  try { nums = await lerEstoqueRevendedoras(agora.ano); }
  catch (e) {
    const msg = (e && e.message) || "falha ao ler a DevMaster";
    await gravar((es) => { es.diarias = es.diarias || []; es.posicoes = es.posicoes || []; es.auto = Object.assign({}, es.auto, { ultima: { em: new Date().toISOString(), dia: agora.dia, hora: agora.hora, ok: false, erro: msg } }); return es; });
    return { dia: agora.dia, erro: msg };
  }
  const id = agora.dia, idMes = agora.dia.slice(0, 7);
  const r = await gravar((es) => {
    es.diarias = (es.diarias || []).filter((d) => d.id !== id);
    es.diarias.push({ id, dia: id, ...nums, origem: "automatico", hora: agora.hora, atualizadoEm: new Date().toISOString() });
    es.diarias.sort((a, b) => (a.id < b.id ? -1 : 1));
    es.diarias = es.diarias.slice(-400);
    es.posicoes = es.posicoes || [];
    // foto do mês: só se o mês ainda não tem foto, e só com o que a DevMaster sabe; o resto o Financeiro completa
    if (!es.posicoes.some((p) => p.id === idMes)) {
      es.posicoes.push({ id: idMes, ano: agora.ano, mes: agora.mes, dia: agora.dd, qtdRevendedoras: nums.qtdRevendedoras, internoPecas: null, internoCusto: null, internoVenda: null, revPecas: nums.revPecas, revCusto: null, revVenda: nums.revVenda, simulados: [], travado: false, por: "Automático (DevMaster)", automatico: true });
    }
    es.auto = Object.assign({}, es.auto, { ultima: { em: new Date().toISOString(), dia: id, hora: agora.hora, ok: true } });
    return es;
  });
  return { dia: id, ...nums, gravado: r };
}

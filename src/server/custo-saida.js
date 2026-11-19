// Custo de TUDO que saiu do estoque, mês a mês, lido da DevMaster (API 2, só leitura). Pedido do Marcus, 16/11/2026:
// "é pra puxar simplesmente tudo que saiu do estoque: brinde, trocas, vendas, tudo", com botão para ver por TES ou total.
// Conta: acertos do mês (dmach, data de EMISSÃO, sem os cancelados) -> itens de cada acerto (dmaci, ligados por aci_venda)
//        -> custo da peça (aci_custoprod) x quantidade, somado POR TES. Item cancelado fica de fora. Ninguém é tirado (funcionárias entram).
// TES vistos em out/2026: S001 venda, S009 brinde e prêmio, S011 premiação por meta, S007 indicação, S006 remessa para troca (dicionário dmabc).
// Onde grava: módulo "cpc" (Cadastro de peças), chave `custoMes[AAAA-MM] = {total, pecas, tes:{S001:{pecas, custo}}, auto:true, atualizadoEm}`.
// A tela de Pedidos (resumo por mês) lê `total` na coluna "Custo das saídas" e `tes` no modo "Por TES". Nunca apaga um mês que a pessoa digitou (sem `auto`).
// Quem chama: automatico-dia.js (todo dia às 10h). Mês corrente e mês passado são relidos todo dia; mês antigo que está faltando é preenchido, no máximo 2 por rodada.
import { consulta } from "./db.js";
import { todasAsPaginas } from "./devmaster2.js";

const r2 = (v) => Math.round(v * 100) / 100;
const LOTE = 200;

// "AAAA-MM" -> {de, ate} em texto de data
function faixaDoMes(mes) {
  const [a, m] = mes.split("-").map(Number);
  const ultimo = new Date(a, m, 0).getDate();
  return { de: `${mes}-01T00:00:00`, ate: `${mes}-${String(ultimo).padStart(2, "0")}T23:59:59` };
}

const semCancelamento = (v) => { const d = String(v || ""); return !d || /^(0001|1899|1900)/.test(d); };

// lê um mês na DevMaster e devolve {total, pecas, tes, acertos, itens}
export async function lerCustoDoMes(mes) {
  const { de, ate } = faixaDoMes(mes);
  const vendas = await todasAsPaginas("dmach", { filtro: { ach_emissao: { gte: de, lte: ate } }, campos: ["ach_codigo", "ach_datacanc"] });
  const codigos = vendas.filter((v) => semCancelamento(v.ach_datacanc)).map((v) => v.ach_codigo);
  const tes = {};
  let itens = 0;
  for (let i = 0; i < codigos.length; i += LOTE) {
    const lote = await todasAsPaginas("dmaci", { filtro: { aci_venda: { in: codigos.slice(i, i + LOTE) } }, campos: ["aci_venda", "aci_tes", "aci_quantidade", "aci_custoprod", "aci_cancelado"] });
    for (const it of lote) {
      if (it.aci_cancelado === "S") continue;
      itens++;
      const k = String(it.aci_tes || "").trim() || "SEM";
      const o = tes[k] || (tes[k] = { pecas: 0, custo: 0 });
      const q = Number(it.aci_quantidade) || 0;
      o.pecas += q; o.custo += q * (Number(it.aci_custoprod) || 0);
    }
  }
  Object.values(tes).forEach((o) => { o.custo = r2(o.custo); });
  return { total: r2(Object.values(tes).reduce((s, o) => s + o.custo, 0)), pecas: Object.values(tes).reduce((s, o) => s + o.pecas, 0), tes, acertos: codigos.length, itens };
}

// grava com trava de versão, trocando só a chave custoMes (o resto do módulo cpc fica como está)
async function gravar(mexer) {
  for (let t = 0; t < 4; t++) {
    const r = await consulta("select conteudo, versao from sorelly.estado_modulo where modulo = 'cpc'");
    if (!r.rows[0]) return { erro: "módulo cpc ainda não existe no servidor" };
    const custoMes = mexer(JSON.parse(JSON.stringify((r.rows[0].conteudo || {}).custoMes || {})));
    const u = await consulta("update sorelly.estado_modulo set conteudo = conteudo || $1::jsonb, versao = versao + 1, atualizado_por = 'automatico', atualizado_em = now() where modulo = 'cpc' and versao = $2",
      [JSON.stringify({ custoMes }), r.rows[0].versao]);
    if (u.rowCount) return { ok: true };
  }
  return { erro: "outra pessoa gravou ao mesmo tempo; tenta de novo na próxima" };
}

const mesAnterior = (mes, n) => { const [a, m] = mes.split("-").map(Number); const d = new Date(a, m - 1 - n, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };

// mesAtual = "AAAA-MM" (horário de Brasília). Relê o mês atual e o anterior; preenche até `maxAntigos` meses de 2026 que ainda faltam.
export async function atualizarCustoDasSaidas({ mesAtual, maxAntigos = 2, forcarTodos = false } = {}) {
  if (!/^\d{4}-\d{2}$/.test(mesAtual || "")) throw new Error("mesAtual inválido");
  const r = await consulta("select conteudo from sorelly.estado_modulo where modulo = 'cpc'");
  if (!r.rows[0]) return { erro: "módulo cpc ainda não existe no servidor" };
  const atual = (r.rows[0].conteudo || {}).custoMes || {};
  const ano = mesAtual.slice(0, 4);
  const fixos = [mesAtual, mesAnterior(mesAtual, 1)];
  const faltam = [];
  for (let m = 1; m <= Number(mesAtual.slice(5)); m++) { const k = `${ano}-${String(m).padStart(2, "0")}`; if (!fixos.includes(k) && (forcarTodos || !(atual[k] && atual[k].total != null))) faltam.push(k); }
  const alvo = fixos.concat(forcarTodos ? faltam : faltam.slice(-maxAntigos));
  const lidos = {}, erros = {};
  for (const mes of alvo) {
    if (atual[mes] && atual[mes].total != null && !atual[mes].auto) continue;   // mês digitado à mão: não mexe
    try { lidos[mes] = await lerCustoDoMes(mes); } catch (e) { erros[mes] = (e && e.message) || "falha ao ler a DevMaster"; }
  }
  if (Object.keys(lidos).length) {
    const g = await gravar((custoMes) => { Object.keys(lidos).forEach((mes) => { custoMes[mes] = Object.assign({}, lidos[mes], { auto: true, atualizadoEm: new Date().toISOString() }); }); return custoMes; });
    if (g.erro) return { erro: g.erro, lidos: Object.keys(lidos) };
  }
  return { meses: Object.keys(lidos).map((m) => ({ mes: m, total: lidos[m].total, acertos: lidos[m].acertos, itens: lidos[m].itens })), erros: Object.keys(erros).length ? erros : undefined };
}

// ATUALIZAÇÃO AUTOMÁTICA DO CUSTO (Marcus, 16/11/2026: "tinha que ter uma ordem para todo dia 11h, 12h, atualizar sozinho").
// Além da rodada das 10h (automatico-dia.js), o custo do mês atual e do anterior é relido às 11h e às 12h (horário de Brasília). Para mudar as horas, troque HORAS_CUSTO.
// Cada hora roda UMA vez por dia (marca no módulo "autocusto"). Quem chama: (a) o agendador da Vercel (vercel.json, 14h e 15h UTC = 11h e 12h), (b) o relógio do servidor local (instrumentation.js).
export const HORAS_CUSTO = [11, 12];
const partesBR = (d) => { const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false }).formatToParts(d); const g = (t) => p.find((x) => x.type === t).value; return { dia: g("year") + "-" + g("month") + "-" + g("day"), hora: Number(g("hour")) % 24 }; };

export async function rodarCustoAgendado({ forcar = false } = {}) {
  const agora = partesBR(new Date());
  if (!forcar && !HORAS_CUSTO.includes(agora.hora)) return { esperando: true, hora: agora.hora, horas: HORAS_CUSTO };
  const m = await consulta("select conteudo from sorelly.estado_modulo where modulo = 'autocusto'");
  const feitas = m.rows[0] && m.rows[0].conteudo && m.rows[0].conteudo.dia === agora.dia ? (m.rows[0].conteudo.horas || []) : [];
  if (!forcar && feitas.includes(agora.hora)) return { ja: true, dia: agora.dia, hora: agora.hora };
  const r = await atualizarCustoDasSaidas({ mesAtual: agora.dia.slice(0, 7), maxAntigos: 0 });
  if (!r.erro) {
    const horas = feitas.includes(agora.hora) ? feitas : feitas.concat([agora.hora]);
    await consulta("insert into sorelly.estado_modulo (modulo, conteudo, versao, atualizado_por) values ('autocusto', $1::jsonb, 1, 'automatico') on conflict (modulo) do update set conteudo = excluded.conteudo, versao = sorelly.estado_modulo.versao + 1, atualizado_em = now()", [JSON.stringify({ dia: agora.dia, horas })]).catch(() => {});
  }
  return Object.assign({ dia: agora.dia, hora: agora.hora }, r);
}

// relógio do servidor local: confere a cada 10 minutos (idempotente; só roda nas horas de HORAS_CUSTO)
export function agendarCustoSaidas() {
  if (globalThis.__sorellyCustoAgendado) return;
  globalThis.__sorellyCustoAgendado = true;
  const checar = async () => { try { await rodarCustoAgendado(); } catch (e) { console.error("[custo-saida] falhou:", e && e.message); } };
  setTimeout(checar, 45000);
  setInterval(checar, 10 * 60 * 1000);
}

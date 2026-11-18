// Cadastro de peças › Pedidos › Peças (17/11/2026, pedido do Marcus): o que falta comprar por categoria, lido da DevMaster (API 2, SÓ LEITURA).
// Lê: produtos (dmaaa, grupo de cada peça), saldo em estoque (dmabq, almoxarifado 01 = principal) e as saídas (dmach + dmaci) do mês-base (outubro/2026) e do mês corrente.
// Conta e fatores: src/apps/montagem/domain/falta-comprar.js. Grava no módulo "cpc", chave `reposicao` (resumo por categoria, pequeno); o resto do módulo não é tocado.
// Quem chama: /api/automatico/reposicao (agendador da Vercel, uma vez por dia) e o botão "Atualizar" da tela (no máximo uma vez a cada 10 minutos).
import { consulta } from "./db.js";
import { consultarTabela } from "./devmaster2.js";
import { MES_BASE, MESES_PLANO, CATS_REP, GRUPO_CAT, FATORES_PADRAO } from "../apps/montagem/domain/falta-comprar.js";

const ALMOX_PRINCIPAL = "01";

// todas as páginas de uma tabela, SEM o teto de 30 mil linhas de todasAsPaginas (a lista de produtos tem mais de 37 mil)
async function todasAsPaginas(codigo, base) {
  let tudo = [];
  for (let pagina = 0; pagina < 400; pagina++) {
    let r, ultimo;
    for (let t = 0; t < 3; t++) { try { r = await consultarTabela(codigo, { ...base, pagina, registros: 500, ordem: "dm_id" }); break; } catch (e) { ultimo = e; await new Promise((ok) => setTimeout(ok, 1500)); } }
    if (!r) throw ultimo;
    tudo = tudo.concat(r.itens);
    if (r.registros < 500) break;
  }
  return tudo;
}
const LOTE = 200;
const r0 = (v) => Math.round(v);
const semCancelamento = (v) => { const d = String(v || ""); return !d || /^(0001|1899|1900)/.test(d); };
const faixaDoMes = (mes) => { const [a, m] = mes.split("-").map(Number); const u = new Date(a, m, 0).getDate(); return { de: `${mes}-01T00:00:00`, ate: `${mes}-${String(u).padStart(2, "0")}T23:59:59` }; };
const agoraBR = () => { const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); return p; };   // AAAA-MM-DD

// quantidade por produto que saiu no mês (todos os tipos de saída; item cancelado fora)
async function saidasPorProduto(mes, catDe) {
  const { de, ate } = faixaDoMes(mes);
  const vendas = await todasAsPaginas("dmach", { filtro: { ach_emissao: { gte: de, lte: ate } }, campos: ["ach_codigo", "ach_datacanc", "ach_emissao"] });
  const ok = vendas.filter((v) => semCancelamento(v.ach_datacanc));
  const porProduto = new Map();
  for (let i = 0; i < ok.length; i += LOTE) {
    const lote = await todasAsPaginas("dmaci", { filtro: { aci_venda: { in: ok.slice(i, i + LOTE).map((v) => v.ach_codigo) } }, campos: ["aci_produto", "aci_quantidade", "aci_cancelado"] });
    for (const it of lote) {
      if (it.aci_cancelado === "S") continue;
      if (!catDe(it.aci_produto)) continue;
      porProduto.set(it.aci_produto, (porProduto.get(it.aci_produto) || 0) + (Number(it.aci_quantidade) || 0));
    }
  }
  const diaAte = ok.reduce((m, v) => Math.max(m, Number(String(v.ach_emissao || "").slice(8, 10)) || 0), 0);
  return { porProduto, diaAte };
}

// lê tudo e devolve o resumo por categoria
export async function lerReposicao({ hoje = agoraBR() } = {}) {
  const mesAtual = hoje.slice(0, 7);
  const grupos = new Map();
  for (const p of await todasAsPaginas("dmaaa", { campos: ["aaa_codigo", "aaa_grupo"] })) { const c = GRUPO_CAT[String(p.aaa_grupo || "").trim()]; if (c) grupos.set(p.aaa_codigo, c); }
  if (!grupos.size) throw new Error("A DevMaster não devolveu os produtos.");
  const catDe = (cod) => grupos.get(cod) || null;

  const estoque = new Map();
  for (const s of await todasAsPaginas("dmabq", { filtro: { abq_almox: { in: [ALMOX_PRINCIPAL] }, abq_saldoatual: { gte: 1 } }, campos: ["abq_produto", "abq_saldoatual"] })) {
    if (catDe(s.abq_produto)) estoque.set(s.abq_produto, (estoque.get(s.abq_produto) || 0) + (Number(s.abq_saldoatual) || 0));
  }
  const base = await saidasPorProduto(MES_BASE, catDe);
  const atual = mesAtual === MES_BASE ? { porProduto: new Map(), diaAte: 0 } : await saidasPorProduto(mesAtual, catDe);

  const cats = {};
  CATS_REP.forEach(([k]) => { cats[k] = { saida: 0, estoque: 0, vivo: 0, parado: 0, modelos: 0, precisa: {}, faltaMod: {} }; MESES_PLANO.forEach(([h]) => { cats[k].precisa[h] = 0; cats[k].faltaMod[h] = { pecas: 0, modelos: 0 }; }); });
  for (const [cod, q] of base.porProduto) {
    const c = cats[catDe(cod)], f = FATORES_PADRAO[catDe(cod)]; if (!c || !f) continue;
    c.saida += q; c.modelos++;
    const jaSaiu = atual.porProduto.get(cod) || 0, est = estoque.get(cod) || 0;
    let acum = 0;   // necessidade acumulada até cada mês do plano
    for (const [h, mes] of MESES_PLANO) {
      if (mes >= mesAtual) acum += Math.max(q * f[h] - (mes === mesAtual ? jaSaiu : 0), 0);   // mês que já passou não conta; no mês corrente desconta o que já saiu
      c.precisa[h] += acum;
      const falta = acum - est;
      if (falta > 0) { c.faltaMod[h].pecas += falta; c.faltaMod[h].modelos++; }
    }
  }
  for (const [cod, q] of estoque) {
    const c = cats[catDe(cod)]; if (!c) continue;
    c.estoque += q;
    if ((base.porProduto.get(cod) || 0) + (atual.porProduto.get(cod) || 0) > 0) c.vivo += q; else c.parado += q;   // vivo = modelo que vendeu no mês-base ou no mês corrente
  }
  CATS_REP.forEach(([k]) => { const c = cats[k]; c.saida = r0(c.saida); c.estoque = r0(c.estoque); c.vivo = r0(c.vivo); c.parado = r0(c.parado);
    MESES_PLANO.forEach(([h]) => { c.precisa[h] = r0(c.precisa[h]); c.faltaMod[h].pecas = r0(c.faltaMod[h].pecas); }); });
  return { atualizadoEm: new Date().toISOString(), mesBase: MES_BASE, mesAtual, diaAte: atual.diaAte, almox: ALMOX_PRINCIPAL, cats };
}

// grava só a chave `reposicao`, com trava de versão (não pisa em quem está lançando pedido na mesma hora)
async function gravar(resumo) {
  for (let t = 0; t < 4; t++) {
    const r = await consulta("select versao from sorelly.estado_modulo where modulo = 'cpc'");
    if (!r.rows[0]) return { erro: "módulo cpc ainda não existe no servidor" };
    const u = await consulta("update sorelly.estado_modulo set conteudo = conteudo || $1::jsonb, versao = versao + 1, atualizado_por = 'automatico', atualizado_em = now() where modulo = 'cpc' and versao = $2",
      [JSON.stringify({ reposicao: resumo }), r.rows[0].versao]);
    if (u.rowCount) return { ok: true };
  }
  return { erro: "outra pessoa gravou ao mesmo tempo; tenta de novo" };
}

// roda a leitura. Sem `forcar`: só se a última leitura tem mais de `minutos` (padrão 10) e, no agendador (`cron`), se ainda não foi lida hoje.
export async function rodarReposicao({ forcar = false, cron = false, minutos = 10 } = {}) {
  const r = await consulta("select conteudo->'reposicao'->>'atualizadoEm' as em from sorelly.estado_modulo where modulo = 'cpc'");
  if (!r.rows[0]) return { erro: "módulo cpc ainda não existe no servidor" };
  const em = r.rows[0].em ? new Date(r.rows[0].em) : null;
  if (!forcar && em) {
    const min = (Date.now() - em.getTime()) / 60000;
    if (min < minutos) return { jaAtualizado: true, atualizadoEm: r.rows[0].em };
    if (cron && new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(em) === agoraBR()) return { jaAtualizado: true, atualizadoEm: r.rows[0].em };
  }
  const resumo = await lerReposicao();
  const g = await gravar(resumo);
  return g.erro ? { erro: g.erro } : { ok: true, atualizadoEm: resumo.atualizadoEm, mesAtual: resumo.mesAtual, diaAte: resumo.diaAte };
}

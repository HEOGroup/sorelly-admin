// Encomendas › Top 50 (17/11/2026, Marcus: "essas médias não vêm da DevMaster direto? Não pode editar ali"): vendas por mês e média de cada revendedora do setor, lidas das vendas da DevMaster (só leitura).
// Venda do mês = venda líquida (sem brinde) de 2026 (tabela sorelly.venda_composicao, a mesma da tela Revendedoras). Média = média das 3 últimas vendas pela regra de ultimasVendasDaMedia (docs/negocio/MEDIA-DE-VENDAS.md).
// A revendedora do setor (nome) é ligada à da DevMaster pelo nome (sem acento e sem diferença de maiúscula; se o nome de uma for parte do da outra e só houver UMA candidata, também vale).
import { consulta } from "./db.js";
import { listaRevendedoras, listaAgenda } from "./revendedoras.js";
import { vendasDoApp, chamarApp } from "./encomendas-ranking.js";
import { todasAsPaginas } from "./devmaster2.js";
import { composicaoGeral, situacaoBrindes } from "./vendas-brinde.js";

const G = globalThis;
const TTL = 10 * 60 * 1000;
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const chaveNome = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ").trim();
const PARTICULAS = new Set(["DA", "DE", "DO", "DOS", "DAS", "E"]);
const palavras = (t) => chaveNome(t).split(" ").filter((p) => p && !PARTICULAS.has(p));

export async function vendasDoSetor({ forcar = false } = {}) {
  if (!forcar && G.__sorellyEncVendas && Date.now() - G.__sorellyEncVendas.em < TTL) return G.__sorellyEncVendas.dados;
  const st = await situacaoBrindes();
  if (!st.pronto) return { pronto: false, itens: {}, semCadastro: [] };   // a carga das vendas ainda não terminou: a tela mostra o que já tem guardado
  const er = await consulta("select conteudo->'revendedoras' as r from sorelly.estado_modulo where modulo = 'er'");
  const revs = (er.rows[0] && er.rows[0].r) || [];
  const base = await listaRevendedoras();
  const exato = new Map();
  base.itens.forEach((i) => { const k = chaveNome(i.nome); (exato.get(k) || exato.set(k, []).get(k)).push(i); });
  const lista = base.itens.map((i) => ({ i, p: palavras(i.nome) }));
  const comp = await composicaoGeral();
  const itens = {}, semCadastro = [];
  revs.forEach((r) => {
    let achou = (exato.get(chaveNome(r.nome)) || [])[0];
    if (!achou) {   // nome mais curto inteiro dentro do mais longo (mínimo 2 palavras), só se houver uma candidata
      const mine = palavras(r.nome);
      if (mine.length >= 2) {
        const cand = lista.filter(({ p }) => p.length >= 2 && (mine.every((x) => p.includes(x)) || p.every((x) => mine.includes(x))));
        if (cand.length === 1) achou = cand[0].i;
      }
    }
    if (!achou) { semCadastro.push(r.id); return; }
    const c = comp.get(achou.cod) || { vm: {}, v: [] };
    const media = c.v.length ? r2(c.v.reduce((t, x) => t + x.v, 0) / c.v.length) : null;
    itens[r.id] = { cod: achou.cod, nome: achou.nome, vm: c.vm, v: c.v.map((x) => ({ d: x.d, v: x.v })), media, meses: c.v.length };
  });
  const dados = { pronto: true, itens, semCadastro };
  G.__sorellyEncVendas = { em: Date.now(), dados };
  return dados;
}

// a revendedora do app é ligada à da DevMaster pelo nome (mesma regra de vendasDoSetor)
async function acharNaDevMaster(nome) {
  const base = await listaRevendedoras();
  let achou = base.itens.find((i) => chaveNome(i.nome) === chaveNome(nome));
  if (!achou) {
    const mine = palavras(nome);
    if (mine.length >= 2) {
      const cand = base.itens.filter((i) => { const p = palavras(i.nome); return p.length >= 2 && (mine.every((x) => p.includes(x)) || p.every((x) => mine.includes(x))); });
      if (cand.length === 1) achou = cand[0];
    }
  }
  return achou || null;
}

// VENDAS DE UMA REVENDEDORA para a ficha Montar kit (Marcus, 24/11/2026: "as vendas dela, venda do app, valor médio e valor do kit, igual ao Top 100"):
// as 3 últimas vendas da DevMaster (com a data), a venda no app e o acerto previsto. A revendedora do app é ligada à da DevMaster pelo NOME, na mesma regra de vendasDoSetor.
// A média e o valor do kit são calculados na tela, pela mesma regra do Top 100 (venda do app de R$ 500 ou mais entra com as 2 últimas da DevMaster).
export async function vendasDaRevendedora(nome, userId) {
  const st = await situacaoBrindes();
  if (!st.pronto) return { pronto: false };
  const achou = await acharNaDevMaster(nome);
  if (!achou) return { pronto: true, semCadastro: true };
  if (!G.__sorellyCompGeral || Date.now() - G.__sorellyCompGeral.em > TTL) G.__sorellyCompGeral = { em: Date.now(), comp: await composicaoGeral() };
  const c = G.__sorellyCompGeral.comp.get(achou.cod) || { v: [] };
  const agenda = await listaAgenda().catch(() => null), a = (((agenda && agenda.itens) || []).find((i) => i.cod === achou.cod)) || {};
  const app = await vendasDoApp([achou.cod], new Map([[achou.cod, achou.nome]]));
  const vapp = app && app[achou.cod] !== undefined ? app[achou.cod] : null;
  // Enquanto a rota da representante estiver desligada no app (503 representante_disabled, 24/11/2026) o "vendido no ciclo" não vem; a rota admin do histórico mensal funciona: mostra o vendido no MÊS (não é o ciclo).
  let appMes = null;
  if (Number.isInteger(userId)) {
    try {
      const r = await chamarApp("GET", "/admin/resellers/" + userId + "/monthly-history");
      const ym = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7);
      const m = r && r.j && Array.isArray(r.j.data) ? r.j.data.find((x) => x.mes === ym) : null;
      appMes = m ? { mes: ym, total: r2(m.total_vendido), pecas: Number(m.pecas_vendidas) || 0 } : { mes: ym, total: 0, pecas: 0 };
    } catch (_) { appMes = null; }
  }
  return { pronto: true, cod: achou.cod, nome: achou.nome, v: c.v.slice(0, 3).map((x) => ({ d: x.d, v: x.v })), vapp, appMes, prev: a.prev || "", agendaEm: a.agendaEm || "" };
}

// ANÉIS VENDIDOS por tamanho (Marcus, 24/11/2026: "últimos 4 meses ela vendeu quantos anéis, de cada tamanho, em ordem de mais vendidos"): itens das vendas da revendedora (dmach + dmaci, só leitura)
// dos últimos 4 meses. A venda cancelada e o item cancelado ficam de fora, e só conta o que foi VENDIDO (brinde S009, premiação S011, indicação S007 e remessa de troca S006 não contam).
// O tamanho é o número que termina a descrição da peça (ex.: "ANEL FOLHEADO PRATA APARADOR CRAVEJADO 12", "ÚNICA/18"); sem número vira "Sem tamanho".
export async function aneisVendidos(cod, meses = 4) {
  const de = new Date(); de.setMonth(de.getMonth() - meses);
  const vendas = await todasAsPaginas("dmach", { filtro: { ach_cliente: String(cod), ach_emissao: { gte: `${de.toISOString().slice(0, 10)}T00:00:00` } }, campos: ["ach_codigo", "ach_datacanc"] });
  const codigos = vendas.filter((v) => { const d = String(v.ach_datacanc || ""); return !d || /^(0001|1899|1900)/.test(d); }).map((v) => v.ach_codigo);
  const NAO_VENDA = new Set(["S009", "S011", "S007", "S006"]);
  const por = new Map();
  let total = 0;
  for (let i = 0; i < codigos.length; i += 100) {
    const lote = await todasAsPaginas("dmaci", { filtro: { aci_venda: { in: codigos.slice(i, i + 100) }, aci_descricao: { like: "%ANEL%" } }, campos: ["aci_venda", "aci_descricao", "aci_quantidade", "aci_cancelado", "aci_tes"] });
    for (const it of lote) {
      if (it.aci_cancelado === "S" || NAO_VENDA.has(String(it.aci_tes || "").trim())) continue;
      const q = Number(it.aci_quantidade) || 0;
      if (q <= 0) continue;
      const m = String(it.aci_descricao || "").trim().match(/(\d{1,2})$/);
      const tam = m ? String(Number(m[1])) : "Sem tamanho";
      por.set(tam, (por.get(tam) || 0) + q); total += q;
    }
  }
  const tamanhos = [...por.entries()].map(([tam, qtd]) => ({ tam, qtd })).sort((a, b) => b.qtd - a.qtd || (Number(a.tam) || 99) - (Number(b.tam) || 99));
  return { meses, vendas: codigos.length, total, tamanhos };
}

// anéis vendidos pelo NOME da revendedora (a ficha Montar kit não precisa esperar as vendas para saber o código da DevMaster)
export async function aneisDaRevendedora(nome, meses = 4) {
  const achou = await acharNaDevMaster(nome);
  if (!achou) return { semCadastro: true, total: 0, tamanhos: [] };
  return aneisVendidos(achou.cod, meses);
}

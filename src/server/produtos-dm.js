// Preço e CUSTO das peças vindos da DevMaster (API 2, SÓ LEITURA, tabela de produtos dmaaa). Usado na Produção › "Produção por modelo" (17/11/2026, pedido do Marcus):
// digitou o código da peça produzida, o sistema busca o preço de venda e o custo e mostra quantos reais foram produzidos.
//   PREÇO = aaa_precobase (a tabela de preço da peça: 28, 38, 44, 88...); se vier zerado, vale aaa_precovenda.
//   CUSTO = compra (ou bruto, se a compra vier zerada) + banho + embalagem + etiquetas + tag. A DevMaster guarda cada parte num campo.
// Cache de 6 horas por código (preço e custo mudam pouco). Código que a DevMaster não conhece simplesmente não volta na lista.
import { consultarTabela } from "./devmaster2.js";

const TTL = 6 * 60 * 60 * 1000;
const LOTE = 150;
const cache = new Map();   // CODIGO → {t, dados|null}

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const r2 = (n) => Math.round(n * 100) / 100;
export const limpaCodigo = (c) => String(c || "").toUpperCase().replace(/\s+/g, "").trim();

function dadosDe(p) {
  const preco = num(p.aaa_precobase) > 0 ? num(p.aaa_precobase) : num(p.aaa_precovenda);
  const compra = num(p.aaa_custocompra) > 0 ? num(p.aaa_custocompra) : num(p.aaa_custobrt);
  const banho = num(p.aaa_custobanho), extras = num(p.aaa_custoembalagem) + num(p.aaa_custoetiquetas) + num(p.aaa_custotag);
  return { codigo: limpaCodigo(p.aaa_codigo), descricao: String(p.aaa_descricao || "").trim(), grupo: String(p.aaa_grupo || "").trim(), preco: r2(preco), custo: r2(compra + banho + extras), partes: { compra: r2(compra), banho: r2(banho), extras: r2(extras) } };
}

/** {CODIGO: {codigo, descricao, preco, custo, partes}} dos códigos pedidos que existem na DevMaster. */
export async function produtosDaDevmaster(codigos, { forcar = false } = {}) {
  const lista = [...new Set((codigos || []).map(limpaCodigo).filter(Boolean))].slice(0, 600);
  const agora = Date.now(), saida = {}, faltam = [];
  for (const c of lista) {
    const h = cache.get(c);
    if (!forcar && h && agora - h.t < TTL && (!h.dados || h.dados.grupo !== undefined)) { if (h.dados) saida[c] = h.dados; } else faltam.push(c);
  }
  for (let i = 0; i < faltam.length; i += LOTE) {
    const lote = faltam.slice(i, i + LOTE);
    const r = await consultarTabela("dmaaa", { campos: ["aaa_codigo", "aaa_descricao", "aaa_precobase", "aaa_precovenda", "aaa_custocompra", "aaa_custobrt", "aaa_custobanho", "aaa_custoembalagem", "aaa_custoetiquetas", "aaa_custotag", "aaa_grupo"], filtro: { aaa_codigo: { in: lote } }, registros: 500 });
    const achados = new Set();
    for (const p of r.itens || []) { const d = dadosDe(p); if (!d.codigo) continue; achados.add(d.codigo); saida[d.codigo] = d; cache.set(d.codigo, { t: agora, dados: d }); }
    for (const c of lote) if (!achados.has(c)) cache.set(c, { t: agora, dados: null });   // não existe na DevMaster: guarda para não perguntar toda hora
  }
  return saida;
}

// Encomendas › Top 50 (17/11/2026, Marcus: "essas médias não vêm da DevMaster direto? Não pode editar ali"): vendas por mês e média de cada revendedora do setor, lidas das vendas da DevMaster (só leitura).
// Venda do mês = venda líquida (sem brinde) de 2026 (tabela sorelly.venda_composicao, a mesma da tela Revendedoras). Média = média das 3 últimas vendas pela regra de ultimasVendasDaMedia (docs/negocio/MEDIA-DE-VENDAS.md).
// A revendedora do setor (nome) é ligada à da DevMaster pelo nome (sem acento e sem diferença de maiúscula; se o nome de uma for parte do da outra e só houver UMA candidata, também vale).
import { consulta } from "./db.js";
import { listaRevendedoras } from "./revendedoras.js";
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

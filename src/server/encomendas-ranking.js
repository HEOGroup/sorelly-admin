// Encomendas › Ranking (19/11/2026, Marcus): classificação das revendedoras pelo TOTAL de vendas dos últimos 3 meses (regra do Top 100, docs/setores/encomendas-e-reposicoes/regras-top100.md).
// Só leitura. Base: vendas sem brinde, troca, indicação e prêmio (tabela sorelly.venda_composicao, a mesma da média). Acertos do mesmo dia somam como um só, dia zerado não conta e o Leilão (vendedor EK) fica fora.
// Janela = de 3 meses atrás até hoje. "Posição antes" = o mesmo cálculo com a janela deslocada 1 mês para trás (quem subiu e quem caiu).
import { consulta } from "./db.js";
import { listaRevendedoras, nomeNormal } from "./revendedoras.js";
import { consultarTabela } from "./devmaster2.js";

const G = globalThis;
const TTL = 10 * 60 * 1000;
const LIMITE = 200;   // quantas posições a tela mostra
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

function hojeSP() {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return p;   // AAAA-MM-DD
}
// desloca uma data AAAA-MM-DD em n meses (dia limitado ao fim do mês)
function mesesAtras(iso, n) {
  const [a, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(a, m - 1 - n, 1)), ult = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  return t.getUTCFullYear() + "-" + String(t.getUTCMonth() + 1).padStart(2, "0") + "-" + String(Math.min(d, ult)).padStart(2, "0");
}

async function classificar(ini, fim) {
  const r = await consulta(`select cliente, to_char(coalesce(faturada, emissao), 'YYYY-MM-DD') as dia, vendedor, (venda_dm - (brinde + troca + indicacao + premiacao + outros)) as liq
    from sorelly.venda_composicao where coalesce(faturada, emissao) between $1 and $2`, [ini, fim]);
  const por = new Map();
  r.rows.forEach((x) => { if (x.vendedor === "EK") return; const m = por.get(x.cliente) || por.set(x.cliente, new Map()).get(x.cliente); m.set(x.dia, (m.get(x.dia) || 0) + Number(x.liq)); });
  const lista = [];
  por.forEach((m, cod) => {
    const dias = [...m].filter(([, v]) => v > 0.005).sort();
    if (!dias.length) return;
    const total = dias.reduce((s, [, v]) => s + v, 0);
    lista.push({ cod, total: r2(total), acertos: dias.length, media: r2(total / dias.length), ultimo: dias[dias.length - 1][0], ultimoValor: r2(dias[dias.length - 1][1]) });
  });
  lista.sort((a, b) => b.total - a.total || b.ultimoValor - a.ultimoValor || (a.ultimo < b.ultimo ? 1 : -1));
  lista.forEach((x, i) => { x.pos = i + 1; });
  return lista;
}

export async function rankingGeral({ forcar = false } = {}) {
  if (!forcar && G.__sorellyRanking && Date.now() - G.__sorellyRanking.em < TTL) return G.__sorellyRanking.dados;
  const fim = hojeSP(), ini = mesesAtras(fim, 3), fimAntes = mesesAtras(fim, 1), iniAntes = mesesAtras(fim, 4);
  const [agora, antes, base] = await Promise.all([classificar(ini, fim), classificar(iniAntes, fimAntes), listaRevendedoras()]);
  const posAntes = new Map(antes.map((x) => [x.cod, x.pos]));
  const topo = agora.slice(0, LIMITE), porCod = new Map(base.itens.map((i) => [i.cod, i]));
  const faltam = topo.filter((x) => !porCod.has(x.cod)).map((x) => x.cod), nomes = new Map();
  for (let i = 0; i < faltam.length; i += 100) {   // quem não tem condicional aberto: nome direto do cadastro
    const l = await consultarTabela("dmaam", { registros: 100, campos: ["aam_codigo", "aam_nome"], filtro: { aam_codigo: { in: faltam.slice(i, i + 100) } } });
    l.itens.forEach((p) => nomes.set(p.aam_codigo, nomeNormal(p.aam_nome)));
  }
  const itens = topo.map((x) => {
    const b = porCod.get(x.cod);
    return { pos: x.pos, cod: x.cod, nome: b ? b.nome : (nomes.get(x.cod) || x.cod), rep: b ? b.representante : "", total: x.total, media: x.media, acertos: x.acertos, ultimo: x.ultimo, posAntes: posAntes.get(x.cod) || null };
  });
  const dados = { pronto: true, geradoEm: new Date().toISOString(), janela: { ini, fim }, janelaAntes: { ini: iniAntes, fim: fimAntes }, limite: LIMITE, corte100: agora[99] ? agora[99].total : 0, corte150: agora[149] ? agora[149].total : 0, itens };
  G.__sorellyRanking = { dados, em: Date.now() };
  return dados;
}

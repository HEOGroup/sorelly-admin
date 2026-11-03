// Metas das revendedoras (Marcus, 02/11/2026): média ANTES do mês, metas do mês, venda do mês e situação de cada revendedora. Só leitura.
// Base: lista das revendedoras (src/server/revendedoras.js) + vendas sem brinde guardadas em sorelly.venda_composicao. Regras e contas: apps/montagem/domain/metas.js.
//  - Média = as até 3 últimas vendas ANTES do dia 1 do mês da campanha (regra de 27/10: sem brinde, mesmo dia junto, dia zerado fora, até 12 meses). Sem nenhuma venda = média 0 = classe Inicial.
//  - A meta vale para o PRÓXIMO ACERTO, em qualquer data (Marcus, 02/11/2026: quem acerta em dezembro continua com a meta de novembro). Vendeu = valor do PRIMEIRO acerto desde o dia 1 do mês da campanha (mesmo dia junto, sem brinde).
//    Sem acerto desde então = "Aguardando acerto".
//  - Quem só tem condicional de EXPOSITOR (sem kit) não entra: 67 em 02/11/2026 (2.114 → 2.047).
//  - Acerto previsto = previsão de devolução da condicional principal aberta (Kit principal; sem ele, Kit novo; sem ele, a primeira com previsão).
import { consulta } from "./db.js";
import { listaRevendedoras } from "./revendedoras.js";
import { ultimasVendasDaMedia } from "./vendas-brinde.js";
import { campanhaDe, classesDe, metasDe, situacaoDe } from "../apps/montagem/domain/metas.js";

const TTL = 5 * 60 * 1000;
const G = globalThis;

const soma = (l) => Math.round(l.reduce((s, x) => s + x.v, 0) * 100) / 100;

async function vendasPorCliente() {
  const r = await consulta(`select cliente, to_char(coalesce(faturada, emissao), 'YYYY-MM-DD') as dia, vendedor, (venda_dm - (brinde + troca + indicacao + premiacao + outros)) as liquida, brinde from sorelly.venda_composicao`);
  const por = new Map();
  r.rows.forEach((x) => { const l = por.get(x.cliente) || por.set(x.cliente, []).get(x.cliente); l.push({ data: x.dia, valor: Number(x.liquida), brinde: Number(x.brinde), vendedor: x.vendedor }); });
  return por;
}

function condicionalPrincipal(conds) {
  const abertas = (conds || []).filter((c) => c.t !== "Expositor" && c.d);
  return abertas.find((c) => c.t === "Kit principal") || abertas.find((c) => c.t === "Kit novo") || abertas[0] || null;
}

export async function metasRevendedoras({ mes, forcar = false, camp: campTeste } = {}) {   // camp: só para teste (campanha de outro mês)
  const camp = campTeste || campanhaDe(mes);
  // O que o Marcus define na tela Campanha fica em sorelly.estado_modulo (módulo metas, chave campanhas, por mês); a versão do módulo faz o cache valer só enquanto nada mudou.
  const est = await consulta("select conteudo->'campanhas' as campanhas, versao from sorelly.estado_modulo where modulo = 'metas'");
  const versao = est.rows[0] ? est.rows[0].versao : 0, ov = (est.rows[0] && est.rows[0].campanhas && est.rows[0].campanhas[camp.mes]) || null;
  if (!campTeste && !forcar && G.__sorellyMetas && G.__sorellyMetas.mes === camp.mes && G.__sorellyMetas.versao === versao && Date.now() - G.__sorellyMetas.em < TTL) return G.__sorellyMetas.dados;
  const [base, vendas] = await Promise.all([listaRevendedoras({ forcar }), vendasPorCliente()]);
  const inicio = camp.mes + "-01";
  const ant = camp.anterior ? campanhaDe(camp.anterior) : null, iniAnt = ant ? ant.mes + "-01" : "";
  const itens = base.itens.map((i) => {
    if (!(i.conds || []).some((c) => c.t !== "Expositor")) return null;   // só condicional de expositor: sem kit e sem acerto, fica fora das metas (Marcus, 02/11/2026)
    const todas = vendas.get(i.cod) || [];
    const antes = ultimasVendasDaMedia(todas.filter((x) => x.data < inicio));
    const media = antes.length ? Math.round(soma(antes) / antes.length * 100) / 100 : 0;
    const depois = ultimasVendasDaMedia(todas.filter((x) => x.data >= inicio));   // da mais nova para a mais antiga
    const primeiro = depois.length ? depois[depois.length - 1] : null;             // o primeiro acerto desde o início da campanha
    const vendeu = primeiro ? primeiro.v : null;
    const mt = metasDe(camp, media, ov), sit = situacaoDe(vendeu, mt.m1, mt.m2), cl = mt.classe;
    const ex = sit === "Bateu Meta 2" ? { bb: cl.bb2, normal: cl.no2 } : sit === "Bateu Meta 1" ? { bb: cl.bb1, normal: cl.no1 } : null;
    const c = condicionalPrincipal(i.conds);
    // Quem tinha a condicional aberta desde antes da campanha anterior e NÃO acertou desde então mantém a meta da anterior (Marcus, 02/11/2026): fica fora desta campanha.
    if (ant && c && c.e && c.e < iniAnt && !ultimasVendasDaMedia(todas.filter((x) => x.data >= iniAnt && x.data < inicio)).length) return null;
    return {
      cod: i.cod, nome: i.nome, rep: i.representante, classe: mt.classe.id, classeNome: mt.classe.nome, provisoria: !mt.classe.aprovada,
      media, vendasMedia: antes.map((x) => ({ d: x.d, v: x.v })), m1: mt.m1, m2: mt.m2, cond: c ? c.n : "", prev: c ? c.d : "", vendeu, acertoEm: primeiro ? primeiro.d : "", situacao: sit,
      extraBb: ex ? ex.bb : null, extraNormal: ex ? ex.normal : null,
      br1Bb: cl.bb1, br1No: cl.no1, br2Bb: cl.bb2, br2No: cl.no2   // brinde extra de cada meta (a tela mostra o objetivo de cada uma)
    };
  });
  const lista = itens.filter(Boolean);
  const dados = { mes: camp.mes, nomeMes: camp.nome, geradoEm: new Date().toISOString(), total: lista.length, regra: { pct1: camp.pct1, pct2: camp.pct2, piso1: camp.piso1, piso2: camp.piso2, ponto1: camp.ponto1, ponto2: camp.ponto2 },
    classes: classesDe(camp, ov).map((c) => ({ id: c.id, nome: c.nome, desc: c.desc, m1: c.m1, m2: c.m2, bb1: c.bb1, no1: c.no1, bb2: c.bb2, no2: c.no2, individual: !!c.individual, aprovada: !!c.aprovada, definida: !!c.definida, extra1: { bb: c.bb1, normal: c.no1 }, extra2: { bb: c.bb2, normal: c.no2 } })), itens: lista };
  if (!campTeste) G.__sorellyMetas = { mes: camp.mes, versao, em: Date.now(), dados };
  return dados;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// 60 s (23/11/2026): a carteira grande (Veridiana, 202 revendedoras) leva ~25 s com a base da DevMaster fria; com o limite padrão da Vercel a rota estourava e o app mostrava só 1 revendedora.
export const maxDuration = 60;
// Revendedoras de UMA representante, para o app dela (01/11/2026, Marcus). Só leitura, da DevMaster API 2.
//   GET /api/representante/revendedoras?rep=Dayanne   -> {rep, vendedor, total, itens:[{cod, nome, celular, cidade, prevDevol, vendas:[{d,v}] (3 últimas, sem brinde, mais nova primeiro)}]}
// O código do vendedor sai do NOME da representante (tabela de vendedores da DevMaster). Hoje a Diretoria vê qualquer representante; a representante só vê a si mesma (nome da conta).
import { erro, json, rota } from "@/server/http";
import { listaAgenda, listaRevendedoras, vendedores } from "@/server/revendedoras";
import { ler as lerApp } from "@/server/representantes-app";   // GET no backend do app, com as autoridades do sistema (antivírus do Windows)

// VENDA DO APP DA REVENDEDORA (23/11/2026, Marcus: "ela vê a revendedora já com a venda do app dela?"): o backend do app guarda, por revendedora da carteira,
// o que ela vendeu desde o último acerto (home-snapshots › totalSales), as peças e a data da última venda. Só leitura; falhou, a lista segue sem a venda do app.
const cacheApp = (globalThis.__sorellyVendaApp = globalThis.__sorellyVendaApp || new Map());
async function vendasDoApp(cod) {
  const c = cacheApp.get(cod); if (c && Date.now() - c.em < 60000) return c.mapa;
  const mapa = new Map();
  try {
    for (let page = 1; page <= 20; page++) {
      const r = await lerApp("/representantes/home-snapshots?representativeCod=" + encodeURIComponent(cod) + "&page=" + page + "&pageSize=100&incluirInativas=true");
      if (!r) { if (page === 1) return null; break; }
      const d = r.data || [];
      d.forEach((x) => mapa.set(String(x.userId).padStart(6, "0"), { venda: Number(x.totalSales) || 0, pecas: Number(x.piecesSold) || 0, em: x.lastSaleAt || null }));
      if (d.length < 100) break;
    }
  } catch { return null; }
  cacheApp.set(cod, { mapa, em: Date.now() });
  return mapa;
}

const sem = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

export const GET = rota(async (req, { eu, url }) => {
  // CONTA DE REPRESENTANTE (rep_cod = código do vendedor na DevMaster, 23/11/2026): vale SEMPRE o código da conta; o que vier no endereço é ignorado. Há 3 Vanessas na DevMaster: pelo nome não dá.
  const pedida = url.searchParams.get("rep") || (eu.repCod ? eu.nome : "");
  if (!pedida) return erro("Diga qual representante (?rep=nome).", 400);
  if (!eu.repCod && eu.perfil !== "ADMIN" && sem(eu.nome).split(" ")[0] !== sem(pedida).split(" ")[0]) return erro("A representante só vê as próprias revendedoras.", 403);
  const mapa = await vendedores();
  const alvo = sem(pedida).split(" ")[0];
  const forcado = eu.repCod || url.searchParams.get("vendedor");   // quando há vários vendedores com o mesmo primeiro nome (Jessica, Thalita), a Diretoria diz o código
  const achados = [...mapa.entries()].filter(([c, nome]) => forcado ? c === forcado : sem(nome).split(" ")[0] === alvo);
  if (achados.length !== 1) return json({ rep: pedida, vendedor: null, total: 0, itens: [], candidatos: achados.map(([c, n]) => ({ cod: c, nome: n })), aviso: achados.length ? "Mais de um vendedor com esse nome na DevMaster: passe ?vendedor=código." : "Nenhum vendedor da DevMaster com esse nome." });
  const cod = achados[0][0];
  const [dados, app] = await Promise.all([listaRevendedoras(), vendasDoApp(achados[0][0])]);   // a venda do app corre junto com a DevMaster (antes uma esperava a outra)
  // Data do acerto (05/11/2026, Marcus): a lista de revendedoras não traz a data; ela vem da AGENDA: a atividade ACERTOS marcada na DevMaster (vale a data dela) ou, sem atividade, a devolução prevista do kit (afi_prevdevol).
  const agenda = await listaAgenda().catch(() => null), quando = new Map(((agenda && agenda.itens) || []).map((a) => [a.cod, a.agendaEm || a.prev || null]));
  const itens = dados.itens.filter((i) => i.conds.some((c) => c.vd === cod && c.d)).map((i) => ({ cod: i.cod, nome: i.nome, celular: i.celular || "", cidade: i.cidade || "", prevDevol: quando.get(i.cod) || i.prevDevol || null, vendas: i.vendas || [] }));
  if (app) itens.forEach((i) => { const a = app.get(String(i.cod).padStart(6, "0")); if (a) { i.vendaApp = a.venda; i.pecasApp = a.pecas; i.vendaAppEm = a.em; } });
  return json({ rep: pedida, vendedor: cod, total: itens.length, comVendaDoApp: !!app, itens });
});

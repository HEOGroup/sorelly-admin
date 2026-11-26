export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// 60 s (23/11/2026): a carteira grande (Veridiana, 202 revendedoras) leva ~25 s com a base da DevMaster fria; com o limite padrão da Vercel a rota estourava e o app mostrava só 1 revendedora.
export const maxDuration = 60;
// Revendedoras de UMA representante, para o app dela (01/11/2026, Marcus). Só leitura, da DevMaster API 2.
//   GET /api/representante/revendedoras?rep=Dayanne   -> {rep, vendedor, total, itens:[{cod, nome, celular, cidade, prevDevol, vendas:[{d,v}] (3 últimas, sem brinde, mais nova primeiro)}]}
// O código do vendedor sai do NOME da representante (tabela de vendedores da DevMaster). Hoje a Diretoria vê qualquer representante; a representante só vê a si mesma (nome da conta).
import { erro, json, rota } from "@/server/http";
import { listaAgenda, listaRevendedoras, vendedores } from "@/server/revendedoras";
import { codigosDe } from "@/server/rep-codigos";
import { ler as lerApp } from "@/server/representantes-app";   // GET no backend do app, com as autoridades do sistema (antivírus do Windows)

// VENDA DO APP DA REVENDEDORA, DO MÊS, EM TEMPO REAL (26/11/2026, Marcus: "o admin da representante precisa ler o app da revendedora para que venha sempre o valor exato que ela vendeu no mês").
// Fonte: ranking do mês do próprio app (GET /admin/resellers/ranking?period=month), que traz TODAS as revendedoras de uma vez (3.197 em cerca de 2 s). Ele não depende do interruptor
// "App da representante" (a rota /representantes/home-snapshots devolve 503 quando esse interruptor está desligado). Guardado 60 segundos, igual para todas as representantes. id do app = código da revendedora.
// Só leitura. Falhou, a lista segue sem a venda do app.
async function vendasDoApp() {
  const g = (globalThis.__sorellyVendaMes = globalThis.__sorellyVendaMes || { em: 0, p: null });
  if (g.p && Date.now() - g.em < 60000) return g.p;
  const p = (async () => {
    const mapa = new Map();
    for (let off = 0; off < 10000; off += 500) {
      const r = await lerApp("/admin/resellers/ranking?period=month&limit=500&offset=" + off);
      const d = (r && r.data) || [];
      d.forEach((x) => mapa.set(String(x.id).padStart(6, "0"), { venda: Number(x.total_vendido) || 0, pecas: Number(x.total_itens_vendidos) || 0, em: x.ultimo_pedido || null }));
      if (d.length < 500) break;
    }
    return mapa;
  })();
  g.p = p; g.em = Date.now();
  p.catch(() => { if (g.p === p) g.p = null; });
  return p;
}

const sem = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

export const GET = rota(async (req, { eu, url }) => {
  // CONTA DE REPRESENTANTE (rep_cod = código do vendedor na DevMaster, 23/11/2026): vale SEMPRE o código da conta; o que vier no endereço é ignorado. Há 3 Vanessas na DevMaster: pelo nome não dá.
  const pedida = url.searchParams.get("rep") || (eu.repCod ? eu.nome : "");
  if (!pedida) return erro("Diga qual representante (?rep=nome).", 400);
  if (!eu.repCod && eu.perfil !== "ADMIN" && sem(eu.nome).split(" ")[0] !== sem(pedida).split(" ")[0]) return erro("A representante só vê as próprias revendedoras.", 403);
  const mapa = await vendedores();
  const alvo = sem(pedida).split(" ")[0];
  // MAIS DE UM CADASTRO (24/11/2026): a conta da Thalita traz BI, CU e CV; a carteira é a soma dos três.
  const meus = eu.repCod ? codigosDe(eu).filter((c) => mapa.has(c)) : [];
  const forcado = eu.repCod ? null : url.searchParams.get("vendedor");   // quando há vários vendedores com o mesmo primeiro nome (Jessica, Thalita), a Diretoria diz o código
  const achados = eu.repCod ? meus.map((c) => [c, mapa.get(c)]) : [...mapa.entries()].filter(([c, nome]) => forcado ? c === forcado : sem(nome).split(" ")[0] === alvo);
  if (eu.repCod ? !achados.length : achados.length !== 1) return json({ rep: pedida, vendedor: null, total: 0, itens: [], candidatos: achados.map(([c, n]) => ({ cod: c, nome: n })), aviso: achados.length ? "Mais de um vendedor com esse nome na DevMaster: passe ?vendedor=código." : "Nenhum vendedor da DevMaster com esse nome." });
  const cod = achados[0][0], codigos = achados.map(([c]) => c);
  const [dados, apps] = await Promise.all([listaRevendedoras(), vendasDoApp().then((m) => [m], () => [null])]);   // a venda do app corre junto com a DevMaster (antes uma esperava a outra)
  const app = apps.some(Boolean) ? new Map(apps.flatMap((m) => (m ? [...m.entries()] : []))) : null;
  // Data do acerto (05/11/2026, Marcus): a lista de revendedoras não traz a data; ela vem da AGENDA: a atividade ACERTOS marcada na DevMaster (vale a data dela) ou, sem atividade, a devolução prevista do kit (afi_prevdevol).
  const agenda = await listaAgenda().catch(() => null), quando = new Map(((agenda && agenda.itens) || []).map((a) => [a.cod, a.agendaEm || a.prev || null]));
  const itens = dados.itens.filter((i) => i.conds.some((c) => codigos.includes(c.vd) && c.d)).map((i) => ({ cod: i.cod, nome: i.nome, celular: i.celular || "", cidade: i.cidade || "", prevDevol: quando.get(i.cod) || i.prevDevol || null, vendas: i.vendas || [], vm: i.vm || {} }));   // vm = vendido líquido por mês calendário {"2026-11": valor}: o app mostra o mês atual de verdade
  if (app) itens.forEach((i) => { const a = app.get(String(i.cod).padStart(6, "0")); if (a) { i.vendaApp = a.venda; i.pecasApp = a.pecas; i.vendaAppEm = a.em; } });
  return json({ rep: pedida, vendedor: cod, total: itens.length, comVendaDoApp: !!app, itens });
});

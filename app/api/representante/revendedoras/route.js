export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Revendedoras de UMA representante, para o app dela (01/11/2026, Marcus). Só leitura, da DevMaster API 2.
//   GET /api/representante/revendedoras?rep=Dayanne   -> {rep, vendedor, total, itens:[{cod, nome, celular, cidade, prevDevol, vendas:[{d,v}] (3 últimas, sem brinde, mais nova primeiro)}]}
// O código do vendedor sai do NOME da representante (tabela de vendedores da DevMaster). Hoje a Diretoria vê qualquer representante; a representante só vê a si mesma (nome da conta).
import { erro, json, rota } from "@/server/http";
import { listaAgenda, listaRevendedoras, vendedores } from "@/server/revendedoras";

const sem = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

export const GET = rota(async (req, { eu, url }) => {
  const pedida = url.searchParams.get("rep") || "";
  if (!pedida) return erro("Diga qual representante (?rep=nome).", 400);
  if (eu.perfil !== "ADMIN" && sem(eu.nome).split(" ")[0] !== sem(pedida).split(" ")[0]) return erro("A representante só vê as próprias revendedoras.", 403);
  const mapa = await vendedores();
  const alvo = sem(pedida).split(" ")[0];
  const forcado = url.searchParams.get("vendedor");   // quando há vários vendedores com o mesmo primeiro nome (Jessica, Thalita), a Diretoria diz o código
  const achados = [...mapa.entries()].filter(([c, nome]) => forcado ? c === forcado : sem(nome).split(" ")[0] === alvo);
  if (achados.length !== 1) return json({ rep: pedida, vendedor: null, total: 0, itens: [], candidatos: achados.map(([c, n]) => ({ cod: c, nome: n })), aviso: achados.length ? "Mais de um vendedor com esse nome na DevMaster: passe ?vendedor=código." : "Nenhum vendedor da DevMaster com esse nome." });
  const cod = achados[0][0], dados = await listaRevendedoras();
  // Data do acerto (05/11/2026, Marcus): a lista de revendedoras não traz a data; ela vem da AGENDA: a atividade ACERTOS marcada na DevMaster (vale a data dela) ou, sem atividade, a devolução prevista do kit (afi_prevdevol).
  const agenda = await listaAgenda().catch(() => null), quando = new Map(((agenda && agenda.itens) || []).map((a) => [a.cod, a.agendaEm || a.prev || null]));
  const itens = dados.itens.filter((i) => i.conds.some((c) => c.vd === cod && c.d)).map((i) => ({ cod: i.cod, nome: i.nome, celular: i.celular || "", cidade: i.cidade || "", prevDevol: quando.get(i.cod) || i.prevDevol || null, vendas: i.vendas || [] }));
  return json({ rep: pedida, vendedor: cod, total: itens.length, itens });
});

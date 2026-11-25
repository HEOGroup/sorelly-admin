export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// Campanhas da Meta Ads (tráfego) no período + o funil dos leads com a tag FACEBOOK ADS (25/11/2026, src/server/cadastro-relatorios.js).
//   GET /api/cadastro/campanhas?de=AAAA-MM-DD&ate=AAAA-MM-DD   (sem datas = últimos 730 dias)
import { erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { campanhasMeta, estoqueDesempenho } from "@/server/cadastro-relatorios";

// erro com código (404, 409, 502...) volta com a mensagem certa para a tela
const comMensagem = (fn) => async (req, ctx) => { try { return await fn(req, ctx); } catch (e) { if (e && e.statusCode && e.statusCode !== 500) return erro(e.message, e.statusCode); throw e; } };

export const GET = rota(comMensagem(async (req, { eu, url }) => {
  if (!podeModulo(eu, "cl")) return erro("Você não tem acesso ao Cadastro de revendedoras.", 403);
  const de = url.searchParams.get("de"), ate = url.searchParams.get("ate");
  const [m, est] = await Promise.all([campanhasMeta(de, ate), estoqueDesempenho(de, ate).catch((e) => ({ erro: e.message }))]);
  return json({ periodo: m.periodo, contas: m.contas, campanhas: m.campanhas, fb: est.fb || null, erroKommo: est.erro || null, atualizadoEm: m.atualizadoEm });
}));

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// Anúncios de uma campanha da Meta Ads no período (25/11/2026).   GET /api/cadastro/campanhas/<id>?de=&ate=
import { erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { anunciosMeta } from "@/server/cadastro-relatorios";

// erro com código (404, 409, 502...) volta com a mensagem certa para a tela
const comMensagem = (fn) => async (req, ctx) => { try { return await fn(req, ctx); } catch (e) { if (e && e.statusCode && e.statusCode !== 500) return erro(e.message, e.statusCode); throw e; } };

export const GET = rota(comMensagem(async (req, { eu, params, url }) => {
  if (!podeModulo(eu, "cl")) return erro("Você não tem acesso ao Cadastro de revendedoras.", 403);
  return json(await anunciosMeta(params.id, url.searchParams.get("de"), url.searchParams.get("ate")));
}));

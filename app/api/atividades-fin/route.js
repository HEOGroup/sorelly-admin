export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// Atividades do Financeiro (18/11/2026): o que cada pessoa fez no financeiro da DevMaster nos últimos dias (só leitura, cache de 10 min).
//   GET /api/atividades-fin?dias=1|7|30   (&agora=1 ignora o cache)
// ACESSO RESTRITO: só quem está em LEITORES_ATIVIDADES_FIN (src/server/atividades-fin.js), conferido pelo pessoaId da conta.
import { erro, json, rota } from "@/server/http";
import { atividadesFinanceiro, podeVerAtividadesFin } from "@/server/atividades-fin";

export const GET = rota(async (req, { eu, url }) => {
  if (!podeVerAtividadesFin(eu)) return erro("Só quem foi liberado abre as atividades do Financeiro.", 403);
  try { return json(await atividadesFinanceiro({ dias: Number(url.searchParams.get("dias")) || 7, forcar: url.searchParams.get("agora") === "1" })); }
  catch (x) { return erro(x.message || "A DevMaster não respondeu.", x.statusCode || 503); }
});

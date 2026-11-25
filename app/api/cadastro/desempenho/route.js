export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// Funil Desempenho ao vivo da Kommo (25/11/2026): quantos leads criados no período estão em cada valor do campo Desempenho (src/server/cadastro-relatorios.js).
//   GET /api/cadastro/desempenho?de=AAAA-MM-DD&ate=AAAA-MM-DD   (sem datas = tudo)
import { erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { estoqueDesempenho } from "@/server/cadastro-relatorios";

// erro com código (404, 409, 502...) volta com a mensagem certa para a tela
const comMensagem = (fn) => async (req, ctx) => { try { return await fn(req, ctx); } catch (e) { if (e && e.statusCode && e.statusCode !== 500) return erro(e.message, e.statusCode); throw e; } };

export const GET = rota(comMensagem(async (req, { eu, url }) => {
  if (!podeModulo(eu, "cl")) return erro("Você não tem acesso ao Cadastro de revendedoras.", 403);
  return json(await estoqueDesempenho(url.searchParams.get("de"), url.searchParams.get("ate")));
}));

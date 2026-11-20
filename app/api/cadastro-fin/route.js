export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// Financeiro › Cadastro (20/11/2026): formas de pagamento (tipos de numerário) e bancos da DevMaster, com dono, uso em 90 dias e o que arrumar. Só leitura, cache de 30 min.
//   GET /api/cadastro-fin   (&agora=1 ignora o cache). Financeiro e Diretoria.
import { erro, json, rota } from "@/server/http";
import { cadastroFinanceiro } from "@/server/cadastro-fin";

export const GET = rota(async (req, { eu, url }) => {
  if (eu.perfil !== "ADMIN" && !(eu.setores || []).includes("financeiro")) return erro("Só o Financeiro e a Diretoria podem ver isso.", 403);
  try { return json(await cadastroFinanceiro({ forcar: url.searchParams.get("agora") === "1" })); }
  catch (x) { return erro(x.message || "A DevMaster não respondeu.", x.statusCode || 503); }
});

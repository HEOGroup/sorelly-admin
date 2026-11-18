export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Encomendas e reposições: o que a revendedora respondeu no link. GET /api/encomendas/link/retorno?ids=a,b → { [linkId]: { retorno, publicadoEm } }
import { erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { retornos } from "@/server/pedido-link";

export const GET = rota(async (req, { eu, url }) => {
  if (!podeModulo(eu, "er")) return erro("Você não tem acesso a este módulo.", 403);
  return json(await retornos(String(url.searchParams.get("ids") || "").split(",")));
});

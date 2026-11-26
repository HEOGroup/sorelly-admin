export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// Encomendas › Top 100: venda no app (vendido no ciclo) das revendedoras do Top 100, lida do app da revendedora (só leitura; cache de 60 s).
//   GET /api/encomendas/venda-app  →  { pronto, itens: { [idDaRevendedoraNoSetor]: valor }, semApp }
import { erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { vendaAppDoSetor } from "@/server/encomendas-vendas";

export const GET = rota(async (req, { eu, url }) => {
  if (!podeModulo(eu, "er")) return erro("Você não tem acesso a este módulo.", 403);
  return json(await vendaAppDoSetor({ forcar: url.searchParams.get("atualizar") === "1" }));
});

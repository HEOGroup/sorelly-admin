export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// Encomendas › Ranking: classificação pelo total de vendas dos últimos 3 meses (só leitura; cache de 10 min).
//   GET /api/encomendas/ranking  →  { pronto, janela, itens: [{pos, cod, nome, rep, total, media, acertos, ultimo, posAntes}], corte100, corte150 }
import { erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { rankingGeral } from "@/server/encomendas-ranking";

export const GET = rota(async (req, { eu, url }) => {
  if (!podeModulo(eu, "er")) return erro("Você não tem acesso a este módulo.", 403);
  return json(await rankingGeral({ forcar: url.searchParams.get("atualizar") === "1" }));
});

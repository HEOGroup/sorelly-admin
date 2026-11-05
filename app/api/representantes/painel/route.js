export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Painel das representantes com dados reais do app (Marcus, 05/11/2026). Só a Diretoria; só leitura; cache de 5 min.
//   GET /api/representantes/painel            -> {atualizadoEm, total, falhas, itens:[{cod, nome, ativo, comissaoPct, revendedorasNoApp, revendedorasComVenda, vendido, valorAcerto, pecas, condicionais, acertoMaisCedo, leitura}]}
//   GET /api/representantes/painel?atualizar=1 ignora o cache
import { erro, json, rota } from "@/server/http";
import { painelRepresentantes } from "@/server/representantes-app";

export const GET = rota(async (req, { eu, url }) => {
  if (eu.perfil !== "ADMIN") return erro("Só a Diretoria pode fazer isso.", 403);
  return json(await painelRepresentantes({ forcar: url.searchParams.get("atualizar") === "1" }));
});

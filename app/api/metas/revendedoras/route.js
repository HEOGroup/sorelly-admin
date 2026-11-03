export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Metas das revendedoras do mês (Marcus, 02/11/2026). Só a Diretoria nesta primeira versão; leitura somente; cache de 5 min.
//   GET /api/metas/revendedoras?mes=2026-11            lista    |    &atualizar=1 ignora o cache
import { erro, json, rota } from "@/server/http";
import { metasRevendedoras } from "@/server/metas";

export const GET = rota(async (req, { eu, url }) => {
  if (eu.perfil !== "ADMIN") return erro("Só a Diretoria pode fazer isso.", 403);
  return json(await metasRevendedoras({ mes: url.searchParams.get("mes") || "", forcar: url.searchParams.get("atualizar") === "1" }));
});

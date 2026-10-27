export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Lista das revendedoras (condicional aberto com previsão em 2026), lida da DevMaster API 2. Só a Diretoria nesta primeira versão; leitura somente; cache de 10 min.
//   GET /api/revendedoras            lista    |    ?atualizar=1 ignora o cache
import { json, rota } from "@/server/http";
import { listaRevendedoras } from "@/server/revendedoras";

export const GET = rota(async (req, { url }) => json(await listaRevendedoras({ forcar: url.searchParams.get("atualizar") === "1" })), { diretoria: true });

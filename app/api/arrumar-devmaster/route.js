export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// Arrumar na DevMaster (19/11/2026): títulos com problema que só se corrigem na DevMaster (só leitura, cache de 5 min). Financeiro e Diretoria. ?agora=1 ignora o cache.
import { erro, json, rota } from "@/server/http";
import { arrumarDevmaster } from "@/server/arrumar-devmaster";

export const GET = rota(async (req, { eu, url }) => {
  if (eu.perfil !== "ADMIN" && !(eu.setores || []).includes("financeiro")) return erro("Só o Financeiro e a Diretoria podem ver isso.", 403);
  try { return json(await arrumarDevmaster({ forcar: url.searchParams.get("agora") === "1" })); }
  catch (x) { return erro(x.message || "A DevMaster não respondeu.", x.statusCode || 503); }
});

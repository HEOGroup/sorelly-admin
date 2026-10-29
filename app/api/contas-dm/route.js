export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// Contas a pagar e contas pagas da DevMaster (só leitura, cache de 10 min): Financeiro e Diretoria. ?agora=1 ignora o cache.
import { erro, json, rota } from "@/server/http";
import { contasDaDevmaster } from "@/server/contas-dm";

export const GET = rota(async (req, { eu, url }) => {
  if (eu.perfil !== "ADMIN" && !(eu.setores || []).includes("financeiro")) return erro("Só o Financeiro e a Diretoria podem ver isso.", 403);
  return json(await contasDaDevmaster({ forcar: url.searchParams.get("agora") === "1" }));
});

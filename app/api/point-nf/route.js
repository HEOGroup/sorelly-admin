export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// Boletos da Point (DevMaster, só leitura) ligados pela nota fiscal: Financeiro e Diretoria. ?agora=1 ignora o cache.
import { erro, json, rota } from "@/server/http";
import { boletosDaPoint } from "@/server/point-nf";

export const GET = rota(async (req, { eu, url }) => {
  if (eu.perfil !== "ADMIN" && !(eu.setores || []).includes("financeiro")) return erro("Só o Financeiro e a Diretoria podem ver isso.", 403);
  try { return json(await boletosDaPoint({ forcar: url.searchParams.get("agora") === "1" })); } catch (x) { return erro(x.message, x.statusCode || 500); }
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;
// Financeiro › Cadastro › Numerários (25/11/2026): cópia dos tipos de numerário da DevMaster, refeita pelo menos uma vez por dia (ver src/server/numerarios.js).
//   GET /api/numerarios   (?agora=1 refaz a cópia agora). Financeiro e Diretoria.
import { erro, json, rota } from "@/server/http";
import { numerariosDoDia } from "@/server/numerarios";

export const GET = rota(async (req, { eu, url }) => {
  if (eu.perfil !== "ADMIN" && !(eu.setores || []).includes("financeiro")) return erro("Só o Financeiro e a Diretoria podem ver isso.", 403);
  try { return json(await numerariosDoDia({ forcar: url.searchParams.get("agora") === "1" })); }
  catch (x) { return erro(x.message || "A DevMaster não respondeu.", x.statusCode || 503); }
});

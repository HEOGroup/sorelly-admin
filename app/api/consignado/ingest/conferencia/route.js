export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Auditoria dos acertos, SOMENTE LEITURA (serviço, x-ingest-key). Marcus, 28/11/2026: conferir se o que foi gravado é o que a conta oficial dá.
//   GET /api/consignado/ingest/conferencia?desde=AAAA-MM-DD -> {desde, total, conferidos, semMemoria, divergentes:[{chave, data, rep, regras, divergencias:[{campo, gravado, conta}]}]}
// Refaz a conta de cada acerto com as regras oficiais (src/server/acerto-conferir.js). Acerto antigo, sem memória de cálculo, não é recalculado (conta em semMemoria).
// Não grava nada. Não existe POST, PUT nem DELETE.
import { ok, recusa, rotaServico } from "@/server/servico";
import { auditarAcertos } from "@/server/acerto-conferir";

export const GET = rotaServico(async (req) => {
  const desde = String(new URL(req.url).searchParams.get("desde") || "2026-11-27");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(desde)) throw recusa("desde inválida (AAAA-MM-DD).", 400);
  return ok(await auditarAcertos(desde));
});

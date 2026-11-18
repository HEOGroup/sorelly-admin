export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Completar o valor do kit de um registro (a montadora registra sem ver dinheiro; a supervisão completa).
import { corpo, erro, json, rota } from "@/server/http";
import { definirValor, podeMontagem } from "@/server/montagem-kit";

export const PATCH = rota(async (req, { eu, params }) => {
  if (!podeMontagem(eu)) return erro("Só o setor Montagem e a Diretoria mudam os registros de montagem.", 403);
  const b = await corpo(req);
  try { return json(await definirValor(params.id, b.valorKit)); }
  catch (e) { if (e && e.statusCode === 404) return erro(e.message, 404); throw e; }
});

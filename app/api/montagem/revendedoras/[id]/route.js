export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Preferências de UMA revendedora, lidas agora do app (tela de montar), com as montagens já registradas dela.
import { erro, json, rota } from "@/server/http";
import { detalheRevendedora, podeMontagem } from "@/server/montagem-kit";

export const GET = rota(async (req, { eu, params }) => {
  if (!podeMontagem(eu)) return erro("Só o setor Montagem e a Diretoria abrem a Fila de montagem.", 403);
  const id = Number(params.id);
  if (!Number.isInteger(id)) return erro("Revendedora inválida.", 400);
  try { return json(await detalheRevendedora(id)); }
  catch (e) { if (e && e.statusCode === 404) return erro(e.message, 404); throw e; }
});

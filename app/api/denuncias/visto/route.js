export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// POST /api/denuncias/visto  RESTRITO (quem lê as denúncias): marca como vistas, para esta pessoa, as denúncias que ela pode ler. O alerta "Entendi" chama esta rota.
import { json, erro, rota } from "@/server/http";
import { marcarVistas, podeVerDenuncias } from "@/server/denuncias";

export const POST = rota(async (req, { eu }) => {
  if (!podeVerDenuncias(eu)) return erro("Só quem foi liberado abre o canal de denúncias.", 403);
  await marcarVistas(eu);
  return json({ ok: true });
});

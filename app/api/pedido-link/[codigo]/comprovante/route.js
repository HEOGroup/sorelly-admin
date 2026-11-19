export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// A revendedora manda o comprovante da taxa de entrega. POST { key } (a foto já subiu em /foto). Não libera o pedido: a equipe confere.
import { corpo, erro, json, rota } from "@/server/http";
import { enviarComprovante } from "@/server/pedido-link";

export const POST = rota(async (req, { params }) => {
  const b = await corpo(req, 4 * 1024);
  try { await enviarComprovante(String(params.codigo || ""), String(b.key || "")); return json({ ok: true }); }
  catch (x) { if (x && [400, 404, 410].includes(x.statusCode)) return erro(x.message, x.statusCode); throw x; }
}, { publica: true });

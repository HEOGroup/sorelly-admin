export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// A revendedora marca no link as peças que quer. POST { quer: ["SP0615", ...], obs }  (vale a última resposta)
import { corpo, erro, json, rota } from "@/server/http";
import { aprovarPecas } from "@/server/pedido-link";

export const POST = rota(async (req, { params }) => {
  const b = await corpo(req, 16 * 1024);
  try { return json({ ok: true, retorno: await aprovarPecas(String(params.codigo || ""), { quer: b.quer, obs: b.obs }) }); }
  catch (x) { if (x && [404, 410].includes(x.statusCode)) return erro(x.message, x.statusCode); throw x; }
}, { publica: true });

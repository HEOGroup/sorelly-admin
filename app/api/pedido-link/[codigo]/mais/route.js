export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Pedido extra: depois de ver as peças encontradas, a revendedora pede mais (máx. 2 vezes). POST { fotos: [{ key, cor, obs }], textos: [{ cor, obs }], obs } → { n }
import { corpo, erro, json, rota } from "@/server/http";
import { maisPecas } from "@/server/pedido-link";

export const POST = rota(async (req, { params }) => {
  const b = await corpo(req, 64 * 1024);
  try { return json({ n: await maisPecas(String(params.codigo || ""), { fotos: b.fotos, textos: b.textos, obs: b.obs }) }); }
  catch (x) { if (x && [404, 410].includes(x.statusCode)) return erro(x.message, x.statusCode); throw x; }
}, { publica: true });

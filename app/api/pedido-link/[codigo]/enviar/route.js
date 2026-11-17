export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Fecha o pedido por link. POST { tipo: "reposicao"|"encomenda", fotos: [{ key, cor, obs }], textos: [{ cor, obs }] (peças só descritas, sem foto), obs, aceite }  (vale uma vez e só dentro das 48 horas)
import { corpo, erro, json, rota } from "@/server/http";
import { enviarPedido } from "@/server/pedido-link";

export const POST = rota(async (req, { params }) => {
  const b = await corpo(req, 64 * 1024);
  try { await enviarPedido(String(params.codigo || ""), { tipo: b.tipo, fotos: b.fotos, textos: b.textos, obs: b.obs, aceite: b.aceite === true, entrega: b.entrega, forma: b.forma, retirada: b.retirada }); return json({ ok: true }); }
  catch (x) { if (x && [404, 410].includes(x.statusCode)) return erro(x.message, x.statusCode); throw x; }
}, { publica: true });

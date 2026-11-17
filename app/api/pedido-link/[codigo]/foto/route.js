export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// Uma foto do pedido por link (a página reduz a foto antes de mandar). POST { nome, url: "data:image/jpeg;base64,..." } → { key }
import { corpo, erro, json, rota } from "@/server/http";
import { gravarFoto } from "@/server/pedido-link";

export const POST = rota(async (req, { params }) => {
  const b = await corpo(req, 4.4 * 1024 * 1024);
  try { return json({ key: await gravarFoto(String(params.codigo || ""), { nome: b.nome, url: b.url }) }); }
  catch (x) { if (x && [404, 410].includes(x.statusCode)) return erro(x.message, x.statusCode); throw x; }
}, { publica: true });

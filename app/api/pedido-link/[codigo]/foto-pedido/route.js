export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Foto que a revendedora mandou no pedido dela, para ela rever no link. GET /api/pedido-link/<codigo>/foto-pedido?key=an_xxx → a imagem
import { erro, rota } from "@/server/http";
import { fotoDoPedido } from "@/server/pedido-link";

export const GET = rota(async (req, { params, url }) => {
  try {
    const f = await fotoDoPedido(String(params.codigo || ""), url.searchParams.get("key"));
    if (!f) return erro("Sem foto.", 404);
    return new Response(new Uint8Array(f.bytes), { headers: { "content-type": f.mime, "cache-control": "private, max-age=300" } });
  } catch (x) { return erro("Sem foto.", 404); }
}, { publica: true });

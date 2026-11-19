export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Comprovante do link POR PEDIDO (19/11/2026): só abre se o pagamento estiver ligado a um pedido do link. Somente leitura.
import { comprovanteDoEscopo, lerEscopo } from "@/server/acerto-pedidos";

export async function GET(req, ctx) {
  try {
    const p = await ctx.params, r = await lerEscopo(String((p && p.token) || "")), id = Number(p && p.id);
    if (!r || !Number.isInteger(id)) return new Response("Não encontrado.", { status: 404 });
    const a = await comprovanteDoEscopo(r.pf, r.escopo, id);
    if (!a) return new Response("Não encontrado.", { status: 404 });
    const m = /^data:([^;]+);base64,(.*)$/.exec(a.url || "");
    if (!m) return new Response("Não encontrado.", { status: 404 });
    return new Response(Buffer.from(m[2], "base64"), { status: 200, headers: { "content-type": m[1], "content-disposition": "inline; filename=\"" + String(a.nome || "comprovante").replace(/[^A-Za-z0-9._ -]/g, "_") + "\"", "cache-control": "private, no-store", "x-robots-tag": "noindex" } });
  } catch (e) {
    return new Response("Indisponível agora.", { status: 503 });
  }
}

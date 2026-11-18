export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Comprovante de um Pix do acerto (18/11/2026): só abre se o Pix for da data do link. Ver src/server/acerto-link.js.
import { comprovanteAcerto } from "@/server/acerto-link";

export async function GET(req, { params }) {
  try {
    const p = await params, a = await comprovanteAcerto(String(p.codigo || ""), String(p.id || ""));
    if (!a) return new Response("Comprovante não encontrado.", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
    return new Response(a.dados, { headers: { "content-type": a.mime, "content-disposition": "inline; filename=\"" + encodeURIComponent(a.nome) + "\"", "cache-control": "private, max-age=300", "x-robots-tag": "noindex, nofollow" } });
  } catch (x) {
    return new Response("Não foi possível abrir o comprovante agora.", { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
}

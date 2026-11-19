export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Link de conferência da listagem de cartão (Maquininha Banho) de um mês (18/11/2026): página PÚBLICA, só leitura. Ver src/server/acerto-link.js.
import { PAGINA_ERRO, paginaCartao } from "@/server/acerto-link";

const html = (corpo, status) => new Response(corpo, { status: status || 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } });

export async function GET(req, { params }) {
  try {
    const p = await params, h = await paginaCartao(String(p.codigo || ""));
    if (!h) return html(PAGINA_ERRO("Link não encontrado", "Confira se o link foi copiado inteiro. Se continuar, peça um link novo ao Grupo Sorelly."), 404);
    return html(h);
  } catch (x) {
    return html(PAGINA_ERRO("Não foi possível abrir agora", "Tente de novo em alguns minutos."), 500);
  }
}

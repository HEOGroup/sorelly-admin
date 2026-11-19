export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Página pública do relatório POR PEDIDO (19/11/2026, src/server/acerto-pedidos.js): só leitura, só os pedidos do link, sem login.
import { lerEscopo } from "@/server/acerto-pedidos";
import { htmlPedidos } from "@/apps/montagem/lib/relatorio-pedidos-pf";

const pagina = (corpo, status) => new Response(corpo, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } });

export async function GET(req, ctx) {
  try {
    const p = await ctx.params, token = String((p && p.token) || "");
    const r = await lerEscopo(token);
    if (!r) return pagina("<!doctype html><meta charset=utf-8><title>Link inválido</title><body style=\"background:#0f1115;color:#fff;font:13px Inter,sans-serif;text-align:center;padding:40px\">Link inválido ou desativado.</body>", 404);
    const comp = (l) => (l.arqKey ? "/acerto/" + token + "/comprovante/" + l.id : "");
    return pagina(htmlPedidos(r.pf, r.escopo.fornId, r.escopo.pedidos, comp, { geradoEm: new Date().toISOString().slice(0, 10), boleto: !!r.escopo.boleto }), 200);
  } catch (e) {
    console.warn("[acerto-pedidos] " + (e && e.message));
    return pagina("<!doctype html><meta charset=utf-8><body style=\"background:#0f1115;color:#fff;font:13px Inter,sans-serif;text-align:center;padding:40px\">Não foi possível abrir o demonstrativo agora. Tente de novo em alguns minutos.</body>", 503);
  }
}

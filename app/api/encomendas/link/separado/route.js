export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Encomendas e reposições: o setor separou as peças; o link da revendedora passa a pedir a taxa. POST { linkId, cods: [códigos das peças que foram separadas] }
import { corpo, erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { marcarSeparado } from "@/server/pedido-link";

export const POST = rota(async (req, { eu }) => {
  if (!podeModulo(eu, "er")) return erro("Você não tem acesso a este módulo.", 403);
  const b = await corpo(req, 4 * 1024);
  try { await marcarSeparado(String(b.linkId || ""), eu && (eu.nome || eu.id), Array.isArray(b.cods) ? b.cods.slice(0, 150) : []); return json({ ok: true }); }
  catch (x) { if (x && x.statusCode === 400) return erro(x.message, 400); throw x; }
});

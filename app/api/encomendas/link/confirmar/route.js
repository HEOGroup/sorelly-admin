export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Encomendas e reposições: a equipe conferiu o comprovante da taxa. POST { linkId } lança a taxa paga no Contas a receber e no Contas a pagar.
import { corpo, erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { confirmarTaxa } from "@/server/taxa-entrega";

export const POST = rota(async (req, { eu }) => {
  if (!podeModulo(eu, "er")) return erro("Você não tem acesso a este módulo.", 403);
  const b = await corpo(req, 2 * 1024);
  try { await confirmarTaxa(eu, String(b.linkId || "")); return json({ ok: true }); }
  catch (x) { if (x && (x.statusCode === 400 || x.statusCode === 404)) return erro(x.message, x.statusCode); throw x; }
});

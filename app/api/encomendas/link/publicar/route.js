export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Encomendas e reposições: o setor publica as peças encontradas no link da revendedora. POST { linkId, pecas: [{ cod, desc, preco, anexo }] }
import { corpo, erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { publicarPecas } from "@/server/pedido-link";

export const POST = rota(async (req, { eu }) => {
  if (!podeModulo(eu, "er")) return erro("Você não tem acesso a este módulo.", 403);
  const b = await corpo(req, 64 * 1024);
  try { return json({ ok: true, qtd: await publicarPecas(String(b.linkId || ""), b.pecas) }); }
  catch (x) { if (x && [400, 404].includes(x.statusCode)) return erro(x.message, x.statusCode); throw x; }
});

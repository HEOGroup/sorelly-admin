export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Avisos das Compras no SorellyChat (18/11/2026, src/server/compras-chat.js). POST {pedidos:[id]} entrega o que falta (nunca duplica) e devolve a situação de cada aviso.
// Serve para o botão "Tentar de novo" do pedido e para a tela conferir se o aviso chegou. Só lê o pedido JÁ GRAVADO: não muda nada no pedido.
import { corpo, invalido, json, rota, erro } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { entregarAvisos } from "@/server/compras-chat";

export const POST = rota(async (req, { eu }) => {
  if (!podeModulo(eu, "ce")) return erro("Você não tem acesso às Compras.", 403);
  const b = await corpo(req, 64 * 1024), ids = b && b.pedidos;
  if (!Array.isArray(ids) || !ids.length || ids.length > 50 || !ids.every((x) => /^[A-Za-z0-9_-]{1,40}$/.test(String(x)))) throw invalido("pedidos");
  return json({ ok: true, situacao: await entregarAvisos(ids) });
});

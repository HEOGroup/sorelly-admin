export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Conversa do pedido de compra = o grupo do pedido no SorellyChat (18/11/2026, src/server/compras-chat.js).
// GET ?pedido=<id> lê as mensagens (avisos automáticos e mensagens de pessoas). POST {pedido, id, texto} escreve com o autor real (quem está logado).
// Quem abre as Compras lê a conversa (igual à seção Conversa de antes). O que o solicitante responde no chat aparece aqui: é a mesma conversa, sem cópia.
import { corpo, erro, invalido, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { idValido } from "@/server/chat";
import { escreverNoPedido, lerPedido, mensagensDoPedido } from "@/server/compras-chat";

const idOk = (x) => /^[A-Za-z0-9_-]{1,40}$/.test(String(x || ""));

export const GET = rota(async (req, { eu, url }) => {
  if (!podeModulo(eu, "ce")) return erro("Você não tem acesso às Compras.", 403);
  const id = url.searchParams.get("pedido"); if (!idOk(id)) throw invalido("pedido");
  return json(await mensagensDoPedido(id));
});

export const POST = rota(async (req, { eu }) => {
  if (!podeModulo(eu, "ce")) return erro("Você não tem acesso às Compras.", 403);
  const b = await corpo(req, 64 * 1024), texto = String((b && b.texto) || "").trim();
  if (!idOk(b && b.pedido) || !idValido(b && b.id) || !texto || texto.length > 4000) throw invalido("mensagem");
  const p = await lerPedido(b.pedido); if (!p) return erro("Pedido não encontrado.", 404);
  return json(Object.assign({ ok: true }, await escreverNoPedido(p, eu, texto, b.id)));
});

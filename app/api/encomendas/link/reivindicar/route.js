export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// "Eu levo este pedido para o Funil": devolve ok:true só para quem chegar primeiro (evita pedido duplicado quando duas telas estão abertas).
import { corpo, erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { reivindicar } from "@/server/pedido-link";

export const POST = rota(async (req, { eu }) => {
  if (!podeModulo(eu, "er")) return erro("Você não tem acesso a este módulo.", 403);
  const b = await corpo(req, 4 * 1024);
  return json({ ok: await reivindicar(String(b.id || ""), eu.nome, b.desfazer === true, b.confirmar === true) });
});

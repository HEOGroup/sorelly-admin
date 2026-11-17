export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Pedidos por link que as revendedoras já enviaram e ainda não entraram no Funil.
import { erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { recebidos } from "@/server/pedido-link";

export const GET = rota(async (req, { eu }) => {
  if (!podeModulo(eu, "er")) return erro("Você não tem acesso a este módulo.", 403);
  return json({ itens: await recebidos() });
});

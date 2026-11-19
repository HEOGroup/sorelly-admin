export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Página pública do pedido por link: só diz o primeiro nome, a taxa e se o link ainda vale. Nada mais.
import { erro, json, rota } from "@/server/http";
import { lerLink } from "@/server/pedido-link";

export const GET = rota(async (req, { params }) => {
  const l = await lerLink(String(params.codigo || ""));
  if (!l) return erro("Link não encontrado.", 404);
  return json(l);
}, { publica: true });

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Muda uma mensagem (reação, edição, apagar, fixar, resposta de cartão). Quem é membro da conversa pode; o autor e o horário não mudam.
import { corpo, erro, invalido, json, rota } from "@/server/http";
import { consulta } from "@/server/db";
import { exigirContato, idValido } from "@/server/chat";

export const PATCH = rota(async (req, { eu, params }) => {
  const cid = exigirContato(eu);
  const b = await corpo(req, 1024 * 1024);
  if (!idValido(params.id) || !b || !b.dados || typeof b.dados !== "object") throw invalido("mensagem");
  const m = (await consulta("select m.de, m.t, c.membros from sorelly.chat_msg m join sorelly.chat_conv c on c.id = m.conv where m.id = $1", [params.id])).rows[0];
  if (!m) return erro("Mensagem não encontrada.", 404);
  if (!m.membros.includes(cid)) return erro("Você não é membro desta conversa.", 403);
  const dados = Object.assign({}, b.dados, { id: params.id, de: m.de, t: Number(m.t) });
  await consulta("update sorelly.chat_msg set dados = $2, seq = nextval('sorelly.chat_seq') where id = $1", [params.id, dados]);
  return json({ ok: true });
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Envia uma mensagem. A mensagem precisa ser de quem está logado (de = o contato dele) e a conversa precisa já existir com ele como membro.
import { corpo, erro, invalido, json, rota } from "@/server/http";
import { consulta } from "@/server/db";
import { exigirContato, idValido } from "@/server/chat";

export const POST = rota(async (req, { eu }) => {
  const cid = exigirContato(eu);
  const b = await corpo(req, 1024 * 1024);
  const msg = b && b.msg;
  if (!idValido(b && b.conv) || !msg || typeof msg !== "object" || !idValido(msg.id) || !Number.isFinite(msg.t)) throw invalido("mensagem");
  const conv = (await consulta("select membros from sorelly.chat_conv where id = $1", [b.conv])).rows[0];
  if (!conv || !conv.membros.includes(cid)) return erro("Você não é membro desta conversa.", 403);
  // mensagem do sistema ("fulano criou o grupo") também vem de quem fez a ação; ninguém escreve em nome de outra pessoa
  if (msg.de !== cid) return erro("A mensagem precisa ser de quem está logado.", 403);
  await consulta("insert into sorelly.chat_msg (id, conv, de, t, dados) values ($1, $2, $3, $4, $5) on conflict (id) do nothing", [msg.id, b.conv, cid, msg.t, msg]);
  return json({ ok: true });
});

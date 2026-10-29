export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Cria ou atualiza uma conversa (conversa direta, grupo...). Quem pede precisa ser membro; numa conversa que já existe, precisa ser membro dela hoje.
import { corpo, erro, invalido, json, rota } from "@/server/http";
import { consulta } from "@/server/db";
import { exigirContato, idValido, validarMembros } from "@/server/chat";

export const POST = rota(async (req, { eu }) => {
  const cid = exigirContato(eu);
  const b = await corpo(req, 400 * 1024);
  const conv = b && b.conv;
  if (!conv || typeof conv !== "object" || !idValido(conv.id)) throw invalido("conversa");
  const membros = validarMembros(conv.membros);
  if (!membros.includes(cid)) return erro("Você precisa ser membro da conversa.", 403);
  const atual = (await consulta("select membros from sorelly.chat_conv where id = $1", [conv.id])).rows[0];
  if (atual && !atual.membros.includes(cid)) return erro("Você não é membro desta conversa.", 403);
  // grupo NOVO criado por pessoa (id "g_...") só o Marcus cria (29/10/2026); os grupos do sistema (id "c_...") seguem como antes
  if (!atual && conv.tipo === "grupo" && String(conv.id).startsWith("g_") && eu.pessoaId !== 16) return erro("Só o Marcus cria grupos.", 403);
  await consulta(
    `insert into sorelly.chat_conv (id, dados, membros) values ($1, $2, $3)
     on conflict (id) do update set dados = $2, membros = $3, seq = nextval('sorelly.chat_seq')`, [conv.id, conv, membros]);
  return json({ ok: true });
});

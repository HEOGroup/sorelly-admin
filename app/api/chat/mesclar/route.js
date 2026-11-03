export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Junta um grupo repetido em outro (Marcus, 04/11/2026): as mensagens da cópia passam para o grupo que fica e a cópia some. Só vale para grupos criados por pessoa ou automáticos (id "g_...").
//   POST /api/chat/mesclar   corpo: { de: "g_...", para: "g_..." }   Só o Marcus (login 16).
import { corpo, erro, invalido, json, rota } from "@/server/http";
import { consulta } from "@/server/db";
import { exigirContato, idValido } from "@/server/chat";

export const POST = rota(async (req, { eu }) => {
  exigirContato(eu);
  if (eu.pessoaId !== 16) return erro("Só o Marcus junta grupos.", 403);
  const b = await corpo(req, 4 * 1024);
  if (!b || !idValido(b.de) || !idValido(b.para) || !String(b.de).startsWith("g_") || !String(b.para).startsWith("g_") || b.de === b.para) throw invalido("grupos");
  const par = await consulta("select id, dados from sorelly.chat_conv where id = any($1)", [[b.de, b.para]]);
  const copia = par.rows.find((r) => r.id === b.de);
  if (par.rowCount !== 2 || !copia) return erro("Grupo não encontrado.", 404);
  const m = await consulta("update sorelly.chat_msg set conv = $2, seq = nextval('sorelly.chat_seq') where conv = $1", [b.de, b.para]);
  const dados = Object.assign({}, copia.dados, { excluido: true });
  await consulta("update sorelly.chat_conv set dados = $2, seq = nextval('sorelly.chat_seq') where id = $1", [b.de, dados]);
  return json({ ok: true, movidas: m.rowCount });
});

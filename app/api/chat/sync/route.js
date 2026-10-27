export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Sincroniza o chat: devolve as conversas da pessoa e as mensagens novas desde o número de ordem (desde) que a tela já viu.
// Conversa nova para a pessoa (ou com mudança) vem com TODAS as mensagens; nas demais vêm só as mensagens novas ou mudadas.
import { json, rota } from "@/server/http";
import { consulta } from "@/server/db";
import { contatoDaConta } from "@/server/chat";

export const GET = rota(async (req, { eu, url }) => {
  const cid = contatoDaConta(eu);
  if (!cid) return json({ seq: 0, convs: [], msgs: [], semContato: true });
  const desde = Math.max(0, Number(url.searchParams.get("desde")) || 0);
  const convs = (await consulta("select id, dados, seq from sorelly.chat_conv where $1 = any(membros) and seq > $2 order by seq", [cid, desde])).rows;
  const ids = convs.map((c) => c.id);
  const msgs = (await consulta(
    `select m.conv, m.dados, m.seq from sorelly.chat_msg m
      where m.conv in (select id from sorelly.chat_conv where $1 = any(membros))
        and (m.seq > $2 or m.conv = any($3))
      order by m.seq limit 3000`, [cid, desde, ids])).rows;
  const seq = Math.max(desde, ...convs.map((c) => Number(c.seq)), ...msgs.map((m) => Number(m.seq)));
  return json({ seq, cid, convs: convs.map((c) => c.dados), msgs: msgs.map((m) => ({ conv: m.conv, dados: m.dados })) });
});

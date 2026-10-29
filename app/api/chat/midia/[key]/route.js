export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Devolve a mídia de uma mensagem do SorellyChat. Só abre para quem é membro de uma conversa que tem uma mensagem com esta chave.
//   GET /api/chat/midia/md_...   resposta: { url: "data:..." }  (404 enquanto o envio ainda não terminou: a tela tenta de novo)
import { erro, json, rota } from "@/server/http";
import { consulta } from "@/server/db";
import { exigirContato } from "@/server/chat";
import { chaveMidiaValida, garantirTabelaMidia } from "@/server/chat-midia";

export const GET = rota(async (req, { eu, params }) => {
  const cid = exigirContato(eu), key = params.key;
  if (!chaveMidiaValida(key)) return erro("Mídia inválida.", 400);
  await garantirTabelaMidia();
  const pode = await consulta(
    `select 1 from sorelly.chat_msg m join sorelly.chat_conv c on c.id = m.conv where m.dados->'midia'->>'key' = $1 and $2 = any(c.membros) limit 1`, [key, cid]);
  if (!pode.rowCount) return erro("Mídia não encontrada.", 404);
  const r = await consulta("select url from sorelly.chat_midia where id = $1", [key]);
  if (!r.rowCount) return erro("Mídia ainda não chegou.", 404);
  return json({ url: r.rows[0].url });
});

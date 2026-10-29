export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Guarda a mídia de uma mensagem do SorellyChat (foto, áudio ou arquivo). Quem envia precisa ter conta ligada a um contato do chat.
//   POST /api/chat/midia   corpo: { key: "md_...", url: "data:..." }
import { corpo, erro, invalido, json, rota } from "@/server/http";
import { consulta } from "@/server/db";
import { exigirContato } from "@/server/chat";
import { LIMITE_MIDIA, chaveMidiaValida, garantirTabelaMidia } from "@/server/chat-midia";

export const POST = rota(async (req, { eu }) => {
  const cid = exigirContato(eu);
  const b = await corpo(req, 4 * 1024 * 1024);
  if (!b || !chaveMidiaValida(b.key) || typeof b.url !== "string" || !b.url.startsWith("data:")) throw invalido("mídia");
  if (b.url.length > LIMITE_MIDIA) return erro("Arquivo grande demais para o chat (máximo uns 2,5 MB). Reduza e envie de novo.", 413);
  await garantirTabelaMidia();
  await consulta("insert into sorelly.chat_midia (id, url, tamanho, por) values ($1, $2, $3, $4) on conflict (id) do nothing", [b.key, b.url, b.url.length, cid]);
  return json({ ok: true });
});

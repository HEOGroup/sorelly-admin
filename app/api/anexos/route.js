export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Guarda um arquivo anexado a um módulo (hoje: o romaneio dos pedidos de bruto, módulo cpc). Quem envia precisa poder abrir o módulo.
//   POST /api/anexos   corpo: { modulo: "cpc", key: "an_...", nome, mime, url: "data:..." }
import { corpo, erro, invalido, json, rota } from "@/server/http";
import { consulta } from "@/server/db";
import { podeModulo } from "@/server/permissoes";
import { LIMITE_ANEXO, MODULOS_COM_ANEXO, chaveAnexoValida, garantirTabelaAnexo, urlAnexoValida } from "@/server/anexos";

export const POST = rota(async (req, { eu }) => {
  const b = await corpo(req, 4.4 * 1024 * 1024);
  if (!b || !MODULOS_COM_ANEXO.includes(b.modulo) || !chaveAnexoValida(b.key) || !urlAnexoValida(b.url)) throw invalido("anexo");
  if (!podeModulo(eu, b.modulo)) return erro("Você não tem acesso a este módulo.", 403);
  if (b.url.length > LIMITE_ANEXO) return erro("Arquivo grande demais (máximo uns 2,9 MB). Reduza o arquivo ou envie uma foto.", 413);
  await garantirTabelaAnexo();
  const nome = String(b.nome || "").slice(0, 120), mime = String(b.url.slice(5, b.url.indexOf(";")));
  await consulta("insert into sorelly.anexo_modulo (id, modulo, nome, mime, url, tamanho, por) values ($1, $2, $3, $4, $5, $6, $7) on conflict (id) do nothing", [b.key, b.modulo, nome, mime, b.url, b.url.length, String(eu.id)]);
  return json({ ok: true, key: b.key, mime });
});

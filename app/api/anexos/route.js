export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Guarda um arquivo anexado a um módulo (hoje: o romaneio dos pedidos de bruto, módulo cpc). Quem envia precisa poder abrir o módulo.
//   POST /api/anexos   corpo: { modulo: "cpc", key: "an_...", nome, mime, url: "data:..." }
import { corpo, erro, invalido, json, rota } from "@/server/http";
import { consulta } from "@/server/db";
import { podeModulo } from "@/server/permissoes";
import { LIMITE_ANEXO, MAX_PARTES, MODULOS_COM_ANEXO, chaveAnexoValida, garantirTabelaAnexo, garantirTabelaPartes, pedacoValido, urlAnexoValida } from "@/server/anexos";

export const POST = rota(async (req, { eu }) => {
  const b = await corpo(req, 4.4 * 1024 * 1024);
  // arquivo grande: chega em pedaços {modulo, key, nome, parte (0..), total, pedaco}; no último pedaço o servidor junta, confere e grava
  if (b && b.pedaco !== undefined) {
    if (!MODULOS_COM_ANEXO.includes(b.modulo) || !chaveAnexoValida(b.key) || !Number.isInteger(b.parte) || !Number.isInteger(b.total) || b.total < 2 || b.total > MAX_PARTES || b.parte < 0 || b.parte >= b.total || !pedacoValido(b.pedaco)) throw invalido("anexo");
    if (!podeModulo(eu, b.modulo)) return erro("Você não tem acesso a este módulo.", 403);
    await garantirTabelaAnexo(); await garantirTabelaPartes();
    await consulta("insert into sorelly.anexo_parte (chave, parte, pedaco) values ($1, $2, $3) on conflict (chave, parte) do update set pedaco = excluded.pedaco", [b.key, b.parte, b.pedaco]);
    const c = await consulta("select count(*)::int as n from sorelly.anexo_parte where chave = $1", [b.key]);
    if (c.rows[0].n < b.total) return json({ ok: true, parcial: true });
    const ps = await consulta("select pedaco from sorelly.anexo_parte where chave = $1 order by parte", [b.key]);
    const url = ps.rows.map((x) => x.pedaco).join("");
    await consulta("delete from sorelly.anexo_parte where chave = $1", [b.key]);
    if (!urlAnexoValida(url)) throw invalido("anexo");
    if (url.length > LIMITE_ANEXO) return erro("Arquivo grande demais (máximo uns 9 MB). Reduza o arquivo ou envie uma foto.", 413);
    const nomeG = String(b.nome || "").slice(0, 120), mimeG = String(url.slice(5, url.indexOf(";")));
    await consulta("insert into sorelly.anexo_modulo (id, modulo, nome, mime, url, tamanho, por) values ($1, $2, $3, $4, $5, $6, $7) on conflict (id) do nothing", [b.key, b.modulo, nomeG, mimeG, url, url.length, String(eu.id)]);
    return json({ ok: true, key: b.key, mime: mimeG });
  }
  if (!b || !MODULOS_COM_ANEXO.includes(b.modulo) || !chaveAnexoValida(b.key) || !urlAnexoValida(b.url)) throw invalido("anexo");
  if (!podeModulo(eu, b.modulo)) return erro("Você não tem acesso a este módulo.", 403);
  if (b.url.length > 4 * 1024 * 1024) return erro("Arquivo grande demais para um envio só.", 413);
  await garantirTabelaAnexo();
  const nome = String(b.nome || "").slice(0, 120), mime = String(b.url.slice(5, b.url.indexOf(";")));
  await consulta("insert into sorelly.anexo_modulo (id, modulo, nome, mime, url, tamanho, por) values ($1, $2, $3, $4, $5, $6, $7) on conflict (id) do nothing", [b.key, b.modulo, nome, mime, b.url, b.url.length, String(eu.id)]);
  return json({ ok: true, key: b.key, mime });
});

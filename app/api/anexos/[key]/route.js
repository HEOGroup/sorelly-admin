export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Devolve um arquivo anexado. Só abre para quem pode abrir o módulo dono do arquivo.
//   GET /api/anexos/an_...   resposta: { nome, mime, url: "data:..." }
import { erro, json, rota } from "@/server/http";
import { consulta } from "@/server/db";
import { podeModulo } from "@/server/permissoes";
import { chaveAnexoValida, garantirTabelaAnexo } from "@/server/anexos";

export const GET = rota(async (req, { eu, params, url: u }) => {
  const key = params.key;
  if (!chaveAnexoValida(key)) return erro("Arquivo inválido.", 400);
  await garantirTabelaAnexo();
  const r = await consulta("select modulo, nome, mime, url from sorelly.anexo_modulo where id = $1", [key]);
  if (!r.rowCount) return erro("Arquivo não encontrado.", 404);
  const l = r.rows[0];
  if (!podeModulo(eu, l.modulo)) return erro("Você não tem acesso a este arquivo.", 403);
  // arquivo grande (acima de ~3,4 MB) sai em pedaços, porque a resposta de uma chamada na Vercel passa de 4,5 MB (12/11/2026)
  const PED = 3.2 * 1024 * 1024, parte = u && u.searchParams.get("parte");
  if (parte !== null && parte !== undefined) { const i = Number(parte); if (!Number.isInteger(i) || i < 0) return erro("Parte inválida.", 400); return json({ pedaco: l.url.slice(i * PED, (i + 1) * PED) }); }
  if (l.url.length > 3.4 * 1024 * 1024) return json({ nome: l.nome, mime: l.mime, partes: Math.ceil(l.url.length / PED) });
  return json({ nome: l.nome, mime: l.mime, url: l.url });
});

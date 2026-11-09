export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Devolve um arquivo anexado. Só abre para quem pode abrir o módulo dono do arquivo.
//   GET /api/anexos/an_...   resposta: { nome, mime, url: "data:..." }
import { erro, json, rota } from "@/server/http";
import { consulta } from "@/server/db";
import { podeModulo } from "@/server/permissoes";
import { chaveAnexoValida, garantirTabelaAnexo } from "@/server/anexos";

export const GET = rota(async (req, { eu, params }) => {
  const key = params.key;
  if (!chaveAnexoValida(key)) return erro("Arquivo inválido.", 400);
  await garantirTabelaAnexo();
  const r = await consulta("select modulo, nome, mime, url from sorelly.anexo_modulo where id = $1", [key]);
  if (!r.rowCount) return erro("Arquivo não encontrado.", 404);
  const l = r.rows[0];
  if (!podeModulo(eu, l.modulo)) return erro("Você não tem acesso a este arquivo.", 403);
  return json({ nome: l.nome, mime: l.mime, url: l.url });
});

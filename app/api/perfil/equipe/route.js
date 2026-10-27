export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Quem está no sistema: foto e situação de cada pessoa ativa (qualquer pessoa logada vê). ?desde=<data> devolve só o que mudou depois dela.
import { json, rota } from "@/server/http";
import { consulta } from "@/server/db";

export const GET = rota(async (req, { url }) => {
  const desde = url.searchParams.get("desde");
  const d = desde && !Number.isNaN(Date.parse(desde)) ? new Date(desde).toISOString() : "1970-01-01T00:00:00Z";
  const r = await consulta(
    "select pessoa_id, nome, foto, situacao, perfil_em from sorelly.conta where status = 'ativo' and pessoa_id is not null and perfil_em > $1 order by perfil_em",
    [d],
  );
  return json({ agora: new Date().toISOString(), pessoas: r.rows.map((x) => ({ pessoaId: x.pessoa_id, nome: x.nome, foto: x.foto || "", situacao: x.situacao || "disponivel", em: x.perfil_em })) });
});

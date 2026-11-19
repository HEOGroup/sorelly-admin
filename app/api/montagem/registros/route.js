export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Registros de montagem (quem montou, valor do kit, início e término). Sem edição nem exclusão, como no admin antigo.
//   GET  /api/montagem/registros?resellerId=&page=&pageSize=
//   POST /api/montagem/registros  {resellerId, resellerNome, staffNome, iniciadoEm, concluidoEm, valorKit, usouPreferencias}
import { corpo, erro, json, rota } from "@/server/http";
import { criarRegistro, listarRegistros, podeMontagem } from "@/server/montagem-kit";

export const GET = rota(async (req, { eu, url }) => {
  if (!podeMontagem(eu)) return erro("Só o setor Montagem e a Diretoria abrem os registros de montagem.", 403);
  const q = url.searchParams, rid = q.get("resellerId");
  return json(await listarRegistros({ resellerId: rid ? Number(rid) : null, page: Number(q.get("page")) || 1, pageSize: Number(q.get("pageSize")) || 20 }));
});

export const POST = rota(async (req, { eu }) => {
  if (!podeMontagem(eu)) return erro("Só o setor Montagem e a Diretoria registram montagem.", 403);
  return json(await criarRegistro(await corpo(req), eu), 201);
});

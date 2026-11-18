export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// PATCH /api/denuncias/:id  RESTRITO (quem está em LEITORES_DENUNCIAS): muda a situação, a nota interna e a resposta ao denunciante.
import { json, erro, rota, corpo } from "@/server/http";
import { atualizarDenuncia, podeVerDenuncias } from "@/server/denuncias";

export const PATCH = rota(async (req, { eu, params }) => {
  if (!podeVerDenuncias(eu)) return erro("Só quem foi liberado abre o canal de denúncias.", 403);
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) return erro("Denúncia inválida.", 400);
  const b = await corpo(req, 64 * 1024);
  const ok = await atualizarDenuncia(id, { situacao: b.situacao, nota: b.nota, resposta: b.resposta }, eu.nome || eu.pessoaId, eu);
  return ok ? json({ ok: true }) : erro("Denúncia não encontrada.", 404);
});

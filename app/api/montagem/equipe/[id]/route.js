export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Renomear, ativar/desativar ou tirar alguém da equipe da montagem (só a Diretoria). Tirar não apaga os registros antigos.
import { corpo, erro, json, rota } from "@/server/http";
import { excluirPessoa, mudarPessoa, podeGerir } from "@/server/montagem-kit";

const trata = async (f) => { try { return await f(); } catch (e) { if (e && e.statusCode === 404) return erro(e.message, 404); throw e; } };

export const PATCH = rota(async (req, { eu, params }) => {
  if (!podeGerir(eu)) return erro("Só a Diretoria muda a equipe da montagem.", 403);
  const b = await corpo(req);
  return trata(async () => json(await mudarPessoa(params.id, b)));
});

export const DELETE = rota(async (req, { eu, params }) => {
  if (!podeGerir(eu)) return erro("Só a Diretoria muda a equipe da montagem.", 403);
  return trata(async () => { await excluirPessoa(params.id); return json({ ok: true }); });
});

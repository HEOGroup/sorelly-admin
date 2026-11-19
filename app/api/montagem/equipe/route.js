export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Equipe da montagem (quem pode aparecer em "Quem montou"). Ler: setor Montagem; incluir: só a Diretoria (como no admin antigo).
import { corpo, erro, json, rota } from "@/server/http";
import { criarPessoa, listarEquipe, podeGerir, podeMontagem } from "@/server/montagem-kit";

export const GET = rota(async (req, { eu }) => {
  if (!podeMontagem(eu)) return erro("Só o setor Montagem e a Diretoria abrem a equipe da montagem.", 403);
  return json(await listarEquipe());
});

export const POST = rota(async (req, { eu }) => {
  if (!podeGerir(eu)) return erro("Só a Diretoria muda a equipe da montagem.", 403);
  return json(await criarPessoa(await corpo(req)), 201);
});

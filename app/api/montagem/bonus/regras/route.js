export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Regras do bônus da montagem (meta, base e extra por kit normal e especial, limite do kit especial e filtro da avaliação).
// Ler: setor Montagem; salvar: só a Diretoria (como no admin antigo).
import { corpo, erro, json, rota } from "@/server/http";
import { podeGerir, podeMontagem, regrasBonus, salvarRegrasBonus } from "@/server/montagem-kit";

export const GET = rota(async (req, { eu }) => {
  if (!podeMontagem(eu)) return erro("Só o setor Montagem e a Diretoria abrem as regras do bônus.", 403);
  return json(await regrasBonus());
});

export const PUT = rota(async (req, { eu }) => {
  if (!podeGerir(eu)) return erro("Só a Diretoria muda as regras do bônus.", 403);
  return json(await salvarRegrasBonus(await corpo(req)));
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Análise geral das preferências de todas as revendedoras (a conta é do app; lida agora).
import { erro, json, rota } from "@/server/http";
import { analiseApp, podeMontagem } from "@/server/montagem-kit";

export const GET = rota(async (req, { eu }) => {
  if (!podeMontagem(eu)) return erro("Só o setor Montagem e a Diretoria abrem a análise.", 403);
  return json(await analiseApp());
});

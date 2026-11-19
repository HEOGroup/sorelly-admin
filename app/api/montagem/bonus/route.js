export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Relatório do bônus por produtividade da montagem: GET /api/montagem/bonus?de=AAAA-MM-DD&ate=AAAA-MM-DD&quem=
import { erro, json, rota } from "@/server/http";
import { podeMontagem, relatorioBonus } from "@/server/montagem-kit";

export const GET = rota(async (req, { eu, url }) => {
  if (!podeMontagem(eu)) return erro("Só o setor Montagem e a Diretoria abrem o bônus da montagem.", 403);
  const q = url.searchParams;
  return json(await relatorioBonus({ de: q.get("de"), ate: q.get("ate"), quem: q.get("quem") || "" }));
});

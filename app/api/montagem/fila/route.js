export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Fila de montagem: todas as revendedoras do app com o resumo das preferências e o "já montado" (migrada do admin antigo, 18/11/2026).
//   GET /api/montagem/fila               lista (antes relê do app só quem mudou)
//   GET /api/montagem/fila?atualizar=1   relê do app agora quem mudou · ?atualizar=tudo: leitura completa em segundo plano
import { erro, json, rota } from "@/server/http";
import { listaFila, podeMontagem } from "@/server/montagem-kit";

export const GET = rota(async (req, { eu, url }) => {
  if (!podeMontagem(eu)) return erro("Só o setor Montagem e a Diretoria abrem a Fila de montagem.", 403);
  const a = url.searchParams.get("atualizar");
  return json(await listaFila({ atualizar: a === "tudo" ? "tudo" : a === "1" }));
});

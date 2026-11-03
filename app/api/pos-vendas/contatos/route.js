export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Pós-vendas: revendedoras com kit ativo + uso do app (só leitura). Só a Diretoria nesta primeira versão.
//   GET /api/pos-vendas/contatos               lista (dispara a leitura do uso do app em segundo plano se passou de 1 dia)
//   GET /api/pos-vendas/contatos?atualizar=1   pede uma nova leitura do app agora
import { erro, json, rota } from "@/server/http";
import { contatos, iniciarUso } from "@/server/pos-vendas";
import { iniciarPreferencias } from "@/server/preferencias-app";

export const GET = rota(async (req, { eu, url }) => {
  if (eu.perfil !== "ADMIN") return erro("Só a Diretoria pode fazer isso.", 403);
  const forcar = url.searchParams.get("atualizar") === "1";
  await iniciarPreferencias({ forcar });
  await iniciarUso({ forcar });
  return json(await contatos());
});

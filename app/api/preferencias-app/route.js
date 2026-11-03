export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Preferências do kit lidas do app da revendedora (todas as revendedoras; só leitura). Só a Diretoria nesta primeira versão.
//   GET /api/preferencias-app               dados guardados + situação da leitura (dispara a leitura do app em segundo plano se passou de 1 dia)
//   GET /api/preferencias-app?atualizar=1   pede uma nova leitura do app agora
import { erro, json, rota } from "@/server/http";
import { dadosPreferencias, iniciarPreferencias } from "@/server/preferencias-app";

export const GET = rota(async (req, { eu, url }) => {
  if (eu.perfil !== "ADMIN") return erro("Só a Diretoria pode fazer isso.", 403);
  await iniciarPreferencias({ forcar: url.searchParams.get("atualizar") === "1" });
  return json(await dadosPreferencias());
});

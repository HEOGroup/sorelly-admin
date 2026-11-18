export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Preferências do kit lidas do app da revendedora (todas as revendedoras; só leitura).
// 18/11/2026: abre para quem abre o módulo Preferências do kit (setores Montagem e Cadastro, e a Diretoria), como no admin antigo, onde a montagem lia as preferências.
//   GET /api/preferencias-app               dados guardados + situação da leitura (dispara a leitura do app em segundo plano se passou de 1 dia)
//   GET /api/preferencias-app?atualizar=1   pede uma nova leitura do app agora
import { erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { dadosPreferencias, iniciarPreferencias } from "@/server/preferencias-app";

export const GET = rota(async (req, { eu, url }) => {
  if (!podeModulo(eu, "pk")) return erro("Seu acesso não abre as Preferências do kit.", 403);
  await iniciarPreferencias({ forcar: url.searchParams.get("atualizar") === "1" });
  return json(await dadosPreferencias());
});

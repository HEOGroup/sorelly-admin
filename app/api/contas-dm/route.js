export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// Contas a pagar e contas pagas da DevMaster (só leitura, cache de 10 min): Financeiro e Diretoria. ?agora=1 ignora o cache.
import { erro, json, rota } from "@/server/http";
import { contasDaDevmaster, pagasDoAno } from "@/server/contas-dm";

export const GET = rota(async (req, { eu, url }) => {
  if (eu.perfil !== "ADMIN" && !(eu.setores || []).includes("financeiro")) return erro("Só o Financeiro e a Diretoria podem ver isso.", 403);
  // ?ano=2024 = só as contas PAGAS daquele ano (histórico, lido sob demanda; de 2022 até o ano passado)
  const ano = url.searchParams.get("ano");
  if (ano) { try { return json(await pagasDoAno(ano, { forcar: url.searchParams.get("agora") === "1" })); } catch (x) { return erro(x.message, x.statusCode || 500); } }
  return json(await contasDaDevmaster({ forcar: url.searchParams.get("agora") === "1" }));
});

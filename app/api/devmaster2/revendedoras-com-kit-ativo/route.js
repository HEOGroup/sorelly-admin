export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Revendedoras com kit ativo (condicional aberto na DevMaster). Só a Diretoria; leitura somente; cache de 10 min.
//   GET /api/devmaster2/revendedoras-com-kit-ativo            todas
//   GET /api/devmaster2/revendedoras-com-kit-ativo?dias=120   só condicionais abertos criados nos últimos 120 dias
//   ?atualizar=1 ignora o cache  |  ?resumo=1 devolve só os totais (sem nomes)
import { json, rota, invalido } from "@/server/http";
import { revendedorasComKitAtivo } from "@/server/devmaster2";

export const GET = rota(async (req, { url }) => {
  const d = url.searchParams.get("dias");
  if (d !== null && !/^\d{1,4}$/.test(d)) throw invalido("dias");
  const r = await revendedorasComKitAtivo({ dias: d ? Number(d) : undefined, forcar: url.searchParams.get("atualizar") === "1" });
  if (url.searchParams.get("resumo") === "1") { const { itens, ...resto } = r; return json(resto); }
  return json(r);
}, { diretoria: true });

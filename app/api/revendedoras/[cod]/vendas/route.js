export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// As 3 últimas vendas da revendedora na DevMaster (as da média: sem brinde, mesmo dia junto, só leitura). Qualquer pessoa logada: o Atendimento Sorelly usa para o valor do Kit retornando (Marcus, 10/11/2026).
// Devolve só as vendas {d: dia, v: valor, b: brinde}, sem cadastro nem condicionais (a ficha completa continua só da Diretoria).
import { json, rota } from "@/server/http";
import { fichaRevendedora } from "@/server/revendedoras";

export const GET = rota(async (req, { params }) => {
  const f = await fichaRevendedora(params.cod);
  return json({ vendas: (f.vendas || []).slice(0, 3) });
});

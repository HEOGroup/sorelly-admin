export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Revendedoras ATIVAS para escolher no lançamento do Pix antes do acerto (Contas a receber, 20/11/2026). Só código, nome e representante. Financeiro e Diretoria; leitura da DevMaster com cache de 10 min.
//   GET /api/contas-receber/revendedoras  →  {itens:[{cod, nome, representante}]}
import { erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { revendedorasAtivasBasico } from "@/server/revendedoras";

export const GET = rota(async (req, { eu }) => {
  if (!podeModulo(eu, "contasreceber")) return erro("Só o Financeiro e a Diretoria abrem Contas a receber.", 403);
  return json({ itens: await revendedorasAtivasBasico() });
});

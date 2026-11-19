export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Busca de revendedora para Indicações (crédito de moedas, pedido no balcão, indicação manual): app primeiro, DevMaster se o app não achar.
//   GET /api/indicacoes/revendedoras?busca=<nome, telefone, CPF ou número>
import { erro, json, rota } from "@/server/http";
import { buscarRevendedoras, podeIndicacoes } from "@/server/indicacoes";

export const GET = rota(async (req, { eu, url }) => {
  if (!podeIndicacoes(eu)) return erro("Seu acesso não abre as Indicações.", 403);
  return json(await buscarRevendedoras(url.searchParams.get("busca") || ""));
});

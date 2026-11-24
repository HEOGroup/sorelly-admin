export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Vendas da revendedora perto da data de um Pix (janela "Editar pagamento" do Resumo - Pagamentos, 24/11/2026). Financeiro e Diretoria. Só leitura da DevMaster.
//   GET /api/contas-receber/venda-revendedora?nome=Ana%20Paula&data=2026-11-24  →  {cod, nome, representante, vendas:[{data, venda, comissao, acerto}]}
import { erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { vendasDaRevendedora } from "@/server/venda-revendedora";

export const GET = rota(async (req, { url, eu }) => {
  if (!podeModulo(eu, "contasreceber")) return erro("Só o Financeiro e a Diretoria veem a venda da revendedora.", 403);
  const r = await vendasDaRevendedora(url.searchParams.get("nome"), url.searchParams.get("data"));
  return r.erro ? erro(r.erro, 400) : json(r);
});

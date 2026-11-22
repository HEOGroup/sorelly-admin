export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// A venda de um pagamento de Contas a receber (21/11/2026): valor de venda, pagamentos da mesma venda (com as parcelas). Financeiro e Diretoria. Só leitura da DevMaster.
//   GET /api/contas-receber/venda?cod=002014&nota=000047734&data=2026-11-19
import { erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { vendaDoPagamento } from "@/server/contas-receber";

export const GET = rota(async (req, { url, eu }) => {
  if (!podeModulo(eu, "contasreceber")) return erro("Só o Financeiro e a Diretoria abrem esta tela.", 403);
  const r = await vendaDoPagamento(url.searchParams.get("cod"), url.searchParams.get("nota"), url.searchParams.get("data"));
  return r.erro ? erro(r.erro, 400) : json(r);
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Código do link de conferência do fornecedor (18/11/2026): criado só no servidor, uma vez por data, e nunca trocado.
//   POST /api/pf/link  {chave:"fornId|AAAA-MM-DD" ou "mq|fornId|AAAA-MM|maquininha"}  →  {codigo}
import { corpo, erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { codigoDoLink } from "@/server/acerto-link";

export const POST = rota(async (req, { eu }) => {
  if (!podeModulo(eu, "pf")) return erro("Você não tem acesso aos pagamentos a fornecedores.", 403);
  const b = await corpo(req, 4096);
  const codigo = await codigoDoLink(String(b.chave || ""), eu.id);
  if (!codigo) return erro("Data de pagamento inválida.", 400);
  return json({ codigo });
});

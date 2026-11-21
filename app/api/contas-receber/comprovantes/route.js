export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Comprovante dos pagamentos da DevMaster em Contas a receber (21/11/2026). Financeiro e Diretoria.
//   GET  /api/contas-receber/comprovantes                          →  {mapa:{chaveDaLinha:{key, nome, tipo}}}
//   POST /api/contas-receber/comprovantes {chave, key, nome, tipo}  →  liga o arquivo (já enviado por /api/anexos, módulo "contasreceber") à linha
import { corpo, erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { anexarComprovante, listarComprovantes } from "@/server/comprovantes-receber";

export const GET = rota(async (req, { eu }) => {
  if (!podeModulo(eu, "contasreceber")) return erro("Só o Financeiro e a Diretoria abrem Contas a receber.", 403);
  return json(await listarComprovantes());
});

export const POST = rota(async (req, { eu }) => {
  if (!podeModulo(eu, "contasreceber")) return erro("Só o Financeiro e a Diretoria abrem Contas a receber.", 403);
  const b = await corpo(req, 16 * 1024);
  const feito = await anexarComprovante(eu, b);
  return feito.erro ? erro(feito.erro, 400) : json(feito);
});

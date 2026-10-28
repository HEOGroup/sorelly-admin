export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Todos os pagamentos (títulos) de um mês, linha por linha. Financeiro e Diretoria.
//   GET /api/contas-receber/titulos?mes=10            os títulos de um mês
//   GET /api/contas-receber/titulos?nao=1             só o acerto - loja (não pagou) de todos os meses
//   GET /api/contas-receber/titulos?mes=10&nao=1      só o acerto - loja de um mês
import { erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { titulosDoMes } from "@/server/contas-receber";

export const GET = rota(async (req, { url, eu }) => podeModulo(eu, "contasreceber") ? json(await titulosDoMes(url.searchParams.get("mes"), url.searchParams.get("nao") === "1")) : erro("Só o Financeiro e a Diretoria abrem esta tela.", 403));

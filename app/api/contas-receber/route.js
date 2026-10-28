export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Contas a receber das revendedoras (DevMaster API 2, só leitura). Financeiro e Diretoria.
//   GET /api/contas-receber            devolve o que está pronto e atualiza em segundo plano (a cada 30 min)
//   GET /api/contas-receber?atualizar=1  força uma nova leitura
import { erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { contasReceber } from "@/server/contas-receber";

export const GET = rota(async (req, { url, eu }) => podeModulo(eu, "contasreceber") ? json(await contasReceber({ forcar: url.searchParams.get("atualizar") === "1" })) : erro("Só o Financeiro e a Diretoria abrem esta tela.", 403));

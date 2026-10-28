export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Revendedoras com acerto previsto em cada mês, pela data de devolução prevista dos kits abertos na DevMaster. Financeiro e Diretoria.
//   GET /api/acertos-previstos            (cache de 30 min)   ?atualizar=1 lê de novo
import { erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { acertosPrevistos } from "@/server/acertos-previstos";

export const GET = rota(async (req, { url, eu }) => podeModulo(eu, "contasreceber") ? json(await acertosPrevistos({ forcar: url.searchParams.get("atualizar") === "1" })) : erro("Só o Financeiro e a Diretoria abrem esta tela.", 403));

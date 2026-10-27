export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Força a atualização automática do faturamento do dia anterior (ver src/server/faturamento-dia.js) na hora, sem esperar as 10h.
// Só a Diretoria: usar quando a DevMaster caiu na hora certa e precisa tentar de novo.
import { json, rota } from "@/server/http";
import { atualizarFaturamentoDoDia } from "@/server/faturamento-dia";

export const POST = rota(async () => json(await atualizarFaturamentoDoDia({ forcar: true })), { diretoria: true });

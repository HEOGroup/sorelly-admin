export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Força a atualização automática de revendedoras do dia (ver src/server/revendedoras-dia.js) na hora, sem esperar as 18h.
// Só a Diretoria: usar quando a DevMaster caiu na hora certa e precisa tentar de novo.
import { json, rota } from "@/server/http";
import { atualizarRevendedorasDoDia } from "@/server/revendedoras-dia";

export const POST = rota(async () => json(await atualizarRevendedorasDoDia({ forcar: true })), { diretoria: true });

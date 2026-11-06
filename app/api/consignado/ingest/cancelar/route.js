export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// A representante cancelou o registro no app (serviço, x-ingest-key). Contrato 1.3.
//   POST /api/consignado/ingest/cancelar {origemId, motivo} -> 200 {ok, removido} · 409 {error} se o agendamento ou o financeiro já conferiu
import { corpoServico, ok, rotaServico } from "@/server/servico";
import { cancelarRegistro } from "@/server/app-rep/consignado";

export const POST = rotaServico(async (req) => ok(await cancelarRegistro(await corpoServico(req, 16 * 1024))));

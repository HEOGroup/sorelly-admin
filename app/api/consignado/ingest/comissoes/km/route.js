export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Km total do período de uma data de pagamento, informado pela representante no app (serviço, x-ingest-key). Contrato 1.8.
//   POST /api/consignado/ingest/comissoes/km {rep, data, km} -> {km}. A hora é a do servidor; depois do corte vale na data seguinte.
import { corpoServico, ok, rotaServico } from "@/server/servico";
import { representante } from "@/server/app-rep/base";
import { enviarKm } from "@/server/app-rep/comissoes";

export const POST = rotaServico(async (req) => { const b = await corpoServico(req, 16 * 1024); return ok(await enviarKm(await representante(b.rep, b.repNome), b)); });

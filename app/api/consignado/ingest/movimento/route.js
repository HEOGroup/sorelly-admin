export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Entrega de kit novo ou reposição registrada no app (serviço, x-ingest-key). Contrato 1.2.
//   POST /api/consignado/ingest/movimento -> 200 {ok, acao, acertoId, casoAberto:false}
import { corpoServico, ok, rotaServico } from "@/server/servico";
import { registrarMovimento } from "@/server/app-rep/consignado";

export const POST = rotaServico(async (req) => ok(await registrarMovimento(await corpoServico(req))));

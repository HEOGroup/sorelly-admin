export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// A representante viu o aviso "Combustível atualizado" no app (serviço, x-ingest-key). Contrato 1.8.
//   POST /api/consignado/ingest/comissoes/gasolina-visto {rep, em} -> {ok}
import { corpoServico, ok, rotaServico } from "@/server/servico";
import { representante } from "@/server/app-rep/base";
import { gasolinaVista } from "@/server/app-rep/comissoes";

export const POST = rotaServico(async (req) => { const b = await corpoServico(req, 16 * 1024); return ok(await gasolinaVista(await representante(b.rep, b.repNome), b)); });

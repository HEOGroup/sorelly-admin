export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Acerto registrado no APP REAL da representante (serviço: o backend do app chama com x-ingest-key). Contrato 1.1.
//   POST /api/consignado/ingest/acerto -> 200 {ok, acao:"criar"|"atualizar", acertoId, casoAberto}
// Vira registro de s.acertosConsignado (chave a_<id> do módulo rpf): Consolidado, Comissões e Inadimplência passam a ver. Idempotente pelo id.
import { corpoServico, ok, rotaServico } from "@/server/servico";
import { registrarAcerto } from "@/server/app-rep/consignado";

export const POST = rotaServico(async (req) => ok(await registrarAcerto(await corpoServico(req))));

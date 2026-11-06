export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// "Entreguei o dinheiro" / "Entreguei as condicionais" na aba Entrega na empresa do app (serviço, x-ingest-key). Contrato 1.8.
//   POST /api/consignado/ingest/comissoes/entrega {rep, acertoId, item:"dinheiro"|"condicionais", ok} -> {ok, entrega} · 409 se o agendamento já conferiu
import { corpoServico, ok, rotaServico } from "@/server/servico";
import { representante } from "@/server/app-rep/base";
import { marcarEntrega } from "@/server/app-rep/comissoes";

export const POST = rotaServico(async (req) => { const b = await corpoServico(req, 16 * 1024); return ok(await marcarEntrega(await representante(b.rep, b.repNome), b)); });

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Pré-acerto (remarcações e dias de atraso) salvo no app antes do acerto (serviço, x-ingest-key). Contrato 1.7.
//   PUT /api/consignado/ingest/pre-acerto {rep, revCod, kitId?, remarcacoes:[{em, isenta, motivo}], atrasoDias} -> {preAcerto}
// Grava pa_<revCod> e, com o kit da listagem, kit.remarcacoesLista e kit.preAcerto (como KIT_REMARCAR e KIT_PRE_ACERTO do protótipo).
import { corpoServico, ok, rotaServico } from "@/server/servico";
import { representante } from "@/server/app-rep/base";
import { salvarPreAcerto } from "@/server/app-rep/consignado";

export const PUT = rotaServico(async (req) => {
  const b = await corpoServico(req, 64 * 1024);
  const rep = await representante(b.rep, b.repNome);
  return ok(await salvarPreAcerto(rep, b));
});

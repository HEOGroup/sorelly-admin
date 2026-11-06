export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Inclui uma revendedora numa listagem do app (serviço, x-ingest-key). Contrato 1.5.
//   POST /api/listagens/app/<id>/itens {rep, repNome, revendedoraId, nome, bairro|null, tipoKit, horaAtendimento|null} -> 200 ListagemApp
import { corpoServico, ok, rotaServico } from "@/server/servico";
import { representante } from "@/server/app-rep/base";
import { incluirRevendedora } from "@/server/app-rep/listagens";

export const POST = rotaServico(async (req, { params }) => {
  const b = await corpoServico(req, 64 * 1024);
  const rep = await representante(b.rep, b.repNome);
  return ok(await incluirRevendedora(rep, params.id, b));
});

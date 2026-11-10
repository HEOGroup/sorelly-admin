export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Tira a revendedora da listagem antes de a montagem começar (serviço, x-ingest-key). Contrato 1.5.
//   DELETE /api/listagens/app/<id>/itens/<itemId>?rep=<cod>&repNome=<nome> -> 200 ListagemApp
import { ok, recusa, rotaServico } from "@/server/servico";
import { representante } from "@/server/app-rep/base";
import { tirarRevendedora } from "@/server/app-rep/listagens";

export const DELETE = rotaServico(async (req, { params, url }) => {
  const cod = (url.searchParams.get("rep") || "").trim();
  if (!cod) throw recusa("Informe a representante (?rep=código).", 400);
  const rep = await representante(cod, url.searchParams.get("repNome"));
  return ok(await tirarRevendedora(rep, params.id, params.itemId));
});

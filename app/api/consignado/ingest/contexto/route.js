export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Contexto do acerto para a calculadora do app (serviço, x-ingest-key). Contrato 1.6.
//   GET /api/consignado/ingest/contexto?rep=<cod>&revCod=<000123> -> {vendasAnteriores, dividaAnterior, creditosGarantia, modalidade, preAcerto, regras}
import { ok, recusa, rotaServico } from "@/server/servico";
import { representante, revCodDe } from "@/server/app-rep/base";
import { contextoAcerto } from "@/server/app-rep/consignado";

export const GET = rotaServico(async (req, { url }) => {
  const cod = (url.searchParams.get("rep") || "").trim();
  if (!cod) throw recusa("Informe a representante (?rep=código).", 400);
  const rep = await representante(cod, url.searchParams.get("repNome"));
  return ok(await contextoAcerto(rep, revCodDe(null, url.searchParams.get("revCod"))));
});

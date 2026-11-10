export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// "Só as minhas comissões" para o app da representante (serviço, x-ingest-key). Contrato 1.8.
//   GET /api/consignado/ingest/comissoes?rep=<cod>&mes=AAAA-MM -> cartão do mês, datas de pagamento (janela, km, itens), consolidado, entrega na empresa
// Nunca devolve nome nem valor de outra representante (filtra pelo destinatário de cada item, como a tela Financeiro › Comissões).
import { ok, recusa, rotaServico } from "@/server/servico";
import { representante } from "@/server/app-rep/base";
import { comissoesDaRep } from "@/server/app-rep/comissoes";

export const GET = rotaServico(async (req, { url }) => {
  const cod = (url.searchParams.get("rep") || "").trim();
  if (!cod) throw recusa("Informe a representante (?rep=código).", 400);
  const mes = url.searchParams.get("mes") || new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 7);
  return ok(await comissoesDaRep(await representante(cod, url.searchParams.get("repNome")), mes));
});

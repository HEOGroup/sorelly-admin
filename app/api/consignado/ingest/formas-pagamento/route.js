export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Formas de pagamento e contas oficiais para a calculadora do app (serviço, x-ingest-key). Contrato 1.4.
//   GET /api/consignado/ingest/formas-pagamento -> {formas:[{valor, rotulo, temParcelas, contas}]}
import { ok, rotaServico } from "@/server/servico";
import { formasDoApp } from "@/server/app-rep/consignado";

export const GET = rotaServico(async () => ok({ formas: formasDoApp() }));

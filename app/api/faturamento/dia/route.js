export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// DESLIGADA em 29/10/2026: a atualização automática do faturamento (src/server/faturamento-dia.js) usa as notas de saída (dmabl), que dão cerca de
// R$ 262 mil no mês contra R$ 1,29 mi do relatório de notas fiscais do Marcus, e gravaria o valor errado. Religar só depois de achar a regra do relatório.
import { erro, rota } from "@/server/http";

export const POST = rota(async () => erro("A atualização automática do faturamento está desligada até a regra do relatório de notas fiscais ser conferida.", 503), { diretoria: true });

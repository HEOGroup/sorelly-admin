export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Regras oficiais da Calculadora de Acertos, SOMENTE LEITURA (serviço, x-ingest-key). Marcus, 28/11/2026: o Sorelly Intel consulta aqui as regras vigentes para auditar os acertos.
//   GET /api/consignado/ingest/regras -> {atualizadoEm, comissaoEBrinde, taxaDeslocamento, remarcacao, acertoForaDaData, brindePorPendencia, pagamento, vendaMinima, tags, pecasProximoMes, definicoes, contaOficial}
// Não lê nem grava o banco: devolve as mesmas constantes que a conta usa (domain/consignado.js), por domain/regras-acerto.js. Não existe POST, PUT nem DELETE.
import { ok, rotaServico } from "@/server/servico";
import { regrasAcertoOficiais } from "@/apps/montagem/domain/regras-acerto";

export const GET = rotaServico(async () => ok(regrasAcertoOficiais()));

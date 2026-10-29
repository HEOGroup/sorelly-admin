// Gancho do Next.js: roda UMA vez quando o servidor sobe (documentação: "Instrumentation").
// Liga os relógios das atualizações automáticas (DevMaster): revendedoras do dia às 18h.
// O robô do FATURAMENTO do dia anterior (10h) está DESLIGADO desde 29/10/2026: a regra dele (notas de saída dmabl) dava ~R$ 262 mil no mês contra R$ 1,29 mi do relatório de notas fiscais do Marcus, e gravaria o valor errado no faturamento acumulado. Só religar depois de achar a regra que reproduz o relatório (docs/negocio/ALINHAMENTOS-FINANCEIRO-28-10-2026.md).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { agendarRevendedorasDiarias } = await import("./src/server/revendedoras-dia.js");
  agendarRevendedorasDiarias();
}

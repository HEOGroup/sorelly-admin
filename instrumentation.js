// Gancho do Next.js: roda UMA vez quando o servidor sobe (documentação: "Instrumentation").
// Liga os relógios das atualizações automáticas (DevMaster): revendedoras do dia às 18h.
// O robô do FATURAMENTO do dia anterior (10h) está DESLIGADO desde 29/10/2026: a regra dele (notas de saída dmabl) dava ~R$ 262 mil no mês contra R$ 1,29 mi do relatório de notas fiscais do Marcus, e gravaria o valor errado no faturamento acumulado. Só religar depois de achar a regra que reproduz o relatório (docs/negocio/ALINHAMENTOS-FINANCEIRO-28-10-2026.md).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { agendarRevendedorasDiarias } = await import("./src/server/revendedoras-dia.js");
  agendarRevendedorasDiarias();
  // 09/11/2026: revendedoras e faturamento do relatório de notas fiscais, todo dia a partir das 10h (no site publicado quem chama é o agendador da Vercel, vercel.json)
  const { agendarAutomaticoDiario } = await import("./src/server/automatico-dia.js");
  agendarAutomaticoDiario();
  // 10/11/2026: Marketing › Fotos de catálogo lê os produtos novos da DevMaster a cada 5 minutos, sem precisar de tela aberta
  const { agendarFotosDm } = await import("./src/server/fotos-dm.js");
  agendarFotosDm();
  // App real da representante (05/11/2026): kits novos para o app, respostas de volta e aviso "kit pronto", a cada 60 s.
  // Só liga com APP_REP_SINCRONIZAR=1 (o .env de desenvolvimento aponta para a API de produção do app).
  const { agendarSincronizacao } = await import("./src/server/app-rep/sincronizar.js");
  agendarSincronizacao();
}

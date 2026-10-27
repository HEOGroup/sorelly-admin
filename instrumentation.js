// Gancho do Next.js: roda UMA vez quando o servidor sobe (documentação: "Instrumentation").
// Liga os relógios das atualizações automáticas (DevMaster): revendedoras do dia às 18h e faturamento do dia anterior às 10h.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { agendarRevendedorasDiarias } = await import("./src/server/revendedoras-dia.js");
  const { agendarFaturamentoDiario } = await import("./src/server/faturamento-dia.js");
  agendarRevendedorasDiarias();
  agendarFaturamentoDiario();
}

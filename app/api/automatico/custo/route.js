export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;
// Atualiza o custo de tudo que saiu do estoque (Pedidos › resumo por mês) lendo a DevMaster, às 11h e às 12h (ver src/server/custo-saida.js). Idempotente.
// Quem pode chamar: o agendador da Vercel (Authorization: Bearer CRON_SECRET) ou qualquer pessoa logada. `?forcar=1` ignora a hora (só a Diretoria ou o agendador).
import { erro, json, rota, usuarioDe } from "@/server/http";
import { rodarCustoAgendado } from "@/server/custo-saida";

const executar = rota(async (req, { url }) => {
  const h = req.headers.get("authorization") || "", segredo = process.env.CRON_SECRET || "";
  const ehCron = !!segredo && h === "Bearer " + segredo;
  const eu = ehCron ? null : await usuarioDe(req);
  if (!ehCron && !eu) return erro("Entre no sistema para continuar.", 401);
  const forcar = url.searchParams.get("forcar") === "1" && (ehCron || (eu && eu.perfil === "ADMIN"));
  return json(await rodarCustoAgendado({ forcar }));
}, { publica: true });

export const GET = executar;
export const POST = executar;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;
// Atualização automática diária (ver src/server/automatico-dia.js): revendedoras do dia e faturamento do relatório de notas fiscais até ontem.
// Quem pode chamar: o agendador da Vercel (cabeçalho Authorization: Bearer CRON_SECRET) ou qualquer pessoa logada (o sistema chama sozinho ao abrir depois das 10h; é idempotente).
// `?forcar=1` ignora a hora (só a Diretoria ou o agendador).
import { erro, json, rota, usuarioDe } from "@/server/http";
import { rodarAutomaticoDoDia } from "@/server/automatico-dia";

const executar = rota(async (req, { url }) => {
  const h = req.headers.get("authorization") || "", segredo = process.env.CRON_SECRET || "";
  const ehCron = !!segredo && h === "Bearer " + segredo;
  const eu = ehCron ? null : await usuarioDe(req);
  if (!ehCron && !eu) return erro("Entre no sistema para continuar.", 401);
  const forcar = url.searchParams.get("forcar") === "1" && (ehCron || (eu && eu.perfil === "ADMIN"));
  return json(await rodarAutomaticoDoDia({ forcar, cron: ehCron }));
}, { publica: true });

export const GET = executar;
export const POST = executar;

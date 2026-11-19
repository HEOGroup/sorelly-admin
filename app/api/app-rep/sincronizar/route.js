export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// Sincronização com o app da representante (kits novos, respostas, aviso de kit pronto), só com APP_REP_SINCRONIZAR=1.
// No servidor local o relógio de 60 s do instrumentation.js basta; no site publicado (Vercel) o servidor não fica ligado,
// então quem chama a cada minuto é o agendador da Vercel (vercel.json, Authorization: Bearer CRON_SECRET). 12/11/2026.
//   GET  /api/app-rep/sincronizar -> agendador: roda uma rodada; pessoa logada: {ligada, ultima}
//   POST /api/app-rep/sincronizar -> Diretoria pede uma rodada agora: {enviados, retirados, respostas, avisos, erros}
import { erro, json, rota, usuarioDe } from "@/server/http";
import { podeGravar } from "@/server/app-rep/cliente-app";
import { sincronizarApp, ultimaSincronizacao } from "@/server/app-rep/sincronizar";

const ehCron = (req) => {
  const segredo = process.env.CRON_SECRET || "";
  return !!segredo && (req.headers.get("authorization") || "") === "Bearer " + segredo;
};

export const GET = rota(async (req) => {
  if (ehCron(req)) return json(await sincronizarApp());
  if (!(await usuarioDe(req))) return erro("Entre no sistema para continuar.", 401);
  return json({ ligada: podeGravar(), ultima: ultimaSincronizacao() });
}, { publica: true });

export const POST = rota(async () => json(await sincronizarApp()), { diretoria: true });

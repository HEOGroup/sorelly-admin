export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;
// Refaz a lista de revendedoras (DevMaster) e a cópia dela no banco, para a Aba Revendedoras e o app da representante abrirem na hora (src/server/revendedoras.js).
// Só o agendador da Vercel (Authorization: Bearer CRON_SECRET) ou a Diretoria logada.
import { erro, json, rota, usuarioDe } from "@/server/http";
import { listaRevendedoras } from "@/server/revendedoras";

const executar = rota(async (req) => {
  const h = req.headers.get("authorization") || "", segredo = process.env.CRON_SECRET || "";
  const ehCron = !!segredo && h === "Bearer " + segredo;
  if (!ehCron) { const eu = await usuarioDe(req); if (!eu) return erro("Entre no sistema para continuar.", 401); if (eu.perfil !== "ADMIN") return erro("Só a Diretoria.", 403); }
  const t = Date.now(), d = await listaRevendedoras({ forcar: true });
  return json({ ok: true, revendedoras: d.itens.length, ms: Date.now() - t });
}, { publica: true });

export const GET = executar;
export const POST = executar;

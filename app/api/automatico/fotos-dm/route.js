export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;
// Lê a DevMaster e põe os códigos novos (e as fotos já subidas) em Marketing › Fotos de catálogo (ver src/server/fotos-dm.js). Idempotente.
// Quem pode chamar: o agendador da Vercel (Authorization: Bearer CRON_SECRET), a Diretoria ou o Marketing logados.
import { erro, json, rota, usuarioDe } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { sincronizarFotosDm } from "@/server/fotos-dm";

const executar = rota(async (req) => {
  const h = req.headers.get("authorization") || "", segredo = process.env.CRON_SECRET || "";
  const ehCron = !!segredo && h === "Bearer " + segredo;
  const eu = ehCron ? null : await usuarioDe(req);
  if (!ehCron && !eu) return erro("Entre no sistema para continuar.", 401);
  if (!ehCron && !podeModulo(eu, "fc")) return erro("Você não tem acesso a este módulo.", 403);
  return json(await sincronizarFotosDm());
}, { publica: true });

export const GET = executar;
export const POST = executar;

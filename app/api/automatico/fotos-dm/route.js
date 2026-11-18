export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;
// Lê a DevMaster e põe os códigos novos (e as fotos já subidas) em Marketing › Fotos de catálogo (ver src/server/fotos-dm.js). Idempotente.
// Quem pode chamar: o agendador da Vercel (Authorization: Bearer CRON_SECRET), a Diretoria ou o Marketing logados.
import { erro, json, rota, usuarioDe } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { registrarTentativa, sincronizarFotosDm } from "@/server/fotos-dm";

const executar = rota(async (req) => {
  const h = req.headers.get("authorization") || "", segredo = process.env.CRON_SECRET || "";
  const ehCron = !!segredo && h === "Bearer " + segredo;
  const eu = ehCron ? null : await usuarioDe(req);
  if (!ehCron && !eu) return erro("Entre no sistema para continuar.", 401);
  if (!ehCron && !podeModulo(eu, "fc")) return erro("Você não tem acesso a este módulo.", 403);
  const antigas = new URL(req.url).searchParams.get("antigas") === "1";   // leitura pesada das peças antigas: só no agendamento próprio
  await registrarTentativa("");   // diário: a rotina chegou até aqui (m.dmTentativa)
  try { return json(await sincronizarFotosDm({ antigas })); } catch (e) { await registrarTentativa("falhou: " + ((e && e.message) || e)); throw e; }
}, { publica: true });

export const GET = executar;
export const POST = executar;

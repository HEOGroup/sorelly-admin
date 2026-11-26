export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// DevMaster → Kits novos (26/11/2026): kit com condicional aberto na DevMaster ganha o código e vira Bipado (src/server/kits-novos-devmaster.js).
// No site publicado (Vercel) o servidor não fica ligado: quem chama a cada 10 minutos é o agendador (vercel.json, Authorization: Bearer CRON_SECRET).
// Desliga só com KITS_NOVOS_DEVMASTER=0.
//   GET  /api/kits-novos-devmaster -> agendador: roda uma rodada; pessoa logada: o resultado da última
//   POST /api/kits-novos-devmaster -> Kits novos ou Diretoria pedem uma rodada agora (?simular=1 só mostra, não grava)
import { erro, json, rota, usuarioDe } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { lerModulo } from "@/server/app-rep/base";
import { gravarModulo } from "@/server/estado-modulo";
import { sincronizarBipadoDevMaster } from "@/server/kits-novos-devmaster";

const ehCron = (req) => {
  const segredo = process.env.CRON_SECRET || "";
  return !!segredo && (req.headers.get("authorization") || "") === "Bearer " + segredo;
};
const desligado = () => process.env.KITS_NOVOS_DEVMASTER === "0";

// guarda no banco (knkommo, chave dmsinc) a hora e o resumo da rodada: serve de trava para a rodada puxada pela tela e para conferir o que o servidor fez
async function rodar() {
  const r = await sincronizarBipadoDevMaster();
  await gravarModulo("knkommo", { dmsinc: { em: new Date().toISOString(), bipados: r.bipados, gravados: r.gravados, semKit: r.semKit, duvida: (r.duvida || []).length, erros: (r.erros || []).slice(0, 5) } }, "chaves", "devmaster").catch(() => {});
  return r;
}

export const GET = rota(async (req, { url }) => {
  if (ehCron(req)) return json(desligado() ? { ligado: false } : await rodar());
  const eu = await usuarioDe(req);
  if (!eu) return erro("Entre no sistema para continuar.", 401);
  // Sem agendador (sem CRON_SECRET na Vercel): a tela dos Kits novos pede ?rodar=1 e o servidor só roda se a última rodada tem mais de 9 minutos.
  let guardada = (await lerModulo("knkommo")).dmsinc || null;
  if (url.searchParams.get("rodar") === "1" && !desligado() && podeModulo(eu, "kndados") && (!guardada || !guardada.em || Date.now() - Date.parse(guardada.em) > 540000)) {
    await rodar();
    guardada = (await lerModulo("knkommo")).dmsinc || guardada;
  }
  return json({ ligado: !desligado(), guardada });
}, { publica: true });

export const POST = rota(async (req, { eu, url }) => {
  if (!podeModulo(eu, "kndados")) return erro("Você não tem acesso aos Kits novos.", 403);
  return json(await sincronizarBipadoDevMaster({ simular: url.searchParams.get("simular") === "1" }));
});

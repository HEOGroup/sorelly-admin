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
import { sincronizarBipadoDevMaster } from "@/server/kits-novos-devmaster";

const ehCron = (req) => {
  const segredo = process.env.CRON_SECRET || "";
  return !!segredo && (req.headers.get("authorization") || "") === "Bearer " + segredo;
};
const desligado = () => process.env.KITS_NOVOS_DEVMASTER === "0";

export const GET = rota(async (req) => {
  if (ehCron(req)) return json(desligado() ? { ligado: false } : await sincronizarBipadoDevMaster());
  if (!(await usuarioDe(req))) return erro("Entre no sistema para continuar.", 401);
  return json({ ligado: !desligado(), ultima: globalThis.__kitsDmUltima || null });
}, { publica: true });

export const POST = rota(async (req, { eu, url }) => {
  if (!podeModulo(eu, "kndados")) return erro("Você não tem acesso aos Kits novos.", 403);
  return json(await sincronizarBipadoDevMaster({ simular: url.searchParams.get("simular") === "1" }));
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// Kommo → Kits novos (25/11/2026): a revendedora aprovada na Kommo entra sozinha nos Kits novos (src/server/kits-novos-kommo.js).
// No servidor local o relógio do instrumentation.js basta; no site publicado (Vercel) quem chama a cada 2 minutos é o agendador
// (vercel.json, Authorization: Bearer CRON_SECRET). Só liga com KITS_NOVOS_KOMMO=1.
// Sem o agendador (sem CRON_SECRET na Vercel), quem dispara é a própria tela dos Kits novos: a cada 2 minutos pede ?rodar=1, e o servidor só roda
// se a última rodada (guardada no banco, módulo knkommo) tiver mais de 100 segundos. Assim funciona enquanto alguém da equipe está com os Kits novos abertos.
//   GET  /api/kommo/kits-novos -> agendador: roda uma rodada; pessoa logada: {ligado, ultima, estado} (?rodar=1: roda antes, se estiver na hora)
//   POST /api/kommo/kits-novos -> Kits novos, Cadastro ou Diretoria pedem uma rodada agora ("Buscar na Kommo agora" do Configurador)
import { erro, json, rota, usuarioDe } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { lerModulo } from "@/server/app-rep/base";
import { kommoKitsLigado, sincronizarKommoKitsNovos, ultimaKommoKits } from "@/server/kits-novos-kommo";

const ehCron = (req) => {
  const segredo = process.env.CRON_SECRET || "";
  return !!segredo && (req.headers.get("authorization") || "") === "Bearer " + segredo;
};

export const GET = rota(async (req, { url }) => {
  if (ehCron(req)) return json(await sincronizarKommoKitsNovos());
  const eu = await usuarioDe(req);
  if (!eu) return erro("Entre no sistema para continuar.", 401);
  if (!podeModulo(eu, "kndados")) return erro("Você não tem acesso aos Kits novos.", 403);
  let estado = (await lerModulo("knkommo")).estado || null, rodou = null;
  if (url.searchParams.get("rodar") === "1" && kommoKitsLigado() && (!estado || !estado.em || Date.now() - Date.parse(estado.em) > 100000)) {
    rodou = await sincronizarKommoKitsNovos();
    estado = (await lerModulo("knkommo")).estado || estado;
  }
  return json({ ligado: kommoKitsLigado(), ultima: rodou || ultimaKommoKits(), estado });
}, { publica: true });

export const POST = rota(async (req, { eu }) => {
  if (!podeModulo(eu, "kndados")) return erro("Você não tem acesso aos Kits novos.", 403);
  return json(await sincronizarKommoKitsNovos());
});

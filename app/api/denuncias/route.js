export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Canal de Ética e Denúncias (17/11/2026).
//   POST /api/denuncias          PÚBLICO (formulário /canal-de-etica, sem login): grava e devolve só o protocolo. Não guarda IP, nome nem aparelho.
//   GET  /api/denuncias          RESTRITO: só quem está em LEITORES_DENUNCIAS (src/server/denuncias.js), conferido pelo pessoaId da conta.
//   GET  /api/denuncias?novas=1  RESTRITO: só os números das denúncias ainda não tratadas (o navegador de quem lê usa para o alerta).
import { json, erro, rota, corpo } from "@/server/http";
import { gravarDenuncia, limiteDenuncia, listarDenuncias, novasDenuncias, podeVerDenuncias, validarDenuncia } from "@/server/denuncias";

export const POST = rota(async (req) => {
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (!limiteDenuncia(ip)) return erro("Muitos envios por aqui. Tente de novo mais tarde.", 429);
  const b = await corpo(req, 64 * 1024);
  if (b.site === true) return json({ ok: true, protocolo: "DEN-00000000" }, 201);   // campo escondido anti-robô: pessoa de verdade nunca preenche; o robô "recebe" um protocolo falso e nada é gravado
  const protocolo = await gravarDenuncia(validarDenuncia(b));
  return json({ ok: true, protocolo }, 201);
}, { publica: true });

export const GET = rota(async (req, { eu, url }) => {
  if (!podeVerDenuncias(eu)) return erro("Só quem foi liberado abre o canal de denúncias.", 403);
  if (url.searchParams.get("novas")) return json({ ids: await novasDenuncias(eu) });
  return json({ denuncias: await listarDenuncias(eu) });
});

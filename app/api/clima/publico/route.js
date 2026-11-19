export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Pesquisa de clima (18/11/2026), parte PÚBLICA e anônima (formulário /pesquisa-de-clima, sem login).
//   GET  /api/clima/publico   devolve se há rodada aberta, o nome dela, as perguntas e os setores.
//   POST /api/clima/publico   grava uma resposta na rodada aberta. Não guarda IP, nome nem aparelho.
import { json, erro, rota, corpo } from "@/server/http";
import { gravarResposta, limiteClima, PERGUNTAS, rodadaAberta, SETORES } from "@/server/clima";

export const GET = rota(async () => {
  const r = await rodadaAberta();
  return json({ aberta: !!r, nome: r ? r.nome : "", perguntas: PERGUNTAS.map((p) => ({ k: p.k, t: p.t })), setores: SETORES });
}, { publica: true });

export const POST = rota(async (req) => {
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (!limiteClima(ip)) return erro("Muitos envios por aqui. Tente de novo mais tarde.", 429);
  const b = await corpo(req, 32 * 1024);
  if (b.site === true) return json({ ok: true }, 201);   // campo escondido anti-robô: pessoa de verdade nunca preenche; nada é gravado
  await gravarResposta(b);
  return json({ ok: true }, 201);
}, { publica: true });

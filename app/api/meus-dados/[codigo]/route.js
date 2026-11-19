export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Formulário dos funcionários (18/11/2026): PÚBLICO, sem login, só com o código do link de cada pessoa.
//   GET  devolve SÓ o primeiro nome e a situação (nada de dados).   POST grava a resposta (limite de envios por endereço e campo escondido anti-robô).
import { erro, json, rota, corpo } from "@/server/http";
import { gravarResposta, lerPublico, limiteFicha } from "@/server/ficha-func";

export const GET = rota(async (req, { params }) => {
  const x = await lerPublico(String(params.codigo || ""));
  if (!x) return erro("Link não encontrado.", 404);
  return json(x);
}, { publica: true });

export const POST = rota(async (req, { params }) => {
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (!limiteFicha(ip)) return erro("Muitos envios por aqui. Tente de novo mais tarde.", 429);
  const b = await corpo(req, 64 * 1024);
  if (b.site) return json({ ok: true }, 201);   // campo escondido anti-robô: pessoa de verdade nunca preenche
  await gravarResposta(String(params.codigo || ""), b);
  return json({ ok: true }, 201);
}, { publica: true });

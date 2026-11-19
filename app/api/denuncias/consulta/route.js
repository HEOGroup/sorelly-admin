export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// POST /api/denuncias/consulta  PÚBLICO: a pessoa informa o protocolo (DEN-XXXXXXXX) e vê só a situação e a resposta do RH. Nunca devolve o relato nem a nota interna.
// Limite de 20 consultas por hora por endereço (só na memória do servidor), para ninguém ficar adivinhando protocolos.
import { json, erro, rota, corpo } from "@/server/http";
import { consultarProtocolo, limiteDenuncia } from "@/server/denuncias";

export const POST = rota(async (req) => {
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (!limiteDenuncia(ip, 20, "__sorellyConsultaDen")) return erro("Muitas consultas por aqui. Tente de novo mais tarde.", 429);
  const b = await corpo(req, 4 * 1024);
  const r = await consultarProtocolo(b.protocolo);
  return r ? json({ ok: true, ...r }) : erro("Protocolo não encontrado. Confira o código.", 404);
}, { publica: true });

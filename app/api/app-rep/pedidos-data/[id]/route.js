export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Decisão da Diretoria sobre um pedido de data do app (05/11/2026). Reprovar exige motivo; sem aprovação vale a multa de remarcação.
//   PATCH /api/app-rep/pedidos-data/<id> {status:"aprovado"|"reprovado", motivo?} -> {pedido}
import { corpo, erro, json, rota } from "@/server/http";
import { chamarApp } from "@/server/app-rep/cliente-app";

export const PATCH = rota(async (req, { eu, params }) => {
  const id = String(params.id || "");
  if (!/^\d{1,12}$/.test(id)) return erro("Pedido inválido.", 400);
  const b = await corpo(req, 16 * 1024);
  if (b.status !== "aprovado" && b.status !== "reprovado") return erro("Escolha aprovar ou reprovar.", 400);
  const motivo = typeof b.motivo === "string" ? b.motivo.trim().slice(0, 300) : "";
  if (b.status === "reprovado" && !motivo) return erro("Para reprovar, escreva o motivo.", 400);
  const r = await chamarApp("PATCH", "/admin/pedidos-data/" + id, { status: b.status, operador: String(eu.nome || "Diretoria").slice(0, 120), motivo: motivo || null });
  if (!r.ok) return erro(r.erro || "Não foi possível gravar a decisão no app.", r.status === 404 || r.status === 409 ? r.status : 503);
  return json({ pedido: (r.corpo && r.corpo.data) || null });
}, { diretoria: true });

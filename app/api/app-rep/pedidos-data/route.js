export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Pedidos de mudança da data do acerto feitos no APP REAL da representante (05/11/2026). O pedido nasce e vive no backend do app;
// o admin lê (Agendamento › Pedidos do app) e a Diretoria decide. Contrato, seção 3.
//   GET /api/app-rep/pedidos-data?status=aguardando|registrada|aprovado|reprovado  -> {itens:[...]}
import { erro, json, rota } from "@/server/http";
import { chamarApp, configurado } from "@/server/app-rep/cliente-app";

const STATUS = ["aguardando", "registrada", "aprovado", "reprovado"];
export const GET = rota(async (req, { url }) => {
  if (!configurado()) return erro("Ligação com o app não configurada (MOBILE_API_URL e MOBILE_API_KEY).", 503);
  const st = url.searchParams.get("status");
  const r = await chamarApp("GET", "/admin/pedidos-data" + (st && STATUS.includes(st) ? "?status=" + st : ""));
  if (!r.ok) return erro(r.erro || "Não foi possível ler os pedidos do app.", 503);
  return json({ itens: Array.isArray(r.corpo && r.corpo.data) ? r.corpo.data : [] });
});

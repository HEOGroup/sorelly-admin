export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Quem é a representante desta conta (23/11/2026): o código do vendedor e o NOME que as telas usam (o do Agendamento, ex.: "Vanessa"),
// para o app dela gravar listagens e acertos com o mesmo nome que a Montagem e o Consolidado já leem.
//   GET /api/representante/eu -> {cod, nome}
import { erro, json, rota } from "@/server/http";
import { nomeDaRep } from "@/server/rep-filtro";
import { consulta } from "@/server/db";
import { ler } from "@/server/representantes-app";

export const GET = rota(async (req, { eu }) => {
  if (!eu.repCod) return erro("Esta conta não é de representante.", 404);
  const nome = (await nomeDaRep(eu.repCod)) || String(eu.nome || "").trim().split(/ +/).slice(0, 2).join(" ");
  const f = await consulta("select foto from sorelly.conta where id = $1", [eu.id]);
  // totais DELA vindos do app das revendedoras (Vendido Total e Acerto Total do Início); só a conta dela, nunca de outra representante
  let painel = null;
  try { const h = await ler("/representantes/home-summary?representativeCod=" + encodeURIComponent(eu.repCod) + "&incluirInativas=true"); const n = (v) => { const x = Number(v); return Number.isFinite(x) ? x : 0; }; painel = { vendido: n(h.totalSales), valorAcerto: n(h.settlementValue), pecas: n(h.piecesSold), revendedorasNoApp: n(h.revendedorasCount) }; } catch { painel = null; }
  return json({ cod: eu.repCod, nome, foto: (f.rows[0] && f.rows[0].foto) || "", painel });
});

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Quem é a representante desta conta (23/11/2026): o código do vendedor e o NOME que as telas usam (o do Agendamento, ex.: "Vanessa"),
// para o app dela gravar listagens e acertos com o mesmo nome que a Montagem e o Consolidado já leem.
//   GET /api/representante/eu -> {cod, nome}
import { erro, json, rota } from "@/server/http";
import { nomeDaRep } from "@/server/rep-filtro";
import { consulta } from "@/server/db";
import { ler } from "@/server/representantes-app";
import { codigosDe } from "@/server/rep-codigos";

export const GET = rota(async (req, { eu }) => {
  if (!eu.repCod) return erro("Esta conta não é de representante.", 404);
  const nome = (await nomeDaRep(eu.repCod)) || String(eu.nome || "").trim().split(/ +/).slice(0, 2).join(" ");
  const f = await consulta("select foto from sorelly.conta where id = $1", [eu.id]);
  // totais DELA vindos do app das revendedoras (Vendido Total e Acerto Total do Início); só a conta dela, nunca de outra representante
  let painel = null;
  // mais de um cadastro (Thalita: BI, CU, CV): o painel soma os totais de todos
  try {
    const n = (v) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
    const hs = await Promise.all(codigosDe(eu).map((c) => ler("/representantes/home-summary?representativeCod=" + encodeURIComponent(c) + "&incluirInativas=true").catch(() => null)));
    if (!hs.some(Boolean)) throw new Error("sem painel");
    painel = hs.filter(Boolean).reduce((a, h) => ({ vendido: a.vendido + n(h.totalSales), valorAcerto: a.valorAcerto + n(h.settlementValue), pecas: a.pecas + n(h.piecesSold), revendedorasNoApp: a.revendedorasNoApp + n(h.revendedorasCount) }), { vendido: 0, valorAcerto: 0, pecas: 0, revendedorasNoApp: 0 });
  } catch { painel = null; }
  return json({ cod: eu.repCod, nome, foto: (f.rows[0] && f.rows[0].foto) || "", painel });
});

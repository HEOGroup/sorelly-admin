export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Condicionais ABERTAS de várias revendedoras de uma vez (16/11/2026, Marcus: "liga as condicionais da DevMaster no kit").
//   GET /api/condicionais-kits?cods=005273,010571  ->  {cods:{ "005273":[{numero, emissao, previsao, pecas, valor}], "010571":[] }, vendas:{ "005273":[1200, 980, 1500] }}
// Só leitura (API 2, tabela dmafi: afi_status "A" = aberta). Mesmas exclusões da rota /api/representante/condicionais: vendedor 04 (expositor),
// 91 (encomenda) e previsão de devolução no ano 2100 em diante. Serve à equipe (Condicionais, Montagem, Bipagem); a representante usa a outra rota.
import { erro, json, rota } from "@/server/http";
import { todasAsPaginas } from "@/server/devmaster2";
import { ultimasVendasDeClientes } from "@/server/vendas-brinde";

const d10 = (v) => String(v || "").slice(0, 10);

export const GET = rota(async (req, { url }) => {
  const cods = [...new Set(String(url.searchParams.get("cods") || "").split(",").map((x) => x.replace(/\D/g, "")).filter(Boolean))];
  if (!cods.length) return erro("Informe ?cods=código,código (só números).", 400);
  if (cods.length > 120) return erro("No máximo 120 revendedoras por chamada.", 400);
  const saida = {};
  cods.forEach((c) => { saida[c] = []; });
  for (let i = 0; i < cods.length; i += 40) {
    const lote = cods.slice(i, i + 40);
    const linhas = await todasAsPaginas("dmafi", { filtro: { afi_cliente: { in: lote }, afi_status: "A" }, campos: ["afi_codigo", "afi_cliente", "afi_data", "afi_prevdevol", "afi_vendedor", "afi_qtditens", "afi_valormerc"] });
    linhas
      .filter((x) => x.afi_vendedor !== "04" && x.afi_vendedor !== "91" && Number(String(x.afi_prevdevol || "0").slice(0, 4)) < 2100)
      .forEach((x) => {
        const cod = String(x.afi_cliente || "").trim();
        const chave = saida[cod] ? cod : lote.find((c) => Number(c) === Number(cod));
        if (!chave) return;
        saida[chave].push({ numero: String(x.afi_codigo).trim(), emissao: d10(x.afi_data), previsao: d10(x.afi_prevdevol), pecas: Number(x.afi_qtditens) || 0, valor: Number(x.afi_valormerc) || 0 });
      });
  }
  Object.values(saida).forEach((l) => l.sort((a, b) => String(b.emissao).localeCompare(String(a.emissao))));
  // Vendas da MÉDIA (regra de 27/10/2026, docs/negocio/MEDIA-DE-VENDAS.md): as até 3 últimas, da mais nova para a mais antiga. Só valores, para o valor automático do kit.
  let vendas = {};
  try {
    const u = await ultimasVendasDeClientes(cods);
    cods.forEach((c) => { vendas[c] = (u[c] || []).map((x) => x.v); });
  } catch (e) { console.error("[condicionais-kits] vendas da média", e && e.message); vendas = null; }   // sem as vendas, só as condicionais seguem; o valor fica para a supervisão
  return json({ cods: saida, vendas });
});

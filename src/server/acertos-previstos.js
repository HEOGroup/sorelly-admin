// Sorelly Admin · servidor — acertos-previstos.js
// Quantas revendedoras têm acerto PREVISTO em cada mês (Marcus, 27/10/2026): vem da DATA DE DEVOLUÇÃO PREVISTA dos kits abertos na DevMaster (dmafi.afi_prevdevol),
// uma revendedora conta uma vez só, sem reposição e sem expositor (data no ano 3000). Só leitura.
// Também mede o CICLO dos kits entregues nos últimos 45 dias (30, 45 ou 60 dias), para prever os meses que ainda não têm data.
// Regras e contexto: docs/negocio/REVENDEDORAS-E-PREVISAO.md
import { todasAsPaginas } from "./devmaster2.js";

const G = globalThis, iso = (d) => d.toISOString().slice(0, 19), dia = (x) => String(x || "").slice(0, 10);

async function calcular() {
  const h = new Date(), hojeD = dia(h.toISOString()), ym = hojeD.slice(0, 7);
  const ini = new Date(h.getFullYear(), 0, 1), fim = new Date(h.getFullYear(), h.getMonth() + 5, 0);
  const abertos = await todasAsPaginas("dmafi", { filtro: { afi_status: "A", afi_prevdevol: { between: [iso(ini), iso(fim)] } }, campos: ["afi_cliente", "afi_prevdevol", "afi_xreposicao"] });
  // Acertos que ainda faltam no mês (Marcus, 27/10/2026: 303) = revendedoras com kit principal ABERTO e data prevista até o último dia do mês, inclusive as que já passaram da data e continuam pendentes.
  const porMes = {}, resto = new Set(), fimMes = dia(iso(new Date(h.getFullYear(), h.getMonth() + 1, 0, 12)));
  abertos.filter((x) => x.afi_xreposicao !== "S").forEach((x) => {
    const m = dia(x.afi_prevdevol).slice(0, 7); (porMes[m] || (porMes[m] = new Set())).add(x.afi_cliente);
    if (dia(x.afi_prevdevol) <= fimMes) resto.add(x.afi_cliente);
  });
  const desde = new Date(h.getTime() - 45 * 86400000);
  const emitidos = await todasAsPaginas("dmafi", { filtro: { afi_data: { between: [iso(desde), iso(h)] } }, campos: ["afi_cliente", "afi_data", "afi_prevdevol", "afi_xreposicao", "afi_valormerc"] });
  const cic = { c30: new Set(), c45: new Set(), c60: new Set(), t: new Set() };
  emitidos.filter((x) => x.afi_xreposicao !== "S" && Number(x.afi_valormerc) >= 1500).forEach((x) => {
    const d = Math.round((new Date(dia(x.afi_prevdevol)) - new Date(dia(x.afi_data))) / 86400000); if (d > 700 || d < 0) return;
    cic.t.add(x.afi_cliente); (d <= 35 ? cic.c30 : d <= 50 ? cic.c45 : cic.c60).add(x.afi_cliente);
  });
  const n = cic.t.size || 1;
  return { geradoEm: new Date().toISOString(), mes: ym, restoMes: resto.size, porMes: Object.fromEntries(Object.entries(porMes).sort().map(([k, v]) => [k, v.size])), ciclo: { n: cic.t.size, c30: cic.c30.size / n, c45: cic.c45.size / n, c60: cic.c60.size / n } };
}

// cache de 30 minutos; leitura única por vez
export async function acertosPrevistos({ forcar = false } = {}) {
  const c = G.__sorellyAP;
  if (!forcar && c && c.dados && Date.now() - c.em < 30 * 60000) return c.dados;
  if (c && c.pend) return c.pend;
  const pend = calcular().then((dados) => { G.__sorellyAP = { dados, em: Date.now() }; return dados; }).finally(() => { if (G.__sorellyAP) delete G.__sorellyAP.pend; });
  G.__sorellyAP = Object.assign({}, c, { pend });
  return pend;
}

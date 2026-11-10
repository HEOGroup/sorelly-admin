export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Expositores em campo (09/11/2026, Marcus): TODAS as revendedoras que estão com expositor, separadas em três grupos. Só leitura, da DevMaster API 2.
//   GET /api/expositores/revendedoras -> {total, itens:[{cod, nome, celular, cidade, uf, representante, dias, desde, ultimaVenda, modelos:[{m,q}], pecas, valor, kitDias, kitDesde, categoria}]}
//   categoria: "semkit"  = só tem expositor, nenhum kit aberto
//              "comkit"  = tem kit aberto há até 70 dias (kit ativo)
//              "kitvelho" = tem kit aberto há MAIS de 70 dias (contado da emissão da condicional de kit mais antiga, inclusive previsão vencida e kit em Inadimplência)
// Expositor = condicional do vendedor 04 ou sem previsão (ano 3000) com menos de 10 joias dentro. Com 10 joias ou mais é KIT que ficou sem previsão (ex.: vendedor DE "Inadimplencia").
// Peça na condicional = a revendedora está com kit: regra do Marcus em 09/11/2026.
import { json, rota } from "@/server/http";
import { todasAsPaginas } from "@/server/devmaster2";
import { listaRevendedoras, vendedores } from "@/server/revendedoras";

const LIMITE_KIT_ATIVO = 70;
const joiasDe = (c) => (c.it || []).reduce((t, x) => t + (x.g === "Peças de joia" ? x.q : 0), 0);
const ehExpositor = (c) => c.t === "Expositor" && joiasDe(c) < 10;
const ehKit = (c) => !ehExpositor(c) && c.t !== "Encomenda";
const dias = (iso, agora) => (iso ? Math.max(0, Math.floor((agora - new Date(iso + "T12:00:00").getTime()) / 86400000)) : null);

// kits que a base não traz (previsão vencida em anos anteriores a 2026): data de emissão mais antiga por revendedora
async function kitsVencidos(codigos) {
  const res = new Map();
  for (let i = 0; i < codigos.length; i += 100) {
    const lote = await todasAsPaginas("dmafi", { filtro: { afi_status: "A", afi_prevdevol: { lt: "2026-01-01T00:00:00" }, afi_cliente: { in: codigos.slice(i, i + 100) } }, campos: ["afi_cliente", "afi_vendedor", "afi_data"] });
    lote.forEach((x) => {
      const v = String(x.afi_vendedor || "").trim();
      if (v === "04" || v === "91") return;
      const d = String(x.afi_data || "").slice(0, 10);
      if (!res.get(x.afi_cliente) || d < res.get(x.afi_cliente)) res.set(x.afi_cliente, d);
    });
  }
  return res;
}

// última venda = o acerto fechado (dmach, situação F, não cancelado) mais recente, de QUALQUER valor. A lista de vendas da tela Revendedoras só guarda venda com valor líquido: acerto de indicação, troca ou só brinde some dali (ex.: Viviane, 16/09/2026).
async function ultimasVendas(codigos) {
  const res = new Map();
  for (let i = 0; i < codigos.length; i += 100) {
    const lote = await todasAsPaginas("dmach", { filtro: { ach_situacao: "F", ach_cliente: { in: codigos.slice(i, i + 100) }, ach_emissao: { gte: "2024-01-01T00:00:00" } }, campos: ["ach_cliente", "ach_emissao", "ach_datacanc"] });
    lote.forEach((x) => {
      if (x.ach_datacanc) return;
      const d = String(x.ach_emissao || "").slice(0, 10);
      if (d && (!res.get(x.ach_cliente) || d > res.get(x.ach_cliente))) res.set(x.ach_cliente, d);
    });
  }
  return res;
}

// última representante de quem está sem kit: vendedor da condicional mais nova que não seja expositor (04), encomenda (91), Inadimplência (DE) nem sem previsão
async function ultimaRepresentante(codigos) {
  const nomes = await vendedores(), res = new Map();
  for (let i = 0; i < codigos.length; i += 100) {
    const lote = await todasAsPaginas("dmafi", { filtro: { afi_cliente: { in: codigos.slice(i, i + 100) } }, campos: ["afi_cliente", "afi_vendedor", "afi_data", "afi_prevdevol"] });
    lote.forEach((x) => {
      const v = String(x.afi_vendedor || "").trim();
      if (!v || v === "04" || v === "91" || v === "DE" || Number(String(x.afi_prevdevol || "").slice(0, 4)) >= 2100) return;
      const atual = res.get(x.afi_cliente), d = String(x.afi_data || "").slice(0, 10);
      if (!atual || d > atual.d) res.set(x.afi_cliente, { d, nome: nomes.get(v) || v });
    });
  }
  return res;
}

export const GET = rota(async () => {
  const dados = await listaRevendedoras();
  const agora = Date.now();
  const donos = dados.itens.filter((i) => i.conds.some(ehExpositor));
  const codigos = donos.map((i) => i.cod);
  const vencidos = await kitsVencidos(codigos), vendas = await ultimasVendas(codigos);
  const semKit = donos.filter((i) => !i.conds.some(ehKit) && !vencidos.has(i.cod));
  const ultima = await ultimaRepresentante(semKit.map((i) => i.cod));
  const itens = donos.map((i) => {
    const exp = i.conds.filter(ehExpositor), kits = i.conds.filter(ehKit);
    const datasKit = kits.map((c) => c.e).filter(Boolean).concat(vencidos.has(i.cod) ? [vencidos.get(i.cod)] : []).sort();
    const kitDesde = datasKit[0] || "", kitDias = dias(kitDesde, agora);
    const desde = exp.map((c) => c.e).filter(Boolean).sort()[0] || "";
    const por = new Map(), grupos = new Map();
    exp.forEach((c) => (c.it || []).forEach((x) => { if (x.g === "Peças de joia") return; por.set(x.m, (por.get(x.m) || 0) + x.q); grupos.set(x.g, (grupos.get(x.g) || 0) + x.q); }));
    const categoria = kitDias === null ? "semkit" : kitDias > LIMITE_KIT_ATIVO ? "kitvelho" : "comkit";
    return {
      cod: i.cod, nome: i.nome, celular: i.celular || "", cidade: i.cidade || "", uf: i.uf || "",
      representante: categoria === "semkit" ? ((ultima.get(i.cod) || {}).nome || "") : (i.representante === "Sem representante" ? "" : i.representante),
      dias: dias(desde, agora), desde, ultimaVenda: vendas.get(i.cod) || "",
      modelos: [...por.entries()].map(([m, q]) => ({ m, q })), resumo: [...grupos.entries()].map(([g, q]) => q + " " + g).join(", "), pecas: exp.reduce((t, c) => t + c.p, 0), valor: exp.reduce((t, c) => t + c.v, 0),
      kitDias, kitDesde, categoria,
    };
  }).sort((a, b) => (b.dias ?? -1) - (a.dias ?? -1));
  return json({ total: itens.length, limiteKitAtivo: LIMITE_KIT_ATIVO, geradoEm: dados.geradoEm, itens });
});

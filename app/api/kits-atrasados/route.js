export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Kits em aberto há mais de N dias (09/11/2026, Marcus: "vendedoras com mais de 90 com kit"). Só leitura, da DevMaster API 2.
//   GET /api/kits-atrasados?dias=90 -> {dias, total, itens:[{cod, nome, celular, cidade, uf, representante, desde, dias, condicionais, pecas, valor, saldo, emInadimplencia}]} (mais antigas primeiro)
// Conta: condicional ABERTA (status A) emitida há mais de N dias, que não seja expositor (vendedor 04) nem encomenda (91). Olha também previsões vencidas em anos anteriores.
// Kit com vendedor DE ("Inadimplencia") entra marcado em `emInadimplencia`. Representante = vendedor da condicional mais antiga que não seja DE, 04 nem 91.
import { json, rota } from "@/server/http";
import { consultarTabela, todasAsPaginas } from "@/server/devmaster2";
import { municipios, nomeNormal, vendedores } from "@/server/revendedoras";

export const GET = rota(async (req, { url }) => {
  const dias = Math.max(1, Number(url.searchParams.get("dias")) || 90);
  const corte = new Date(Date.now() - dias * 86400000).toISOString().slice(0, 10) + "T23:59:59";
  const conds = await todasAsPaginas("dmafi", { filtro: { afi_status: "A", afi_data: { lte: corte } }, campos: ["afi_codigo", "afi_cliente", "afi_vendedor", "afi_data", "afi_prevdevol", "afi_qtditens", "afi_valormerc", "afi_valorsaldo"] });
  const nomes = await vendedores();
  const por = new Map();
  conds.forEach((x) => {
    const v = String(x.afi_vendedor || "").trim();
    if (v === "04" || v === "91" || !x.afi_cliente) return;
    (por.get(x.afi_cliente) || por.set(x.afi_cliente, []).get(x.afi_cliente)).push(x);
  });
  const codigos = [...por.keys()], pessoas = new Map();
  for (let i = 0; i < codigos.length; i += 250) {
    const lote = await consultarTabela("dmaam", { registros: 500, campos: ["aam_codigo", "aam_nome", "aam_municipio", "aam_estado", "aam_celular", "aam_whatsapp"], filtro: { aam_codigo: { in: codigos.slice(i, i + 250) } } });
    lote.itens.forEach((p) => pessoas.set(p.aam_codigo, p));
  }
  const mun = await municipios([...pessoas.values()].map((p) => String(p.aam_municipio || "")));
  const hoje = Date.now();
  const itens = codigos.map((cod) => {
    const l = por.get(cod).sort((a, b) => String(a.afi_data).localeCompare(String(b.afi_data))), p = pessoas.get(cod) || {}, m = mun.get(String(p.aam_municipio || "")) || {};
    const reps = l.filter((x) => String(x.afi_vendedor).trim() !== "DE"), rep = (reps[0] || {}).afi_vendedor;
    const desde = String(l[0].afi_data || "").slice(0, 10);
    return { cod, nome: nomeNormal(p.aam_nome), celular: p.aam_celular || p.aam_whatsapp || "", cidade: m.nome || "", uf: m.uf || String(p.aam_estado || "").toUpperCase(),
      representante: rep ? (nomes.get(String(rep).trim()) || rep) : "Sem representante", desde, dias: Math.floor((hoje - new Date(desde + "T12:00:00").getTime()) / 86400000),
      condicionais: l.length, pecas: l.reduce((t, x) => t + (Number(x.afi_qtditens) || 0), 0), valor: l.reduce((t, x) => t + (Number(x.afi_valormerc) || 0), 0), saldo: l.reduce((t, x) => t + (Number(x.afi_valorsaldo) || 0), 0),
      emInadimplencia: l.some((x) => String(x.afi_vendedor).trim() === "DE") };
  }).sort((a, b) => b.dias - a.dias);
  return json({ dias, total: itens.length, geradoEm: new Date().toISOString(), itens });
});

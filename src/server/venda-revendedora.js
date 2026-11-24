// Sorelly Admin — src/server/venda-revendedora.js
// VENDA DA REVENDEDORA (Marcus, 24/11/2026): na janela "Editar pagamento" do Resumo - Pagamentos aparece o valor da venda da revendedora que fez o Pix.
// Acha a revendedora ATIVA pelo nome (a mesma lista da Contas a receber) e lê da DevMaster, só leitura, as vendas dela (dmach) perto da data do Pix:
//   valor de venda = ach_valormerc · comissão = ach_valordesc · valor do acerto = ach_valortotal. Devolve até 4 vendas, as mais próximas da data.
import { todasAsPaginas } from "./devmaster2.js";
import { revendedorasAtivasBasico } from "./revendedoras.js";

const sa = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const mais = (iso, d) => { const x = new Date(iso + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + d); return x.toISOString().slice(0, 10); };
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export async function vendasDaRevendedora(nome, data) {
  const n = sa(nome);
  if (n.length < 3) return { erro: "Informe o nome da revendedora." };
  const lista = await revendedorasAtivasBasico();
  let r = lista.find((x) => sa(x.nome) === n);
  if (!r) { const ws = n.split(" "), c = lista.filter((x) => { const m = sa(x.nome); return ws.every((w) => m.includes(w)); }); r = c.length === 1 ? c[0] : null; }
  if (!r) return { erro: "Não achei esta revendedora entre as ativas." };
  const d0 = /^\d{4}-\d{2}-\d{2}$/.test(String(data || "")) ? String(data) : new Date().toISOString().slice(0, 10);
  const v = await todasAsPaginas("dmach", { filtro: { ach_cliente: r.cod, ach_datafat: { between: [mais(d0, -75) + "T00:00:00", mais(d0, 45) + "T23:59:59"] } }, campos: ["ach_codigo", "ach_datafat", "ach_valormerc", "ach_valordesc", "ach_valortotal"] });
  const alvo = new Date(d0 + "T12:00:00Z").getTime();
  const vendas = v.map((x) => ({ codigo: String(x.ach_codigo || ""), data: String(x.ach_datafat || "").slice(0, 10), venda: r2(x.ach_valormerc), comissao: r2(x.ach_valordesc), acerto: r2(x.ach_valortotal) }))
    .filter((x) => x.data)
    .sort((a, b) => Math.abs(new Date(a.data + "T12:00:00Z").getTime() - alvo) - Math.abs(new Date(b.data + "T12:00:00Z").getTime() - alvo))
    .slice(0, 4)
    .sort((a, b) => b.data.localeCompare(a.data));
  return { cod: r.cod, nome: r.nome, representante: r.representante || "", vendas };
}

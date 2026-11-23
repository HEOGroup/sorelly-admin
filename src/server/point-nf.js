// Boletos da Point lidos da DevMaster (SÓ LEITURA), ligados pela NOTA FISCAL (Marcus, 23/11/2026).
// A Point emite as notas em nome de outras empresas (C Group Ind. e Com. de Acessórios da Moda, Mayz Comércio de Moda Praia...). Na DevMaster, cada nota vira uma série de boletos
// (20% com nota; os outros 80% são Pix revendedora, lançados no Admin). O número da nota está no histórico do título ("NF 22.574 - C GROUP...").
// Devolve {geradoEm, boletos:[{nf, titulo, parcela, emissao, venc, valor, saldo, sit}]}; nf sem pontos ("22574"). Cache de 10 minutos.
import * as dm from "@/server/devmaster2";

const TTL = 10 * 60 * 1000, G = globalThis;
const FORNECEDORES = ["000127", "000165", "001406"];   // C GROUP (POINT), POINT IMPORTS, FD ACESS (POINT)
const r2 = (n) => Math.round(Number(n || 0) * 100) / 100;
const dia = (v) => String(v || "").slice(0, 10);

export function notaDoHistorico(h) {
  const m = String(h || "").match(/(?:NF|N[º°o])\s*\.?\s*(\d{1,3}(?:\.\d{3})+|\d{4,6})/i);
  return m ? m[1].replace(/\./g, "") : "";
}

async function montar() {
  const linhas = await dm.todasAsPaginas("dmabe", {
    filtro: { abe_fornecedor: { in: FORNECEDORES }, abe_emissao: { gte: "2026-01-01" } },
    campos: ["abe_numero", "abe_parcela", "abe_emissao", "abe_vencimento", "abe_valorreais", "abe_saldo", "abe_situacao", "abe_historico"],
  });
  const boletos = linhas.map((x) => ({
    nf: notaDoHistorico(x.abe_historico), titulo: String(x.abe_numero || ""), parcela: String(x.abe_parcela || ""), emissao: dia(x.abe_emissao), venc: dia(x.abe_vencimento),
    valor: r2(x.abe_valorreais), saldo: r2(x.abe_saldo), sit: String(x.abe_situacao || ""),
  })).filter((b) => b.nf && b.valor > 0).sort((a, b) => a.venc.localeCompare(b.venc));
  return { geradoEm: new Date().toISOString(), boletos };
}

export async function boletosDaPoint({ forcar = false } = {}) {
  const c = G.__pointNf;
  if (!forcar && c && Date.now() - c.em < TTL) return c.dados;
  if (!G.__pointNfP) G.__pointNfP = montar().then((d) => { G.__pointNf = { em: Date.now(), dados: d }; return d; }).finally(() => { G.__pointNfP = null; });
  return G.__pointNfP;
}

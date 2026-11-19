// Arrumar na DevMaster (Marcus, 19/11/2026: "tela de coisas para arrumar a DevMaster, depois de Relatórios, no estilo do Resumo geral").
// Lista, título por título, o que está ERRADO na DevMaster e só dá para corrigir lá (a DevMaster é lida em modo só leitura; nada é gravado):
//   sem vencimento      título a pagar (situação A ou P) sem data de vencimento
//   ano errado          título a pagar com vencimento antes de 2020 ou depois de 2100 (ex.: 0226 no lugar de 2026)
//   baixado com saldo   título baixado (situação B) que ainda tem saldo
// Cache de 5 minutos. ?agora=1 ignora o cache. Acesso: Financeiro e Diretoria (conferido na rota).
import * as dm from "@/server/devmaster2";

const TTL = 5 * 60 * 1000, G = globalThis;
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const dia = (v) => (v ? String(v).slice(0, 10) : "");
const ONDE = "DevMaster › Contas a Pagar";
const CAMPOS = ["abe_prefixo", "abe_numero", "abe_parcela", "abe_emissao", "abe_fornecedor", "abe_historico", "abe_valorreais", "abe_saldo", "abe_vencimento", "abe_situacao"];

// ano que veio errado com três algarismos (0226-11-21 ou 0026-11-21): sugere o mesmo dia e mês no ano 20xx (2026-11-21); outro erro, só pede para corrigir
function corrigirAno(venc) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(venc || "");
  if (!m) return "";
  const a = Number(m[1]);
  return a < 1000 ? (2000 + (a % 100)) + "-" + m[2] + "-" + m[3] : "";
}

async function montar() {
  const [semVenc, anoBaixo, anoAlto, pagoSaldo] = await Promise.all([
    dm.todasAsPaginas("dmabe", { filtro: { abe_situacao: { in: ["A", "P"] }, abe_vencimento: { nulo: true } }, campos: CAMPOS }),
    dm.todasAsPaginas("dmabe", { filtro: { abe_situacao: { in: ["A", "P"] }, abe_vencimento: { lt: "2020-01-01" } }, campos: CAMPOS }),
    dm.todasAsPaginas("dmabe", { filtro: { abe_situacao: { in: ["A", "P"] }, abe_vencimento: { gt: "2100-12-31" } }, campos: CAMPOS }),
    dm.todasAsPaginas("dmabe", { filtro: { abe_situacao: "B", abe_saldo: { gt: 0 } }, campos: CAMPOS }),
  ]);
  const cods = [...new Set([...semVenc, ...anoBaixo, ...anoAlto, ...pagoSaldo].map((t) => String(t.abe_fornecedor || "").trim()).filter(Boolean))];
  const nomes = new Map();
  for (let i = 0; i < cods.length; i += 100) {
    const nm = await dm.todasAsPaginas("dmaam", { filtro: { aam_codigo: { in: cods.slice(i, i + 100) } }, campos: ["aam_codigo", "aam_nome"] });
    nm.forEach((n) => nomes.set(String(n.aam_codigo).trim(), String(n.aam_nome || "").replace(/\s+/g, " ").replace(/[-\s]+$/, "").trim()));
  }
  const item = (t, problema, vencimento, corrigirPara) => {
    const cod = String(t.abe_fornecedor || "").trim();
    return {
      id: problema + "|" + t.abe_prefixo + "|" + t.abe_numero + "|" + t.abe_parcela,
      problema, titulo: [String(t.abe_prefixo || "").trim(), String(t.abe_numero || "").trim()].filter(Boolean).join(" ") + "/" + String(t.abe_parcela || "").trim(),
      emissao: dia(t.abe_emissao), fornecedor: cod ? (cod + " · " + (nomes.get(cod) || "sem nome")) : "—",
      historico: String(t.abe_historico || "").replace(/\s+/g, " ").trim(), valor: r2(t.abe_valorreais), saldo: r2(t.abe_saldo),
      vencimento: vencimento, corrigirPara, onde: ONDE,
    };
  };
  const itens = [
    ...semVenc.map((t) => item(t, "Sem vencimento", "", "Definir a data")),
    ...[...anoBaixo, ...anoAlto].map((t) => item(t, "Ano do vencimento errado", dia(t.abe_vencimento), corrigirAno(dia(t.abe_vencimento)) || "Corrigir o ano")),
    ...pagoSaldo.map((t) => item(t, "Baixado com saldo", dia(t.abe_vencimento), "Zerar o saldo")),
  ].sort((a, b) => (a.problema === b.problema ? (a.emissao < b.emissao ? 1 : a.emissao > b.emissao ? -1 : a.titulo.localeCompare(b.titulo)) : a.problema.localeCompare(b.problema, "pt-BR")));
  const resumo = ["Sem vencimento", "Ano do vencimento errado", "Baixado com saldo"].map((p) => {
    const ls = itens.filter((x) => x.problema === p);
    return { problema: p, qtd: ls.length, valor: r2(ls.reduce((s, x) => s + (p === "Baixado com saldo" ? x.saldo : x.valor), 0)), onde: ONDE };
  });
  return { geradoEm: new Date().toISOString(), itens, resumo };
}

export async function arrumarDevmaster({ forcar = false } = {}) {
  const c = (G.__sorellyArrumarDM = G.__sorellyArrumarDM || {});
  if (!forcar && c.dados && Date.now() - c.em < TTL) return c.dados;
  const dados = await montar();
  G.__sorellyArrumarDM = { em: Date.now(), dados };
  return dados;
}

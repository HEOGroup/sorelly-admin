// Atividades do Financeiro (18/11/2026, pedido do Marcus: "uma aba de atividades do financeiro que fica somente para mim, com todas as atividades").
// Lê da DevMaster (API 2, só leitura) o que cada pessoa fez no financeiro nos últimos dias: baixas de recebimento e de pagamento, estornos, transferências entre contas,
// títulos a pagar lançados, extratos importados (conciliação) e os erros de data que precisam de correção. Cache de 10 minutos por período.
//   linhas:   [{dia, cod, pessoa, tipo, n, valor, de, ate}]   uma linha por dia + pessoa + tipo de movimento (dmabf, pela data em que o movimento foi GERADO, abf_data)
//   titulos:  [{dia, n, valor}]                                títulos a pagar lançados por dia (dmabe, pela emissão; a tabela não guarda quem lançou)
//   extratos: [{conta, ultimo, pendentes}]                     último dia de extrato importado por conta e quantas linhas ainda não foram conciliadas (dmajt, 60 dias)
//   erros:    {semVencimento, anoErrado, pagoComSaldo}         contagem de títulos com problema de data (dmabe)
// ACESSO: só as pessoas de LEITORES_ATIVIDADES_FIN (conferido pelo pessoaId da conta, na rota).
import * as dm from "@/server/devmaster2";

export const LEITORES_ATIVIDADES_FIN = [16];   // Marcus
export const podeVerAtividadesFin = (eu) => !!eu && eu.pessoaId != null && LEITORES_ATIVIDADES_FIN.includes(Number(eu.pessoaId));

const TTL = 10 * 60 * 1000, G = globalThis;
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const TIPOS = { REC: "Baixa de recebimento", PAG: "Baixa de pagamento", ESS: "Estorno de pagamento", ESE: "Estorno de recebimento", SAN: "Transferência (saída)", SUP: "Transferência (entrada)", DEP: "Depósito", SAQ: "Saque", CHD: "Cheque devolvido", CRN: "Cheque renegociado" };
const isoLocal = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const diaMenos = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return isoLocal(d); };

async function montar(dias) {
  const de = diaMenos(dias - 1), de60 = diaMenos(60);
  const [movs, usuarios, contas, titulos, extrato, semVenc, anoErr, pagoSaldo] = await Promise.all([
    dm.todasAsPaginas("dmabf", { filtro: { abf_data: { gte: de + "T00:00:00" } }, campos: ["abf_usumov", "abf_tipodoc", "abf_valorreais", "abf_data"] }),
    dm.todasAsPaginas("dmzzx", { campos: ["zzx_codigo", "zzx_nome"] }),
    dm.todasAsPaginas("dmaap", { campos: ["aap_codigo", "aap_conta", "aap_nome"] }),
    dm.todasAsPaginas("dmabe", { filtro: { abe_emissao: { gte: de } }, campos: ["abe_emissao", "abe_valor"] }),
    dm.todasAsPaginas("dmajt", { filtro: { ajt_data: { gte: de60 } }, campos: ["ajt_banco", "ajt_conta", "ajt_data", "ajt_conciliado"] }),
    dm.todasAsPaginas("dmabe", { filtro: { abe_situacao: { in: ["A", "P"] }, abe_vencimento: { nulo: true } }, campos: ["abe_numero"] }),
    dm.todasAsPaginas("dmabe", { filtro: { abe_situacao: { in: ["A", "P"] }, abe_vencimento: { lt: "2020-01-01" } }, campos: ["abe_numero"] }),
    dm.todasAsPaginas("dmabe", { filtro: { abe_situacao: "B", abe_saldo: { gt: 0 } }, campos: ["abe_numero"] }),
  ]);
  const nomeUsu = new Map(usuarios.map((u) => [u.zzx_codigo, String(u.zzx_nome || "").trim()]));
  const nomeConta = new Map(contas.map((c) => [c.aap_codigo + "|" + String(c.aap_conta || "").trim(), String(c.aap_nome || "").trim()]));

  const grupos = new Map();
  movs.forEach((m) => {
    const quando = String(m.abf_data || ""), dia = quando.slice(0, 10), hora = quando.slice(11, 16);
    if (dia < de) return;
    const cod = String(m.abf_usumov || "").trim() || "—", tipo = TIPOS[m.abf_tipodoc] || String(m.abf_tipodoc || "Outro");
    const k = dia + "|" + cod + "|" + tipo;
    let g = grupos.get(k);
    if (!g) { g = { dia, cod, pessoa: nomeUsu.get(cod) || (cod === "—" ? "Sem usuário" : "Usuário " + cod), tipo, n: 0, valor: 0, de: hora, ate: hora }; grupos.set(k, g); }
    g.n++; g.valor = r2(g.valor + (Number(m.abf_valorreais) || 0));
    if (hora && (!g.de || hora < g.de)) g.de = hora;
    if (hora && hora > g.ate) g.ate = hora;
  });
  const linhas = [...grupos.values()].sort((a, b) => (a.dia < b.dia ? 1 : a.dia > b.dia ? -1 : a.pessoa.localeCompare(b.pessoa, "pt-BR") || a.tipo.localeCompare(b.tipo, "pt-BR")));

  const porDia = new Map();
  titulos.forEach((t) => { const dia = String(t.abe_emissao || "").slice(0, 10); if (!dia || dia < de) return; const g = porDia.get(dia) || { dia, n: 0, valor: 0 }; g.n++; g.valor = r2(g.valor + (Number(t.abe_valor) || 0)); porDia.set(dia, g); });

  const porConta = new Map();
  extrato.forEach((x) => {
    const k = x.ajt_banco + "|" + String(x.ajt_conta || "").trim(), dia = String(x.ajt_data || "").slice(0, 10);
    const g = porConta.get(k) || { conta: nomeConta.get(k) || k.replace("|", " "), ultimo: "", pendentes: 0 };
    if (dia > g.ultimo) g.ultimo = dia;
    if (x.ajt_conciliado !== "S") g.pendentes++;
    porConta.set(k, g);
  });

  return {
    geradoEm: new Date().toISOString(), de, ate: diaMenos(0), dias,
    linhas, titulos: [...porDia.values()].sort((a, b) => (a.dia < b.dia ? 1 : -1)),
    extratos: [...porConta.values()].sort((a, b) => a.conta.localeCompare(b.conta, "pt-BR")),
    erros: { semVencimento: semVenc.length, anoErrado: anoErr.length, pagoComSaldo: pagoSaldo.length },
  };
}

export async function atividadesFinanceiro({ dias = 7, forcar = false } = {}) {
  const d = [1, 7, 30].includes(Number(dias)) ? Number(dias) : 7;
  const c = (G.__sorellyAtivFin = G.__sorellyAtivFin || {});
  if (!forcar && c[d] && Date.now() - c[d].em < TTL) return c[d].dados;
  const dados = await montar(d);
  c[d] = { em: Date.now(), dados };
  return dados;
}

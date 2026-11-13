// Contas a pagar e contas pagas lidas direto da DevMaster API 2 (só leitura), sem planilha e sem script no computador do Marcus. Cache de 10 minutos.
//   apagar = títulos em aberto (dmabe, situação A e P com saldo)  | pagas = baixas do ano (dmabf, abf_tipo S, origem P, sem estorno)
// Mesmos formatos dos arquivos locais antigos (domain/contas-empresa.js):
//   apagar: [filial, natureza, nomeNatureza, prefixo, número, parcela, fornecedorCod, título, emissão, vencimento, valor, saldo, diasAtraso]
//   pagas:  [filial, natureza, nomeNatureza, prefixo, número, parcela, fornecedorCod, título, baixa, vencimento, valor]
// CNPJ das contas PAGAS = pela CONTA BANCÁRIA usada (regra do Marcus, 28/10/2026): nome da conta termina em 34/46/59/67, ou traz Axis (67), Serenity (59), Comércio (46), Atacadista (34); Caixa e contas pessoais = "fora".
// CNPJ das contas A PAGAR = filial da DevMaster (01=34, 02=46, 03=59, 04=fora, 05=67); só para vencimento até 31/12/2026 vale antes o CNPJ que o Marcus já conferiu (módulo cpfil no banco).
import * as dm from "@/server/devmaster2";
import { consulta } from "@/server/db";

const TTL = 10 * 60 * 1000, G = globalThis;
const FILIAL = { "01": "34", "02": "46", "03": "59", "04": "fora", "05": "67" };
const INICIO_ANO = "2026-01-01";
const r2 = (n) => Math.round(n * 100) / 100;
const dia = (v) => String(v || "").slice(0, 10);
const tudo = (codigo, base) => dm.todasAsPaginas(codigo, base);

export function cnpjDaConta(banco, nomeConta) {
  const n = String(nomeConta || "").toUpperCase();
  if (/^CX/.test(String(banco || ""))) return "fora";
  if (/HESS E OLIVEIRA/.test(n)) return "fora";   // Hess & Oliveira = filial 04, por fora (tem "Atacadista" no nome, mas não é o CNPJ 34)
  if (/LIMITE ROTATIVO/.test(n)) return "34";   // Sicredi Limite Rotativo = Sicredi Rotativo 34 do Contas bancárias
  const m = n.match(/(?:^|[\s-])(34|46|59|67)\s*$/);
  if (m) return m[1];
  if (/AXIS/.test(n)) return "67";
  if (/SERENITY/.test(n)) return "59";
  if (/COM[ÉE]RCIO/.test(n)) return "46";
  if (/ATACADISTA/.test(n)) return "34";
  return "fora";
}

async function conhecidos() {
  try {
    const r = await consulta("select conteudo from sorelly.estado_modulo where modulo = 'cpfil'");
    return new Map(Object.entries((r.rows[0] && r.rows[0].conteudo && r.rows[0].conteudo.mapa) || {}));
  } catch { return new Map(); }
}

async function montar() {
  const hoje = new Date().toISOString().slice(0, 10);
  const diasAtraso = (v) => Math.max(0, Math.round((new Date(hoje + "T12:00:00") - new Date(v + "T12:00:00")) / 864e5));
  const [forn, nat, contas, known] = await Promise.all([
    tudo("dmaat", { campos: ["aat_codigo", "aat_nome"] }),
    tudo("dmaan", { campos: ["aan_codigo", "aan_descricao"] }),
    tudo("dmaap", { campos: ["aap_codigo", "aap_agencia", "aap_conta", "aap_nome"] }),
    conhecidos(),
  ]);
  const nomeForn = new Map(forn.map((f) => [f.aat_codigo, String(f.aat_nome || "").trim()]));
  const nomeNat = new Map(nat.map((n) => [n.aan_codigo, String(n.aan_descricao || "").trim()]));
  const nomeConta = new Map(contas.map((c) => [[c.aap_codigo, c.aap_agencia, c.aap_conta].join("|"), c.aap_nome]));

  const leAbertos = Promise.all(["A", "P"].map((sit) => tudo("dmabe", { filtro: { abe_situacao: sit }, campos: ["abe_prefixo", "abe_numero", "abe_parcela", "abe_fornecedor", "abe_emissao", "abe_vencimento", "abe_valor", "abe_saldo", "abe_natureza", "abe_filialorigem"] })));
  const leBaixas = tudo("dmabf", { filtro: { abf_tipo: "S", abf_tpcontaorigem: "P", abf_datadebito: { gte: INICIO_ANO } }, campos: ["abf_banco", "abf_agencia", "abf_conta", "abf_datapgto", "abf_datadebito", "abf_valorreais", "abf_estornado", "abf_natureza", "abf_tpclifor", "abf_clifor", "abf_prefixo", "abf_numero", "abf_parcela"] });
  const abertos = (await leAbertos).flat();
  const apagar = abertos.filter((x) => x.abe_saldo > 0.004).map((x) => {
    const k = [x.abe_prefixo, x.abe_numero, x.abe_parcela, x.abe_fornecedor].join("|"), venc = dia(x.abe_vencimento);
    // Previsões de 2027 (salário, adiantamento, cartão...) são lançadas por filial DE PROPÓSITO (a Nayale confirmou em 28/10/2026): vale a filial da DevMaster. Antes de 2027 vale o CNPJ que o Marcus conferiu.
    const fil = (venc >= "2027-01-01" ? null : known.get(k)) || FILIAL[x.abe_filialorigem] || "fora";
    return [fil, x.abe_natureza, nomeNat.get(x.abe_natureza) || "", x.abe_prefixo, x.abe_numero, x.abe_parcela, x.abe_fornecedor, nomeForn.get(x.abe_fornecedor) || "", dia(x.abe_emissao), venc, r2(x.abe_valor), r2(x.abe_saldo), diasAtraso(venc)];
  }).sort((a, b) => (a[9] < b[9] ? -1 : a[9] > b[9] ? 1 : 0));

  const baixas = await leBaixas;
  const pagas = [], diario = {};
  for (const b of baixas) {
    if (b.abf_estornado === "S") continue;
    const d = dia(b.abf_datadebito || b.abf_datapgto), fil = cnpjDaConta(b.abf_banco, nomeConta.get([b.abf_banco, b.abf_agencia, b.abf_conta].join("|"))), valor = r2(b.abf_valorreais);
    const f = b.abf_tpclifor === "F" ? b.abf_clifor : "";
    pagas.push([fil, b.abf_natureza, nomeNat.get(b.abf_natureza) || "", b.abf_prefixo, b.abf_numero, b.abf_parcela, f, nomeForn.get(f) || "", d, d, valor]);
    const x = (diario[d] = diario[d] || { cnpjs: {}, contasPorFora: 0 });
    if (fil === "fora") x.contasPorFora = r2(x.contasPorFora + valor); else x.cnpjs[fil] = r2((x.cnpjs[fil] || 0) + valor);
  }
  return { geradoEm: new Date().toISOString(), apagar, pagas, diario };
}

// forcar = ignora o cache. Duas chamadas ao mesmo tempo esperam a mesma leitura.
export async function contasDaDevmaster({ forcar = false } = {}) {
  const c = (G.__sorellyContasDm = G.__sorellyContasDm || {});
  if (!forcar && c.dados && Date.now() - c.em < TTL) return c.dados;
  if (!c.lendo) c.lendo = montar().then((dados) => { c.dados = dados; c.em = Date.now(); return dados; }).finally(() => { c.lendo = null; });
  return c.lendo;
}

// ── HISTÓRICO POR ANO (Marcus, 12/11/2026): contas PAGAS de 2022 a 2025, lidas SÓ quando a tela pede aquele ano (cada ano leva de 1 a 5 s; fica guardado 30 min). Só leitura.
// A DevMaster só tem pagamentos a partir de meados de 2022; 2020 e 2021 vêm vazios (só entradas de dinheiro). Mesmo formato das "pagas" de contasDaDevmaster.
const TTL_ANO = 30 * 60 * 1000, TTL_CAD = 60 * 60 * 1000;
export const ANO_MIN = 2022;

async function cadastros() {
  const c = (G.__sorellyCadDm = G.__sorellyCadDm || {});
  if (c.v && Date.now() - c.em < TTL_CAD) return c.v;
  if (!c.lendo) c.lendo = (async () => {
    const [forn, nat, contas] = await Promise.all([
      tudo("dmaat", { campos: ["aat_codigo", "aat_nome"] }),
      tudo("dmaan", { campos: ["aan_codigo", "aan_descricao"] }),
      tudo("dmaap", { campos: ["aap_codigo", "aap_agencia", "aap_conta", "aap_nome"] }),
    ]);
    c.v = {
      nomeForn: new Map(forn.map((x) => [x.aat_codigo, String(x.aat_nome || "").trim()])),
      nomeNat: new Map(nat.map((n) => [n.aan_codigo, String(n.aan_descricao || "").trim()])),
      nomeConta: new Map(contas.map((x) => [[x.aap_codigo, x.aap_agencia, x.aap_conta].join("|"), x.aap_nome])),
    };
    c.em = Date.now();
    return c.v;
  })().finally(() => { c.lendo = null; });
  return c.lendo;
}

export async function pagasDoAno(ano, { forcar = false } = {}) {
  const n = Number(ano);
  if (!Number.isInteger(n) || n < ANO_MIN || n >= new Date().getFullYear()) throw Object.assign(new Error("Ano fora do histórico (de " + ANO_MIN + " até o ano passado)."), { statusCode: 400 });
  const mapa = (G.__sorellyPagasAno = G.__sorellyPagasAno || {}), c = (mapa[n] = mapa[n] || {});
  if (!forcar && c.dados && Date.now() - c.em < TTL_ANO) return c.dados;
  if (!c.lendo) c.lendo = (async () => {
    const t0 = Date.now(), { nomeForn, nomeNat, nomeConta } = await cadastros();
    const baixas = await tudo("dmabf", { filtro: { abf_tipo: "S", abf_tpcontaorigem: "P", abf_datadebito: { gte: n + "-01-01", lte: n + "-12-31" } }, campos: ["abf_banco", "abf_agencia", "abf_conta", "abf_datapgto", "abf_datadebito", "abf_valorreais", "abf_estornado", "abf_natureza", "abf_tpclifor", "abf_clifor", "abf_prefixo", "abf_numero", "abf_parcela"] });
    const pagas = [];
    for (const b of baixas) {
      if (b.abf_estornado === "S") continue;
      const d = dia(b.abf_datadebito || b.abf_datapgto), fil = cnpjDaConta(b.abf_banco, nomeConta.get([b.abf_banco, b.abf_agencia, b.abf_conta].join("|"))), valor = r2(b.abf_valorreais);
      const forn = b.abf_tpclifor === "F" ? b.abf_clifor : "";
      pagas.push([fil, b.abf_natureza, nomeNat.get(b.abf_natureza) || "", b.abf_prefixo, b.abf_numero, b.abf_parcela, forn, nomeForn.get(forn) || "", d, d, valor]);
    }
    c.dados = { ano: n, geradoEm: new Date().toISOString(), segundos: Math.round((Date.now() - t0) / 100) / 10, pagas };
    c.em = Date.now();
    return c.dados;
  })().finally(() => { c.lendo = null; });
  return c.lendo;
}

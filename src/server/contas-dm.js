// Contas a pagar e contas pagas lidas direto da DevMaster API 2 (só leitura), sem planilha e sem script no computador do Marcus. Cache de 10 minutos.
//   apagar = títulos em aberto (dmabe, situação A e P com saldo)  | pagas = baixas do ano (dmabf, abf_tipo S, origem P, sem estorno)
// Mesmos formatos dos arquivos locais antigos (domain/contas-empresa.js):
//   apagar: [filial, natureza, nomeNatureza, prefixo, número, parcela, fornecedorCod, título, emissão, vencimento, valor, saldo, diasAtraso]
//   pagas:  [filial, natureza, nomeNatureza, prefixo, número, parcela, fornecedorCod, título, baixa, vencimento, valor]
// CNPJ das contas PAGAS = pela CONTA BANCÁRIA usada (regra do Marcus, 28/10/2026): nome da conta termina em 34/46/59/67, ou traz Axis (67), Serenity (59), Comércio (46), Atacadista (34); Caixa e contas pessoais = "fora".
// CNPJ das contas A PAGAR = o que o Marcus já conferiu (módulo cpfil no banco) e, para título novo, a filial da DevMaster (01=34, 02=46, 03=59, 04=fora, 05=67).
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
  const leBaixas = tudo("dmabf", { filtro: { abf_tipo: "S", abf_tpcontaorigem: "P", abf_datapgto: { gte: INICIO_ANO } }, campos: ["abf_banco", "abf_agencia", "abf_conta", "abf_datapgto", "abf_valorreais", "abf_estornado", "abf_natureza", "abf_tpclifor", "abf_clifor", "abf_prefixo", "abf_numero", "abf_parcela"] });
  const abertos = (await leAbertos).flat();
  const apagar = abertos.filter((x) => x.abe_saldo > 0.004).map((x) => {
    const k = [x.abe_prefixo, x.abe_numero, x.abe_parcela, x.abe_fornecedor].join("|"), venc = dia(x.abe_vencimento);
    const fil = known.get(k) || FILIAL[x.abe_filialorigem] || "fora";
    return [fil, x.abe_natureza, nomeNat.get(x.abe_natureza) || "", x.abe_prefixo, x.abe_numero, x.abe_parcela, x.abe_fornecedor, nomeForn.get(x.abe_fornecedor) || "", dia(x.abe_emissao), venc, r2(x.abe_valor), r2(x.abe_saldo), diasAtraso(venc)];
  }).sort((a, b) => (a[9] < b[9] ? -1 : a[9] > b[9] ? 1 : 0));

  const baixas = await leBaixas;
  const pagas = [], diario = {};
  for (const b of baixas) {
    if (b.abf_estornado === "S") continue;
    const d = dia(b.abf_datapgto), fil = cnpjDaConta(b.abf_banco, nomeConta.get([b.abf_banco, b.abf_agencia, b.abf_conta].join("|"))), valor = r2(b.abf_valorreais);
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

// Financeiro › Cadastro (Marcus, 20/11/2026: "copiar a DevMaster no nosso sistema, para daqui a pouco sair deles").
// Lê da DevMaster, SÓ EM LEITURA: os tipos de numerário (formas de pagamento do PDV, dmacd), os bancos (dmaap) e o uso de cada forma nos últimos 180 dias (títulos a receber, dmabg).
// Devolve as duas listas já com o DONO (Sorelly, Mayz, Serenity, Axis, pessoa ou fornecedor), o TIPO, quantas vezes foi usada em 90 dias e o que precisa ser arrumado na DevMaster.
// O dono sai do BANCO de destino (a forma só aponta para um banco): PIX - BANHO baixa em CAIXA PIX PONTUAL, então é da Pontual (conferido em 20/11/2026: 504 de 504).
// Cache de 30 minutos; ?agora=1 ignora. Acesso: Financeiro e Diretoria (conferido na rota).
import * as dm from "@/server/devmaster2";

const TTL = 30 * 60 * 1000, G = globalThis;
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const limpa = (t) => String(t || "").replace(/\s+/g, " ").trim();
const iso = (d) => d.toISOString().slice(0, 10);
const kb = (b, a, c) => [limpa(b), limpa(a), limpa(c)].join("|");

const FORMA_NFE = { "01": "Dinheiro", "02": "Cheque", "03": "Cartão de crédito", "04": "Cartão de débito", "05": "Cartão da loja", "14": "Duplicata", "15": "Boleto", "16": "Depósito", "17": "Pix", "18": "Transferência", "20": "Pix", "21": "Crédito em loja", "99": "Outros" };
const BANCOS_REAIS = { "001": "Sicredi", "026": "Nubank", "033": "Santander", "104": "Caixa Econômica", "136": "Unicred", "197": "Stone", "237": "Bradesco", "341": "Itaú", "422": "Safra", "748": "Sicredi", "749": "Sicredi" };
const PALAVRA_BANCO = [["SICREDI", "Sicredi"], ["SAFRA", "Safra"], ["ITAÚ", "Itaú"], ["ITAU", "Itaú"], ["BRADESCO", "Bradesco"], ["CAIXA ECON", "Caixa Econômica"], ["SANTANDER", "Santander"], ["UNICRED", "Unicred"], ["STONE", "Stone"], ["NUBANK", "Nubank"]];

export const bonito = (t) => limpa(t).toLowerCase().split(/(\s+|-)/).map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join("")
  .replace(/ (De|Da|Do|Dos|Das|E) /g, (m) => m.toLowerCase()).replace(/\bH&o\b/g, "H&O").replace(/\bPf\b/g, "PF").replace(/\bPj\b/g, "PJ").replace(/\bDevmaster\b/g, "DevMaster").replace(/\bMegasul\b/g, "Mega Sul").replace(/\bMardeira\b/g, "Madeira").replace(/\b3d\b/g, "3D").replace(/\bAcrilicos\b/g, "Acrílicos");

// DONO de um banco pelo nome dele (a mesma regra vale para as formas, que herdam o dono do banco de destino)
export function donoDoBanco(nome) {
  const n = limpa(nome).toUpperCase();
  if (!n) return "—";
  if (/AXIS/.test(n)) return "Axis";
  if (/SERENITY/.test(n)) return "Serenity";
  if (/H&O/.test(n)) return "H&O";
  if (/HESS E OLIVEIRA/.test(n)) return "Hess e Oliveira";
  if (/ITAÚ BLACK|ITAU BLACK/.test(n)) return "Marco PJ";
  if (/MARCO.*PF|MARCO ANT/.test(n)) return "Marco PF";
  if (/MARECHAL/.test(n)) return "Marechal";
  if (/MARCUS/.test(n)) return "Marcus";
  if (/LUCAS/.test(n)) return "Lucas";
  if (/ANA BEATRIZ/.test(n)) return "Ana Beatriz";
  if (/ANAMARIA/.test(n)) return "Anamaria";
  if (/PONTUAL/.test(n)) return "Pontual";
  if (/ELLOS/.test(n)) return "Ellos";
  if (/COM[EÉ]RCIO|\b46\b|SHOPPING/.test(n)) return "Mayz";
  if (/ATACADISTA|\b34\b|LIMITE ROTATIVO/.test(n)) return "Sorelly";
  const cx = /^CAIXA PIX (.+)$/.exec(n) || /^CAIXA (MEGASUL)$/.exec(n);
  if (cx) return bonito(cx[1].replace(/ DE SERVIÇO( 1)?$/, " de serviço"));
  if (/^CAIXA (GERAL|RECEBIMENTOS|FINANCEIRO|SEGURO|PAGAMENTOS DIVERSOS)/.test(n)) return "Caixa interno";
  return "—";
}
// TIPO do banco: conta de verdade, maquininha (subconta dos cartões e links), caixa de passagem (Pix que vai direto ao fornecedor ou à representante) ou registro interno
function tipoDoBanco(b) {
  const n = limpa(b.aap_nome).toUpperCase(), cod = limpa(b.aap_codigo);
  if (/MAQUININH|CART[AÃ]O PONTUAL|CART[AÃ]O$/.test(n)) return "Maquininha";
  if (/ PF$/.test(n)) return "Conta bancária";   // conta de pessoa, mesmo cadastrada com código de caixa (ex.: Sicredi Ana Beatriz PF com código CXA)
  if (BANCOS_REAIS[cod] && !/^CAIXA PIX/.test(n)) return /EMPR[EÉ]STIMO|LIMITE ROTATIVO|GARANTIDA/.test(n) ? "Crédito" : "Conta bancária";
  if (/^CAIXA (PIX|MEGASUL)/.test(n)) return "Caixa de passagem";
  if (/^CAIXA /.test(n)) return "Caixa interno";
  return "Registro interno";
}
export function tipoDaForma(desc, formaNfe) {
  const d = limpa(desc).toUpperCase();
  if (/^ACERTO/.test(d)) return "Acerto loja";
  if (/NOTA DE CR[EÉ]DITO/.test(d)) return "Nota de crédito";
  if (/^LINK/.test(d)) return "Link";
  if (/^PIX/.test(d)) return "Pix";
  if (/^D[EÉ]BITO EM CONTA/.test(d)) return "Débito em conta";
  if (/^CR[EÉ]DITO|^CC /.test(d)) return "Cartão de crédito";
  if (/^D[EÉ]BITO|^CD /.test(d)) return "Cartão de débito";
  if (/FATURA/.test(d)) return "Fatura de cartão";
  if (/DINHEIRO/.test(d)) return "Dinheiro";
  return FORMA_NFE[limpa(formaNfe)] || "Outros";
}

async function montar() {
  const hoje = new Date(), de90 = iso(new Date(Date.now() - 90 * 86400000)), de180 = iso(new Date(Date.now() - 180 * 86400000));
  const [nums, bancos, tits] = await Promise.all([
    dm.todasAsPaginas("dmacd", { campos: ["acd_codigo", "acd_descricao", "acd_operacao", "acd_formapgto", "acd_status", "acd_pdvvisivel", "acd_pdvordem", "acd_banco", "acd_agencia", "acd_conta"] }),
    dm.todasAsPaginas("dmaap", { campos: ["aap_codigo", "aap_agencia", "aap_conta", "aap_nome", "aap_situacao", "aap_tipo", "aap_cpfcnpjtitular"] }),
    dm.todasAsPaginas("dmabg", { filtro: { abg_emissao: { gte: de180 + "T00:00:00" } }, campos: ["abg_tipodoc", "abg_valor", "abg_emissao", "abg_banco", "abg_agencia", "abg_conta"] }),
  ]);
  const porChave = new Map(bancos.map((b) => [kb(b.aap_codigo, b.aap_agencia, b.aap_conta), b]));
  const usoForma = {}, usoBanco = {};
  for (const t of tits) {
    const c = limpa(t.abg_tipodoc), d = String(t.abg_emissao || "").slice(0, 10), k = kb(t.abg_banco, t.abg_agencia, t.abg_conta), v = Number(t.abg_valor) || 0;
    const uf = (usoForma[c] = usoForma[c] || { n90: 0, v90: 0, n180: 0, ult: "", bancos: {} }), ub = (usoBanco[k] = usoBanco[k] || { n90: 0, v90: 0, ult: "" });
    uf.n180++; uf.bancos[k] = (uf.bancos[k] || 0) + 1;
    if (d > uf.ult) uf.ult = d; if (d > ub.ult) ub.ult = d;
    if (d >= de90) { uf.n90++; uf.v90 += v; ub.n90++; ub.v90 += v; }
  }
  const nomeDe = (k) => { const b = porChave.get(k); return b ? limpa(b.aap_nome) : ""; };

  const formas = nums.filter((n) => limpa(n.acd_descricao) && limpa(n.acd_descricao) !== "-").map((n) => {
    const cod = limpa(n.acd_codigo), desc = limpa(n.acd_descricao), kCad = n.acd_banco ? kb(n.acd_banco, n.acd_agencia, n.acd_conta) : "";
    const u = usoForma[cod] || { n90: 0, v90: 0, n180: 0, ult: "", bancos: {} }, banco = kCad ? nomeDe(kCad) || "Banco não cadastrado" : "";
    const pdv = n.acd_pdvvisivel === "S", ativa = n.acd_status !== "I", arrumar = [];
    if (pdv && ativa && !u.n90) arrumar.push("Esconder no PDV (sem uso em 90 dias)");
    const dNome = desc.toUpperCase(), palavra = PALAVRA_BANCO.find(([p]) => dNome.includes(p));
    if (palavra && banco && !banco.toUpperCase().includes(palavra[0].replace("ITAU", "ITAÚ"))) arrumar.push("Renomear ou trocar o banco: o nome diz " + palavra[1] + ", cai no " + bonito(banco));
    const outros = kCad ? Object.keys(u.bancos).filter((k) => k !== kCad) : [];
    if (outros.length) arrumar.push("Conferir baixas em outro banco: " + outros.map((k) => bonito(nomeDe(k) || "sem banco") + " (" + u.bancos[k] + " em 180 dias)").join(", "));
    return { id: cod, cod, nome: bonito(desc), nomeDm: desc, tipo: tipoDaForma(desc, n.acd_formapgto), dono: kCad ? donoDoBanco(banco) : (/^ACERTO/i.test(desc) ? "Não pagou" : "Sem banco"),
      banco: banco ? bonito(banco) : "—", pdv: pdv ? "Sim" : "Não", situacao: ativa ? "Ativa" : "Inativa", ordem: Number(n.acd_pdvordem) || 999,
      n90: u.n90, v90: r2(u.v90), n180: u.n180, ult: u.ult, arrumar: arrumar.join(" · ") };
  }).sort((a, b) => (a.pdv === b.pdv ? a.ordem - b.ordem : a.pdv === "Sim" ? -1 : 1));

  const formasDoBanco = {};
  nums.forEach((n) => { if (!n.acd_banco) return; const k = kb(n.acd_banco, n.acd_agencia, n.acd_conta); (formasDoBanco[k] = formasDoBanco[k] || []).push(limpa(n.acd_descricao)); });
  const lista = bancos.map((b) => {
    const k = kb(b.aap_codigo, b.aap_agencia, b.aap_conta), u = usoBanco[k] || { n90: 0, v90: 0, ult: "" }, nome = limpa(b.aap_nome), cod = limpa(b.aap_codigo), arrumar = [];
    if (cod === "749") arrumar.push("Corrigir o código do banco para 748 (Sicredi)");
    if (/MARDEIRA/.test(nome.toUpperCase())) arrumar.push("Corrigir o nome: Mardeira para Madeira");
    if (!BANCOS_REAIS[cod] && / PF$/.test(nome.toUpperCase())) arrumar.push("Trocar o código " + cod + " pelo código do banco");
    const ativo = b.aap_situacao !== "I", fs = formasDoBanco[k] || [];
    if (ativo && !fs.length && !u.n90 && tipoDoBanco(b) !== "Registro interno") arrumar.push("Conferir se a conta ainda existe (sem forma e sem uso)");
    return { id: k, cod, nome: bonito(nome), dono: donoDoBanco(nome), tipo: tipoDoBanco(b), situacao: ativo ? "Ativo" : "Inativo", agencia: limpa(b.aap_agencia), conta: limpa(b.aap_conta),
      formas: fs.length, nomesFormas: fs.join(" · "), n90: u.n90, v90: r2(u.v90), ult: u.ult, arrumar: arrumar.join(" · ") };
  }).sort((a, b) => a.dono.localeCompare(b.dono, "pt-BR") || a.nome.localeCompare(b.nome, "pt-BR"));
  return { geradoEm: hoje.toISOString(), de90, formas, bancos: lista };
}

export async function cadastroFinanceiro({ forcar = false } = {}) {
  const c = G.__sorellyCadFin;
  if (!forcar && c && Date.now() - c.em < TTL) return c.dados;
  const dados = await montar();
  G.__sorellyCadFin = { em: Date.now(), dados };
  return dados;
}

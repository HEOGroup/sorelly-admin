// Consignado do app real da representante (05/11/2026; contrato 1.1 a 1.7 de sorelly-app/docs/app-representante/CONTRATOS.md).
// O backend do app manda o acerto, a entrega do kit novo e a reposição no formato do admin antigo (campos vB, vL, taxaF...) mais os campos novos.
// Aqui viram registros no formato do protótipo (s.acertosConsignado, reducer ACERTO_REGISTRAR / KITNOVO_ENTREGAR / REPOSICAO_ENTREGAR),
// gravados na chave a_<id> do módulo rpf. As telas Consolidado, Comissões e Inadimplência leem esses registros sem mudar nada.
// Idempotente: o mesmo id de novo = atualiza (o backend reenvia em falha de rede, até 10 vezes).
import { emTransacao, gravarItens, lerChaves, lerPrefixos, lerPrefixosCli } from "../estado-itens.js";
import { recusa, ehData, ehId, numero, texto, horaSP } from "../servico.js";
import { gravarModulo, lerModulo, representante, revCodDe, sem } from "./base.js";
import { montarAcertos, vivo } from "../../apps/montagem/domain/app-rep.js";
import { FAIXAS_OFICIAIS, PRATA_FAIXAS, MOTIVOS_ISENCAO, NOVAS_PADRAO, CONTAS_PAGAMENTO, FORMA_LABEL } from "../../apps/montagem/domain/consignado.js";

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
// eventos do app no kit (ke_): sempre MESCLA com o que já existe (pré-acerto, remarcações) — nunca sobrescreve
const CAMPOS_ATENDIMENTO = ["status", "acertoId", "acertadoEm", "acerto", "acertoAssinado", "kitNovoEntregue", "reposicaoEntregue", "comissaoFixa", "entregaId"];
async function mesclarKe(kitId, patch, por, cli, tirar) {
  const q = cli ? await lerPrefixosCli(cli, "rpo", ["ke_"]) : await lerChaves("rpo", ["ke_" + kitId]);
  const atual = vivo(q["ke_" + kitId]) ? Object.assign({}, q["ke_" + kitId]) : {};
  (tirar || []).forEach((k) => { delete atual[k]; });
  await gravarItens("rpo", { ["ke_" + kitId]: Object.assign(atual, patch || {}) }, "app", por, cli);
}
// régua das regras antigas (kits entregues antes de 27/10/2026): faixa de R$ 500 com brinde 48/68 e Prata com Select 56
const FAIXAS_LEGADO = FAIXAS_OFICIAIS.map((f) => (f.min === 500 ? Object.assign({}, f, { bn: 48, bb: 68 }) : f));
const PRATA_LEGADO = PRATA_FAIXAS.map((f) => (f.min === 500 ? Object.assign({}, f, { bb: 56 }) : f));
// formas do app → formas do protótipo (o app antigo usava cartao_credito / cartao_debito)
const FORMA_DO_APP = { cartao_credito: "credito", cartao_debito: "debito", credito: "credito", debito: "debito", pix: "pix", pix_representante: "pix_representante", link: "link", dinheiro: "dinheiro", acerto_loja: "acerto_loja" };
const REGRAS_NOVAS_REG = { prazoQuitarDias: NOVAS_PADRAO.prazoQuitarDias, atrasoQuitacaoPctDia: NOVAS_PADRAO.atrasoQuitacaoPctDia, atrasoQuitacaoTetoPct: NOVAS_PADRAO.atrasoQuitacaoTetoPct, multaPendentePct: NOVAS_PADRAO.multaPendentePct, juridicoDias: NOVAS_PADRAO.juridicoDias };

function faixaDe(vendaLiquida, modalidade, novas) {
  const lista = modalidade === "prata" ? (novas ? PRATA_FAIXAS : PRATA_LEGADO) : (novas ? FAIXAS_OFICIAIS : FAIXAS_LEGADO);
  if (!vendaLiquida || vendaLiquida < 300) return null;
  return lista.slice().sort((a, b) => b.min - a.min).find((f) => vendaLiquida >= f.min) || null;
}
function validarBase(b) {
  if (!ehId(String(b.id || ""))) throw recusa("id inválido.", 400);
  if (!ehData(String(b.data || ""))) throw recusa("data inválida (AAAA-MM-DD).", 400);
  if (!texto(b.revendedora, 200)) throw recusa("revendedora obrigatória.", 400);
}
const lista = (v) => (Array.isArray(v) ? v : []);

// ── 1.1 acerto ──────────────────────────────────────────────────────────────
export function registroAcerto(b, rep) {
  const d = b.detalhes && typeof b.detalhes === "object" ? b.detalhes : {};
  const novas = d.regras === "novas", modalidade = b.modalidade === "prata" ? "prata" : "padrao";
  const vL = r2(numero(b.vL) ?? 0), detPag = lista(d.pagamentos);
  const pagamentos = lista(b.formas).map((f, i) => {
    const forma = FORMA_DO_APP[f.forma] || String(f.forma || "pix"), dp = detPag[i] || {};
    return { forma, descricao: texto(f.conta, 120), parcelas: Math.max(1, Math.floor(numero(dp.parcelas) ?? 1)), data: ehData(f.data) ? f.data : b.data, valor: r2(f.valor), anexo: null, pid: b.id + "-p" + i };
  }).filter((p) => p.forma !== "acerto_loja" && p.valor > 0);
  const pago = r2(pagamentos.reduce((t, p) => t + p.valor, 0));
  const valorDevido = r2(numero(b.valorDevido) ?? numero(b.vAcerto) ?? 0);
  const faixa = faixaDe(vL, modalidade, novas);
  const brindes = lista(d.brindes), trocas = lista(d.trocas);
  return {
    id: b.id, kitId: b.kitId || null, rev: texto(b.revendedora, 200), revCod: revCodDe(b.revendedoraId, b.revCod), revendedoraId: b.revendedoraId || null,
    rep: rep.nome, repCod: rep.cod, tipo: "acerto", tipoKit: "acerto_kit", data: b.data, hora: texto(b.hora, 5) || horaSP(),
    regrasVersaoId: novas ? "app-2026-10-27" : "app-legada", modalidade, regrasNovas: novas ? REGRAS_NOVAS_REG : null,
    atrasoDias: Math.max(0, Math.floor(numero(d.atrasoDias) ?? 0)), diasQuitacao: 0,
    vendaBruta: r2(b.vB), vendaDigitada: r2(numero(d.vendaDigitada) ?? numero(b.vB) ?? 0), garantia: r2(d.garantia), motivoVendaBaixa: texto(d.motivoVendaBaixa, 160),
    trocas, tagsDanificadas: Math.max(0, Math.floor(numero(b.tagsDanificadas) ?? 0)), tagsValor: r2(b.tagsValor),
    pecasCond: Math.floor(numero(b.totC) ?? 0), pecasVendidas: Math.floor(numero(b.pecasVendidas) ?? 0), pecasBrinde: brindes.length,
    pecasTrocas: trocas.length, pecasADevolver: numero(d.pecasADevolver) ?? numero(b.retornaEmpresa),
    condicionaisSelecionadas: lista(d.condicionaisSelecionadas).length ? lista(d.condicionaisSelecionadas).map(String) : lista(b.condsV).map((c) => String(c.num || c.codigo || "")).filter(Boolean),
    condicionaisPecas: lista(b.condsV).map((c) => ({ numero: String(c.num || c.codigo || ""), pecas: Math.floor(numero(c.qtd) ?? 0) })),
    brindesLancados: brindes, excedenteBrinde: r2(b.excTotal),
    pecasProxCodigos: lista(d.pecasProximoMes && d.pecasProximoMes.codigos), pecasProxLiberadas: Math.floor(numero(d.pecasProximoMes && d.pecasProximoMes.liberadas) ?? 0),
    pagamentos, acordo: b.acordo && lista(b.acordo.parcelas).length ? lista(b.acordo.parcelas).map((p) => ({ data: p.data, valor: r2(p.valor) })) : null,
    recusouNegociar: !!d.recusouNegociar, abatidoDivida: r2(d.abatidoDivida),
    reagendamentos: lista(d.remarcacoes).length, remarcacoes: lista(d.remarcacoes).map((x) => ({ em: x.em || null, isenta: !!x.isenta, motivo: texto(x.motivo, 160) })),
    kitNovoOk: !!(d.kitNovo && d.kitNovo.confirmado), expositoresMarcados: [], assinatura: typeof b.assinaturaImagem === "string" ? b.assinaturaImagem : null, regrasLidas: !!b.regrasLidas,
    recebimento: null, formSnapshot: null,
    // resultado (calcularAcerto do protótipo), com os números que a revendedora assinou no app
    vendaLiquida: vL, faixa, comissaoPct: numero(b.taxaF) ?? 0, comissao: r2(b.comissao), brindeNormal: r2(b.bN), brindeSelect: r2(b.bB),
    valorAcerto: r2(b.vAcerto), taxaDeslocamento: r2(b.taxaDeslocamento), valorDevido,
    descontoRemarcacao: d.descontoRemarcacao && typeof d.descontoRemarcacao === "object" ? d.descontoRemarcacao : { comissaoPct: numero(b.descPts) ?? 0, brindePct: 0 },
    atrasoPct: numero(d.atrasoPct) ?? 0, atrasoBrindePct: numero(d.atrasoBrindePct) ?? 0, atrasoTudo: !!d.atrasoTudo, juridico: !!d.juridico,
    pendente: r2(Math.max(0, valorDevido - pago)), multaPendente: r2(d.multaPendente), multaAtrasoQuitacao: r2(d.multaAtrasoQuitacao), multas: r2(d.multas),
    comissaoFinal: r2(numero(d.comissaoFinal) ?? numero(b.comissao) ?? 0), valorFinal: r2(numero(d.valorFinal) ?? valorDevido),
    pctFaltante: numero(d.pctFaltante) ?? 0, fatorPagamento: numero(d.fatorPagamento) ?? numero(b.briFator) ?? 1, semFaixa: !faixa, podeRenovar: true,
    totalAPagar: r2(numero(b.totalAPagar) ?? valorDevido), obs: texto(b.obs, 1000),
    vendasAnteriores: lista(d.vendasAnteriores).map(r2), mediaVendas: d.mediaVendas || null, novaChance: !!d.novaChance,
    creditosGarantiaUsados: lista(d.creditosGarantiaUsados).map(String), preAcerto: !!d.preAcerto,
    origem: "app", recebidoEm: new Date().toISOString(),
  };
}

// créditos da Garantia usados no acerto: marca usado = {em, kitId, acertoId} no módulo gr (Garantia › Créditos mostra "Usado no acerto")
async function usarCreditos(ids, acertoId, kitId) {
  if (!ids.length) return;
  const gr = await lerModulo("gr");
  const creditos = lista(gr.creditos);
  let mudou = false;
  const novos = creditos.map((c) => {
    if (!ids.includes(String(c.id)) || c.usado) return c;
    mudou = true; return Object.assign({}, c, { usado: { em: Date.now(), kitId: kitId || null, acertoId, por: "Acerto (app)" } });
  });
  if (mudou) await gravarModulo("gr", { creditos: novos });
}

export async function registrarAcerto(b) {
  validarBase(b);
  const rep = await representante(b.repCod || b.rep, b.rep);
  const reg = registroAcerto(b, rep);
  const r = await emTransacao("rpf", async (cli) => {
    const atual = await lerPrefixosCli(cli, "rpf", ["a_", "ax_"]);
    const existe = vivo(atual["a_" + reg.id]);
    const ax = atual["ax_" + reg.id];
    if (existe && ax && ax.recebimento && ax.recebimento.ok) return { ok: true, acao: "atualizar", acertoId: reg.id, casoAberto: reg.pendente > 0.01, travado: true };   // o agendamento já conferiu: não mexe
    await gravarItens("rpf", { ["a_" + reg.id]: reg }, "app", "app:" + rep.cod, cli);
    return { ok: true, acao: existe ? "atualizar" : "criar", acertoId: reg.id, casoAberto: reg.pendente > 0.01 };
  });
  if (reg.kitId && ehId(reg.kitId)) {
    await mesclarKe(reg.kitId, { status: "acertado", acertoId: reg.id, acertadoEm: new Date().toISOString(), modalidade: reg.modalidade, acerto: { valorAcerto: reg.valorAcerto, vendaBruta: reg.vendaBruta }, acertoAssinado: !!reg.assinatura }, "app:" + rep.cod);
  }
  await usarCreditos(reg.creditosGarantiaUsados, reg.id, reg.kitId).catch((e) => console.error("[app-rep] créditos de garantia", e));
  delete r.travado;
  return r;
}

// ── 1.2 entrega de kit novo e reposição ─────────────────────────────────────
export function registroMovimento(b, rep, comissaoReposicao) {
  const repo = b.tipoMovimento === "reposicao";
  const conds = lista(b.condicionais).map((c) => ({ numero: String(c.codigo || c.num || ""), pecas: Math.floor(numero(c.qtd) ?? 0) })).filter((c) => c.numero);
  const ek = b.entregaKitNovo && typeof b.entregaKitNovo === "object" ? b.entregaKitNovo : null;
  const conf = b.conferencia && typeof b.conferencia === "object" ? b.conferencia : null;
  const base = {
    id: b.id, kitId: b.kitId || null, rev: texto(b.revendedora, 200), revCod: revCodDe(b.revendedoraId, b.revCod), revendedoraId: b.revendedoraId || null,
    rep: rep.nome, repCod: rep.cod, data: b.data, hora: texto(b.hora, 5) || horaSP(), assinatura: typeof b.assinaturaImagem === "string" ? b.assinaturaImagem : null,
    regrasLidas: b.regrasLidas === true || !!(ek && ek.etapas), condicionaisSelecionadas: conds.map((c) => c.numero), condicionaisPecas: conds,
    conferencia: conf ? { esperadas: numero(conf.esperadas), contadas: numero(conf.contadas), faltas: numero(conf.faltas) ?? 0, sobras: numero(conf.sobras) ?? 0, nota: texto(conf.nota, 200), em: conf.em || null } : null,
    recebimento: null, origem: "app", obs: texto(b.obs, 1000), recebidoEm: new Date().toISOString(),
    valorAcerto: 0, vendaLiquida: 0, pagamentos: [],
  };
  if (repo) {
    const especial = !!b.especial;
    return Object.assign(base, { tipo: especial ? "reposicao_especial" : "reposicao", tipoKit: "reposicao", comissao: especial ? r2(b.comissaoRepos) : comissaoReposicao, especial });
  }
  const exp = !!(b.comExpositor || (ek && ek.temExpositor));
  const tipoKit = b.kitTipo === "so_expositor" ? "so_expositor" : b.kitTipo === "retornando" ? "acerto_kit" : exp ? "kit_novo_exp" : "kit_novo";
  return Object.assign(base, {
    tipo: "kit_novo_entrega", tipoKit, kitTipo: b.kitTipo || "novo", condicionais: conds.map((c) => c.numero),
    pecasTotal: numero(conf && conf.esperadas) ?? numero(ek && ek.pecasTotal) ?? conds.reduce((t, c) => t + c.pecas, 0),
    pecasFaltaram: numero(conf && conf.faltas) ?? numero(ek && ek.pecasFaltaram) ?? 0,
    obsDivergencia: texto((conf && conf.nota) || (ek && ek.codigosFaltantes) || "", 200),
    expositorFoto: !!(ek && ek.fotoExpositor), semCelular: !!(ek && ek.semCelular), cpf: texto(ek && ek.cpf, 14),
    etapas: lista(ek && ek.etapas).map((e) => ({ n: e.n, titulo: texto(e.titulo, 80), checkEm: e.checkEm || null })),
    caixinhasEntregues: !!(ek && ek.caixinhasEntregues), iniciadaEm: (ek && ek.iniciadaEm) || null, concluidaEm: (ek && ek.concluidaEm) || null,
  });
}

export async function registrarMovimento(b) {
  validarBase(b);
  if (b.tipoMovimento !== "entrega_kit" && b.tipoMovimento !== "reposicao") throw recusa("tipoMovimento inválido.", 400);
  const rep = await representante(b.repCod || b.rep, b.rep);
  const comis = await lerChaves("rpf", ["cf_comis"]).catch(() => ({}));
  const valorRepos = numero(comis.cf_comis && comis.cf_comis.reposicao) ?? 15;
  const reg = registroMovimento(b, rep, valorRepos);
  const foto = b.entregaKitNovo && typeof b.entregaKitNovo.fotoExpositor === "string" ? b.entregaKitNovo.fotoExpositor : null;
  const r = await emTransacao("rpf", async (cli) => {
    const atual = await lerPrefixosCli(cli, "rpf", ["a_"]);
    const existe = vivo(atual["a_" + reg.id]);
    await gravarItens("rpf", { ["a_" + reg.id]: reg }, "app", "app:" + rep.cod, cli);
    return { ok: true, acao: existe ? "atualizar" : "criar", acertoId: reg.id, casoAberto: false };
  });
  if (reg.kitId && ehId(reg.kitId)) {
    const ev = reg.tipo === "kit_novo_entrega"
      ? { status: "acertado", kitNovoEntregue: { id: reg.id, em: new Date().toISOString() }, entregaId: reg.id }
      : { status: "acertado", reposicaoEntregue: true, comissaoFixa: reg.comissao, entregaId: reg.id };
    await mesclarKe(reg.kitId, ev, "app:" + rep.cod);
    const ch = {};
    // entrega guiada do kit novo (s.entregasKN[kitId]: Controle de expositores › Fotos dos kits novos)
    if (reg.tipo === "kit_novo_entrega") {
      ch["en_" + reg.kitId] = { kitId: reg.kitId, rev: reg.rev, rep: reg.rep, inicio: reg.iniciadaEm, fim: reg.concluidaEm, status: "concluida",
        semCelular: reg.semCelular, temExpositor: reg.expositorFoto || reg.tipoKit === "kit_novo_exp", fotoExpositor: foto, fotoNome: foto ? "expositor.jpg" : null, fotoEm: foto ? Date.now() : null,
        assinatura: reg.assinatura, checks: Object.fromEntries(reg.etapas.map((e) => [e.n, { rep: e.checkEm ? Date.parse(e.checkEm) || null : null, rev: null }])) };
    }
    if (reg.conferencia && reg.conferencia.faltas > 0) {
      ch["eb_" + reg.kitId] = { id: "EB" + reg.id, kitId: reg.kitId, rev: reg.rev, rep: reg.rep, data: reg.data, em: Date.now(), condicionais: reg.condicionaisSelecionadas,
        esperadas: reg.conferencia.esperadas, lidas: reg.conferencia.contadas, faltas: [], nFaltas: reg.conferencia.faltas, sobras: [], nSobras: reg.conferencia.sobras || 0,
        erros: reg.conferencia.faltas, porQuantidade: true, nota: reg.conferencia.nota, origem: "app" };
    }
    if (Object.keys(ch).length) await gravarItens("rpo", ch, "app", "app:" + rep.cod);
  }
  return r;
}

// ── 1.3 cancelar ────────────────────────────────────────────────────────────
export async function cancelarRegistro(b) {
  const id = String(b.origemId || "").trim();
  const motivo = texto(b.motivo, 500);
  if (!ehId(id)) throw recusa("origemId inválido.", 400);
  if (motivo.length < 3) throw recusa("Informe o motivo do cancelamento.", 400);
  return emTransacao("rpf", async (cli) => {
    const atual = await lerPrefixosCli(cli, "rpf", ["a_", "ax_"]);
    const reg = atual["a_" + id];
    if (!vivo(reg) || reg.cancelado) return { ok: true, removido: false };
    const ax = atual["ax_" + id] || {};
    if (ax.recebimento && (ax.recebimento.ok || ax.recebimento.inicioTs)) throw recusa("O agendamento já começou a conferir este atendimento. Fale com o agendamento para desfazer.", 409);
    if (ax.fin && Object.keys(ax.fin).length) throw recusa("O financeiro já conferiu este pagamento. Fale com o financeiro para desfazer.", 409);
    await gravarItens("rpf", { ["a_" + id]: Object.assign({}, reg, { cancelado: { em: new Date().toISOString(), motivo } }) }, "app", "app:cancelar", cli);
    // o kit volta a "não atendido" (tira só as marcas do atendimento; pré-acerto e remarcações ficam)
    if (reg.kitId && ehId(reg.kitId)) await mesclarKe(reg.kitId, null, "app:cancelar", null, CAMPOS_ATENDIMENTO);
    return { ok: true, removido: true };
  });
}

// ── 1.4 formas de pagamento ─────────────────────────────────────────────────
export function formasDoApp() {
  // "Acerto com loja" fica de fora: no app vira "Inadimplência", que abre a negociação e não é pagamento.
  return Object.keys(FORMA_LABEL).filter((k) => k !== "acerto_loja").map((k) => ({
    valor: k, rotulo: FORMA_LABEL[k], temParcelas: k === "credito", contas: (CONTAS_PAGAMENTO[k] || []).map((c) => c.label),
  }));
}

// ── 1.6 contexto do acerto ──────────────────────────────────────────────────
const cacheVendas = (globalThis.__appRepVendas = globalThis.__appRepVendas || new Map());
async function vendasAnteriores(revCod) {
  const c = cacheVendas.get(revCod);
  if (c && Date.now() - c.em < 30 * 60 * 1000) return c.v;
  try {
    const { fichaRevendedora } = await import("../revendedoras.js");
    const f = await fichaRevendedora(revCod);
    // a ficha traz as 3 últimas vendas sem brinde, da mais NOVA para a mais antiga: o app quer da mais antiga para a mais nova
    const v = lista(f.vendas).map((x) => r2(x.v)).filter((x) => x > 0).slice(0, 3).reverse();
    cacheVendas.set(revCod, { em: Date.now(), v, modalidade: null });
    return v;
  } catch (e) {
    console.error("[app-rep] vendas anteriores", revCod, e && e.message);
    return [];
  }
}
// quanto ficou em aberto nos acertos anteriores (mesma conta da Inadimplência: valor devido + excedente + multas − pago)
function faltaDe(r) {
  const pago = lista(r.pagamentos).filter((p) => p.forma !== "acerto_loja").reduce((t, p) => t + (Number(p.valor) || 0), 0);
  return r2(Math.max(0, (r.valorDevido || r.valorAcerto || 0) + (r.excedenteBrinde || 0) + (r.multas || 0) - pago - (r.abatidoDivida || 0)));
}

export async function contextoAcerto(rep, revCod) {
  if (!/^\d{6,10}$/.test(revCod)) throw recusa("Revendedora inválida.", 400);
  const [rpf, rpo, gr, vendas] = await Promise.all([lerPrefixos("rpf", ["a_", "ax_"]), lerPrefixos("rpo", ["pa_"]), lerModulo("gr").catch(() => ({})), vendasAnteriores(revCod)]);
  const acertos = montarAcertos(rpf).filter((r) => r.tipo === "acerto" && r.revCod === revCod);
  const divida = r2(acertos.reduce((t, r) => t + faltaDe(r), 0));
  const nomeRev = acertos[0] ? acertos[0].rev : null;
  const creditos = lista(gr.creditos).filter((c) => !c.usado && (String(c.cod || "").padStart(6, "0") === revCod || (nomeRev && sem(c.revendedora) === sem(nomeRev))))
    .map((c) => ({ id: String(c.id), valor: r2(c.valor), obs: String(c.obs || "") }));
  const ultimo = acertos[0] || null;
  const pa = rpo["pa_" + revCod];
  return {
    vendasAnteriores: vendas, dividaAnterior: divida, creditosGarantia: creditos,
    modalidade: ultimo ? ultimo.modalidade : null,
    preAcerto: vivo(pa) && pa.repCod === rep.cod ? { remarcacoes: lista(pa.remarcacoes), atrasoDias: pa.atrasoDias || 0, em: pa.em } : null,
    regras: null,
  };
}

// ── 1.7 pré-acerto ──────────────────────────────────────────────────────────
export async function salvarPreAcerto(rep, b) {
  const revCod = revCodDe(null, b.revCod);
  if (!/^\d{6,10}$/.test(revCod)) throw recusa("Revendedora inválida.", 400);
  const atraso = Math.floor(numero(b.atrasoDias) ?? -1);
  if (atraso < 0 || atraso > 99) throw recusa("Dias de atraso de 0 a 99.", 422);
  const rems = lista(b.remarcacoes).slice(0, 20).map((x) => {
    const isenta = x && x.isenta === true, motivo = texto(x && x.motivo, 160);
    if (isenta && !motivo) throw recusa("Remarcação isenta precisa do motivo.", 422);
    if (isenta && !MOTIVOS_ISENCAO.includes(motivo) && motivo.length < 3) throw recusa("Motivo da isenção inválido.", 422);
    return { em: (x && x.em) || new Date().toISOString(), isenta, motivo: isenta ? motivo : "" };
  });
  const pa = { revCod, repCod: rep.cod, rep: rep.nome, kitId: ehId(String(b.kitId || "")) ? b.kitId : null, remarcacoes: rems, atrasoDias: atraso, em: new Date().toISOString() };
  const ch = { ["pa_" + revCod]: pa };
  // com o kit da listagem: grava também no kit (kit.remarcacoesLista e kit.preAcerto, como KIT_REMARCAR e KIT_PRE_ACERTO do protótipo)
  await gravarItens("rpo", ch, "app", "app:" + rep.cod);
  if (pa.kitId) await mesclarKe(pa.kitId, { remarcacoesLista: rems, remarcacoes: rems.filter((r) => !r.isenta).length, preAcerto: { atrasoDias: atraso, em: Date.now() } }, "app:" + rep.cod);
  return { preAcerto: { remarcacoes: rems, atrasoDias: atraso, em: pa.em } };
}

export { faltaDe };

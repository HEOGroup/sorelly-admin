// "Só as minhas comissões" para o app real da representante (05/11/2026; contrato 1.8 de sorelly-app/docs/app-representante/CONTRATOS.md).
// Mesma régua da tela Financeiro › Comissões e do celular simulado (domain/comissoes.js: itensComissao, analisar, datas do grupo, janelas).
// A configuração (% e grupo de cada representante, datas A/B, valores do kit novo e da reposição, gasolina, pagamentos lançados) vem de cf_comis,
// espelhada do navegador do financeiro (state/store.js). Sem ela, valem os padrões (COMIS0: 8%, grupo A, dias 1/11/21, R$ 20/35/15).
// O km e o "Entreguei" são da representante (chaves km_ e ar_); o servidor carimba a hora (manual, a confirmar #3 e #4 das Comissões).
// Fuso: o corte das 13h do dia anterior é calculado em Brasília (UTC−3) aqui, não na hora local do servidor.
import { gravarItens, lerChaves, lerPrefixos } from "../estado-itens.js";
import { recusa, ehData, numero } from "../servico.js";
import { montarAcertos, vivo } from "../../apps/montagem/domain/app-rep.js";
import { COMIS0, comisEfetiva, datasDoGrupo, datasDoMes, grupoDaRep, itensComissao, janelaDe, pctDaRep, remessaPorData } from "../../apps/montagem/domain/comissoes.js";

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const hash = (t) => { let h = 7; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 1000003; return h; };
const codigoDinheiro = (id, etapa) => String(1000 + (hash("sorelly|" + id + "|" + etapa) % 9000));   // igual a domain/dinheiro.js
const diaAntes = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
const pad = (n) => String(n).padStart(2, "0");
function corteSP(c, iso) { return Date.parse(diaAntes(iso, c.corteDias || 0) + "T" + pad(c.corteHora || 0) + ":00:00-03:00"); }
const ehInterno = (r) => r.origem === "interno";

// estado mínimo para a régua: acertos do app + configuração espelhada + km da representante
async function carregar(rep) {
  const [rpf] = await Promise.all([lerPrefixos("rpf", ["a_", "ax_", "ar_", "km_", "gv_", "cf_"])]);
  const comis = Object.assign({}, COMIS0, vivo(rpf.cf_comis) ? rpf.cf_comis : {});
  const fech = Object.assign({}, comis.fech || {});
  Object.keys(rpf).forEach((k) => {
    if (!k.startsWith("km_") || !vivo(rpf[k])) return;
    const v = rpf[k]; const ch = v.data + "|" + v.rep;
    fech[ch] = Object.assign({}, fech[ch], { km: v.km, kmPor: "rep", kmTs: v.kmTs, kmModo: "total" });
  });
  comis.fech = fech;
  const s = { acertosConsignado: montarAcertos(rpf), comis, listagens: [] };
  const c = comisEfetiva(s);
  return { s, c, rpf, gv: rpf["gv_" + rep.cod] };
}

function resumoData(c, itens, rep, data, agora) {
  const grupo = grupoDaRep(c, rep.nome);
  const meus = itens.filter((i) => i.dest === rep.nome && i.dataRem === data);
  const normais = meus.filter((i) => !i.pixRep);
  const confirmado = r2(normais.filter((i) => i.confirmado).reduce((t, i) => t + i.comissao, 0));
  const pendente = r2(normais.filter((i) => !i.confirmado).reduce((t, i) => t + i.comissao, 0));
  const direto = r2(meus.filter((i) => i.pagoDireto).reduce((t, i) => t + i.valorPago, 0));
  const fech = c.fech[data + "|" + rep.nome] || {};
  const preco = c.gasolinaPR && c.gasolinaPR.valor > 0 ? c.gasolinaPR.valor : (c.gasolina[data] || 0);
  const porKm = c.kmPorLitro > 0 ? preco / c.kmPorLitro : 0;
  const corte = corteSP(c, data);
  const lista = datasDoGrupo(c, grupo, new Date(data + "T12:00:00").getTime(), 1, 2), ix = lista.indexOf(data);
  const antData = ix > 0 ? lista[ix - 1] : null, proxData = ix >= 0 && ix < lista.length - 1 ? lista[ix + 1] : null;
  const temAtendimento = meus.length > 0;
  const kmTs = fech.kmTs ? new Date(fech.kmTs).getTime() : 0;
  const km = fech.km || 0;
  const kmOk = km > 0 && (fech.kmPor !== "rep" || kmTs <= corte);
  let kmAtras = 0;
  const fAnt = antData ? (c.fech[antData + "|" + rep.nome] || {}) : {};
  const tsAnt = fAnt.kmTs ? new Date(fAnt.kmTs).getTime() : 0;
  if (antData && fAnt.km > 0 && fAnt.kmPor === "rep" && tsAnt > corteSP(c, antData) && tsAnt <= corte && itens.some((i) => i.dest === rep.nome && i.dataRem === antData)) kmAtras = fAnt.km;
  const comb = r2(((kmOk && temAtendimento ? km : 0) + kmAtras) * porKm);
  const aPagar = r2(confirmado + comb);
  const pago = r2((fech.pagamentos || []).reduce((t, p) => t + (p.valor || 0), 0) + direto);
  const falta = r2(aPagar - pago);
  const fimPrazo = proxData ? corteSP(c, proxData) : corte;
  const estado = !temAtendimento ? "sem_atendimento" : agora <= corte ? "aberto" : agora <= fimPrazo ? "fora_do_prazo" : "encerrado";
  return {
    data, janela: janelaDe(c, grupo, data), corte: new Date(corte).toISOString(),
    comissao: r2(confirmado + pendente), confirmado, combustivel: comb, aPagar, pago, falta,
    status: (aPagar > 0.009 || pago > 0.009) && falta <= 0.009 ? "paga" : !temAtendimento ? "sem_atendimentos" : "a_pagar",
    km: { km: fech.km || null, enviadoEm: fech.kmTs ? new Date(fech.kmTs).toISOString() : null, noPrazo: kmOk, estado, kmAtrasadoAnterior: kmAtras, preco: r2(preco), porKm: Math.round(porKm * 10000) / 10000 },
    itens: meus.map((i) => ({
      id: i.id, revendedora: i.rev, data: i.data, tipo: i.tipo, forma: i.tipo === "kitnovo" ? (i.status || "Kit novo") : i.tipo === "repos" ? "Reposição" : (FORMAS[i.forma] || i.forma || ""),
      valorPago: r2(i.valorPago), comissao: r2(i.comissao), situacao: i.pagoDireto ? "pago_direto" : i.confirmado ? "confirmada" : "pendente",
      agendamentoOk: !!i.conferido, financeiroOk: !!i.fin, motivo: i.motivo || "",
    })),
  };
}
const FORMAS = { pix: "Pix", pix_representante: "Pix representante", link: "Link", credito: "Crédito", debito: "Débito", dinheiro: "Dinheiro", acerto_loja: "Acerto com loja" };

export async function comissoesDaRep(rep, mes) {
  if (!/^\d{4}-\d{2}$/.test(mes)) throw recusa("Mês inválido (AAAA-MM).", 400);
  const { s, c, gv } = await carregar(rep);
  const agora = Date.now();
  const itens = itensComissao(c, s, agora);
  const grupo = grupoDaRep(c, rep.nome);
  const datas = datasDoMes(c, grupo, mes).map((d) => resumoData(c, itens, rep, d, agora));
  // cartão do mês: comissões dos meus atendimentos com data no mês (sem o Pix representante)
  const doMes = itens.filter((i) => i.dest === rep.nome && !i.pixRep && String(i.data || "").startsWith(mes));
  const total = r2(doMes.reduce((t, i) => t + i.comissao, 0));
  const confirmado = r2(doMes.filter((i) => i.confirmado).reduce((t, i) => t + i.comissao, 0));
  const meusAcertos = s.acertosConsignado.filter((r) => !ehInterno(r) && r.rep === rep.nome);
  // pagamento que o financeiro não achou (divs[i].tipo "nao_ident" sem conciliação)
  const naoIdentificados = [];
  meusAcertos.forEach((r) => Object.keys(r.divs || {}).forEach((i) => {
    const dv = r.divs[i]; if (!dv || dv.tipo !== "nao_ident" || (r.fin && r.fin[i])) return;
    const p = (r.pagamentos || [])[i] || {};
    naoIdentificados.push({ acertoId: r.id, revendedora: r.rev, valor: r2(p.valor), dataAcerto: r.data });
  }));
  // Entrega na empresa: acertos e kits novos pendentes + os 4 últimos conferidos (reposição não entra, como no protótipo)
  const entregaveis = meusAcertos.filter((r) => r.tipo === "acerto" || r.tipo === "kit_novo_entrega");
  const pend = entregaveis.filter((r) => !(r.recebimento && r.recebimento.ok));
  const conf = entregaveis.filter((r) => r.recebimento && r.recebimento.ok).sort((a, b) => String(b.data).localeCompare(String(a.data))).slice(0, 4);
  const entregaEmpresa = pend.concat(conf).map((r) => {
    const rec = r.recebimento || {}, repR = rec.rep || {};
    const dinheiro = r2((r.pagamentos || []).filter((p) => p.forma === "dinheiro").reduce((t, p) => t + (p.valor || 0), 0));
    const contado = rec.din && rec.din.contado != null ? r2(rec.din.contado) : null;
    return {
      acertoId: r.id, revendedora: r.rev, data: r.data, tipo: r.tipo === "acerto" ? "acerto" : "kit_novo",
      status: rec.ok ? "conferido" : rec.inicioTs ? "conferindo" : "aguardando",
      dinheiro: { valor: dinheiro, codigo: dinheiro > 0 ? codigoDinheiro("R" + r.id, 1) : null, repEntregou: !!(repR.din && repR.din.ok), contado, divergencia: contado != null ? r2(dinheiro - contado) : 0 },
      condicionais: { numeros: r.condicionaisSelecionadas || r.condicionais || [], repEntregou: !!(repR.cond && repR.cond.ok), assinaturaConfirmada: !!(rec.prom && rec.prom.ok) },
    };
  });
  const consolidado = datas.reduce((o, d) => ({ comissao: r2(o.comissao + d.comissao), combustivel: r2(o.combustivel + d.combustivel), aPagar: r2(o.aPagar + d.aPagar), pago: r2(o.pago + d.pago) }), { comissao: 0, combustivel: 0, aPagar: 0, pago: 0 });
  consolidado.restante = r2(Math.max(0, consolidado.aPagar - consolidado.pago));
  return {
    mes, pct: pctDaRep(c, rep.nome), grupo, diasPagamento: c.ciclos[grupo] || [], corte: { hora: c.corteHora, dias: c.corteDias },
    totalComissao: total, confirmado, previsto: r2(total - confirmado), nAtendimentos: new Set(doMes.map((i) => i.r && i.r.id)).size,
    naoIdentificados,
    gasolina: c.gasolinaPR && c.gasolinaPR.valor > 0 ? { valor: c.gasolinaPR.valor, em: c.gasolinaPR.em || null, visto: !!(vivo(gv) && gv.em === c.gasolinaPR.em) } : null,
    datas, consolidado, entregaEmpresa,
  };
}

// km TOTAL do período de uma data de pagamento (só a representante informa; depois do corte vale na data seguinte; depois do corte seguinte trava)
export async function enviarKm(rep, b) {
  const data = String(b.data || ""), km = numero(b.km);
  if (!ehData(data)) throw recusa("Data de pagamento inválida.", 422);
  if (km == null || km < 0 || km > 20000) throw recusa("Km inválido.", 422);
  const { c } = await carregar(rep);
  const grupo = grupoDaRep(c, rep.nome);
  const lista = datasDoGrupo(c, grupo, new Date(data + "T12:00:00").getTime(), 1, 2), ix = lista.indexOf(data);
  if (ix < 0) throw recusa("Essa data não é dia de pagamento.", 422);
  const prox = lista[ix + 1];
  if (prox && Date.now() > corteSP(c, prox)) throw recusa("Prazo encerrado para esse período.", 422);
  const v = { data, rep: rep.nome, repCod: rep.cod, km: r2(km), kmPor: "rep", kmTs: new Date().toISOString(), kmModo: "total" };
  await gravarItens("rpf", { [`km_${data}_${rep.cod}`]: v }, "app", "app:" + rep.cod);
  return { km: v };
}

// "Entreguei o dinheiro" / "Entreguei as condicionais" (recebimento.rep do protótipo, chave ar_)
export async function marcarEntrega(rep, b) {
  const acertoId = String(b.acertoId || ""), item = b.item;
  if (!acertoId) throw recusa("Atendimento não informado.", 400);
  if (item !== "dinheiro" && item !== "condicionais") throw recusa("Item inválido.", 400);
  const ch = await lerChaves("rpf", ["a_" + acertoId, "ax_" + acertoId, "ar_" + acertoId]);
  const reg = ch["a_" + acertoId];
  if (!vivo(reg) || reg.repCod !== rep.cod) throw recusa("Atendimento não encontrado.", 404);
  const ax = ch["ax_" + acertoId];
  if (vivo(ax) && ax.recebimento && ax.recebimento.ok) throw recusa("O agendamento já conferiu este atendimento.", 409);
  const ar = Object.assign({}, vivo(ch["ar_" + acertoId]) ? ch["ar_" + acertoId] : {});
  ar[item === "dinheiro" ? "din" : "cond"] = { ok: b.ok !== false, ts: Date.now() };
  await gravarItens("rpf", { ["ar_" + acertoId]: ar }, "app", "app:" + rep.cod);
  return { ok: true, entrega: ar };
}

export async function gasolinaVista(rep, b) {
  const em = String(b.em || "").slice(0, 40);
  if (!em) throw recusa("Informe a data do aviso.", 400);
  await gravarItens("rpf", { ["gv_" + rep.cod]: { em, rep: rep.nome, ts: Date.now() } }, "app", "app:" + rep.cod);
  return { ok: true };
}

export { remessaPorData };

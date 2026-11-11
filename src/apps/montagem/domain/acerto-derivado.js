// Sorelly Admin — domain/acerto-derivado.js
// Tudo que a Calculadora de acertos DERIVA do que foi digitado (prévia da comissão, quanto falta, acordo, brindes liberados, kit novo, valor restante).
// É a mesma conta para o app da representante (celular) e para a Calculadora de acertos do atendimento interno (desktop):
// as duas telas só desenham o resultado, nenhuma refaz regra.
import { calcularAcerto, conferirBrindes, pecasProximoMes, totalPago, versaoEfetiva, avaliarMinimo, kitNovoLiberado as kitNovoLiberado2 } from "@/apps/montagem/domain/consignado";
import { BK } from "@/apps/montagem/lib/format";

var FORM_ACERTO_VAZIO = {vendaBruta:null, devolvida:0, garantia:0, pecasVendidas:null, pecasBrinde:null, pecasTrocas:null, trocas:[], tagsDanificadas:0,
  motivoProxRemarcacao:"", condicionaisSelecionadas:[], pagamentos:[], acordoParcelas:[], acordoSalvo:false, recusouNegociar:false, brindes:[], atrasoDias:0, diasQuitacao:0, vendasAnteriores:[], motivoVendaBaixa:"", motivoVendaBaixaTexto:"", novaChance:false, pecasProxCodigos:[], kitNovoOk:false, expositoresMarcados:[], fechado:false};

// versaoBase: versão de regras carimbada no kit/atendimento · modalidade: "padrao" | "prata" · vez: remarcações com multa
// form: no formato de FORM_ACERTO_VAZIO · condicionais: [{numero, pecas}] em aberto da revendedora
// Regra da negociação NA HORA para quem vai levar kit novo (Marcus, 11/11/2026): no máximo 2 parcelas de R$ 200,00 ou mais; dívida abaixo de R$ 400,00 = parcela única; tudo em até 30 dias.
// Devolve "" quando o acordo está dentro da regra, ou a frase do que está fora. Dívida maior ou quem não leva kit vai para o setor de Inadimplência (outras regras).
var ACORDO_MAX = 2, ACORDO_MIN = 200, ACORDO_DIAS = 30;
function regraDoAcordo(parcelas, falta, hojeIso){
  var ps = (parcelas||[]).filter(function(x){ return x.data && x.valor>0; }); if(!ps.length) return "";
  var d = new Date((hojeIso || new Date().toISOString().slice(0, 10))+"T12:00:00"); d.setDate(d.getDate()+ACORDO_DIAS); var lim = d.toISOString().slice(0, 10);
  if(falta<ACORDO_MIN*2 && ps.length>1) return "Dívida abaixo de R$ 400,00: parcela única.";
  if(ps.length>ACORDO_MAX) return "No máximo 2 parcelas.";
  if(falta>=ACORDO_MIN*2 && ps.some(function(x){ return x.valor<ACORDO_MIN; })) return "Parcela mínima de R$ 200,00.";
  if(ps.some(function(x){ return x.data>lim; })) return "As parcelas vencem em até 30 dias.";
  return "";
}

function derivarAcerto(p){
  var form = p.form, ehPrata = p.modalidade==="prata";
  var versao = p.versaoBase ? versaoEfetiva(p.versaoBase, p.modalidade, p.especial) : null;   // p.especial: comissão especial da revendedora (Atendimento interno)
  var gerais = versao ? versao.gerais : {};
  var totalPagoAtual = totalPago(form.pagamentos);
  // Dívida de acertos anteriores (p.dividaAnterior): o que ela paga agora quita primeiro a dívida mais antiga, o resto vai para este acerto
  var dividaAnt = Math.max(0, p.dividaAnterior||0), abateDivida = Math.min(totalPagoAtual, dividaAnt), pagoAcerto = Math.round((totalPagoAtual-abateDivida)*100)/100;
  var acordoSoma = form.acordoParcelas.filter(function(x){return x.data && x.valor>0;}).reduce(function(t,x){return t+x.valor;},0);
  // Trocas (app da representante): peça deste kit = a nova entra na venda pelo valor cheio; peça de outro mês (já paga) = só a diferença (nova − antiga, pode ser negativa)
  var trocas = form.trocas || [], r2c = function(n){ return Math.round(n*100)/100; };
  var trocasAjuste = r2c(trocas.reduce(function(t,x){ return t + (x.tipo==="anterior" ? (x.novaValor||0)-(x.antigaValor||0) : (x.novaValor||0)); }, 0));
  var nTrocasMes = trocas.filter(function(x){ return x.tipo!=="anterior"; }).length, nTrocasAnt = trocas.length-nTrocasMes;
  var vendaEfetiva = form.vendaBruta==null ? null : Math.max(0, r2c(form.vendaBruta + trocasAjuste));
  var novas = !!(versao && versao.novas);   // regras de 27/10/2026: atraso vale para Normal e Prata, e entram multa e prazo de quitação
  var entrada = function(pago){ return {vendaBruta:vendaEfetiva, devolvida:0, garantia:form.garantia||0, vez:p.vez||0, valorPago:pago, atrasoDias:(ehPrata || novas) ? (form.atrasoDias||0) : 0, diasQuitacao:form.diasQuitacao||0, semTaxa:!!p.semTaxa}; };
  var previaBase = versao && form.vendaBruta!=null ? calcularAcerto(entrada(pagoAcerto), versao) : null;
  var faltaAtual = previaBase ? Math.max(0, previaBase.valorDevido-pagoAcerto) : 0;
  var quitado = !!previaBase && faltaAtual<=0.009;
  var acordoExistente = form.acordoSalvo && form.acordoParcelas.some(function(x){return x.data && x.valor>0;});
  // Kit 100% Prata: brinde só com pagamento integral confirmado, então acordo/parcelas não liberam brinde.
  var regraNova = !!(versao && versao.novas && versao.novas.prazoAcertoDiasUteis!=null), acordoFora = regraNova && acordoExistente ? regraDoAcordo(form.acordoParcelas, faltaAtual) : "";
  var acordoFechado = acordoExistente && faltaAtual>0.009 && Math.abs(acordoSoma-faltaAtual)<=0.01 && !acordoFora;   // negociação completa e dentro da regra (vale para liberar o kit novo, inclusive no Kit Prata)
  var acordoValido = acordoFechado && !(versao && versao.gerais.acordoLiberaBrinde===false);
  // regra de 11/11/2026 (Marcus: "só a tabela vale"): o acordo NÃO libera o brinde nem tira a multa. O brinde segue a tabela do valor em aberto (até 5% = 80%, até 10% = 50%, acima = sem brinde) e a multa de 10% do pendente vale. Antes, o acordo contava como acerto pago.
  var previaPaga = previaBase && acordoValido && !regraNova ? calcularAcerto(entrada(previaBase.valorDevido), versao) : previaBase;
  var previaAcerto = previaPaga && form.recusouNegociar ? Object.assign({}, previaPaga, {brindeNormal:0, brindeSelect:0, fatorPagamento:0}) : previaPaga;

  var conds = p.condicionais || [];
  var pecasCondSelecionadas = conds.filter(function(c){ return form.condicionaisSelecionadas.indexOf(c.numero)>=0; }).reduce(function(t,c){ return t+c.pecas; }, 0);
  // App da representante (autoPecas): brindes e trocas vêm das listas lançadas. A peça nova de cada troca deste kit fica com a revendedora (uma a menos para devolver);
  // a de outro mês entra no lugar da quebrada que ela traz, então não muda a conta.
  var pecasADevolver = p.autoPecas
    ? ((form.pecasVendidas!=null || form.brindes.length || trocas.length) ? pecasCondSelecionadas - ((form.pecasVendidas||0)+form.brindes.length+nTrocasMes) : null)
    : ((form.pecasVendidas||form.pecasBrinde||form.pecasTrocas)
      ? pecasCondSelecionadas - ((form.pecasVendidas||0)+(form.pecasBrinde||0)+(form.pecasTrocas||0)) : null);

  // Kit novo: % do acerto realmente pago (acordo não conta) e, no Prata, vendas mínimas para renovar.
  var kitNovoMin = gerais.kitNovoMinPct || 80;
  var pctPagoAcerto = previaBase && previaBase.valorDevido>0 ? Math.min(100, pagoAcerto/previaBase.valorDevido*100) : 0;
  var kitNovoLiberado = pctPagoAcerto>=kitNovoMin && (!previaBase || previaBase.podeRenovar);
  // Média das últimas vendas (2 anteriores + a do dia) contra R$ 500 (representante) ou R$ 700 (interno). Só nas regras novas.
  var minimo = avaliarMinimo(form.vendasAnteriores||[], vendaEfetiva, versao, !!p.semTaxa);
  var kitNovoRegra = null;
  if(novas && previaBase){
    kitNovoRegra = kitNovoLiberado2(previaBase, pctPagoAcerto, minimo, versao, !!form.novaChance);
    kitNovoLiberado = kitNovoRegra.liberado && previaBase.podeRenovar;
  }
  var pagamentoParcial = !!previaAcerto && previaAcerto.fatorPagamento>0 && previaAcerto.fatorPagamento<1;

  // Brindes
  var tabPag = versao && versao.pagamentoBrinde ? versao.pagamentoBrinde : [];
  var tetoFalta = tabPag.length ? tabPag[tabPag.length-1].max : 10;
  var faixaMinBrinde = versao ? Math.min.apply(null, versao.faixas.filter(function(f){return f.bn+f.bb>0;}).map(function(f){return f.min;}).concat([Infinity])) : 500;
  var brindeBloqueio = !previaAcerto ? null
    : previaAcerto.vendaLiquida < faixaMinBrinde ? {curto:"Venda abaixo de "+BK(faixaMinBrinde), frase:"Venda líquida abaixo de "+BK(faixaMinBrinde)+" não tem brinde."}
    : form.recusouNegociar ? {curto:"Bloqueado — sem negociação", frase:"Revendedora não quis negociar o valor em aberto. Sem brinde. Sem kit novo. O caso vai para o setor de Inadimplência; sem negociação em 48 horas depois do aviso final, a nota promissória vai para execução no valor pendente."}
    : !form.pagamentos.length && !acordoValido ? {curto:"Aguardando pagamento", frase:"O brinde só é liberado depois do pagamento do acerto. Lance os pagamentos ou feche a negociação."}
    : previaAcerto.fatorPagamento===0 ? {curto: ehPrata ? "Bloqueado — só com pagamento integral" : "Bloqueado — falta mais de "+tetoFalta+"%", frase: ehPrata
        ? "No Kit 100% Prata o brinde só sai depois do pagamento integral. Falta pagar para liberar."
        : regraNova ? "Falta mais de "+tetoFalta+"% do acerto: sem brinde. A negociação libera o kit novo, não o brinde." : "Falta mais de "+tetoFalta+"% do acerto. Pague o que falta ou negocie com parcelas que fechem o valor exato."}
    : (previaAcerto.brindeNormal+previaAcerto.brindeSelect)<=0 ? {curto:"Brinde zerado pelas remarcações", frase:"As remarcações zeraram o brinde deste acerto."}
    : null;
  var brindeLiberado = !!previaAcerto && !brindeBloqueio;
  var fatorBrinde = p.brindeFator>=0 && p.brindeFator<=1 ? p.brindeFator : 1;   // atendimento interno: chegou muito atrasada = 90% do brinde
  var libN = previaAcerto ? Math.round(previaAcerto.brindeNormal*fatorBrinde) : 0, libS = previaAcerto ? Math.round(previaAcerto.brindeSelect*fatorBrinde) : 0;
  var confBrinde = conferirBrindes(form.brindes, libN, libS);
  var excedenteBrinde = brindeLiberado ? confBrinde.excedente : 0;
  // Tags riscadas, danificadas ou extraviadas: valor por tag vem das regras (gerais.taxaTagExtraviada); soma no que ela PAGA, não na venda
  var valorTag = gerais.taxaTagExtraviada!=null ? gerais.taxaTagExtraviada : 5, tagsValor = Math.round((form.tagsDanificadas||0)*valorTag*100)/100;
  // regras de 27/10/2026: a multa do valor pendente soma no total a pagar (decisão do Marcus, 26/10/2026)
  // 06/11/2026 (Marcus): o acerto em si NÃO gera multa. A multa de 10% sobre o pendente só nasce se ela NÃO pagar no momento do acerto: com o acerto finalizado (p.finalizado), com acordo ou com recusa de negociar.
  // Enquanto o atendimento está em andamento (nada lançado ou pagamento parcial a caminho) o valor a pagar é só o do acerto (ex.: venda R$ 788,00 − 30% = R$ 551,60).
  var multaAplica = !!(novas && previaAcerto && (p.finalizado || acordoExistente || form.recusouNegociar));
  var multasSoma = multaAplica ? (previaAcerto.multas||0) : 0;
  var totalAPagar = previaAcerto ? Math.round((previaAcerto.valorDevido+excedenteBrinde+tagsValor+multasSoma)*100)/100 : 0;
  var restanteTotal = previaAcerto ? Math.max(0, Math.round((totalAPagar+dividaAnt-totalPagoAtual)*100)/100) : 0;
  // Não pode ficar devendo duas vezes seguidas: com dívida anterior, só sai kit novo se quitar tudo (dívida antiga e este acerto)
  var blocoDivida = dividaAnt>0.009 && !!previaAcerto && restanteTotal>0.009 ? "Dívida anterior de "+BK(dividaAnt)+": ela não pode ficar devendo duas vezes seguidas. Kit novo só com tudo quitado." : "";
  // regra de 11/11/2026: faltou pagar e não negociou na hora = kit novo não sai
  if(regraNova && previaBase && faltaAtual>0.009 && !acordoFechado && kitNovoLiberado){ kitNovoLiberado = false; kitNovoRegra = {liberado:false, motivo:"negociar", texto:acordoFora ? "Negociação fora da regra: "+acordoFora.replace(/\.$/, "") : "Falta negociar o valor pendente na hora: sem negociação o kit novo não sai"}; }
  if(blocoDivida){ kitNovoLiberado = false; kitNovoRegra = {liberado:false, motivo:"divida", texto:blocoDivida.replace(/\.$/, "")}; }

  // Peças liberadas para o próximo mês (quantidade pelo valor da venda, reduzida pelo % em aberto)
  var pecasProx = previaBase ? pecasProximoMes(previaBase.vendaLiquida, previaBase.valorDevido, faltaAtual, versao.pecasProx) : null;
  return {tagsValor:tagsValor, valorTag:valorTag, trocasAjuste:trocasAjuste, vendaEfetiva:vendaEfetiva, nTrocasMes:nTrocasMes, nTrocasAnt:nTrocasAnt, pecasProx:pecasProx, versao:versao, gerais:gerais, ehPrata:ehPrata, totalPagoAtual:totalPagoAtual, acordoSoma:acordoSoma, previaBase:previaBase, faltaAtual:faltaAtual, quitado:quitado,
    acordoExistente:acordoExistente, acordoValido:acordoValido, acordoFora:acordoFora, acordoFechado:acordoFechado, previaAcerto:previaAcerto, pecasCondSelecionadas:pecasCondSelecionadas, pecasADevolver:pecasADevolver,
    kitNovoMin:kitNovoMin, pctPagoAcerto:pctPagoAcerto, kitNovoLiberado:kitNovoLiberado, pagamentoParcial:pagamentoParcial, tetoFalta:tetoFalta, faixaMinBrinde:faixaMinBrinde,
    brindeBloqueio:brindeBloqueio, brindeLiberado:brindeLiberado, libN:libN, libS:libS, confBrinde:confBrinde, excedenteBrinde:excedenteBrinde,
    totalAPagar:totalAPagar, multaAplica:multaAplica, restanteTotal:restanteTotal, dividaAnterior:dividaAnt, abateDivida:abateDivida, blocoDivida:blocoDivida, novas:novas, minimo:minimo, kitNovoRegra:kitNovoRegra};
}

export { FORM_ACERTO_VAZIO, derivarAcerto, regraDoAcordo };

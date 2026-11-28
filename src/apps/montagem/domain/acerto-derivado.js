// Sorelly Admin — domain/acerto-derivado.js
// Tudo que a Calculadora de acertos DERIVA do que foi digitado (prévia da comissão, quanto falta, acordo, brindes liberados, kit novo, valor restante).
// É a mesma conta para o app da representante (celular) e para a Calculadora de acertos do atendimento interno (desktop):
// as duas telas só desenham o resultado, nenhuma refaz regra.
import { kitApoioDoForm } from "@/apps/montagem/domain/kit-apoio";
import { calcularAcerto, conferirBrindes, pecasProximoMes, totalPago, versaoEfetiva, versaoComissaoAntiga, avaliarMinimo, kitNovoLiberado as kitNovoLiberado2, versaoDoAcerto, hojeIso, REGRAS_GERAIS_OFICIAIS } from "@/apps/montagem/domain/consignado";
import { BK } from "@/apps/montagem/lib/format";

var FORM_ACERTO_VAZIO = {vendaBruta:null, devolvida:0, garantia:0, pecasVendidas:null, pecasBrinde:null, pecasTrocas:null, trocas:[], tagsDanificadas:0,
  motivoProxRemarcacao:"", condicionaisSelecionadas:[], pagamentos:[], acordoParcelas:[], acordoSalvo:false, recusouNegociar:false, brindes:[], atrasoDias:0, diasQuitacao:0, kitApoio:{qtd:0}, vendasAnteriores:[], motivoVendaBaixa:"", motivoVendaBaixaTexto:"", novaChance:false, pecasProxCodigos:[], kitNovoOk:false, expositoresMarcados:[], fechado:false};

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
  // CONDIÇÕES DE 28/11/2026: a versão é a da DATA DO ACERTO (p.dataAcerto; padrão hoje), não a do kit. Antes da data efetiva (ou sem ela) vale a versão carimbada, como sempre.
  // Acerto já finalizado manda a data em que foi feito: a versão aplicada não muda depois. A "comissão antiga" (16/11) não existe nas condições novas.
  var dataAcerto = p.dataAcerto || hojeIso(), vBase = versaoDoAcerto(p.versaoBase, dataAcerto), c2 = !!(vBase && vBase.condicoes===2);
  var versao = vBase ? versaoEfetiva(p.regraAntiga && !c2 && p.modalidade!=="prata" ? versaoComissaoAntiga(vBase) : vBase, p.modalidade, p.especial) : null;   // p.regraAntiga: a revendedora questionou e foi cobrada pela comissão antiga neste acerto   // p.especial: comissão especial da revendedora (Atendimento interno)
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
  // Tags riscadas, danificadas ou extraviadas: valor por tag vem das regras (gerais.taxaTagExtraviada); soma no que ela PAGA, não na venda
  var valorTag = gerais.taxaTagExtraviada!=null ? gerais.taxaTagExtraviada : REGRAS_GERAIS_OFICIAIS.taxaTagExtraviada, tagsValor = Math.round((form.tagsDanificadas||0)*valorTag*100)/100;
  var kitApoio = kitApoioDoForm(form);   // kit apoio bolsinhas: soma só no total a pagar (fora de venda, faixa, comissão, brinde, taxa e meta)
  // Cobranças sem comissão (materiais, tags e kit de apoio): nunca entram na venda, na faixa, no brinde nem na média. Nas condições de 28/11/2026 entram na BASE da pendência (calcularAcerto, baseCompleta).
  var cobrancas = r2c(tagsValor+(kitApoio.valor||0)+(form.materiaisValor||0));
  // Crédito de garantia: reduz a venda antes da faixa. O que passar da venda NÃO é consumido neste acerto: fica como sobra, para uso futuro (garantiaSobra vai para o registro).
  var garantiaTotal = Math.max(0, form.garantia||0), garantiaUsada = vendaEfetiva==null ? 0 : r2c(Math.min(garantiaTotal, vendaEfetiva)), garantiaSobra = r2c(garantiaTotal-garantiaUsada);
  var entrada = function(pago){ return {vendaBruta:vendaEfetiva, devolvida:0, garantia:garantiaUsada, vez:p.vez||0, valorPago:pago, atrasoDias:(ehPrata || novas) ? (form.atrasoDias||0) : 0, diasQuitacao:form.diasQuitacao||0, semTaxa:!!p.semTaxa, cobrancas:cobrancas}; };
  var previaBase = versao && form.vendaBruta!=null ? calcularAcerto(entrada(pagoAcerto), versao) : null;
  var baseAcerto = previaBase ? previaBase.baseAcerto : 0;   // regras de 27/10: joias e taxa · condições de 28/11: joias, taxa, materiais e tags
  var faltaAtual = previaBase ? Math.max(0, r2c(baseAcerto-pagoAcerto)) : 0;
  var quitado = !!previaBase && faltaAtual<=0.009;
  var acordoExistente = form.acordoSalvo && form.acordoParcelas.some(function(x){return x.data && x.valor>0;});
  // Kit 100% Prata: brinde só com pagamento integral confirmado, então acordo/parcelas não liberam brinde.
  var regraNova = !!(versao && versao.novas && versao.novas.prazoAcertoDiasUteis!=null), acordoFora = regraNova && acordoExistente ? regraDoAcordo(form.acordoParcelas, faltaAtual) : "";
  var acordoFechado = acordoExistente && faltaAtual>0.009 && Math.abs(acordoSoma-faltaAtual)<=0.01 && !acordoFora;   // negociação completa e dentro da regra (vale para liberar o kit novo, inclusive no Kit Prata)
  var acordoValido = acordoFechado && !(versao && versao.gerais.acordoLiberaBrinde===false);
  // regra de 11/11/2026 (Marcus: "só a tabela vale"): o acordo NÃO libera o brinde nem tira a multa. O brinde segue a tabela do valor em aberto (até 5% = 80%, até 10% = 50%, acima = sem brinde) e a multa de 10% do pendente vale. Antes, o acordo contava como acerto pago.
  var previaPaga = previaBase && acordoValido && !regraNova ? calcularAcerto(entrada(baseAcerto), versao) : previaBase;
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
  var pctPagoAcerto = previaBase && baseAcerto>0 ? Math.min(100, pagoAcerto/baseAcerto*100) : 0;
  var kitNovoLiberado = pctPagoAcerto>=kitNovoMin && (!previaBase || previaBase.podeRenovar);
  // Média das últimas vendas (2 anteriores + a do dia) contra R$ 500 (representante) ou R$ 700 (interno). Só nas regras novas.
  var minimo = avaliarMinimo(form.vendasAnteriores||[], vendaEfetiva, versao, !!p.semTaxa);
  // 28/11/2026: a chamada antiga mandava os argumentos fora de ordem e a média NUNCA bloqueava o kit novo. Agora bloqueia, como manda o regulamento.
  // NOVA CHANCE: uma única vez por revendedora (p.novaChanceUsada = ela já usou). A representante marca (form.novaChance) e o registro guarda quem, quando e em qual acerto.
  var kitNovoRegra = null, novaChanceDisponivel = !!(novas && minimo.abaixo && !p.novaChanceUsada), novaChanceAplicada = novaChanceDisponivel && !!form.novaChance;
  if(novas && previaBase){
    kitNovoRegra = kitNovoLiberado2(previaBase, minimo, versao, novaChanceAplicada);
    if(kitNovoRegra.motivo==="media" && p.novaChanceUsada) kitNovoRegra = Object.assign({}, kitNovoRegra, {texto:kitNovoRegra.texto+" (nova chance já usada)"});
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
    : !form.pagamentos.length && !acordoValido ? {porPagamento:true, aguardando:true, curto:"Aguardando pagamento", frase:"O brinde só é liberado depois do pagamento do acerto. Lance os pagamentos ou feche a negociação."}
    : previaAcerto.fatorPagamento===0 ? {porPagamento:true, curto: ehPrata ? "Bloqueado — só com pagamento integral" : "Bloqueado — falta mais de "+tetoFalta+"%", frase: ehPrata
        ? "No Kit 100% Prata o brinde só sai depois do pagamento integral. Falta pagar para liberar."
        : regraNova ? "Falta mais de "+tetoFalta+"% do acerto: sem brinde. A negociação libera o kit novo, não o brinde." : "Falta mais de "+tetoFalta+"% do acerto. Pague o que falta ou negocie com parcelas que fechem o valor exato."}
    : (previaAcerto.brindeNormal+previaAcerto.brindeSelect)<=0 ? {curto:"Brinde zerado pelas remarcações", frase:"As remarcações zeraram o brinde deste acerto."}
    : null;
  var brindeLiberado = !!previaAcerto && !brindeBloqueio;
  var fatorBrinde = p.brindeFator>=0 && p.brindeFator<=1 ? p.brindeFator : 1;   // atendimento interno: chegou muito atrasada = 90% do brinde
  // 27/11/2026 (Marcus): antes do pagamento a representante já escolhe os brindes; o valor mostrado é o que vale com o acerto pago por inteiro (só confirma depois do pagamento).
  // 28/11/2026 (Marcus): essa escolha é PROVISÓRIA e só vale enquanto NENHUM pagamento foi lançado. Com pagamento lançado (ou acerto finalizado) o direito segue a tabela oficial do valor pendente
  // (até 5% = 80%, até 10% = 50%, acima = sem brinde) e muda sozinho a cada pagamento. Antes, quem devia mais de 10% via o brinde cheio e quem devia menos via o brinde reduzido.
  // O pagamento quita primeiro a dívida antiga, depois o acerto (joias e taxa) e só então a diferença do brinde, as tags e os materiais: a falta que define o brinde é a do acerto.
  var escolhaProvisoria = !!(previaAcerto && brindeBloqueio && brindeBloqueio.aguardando) && !p.finalizado;
  var previaCheia = previaAcerto && !form.recusouNegociar ? calcularAcerto(entrada(baseAcerto), versao) : null;
  var previaBrinde = escolhaProvisoria ? previaCheia : previaAcerto;
  var libN = previaBrinde ? Math.round(previaBrinde.brindeNormal*fatorBrinde) : 0, libS = previaBrinde ? Math.round(previaBrinde.brindeSelect*fatorBrinde) : 0;
  var confBrinde = conferirBrindes(form.brindes, libN, libS);
  // CONDIÇÕES DE 28/11/2026 (semExcedenteComPendencia): com valor pendente no acerto NÃO existe diferença de brinde. Os brindes têm de caber no direito (tirar ou trocar);
  // a diferença não vira cobrança nem dívida, e a tela não fecha o acerto enquanto a escolha não couber.
  var excProibido = !!(novas && versao.novas.semExcedenteComPendencia) && !!previaAcerto && !escolhaProvisoria && brindeLiberado && faltaAtual>0.009 && confBrinde.excedente>0.009;
  var excedenteBrinde = (brindeLiberado || escolhaProvisoria) && !excProibido ? confBrinde.excedente : 0;   // brinde bloqueado não gera excedente: a peça não é liberada
  // Aviso para a tela: o direito mudou depois do pagamento e ainda há brinde escolhido. "bloqueado" = não pode liberar (tirar os brindes); "reduzir" = diminuir os brindes ou pagar a diferença.
  var cheioN = previaCheia ? Math.round(previaCheia.brindeNormal*fatorBrinde) : 0, cheioS = previaCheia ? Math.round(previaCheia.brindeSelect*fatorBrinde) : 0, brindeAviso = null;
  if(previaAcerto && !escolhaProvisoria && form.brindes.length){
    if(brindeBloqueio) brindeAviso = {tipo:"bloqueado", texto:brindeBloqueio.porPagamento ? "O direito ao brinde mudou: com o valor pago, o brinde não pode ser liberado. Complete o pagamento ou retire os brindes escolhidos." : "Sem direito a brinde neste acerto. Retire os brindes escolhidos."};
    else if(excProibido) brindeAviso = {tipo:"reduzir", texto:"Com valor pendente não existe diferença de brinde. Direito: Normal "+BK(libN)+" · Select "+BK(libS)+". Retire ou troque os brindes até caber no direito, ou complete o pagamento."};
    else if(libN<cheioN || libS<cheioS) brindeAviso = {tipo:"reduzir", texto:"O direito ao brinde mudou com o pagamento: Normal de "+BK(cheioN)+" para "+BK(libN)+" · Select de "+BK(cheioS)+" para "+BK(libS)+"."+(confBrinde.excedente>0.009 ? " Diminua os brindes ou pague a diferença de "+BK(confBrinde.excedente)+"." : "")};
  }
  // Brinde escolhido que NÃO pode sair se o acerto fechar agora (sem pagamento ou falta acima do teto): a tela não deixa finalizar com ele. A escolha antecipada não garante a liberação.
  var brindeSemDireito = !!(previaAcerto && form.brindes.length && ((brindeBloqueio && brindeBloqueio.porPagamento) || excProibido));
  // regras de 27/10/2026: a multa do valor pendente soma no total a pagar (decisão do Marcus, 26/10/2026)
  // 06/11/2026 (Marcus): o acerto em si NÃO gera multa. A multa de 10% sobre o pendente só nasce se ela NÃO pagar no momento do acerto: com o acerto finalizado (p.finalizado), com acordo ou com recusa de negociar.
  // Enquanto o atendimento está em andamento (nada lançado ou pagamento parcial a caminho) o valor a pagar é só o do acerto (ex.: venda R$ 788,00 − 30% = R$ 551,60).
  var multaAplica = !!(novas && previaAcerto && (p.finalizado || acordoExistente || form.recusouNegociar));
  var multasSoma = multaAplica ? (previaAcerto.multas||0) : 0;
  var totalAPagar = previaAcerto ? Math.round((previaAcerto.valorDevido+excedenteBrinde+tagsValor+multasSoma+kitApoio.valor+(form.materiaisValor||0))*100)/100 : 0;
  var restanteTotal = previaAcerto ? Math.max(0, Math.round((totalAPagar+dividaAnt-totalPagoAtual)*100)/100) : 0;
  // Não pode ficar devendo duas vezes seguidas: com dívida anterior, só sai kit novo se quitar tudo (dívida antiga e este acerto)
  var blocoDivida = dividaAnt>0.009 && !!previaAcerto && restanteTotal>0.009 ? "Dívida anterior de "+BK(dividaAnt)+": ela não pode ficar devendo duas vezes seguidas. Kit novo só com tudo quitado." : "";
  // regra de 11/11/2026: faltou pagar e não negociou na hora = kit novo não sai
  if(regraNova && previaBase && faltaAtual>0.009 && !acordoFechado && kitNovoLiberado){ kitNovoLiberado = false; kitNovoRegra = {liberado:false, motivo:"negociar", texto:acordoFora ? "Negociação fora da regra: "+acordoFora.replace(/\.$/, "") : "Falta negociar o valor pendente na hora: sem negociação o kit novo não sai"}; }
  if(blocoDivida){ kitNovoLiberado = false; kitNovoRegra = {liberado:false, motivo:"divida", texto:blocoDivida.replace(/\.$/, "")}; }

  // Peças liberadas para o próximo mês (quantidade pelo valor da venda, reduzida pelo % em aberto)
  var pecasProx = previaBase ? pecasProximoMes(previaBase.vendaLiquida, baseAcerto, faltaAtual, versao.pecasProx) : null;
  return {kitApoio:kitApoio, tagsValor:tagsValor, valorTag:valorTag, trocasAjuste:trocasAjuste, vendaEfetiva:vendaEfetiva, nTrocasMes:nTrocasMes, nTrocasAnt:nTrocasAnt, pecasProx:pecasProx, versao:versao, gerais:gerais, ehPrata:ehPrata, totalPagoAtual:totalPagoAtual, acordoSoma:acordoSoma, previaBase:previaBase, faltaAtual:faltaAtual, quitado:quitado,
    acordoExistente:acordoExistente, acordoValido:acordoValido, acordoFora:acordoFora, acordoFechado:acordoFechado, previaAcerto:previaAcerto, pecasCondSelecionadas:pecasCondSelecionadas, pecasADevolver:pecasADevolver,
    kitNovoMin:kitNovoMin, pctPagoAcerto:pctPagoAcerto, kitNovoLiberado:kitNovoLiberado, pagamentoParcial:pagamentoParcial, tetoFalta:tetoFalta, faixaMinBrinde:faixaMinBrinde,
    brindeBloqueio:brindeBloqueio, brindeLiberado:brindeLiberado, escolhaProvisoria:escolhaProvisoria, brindeAviso:brindeAviso, brindeSemDireito:brindeSemDireito, brindeCheioN:cheioN, brindeCheioS:cheioS, libN:libN, libS:libS, confBrinde:confBrinde, excedenteBrinde:excedenteBrinde,
    totalAPagar:totalAPagar, multaAplica:multaAplica, restanteTotal:restanteTotal, dividaAnterior:dividaAnt, abateDivida:abateDivida, blocoDivida:blocoDivida, novas:novas, minimo:minimo, kitNovoRegra:kitNovoRegra,
    baseAcerto:baseAcerto, cobrancas:cobrancas, garantiaUsada:garantiaUsada, garantiaSobra:garantiaSobra, novaChanceDisponivel:novaChanceDisponivel, novaChanceAplicada:novaChanceAplicada, excedenteProibido:excProibido,
    dataAcerto:dataAcerto, condicoes:c2 ? 2 : 1, regras:versao ? {id:versao.id, condicoes:c2 ? 2 : 1, vigenciaDesde:versao.vigenciaDesde||null, modalidade:versao.modalidade||"padrao"} : null};
}

// CÁLCULO ÚNICO DO REGISTRO (Marcus, 28/11/2026): o acerto gravado sai da MESMA conta da tela (derivarAcerto), já como finalizado.
// Antes o reducer refazia a conta com calcularAcerto e, nas regras novas, um acordo fechado era gravado como "pago por inteiro" (sem a multa de 10% e com o brinde cheio que a tela não mostrava).
// p = os mesmos parâmetros de derivarAcerto. Devolve null quando não há conta (sem versão ou sem venda): quem chama usa o caminho antigo.
// res = resultado no formato de calcularAcerto (é o que vai para o registro) · totalAPagar = o "Valor a pagar" da tela · cobrancasAParte = tags + materiais + kit apoio (somam depois da comissão).
function contaDoRegistro(p){
  var form = Object.assign({}, FORM_ACERTO_VAZIO, p.form||{});
  var dv = derivarAcerto(Object.assign({}, p, {form:form, finalizado:true}));
  if(!dv.previaAcerto) return null;
  var r2 = function(n){ return Math.round(n*100)/100; };
  // MEMÓRIA DE CÁLCULO (28/11/2026): o que entrou na conta e o que saiu dela, para auditar o acerto depois sem depender da tela. conferirRegistro refaz a conta com ela.
  var pa = dv.previaAcerto, memoria = {regras:dv.regras, dataAcerto:dv.dataAcerto, modalidade:p.modalidade||"padrao", vez:p.vez||0, semTaxa:!!p.semTaxa, regraAntiga:!!p.regraAntiga, brindeFator:p.brindeFator>=0 && p.brindeFator<=1 ? p.brindeFator : 1,
    comissaoEspecial:p.especial||null, autoPecas:!!p.autoPecas, novaChanceUsada:!!p.novaChanceUsada, dividaAnterior:dv.dividaAnterior, abateDivida:dv.abateDivida,
    vendaDigitada:form.vendaBruta, trocasAjuste:dv.trocasAjuste, vendaEfetiva:dv.vendaEfetiva, garantiaInformada:Math.max(0, form.garantia||0), garantiaUsada:dv.garantiaUsada, garantiaSobra:dv.garantiaSobra,
    vendaLiquida:pa.vendaLiquida, faixaMin:pa.faixa ? pa.faixa.min : null, comissaoPctFaixa:pa.faixa ? pa.faixa.pct : 0, perdaRemarcacaoPct:pa.descontoRemarcacao.comissaoPct||0, perdaAtrasoPct:pa.atrasoPct||0, comissaoPct:pa.comissaoPct, comissao:pa.comissao,
    valorAcerto:pa.valorAcerto, taxaDeslocamento:pa.taxaDeslocamento, tags:dv.tagsValor, kitApoio:dv.kitApoio.valor||0, materiais:form.materiaisValor||0, cobrancas:r2(dv.tagsValor+(dv.kitApoio.valor||0)+(form.materiaisValor||0)),
    baseDaPendencia:dv.baseAcerto, pagoTotal:dv.totalPagoAtual, pagoNoAcerto:r2(dv.totalPagoAtual-dv.abateDivida), pendente:pa.pendente, pctPendente:pa.pctFaltante, fatorBrindePagamento:pa.fatorPagamento,
    brindeNormal:dv.libN, brindeSelect:dv.libS, excedenteBrinde:dv.excedenteBrinde, multaPendente:dv.multaAplica ? pa.multaPendente : 0, multaAtrasoQuitacao:dv.multaAplica ? pa.multaAtrasoQuitacao : 0,
    totalAPagar:dv.totalAPagar, restante:dv.restanteTotal, mediaVendas:dv.minimo ? {media:dv.minimo.media, qtd:dv.minimo.qtd, ref:dv.minimo.ref, abaixo:dv.minimo.abaixo} : null, novaChance:dv.novaChanceAplicada,
    pecasProximoMes:dv.pecasProx ? dv.pecasProx.liberadas : 0};
  return {res:dv.previaAcerto, totalAPagar:dv.totalAPagar, excedenteBrinde:dv.excedenteBrinde, tagsValor:dv.tagsValor,
    cobrancasAParte:r2(dv.tagsValor+(dv.kitApoio.valor||0)+(form.materiaisValor||0)), abateDivida:dv.abateDivida,
    memoria:memoria, regras:dv.regras, versao:dv.versao, garantiaUsada:dv.garantiaUsada, garantiaSobra:dv.garantiaSobra, novaChance:dv.novaChanceAplicada,
    brindeBloqueado:!!dv.brindeBloqueio, bloqueio:dv.brindeSemDireito ? (dv.brindeAviso ? dv.brindeAviso.texto : "Brinde escolhido sem direito: retire os brindes antes de finalizar.") : ""};
}

// CONFERÊNCIA DO REGISTRO (28/11/2026): refaz a conta de um acerto gravado, a partir do formulário guardado nele (formSnapshot) e da memória de cálculo, e compara com os números gravados.
// Serve para o servidor e para a auditoria: o que o navegador gravou tem de ser o que a conta oficial dá. versaoBase = versão de regras do registro (quem chama resolve pelo id/condições gravados).
// Devolve {ok, divergencias:[{campo, gravado, conta}]}. Registro sem formulário ou sem contaUnica (acerto antigo) devolve {ok:true, semMemoria:true}: acerto antigo não é recalculado.
function conferirRegistro(reg, versaoBase, extras){
  if(!reg || !reg.contaUnica || !reg.formSnapshot || !versaoBase) return {ok:true, semMemoria:true, divergencias:[]};
  var m = reg.memoria || {}, x = extras || {};
  var ct = contaDoRegistro({versaoBase:versaoBase, dataAcerto:m.dataAcerto || reg.data, modalidade:reg.modalidade, especial:m.comissaoEspecial || x.especial || null, vez:m.vez!=null ? m.vez : (reg.remarcacoes||[]).filter(function(r){ return !r.isenta; }).length,
    semTaxa:m.semTaxa!=null ? m.semTaxa : !!x.semTaxa, regraAntiga:!!reg.regraAntiga, brindeFator:m.brindeFator, novaChanceUsada:m.novaChanceUsada!=null ? m.novaChanceUsada : !!x.novaChanceUsada,
    form:Object.assign({}, reg.formSnapshot, m.kitApoio===0 || x.semKitApoio ? {kitApoio:null} : {}), condicionais:[], autoPecas:m.autoPecas!=null ? m.autoPecas : !!x.autoPecas, dividaAnterior:m.dividaAnterior!=null ? m.dividaAnterior : (reg.abatidoDivida||0)});
  if(!ct) return {ok:false, divergencias:[{campo:"conta", gravado:"registro", conta:"sem venda ou sem regras"}]};
  var d = [], perto = function(a, b){ return Math.abs((a||0)-(b||0))<=0.011; }, ve = function(campo, gravado, conta){ if(!perto(gravado, conta)) d.push({campo:campo, gravado:gravado||0, conta:conta||0}); };
  ve("vendaLiquida", reg.vendaLiquida, ct.res.vendaLiquida); ve("comissaoPct", reg.comissaoPct, ct.res.comissaoPct); ve("comissao", reg.comissao, ct.res.comissao);
  ve("valorAcerto", reg.valorAcerto, ct.res.valorAcerto); ve("taxaDeslocamento", reg.taxaDeslocamento, ct.res.taxaDeslocamento); ve("valorDevido", reg.valorDevido, ct.res.valorDevido);
  ve("multas", reg.multas, ct.res.multas); ve("excedenteBrinde", reg.excedenteBrinde, ct.excedenteBrinde); ve("cobrancasAParte", reg.cobrancasAParte, ct.cobrancasAParte); ve("totalAPagar", reg.totalAPagar, ct.totalAPagar);
  ve("brindeNormal", reg.brindeNormal, ct.res.brindeNormal); ve("brindeSelect", reg.brindeSelect, ct.res.brindeSelect);
  return {ok:!d.length, divergencias:d, conta:ct};
}

// NOVA CHANCE da venda mínima: uma única vez por revendedora. Fica gravada no próprio acerto (registro.novaChance), que vai para o servidor: vale igual em todos os computadores.
function novaChanceUsada(acertos, rev){ return (acertos||[]).some(function(r){ return r && r.rev===rev && r.tipo==="acerto" && r.novaChance && !r.cancelado; }); }

export { FORM_ACERTO_VAZIO, contaDoRegistro, conferirRegistro, derivarAcerto, novaChanceUsada, regraDoAcordo };

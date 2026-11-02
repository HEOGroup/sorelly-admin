// Sorelly Admin — domain/acertos-demo.js
// Atendimentos de demonstração do mês (pedido do Marcus, 08/10/2026): só 4 representantes reais (Dayanne, Lysie, Jessica e Thalita), cada uma com
// 10 revendedoras de demonstração: 5 com acerto JÁ FEITO (aqui), 3 com acerto A REALIZAR (listagens em seed.js) e 2 kits novos (KITS_NOVOS_DEMO).
// Total: 20 acertos feitos, 12 a realizar, 8 kits novos. Sem reposição de demonstração.
// A conta é a mesma do sistema (calcularAcerto com as regras vigentes): comissão da revendedora, taxa, valor do acerto e brindes saem da tabela.
// Os pagamentos são variados de propósito (Pix, link, crédito, débito, dinheiro, Pix representante, contas espalhadas entre CNPJs, família e sem
// faturamento) e alguns acertos ficam com saldo em aberto para aparecer na Inadimplência. Parte = fração do que ela deve; o último pagamento fecha
// o resto, menos o "falta". O 4º item de cada pagamento é a CONTA; sem ele vale a conta padrão da forma.
import { calcularAcerto, pecasProximoMes, versaoVigente } from "@/apps/montagem/domain/consignado";

var CONTA = {pix:"PIX - POINT", pix_representante:"PIX REPRESENTANTE", link:"LINK - SICREDI - SORELLY - 46", credito:"CRÉDITO - CIELO - P", debito:"DÉBITO - CIELO - P", dinheiro:"DINHEIRO"};
// [representante, revendedora, venda, [[forma, parte, parcelas?, conta?]...], fração que fica em aberto, tipo do kit, extras?]
// Os 3 primeiros da Dayanne ficam com recebimento conferido (Ana Maria).
var ACERTOS_DEMO = [];   // 01/11/2026 (Marcus): as representantes ainda não usam o sistema, as abas de comissões começam ZERADAS. Os 20 acertos de demonstração saíram (estão no histórico do Git).
// SIMULAÇÃO do financeiro (Nayale): quais linhas de pagamento ela já confirmou, por posição na lista acima → [posições do pagamento]. O resto fica pendente para mostrar os dois casos.
//   Dayanne: Amanda inteira, Daniela só o Pix (o dinheiro fica pendente), Patrícia pendente do financeiro; Luciana ainda sem o agendamento. Lysie: Fernanda e o débito da Gabriela.
var FIN_DEMO = {0:[0], 1:[0], 5:[0], 6:[0], 15:[0], 16:[0]};
// Pix DIRETO para a representante (negociação da Thalita: 100% da comissão por Pix direto): o financeiro já confirmou 1, indicando que o Pix foi para a Thalita
var FIN_REP = {15:"Thalita"};
// 2 kits novos por representante (entrega feita junto da revendedora)
var KITS_NOVOS_DEMO = [];   // zerado junto com os acertos (01/11/2026)
var VERSAO_DEMO = 16;   // sobe quando a lista acima muda: o estado salvo troca os atendimentos de demonstração antigos pelos novos

function acertosDemo(s){
  var v = versaoVigente(s); if(!v) return [];
  var hoje = new Date(), dia = hoje.getDate(), r2 = function(n){ return Math.round(n*100)/100; };
  var dataDe = function(i){ var d = new Date(hoje.getFullYear(), hoje.getMonth(), 1 + (i % Math.max(1, dia)));       // espalha pelos dias do mês até hoje
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
  var horaDe = function(i){ return String(9 + i % 6).padStart(2,"0")+":"+String((i*7) % 60).padStart(2,"0"); };
  var acertos = ACERTOS_DEMO.map(function(x, i){
    var ex = x[6] || {}, venda = x[2], res = calcularAcerto({vendaBruta:venda, devolvida:0, garantia:0, vez:ex.vez||0, valorPago:null, atrasoDias:0}, v), iso = dataDe(i);
    var aPagar = r2(res.valorDevido*(1-x[4])), resto = aPagar;
    var pagamentos = x[3].map(function(p, j){
      var ultimo = j===x[3].length-1, valor = ultimo ? r2(resto) : r2(aPagar*p[1]); resto = r2(resto-valor);
      return {forma:p[0], descricao:p[3] || CONTA[p[0]], parcelas:p[2]||1, data:iso, valor:valor, anexo:null}; });
    // 3 primeiros dias da Dayanne: o agendamento (Ana Maria) já conferiu o recebimento e a promissória; falta só a conciliação do financeiro em Comissões
    var temDin = x[3].some(function(p){ return p[0]==="dinheiro"; });
    var conferido = (x[0]==="Dayanne" && i<3) || i===5 || i===6 ? {ok:true, em:iso+"T17:30:00", inicioTs:iso+"T17:18:00", fimTs:iso+"T17:30:00", quem:"Ana Maria", por:24, entrega:iso, semCond:false, prom:{ok:true, em:iso+"T17:30:00"},
      din:temDin ? {ok:true, contado:null, ts:iso+"T17:25:00", por:24} : undefined, rep:temDin ? {din:{ok:true, ts:iso+"T17:25:00"}, cond:{ok:true, ts:iso+"T17:26:00"}} : {cond:{ok:true, ts:iso+"T17:26:00"}}} : null;
    // peças e brindes (vêm do app): total de peças, vendidas, trocas, brindes lançados com código e valor, peças do próximo mês e retornadas
    var totalPc = Math.max(4, Math.round(venda/24)), vendidas = Math.round(totalPc*.6), trocas = ex.trocas!=null ? ex.trocas : (i%5===0 ? 1 : 0), lancados = [];
    if(res.brindeNormal>0){ var bn = res.brindeNormal, p1 = bn>=150 ? Math.round(bn*.6) : bn; lancados.push({cat:"normal", codigo:"N"+(1000+i*7), valor:p1, origem:"nova"}); if(bn>=150) lancados.push({cat:"normal", codigo:"N"+(1001+i*7), valor:bn-p1, origem:"nova"}); }
    if(res.brindeSelect>0) lancados.push({cat:"bb", codigo:"BB"+String(1000+i), valor:res.brindeSelect, origem:"nova"});
    var liberadas = pecasProximoMes(res.vendaLiquida, res.valorDevido, r2(res.valorDevido*x[4]), v.pecasProx).liberadas, proxCod = [];
    for(var q=0;q<Math.min(liberadas, ex.prox||4);q++) proxCod.push("P"+(2000+i*3+q));
    var pecas = {pecasCond:totalPc, pecasVendidas:vendidas, pecasTrocas:trocas, pecasBrinde:lancados.length, pecasADevolver:Math.max(0, totalPc-vendidas-lancados.length-trocas),
      brindesLancados:lancados, pecasProxCodigos:proxCod, pecasProxLiberadas:liberadas};
    return Object.assign({id:"ACD"+(i+1), rev:x[1], rep:x[0], tipo:"acerto", tipoKit:x[5], data:iso, hora:horaDe(i), regrasVersaoId:v.id,
      modalidade:"padrao", atrasoDias:0, vendaBruta:venda, garantia:0, reagendamentos:(ex.rem||[]).length, remarcacoes:(ex.rem||[]).slice(), recebimento:conferido, condicionaisSelecionadas:(ex.cond||[]).slice(), excedenteBrinde:0,
      pagamentos:pagamentos, trocas:(ex.trocasLista||[]).slice(), assinatura:null, regrasLidas:true, kitNovoOk:false, demo:true, fin:(FIN_DEMO[i]||[]).reduce(function(o, k){ o[k] = Object.assign({por:"Nayale", ts:iso+"T18:10:00", conta:pagamentos[k].descricao}, FIN_REP[i] ? {rep:FIN_REP[i]} : {}); return o; }, {})}, pecas, res);
  });
  var n = ACERTOS_DEMO.length;
  var novos = KITS_NOVOS_DEMO.map(function(x, i){
    return {id:"KND"+(i+1), tipo:"kit_novo_entrega", tipoKit:x[2], rep:x[0], rev:x[1], data:dataDe(n+i), hora:horaDe(n+i), condicionais:[], pecasTotal:40, pecasFaltaram:0, obsDivergencia:"",
      regrasLidas:[], assinatura:"assinatura-demo", demo:true,
      // Débora (kit novo da Dayanne): agendamento conferiu e a condicional foi assinada; o financeiro já confirmou os R$ 20,00
      recebimento:i===0 ? {ok:true, em:dataDe(n+i)+"T17:40:00", inicioTs:dataDe(n+i)+"T17:30:00", fimTs:dataDe(n+i)+"T17:40:00", quem:"Ana Maria", por:24, semCond:false, prom:{ok:true, em:dataDe(n+i)+"T17:40:00"}, rep:{cond:{ok:true, ts:dataDe(n+i)+"T17:38:00"}}} : null,
      fin:i===0 ? {k:{por:"Nayale", ts:dataDe(n+i)+"T18:15:00", conta:"PIX - POINT"}} : {}}; });
  return acertos.concat(novos);
}

export { ACERTOS_DEMO, VERSAO_DEMO, acertosDemo };

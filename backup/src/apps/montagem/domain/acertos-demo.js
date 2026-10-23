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
var ACERTOS_DEMO = [
  ["Dayanne","Amanda Ribeiro",1152, [["credito",1,3]], 0, "acerto_kit"],
  ["Dayanne","Daniela Moreira",2541, [["pix",.6],["dinheiro",.4]], 0, "acerto_kit"],
  ["Dayanne","Patrícia Nunes",3265, [["link",1]], 0, "acerto_kit"],
  ["Dayanne","Luciana Prado",1254, [["dinheiro",1]], 0, "saiu"],
  // Pix mandado direto para a representante: o financeiro escolhe de qual representante é (Comissões) e já conta como pago
  ["Dayanne","Aline Souza",1800, [["pix_representante",1]], 0, "acerto_kit"],

  ["Lysie","Fernanda Azevedo",215, [["pix",1,1,"PIX - LUCAS - PF"]], 0, "acerto_kit"],
  ["Lysie","Gabriela Mendes",654, [["debito",.55,1,"DÉBITO - ITAÚ - SERENITY"],["pix",.45,1,"PIX - SICREDI - AXIS"]], .12, "acerto_kit", {vez:1, rem:[{isenta:false, motivo:""}]}],
  ["Lysie","Helena Barros",896, [["pix",1,1,"PIX - ITAÚ - 59"]], .25, "saiu"],
  ["Lysie","Bruna Teixeira",1350, [["pix_representante",1]], 0, "acerto_kit"],
  ["Lysie","Mirela Santos",580, [["dinheiro",1]], 0, "saiu"],

  ["Jessica","Larissa Almeida",2658, [["credito",.5,6,"CRÉDITO - SAFRA - SORELLY - 34"],["dinheiro",.2],["pix",.3,1,"PIX SAFRA 34"]], 0, "acerto_kit"],
  ["Jessica","Mariana Costa",3587, [["link",.5,1,"LINK - SICREDI - SORELLY - 46"],["credito",.5,2,"CRÉDITO - SAFRA - 46"]], .08, "acerto_kit", {vez:1, rem:[{isenta:false, motivo:""}]}],
  ["Jessica","Natália Freitas",2154, [["pix",1,1,"PIX - ITAÚ PJ - MARCO"]], 0, "saiu"],
  ["Jessica","Carla Vidal",2200, [["pix_representante",1]], 0, "saiu"],
  ["Jessica","Nádia Pires",280, [["pix",1,1,"PIX H&O"]], 0, "acerto_kit", {vez:0, rem:[{isenta:true, motivo:"Falecimento na família"}]}],

  ["Thalita","Fabiana Moura",3400, [["pix_representante",.4],["link",.3,1,"LINK - SICREDI - SERENITY - 59"],["debito",.3,1,"DÉBITO - ITAÚ - SERENITY"]], 0, "acerto_kit"],
  ["Thalita","Jaqueline Neves",2750, [["pix",.35,1,"PIX - ITAÚ PJ - MARCO"],["pix",.35,1,"PIX - BANHO"],["credito",.3,2,"CRÉDITO - CIELO - P"]], 0, "acerto_kit"],
  ["Thalita","Karina Lopes",1100, [["pix",.6,1,"PIX - TUCANO"],["pix",.4,1,"PIX - CAIXA ECONÔMICA - ANAMARIA"]], .1, "saiu", {vez:1, rem:[{isenta:false, motivo:""}]}],
  ["Thalita","Letícia Barros",4300, [["link",.4,1,"LINK - SICREDI - SORELLY - 46"],["credito",.3,4,"CRÉDITO - SAFRA - 46"],["pix",.3,1,"PIX PRESTADORES DE SERVIÇOS"]], 0, "acerto_kit"],
  // Acerto grande pedido pelo Marcus: venda de R$ 10.000, um pouco em aberto (inadimplência), brindes completos, trocas, peças do próximo mês e 2 condicionais
  ["Thalita","Rúbia Falcão",10000, [["pix",.5,1,"PIX - POINT"],["credito",.5,3,"CRÉDITO - CIELO - P"]], .05, "acerto_kit", {trocas:3, prox:8, cond:["9301","9302"], trocasLista:[{tipo:"mes", antigaCod:"N88", antigaValor:88, novaCod:"N96", novaValor:96}, {tipo:"mes", antigaCod:"AB410", antigaValor:120, novaCod:"AB411", novaValor:130}, {tipo:"anterior", antigaCod:"CD77", antigaValor:88, novaCod:"CD78", novaValor:96}]}]];
// SIMULAÇÃO do financeiro (Nayale): quais linhas de pagamento ela já confirmou, por posição na lista acima → [posições do pagamento]. O resto fica pendente para mostrar os dois casos.
//   Dayanne: Amanda inteira, Daniela só o Pix (o dinheiro fica pendente), Patrícia pendente do financeiro; Luciana ainda sem o agendamento. Lysie: Fernanda e o débito da Gabriela.
var FIN_DEMO = {0:[0], 1:[0], 5:[0], 6:[0], 15:[0], 16:[0]};
// Pix DIRETO para a representante (negociação da Thalita: 100% da comissão por Pix direto): o financeiro já confirmou 1, indicando que o Pix foi para a Thalita
var FIN_REP = {15:"Thalita"};
// 2 kits novos por representante (entrega feita junto da revendedora)
var KITS_NOVOS_DEMO = [
  ["Dayanne","Débora Martins","kit_novo"], ["Dayanne","Tainara Bueno","kit_novo_exp"],
  ["Lysie","Elaine Rocha","kit_novo_exp"], ["Lysie","Cíntia Marques","kit_novo"],
  ["Jessica","Michele Antunes","kit_novo"], ["Jessica","Roberta Silveira","kit_novo_exp"],
  ["Thalita","Elisa Fontes","kit_novo"], ["Thalita","Paloma Reis","kit_novo_exp"]];
var VERSAO_DEMO = 15;   // sobe quando a lista acima muda: o estado salvo troca os atendimentos de demonstração antigos pelos novos

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

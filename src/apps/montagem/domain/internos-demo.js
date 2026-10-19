// Sorelly Admin — domain/internos-demo.js
// Listagem do atendimento interno passada pelo Marcus (outubro/2026): 02/10 já foi atendida (vira acerto feito, aparece no Consolidado) e 05/10 é a agenda de hoje.
// Dados reais da listagem: nome, horário, condicional, venda, chegada, encomenda e observação. Quem bipou vem da observação (nome da bipadora).
//
// PARA O LEONARDO (desenvolvimento): o VALOR DA VENDA do atendimento interno tem que vir DIRETO DO APP DA REVENDEDORA, não é digitado.
// Ponto de ligação: campo `vendaApp` de cada item de `s.internos` (a Atendimento Sorelly preenche "Quanto ela vendeu" sozinho com ele).
// Hoje `vendaApp` fica 0 (= ainda não puxou do app). Ao integrar, gravar o total vendido do mês da revendedora em `vendaApp`.
import { FORM_ACERTO_VAZIO } from "@/apps/montagem/domain/acerto-derivado";
import { calcularAcerto, textoRegras, versaoEfetiva, versaoVigente } from "@/apps/montagem/domain/consignado";
import { BIPADORAS } from "@/apps/montagem/domain/equipe";
import { internosReais, pedidosReais } from "@/apps/montagem/domain/revendedoras-reais";

var ANO = "2026-10";
var LISTAGEM_INTERNA = [];   // a lista vem de revendedoras-reais.js (arquivo local com os dados reais); sem ela a agenda fica vazia
var VERSAO_INTERNOS = 11;   // sobe quando a lista muda: o estado salvo troca os de demonstração antigos

// 14/10/2026: o Marcus mandou a planilha real; os dados de mentira saíram. Ninguém vem marcado como atendido: as funcionárias preenchem e realizam cada atendimento,
// e os pedidos de pagamento de hoje já nascem prontos para definir a conta, anexar comprovante e conferir.
function internosDemo(s){
  var v = versaoVigente(s), internos = internosReais(v ? v.id : null);
  return {internos:internos, acertos:[], lancFin:pedidosReais(internos)};
}

// Termo do consignado já assinado em setembro (a revendedora voltou este mês): leu, confirmou e assinou todas as informações
function assinaturaDemo(nome){
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="110" viewBox="0 0 360 110"><rect width="360" height="110" fill="white"/><text x="20" y="66" font-family="Brush Script MT, Segoe Script, cursive" font-size="32" font-style="italic" fill="#1B1409">' + nome + '</text><path d="M20 88 Q 130 70 340 86" stroke="#1B1409" stroke-width="2" fill="none"/></svg>';
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
function termosDemo(s){
  return {};   // sem termo de demonstração (a Camille de teste saiu com os dados falsos)
  var v = versaoVigente(s); if(!v) return {};
  var regras = textoRegras(v, "padrao").filter(function(r){ return !/deslocamento|pe[cç]as/i.test(r.t); }).map(function(r){ return r.t; });
  return {"Camille Vitória Peixoto":{termoConsignado:{ts:Date.parse("2026-09-02T10:12:00"), assinatura:assinaturaDemo("Camille V. Peixoto"), regras:regras, versaoId:v.id, por:"Natasha", origem:"interno"}}};
}

// 19/10/2026 (pedido do Marcus): 10 atendimentos já FEITOS no dia 19 para ver o consolidado; amanhã ele pede os do dia 20, e assim por diante. Não é demonstração (não é apagada ao subir a versão).
var VENDAS_19 = [2150, 3200, 1480, 2780, 3900, 1850, 2460, 3340, 1720, 2980];
function feitos19(s){
  var v = versaoVigente(s), base = (s.internos||[]).filter(function(x){ return x.real; }).slice(0, 10), outI = [], outA = [];
  if(!v) return {internos:outI, acertos:outA};
  var bip = ["Natasha","Edna","Natasha","Edna","Natasha","Edna","Natasha","Edna","Natasha","Edna"];
  base.forEach(function(it, i){
    var venda = VENDAS_19[i], ef = versaoEfetiva(v, "padrao"), res = calcularAcerto({vendaBruta:venda, devolvida:0, garantia:0, vez:0, valorPago:venda, atrasoDias:0, semTaxa:true}, ef);
    var pix = Math.round(venda*0.6*100)/100, resto = Math.round((venda-pix)*100)/100, hora = String(9+Math.floor(i/2)).padStart(2,"0")+":"+(i%2 ? "30" : "00");
    var pagamentos = [{forma:"pix", descricao:"", parcelas:1, data:"2026-10-19", valor:pix}, {forma:i%3===0 ? "dinheiro" : "debito", descricao:"", parcelas:1, data:"2026-10-19", valor:resto}];
    var id = "ID19_"+(i+1);
    var reg = Object.assign({id:"AC19_"+(i+1), internoId:id, rev:it.nome, rep:"Atendimento interno", origem:"interno", tipo:"acerto", data:"2026-10-19", regrasVersaoId:v.id, modalidade:"padrao", atrasoDias:0, hora:hora, vendaBruta:venda, garantia:0, pecasCond:0, reagendamentos:0,
      pagamentos:pagamentos, acordo:null, recusouNegociar:false, brindesLancados:[], excedenteBrinde:0, kitNovoOk:true, por:bip[i], teste19:true}, res);
    outA.push(reg);
    outI.push(Object.assign({}, it, {id:id, data:"2026-10-19", hora:hora, status:"acertado", acerto:res, acertoAssinado:false, bipou:bip[i], atendeu:bip[i], kitNovo:true, vendaApp:venda, demo:false, teste19:true, revIntId:undefined}));
  });
  return {internos:outI, acertos:outA};
}
export { feitos19, termosDemo, LISTAGEM_INTERNA, VERSAO_INTERNOS, internosDemo };

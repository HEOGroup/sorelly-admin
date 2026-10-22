// Sorelly Admin · montagem — domain/revendedoras-reais.js
// Revendedoras do atendimento interno com dados REAIS. Os dados (nome, telefone, código da DevMaster) ficam em revendedoras-internas.local.js,
// fora do Git porque o repositório é público; aqui só mora o código que transforma a lista em agenda, controle e pedidos de pagamento.
// Sem o arquivo local, as telas ficam vazias (nada de dados de mentira). Quando existir servidor, a lista vem de lá.
var LOCAL = (function(){ var m = import.meta.glob("./revendedoras-internas.local.js", {eager:true}); var k = Object.keys(m)[0]; return k ? m[k].default : null; })();
var LINHAS = LOCAL && LOCAL.linhas ? LOCAL.linhas : [];
var PEDIDOS = LOCAL && LOCAL.pedidosHoje ? LOCAL.pedidosHoje : [];
function tem(){ return LINHAS.length>0; }

// agenda da Atendimento Sorelly: uma linha por revendedora, ninguém marcado como atendido (as funcionárias preenchem e realizam o atendimento)
function internosReais(versaoId){
  return LINHAS.map(function(r, i){
    var vendasAnt = r.historico ? [] : [r.venda1, r.venda2].filter(function(v){ return v>0; });   // com histórico completo, a média sai dele
    return {id:"ID"+(i+1), nome:r.nome, fone:r.fone||"", devmaster:r.cod||"", data:r.dia, hora:r.hora, condicionais:[], obs:r.obs||"", chegada:"", encomenda:"", remarcacoesLista:[],
      status:"agendado", regrasVersaoId:versaoId||null, criadoPor:"Agendamento", criadoEm:Date.parse(r.dia+"T08:00:00"), vendaApp:r.vendaHoje||0, vendaFonte:"app_revendedora", vendasAnt:vendasAnt, revIntId:"RI"+(i+1),
      demo:true, real:true};
  });
}
// controle da agendadora (aba Revendedoras): kit, ciclo, últimas vendas e datas; o que a planilha não trouxe fica em branco (pendente)
function revInternasReais(){
  return LINHAS.map(function(r, i){
    // histórico de vendas SEM limite (do mais novo para o mais antigo); sem ele, vale o que a planilha trouxe
    var hist = r.historico ? r.historico.map(function(h){ return {data:h.data, venda:h.venda, acerto:h.acerto==null ? null : h.acerto}; }) : [{data:r.data1||null, venda:r.venda1==null ? null : r.venda1, acerto:null}, {data:r.data2||null, venda:r.venda2==null ? null : r.venda2, acerto:null}, {data:null, venda:null, acerto:null}];
    while(hist.length<3) hist.push({data:null, venda:null, acerto:null});
    return {id:"RI"+(i+1), nome:r.nome, ciclo:r.ciclo||30, proximoManual:null, situacao:"agendada", agend:{data:r.dia, hora:r.hora}, internoId:"ID"+(i+1), hist:hist,
      contatos:r.fone ? [{nome:"WhatsApp da revendedora", fone:r.fone}] : [], prata:/prata/i.test(r.kit||""), devmaster:r.cod||"", obs:r.obs||""};
  });
}
// pedidos de pagamento de hoje que já estavam rolando no grupo de WhatsApp (Gabrielle e Mariane)
function pedidosReais(internos){
  return PEDIDOS.map(function(p, k){
    var it = internos.find(function(x){ return x.nome===p.nome; }); if(!it) return null;
    // o que a funcionária já lançou na calculadora (forma e valor exatos), para bater com o pedido enviado ao financeiro
    if(p.linhas.every(function(l){ return l.conta; })) it.rascunho = {vendaBruta:it.vendaApp||null, pagamentos:p.linhas.map(function(l){ return {forma:l.forma, descricao:"", parcelas:1, data:it.data, valor:l.valor, anexo:null}; })};
    var parte = function(v, c){ return [{descricao:c||"", valor:v, comprovante:null, ok:false}]; };
    return {id:"LFR"+(k+1), internoId:it.id, nome:p.cliente || p.nome, enviadoTs:Date.parse(it.data+"T"+p.hora+":00"), por:p.por, conferido:false, etapaComprovantes:false, finalizado:false, demo:true, real:true,
      linhas:p.linhas.map(function(l){ return {tipo:l.tipo, forma:l.forma, valor:l.valor, isento:false, enviada:!!l.conta, partes:parte(l.valor, l.conta)}; })};   // conta já definida pelo financeiro = vai direto para o comprovante
  }).filter(Boolean);
}
export { tem, internosReais, revInternasReais, pedidosReais };

// Sorelly Admin · montagem — domain/pagamento-rep.js
// Pagamentos da representante no acerto (app dela): ela informa só FORMA + VALOR e SOLICITA A CONTA; o app nunca espera (segue para os brindes etc.).
// O pedido sobe NA HORA no Controle de pagamentos (Financeiro) como um lançamento s.lancFin de origem "rep" (id "LFR_P"+kitId, uma linha por pagamento, ligada pelo `pid`).
// Pix/link/crédito/débito pedem conta: dinheiro, acerto com loja e Pix representante não pedem (não passam por aqui).
// Quem resolve: regra automática do Financeiro (domain/pix-regras.js, inclusive a conta fixa da representante) ou qualquer pessoa que pode definir contas (podeConferirPag).
// Quando a conta chega, o app da representante avisa e o nome da conta é gravado no pagamento do acerto (acertosConsignado[].pagamentos[].descricao).
import { pxAplicar } from "@/apps/montagem/domain/pix-regras";
import { contasDefinidas, contasEnviadas } from "@/apps/montagem/domain/atendimento-interno";

var FORMAS_PEDEM_CONTA = ["pix", "link", "credito", "debito"];
var pedeConta = function(forma){ return FORMAS_PEDEM_CONTA.indexOf(forma)>=0; };
var idPedidoRep = function(kitId){ return "LFR_P"+kitId; };
var pedidoDe = function(lancFin, kitId){ return (lancFin||[]).find(function(x){ return x.id===idPedidoRep(kitId); }) || null; };

// cria/atualiza o pedido do kit com mais um pagamento e já aplica o que as regras decidem sozinhas
function repPedirConta(lancFin, px, a, agora){
  var lf0 = lancFin || [], id = idPedidoRep(a.kitId), ant = lf0.find(function(x){ return x.id===id; });
  var linha = {tipo:"pagamento", forma:a.forma, valor:a.valor, isento:false, pid:a.pid, parcelas:a.parcelas||1, data:a.data||"", pedidoTs:agora, enviada:false,
    partes:[{descricao:"", valor:a.valor, comprovante:a.anexo && a.anexo.dados ? {nome:a.anexo.nome, url:a.anexo.dados} : null, ok:false}]};
  var base = ant ? Object.assign({}, ant, {linhas:ant.linhas.filter(function(l){ return l.pid!==a.pid; }).concat([linha]), conferido:false})
    : {id:id, origem:"rep", pedidoRep:a.kitId, repAcertoId:null, nome:a.rev, por:a.rep, enviadoTs:agora, etapaComprovantes:true, finalizado:true, conferido:false, linhas:[linha]};
  var novo = pxAplicar(px, base, lf0);
  return ant ? lf0.map(function(x){ return x.id===id ? novo : x; }) : [novo].concat(lf0);
}
// a representante apagou o pagamento antes de registrar o acerto: some do pedido (e o pedido some se ficar vazio)
function repRemoverPedido(lancFin, kitId, pid){
  var id = idPedidoRep(kitId);
  return (lancFin||[]).map(function(x){ if(x.id!==id) return x;
    var ls = x.linhas.filter(function(l){ return l.pid!==pid; });
    return ls.length ? Object.assign({}, x, {linhas:ls}) : null; }).filter(Boolean);
}
// situação de um pagamento para a representante: aguardando a conta, conta recebida ou já pago (maquininha única)
function estadoPagRep(lancFin, kitId, pid){
  var lf = pedidoDe(lancFin, kitId), l = lf && lf.linhas.find(function(x){ return x.pid===pid; });
  if(!l) return null;
  var def = contasDefinidas(l) && contasEnviadas(l), ps = l.partes || [];
  return {aguardando:!def, conta:def ? ps.map(function(q){ return q.descricao; }).join(" + ") : "", auto:l.auto || "", ts:l.pedidoTs || (lf && lf.enviadoTs) || 0, pago:def && ps.every(function(q){ return q.ok; })};
}
// pagamentos do pedido no formato do formulário do acerto (se a representante sair da tela e voltar antes de registrar)
function pagamentosDoPedido(lancFin, kitId){
  var lf = pedidoDe(lancFin, kitId); if(!lf) return [];
  return lf.linhas.filter(function(l){ return l.pid; }).map(function(l){ var q = (l.partes||[])[0] || {}, c = q.comprovante;
    return {forma:l.forma, descricao:contasDefinidas(l) && contasEnviadas(l) ? l.partes.map(function(z){ return z.descricao; }).join(" + ") : "", parcelas:l.parcelas||1, data:l.data||"", valor:l.valor, anexo:c ? {nome:c.nome, tipo:"", dados:c.url, tamanho:0} : null, pid:l.pid}; });
}
// grava o nome da conta nos pagamentos já registrados do acerto (e liga o pedido ao acerto); devolve o estado (o mesmo objeto se nada mudou)
function sincContasRep(st){
  var mud = false, lfs = st.lancFin || [];
  var ac = (st.acertosConsignado||[]).map(function(r){
    if(r.tipo!=="acerto" || !(r.pagamentos||[]).some(function(p){ return p.pid; })) return r;
    var lf = pedidoDe(lfs, r.kitId); if(!lf) return r;
    var ps = r.pagamentos.map(function(p){ if(!p.pid) return p;
      var l = lf.linhas.find(function(x){ return x.pid===p.pid; });
      if(!l || !(contasDefinidas(l) && contasEnviadas(l))) return p;
      var d = l.partes.map(function(q){ return q.descricao; }).join(" + ");
      return p.descricao===d ? p : Object.assign({}, p, {descricao:d}); });
    if(ps.every(function(p, i){ return p===r.pagamentos[i]; })) return r;
    mud = true; return Object.assign({}, r, {pagamentos:ps});
  });
  return mud ? Object.assign({}, st, {acertosConsignado:ac}) : st;
}

export { pedeConta, idPedidoRep, pedidoDe, repPedirConta, repRemoverPedido, estadoPagRep, pagamentosDoPedido, sincContasRep };

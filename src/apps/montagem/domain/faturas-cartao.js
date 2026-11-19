// Sorelly Admin · montagem — domain/faturas-cartao.js
// Faturas do cartão (Marcus, 19/11/2026: "abre uma tela de faturas, que daí você faz o extrato delas pra não esquecer"). Começa com o Itaú Black.
// As faturas ficam no módulo ff do servidor, em ff.faturas = {cartoes:[{id, nome, titular, contaBancId}], lista:[{id, cartao, ym (mês do vencimento), fecha, venc, total, iof, pago:{em, valor, fonte}|null, previa, fonte, linhas:[{d, est, par, v, tipo}]}]}.
// Aqui só a conferência: cada linha da fatura é comparada com as contas lançadas no cartão naquele mês (mesmo valor; em empate vale o nome mais parecido).
// A conferência só LÊ. Ela nunca cria nem apaga conta: quem decide é o Marcus.

// contas bancárias que representam o cartão Itaú Black no Financeiro familiar (o cartão e as duas "Conta Itaú Black" da família)
var CONTAS_CARTAO = ["cmt7x1try004502i63473l60t", "cb7", "cmtcyoby6000002l8un1db5h7"];
var r2 = function(v){ return Math.round((Number(v) || 0)*100)/100; };
var norm = function(s){ return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); };
// quantas palavras (de 4 letras ou mais) do estabelecimento aparecem no nome da conta; só desempata
var parecido = function(est, desc){ var d = norm(desc); return norm(est).split(" ").filter(function(w){ return w.length>=4 && d.indexOf(w)>=0; }).length; };

// contas lançadas no cartão no mês de vencimento da fatura
function contasDoCartao(ff, ym, cartao){
  var ids = (cartao && cartao.contaIds) || CONTAS_CARTAO, out = [];
  (ff.contas || []).forEach(function(c){
    var p = ((ff.parcelas || {})[c.id] || {})[ym]; if(!p) return;
    if(c.forma!=="Cartão de crédito" || ids.indexOf(c.contaBancId)<0) return;
    var pes = (ff.personas || []).find(function(x){ return x.id===c.personaId; }), pago = r2((p.pagamentos || []).reduce(function(t, x){ return t+x.valor; }, 0));
    out.push({id:c.id, desc:c.descricao, pessoa:pes ? pes.nome : "—", v:r2(p.valor), pago:pago, status:pago>=p.valor-0.005 ? "Paga" : pago>0 ? "Parcial" : "Aberta"});
  });
  return out;
}

// devolve {linhas (da fatura, com situação e conta), sobras (contas sem linha na fatura), resumo}
function conferirFatura(ff, fat){
  var cartao = ((ff.faturas || {}).cartoes || []).find(function(c){ return c.id===fat.cartao; });
  var sis = contasDoCartao(ff, fat.ym, cartao), usados = {}, semSistema = sis.length===0;
  var linhas = (fat.linhas || []).map(function(l, i){
    var base = Object.assign({}, l, {id:fat.id+"#"+i, conta:"", pessoa:"", situacao:""});
    if(l.tipo==="IOF"){ base.situacao = "IOF"; return base; }
    if(l.v<0){ base.situacao = "Estorno"; return base; }
    if(semSistema){ base.situacao = "Anterior ao sistema"; return base; }
    var cands = []; sis.forEach(function(x, ix){ if(!usados[ix] && Math.abs(x.v-l.v)<0.006) cands.push({x:x, ix:ix}); });
    if(!cands.length){ base.situacao = "Falta no sistema"; return base; }
    cands.sort(function(a, b){ return parecido(l.est, b.x.desc)-parecido(l.est, a.x.desc); });
    usados[cands[0].ix] = true; base.situacao = "Lançada"; base.conta = cands[0].x.desc; base.pessoa = cands[0].x.pessoa; return base;
  });
  var sobras = sis.filter(function(x, ix){ return !usados[ix]; });
  var soma = function(ls, f){ return r2(ls.reduce(function(t, x){ return t+(f ? f(x) : x.v); }, 0)); };
  var lanc = linhas.filter(function(l){ return l.situacao==="Lançada"; }), falta = linhas.filter(function(l){ return l.situacao==="Falta no sistema"; });
  var somaLinhas = soma(linhas);
  return {linhas:linhas, sobras:sobras, semSistema:semSistema, cartao:cartao,
    resumo:{total:r2(fat.total), somaLinhas:somaLinhas, diferenca:r2(fat.total-somaLinhas), nLinhas:linhas.length, lancadas:soma(lanc), nLancadas:lanc.length, falta:soma(falta), nFalta:falta.length, sobra:soma(sobras), nSobra:sobras.length}};
}

export { CONTAS_CARTAO, contasDoCartao, conferirFatura };

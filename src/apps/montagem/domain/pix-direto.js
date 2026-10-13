// Sorelly Admin — domain/pix-direto.js
// NEGOCIAÇÃO DO PIX DIRETO: o Marcus combina com cada representante quanto da comissão dela será paga por Pix direto da revendedora para ela
// (forma "Pix representante"). Pode ser uma PORCENTAGEM da comissão do mês ou um VALOR em reais, só naquele mês ou fixo, e aceita um valor EXTRA
// com descrição. Só a diretoria edita (Regras dos representantes). O financeiro acompanha em Representantes → Financeiro → Pix direto a enviar:
// a meta sobe durante o mês conforme a comissão cresce, e o "enviado" é o que já entrou como Pix representante (OK do financeiro).
// Fica em s.negPix = { "<representante>": {modo:"pct"|"valor", valor, vigencia:"mes"|"fixo", mes:"AAAA-MM", extra, extraTxt} }.
import { datasDoMes, fmtDataBR, grupoDaRep, itensComissao } from "@/apps/montagem/domain/comissoes";

var r2 = function(n){ return Math.round(n*100)/100; };

// Negociação que vale para a representante naquele mês ("fixo" vale sempre; "mes" só no mês gravado)
function negociacaoDe(s, rep, mesIso){
  var n = (s.negPix||{})[rep];
  if(!n) return null;
  return n.vigencia==="fixo" || n.mes===mesIso ? n : null;
}
// Quanto deve ir por Pix direto: % da comissão do mês ou valor em reais, mais o extra
function metaPix(n, comissaoMes){
  if(!n) return 0;
  var base = n.modo==="valor" ? (n.valor||0) : comissaoMes*(n.valor||0)/100;
  return r2(base + (n.extra||0));
}
// Resumo de uma representante no mês: comissão, meta do Pix direto, o que já foi enviado, o que falta e o prazo (próxima data de pagamento)
function resumoPix(c, s, itens, rep, mesIso, agora){
  var meus = itens.filter(function(i){ return i.dest===rep && (i.data||"").slice(0,7)===mesIso; });
  var comissao = r2(meus.filter(function(i){ return !i.pixRep; }).reduce(function(t,i){ return t+i.comissao; }, 0));
  var enviados = meus.filter(function(i){ return i.pagoDireto; });
  var enviado = r2(enviados.reduce(function(t,i){ return t+i.valorPago; }, 0));
  var n = negociacaoDe(s, rep, mesIso), meta = metaPix(n, comissao);
  var grupo = grupoDaRep(c, rep), ano = +mesIso.slice(0,4), mes = +mesIso.slice(5,7);
  var datas = datasDoMes(c, grupo, mesIso).concat(datasDoMes(c, grupo, new Date(ano, mes, 1).toISOString().slice(0,7)));
  var hoje = new Date(agora).toISOString().slice(0,10);
  var prazo = datas.filter(function(d){ return d>=hoje; })[0] || datas[datas.length-1];
  return {rep:rep, neg:n, comissao:comissao, meta:meta, enviado:enviado, falta:Math.max(0, r2(meta-enviado)), sobra:Math.max(0, r2(enviado-meta)),
    pct:meta>0 ? Math.min(100, enviado/meta*100) : 0, prazo:prazo, prazoBR:prazo ? fmtDataBR(prazo).slice(0,5) : "", lista:enviados};
}
// Todas as representantes que têm negociação (ou Pix direto enviado) no mês, para o relatório do financeiro
function relatorioPix(c, s, mesIso, agora, nomes){
  var itens = itensComissao(c, s, agora);
  return nomes.map(function(n){ return resumoPix(c, s, itens, n, mesIso, agora); })
    .filter(function(x){ return x.neg || x.enviado>0; });
}
function textoNegociacao(n){
  if(!n) return "sem negociação";
  var base = n.modo==="valor" ? "R$ "+(n.valor||0).toLocaleString("pt-BR",{minimumFractionDigits:2}) : (n.valor||0)+"% da comissão";
  return base+(n.extra>0 ? " + extra R$ "+n.extra.toLocaleString("pt-BR",{minimumFractionDigits:2}) : "")+(n.vigencia==="fixo" ? " · fixo" : " · só em "+(n.mes||""));
}

export { negociacaoDe, metaPix, resumoPix, relatorioPix, textoNegociacao };

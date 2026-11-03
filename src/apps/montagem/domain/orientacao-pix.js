// Sorelly Admin · montagem — domain/orientacao-pix.js
// Orientação do caixa para o Pix (02/11/2026, Marcus: "temos salário nos próximos dias e temos contas negativas, me oriente").
// Junta 3 coisas que o sistema já sabe: saldo e limite de cada conta (Saldos bancários), previsão de caixa por CNPJ (contas a pagar lançadas) e a folha que vence nos próximos dias.
// Devolve quem precisa de Pix primeiro. Quem decide continua sendo o Lucas: isto só orienta.
import { previsaoCaixa } from "@/apps/montagem/domain/previsao-caixa";
import { datasLancadas, posicaoEm } from "@/apps/montagem/domain/saldos-contas";
import { G, itensEmpresa } from "@/apps/montagem/domain/contas-empresa";

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var somaDias = function(iso, n){ var d = new Date(iso+"T12:00:00"); d.setDate(d.getDate()+n); return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2); };

/** {dataSaldo, cnpjs:[{id,nome,saldo,limite,pior,piorDia,negativa,estoura,folha,folhaDia,sobra,pos}], negativas:[{nome,saldo,limite,folga}], folha:{total,itens:[{venc,filial,nome,valor}]}, frases:[texto]} */
function orientacaoCaixa(sc, hoje, dias){
  var dl = datasLancadas(sc), dataSaldo = dl.length ? dl[dl.length-1] : null;
  if(!dataSaldo) return null;
  var pc = previsaoCaixa(sc), fim = somaDias(hoje, dias||10);
  var folhaItens = itensEmpresa().filter(function(i){ return i.status==="apagar" && (i.grupo===G.folha || i.grupo===G.enc) && i.venc>=hoje && i.venc<=fim; })
    .map(function(i){ return {venc:i.venc, filial:i.filial, nome:i.nome, valor:i.valor}; }).sort(function(a, b){ return a.venc<b.venc ? -1 : a.venc>b.venc ? 1 : 0; });
  var cnpjs = (pc ? pc.cnpjs : []).filter(function(c){ return c.id!=="sem"; }).map(function(c){
    var meus = folhaItens.filter(function(i){ return i.filial===c.id; }), folha = r2(meus.reduce(function(t, i){ return t+i.valor; }, 0));
    var estoura = c.linhas.some(function(l){ return l.estourou; });
    var folga = r2(c.saldoHoje+c.limite);
    return {id:c.id, nome:c.nome, saldo:r2(c.saldoHoje), limite:r2(c.limite), pior:r2(c.pior), piorDia:c.piorDia, negativa:c.saldoHoje<0, estoura:estoura, folha:folha, folhaDia:meus.length ? meus[0].venc : "", folga:folga, faltaFolha:r2(Math.max(0, folha-folga)), apos:r2(folga-folha)};
  }).sort(function(a, b){ return a.apos-b.apos; });   // menor folga depois da folha = precisa de Pix primeiro
  cnpjs.forEach(function(c, i){ c.pos = i+1; });
  var pos = posicaoEm(sc, dataSaldo), negativas = [];
  pos.blocos.forEach(function(b){ b.contas.forEach(function(x){ if(!x.conta.bloqueada && x.saldo<0) negativas.push({nome:x.conta.nome, bloco:b.id, saldo:r2(x.saldo), limite:r2(x.conta.limite||0), folga:r2(x.saldo+(x.conta.limite||0))}); }); });
  negativas.sort(function(a, b){ return a.folga-b.folga; });
  var fmt = function(n){ return "R$ "+Number(Math.abs(n)).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}); };
  var dm = function(iso){ return iso ? iso.split("-").reverse().slice(0, 2).join("/") : ""; };
  var frases = [];
  cnpjs.forEach(function(c){
    var t = "CNPJ "+c.id+": saldo "+(c.saldo<0 ? "−" : "")+fmt(c.saldo)+" (limite "+fmt(c.limite)+")";
    if(c.estoura) t += ". Vai passar do limite em "+dm(c.piorDia)+" (pior saldo "+(c.pior<0 ? "−" : "")+fmt(c.pior)+")";
    else if(c.negativa) t += ". Está negativo, mas ainda dentro do limite";
    if(c.folha>0) t += ". Folha de "+fmt(c.folha)+" vence em "+dm(c.folhaDia)+(c.faltaFolha>0 ? ". Faltam "+fmt(c.faltaFolha)+" para cobrir (saldo mais limite: "+fmt(c.folga)+")" : ". Cabe na folga");
    frases.push({pos:c.pos, id:c.id, texto:t+".", grave:c.estoura || c.faltaFolha>0});
  });
  return {dataSaldo:dataSaldo, ate:fim, cnpjs:cnpjs, negativas:negativas, folha:{total:r2(folhaItens.reduce(function(t, i){ return t+i.valor; }, 0)), itens:folhaItens}, frases:frases, semPrevisao:!pc};
}
/** Contas Pix de um CNPJ com saldo, limite e folga (a mais apertada primeiro). Só entram as ligadas a uma conta do Saldos bancários (caixaId). */
function contasPixDoCnpj(px, sc, cnpj){
  var dl = datasLancadas(sc), data = dl.length ? dl[dl.length-1] : null; if(!data) return [];
  var mapa = {}; posicaoEm(sc, data).blocos.forEach(function(b){ b.contas.forEach(function(x){ mapa[x.conta.id] = x; }); });
  return (px.contas||[]).filter(function(c){ return c.ativa && c.cnpj===cnpj && c.caixaId && mapa[c.caixaId]; })
    .map(function(c){ var x = mapa[c.caixaId], lim = x.conta.limite||0; return {label:c.label, saldo:r2(x.saldo), limite:r2(lim), folga:r2(x.saldo+lim)}; })
    .sort(function(a, b){ return a.folga-b.folga; });
}
export { orientacaoCaixa, contasPixDoCnpj };

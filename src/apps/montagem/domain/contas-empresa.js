// Sorelly Admin · montagem — domain/contas-empresa.js
// Contas a pagar da EMPRESA por filial (CNPJ 34, 46, 59, 67 Axis e "Por fora"), a partir dos relatórios do DevMaster (por filial, passados pelo Marcus em 19/10/2026):
// "Baixas a Pagar por Natureza" = o que JÁ FOI PAGO e "Contas a Pagar por Natureza" = o que FALTA PAGAR (saldo). Dados reais em contas-empresa.local.js (fora do GitHub).
// Total do mês = pago + falta pagar. Natureza = código do plano de contas do DevMaster (ex.: 3.01.01.11); prefixo = tipo do título (cartão, imposto, pix...).
// Mês de um pagamento = mês da baixa; mês de uma conta a pagar = mês do vencimento (vencida de mês anterior fica no mês corrente e é sinalizada).

import { parcelasDe } from "@/apps/montagem/domain/financeiro-familiar";

var LOCAL = (function(){ try { var m = import.meta.glob("./contas-empresa.local.js", {eager:true}); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();

var FILIAIS = [["34","CNPJ 34","Sorelly Atacadista"], ["46","CNPJ 46","Mayz Comércio"], ["59","CNPJ 59","Serenity"], ["67","CNPJ 67","Axis Joias"], ["fora","Por fora","Pessoal, Pix e fora dos CNPJs"]];
var GRUPOS = ["Folha e pessoal", "Fornecedores e produção", "Sócios e despesas pessoais", "Comissões, marketing e sistemas", "Financeiro (empréstimos, juros)", "Impostos", "Administrativo", "Axis e H&O"];

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var ym = function(iso){ return iso.slice(0,7); };

function grupoDe(cod, nome){
  if(/PRÓ-LABORE/.test(nome) || /^3\.13\./.test(cod) || /^3\.16\.08/.test(cod)) return GRUPOS[2];
  if(/^3\.01\.02/.test(cod)) return GRUPOS[5];
  if(/^3\.01\.01/.test(cod)) return GRUPOS[0];
  if(/^(11|12)\./.test(cod)) return GRUPOS[7];
  if(/^5\./.test(cod)) return GRUPOS[1];
  if(/^4\./.test(cod)) return GRUPOS[3];
  if(/^6\./.test(cod)) return GRUPOS[4];
  return GRUPOS[6];
}

var _cache = null;
function itensEmpresa(){
  if(_cache) return _cache;
  var pagas = ((LOCAL && LOCAL.itens) || []).map(function(x, i){
    return {id:"p"+i, status:"pago", filial:x[0], nat:x[1], natNome:x[2], pref:x[3], num:x[4], parc:x[5], forn:x[6], nome:x[7], baixa:x[8], venc:x[9], valor:x[10], grupo:grupoDe(x[1], x[2]), pessoal:grupoDe(x[1], x[2])===GRUPOS[2], mes:ym(x[8]), outroMes:ym(x[9])!==ym(x[8])};
  });
  var mesRef = pagas.reduce(function(m, i){ return i.mes>m ? i.mes : m; }, "");
  var apagar = ((LOCAL && LOCAL.apagar) || []).map(function(x, i){
    var vm = ym(x[9]), ant = !!mesRef && vm<mesRef;
    return {id:"a"+i, status:"apagar", filial:x[0], nat:x[1], natNome:x[2], pref:x[3], num:x[4], parc:x[5], forn:x[6], nome:x[7], emissao:x[8], venc:x[9], valorTitulo:x[10], valor:x[11], atraso:x[12], grupo:grupoDe(x[1], x[2]), pessoal:grupoDe(x[1], x[2])===GRUPOS[2], mes:ant ? mesRef : vm, outroMes:ant};
  });
  _cache = pagas.concat(apagar);
  return _cache;
}
var temDados = function(){ return itensEmpresa().length>0; };
var meses = function(){ var o = {}; itensEmpresa().forEach(function(i){ o[i.mes] = 1; }); return Object.keys(o).sort(); };

// filtra por mês, filial ("" = todas), busca (título, natureza, valor) e situação ("" = todas, "pago", "apagar")
function filtrar(mes, filial, busca, status, semPessoal){
  var q = String(busca||"").trim().toLowerCase();
  return itensEmpresa().filter(function(i){
    if(mes && i.mes!==mes) return false;
    if(filial && i.filial!==filial) return false;
    if(status && i.status!==status) return false;
    if(semPessoal && i.pessoal) return false;
    if(q && (i.nome+" "+i.natNome+" "+i.nat+" "+i.pref+" "+i.valor.toFixed(2).replace(".", ",")).toLowerCase().indexOf(q)<0) return false;
    return true;
  });
}
var soma = function(l){ return r2(l.reduce(function(t, i){ return t+i.valor; }, 0)); };
function totais(l){ var p = l.filter(function(i){ return i.status==="pago"; }), a = l.filter(function(i){ return i.status==="apagar"; }); return {pago:soma(p), apagar:soma(a), total:soma(l), nPago:p.length, nApagar:a.length, n:l.length}; }

function porFilial(mes, busca, status, semPessoal){
  return FILIAIS.map(function(f){ var t = totais(filtrar(mes, f[0], busca, status, semPessoal)); return Object.assign({id:f[0], nome:f[1], desc:f[2]}, t); });
}
// grupos → naturezas → itens (cada nível com pago, a pagar e total)
function agrupar(lista){
  var g = {};
  lista.forEach(function(i){ var a = g[i.grupo] = g[i.grupo] || {grupo:i.grupo, nats:{}}; var n = a.nats[i.nat] = a.nats[i.nat] || {cod:i.nat, nome:i.natNome, itens:[]}; n.itens.push(i); });
  return GRUPOS.filter(function(k){ return g[k]; }).map(function(k){
    var nats = Object.keys(g[k].nats).map(function(c){ var n = g[k].nats[c], t = totais(n.itens); return Object.assign({cod:n.cod, nome:n.nome, itens:n.itens.sort(function(a, b){ return (a.status===b.status ? 0 : a.status==="apagar" ? -1 : 1) || (a.venc||"").localeCompare(b.venc||"") || b.valor-a.valor; })}, t); }).sort(function(a, b){ return b.total-a.total; });
    var t = totais(nats.reduce(function(l, x){ return l.concat(x.itens); }, []));
    return Object.assign({grupo:k, nats:nats}, t);
  }).sort(function(a, b){ return b.total-a.total; });
}

// ───────────── Família (Financeiro familiar) e conciliação com o DevMaster ─────────────
// Regra: o que é PESSOAL (pró-labore, casas, viagem, Pix revendedoras) existe nos dois sistemas. Quando a família é somada, o Financeiro familiar vale e o pessoal do DevMaster não entra na soma
// (senão contaria duas vezes). A conciliação mostra o que está nos dois, só no DevMaster e só no familiar, para conferir.
function famTotais(ff, mes){
  var ps = ff ? parcelasDe(ff, mes ? {ym:mes} : {}) : [];
  var pago = r2(ps.reduce(function(t, x){ return t+x.pago; }, 0)), falta = r2(ps.reduce(function(t, x){ return t+x.restante; }, 0)), total = r2(ps.reduce(function(t, x){ return t+x.valor; }, 0));
  return {pago:pago, apagar:falta, total:total, nPago:ps.filter(function(x){ return x.pago>0; }).length, nApagar:ps.filter(function(x){ return x.restante>0.005; }).length, n:ps.length, atrasado:r2(ps.filter(function(x){ return x.atrasada; }).reduce(function(t, x){ return t+x.restante; }, 0))};
}
var PESSOA_PIX = [["marcus", /MARCUS/], ["anamaria", /ANAMARIA/], ["marco", /MARCO ANTONIO/], ["anabeatriz", /ANA BEATRIZ/]];
var palavras = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/).filter(function(w){ return w.length>2; }); };
function conciliar(ff, mes){
  var famTodas = ff ? parcelasDe(ff, {}) : [];
  var fam = famTodas.filter(function(x){ return x.conta.categoria!=="PIX_REVENDEDORA" && x.conta.forma!=="PIX revendedoras"; }).map(function(x){ return {x:x, cents:Math.round(x.valor*100), usado:false}; });
  var dev = itensEmpresa().filter(function(i){ return i.pessoal && !/PIX REVENDEDORAS/i.test(i.natNome); }).sort(function(a, b){ return b.valor-a.valor; });
  var pares = [], soDev = [];
  dev.forEach(function(i){
    var cents = Math.round(i.valor*100), vm = ym(i.venc), ws = palavras(i.nome+" "+i.natNome);
    var cand = fam.filter(function(f){ return !f.usado && f.x.ym===vm && Math.abs(f.cents-cents)<=1; });
    if(!cand.length){ soDev.push(i); return; }
    var melhor = cand.map(function(f){ var wf = palavras(f.x.conta.descricao+" "+(f.x.conta.beneficiario||"")); return {f:f, p:wf.filter(function(w){ return ws.indexOf(w)>=0; }).length}; }).sort(function(a, b){ return b.p-a.p; })[0].f;
    melhor.usado = true; pares.push({dev:i, fam:melhor.x});
  });
  var soFam = fam.filter(function(f){ return !f.usado; }).map(function(f){ return f.x; });
  var noMes = function(m){ return !mes || m===mes; };
  var pix = PESSOA_PIX.map(function(pp){
    var d = itensEmpresa().filter(function(i){ return /PIX REVENDEDORAS/i.test(i.natNome) && pp[1].test(i.natNome) && noMes(i.mes) && !(pp[0]==="marco" && /ANA BEATRIZ|ANAMARIA/.test(i.natNome)); });
    var dp = r2(d.filter(function(i){ return i.status==="pago"; }).reduce(function(t, i){ return t+i.valor; }, 0)), df = r2(d.filter(function(i){ return i.status==="apagar"; }).reduce(function(t, i){ return t+i.valor; }, 0));
    var f = famTodas.filter(function(x){ return (x.conta.categoria==="PIX_REVENDEDORA" || x.conta.forma==="PIX revendedoras") && x.conta.personaId===pp[0] && noMes(x.ym); });
    var p = ff && ff.personas.find(function(q){ return q.id===pp[0]; });
    return {id:pp[0], nome:p ? p.nome : pp[0], devPago:dp, devFalta:df, devMeta:r2(dp+df), famMeta:r2(f.reduce(function(t, x){ return t+x.valor; }, 0)), famPago:r2(f.reduce(function(t, x){ return t+x.pago; }, 0))};
  });
  var fm = function(l, g){ return l.filter(function(x){ var m = g(x); return noMes(m); }); };
  var pa = fm(pares, function(x){ return x.fam.ym; }), sd = fm(soDev, function(x){ return ym(x.venc); }), sf = fm(soFam, function(x){ return x.ym; });
  return {pares:pa, soDev:sd, soFam:sf, pix:pix, valorPares:r2(pa.reduce(function(t, x){ return t+x.dev.valor; }, 0)), valorSoDev:r2(sd.reduce(function(t, x){ return t+x.valor; }, 0)), valorSoFam:r2(sf.reduce(function(t, x){ return t+x.valor; }, 0))};
}

export { famTotais, conciliar, FILIAIS, GRUPOS, itensEmpresa, temDados, meses, filtrar, soma, totais, porFilial, agrupar, grupoDe };

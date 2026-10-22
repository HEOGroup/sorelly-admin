// Sorelly Admin · montagem — domain/pf-limite.js
// LIMITE MENSAL de fornecedores (regra do Marcus, 21/10/2026; texto completo em FLUXO-DE-PAGAMENTOS.md).
// Teto de R$ 300.000 por mês para TODOS os fornecedores somados (Pix + boleto + cheque/cartão), dividido por tipo: Banho 150 mil, Bruto 100 mil, Serviços e produtos 50 mil.
// Cada parcela conta no mês do seu vencimento (para o Pix, o vencimento é o mês de referência da negociação). Sócios, Casa e Mídia ficam FORA do teto.
// Pedido que estoura o teto do mês ou da categoria fica PENDENTE (`aprov:"pendente"`) até quem tem a autorização aprovar; pendente não entra no que está lançado.
// Este arquivo não importa nada de pf.js (pf.js é quem usa estas contas na hora de lançar o pedido).

var CATS = [["banho", "Banho"], ["bruto", "Bruto"], ["serv", "Serviços e produtos"]];
var CLASSES = CATS.concat([["fora", "Fora do teto"]]);
var PADRAO = {teto:300000, cat:{banho:150000, bruto:100000, serv:50000}, classe:{}};
var DIAS_EVITAR = [1, 5, 10, 11, 13, 20, 21, 23, 25];   // dias de contas fixas: evitar boleto e cheque (o dia 20 é o pior)
var PIX = {pix_revendedora:1, pix_empresa:1};
var r2 = function(v){ return Math.round(((+v)||0)*100)/100; };
var p2 = function(n){ return String(n).padStart(2, "0"); };

function limiteDe(pf){ var l = (pf && pf.limite) || {}; return {teto:l.teto>0 ? l.teto : PADRAO.teto, cat:Object.assign({}, PADRAO.cat, l.cat||{}), classe:Object.assign({}, l.classe||{})}; }

// classificação padrão pelo nome (o Marcus ajusta fornecedor a fornecedor no próprio bloco)
function classePadrao(f){
  var n = String((f && f.nome) || "").toLowerCase();
  if((f && f.vinculo==="socio") || /s[óo]cio|casa|facebook|google|m[ií]dia|meta ads/.test(n)) return "fora";
  if(/point|mega ?sul|art ?ello|xangai|linda|tucano|charme|bruto/.test(n)) return "bruto";
  if(/pontual|ellos|galv|banho/.test(n)) return "banho";
  return "serv";
}
function classeForn(pf, f){ var o = ((pf.limite||{}).classe||{})[f && f.id]; return o || classePadrao(f); }

// parcelas de um pedido por mês: {mes: {total, pix, outros}}
function porMesDoPedido(pd){ var o = {}; (pd.parcelas||[]).forEach(function(p){ var m = String(p.venc||"").slice(0, 7); if(!m) return; var x = o[m] = o[m] || {total:0, pix:0, outros:0}; x.total = r2(x.total+p.valor); if(PIX[p.forma]) x.pix = r2(x.pix+p.valor); else x.outros = r2(x.outros+p.valor); }); return o; }

// uso de um mês: lançado (aprovado) e pendente, por categoria
function usoMes(pf, mes, ignorarId){
  var u = {total:0, pix:0, outros:0, cat:{banho:0, bruto:0, serv:0}, fora:0, pend:{total:0, cat:{banho:0, bruto:0, serv:0}}, pedidos:[], pendentes:[], forn:{}};
  (pf.pedidos||[]).forEach(function(pd){
    if(pd.id===ignorarId) return;
    var f = (pf.fornecedores||[]).find(function(x){ return x.id===pd.fornId; }), cl = classeForn(pf, f), x = porMesDoPedido(pd)[mes];
    if(!x || !(x.total>0)) return;
    if(cl==="fora"){ u.fora = r2(u.fora+x.total); return; }
    if(pd.aprov==="pendente"){ u.pend.total = r2(u.pend.total+x.total); u.pend.cat[cl] = r2(u.pend.cat[cl]+x.total); u.pendentes.push({pd:pd, f:f, cl:cl, valor:x.total}); return; }
    var fo = u.forn[pd.fornId] = u.forn[pd.fornId] || {nome:f ? f.nome : "—", cl:cl, total:0}; fo.total = r2(fo.total+x.total);
    u.total = r2(u.total+x.total); u.pix = r2(u.pix+x.pix); u.outros = r2(u.outros+x.outros); u.cat[cl] = r2(u.cat[cl]+x.total);
  });
  return u;
}

// boleto, cheque e cartão que vencem em cada dia do mês (sem os pendentes e sem o que fica fora do teto): {dia: valor}
function vencimentosPorDia(pf, mes){
  var o = {};
  (pf.pedidos||[]).forEach(function(pd){
    if(pd.aprov==="pendente") return;
    var f = (pf.fornecedores||[]).find(function(x){ return x.id===pd.fornId; }); if(classeForn(pf, f)==="fora") return;
    (pd.parcelas||[]).forEach(function(p){ if(PIX[p.forma] || String(p.venc||"").slice(0, 7)!==mes) return; var d = parseInt(p.venc.slice(8, 10), 10); o[d] = r2((o[d]||0)+p.valor); });
  });
  return o;
}

var FORMA_TXT = {boleto:"Boleto", pix_empresa:"Pix empresa", cartao:"Cartão", cheque:"Cheque", pix_revendedora:"Pix revendedora"};
// todas as parcelas que vencem no mês, com fornecedor, tipo e situação (pendente de aprovação e fora do teto vêm marcados): [{iso, dia, valor, forma, pix, nome, cl, numero, pago, pend, fora}]
function vencimentosDoMes(pf, mes){
  var out = [];
  (pf.pedidos||[]).forEach(function(pd){
    var f = (pf.fornecedores||[]).find(function(x){ return x.id===pd.fornId; }), cl = classeForn(pf, f);
    (pd.parcelas||[]).forEach(function(p){ if(String(p.venc||"").slice(0, 7)!==mes) return;
      out.push({iso:p.venc, dia:parseInt(p.venc.slice(8, 10), 10), valor:p.valor, forma:p.forma, formaTxt:FORMA_TXT[p.forma]||p.forma, pix:!!PIX[p.forma], nome:f ? f.nome : "—", cl:cl, numero:pd.numero||"", pago:p.status==="Pago", pend:pd.aprov==="pendente", fora:cl==="fora"}); });
  });
  return out.sort(function(a, b){ return a.iso.localeCompare(b.iso) || b.valor-a.valor; });
}

function semaforo(pct){
  if(pct>100) return {cor:"#EF4444", rot:"Não fecha nada novo", n:4};
  if(pct>90) return {cor:"#F97316", rot:"Só com aprovação", n:3};
  if(pct>80) return {cor:"#EAB308", rot:"Atenção", n:2};
  return {cor:"#22C55E", rot:"Tranquilo", n:1};
}

// o que um pedido novo causaria: lista de {mes, tipo:"teto"|"cat", cat, uso, novo, limite}; vazio = cabe
function impactoPedido(pf, pd){
  var f = (pf.fornecedores||[]).find(function(x){ return x.id===pd.fornId; }), cl = classeForn(pf, f), L = limiteDe(pf), out = [];
  if(cl==="fora") return out;
  var por = porMesDoPedido(pd);
  Object.keys(por).forEach(function(m){ var uso = usoMes(pf, m, pd.id), novo = por[m].total;
    if(uso.total+novo>L.teto+0.005) out.push({mes:m, tipo:"teto", cat:cl, uso:uso.total, novo:novo, limite:L.teto});
    if(uso.cat[cl]+novo>L.cat[cl]+0.005) out.push({mes:m, tipo:"cat", cat:cl, uso:uso.cat[cl], novo:novo, limite:L.cat[cl]}); });
  return out;
}
var brl = function(v){ return (v||0).toLocaleString("pt-BR", {style:"currency", currency:"BRL"}); };
var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
var mesTxt = function(m){ var a = m.split("-"); return MESES[parseInt(a[1], 10)-1]+"/"+a[0]; };
function motivoImpacto(imp){ return imp.map(function(i){ var nome = (CATS.find(function(c){ return c[0]===i.cat; })||[])[1]||""; return (i.tipo==="teto" ? "Teto de "+mesTxt(i.mes) : nome+" em "+mesTxt(i.mes))+": "+brl(i.uso)+" + "+brl(i.novo)+" passa de "+brl(i.limite); }).join(" · "); }

// 5º dia útil do mês (segunda a sexta) e aviso de dia de conta fixa para boleto e cheque
function quintoDiaUtil(mes){ var a = mes.split("-").map(Number), n = 0; for(var d = 1; d<=31; d++){ var dt = new Date(a[0], a[1]-1, d); if(dt.getMonth()!==a[1]-1) break; if(dt.getDay()>0 && dt.getDay()<6){ n++; if(n===5) return d; } } return 0; }
function diaDeContaFixa(iso){ var m = iso.slice(0, 7), d = parseInt(iso.slice(8, 10), 10); return DIAS_EVITAR.indexOf(d)>=0 || d===quintoDiaUtil(m); }
function diasEvitarDoMes(mes){ var l = DIAS_EVITAR.slice(), q = quintoDiaUtil(mes); if(q && l.indexOf(q)<0) l.push(q); return l.sort(function(a, b){ return a-b; }); }

export { vencimentosDoMes, vencimentosPorDia, CATS, CLASSES, PADRAO, DIAS_EVITAR, limiteDe, classePadrao, classeForn, usoMes, semaforo, impactoPedido, motivoImpacto, diaDeContaFixa, diasEvitarDoMes, quintoDiaUtil, mesTxt };

// Sorelly Admin · montagem — domain/metas-setor.js
// Metas mensais com bônus dos setores Cadastro de revendedoras e Inadimplência (20/10/2026, propostas dos setores aprovadas pelo Marcus para implementar).
// A meta MUDA TODO MÊS: cada mês tem a sua (faixas, equipe, fechamento, pagamento). Estado: s.metasSet = {v, meses:{"2026-10":{cadastro, inad}}}.
// Valor pago da faixa = faixa.valor × soma das partes da equipe (Cadastro: valor POR PESSOA e a Helen com parte 0,5; Inadimplência: valor TOTAL dividido, partes 0,5 e 0,5).
// Medido: Cadastro = total de revendedoras ativas (s.revendedorasDiario); Inadimplência = soma do que foi lançado como recebido na conta da Sorelly no mês.
// O bônus do Link de pagamento (Helen) continua em s.lp.config.bonus (Link de pagamento → Análises).
import { completarDias } from "@/apps/montagem/domain/financeiro";

var r2 = function(n){ return Math.round(n*100)/100; };
var NOME_MES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
var rotuloMes = function(ym){ var p = String(ym).split("-"); return NOME_MES[+p[1]-1]+" de "+p[0]; };
var ultimoDiaDe = function(ym){ var p = ym.split("-"); return ym+"-"+String(new Date(+p[0], +p[1], 0).getDate()).padStart(2,"0"); };

function metasPadrao(){
  var F = function(pre, lista){ return lista.map(function(x, i){ return {id:pre+(i+1), alvo:x[0], valor:x[1]}; }); };
  return {v:1, meses:{"2026-10":{
    cadastro:{equipe:[{nome:"Camilly", parte:1}, {nome:"Thali", parte:1}, {nome:"Michelle", parte:1}, {nome:"Helen", parte:0.5}],
      faixas:F("c", [[2085, 300], [2100, 400], [2120, 500], [2135, 650], [2150, 800]]), fechamento:"01/11/2026 às 08:00", pagamento:"12 e 13/11",
      obs:"Meta = total de revendedoras ativas, pelo número exato do fechamento. O valor da faixa é por pessoa (Camilly, Thali e Michelle); a Helen recebe 50%. A primeira faixa exige bipar cerca de 95 a 105 kits até 31/10."},
    inad:{equipe:[{nome:"Amanda M.", parte:0.5}, {nome:"Amanda T.", parte:0.5}],
      faixas:F("i", [[18000, 400], [20000, 550], [22000, 700], [24000, 850], [26000, 1000]]), fechamento:"31/10/2026", pagamento:"",
      obs:"Conta o valor efetivamente recebido na conta da Sorelly dentro do mês. Vale a maior faixa atingida; o bônus é dividido 50% para cada uma. Inclui pagamentos de compras internas de funcionárias.", lanc:[]}}}};
}

function metaDe(s, setor, ym){ var m = ((s.metasSet||{}).meses||{})[ym]; return m && m[setor] ? m[setor] : null; }
function mesesComMeta(s){ return Object.keys((s.metasSet||{}).meses||{}).sort(); }

// valor medido (e, no Cadastro, o de início do mês) para a meta
function medidoDe(s, setor, ym, meta){
  if(setor==="inad") return {medido:r2((meta.lanc||[]).reduce(function(t, x){ return t+(x.valor||0); }, 0)), inicio:0};
  var hist = completarDias(s.revendedorasDiario || {}), ks = Object.keys(hist).sort(), fim = ultimoDiaDe(ym), ini = ym+"-01", atual = null, antes = null;
  ks.forEach(function(k){ if(k<ini) antes = hist[k]; if(k<=fim) atual = hist[k]; });
  if(atual===null && ks.length) atual = hist[ks[0]];
  return {medido:atual||0, inicio:antes!==null ? antes : (atual||0)};
}

// {meta, medido, inicio, faixa (maior batida), prox, falta, total (bônus de hoje), max, porPessoa:[{nome, parte, valor}], faixas:[{...f, total, batida}]}
function resumoMeta(s, setor, ym){
  var meta = metaDe(s, setor, ym); if(!meta) return null;
  var md = medidoDe(s, setor, ym, meta), soma = (meta.equipe||[]).reduce(function(t, p){ return t+(p.parte||0); }, 0);
  var fx = (meta.faixas||[]).slice().sort(function(a, b){ return a.alvo-b.alvo; }).map(function(f){ return Object.assign({}, f, {total:r2(f.valor*soma), batida:md.medido>=f.alvo}); });
  var batidas = fx.filter(function(f){ return f.batida; }), faixa = batidas.length ? batidas[batidas.length-1] : null, prox = fx.find(function(f){ return !f.batida; }) || null;
  return {meta:meta, medido:md.medido, inicio:md.inicio, faixas:fx, faixa:faixa, prox:prox, falta:prox ? r2(prox.alvo-md.medido) : 0, total:faixa ? faixa.total : 0, max:fx.length ? fx[fx.length-1].total : 0,
    porPessoa:(meta.equipe||[]).map(function(p){ return {nome:p.nome, parte:p.parte, valor:faixa ? r2(faixa.valor*p.parte) : 0, max:fx.length ? r2(fx[fx.length-1].valor*p.parte) : 0}; })};
}

// ---------- ações (type "METAS"; a.setor "cadastro" | "inad"; a.ym "AAAA-MM") ----------
function metasReduz(s, a){
  var ms = JSON.parse(JSON.stringify(s.metasSet || metasPadrao())), recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(msg){ return {patch:{metasSet:ms}, msg:msg}; };
  var novoId = function(p){ return p+Date.now().toString(36)+Math.floor(Math.random()*1000).toString(36); };
  ms.meses = ms.meses || {};
  if(a.op==="mes_novo"){
    var ant = Object.keys(ms.meses).filter(function(k){ return k<a.ym; }).sort().pop(); if(!ant) return recusa("Não há meta de um mês anterior para copiar.");
    var cp = JSON.parse(JSON.stringify(ms.meses[ant])); Object.keys(cp).forEach(function(k){ if(cp[k].lanc) cp[k].lanc = []; cp[k].fechamento = ""; cp[k].pagamento = ""; });
    ms.meses[a.ym] = Object.assign({}, cp, ms.meses[a.ym]||{}); return ok("Meta de "+rotuloMes(a.ym)+" criada a partir de "+rotuloMes(ant)+": confira as faixas e o fechamento");
  }
  var meta = metaDe({metasSet:ms}, a.setor, a.ym); if(!meta) return recusa("Não há meta neste mês.");
  switch(a.op){
    case "meta_set": Object.assign(meta, a.patch); return ok();
    case "faixa_set": { var f = meta.faixas.find(function(x){ return x.id===a.id; }); if(!f) return recusa("Faixa não encontrada."); Object.assign(f, a.patch); return ok(); }
    case "faixa_add": { if(!(a.alvo>0)) return recusa("Informe o alvo da faixa."); meta.faixas.push({id:novoId("f-"), alvo:a.alvo, valor:Math.max(0, a.valor||0)}); return ok("Faixa criada"); }
    case "faixa_del": meta.faixas = meta.faixas.filter(function(x){ return x.id!==a.id; }); return ok("Faixa excluída");
    case "equipe_set": { var p = meta.equipe[a.idx]; if(!p) return recusa("Pessoa não encontrada."); Object.assign(p, a.patch); return ok(); }
    case "equipe_add": { var nm = String(a.nome||"").trim(); if(!nm) return recusa("Informe o nome."); meta.equipe.push({nome:nm, parte:a.parte>0 ? a.parte : 1}); return ok(nm+" incluída"); }
    case "equipe_del": meta.equipe.splice(a.idx, 1); return ok("Pessoa removida da meta");
    case "lanc_add": { if(a.setor!=="inad") return recusa("Só a Inadimplência tem lançamento de recebido."); if(!(a.valor>0) || !a.data) return recusa("Informe a data e o valor recebido."); meta.lanc = meta.lanc||[]; meta.lanc.push({id:novoId("l-"), data:a.data, valor:r2(a.valor), obs:String(a.obs||"").trim(), por:a.por||"—", em:Date.now()}); return ok("Recebido lançado"); }
    case "lanc_del": meta.lanc = (meta.lanc||[]).filter(function(x){ return x.id!==a.id; }); return ok("Lançamento excluído");
  }
  return recusa("Ação desconhecida.");
}

export { metasPadrao, metasReduz, metaDe, mesesComMeta, resumoMeta, rotuloMes };

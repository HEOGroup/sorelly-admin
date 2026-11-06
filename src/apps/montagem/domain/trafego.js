import { globLocal } from "@/lib/glob-local";
// Sorelly Admin · montagem — domain/trafego.js
// Marketing › Tráfego pago (pedido do Marcus e do Diego, gestor de tráfego, 05/11/2026). Substitui a planilha do Diego (Base GOOGLE ADS, Base META ADS, Resumo mensal e Investimento).
// Objetivo do Diego: ver quanto se investe, quantos leads chegam, quantas são aprovadas e cadastradas e o custo de cada etapa, por plataforma e junto.
// Estado s.tp (módulo "tp" no servidor, setor Marketing). Nasce VAZIO (repositório é público). Dados reais só em domain/trafego.local.js (gitignored):
//   export default {dias:[...], resumos:[...], criativos:[...]}   (mesmos formatos do estado abaixo)
// Formato de s.tp:
//   {v, seq, config:{taxaMeta}, dias:[{id, data:"2026-10-31", plataforma:"google"|"meta", investimento, impressoes, cliques, leads, aprovadas, cadastradas, obs, por, em}],
//    resumos:[{id, mes:"2026-01", plataforma, investimento, cadastradas}],   // só para mês SEM dias lançados (Jan a Mai do Meta, que o Diego só tem em total)
//    criativos:[{id, nome, mes:"2026-10", plataforma, formato, link, investimento, leads, aprovadas, cadastradas, obs, por, em}]}
// REGRAS (da planilha do Diego):
//  · Investimento digitado é SEM imposto. O Meta cobra imposto (config.taxaMeta, hoje 12,15%): "Meta com imposto" = investimento × (1 + taxa). O Google não tem acréscimo.
//  · Investimento total das plataformas = Google + Meta COM imposto. Custo por cadastrada = investimento ÷ cadastradas.
//  · Mês com dias lançados usa a soma dos dias; mês sem dias usa o total do mês (resumos).
//  · Aprovadas zero com cadastradas maiores que zero = aprovadas NÃO lançadas naquele mês: as contas que dependem de aprovadas ficam vazias ("—"), nunca 0%.
//  · Cadastradas podem passar de aprovadas no mesmo mês (a aprovação e o cadastro acontecem em dias diferentes): a conta mostra o valor como é.
// Suposição a confirmar: leads, aprovadas e cadastradas entram à mão (como na planilha). Depois podem vir sozinhas de Cadastro de revendedoras (origem Google ou Meta) e do Gerenciador de Anúncios.

import { hojeSP, agoraSP } from "./cadastro-leads";

var LOCAL = (function(){ try { var m = globLocal("apps/montagem/domain/trafego.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();

var num = function(v){ var n = Number(v); return isFinite(n) ? n : 0; };
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
var trim = function(v){ return String(v==null ? "" : v).trim(); };
var ehDia = function(v){ return /^\d{4}-\d{2}-\d{2}$/.test(String(v||"")) && !isNaN(Date.parse(v+"T00:00:00Z")); };
var ehMes = function(v){ return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(v||"")); };
var r2 = function(v){ return Math.round(v*100)/100; };
var inteiro = function(v){ return Math.max(0, Math.round(num(v))); };
var dinheiro = function(v){ return Math.max(0, r2(num(v))); };

// ---------- vocabulário ----------
var PLATAFORMAS = [{valor:"google", rotulo:"Google Ads"}, {valor:"meta", rotulo:"Meta Ads"}];
var FORMATOS = [{valor:"VIDEO", rotulo:"Vídeo"}, {valor:"IMAGEM", rotulo:"Imagem"}, {valor:"CARROSSEL", rotulo:"Carrossel"}, {valor:"OUTRO", rotulo:"Outro"}];
var MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
var DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
var rot = function(lista, v){ var x = lista.find(function(i){ return i.valor===v; }); return x ? x.rotulo : String(v||""); };
var rotuloPlataforma = function(v){ return rot(PLATAFORMAS, v); }, rotuloFormato = function(v){ return rot(FORMATOS, v); };
var rotuloMes = function(mes){ return ehMes(mes) ? MESES[+mes.slice(5, 7)-1]+" de "+mes.slice(0, 4) : ""; };   // "2026-10" → "Outubro de 2026"
var diaDaSemana = function(iso){ return ehDia(iso) ? DIAS_SEMANA[new Date(iso+"T12:00:00Z").getUTCDay()] : ""; };
var formatarDia = function(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso||"")); return m ? m[3]+"/"+m[2]+"/"+m[1] : ""; };

var CONFIG_PADRAO = {taxaMeta:12.15, limites:{texto:200, link:500, obs:500}};

// ---------- estado ----------
var novoDia = function(d){
  return {id:d.id, data:d.data, plataforma:d.plataforma, investimento:dinheiro(d.investimento), impressoes:inteiro(d.impressoes), cliques:inteiro(d.cliques), leads:inteiro(d.leads),
    aprovadas:inteiro(d.aprovadas), cadastradas:inteiro(d.cadastradas), obs:trim(d.obs), por:d.por||"", em:d.em||""};
};
// arquivos do criativo (vídeo, imagem, telas do carrossel): só o endereço no Vercel Blob e dados pequenos; o arquivo fica no Blob (06/11/2026)
var ehUrlArquivo = function(u){ return /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/criativos\/[A-Za-z0-9._\-]+$/.test(String(u||"")); };
var arquivosOk = function(l){ return (Array.isArray(l) ? l : []).filter(function(x){ return x && ehUrlArquivo(x.url); }).slice(0, 12).map(function(x){ return {url:x.url, nome:trim(x.nome).slice(0, 200), tipo:x.tipo==="video" ? "video" : "imagem", tamanho:inteiro(x.tamanho)}; }); };
var novoCriativo = function(c){
  return {id:c.id, nome:trim(c.nome), mes:c.mes, plataforma:c.plataforma, formato:c.formato || "OUTRO", link:trim(c.link), investimento:dinheiro(c.investimento), leads:inteiro(c.leads),
    aprovadas:inteiro(c.aprovadas), cadastradas:inteiro(c.cadastradas), obs:trim(c.obs), arquivos:arquivosOk(c.arquivos), por:c.por||"", em:c.em||""};
};
var validaDia = function(d){ return ehDia(d.data) && PLATAFORMAS.some(function(p){ return p.valor===d.plataforma; }); };
function tpDemo(){
  var s = {v:1, seq:0, config:clone(CONFIG_PADRAO), dias:[], resumos:[], criativos:[]};
  if(LOCAL){
    (LOCAL.dias||[]).forEach(function(d){ if(validaDia(d)) s.dias.push(novoDia(Object.assign({}, d, {id:"d"+(++s.seq)}))); });
    (LOCAL.resumos||[]).forEach(function(r){ if(ehMes(r.mes)) s.resumos.push({id:"r"+(++s.seq), mes:r.mes, plataforma:r.plataforma, investimento:dinheiro(r.investimento), cadastradas:inteiro(r.cadastradas)}); });
    (LOCAL.criativos||[]).forEach(function(c){ if(ehMes(c.mes) && trim(c.nome)) s.criativos.push(novoCriativo(Object.assign({}, c, {id:"c"+(++s.seq)}))); });
  }
  return s;
}
// cria vazio (ou com os dados reais locais) ou completa campos novos
function tpMigrar(t){
  if(!t || typeof t!=="object") return tpDemo();
  var out = clone(t);
  out.v = out.v || 1; out.seq = out.seq || 0;
  out.config = Object.assign({}, CONFIG_PADRAO, out.config||{});
  out.dias = Array.isArray(out.dias) ? out.dias : []; out.resumos = Array.isArray(out.resumos) ? out.resumos : []; out.criativos = Array.isArray(out.criativos) ? out.criativos : [];
  return out;
}

// ---------- contas ----------
var ZERO = function(){ return {investimento:0, impressoes:0, cliques:0, leads:0, aprovadas:0, cadastradas:0}; };
var CAMPOS_SOMA = ["investimento", "impressoes", "cliques", "leads", "aprovadas", "cadastradas"];
function somar(lista){ var t = ZERO(); lista.forEach(function(x){ CAMPOS_SOMA.forEach(function(k){ t[k] += num(x[k]); }); }); t.investimento = r2(t.investimento); return t; }
var razao = function(a, b){ return b>0 ? a/b : null; };
// Indicadores a partir dos totais. Devolve null quando a conta não existe (denominador zero ou dado não lançado).
function derivados(t){
  var apr = t.aprovadas>0 || t.cadastradas===0;   // aprovadas não lançadas (zero com cadastradas) não entram nas contas
  var pct = function(a, b){ var r = razao(a, b); return r===null ? null : r*100; };
  return {
    cpm: t.impressoes>0 ? t.investimento/t.impressoes*1000 : null,
    cpc: razao(t.investimento, t.cliques),
    ctr: t.impressoes>0 ? pct(t.cliques, t.impressoes) : null,
    cpl: razao(t.investimento, t.leads),
    cvr: pct(t.leads, t.cliques),
    custoAprov: apr ? razao(t.investimento, t.aprovadas) : null,
    pctAprov: apr ? pct(t.aprovadas, t.leads) : null,
    custoCad: razao(t.investimento, t.cadastradas),
    pctCadAprov: apr ? pct(t.cadastradas, t.aprovadas) : null,
    pctCadLead: pct(t.cadastradas, t.leads)};
}
var comImposto = function(valor, taxa){ return r2(num(valor)*(1+num(taxa)/100)); };

// total de um mês numa plataforma: soma dos dias lançados; sem dias, o total do mês (resumos); sem nada, null
function totalMes(tp, mes, plataforma){
  var dias = tp.dias.filter(function(d){ return d.plataforma===plataforma && d.data.slice(0, 7)===mes; });
  if(dias.length){ var t = somar(dias); t.dias = dias.length; t.fonte = "dias"; return t; }
  var r = tp.resumos.find(function(x){ return x.plataforma===plataforma && x.mes===mes; });
  if(r){ var z = ZERO(); z.investimento = r.investimento; z.cadastradas = r.cadastradas; z.dias = 0; z.fonte = "total"; return z; }
  return null;
}
// meses com algum dado (dias, totais ou criativos), do mais antigo ao mais novo
function mesesDe(tp, incluirCriativos){
  var m = {};
  tp.dias.forEach(function(d){ m[d.data.slice(0, 7)] = 1; }); tp.resumos.forEach(function(r){ m[r.mes] = 1; });
  if(incluirCriativos) tp.criativos.forEach(function(c){ m[c.mes] = 1; });
  return Object.keys(m).sort();
}
// uma linha por mês, com as duas plataformas e o total (aba Investimento)
function linhasInvestimento(tp){
  var taxa = tp.config.taxaMeta;
  return mesesDe(tp).map(function(mes){
    var g = totalMes(tp, mes, "google"), m = totalMes(tp, mes, "meta");
    var gInv = g ? g.investimento : 0, gCad = g ? g.cadastradas : 0, mInv = m ? m.investimento : 0, mCad = m ? m.cadastradas : 0, mInvImp = comImposto(mInv, taxa);
    var inv = r2(gInv+mInvImp), cad = gCad+mCad;
    return {mes:mes, google:g, meta:m, gInv:gInv, gCad:gCad, gCusto:razao(gInv, gCad), mInv:mInv, mCad:mCad, mCusto:razao(mInv, mCad), mInvImp:mInvImp, mCustoImp:razao(mInvImp, mCad),
      totalInv:inv, totalCad:cad, totalCusto:razao(inv, cad)};
  });
}
// totais de uma lista de linhas de investimento
function totalInvestimento(linhas, taxa){
  var t = {gInv:0, gCad:0, mInv:0, mCad:0};
  linhas.forEach(function(l){ t.gInv += l.gInv; t.gCad += l.gCad; t.mInv += l.mInv; t.mCad += l.mCad; });
  t.gInv = r2(t.gInv); t.mInv = r2(t.mInv); t.gCusto = razao(t.gInv, t.gCad); t.mCusto = razao(t.mInv, t.mCad);
  t.mInvImp = comImposto(t.mInv, taxa); t.mCustoImp = razao(t.mInvImp, t.mCad);
  t.totalInv = r2(t.gInv+t.mInvImp); t.totalCad = t.gCad+t.mCad; t.totalCusto = razao(t.totalInv, t.totalCad);
  return t;
}
// uma linha por mês de uma plataforma, com todos os indicadores (aba Mês a mês)
function linhasMensais(tp, plataforma){
  return mesesDe(tp).map(function(mes){ var t = totalMes(tp, mes, plataforma); return t ? Object.assign({mes:mes}, t, derivados(t)) : null; }).filter(Boolean);
}
// total de uma lista de meses de uma plataforma. Mês que só tem o total (fonte "total") entra em investimento e cadastradas; as demais contas usam só os meses com dias lançados.
function totalMensal(linhas){
  var todas = somar(linhas), dias = somar(linhas.filter(function(l){ return l.fonte==="dias"; }));
  var d = derivados(dias); d.custoCad = derivados(todas).custoCad;
  return Object.assign({}, dias, d, {investimento:todas.investimento, cadastradas:todas.cadastradas});
}
// dias lançados de um mês e plataforma, do primeiro ao último, com os indicadores de cada dia
function linhasDiarias(tp, mes, plataforma){
  return tp.dias.filter(function(d){ return d.plataforma===plataforma && d.data.slice(0, 7)===mes; }).sort(function(a, b){ return a.data<b.data ? -1 : 1; })
    .map(function(d){ return Object.assign({}, d, derivados(d), {semana:diaDaSemana(d.data)}); });
}
function totalDe(lista){ var t = somar(lista); return Object.assign(t, derivados(t)); }
// criativos de um período, do que mais trouxe cadastradas ao que menos trouxe (empate: menor custo por cadastrada)
function rankingCriativos(tp, mes, plataforma){
  return tp.criativos.filter(function(c){ return (!mes || c.mes===mes) && (!plataforma || c.plataforma===plataforma); })
    .map(function(c){ return Object.assign({}, c, derivados(c)); })
    .sort(function(a, b){ return b.cadastradas-a.cadastradas || (a.custoCad===null ? 1 : b.custoCad===null ? -1 : a.custoCad-b.custoCad) || (a.nome<b.nome ? -1 : 1); });
}

// ---------- ação TP (reducer) ----------
function tpReduz(s, a){
  var tp = clone(tpMigrar(s.tp)), por = a.por || "—", agora = a.agora || agoraSP(), lim = tp.config.limites;
  var recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(msg){ return {patch:{tp:tp}, msg:msg}; };
  var plataformaOk = function(v){ return PLATAFORMAS.some(function(p){ return p.valor===v; }); };
  var proxId = function(letra){ tp.seq = (tp.seq||0)+1; return letra+tp.seq; };
  var numeros = function(x){
    var campos = {investimento:x.investimento, impressoes:x.impressoes, cliques:x.cliques, leads:x.leads, aprovadas:x.aprovadas, cadastradas:x.cadastradas};
    for(var k in campos){ if(campos[k]!==undefined && campos[k]!=="" && (!isFinite(Number(campos[k])) || Number(campos[k])<0)) return "Os números não podem ser negativos nem ficar em letras."; }
    return null;
  };
  switch(a.op){
    case "dia_set": {
      if(!ehDia(a.data)) return recusa("Data inválida.");
      if(a.data>hojeSP()) return recusa("A data não pode ser no futuro.");
      if(!plataformaOk(a.plataforma)) return recusa("Escolha a plataforma.");
      var e1 = numeros(a); if(e1) return recusa(e1);
      if(trim(a.obs).length>lim.obs) return recusa("A observação passou de "+lim.obs+" letras.");
      var novo = novoDia({id:null, data:a.data, plataforma:a.plataforma, investimento:a.investimento, impressoes:a.impressoes, cliques:a.cliques, leads:a.leads, aprovadas:a.aprovadas, cadastradas:a.cadastradas, obs:a.obs, por:por, em:agora});
      var i = tp.dias.findIndex(function(d){ return d.data===a.data && d.plataforma===a.plataforma; });
      if(i===-1){ novo.id = proxId("d"); tp.dias.push(novo); return ok("Dia lançado"); }
      novo.id = tp.dias[i].id; tp.dias[i] = novo; return ok("Dia atualizado");
    }
    case "dia_del": {
      var j = tp.dias.findIndex(function(d){ return d.data===a.data && d.plataforma===a.plataforma; });
      if(j===-1) return recusa("Dia não encontrado.");
      tp.dias.splice(j, 1); return ok("Dia excluído");
    }
    case "resumo_set": {
      if(!ehMes(a.mes)) return recusa("Mês inválido.");
      if(!plataformaOk(a.plataforma)) return recusa("Escolha a plataforma.");
      var e2 = numeros(a); if(e2) return recusa(e2);
      if(tp.dias.some(function(d){ return d.plataforma===a.plataforma && d.data.slice(0, 7)===a.mes; })) return recusa("Esse mês já tem dias lançados: o total vem da soma dos dias.");
      var k = tp.resumos.findIndex(function(r){ return r.mes===a.mes && r.plataforma===a.plataforma; });
      var res = {id:k===-1 ? proxId("r") : tp.resumos[k].id, mes:a.mes, plataforma:a.plataforma, investimento:dinheiro(a.investimento), cadastradas:inteiro(a.cadastradas)};
      if(k===-1){ tp.resumos.push(res); return ok("Total do mês lançado"); }
      tp.resumos[k] = res; return ok("Total do mês atualizado");
    }
    case "resumo_del": {
      var q = tp.resumos.findIndex(function(r){ return r.mes===a.mes && r.plataforma===a.plataforma; });
      if(q===-1) return recusa("Total do mês não encontrado.");
      tp.resumos.splice(q, 1); return ok("Total do mês excluído");
    }
    case "criativo_set": {
      var nome = trim(a.nome); if(!nome) return recusa("Informe o nome do criativo.");
      if(nome.length>lim.texto) return recusa("O nome passou de "+lim.texto+" letras.");
      if(!ehMes(a.mes)) return recusa("Escolha o mês.");
      if(!plataformaOk(a.plataforma)) return recusa("Escolha a plataforma.");
      if(a.formato && !FORMATOS.some(function(f){ return f.valor===a.formato; })) return recusa("Formato inválido.");
      if(trim(a.link).length>lim.link) return recusa("O link passou de "+lim.link+" letras.");
      if(trim(a.obs).length>lim.obs) return recusa("A observação passou de "+lim.obs+" letras.");
      var e3 = numeros(a); if(e3) return recusa(e3);
      if(Array.isArray(a.arquivos) && a.arquivos.length>12) return recusa("Cada criativo guarda até 12 arquivos.");
      if(Array.isArray(a.arquivos) && a.arquivos.some(function(x){ return !x || !ehUrlArquivo(x.url); })) return recusa("Arquivo inválido: envie de novo.");
      var c = novoCriativo(Object.assign({}, a, {por:por, em:agora}));
      var m = a.id ? tp.criativos.findIndex(function(x){ return x.id===a.id; }) : -1;
      if(a.id && m===-1) return recusa("Criativo não encontrado.");
      if(m===-1){ c.id = proxId("c"); tp.criativos.push(c); return ok("Criativo lançado"); }
      c.id = tp.criativos[m].id; tp.criativos[m] = c; return ok("Criativo atualizado");
    }
    case "criativo_del": {
      var w = tp.criativos.findIndex(function(x){ return x.id===a.id; });
      if(w===-1) return recusa("Criativo não encontrado.");
      tp.criativos.splice(w, 1); return ok("Criativo excluído");
    }
    case "config_set": {
      var t = Number(a.taxaMeta);
      if(a.taxaMeta==="" || a.taxaMeta==null || !isFinite(t) || t<0 || t>100) return recusa("O imposto do Meta deve ficar entre 0 e 100%.");
      tp.config.taxaMeta = r2(t); return ok("Imposto do Meta salvo");
    }
    default: return recusa("Ação desconhecida.");
  }
}

export { PLATAFORMAS, FORMATOS, CONFIG_PADRAO, tpDemo, tpMigrar, tpReduz, derivados, comImposto, totalMes, mesesDe, linhasInvestimento, totalInvestimento, linhasMensais, totalMensal, linhasDiarias, totalDe, rankingCriativos,
  rotuloPlataforma, rotuloFormato, rotuloMes, formatarDia, diaDaSemana, ehMes, ehDia, hojeSP };

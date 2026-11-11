import { globLocal } from "@/lib/glob-local";
// Sorelly Admin · montagem — domain/fotos-catalogo.js
// Marketing › Fotos de catálogo (pedido do Marcus, 10/11/2026). Substitui a planilha "Fotos App Sorelly" (Controle Oficial).
// Objetivo: toda peça NOVA precisa de foto de catálogo (fotografar, editar e subir na DevMaster). Código antigo sem foto fica para trás (decisão do Marcus, 10/11/2026).
// Estado s.fc (módulo "fc" no servidor, setor Marketing). Nasce VAZIO (repositório é público). Dados reais só em domain/fotos-catalogo.local.js (gitignored):
//   export default {categorias:[{cat, total, comFoto, noSistema}], historico:[{dia:"2026-10-31", fotos, editadas, sistema}]}   (histórico e totais da planilha antiga)
// Formato de s.fc:
//   {v, categorias:[...] (legado), historico:[...] (legado),
//    codigos:[{cod, cat, dia:"2026-11-10", fotoEm, fotoQuem, edEm, edQuem, subEm, subQuem, esp, obs, por, em}]}   // datas "2026-11-10T08:42:00" (fuso de São Paulo); campo vazio não é gravado
//   CÓDIGOS DA PLANILHA ANTIGA (17 mil, 10/11/2026): entram TODOS, sem data (dia ausente) e com a etapa marcada "ant" (feita antes do sistema); esp = Aguardando, Diversas ou Repetido (como na planilha).
// REGRAS:
//  · Cada código novo entra com a data do cadastro (dia). Etapas em ordem: Foto → Editada → Na DevMaster. Cada etapa grava QUEM marcou e QUANDO.
//  · Status vem das etapas (nunca é digitado): Sem foto, Fotografada, Editada, Na DevMaster.
//  · Tempos médios saem das datas das etapas (cadastro → foto → edição → DevMaster). Não existe tempo digitado.
//  · A categoria vem do início do código (BB = Brincos Select, CL = Colares...). Início desconhecido = "Outras".

import { agoraSP, hojeSP } from "./cadastro-leads";

var LOCAL = (function(){ try { var m = globLocal("apps/montagem/domain/fotos-catalogo.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();

var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
var trim = function(v){ return String(v==null ? "" : v).trim(); };
var num = function(v){ var n = Number(v); return isFinite(n) ? n : 0; };
var ehDia = function(v){ return /^\d{4}-\d{2}-\d{2}$/.test(String(v||"")); };

// início do código → categoria (nomes da planilha antiga)
var PREFIXOS = [["BBC","Colares Select"],["BBA","Anéis Select"],["BBP","Pulseiras Select"],["BB","Brincos Select"],["COL","Collection"],["AA","Collection AA"],["AP","Anel Prata 925"],["CC","Conjuntos"],["CL","Colares"],["CK","Choker"],["2B","Brinco Duo"],["BT","Bracelete"],["SP","Sorelly Premium"],["PJ","Porta joias"],["PI","Pingentes"],["ES","Religiosos"],["A","Anéis"],["B","Brincos"],["I","Infantil"],["P","Pulseiras"],["T","Tornozeleiras"],["M","Masculino"]];
function categoriaDe(cod){
  var c = String(cod||"").toUpperCase();
  for(var i=0;i<PREFIXOS.length;i++){ var p = PREFIXOS[i][0]; if(c.indexOf(p)===0 && /^\d/.test(c.slice(p.length))) return PREFIXOS[i][1]; }
  return "Outras";
}

var STATUS = ["Sem foto", "Fotografada", "Editada", "Na DevMaster", "Aguardando", "Diversas", "Repetido"];
var ESPECIAIS = ["Aguardando", "Diversas", "Repetido"];
function statusDe(c){ return c.subEm ? "Na DevMaster" : c.edEm ? "Editada" : c.fotoEm ? "Fotografada" : (c.esp || "Sem foto"); }
// linha compacta da planilha antiga: [código, foto, quem fotografou, editada, quem editou, sistema, quem subiu, observação]
function codigoAntigo(r){
  var c = {cod:trim(r[0]).toUpperCase()}; if(!c.cod) return null;
  var fe = trim(r[1]), ee = trim(r[3]), se = trim(r[5]);
  if(fe==="Ok"){ c.fotoEm = "ant"; if(trim(r[2])) c.fotoQuem = trim(r[2]); }
  if(ee==="Ok"){ c.edEm = "ant"; if(trim(r[4])) c.edQuem = trim(r[4]); }
  if(se==="Ok"){ c.subEm = "ant"; if(trim(r[6])) c.subQuem = trim(r[6]); }
  var esp = ESPECIAIS.indexOf(fe)>=0 ? fe : ESPECIAIS.indexOf(se)>=0 ? se : ""; if(esp) c.esp = esp;
  if(trim(r[7])) c.obs = trim(r[7]);
  return c;
}
function semearAntigos(fc){
  var tem = {}; fc.codigos.forEach(function(c){ tem[c.cod] = true; });
  if(LOCAL && Array.isArray(LOCAL.codigos)) LOCAL.codigos.forEach(function(r){ var c = codigoAntigo(r); if(c && !tem[c.cod]){ tem[c.cod] = true; fc.codigos.push(c); } });
  fc.semeado = true; return fc;
}

function fcDemo(){
  var s = {v:1, categorias:[], historico:[], codigos:[]};
  if(LOCAL){
    (LOCAL.categorias||[]).forEach(function(c){ if(trim(c.cat)) s.categorias.push({cat:trim(c.cat), total:num(c.total), comFoto:num(c.comFoto), noSistema:num(c.noSistema)}); });
    (LOCAL.historico||[]).forEach(function(h){ if(ehDia(h.dia)) s.historico.push({dia:h.dia, fotos:num(h.fotos), editadas:num(h.editadas), sistema:num(h.sistema)}); });
  }
  return semearAntigos(s);
}
function fcMigrar(f){
  if(!f || typeof f!=="object") return fcDemo();
  var out = clone(f); out.v = out.v || 1;
  out.categorias = Array.isArray(out.categorias) ? out.categorias : []; out.historico = Array.isArray(out.historico) ? out.historico : []; out.codigos = Array.isArray(out.codigos) ? out.codigos : [];
  if(!out.categorias.length && !out.historico.length && LOCAL){ var d = fcDemo(); out.categorias = d.categorias; out.historico = d.historico; }
  if(!out.semeado) semearAntigos(out);   // traz os códigos da planilha antiga uma vez só
  return out;
}

// ---------- contas ----------
var parteDia = function(iso){ return String(iso||"").slice(0, 10); };
var minutos = function(de, ate){ if(!de || !ate) return null; var a = Date.parse(de), b = Date.parse(ate); if(!isFinite(a) || !isFinite(b) || b<a) return null; return (b-a)/60000; };
var media = function(l){ var v = l.filter(function(x){ return x!=null; }); return v.length ? v.reduce(function(t, x){ return t+x; }, 0)/v.length : null; };
// "2 h 10 min", "35 min", "—"
function duracao(min){ if(min==null) return "—"; var m = Math.round(min); if(m<1) return "menos de 1 min"; if(m<60) return m+" min"; var h = Math.floor(m/60), r = m%60; if(h>=48) return Math.round(h/24)+" dias"; if(h>=24) return "1 dia"+(h-24 ? " e "+(h-24)+" h" : ""); return h+" h"+(r ? " "+r+" min" : ""); }
// etapa feita antes do sistema ("ant") não tem data: a célula fica em branco (o Status já diz a etapa)
var formatarHora = function(iso){ if(iso==="ant" || iso==="dm") return ""; var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(iso||"")); return m ? m[3]+"/"+m[2]+" "+m[4]+":"+m[5] : ""; };
var formatarDia = function(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso||"")); return m ? m[3]+"/"+m[2]+"/"+m[1] : ""; };

// MODELO E GRADE (Marcus, 11/11/2026: "A2357014 é o código inteiro; A2357 é o código, uma foto só para todos"): código com 7 números = modelo (letras + 4 números) + grade (3 números, o tamanho).
// A foto é UMA SÓ por modelo. Por isso a tela trabalha com o MODELO: as grades entram juntas nele, e cada etapa vale a mais adiantada entre o modelo e as grades.
var modeloDe = function(cod){ var m = /^([A-Z]+[0-9]{4})[0-9]{3}$/.exec(cod); return m ? m[1] : cod; };
var melhorEtapa = function(lista, k){   // etapa mais adiantada: a data real mais antiga; senão a marca "dm" ou "ant"
  var com = lista.filter(function(c){ return c[k]; }); if(!com.length) return null;
  var reais = com.filter(function(c){ return ehDia(parteDia(c[k])); }).sort(function(a, b){ return a[k]<b[k] ? -1 : a[k]>b[k] ? 1 : 0; });
  return reais[0] || com[0];
};
var cacheUnidades = typeof WeakMap!=="undefined" ? new WeakMap() : null;
function unidades(fc){
  var cs = fc.codigos || []; if(cacheUnidades){ var h = cacheUnidades.get(cs); if(h) return h; }
  var mapa = {}, ordem = [];
  cs.forEach(function(c){ var m = modeloDe(c.cod), u = mapa[m]; if(!u){ u = mapa[m] = {cod:m, vars:0, base:null, lista:[]}; ordem.push(m); } if(c.cod===m) u.base = c; else u.vars++; u.lista.push(c); });
  var out = ordem.map(function(m){
    var u = mapa[m]; if(!u.vars) return u.base;
    var r = Object.assign({}, u.base || {}, {cod:m, vars:u.vars, grades:u.lista.map(function(c){ return c.cod; }).filter(function(x){ return x!==m; })}), dias = u.lista.map(function(c){ return c.dia; }).filter(Boolean).sort();
    if(dias.length && (!r.dia || dias[0]<r.dia)) r.dia = dias[0];
    [["fotoEm", "fotoQuem"], ["edEm", "edQuem"], ["subEm", "subQuem"]].forEach(function(p){ var x = melhorEtapa(u.lista, p[0]); r[p[0]] = x ? x[p[0]] : ""; r[p[1]] = x ? (x[p[1]] || "") : ""; });
    var dm = u.lista.map(function(c){ return c.dmFoto; }).filter(Boolean).sort(); if(dm.length) r.dmFoto = dm[0];
    if(!r.desc){ var com = u.lista.filter(function(c){ return c.desc; })[0]; if(com) r.desc = com.desc.replace(/\s+[0-9]+$/, ""); }
    var tem = u.lista.filter(function(c){ return c.tem==="sim"; })[0] || u.lista.filter(function(c){ return c.tem; })[0]; if(tem) r.tem = tem.tem; else delete r.tem;
    return r;
  });
  if(cacheUnidades) cacheUnidades.set(cs, out);
  return out;
}

// linhas da planilha (uma por MODELO), mais novos primeiro
function linhasFotos(fc){
  return unidades(fc).map(function(c){
    return {cod:c.cod, grades:c.grades||[], tem:c.tem||"", desc:c.desc||"", cat:c.cat || categoriaDe(c.cod), dia:c.dia||"", diaTxt:c.dia ? formatarDia(c.dia) : "Planilha antiga", fotoEm:formatarHora(c.fotoEm), fotoQuem:c.fotoQuem||"", antigo:!c.dia || c.fotoEm==="ant" || c.edEm==="ant" || c.subEm==="ant", fOk:!!c.fotoEm, eOk:!!c.edEm, sOk:!!c.subEm, esp:c.esp||"", fotoData:formatarHora(c.fotoEm), edData:formatarHora(c.edEm), subData:formatarHora(c.subEm), status:statusDe(c), edEm:formatarHora(c.edEm), edQuem:c.edQuem||"", subEm:formatarHora(c.subEm), subQuem:c.subQuem||"", obs:c.obs||""};
  }).sort(function(a, b){ return a.dia<b.dia ? 1 : a.dia>b.dia ? -1 : 0; });
}
// uma coluna da tabela: dia ("2026-11-10") para a linha de grupo
function resumoDoDia(fc, dia){
  var l = unidades(fc).filter(function(c){ return (c.dia||"")===dia; });
  return {cadastrados:l.length, fotografados:l.filter(function(c){ return c.fotoEm; }).length, editados:l.filter(function(c){ return c.edEm; }).length, naDevmaster:l.filter(function(c){ return c.subEm; }).length};
}
// bloco "Hoje": o que aconteceu no dia (pela data da etapa) e o que ainda falta nos códigos novos
function resumoHoje(fc, hoje){
  var cs = unidades(fc), dia = function(x){ return parteDia(x)===hoje; };
  cs = cs.filter(function(c){ return c.dia; });   // só os códigos NOVOS (os da planilha antiga não têm data)
  var sem = cs.filter(function(c){ return !c.fotoEm; }), semEd = cs.filter(function(c){ return c.fotoEm && !c.edEm; }), semSub = cs.filter(function(c){ return c.edEm && !c.subEm; });
  return {cadastrados:cs.filter(function(c){ return c.dia===hoje; }).length, fotografados:cs.filter(function(c){ return dia(c.fotoEm); }).length, editados:cs.filter(function(c){ return dia(c.edEm); }).length,
    naDevmaster:cs.filter(function(c){ return dia(c.subEm); }).length, semFoto:sem.length, faltaEditar:semEd.length, faltaSubir:semSub.length};
}
// tempos médios entre as etapas; janela = função(iso da etapa) → true/false
function temposMedios(fc, dentro){
  var cs = unidades(fc).filter(function(c){ return c.dia; });
  var f = function(fn){ return duracao(media(cs.map(fn))); };
  var ok = function(c, campo){ return !dentro || dentro(c[campo]); };
  return {
    aFoto:f(function(c){ return ok(c, "fotoEm") ? minutos(c.dia+"T00:00:00", c.fotoEm) : null; }),
    aEdicao:f(function(c){ return ok(c, "edEm") ? minutos(c.fotoEm, c.edEm) : null; }),
    aDevmaster:f(function(c){ return ok(c, "subEm") ? minutos(c.edEm, c.subEm) : null; }),
    total:f(function(c){ return ok(c, "subEm") ? minutos(c.dia+"T00:00:00", c.subEm) : null; })
  };
}
// produção dos últimos dias: dias com o sistema novo contam o que foi marcado; antes disso vale o histórico da planilha antiga
function producaoDias(fc, qtd){
  var mapa = {};
  (fc.historico||[]).forEach(function(h){ mapa[h.dia] = {dia:h.dia, fotos:h.fotos, editadas:h.editadas, sistema:h.sistema, origem:"planilha"}; });
  var por = {};
  unidades(fc).forEach(function(c){
    [["fotoEm","fotos"],["edEm","editadas"],["subEm","sistema"]].forEach(function(p){ var d = parteDia(c[p[0]]); if(!ehDia(d)) return; por[d] = por[d] || {dia:d, fotos:0, editadas:0, sistema:0, origem:"sistema"}; por[d][p[1]]++; });
  });
  Object.keys(por).forEach(function(d){ mapa[d] = por[d]; });
  return Object.keys(mapa).sort().reverse().filter(function(d){ return mapa[d].fotos || mapa[d].editadas || mapa[d].sistema; }).slice(0, qtd||5).map(function(d){ return mapa[d]; });
}
function resumoLegado(fc){
  var l = fc.categorias||[];
  if(!l.length) return null;
  var t = l.reduce(function(a, c){ a.total += c.total; a.comFoto += c.comFoto; a.noSistema += c.noSistema; return a; }, {total:0, comFoto:0, noSistema:0});
  return {linhas:l.slice().sort(function(a, b){ return b.total-a.total; }), total:t};
}

// ---------- relatórios da planilha (Controle Oficial): total, progresso, categorias ----------
function resumoGeral(fc){
  var cs = unidades(fc), r = {total:cs.length, foto:0, ed:0, sub:0, semFoto:0, diversas:0, aguardando:0, repetido:0, novos:0};
  cs.forEach(function(c){ if(c.fotoEm) r.foto++; if(c.edEm) r.ed++; if(c.subEm) r.sub++; if(c.dia) r.novos++;
    var st = statusDe(c); if(st==="Sem foto") r.semFoto++; else if(st==="Diversas") r.diversas++; else if(st==="Aguardando") r.aguardando++; else if(st==="Repetido") r.repetido++; });
  return r;
}
function porCategoria(fc){
  var m = {}; unidades(fc).forEach(function(c){ var k = c.cat || categoriaDe(c.cod); var x = m[k] = m[k] || {cat:k, total:0, foto:0, ed:0, sub:0}; x.total++; if(c.fotoEm) x.foto++; if(c.edEm) x.ed++; if(c.subEm) x.sub++; });
  return Object.keys(m).map(function(k){ return m[k]; }).sort(function(a, b){ return b.total-a.total; });
}
// quadro de etapas: TODOS os códigos (os novos, com data, primeiro; depois os da planilha antiga). Pendentes: mais antigo primeiro. Na DevMaster: mais recente primeiro.
function quadroCodigos(fc){
  var col = {sem:[], foto:[], ed:[], sub:[]};
  unidades(fc).forEach(function(c){
    var desde = c.subEm || c.edEm || c.fotoEm || (c.dia ? c.dia+"T00:00:00" : "");
    var x = {c:c, desde:desde, st:statusDe(c), novo:!!c.dia};
    col[c.subEm ? "sub" : c.edEm ? "ed" : c.fotoEm ? "foto" : "sem"].push(x);
  });
  var ordem = function(dir){ return function(a, b){ if(a.novo!==b.novo) return a.novo ? -1 : 1; if(!a.novo) return 0; return a.desde<b.desde ? -dir : a.desde>b.desde ? dir : 0; }; };
  col.sem.sort(ordem(1)); col.foto.sort(ordem(1)); col.ed.sort(ordem(1)); col.sub.sort(ordem(-1));
  return col;
}
function minutosDesde(iso, agora){ return minutos(iso, agora); }

// ---------- META DE FOTOS (Marcus, 10/11/2026) ----------
// Primeira meta: 500 fotos até sexta-feira (13/11) = bônus de R$ 250,00 para o setor. A próxima meta entra aqui quando o Marcus definir.
// Foto contada = marcada na tela (Foto, com data) OU foto que passou a existir na DevMaster depois do início do sistema (dmFoto, gravado na hora em que a leitura da DevMaster vê a foto).
// dmDesde: foto que a leitura da DevMaster viu ANTES dessa hora não conta (às 09:45 de 11/11 a leitura carimbou 65 fotos de uma vez e não dá para provar que são novas).
var METAS = [{id:"2026-11-13", nome:"Primeira meta", ini:"2026-11-10", fim:"2026-11-13", alvo:500, bonus:250, dmDesde:"2026-11-11T10:30:00"}];
var diasEntre = function(a, b){ return Math.round((Date.parse(b+"T12:00:00Z")-Date.parse(a+"T12:00:00Z"))/86400000); };
var somaDia = function(d, n){ var x = new Date(d+"T12:00:00Z"); x.setUTCDate(x.getUTCDate()+n); return x.toISOString().slice(0, 10); };
// Peças cadastradas desde 01/11/2026 são as do processo novo. A leitura da DevMaster também acha fotos ANTIGAS que ninguém tinha marcado; essas não contam na meta (só contam as peças cadastradas desde essa data).
var INICIO_PECAS = "2026-11-01";
var diaDaFoto = function(c, dmDesde){ var d = parteDia(c.fotoEm); if(ehDia(d)) return d; if(!c.dia || c.dia<INICIO_PECAS || (dmDesde && String(c.dmFoto||"")<dmDesde)) return ""; d = parteDia(c.dmFoto); return ehDia(d) ? d : ""; };
function metaProgresso(fc, m, hoje){
  var por = {}, feitas = 0, dias = [], d;
  unidades(fc).forEach(function(c){ var x = diaDaFoto(c, m.dmDesde); if(x && x>=m.ini && x<=m.fim){ por[x] = (por[x]||0)+1; feitas++; } });
  for(d = m.ini; d<=m.fim; d = somaDia(d, 1)) dias.push(d);
  var acum = 0, linhas = dias.map(function(x){ acum += por[x]||0; return {dia:x, fotos:por[x]||0, acum:acum}; });
  var falta = Math.max(0, m.alvo-feitas), restam = dias.filter(function(x){ return x>=hoje; }).length;
  var situacao = feitas>=m.alvo ? "Batida" : hoje>m.fim ? "Não batida" : "Em andamento";
  return {meta:m, feitas:feitas, falta:falta, pct:Math.min(100, feitas/m.alvo*100), linhas:linhas, restam:restam, porDia:restam ? Math.ceil(falta/restam) : 0, situacao:situacao};
}

// ---------- entrada de códigos (colar do Excel: um por linha ou separados por espaço, vírgula ou ponto e vírgula) ----------
function lerCodigos(texto){
  var out = [], vistos = {}, invalidos = [];
  String(texto||"").toUpperCase().split(/[\s,;]+/).forEach(function(t){
    t = t.trim(); if(!t) return;
    if(!/^[A-Z0-9]{2,12}$/.test(t) || !/\d/.test(t)){ invalidos.push(t); return; }
    if(vistos[t]) return; vistos[t] = true; out.push(t);
  });
  return {validos:out, invalidos:invalidos};
}

// ---------- ação FC (reducer) ----------
var ETAPAS = {foto:["fotoEm","fotoQuem","Fotografada"], ed:["edEm","edQuem","Editada"], sub:["subEm","subQuem","Na DevMaster"]};
function fcReduz(s, a){
  var fc = clone(fcMigrar(s.fc)), por = a.por || "—", agora = a.agora || agoraSP(), hoje = hojeSP();
  var recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(msg){ return {patch:{fc:fc}, msg:msg}; };
  var achar = function(cod){ return fc.codigos.find(function(c){ return c.cod===cod; }); };
  var alvos = function(cod){ return fc.codigos.filter(function(c){ return c.cod===cod || modeloDe(c.cod)===cod; }); };   // o modelo e todas as grades dele
  switch(a.op){
    case "cod_add": {
      var r = lerCodigos(a.texto);
      if(!r.validos.length) return recusa(r.invalidos.length ? "Nenhum código válido. Use letras e números, como BB1620." : "Informe os códigos.");
      if(r.validos.length>500) return recusa("No máximo 500 códigos por vez.");
      var dia = ehDia(a.dia) ? a.dia : hoje; if(dia>hoje) return recusa("A data não pode ser no futuro.");
      var novos = 0, ja = 0;
      r.validos.forEach(function(cod){ if(achar(cod)){ ja++; return; } fc.codigos.push({cod:cod, cat:categoriaDe(cod), dia:dia, fotoEm:"", fotoQuem:"", edEm:"", edQuem:"", subEm:"", subQuem:"", por:por, em:agora}); novos++; });
      if(!novos) return recusa("Esses códigos já estão lançados.");
      return ok(novos+(novos===1 ? " código lançado" : " códigos lançados")+(ja ? " ("+ja+" já existiam)" : "")+(r.invalidos.length ? " ("+r.invalidos.length+" ignorados)" : ""));
    }
    case "etapa": {
      var al = alvos(a.cod); if(!al.length) return recusa("Código não encontrado.");
      var e = ETAPAS[a.etapa]; if(!e) return recusa("Etapa inválida.");
      var mudou = 0, motivo = "Essa etapa já foi marcada.";
      al.forEach(function(c){ if(c[e[0]]) return; if(a.etapa==="ed" && !c.fotoEm){ motivo = "Marque a foto antes de editar."; return; } if(a.etapa==="sub" && !c.edEm){ motivo = "Marque a edição antes de subir na DevMaster."; return; } c[e[0]] = agora; c[e[1]] = por; mudou++; });
      if(!mudou) return recusa(motivo);
      return ok(a.cod+": "+e[2]);
    }
    case "etapa_lote": {
      var lote = lerCodigos(a.texto), e2 = ETAPAS[a.etapa]; if(!e2) return recusa("Etapa inválida.");
      if(!lote.validos.length) return recusa("Informe os códigos.");
      var feitos = 0, naoAchou = 0, fora = 0;
      lote.validos.forEach(function(cod){ var c2 = achar(cod); if(!c2){ naoAchou++; return; } if(c2[e2[0]] || (a.etapa==="ed" && !c2.fotoEm) || (a.etapa==="sub" && !c2.edEm)){ fora++; return; } c2[e2[0]] = agora; c2[e2[1]] = por; feitos++; });
      if(!feitos) return recusa(naoAchou ? "Nenhum código foi encontrado. Lance os códigos primeiro." : "Nenhum código estava pronto para essa etapa (já marcado ou falta a etapa anterior).");
      return ok(feitos+(feitos===1 ? " código marcado" : " códigos marcados")+" como "+e2[2].toLowerCase()+(naoAchou ? " ("+naoAchou+" não encontrados)" : "")+(fora ? " ("+fora+" fora da ordem)" : ""));
    }
    case "tem": {   // peça de meses anteriores: o Marketing marca se TEM a peça (o cadastro separou) ou NÃO TEM (sem estoque); valor vazio tira a marcação (Marcus, 11/11/2026)
      var at = alvos(a.cod); if(!at.length) return recusa("Código não encontrado.");
      at.forEach(function(dt){ if(a.valor==="sim" || a.valor==="nao"){ dt.tem = a.valor; dt.temPor = por; dt.temEm = agora; } else { delete dt.tem; delete dt.temPor; delete dt.temEm; } });
      return ok(a.cod+": "+(a.valor==="sim" ? "tem a peça" : a.valor==="nao" ? "não tem a peça" : "marcação tirada"));
    }
    case "desfazer": {
      var ad = alvos(a.cod); if(!ad.length) return recusa("Código não encontrado.");
      var desfez = 0; ad.forEach(function(d){ var ult = d.subEm ? ETAPAS.sub : d.edEm ? ETAPAS.ed : d.fotoEm ? ETAPAS.foto : null; if(!ult) return; d[ult[0]] = ""; d[ult[1]] = ""; desfez++; });
      if(!desfez) return recusa("Esse código não tem etapa para desfazer.");
      return ok(a.cod+": etapa desfeita");
    }
    case "dm_sync": {   // produtos da DevMaster (tabela dmaaa): código novo entra na lista; foto já subida na DevMaster = Sistema feito ("dm")
      var itens = Array.isArray(a.itens) ? a.itens : [], novos = 0, subiram = 0, mapa = {};
      fc.codigos.forEach(function(c){ mapa[c.cod] = c; });
      itens.forEach(function(it){
        var cod = trim(it.cod).toUpperCase(); if(!/^[A-Z0-9]{2,12}$/.test(cod) || !/[0-9]/.test(cod) || !ehDia(it.dia) || it.dia>hoje) return;
        var c = mapa[cod];
        if(!c){ c = {cod:cod, dia:it.dia, por:"DevMaster"}; fc.codigos.push(c); mapa[cod] = c; novos++; }
        if(!c.dia) c.dia = it.dia;   // código que já estava na planilha antiga mas foi cadastrado na DevMaster nos últimos dias: vale a data da DevMaster (entra em "Cadastradas hoje")
        if(it.desc && !c.desc) c.desc = trim(it.desc).slice(0, 140);   // descrição do produto na DevMaster (aparece na tabela "Cadastradas hoje")
        if(it.foto && !c.subEm){ if(!c.dmFoto) c.dmFoto = agora; if(!c.fotoEm) c.fotoEm = "dm"; if(!c.edEm) c.edEm = "dm"; c.subEm = "dm"; if(c.esp) delete c.esp; subiram++; }   // o Castilho tira a foto, a Ana edita e coloca na DevMaster: o sistema só enxerga quando a foto chega lá (Marcus, 11/11/2026)
      });
      fc.dmEm = agora;
      if(!novos && !subiram) return {patch:{fc:fc}, msg:""};
      return ok((novos ? novos+(novos===1 ? " código novo da DevMaster" : " códigos novos da DevMaster") : "")+(novos && subiram ? " · " : "")+(subiram ? subiram+(subiram===1 ? " foto já está na DevMaster" : " fotos já estão na DevMaster") : ""));
    }
    case "cod_del": {
      var i = fc.codigos.findIndex(function(x){ return x.cod===a.cod; }); if(i===-1) return recusa("Código não encontrado.");
      if(fc.codigos[i].fotoEm) return recusa("Esse código já tem foto. Desfaça as etapas antes de excluir.");
      fc.codigos.splice(i, 1); return ok("Código excluído");
    }
    default: return recusa("Ação desconhecida.");
  }
}

export { modeloDe, unidades, INICIO_PECAS, METAS, metaProgresso, diasEntre, resumoGeral, porCategoria, quadroCodigos, minutosDesde, agoraSP, STATUS, ESPECIAIS, categoriaDe, statusDe, fcDemo, fcMigrar, fcReduz, linhasFotos, resumoDoDia, resumoHoje, temposMedios, producaoDias, resumoLegado, lerCodigos, duracao, formatarDia, formatarHora, hojeSP, parteDia };

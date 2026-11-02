// Sorelly Admin · montagem — pages/AgendamentoRevendedoras.js
// Agendamento › Revendedoras (Marcus, 29/10/2026): TODAS as revendedoras com kit ativo (condicional aberto na DevMaster com devolução prevista até 120 dias à frente,
// emissão sem limite), lidas pelo servidor (/api/agenda-revendedoras, só leitura). Desenho copiado da aba Revendedoras do Atendimento interno
// (calendário, tabela com filtro no título da coluna, barra de ouro, card da revendedora), mas o calendário aqui CONTA ACERTOS por dia, somando todas as representantes.
// Filtrou uma representante, uma revendedora ou uma coluna? O calendário, o resumo e a tabela mostram só quem sobrou.
// CARD da revendedora (clicar na linha): a Ana Maria pode trocar a representante, a data do acerto e anotar. ENQUANTO A DEVMASTER AINDA MANDA, toda alteração
// precisa ser feita ANTES na DevMaster; o card avisa e pede a confirmação. As alterações ficam no módulo "agrev" (um registro por revendedora) e ganham o selo
// "diferente da DevMaster" até a DevMaster ficar igual.
import { CalendarioAcertos } from "@/apps/montagem/components/calendario-acertos";
import { diaEfetivo, redistribuirContagem } from "@/apps/montagem/domain/feriados";
import { MenuFiltro, ordenar, passaFiltro } from "@/apps/montagem/components/filtro-planilha";
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { nomeProprio } from "@/apps/montagem/domain/agendamento";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { diasEntre, fmtDataBR, isoDe, parteData } from "@/apps/montagem/domain/revendedoras-internas";
import { isoDia } from "@/apps/montagem/lib/format";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { use } from "@/apps/montagem/state/context";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { e, useEffect, useMemo, useRef, useState } from "@/shared/react";
import React from "react";

var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var NDIA = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"], NDIA3 = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
var BORDA = "border-[rgba(232,184,75,.22)]";
var BARRA_OURO = {background:"linear-gradient(90deg,#9A6F1E,#E8B84B 48%,#F5E7BE)", color:"#1a1306"};
var BTN_OURO = {background:"linear-gradient(135deg,#F1D58A,#C9962F)"};
var CARD_ESTILO = {background:"radial-gradient(900px 260px at 0% -10%, rgba(241,213,138,.13), transparent 60%), radial-gradient(500px 300px at 100% 110%, rgba(241,213,138,.13), transparent 60%), linear-gradient(150deg,#33260f,#120d06)", border:"1px solid rgba(241,213,138,.30)", boxShadow:"0 20px 60px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.06)"};
var TOPO_ESTILO = {background:"linear-gradient(90deg, rgba(241,213,138,.30), rgba(241,213,138,0))"};
var ROTULO = "text-[11px] font-semibold uppercase tracking-[.07em] text-[#cdbf9f]";
var CAMPO = INPUT+" h-8! w-full text-[13px]! ";
var ALTURA = 372;
var BRL = function(v){ return "R$ "+Number(v||0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); };
var curto = function(nome){ var p = String(nome||"").split(/\s+/).filter(function(w){ return ["da","de","do","dos","das","e"].indexOf(w.toLowerCase())<0; }); return p.slice(0,2).join(" "); };
var dBR = function(iso){ return iso ? fmtDataBR(iso).slice(0,5) : "—"; };
// último caso da revendedora (campo Obs. gerais da condicional na DevMaster): "26/10 Tamara: kit sem mexer…"; na tabela vai cortado, o texto inteiro fica no card e no title
var casoTexto = function(r){ return r.caso ? dBR(r.caso.iso)+" "+(r.caso.quem ? r.caso.quem+": " : "")+r.caso.txt : ""; };
var casoCurto = function(r){ var x = casoTexto(r); return !x ? "—" : x.length>70 ? x.slice(0, 69)+"…" : x; };
var foneBonito = function(cel){ var n = String(cel||"").replace(/\D/g,"").replace(/^55/,""); return n.length===11 ? "("+n.slice(0,2)+") "+n.slice(2,7)+"-"+n.slice(7) : n.length===10 ? "("+n.slice(0,2)+") "+n.slice(2,6)+"-"+n.slice(6) : n; };
var linkZap = function(cel){ var n = String(cel||"").replace(/\D/g,""); return n ? "https://wa.me/"+(n.length<=11 ? "55"+n : n) : ""; };
var segundaDe = function(dt){ var x = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()); x.setDate(x.getDate()-((x.getDay()+6)%7)); return x; };
var somaDia = function(iso, n){ var d = parteData(iso); d.setDate(d.getDate()+n); return isoDe(d); };
var chip = function(txt, cls, title){ return e("span",{className:"inline-flex h-5 items-center whitespace-nowrap rounded-full px-2 text-[11px] font-bold ring-1 "+cls, title:title||null}, txt); };
var CLASSE_TIPO = {"Kit principal":"bg-primary/15 text-primary ring-primary/40", "Kit novo":"bg-violet-500/15 text-violet-300 ring-violet-400/40", "Expositor":"bg-white/10 text-foreground ring-border"};
var CLASSE_ALERTA = "bg-warning/15 text-warning ring-warning/40";

// semanas (segunda a domingo) que cobrem o mês; dia fora do mês = null
function semanasDoMes(ano, mes){
  var p = segundaDe(new Date(ano, mes, 1)), fim = new Date(ano, mes+1, 0), out = [];
  while(p<=fim){ var dias = []; for(var i=0;i<7;i++){ var d = new Date(p.getFullYear(), p.getMonth(), p.getDate()+i); dias.push(d.getMonth()===mes ? d : null); } out.push(dias); p = new Date(p.getFullYear(), p.getMonth(), p.getDate()+7); }
  return out;
}
// quantos acertos por dia (e por representante), só da lista já filtrada
function contar(linhas){
  var porDia = {};
  linhas.forEach(function(r){ var k = diaEfetivo(r.prev), d = porDia[k] || (porDia[k] = {n:0, reps:{}}); d.n++; d.reps[r.representante] = (d.reps[r.representante]||0)+1; });
  return porDia;
}
var calor = function(n, max){ return n<=0 ? null : "rgba(232,184,75,"+(0.10+0.42*(n/Math.max(1, max)))+")"; };
var somaPeriodo = function(porDia, de, ate){ var t = 0; Object.keys(porDia).forEach(function(k){ if(k>=de && k<=ate) t += porDia[k].n; }); return t; };

// Campos que a Ana Maria pode ajustar no card. A DevMaster manda: ela NUNCA sobrescreve o que foi alterado aqui; só é comparada com ele.
// Cada campo alterado guarda: o nosso valor (campos), o valor que a DevMaster tinha na hora (dm) e o histórico. Três situações, comparando o nosso valor (L), o da DevMaster hoje (C) e o da hora da alteração (S):
//   igual      → L = C: a DevMaster já está igual (nada a fazer)
//   diferente  → C = S: só nós mudamos; fica marcado "≠ DevMaster" até alterar lá ou voltar para o da DevMaster
//   dm_mudou   → C ≠ S e C ≠ L: a DevMaster mudou DEPOIS da nossa alteração; a Ana Maria escolhe: usar o da DevMaster ou manter o nosso
var CAMPOS = [
  {k:"nome", rot:"Nome", tipo:"txt"}, {k:"celular", rot:"WhatsApp", tipo:"txt"}, {k:"cidade", rot:"Cidade", tipo:"txt"}, {k:"uf", rot:"UF", tipo:"txt"},
  {k:"representante", rot:"Representante", tipo:"sel"}, {k:"prev", rot:"Data do acerto", tipo:"date"}];
var tem = function(o, k){ return !!o && Object.prototype.hasOwnProperty.call(o, k); };
function aplicar(i, ov){
  var out = Object.assign({}, i, {dm:{}, dif:{}, ov:ov||null, temDif:false}), campos = (ov && ov.campos) || {}, snap = (ov && ov.dm) || {};
  CAMPOS.forEach(function(c){
    var dm = i[c.k] || ""; out.dm[c.k] = dm;
    if(!tem(campos, c.k)) return;
    var local = campos[c.k]; out[c.k] = local;
    out.dif[c.k] = local===dm ? {estado:"igual", local:local, dm:dm} : dm!==snap[c.k] ? {estado:"dm_mudou", local:local, dm:dm, snap:snap[c.k]} : {estado:"diferente", local:local, dm:dm};
  });
  out.temDif = Object.keys(out.dif).some(function(k){ return out.dif[k].estado!=="igual"; });
  return out;
}
var fmtCampo = function(k, v){ return k==="prev" && v ? fmtDataBR(v) : (v || "—"); };
// selo pequeno ao lado do valor na tabela
var seloDif = function(r, k){
  var d = r.dif && r.dif[k]; if(!d || d.estado==="igual") return null;
  return d.estado==="dm_mudou"
    ? e("span",{className:"ml-1.5 rounded-full bg-destructive/20 px-1.5 text-[11px] font-bold text-[#f87171]", title:"A DevMaster mudou para: "+fmtCampo(k, d.dm)+" (o nosso: "+fmtCampo(k, d.local)+"). Abra o card para escolher."}, "DM mudou")
    : e("span",{className:"ml-1.5 rounded-full bg-warning/20 px-1.5 text-[11px] font-bold text-warning", title:"Na DevMaster: "+fmtCampo(k, d.dm)+". Altere lá também ou volte para o da DevMaster."}, "≠ DevMaster");
};

// ── Resumo ao lado do calendário (no lugar da lista do dia): números do dia, da semana e do mês e as representantes do dia
function Resumo(p){
  var iso = p.dia, d = p.porDia[iso] || {n:0, reps:{}}, w = parteData(iso).getDay(), seg = isoDe(segundaDe(parteData(iso))), dom = somaDia(seg, 6);
  var mesIni = iso.slice(0,7)+"-01", mesFim = iso.slice(0,7)+"-31";
  var reps = Object.keys(d.reps).sort(function(a, b){ return d.reps[b]-d.reps[a] || a.localeCompare(b, "pt-BR"); }), max = reps.length ? d.reps[reps[0]] : 1;
  var dd = diasEntre(p.hojeIso, iso);
  var cel = function(rot, val, cor, sub){ return e("div",{className:"flex flex-col items-center justify-center rounded-lg border px-1 py-1.5 "+BORDA, style:{background:"#17171a"}},
    e("span",{className:"text-[11px] font-semibold uppercase tracking-[.05em] text-muted-foreground"}, rot), e("b",{className:"text-[20px] leading-tight tabular-nums "+(cor||"")}, val), sub && e("span",{className:"text-[11px] text-muted-foreground"}, sub)); };
  return e("div",{className:"flex h-full flex-col gap-2 rounded-xl border bg-[#131315] p-2 "+BORDA},
    e("div",{className:"flex flex-wrap items-baseline justify-between gap-2"},
      e("b",{className:"text-[13px]"}, fmtDataBR(iso)+" · "+NDIA[w].toLowerCase()), e("span",{className:"text-[13px] "+(dd<0 ? "text-[#f87171]" : "text-muted-foreground")}, dd<0 ? Math.abs(dd)+" d atrás" : dd===0 ? "hoje" : "daqui a "+dd+" d"),
      p.soDia ? e("button",{type:"button", onClick:p.limpaDia, className:"h-8 rounded-full px-3 text-[13px] font-bold", style:BARRA_OURO}, "Tabela só deste dia ✕") : e("span",{className:"text-[11px] text-muted-foreground"}, "Clique num dia para filtrar a tabela")),
    e("div",{className:"grid grid-cols-4 gap-1.5"}, cel("No dia", d.n, "text-[#E8B84B]"), cel("Na semana", somaPeriodo(p.porDia, seg, dom)), cel("No mês", somaPeriodo(p.porDia, mesIni, mesFim)), cel("Atrasadas", p.atrasadas, p.atrasadas ? "text-[#f87171]" : "", "hoje: "+p.hojeN)),
    e("div",{className:"flex items-center justify-between"}, e("span",{className:ROTULO}, "Acertos do dia por representante"), p.repsSel.length>0 && e("button",{type:"button", onClick:p.limpaReps, className:"text-[11px] text-[#E8B84B]"}, "ver todas")),
    e("div",{className:"min-h-0 flex-1 overflow-y-auto pr-1"},
      reps.length===0 ? e("p",{className:"py-4 text-center text-[13px] text-muted-foreground"}, "Nenhum acerto previsto neste dia"+(p.filtrando ? " com esses filtros." : "."))
      : reps.map(function(k){ var on = p.repsSel.indexOf(k)>=0;
          return e("button",{key:k, type:"button", onClick:function(){ p.alternaRep(k); }, title:"Clique para filtrar só "+k, className:"mb-1 grid w-full grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_28px] items-center gap-2 rounded-md px-2 py-1 text-left text-[13px] hover:bg-white/10 "+(on ? "ring-1 ring-[#E8B84B]" : "")},
            e("span",{className:"truncate "+(on ? "font-bold" : "")}, k), e("i",{className:"block h-2 overflow-hidden rounded bg-[#2a2a30]"}, e("u",{className:"block h-2", style:{width:Math.round(d.reps[k]/max*100)+"%", background:BARRA_OURO.background}})), e("b",{className:"text-right tabular-nums"}, d.reps[k])); })));
}

// ── Colunas da tabela (iguais às da aba do Atendimento interno: filtro ao clicar no título)
var COLUNAS = [
  {k:"seq", t:"Qtd.", tipo:"seq"},
  {k:"nome", t:"Nome", tipo:"txt", v:function(r){ return r.nome; }},
  {k:"zap", t:"WhatsApp", tipo:"txt", v:function(r){ return foneBonito(r.celular); }},
  {k:"cod", t:"Cód.", tipo:"txt", v:function(r){ return r.cod; }},
  {k:"rep", t:"Representante", tipo:"sel", v:function(r){ return r.representante; }},
  {k:"cidade", t:"Cidade", tipo:"txt", v:function(r){ return r.cidade+(r.uf ? " / "+r.uf : ""); }},
  {k:"kits", t:"Kits", tipo:"num", v:function(r){ return r.kits; }},
  {k:"emissao", t:"Data do kit", tipo:"data", v:function(r){ return r.emissao; }},
  {k:"prev", t:"Acerto previsto", tipo:"data", v:function(r){ return r.prev; }},
  {k:"falt", t:"Faltam", tipo:"falt", v:function(r, h){ return diasEntre(h, r.prev); }},
  {k:"caso", t:"Último caso", tipo:"txt", v:function(r){ return casoTexto(r); }},
  {k:"valor", t:"Valor do kit", tipo:"din", v:function(r){ return r.valor; }}];

// texto que aparece na tabela (é ele que entra na lista de valores do filtro)
var exibDe = function(c, r, hoje){ var x = c.v(r, hoje);
  if(c.k==="emissao" || c.k==="prev") return x ? dBR(x) : "—";
  if(c.k==="falt") return x<0 ? "Atrasada "+Math.abs(x)+" d" : x===0 ? "Hoje" : x+" d";
  if(c.k==="valor") return BRL(x);
  if(c.k==="caso") return casoCurto(r);
  return x===undefined || x===null || x==="" ? "—" : String(x); };
function passa(r, fil, hoje){
  return COLUNAS.every(function(c){ var f = fil[c.k]; if(!f || !c.v) return true; return passaFiltro(f, c.tipo, c.v(r, hoje), exibDe(c, r, hoje)); });
}
// valores únicos de uma coluna, na ordem certa, com a quantidade de linhas de cada um
function valoresDaColuna(lista, c, hoje){
  var mapa = {}; lista.forEach(function(r){ var x = c.v(r, hoje), k = exibDe(c, r, hoje), g = mapa[k] || (mapa[k] = {v:k, n:0, b:x}); g.n++; });
  return Object.keys(mapa).map(function(k){ return mapa[k]; }).sort(function(a, b){ var va = a.b===undefined || a.b===null || a.b==="", vb = b.b===undefined || b.b===null || b.b==="";
    if(va || vb) return va && vb ? 0 : va ? 1 : -1; if(typeof a.b==="number" && typeof b.b==="number") return a.b-b.b; return String(a.b).localeCompare(String(b.b), "pt-BR", {numeric:true}); });
}

// texto de cada célula (usado para medir a largura da coluna)
var celTxt = function(c, r, hoje){
  if(c.k==="nome") return r.nome; if(c.k==="zap") return foneBonito(r.celular) || "—"; if(c.k==="cod") return String(r.cod); if(c.k==="rep") return r.representante;
  if(c.k==="cidade") return r.cidade ? r.cidade+(r.uf ? " / "+r.uf : "") : "—"; if(c.k==="kits") return String(r.kits);
  if(c.k==="emissao" || c.k==="prev") return dBR(c.k==="prev" ? r.prev : r.emissao);
  if(c.k==="falt"){ var dd = diasEntre(hoje, r.prev); return dd<0 ? Math.abs(dd)+" d atrasada" : dd===0 ? "hoje" : dd+" d"; }
  if(c.k==="valor") return BRL(r.valor);
  if(c.k==="caso") return casoCurto(r); return ""; };
function largurasDe(lista, hoje){
  var out = {}, cv = typeof document!=="undefined" ? document.createElement("canvas").getContext("2d") : null;
  var mede = function(txt, peso){ if(!cv) return String(txt).length*8; cv.font = peso+" 13px Inter, system-ui, sans-serif"; return cv.measureText(String(txt)).width; };
  COLUNAS.forEach(function(c){
    var tem = c.tipo!=="seq" && c.tipo!=="din", w = mede(c.t, 600)+(tem ? 62 : 20);   // título + seta de ordem + ícone do filtro
    if(c.tipo==="seq") w = Math.max(w, mede(String(lista.length), 400));
    else lista.forEach(function(r){ var x = mede(celTxt(c, r, hoje), c.k==="nome" || c.k==="prev" ? 600 : 400); if(x>w-22) w = x+22; });
    if(lista.some(function(r){ return r.dif && r.dif[c.k] && r.dif[c.k].estado!=="igual"; })) w += 90;   // selo "≠ DevMaster"
    out[c.k] = Math.ceil(w+22); });
  return out;
}
function TabelaRevendedoras(p){
  var linhas = p.linhas, fil = p.fil, setFil = p.setFil, hoje = p.hojeIso, ord = p.ord, setOrd = p.setOrd;
  var pp = useState(null), pop = pp[0], setPop = pp[1];
  var ativo = function(c){ return !!fil[c.k] || (!!ord && ord.k===c.k); };
  var algum = COLUNAS.some(ativo);
  var abrirPop = function(c, ev){ if(pop && pop.col===c.k){ setPop(null); return; } var r = ev.currentTarget.getBoundingClientRect(); setPop({col:c.k, top:Math.max(8, Math.min(r.bottom+4, window.innerHeight-460)), left:Math.max(8, Math.min(r.left-120, window.innerWidth-320))}); };
  var cPop = pop ? COLUNAS.find(function(c){ return c.k===pop.col; }) : null;
  var larg = useMemo(function(){ return largurasDe(p.todasLinhas, hoje); }, [p.todasLinhas, hoje]), soma = COLUNAS.reduce(function(s, c){ return s+larg[c.k]; }, 0);
  var TC = "h-8 whitespace-nowrap border-b border-border px-2.5 text-center text-[13px] ";
  return e("div",{className:"flex flex-col gap-2"},
    e("div",{className:"overflow-x-auto rounded-lg border border-border"},
      e("table",{className:"border-collapse text-[13px]", style:{tableLayout:"fixed", width:soma, minWidth:"100%"}},
        e("colgroup",null, COLUNAS.map(function(c){ return e("col",{key:c.k, style:{width:larg[c.k]}}); })),
        e("thead",null, e("tr",{style:BARRA_OURO}, COLUNAS.map(function(c){ var tem = c.tipo!=="seq" && c.tipo!=="din", on = ativo(c);
          return e("th",{key:c.k, className:"h-8 whitespace-nowrap border-r border-[rgba(0,0,0,.42)] px-2.5 text-center text-[13px] font-semibold last:border-r-0"},
            e("span",{className:"inline-flex items-center justify-center gap-1.5"}, c.t, ord && ord.k===c.k && e("span",{"aria-hidden":true}, ord.dir==="asc" ? "↑" : "↓"),
              tem && e("button",{type:"button", "aria-label":"Filtro de "+c.t, title:"Classificar e filtrar "+c.t, onClick:function(ev){ abrirPop(c, ev); }, className:"inline-grid size-6 place-items-center rounded hover:bg-black/15 "+(on ? "bg-black/20" : "")},
                e("svg",{width:14, height:14, viewBox:"0 0 24 24", fill:on ? "currentColor" : "none", stroke:"currentColor", strokeWidth:2.4, strokeLinecap:"round", strokeLinejoin:"round"}, e("path",{d:"M3 4h18l-7 8.5V20l-4-2v-5.5L3 4z"})))),
              c.tipo==="seq" && algum && e("button",{type:"button", title:"Limpar todos os filtros e a classificação", onClick:function(){ setFil({}); setOrd(null); setPop(null); }, className:"ml-1 text-[11px] font-normal underline"}, "limpar")); }))),
        e("tbody",null, linhas.length===0 ? e("tr",null, e("td",{colSpan:COLUNAS.length, className:"h-8 px-2.5 text-center text-[13px]"}, p.total===0 ? (p.carregando ? "Carregando da DevMaster…" : "Nenhuma revendedora ainda. Clique em Atualizar da DevMaster.") : "Nenhuma revendedora com esses filtros."))
          : linhas.slice(0, p.limite).map(function(r, i){
              var dd = diasEntre(hoje, r.prev), sel = r.prev===p.dia && p.soDia;
              return e("tr",{key:r.cod, onClick:function(){ p.abrir(r.cod); }, title:"Clique para abrir o card de "+r.nome, className:"cursor-pointer hover:bg-white/10 "+(sel ? "bg-primary/10" : "")},
                e("td",{className:TC+"tabular-nums", style:dd<0 ? {boxShadow:"inset 3px 0 #f87171"} : null}, i+1), e("td",{className:TC+"font-semibold", title:r.nome}, r.nome, seloDif(r, "nome")), e("td",{className:TC+"tabular-nums"}, foneBonito(r.celular) || "—", seloDif(r, "celular")), e("td",{className:TC+"tabular-nums"}, r.cod),
                e("td",{className:TC+"text-left", title:r.representante}, r.representante, seloDif(r, "representante")),
                e("td",{className:TC+"text-left"}, r.cidade ? r.cidade+(r.uf ? " / "+r.uf : "") : "—", seloDif(r, "cidade"), seloDif(r, "uf")), e("td",{className:TC+"tabular-nums"}, r.kits),
                e("td",{className:TC+"tabular-nums"}, dBR(r.emissao)), e("td",{className:TC+"font-semibold tabular-nums"}, dBR(r.prev), seloDif(r, "prev")),
                e("td",{className:TC+"tabular-nums "+(dd<0 ? "text-destructive" : "")}, dd<0 ? Math.abs(dd)+" d atrasada" : dd===0 ? "hoje" : dd+" d"), e("td",{className:TC, title:casoTexto(r) || undefined}, casoCurto(r)), e("td",{className:TC+"tabular-nums"}, BRL(r.valor))); })))),
    pop && cPop && e(MenuFiltro,{key:cPop.k, col:cPop, f:fil[cPop.k] || null, top:pop.top, left:pop.left, valores:valoresDaColuna(p.todasLinhas, cPop, hoje), sort:ord && ord.k===cPop.k ? ord.dir : null, onClose:function(){ setPop(null); },
      setF:function(n){ var m = Object.assign({}, fil); if(n) m[cPop.k] = n; else delete m[cPop.k]; setFil(m); },
      setSort:function(dir){ setOrd(dir ? {k:cPop.k, dir:dir} : null); }}),
    linhas.length>p.limite && e("div",{className:"flex items-center justify-center gap-3 text-[13px]"}, "Mostrando "+p.limite+" de "+linhas.length, e(Botao,{onClick:p.maisLinhas}, "Ver mais 200")));
}

// ── Terceiro bloco ao lado do calendário: números da lista (já com os filtros das colunas) e o botão de atualizar
function BlocoNumeros(p){
  var linha = function(rot, v, cor, dica){ return e("div",{key:rot, title:dica||null, className:"flex h-8 items-center justify-between gap-2 border-b border-border px-1 text-[13px] last:border-b-0"}, e("span",{className:"truncate"}, rot), e("b",{className:"whitespace-nowrap tabular-nums "+(cor||"")}, v)); };
  return e("div",{className:"flex h-full flex-col gap-2 rounded-xl border bg-[#131315] p-2 "+BORDA},
    e("div",{className:"flex min-h-0 flex-1 flex-col overflow-y-auto"},
      linha("Revendedoras", p.total.toLocaleString("pt-BR")+(p.filtrando ? " de "+p.todas.toLocaleString("pt-BR") : ""), "text-primary", "Com kit ativo"),
      linha("Acertos hoje", p.hojeN), linha("Próximos 7 dias", p.prox7), linha("Representantes", p.reps),
      linha("Datas a confirmar", p.aConfirmar, p.aConfirmar ? "text-warning" : "", "Datas que mudaram na DevMaster desde a foto e esperam o Marcus dizer quem mudou"),
      linha("Diferentes da DevMaster", p.alteradas, p.alteradas ? "text-warning" : "", "Alteradas aqui e ainda diferentes da DevMaster: altere lá também ou volte para o da DevMaster")),
    e(Botao,{desabilitado:p.carregando, onClick:p.atualizar, title:"Busca de novo na DevMaster (a tela se atualiza sozinha a cada 10 minutos)"}, "Atualizar da DevMaster"),
    (p.msg || p.carregando) && e("span",{className:"truncate text-[13px]", title:p.msg}, p.carregando && !p.msg ? "Carregando da DevMaster…" : p.msg));
}

// ── CARD da revendedora (Marcus, 01/11/2026): compacto e para LER de uma vez. Tudo vem da DevMaster e é só leitura (nome, WhatsApp, representante, cidade);
// a única coisa que se altera aqui é a DATA DO ACERTO. Ordem: quem é → último caso → dados → data do acerto → condicionais → alterações feitas.
// A DevMaster ainda manda: se a data mudar só aqui, fica "≠ DevMaster" até alterar lá; se a DevMaster mudar depois, aparece "DM mudou" e a escolha é da Ana Maria.
function CartaoRevendedora(p){
  var r = p.r, hojeIso = p.hojeIso, eu = p.eu, cPrev = CAMPOS.find(function(c){ return c.k==="prev"; });
  var f1 = useState(r.prev || ""), data = f1[0], setData = f1[1], f2 = useState(""), motivo = f2[0], setMotivo = f2[1];
  var mudou = (data||"")!==(r.prev||""), historico = (r.ov && r.ov.historico) || [], dias = diasEntre(hojeIso, r.prev), d = r.dif.prev, zap = linkZap(r.celular);
  var conds = (r.conds||[]).filter(function(c){ return c.t!=="Expositor"; }).sort(function(a, b){ return (a.e||"").localeCompare(b.e||""); });
  var tot = conds.reduce(function(a, c){ return {p:a.p+(c.p||0), v:a.v+(c.v||0)}; }, {p:0, v:0});
  var salvar = function(){
    if(!mudou) return;
    var agora = new Date().toISOString(), campos = Object.assign({}, (r.ov && r.ov.campos) || {}), dm = Object.assign({}, (r.ov && r.ov.dm) || {});
    if((data||"")===(r.dm.prev||"")){ delete campos.prev; delete dm.prev; } else { campos.prev = data||""; dm.prev = r.dm.prev||""; }   // voltou ao valor da DevMaster: não guarda nada
    p.salvar(r, {campos:campos, dm:dm, historico:[{em:agora, por:eu, campo:cPrev.rot, k:"prev", de:r.prev||"", para:data||"", motivo:motivo}].concat(historico).slice(0, 80)});
  };
  var info = function(rot, v){ return e("div",{className:"min-w-0"}, e("div",{className:ROTULO}, rot), e("div",{className:"truncate text-[13px] text-white", title:String(v)}, v)); };
  var estado = !d || d.estado==="igual" ? e("span",{className:"text-[13px] "+(d ? "text-[#bbf7d0]" : "text-[#cdbf9f]")}, d ? "A DevMaster já está igual." : "Igual à DevMaster. Se mudar aqui, mude lá também.")
    : d.estado==="diferente" ? e("span",{className:"flex flex-wrap items-center gap-x-2 text-[13px] text-warning"}, "Na DevMaster: "+fmtCampo("prev", d.dm)+". Mude lá também.", e("button",{type:"button", onClick:function(){ p.resolver(r, "prev", "dm"); }, className:"font-bold text-[#F1D58A] underline"}, "Usar o da DevMaster"))
    : e("span",{className:"flex flex-wrap items-center gap-x-2 text-[13px] text-[#fca5a5]"}, "A DevMaster mudou para "+fmtCampo("prev", d.dm)+" (o nosso: "+fmtCampo("prev", d.local)+").", e("button",{type:"button", onClick:function(){ p.resolver(r, "prev", "dm"); }, className:"font-bold text-[#F1D58A] underline"}, "Usar o da DevMaster"), e("button",{type:"button", onClick:function(){ p.resolver(r, "prev", "nosso"); }, className:"font-bold text-[#F1D58A] underline"}, "Manter o nosso"));
  var LINHA = "border-b border-[rgba(241,213,138,.16)] ";
  return e("div",{className:"overflow-hidden rounded-2xl text-[#fbf4e4]", style:CARD_ESTILO},
    e("div",{className:"flex items-center gap-2.5 py-2 pl-4 pr-3 "+LINHA, style:TOPO_ESTILO},
      e("b",{className:"min-w-0 truncate text-[15px] text-white"}, r.nome),
      zap && e("a",{href:zap, target:"_blank", rel:"noreferrer", title:"Chamar no WhatsApp", "aria-label":"WhatsApp de "+r.nome, className:"inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-[11px] font-bold text-[#04210f] hover:brightness-110"}, "W"),
      e("span",{className:"size-[6px] shrink-0 rounded-full bg-white"}), e("span",{className:MONO+" text-[13px] font-semibold text-white"}, r.cod),
      e("span",{className:"flex-1"}), e("button",{type:"button", "aria-label":"Fechar", onClick:p.fechar, className:"h-8 shrink-0 rounded-lg px-3 text-[13px] font-semibold text-[#fbf4e4] ring-1 ring-[rgba(241,213,138,.35)] hover:bg-black/30"}, "Fechar ✕")),
    r.caso && e("div",{className:"flex flex-col gap-1.5 border-b border-[rgba(251,191,36,.35)] bg-[rgba(251,191,36,.12)] px-4 py-2.5"},
      e("div",{className:"flex flex-wrap items-center gap-x-2 text-[13px] text-[#fde68a]"}, e("b",null, "Último caso"), e("span",null, "· "+fmtDataBR(r.caso.iso)+(r.caso.quem ? " · "+r.caso.quem : "")+(r.caso.cond ? " · condicional "+r.caso.cond : ""))),
      e("p",{className:"text-[13px] leading-snug text-white"}, r.caso.txt),
      (r.casos||[]).length>0 && e("span",{className:"text-[13px] text-[#F1D58A]"}, "Casos anteriores ("+r.casos.length+")"),
      (r.casos||[]).length>0 && e("div",{className:"flex flex-col pr-1 "+(r.casos.length>8 ? "max-h-72 overflow-y-auto" : "")}, r.casos.map(function(c, i){ return e("div",{key:i, className:"grid grid-cols-[48px_96px_minmax(0,1fr)] gap-2 border-t border-[rgba(251,191,36,.25)] py-1.5 text-[13px]"}, e("span",{className:MONO+" text-[#fde68a]"}, dBR(c.iso)), e("span",{className:"truncate text-[#fde68a]"}, c.quem || "—"), e("span",{className:"text-white"}, c.txt)); }))),
    e("div",{className:"grid grid-cols-2 gap-x-4 gap-y-2 px-4 py-2.5 md:grid-cols-4 "+LINHA},
      info("Representante", r.representante), info("Cidade", r.cidade ? r.cidade+(r.uf ? " / "+r.uf : "") : "—"), info("WhatsApp", foneBonito(r.celular) || "—"), info("Kits · peças · valor", r.kits+" · "+(tot.p || r.pecas)+" · "+BRL(tot.v || r.valor))),
    e("div",{className:"flex flex-col gap-2 px-4 py-3 "+LINHA},
      e("div",{className:"flex flex-wrap items-end gap-3"},
        e("label",{className:"flex flex-col gap-1"}, e("span",{className:ROTULO}, "Data do acerto"), e("input",{type:"date", value:data, "aria-label":"Data do acerto", className:CAMPO+" w-44!", onChange:function(ev){ setData(ev.target.value); }})),
        e("div",{className:"flex flex-col gap-1"}, e("span",{className:ROTULO}, "Faltam"), e("b",{className:"h-8 text-[13px] leading-8 "+(dias<0 ? "text-[#fca5a5]" : "")}, dias<0 ? Math.abs(dias)+" d atrasada" : dias===0 ? "hoje" : dias+" d")),
        e("label",{className:"flex min-w-[200px] flex-1 flex-col gap-1"}, e("span",{className:ROTULO}, "Motivo"), e("input",{value:motivo, placeholder:"Motivo da mudança (opcional)", "aria-label":"Motivo", className:CAMPO, onChange:function(ev){ setMotivo(ev.target.value); }})),
        e("button",{type:"button", disabled:!mudou || p.salvando, onClick:salvar, className:"h-8 rounded-lg px-4 text-[13px] font-bold text-[#17110a] disabled:opacity-50", style:BTN_OURO}, p.salvando ? "Salvando…" : "Salvar data")),
      estado, p.erro && e("span",{className:"text-[13px] text-[#f87171]"}, p.erro)),
    e("div",{className:"px-4 pb-2.5 pt-2 "+LINHA},
      e("span",{className:ROTULO}, "Condicionais ativas"),
      conds.length===0 ? e("p",{className:"mt-1 text-[13px] text-[#cdbf9f]"}, "Sem condicionais para mostrar.")
      : e("table",{className:"mt-0.5 w-full border-collapse text-[13px]"},
          e("thead",null, e("tr",null, ["Condicional","Tipo","Emissão","Previsão","Peças","Valor"].map(function(t, i){ return e("th",{key:t, className:"px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[.06em] text-[#cdbf9f] "+(i<2 ? "text-left" : "text-right")}, t); }))),
          e("tbody",null, conds.map(function(c, i){ return e("tr",{key:(c.n||"")+i, className:"border-t border-[rgba(241,213,138,.16)]"},
            e("td",{className:"px-2 py-1 font-bold "+MONO}, c.n||"—"), e("td",{className:"px-2 py-1"}, chip(c.t==="Reposição / peças do próximo mês" ? "Kit extra" : c.t, CLASSE_TIPO[c.t] || "bg-info/15 text-info ring-info/40")),
            e("td",{className:"px-2 py-1 text-right "+MONO}, c.e ? c.e.slice(8)+"/"+c.e.slice(5,7) : "—"), e("td",{className:"px-2 py-1 text-right "+MONO}, c.d ? c.d.slice(8)+"/"+c.d.slice(5,7) : "—"),
            e("td",{className:"px-2 py-1 text-right "+MONO}, c.p), e("td",{className:"px-2 py-1 text-right "+MONO}, BRL(c.v))); })),
          e("tfoot",null, e("tr",{className:"border-t-2 border-[rgba(241,213,138,.3)] font-bold"}, e("td",{className:"px-2 py-1", colSpan:4}, conds.length+(conds.length===1 ? " condicional ativa" : " condicionais ativas")), e("td",{className:"px-2 py-1 text-right "+MONO}, tot.p), e("td",{className:"px-2 py-1 text-right "+MONO}, BRL(tot.v)))))),
    historico.length>0 && e("div",{className:"flex flex-col gap-1 px-4 pb-3 pt-2"},
      e("div",{className:"flex items-center justify-between"}, e("span",{className:ROTULO}, "Alterações feitas no sistema ("+historico.length+")")),
      e("div",{className:"flex flex-col pr-1 "+(historico.length>8 ? "max-h-72 overflow-y-auto" : "")}, historico.map(function(h, i){
        return e("div",{key:i, className:"grid grid-cols-[48px_minmax(0,1fr)] gap-2 border-t border-[rgba(241,213,138,.16)] py-1.5 first:border-t-0"},
          e("div",{className:MONO+" text-[13px] text-[#cdbf9f]"}, h.em.slice(8,10)+"/"+h.em.slice(5,7)),
          e("div",{className:"min-w-0 text-[13px]"}, e("b",null, h.por), " · ", e("span",{className:"text-[#cdbf9f]"}, h.campo), h.campo==="Observação" || h.k==="resolvido" ? e("span",{className:h.k==="resolvido" ? "text-[#bbf7d0]" : ""}, " "+h.para) : e("span",null, " "+fmtCampo(h.k, h.de)+" → ", e("b",{className:"text-[#bbf7d0]"}, fmtCampo(h.k, h.para))), h.motivo && e("span",{className:"text-[#cdbf9f]"}, " · Motivo: "+h.motivo))); }))));
}

// ── Datas mudadas (Marcus, 01/11/2026): a DevMaster só guarda a data de hoje, então o sistema guarda uma FOTO das datas (módulo agrev, chave "foto") e compara a cada leitura.
// Data diferente da foto = linha em "Datas mudadas", pendente até o Marcus confirmar QUEM mudou: ele (sai do previsto do mês de origem) ou o setor (Letícia de Sá ou Ana Maria: fica no previsto).
// Marcou "Marcus" com mês de origem diferente do destino: grava a remarcação no Agendamento (remarc_plano, planoId = id da mudança), então o previsto vigente recalcula na hora. Desfazer remove a remarcação.
var SETOR_QUEM = ["Letícia de Sá", "Ana Maria"];
var mesDe = function(iso){ return String(iso||"").slice(0, 7); };
var tipoPorDias = function(dias){ return dias>=50 ? "p60" : dias>=30 ? "p45" : "outro"; };
function DatasMudadas(p){
  var lista = p.lista, sou = p.souMarcus, ver = useState(false), todas = ver[0], setTodas = ver[1];
  var pend = lista.filter(function(m){ return !m.quem; }), feitas = lista.filter(function(m){ return !!m.quem; });
  var linhas = (pend.concat(feitas)).slice(0, todas ? 400 : 8);
  var BTN = "h-8 rounded-lg px-3 text-[13px] font-bold ring-1 ring-[rgba(241,213,138,.35)] hover:bg-white/10";
  var linha = function(m){
    var dias = diasEntre(m.de, m.para), sai = mesDe(m.de)!==mesDe(m.para), cor = dias<0 ? "text-[#fbf4e4]" : "text-[#F1D58A]";
    var estado = !m.quem ? chip("A confirmar", CLASSE_ALERTA)
      : m.quem==="marcus" ? chip(sai ? "Marcus · sai do previsto" : "Marcus · mesmo mês", "bg-primary/15 text-primary ring-primary/40")
      : chip(m.setor+" · fica no previsto", "bg-success/15 text-success ring-success/40");
    return e("div",{key:m.id, className:"grid items-center gap-2 border-t px-3 py-1.5 first:border-t-0 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_150px_minmax(0,1.3fr)] "+BORDA},
      e("div",{className:"min-w-0"}, e("b",{className:"block truncate text-[13px] text-white", title:nomeProprio(m.nome)}, nomeProprio(m.nome)), e("span",{className:ROTULO+" block truncate", title:nomeProprio(m.rep)}, m.cod+" · "+curto(nomeProprio(m.rep)))),
      e("div",{className:"flex flex-wrap items-center gap-2 text-[13px]"}, estado),
      e("div",{className:MONO+" text-[13px] "+cor}, dBR(m.de)+" → "+dBR(m.para)+" · "+(dias>0 ? "+" : "")+dias+" d"+(sai ? " · "+MESES[Number(mesDe(m.de).slice(5))-1].slice(0,3)+" → "+MESES[Number(mesDe(m.para).slice(5))-1].slice(0,3) : "")),
      e("div",{className:"flex flex-wrap items-center justify-end gap-1.5"},
        !m.quem
          ? (sou ? [e("button",{key:"m", type:"button", onClick:function(){ p.marcar(m, "marcus", ""); }, className:BTN+" text-[#F1D58A]"}, "Foi eu"), SETOR_QUEM.map(function(n){ return e("button",{key:n, type:"button", onClick:function(){ p.marcar(m, "setor", n); }, className:BTN+" text-[#fbf4e4]"}, n); })]
                  : e("span",{className:"text-[13px] text-[#fbf4e4]"}, "Só o Marcus confirma"))
          : (sou && e("button",{type:"button", onClick:function(){ p.desfazer(m); }, className:BTN+" text-[#fbf4e4]"}, "Desfazer"))));
  };
  return e("div",{className:"overflow-hidden rounded-xl border bg-[#131315] "+BORDA},
    e("div",{className:"flex flex-wrap items-center gap-3 px-3 py-2", style:BARRA_OURO},
      e("b",{className:"text-[13px]"}, "Datas mudadas"), e("span",{className:"text-[13px]"}, pend.length ? pend.length+" a confirmar" : "Nada a confirmar"),
      e("span",{className:"flex-1"}), e("span",{className:"text-[11px] font-semibold uppercase tracking-[.07em]"}, "Foto de "+(p.fotoEm ? fmtDataBR(p.fotoEm.slice(0, 10)) : "hoje"))),
    lista.length===0 ? e("p",{className:"px-3 py-3 text-[13px] text-[#fbf4e4]"}, p.temFoto ? "Nenhuma data mudou desde a foto." : "A primeira foto das datas será tirada na próxima leitura da DevMaster.")
    : e("div",null, linhas.map(linha), lista.length>8 && e("button",{type:"button", onClick:function(){ setTodas(!todas); }, className:"h-8 w-full border-t text-[13px] font-semibold text-[#F1D58A] "+BORDA}, todas ? "Ver menos" : "Ver todas ("+lista.length+")")));
}

function AbaAgRevendedoras(){
  var cx = use(), hojeIso = isoDia(new Date()), eu = nomeDe(cx.state.usuario);
  var ds = useState(null), dados = ds[0], setDados = ds[1], cs = useState(false), carregando = cs[0], setCarregando = cs[1], ms = useState(""), msg = ms[0], setMsg = ms[1];
  var as = useState({}), alt = as[0], setAlt = as[1];   // alterações da Ana Maria (módulo agrev): cod → registro
  var fotoS = useState(null), foto = fotoS[0], setFoto = fotoS[1], mudS = useState({}), mudMap = mudS[0], setMudMap = mudS[1];   // foto das datas e datas mudadas (módulo agrev: chaves "foto" e "d_...")
  // compara as datas da DevMaster com a foto: data diferente vira "data mudada" pendente; sem foto, tira a primeira (base do mês). Leitura parcial (menos de 80% da foto) não mexe em nada.
  var detectar = function(d, c){
    var itensD = d.itens || [], base = c.foto && c.foto.datas ? c.foto.datas : null; if(itensD.length<500) return;
    var agora = new Date().toISOString(), novos = {}, datas = Object.assign({}, base || {}), mudouFoto = !base;
    if(base && itensD.length<Object.keys(base).length*0.8) return;
    itensD.forEach(function(i){
      var cod = String(i.cod), antes = base ? base[cod] : undefined;
      if(antes===undefined){ if(datas[cod]!==i.prev){ datas[cod] = i.prev; mudouFoto = true; } return; }
      if(antes!==i.prev){ var id = "d_"+cod+"_"+antes+"_"+i.prev; if(!c[id]) novos[id] = {id:id, cod:i.cod, nome:i.nome, rep:i.representante, de:antes, para:i.prev, detectadoEm:agora, quem:null}; datas[cod] = i.prev; mudouFoto = true; } });
    if(!mudouFoto && !Object.keys(novos).length) return;
    var fotoNova = {em:(c.foto && c.foto.em) || agora, atualizadoEm:agora, datas:datas}, chaves = Object.assign({}, novos, {foto:fotoNova});
    chamar("PUT", "/estado/agrev", {chaves:chaves}).then(function(){ setFoto(fotoNova); setMudMap(function(m){ return Object.assign({}, m, novos); }); }).catch(function(x){ setMsg(x.message); });
  };
  var carregar = function(forcar){
    if(!apiAtiva()){ setMsg("Precisa do servidor ligado (veja com o Leonardo)."); return; }
    setCarregando(true); setMsg(forcar ? "Buscando na DevMaster…" : "");
    Promise.all([chamar("GET", "/agenda-revendedoras"+(forcar ? "?atualizar=1" : "")), chamar("GET", "/estado/agrev").catch(function(){ return {conteudo:{}}; })]).then(function(v){
      setDados(v[0]); var o = {}, md = {}, c = (v[1] && v[1].conteudo) || {}; Object.keys(c).forEach(function(k){ if(k.indexOf("r_")===0 && c[k] && c[k].cod) o[c[k].cod] = c[k]; else if(k.indexOf("d_")===0 && c[k] && c[k].id) md[k] = c[k]; }); setAlt(o); setFoto(c.foto || null); setMudMap(md); detectar(v[0], c);
      setMsg(forcar ? "Atualizado: "+v[0].total+" revendedoras" : "");
    }).catch(function(x){ setMsg(x.message); }).finally(function(){ setCarregando(false); });
  };
  var refCar = useRef(null); refCar.current = carregar;
  useEffect(function(){ refCar.current(false); var t = setInterval(function(){ refCar.current(false); }, 600000); return function(){ clearInterval(t); }; }, []);
  var itens = dados ? dados.itens.map(function(i){ return aplicar(Object.assign({}, i, {nome:nomeProprio(i.nome), representante:nomeProprio(i.representante)}), alt[i.cod]); }) : [];
  var fs = useState({}), fil = fs[0], setFil = fs[1], od = useState(null), ord = od[0], setOrd = od[1], ls = useState(200), limite = ls[0], setLimite = ls[1], sd = useState(false), soDia = sd[0], setSoDia = sd[1];
  var md = useState("sistema"), modo = md[0], setModo = md[1], h0 = parteData(hojeIso), m1 = useState([h0.getFullYear(), h0.getMonth()]), mes = m1[0], setMes = m1[1], d1 = useState(hojeIso), dia = d1[0], setDia = d1[1];
  var ab = useState(null), aberto = ab[0], setAberto = ab[1], sv = useState(false), salvando = sv[0], setSalvando = sv[1], er = useState(""), erro = er[0], setErro = er[1];
  useEffect(function(){ if(!aberto) return undefined; var f = function(ev){ if(ev.key==="Escape") setAberto(null); }; window.addEventListener("keydown", f); return function(){ window.removeEventListener("keydown", f); }; }, [aberto]);
  // representantes (com a quantidade de revendedoras de cada uma), já com as trocas feitas aqui
  var contaReps = {}; itens.forEach(function(r){ contaReps[r.representante] = (contaReps[r.representante]||0)+1; });
  var reps = Object.keys(contaReps).sort(function(a, b){ return a.localeCompare(b, "pt-BR"); }).map(function(n){ return {nome:n, n:contaReps[n]}; });
  var nomesReps = reps.map(function(r){ return r.nome; });
  var repsSel = fil.rep && fil.rep.vals ? fil.rep.vals : [];
  var linhasSemDia = itens.filter(function(r){ return passa(r, fil, hojeIso); });
  var linhasCal = modo==="agendado" ? linhasSemDia.filter(function(r){ return !!r.agenda; }) : linhasSemDia;   // Sistema = todos pela data da DevMaster; Agendado = só quem já tem agendamento na DevMaster
  var orig = {}; linhasCal.forEach(function(r){ if(r.prev) orig[r.prev] = (orig[r.prev] || 0)+1; }); var red = redistribuirContagem(orig);   // acerto de domingo ou feriado passa para o próximo dia útil
  var porDia = contar(linhasCal), filtrando = linhasSemDia.length!==itens.length;
  var linhas0 = soDia ? linhasCal.filter(function(r){ return diaEfetivo(r.prev)===dia; }) : linhasSemDia, colOrd = ord ? COLUNAS.find(function(c){ return c.k===ord.k; }) : null, linhas = colOrd ? ordenar(linhas0, colOrd, ord.dir, hojeIso) : linhas0;
  var atrasadas = linhasCal.filter(function(r){ return r.prev<hojeIso; }).length;
  var prox7 = linhasCal.filter(function(r){ return r.prev>=hojeIso && r.prev<=somaDia(hojeIso, 7); }).length, hojeN = (porDia[hojeIso] ? porDia[hojeIso].n : 0), alteradas = itens.filter(function(r){ return r.temDif; }).length;
  var escolherDia = function(iso){ if(soDia && iso===dia){ setSoDia(false); return; } setDia(iso); setSoDia(true); setLimite(200); var t = parteData(iso); setMes([t.getFullYear(), t.getMonth()]); };
  var alternaRep = function(k){ var n = Object.assign({}, fil); if(repsSel.indexOf(k)>=0) delete n.rep; else n.rep = {op:"", v:"", vals:[k]}; setFil(n); };
  var rSel = aberto ? itens.find(function(r){ return r.cod===aberto; }) : null;
  var gravar = function(r, patch){
    setSalvando(true); setErro("");
    var reg = {cod:r.cod, campos:patch.campos, dm:patch.dm, historico:patch.historico, em:new Date().toISOString(), por:eu};
    return chamar("PUT", "/estado/agrev", {chaves:{["r_"+r.cod]:reg}}).then(function(){ var n = Object.assign({}, alt); n[r.cod] = reg; setAlt(n); }).catch(function(x){ setErro(x.message); }).finally(function(){ setSalvando(false); });
  };
  // a Ana Maria resolve um campo diferente: usa o da DevMaster (o nosso sai) ou mantém o nosso (passa a valer contra a DevMaster de hoje)
  var resolver = function(r, k, acao){
    var campos = Object.assign({}, (r.ov && r.ov.campos) || {}), dm = Object.assign({}, (r.ov && r.ov.dm) || {}), d = r.dif[k], rot = CAMPOS.find(function(c){ return c.k===k; }).rot, texto;
    if(acao==="dm"){ delete campos[k]; delete dm[k]; texto = "Voltou para o da DevMaster: "+fmtCampo(k, d.dm); }
    else { dm[k] = d.dm; texto = "Mantido o nosso ("+fmtCampo(k, d.local)+") apesar de a DevMaster estar em "+fmtCampo(k, d.dm); }
    gravar(r, {campos:campos, dm:dm, historico:[{em:new Date().toISOString(), por:eu, campo:rot, k:"resolvido", de:"", para:texto, motivo:""}].concat((r.ov && r.ov.historico) || []).slice(0, 80)});
  };
  var souMarcus = String(eu||"").indexOf("Marcus")===0, listaMud = Object.keys(mudMap).map(function(k){ return mudMap[k]; }).sort(function(a, b){ return (b.detectadoEm||"").localeCompare(a.detectadoEm||""); }), nAConf = listaMud.filter(function(m){ return !m.quem; }).length;
  var gravarMud = function(m, patch){ var nova = Object.assign({}, m, patch); return chamar("PUT", "/estado/agrev", {chaves:{[m.id]:nova}}).then(function(){ setMudMap(function(x){ var n = Object.assign({}, x); n[m.id] = nova; return n; }); }).catch(function(x){ setMsg(x.message); }); };
  var marcarMud = function(m, quem, setor){
    gravarMud(m, {quem:quem, setor:setor || "", confirmadoEm:new Date().toISOString(), confirmadoPor:eu}).then(function(){
      if(quem==="marcus" && mesDe(m.de)!==mesDe(m.para)) cx.dispatch({type:"AG", op:"remarc_plano", por:eu, itens:[{planoId:m.id, nome:m.nome, tipo:tipoPorDias(diasEntre(m.de, m.para)), autorizadoPor:"Marcus", origem:mesDe(m.de), destino:mesDe(m.para)}]});
      else if(quem==="setor") cx.dispatch({type:"AG", op:"remarc_plano_del", por:eu, ids:[m.id]}); });
  };
  var desfazerMud = function(m){ gravarMud(m, {quem:null, setor:"", confirmadoEm:null, confirmadoPor:null}).then(function(){ cx.dispatch({type:"AG", op:"remarc_plano_del", por:eu, ids:[m.id]}); }); };
  return e(React.Fragment,null,
    e("div",{className:"grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,.8fr)]", style:{minHeight:ALTURA}},
      e("div",{style:{height:ALTURA}}, e(CalendarioAcertos,{ano:mes[0], mes:mes[1], valor:function(i){ return {n:porDia[i] ? porDia[i].n : 0, sai:red.saiu[i], entra:red.entra[i]}; }, dia:dia, onDia:escolherDia, hojeIso:hojeIso, modo:modo, setModo:setModo, onMes:function(a, m){ setMes([a, m]); }})),
      e("div",{className:"overflow-hidden", style:{height:ALTURA}}, e(Resumo,{porDia:porDia, dia:dia, hojeIso:hojeIso, repsSel:repsSel, alternaRep:alternaRep, limpaReps:function(){ var n = Object.assign({}, fil); delete n.rep; setFil(n); }, filtrando:filtrando, soDia:soDia, limpaDia:function(){ setSoDia(false); }, atrasadas:atrasadas, hojeN:hojeN})),
      e("div",{style:{height:ALTURA}}, e(BlocoNumeros,{total:linhasSemDia.length, todas:itens.length, filtrando:filtrando, hojeN:hojeN, prox7:prox7, reps:reps.length, aConfirmar:nAConf, alteradas:alteradas, carregando:carregando, msg:msg, atualizar:function(){ carregar(true); }}))),
    listaMud.length>0 && e(DatasMudadas,{lista:listaMud, souMarcus:souMarcus, marcar:marcarMud, desfazer:desfazerMud, fotoEm:foto && foto.em, temFoto:!!foto}),
    e(TabelaRevendedoras,{linhas:linhas, total:itens.length, carregando:carregando, fil:fil, setFil:setFil, ord:ord, setOrd:setOrd, todasLinhas:itens, hojeIso:hojeIso, todasReps:nomesReps, dia:dia, soDia:soDia, abrir:setAberto, limite:limite, maisLinhas:function(){ setLimite(limite+200); }}),
    rSel && e("div",{className:"fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/65 p-3 md:p-6", role:"dialog", "aria-modal":"true", onMouseDown:function(ev){ if(ev.target===ev.currentTarget) setAberto(null); }},
      e("div",{className:"relative my-auto w-full max-w-[900px]"},
        e(CartaoRevendedora,{fechar:function(){ setAberto(null); }, key:rSel.cod+"|"+(rSel.ov ? rSel.ov.em : ""), r:rSel, todasReps:nomesReps, hojeIso:hojeIso, eu:eu, salvar:gravar, resolver:resolver, salvando:salvando, erro:erro}))));
}

export { AbaAgRevendedoras, CARD_ESTILO, TOPO_ESTILO, BTN_OURO, ROTULO };

// Sorelly Admin · montagem — pages/AgendamentoRevendedoras.js
// Agendamento › Revendedoras (Marcus, 29/10/2026): TODAS as revendedoras com kit ativo (condicional aberto na DevMaster com devolução prevista até 120 dias à frente,
// emissão sem limite), lidas pelo servidor (/api/agenda-revendedoras, só leitura). Desenho copiado da aba Revendedoras do Atendimento interno
// (calendário, tabela com filtro no título da coluna, barra de ouro, card da revendedora), mas o calendário aqui CONTA ACERTOS por dia, somando todas as representantes.
// Filtrou uma representante, uma revendedora ou uma coluna? O calendário, o resumo e a tabela mostram só quem sobrou.
// CARD da revendedora (clicar na linha): a Ana Maria pode trocar a representante, a data do acerto e anotar. ENQUANTO A DEVMASTER AINDA MANDA, toda alteração
// precisa ser feita ANTES na DevMaster; o card avisa e pede a confirmação. As alterações ficam no módulo "agrev" (um registro por revendedora) e ganham o selo
// "diferente da DevMaster" até a DevMaster ficar igual.
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { diasEntre, fmtDataBR, isoDe, parteData } from "@/apps/montagem/domain/revendedoras-internas";
import { isoDia } from "@/apps/montagem/lib/format";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { use } from "@/apps/montagem/state/context";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useEffect, useRef, useState } from "@/shared/react";
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
var ALTURA = 340;
var BRL = function(v){ return "R$ "+Number(v||0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); };
var curto = function(nome){ var p = String(nome||"").split(/\s+/).filter(function(w){ return ["da","de","do","dos","das","e"].indexOf(w.toLowerCase())<0; }); return p.slice(0,2).join(" "); };
var dBR = function(iso){ return iso ? fmtDataBR(iso).slice(0,5) : "—"; };
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
  linhas.forEach(function(r){ var d = porDia[r.prev] || (porDia[r.prev] = {n:0, reps:{}}); d.n++; d.reps[r.representante] = (d.reps[r.representante]||0)+1; });
  return porDia;
}
var calor = function(n, max){ return n<=0 ? null : "rgba(232,184,75,"+(0.10+0.42*(n/Math.max(1, max)))+")"; };
var somaPeriodo = function(porDia, de, ate){ var t = 0; Object.keys(porDia).forEach(function(k){ if(k>=de && k<=ate) t += porDia[k].n; }); return t; };

// o registro guardado no servidor muda a revendedora (representante e data do acerto); "dm" guarda o que a DevMaster mostra
function aplicar(i, ov){
  if(!ov) return Object.assign({}, i, {repDm:i.representante, prevDm:i.prev, difRep:false, difPrev:false, ov:null});
  var rep = ov.representante || i.representante, prev = ov.prev || i.prev;
  return Object.assign({}, i, {representante:rep, prev:prev, repDm:i.representante, prevDm:i.prev, difRep:rep!==i.representante, difPrev:prev!==i.prev, ov:ov});
}

// ── Calendário do topo: dia da semana, número e QUANTOS ACERTOS
function CalendarioTopo(p){
  var ano = p.mes[0], mes = p.mes[1], sem = semanasDoMes(ano, mes), porDia = p.porDia, hoje = p.hojeIso;
  var max = 0; Object.keys(porDia).forEach(function(k){ if(k.slice(0,7)===ano+"-"+String(mes+1).padStart(2,"0")) max = Math.max(max, porDia[k].n); });
  var doMes = somaPeriodo(porDia, ano+"-"+String(mes+1).padStart(2,"0")+"-01", ano+"-"+String(mes+1).padStart(2,"0")+"-31");
  return e("div",{className:"flex h-full flex-col rounded-xl border bg-[#131315] px-2 pb-2 pt-1.5 "+BORDA},
    e("div",{className:"mb-1 flex items-center justify-between gap-2"},
      e("button",{type:"button", "aria-label":"Mês anterior", onClick:function(){ var t = new Date(ano, mes-1, 1); p.setMes([t.getFullYear(), t.getMonth()]); }, className:"h-[26px] rounded-md border border-border bg-[#1d1d21] px-2.5 text-[13px]"}, "◀"),
      e("span",{className:"flex items-baseline gap-2"}, e("b",{className:"text-[13px]"}, MESES[mes]+" de "+ano), e("span",{className:"text-[12px] font-semibold text-[#E8B84B]"}, doMes+" acertos")),
      e("button",{type:"button", "aria-label":"Próximo mês", onClick:function(){ var t = new Date(ano, mes+1, 1); p.setMes([t.getFullYear(), t.getMonth()]); }, className:"h-[26px] rounded-md border border-border bg-[#1d1d21] px-2.5 text-[13px]"}, "▶")),
    e("div",{className:"grid min-h-0 flex-1 grid-cols-7 gap-[3px]", style:{gridAutoRows:"minmax(0,1fr)"}},
      [].concat.apply([], sem).map(function(d, i){
        if(!d) return e("div",{key:i});
        var iso = isoDe(d), w = d.getDay(), n = porDia[iso] ? porDia[iso].n : 0, sel = iso===p.dia, hj = iso===hoje;
        return e("button",{key:i, type:"button", onClick:function(){ p.setDia(iso); }, title:NDIA[w]+" "+fmtDataBR(iso)+" · "+n+(n===1 ? " acerto" : " acertos")+" · clique para ver só este dia na tabela",
          className:"flex flex-col justify-center rounded-[7px] border px-1.5 text-left hover:border-[rgba(232,184,75,.55)] "+(sel ? "border-transparent ring-2 ring-[#E8B84B]" : "border-[#2c2c32]"), style:{background:calor(n, max) || (w===0 ? "#0f0f11" : "#18181b")}},
          e("span",{className:"flex w-full items-baseline justify-between"}, e("span",{className:"text-[10.5px] font-bold"}, NDIA3[w]), e("span",{className:"text-[13px] font-extrabold leading-none "+(hj ? "text-[#E8B84B]" : "")}, d.getDate())),
          e("span",{className:"mt-0.5 text-[15px] font-extrabold leading-none tabular-nums "+(n ? "" : "opacity-30")}, n || "—"));
      })));
}

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
      e("b",{className:"text-[13px]"}, fmtDataBR(iso)+" · "+NDIA[w].toLowerCase()), e("span",{className:"text-[12px] "+(dd<0 ? "text-[#f87171]" : "text-muted-foreground")}, dd<0 ? Math.abs(dd)+" d atrás" : dd===0 ? "hoje" : "daqui a "+dd+" d"),
      p.soDia ? e("button",{type:"button", onClick:p.limpaDia, className:"h-6 rounded-full px-2.5 text-[11.5px] font-bold", style:BARRA_OURO}, "Tabela só deste dia ✕") : e("span",{className:"text-[11.5px] text-muted-foreground"}, "Clique num dia para filtrar a tabela")),
    e("div",{className:"grid grid-cols-4 gap-1.5"}, cel("No dia", d.n, "text-[#E8B84B]"), cel("Na semana", somaPeriodo(p.porDia, seg, dom)), cel("No mês", somaPeriodo(p.porDia, mesIni, mesFim)), cel("Atrasadas", p.atrasadas, p.atrasadas ? "text-[#f87171]" : "", "hoje: "+p.hojeN)),
    e("div",{className:"flex items-center justify-between"}, e("span",{className:ROTULO}, "Acertos do dia por representante"), p.repsSel.length>0 && e("button",{type:"button", onClick:p.limpaReps, className:"text-[11.5px] text-[#E8B84B]"}, "ver todas")),
    e("div",{className:"min-h-0 flex-1 overflow-y-auto pr-1"},
      reps.length===0 ? e("p",{className:"py-4 text-center text-[13px] text-muted-foreground"}, "Nenhum acerto previsto neste dia"+(p.filtrando ? " com esses filtros." : "."))
      : reps.map(function(k){ var on = p.repsSel.indexOf(k)>=0;
          return e("button",{key:k, type:"button", onClick:function(){ p.alternaRep(k); }, title:"Clique para filtrar só "+k, className:"mb-1 grid w-full grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_28px] items-center gap-2 rounded-md px-2 py-1 text-left text-[12.5px] hover:bg-white/10 "+(on ? "ring-1 ring-[#E8B84B]" : "")},
            e("span",{className:"truncate "+(on ? "font-bold" : "")}, k), e("i",{className:"block h-2 overflow-hidden rounded bg-[#2a2a30]"}, e("u",{className:"block h-2", style:{width:Math.round(d.reps[k]/max*100)+"%", background:BARRA_OURO.background}})), e("b",{className:"text-right tabular-nums"}, d.reps[k])); })));
}

// ── Calendário inteiro: mês grande, cada dia com o total e as representantes
function CalendarioGrande(p){
  var ano = p.mes[0], mes = p.mes[1], sem = semanasDoMes(ano, mes), porDia = p.porDia, hoje = p.hojeIso;
  var ym = ano+"-"+String(mes+1).padStart(2,"0"), max = 0; Object.keys(porDia).forEach(function(k){ if(k.slice(0,7)===ym) max = Math.max(max, porDia[k].n); });
  var btn = "h-8 rounded-lg border border-border bg-[#1d1d21] px-3 text-[13px]";
  return e("div",{className:"overflow-hidden rounded-xl border bg-[#111113] "+BORDA},
    e("div",{className:"flex flex-wrap items-center gap-2 border-b px-3 py-2 "+BORDA},
      e("button",{type:"button", onClick:function(){ var t = new Date(ano, mes-1, 1); p.setMes([t.getFullYear(), t.getMonth()]); }, className:btn}, "◀ Mês anterior"),
      e("h3",{className:"min-w-[170px] text-center text-[15px] font-bold"}, MESES[mes]+" de "+ano),
      e("button",{type:"button", onClick:function(){ var t = new Date(ano, mes+1, 1); p.setMes([t.getFullYear(), t.getMonth()]); }, className:btn}, "Próximo mês ▶"),
      e("button",{type:"button", onClick:function(){ var t = parteData(hoje); p.setMes([t.getFullYear(), t.getMonth()]); }, className:btn}, "Hoje"),
      e("span",{className:"text-[13px] font-semibold text-[#E8B84B]"}, somaPeriodo(porDia, ym+"-01", ym+"-31")+" acertos no mês"),
      e("span",{className:"flex-1"}), e("span",{className:"text-[12.5px]"}, "Clique no dia para ver a lista.")),
    e("div",{className:"grid grid-cols-7 gap-[5px] p-2.5"}, [].concat.apply([], sem).map(function(d, i){
      if(!d) return e("div",{key:i});
      var iso = isoDe(d), w = d.getDay(), x = porDia[iso] || {n:0, reps:{}}, reps = Object.keys(x.reps).sort(function(a, b){ return x.reps[b]-x.reps[a]; });
      return e("div",{key:i, onClick:function(){ p.irParaDia(iso); }, className:"flex min-h-[118px] min-w-0 cursor-pointer flex-col gap-[3px] rounded-[10px] border p-1.5 hover:brightness-125 "+(iso===hoje ? "border-[#E8B84B]" : "border-[rgba(232,184,75,.2)]"), style:{background:calor(x.n, max) || "#141416"}},
        e("div",{className:"flex items-baseline justify-between"}, e("span",null, e("b",{className:"text-[15px] "+(iso===hoje ? "text-[#E8B84B]" : "")}, d.getDate()), " ", e("span",{className:"text-[10.5px] font-bold"}, NDIA3[w])), e("b",{className:"text-[15px] tabular-nums "+(x.n ? "" : "opacity-30")}, x.n || "—")),
        reps.slice(0,4).map(function(k){ return e("div",{key:k, title:k, className:"grid h-[19px] grid-cols-[1fr_auto] items-center gap-1 rounded-[5px] border bg-[#25252b]/80 px-1.5 text-[11px] "+BORDA}, e("span",{className:"truncate"}, curto(k)), e("b",{className:"tabular-nums text-[#E8B84B]"}, x.reps[k])); }),
        reps.length>4 && e("div",{className:"text-center text-[11px] font-bold"}, "+"+(reps.length-4)+" representantes"));
    })));
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
  {k:"valor", t:"Valor do kit", tipo:"din", v:function(r){ return r.valor; }}];

function passa(r, fil, hoje){
  var ok = true;
  COLUNAS.forEach(function(c){ var f = fil[c.k]; if(!f || !ok || !c.v) return; var x = c.v(r, hoje);
    if(c.tipo==="txt"){ if(f.q && String(x).toLowerCase().indexOf(f.q.toLowerCase())<0) ok = false; }
    else if(c.tipo==="num"){ if(f.q!=="" && f.q!=null && !(Number(x)>=Number(f.q))) ok = false; }
    else if(c.tipo==="data"){ if(f.a && !f.b && x!==f.a) ok = false; else if(f.a && f.b && !(x>=f.a && x<=f.b)) ok = false; else if(!f.a && f.b && !(x && x<=f.b)) ok = false; }
    else if(c.tipo==="falt"){ if(f.q==="atr" && !(x<0)) ok = false; if(f.q==="7" && !(x>=0 && x<=7)) ok = false; if(f.q==="30" && !(x>=0 && x<=30)) ok = false; if(f.q==="fut" && !(x>30)) ok = false; }
    else if(c.tipo==="sel"){ if(f.q && String(x)!==String(f.q)) ok = false; } });
  return ok;
}

function TabelaRevendedoras(p){
  var linhas = p.linhas, fil = p.fil, setFil = p.setFil, hoje = p.hojeIso, reps = p.todasReps;
  var ref = useRef(null), pr = useRef(null), pp = useState(null), pop = pp[0], setPop = pp[1];
  var ativo = function(c){ var f = fil[c.k]; return !!f && !!(f.q || f.a || f.b); };
  var algum = COLUNAS.some(ativo);
  var troca = function(col, parte, valor){ var n = Object.assign({}, fil), f = Object.assign({}, n[col]); f[parte] = valor; n[col] = f; setFil(n); };
  useEffect(function(){
    if(!pop) return undefined;
    var fora = function(ev){ if(pr.current && pr.current.contains(ev.target)) return; if(ev.target.closest && ev.target.closest("th[data-col]")) return; setPop(null); };
    var esc = function(ev){ if(ev.key==="Escape") setPop(null); };
    document.addEventListener("mousedown", fora); document.addEventListener("keydown", esc);
    return function(){ document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc); };
  }, [pop]);
  var abrirPop = function(c, ev){ if(pop && pop.col===c.k){ setPop(null); return; } var t = ev.currentTarget.getBoundingClientRect(), w = ref.current.getBoundingClientRect(); setPop({col:c.k, top:t.bottom-w.top+4, left:Math.max(0, Math.min(t.left-w.left, w.width-250))}); };
  var cPop = pop ? COLUNAS.find(function(c){ return c.k===pop.col; }) : null, fPop = cPop ? (fil[cPop.k]||{}) : {};
  var rot = "flex flex-col gap-1 text-[11px] font-bold uppercase tracking-[.05em]", campo = INPUT+" h-8! w-full text-[13px]!";
  var popCorpo = !cPop ? null : cPop.tipo==="txt" ? e("label",{className:rot}, cPop.t+" contém", e("input",{autoFocus:true, value:fPop.q||"", placeholder:"Digite para filtrar", className:campo, onChange:function(ev){ troca(cPop.k, "q", ev.target.value); }}))
    : cPop.tipo==="num" ? e("label",{className:rot}, cPop.t+" a partir de", e("input",{autoFocus:true, type:"number", min:0, value:fPop.q||"", className:campo, onChange:function(ev){ troca(cPop.k, "q", ev.target.value); }}))
    : cPop.tipo==="data" ? e(React.Fragment,null, e("label",{className:rot},"Data (ou de)", e("input",{autoFocus:true, type:"date", value:fPop.a||"", className:campo, onChange:function(ev){ troca(cPop.k, "a", ev.target.value); }})),
        e("label",{className:rot},"até", e("input",{type:"date", value:fPop.b||"", className:campo, onChange:function(ev){ troca(cPop.k, "b", ev.target.value); }})),
        e("span",{className:"text-[11.5px]"},"Só a primeira: aquele dia. As duas: de … até …. Só a segunda: até aquele dia."))
    : cPop.tipo==="falt" ? e("label",{className:rot},"Faltam", e("select",{value:fPop.q||"", className:campo, onChange:function(ev){ troca(cPop.k, "q", ev.target.value); }}, e("option",{value:""},"Todas"), e("option",{value:"atr"},"Atrasadas"), e("option",{value:"7"},"Próximos 7 dias"), e("option",{value:"30"},"Próximos 30 dias"), e("option",{value:"fut"},"Depois de 30 dias")))
    : e("label",{className:rot}, cPop.t, e("select",{value:fPop.q||"", className:campo, onChange:function(ev){ troca(cPop.k, "q", ev.target.value); }}, e("option",{value:""},"Todas"), reps.map(function(n){ return e("option",{key:n, value:n}, n); })));
  var cel = "whitespace-nowrap border-b border-r px-2 text-center tabular-nums "+BORDA+" last:border-r-0";
  return e("div",{ref:ref, className:"relative"},
    algum && e("button",{type:"button", onClick:function(){ setFil({}); setPop(null); }, className:"absolute right-2 top-[-24px] text-[12px] text-[#E8B84B]"}, "Limpar filtros das colunas"),
    e("div",{className:"overflow-x-auto"},
      e("table",{className:"w-full min-w-max border-separate border-spacing-0 border text-[12px] "+BORDA},
        e("thead",null, e("tr",{style:BARRA_OURO}, COLUNAS.map(function(c){ return e("th",{key:c.k, "data-col":c.k, title:c.tipo==="seq" ? "Número da linha" : "Clique para filtrar", onClick:c.tipo==="seq" || c.tipo==="din" ? null : function(ev){ abrirPop(c, ev); }, className:(c.tipo==="seq" || c.tipo==="din" ? "" : "cursor-pointer ")+"h-8 select-none whitespace-nowrap border-r border-[rgba(0,0,0,.42)] px-2 text-center text-[11px] font-extrabold uppercase tracking-[.06em] last:border-r-0 hover:bg-white/15 "+(ativo(c) ? "underline decoration-2 underline-offset-4" : "")}, c.t); }))),
        e("tbody",null, linhas.length===0 ? e("tr",null, e("td",{colSpan:COLUNAS.length, className:"p-4 text-center"}, p.total===0 ? (p.carregando ? "Carregando da DevMaster…" : "Nenhuma revendedora ainda. Clique em Atualizar da DevMaster.") : "Nenhuma revendedora com esses filtros."))
          : linhas.slice(0, p.limite).map(function(r, i){
              var dd = diasEntre(hoje, r.prev), sel = r.prev===p.dia && p.soDia;
              return e("tr",{key:r.cod, onClick:function(){ p.abrir(r.cod); }, title:"Clique para abrir o card de "+r.nome, className:"h-8 cursor-pointer hover:bg-[rgba(232,184,75,.12)] "+(sel ? "bg-[rgba(232,184,75,.10)] " : i%2 ? "bg-white/[.025] " : "")},
                e("td",{className:cel, style:dd<0 ? {boxShadow:"inset 3px 0 #f87171"} : null}, i+1), e("td",{className:cel+" text-left font-semibold"}, r.nome), e("td",{className:cel}, foneBonito(r.celular) || "—"), e("td",{className:cel}, r.cod),
                e("td",{className:cel+" text-left"}, r.representante, r.difRep && e("span",{className:"ml-2 rounded-full bg-warning/20 px-1.5 text-[10.5px] font-bold text-warning", title:"Na DevMaster: "+r.repDm+". Altere lá também."}, "≠ DevMaster")),
                e("td",{className:cel+" text-left"}, r.cidade ? r.cidade+(r.uf ? " / "+r.uf : "") : "—"), e("td",{className:cel}, r.kits),
                e("td",{className:cel}, dBR(r.emissao)), e("td",{className:cel+" font-semibold"}, dBR(r.prev), r.difPrev && e("span",{className:"ml-1.5 rounded-full bg-warning/20 px-1.5 text-[10.5px] font-bold text-warning", title:"Na DevMaster: "+fmtDataBR(r.prevDm)+". Altere lá também."}, "≠")),
                e("td",{className:cel+" "+(dd<0 ? "text-[#f87171]" : "")}, dd<0 ? Math.abs(dd)+" d atrasada" : dd===0 ? "hoje" : dd+" d"), e("td",{className:cel+" text-right"}, BRL(r.valor))); })))),
    linhas.length>p.limite && e("div",{className:"flex items-center justify-center gap-3 py-2 text-[12.5px]"}, "Mostrando "+p.limite+" de "+linhas.length, e("button",{type:"button", onClick:p.maisLinhas, className:"h-7 rounded-md border border-border bg-[#1d1d21] px-3"}, "Ver mais 200")),
    pop && cPop && e("div",{ref:pr, className:"absolute z-20 flex min-w-[220px] flex-col gap-1.5 rounded-xl border bg-[#1b1b1f] p-2.5 shadow-2xl "+BORDA, style:{top:pop.top, left:pop.left}},
      popCorpo, e("button",{type:"button", onClick:function(){ var n = Object.assign({}, fil); delete n[cPop.k]; setFil(n); setPop(null); }, className:"self-start text-[12px] text-[#E8B84B]"}, "Limpar este filtro")));
}

// ── Escolha de representantes (várias de uma vez) em lista que abre e fecha
function SeletorReps(p){
  var as = useState(false), aberto = as[0], setAberto = as[1], bs = useState(""), busca = bs[0], setBusca = bs[1];
  var lista = p.reps.filter(function(r){ return !busca || r.nome.toLowerCase().indexOf(busca.toLowerCase())>=0; });
  return e("div",{className:"relative"},
    e("button",{type:"button", onClick:function(){ setAberto(!aberto); }, "aria-expanded":aberto, className:"flex h-8 items-center gap-2 rounded-lg border px-3 text-[13px] "+BORDA+(p.sel.length ? " font-semibold" : ""), style:p.sel.length ? BARRA_OURO : {background:"#1d1d21"}},
      p.sel.length===0 ? "Todas as representantes" : p.sel.length===1 ? curto(p.sel[0]) : p.sel.length+" representantes", e("span",{className:"text-[10px]"}, aberto ? "▲" : "▼")),
    aberto && e("div",{className:"fixed inset-0 z-30", onClick:function(){ setAberto(false); }}),
    aberto && e("div",{className:"absolute left-0 top-9 z-40 flex w-[320px] flex-col gap-1.5 rounded-xl border bg-[#1b1b1f] p-2 shadow-2xl "+BORDA},
      e("input",{autoFocus:true, value:busca, placeholder:"Buscar representante", className:INPUT+" h-8! w-full text-[13px]!", onChange:function(ev){ setBusca(ev.target.value); }}),
      e("div",{className:"flex gap-3 text-[12px] text-[#E8B84B]"}, e("button",{type:"button", onClick:function(){ p.setSel(p.reps.map(function(r){ return r.nome; })); }}, "Marcar todas"), e("button",{type:"button", onClick:function(){ p.setSel([]); }}, "Limpar")),
      e("div",{className:"max-h-[300px] overflow-y-auto"}, lista.map(function(r){ var on = p.sel.indexOf(r.nome)>=0;
        return e("label",{key:r.nome, className:"flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-[13px] hover:bg-white/10"}, e("input",{type:"checkbox", checked:on, onChange:function(){ p.setSel(on ? p.sel.filter(function(x){ return x!==r.nome; }) : p.sel.concat([r.nome])); }}), e("span",{className:"min-w-0 flex-1 truncate"}, r.nome), e("b",{className:"tabular-nums text-muted-foreground"}, r.n)); }))));
}

// ── CARD da revendedora (modelo do card da Tamara): a Ana Maria troca a representante e a data do acerto, anota, e vê o histórico.
// A DevMaster ainda manda: todo ajuste precisa ser feito ANTES lá. O botão Salvar só libera depois de marcar "já alterei na DevMaster".
function CartaoRevendedora(p){
  var r = p.r, reps = p.todasReps, hojeIso = p.hojeIso, eu = p.eu;
  var f1 = useState(r.representante), rep = f1[0], setRep = f1[1], f2 = useState(r.prev), prev = f2[0], setPrev = f2[1], f3 = useState(""), motivo = f3[0], setMotivo = f3[1];
  var f4 = useState(false), jaDm = f4[0], setJaDm = f4[1], f5 = useState(""), obs = f5[0], setObs = f5[1], f6 = useState(false), todos = f6[0], setTodos = f6[1];
  var mudou = rep!==r.representante || prev!==r.prev || obs.trim()!=="";
  var historico = (r.ov && r.ov.historico) || [];
  var dias = diasEntre(hojeIso, r.prev);
  var conds = (r.conds||[]).filter(function(c){ return c.t!=="Expositor"; }).sort(function(a, b){ return (a.e||"").localeCompare(b.e||""); });
  var tot = conds.reduce(function(a, c){ return {p:a.p+(c.p||0), v:a.v+(c.v||0)}; }, {p:0, v:0});
  var salvar = function(){
    if(!mudou || !jaDm) return;
    var novos = [], agora = new Date().toISOString();
    if(rep!==r.representante) novos.push({em:agora, por:eu, campo:"Representante", de:r.representante, para:rep, motivo:motivo});
    if(prev!==r.prev) novos.push({em:agora, por:eu, campo:"Acerto previsto", de:r.prev, para:prev, motivo:motivo});
    if(obs.trim()) novos.push({em:agora, por:eu, campo:"Observação", de:"", para:obs.trim(), motivo:""});
    p.salvar(r, {representante:rep, prev:prev, historico:novos.concat(historico).slice(0, 60)});
  };
  var kv = function(rot, val, cls){ return e("div",{className:"flex flex-wrap items-baseline justify-between gap-x-2"}, e("span",{className:ROTULO}, rot), e("b",{className:MONO+" text-[13.5px] "+(cls||"")}, val)); };
  var zap = linkZap(r.celular);
  return e("div",{className:"overflow-hidden rounded-2xl text-[#fbf4e4]", style:CARD_ESTILO},
    e("div",{className:"flex items-center gap-2.5 border-b border-[rgba(241,213,138,.16)] py-2 pl-4 pr-24", style:TOPO_ESTILO},
      e("b",{className:"min-w-0 truncate text-[15px] text-white"}, r.nome),
      zap && e("a",{href:zap, target:"_blank", rel:"noreferrer", title:"Chamar no WhatsApp", "aria-label":"WhatsApp de "+r.nome, className:"inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-[11px] font-bold text-[#04210f] hover:brightness-110"}, "W"),
      e("span",{className:"size-[6px] shrink-0 rounded-full bg-white"}), e("span",{className:MONO+" text-[13px] font-semibold text-white"}, r.cod),
      e("span",{className:"flex-1"}), (r.difRep || r.difPrev) && chip("Diferente da DevMaster", CLASSE_ALERTA)),
    // aviso fixo: a DevMaster ainda manda
    e("div",{className:"flex items-start gap-2 border-b border-[rgba(251,191,36,.35)] bg-[rgba(251,191,36,.12)] px-4 py-2 text-[12.5px] text-[#fde68a]"},
      e("b",{className:"shrink-0"}, "Antes, altere na DevMaster."), e("span",null, "Qualquer mudança feita aqui (representante, data do acerto) precisa ser feita primeiro na DevMaster, até passarmos a usar só o sistema. Aqui fica o registro de quem mudou e quando.")),
    e("div",{className:"grid md:grid-cols-[270px_minmax(0,1fr)]"},
      e("div",{className:"flex flex-col gap-1.5 border-b border-[rgba(241,213,138,.16)] p-3 md:border-b-0 md:border-r", style:{background:"linear-gradient(180deg, rgba(241,213,138,.07), transparent)"}},
        kv("Acerto previsto", fmtDataBR(r.prev)), kv("Faltam", dias<0 ? Math.abs(dias)+" d atrasada" : dias===0 ? "hoje" : dias+" d", dias<0 ? "text-[#fca5a5]" : ""),
        kv("Kits ativos", r.kits), kv("Peças", tot.p || r.pecas), kv("Valor", BRL(tot.v || r.valor), "text-[#F1D58A]"), kv("Cidade", r.cidade ? r.cidade+(r.uf ? " / "+r.uf : "") : "—"), kv("WhatsApp", foneBonito(r.celular) || "—"),
        e("div",{className:"mt-1 flex flex-col gap-1"}, e("span",{className:ROTULO}, "Representante"),
          e("select",{value:rep, "aria-label":"Representante", className:CAMPO, onChange:function(ev){ setRep(ev.target.value); }}, (reps.indexOf(r.representante)<0 ? [r.representante] : []).concat(reps).map(function(n){ return e("option",{key:n, value:n}, n); })),
          r.difRep ? e("span",{className:"text-[11.5px] text-warning"}, "Na DevMaster: "+r.repDm+" · altere lá também") : e("span",{className:"text-[11.5px] text-[#cdbf9f]"}, "Igual à DevMaster")),
        e("div",{className:"flex flex-col gap-1"}, e("span",{className:ROTULO}, "Data do acerto"),
          e("input",{type:"date", value:prev, "aria-label":"Data do acerto", className:CAMPO, onChange:function(ev){ setPrev(ev.target.value); }}),
          r.difPrev ? e("span",{className:"text-[11.5px] text-warning"}, "Na DevMaster: "+fmtDataBR(r.prevDm)+" · altere lá também") : e("span",{className:"text-[11.5px] text-[#cdbf9f]"}, "Igual à DevMaster"))),
      e("div",{className:"flex min-w-0 flex-col gap-2 px-3.5 py-3"},
        e("div",{className:"flex items-center justify-between"}, e("span",{className:ROTULO}, "Alterações feitas no sistema"), historico.length>3 && e("button",{type:"button", onClick:function(){ setTodos(!todos); }, className:"text-[12px] text-[#F1D58A]"}, todos ? "ver menos ▴" : "ver todas ("+historico.length+") ▾")),
        historico.length===0 ? e("p",{className:"text-[13px] text-[#cdbf9f]"}, "Nenhuma alteração ainda. Tudo vem da DevMaster.")
        : e("div",{className:"flex max-h-44 flex-col overflow-y-auto pr-1"}, (todos ? historico : historico.slice(0, 3)).map(function(h, i){
            var fmt = function(c, v){ return c==="Acerto previsto" && v ? fmtDataBR(v) : (v || "—"); };
            return e("div",{key:i, className:"grid grid-cols-[48px_minmax(0,1fr)] gap-2 border-t border-[rgba(241,213,138,.16)] py-1.5 first:border-t-0"},
              e("div",{className:MONO+" pt-0.5 text-[12px] text-[#cdbf9f]"}, h.em.slice(8,10)+"/"+h.em.slice(5,7)),
              e("div",{className:"min-w-0 text-[13px]"}, e("b",null, h.por), " · ", e("span",{className:"text-[#cdbf9f]"}, h.campo), h.campo==="Observação" ? e("div",null, h.para) : e("div",null, fmt(h.campo, h.de), " → ", e("b",{className:"text-[#bbf7d0]"}, fmt(h.campo, h.para))), h.motivo && e("div",{className:"text-[12px] text-[#cdbf9f]"}, "Motivo: "+h.motivo))); })),
        e("div",{className:"mt-1 flex flex-col gap-1.5 rounded-xl p-2 ring-1 ring-[rgba(241,213,138,.2)]", style:{background:"rgba(241,213,138,.06)"}},
          e("input",{value:motivo, placeholder:"Motivo da troca (opcional)", className:CAMPO, onChange:function(ev){ setMotivo(ev.target.value); }}),
          e("input",{value:obs, placeholder:"Observação (opcional): fica no registro", className:CAMPO, onChange:function(ev){ setObs(ev.target.value); }}),
          e("label",{className:"flex cursor-pointer items-center gap-2 text-[12.5px]"}, e("input",{type:"checkbox", checked:jaDm, onChange:function(ev){ setJaDm(ev.target.checked); }}), "Já fiz essa alteração na DevMaster"),
          e("div",{className:"flex items-center gap-2"},
            e("button",{type:"button", disabled:!mudou || !jaDm || p.salvando, onClick:salvar, className:"h-8 rounded-lg px-4 text-[13px] font-bold text-[#17110a] disabled:opacity-50", style:BTN_OURO}, p.salvando ? "Salvando…" : "Salvar alteração"),
            !mudou && e("span",{className:"text-[12px] text-[#cdbf9f]"}, "Troque a representante ou a data para salvar."), mudou && !jaDm && e("span",{className:"text-[12px] text-warning"}, "Marque que já alterou na DevMaster."), p.erro && e("span",{className:"text-[12px] text-[#f87171]"}, p.erro))))),
    e("div",{className:"border-t border-[rgba(241,213,138,.16)] px-4 pb-2.5 pt-2"},
      e("span",{className:ROTULO}, "Condicionais ativas"),
      conds.length===0 ? e("p",{className:"mt-1 text-[13px] text-[#cdbf9f]"}, "Sem condicionais para mostrar.")
      : e("table",{className:"mt-0.5 w-full border-collapse text-[13px]"},
          e("thead",null, e("tr",null, ["Condicional","Tipo","Emissão","Previsão","Peças","Valor"].map(function(t, i){ return e("th",{key:t, className:"px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[.06em] text-[#cdbf9f] "+(i<2 ? "text-left" : "text-right")}, t); }))),
          e("tbody",null, conds.map(function(c, i){ return e("tr",{key:(c.n||"")+i, className:"border-t border-[rgba(241,213,138,.16)]"},
            e("td",{className:"px-2 py-1 font-bold "+MONO}, c.n||"—"), e("td",{className:"px-2 py-1"}, chip(c.t==="Reposição / peças do próximo mês" ? "Kit extra" : c.t, CLASSE_TIPO[c.t] || "bg-info/15 text-info ring-info/40")),
            e("td",{className:"px-2 py-1 text-right "+MONO}, c.e ? c.e.slice(8)+"/"+c.e.slice(5,7) : "—"), e("td",{className:"px-2 py-1 text-right "+MONO}, c.d ? c.d.slice(8)+"/"+c.d.slice(5,7) : "—"),
            e("td",{className:"px-2 py-1 text-right "+MONO}, c.p), e("td",{className:"px-2 py-1 text-right "+MONO}, BRL(c.v))); })),
          e("tfoot",null, e("tr",{className:"border-t-2 border-[rgba(241,213,138,.3)] font-bold"}, e("td",{className:"px-2 py-1", colSpan:4}, conds.length+(conds.length===1 ? " condicional ativa" : " condicionais ativas")), e("td",{className:"px-2 py-1 text-right "+MONO}, tot.p), e("td",{className:"px-2 py-1 text-right "+MONO}, BRL(tot.v)))))));
}

function AbaAgRevendedoras(){
  var cx = use(), hojeIso = isoDia(new Date()), eu = nomeDe(cx.state.usuario);
  var ds = useState(null), dados = ds[0], setDados = ds[1], cs = useState(false), carregando = cs[0], setCarregando = cs[1], ms = useState(""), msg = ms[0], setMsg = ms[1];
  var as = useState({}), alt = as[0], setAlt = as[1];   // alterações da Ana Maria (módulo agrev): cod → registro
  var carregar = function(forcar){
    if(!apiAtiva()){ setMsg("Precisa do servidor ligado (veja com o Leonardo)."); return; }
    setCarregando(true); setMsg(forcar ? "Buscando na DevMaster…" : "");
    Promise.all([chamar("GET", "/agenda-revendedoras"+(forcar ? "?atualizar=1" : "")), chamar("GET", "/estado/agrev").catch(function(){ return {conteudo:{}}; })]).then(function(v){
      setDados(v[0]); var o = {}, c = (v[1] && v[1].conteudo) || {}; Object.keys(c).forEach(function(k){ if(k.indexOf("r_")===0 && c[k] && c[k].cod) o[c[k].cod] = c[k]; }); setAlt(o);
      setMsg(forcar ? "Atualizado: "+v[0].total+" revendedoras" : "");
    }).catch(function(x){ setMsg(x.message); }).finally(function(){ setCarregando(false); });
  };
  var refCar = useRef(null); refCar.current = carregar;
  useEffect(function(){ refCar.current(false); var t = setInterval(function(){ refCar.current(false); }, 600000); return function(){ clearInterval(t); }; }, []);
  var itens = dados ? dados.itens.map(function(i){ return aplicar(i, alt[i.cod]); }) : [];
  var fs = useState({}), fil = fs[0], setFil = fs[1], rs = useState([]), repsSel = rs[0], setRepsSel = rs[1], bs = useState(""), busca = bs[0], setBusca = bs[1];
  var vs = useState("lista"), visao = vs[0], setVisao = vs[1], ls = useState(200), limite = ls[0], setLimite = ls[1], sd = useState(false), soDia = sd[0], setSoDia = sd[1];
  var h0 = parteData(hojeIso), m1 = useState([h0.getFullYear(), h0.getMonth()]), mes = m1[0], setMes = m1[1], m2 = useState([h0.getFullYear(), h0.getMonth()]), mesG = m2[0], setMesG = m2[1], d1 = useState(hojeIso), dia = d1[0], setDia = d1[1];
  var ab = useState(null), aberto = ab[0], setAberto = ab[1], sv = useState(false), salvando = sv[0], setSalvando = sv[1], er = useState(""), erro = er[0], setErro = er[1];
  useEffect(function(){ if(!aberto) return undefined; var f = function(ev){ if(ev.key==="Escape") setAberto(null); }; window.addEventListener("keydown", f); return function(){ window.removeEventListener("keydown", f); }; }, [aberto]);
  // representantes (com a quantidade de revendedoras de cada uma), já com as trocas feitas aqui
  var contaReps = {}; itens.forEach(function(r){ contaReps[r.representante] = (contaReps[r.representante]||0)+1; });
  var reps = Object.keys(contaReps).sort(function(a, b){ return a.localeCompare(b, "pt-BR"); }).map(function(n){ return {nome:n, n:contaReps[n]}; });
  var nomesReps = reps.map(function(r){ return r.nome; });
  var linhasSemDia = itens.filter(function(r){
    if(repsSel.length && repsSel.indexOf(r.representante)<0) return false;
    if(busca && r.nome.toLowerCase().indexOf(busca.toLowerCase())<0 && String(r.cod).indexOf(busca)<0) return false;
    return passa(r, fil, hojeIso); });
  var porDia = contar(linhasSemDia), filtrando = linhasSemDia.length!==itens.length;
  var linhas = soDia ? linhasSemDia.filter(function(r){ return r.prev===dia; }) : linhasSemDia;
  var atrasadas = linhasSemDia.filter(function(r){ return r.prev<hojeIso; }).length;
  var prox7 = linhasSemDia.filter(function(r){ return r.prev>=hojeIso && r.prev<=somaDia(hojeIso, 7); }).length, hojeN = (porDia[hojeIso] ? porDia[hojeIso].n : 0), alteradas = itens.filter(function(r){ return r.difRep || r.difPrev; }).length;
  var escolherDia = function(iso){ if(soDia && iso===dia){ setSoDia(false); return; } setDia(iso); setSoDia(true); setLimite(200); var t = parteData(iso); setMes([t.getFullYear(), t.getMonth()]); };
  var irParaDia = function(iso){ setDia(iso); setSoDia(true); var t = parteData(iso); setMes([t.getFullYear(), t.getMonth()]); setVisao("lista"); };
  var alternaRep = function(k){ setRepsSel(repsSel.indexOf(k)>=0 ? repsSel.filter(function(x){ return x!==k; }) : repsSel.concat([k])); };
  var limpaTudo = function(){ setFil({}); setRepsSel([]); setBusca(""); setSoDia(false); };
  var segBtn = function(k, t){ var on = visao===k; return e("button",{key:k, type:"button", onClick:function(){ setVisao(k); }, "aria-pressed":on, className:"h-8 px-3.5 text-[13px] font-semibold "+(on ? "" : "hover:bg-white/10"), style:on ? BARRA_OURO : null}, t); };
  var rSel = aberto ? itens.find(function(r){ return r.cod===aberto; }) : null;
  var salvar = function(r, patch){
    setSalvando(true); setErro("");
    var reg = {cod:r.cod, representante:patch.representante, prev:patch.prev, historico:patch.historico, em:new Date().toISOString(), por:eu};
    chamar("PUT", "/estado/agrev", {chaves:{["r_"+r.cod]:reg}}).then(function(){ var n = Object.assign({}, alt); n[r.cod] = reg; setAlt(n); }).catch(function(x){ setErro(x.message); }).finally(function(){ setSalvando(false); });
  };
  var cel = function(rot, val, cor, dica){ return e("div",{title:dica||null, className:"flex min-w-[120px] flex-1 flex-col items-center justify-center border-r px-2 py-1 last:border-r-0 "+BORDA},
    e("span",{className:"text-[11px] font-semibold uppercase tracking-[.05em] text-muted-foreground"}, rot), e("b",{className:"text-[20px] leading-tight tabular-nums "+(cor||"")}, val)); };
  return e(React.Fragment,null,
    e("div",{className:"flex flex-wrap items-end justify-between gap-3"},
      e(PageHead,{t:"Revendedoras com kit ativo", sub:"Kits abertos na DevMaster com acerto previsto até "+(dados ? dados.janelaDias : 120)+" dias à frente · a DevMaster ainda manda: altere lá primeiro"}),
      e("div",{className:"flex flex-wrap items-center gap-2"},
        e("div",{className:"inline-flex overflow-hidden rounded-lg border "+BORDA}, segBtn("lista","Lista"), segBtn("calendario","Calendário")),
        e("button",{type:"button", disabled:carregando, onClick:function(){ carregar(true); }, title:"Busca de novo na DevMaster (a tela se atualiza sozinha a cada 10 minutos)", className:"h-8 rounded-lg px-3.5 text-[13px] font-bold disabled:opacity-50", style:BARRA_OURO}, "↻ Atualizar da DevMaster"),
        (msg || carregando) && e("span",{className:"text-[12.5px]"}, carregando && !msg ? "Carregando da DevMaster…" : msg))),
    // faixa de totais (já com os filtros)
    e("div",{className:"flex flex-wrap rounded-xl border bg-[#131315] "+BORDA},
      cel("Revendedoras", linhasSemDia.length.toLocaleString("pt-BR"), "text-[#E8B84B]", filtrando ? "de "+itens.length.toLocaleString("pt-BR")+" no total" : "com kit ativo"),
      cel("Acertos hoje", hojeN), cel("Próximos 7 dias", prox7), cel("Atrasadas", atrasadas, atrasadas ? "text-[#f87171]" : "", "Passaram da data prevista e o kit continua aberto"),
      cel("Representantes", reps.length), cel("Alteradas aqui", alteradas, alteradas ? "text-warning" : "", "Diferentes da DevMaster: altere lá também")),
    // filtros
    e("div",{className:"flex flex-wrap items-center gap-2"},
      e(SeletorReps,{reps:reps, sel:repsSel, setSel:setRepsSel}),
      e("input",{value:busca, placeholder:"Buscar revendedora (nome ou código)", className:INPUT+" h-8! w-[320px] text-[13px]!", onChange:function(ev){ setBusca(ev.target.value); }}),
      soDia && e("button",{type:"button", onClick:function(){ setSoDia(false); }, className:"inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-bold", style:BARRA_OURO}, "Dia "+fmtDataBR(dia)+" ✕"),
      (filtrando || soDia) && e("button",{type:"button", onClick:limpaTudo, className:"text-[12.5px] text-[#E8B84B]"}, "Limpar todos os filtros"),
      e("span",{className:"ml-auto text-[12.5px] text-muted-foreground"}, "Clique numa revendedora para abrir o card")),
    visao==="lista"
      ? e("div",{className:"flex flex-col gap-3"},
          e("div",{className:"grid gap-3 lg:grid-cols-[560px_minmax(0,1fr)]", style:{minHeight:ALTURA}},
            e("div",{style:{height:ALTURA}}, e(CalendarioTopo,{porDia:porDia, dia:dia, setDia:escolherDia, mes:mes, setMes:setMes, hojeIso:hojeIso})),
            e("div",{className:"overflow-hidden", style:{height:ALTURA}}, e(Resumo,{porDia:porDia, dia:dia, hojeIso:hojeIso, repsSel:repsSel, alternaRep:alternaRep, limpaReps:function(){ setRepsSel([]); }, filtrando:filtrando, soDia:soDia, limpaDia:function(){ setSoDia(false); }, atrasadas:atrasadas, hojeN:hojeN}))),
          e(TabelaRevendedoras,{linhas:linhas, total:itens.length, carregando:carregando, fil:fil, setFil:setFil, hojeIso:hojeIso, todasReps:nomesReps, dia:dia, soDia:soDia, abrir:setAberto, limite:limite, maisLinhas:function(){ setLimite(limite+200); }}))
      : e(CalendarioGrande,{porDia:porDia, mes:mesG, setMes:setMesG, hojeIso:hojeIso, irParaDia:irParaDia}),
    rSel && e("div",{className:"fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/65 p-3 md:p-6", role:"dialog", "aria-modal":"true", onMouseDown:function(ev){ if(ev.target===ev.currentTarget) setAberto(null); }},
      e("div",{className:"relative my-auto w-full max-w-[900px]"},
        e("button",{type:"button", "aria-label":"Fechar", onClick:function(){ setAberto(null); }, className:"absolute right-3 top-2.5 z-10 h-7 rounded-lg bg-black/40 px-2.5 text-[12.5px] font-semibold text-[#fbf4e4] ring-1 ring-[rgba(241,213,138,.3)] hover:bg-black/60"}, "Fechar ✕"),
        e(CartaoRevendedora,{key:rSel.cod+"|"+(rSel.ov ? rSel.ov.em : ""), r:rSel, todasReps:nomesReps, hojeIso:hojeIso, eu:eu, salvar:salvar, salvando:salvando, erro:erro}))));
}

export { AbaAgRevendedoras };

// Sorelly Admin · montagem — pages/AgendamentoRevendedoras.js
// Agendamento › Revendedoras (Marcus, 29/10/2026): TODAS as revendedoras com kit ativo (condicional aberto na DevMaster com devolução prevista até 120 dias à frente,
// emissão sem limite), lidas pelo servidor (/api/agenda-revendedoras, só leitura). Desenho copiado da aba Revendedoras do Atendimento interno
// (calendário em cima, dia ao lado, tabela com filtro no título da coluna, barra de ouro), mas o calendário aqui CONTA ACERTOS por dia, somando todas as representantes.
// Filtrou uma representante, uma revendedora ou uma coluna? O calendário e o painel do dia mostram só quem sobrou.
import { diasEntre, fmtDataBR, isoDe, parteData } from "@/apps/montagem/domain/revendedoras-internas";
import { isoDia } from "@/apps/montagem/lib/format";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { INPUT } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useEffect, useRef, useState } from "@/shared/react";
import React from "react";

var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var NDIA = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"], NDIA3 = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
var BORDA = "border-[rgba(232,184,75,.22)]";
var BARRA_OURO = {background:"linear-gradient(90deg,#9A6F1E,#E8B84B 48%,#F5E7BE)", color:"#1a1306"};
var ALTURA = 340;
var BRL = function(v){ return "R$ "+Number(v||0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); };
var curto = function(nome){ var p = String(nome||"").split(/\s+/).filter(function(w){ return ["da","de","do","dos","das","e"].indexOf(w.toLowerCase())<0; }); return p.slice(0,2).join(" "); };
var dBR = function(iso){ return iso ? fmtDataBR(iso).slice(0,5) : "—"; };
var foneBonito = function(cel){ var n = String(cel||"").replace(/\D/g,"").replace(/^55/,""); return n.length===11 ? "("+n.slice(0,2)+") "+n.slice(2,7)+"-"+n.slice(7) : n.length===10 ? "("+n.slice(0,2)+") "+n.slice(2,6)+"-"+n.slice(6) : n; };
var segundaDe = function(dt){ var x = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()); x.setDate(x.getDate()-((x.getDay()+6)%7)); return x; };

// semanas (segunda a domingo) que cobrem o mês; dia fora do mês = null
function semanasDoMes(ano, mes){
  var p = segundaDe(new Date(ano, mes, 1)), fim = new Date(ano, mes+1, 0), out = [];
  while(p<=fim){ var dias = []; for(var i=0;i<7;i++){ var d = new Date(p.getFullYear(), p.getMonth(), p.getDate()+i); dias.push(d.getMonth()===mes ? d : null); } out.push(dias); p = new Date(p.getFullYear(), p.getMonth(), p.getDate()+7); }
  return out;
}
// quantos acertos por dia (e por representante), só da lista já filtrada
function contar(linhas){
  var porDia = {};
  linhas.forEach(function(r){ var d = porDia[r.prev] || (porDia[r.prev] = {n:0, reps:{}, lista:[]}); d.n++; d.reps[r.representante] = (d.reps[r.representante]||0)+1; d.lista.push(r); });
  return porDia;
}
var calor = function(n, max){ return n<=0 ? null : "rgba(232,184,75,"+(0.10+0.42*(n/Math.max(1, max)))+")"; };

// ── Calendário do topo: dia da semana, número e QUANTOS ACERTOS
function CalendarioTopo(p){
  var ano = p.mes[0], mes = p.mes[1], sem = semanasDoMes(ano, mes), porDia = p.porDia, hoje = p.hojeIso;
  var doMes = 0, max = 0; Object.keys(porDia).forEach(function(k){ if(k.slice(0,7)===ano+"-"+String(mes+1).padStart(2,"0")){ doMes += porDia[k].n; max = Math.max(max, porDia[k].n); } });
  return e("div",{className:"flex h-full flex-col rounded-xl border bg-[#131315] px-2 pb-2 pt-1.5 "+BORDA},
    e("div",{className:"mb-1 flex items-center justify-between gap-2"},
      e("button",{type:"button", "aria-label":"Mês anterior", onClick:function(){ var t = new Date(ano, mes-1, 1); p.setMes([t.getFullYear(), t.getMonth()]); }, className:"h-[26px] rounded-md border border-border bg-[#1d1d21] px-2.5 text-[13px]"}, "◀"),
      e("span",{className:"flex items-baseline gap-2"}, e("b",{className:"text-[13px]"}, MESES[mes]+" de "+ano), e("span",{className:"text-[12px] font-semibold text-[#E8B84B]"}, doMes+" acertos")),
      e("button",{type:"button", "aria-label":"Próximo mês", onClick:function(){ var t = new Date(ano, mes+1, 1); p.setMes([t.getFullYear(), t.getMonth()]); }, className:"h-[26px] rounded-md border border-border bg-[#1d1d21] px-2.5 text-[13px]"}, "▶")),
    e("div",{className:"grid min-h-0 flex-1 grid-cols-7 gap-[3px]", style:{gridAutoRows:"minmax(0,1fr)"}},
      [].concat.apply([], sem).map(function(d, i){
        if(!d) return e("div",{key:i});
        var iso = isoDe(d), w = d.getDay(), n = porDia[iso] ? porDia[iso].n : 0, sel = iso===p.dia, hj = iso===hoje;
        return e("button",{key:i, type:"button", onClick:function(){ p.setDia(iso); }, title:NDIA[w]+" "+fmtDataBR(iso)+" · "+n+(n===1 ? " acerto" : " acertos"),
          className:"flex flex-col justify-center rounded-[7px] border px-1.5 text-left hover:border-[rgba(232,184,75,.55)] "+(sel ? "border-transparent ring-2 ring-[#E8B84B]" : "border-[#2c2c32]"), style:{background:calor(n, max) || (w===0 ? "#0f0f11" : "#18181b")}},
          e("span",{className:"flex w-full items-baseline justify-between"}, e("span",{className:"text-[10.5px] font-bold"}, NDIA3[w]), e("span",{className:"text-[13px] font-extrabold leading-none "+(hj ? "text-[#E8B84B]" : "")}, d.getDate())),
          e("span",{className:"mt-0.5 text-[15px] font-extrabold leading-none tabular-nums "+(n ? "" : "opacity-30")}, n || "—"));
      })));
}

// ── Painel do dia escolhido: total, acertos por representante e a lista de revendedoras
function PainelDoDia(p){
  var iso = p.dia, d = p.porDia[iso] || {n:0, reps:{}, lista:[]}, w = parteData(iso).getDay();
  var reps = Object.keys(d.reps).sort(function(a, b){ return d.reps[b]-d.reps[a] || a.localeCompare(b, "pt-BR"); });
  var lista = d.lista.slice().sort(function(a, b){ return a.representante.localeCompare(b.representante, "pt-BR") || a.nome.localeCompare(b.nome, "pt-BR"); });
  var dd = diasEntre(p.hojeIso, iso);
  return e("div",{className:"flex h-full flex-col gap-1.5"},
    e("div",{className:"flex flex-wrap items-baseline gap-x-3 gap-y-0.5"},
      e("b",{className:"text-[13px]"}, fmtDataBR(iso)+" · "+NDIA[w].toLowerCase()), e("span",{className:"text-[13px] font-extrabold text-[#E8B84B]"}, d.n+(d.n===1 ? " acerto" : " acertos")),
      e("span",{className:"text-[12px] "+(dd<0 ? "text-[#f87171]" : "")}, dd<0 ? Math.abs(dd)+" d atrás" : dd===0 ? "hoje" : "daqui a "+dd+" d")),
    reps.length>0 && e("div",{className:"flex flex-wrap gap-1"}, reps.map(function(k){ var on = p.repsSel.indexOf(k)>=0;
      return e("button",{key:k, type:"button", onClick:function(){ p.alternaRep(k); }, title:"Filtrar só "+k, className:"inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-[11.5px] "+(on ? "border-transparent font-bold" : BORDA+" bg-[#1d1d21]"), style:on ? BARRA_OURO : null}, curto(k), e("b",{className:"tabular-nums"}, d.reps[k])); })),
    e("div",{className:"min-h-0 flex-1 overflow-y-auto rounded-lg border "+BORDA},
      lista.length===0 ? e("p",{className:"p-3 text-center text-[13px] text-muted-foreground"}, "Nenhum acerto previsto neste dia"+(p.filtrando ? " com esses filtros." : "."))
      : lista.map(function(r, i){ return e("div",{key:r.cod, className:"grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_110px] items-center gap-2 border-b px-2 py-1 text-[12.5px] last:border-b-0 "+BORDA+(i%2 ? " bg-white/[.025]" : "")},
          e("b",{className:"truncate", title:r.nome}, r.nome), e("span",{className:"truncate text-muted-foreground", title:r.representante}, r.representante), e("span",{className:"truncate text-right tabular-nums"}, foneBonito(r.celular) || "—")); })));
}

// ── Calendário inteiro: mês grande, cada dia com o total e as representantes
function CalendarioGrande(p){
  var ano = p.mes[0], mes = p.mes[1], sem = semanasDoMes(ano, mes), porDia = p.porDia, hoje = p.hojeIso;
  var doMes = 0, max = 0; Object.keys(porDia).forEach(function(k){ if(k.slice(0,7)===ano+"-"+String(mes+1).padStart(2,"0")){ doMes += porDia[k].n; max = Math.max(max, porDia[k].n); } });
  var btn = "h-8 rounded-lg border border-border bg-[#1d1d21] px-3 text-[13px]";
  return e("div",{className:"overflow-hidden rounded-xl border bg-[#111113] "+BORDA},
    e("div",{className:"flex flex-wrap items-center gap-2 border-b px-3 py-2 "+BORDA},
      e("button",{type:"button", onClick:function(){ var t = new Date(ano, mes-1, 1); p.setMes([t.getFullYear(), t.getMonth()]); }, className:btn}, "◀ Mês anterior"),
      e("h3",{className:"min-w-[170px] text-center text-[15px] font-bold"}, MESES[mes]+" de "+ano),
      e("button",{type:"button", onClick:function(){ var t = new Date(ano, mes+1, 1); p.setMes([t.getFullYear(), t.getMonth()]); }, className:btn}, "Próximo mês ▶"),
      e("button",{type:"button", onClick:function(){ var t = parteData(hoje); p.setMes([t.getFullYear(), t.getMonth()]); }, className:btn}, "Hoje"),
      e("span",{className:"text-[13px] font-semibold text-[#E8B84B]"}, doMes+" acertos no mês"),
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
              var dd = diasEntre(hoje, r.prev), sel = r.prev===p.dia;
              return e("tr",{key:r.cod, onClick:function(){ p.irParaDia(r.prev); }, title:"Clique para ver o dia "+fmtDataBR(r.prev)+" no calendário", className:"h-8 cursor-pointer hover:bg-[rgba(232,184,75,.12)] "+(sel ? "bg-[rgba(232,184,75,.10)] " : i%2 ? "bg-white/[.025] " : "")},
                e("td",{className:cel, style:dd<0 ? {boxShadow:"inset 3px 0 #f87171"} : null}, i+1), e("td",{className:cel+" text-left font-semibold"}, r.nome), e("td",{className:cel}, foneBonito(r.celular) || "—"), e("td",{className:cel}, r.cod),
                e("td",{className:cel+" text-left"}, r.representante), e("td",{className:cel+" text-left"}, r.cidade ? r.cidade+(r.uf ? " / "+r.uf : "") : "—"), e("td",{className:cel}, r.kits),
                e("td",{className:cel}, dBR(r.emissao)), e("td",{className:cel+" font-semibold"}, dBR(r.prev)),
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

function AbaAgRevendedoras(){
  var hojeIso = isoDia(new Date());
  var ds = useState(null), dados = ds[0], setDados = ds[1], cs = useState(false), carregando = cs[0], setCarregando = cs[1], ms = useState(""), msg = ms[0], setMsg = ms[1];
  var carregar = function(forcar){
    if(!apiAtiva()){ setMsg("Precisa do servidor ligado (veja com o Leonardo)."); return; }
    setCarregando(true); setMsg(forcar ? "Buscando na DevMaster…" : "");
    chamar("GET", "/agenda-revendedoras"+(forcar ? "?atualizar=1" : "")).then(function(r){ setDados(r); setMsg(forcar ? "Atualizado: "+r.total+" revendedoras" : ""); }).catch(function(x){ setMsg(x.message); }).finally(function(){ setCarregando(false); });
  };
  var refCar = useRef(null); refCar.current = carregar;
  useEffect(function(){ refCar.current(false); var t = setInterval(function(){ refCar.current(false); }, 600000); return function(){ clearInterval(t); }; }, []);
  var itens = dados ? dados.itens : [];
  var fs = useState({}), fil = fs[0], setFil = fs[1], rs = useState([]), repsSel = rs[0], setRepsSel = rs[1], bs = useState(""), busca = bs[0], setBusca = bs[1];
  var vs = useState("lista"), visao = vs[0], setVisao = vs[1], ls = useState(200), limite = ls[0], setLimite = ls[1];
  var h0 = parteData(hojeIso), m1 = useState([h0.getFullYear(), h0.getMonth()]), mes = m1[0], setMes = m1[1], m2 = useState([h0.getFullYear(), h0.getMonth()]), mesG = m2[0], setMesG = m2[1], d1 = useState(hojeIso), dia = d1[0], setDia = d1[1];
  // representantes (com a quantidade de revendedoras de cada uma)
  var contaReps = {}; itens.forEach(function(r){ contaReps[r.representante] = (contaReps[r.representante]||0)+1; });
  var reps = Object.keys(contaReps).sort(function(a, b){ return a.localeCompare(b, "pt-BR"); }).map(function(n){ return {nome:n, n:contaReps[n]}; });
  var linhas = itens.filter(function(r){
    if(repsSel.length && repsSel.indexOf(r.representante)<0) return false;
    if(busca && r.nome.toLowerCase().indexOf(busca.toLowerCase())<0 && String(r.cod).indexOf(busca)<0) return false;
    return passa(r, fil, hojeIso); });
  var porDia = contar(linhas), filtrando = linhas.length!==itens.length;
  var escolherDia = function(iso){ setDia(iso); var t = parteData(iso); setMes([t.getFullYear(), t.getMonth()]); };
  var irParaDia = function(iso){ escolherDia(iso); setVisao("lista"); };
  var alternaRep = function(k){ setRepsSel(repsSel.indexOf(k)>=0 ? repsSel.filter(function(x){ return x!==k; }) : repsSel.concat([k])); };
  var limpaTudo = function(){ setFil({}); setRepsSel([]); setBusca(""); };
  var segBtn = function(k, t){ var on = visao===k; return e("button",{key:k, type:"button", onClick:function(){ setVisao(k); }, "aria-pressed":on, className:"h-8 px-3.5 text-[13px] font-semibold "+(on ? "" : "hover:bg-white/10"), style:on ? BARRA_OURO : null}, t); };
  var totalAcertos = linhas.length;
  return e(React.Fragment,null,
    e("div",{className:"flex flex-wrap items-end justify-between gap-3"},
      e(PageHead,{t:"Revendedoras com kit ativo", sub:(dados ? dados.total.toLocaleString("pt-BR") : "…")+" revendedoras · acerto previsto até "+(dados ? dados.janelaDias : 120)+" dias à frente · lidas da DevMaster"}),
      e("div",{className:"flex flex-wrap items-center gap-2"},
        e("div",{className:"inline-flex overflow-hidden rounded-lg border "+BORDA}, segBtn("lista","Lista"), segBtn("calendario","Calendário")),
        e("button",{type:"button", disabled:carregando, onClick:function(){ carregar(true); }, title:"Busca de novo na DevMaster (a tela se atualiza sozinha a cada 10 minutos)", className:"h-8 rounded-lg px-3.5 text-[13px] font-bold disabled:opacity-50", style:BARRA_OURO}, "↻ Atualizar da DevMaster"),
        (msg || carregando) && e("span",{className:"text-[12.5px]"}, carregando && !msg ? "Carregando da DevMaster…" : msg))),
    e("div",{className:"flex flex-wrap items-center gap-2"},
      e(SeletorReps,{reps:reps, sel:repsSel, setSel:setRepsSel}),
      e("input",{value:busca, placeholder:"Buscar revendedora (nome ou código)", className:INPUT+" h-8! w-[300px] text-[13px]!", onChange:function(ev){ setBusca(ev.target.value); }}),
      filtrando && e("button",{type:"button", onClick:limpaTudo, className:"text-[12.5px] text-[#E8B84B]"}, "Limpar todos os filtros"),
      e("span",{className:"text-[13px]"}, e("b",{className:"tabular-nums text-[#E8B84B]"}, totalAcertos.toLocaleString("pt-BR")), filtrando ? " de "+itens.length.toLocaleString("pt-BR")+" revendedoras no filtro" : " revendedoras")),
    visao==="lista"
      ? e("div",{className:"flex flex-col gap-3"},
          e("div",{className:"grid gap-3 lg:grid-cols-[560px_minmax(0,1fr)]", style:{minHeight:ALTURA}},
            e("div",{style:{height:ALTURA}}, e(CalendarioTopo,{porDia:porDia, dia:dia, setDia:escolherDia, mes:mes, setMes:setMes, hojeIso:hojeIso})),
            e("div",{className:"overflow-hidden", style:{height:ALTURA}}, e(PainelDoDia,{porDia:porDia, dia:dia, hojeIso:hojeIso, repsSel:repsSel, alternaRep:alternaRep, filtrando:filtrando}))),
          e(TabelaRevendedoras,{linhas:linhas, total:itens.length, carregando:carregando, fil:fil, setFil:setFil, hojeIso:hojeIso, todasReps:reps.map(function(r){ return r.nome; }), dia:dia, irParaDia:irParaDia, limite:limite, maisLinhas:function(){ setLimite(limite+200); }}))
      : e(CalendarioGrande,{porDia:porDia, mes:mesG, setMes:setMesG, hojeIso:hojeIso, irParaDia:irParaDia}));
}

export { AbaAgRevendedoras };

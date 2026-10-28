// Sorelly Admin — pages/RevendedorasInternas.js
// Kits → Atendimento interno → Revendedoras. Controle das revendedoras que acertam na própria Sorelly:
// tabela (ciclo, vendas, próxima data, situação) e calendário em tela cheia com o que está agendado por dia.
// A agendadora trabalha por aqui: contata, agenda, confirma na véspera e manda o lembrete (textos prontos).
import { modalidadeDe } from "@/apps/montagem/domain/consignado";
import { CICLOS, SITUACOES, avaliarKit, MEDIA_MINIMA_SORELLY, mediaTres, kitDaMedia, diasEntre, fmtDataBR, isoDe, mensagens, proximoAcerto, emAlerta } from "@/apps/montagem/domain/revendedoras-internas";
import { BK, isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { CampoDinheiro } from "@/apps/montagem/mobile/campos";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { e, useState } from "@/shared/react";
import React from "react";

var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
var COR_CICLO = {30:"#22C55E", 45:"#F59E0B", 60:"#8B5CF6"};
var th = function(t){ return e("th",{key:t, className:"whitespace-nowrap border-b border-r border-border px-3 py-3 text-center text-[12.5px] font-semibold uppercase tracking-wide last:border-r-0"}, t); };
var td = function(v, c){ return e("td",{className:"whitespace-nowrap border-r border-border/60 px-3 py-3 text-center text-[14px] last:border-r-0 "+(c||"")}, v); };
var dash = e("span",{className:"text-muted-foreground"},"—");
var dinheiro = function(v){ return v==null ? dash : BK(v); };

// bolinha colorida do ciclo (30 verde · 45 âmbar · 60 roxo)
function IconeCiclo(p){
  return e("span",{title:"Ciclo de "+p.n+" dias"+(p.manual ? " · data digitada à mão" : ""), className:"inline-flex items-center gap-1"},
    e("span",{className:"grid size-8 place-items-center rounded-full text-[13px] font-extrabold text-[#111]", style:{background:COR_CICLO[p.n]}}, p.n),
    p.manual && e("span",{className:"text-[11px] text-muted-foreground"},"✎"));
}
// ouro (Kit Normal) ou prata (Kit 100% Prata)
function IconeKit(p){
  var prata = p.prata;
  return e("span",{title:prata ? "Kit 100% Prata" : "Kit Normal", className:"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold ring-1 "+(prata ? "bg-slate-300/20 text-slate-200 ring-slate-300/50" : "bg-primary/15 text-primary ring-primary/40")},
    e("span",{className:"size-3 rounded-full", style:{background:prata ? "linear-gradient(135deg,#F1F5F9,#94A3B8)" : "linear-gradient(135deg,#F1E4C6,#B8862B)"}}), prata ? "Prata" : "Normal");
}
// variação da venda em relação ao mês anterior
function Variacao(p){
  if(p.novo==null || p.ant==null || !p.ant) return null;
  var pct = Math.round((p.novo/p.ant-1)*100); if(pct===0) return e("span",{className:"text-[11.5px] text-muted-foreground"},"=");
  return e("span",{className:"text-[11.5px] font-bold "+(pct>0 ? "text-success" : "text-destructive")}, (pct>0 ? "▲ " : "▼ ")+Math.abs(pct)+"%");
}
function Par(p){   // venda e acerto de um mês, lado a lado
  return e("div",{className:"flex flex-col items-center leading-tight"},
    e("span",{className:MONO+" text-[13px]"}, dinheiro(p.h && p.h.venda)),
    e("span",{className:MONO+" text-[12px] text-muted-foreground"}, dinheiro(p.h && p.h.acerto)));
}

function copiar(txt){ try { navigator.clipboard.writeText(txt); } catch(err){ /* sem permissão: o texto continua na caixa para copiar à mão */ } }

// Histórico de vendas da cliente: SEM limite (serve para anos). Cada acerto novo entra aqui e a média dos últimos 5 meses sai sozinha na Atendimento Sorelly.
function Historico(p){
  var r = p.r, d = p.d, f0 = useState({data:"", venda:null, acerto:null}), f = f0[0], setF = f0[1], ed0 = useState(null), editando = ed0[0], setEditando = ed0[1];   // editando = posição da linha em edição
  var lista = r.hist.map(function(h, i){ return {h:h, i:i}; }).filter(function(x){ return x.h.data || x.h.venda!=null; });
  var av = avaliarKit(r.hist, 0, p.cfg, p.hojeIso.slice(0,7));
  var ok = f.data && f.venda>0;
  var add = function(){ if(!ok) return; d({type:"REVINT_VENDA_ADD", id:r.id, data:f.data, venda:f.venda, acerto:f.acerto}); setF({data:"", venda:null, acerto:null}); };
  var CP = INPUT+" h-9! text-sm! text-center! "+MONO;
  return e("div",{className:"flex flex-col gap-2 rounded-xl bg-card p-3 ring-1 ring-border md:col-span-2 xl:col-span-4"},
    e("div",{className:"flex flex-wrap items-center justify-between gap-2"},
      e("b",{className:"text-[12.5px] uppercase tracking-wide text-primary"}, "Histórico de vendas ("+lista.length+")"),
      e("span",{className:"text-[12.5px] "+(av.motivo ? "text-destructive" : "text-muted-foreground")}, av.media!==null ? "Média dos últimos meses anteriores: "+BK(av.media)+(av.motivo ? " · "+av.motivo : "") : "Sem vendas cadastradas")),
    e("div",{className:"grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]"},
      e("div",{className:"max-h-60 overflow-y-auto rounded-lg border border-border/60"},
        lista.length===0 ? e("p",{className:"p-3 text-[13px] text-muted-foreground"},"Nenhuma venda ainda: lance as últimas vendas (pode ser quantas quiser) para a média ficar automática.")
        : e("table",{className:"w-full border-collapse text-[13.5px]"},
            e("thead",null, e("tr",{className:"bg-sidebar"}, ["Data","Valor de venda","Valor de acerto",""].map(function(t){ return e("th",{key:t, className:"px-3 py-2 text-center text-[12px] font-semibold uppercase"}, t); }))),
            e("tbody",null, lista.map(function(x){ var set = function(patch){ d({type:"REVINT_VENDA_SET", id:r.id, idx:x.i, patch:patch}); }, CE = INPUT+" h-8! w-32 text-[13px]! text-center! "+MONO, on = editando===x.i;
              return e("tr",{key:x.i, className:"border-t border-border/50 "+(on ? "bg-primary/10" : "")},
                e("td",{className:"px-3 py-1.5 text-center "+MONO}, on ? e("input",{type:"date", value:x.h.data||"", "aria-label":"Data da venda", className:INPUT+" h-8! w-36 text-[13px]! "+MONO, onChange:function(ev){ set({data:ev.target.value||null}); }}) : fmtDataBR(x.h.data)),
                e("td",{className:"px-3 py-1.5 text-center "+MONO}, on ? e(CampoDinheiro,{value:x.h.venda, label:"Valor de venda", className:CE, onChange:function(v){ set({venda:v}); }}) : dinheiro(x.h.venda)),
                e("td",{className:"px-3 py-1.5 text-center "+MONO+" text-primary"}, on ? e(CampoDinheiro,{value:x.h.acerto, label:"Valor de acerto", className:CE+" text-primary!", onChange:function(v){ set({acerto:v}); }}) : dinheiro(x.h.acerto)),
                e("td",{className:"whitespace-nowrap px-2 py-1.5 text-center"},
                  on ? e("button",{type:"button", onClick:function(){ setEditando(null); d({type:"REVINT_VENDA_ORDENAR", id:r.id}); }, className:"h-8 rounded-lg bg-primary px-3 text-[12.5px] font-bold text-primary-foreground"}, "OK")
                     : e("button",{type:"button", onClick:function(){ setEditando(x.i); }, className:"h-8 rounded-lg bg-white/10 px-3 text-[12.5px] font-semibold hover:bg-white/15"}, "Editar"),
                  e("button",{type:"button", "aria-label":"Remover venda", onClick:function(){ if(on) setEditando(null); d({type:"REVINT_VENDA_DEL", id:r.id, idx:x.i}); }, className:"ml-1 px-1.5 text-[13px] text-muted-foreground hover:text-destructive"}, "×"))); })))),
      e("div",{className:"flex flex-col gap-2"},
        e("span",{className:"text-[12px] text-muted-foreground"},"Acrescentar venda anterior"),
        e("input",{type:"date", value:f.data, "aria-label":"Data da venda", className:CP, onChange:function(ev){ setF(Object.assign({}, f, {data:ev.target.value})); }}),
        e(CampoDinheiro,{value:f.venda, label:"Valor de venda", className:CP, onChange:function(v){ setF(Object.assign({}, f, {venda:v})); }}),
        e(CampoDinheiro,{value:f.acerto, label:"Valor de acerto", className:CP, onChange:function(v){ setF(Object.assign({}, f, {acerto:v})); }}),
        e("button",{type:"button", disabled:!ok, onClick:add, className:"h-9 rounded-lg bg-primary px-3 text-[13px] font-bold text-primary-foreground disabled:opacity-50"}, "Adicionar ao histórico"))));
}

function Detalhes(p){
  var r = p.r, cx = p.cx, s = cx.state, d = cx.dispatch, hojeIso = p.hojeIso;
  var ms = useState(null), msgAberta = ms[0], setMsgAberta = ms[1];
  var cp = useState(false), copiado = cp[0], setCopiado = cp[1];
  var ag = useState({data:(r.agend && r.agend.data) || proximoAcerto(r), hora:(r.agend && r.agend.hora) || "10:00"}), form = ag[0], setForm = ag[1];
  var prata = modalidadeDe(s, r.nome)==="prata";
  var set = function(patch){ d({type:"REVINT_SET", id:r.id, patch:patch}); };
  var msgs = mensagens(Object.assign({}, r, {agend:{data:form.data, hora:form.hora}}), hojeIso);
  var btn = function(on, cor){ return "h-9 rounded-lg px-3 text-[13px] font-bold ring-1 "+(on ? cor : "bg-card text-muted-foreground ring-border hover:bg-muted/50"); };
  var bloco = function(tit, filhos){ return e("div",{className:"flex flex-col gap-2 rounded-xl bg-card p-3 ring-1 ring-border"}, e("b",{className:"text-[12.5px] uppercase tracking-wide text-primary"}, tit), filhos); };
  return e("div",{className:"grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-4"},
    bloco("Cadastro da cliente", e(React.Fragment,null,
      e("div",{className:"flex flex-col gap-1 text-[13.5px]"}, e("span",{className:"text-[12px] text-muted-foreground"},"Contatos de referência"),
        r.contatos.map(function(c,i){ return e("span",{key:i}, e("b",null,c.nome+": "), e("span",{className:MONO}, c.fone)); })),
      e("div",{className:"flex flex-col gap-1"}, e("span",{className:"text-[12px] text-muted-foreground"},"Kit (acerto, kit novo ou reposição)"),
        e("div",{className:"flex gap-2"}, ["Acerto","Kit novo","Reposição"].map(function(t){ var on = (r.tipo||"Acerto")===t; return e("button",{key:t, type:"button", onClick:function(){ set({tipo:t}); }, className:btn(on,"bg-primary/20 text-primary ring-primary/50")}, t); }))),
      e("div",{className:"flex flex-col gap-1"}, e("span",{className:"text-[12px] text-muted-foreground"},"Modalidade (Normal ou 100% Prata)"),
        e("div",{className:"flex gap-2"},
          e("button",{type:"button", onClick:function(){ if(prata) d({type:"SET_MODALIDADE", chave:r.nome, modalidade:"padrao", por:"agendamento", origem:"interno"}); }, className:btn(!prata,"bg-primary/20 text-primary ring-primary/50")}, "Normal"),
          e("button",{type:"button", onClick:function(){ if(!prata) d({type:"SET_MODALIDADE", chave:r.nome, modalidade:"prata", por:"agendamento", origem:"interno"}); }, className:btn(prata,"bg-slate-300/25 text-slate-100 ring-slate-300/60")}, "100% Prata")))
    )),
    bloco("Ciclo e próxima data", e(React.Fragment,null,
      e("div",{className:"flex gap-2"}, CICLOS.map(function(n){ var on = r.ciclo===n;
        return e("button",{key:n, type:"button", onClick:function(){ set({ciclo:n, proximoManual:null}); }, "aria-pressed":on,
          className:"grid h-10 w-14 place-items-center rounded-lg text-[14px] font-extrabold ring-2 "+(on ? "text-[#111]" : "bg-card text-muted-foreground ring-border"), style:on ? {background:COR_CICLO[n], boxShadow:"0 0 0 2px "+COR_CICLO[n]} : null}, n+"d"); })),
      e("label",{className:"flex flex-col gap-1 text-[12px] text-muted-foreground"}, "Data à mão (substitui o ciclo)",
        e("div",{className:"flex gap-2"},
          e("input",{type:"date", value:r.proximoManual||"", className:INPUT+" h-9! text-sm!", onChange:function(ev){ set({proximoManual:ev.target.value||null}); }}),
          r.proximoManual && e("button",{type:"button", onClick:function(){ set({proximoManual:null}); }, className:"rounded-lg bg-white/10 px-2.5 text-[12.5px] font-semibold hover:bg-white/15"}, "Voltar ao ciclo"))))),
    bloco("Agendamento", e(React.Fragment,null,
      e("div",{className:"flex gap-2"},
        e("input",{type:"date", value:form.data, className:INPUT+" h-9! text-sm!", onChange:function(ev){ setForm(Object.assign({}, form, {data:ev.target.value})); }}),
        e("input",{type:"time", value:form.hora, className:INPUT+" h-9! w-28 text-sm!", onChange:function(ev){ setForm(Object.assign({}, form, {hora:ev.target.value})); }})),
      e("div",{className:"flex flex-wrap gap-2"},
        e("button",{type:"button", disabled:!form.data||!form.hora, onClick:function(){ d({type:"REVINT_AGENDAR", id:r.id, data:form.data, hora:form.hora}); }, className:"h-9 rounded-lg bg-primary px-3 text-[13px] font-bold text-primary-foreground disabled:opacity-50"}, r.agend ? "Atualizar agendamento" : "Agendar"),
        r.agend && e("button",{type:"button", onClick:function(){ d({type:"REVINT_CANCELAR", id:r.id}); }, className:"h-9 rounded-lg bg-white/10 px-3 text-[13px] font-semibold hover:bg-white/15"}, "Cancelar agendamento"),
        r.agend && e("button",{type:"button", onClick:function(){ d({type:"REVINT_ATENDIDA", id:r.id}); }, className:"h-9 rounded-lg bg-success/20 px-3 text-[13px] font-bold text-success ring-1 ring-success/40 hover:bg-success/30"}, "✓ Acerto feito")))),
    bloco("Mensagens prontas", e(React.Fragment,null,
      e("div",{className:"flex flex-wrap gap-2"}, msgs.map(function(m){ var on = msgAberta===m.k;
        return e("button",{key:m.k, type:"button", onClick:function(){ setMsgAberta(on ? null : m.k); setCopiado(false); }, className:btn(on,"bg-info/20 text-info ring-info/50")}, m.t); })),
      msgAberta && (function(){ var m = msgs.find(function(x){ return x.k===msgAberta; });
        return e("div",{className:"flex flex-col gap-2"},
          e("textarea",{readOnly:true, value:m.x, rows:5, className:INPUT+" h-auto! py-2 text-[13px]!"}),
          e("button",{type:"button", onClick:function(){ copiar(m.x); setCopiado(true); }, className:"h-9 rounded-lg bg-primary px-3 text-[13px] font-bold text-primary-foreground"}, copiado ? "✓ Copiado" : "Copiar mensagem")); })()
    )),
    e(Historico,{r:r, d:d, cfg:s.cfg, hojeIso:hojeIso}));
}

function Tabela(p){
  var s = p.s, d = p.d, hojeIso = p.hojeIso, cx = p.cx;
  var ab = useState(null), aberto = ab[0], setAberto = ab[1];
  var lista = p.lista;
  // arrastar a planilha para o lado: clica no meio, segura e arrasta
  var scrollRef = React.useRef(null), arr = React.useRef({x:0, sl:0, down:false, moved:false});
  var aoPressionar = function(ev){ if(ev.button!==0 || /INPUT|SELECT|TEXTAREA/.test(ev.target.tagName) || !scrollRef.current) return; arr.current = {x:ev.clientX, sl:scrollRef.current.scrollLeft, down:true, moved:false}; };
  var aoMover = function(ev){ var a = arr.current; if(!a.down || !scrollRef.current) return; var dx = ev.clientX-a.x; if(Math.abs(dx)>5 && !a.moved){ a.moved = true; scrollRef.current.style.userSelect = "none"; } if(a.moved) scrollRef.current.scrollLeft = a.sl-dx; };
  var aoSoltar = function(){ arr.current.down = false; if(scrollRef.current) scrollRef.current.style.userSelect = ""; };
  var aoClicar = function(ev){ if(arr.current.moved){ ev.preventDefault(); ev.stopPropagation(); arr.current.moved = false; } };
  var tabela = e("div",{ref:scrollRef, onMouseDown:aoPressionar, onMouseMove:aoMover, onMouseUp:aoSoltar, onMouseLeave:aoSoltar, onClickCapture:aoClicar, title:"Clique no meio, segure e arraste para o lado", className:"cursor-grab overflow-x-auto rounded-xl border border-border bg-card active:cursor-grabbing"},
    e("table",{className:"w-full min-w-max border-collapse"},
      e("thead",{className:"sticky top-0 z-10"}, e("tr",{className:"bg-sidebar"},
        ["Data do acerto","Hora","Nome","Cód. DevMaster","Telefone / WhatsApp","Kit","Ciclo","Data última venda","Última venda","Último acerto","Penúltima venda","Penúltimo acerto","Média 3 vendas","Próximo kit","Próximo acerto","Faltam","Situação"].map(th))),
      e("tbody",null, lista.map(function(r){
        var prox = proximoAcerto(r), dias = diasEntre(hojeIso, prox), alerta = emAlerta(r, hojeIso), sit = SITUACOES.find(function(x){ return x.k===r.situacao; });
        var h0 = r.hist[0] || {}, h1 = r.hist[1], h2 = r.hist[2], on = aberto===r.id;
        var corDias = dias<0 ? "bg-destructive/20 text-destructive ring-destructive/50" : dias<=5 ? "bg-warning/20 text-warning ring-warning/50" : "bg-muted/50 text-foreground ring-border";
        return e(React.Fragment,{key:r.id},
          e("tr",{onClick:function(){ setAberto(on ? null : r.id); }, className:"cursor-pointer border-b border-border/60 hover:bg-muted/30 "+(on ? "bg-primary/10 " : "")+(alerta ? "bg-destructive/10" : "")},
            td(fmtDataBR(r.agend ? r.agend.data : null), MONO), td(r.agend ? r.agend.hora : dash, MONO),
            td(e("span",{className:"flex items-center gap-2 font-bold"}, e("span",{className:"text-[11px] text-muted-foreground"}, on ? "▼" : "▶"), r.nome)),
            td(r.devmaster || dash, MONO), td((r.contatos[0] && r.contatos[0].fone) || dash, MONO),
            td(e("span",{className:"rounded-full bg-primary/15 px-2.5 py-1 text-[12px] font-bold text-primary ring-1 ring-primary/40"}, r.tipo || "Acerto")), td(e(IconeCiclo,{n:r.ciclo, manual:!!r.proximoManual})),
            td(fmtDataBR(h0.data), MONO), td(e("span",{className:"flex items-center justify-center gap-2"}, e("span",{className:MONO+" font-semibold"}, dinheiro(h0.venda)), e(Variacao,{novo:h0.venda, ant:h1 && h1.venda}))), td(dinheiro(h0.acerto), MONO+" font-semibold text-primary"),
            td(dinheiro(h1 && h1.venda), MONO), td(dinheiro(h1 && h1.acerto), MONO+" text-primary"),
            (function(){ var m = mediaTres(r.hist), kit = m ? kitDaMedia(m.media, s.cfg) : null;
              return e(React.Fragment,null, td(m ? e("span",{title:m.n+(m.n===1 ? " venda" : " vendas")+" na média"}, dinheiro(m.media), m.n<3 && e("span",{className:"ml-1 text-[11px] text-muted-foreground"},"("+m.n+")")) : dash, MONO+" font-semibold"),
                td(kit!=null ? dinheiro(kit) : m ? e("span",{title:"Média abaixo de "+BK(MEDIA_MINIMA_SORELLY)+": kit novo não liberado"},"Não libera") : dash, MONO+" font-semibold "+(kit!=null ? "text-primary" : "text-destructive"))); })(),
            td(e("b",{className:MONO}, fmtDataBR(prox))),
            td(e("span",{className:"inline-block rounded-md px-2 py-0.5 text-[12.5px] font-bold ring-1 "+corDias}, dias<0 ? Math.abs(dias)+" d atrasada" : dias===0 ? "hoje" : dias+" d")),
            td(e("span",{className:"inline-flex flex-col items-center gap-0.5"},
              e("span",{className:"rounded-full px-2.5 py-0.5 text-[12px] font-bold ring-1 "+sit.cor}, sit.t),
              r.agend && e("span",{className:MONO+" text-[11.5px] text-muted-foreground"}, fmtDataBR(r.agend.data)+" · "+r.agend.hora)))),
          );
      }))));
  var rSel = lista.find(function(r){ return r.id===aberto; });
  return e("div",{className:"flex flex-col gap-3"},
    rSel && e("section",{className:"rounded-xl border border-primary/50 bg-muted/20"},
      e("div",{className:"flex items-center justify-between gap-3 border-b border-border px-4 py-2.5"},
        e("h2",{className:"font-heading text-[17px] font-bold"}, rSel.nome),
        e("button",{type:"button", onClick:function(){ setAberto(null); }, className:"h-8 rounded-lg bg-white/10 px-3 text-[13px] font-semibold hover:bg-white/15"}, "Fechar")),
      e(Detalhes,{key:rSel.id, r:rSel, cx:cx, hojeIso:hojeIso})),
    tabela);
}

function Calendario(p){
  var hojeIso = p.hojeIso, lista = p.lista;
  var mm = useState(hojeIso.slice(0,7)), mes = mm[0], setMes = mm[1];
  var dsel = useState(hojeIso), dia = dsel[0], setDia = dsel[1];
  var ano = +mes.slice(0,4), m0 = +mes.slice(5,7)-1;
  var primeiro = new Date(ano, m0, 1), nDias = new Date(ano, m0+1, 0).getDate();
  var troca = function(n){ var dt = new Date(ano, m0+n, 1); setMes(isoDe(dt).slice(0,7)); };
  // agendadas (data+hora marcadas) e "vencem" (próxima data pelo ciclo, ainda sem agendamento)
  var porDia = {};
  lista.forEach(function(r){
    if(r.agend){ (porDia[r.agend.data] = porDia[r.agend.data] || {ag:[], vc:[]}).ag.push(r); }
    else { var px = proximoAcerto(r); (porDia[px] = porDia[px] || {ag:[], vc:[]}).vc.push(r); }
  });
  var celulas = []; for(var i=0;i<primeiro.getDay();i++) celulas.push(null); for(var n=1;n<=nDias;n++) celulas.push(mes+"-"+String(n).padStart(2,"0"));
  while(celulas.length%7) celulas.push(null);
  var totMesAg = 0, totMesVc = 0; Object.keys(porDia).forEach(function(k){ if(k.slice(0,7)===mes){ totMesAg += porDia[k].ag.length; totMesVc += porDia[k].vc.length; } });
  var sel = porDia[dia] || {ag:[], vc:[]};
  var navBtn = "h-10 rounded-lg bg-white/10 px-4 text-[15px] font-bold hover:bg-white/15";
  return e("div",{className:"flex flex-col gap-3"},
    e("div",{className:"flex flex-wrap items-center justify-between gap-3"},
      e("div",{className:"flex items-center gap-2"},
        e("button",{type:"button", "aria-label":"Mês anterior", onClick:function(){ troca(-1); }, className:navBtn}, "◀"),
        e("h2",{className:"min-w-48 text-center font-heading text-[22px] font-bold"}, MESES[m0]+" de "+ano),
        e("button",{type:"button", "aria-label":"Próximo mês", onClick:function(){ troca(1); }, className:navBtn}, "▶"),
        e("button",{type:"button", onClick:function(){ setMes(hojeIso.slice(0,7)); setDia(hojeIso); }, className:navBtn+" text-[13px]!"}, "Hoje")),
      e("div",{className:"flex gap-2 text-[13px]"},
        e("span",{className:"rounded-lg bg-primary/20 px-3 py-1.5 font-bold text-primary ring-1 ring-primary/40"}, totMesAg+" agendadas no mês"),
        e("span",{className:"rounded-lg bg-muted/50 px-3 py-1.5 font-bold ring-1 ring-border"}, totMesVc+" vencem sem agendar"))),
    e("div",{className:"overflow-hidden rounded-xl border border-border bg-card"},
      e("div",{className:"grid grid-cols-7 bg-sidebar"}, SEMANA.map(function(t){ return e("div",{key:t, className:"border-r border-border px-2 py-2.5 text-center text-[13px] font-semibold uppercase tracking-wide last:border-r-0"}, t); })),
      e("div",{className:"grid grid-cols-7"}, celulas.map(function(iso, i){
        if(!iso) return e("div",{key:"v"+i, className:"min-h-[8.5rem] border-b border-r border-border/50 bg-muted/10"});
        var info = porDia[iso] || {ag:[], vc:[]}, ehHoje = iso===hojeIso, ehSel = iso===dia, passou = iso<hojeIso;
        var ags = info.ag.slice().sort(function(a,b){ return a.agend.hora.localeCompare(b.agend.hora); });
        return e("button",{key:iso, type:"button", onClick:function(){ setDia(iso); }, "aria-label":"Dia "+fmtDataBR(iso),
          className:"flex min-h-[8.5rem] flex-col gap-1 border-b border-r border-border/50 p-2 text-left align-top transition-colors hover:bg-primary/10 "+(ehSel ? "bg-primary/15 ring-2 ring-inset ring-primary" : passou ? "bg-black/20" : "")},
          e("span",{className:"flex items-center justify-between"},
            e("span",{className:"grid size-7 place-items-center rounded-full text-[14px] font-bold "+(ehHoje ? "bg-primary text-primary-foreground" : "")}, +iso.slice(8)),
            ags.length>0 && e("span",{className:"rounded-full bg-primary px-2 py-0.5 text-[12px] font-extrabold text-primary-foreground"}, ags.length)),
          ags.slice(0,3).map(function(r){ return e("span",{key:r.id, className:"truncate rounded bg-primary/15 px-1.5 py-0.5 text-[11.5px] text-primary"}, r.agend.hora+" "+r.nome.split(" ")[0]); }),
          ags.length>3 && e("span",{className:"text-[11px] text-muted-foreground"},"+"+(ags.length-3)+" mais"),
          info.vc.length>0 && e("span",{className:"mt-auto rounded bg-muted/60 px-1.5 py-0.5 text-[11.5px] "+(passou ? "text-destructive" : "text-muted-foreground")}, info.vc.length+(info.vc.length===1 ? " vence" : " vencem")));
      }))),
    e("section",{className:"rounded-xl border border-border bg-card p-4"},
      e("h3",{className:"mb-2 font-heading text-[17px] font-bold"}, "Dia "+fmtDataBR(dia)+" · "+sel.ag.length+" agendadas"+(sel.vc.length ? " · "+sel.vc.length+" vencem sem agendar" : "")),
      sel.ag.length===0 && sel.vc.length===0 ? e("p",{className:"text-[14px] text-muted-foreground"},"Nada agendado nem vencendo neste dia.")
      : e("div",{className:"flex flex-col gap-1.5"},
          sel.ag.slice().sort(function(a,b){ return a.agend.hora.localeCompare(b.agend.hora); }).map(function(r){ var sit = SITUACOES.find(function(x){ return x.k===r.situacao; });
            return e("div",{key:r.id, className:"flex flex-wrap items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-[14px]"},
              e("b",{className:MONO+" w-14"}, r.agend.hora), e("b",{className:"min-w-60 flex-1"}, r.nome), e(IconeKit,{prata:p.prataDe(r.nome)}), e(IconeCiclo,{n:r.ciclo}),
              e("span",{className:"rounded-full px-2.5 py-0.5 text-[12px] font-bold ring-1 "+sit.cor}, sit.t)); }),
          sel.vc.map(function(r){ return e("div",{key:r.id, className:"flex flex-wrap items-center gap-3 rounded-lg bg-muted/30 px-3 py-2 text-[14px]"},
            e("span",{className:"w-14 text-muted-foreground"},"—"), e("b",{className:"min-w-60 flex-1"}, r.nome), e(IconeKit,{prata:p.prataDe(r.nome)}), e(IconeCiclo,{n:r.ciclo}),
            e("span",{className:"text-[12.5px] text-muted-foreground"},"vence neste dia · ainda sem horário")); }))));
}

function AbaRevendedorasInternas(){
  var cx = use(), s = cx.state, hojeIso = isoDia(new Date());
  // DevMaster: busca no servidor as revendedoras da representante Sorelly (código 02) e cadastra aqui as que ainda não existem
  var sdm = useState(""), msgDm = sdm[0], setMsgDm = sdm[1], cdm = useState(false), buscandoDm = cdm[0], setBuscandoDm = cdm[1];
  var buscarDm = function(){
    if(!apiAtiva()){ setMsgDm("Precisa do servidor ligado (veja com o Leonardo)."); return; }
    setBuscandoDm(true); setMsgDm("Buscando na DevMaster…");
    chamar("GET", "/revendedoras?rep=02&atualizar=1").then(function(r){
      var itens = (r.itens||[]).map(function(i){ var kp = (i.conds||[]).filter(function(c){ return (r.vendedores||["02"]).indexOf(c.vd)>=0 && c.d; }).sort(function(a,b){ return (a.e||"").localeCompare(b.e||""); })[0];   // o condicional aberto do vendedor 02 (o mais antigo) dá a previsão e o plano
        return {cod:i.cod, nome:i.nome, celular:i.celular, cidade:i.cidade, vendas:i.vendas||[], prevDevol:kp && kp.d || "", emissao:kp && kp.e || ""}; });
      cx.dispatch({type:"REVINT_ADD_LOTE", itens:itens}); setMsgDm(itens.length+" revendedoras do vendedor Sorelly (02)"+(r.brinde && r.brinde.pronto===false ? " · vendas ainda calculando, busque de novo em 1 minuto" : "")); }).catch(function(x){ setMsgDm(x.message); }).finally(function(){ setBuscandoDm(false); });
  };
  var vs = useState("tabela"), visao = vs[0], setVisao = vs[1];
  var bs = useState(""), busca = bs[0], setBusca = bs[1];
  var fs = useState("todas"), fSit = fs[0], setFSit = fs[1];
  var todas = s.revInternas || [];
  var b = busca.trim().toLowerCase();
  var lista = todas.filter(function(r){ return (!b || r.nome.toLowerCase().indexOf(b)>=0) && (fSit==="todas" || (fSit==="alerta" ? emAlerta(r, hojeIso) : r.situacao===fSit)); })
    .sort(function(a,c){ return proximoAcerto(a).localeCompare(proximoAcerto(c)); });
  var nAlerta = todas.filter(function(r){ return emAlerta(r, hojeIso); }).length;
  var aba = function(k, t, ic){ var on = visao===k;
    return e("button",{key:k, type:"button", onClick:function(){ setVisao(k); }, "aria-pressed":on, className:"flex h-10 items-center gap-2 rounded-lg px-4 text-[14px] font-bold "+(on ? "bg-primary text-primary-foreground" : "bg-white/10 hover:bg-white/15")}, e(Icon,{n:ic, s:16}), t); };
  return e(React.Fragment,null,
    e("div",{className:"flex flex-wrap items-end justify-between gap-3"},
      e(PageHead,{t:"Revendedoras internas", sub:"Quem acerta aqui na Sorelly: ciclo, próxima data, agendamento e mensagens prontas"}),
      e("div",{className:"flex flex-wrap items-center gap-2"}, aba("tabela","Tabela","lista"), aba("calendario","Calendário","calendario"),
        e("button",{type:"button", disabled:buscandoDm, onClick:buscarDm, title:"Busca na DevMaster as revendedoras da representante Sorelly (código 02) e cadastra as que faltam", className:"flex h-10 items-center gap-2 rounded-lg bg-white/10 px-4 text-[14px] font-bold hover:bg-white/15 disabled:opacity-50"}, "↻ Buscar da DevMaster"),
        msgDm && e("span",{className:"text-[12.5px] text-white/80"}, msgDm))),
    visao==="tabela" && e("div",{className:"flex flex-wrap items-center gap-2"},
      e("div",{className:"relative"}, e(Icon,{n:"search", s:16, className:"pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"}),
        e("input",{className:INPUT+" h-10! w-60 pl-9 text-sm!", placeholder:"Buscar revendedora", value:busca, onChange:function(ev){ setBusca(ev.target.value); }})),
      e("select",{value:fSit, "aria-label":"Situação", className:INPUT+" h-10! cursor-pointer text-sm!", onChange:function(ev){ setFSit(ev.target.value); }},
        e("option",{value:"todas"},"Todas as situações"), e("option",{value:"alerta"},"Em alerta (até 5 dias, sem contato)"), SITUACOES.map(function(x){ return e("option",{key:x.k, value:x.k}, x.t); })),
      e("span",{className:"rounded-lg px-3 py-2 text-[13px] font-bold ring-1 "+(nAlerta>0 ? "bg-destructive/15 text-destructive ring-destructive/40" : "bg-muted/40 ring-border")}, nAlerta+" em alerta"),
      e("span",{className:"text-[12.5px] text-muted-foreground"},"Clique na linha para abrir o cadastro, agendar e copiar as mensagens.")),
    visao==="tabela"
      ? e(Tabela,{s:s, d:cx.dispatch, cx:cx, lista:lista, hojeIso:hojeIso})
      : e(Calendario,{lista:todas, hojeIso:hojeIso, prataDe:function(n){ return modalidadeDe(s, n)==="prata"; }}));
}

export { AbaRevendedorasInternas };

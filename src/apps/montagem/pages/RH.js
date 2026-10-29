// Sorelly Admin · montagem — pages/RH.js
// Recursos Humanos trazido do SorellyAdmin: Visão geral (ABS e TO), Presença diária, Relatório diário, Colaboradores, Advertências, Controle de experiência, Horas extras e Configurador.
// As regras e as contas ficam em domain/rh.js; aqui só as telas. Salário e custo de hora extra só aparecem para a supervisão (sócios e RH).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { grupoDe, nomeDe } from "@/apps/montagem/domain/equipe";
import { FUNCIONARIOS_POR_SETOR } from "@/apps/montagem/domain/pessoas";
import { CODIGOS, DIAS_SEMANA, MESES, STATUS, TIPOS_DESLIG, advertenciasComSeq, br, colaboradoresRh, dataIso, desligadosDoPeriodo, diaEscalado, diaSem, experienciaLista, flagAdv, formatHoras, formatarRelatorio, hojeIso,
  parseHoras, porEmpresaStats, presencaDe, relatorioDiario, resumoAdvertencias, rotuloCnpj, statsEscopo, ultimoDia, valorHoraExtra, negocPadrao, negocEfetiva } from "@/apps/montagem/domain/rh";
import { Dinheiro } from "@/apps/montagem/components/padrao";
import { BKC as BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

var int = function(v){ return Math.round(v||0).toLocaleString("pt-BR"); };
var pc = function(f){ return ((f||0)*100).toLocaleString("pt-BR",{minimumFractionDigits:1, maximumFractionDigits:1})+"%"; };
var th = function(t, c){ return e("th",{key:t, className:"whitespace-nowrap border-b border-border px-3 py-2 text-left text-[11.5px] font-semibold uppercase tracking-wide "+(c||"")}, t); };
var CARD = "rounded-xl bg-card px-4 py-3 ring-1 ring-[#E8B84B]/30";
var AVISO = "flex items-start gap-2 rounded-xl border px-4 py-2.5 text-[13.5px] font-medium border-warning/40 bg-warning/10 text-warning";
var TD = "px-3 py-2 text-[13.5px]";

function useRh(){
  var cx = use(), s = cx.state;
  return {s:s, d:cx.dispatch, rh:s.rh, por:nomeDe(s.usuario), veSalario:grupoDe(s.usuario)==="supervisao"};
}
function acao(c, op, extra){ c.d(Object.assign({type:"RH", op:op, por:c.por}, extra)); }
function Campo(p){ return e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold "+(p.className||"")}, p.rot, p.children); }
function Tile(p){ return e("div",{className:CARD+" flex flex-col items-center text-center"}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-[.12em] text-muted-foreground"}, p.t), e("b",{className:MONO+" text-[24px]", style:{color:p.cor}}, p.v), p.sub && e("span",{className:"text-[11.5px] text-muted-foreground"}, p.sub)); }
function Sel(p){ return e("select",{value:p.value, "aria-label":p.label, className:INPUT+" h-10! cursor-pointer "+(p.className||"w-48"), onChange:function(ev){ p.onChange(ev.target.value); }}, p.children); }

// escopo: empresa (ou grupo geral) + mês/ano + mensal/anual
function useEscopo(){ var h = new Date(), st = useState({cnpj:"", ano:h.getFullYear(), mes:h.getMonth()+1, anual:false}); return [st[0], function(o){ st[1](Object.assign({}, st[0], o)); }]; }
function empresasDe(c){ var ids = []; colaboradoresRh(c.s).forEach(function(x){ if(ids.indexOf(x.cnpj)<0) ids.push(x.cnpj); }); return ids.sort(); }
function BarraEscopo(p){
  var c = p.c, esc = p.esc, set = p.set, ano0 = new Date().getFullYear();
  return e("div",{className:"flex flex-wrap items-end gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-[#E8B84B]/30"},
    e(Campo,{rot:"Empresa"}, e(Sel,{value:esc.cnpj, label:"Empresa", onChange:function(v){ set({cnpj:v}); }}, e("option",{value:""}, "Grupo geral"), empresasDe(c).map(function(k){ return e("option",{key:k, value:k}, rotuloCnpj(k)); }))),
    !esc.anual && e(Campo,{rot:"Mês"}, e(Sel,{value:esc.mes, label:"Mês", className:"w-40", onChange:function(v){ set({mes:Number(v)}); }}, MESES.map(function(m, i){ return e("option",{key:m, value:i+1}, m); }))),
    e(Campo,{rot:"Ano"}, e(Sel,{value:esc.ano, label:"Ano", className:"w-28", onChange:function(v){ set({ano:Number(v)}); }}, [ano0-2, ano0-1, ano0, ano0+1].map(function(a){ return e("option",{key:a, value:a}, a); }))),
    e("div",{className:"flex gap-1"}, [[false,"Mensal"],[true,"Anual"]].map(function(x){ return e("button",{key:x[1], onClick:function(){ set({anual:x[0]}); }, className:"h-10 rounded-xl px-4 text-[13px] font-bold ring-1 "+(esc.anual===x[0] ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-border hover:bg-muted/50")}, x[1]); })));
}

// ───────────────── Visão geral ─────────────────
function AbaRhVisao(){
  var c = useRh(), es = useEscopo(), esc = es[0], st = statsEscopo(c.s, esc), emp = porEmpresaStats(c.s, Object.assign({}, esc, {cnpj:""})), desl = desligadosDoPeriodo(c.s, esc);
  var cor = function(f, lim){ return f>lim ? "#EF4444" : f>lim/2 ? "#FBBF24" : "#4ADE80"; };
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Recursos Humanos · Visão geral", sub:"Absenteísmo (ABS) e rotatividade (TO) por empresa e do grupo. ABS = faltas, atestados e afastamentos ÷ dias escalados. TO = desligados ÷ (ativos + desligados)."}),
    e(BarraEscopo,{c:c, esc:esc, set:es[1]}),
    e("div",{className:"grid grid-cols-2 gap-3 xl:grid-cols-5"},
      e(Tile,{t:"ABS (absenteísmo)", v:pc(st.abs), cor:cor(st.abs, .06), sub:int(st.ausentes)+" de "+int(st.escalados)+" dias escalados"}), e(Tile,{t:"TO (turnover)", v:pc(st.to), cor:cor(st.to, .06), sub:int(st.desligados)+" desligadas no período"}),
      e(Tile,{t:"Ativos", v:int(st.ativos), cor:"#E8B84B", sub:esc.cnpj ? rotuloCnpj(esc.cnpj) : "grupo geral"}), e(Tile,{t:"Dias escalados", v:int(st.escalados), cor:"#60A5FA"}), e(Tile,{t:"Dias de ausência", v:int(st.ausentes), cor:"#F59E0B"})),
    !esc.cnpj && e(BlocoBarra,{cor:"ouro", t:"Por empresa", sub:esc.anual ? "ano de "+esc.ano : MESES[esc.mes-1]+"/"+esc.ano},
      e("div",{className:"grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-4"}, emp.map(function(x){ return e("div",{key:x.cnpj, className:CARD+" flex flex-col gap-1"}, e("b",{className:"text-[15px]"}, rotuloCnpj(x.cnpj)),
        e("span",{className:"text-[13px]"}, "ABS ", e("b",{className:MONO}, pc(x.abs))), e("span",{className:"text-[13px]"}, "TO ", e("b",{className:MONO}, pc(x.to))), e("span",{className:"text-[12px] text-muted-foreground"}, int(x.ativos)+" ativas")); }))),
    esc.anual && st.porMes && e(BlocoBarra,{cor:"ouro", t:"Mês a mês"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Mês"), th("Ativas"), th("Dias escalados"), th("Ausências"), th("ABS"), th("Desligadas"), th("TO")])),
      e("tbody",null, st.porMes.map(function(m){ return e("tr",{key:m.mes, className:"border-b border-border/60"}, e("td",{className:TD+" font-semibold"}, MESES[m.mes-1]), e("td",{className:TD}, int(m.ativos)), e("td",{className:TD}, int(m.escalados)), e("td",{className:TD}, int(m.ausentes)), e("td",{className:TD+" font-semibold "+MONO}, pc(m.abs)), e("td",{className:TD}, int(m.desligados)), e("td",{className:TD+" font-semibold "+MONO}, pc(m.to))); })))),
    e(BlocoBarra,{cor:"ouro", t:"Desligamentos do período", sub:desl.length+" no total"}, desl.length===0 ? e("p",{className:"px-4 py-6 text-center text-[13px] text-muted-foreground"}, "Nenhum desligamento no período.") :
      e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Data"), th("Nome"), th("Setor"), th("Empresa"), th("Tipo"), th("Motivo")])),
        e("tbody",null, desl.map(function(x){ return e("tr",{key:x.id, className:"border-b border-border/60"}, e("td",{className:TD}, br(x.deslig.data)), e("td",{className:TD+" font-semibold"}, x.nome), e("td",{className:TD}, x.setor), e("td",{className:TD}, rotuloCnpj(x.cnpj)), e("td",{className:TD}, x.deslig.tipo), e("td",{className:TD}, x.deslig.motivo)); })))));
}

// ───────────────── Presença diária ─────────────────
var CICLO = ["P","F","AJ","AT","FE","FO","AF",""];
var corDe = function(cod){ var x = CODIGOS.find(function(k){ return k[0]===cod; }); return x ? x[2] : "#64748B"; };
function AbaRhPresenca(){
  var c = useRh(), es = useEscopo(), esc = es[0], rh = c.rh, nf = useState({id:"", data:hojeIso(), hora:""}), form = nf[0], setForm = nf[1];
  var todos = colaboradoresRh(c.s).filter(function(x){ return x.status==="ATIVO" && (!esc.cnpj || x.cnpj===esc.cnpj); }).sort(function(a, b){ return (a.setor||"").localeCompare(b.setor||"") || a.nome.localeCompare(b.nome); });
  var tot = ultimoDia(esc.ano, esc.mes), dias = []; for(var i=1; i<=tot; i++) dias.push(i);
  var st = statsEscopo(c.s, Object.assign({}, esc, {anual:false}));
  var clicar = function(x, iso){ var p = presencaDe(rh, x.id, iso), atual = p && p.c ? p.c : "", prox = CICLO[(CICLO.indexOf(atual)+1)%CICLO.length]; acao(c, "pres_set", {id:x.id, data:iso, codigo:prox}); };
  var atrasosMes = []; Object.keys(rh.presenca).filter(function(d){ return d.slice(0,7)===esc.ano+"-"+String(esc.mes).padStart(2,"0"); }).sort().forEach(function(d){ Object.keys(rh.presenca[d]).forEach(function(id){ var p = rh.presenca[d][id]; var cb = todos.find(function(x){ return x.id===id; }); if(p.atraso && cb) atrasosMes.push({d:d, nome:cb.nome, h:p.atraso, id:id}); }); });
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Presença diária", sub:"Clique na célula para trocar: P → F → AJ → AT → FE → FO → AF → vazio. Dia sem escala aparece como folga automática (não é gravado). Só colaboradoras ativas entram."}),
    e(BarraEscopo,{c:c, esc:esc, set:es[1]}),
    e("div",{className:"flex flex-wrap gap-2 text-[12px]"}, CODIGOS.map(function(k){ return e("span",{key:k[0], className:"rounded-full px-2.5 py-0.5 font-bold", style:{background:k[2]+"26", color:k[2]}}, k[0]+" · "+k[1]); })),
    esc.anual ? e(BlocoBarra,{cor:"ouro", t:"ABS mês a mês · "+esc.ano}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Mês"), th("Dias escalados"), th("Ausências"), th("ABS")])),
      e("tbody",null, (statsEscopo(c.s, esc).porMes||[]).map(function(m){ return e("tr",{key:m.mes, className:"border-b border-border/60"}, e("td",{className:TD+" font-semibold"}, MESES[m.mes-1]), e("td",{className:TD}, int(m.escalados)), e("td",{className:TD}, int(m.ausentes)), e("td",{className:TD+" font-semibold "+MONO}, pc(m.abs))); })))) :
    e(React.Fragment,null,
      e(BlocoBarra,{cor:"ouro", t:MESES[esc.mes-1]+" de "+esc.ano, sub:todos.length+" ativas · ABS do mês "+pc(st.abs)},
        e("div",{className:"overflow-x-auto"}, e("table",{className:"border-collapse text-[12px]"},
          e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Colaboradora","sticky left-0 z-10 bg-sidebar min-w-56")].concat(dias.map(function(d){ var iso = dataIso(esc.ano, esc.mes, d), dw = diaSem(iso);
            return e("th",{key:d, className:"border-b border-border px-0.5 py-1 text-center font-semibold "+(dw===0 || dw===6 ? "text-[#F3D98B]" : "")}, e("div",null, d), e("div",{className:"text-[9.5px] font-normal"}, DIAS_SEMANA[dw].slice(0,3)),
              e("button",{title:"Marcar todas como Presença em "+br(iso), onClick:function(){ acao(c, "pres_marcar_dia", {data:iso, cnpj:esc.cnpj}); }, className:"mt-0.5 rounded bg-success/20 px-1 text-[10px] font-bold text-success hover:bg-success/40"}, "P")); }), [th("Faltas"), th("ABS")]))),
          e("tbody",null, todos.length===0 ? e("tr",null, e("td",{colSpan:dias.length+3, className:"px-3 py-6 text-center text-muted-foreground"}, "Nenhuma colaboradora ativa neste escopo.")) : todos.map(function(x){
            var esc1 = 0, aus = 0, faltas = 0;
            var cels = dias.map(function(d){ var iso = dataIso(esc.ano, esc.mes, d), p = presencaDe(rh, x.id, iso), cod = p && p.c ? p.c : "", e1 = diaEscalado(rh, x, iso);
              if(e1 && iso<=hojeIso()){ esc1++; if(cod && ["F","AJ","AT","AF"].indexOf(cod)>=0) aus++; } if(cod==="F" || cod==="AJ") faltas++;
              var auto = !cod && !e1;
              return e("td",{key:d, className:"p-0.5 text-center"}, e("button",{onClick:function(){ clicar(x, iso); }, title:(p && p.atraso ? "Atraso: "+p.atraso+" · " : "")+x.nome+" · "+br(iso), className:"relative h-7 w-8 rounded text-[11px] font-bold "+(auto ? "bg-white/5 text-muted-foreground/60" : cod ? "" : "bg-white/[.07] hover:bg-white/15"), style:cod ? {background:corDe(cod)+"33", color:corDe(cod), boxShadow:"inset 0 0 0 1px "+corDe(cod)+"66"} : undefined}, auto ? "FO" : cod, p && p.atraso && e("span",{className:"absolute right-0 top-0 size-1.5 rounded-full bg-warning"}))); });
            return e("tr",{key:x.id, className:"border-b border-border/60"}, e("td",{className:"sticky left-0 z-10 bg-card px-3 py-1 text-[12.5px] font-medium"}, e("span",{className:"block"}, x.nome), e("span",{className:"block text-[10.5px] text-muted-foreground"}, x.setor+" · "+rotuloCnpj(x.cnpj))),
              cels, e("td",{className:"px-2 text-center "+MONO}, faltas), e("td",{className:"px-2 text-center font-semibold "+MONO}, esc1 ? pc(aus/esc1) : "—")); }))))),
      e(BlocoBarra,{cor:"ouro", t:"Atrasos", sub:"o horário de chegada vai no relatório diário (minutos de atraso = chegada − horário de entrada do cadastro)"},
        e("div",{className:"flex flex-col gap-3 p-4"},
          e("div",{className:"flex flex-wrap items-end gap-3"},
            e(Campo,{rot:"Colaboradora"}, e(Sel,{value:form.id, label:"Colaboradora", className:"w-72", onChange:function(v){ setForm(Object.assign({}, form, {id:v})); }}, e("option",{value:""}, "Escolha…"), todos.map(function(x){ return e("option",{key:x.id, value:x.id}, x.nome); }))),
            e(Campo,{rot:"Dia"}, e("input",{type:"date", value:form.data, className:INPUT+" h-10! w-44", onChange:function(ev){ setForm(Object.assign({}, form, {data:ev.target.value})); }})),
            e(Campo,{rot:"Chegou às"}, e("input",{type:"time", value:form.hora, className:INPUT+" h-10! w-32", onChange:function(ev){ setForm(Object.assign({}, form, {hora:ev.target.value})); }})),
            e(Btn,{v:"primary", disabled:!form.id || !form.data || !form.hora, onClick:function(){ acao(c, "pres_atraso", {id:form.id, data:form.data, atraso:form.hora}); setForm(Object.assign({}, form, {hora:""})); }}, "Lançar atraso")),
          atrasosMes.length>0 && e("div",{className:"flex flex-col divide-y divide-white/10"}, atrasosMes.map(function(a){ return e("div",{key:a.d+a.id, className:"flex items-center justify-between py-1.5 text-[13px]"}, e("span",null, br(a.d)+" · "+a.nome), e("span",{className:"flex items-center gap-3"}, e("b",{className:MONO}, a.h), e("button",{onClick:function(){ acao(c, "pres_atraso", {id:a.id, data:a.d, atraso:""}); }, className:"text-[12px] text-muted-foreground underline hover:text-destructive"}, "remover"))); })))))
  );
}

// ───────────────── Relatório diário (texto para o WhatsApp) ─────────────────
function AbaRhRelatorio(){
  var c = useRh(), dd = useState(hojeIso()), dia = dd[0], setDia = dd[1], ed = useState({dia:"", txt:""}), edit = ed[0], setEdit = ed[1];
  var gerado = formatarRelatorio(relatorioDiario(c.s, dia)), texto = edit.dia===dia ? edit.txt : gerado;
  var copiar = function(){ try{ navigator.clipboard.writeText(texto); c.d({type:"AVISO", txt:"Relatório copiado! Já pode colar no WhatsApp."}); }catch(x){} };
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Relatório diário do RH", sub:"Toda manhã: funcionárias ativas por CNPJ, representantes, sócios, admitidos e demitidos, atrasos, faltas, atestados e férias, num texto pronto para o WhatsApp. O que você editar vale até trocar o dia."}),
    e("div",{className:"flex flex-wrap items-end gap-3"}, e(Campo,{rot:"Dia do relatório"}, e("input",{type:"date", value:dia, className:INPUT+" h-10! w-48", onChange:function(ev){ if(ev.target.value) setDia(ev.target.value); }})), e(Btn,{v:"ghost", sm:true, onClick:function(){ setDia(hojeIso()); }}, "Hoje")),
    e(BlocoBarra,{cor:"ouro", t:"Texto do relatório", sub:"pode editar antes de copiar (por exemplo, o motivo das faltas com aviso)"},
      e("div",{className:"flex flex-col gap-3 p-4"}, e("textarea",{value:texto, rows:26, className:INPUT+" h-auto! w-full p-3 text-[13.5px] leading-relaxed", onChange:function(ev){ setEdit({dia:dia, txt:ev.target.value}); }}),
        e("div",{className:"flex flex-wrap gap-2"}, e(Btn,{v:"primary", ic:"copiar", onClick:copiar}, "Copiar texto"), edit.dia===dia && e(Btn,{v:"ghost", onClick:function(){ setEdit({dia:"", txt:""}); }}, "Desfazer edições")))));
}

// ───────────────── Colaboradores ─────────────────
function FormColab(p){
  var c = p.c, x = p.x, cfg = c.rh.config, st = useState({admissao:x.admissao||"", escalaId:x.escalaId, entrada:x.entrada||"", saida:x.saida||"", salario:x.salario ? String(x.salario).replace(".",",") : "", planoId:x.planoId||"", status:x.status, funcao:x.funcao||"", telefone:x.telefone||"", cidade:x.cidade||"", nascimento:x.nascimento||"", folha:x.folha||"", vt:x.vt||"", termoPeca:x.termoPeca ? "sim" : "nao", cpf:x.cpf||"", aviso:!!x.aviso,
    fIni:(x.ferias||{}).ini||"", fFim:(x.ferias||{}).fim||"", afast:x.afastamento||"", dData:(x.deslig||{}).data||"", dTipo:(x.deslig||{}).tipo||"", dMotivo:(x.deslig||{}).motivo||"", dObs:(x.deslig||{}).obs||""}), f = st[0], set = function(o){ st[1](Object.assign({}, f, o)); };
  var salvar = function(){ var sal = Number(String(f.salario||"0").replace(/\./g,"").replace(",","."))||0;
    acao(c, "colab_set", {id:x.id, patch:Object.assign({admissao:f.admissao, escalaId:f.escalaId, entrada:f.entrada, saida:f.saida, salario:sal, planoId:f.planoId, status:f.status, funcao:f.funcao, telefone:f.telefone, cidade:f.cidade, nascimento:f.nascimento, folha:f.folha, vt:f.vt, termoPeca:f.termoPeca==="sim", aviso:f.aviso}, c.veSalario ? {cpf:f.cpf.replace(/\D/g,"")} : {}, { ferias:f.status==="FERIAS" ? {ini:f.fIni, fim:f.fFim} : null, afastamento:f.afast, deslig:f.status==="DESLIGADO" ? {data:f.dData, tipo:f.dTipo, motivo:f.dMotivo, obs:f.dObs} : null})}); p.fechar(); };
  var inp = function(k, tipo, cls){ return e("input",{type:tipo||"text", value:f[k], className:INPUT+" h-10! "+(cls||"w-full"), onChange:function(ev){ var o = {}; o[k] = ev.target.value; set(o); }}); };
  return e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-black/60 p-4", onClick:p.fechar},
    e("div",{className:"flex max-h-[92vh] w-full max-w-2xl flex-col gap-3 overflow-y-auto rounded-2xl bg-card p-5 ring-1 ring-[#E8B84B]/40", onClick:function(ev){ ev.stopPropagation(); }},
      e("div",{className:"flex items-start justify-between gap-3"}, e("div",null, e("h2",{className:"font-heading text-xl font-bold"}, x.nome), e("p",{className:"text-[12.5px] text-muted-foreground"}, x.setor+" · "+rotuloCnpj(x.cnpj))), e("button",{onClick:p.fechar, "aria-label":"Fechar", className:"grid size-9 place-items-center rounded-lg bg-muted/50"}, e(Ph,{n:"x", s:16}))),
      e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"},
        e(Campo,{rot:"Data de admissão"}, inp("admissao","date")), e(Campo,{rot:"Horário de entrada"}, inp("entrada","time")), e(Campo,{rot:"Horário de saída"}, inp("saida","time")),
        e(Campo,{rot:"Escala"}, e(Sel,{value:f.escalaId, label:"Escala", className:"w-full", onChange:function(v){ set({escalaId:v}); }}, cfg.escalas.map(function(k){ return e("option",{key:k.id, value:k.id}, k.nome); }))),
        e(Campo,{rot:"Plano de experiência"}, e(Sel,{value:f.planoId, label:"Plano de experiência", className:"w-full", onChange:function(v){ set({planoId:v}); }}, e("option",{value:""}, "Sem plano"), cfg.planos.map(function(k){ return e("option",{key:k.id, value:k.id}, k.nome+" ("+k.marco1+" + "+k.marco2+")"); }))),
        c.veSalario && e(Campo,{rot:"Salário (R$)"}, inp("salario","text")),
        e(Campo,{rot:"Situação"}, e(Sel,{value:f.status, label:"Situação", className:"w-full", onChange:function(v){ set({status:v}); }}, STATUS.map(function(k){ return e("option",{key:k[0], value:k[0]}, k[1]); })))),
      e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"},
        e(Campo,{rot:"Função"}, inp("funcao","text")), e(Campo,{rot:"Telefone"}, inp("telefone","text")), e(Campo,{rot:"Cidade"}, inp("cidade","text")), e(Campo,{rot:"Data de nascimento"}, inp("nascimento","date")),
        e(Campo,{rot:"Nº da folha"}, inp("folha","text")), e(Campo,{rot:"Vale-transporte"}, inp("vt","text")),
        e(Campo,{rot:"Termo de peças assinado"}, e(Sel,{value:f.termoPeca, label:"Termo de peças", className:"w-full", onChange:function(v){ set({termoPeca:v}); }}, e("option",{value:"sim"}, "Sim"), e("option",{value:"nao"}, "Não"))),
        c.veSalario && e(Campo,{rot:"CPF (só números)"}, inp("cpf","text")),
        e("label",{className:"flex cursor-pointer items-center gap-2 pt-5 text-[13px] font-semibold"}, e("input",{type:"checkbox", checked:f.aviso, className:"size-4", onChange:function(ev){ set({aviso:ev.target.checked}); }}), "Cumprindo aviso prévio")),
      c.veSalario && (function(){ var n = negocEfetiva(c.rh, x.id), m = function(v){ return v===null||v===undefined ? "—" : BK(v); };
        return e("div",{className:"flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-muted/30 px-3 py-2 text-[12.5px]"}, e("b",null, "Negociação de hora extra"), n ? e("span",null, n.grupo+" · 1h "+m(n.h1)+" · 2h "+m(n.h2)+" · 3h "+m(n.h3)+" · sábado "+m(n.sab)) : e("span",{className:"text-muted-foreground"}, "Sem negociação"), e("span",{className:"text-muted-foreground"}, "Editar em RH > Negociações")); })(),
      f.status==="FERIAS" && e("div",{className:"grid grid-cols-2 gap-3"}, e(Campo,{rot:"Férias: início"}, inp("fIni","date")), e(Campo,{rot:"Férias: fim"}, inp("fFim","date"))),
      f.status==="AFASTADO" && e(Campo,{rot:"Motivo do afastamento"}, inp("afast","text")),
      f.status==="DESLIGADO" && e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"}, e(Campo,{rot:"Data do desligamento"}, inp("dData","date")),
        e(Campo,{rot:"Tipo"}, e(Sel,{value:f.dTipo, label:"Tipo", className:"w-full", onChange:function(v){ set({dTipo:v}); }}, e("option",{value:""}, "Escolha…"), TIPOS_DESLIG.map(function(k){ return e("option",{key:k, value:k}, k); }))),
        e(Campo,{rot:"Motivo", className:"sm:col-span-2"}, inp("dMotivo","text")), e(Campo,{rot:"Observação", className:"sm:col-span-2"}, inp("dObs","text"))),
      e("div",{className:"flex flex-wrap justify-between gap-2 pt-1"},
        x.novo ? e(Btn,{v:"ghost", onClick:function(){ if(window.confirm("Excluir "+x.nome+"? Apaga também presenças, advertências e horas extras dela.")){ acao(c, "colab_del", {id:x.id}); p.fechar(); } }}, "Excluir cadastro") : e("span",null),
        e("div",{className:"flex gap-2"}, e(Btn,{v:"ghost", onClick:p.fechar}, "Cancelar"), e(Btn,{v:"primary", onClick:salvar}, "Salvar")))));
}
function AbaRhColab(){
  var c = useRh(), ab = useState("ativos"), aba = ab[0], setAba = ab[1], bq = useState(""), busca = bq[0], setBusca = bq[1], ed = useState(null), editId = ed[0], setEditId = ed[1], nv = useState(null), novo = nv[0], setNovo = nv[1];
  var todos = colaboradoresRh(c.s), norm = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }, q = norm(busca);
  var lista = todos.filter(function(x){ return (aba==="todos" || (aba==="ativos" ? x.status!=="DESLIGADO" : x.status==="DESLIGADO")) && (!q || norm(x.nome).indexOf(q)>=0 || norm(x.setor).indexOf(q)>=0); }).sort(function(a, b){ return a.nome.localeCompare(b.nome); });
  var sem = todos.filter(function(x){ return x.status!=="DESLIGADO" && !x.admissao; }).length, esc = function(id){ var k = c.rh.config.escalas.find(function(y){ return y.id===id; }); return k ? k.nome : "—"; };
  var stLb = function(k){ return (STATUS.find(function(y){ return y[0]===k; })||[])[1]||k; };
  var editando = editId && todos.find(function(x){ return x.id===editId; });
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Cadastro de colaboradores", sub:"As funcionárias CLT já vêm da lista de Pessoas. Aqui o RH completa admissão, escala, horário, plano de experiência e situação. Quem sai fica como Desligada (não se apaga)."}),
    sem>0 && e("div",{className:AVISO}, e(Ph,{n:"warning", s:17, fill:true}), e("span",null, sem+" ainda sem data de admissão. Sem ela, o sistema considera que já estava na empresa; preencha para o ABS e a experiência ficarem certos.")),
    e("div",{className:"flex flex-wrap items-center gap-2"},
      ["ativos","inativos","todos"].map(function(k){ return e("button",{key:k, onClick:function(){ setAba(k); }, className:"h-10 rounded-xl px-4 text-[13px] font-bold capitalize ring-1 "+(aba===k ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-border hover:bg-muted/50")}, k); }),
      e("input",{value:busca, placeholder:"Buscar nome ou setor", "aria-label":"Buscar", className:INPUT+" h-10! w-64", onChange:function(ev){ setBusca(ev.target.value); }}), e("span",{className:"text-[12.5px] text-muted-foreground"}, lista.length+" na lista"),
      e("span",{className:"flex-1"}), e(Btn,{v:"secondary", onClick:function(){ setNovo({nome:"", setor:FUNCIONARIOS_POR_SETOR[0][0], cnpj:"", admissao:""}); }}, "+ Nova colaboradora")),
    novo && e(BlocoBarra,{cor:"ouro", t:"Nova colaboradora"}, e("div",{className:"flex flex-wrap items-end gap-3 p-4"},
      e(Campo,{rot:"Nome completo", className:"min-w-[16rem] flex-1"}, e("input",{value:novo.nome, className:INPUT+" h-10!", onChange:function(ev){ setNovo(Object.assign({}, novo, {nome:ev.target.value})); }})),
      e(Campo,{rot:"Setor"}, e(Sel,{value:novo.setor, label:"Setor", className:"w-56", onChange:function(v){ setNovo(Object.assign({}, novo, {setor:v})); }}, FUNCIONARIOS_POR_SETOR.filter(function(s2){ return s2[0]!=="Sócios e família" && s2[0].indexOf("PJ")!==0; }).map(function(s2){ return e("option",{key:s2[0], value:s2[0]}, s2[0]); }))),
      e(Campo,{rot:"Empresa (CNPJ)"}, e(Sel,{value:novo.cnpj, label:"Empresa", className:"w-40", onChange:function(v){ setNovo(Object.assign({}, novo, {cnpj:v})); }}, e("option",{value:""}, "A informar"), ["34","46","59","67"].map(function(k){ return e("option",{key:k, value:k}, rotuloCnpj(k)); }))),
      e(Campo,{rot:"Admissão"}, e("input",{type:"date", value:novo.admissao, className:INPUT+" h-10! w-44", onChange:function(ev){ setNovo(Object.assign({}, novo, {admissao:ev.target.value})); }})),
      e(Btn,{v:"primary", disabled:!novo.nome.trim(), onClick:function(){ acao(c, "colab_add", novo); setNovo(null); }}, "Cadastrar"), e(Btn,{v:"ghost", onClick:function(){ setNovo(null); }}, "Cancelar"))),
    e(BlocoBarra,{cor:"ouro", t:"Colaboradores"}, e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"},
      e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Nome"), th("Setor"), th("Função"), th("Empresa"), th("Situação"), th("Admissão"), th("Escala"), th("Entrada")].concat(c.veSalario ? [th("Salário")] : [], [th("")]))),
      e("tbody",null, lista.map(function(x){ return e("tr",{key:x.id, className:"cursor-pointer border-b border-border/60 hover:bg-white/5", onClick:function(){ setEditId(x.id); }},
        e("td",{className:TD+" font-semibold"}, x.nome), e("td",{className:TD}, x.setor), e("td",{className:TD+" text-[12.5px]"}, x.funcao||"—"), e("td",{className:TD}, rotuloCnpj(x.cnpj)), e("td",{className:TD}, e("span",{className:"rounded-full px-2.5 py-0.5 text-[11.5px] font-bold "+(x.status==="ATIVO" && !x.aviso ? "bg-success/20 text-success" : x.status==="DESLIGADO" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning")}, stLb(x.status)+(x.aviso ? " · aviso prévio" : ""))),
        e("td",{className:TD}, x.admissao ? br(x.admissao) : e("span",{className:"text-warning"}, "faltando")), e("td",{className:TD}, esc(x.escalaId)), e("td",{className:TD+" "+MONO}, x.entrada+(x.saida ? "–"+x.saida : "")),
        c.veSalario && e("td",{className:TD+" "+MONO}, x.salario ? BK(x.salario) : "—"), e("td",{className:TD}, e(Ph,{n:"pencil", s:15}))); }))))),
    editando && e(FormColab,{key:editando.id, c:c, x:editando, fechar:function(){ setEditId(null); }}));
}

// ───────────────── Advertências ─────────────────
function AbaRhAdv(){
  var c = useRh(), rh = c.rh, cfg = rh.config, ano = new Date().getFullYear(), nf = useState({colabId:"", data:hojeIso(), tipoId:"", motivoId:"", dias:"", obs:""}), f = nf[0], setF = nf[1];
  var colabs = colaboradoresRh(c.s), nomeDe2 = function(id){ var x = colabs.find(function(y){ return y.id===id; }); return x ? x.nome : "—"; }, lista = advertenciasComSeq(rh), res = resumoAdvertencias(rh, ano);
  var tipo = cfg.tiposAdv.find(function(x){ return x.id===f.tipoId; }), nm = function(l, id){ var x = cfg[l].find(function(y){ return y.id===id; }); return x ? x.nome : "—"; };
  var porPessoa = Object.keys(res).map(function(id){ return {id:id, n:res[id], flag:flagAdv(res[id])}; }).sort(function(a, b){ return b.n-a.n; });
  var corFlag = function(g){ return g==="Reincidente" ? "#EF4444" : g==="Em observação" ? "#F59E0B" : "#22C55E"; };
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Advertências", sub:"A 1ª do ano é Regular, a 2ª fica Em observação e a 3ª em diante é Reincidente (conta por ano-calendário). Advertência não se apaga."}),
    e("div",{className:"grid grid-cols-2 gap-3 xl:grid-cols-4"}, e(Tile,{t:"No ano", v:int(lista.filter(function(x){ return x.data.slice(0,4)===String(ano); }).length), cor:"#E8B84B"}), e(Tile,{t:"Pessoas advertidas", v:int(porPessoa.length), cor:"#60A5FA"}),
      e(Tile,{t:"Em observação", v:int(porPessoa.filter(function(x){ return x.flag==="Em observação"; }).length), cor:"#F59E0B"}), e(Tile,{t:"Reincidentes", v:int(porPessoa.filter(function(x){ return x.flag==="Reincidente"; }).length), cor:"#EF4444"})),
    e(BlocoBarra,{cor:"ouro", t:"Nova advertência"}, e("div",{className:"flex flex-wrap items-end gap-3 p-4"},
      e(Campo,{rot:"Colaboradora"}, e(Sel,{value:f.colabId, label:"Colaboradora", className:"w-72", onChange:function(v){ setF(Object.assign({}, f, {colabId:v})); }}, e("option",{value:""}, "Escolha…"), colabs.filter(function(x){ return x.status!=="DESLIGADO"; }).sort(function(a, b){ return a.nome.localeCompare(b.nome); }).map(function(x){ return e("option",{key:x.id, value:x.id}, x.nome); }))),
      e(Campo,{rot:"Data"}, e("input",{type:"date", value:f.data, className:INPUT+" h-10! w-44", onChange:function(ev){ setF(Object.assign({}, f, {data:ev.target.value})); }})),
      e(Campo,{rot:"Tipo"}, e(Sel,{value:f.tipoId, label:"Tipo", className:"w-44", onChange:function(v){ setF(Object.assign({}, f, {tipoId:v})); }}, e("option",{value:""}, "Escolha…"), cfg.tiposAdv.map(function(x){ return e("option",{key:x.id, value:x.id}, x.nome); }))),
      e(Campo,{rot:"Motivo"}, e(Sel,{value:f.motivoId, label:"Motivo", className:"w-56", onChange:function(v){ setF(Object.assign({}, f, {motivoId:v})); }}, e("option",{value:""}, "Escolha…"), cfg.motivosAdv.map(function(x){ return e("option",{key:x.id, value:x.id}, x.nome); }))),
      tipo && tipo.suspensao && e(Campo,{rot:"Dias de suspensão"}, e("input",{value:f.dias, inputMode:"numeric", className:INPUT+" h-10! w-28 text-center", onChange:function(ev){ setF(Object.assign({}, f, {dias:ev.target.value.replace(/\D/g,"")})); }})),
      e(Campo,{rot:"Observação", className:"min-w-[12rem] flex-1"}, e("input",{value:f.obs, className:INPUT+" h-10!", onChange:function(ev){ setF(Object.assign({}, f, {obs:ev.target.value})); }})),
      e(Btn,{v:"primary", disabled:!f.colabId || !f.tipoId || !f.motivoId, onClick:function(){ acao(c, "adv_add", f); setF(Object.assign({}, f, {obs:"", dias:""})); }}, "Registrar"))),
    e("div",{className:"grid grid-cols-1 gap-4 lg:grid-cols-[1fr_20rem]"},
      e(BlocoBarra,{cor:"ouro", t:"Lançamentos", sub:lista.length+" no total"}, lista.length===0 ? e("p",{className:"px-4 py-8 text-center text-[13px] text-muted-foreground"}, "Nenhuma advertência registrada.") :
        e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Data"), th("Colaboradora"), th("Tipo"), th("Motivo"), th("Nº no ano"), th("Situação")])),
          e("tbody",null, lista.map(function(x){ return e("tr",{key:x.id, className:"border-b border-border/60"}, e("td",{className:TD}, br(x.data)), e("td",{className:TD+" font-semibold"}, nomeDe2(x.colabId), x.obs && e("span",{className:"block text-[11.5px] font-normal text-muted-foreground"}, x.obs)),
            e("td",{className:TD}, nm("tiposAdv", x.tipoId)+(x.dias ? " · "+x.dias+" dias" : "")), e("td",{className:TD}, nm("motivosAdv", x.motivoId)), e("td",{className:TD+" "+MONO}, x.seq+"ª"),
            e("td",{className:TD}, e("span",{className:"rounded-full px-2.5 py-0.5 text-[11.5px] font-bold", style:{background:corFlag(x.flag)+"26", color:corFlag(x.flag)}}, x.flag))); }))))),
      e(BlocoBarra,{cor:"ouro", t:"Resumo de "+ano}, e("div",{className:"flex flex-col divide-y divide-white/10 px-4 py-1"}, porPessoa.length===0 ? e("p",{className:"py-4 text-[13px] text-muted-foreground"}, "Sem advertências neste ano.") : porPessoa.map(function(x){ return e("div",{key:x.id, className:"flex items-center justify-between gap-2 py-2 text-[13px]"}, e("span",{className:"truncate"}, nomeDe2(x.id)), e("span",{className:"flex shrink-0 items-center gap-2"}, e("b",{className:MONO}, x.n), e("span",{className:"rounded-full px-2 py-0.5 text-[10.5px] font-bold", style:{background:corFlag(x.flag)+"26", color:corFlag(x.flag)}}, x.flag))); })))));
}

// ───────────────── Controle de experiência ─────────────────
function AbaRhExp(){
  var c = useRh(), lista = experienciaLista(c.s), semPlano = colaboradoresRh(c.s).filter(function(x){ return x.status!=="DESLIGADO" && !x.efetivadoEm && (!x.planoId || !x.admissao); }).length;
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Controle de experiência", sub:"1ª avaliação = admissão + 1º marco; 2ª = admissão + 1º + 2º marco; efetivação = dia seguinte à 2ª. Quem não foi efetivada aparece até 45 dias depois da 2ª avaliação."}),
    semPlano>0 && e("div",{className:AVISO}, e(Ph,{n:"warning", s:17, fill:true}), e("span",null, semPlano+" colaboradoras ainda sem plano de experiência ou sem data de admissão no Cadastro; elas não aparecem aqui.")),
    e(BlocoBarra,{cor:"ouro", t:"Em experiência", sub:lista.length+" na lista"}, lista.length===0 ? e("p",{className:"px-4 py-8 text-center text-[13px] text-muted-foreground"}, "Ninguém em período de experiência no momento.") :
      e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Colaboradora"), th("Admissão"), th("1ª avaliação"), th("2ª avaliação"), th("Efetivação"), th("Prazo"), th("")])),
        e("tbody",null, lista.map(function(x){ var ch = x.chip, cor = ch.vencido ? "#EF4444" : ch.aviso ? "#F59E0B" : "#22C55E";
          return e("tr",{key:x.c.id, className:"border-b border-border/60"}, e("td",{className:TD+" font-semibold"}, x.c.nome, e("span",{className:"block text-[11.5px] font-normal text-muted-foreground"}, x.c.setor)), e("td",{className:TD}, br(x.c.admissao)), e("td",{className:TD}, br(x.a1)), e("td",{className:TD}, br(x.a2)), e("td",{className:TD}, br(x.ef)),
            e("td",{className:TD}, e("span",{className:"whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-bold", style:{background:cor+"26", color:cor}}, ch.t)), e("td",{className:TD}, e(Btn,{v:"secondary", sm:true, onClick:function(){ if(window.confirm("Efetivar "+x.c.nome+" hoje?")) acao(c, "efetivar", {id:x.c.id}); }}, "Efetivar"))); }))))));
}

// ───────────────── Horas extras ─────────────────
function AbaRhHoras(){
  var c = useRh(), rh = c.rh, cfg = rh.config, es = useEscopo(), esc = es[0], nf = useState({colabId:"", data:hojeIso(), horas:"", tipoId:"", obs:""}), f = nf[0], setF = nf[1];
  var colabs = colaboradoresRh(c.s), pessoa = function(id){ return colabs.find(function(y){ return y.id===id; }); };
  var ini = esc.anual ? esc.ano+"-01-01" : dataIso(esc.ano, esc.mes, 1), fim = esc.anual ? esc.ano+"-12-31" : dataIso(esc.ano, esc.mes, ultimoDia(esc.ano, esc.mes));
  var lista = (rh.horas||[]).filter(function(h){ var p = pessoa(h.colabId); return h.data>=ini && h.data<=fim && p && (!esc.cnpj || p.cnpj===esc.cnpj); }).sort(function(a, b){ return b.data.localeCompare(a.data); });
  var tipo = function(id){ return cfg.tiposHE.find(function(x){ return x.id===id; }) || {nome:"—", pct:0}; };
  var custo = function(h){ var p = pessoa(h.colabId); return p ? valorHoraExtra(p.salario||0, h.horas, tipo(h.tipoId).pct) : 0; };
  var pagas = lista.filter(function(h){ return tipo(h.tipoId).pct>0; }), banco = lista.filter(function(h){ return tipo(h.tipoId).pct===0; });
  var soma = function(l){ return l.reduce(function(t, h){ return t+h.horas; }, 0); };
  var por = {}; lista.forEach(function(h){ var o = por[h.colabId] = por[h.colabId] || {id:h.colabId, pagas:0, banco:0, custo:0}; if(tipo(h.tipoId).pct>0){ o.pagas += h.horas; o.custo += custo(h); } else o.banco += h.horas; });
  var resumo = Object.keys(por).map(function(k){ return por[k]; }).sort(function(a, b){ return (b.pagas+b.banco)-(a.pagas+a.banco); }), custoTotal = lista.reduce(function(t, h){ return t+custo(h); }, 0);
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Horas extras", sub:"Lançadas em HH:MM (ex.: 02:30). Valor = salário ÷ 220 × horas × (1 + adicional). Tipo com 0% é banco de horas e não tem custo. O custo usa o salário atual do cadastro."}),
    e(BarraEscopo,{c:c, esc:esc, set:es[1]}),
    e("div",{className:"grid grid-cols-2 gap-3 xl:grid-cols-4"}, e(Tile,{t:"Lançamentos", v:int(lista.length), cor:"#E8B84B"}), e(Tile,{t:"Horas pagas", v:formatHoras(soma(pagas)), cor:"#60A5FA"}), e(Tile,{t:"Banco de horas", v:formatHoras(soma(banco)), cor:"#A78BFA"}),
      c.veSalario ? e(Tile,{t:"Custo", v:BK(custoTotal), cor:"#F59E0B"}) : e(Tile,{t:"Pessoas", v:int(resumo.length), cor:"#F59E0B"})),
    e(BlocoBarra,{cor:"ouro", t:"Lançar hora extra"}, e("div",{className:"flex flex-wrap items-end gap-3 p-4"},
      e(Campo,{rot:"Colaboradora"}, e(Sel,{value:f.colabId, label:"Colaboradora", className:"w-72", onChange:function(v){ setF(Object.assign({}, f, {colabId:v})); }}, e("option",{value:""}, "Escolha…"), colabs.filter(function(x){ return x.status==="ATIVO"; }).sort(function(a, b){ return a.nome.localeCompare(b.nome); }).map(function(x){ return e("option",{key:x.id, value:x.id}, x.nome); }))),
      e(Campo,{rot:"Data"}, e("input",{type:"date", value:f.data, className:INPUT+" h-10! w-44", onChange:function(ev){ setF(Object.assign({}, f, {data:ev.target.value})); }})),
      e(Campo,{rot:"Horas (HH:MM)"}, e("input",{value:f.horas, placeholder:"02:30", className:INPUT+" h-10! w-28 text-center "+MONO, onChange:function(ev){ setF(Object.assign({}, f, {horas:ev.target.value.replace(/[^\d:]/g,"")})); }})),
      e(Campo,{rot:"Tipo"}, e(Sel,{value:f.tipoId, label:"Tipo", className:"w-52", onChange:function(v){ setF(Object.assign({}, f, {tipoId:v})); }}, e("option",{value:""}, "Escolha…"), cfg.tiposHE.map(function(x){ return e("option",{key:x.id, value:x.id}, x.nome); }))),
      e(Campo,{rot:"Observação", className:"min-w-[10rem] flex-1"}, e("input",{value:f.obs, className:INPUT+" h-10!", onChange:function(ev){ setF(Object.assign({}, f, {obs:ev.target.value})); }})),
      e(Btn,{v:"primary", disabled:!f.colabId || !f.tipoId || parseHoras(f.horas)===null, onClick:function(){ acao(c, "he_add", f); setF(Object.assign({}, f, {horas:"", obs:""})); }}, "Lançar"))),
    e("div",{className:"grid grid-cols-1 gap-4 lg:grid-cols-[1fr_22rem]"},
      e(BlocoBarra,{cor:"ouro", t:"Lançamentos do período"}, lista.length===0 ? e("p",{className:"px-4 py-8 text-center text-[13px] text-muted-foreground"}, "Nenhuma hora extra no período.") :
        e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Data"), th("Colaboradora"), th("Tipo"), th("Horas")].concat(c.veSalario ? [th("Custo")] : [], [th("")]))),
          e("tbody",null, lista.map(function(h){ var p = pessoa(h.colabId); return e("tr",{key:h.id, className:"border-b border-border/60"}, e("td",{className:TD}, br(h.data)), e("td",{className:TD+" font-semibold"}, p ? p.nome : "—", h.obs && e("span",{className:"block text-[11.5px] font-normal text-muted-foreground"}, h.obs)), e("td",{className:TD}, tipo(h.tipoId).nome), e("td",{className:TD+" "+MONO}, formatHoras(h.horas)),
            c.veSalario && e("td",{className:TD+" "+MONO}, tipo(h.tipoId).pct>0 ? BK(custo(h)) : "banco"), e("td",{className:TD}, e("button",{onClick:function(){ if(window.confirm("Excluir este lançamento?")) acao(c, "he_del", {id:h.id}); }, "aria-label":"Excluir", className:"grid size-8 place-items-center rounded-lg bg-muted/50 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"}, e(Ph,{n:"trash", s:15})))); }))))),
      e(BlocoBarra,{cor:"ouro", t:"Por pessoa"}, e("div",{className:"flex flex-col divide-y divide-white/10 px-4 py-1"}, resumo.length===0 ? e("p",{className:"py-4 text-[13px] text-muted-foreground"}, "Sem lançamentos.") : resumo.map(function(r){ var p = pessoa(r.id);
        return e("div",{key:r.id, className:"flex flex-col gap-0.5 py-2 text-[13px]"}, e("b",null, p ? p.nome : "—"), e("span",{className:"text-[12px] text-muted-foreground"}, "pagas "+formatHoras(r.pagas)+" · banco "+formatHoras(r.banco)+(c.veSalario ? " · custo "+BK(r.custo) : ""))); })))));
}

// ───────────────── Negociações (hora extra por fora) ─────────────────
// Valores fechados em reais, combinados com cada pessoa. Cada pessoa herda o padrão do grupo; só se preenche o que for diferente.
var CAMPOS_R = [["h1","1 hora"], ["h2","2 horas"], ["h3","3 horas"], ["sab","Sábado"]], CAMPOS_L = [["maxDia","Máx. h/dia"], ["vezesSem","Vezes/semana"], ["sabMes","Sábados/mês"]];
function AbaRhNegoc(){
  var c = useRh(), rh = c.rh, neg = rh.negoc || negocPadrao(), colabs = colaboradoresRh(c.s), nv = useState({id:"", grupoId:""}), nova = nv[0], setNova = nv[1], ng = useState(""), nomeG = ng[0], setNomeG = ng[1];
  if(!c.veSalario) return e("div",{className:"flex flex-col gap-4"}, e(PageHead,{t:"Negociações"}), e("p",{className:AVISO}, "Valores de negociação só a supervisão e a diretoria veem."));
  var dinh = function(v){ return v===null || v===undefined ? "—" : BK(v); };
  var moeda = function(valor, aoMudar, rot, padrao){ return e("div",{className:"flex flex-col items-center gap-0.5"}, e(Dinheiro,{value:valor===null||valor===undefined ? 0 : valor, label:rot, out:"ponto", className:"w-28", onChange:function(v){ aoMudar(v==="" || Number(v)===0 ? null : Number(v)); }}),
    padrao!==undefined && (valor===null || valor===undefined) && e("span",{className:"text-[11px] text-muted-foreground"}, "padrão "+dinh(padrao))); };
  var limite = function(valor, aoMudar, rot, padrao){ return e("div",{className:"flex flex-col items-center gap-0.5"}, e("input",{key:rot+valor, type:"number", min:0, defaultValue:valor===null||valor===undefined ? "" : valor, "aria-label":rot, placeholder:padrao!==undefined && padrao!==null ? String(padrao) : "—", className:INPUT+" h-10! w-16 text-center "+MONO,
    onBlur:function(ev){ var v = ev.target.value==="" ? null : Number(ev.target.value); if(v!==valor) aoMudar(v); }})); };
  var setG = function(g, patch){ acao(c, "neg_grupo_set", {id:g.id, patch:patch}); }, setP = function(p, patch){ acao(c, "neg_pessoa_set", {id:p.id, patch:patch}); };
  var lixo = function(fn){ return e("button",{onClick:fn, "aria-label":"Excluir", className:"grid size-8 place-items-center rounded-lg bg-muted/50 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"}, e(Ph,{n:"trash", s:15})); };
  var semValor = neg.pessoas.filter(function(p){ var x = negocEfetiva(rh, p.id); return x.h1===null && x.h2===null && x.sab===null; }).length;
  var pendentes = neg.pessoas.filter(function(p){ return /pendente|vincular|confirmar/i.test(p.obs||""); }).length;
  var jaTem = {}; neg.pessoas.forEach(function(p){ jaTem[p.id] = 1; });
  var cab = function(l){ return l.map(function(x){ return th(x, "text-center"); }); };
  var nomesR = CAMPOS_R.map(function(k){ return k[1]; }), nomesL = CAMPOS_L.map(function(k){ return k[1]; });
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Negociações", sub:"Hora extra combinada em reais, por fora da folha. Não substitui a hora extra oficial. Cada pessoa herda o padrão do grupo; preencha só o que for diferente."}),
    e("div",{className:"grid grid-cols-2 gap-3 xl:grid-cols-4"}, e(Tile,{t:"Pessoas", v:int(neg.pessoas.length), cor:"#E8B84B"}), e(Tile,{t:"Grupos", v:int(neg.grupos.length), cor:"#60A5FA"}), e(Tile,{t:"Sem valor definido", v:int(semValor), cor:"#F59E0B"}), e(Tile,{t:"A confirmar", v:int(pendentes), cor:"#EF4444"})),
    e(BlocoBarra,{cor:"ouro", t:"Padrão por grupo", sub:"valor que cada pessoa do grupo recebe, salvo exceção na linha dela"},
      e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"},
        e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Grupo")].concat(cab(nomesR), cab(nomesL), [th("Observação"), th("")]))),
        e("tbody",null, neg.grupos.map(function(g){ return e("tr",{key:g.id, className:"border-b border-border/60"},
          e("td",{className:TD}, e("input",{key:g.id+g.nome, defaultValue:g.nome, "aria-label":"Nome do grupo", className:INPUT+" h-10! w-52 font-semibold", onBlur:function(ev){ if(ev.target.value.trim() && ev.target.value!==g.nome) setG(g, {nome:ev.target.value.trim()}); }})),
          CAMPOS_R.map(function(k){ return e("td",{key:k[0], className:TD+" text-center"}, moeda(g[k[0]], function(v){ var o = {}; o[k[0]] = v; setG(g, o); }, k[1])); }),
          CAMPOS_L.map(function(k){ return e("td",{key:k[0], className:TD+" text-center"}, limite(g[k[0]], function(v){ var o = {}; o[k[0]] = v; setG(g, o); }, k[1])); }),
          e("td",{className:TD}, e("input",{key:g.id+g.obs, defaultValue:g.obs, "aria-label":"Observação", className:INPUT+" h-10! w-64", onBlur:function(ev){ if(ev.target.value!==g.obs) setG(g, {obs:ev.target.value}); }})),
          e("td",{className:TD}, lixo(function(){ if(window.confirm("Excluir o grupo "+g.nome+"?")) acao(c, "neg_grupo_del", {id:g.id}); }))); })))),
      e("div",{className:"flex flex-wrap items-center gap-2 border-t border-white/10 p-3"}, e("input",{value:nomeG, placeholder:"Nome do novo grupo", className:INPUT+" h-9! w-64", onChange:function(ev){ setNomeG(ev.target.value); }}), e(Btn,{v:"secondary", sm:true, disabled:!nomeG.trim(), onClick:function(){ acao(c, "neg_grupo_add", {nome:nomeG}); setNomeG(""); }}, "+ Novo grupo"))),
    e(BlocoBarra,{cor:"ouro", t:"Negociação de cada pessoa", sub:"campo vazio = vale o padrão do grupo (aparece embaixo, em cinza)"},
      e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"},
        e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Pessoa"), th("Grupo")].concat(cab(nomesR), cab(nomesL), [th("Observação"), th("")]))),
        e("tbody",null, neg.pessoas.map(function(p){ var g = neg.grupos.find(function(x){ return x.id===p.grupoId; }) || {}; return e("tr",{key:p.id, className:"border-b border-border/60"},
          e("td",{className:TD+" font-semibold whitespace-nowrap"}, p.nome),
          e("td",{className:TD}, e(Sel,{value:p.grupoId, label:"Grupo", className:"w-48", onChange:function(v){ setP(p, {grupoId:v}); }}, neg.grupos.map(function(x){ return e("option",{key:x.id, value:x.id}, x.nome); }))),
          CAMPOS_R.map(function(k){ return e("td",{key:k[0], className:TD+" text-center"}, moeda(p[k[0]], function(v){ var o = {}; o[k[0]] = v; setP(p, o); }, k[1], g[k[0]])); }),
          CAMPOS_L.map(function(k){ return e("td",{key:k[0], className:TD+" text-center"}, limite(p[k[0]], function(v){ var o = {}; o[k[0]] = v; setP(p, o); }, k[1], g[k[0]])); }),
          e("td",{className:TD}, e("input",{key:p.id+p.obs, defaultValue:p.obs, "aria-label":"Observação", className:INPUT+" h-10! w-72", onBlur:function(ev){ if(ev.target.value!==p.obs) setP(p, {obs:ev.target.value}); }})),
          e("td",{className:TD}, lixo(function(){ if(window.confirm("Remover a negociação de "+p.nome+"?")) acao(c, "neg_pessoa_del", {id:p.id}); }))); })))),
      e("div",{className:"flex flex-wrap items-center gap-2 border-t border-white/10 p-3"},
        e(Sel,{value:nova.id, label:"Pessoa", className:"w-72", onChange:function(v){ setNova(Object.assign({}, nova, {id:v})); }}, e("option",{value:""}, "Incluir pessoa…"), colabs.filter(function(x){ return x.status!=="DESLIGADO" && !jaTem[x.id]; }).sort(function(a, b){ return a.nome.localeCompare(b.nome); }).map(function(x){ return e("option",{key:x.id, value:x.id}, x.nome+" · "+x.setor); })),
        e(Sel,{value:nova.grupoId, label:"Grupo", className:"w-52", onChange:function(v){ setNova(Object.assign({}, nova, {grupoId:v})); }}, e("option",{value:""}, "Grupo…"), neg.grupos.map(function(x){ return e("option",{key:x.id, value:x.id}, x.nome); })),
        e(Btn,{v:"secondary", sm:true, disabled:!nova.id || !nova.grupoId, onClick:function(){ var x = colabs.find(function(y){ return y.id===nova.id; }); acao(c, "neg_pessoa_add", {id:nova.id, nome:x ? x.nome : nova.id, grupoId:nova.grupoId}); setNova({id:"", grupoId:""}); }}, "+ Incluir"))),
    e("p",{className:"text-center text-[12px] text-muted-foreground"}, "Regras de todos os grupos: completar as horas definidas para ter direito ao valor; 3ª hora só com aprovação prévia do supervisor; metas e bônus de cada setor ficam em Financeiro > Comissões."));
}

// ───────────────── Configurador ─────────────────
function ListaCfg(p){
  var c = p.c, itens = c.rh.config[p.lista], nv = useState(p.vazio), novo = nv[0], setNovo = nv[1];
  var campo = function(it, k, cls, tipo){ return e("input",{key:it.id+k+it[k], defaultValue:it[k], type:tipo||"text", "aria-label":k, className:INPUT+" h-9! "+(cls||"w-full"), onBlur:function(ev){ var v = tipo==="number" ? Number(ev.target.value||0) : ev.target.value; if(v!==it[k]){ var o = {}; o[k] = v; acao(c, "cfg_set", {lista:p.lista, id:it.id, patch:o}); } }}); };
  return e(BlocoBarra,{cor:"ouro", t:p.t, sub:p.sub}, e("div",{className:"flex flex-col gap-2 p-4"},
    itens.map(function(it){ return e("div",{key:it.id, className:"flex flex-wrap items-center gap-2"}, p.campos.map(function(k){ return campo(it, k[0], k[1], k[2]); }), p.extra && p.extra(it),
      e("button",{onClick:function(){ if(window.confirm("Excluir?")) acao(c, "cfg_del", {lista:p.lista, id:it.id}); }, "aria-label":"Excluir", className:"grid size-8 place-items-center rounded-lg bg-muted/50 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"}, e(Ph,{n:"trash", s:15}))); }),
    e("div",{className:"flex flex-wrap items-center gap-2 border-t border-white/10 pt-2"}, p.campos.map(function(k){ return e("input",{key:k[0], value:novo[k[0]]===undefined ? "" : novo[k[0]], type:k[2]||"text", placeholder:k[3]||k[0], className:INPUT+" h-9! "+(k[1]||"w-full"), onChange:function(ev){ var o = {}; o[k[0]] = ev.target.value; setNovo(Object.assign({}, novo, o)); }}); }),
      e(Btn,{v:"secondary", sm:true, disabled:!String(novo[p.campos[0][0]]||"").trim(), onClick:function(){ var it = Object.assign({}, novo); p.campos.forEach(function(k){ if(k[2]==="number") it[k[0]] = Number(it[k[0]]||0); }); acao(c, "cfg_add", {lista:p.lista, item:it}); setNovo(p.vazio); }}, "+ Adicionar"))));
}
function AbaRhConfig(){
  var c = useRh(), cfg = c.rh.config, tb = useState("escalas"), aba = tb[0], setAba = tb[1];
  var abas = [["escalas","Escalas"], ["planos","Planos de experiência"], ["adv","Advertências"], ["he","Horas extras"], ["feriados","Feriados"], ["geral","Relatório diário"]];
  var check = function(it, dia){ var tem = it.dias.indexOf(dia)>=0; return e("label",{key:dia, className:"flex cursor-pointer items-center gap-1 text-[12px]"}, e("input",{type:"checkbox", checked:tem, className:"size-4", onChange:function(){ acao(c, "cfg_set", {lista:"escalas", id:it.id, patch:{dias:(tem ? it.dias.filter(function(x){ return x!==dia; }) : it.dias.concat([dia])).sort()}}); }}), DIAS_SEMANA[dia].slice(0,3)); };
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Configurador do RH", sub:"Escalas, planos de experiência, tipos e motivos de advertência, adicionais de hora extra, feriados e o número de sócios do relatório. Setores e empresas vêm de Pessoas e CNPJs."}),
    e("div",{className:"flex flex-wrap gap-2"}, abas.map(function(x){ return e("button",{key:x[0], onClick:function(){ setAba(x[0]); }, className:"h-10 rounded-xl px-4 text-[13px] font-bold ring-1 "+(aba===x[0] ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-border hover:bg-muted/50")}, x[1]); })),
    aba==="escalas" && e(ListaCfg,{c:c, lista:"escalas", t:"Escalas de trabalho", sub:"domingo nunca conta como dia escalado", vazio:{nome:"", dias:[1,2,3,4,5]}, campos:[["nome","w-56","text","Nome da escala"]], extra:function(it){ return e("div",{className:"flex flex-wrap gap-2"}, [1,2,3,4,5,6].map(function(d){ return check(it, d); })); }}),
    aba==="planos" && e(ListaCfg,{c:c, lista:"planos", t:"Planos de experiência", sub:"1º marco e 2º marco, em dias", vazio:{nome:"", marco1:45, marco2:45}, campos:[["nome","w-56","text","Nome"], ["marco1","w-24","number","1º marco"], ["marco2","w-24","number","2º marco"]]}),
    aba==="adv" && e("div",{className:"grid grid-cols-1 gap-4 lg:grid-cols-2"},
      e(ListaCfg,{c:c, lista:"tiposAdv", t:"Tipos de advertência", sub:"tipo com suspensão exige os dias", vazio:{nome:"", suspensao:false}, campos:[["nome","w-44","text","Nome"]], extra:function(it){ return e("label",{className:"flex cursor-pointer items-center gap-1.5 text-[12.5px]"}, e("input",{type:"checkbox", checked:!!it.suspensao, className:"size-4", onChange:function(ev){ acao(c, "cfg_set", {lista:"tiposAdv", id:it.id, patch:{suspensao:ev.target.checked}}); }}), "gera suspensão"); }}),
      e(ListaCfg,{c:c, lista:"motivosAdv", t:"Motivos de advertência", vazio:{nome:""}, campos:[["nome","w-64","text","Motivo"]]})),
    aba==="he" && e(ListaCfg,{c:c, lista:"tiposHE", t:"Adicionais de hora extra", sub:"0% = banco de horas (sem custo)", vazio:{nome:"", pct:50}, campos:[["nome","w-56","text","Nome"], ["pct","w-24","number","Adicional %"]]}),
    aba==="feriados" && e(ListaCfg,{c:c, lista:"feriados", t:"Feriados", sub:"valem para todas as empresas; feriado não conta como dia escalado", vazio:{data:"", nome:"", cnpj:""}, campos:[["data","w-44","date","Data"], ["nome","w-64","text","Nome"]]}),
    aba==="geral" && e(BlocoBarra,{cor:"ouro", t:"Relatório diário e padrões"}, e("div",{className:"flex flex-wrap items-end gap-3 p-4"},
      e(Campo,{rot:"Sócios (entram no total do relatório)"}, e("input",{key:cfg.socios, defaultValue:cfg.socios, inputMode:"numeric", className:INPUT+" h-10! w-28 text-center", onBlur:function(ev){ var v = Math.min(1000, Number(ev.target.value.replace(/\D/g,"")||0)); if(v!==cfg.socios) acao(c, "cfg_geral", {patch:{socios:v}}); }})),
      e(Campo,{rot:"Escala padrão de quem não tem"}, e(Sel,{value:cfg.escalaPadrao, label:"Escala padrão", className:"w-56", onChange:function(v){ acao(c, "cfg_geral", {patch:{escalaPadrao:v}}); }}, cfg.escalas.map(function(x){ return e("option",{key:x.id, value:x.id}, x.nome); }))),
      e(Campo,{rot:"Horário de entrada padrão"}, e("input",{type:"time", key:cfg.entradaPadrao, defaultValue:cfg.entradaPadrao, className:INPUT+" h-10! w-32", onBlur:function(ev){ if(ev.target.value && ev.target.value!==cfg.entradaPadrao) acao(c, "cfg_geral", {patch:{entradaPadrao:ev.target.value}}); }})))));
}

export { AbaRhVisao, AbaRhPresenca, AbaRhRelatorio, AbaRhColab, AbaRhAdv, AbaRhExp, AbaRhHoras, AbaRhNegoc, AbaRhConfig };

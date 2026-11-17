// Sorelly Admin · montagem — pages/RH.js
// Recursos Humanos trazido do SorellyAdmin: Visão geral (ABS e TO), Presença diária, Relatório diário, Colaboradores, Advertências, Controle de experiência, Horas extras e Configurador.
// As regras e as contas ficam em domain/rh.js; aqui só as telas. Salário e custo de hora extra só aparecem para a supervisão (sócios e RH).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Avatar, Ph } from "@/apps/montagem/components/chat/chat-ui";
import { grupoDe, nomeDe, veSalarios } from "@/apps/montagem/domain/equipe";
import { FUNCIONARIOS_POR_SETOR } from "@/apps/montagem/domain/pessoas";
import { CODIGOS, DIAS_SEMANA, MESES, STATUS, TIPOS_DESLIG, advertenciasComSeq, br, colaboradoresRh, dataIso, desligadosDoPeriodo, diaEscalado, diaSem, experienciaLista, flagAdv, formatHoras, formatarRelatorio, hojeIso,
  parseHoras, porEmpresaStats, presencaDe, relatorioAdvertencias, relatorioDiario, resumoAdvertencias, rotuloCnpj, statsEscopo, ultimoDia, valorHoraExtra, negocPadrao, negocEfetiva } from "@/apps/montagem/domain/rh";
import { Dinheiro, Janela, Pagina } from "@/apps/montagem/components/padrao";
import { BlocoResumo } from "@/apps/montagem/components/bloco-resumo";
import { Bloco, Bloco as BlocoPadrao, Botao, CAMPO, CampoSel, Rotulo, Segmentado, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { FichaCaixa, FichaMoldura, FichaPar } from "@/apps/montagem/components/ficha-moldura";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { CampoDin, CampoTexto } from "@/apps/montagem/pages/trafego/comum";
import { FichaExperiencia, ConfigFicha, Pessoa } from "@/apps/montagem/pages/rh/FichaExperiencia";
import { ehGestorDe, fichaCfg, fichaDe, resultadoFicha } from "@/apps/montagem/domain/rh-ficha";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
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
  return {s:s, d:cx.dispatch, rh:s.rh, por:nomeDe(s.usuario), veSalario:veSalarios(s.usuario)};
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
  var c = useRh(), es = useEscopo(), esc = es[0], rh = c.rh, nf = useState({id:"", data:hojeIso(), hora:""}), form = nf[0], setForm = nf[1], vs = useState("dia"), vista = vs[0], setVista = vs[1], dd = useState(hojeIso()), diaSel = dd[0], setDiaSel = dd[1], bd = useState(""), buscaDia = bd[0], setBuscaDia = bd[1], od = useState(""), ocDia = od[0], setOcDia = od[1];
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
      e("div",{className:"flex gap-2"}, [["dia","Visão do dia"],["mes","Grade do mês"]].map(function(v){ return e(Btn,{key:v[0], v:vista===v[0] ? "primary" : "ghost", onClick:function(){ setVista(v[0]); }}, v[1]); })),
      vista==="dia" && (function(){
        var escDia = todos.filter(function(x){ return diaEscalado(rh, x, diaSel); }), presentes = escDia.filter(function(x){ var q = presencaDe(rh, x.id, diaSel); return q && q.c==="P"; }).length, semLanc = escDia.filter(function(x){ var q = presencaDe(rh, x.id, diaSel); return !q || !q.c; }).length;
        var nq = String(buscaDia||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
        var doDia = escDia.filter(function(x){ var q = presencaDe(rh, x.id, diaSel), cod = q && q.c ? q.c : ""; return (!nq || String(x.nome).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").indexOf(nq)>=0) && (!ocDia || (ocDia==="SEM" ? !cod : cod===ocDia)); }).sort(function(a, b){ return a.nome.localeCompare(b.nome, "pt-BR"); });   // ordem alfabética, busca por nome e filtro por ocorrência (pedido da Maria Claudia)
        return e(BlocoBarra,{cor:"ouro", t:"Dia "+br(diaSel)+" · "+DIAS_SEMANA[diaSem(diaSel)], sub:escDia.length+" escaladas · "+presentes+" presentes · "+semLanc+" sem lançamento"+(doDia.length!==escDia.length ? " · "+doDia.length+" na lista" : "")},
          e("div",{className:"flex flex-wrap items-center gap-2 p-3"}, e("input",{type:"date", value:diaSel, "aria-label":"Dia", className:INPUT+" h-8! w-40", onChange:function(ev){ if(ev.target.value) setDiaSel(ev.target.value); }}), e(Btn,{v:"ghost", onClick:function(){ setDiaSel(hojeIso()); }}, "Hoje"), e("input",{value:buscaDia, placeholder:"Buscar nome", "aria-label":"Buscar nome", className:INPUT+" h-8! w-44", onChange:function(ev){ setBuscaDia(ev.target.value); }}), e("select",{value:ocDia, "aria-label":"Filtrar por ocorrência", className:INPUT+" h-8! w-44 cursor-pointer", onChange:function(ev){ setOcDia(ev.target.value); }}, e("option",{value:""}, "Todas as ocorrências"), e("option",{value:"SEM"}, "Sem lançamento"), CODIGOS.map(function(k){ return e("option",{key:k[0], value:k[0]}, k[0]+" · "+k[1]); })), e(Btn,{v:"primary", disabled:semLanc===0, onClick:function(){ acao(c, "pres_marcar_dia", {data:diaSel, cnpj:esc.cnpj}); }}, "Marcar todos como presentes"), e("span",{className:"text-[13px] text-muted-foreground"}, "Depois, marque só quem faltou.")),
          e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Colaboradora"), th("Setor"), th("Situação"), th("Atraso")])),
            e("tbody",null, doDia.length===0 ? e("tr",null, e("td",{colSpan:4, className:"px-3 py-6 text-center text-muted-foreground"}, "Ninguém escalada neste dia.")) : doDia.map(function(x){ var q = presencaDe(rh, x.id, diaSel), atual = q && q.c ? q.c : "";
              return e("tr",{key:x.id, className:"border-b border-border/60"}, e("td",{className:TD+" font-semibold"}, x.nome), e("td",{className:TD}, x.setor),
                e("td",{className:TD}, e("div",{className:"flex flex-wrap gap-1"}, ["P","F","AJ","AT","FE","FO","AF"].map(function(cod){ var on = atual===cod; return e("button",{key:cod, title:(CODIGOS.find(function(k){ return k[0]===cod; })||[])[1], onClick:function(){ acao(c, "pres_set", {id:x.id, data:diaSel, codigo:on ? "" : cod}); }, className:"h-8 w-10 rounded text-[13px] font-bold", style:{background:on ? corDe(cod) : corDe(cod)+"26", color:on ? "#0b0b0b" : corDe(cod)}}, cod); }))),
                e("td",{className:TD+" "+MONO}, q && q.atraso ? q.atraso : "—")); }))))); })(),
      vista==="mes" && e(BlocoBarra,{cor:"ouro", t:MESES[esc.mes-1]+" de "+esc.ano, sub:todos.length+" ativas · ABS do mês "+pc(st.abs)},
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
            e(Campo,{rot:"Colaboradora"}, e(Sel,{value:form.id, label:"Colaboradora", className:"w-72", onChange:function(v){ setForm(Object.assign({}, form, {id:v})); }}, e("option",{value:""}, "Escolha…"), todos.slice().sort(function(a, b){ return String(a.nome).localeCompare(String(b.nome), "pt-BR"); }).map(function(x){ return e("option",{key:x.id, value:x.id}, x.nome); }))),
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
  var c = p.c, x = p.x, cfg = c.rh.config, st = useState({setor:x.setor||"", admissao:x.admissao||"", escalaId:x.escalaId, entrada:x.entrada||"", saida:x.saida||"", salario:x.salario ? String(x.salario).replace(".",",") : "", planoId:x.planoId||"", status:x.status, funcao:x.funcao||"", telefone:x.telefone||"", cidade:x.cidade||"", nascimento:x.nascimento||"", folha:x.folha||"", vt:x.vt||"", termoPeca:x.termoPeca ? "sim" : "nao", cpf:x.cpf||"", aviso:!!x.aviso,
    fIni:(x.ferias||{}).ini||"", fFim:(x.ferias||{}).fim||"", afast:x.afastamento||"", dData:(x.deslig||{}).data||"", dTipo:(x.deslig||{}).tipo||"", dMotivo:(x.deslig||{}).motivo||"", dObs:(x.deslig||{}).obs||""}), f = st[0], set = function(o){ st[1](Object.assign({}, f, o)); };
  var salvar = function(){ var sal = Number(String(f.salario||"0").replace(/\./g,"").replace(",","."))||0;
    acao(c, "colab_set", {id:x.id, patch:Object.assign({setor:f.setor, admissao:f.admissao, escalaId:f.escalaId, entrada:f.entrada, saida:f.saida, salario:sal, planoId:f.planoId, status:f.status, funcao:f.funcao, telefone:f.telefone, cidade:f.cidade, nascimento:f.nascimento, folha:f.folha, vt:f.vt, termoPeca:f.termoPeca==="sim", aviso:f.aviso}, c.veSalario ? {cpf:f.cpf.replace(/\D/g,"")} : {}, { ferias:f.status==="FERIAS" ? {ini:f.fIni, fim:f.fFim} : null, afastamento:f.afast, deslig:f.status==="DESLIGADO" ? {data:f.dData, tipo:f.dTipo, motivo:f.dMotivo, obs:f.dObs} : null})}); p.fechar(); };
  var inp = function(k, tipo, cls){ return e("input",{type:tipo||"text", value:f[k], "aria-label":k, className:CAMPO+" "+(cls||""), onChange:function(ev){ var o = {}; o[k] = ev.target.value; set(o); }}); };
  var cp = function(rot, k, tipo){ return e("div",{key:k, className:"min-w-0"}, e(Rotulo,{t:rot}), inp(k, tipo)); };
  var sl = function(rot, k, opcoes){ return e(CampoSel,{key:k, t:rot, value:f[k], onChange:function(v){ var o = {}; o[k] = v; set(o); }, opcoes:opcoes}); };
  var sec = function(t2, filhos, key){ return e(FichaCaixa,{key:key, t:t2}, filhos); };
  var setores = (FUNCIONARIOS_POR_SETOR.some(function(s2){ return s2[0]===f.setor; }) ? [] : [[f.setor]]).concat(FUNCIONARIOS_POR_SETOR).map(function(s2){ return [s2[0], s2[0]]; });
  var negoc = c.veSalario && (function(){ var n = negocEfetiva(c.rh, x.id), m = function(v){ return v===null||v===undefined ? "—" : BK(v); }; return n ? n.grupo+" · 1h "+m(n.h1)+" · 2h "+m(n.h2)+" · 3h "+m(n.h3)+" · sábado "+m(n.sab) : "Sem negociação (editar em RH › Negociações)"; })();
  var stNome = ((STATUS.find(function(k){ return k[0]===f.status; })||[])[1]||f.status)+(f.aviso ? " · aviso prévio" : "");
  var cabeca = e(FichaCaixa,{key:"cab", t:"Colaboradora"}, e("div",{className:"flex flex-col gap-2"},
    e("div",{className:"grid place-items-center"}, e(Avatar,{id:"f_"+String(x.id).replace(/-/g, ""), nome:x.nome, s:220})),
    e("div",{className:"flex flex-col"}, e(FichaPar,{t:"Nome", v:x.nome}), e(FichaPar,{t:"Setor", v:x.setor}), e(FichaPar,{t:"Função", v:x.funcao || "—"}), e(FichaPar,{t:"Empresa", v:rotuloCnpj(x.cnpj)}),
      e(FichaPar,{t:"Admissão", v:x.admissao ? br(x.admissao) : "Faltando", cor:x.admissao ? "" : "text-amber-400"}), e(FichaPar,{t:"Situação", v:stNome, cor:f.status==="ATIVO" ? "text-emerald-400" : f.status==="DESLIGADO" ? "text-red-400" : "text-amber-400"}))));
  var horaExtra = negoc ? e(FichaCaixa,{key:"he", t:"Hora extra negociada"}, e("span",{className:"text-[13px]"}, negoc)) : null;
  var trabalho = sec("Trabalho", e("div",{className:"grid grid-cols-2 gap-2"},
      sl("Setor", "setor", setores), cp("Função", "funcao"), cp("Admissão", "admissao", "date"),
      sl("Situação", "status", STATUS.map(function(k){ return [k[0], k[1]]; })), cp("Entrada", "entrada", "time"), cp("Saída", "saida", "time"),
      sl("Escala", "escalaId", cfg.escalas.map(function(k){ return [k.id, k.nome]; })), sl("Plano de experiência", "planoId", [["", "Sem plano"]].concat(cfg.planos.map(function(k){ return [k.id, k.nome+" ("+k.marco1+" + "+k.marco2+")"]; }))),
      e("label",{key:"av", className:"col-span-2 flex h-8 cursor-pointer items-center gap-2 text-[13px]"}, e("input",{type:"checkbox", checked:f.aviso, className:"size-4", onChange:function(ev){ set({aviso:ev.target.checked}); }}), "Cumprindo aviso prévio")), "t");
  var pessoal = sec("Pessoal", e("div",{className:"grid grid-cols-2 gap-2"},
      cp("Telefone", "telefone"), cp("Cidade", "cidade"), cp("Nascimento", "nascimento", "date"), cp("Nº da folha", "folha"), cp("Vale-transporte", "vt"),
      sl("Termo de peças", "termoPeca", [["sim", "Sim"], ["nao", "Não"]]),
      c.veSalario && cp("Salário (R$)", "salario"), c.veSalario && cp("CPF", "cpf")), "p");
  var extra = f.status==="FERIAS" ? sec("Férias", e("div",{className:"grid grid-cols-2 gap-2"}, cp("Início", "fIni", "date"), cp("Fim", "fFim", "date")), "x")
    : f.status==="AFASTADO" ? sec("Afastamento", cp("Motivo do afastamento", "afast"), "x")
    : f.status==="DESLIGADO" ? sec("Desligamento", e("div",{className:"grid grid-cols-2 gap-2"}, cp("Data", "dData", "date"), sl("Tipo", "dTipo", [["", "Escolha"]].concat(TIPOS_DESLIG.map(function(k){ return [k, k]; }))), e("div",{key:"m", className:"col-span-2"}, e(Rotulo,{t:"Motivo"}), inp("dMotivo")), e("div",{key:"o", className:"col-span-2"}, e(Rotulo,{t:"Observação"}), inp("dObs"))), "x") : null;
  var rodape = [x.novo ? e(Botao,{key:"e", onClick:function(){ if(window.confirm("Excluir "+x.nome+"? Apaga também presenças, advertências e horas extras dela.")){ acao(c, "colab_del", {id:x.id}); p.fechar(); } }}, "Excluir cadastro") : null, e(Botao,{key:"c", onClick:p.fechar}, "Cancelar"), e(Botao,{key:"s", principal:true, onClick:salvar}, "Salvar")];
  return e(FichaMoldura,{t:"Ficha da colaboradora", fechar:p.fechar, esquerda:cabeca, direita:[e("div",{key:"g", className:"grid items-start gap-2 md:grid-cols-2"}, trabalho, pessoal), horaExtra, extra], rodape:rodape});
}
// ───────────────── Horas extras como visão de Colaboradores ─────────────────
// Uma pessoa por linha, uma coluna por dia (HH:MM extra do dia; no modo Anual, uma por mês), totais, custo e a negociação de cada pessoa. Clicar na linha abre o card com todos os lançamentos.
var SEL_AZUL = "h-7 cursor-pointer rounded-md border border-white/30 bg-white/20 px-1.5 text-center text-[13px] text-white outline-none [text-align-last:center] hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white";
function heIntervalo(esc){ return esc.anual ? [esc.ano+"-01-01", esc.ano+"-12-31"] : [dataIso(esc.ano, esc.mes, 1), dataIso(esc.ano, esc.mes, ultimoDia(esc.ano, esc.mes))]; }
function heLancamentos(c, esc){
  var rh = c.rh, colabs = colaboradoresRh(c.s), iv = heIntervalo(esc);
  return (rh.horas||[]).filter(function(h){ var p = colabs.find(function(y){ return y.id===h.colabId; }); return h.data>=iv[0] && h.data<=iv[1] && p && (!esc.cnpj || p.cnpj===esc.cnpj); });
}
function heTipo(c, id){ return c.rh.config.tiposHE.find(function(x){ return x.id===id; }) || {nome:"—", pct:0}; }
function heCusto(c, h){ var p = colaboradoresRh(c.s).find(function(y){ return y.id===h.colabId; }); return p ? valorHoraExtra(p.salario||0, h.horas, heTipo(c, h.tipoId).pct) : 0; }
function heDados(c, esc){
  var colabs = colaboradoresRh(c.s), lista = heLancamentos(c, esc), por = {}, nCol = esc.anual ? 12 : ultimoDia(esc.ano, esc.mes);
  lista.forEach(function(h){ var p = colabs.find(function(y){ return y.id===h.colabId; }); var o = por[h.colabId] = por[h.colabId] || {id:h.colabId, nome:p.nome, setor:p.setor, pagas:0, banco:0, custo:0, n:0};
    var k = esc.anual ? Number(h.data.slice(5, 7)) : Number(h.data.slice(8, 10)); o["d"+k] = (o["d"+k]||0)+h.horas; o.n++;
    if(heTipo(c, h.tipoId).pct>0){ o.pagas += h.horas; o.custo += heCusto(c, h); } else o.banco += h.horas; });
  var linhas = Object.keys(por).map(function(k){ var o = por[k], ng = c.veSalario ? negocEfetiva(c.rh, o.id) : null;
    o.grupo = ng ? ng.grupo : "—"; ["h1","h2","h3","sab","maxDia","vezesSem","sabMes"].forEach(function(f){ o[f] = ng && ng[f]!==null && ng[f]!==undefined ? ng[f] : ""; }); return o; })
    .sort(function(a, b){ return (b.pagas+b.banco)-(a.pagas+a.banco) || a.nome.localeCompare(b.nome); });
  var hh = function(v){ return v ? formatHoras(v) : ""; }, din = function(v){ return v==="" || v===null ? "" : BK(v); };
  var cols = [{k:"nome", t:"Nome", fixa:true}, {k:"setor", t:"Setor"}];
  for(var i = 1; i<=nCol; i++){ (function(i){ var sab = !esc.anual && diaSem(dataIso(esc.ano, esc.mes, i))===6; cols.push({k:"d"+i, t:esc.anual ? MESES[i-1] : String(i), fmt:hh, corTopo:sab ? "#F59E0B" : undefined}); })(i); }
  cols.push({k:"pagas", t:"Pagas", fmt:hh}, {k:"banco", t:"Banco de horas", fmt:hh});
  if(c.veSalario) cols.push({k:"custo", t:"Custo", fmt:function(v){ return v ? BK(v) : ""; }}, {k:"grupo", t:"Grupo da negociação"}, {k:"h1", t:"Negociado 1 hora", fmt:din}, {k:"h2", t:"Negociado 2 horas", fmt:din}, {k:"h3", t:"Negociado 3 horas", fmt:din}, {k:"sab", t:"Negociado sábado", fmt:din},
    {k:"maxDia", t:"Máximo de horas por dia"}, {k:"vezesSem", t:"Vezes por semana"}, {k:"sabMes", t:"Sábados por mês"});
  var totalLinha = function(ls){ return cols.map(function(cl, j){ if(j===0) return "Total"; if(j===1) return ls.length.toLocaleString("pt-BR")+" pessoas";
    if(/^d\d+$/.test(cl.k) || cl.k==="pagas" || cl.k==="banco"){ var s = 0; ls.forEach(function(l){ s += l[cl.k]||0; }); return hh(s); } if(cl.k==="custo"){ var t2 = 0; ls.forEach(function(l){ t2 += l.custo||0; }); return t2 ? BK(t2) : ""; } return ""; }); };
  return {cols:cols, linhas:linhas, totalLinha:totalLinha, lista:lista};
}
function HeForm(pp){
  var c = pp.c, cfg = c.rh.config, st = useState({colabId:pp.colabId||"", data:hojeIso(), horas:"", tipoId:"", obs:""}), f = st[0], setF = st[1];
  var set = function(k, v){ var o = {}; o[k] = v; setF(Object.assign({}, f, o)); };
  var ativos = colaboradoresRh(c.s).filter(function(x){ return x.status==="ATIVO"; }).sort(function(a, b){ return a.nome.localeCompare(b.nome, "pt-BR"); });
  var form = e("div",{key:"f", className:"grid grid-cols-2 items-end gap-x-3 gap-y-2 md:grid-cols-4"},
    e(CampoSel,{t:"Colaboradora", value:f.colabId, cls:"col-span-2", onChange:function(v){ set("colabId", v); }, opcoes:[["", "Escolha"]].concat(ativos.map(function(x){ return [x.id, x.nome]; }))}),
    e("div",null, e(Rotulo,{t:"Data"}), e("input",{type:"date", value:f.data, "aria-label":"Data", className:CAMPO+" text-center", onChange:function(ev){ set("data", ev.target.value); }})),
    e("div",null, e(Rotulo,{t:"Horas (HH:MM)"}), e("input",{value:f.horas, placeholder:"02:30", "aria-label":"Horas", className:CAMPO+" text-center tabular-nums", onChange:function(ev){ set("horas", ev.target.value.replace(/[^\d:]/g, "")); }})),
    e(CampoSel,{t:"Tipo", value:f.tipoId, cls:"col-span-2", onChange:function(v){ set("tipoId", v); }, opcoes:[["", "Escolha"]].concat(cfg.tiposHE.map(function(x){ return [x.id, x.nome]; }))}),
    e("div",{className:"col-span-2"}, e(Rotulo,{t:"Observação"}), e("input",{value:f.obs, "aria-label":"Observação", className:CAMPO, onChange:function(ev){ set("obs", ev.target.value); }})));
  return e(Janela,{t:"Lançar hora extra", sub:"Horas em HH:MM. Valor = salário ÷ 220 × horas × (1 + adicional). Tipo com 0% é banco de horas e não tem custo.", fechar:pp.fechar, colunas:[form],
    rodape:[e(Botao,{key:"c", onClick:pp.fechar}, "Fechar"), e(Botao,{key:"s", principal:true, desabilitado:!f.colabId || !f.tipoId || parseHoras(f.horas)===null, onClick:function(){ acao(c, "he_add", f); setF(Object.assign({}, f, {horas:"", obs:""})); }}, "Lançar")]});
}
function HeJanelas(pp){
  var c = pp.c, esc = pp.esc, pid = pp.pessoa, dados = heDados(c, esc), colabs = colaboradoresRh(c.s), col = pid && colabs.find(function(y){ return y.id===pid; });
  var resumo = dados.linhas.find(function(l){ return l.id===pid; }) || {pagas:0, banco:0, custo:0};
  var meus = dados.lista.filter(function(h){ return h.colabId===pid; }).sort(function(a, b){ return b.data.localeCompare(a.data); }).map(function(h){ var t = heTipo(c, h.tipoId);
    return {id:h.id, data:h.data, tipo:t.nome, horas:h.horas, custo:t.pct>0 ? heCusto(c, h) : "Banco", obs:h.obs||"", acao:"Excluir"}; });
  var ng = col && c.veSalario ? negocEfetiva(c.rh, pid) : null, mon = function(v){ return v===null || v===undefined ? "—" : BK(v); };
  var periodo = esc.anual ? String(esc.ano) : MESES[esc.mes-1]+" de "+esc.ano;
  var colsL = [{k:"data", t:"Data", fmt:function(v){ return br(v); }}, {k:"tipo", t:"Tipo"}, {k:"horas", t:"Horas", fmt:function(v){ return formatHoras(v); }}].concat(c.veSalario ? [{k:"custo", t:"Custo", fmt:function(v){ return typeof v==="number" ? BK(v) : v; }}] : [], [{k:"obs", t:"Observação"},
    {k:"acao", t:"Ações", render:function(v, l){ return e(Botao,{onClick:function(){ if(window.confirm("Excluir este lançamento?")) acao(c, "he_del", {id:l.id}); }}, "Excluir"); }}]);
  var ficha = col && e(FichaMoldura,{t:"Horas extras · "+col.nome+" · "+periodo, fechar:pp.fecharPessoa,
    esquerda:[e(FichaCaixa,{key:"p", t:"Colaboradora"}, e("div",{className:"flex flex-col gap-2"}, e("div",{className:"grid place-items-center"}, e(Avatar,{id:"f_"+String(col.id).replace(/-/g, ""), nome:col.nome, s:180})),
        e("div",{className:"flex flex-col"}, e(FichaPar,{t:"Nome", v:col.nome}), e(FichaPar,{t:"Setor", v:col.setor}), e(FichaPar,{t:"Função", v:col.funcao || "—"}), e(FichaPar,{t:"Horas pagas", v:formatHoras(resumo.pagas)}), e(FichaPar,{t:"Banco de horas", v:formatHoras(resumo.banco)}), c.veSalario && e(FichaPar,{t:"Custo", v:BK(resumo.custo)})))),
      c.veSalario && e(FichaCaixa,{key:"n", t:"Negociação"}, ng ? e("div",{className:"flex flex-col"}, e(FichaPar,{t:"Grupo", v:ng.grupo}), e(FichaPar,{t:"1 hora", v:mon(ng.h1)}), e(FichaPar,{t:"2 horas", v:mon(ng.h2)}), e(FichaPar,{t:"3 horas", v:mon(ng.h3)}), e(FichaPar,{t:"Sábado", v:mon(ng.sab)}),
        e(FichaPar,{t:"Máximo de horas por dia", v:ng.maxDia===null ? "—" : String(ng.maxDia)}), e(FichaPar,{t:"Vezes por semana", v:ng.vezesSem===null ? "—" : String(ng.vezesSem)}), e(FichaPar,{t:"Sábados por mês", v:ng.sabMes===null ? "—" : String(ng.sabMes)}), ng.obs && e(FichaPar,{t:"Observação", v:ng.obs})) : e("span",{className:"text-[13px]"}, "Sem negociação (incluir na visão Negociações)."))],
    direita:e(FichaCaixa,{t:"Lançamentos", dir:e("button",{type:"button", onClick:function(){ pp.setAbrir("novo"); }, className:"h-5 rounded border border-white/45 bg-white/10 px-2 text-[11px] font-normal normal-case leading-none tracking-normal hover:bg-white/25"}, "Lançar hora extra")},
      e(TabelaPlanilha,{cols:colsL, linhas:meus, chave:"id", escura:true, grade:true, semContagem:true, semLimpar:true, limite:100, vazio:"Nenhuma hora extra no período."}))});
  return e("div",null, ficha, pp.abrir==="novo" && e(HeForm,{c:c, colabId:pid||"", fechar:function(){ pp.setAbrir(""); }}));
}

// ───────────────── Negociações como visão de Colaboradores ─────────────────
// Hora extra combinada em reais, por fora da folha. Uma pessoa por linha (valor efetivo: o dela ou o padrão do grupo); clicar abre o card de edição; os grupos ficam numa janela.
var REGRAS_NEG = ["Completar as horas definidas para ter direito ao valor.", "A 3ª hora só com aprovação prévia do supervisor.", "Metas e bônus de cada setor ficam em Financeiro › Comissões.", "Não substitui a hora extra oficial. Cada pessoa herda o padrão do grupo; preencha só o que for diferente."];
function negDados(c){
  var rh = c.rh, neg = rh.negoc || negocPadrao(), colabs = colaboradoresRh(c.s), din = function(v){ return v===null || v===undefined ? "" : v; };
  var linhas = neg.pessoas.map(function(p){ var x = colabs.find(function(y){ return y.id===p.id; }), ef = negocEfetiva(rh, p.id), sem = ef.h1===null && ef.h2===null && ef.sab===null, pend = /pendente|vincular|confirmar/i.test(p.obs||"");
    return {id:p.id, nome:p.nome, setor:x ? x.setor : "—", grupo:ef.grupo, h1:din(ef.h1), h2:din(ef.h2), h3:din(ef.h3), sab:din(ef.sab), maxDia:din(ef.maxDia), vezesSem:din(ef.vezesSem), sabMes:din(ef.sabMes), sit:sem ? "Sem valor" : pend ? "A confirmar" : "Completa", obs:p.obs||""}; })
    .sort(function(a, b){ return a.nome.localeCompare(b.nome, "pt-BR"); });
  var moeda = function(v){ return v==="" ? "" : BK(v); };
  var cols = [{k:"nome", t:"Nome"}, {k:"setor", t:"Setor"}, {k:"grupo", t:"Grupo"}, {k:"h1", t:"1 hora", fmt:moeda}, {k:"h2", t:"2 horas", fmt:moeda}, {k:"h3", t:"3 horas", fmt:moeda}, {k:"sab", t:"Sábado", fmt:moeda},
    {k:"maxDia", t:"Máximo de horas por dia"}, {k:"vezesSem", t:"Vezes por semana"}, {k:"sabMes", t:"Sábados por mês"},
    {k:"sit", t:"Situação", cor:function(l){ return l.sit==="Completa" ? "text-emerald-400" : l.sit==="A confirmar" ? "text-red-400" : "text-amber-400"; }}, {k:"obs", t:"Observação"}];
  return {cols:cols, linhas:linhas, neg:neg};
}
function negCampos(c, alvo, aoSet, padrao){
  // campos de valor: vazio = vale o padrão do grupo (o valor do padrão aparece no título do campo)
  var rotP = function(t2, k){ var v = alvo[k], pd = padrao ? padrao[k] : null; return v===null || v===undefined ? (pd!==null && pd!==undefined ? t2+" · padrão "+(k==="sab" || k==="h1" || k==="h2" || k==="h3" ? BK(pd) : pd) : t2) : t2; };
  var mo = function(k, t2){ return e(CampoDin,{key:k, t:rotP(t2, k), id:"neg-"+alvo.id+k, value:alvo[k]===null || alvo[k]===undefined ? null : alvo[k], onChange:function(v){ var o = {}; o[k] = v==="" || v===null || Number(v)===0 ? null : Number(v); aoSet(o); }}); };
  var nu = function(k, t2){ return e("div",{key:k, className:"min-w-0"}, e(Rotulo,{t:rotP(t2, k), id:"neg-"+alvo.id+k}), e("input",{id:"neg-"+alvo.id+k, type:"number", min:0, value:alvo[k]===null || alvo[k]===undefined ? "" : alvo[k], className:CAMPO+" text-center tabular-nums", onChange:function(ev){ var o = {}; o[k] = ev.target.value==="" ? null : Number(ev.target.value); aoSet(o); }})); };
  return [mo("h1", "1 hora"), mo("h2", "2 horas"), mo("h3", "3 horas"), mo("sab", "Sábado"), nu("maxDia", "Máximo por dia"), nu("vezesSem", "Vezes por semana"), nu("sabMes", "Sábados por mês")];
}
function NegCard(pp){
  var c = pp.c, d = negDados(c), neg = d.neg, p = neg.pessoas.find(function(x){ return x.id===pp.id; });
  if(!p) return null;
  var colab = colaboradoresRh(c.s).find(function(y){ return y.id===p.id; }), g = neg.grupos.find(function(x){ return x.id===p.grupoId; }) || {}, ef = negocEfetiva(c.rh, p.id), lin = d.linhas.find(function(l){ return l.id===p.id; }) || {};
  var setP = function(patch){ acao(c, "neg_pessoa_set", {id:p.id, patch:patch}); };
  var esquerda = e(FichaCaixa,{key:"p", t:"Colaboradora"}, e("div",{className:"flex flex-col gap-2"}, e("div",{className:"grid place-items-center"}, e(Avatar,{id:"f_"+String(p.id).replace(/-/g, ""), nome:p.nome, s:180})),
    e("div",{className:"flex flex-col"}, e(FichaPar,{t:"Nome", v:p.nome}), e(FichaPar,{t:"Setor", v:colab ? colab.setor : "—"}), e(FichaPar,{t:"Função", v:colab && colab.funcao ? colab.funcao : "—"}), e(FichaPar,{t:"Grupo", v:ef.grupo}),
      e(FichaPar,{t:"Situação", v:lin.sit || "—", cor:lin.sit==="Completa" ? "text-emerald-400" : lin.sit==="A confirmar" ? "text-red-400" : "text-amber-400"}))));
  var mo = function(v){ return v===null || v===undefined ? "—" : BK(v); }, nm = function(v){ return v===null || v===undefined ? "—" : String(v); };
  var blocos = e(FichaCaixa,{key:"b", t:"Padrões de negociação", dir:e("span",{className:"text-[11px] font-normal normal-case tracking-normal"}, "clique no padrão para aplicar")}, e("div",{className:"grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4"}, neg.grupos.map(function(x){ var on = x.id===p.grupoId;
    return e("button",{key:x.id, type:"button", "aria-pressed":on, onClick:function(){ setP({grupoId:x.id}); }, className:"flex flex-col gap-0.5 rounded-lg border p-2 text-left text-[13px] "+(on ? "border-primary bg-primary/20" : "border-white/20 bg-black/20 hover:bg-white/10")},
      e("span",{className:"text-[11px] font-bold uppercase tracking-[.05em] "+(on ? "text-primary" : "")}, x.nome+(on ? " · em uso" : "")),
      e("span",null, "1 hora: "+mo(x.h1)), e("span",null, "2 horas: "+mo(x.h2)), e("span",null, "3 horas: "+mo(x.h3)), e("span",null, "Sábado: "+mo(x.sab)),
      e("span",null, "Máximo por dia: "+nm(x.maxDia)), e("span",null, "Vezes por semana: "+nm(x.vezesSem)), e("span",null, "Sábados por mês: "+nm(x.sabMes)), x.obs && e("span",{className:"mt-1 border-t border-white/20 pt-1 text-[11px]"}, x.obs)); })));
  var direita = [blocos, e(FichaCaixa,{key:"n", t:"Exceções desta pessoa", dir:e("span",{className:"text-[11px] font-normal normal-case tracking-normal"}, "campo vazio vale o padrão acima")}, e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-4"},
      negCampos(c, p, setP, g),
      e(CampoTexto,{t:"Observação", id:"neg-obs", cls:"col-span-2 md:col-span-4", value:p.obs||"", onChange:function(v){ setP({obs:v}); }}))),
    e(FichaCaixa,{key:"r", t:"Regras de todos os grupos"}, e("div",{className:"flex flex-col gap-1 text-[13px]"}, REGRAS_NEG.map(function(t2){ return e("span",{key:t2}, t2); })))];
  return e(FichaMoldura,{t:"Negociação · "+p.nome, fechar:pp.fechar, esquerda:esquerda, direita:direita,
    rodape:[e(Botao,{key:"d", onClick:function(){ if(window.confirm("Remover a negociação de "+p.nome+"?")){ acao(c, "neg_pessoa_del", {id:p.id}); pp.fechar(); } }}, "Remover negociação"), e(Botao,{key:"f", principal:true, onClick:pp.fechar}, "Fechar")]});
}
function NegGrupos(pp){
  var c = pp.c, neg = c.rh.negoc || negocPadrao(), nv = useState(""), nome = nv[0], setNome = nv[1];
  var colunas = neg.grupos.map(function(g){ var setG = function(patch){ acao(c, "neg_grupo_set", {id:g.id, patch:patch}); };
    return e(FichaCaixa,{key:g.id, t:g.nome}, e("div",{className:"flex flex-col gap-2"},
      e("div",{className:"min-w-0"}, e(Rotulo,{t:"Nome do grupo", id:"gn-"+g.id}), e("input",{key:g.id+g.nome, id:"gn-"+g.id, defaultValue:g.nome, className:CAMPO, onBlur:function(ev){ var v = ev.target.value.trim(); if(v && v!==g.nome) setG({nome:v}); }})),
      negCampos(c, g, setG, null),
      e("div",{className:"min-w-0"}, e(Rotulo,{t:"Observação", id:"go-"+g.id}), e("input",{key:g.id+g.obs, id:"go-"+g.id, defaultValue:g.obs, className:CAMPO, onBlur:function(ev){ if(ev.target.value!==g.obs) setG({obs:ev.target.value}); }})),
      e(Botao,{onClick:function(){ if(window.confirm("Excluir o grupo "+g.nome+"?")) acao(c, "neg_grupo_del", {id:g.id}); }}, "Excluir grupo"))); });
  return e(Janela,{t:"Grupos de negociação", sub:"Valor que cada pessoa do grupo recebe, salvo exceção no card dela.", fechar:pp.fechar, colunas:colunas,
    rodape:[e("div",{key:"n", className:"w-64"}, e("input",{value:nome, placeholder:"Nome do novo grupo", "aria-label":"Nome do novo grupo", className:CAMPO, onChange:function(ev){ setNome(ev.target.value); }})),
      e(Botao,{key:"a", principal:true, desabilitado:!nome.trim(), onClick:function(){ acao(c, "neg_grupo_add", {nome:nome}); setNome(""); }}, "Novo grupo"), e(Botao,{key:"f", onClick:pp.fechar}, "Fechar")]});
}
function NegIncluir(pp){
  var c = pp.c, neg = c.rh.negoc || negocPadrao(), st = useState({id:"", grupoId:""}), f = st[0], setF = st[1], jaTem = {}; neg.pessoas.forEach(function(p){ jaTem[p.id] = 1; });
  var colabs = colaboradoresRh(c.s), livres = colabs.filter(function(x){ return x.status!=="DESLIGADO" && !jaTem[x.id]; }).sort(function(a, b){ return a.nome.localeCompare(b.nome, "pt-BR"); });
  var form = e("div",{key:"f", className:"grid grid-cols-1 gap-2 md:grid-cols-2"},
    e(CampoSel,{t:"Pessoa", id:"ni-p", value:f.id, onChange:function(v){ setF(Object.assign({}, f, {id:v})); }, opcoes:[["", "Escolha"]].concat(livres.map(function(x){ return [x.id, x.nome+" · "+x.setor]; }))}),
    e(CampoSel,{t:"Grupo", id:"ni-g", value:f.grupoId, onChange:function(v){ setF(Object.assign({}, f, {grupoId:v})); }, opcoes:[["", "Escolha"]].concat(neg.grupos.map(function(x){ return [x.id, x.nome]; }))}));
  return e(Janela,{t:"Incluir pessoa", fechar:pp.fechar, colunas:[form], rodape:[e(Botao,{key:"c", onClick:pp.fechar}, "Cancelar"),
    e(Botao,{key:"s", principal:true, desabilitado:!f.id || !f.grupoId, onClick:function(){ var x = colabs.find(function(y){ return y.id===f.id; }); acao(c, "neg_pessoa_add", {id:f.id, nome:x ? x.nome : f.id, grupoId:f.grupoId}); pp.fechar(); }}, "Incluir")]});
}
function NegJanelas(pp){
  var c = pp.c;
  return e("div",null, pp.pessoa && e(NegCard,{c:c, id:pp.pessoa, fechar:pp.fecharPessoa}), pp.abrir==="grupos" && e(NegGrupos,{c:c, fechar:function(){ pp.setAbrir(""); }}), pp.abrir==="incluir" && e(NegIncluir,{c:c, fechar:function(){ pp.setAbrir(""); }}));
}

function AbaRhColab(){
  var c = useRh(), ab = useState("ativos"), aba = ab[0], setAba = ab[1], ed = useState(null), editId = ed[0], setEditId = ed[1], nv = useState(null), novo = nv[0], setNovo = nv[1], fx = useState(function(){ return (typeof window!=="undefined" && window.__fichaAbrir) || ""; }), fichaId = fx[0], setFichaId = fx[1], vs = useState(function(){ if(typeof window==="undefined") return "cad"; return window.__fichaAbrir ? "exp" : (window.__visaoRh || "cad"); }), visao = vs[0], setVisao = vs[1], ad = useState(""), abrirAdv = ad[0], setAbrirAdv = ad[1], ap = useState(""), advDe = ap[0], setAdvDe = ap[1], he0 = new Date(), hs = useState({cnpj:"", ano:he0.getFullYear(), mes:he0.getMonth()+1, anual:false}), heEsc = hs[0], setHeEsc = function(o){ hs[1](Object.assign({}, heEsc, o)); }, hp = useState(""), heDe = hp[0], setHeDe = hp[1], ha = useState(""), heAbrir = ha[0], setHeAbrir = ha[1], nd = useState(""), negDe = nd[0], setNegDe = nd[1], na = useState(""), negAbrir = na[0], setNegAbrir = na[1];
  React.useEffect(function(){ if(typeof window!=="undefined"){ window.__fichaAbrir = null; window.__visaoRh = null; } }, []);
  var todos = colaboradoresRh(c.s), esc = function(id){ var k = c.rh.config.escalas.find(function(y){ return y.id===id; }); return k ? k.nome : "—"; };
  var stLb = function(k){ return (STATUS.find(function(y){ return y[0]===k; })||[])[1]||k; };
  var linhas = todos.filter(function(x){ return aba==="todos" || (aba==="ativos" ? x.status!=="DESLIGADO" : x.status==="DESLIGADO"); }).sort(function(a, b){ return a.nome.localeCompare(b.nome); }).map(function(x){
    return {id:x.id, nome:x.nome, setor:x.setor, funcao:x.funcao||"—", empresa:rotuloCnpj(x.cnpj), sit:stLb(x.status)+(x.aviso ? " · aviso prévio" : ""), ok:x.status==="ATIVO" && !x.aviso, desl:x.status==="DESLIGADO",
      admissao:x.admissao||"", escala:esc(x.escalaId), entrada:(x.entrada||"")+(x.saida ? " às "+x.saida : ""), salario:x.salario||0}; });
  var anoAdv = new Date().getFullYear(), listaAdv = advertenciasComSeq(c.rh), resAdv = resumoAdvertencias(c.rh, anoAdv), tiposAdv = c.rh.config.tiposAdv || [];
  var ultima = {}; listaAdv.forEach(function(x){ if(!ultima[x.colabId] || x.data>ultima[x.colabId].data) ultima[x.colabId] = x; });
  var linhasAd = todos.filter(function(x){ return x.status!=="DESLIGADO"; }).map(function(x){ var u = ultima[x.id], n = resAdv[x.id]||0, minhasAd = listaAdv.filter(function(y){ return y.colabId===x.id && String(y.data).slice(0,4)===String(anoAdv); });
    var cont = function(lista, campo, nomeDe){ var o = {}, ordem = []; lista.forEach(function(y){ var nm = nomeDe(y[campo]); if(!o[nm]){ o[nm] = 0; ordem.push(nm); } o[nm]++; }); return ordem.map(function(nm){ return o[nm]>1 ? nm+" ("+o[nm]+")" : nm; }).join(", ") || "—"; };
    var nTipo = function(id){ var k = tiposAdv.find(function(y){ return y.id===id; }); return k ? k.nome : "—"; }, nMot = function(id){ var k = (c.rh.config.motivosAdv||[]).find(function(y){ return y.id===id; }); return k ? k.nome : "—"; };
    return {id:x.id, nome:x.nome, setor:x.setor, funcao:x.funcao||"—", noAno:n, total:minhasAd.length, ultima:u ? u.data : "", tipos:cont(minhasAd, "tipoId", nTipo), motivos:cont(minhasAd, "motivoId", nMot), sit:flagAdv(n)}; }).sort(function(a, b){ return b.noAno-a.noAno || a.nome.localeCompare(b.nome); });
  var colsAd = [{k:"nome", t:"Nome"}, {k:"setor", t:"Setor"}, {k:"noAno", t:"Advertências"}, {k:"ultima", t:"Última", fmt:function(v){ return v ? br(v) : "—"; }}, {k:"tipos", t:"Tipos"}, {k:"motivos", t:"Motivos"},
    {k:"sit", t:"Situação", cor:function(l){ return l.sit==="Reincidente" ? "text-red-400" : l.sit==="Em observação" ? "text-amber-400" : "text-emerald-400"; }}];
  // experiência: gestor de setor vê só as fichas do próprio setor; RH e Direção (autorizações da ficha) veem todas
  var listaExp = experienciaLista(c.s), veTodas = temAutorizacao("rh_ficha_lanca", c.s.usuario) || temAutorizacao("rh_ficha_nota", c.s.usuario) || grupoDe(c.s.usuario)==="supervisao";
  if(!veTodas) listaExp = listaExp.filter(function(x){ return ehGestorDe(fichaCfg(c.rh), nomeDe(c.s.usuario), x.c.setor); });
  var semPlano = todos.filter(function(x){ return x.status!=="DESLIGADO" && !x.efetivadoEm && (!x.planoId || !x.admissao); }).length;
  var linhasExp = listaExp.map(function(x){ var ch = x.chip; return {id:x.c.id, nome:x.c.nome, setor:x.c.setor, funcao:x.c.funcao, adm:x.c.admissao, a1:x.a1, a2:x.a2, ef:x.ef, prazo:ch.t, vencido:!!ch.vencido, aviso:!!ch.aviso, pontos:pontosFicha(c, x.c.id), acoes:"Ficha"}; });
  var negD = visao==="neg" && c.veSalario ? negDados(c) : null, heD = visao==="he" ? heDados(c, heEsc) : null, ano0 = he0.getFullYear();
  var colsExp = [{k:"nome", t:"Colaboradora", render:function(v, l){ return e("div",{className:"flex justify-start", title:l.setor}, e(Pessoa,{nome:l.nome, setor:l.setor, funcao:l.funcao, s:24})); }},
    {k:"adm", t:"Admissão", fmt:function(v){ return br(v); }}, {k:"a1", t:"1ª avaliação", fmt:function(v){ return br(v); }}, {k:"a2", t:"2ª avaliação", fmt:function(v){ return br(v); }}, {k:"ef", t:"Efetivação", fmt:function(v){ return br(v); }},
    {k:"prazo", t:"Prazo", cor:function(l){ return l.vencido ? "text-red-400" : l.aviso ? "text-amber-400" : "text-emerald-400"; }}, {k:"pontos", t:"Pontos"},
    {k:"acoes", t:"Ações", render:function(v, l){ return e("span",{className:"inline-flex gap-2", onClick:function(ev){ ev.stopPropagation(); }}, e(Botao,{onClick:function(){ setFichaId(l.id); }}, "Ficha"), e(Botao,{onClick:function(){ if(window.confirm("Efetivar "+l.nome+" hoje?")) acao(c, "efetivar", {id:l.id}); }}, "Efetivar")); }}];
  var colabFicha = fichaId ? todos.find(function(x){ return x.id===fichaId; }) : null;
  if(colabFicha) return e("div",{className:"flex flex-col gap-2"}, e(FichaExperiencia,{c:c, colab:colabFicha, voltar:function(){ setFichaId(""); }, agir:function(op, extra){ acao(c, op, extra); }}));
  var cols = [{k:"nome", t:"Nome"}, {k:"setor", t:"Setor"}, {k:"funcao", t:"Função"}, {k:"empresa", t:"Empresa"},
    {k:"sit", t:"Situação", cor:function(l){ return l.ok ? "text-emerald-400" : l.desl ? "text-red-400" : "text-amber-400"; }},
    {k:"admissao", t:"Admissão", fmt:function(v){ return v ? br(v) : "Faltando"; }, cor:function(l){ return l.admissao ? "" : "text-amber-400"; }},
    {k:"escala", t:"Escala"}, {k:"entrada", t:"Entrada"}].concat(c.veSalario ? [{k:"salario", t:"Salário", fmt:function(v){ return v ? BK(v) : "—"; }}] : []);
  var editando = editId && todos.find(function(x){ return x.id===editId; });
  var opSet = function(k, v){ setNovo(Object.assign({}, novo, (function(){var o={};o[k]=v;return o;})())); };
  return e("div",{className:"flex flex-col gap-2.5"},
    visao==="cad" && novo && e(Bloco,{t:"Nova colaboradora"}, e("div",{className:"grid grid-cols-1 items-end gap-2 md:grid-cols-5"},
      e(CampoTexto,{t:"Nome completo", id:"nNome", value:novo.nome, onChange:function(v){ opSet("nome", v); }}),
      e(CampoSel,{t:"Setor", id:"nSetor", value:novo.setor, onChange:function(v){ opSet("setor", v); }, opcoes:FUNCIONARIOS_POR_SETOR.filter(function(s2){ return s2[0]!=="Sócios e família" && s2[0].indexOf("PJ")!==0; }).map(function(s2){ return [s2[0], s2[0]]; })}),
      e(CampoSel,{t:"Empresa", id:"nCnpj", value:novo.cnpj, onChange:function(v){ opSet("cnpj", v); }, opcoes:[["", "A informar"]].concat(["34","46","59","67"].map(function(k){ return [k, rotuloCnpj(k)]; }))}),
      e(CampoTexto,{t:"Admissão", id:"nAdm", tipo:"date", value:novo.admissao, onChange:function(v){ opSet("admissao", v); }}),
      e("div",{className:"flex gap-2"}, e(Botao,{principal:true, onClick:function(){ if(novo.nome.trim()){ acao(c, "colab_add", novo); setNovo(null); } }}, "Cadastrar"), e(Botao,{onClick:function(){ setNovo(null); }}, "Cancelar")))),
    e(BlocoPainel,{titulo:"Cadastro de colaboradores", compacto:true},
      e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1"},
        e("select",{value:visao, "aria-label":"Visão", onChange:function(ev){ setVisao(ev.target.value); }, className:SEL_AZUL+" w-32"}, e("option",{value:"cad", className:"bg-card"}, "Cadastro"), e("option",{value:"adv", className:"bg-card"}, "Advertências"), e("option",{value:"exp", className:"bg-card"}, "Experiência"), e("option",{value:"he", className:"bg-card"}, "Horas extras"), c.veSalario && e("option",{value:"neg", className:"bg-card"}, "Negociações")),
        visao==="cad" && e(Segmentado,{opcoes:[["ativos","Ativos"],["inativos","Desligados"],["todos","Todos"]], atual:aba, onMudar:setAba}), e("span",{className:"flex-1"}),
        visao==="he" && e("select",{value:heEsc.cnpj, "aria-label":"Empresa", onChange:function(ev){ setHeEsc({cnpj:ev.target.value}); }, className:SEL_AZUL}, e("option",{value:"", className:"bg-card"}, "Grupo geral"), empresasDe(c).map(function(k){ return e("option",{key:k, value:k, className:"bg-card"}, rotuloCnpj(k)); })),
        visao==="he" && !heEsc.anual && e("select",{value:heEsc.mes, "aria-label":"Mês", onChange:function(ev){ setHeEsc({mes:Number(ev.target.value)}); }, className:SEL_AZUL}, MESES.map(function(m, i){ return e("option",{key:m, value:i+1, className:"bg-card"}, m); })),
        visao==="he" && e("select",{value:heEsc.ano, "aria-label":"Ano", onChange:function(ev){ setHeEsc({ano:Number(ev.target.value)}); }, className:SEL_AZUL}, [ano0-2, ano0-1, ano0, ano0+1].map(function(a){ return e("option",{key:a, value:a, className:"bg-card"}, a); })),
        visao==="he" && e(Segmentado,{opcoes:[["mensal","Mensal"],["anual","Anual"]], atual:heEsc.anual ? "anual" : "mensal", onMudar:function(v){ setHeEsc({anual:v==="anual"}); }}),
        visao==="adv" && e(Botao,{onClick:function(){ setAbrirAdv("rel"); }}, "Relatório mensal"),
        visao==="he" && e(Botao,{principal:true, onClick:function(){ setHeAbrir("novo"); }}, "Lançar hora extra"),
        visao==="neg" && e(Botao,{onClick:function(){ setNegAbrir("grupos"); }}, "Grupos"),
        visao==="neg" && e(Botao,{principal:true, onClick:function(){ setNegAbrir("incluir"); }}, "Incluir pessoa"),
        visao==="adv" && e(Botao,{principal:true, onClick:function(){ setAbrirAdv("nova"); }}, "Nova advertência"),
        visao==="cad" && e(Botao,{principal:true, onClick:function(){ setNovo({nome:"", setor:FUNCIONARIOS_POR_SETOR[0][0], cnpj:"", admissao:""}); }}, "Nova colaboradora")),
      visao==="exp" && semPlano>0 && e("div",{className:AVISO}, e(Ph,{n:"warning", s:17, fill:true}), e("span",null, semPlano+" colaboradoras ainda sem plano de experiência ou sem data de admissão no Cadastro; elas não aparecem aqui.")),
      visao==="neg" && c.veSalario && e(NegJanelas,{c:c, pessoa:negDe, fecharPessoa:function(){ setNegDe(""); }, abrir:negAbrir, setAbrir:setNegAbrir}),
      visao==="he" && e(HeJanelas,{c:c, esc:heEsc, pessoa:heDe, fecharPessoa:function(){ setHeDe(""); setHeAbrir(""); }, abrir:heAbrir, setAbrir:setHeAbrir}),
      visao==="adv" && e(AbaRhAdv,{dentro:true, abrir:abrirAdv, setAbrir:setAbrirAdv, pessoa:advDe, fecharPessoa:function(){ setAdvDe(""); setAbrirAdv(""); }}),
      
    e(TabelaPlanilha,{key:aba+visao+(visao==="he" ? heEsc.mes+"-"+heEsc.ano+heEsc.anual : ""), cols:visao==="neg" && negD ? negD.cols : visao==="he" ? heD.cols : visao==="adv" ? colsAd : visao==="exp" ? colsExp : cols, linhas:visao==="neg" && negD ? negD.linhas : visao==="he" ? heD.linhas : visao==="adv" ? linhasAd : visao==="exp" ? linhasExp : linhas, totalLinha:visao==="he" ? heD.totalLinha : undefined, totalSimples:true, chave:"id", escura:true, grade:true, semContagem:true, limite:100, aoClicar:function(l){ if(visao==="adv") setAdvDe(l.id); else if(visao==="exp") setFichaId(l.id); else if(visao==="he") setHeDe(l.id); else if(visao==="neg") setNegDe(l.id); else setEditId(l.id); }, vazio:visao==="neg" ? "Nenhuma negociação cadastrada." : visao==="he" ? "Nenhuma hora extra no período." : visao==="exp" ? "Ninguém em período de experiência no momento." : "Nenhuma colaboradora nesta visão."})),
    editando && e(FormColab,{key:editando.id, c:c, x:editando, fechar:function(){ setEditId(null); }}));
}

// ───────────────── Advertências ─────────────────
function AbaRhAdv(pp){
  pp = pp || {};
  // Tela refeita no padrão compacto (pedido do Marcus, 05/11/2026): sem faixa de números, formulário em uma linha, resumos em blocos de lista e tabela do padrão.
  var c = useRh(), rh = c.rh, cfg = rh.config, ano = new Date().getFullYear(), vazio = {colabId:"", data:hojeIso(), tipoId:"", motivoId:"", dias:"", obs:""};
  var nf = useState(vazio), f = nf[0], setF = nf[1], bq = useState(""), buscaAdv = bq[0], setBuscaAdv = bq[1], rm = useState(hojeIso().slice(0,7)), mesRel = rm[0], setMesRel = rm[1], rt = useState({mes:"", txt:""}), edRel = rt[0], setEdRel = rt[1], ea = useState(""), editAdv = ea[0], setEditAdv = ea[1];
  var colabs = colaboradoresRh(c.s), nomeDe2 = function(id){ var x = colabs.find(function(y){ return y.id===id; }); return x ? x.nome : "—"; }, listaTodas = advertenciasComSeq(rh), res = resumoAdvertencias(rh, ano);
  var semAc = function(t2){ return String(t2||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }, nq = semAc(buscaAdv);
  var lista = listaTodas.filter(function(x){ return !nq || semAc(nomeDe2(x.colabId)).indexOf(nq)>=0; });   // pesquisa por nome (pedido da Ana Paula, 05/11/2026)
  var textoRel = edRel.mes===mesRel ? edRel.txt : relatorioAdvertencias(rh, mesRel, nomeDe2);
  var copiarRel = function(){ try{ navigator.clipboard.writeText(textoRel); c.d({type:"AVISO", txt:"Relatório copiado! Já pode colar no WhatsApp."}); }catch(x){} };
  var tipo = cfg.tiposAdv.find(function(x){ return x.id===f.tipoId; }), nm = function(l, id){ var x = cfg[l].find(function(y){ return y.id===id; }); return x ? x.nome : "—"; };
  var porPessoa = Object.keys(res).map(function(id){ return {id:id, n:res[id], flag:flagAdv(res[id])}; }).sort(function(a2, b2){ return b2.n-a2.n || nomeDe2(a2.id).localeCompare(nomeDe2(b2.id), "pt-BR"); });
  var corLinha = function(g){ return g==="Reincidente" ? "ruim" : g==="Em observação" ? "alerta" : "ok"; }, corFlag = function(g){ return g==="Reincidente" ? "#EF4444" : g==="Em observação" ? "#F59E0B" : "#22C55E"; };
  var set = function(k, v){ var o = Object.assign({}, f); o[k] = v; setF(o); };
  var salvar = function(){ if(editAdv){ acao(c, "adv_edit", Object.assign({id:editAdv}, f)); setEditAdv(""); setF(vazio); } else { acao(c, "adv_add", f); setF(Object.assign({}, f, {obs:"", dias:""})); } };
  var ativas = colabs.filter(function(x){ return x.status!=="DESLIGADO"; }).sort(function(a2, b2){ return String(a2.nome).localeCompare(String(b2.nome), "pt-BR"); });
  var linhasAdv = lista.map(function(x){ return {id:x.id, colabId:x.colabId, data:x.data, colab:nomeDe2(x.colabId), tipo:nm("tiposAdv", x.tipoId)+(x.dias ? " · "+x.dias+(x.dias===1 ? " dia" : " dias") : ""), motivo:nm("motivosAdv", x.motivoId), seq:x.seq+"ª", flag:x.flag, obs:x.obs||"", bruto:x}; });
  var colsAdv = [{k:"data", t:"Data", fmt:function(v){ return br(v); }}, {k:"colab", t:"Colaboradora"}, {k:"tipo", t:"Tipo"}, {k:"motivo", t:"Motivo"}, {k:"seq", t:"Nº no ano"}, {k:"flag", t:"Situação", cor:function(l){ return l.flag==="Reincidente" ? "text-red-400" : l.flag==="Em observação" ? "text-amber-400" : "text-emerald-400"; }}, {k:"obs", t:"Observação"}];
  var editarAdv = function(x){ setF({colabId:x.colabId, data:x.data, tipoId:x.tipoId, motivoId:x.motivoId, dias:x.dias ? String(x.dias) : "", obs:x.obs || ""}); setEditAdv(x.id); };
  var fechar = function(){ setEditAdv(""); setF(vazio); if(pp.setAbrir) pp.setAbrir(""); };
  var salvar2 = function(){ salvar(); if(!editAdv && pp.setAbrir) pp.setAbrir(""); };
  var aberto = pp.abrir || (editAdv ? "nova" : "");
  var formulario = e("div",{key:"f", className:"grid grid-cols-2 items-end gap-x-3 gap-y-2 md:grid-cols-4"},
    e(CampoSel,{t:"Colaboradora", value:f.colabId, cls:"col-span-2", onChange:function(v){ set("colabId", v); }, opcoes:[["", "Escolha"]].concat(ativas.map(function(x){ return [x.id, x.nome]; }))}),
    e("div",null, e(Rotulo,{t:"Data"}), e("input",{type:"date", value:f.data, "aria-label":"Data", className:CAMPO+" text-center", onChange:function(ev){ set("data", ev.target.value); }})),
    e(CampoSel,{t:"Tipo", value:f.tipoId, onChange:function(v){ set("tipoId", v); }, opcoes:[["", "Escolha"]].concat(cfg.tiposAdv.map(function(x){ return [x.id, x.nome]; }))}),
    e(CampoSel,{t:"Motivo", value:f.motivoId, cls:"col-span-2", onChange:function(v){ set("motivoId", v); }, opcoes:[["", "Escolha"]].concat(cfg.motivosAdv.map(function(x){ return [x.id, x.nome]; }))}),
    tipo && tipo.suspensao && e("div",null, e(Rotulo,{t:"Dias de suspensão"}), e("input",{value:f.dias, inputMode:"numeric", "aria-label":"Dias de suspensão", className:CAMPO+" text-center tabular-nums", onChange:function(ev){ set("dias", ev.target.value.replace(/D/g,"")); }})),
    e("div",{className:"col-span-2 md:col-span-4"}, e(Rotulo,{t:"Observação"}), e("input",{value:f.obs, "aria-label":"Observação", className:CAMPO, onChange:function(ev){ set("obs", ev.target.value); }})));
  var relatorio = e("div",{key:"r", className:"flex flex-col gap-2"},
    e("div",{className:"w-48"}, e(Rotulo,{t:"Mês"}), e("input",{type:"month", value:mesRel, "aria-label":"Mês do relatório", className:CAMPO+" text-center", onChange:function(ev){ if(ev.target.value) setMesRel(ev.target.value); }})),
    e("textarea",{value:textoRel, "aria-label":"Texto do relatório mensal", rows:14, className:"w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary", onChange:function(ev){ setEdRel({mes:mesRel, txt:ev.target.value}); }}));
  var pid = pp.pessoa || "", col = pid && colabs.find(function(y){ return y.id===pid; }), minhas = linhasAdv.filter(function(l){ return l.colabId===pid; });
  var fichaPessoa = col && e(FichaMoldura,{t:"Advertências · "+col.nome, fechar:pp.fecharPessoa,
    esquerda:e(FichaCaixa,{t:"Colaboradora"}, e("div",{className:"flex flex-col gap-2"}, e("div",{className:"grid place-items-center"}, e(Avatar,{id:"f_"+String(col.id).replace(/-/g, ""), nome:col.nome, s:220})),
      e("div",{className:"flex flex-col"}, e(FichaPar,{t:"Nome", v:col.nome}), e(FichaPar,{t:"Setor", v:col.setor}), e(FichaPar,{t:"Função", v:col.funcao || "—"}), e(FichaPar,{t:"No ano "+ano, v:String(res[pid]||0)}), e(FichaPar,{t:"Situação", v:flagAdv(res[pid]||0), cor:corTxt(flagAdv(res[pid]||0))})))),
    direita:e(FichaCaixa,{t:"Advertências", dir:e("button",{type:"button", onClick:function(){ setF(Object.assign({}, vazio, {colabId:pid})); pp.setAbrir("nova"); }, className:"h-5 rounded border border-white/45 bg-white/10 px-2 text-[11px] font-normal normal-case leading-none tracking-normal hover:bg-white/25"}, "Nova advertência")},
      e(TabelaPlanilha,{cols:colsAdv.filter(function(k){ return k.k!=="colab"; }), linhas:minhas, chave:"id", escura:true, grade:true, semContagem:true, semLimpar:true, limite:100, aoClicar:function(l){ editarAdv(l.bruto); }, vazio:"Nenhuma advertência."}))});
  return e(pp.dentro ? "div" : Pagina, null,
    fichaPessoa,
    aberto==="nova" && e(Janela,{t:editAdv ? "Corrigir advertência" : "Nova advertência", sub:"1ª do ano Regular, 2ª Em observação, 3ª em diante Reincidente.", fechar:fechar, colunas:[formulario], rodape:[e(Botao,{key:"c", onClick:fechar}, "Cancelar"), e(Botao,{key:"s", principal:true, desabilitado:!f.colabId || !f.tipoId || !f.motivoId, onClick:salvar2}, editAdv ? "Salvar alteração" : "Registrar")]}),
    aberto==="rel" && e(Janela,{t:"Relatório mensal", sub:"Texto pronto para colar no WhatsApp.", fechar:fechar, colunas:[relatorio], rodape:[edRel.mes===mesRel && e(Botao,{key:"d", onClick:function(){ setEdRel({mes:"", txt:""}); }}, "Desfazer edição"), e(Botao,{key:"c2", principal:true, onClick:copiarRel}, "Copiar texto")]}));
  function corTxt(g){ return g==="Reincidente" ? "text-red-400" : g==="Em observação" ? "text-amber-400" : "text-emerald-400"; }
}

// ───────────────── Controle de experiência ─────────────────
function pontosFicha(c, id){ var r = resultadoFicha(fichaCfg(c.rh), fichaDe(c.rh, id)); return r.total===null ? "Sem nota" : String(r.total).replace(".", ",")+" / 100"; }
function AbaRhExp(){
  // o endereço antigo e os avisos (ficha aberta direto) levam para a visão Experiência de Colaboradores
  if(typeof window!=="undefined" && !window.__fichaAbrir) window.__visaoRh = "exp";
  return e(AbaRhColab);
}

// ───────────────── Horas extras ─────────────────
function AbaRhHoras(){
  // o endereço antigo leva para a visão Horas extras de Colaboradores
  if(typeof window!=="undefined") window.__visaoRh = "he";
  return e(AbaRhColab);
}

// ───────────────── Negociações (hora extra por fora) ─────────────────
// Valores fechados em reais, combinados com cada pessoa. Cada pessoa herda o padrão do grupo; só se preenche o que for diferente.
var CAMPOS_R = [["h1","1 hora"], ["h2","2 horas"], ["h3","3 horas"], ["sab","Sábado"]], CAMPOS_L = [["maxDia","Máx. h/dia"], ["vezesSem","Vezes/semana"], ["sabMes","Sábados/mês"]];
function AbaRhNegoc(){
  // o endereço antigo leva para a visão Negociações de Colaboradores
  if(typeof window!=="undefined") window.__visaoRh = "neg";
  return e(AbaRhColab);
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
  var abas = [["escalas","Escalas"], ["planos","Planos de experiência"], ["ficha","Ficha de experiência"], ["adv","Advertências"], ["he","Horas extras"], ["feriados","Feriados"], ["geral","Relatório diário"]];
  var check = function(it, dia){ var tem = it.dias.indexOf(dia)>=0; return e("label",{key:dia, className:"flex cursor-pointer items-center gap-1 text-[12px]"}, e("input",{type:"checkbox", checked:tem, className:"size-4", onChange:function(){ acao(c, "cfg_set", {lista:"escalas", id:it.id, patch:{dias:(tem ? it.dias.filter(function(x){ return x!==dia; }) : it.dias.concat([dia])).sort()}}); }}), DIAS_SEMANA[dia].slice(0,3)); };
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Configurador do RH", sub:"Escalas, planos de experiência, tipos e motivos de advertência, adicionais de hora extra, feriados e o número de sócios do relatório. Setores e empresas vêm de Pessoas e CNPJs."}),
    e("div",{className:"flex flex-wrap gap-2"}, abas.map(function(x){ return e("button",{key:x[0], onClick:function(){ setAba(x[0]); }, className:"h-10 rounded-xl px-4 text-[13px] font-bold ring-1 "+(aba===x[0] ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-border hover:bg-muted/50")}, x[1]); })),
    aba==="escalas" && e(ListaCfg,{c:c, lista:"escalas", t:"Escalas de trabalho", sub:"domingo nunca conta como dia escalado", vazio:{nome:"", dias:[1,2,3,4,5]}, campos:[["nome","w-56","text","Nome da escala"]], extra:function(it){ return e("div",{className:"flex flex-wrap gap-2"}, [1,2,3,4,5,6].map(function(d){ return check(it, d); })); }}),
    aba==="planos" && e(ListaCfg,{c:c, lista:"planos", t:"Planos de experiência", sub:"1º marco e 2º marco, em dias", vazio:{nome:"", marco1:45, marco2:45}, campos:[["nome","w-56","text","Nome"], ["marco1","w-24","number","1º marco"], ["marco2","w-24","number","2º marco"]]}),
    aba==="ficha" && e(ConfigFicha,{c:c, agir:function(op, extra){ acao(c, op, extra); }}),
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

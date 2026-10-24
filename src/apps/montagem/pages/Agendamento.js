// Sorelly Admin · montagem — pages/Agendamento.js
// Setor de Agendamento (acertos), trazido do SorellyAdmin: Painel, Representantes, Abertura do mês, Configurador, Análises e Histórico.
// As regras e as contas ficam em domain/agendamento.js; aqui só as telas. Membros do setor lançam; quem gerencia (Diretoria e Ana Maria) abre/fecha o mês e configura.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { AGENDAMENTO, nomeDe, podeConferirPag, podeFinanceiro, podeGerirAgend } from "@/apps/montagem/domain/equipe";
import { agrupar, AUTORIZADORES, DIA_SEM, bonusDoMes, parecidas, MEDALHAS, TIPOS_REMARC, analisesDe, anoDe, chaveMes, diasNoMes, mesAberto, mesAnterior, movimentos, nomeMes, painelDe, pctPorCodigo, proximoMes, representantesDoMes, tipoDe } from "@/apps/montagem/domain/agendamento";
import { fatEfetivo } from "@/apps/montagem/domain/financeiro";
import { diasNoMes as diasMes } from "@/apps/montagem/domain/agendamento";
import { BKC as BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { ListagemLeitura } from "@/apps/montagem/pages/encomendas/ListagemDia";
import { e, useState } from "@/shared/react";
import React from "react";

var int = function(v){ return Math.round(v||0).toLocaleString("pt-BR"); };
var pc = function(v){ return v===null || v===undefined ? "—" : v.toLocaleString("pt-BR",{minimumFractionDigits:1, maximumFractionDigits:1})+"%"; };
var th = function(t, c){ return e("th",{key:t, className:"whitespace-nowrap border-b border-border px-3 py-2 text-left text-[11.5px] font-semibold uppercase tracking-wide "+(c||"")}, t); };
var CARD = "rounded-xl bg-linear-to-br from-[#A855F7]/25 via-card to-card px-4 py-3 ring-1 ring-[#A855F7]/40";
var AVISO = "flex items-start gap-2 rounded-xl border px-4 py-2.5 text-[13.5px] font-medium ";

function useAg(){
  var cx = use(), s = cx.state;
  return {s:s, d:cx.dispatch, ag:s.agend, gerente:podeGerirAgend(s.usuario, s.agend), por:nomeDe(s.usuario)};
}
function acao(c, op, extra){ c.d(Object.assign({type:"AG", op:op, por:c.por}, extra)); }
// campo de número inteiro que grava ao sair do campo
function Dig(p){
  return e("input",{key:p.value, inputMode:"numeric", defaultValue:p.value===null || p.value===undefined || p.value==="" ? "" : String(p.value), placeholder:p.placeholder||"", disabled:p.disabled, "aria-label":p.label,
    className:INPUT+" h-9! text-center "+MONO+" "+(p.className||"w-24"),
    onBlur:function(ev){ var v = ev.target.value.replace(/\D/g,""); if(String(p.value===null || p.value===undefined ? "" : p.value)!==v) p.onSalvar(v==="" ? null : Number(v)); },
    onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); }});
}
function Aviso(p){ return e("div",{className:AVISO+(p.tom==="erro" ? "border-destructive/40 bg-destructive/10 text-destructive" : p.tom==="ok" ? "border-success/40 bg-success/10 text-success" : "border-warning/40 bg-warning/10 text-warning")}, e(Ph,{n:p.tom==="ok" ? "check-circle" : "warning", s:17, fill:true}), e("span",null, p.children)); }
function Sem(p){ return e("div",{className:"flex flex-col gap-3"}, e(PageHead,{t:p.t, sub:p.sub}), e("p",{className:"rounded-xl bg-muted/30 px-4 py-6 text-center text-[14px] text-muted-foreground"}, p.msg)); }
// o mês escolhido (padrão: o aberto; senão o mais recente)
function mesDe(ag, escolhido){ var ks = Object.keys(ag.mes).sort(); return escolhido && ag.mes[escolhido] ? escolhido : (mesAberto(ag) || ks[ks.length-1] || null); }
function Kpi(p){ return e("div",{className:"flex flex-col items-center justify-center "+CARD+" text-center"}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-[.12em] text-muted-foreground"}, p.t), e("b",{className:MONO+" text-[26px] leading-tight "+(p.cor||"")}, p.v), p.sub && e("span",{className:"text-[12px] text-muted-foreground"}, p.sub)); }

// ───────────────── Painel ─────────────────
function Evolucao(p){
  var max = Math.max.apply(null, p.dados.map(function(x){ return x.incremento||0; }).concat([1])), ALTURA = 150;
  return e(BlocoBarra,{cor:"roxo", t:"Evolução diária", sub:"acertos feitos em cada dia (colunas) · passe o mouse para ver o acumulado"},
    e("div",{className:"overflow-x-auto px-4 pb-3 pt-5"},
      e("div",{className:"flex items-end gap-1.5 border-b border-white/20", style:{minWidth:(p.dados.length*34)+"px", height:(ALTURA+24)+"px"}}, p.dados.map(function(x){ var tem = x.incremento!==null, h = tem ? Math.max(4, Math.round(x.incremento/max*ALTURA)) : 4;
        return e("div",{key:x.dia, className:"flex flex-1 flex-col items-center justify-end", style:{height:"100%"}, title:"Dia "+x.dia+": "+(tem ? "+"+x.incremento+" acertos (acumulado "+int(x.acumulado)+")" : "sem lançamento")},
          e("span",{className:"mb-0.5 text-[10.5px] font-bold "+(tem ? "text-white" : "text-transparent")}, tem ? x.incremento : "0"),
          e("div",{className:"w-full rounded-t-md", style:{height:h+"px", background:tem ? (x.incremento===0 ? "rgba(255,255,255,.18)" : "linear-gradient(180deg,#F3D98B,#B8862B)") : "rgba(255,255,255,.07)"}})); })),
      e("div",{className:"mt-1 flex gap-1.5", style:{minWidth:(p.dados.length*34)+"px"}}, p.dados.map(function(x){ return e("span",{key:x.dia, className:"flex-1 text-center text-[10.5px] leading-tight "+(x.dow===0 || x.dow===6 ? "font-bold text-[#F3D98B]" : "text-muted-foreground")}, x.dia, e("br"), DIA_SEM[x.dow]); }))));
}
function Pecas(p){ return e("div",{className:"flex min-w-40 flex-col items-center gap-1 rounded-xl bg-black/25 px-6 py-3 text-center ring-1 "+(p.i===0 ? "ring-2 ring-[#E8B84B]" : "ring-[#E8B84B]/25")}, e("span",{className:"text-3xl"}, MEDALHAS[p.i]), e("b",{className:"text-[13px] uppercase"}, p.r.nome), e("span",{className:MONO+" text-[19px] font-bold text-primary"}, pc(p.r.pct))); }

// quantas revendedoras o sistema tem AGORA (último número lançado na Visão geral)
function revAgora(s){ var ks = Object.keys(s.revendedorasDiario||{}).sort(); return ks.length ? s.revendedorasDiario[ks[ks.length-1]] : 0; }
function MetasCards(p){
  return e("div",{className:"grid grid-cols-1 gap-3 md:grid-cols-3"}, p.metas.map(function(m){
    return e("div",{key:m.pct, className:CARD+" flex flex-col gap-1.5 "+(m.bateu ? "ring-2 ring-success/60" : "")},
      e("div",{className:"flex items-center justify-between"}, e("b",{className:"text-[15px]"}, "Meta "+m.pct+"%"), e("span",{className:"rounded-full px-2 py-0.5 text-[11px] font-bold "+(m.bateu ? "bg-success/20 text-success" : "bg-warning/20 text-warning")}, m.bateu ? "✓ Batida" : "Faltam "+int(m.falta))),
      e("span",{className:"text-[12.5px] text-muted-foreground"}, "Alvo: "+int(Math.ceil(m.alvo))+" acertos · bônus "+BK(m.bonus)+" por funcionária"),
      e("div",{className:"h-2.5 overflow-hidden rounded-full bg-muted/50"}, e("div",{className:"h-full rounded-full "+(m.bateu ? "bg-success" : "bg-linear-to-r from-[#B8862B] to-[#E8B84B]"), style:{width:Math.min(100, m.pctAtingido)+"%"}})),
      e("span",{className:MONO+" text-[12px]"}, pc(m.pctAtingido)+" do alvo")); }));
}
// Calculadora das metas: ritmo atual, quanto falta por dia para cada faixa e uma simulação ("e se eu autorizar mais N?")
function CalculadoraMetas(p){
  var sm = useState({saem:"", chegam:""}), sim = sm[0], setSim = sm[1], pr = p.p, saem = Number(sim.saem||0), chegam = Number(sim.chegam||0), total = diasMes(pr.ym);
  var ult = pr.evolucao.filter(function(x){ return x.acumulado!==null; }).slice(-1)[0], diaUlt = ult ? ult.dia : 0, restDias = Math.max(1, total-diaUlt);
  var ritmo = diaUlt>0 ? pr.realizado/diaUlt : 0, projecao = Math.round(ritmo*total), prevSim = Math.max(0, pr.previstos-saem+chegam);
  var faixas = pr.metas.map(function(m){ var alvoSim = Math.ceil(prevSim*m.pct/100), falta = Math.max(0, alvoSim-pr.realizado), maxPrev = Math.floor(pr.realizado/(m.pct/100));
    return {pct:m.pct, bonus:m.bonus, alvo:Math.ceil(m.alvo), alvoSim:alvoSim, falta:falta, porDia:falta/restDias, tirar:Math.max(0, pr.previstos-maxPrev), chegaNoRitmo:projecao>=alvoSim}; });
  var campo = function(k, rot){ return e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold"}, rot, e("input",{value:sim[k], inputMode:"numeric", placeholder:"0", "aria-label":rot, className:INPUT+" h-10! w-44 text-center "+MONO, onChange:function(ev){ var o = {}; o[k] = ev.target.value.replace(/\D/g,"").slice(0,4); setSim(Object.assign({}, sim, o)); }})); };
  return e(BlocoBarra,{cor:"roxo", t:"Calculadora das metas", sub:"o que falta para cada faixa, o ritmo atual e uma simulação com mais autorizações"},
    e("div",{className:"flex flex-col gap-4 p-4"},
      e("div",{className:"grid grid-cols-2 gap-3 xl:grid-cols-5"},
        [["Revendedoras agora", int(p.agora), "#E8B84B", (p.agora-pr.base>=0 ? "+" : "")+int(p.agora-pr.base)+" desde o início do mês"], ["Começaram o mês", int(pr.base), "#94A3B8", "com kit na abertura"], ["Acertos feitos", int(pr.realizado), "#4ADE80", "até o dia "+diaUlt],
         ["Ritmo atual", ritmo.toLocaleString("pt-BR",{maximumFractionDigits:1})+"/dia", "#60A5FA", "média dos dias lançados"], ["Projeção do mês", int(projecao), "#C084FC", "se mantiver o ritmo"]].map(function(x){
          return e("div",{key:x[0], className:CARD+" flex flex-col items-center text-center"}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-[.12em] text-muted-foreground"}, x[0]), e("b",{className:MONO+" text-[22px]", style:{color:x[2]}}, x[1]), e("span",{className:"text-[11.5px] text-muted-foreground"}, x[3])); })),
      e("div",{className:"flex flex-wrap items-end gap-3 rounded-xl bg-black/25 p-3"},
        e("span",{className:"min-w-[12rem] text-[13px] font-semibold"}, "Simulação: e se eu mudar a meta?"), campo("saem", "Mais autorizadas a sair da meta"), campo("chegam", "Mais vindas de outro mês"),
        e("span",{className:"text-[13px]"}, "Previstos simulados: ", e("b",{className:MONO+" text-[#F3D98B]"}, int(prevSim))), (saem>0 || chegam>0) && e(Btn,{v:"ghost", sm:true, onClick:function(){ setSim({saem:"", chegam:""}); }}, "Limpar")),
      e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full min-w-[40rem] border-collapse"},
        e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Meta"), th("Alvo agora"), th("Alvo simulado"), th("Faltam"), th("Por dia ("+restDias+" dias)"), th("No ritmo atual"), th("Para bater hoje, autorizar"), th("Bônus")])),
        e("tbody",null, faixas.map(function(x){ return e("tr",{key:x.pct, className:"border-b border-border/60"},
          e("td",{className:"px-3 py-2 text-[14px] font-bold"}, x.pct+"%"), e("td",{className:"px-3 py-2 text-[13.5px] "+MONO}, int(x.alvo)), e("td",{className:"px-3 py-2 text-[13.5px] font-semibold "+MONO}, int(x.alvoSim)),
          e("td",{className:"px-3 py-2 text-[13.5px] "+MONO+(x.falta>0 ? "" : " text-success")}, x.falta>0 ? int(x.falta) : "✓ batida"), e("td",{className:"px-3 py-2 text-[13.5px] "+MONO}, x.falta>0 ? x.porDia.toLocaleString("pt-BR",{maximumFractionDigits:1}) : "—"),
          e("td",{className:"px-3 py-2 text-[13px] font-semibold "+(x.chegaNoRitmo ? "text-success" : "text-warning")}, x.chegaNoRitmo ? "✓ chega" : "não chega"), e("td",{className:"px-3 py-2 text-[13.5px] "+MONO}, x.tirar>0 ? "+ "+int(x.tirar) : "—"), e("td",{className:"px-3 py-2 text-[13.5px] "+MONO}, BK(x.bonus))); })))),
      e("p",{className:"text-[12px] text-muted-foreground"}, "\"Alvo agora\" já considera as remarcações anotadas. \"Para bater hoje, autorizar\" é quantas revendedoras a mais teriam que sair da meta para a faixa já estar batida com o que foi feito até agora.")));
}

// bloco do fluxo da meta: começou → saídas → chegadas → previstos ajustados → realizados → restam
function Bloco(p){ return e("div",{className:"flex min-w-0 flex-1 flex-col justify-between gap-1 rounded-2xl px-4 py-3 text-center", style:{background:"linear-gradient(145deg,"+p.cor+"3A,"+p.cor+"10 70%)", boxShadow:"inset 0 0 0 1.5px "+p.cor+"88, 0 4px 14px "+p.cor+"22"}},
  e("span",{className:"text-[10.5px] font-bold uppercase leading-tight tracking-[.12em] text-white/80"}, p.t),
  e("b",{className:MONO+" text-[30px] leading-none", style:{color:p.cor}}, p.v), p.sub && e("span",{className:"text-[11.5px] leading-tight text-white/65"}, p.sub)); }
var Op = function(t){ return e("span",{key:"op"+t, className:"hidden shrink-0 self-center text-[26px] font-black text-[#E8B84B] xl:block"}, t); };

function AbaAgPainel(){
  var c = useAg(), ag = c.ag, es = useState(null), esc = es[0], setEsc = es[1], ym = mesDe(ag, esc), fd = fatEfetivo(c.s);
  if(!ym) return e(Sem,{t:"Agendamento · Painel", sub:"Controle mensal dos acertos.", msg:"Nenhum mês aberto ainda. "+(c.gerente ? "Abra o mês em Abertura do mês." : "Peça a quem gerencia para abrir o mês.")});
  var p = painelDe(ag, ym, undefined, fd), fechados = Object.keys(ag.mes).filter(function(k){ return ag.mes[k].fechadoEm; }).sort().reverse(), prox = p.proximo;
  var copiar = function(){ try{ navigator.clipboard.writeText(p.texto); c.d({type:"AVISO", txt:"Texto copiado! Já pode colar no WhatsApp."}); }catch(x){} };
  var saiu = p.saidasPropositais+p.saidasOutras;
  return e("div",{className:"flex flex-col gap-4"},
    e(ListagemLeitura,{er:c.s.er}),
    e("div",{className:"flex flex-wrap items-center justify-between gap-3"},
      e("div",{className:"flex items-center gap-3"}, e("h1",{className:"font-heading text-2xl font-bold"}, nomeMes(ym)+" "+anoDe(ym)), e("span",{className:"rounded-full px-2.5 py-0.5 text-[12px] font-bold "+(p.aoVivo ? "bg-success/20 text-success" : "bg-muted text-muted-foreground")}, p.aoVivo ? "Ao vivo" : "Fechado")),
      e("div",{className:"flex flex-wrap items-center gap-2"},
        e("select",{value:esc||"", "aria-label":"Mês", className:INPUT+" h-9! w-56 cursor-pointer", onChange:function(ev){ setEsc(ev.target.value||null); }}, e("option",{value:""}, "Mês aberto (ao vivo)"), fechados.map(function(k){ return e("option",{key:k, value:k}, nomeMes(k)+"/"+anoDe(k)); })),
        c.gerente && p.aoVivo && e(Btn,{v:"secondary", sm:true, onClick:function(){ if(window.confirm("Isso vai FECHAR "+nomeMes(ym)+" definitivamente (vira histórico travado). Confirma?")) acao(c, "fechar", {ym:ym}); }}, "Fechar mês"),
        c.gerente && p.fechado && e(Btn,{v:"secondary", sm:true, onClick:function(){ if(window.confirm("Reabrir "+nomeMes(ym)+"? Ele volta a ficar editável.")) acao(c, "reabrir", {ym:ym}); }}, "Reabrir mês"))),
    p.alertaVencido && e(Aviso,{tom:"erro"}, "O calendário já virou e "+nomeMes(ym)+" ainda está aberto. Feche o mês para abrir o próximo."),
    p.alertaConciliacao && e(Aviso,null, "Soma das cotas por representante ("+int(p.alertaConciliacao.somaCotas)+") diferente dos acertos previstos ("+int(p.alertaConciliacao.previstos)+"). Diferença: "+int(p.alertaConciliacao.diferenca)+"."),
    p.estimado && p.aoVivo && e(Aviso,null, nomeMes(ym)+" abriu sozinho na virada do mês, com as revendedoras do fim do mês passado e acertos previstos estimados. "+(c.gerente ? "Confirme o número da DevMaster em Abertura do mês." : "Quem gerencia o setor confirma o número.")),
    e(BlocoBarra,{cor:"roxo", t:"Como a meta de "+nomeMes(ym)+" se forma", sub:"quem entra e quem sai da meta durante o mês · os acertos feitos vêm da Visão geral"},
      e("div",{className:"flex flex-col gap-3 p-4"},
        e("div",{className:"flex flex-col gap-2 xl:flex-row"},
          e(Bloco,{t:"Revendedoras que começaram o mês", v:int(p.base), cor:"#E8B84B", sub:"com kit na abertura"}), Op("−"),
          e(Bloco,{t:"Autorizadas (45 / 60 dias)", v:int(p.saidasPropositais), cor:"#60A5FA", sub:"adiadas com autorização · não contam na meta"}), Op("−"),
          e(Bloco,{t:"Remarcadas para outro mês", v:int(p.saidasOutras), cor:"#F59E0B", sub:"Ana Maria e outros motivos"}), Op("+"),
          e(Bloco,{t:"Vindas de outro mês", v:int(p.chegadas), cor:"#22C55E", sub:"remarcadas para este mês"}), Op("="),
          e(Bloco,{t:"Acertos previstos (meta)", v:int(p.previstos), cor:"#F3D98B", sub:p.previstosBase!==p.previstos ? "abertura: "+int(p.previstosBase)+" · ajustado" : "sem ajustes"})),
        e("div",{className:"flex flex-col gap-2 md:flex-row"},
          e(Bloco,{t:"Revendedoras agora", v:int(revAgora(c.s)), cor:"#E8B84B", sub:(revAgora(c.s)-p.base>=0 ? "+" : "")+int(revAgora(c.s)-p.base)+" desde o início do mês"}),
          e(Bloco,{t:"Acertos realizados", v:int(p.realizado), cor:"#4ADE80", sub:"vem da Visão geral"}),
          e(Bloco,{t:"Ainda faltam", v:int(p.restante), cor:p.restante>0 ? "#FBBF24" : "#4ADE80", sub:"para fechar a previsão"}),
          e(Bloco,{t:"% da previsão", v:pc(p.previstos>0 ? p.realizado/p.previstos*100 : 0), cor:"#C084FC", sub:"realizados ÷ previstos"})),
        e("div",{className:"flex flex-wrap items-center justify-between gap-2 rounded-xl bg-black/25 px-3 py-2 text-[13px]"},
          e("span",null, e("b",null, nomeMes(prox.ym)+" (formando): "), prox.formados+(prox.formados===1 ? " revendedora já remarcada" : " revendedoras já remarcadas")+" para o próximo mês · já entram nos acertos previstos dele."),
          e(Btn,{v:"secondary", sm:true, onClick:function(){ c.d({type:"ABA", aba:"agremarc"}); }}, "Anotar remarcações")))),
    e(MetasCards,{metas:p.metas}),
    e(BlocoBarra,{cor:"roxo", t:"Bônus do mês", sub:p.maior ? "faixa "+p.maior.pct+"% batida: o mesmo valor para cada funcionária" : "nenhuma faixa batida ainda"},
      e("div",{className:"flex flex-col divide-y divide-white/10 px-4 py-1"}, p.bonus.length===0 ? e("p",{className:"py-3 text-[13px] text-muted-foreground"}, "Nenhuma funcionária cadastrada no Configurador.") : p.bonus.map(function(b){
        return e("div",{key:b.nome, className:"flex items-center justify-between py-2.5 text-[14px]"}, e("b",{className:"uppercase"}, b.nome), e("b",{className:MONO+" text-primary"}, BK(b.valor))); }))),
    e(Evolucao,{dados:p.evolucao}),
    e(BlocoBarra,{cor:"roxo", t:"Representantes · pódio do mês"},
      e("div",{className:"flex flex-col gap-4 p-4"},
        p.ranking.podio.length===0 ? e("p",{className:"text-center text-[13px] text-muted-foreground"}, "Ainda sem dados de representantes lançados neste mês.") : e("div",{className:"flex flex-wrap justify-center gap-4"}, p.ranking.podio.map(function(r, i){ return e(Pecas,{key:r.codigo, r:r, i:i}); })),
        p.ranking.zona.length>0 && e("div",{className:"rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3"}, e("p",{className:"mb-2 text-[13px] font-bold text-destructive"}, "🚨 Zona de atenção ("+p.ranking.zona.length+")"),
          p.ranking.zona.map(function(z){ return e("div",{key:z.codigo, className:"flex items-center justify-between py-1 text-[13.5px]"}, e("span",{className:"font-medium uppercase"}, z.nome), e("b",{className:MONO+" text-destructive"}, pc(z.pct))); })))),
    e("div",{className:"grid grid-cols-1 gap-4 lg:grid-cols-2"},
      e(BlocoBarra,{cor:"roxo", t:"Totais por semana", sub:"semanas do calendário: segunda a domingo"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Semana"), th("Dias"), th("Total de acertos")])),
        e("tbody",null, p.semanas.map(function(sm){ return e("tr",{key:sm.semana, className:"border-b border-border/60"}, e("td",{className:"px-3 py-2 text-[13.5px]"}, "Semana "+sm.semana), e("td",{className:"px-3 py-2 text-[13.5px]"}, sm.rotulo), e("td",{className:"px-3 py-2 text-[13.5px] font-semibold "+MONO}, sm.total===null ? "—" : int(sm.total))); })))),
      e(BlocoBarra,{cor:"roxo", t:"Resumo pronto para WhatsApp"}, e("div",{className:"flex flex-col gap-3 p-4"}, e("textarea",{readOnly:true, value:p.texto, rows:4, className:INPUT+" h-auto! w-full p-3 text-[13.5px]"}), e(Btn,{v:"secondary", sm:true, ic:"copiar", onClick:copiar}, "Copiar texto")))));
}

// ───────────────── Remarcações: quem sai da meta do mês e para onde vai ─────────────────
function AbaAgRemarc(){
  var c = useAg(), ag = c.ag, ym = mesAberto(ag), nf = useState({nome:"", tipo:"p45", autorizadoPor:"", destino:"", obs:""}), form = nf[0], setForm = nf[1], nt = useState("anotar"), aba = nt[0], setAba = nt[1];
  if(!ym) return e(Sem,{t:"Remarcações do Agendamento", sub:"Quem sai da meta do mês.", msg:"Nenhum mês aberto ainda. "+(c.gerente ? "Abra o mês em Abertura do mês." : "Peça a quem gerencia para abrir o mês.")});
  var prox = proximoMes(ym), destinos = [prox, proximoMes(prox), proximoMes(proximoMes(prox))], destino = form.destino || prox, m = ag.mes[ym], mv = movimentos(ag, ym), mvProx = movimentos(ag, prox);
  var lista = (ag.remarc||[]).slice().sort(function(a1,b1){ return b1.em.localeCompare(a1.em); }), tipo = tipoDe(form.tipo), pr = painelDe(ag, ym, undefined, fatEfetivo(c.s)), pode = form.nome.trim() && form.autorizadoPor;
  var add = function(){ if(!pode) return; acao(c, "remarc_add", {nome:form.nome, tipo:form.tipo, autorizadoPor:form.autorizadoPor, destino:destino, obs:form.obs}); setForm(Object.assign({}, form, {nome:"", obs:""})); };
  var tile = function(t, v, cor, sub){ return e("div",{key:t, className:CARD+" flex flex-col items-center text-center"}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-[.12em] text-muted-foreground"}, t), e("b",{className:MONO+" text-[24px]", style:{color:cor}}, v), sub && e("span",{className:"text-[11.5px] text-muted-foreground"}, sub)); };
  var abas = [["anotar","Anotar e lista", lista.length], ["metas","Metas e calculadora"], ["proximo","Mês seguinte", mvProx.chegaram]];
  var campo = function(rot, el, cls){ return e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold "+(cls||"")}, rot, el); };
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Remarcações do Agendamento", sub:"Revendedora que sai da meta de "+nomeMes(ym)+": ela deixa de contar nos acertos previstos deste mês e passa a contar nos do mês para onde foi. Sempre se anota quem autorizou."}),
    e("div",{className:"grid grid-cols-2 gap-3 xl:grid-cols-5"},
      tile("Previstos da abertura", int(m.previstos), "#E8B84B"), tile("Autorizadas (45 / 60 dias)", "− "+int(mv.propositais), "#60A5FA", "adiadas de propósito"), tile("Remarcadas", "− "+int(mv.outras), "#F59E0B", "para o mês seguinte"),
      tile("Vindas de outro mês", "+ "+int(mv.chegaram), "#22C55E"), tile("Previstos ajustados", int(Math.max(0, m.previstos-mv.nSaem+mv.nEntram)), "#F3D98B", "a meta vale este número")),
    e("div",{className:"flex flex-wrap gap-2"}, abas.map(function(x){ var on = aba===x[0];
      return e("button",{key:x[0], onClick:function(){ setAba(x[0]); }, className:"flex h-11 items-center gap-2 rounded-xl px-5 text-[14px] font-bold ring-1 "+(on ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-[#E8B84B]/30 hover:bg-muted/50")},
        x[1], x[2]!==undefined && e("span",{className:"rounded-full bg-black/30 px-2 py-0.5 text-[11.5px] text-white"}, x[2])); })),
    aba==="anotar" && e("div",{className:"flex flex-col gap-4"},
      e(BlocoBarra,{cor:"roxo", t:"Anotar uma remarcação", sub:"vale na hora para as metas, os bônus e a previsão do Financeiro"},
        e("div",{className:"flex flex-col gap-2 p-4"},
          e("div",{className:"flex flex-wrap items-end gap-3"},
            campo("Revendedora", e("input",{value:form.nome, placeholder:"Nome da revendedora", className:INPUT+" h-10!", onChange:function(ev){ setForm(Object.assign({}, form, {nome:ev.target.value})); }, onKeyDown:function(ev){ if(ev.key==="Enter") add(); }}), "min-w-[14rem] flex-1"),
            campo("Motivo", e("select",{value:form.tipo, className:INPUT+" h-10! w-64 cursor-pointer", onChange:function(ev){ setForm(Object.assign({}, form, {tipo:ev.target.value})); }}, TIPOS_REMARC.map(function(t){ return e("option",{key:t.id, value:t.id}, t.lb); }))),
            campo("Quem autorizou", e("select",{value:form.autorizadoPor, className:INPUT+" h-10! w-44 cursor-pointer", onChange:function(ev){ setForm(Object.assign({}, form, {autorizadoPor:ev.target.value})); }}, e("option",{value:""}, "Escolha…"), AUTORIZADORES.map(function(n){ return e("option",{key:n, value:n}, n); }))),
            campo("Vai para o mês", e("select",{value:destino, className:INPUT+" h-10! w-44 cursor-pointer", onChange:function(ev){ setForm(Object.assign({}, form, {destino:ev.target.value})); }}, destinos.map(function(k){ return e("option",{key:k, value:k}, nomeMes(k)+"/"+anoDe(k)); }))),
            campo("Observação (opcional)", e("input",{value:form.obs, className:INPUT+" h-10!", onChange:function(ev){ setForm(Object.assign({}, form, {obs:ev.target.value})); }}), "min-w-[12rem] flex-1"),
            e(Btn,{v:"primary", disabled:!pode, onClick:add}, "Anotar")),
          e("p",{className:"text-[12px] text-muted-foreground"}, tipo.proposito ? "Adiada de propósito: não conta na meta deste mês." : "Sai da meta deste mês e entra na do mês escolhido.", !form.autorizadoPor && " Escolha quem autorizou para poder anotar."))),
      e(BlocoBarra,{cor:"roxo", t:"Remarcadas", sub:lista.length+(lista.length===1 ? " anotação" : " anotações")},
        lista.length===0 ? e("p",{className:"px-4 py-8 text-center text-[13px] text-muted-foreground"}, "Nenhuma remarcação anotada ainda. Quando uma revendedora for adiada ou passar para o mês seguinte, anote aqui com quem autorizou.") :
        e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Revendedora"), th("Motivo"), th("Autorizado por"), th("Sai de"), th("Vai para"), th("Anotado por"), th("")])),
          e("tbody",null, lista.map(function(x){ var t = tipoDe(x.tipo);
            return e("tr",{key:x.id, className:"border-b border-border/60"},
              e("td",{className:"px-3 py-2 text-[13.5px] font-semibold"}, x.nome, x.obs && e("span",{className:"block text-[11.5px] font-normal text-muted-foreground"}, x.obs)),
              e("td",{className:"px-3 py-2"}, e("span",{className:"whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-bold", style:{background:t.cor+"26", color:t.cor}}, t.lb)),
              e("td",{className:"px-3 py-2 text-[13.5px] font-semibold"}, x.autorizadoPor || "—"),
              e("td",{className:"px-3 py-2 text-[13px]"}, nomeMes(x.origem)), e("td",{className:"px-3 py-2 text-[13px] font-semibold"}, nomeMes(x.destino)),
              e("td",{className:"px-3 py-2 text-[12px] text-muted-foreground"}, x.por+" · "+new Date(x.em).toLocaleDateString("pt-BR")),
              e("td",{className:"px-3 py-2"}, e("button",{onClick:function(){ if(window.confirm("Desfazer a remarcação de "+x.nome+"?")) acao(c, "remarc_del", {id:x.id}); }, "aria-label":"Desfazer", title:"Desfazer", className:"grid size-8 place-items-center rounded-lg bg-muted/50 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"}, e(Ph,{n:"trash", s:15})))); })))))),
    aba==="metas" && e("div",{className:"flex flex-col gap-4"}, e(MetasCards,{metas:pr.metas}), e(CalculadoraMetas,{p:pr, agora:revAgora(c.s)})),
    aba==="proximo" && e("div",{className:"flex flex-col gap-4"},
      e(BlocoBarra,{cor:"roxo", t:nomeMes(prox)+" · formando", sub:"o que já chegou de "+nomeMes(ym)},
        e("div",{className:"flex flex-col gap-2 p-4"}, e("b",{className:MONO+" text-[34px] text-[#4ADE80]"}, "+ "+int(mvProx.chegaram)), e("span",{className:"text-[12.5px] text-muted-foreground"}, "revendedoras já remarcadas para "+nomeMes(prox)+". Elas entram nos acertos previstos de lá quando o mês abrir, somadas ao número da abertura."),
          mvProx.entram.map(function(x){ return e("span",{key:x.id, className:"text-[13px]"}, "• "+x.nome+" · autorizado por "+(x.autorizadoPor||"—")); }))),
      c.gerente && e("p",{className:"rounded-xl bg-muted/30 px-3 py-2 text-[12px] text-muted-foreground"}, "Em Abertura do mês você informa o número que vem da DevMaster; as remarcações ajustam por cima, sem duplicar.")));
}

// ───────────────── Representantes ─────────────────
function AbaAgReps(){
  var c = useAg(), ag = c.ag, ym = mesDe(ag, null), od = useState("pct"), ordem = od[0], setOrdem = od[1], bq = useState(""), busca = bq[0], setBusca = bq[1];
  if(!ym) return e(Sem,{t:"Controle por representante", sub:"Contagem regressiva a partir da cota do dia 1.", msg:"Nenhum mês aberto ainda."});
  var p = painelDe(ag, ym, undefined, fatEfetivo(c.s)), fechado = p.fechado, rk = p.ranking, ant = pctPorCodigo(ag, mesAnterior(ym)), total = diasNoMes(ym), dias = []; for(var i=1; i<=total; i++) dias.push(i);
  var norm = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }, q = norm(busca);
  var feitoDe = function(l){ return Math.max(0, l.cota-l.saldoAtual); };
  var ordenadas = p.linhas.slice().sort(function(a1, b1){
    if(ordem==="afazer") return b1.saldoAtual-a1.saldoAtual; if(ordem==="menos") return a1.saldoAtual-b1.saldoAtual; if(ordem==="nome") return a1.nome.localeCompare(b1.nome); if(ordem==="cota") return b1.cota-a1.cota; return 0; });
  var linhas = ordenadas.filter(function(l){ return !q || norm(l.nome).indexOf(q)>=0 || norm(l.codigo).indexOf(q)>=0; });
  var totCota = p.linhas.reduce(function(t,l){ return t+l.cota; }, 0), totAfazer = p.linhas.reduce(function(t,l){ return t+l.saldoAtual; }, 0), totFeito = Math.max(0, totCota-totAfazer);
  var maisAfazer = p.linhas.filter(function(l){ return l.cota>0; }).slice().sort(function(a1, b1){ return b1.saldoAtual-a1.saldoAtual; }).slice(0, 10), maxAf = Math.max.apply(null, maisAfazer.map(function(l){ return l.saldoAtual; }).concat([1]));
  var sub = function(d){ var v = p.linhas.map(function(l){ return l.saldosPorDia[d]; }).filter(function(x){ return x!==undefined; }); return v.length ? int(v.reduce(function(t,x){ return t+x; }, 0)) : "—"; };
  var tile = function(t, v, cor, s2){ return e("div",{key:t, className:CARD+" flex flex-col items-center text-center"}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-[.12em] text-muted-foreground"}, t), e("b",{className:MONO+" text-[24px]", style:{color:cor}}, v), s2 && e("span",{className:"text-[11.5px] text-muted-foreground"}, s2)); };
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Controle por representante", sub:"Quem já fez, quem ainda tem acertos a fazer e como cada uma está na cota do mês. Cada dia, lance o saldo que falta para a representante bater a cota."}),
    p.alertaConciliacao ? e(Aviso,null, "Soma das cotas ("+int(p.somaCotas)+") não bate com os acertos previstos do setor ("+int(p.previstos)+").") : e(Aviso,{tom:"ok"}, "Soma das cotas bate com os acertos previstos do setor."),
    e("div",{className:"grid grid-cols-2 gap-3 xl:grid-cols-5"}, tile("Cotas somadas", int(totCota), "#E8B84B", p.linhas.filter(function(l){ return l.cota>0; }).length+" representantes com cota"), tile("Já feitos", int(totFeito), "#4ADE80"), tile("Ainda a fazer", int(totAfazer), "#FBBF24", "soma dos saldos"),
      tile("% das cotas", pc(pct100(totFeito, totCota)), "#C084FC"), tile("Previstos do mês", int(p.previstos), "#F3D98B", "com as remarcações")),
    maisAfazer.length>0 && e(BlocoBarra,{cor:"roxo", t:"Quem mais tem acertos a fazer", sub:"as 10 com mais acertos faltando para a cota"}, e("div",{className:"flex flex-col gap-1.5 p-4"}, maisAfazer.map(function(l){
      return e("div",{key:l.codigo, className:"grid grid-cols-[minmax(8rem,16rem)_minmax(0,1fr)_5rem] items-center gap-3"}, e("span",{className:"truncate text-[13px] font-semibold uppercase", title:l.nome}, l.nome),
        e("div",{className:"h-3 overflow-hidden rounded bg-muted/50"}, e("div",{className:"h-full rounded bg-linear-to-r from-[#B8862B] to-[#FBBF24]", style:{width:Math.max(2, l.saldoAtual/maxAf*100)+"%"}})), e("b",{className:MONO+" text-right text-[13px]"}, int(l.saldoAtual)+" a fazer")); }))),
    e("div",{className:"flex flex-wrap items-end justify-center gap-4"}, rk.podio.map(function(r, i){ return e(Pecas,{key:r.codigo, r:r, i:i}); })),
    rk.zona.length>0 && e(BlocoBarra,{cor:"roxo", t:"🚨 Zona de atenção · "+rk.zona.length+" piores do mês"}, e("div",{className:"flex flex-col divide-y divide-white/10 px-4 py-1"}, rk.zona.map(function(z){ return e("div",{key:z.codigo, className:"flex items-center justify-between py-2 text-[14px]"}, e("span",{className:"font-medium uppercase"}, z.nome), e("b",{className:MONO+" text-destructive"}, pc(z.pct))); }))),
    e(BlocoBarra,{cor:"roxo", t:"Todas as representantes", sub:linhas.length+" na lista · "+(fechado ? "mês fechado" : "mês ao vivo")},
      e("div",{className:"flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5"},
        e("input",{value:busca, placeholder:"Buscar por nome ou código", "aria-label":"Buscar representante", className:INPUT+" h-9! w-64", onChange:function(ev){ setBusca(ev.target.value); }}),
        e("select",{value:ordem, "aria-label":"Ordenar por", className:INPUT+" h-9! w-64 cursor-pointer", onChange:function(ev){ setOrdem(ev.target.value); }}, [["pct","Ordenar: % batido (maior primeiro)"],["afazer","Ordenar: mais acertos a fazer"],["menos","Ordenar: menos acertos a fazer"],["cota","Ordenar: maior cota"],["nome","Ordenar: nome A–Z"]].map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }))),
      e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse text-[14px]"},
        e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Cód.","sticky left-0 z-10 bg-sidebar"), th("Representante","sticky left-12 z-10 bg-sidebar"), th("Cota (dia 1)"), th("Feitos"), th("A fazer","border-r border-border")].concat(dias.map(function(d){ return th(String(d),"text-center px-1!"); }), [th("% mês"), th("Tendência")]))),
        e("tbody",null, linhas.map(function(l){ var a = ant[l.codigo];
          return e("tr",{key:l.codigo, className:"border-b border-border/60"},
            e("td",{className:"sticky left-0 z-10 bg-card px-3 py-1.5 font-medium"}, l.codigo), e("td",{title:l.nome, className:"sticky left-12 z-10 min-w-48 bg-card px-3 py-1.5 font-medium uppercase"}, l.nome),
            e("td",{className:"bg-card px-3 py-1.5 text-center"}, l.id && c.gerente && !fechado ? e(Dig,{value:l.cota, label:"Cota de "+l.nome, className:"w-20", onSalvar:function(v){ acao(c, "cota", {repId:l.id, cota:v||0}); }}) : e("b",{className:MONO}, int(l.cota))),
            e("td",{className:"px-3 py-1.5 text-center "+MONO+" text-[#4ADE80]"}, int(feitoDe(l))), e("td",{className:"border-r border-border px-3 py-1.5 text-center font-bold "+MONO+(l.saldoAtual>0 ? " text-[#FBBF24]" : " text-success")}, int(l.saldoAtual)),
            dias.map(function(d){ return e("td",{key:d, className:"px-1 py-1 text-center"}, l.id && !fechado ? e(Dig,{value:l.saldosPorDia[d], label:l.nome+" dia "+d, placeholder:"-", className:"w-14 px-1!", onSalvar:function(v){ acao(c, "saldo", {repId:l.id, dia:d, saldo:v}); }}) : e("span",{className:MONO+" text-[12px]"}, l.saldosPorDia[d]!==undefined ? l.saldosPorDia[d] : "—")); }),
            e("td",{className:"whitespace-nowrap px-3 py-1.5 font-semibold "+MONO}, pc(l.pct)),
            e("td",{className:"px-3 py-1.5 text-center"}, l.pct===null || a===undefined ? "—" : l.pct>a ? e("span",{className:"text-success"}, "▲") : l.pct<a ? e("span",{className:"text-destructive"}, "▼") : e("span",{className:"text-muted-foreground"}, "■"))); }),
          e("tr",{className:"bg-sidebar font-bold"}, e("td",{colSpan:2, className:"sticky left-0 z-10 bg-sidebar px-3 py-2 uppercase"}, "Total geral"), e("td",{className:"px-3 py-2 text-center "+MONO}, int(p.somaCotas)), e("td",{className:"px-3 py-2 text-center "+MONO}, int(totFeito)), e("td",{className:"border-r border-border px-3 py-2 text-center "+MONO}, int(totAfazer)),
            dias.map(function(d){ return e("td",{key:d, className:"px-2 py-2 text-center text-[12px] "+MONO}, sub(d)); }), e("td",{colSpan:2}))))),
    e("p",{className:"text-center text-[12.5px] text-muted-foreground"}, "A cota do dia 1 é preenchida por quem gerencia o setor. Os dias seguintes recebem o saldo restante (contagem regressiva). Representante sem cota fica fora do ranking. Nomes duplicados se juntam no Configurador.")));
}
var pct100 = function(a, b){ return b>0 ? a/b*100 : 0; };

// ───────────────── Abertura do mês ─────────────────
function AbaAgAbertura(){
  var c = useAg(), ag = c.ag, aberto = mesAberto(ag), ymSug = aberto || chaveMes(new Date());
  var sy = useState(ymSug), ymSel = sy[0], setYm = sy[1], m = ag.mes[ymSel] || {base:0, previstos:0}, f = useState({base:null, previstos:null}), form = f[0], setForm = f[1];
  if(!c.gerente) return e(Sem,{t:"Abertura do mês", sub:"Revendedoras com kit e acertos previstos.", msg:"Só quem gerencia o setor (Diretoria e Ana Maria) abre o mês."});
  var base = form.base!==null ? form.base : m.base, prev = form.previstos!==null ? form.previstos : m.previstos;
  var trava = ag.mes[ymSel] && ag.mes[ymSel].fechadoEm ? "Este mês está fechado. Reabra-o no Painel para alterar." : (aberto && aberto!==ymSel ? "Feche "+nomeMes(aberto)+" antes de abrir "+nomeMes(ymSel)+"." : null);
  var hist = Object.keys(ag.mes).sort().reverse();
  var campo = function(k, rot, v){ return e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold"}, rot, e("input",{value:v ? int(v) : "", inputMode:"numeric", "aria-label":rot, className:INPUT+" h-10! w-48 text-center "+MONO, onChange:function(ev){ var n = Number(ev.target.value.replace(/\D/g,"").slice(0,6)||0), o = {}; o[k] = n; setForm(Object.assign({}, form, o)); }})); };
  var meses = []; var hj = new Date(); for(var i=-2; i<=2; i++){ meses.push(chaveMes(new Date(hj.getFullYear(), hj.getMonth()+i, 1))); }
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Abertura do mês", sub:"No começo do mês (qualquer dia, depois de fechar o anterior): quantas revendedoras têm kit e quantos acertos o setor prevê. Isso também vale para a previsão do Financeiro."}),
    trava && e(Aviso,null, trava),
    ag.mes[ymSel] && ag.mes[ymSel].aberturaAuto && !ag.mes[ymSel].fechadoEm && e(Aviso,null, nomeMes(ymSel)+" abriu sozinho na virada do mês, com as revendedoras do fim do mês passado"+(ag.mes[ymSel].estimado ? " e acertos previstos estimados" : "")+". Confira o número da DevMaster e clique em Salvar."),
    e(BlocoBarra,{cor:"roxo", t:"Abrir ou atualizar o mês"}, e("div",{className:"flex flex-wrap items-end gap-3 p-4"},
      e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold"}, "Mês", e("select",{value:ymSel, className:INPUT+" h-10! w-48 cursor-pointer", onChange:function(ev){ setYm(ev.target.value); setForm({base:null, previstos:null}); }}, meses.map(function(k){ return e("option",{key:k, value:k}, nomeMes(k)+"/"+anoDe(k)); }))),
      campo("base", "Revendedoras com kit", base), campo("previstos", "Acertos previstos", prev),
      e(Btn,{v:"primary", disabled:!!trava || !(prev>0), onClick:function(){ acao(c, "abrir", {ym:ymSel, base:base, previstos:prev}); setForm({base:null, previstos:null}); }}, ag.mes[ymSel] ? "Salvar" : "Abrir mês"))),
    e(BlocoBarra,{cor:"roxo", t:"Histórico de aberturas"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Mês"), th("Revendedoras com kit"), th("Acertos previstos"), th("Situação")])),
      e("tbody",null, hist.map(function(k){ var x = ag.mes[k]; return e("tr",{key:k, className:"border-b border-border/60"}, e("td",{className:"px-3 py-2 text-[13.5px] font-semibold"}, nomeMes(k)+"/"+anoDe(k)), e("td",{className:"px-3 py-2 text-[13.5px] "+MONO}, int(x.snapshot ? x.snapshot.revendedorasComKit : x.base)), e("td",{className:"px-3 py-2 text-[13.5px] "+MONO}, int(x.snapshot ? x.snapshot.acertosPrevistos : x.previstos)), e("td",{className:"px-3 py-2 text-[13px]"}, x.fechadoEm ? "Fechado" : "Aberto")); })))));
}

// ───────────────── Configurador ─────────────────
function AbaAgConfig(){
  var c = useAg(), ag = c.ag, cfg = ag.config, nf = useState({pct:"", bonus:""}), novaF = nf[0], setNovaF = nf[1], nn = useState(""), novaFn = nn[0], setNovaFn = nn[1], nr = useState({codigo:"", nome:""}), novaR = nr[0], setNovaR = nr[1];
  var aberto = mesAberto(ag), pg = aberto ? Object.assign({prevista:null, confirmada:null, por:null}, ag.mes[aberto].pagamento) : null;
  if(!c.gerente) return e(Sem,{t:"Configurador do Agendamento", sub:"Representantes e quem gerencia o setor.", msg:"Só quem gerencia o setor (Diretoria e Ana Maria) mexe no Configurador."});
  var jr = useState({pri:"", dup:""}), jun = jr[0], setJun = jr[1], par = parecidas(ag);
  var campoTxt = function(v, label, onSalvar, cls){ return e("input",{key:v, defaultValue:v, "aria-label":label, className:INPUT+" h-9! "+(cls||"w-full"), onBlur:function(ev){ if(ev.target.value!==v) onSalvar(ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); }}); };
  var del = function(fn){ return e("button",{onClick:fn, "aria-label":"Excluir", className:"grid size-8 place-items-center rounded-lg bg-muted/50 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"}, e(Ph,{n:"trash", s:15})); };
  var chk = function(on, onChange, txt){ return e("label",{className:"flex cursor-pointer items-center gap-2 text-[13px]"}, e("input",{type:"checkbox", checked:on, onChange:function(ev){ onChange(ev.target.checked); }, className:"size-4"}), txt); };
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Configurador do Agendamento", sub:"Representantes (cada uma com o próprio controle), grupos para os relatórios e quem gerencia o setor. As metas e os valores do bônus ficam em Financeiro → Comissões."}),
    e("div",{className:"grid grid-cols-1 gap-4 lg:grid-cols-2"}, e(BlocoBarra,{cor:"roxo", t:"Quem gerencia o setor", sub:"gerenciar = abrir e fechar o mês, cota das representantes e Configurador. A Diretoria sempre gerencia."}, e("div",{className:"flex flex-col gap-2 p-4"},
        AGENDAMENTO.map(function(pe){ return chk((cfg.gerentes||[]).indexOf(pe.id)>=0, function(v){ acao(c, "gerente", {id:pe.id, on:v}); }, pe.nome+" · "+((cfg.gerentes||[]).indexOf(pe.id)>=0 ? "gerencia" : "só lança")); }),
        e("p",{className:"text-[12px] text-muted-foreground"}, "Marcus, Nickolas e Lucas: gerenciam sempre (Diretoria).")))),
    e(Aviso,{tom:"ok"}, "Cada representante continua com o próprio controle (cota e saldo). Para os relatórios somarem duas ou mais numa só (ex.: Thalita e Thalita SC), escreva o mesmo nome na coluna \"Grupo nos relatórios\" da tabela abaixo. Nomes parecidos, como Letícia Adrielle e Letícia Alves, são pessoas diferentes e não se juntam sozinhos."),
    e(BlocoBarra,{cor:"roxo", t:"Representantes", sub:cfg.representantes.length+" cadastradas · o código é único; mudar nome ou código vale também para os meses fechados"}, e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"},
      e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Código"), th("Nome"), th("Grupo nos relatórios"), th("Ativa"), th("")])),
      e("tbody",null, cfg.representantes.map(function(r){ return e("tr",{key:r.id, className:"border-b border-border/60"},
        e("td",{className:"px-3 py-1.5"}, campoTxt(r.codigo, "Código", function(v){ acao(c, "rep_set", {id:r.id, codigo:v}); }, "w-20 text-center")), e("td",{className:"px-3 py-1.5"}, campoTxt(r.nome, "Nome", function(v){ acao(c, "rep_set", {id:r.id, nome:v}); }, "w-72"), (r.apelidos||[]).length>0 && e("span",{className:"mt-0.5 block text-[11px] text-muted-foreground"}, "também aparecia como: "+r.apelidos.join(", "))),
        e("td",{className:"px-3 py-1.5"}, campoTxt(r.grupo||"", "Grupo nos relatórios", function(v){ acao(c, "rep_grupo", {id:r.id, grupo:v}); }, "w-44")), e("td",{className:"px-3 py-1.5"}, chk(r.ativo, function(v){ acao(c, "rep_set", {id:r.id, ativo:v}); }, "")), e("td",{className:"px-3 py-1.5"}, del(function(){ if(window.confirm("Excluir "+r.nome+"? Apaga cota e saldos dela (meses fechados não mudam). Para quem só saiu, prefira inativar.")) acao(c, "rep_del", {id:r.id}); }))); }),
        e("tr",null, e("td",{className:"px-3 py-2"}, e("input",{value:novaR.codigo, placeholder:"Cód.", className:INPUT+" h-9! w-20 text-center", onChange:function(ev){ setNovaR(Object.assign({}, novaR, {codigo:ev.target.value})); }})), e("td",{className:"px-3 py-2"}, e("input",{value:novaR.nome, placeholder:"Nome da representante", className:INPUT+" h-9! w-72", onChange:function(ev){ setNovaR(Object.assign({}, novaR, {nome:ev.target.value})); }})),
          e("td",{colSpan:3, className:"px-3 py-2"}, e(Btn,{v:"secondary", sm:true, disabled:!novaR.codigo.trim() || !novaR.nome.trim(), onClick:function(){ acao(c, "rep_add", novaR); setNovaR({codigo:"", nome:""}); }}, "+ Representante"))))))));
}

// Metas e valores do bônus (Financeiro → Comissões): faixas de meta e funcionárias do bônus
function AbaAgMetas(){
  var c = useAg(), ag = c.ag, cfg = ag.config, nf = useState({pct:"", bonus:""}), novaF = nf[0], setNovaF = nf[1], nn = useState(""), novaFn = nn[0], setNovaFn = nn[1];
  if(!c.gerente) return e(Sem,{t:"Metas e bônus do Agendamento", sub:"Faixas de meta, valor do bônus e funcionárias.", msg:"Só quem gerencia o setor (Diretoria e Ana Maria) muda as metas e os valores do bônus."});
  var campoTxt = function(v, label, onSalvar, cls){ return e("input",{key:v, defaultValue:v, "aria-label":label, className:INPUT+" h-9! "+(cls||"w-full"), onBlur:function(ev){ if(ev.target.value!==v) onSalvar(ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); }}); };
  var del = function(fn){ return e("button",{onClick:fn, "aria-label":"Excluir", className:"grid size-8 place-items-center rounded-lg bg-muted/50 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"}, e(Ph,{n:"trash", s:15})); };
  var chk = function(on, onChange, txt){ return e("label",{className:"flex cursor-pointer items-center gap-2 text-[13px]"}, e("input",{type:"checkbox", checked:on, onChange:function(ev){ onChange(ev.target.checked); }, className:"size-4"}), txt); };
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Metas e bônus do Agendamento", sub:"Porcentagem de cada meta, valor do bônus e quem recebe. O bônus é pago no dia combinado em Datas de pagamento (padrão 15). Meses já fechados guardam os valores da época."}),
    e("div",{className:"grid grid-cols-1 gap-4 lg:grid-cols-2"}, e(BlocoBarra,{cor:"roxo", t:"Faixas de meta", sub:"o bônus é o da maior faixa batida, igual para cada funcionária ativa"}, e("div",{className:"flex flex-col gap-2 p-4"},
        cfg.faixas.slice().sort(function(a,b){ return a.pct-b.pct; }).map(function(f){ return e("div",{key:f.id, className:"flex items-center gap-2"}, e("span",{className:"text-[13px] font-semibold"}, "Meta"), e(Dig,{value:f.pct, label:"Porcentagem da meta", className:"w-20", onSalvar:function(v){ acao(c, "faixa_set", {id:f.id, pct:v||0}); }}), e("span",null, "%  · bônus R$"), e(Dig,{value:f.bonus, label:"Bônus da faixa", className:"w-28", onSalvar:function(v){ acao(c, "faixa_set", {id:f.id, bonus:v||0}); }}), del(function(){ if(window.confirm("Excluir esta faixa?")) acao(c, "faixa_del", {id:f.id}); })); }),
        e("div",{className:"flex items-center gap-2 border-t border-white/10 pt-2"}, e("input",{value:novaF.pct, placeholder:"%", inputMode:"numeric", className:INPUT+" h-9! w-20 text-center", onChange:function(ev){ setNovaF(Object.assign({}, novaF, {pct:ev.target.value.replace(/\D/g,"")})); }}), e("input",{value:novaF.bonus, placeholder:"bônus R$", inputMode:"numeric", className:INPUT+" h-9! w-28 text-center", onChange:function(ev){ setNovaF(Object.assign({}, novaF, {bonus:ev.target.value.replace(/\D/g,"")})); }}), e(Btn,{v:"secondary", sm:true, disabled:novaF.pct==="", onClick:function(){ acao(c, "faixa_add", {pct:Number(novaF.pct), bonus:Number(novaF.bonus||0)}); setNovaF({pct:"", bonus:""}); }}, "+ Faixa")))),
      e(BlocoBarra,{cor:"roxo", t:"Funcionárias do bônus", sub:"só as ativas recebem bônus; não se exclui, só se inativa"}, e("div",{className:"flex flex-col gap-2 p-4"},
        cfg.funcionarias.map(function(f){ return e("div",{key:f.id, className:"flex items-center gap-3"}, campoTxt(f.nome, "Nome da funcionária", function(v){ acao(c, "func_set", {id:f.id, nome:v}); }, "min-w-0 flex-1"), chk(f.ativa, function(v){ acao(c, "func_set", {id:f.id, ativa:v}); }, "ativa")); }),
        e("div",{className:"flex items-center gap-2 border-t border-white/10 pt-2"}, e("input",{value:novaFn, placeholder:"Nome da funcionária", className:INPUT+" h-9! min-w-0 flex-1", onChange:function(ev){ setNovaFn(ev.target.value); }}), e(Btn,{v:"secondary", sm:true, disabled:!novaFn.trim(), onClick:function(){ acao(c, "func_add", {nome:novaFn}); setNovaFn(""); }}, "+ Funcionária"))))));
}

// ───────────────── Análises ─────────────────
function AbaAgAnalises(){
  var cA = useAg(), ag = cA.ag, a = analisesDe(ag, fatEfetivo(cA.s)), W = 640, H = 220, pad = 34;
  var pts = a.meses, maxY = Math.max.apply(null, pts.map(function(m){ return m.pctMeta; }).concat([100])), xs = function(i){ return pad + (pts.length>1 ? i*(W-2*pad)/(pts.length-1) : (W-2*pad)/2); }, ys = function(v){ return H-pad-(v/maxY)*(H-2*pad); };
  var csv = function(){ var linhas = "Mes;Vendedoras;Previstos;Realizado;PctMeta;PctTotal\n"+a.meses.map(function(m){ return [m.nome+"/"+m.ano, m.base, m.previstos, m.realizado, m.pctMeta.toFixed(2), m.pctSobreVendedoras.toFixed(2)].join(";"); }).join("\n");
    var blob = new Blob(["﻿"+linhas], {type:"text/csv;charset=utf-8;"}), url = URL.createObjectURL(blob), l = document.createElement("a"); l.href = url; l.download = "acertos_historico.csv"; l.click(); URL.revokeObjectURL(url); };
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Análises do Agendamento", sub:"Meses fechados e o mês aberto (ao vivo): % da meta batido, comparativo entre anos e consistência das representantes."}, e(Btn,{v:"secondary", sm:true, ic:"save", disabled:!a.meses.length, onClick:csv}, "Exportar CSV")),
    e(BlocoBarra,{cor:"roxo", t:"Tendência ao longo do tempo", sub:"% da meta batido por mês"}, pts.length===0 ? e("p",{className:"px-4 py-10 text-center text-[13px] text-muted-foreground"}, "Sem meses no histórico ainda.") :
      e("div",{className:"overflow-x-auto p-3"}, e("svg",{viewBox:"0 0 "+W+" "+H, className:"h-60 w-full min-w-[34rem]", role:"img", "aria-label":"Gráfico da % da meta por mês"},
        [0,50,100].map(function(g){ return e("g",{key:g}, e("line",{x1:pad, x2:W-pad, y1:ys(g), y2:ys(g), stroke:"rgba(255,255,255,.12)", strokeDasharray:"3 3"}), e("text",{x:4, y:ys(g)+4, fontSize:11, fill:"#9CA3AF"}, g+"%")); }),
        e("polyline",{fill:"none", stroke:"#E8B84B", strokeWidth:2.5, points:pts.map(function(m, i){ return xs(i)+","+ys(m.pctMeta); }).join(" ")}),
        pts.map(function(m, i){ return e("g",{key:m.ym}, e("circle",{cx:xs(i), cy:ys(m.pctMeta), r:4.5, fill:m.aoVivo ? "#4ADE80" : "#E8B84B"}, e("title",null, m.nome+"/"+m.ano+": "+pc(m.pctMeta)+(m.aoVivo ? " (ao vivo)" : ""))), e("text",{x:xs(i), y:H-10, fontSize:11, textAnchor:"middle", fill:"#9CA3AF"}, m.nome.slice(0,3)+"/"+m.ano.slice(2)), e("text",{x:xs(i), y:ys(m.pctMeta)-9, fontSize:10.5, textAnchor:"middle", fill:"#E5E7EB"}, Math.round(m.pctMeta)+"%")); })))),
    e(BlocoBarra,{cor:"roxo", t:"Comparativo do mesmo mês entre anos"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Mês"), th("Anos")])), e("tbody",null, a.comparativo.map(function(x){ return e("tr",{key:x.nomeMes, className:"border-b border-border/60"}, e("td",{className:"px-3 py-2 text-[13.5px] font-semibold"}, x.nomeMes), e("td",{className:"px-3 py-2 text-[13.5px]"}, x.porAno.map(function(y){ return y.ano+": "+pc(y.pctMeta); }).join(" · "))); })))),
    e(BlocoBarra,{cor:"roxo", t:"Representantes mais consistentes", sub:"média histórica do % final nos meses fechados"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Representante"), th("Meses fechados"), th("Média de %")])),
      e("tbody",null, a.consistencia.length===0 ? e("tr",null, e("td",{colSpan:3, className:"px-3 py-4 text-[13px] text-muted-foreground"}, "Ainda não há meses fechados com cotas por representante para calcular a consistência.")) : a.consistencia.map(function(r){ return e("tr",{key:r.codigo, className:"border-b border-border/60"}, e("td",{className:"px-3 py-2 text-[13.5px] font-semibold uppercase"}, r.nome), e("td",{className:"px-3 py-2 text-[13.5px]"}, r.mesesFechados), e("td",{className:"px-3 py-2 text-[13.5px] font-semibold "+MONO}, pc(r.mediaPct))); })))));
}

// ───────────────── Histórico ─────────────────
function AbaAgHistorico(){
  var c = useAg(), ag = c.ag, anos = Object.keys(ag.mes).map(anoDe).filter(function(v, i, x){ return x.indexOf(v)===i; }).sort().reverse(), an = useState(anos[0]||String(new Date().getFullYear())), ano = an[0], setAno = an[1], rp = useState(""), repSel = rp[0], setRepSel = rp[1];
  
  var meses = Object.keys(ag.mes).filter(function(k){ return anoDe(k)===ano && ag.mes[k].fechadoEm; }).sort();
  var reps = {}; Object.keys(ag.mes).sort().forEach(function(k){ var sn = ag.mes[k].snapshot; if(ag.mes[k].fechadoEm && sn) agrupar((sn.representantes||[]).map(function(r){ return {codigo:r.codigo, nome:r.nome, grupo:r.grupo, cota:r.cota, saldoAtual:r.saldoFinal, pct:r.pctFinal}; })).forEach(function(r){ (reps[r.codigo] = reps[r.codigo]||{nome:r.nome, meses:[]}).meses.push({ym:k, pct:r.pct, cota:r.cota, saldo:r.saldoAtual}); }); });
  var logs = ag.log||[];
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Histórico do Agendamento", sub:"Meses fechados por ano e histórico por representante. Os acertos de cada dia vêm da Visão geral."},
      anos.length>0 && e("select",{value:ano, className:INPUT+" h-9! w-28 cursor-pointer", "aria-label":"Ano", onChange:function(ev){ setAno(ev.target.value); }}, anos.map(function(a){ return e("option",{key:a, value:a}, a); }))),
    e(BlocoBarra,{cor:"roxo", t:"Meses fechados de "+ano}, meses.length===0 ? e("p",{className:"px-4 py-6 text-center text-[13px] text-muted-foreground"}, "Nenhum mês fechado neste ano.") : e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"},
      e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Mês"), th("Revendedoras com kit"), th("Previstos"), th("Realizados"), th("% da meta"), th("Faixa batida"), th("Fechado por")])),
      e("tbody",null, meses.map(function(k){ var m = ag.mes[k], sn = m.snapshot, av = sn ? sn.metasVigentes.slice().sort(function(a,b){ return a.pct-b.pct; }).filter(function(f){ return sn.realizado>=sn.acertosPrevistos*f.pct/100; }).slice(-1)[0] : null;
        return e("tr",{key:k, className:"border-b border-border/60"}, e("td",{className:"px-3 py-2 text-[13.5px] font-semibold"}, nomeMes(k)), e("td",{className:"px-3 py-2 text-[13.5px] "+MONO}, int(sn.revendedorasComKit)), e("td",{className:"px-3 py-2 text-[13.5px] "+MONO}, int(sn.acertosPrevistos)), e("td",{className:"px-3 py-2 text-[13.5px] "+MONO}, int(sn.realizado)),
          e("td",{className:"px-3 py-2 text-[13.5px] font-semibold "+MONO}, pc(sn.acertosPrevistos>0 ? sn.realizado/sn.acertosPrevistos*100 : 0)), e("td",{className:"px-3 py-2 text-[13.5px]"}, av ? av.pct+"% · bônus "+BK(av.bonus) : "nenhuma"), e("td",{className:"px-3 py-2 text-[12.5px] text-muted-foreground"}, m.fechadoPor||"—")); }))))),
    e(BlocoBarra,{cor:"roxo", t:"Histórico por representante"}, e("div",{className:"flex flex-col gap-3 p-4"},
      Object.keys(reps).length===0 ? e("p",{className:"text-[13px] text-muted-foreground"}, "Os meses fechados ainda não guardaram cotas por representante.") : e(React.Fragment,null,
        e("select",{value:repSel, className:INPUT+" h-9! w-72 cursor-pointer", "aria-label":"Representante", onChange:function(ev){ setRepSel(ev.target.value); }}, e("option",{value:""}, "Escolha a representante…"), Object.keys(reps).sort().map(function(k){ return e("option",{key:k, value:k}, k+" · "+reps[k].nome); })),
        repSel && reps[repSel] && e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Mês"), th("Cota"), th("Saldo final"), th("% final")])), e("tbody",null, reps[repSel].meses.map(function(x){ return e("tr",{key:x.ym, className:"border-b border-border/60"}, e("td",{className:"px-3 py-2 text-[13.5px]"}, nomeMes(x.ym)+"/"+anoDe(x.ym)), e("td",{className:"px-3 py-2 text-[13.5px] "+MONO}, int(x.cota)), e("td",{className:"px-3 py-2 text-[13.5px] "+MONO}, int(x.saldo)), e("td",{className:"px-3 py-2 text-[13.5px] font-semibold "+MONO}, pc(x.pct===undefined ? null : (x.pct===null ? 0 : x.pct)))); })))))),
    logs.length>0 && e(BlocoBarra,{cor:"roxo", t:"Registro de fechamentos"}, e("div",{className:"flex flex-col divide-y divide-white/10 px-4 py-1"}, logs.slice(0,12).map(function(l, i){ return e("div",{key:i, className:"flex items-center justify-between py-2 text-[13px]"}, e("span",null, e("b",null, l.acao==="FECHADO" ? "Fechado" : "Reaberto"), " · "+nomeMes(l.ym)+"/"+anoDe(l.ym)), e("span",{className:"text-muted-foreground"}, l.por+" · "+new Date(l.em).toLocaleDateString("pt-BR"))); }))));
}


// ───────────────── Bônus das metas (Financeiro → Comissões): valor a pagar, vence todo dia 15, forma de pagamento e registro de todos os meses ─────────────────
var FORMAS_BONUS = ["Pix","Transferência","Dinheiro","Na folha de pagamento"];
var dataBr = function(iso){ return iso ? iso.split("-").reverse().join("/") : "—"; };
function LinhaBonus(p){
  var l = p.l, ym = p.ym, c = p.c, ff = useState({forma:"Pix", conta:"", obs:""}), f = ff[0], setF = ff[1];
  var reg = function(){ acao(c, "bonus_pag", {ym:ym, nome:l.nome, forma:f.forma, conta:f.conta, obs:f.obs}); };
  return e("div",{className:"flex flex-wrap items-center gap-3 py-2.5 text-[14px]"},
    e("b",{className:"min-w-[10rem] flex-1 uppercase"}, l.nome), e("b",{className:MONO+" w-32 text-primary"}, BK(l.valor)),
    l.pag ? e("div",{className:"flex min-w-[16rem] flex-[2] flex-wrap items-center gap-2"},
        e("span",{className:"rounded-full bg-success/20 px-2.5 py-0.5 text-[12px] font-bold text-success"}, "✓ Pago em "+dataBr(l.pag.pagoEm)), e("span",{className:"text-[13px]"}, l.pag.forma+(l.pag.conta ? " · "+l.pag.conta : "")+" · por "+l.pag.por), l.pag.obs && e("span",{className:"text-[12px] text-muted-foreground"}, l.pag.obs),
        p.pode && e("button",{onClick:function(){ if(window.confirm("Desfazer o registro de pagamento de "+l.nome+"?")) acao(c, "bonus_pag", {ym:ym, nome:l.nome, desfazer:true}); }, className:"text-[12px] text-muted-foreground underline hover:text-destructive"}, "desfazer")) :
    !p.fechado ? e("span",{className:"flex-[2] text-[13px] text-muted-foreground"}, "Aguardando o fechamento do mês") :
    p.antes ? e("span",{className:"flex-[2] text-[13px] text-muted-foreground"}, "Anterior ao sistema · sem lançamento") :
    l.valor<=0 ? e("span",{className:"flex-[2] text-[13px] text-muted-foreground"}, "Sem bônus neste mês") :
    p.pode ? e("div",{className:"flex min-w-[16rem] flex-[2] flex-wrap items-center gap-2"},
        e("select",{value:f.forma, "aria-label":"Forma de pagamento", className:INPUT+" h-9! w-52 cursor-pointer", onChange:function(ev){ setF(Object.assign({}, f, {forma:ev.target.value})); }}, FORMAS_BONUS.map(function(x){ return e("option",{key:x, value:x}, x); })),
        e("input",{value:f.conta, placeholder:"Conta (opcional)", "aria-label":"Conta de saída", className:INPUT+" h-9! w-44", onChange:function(ev){ setF(Object.assign({}, f, {conta:ev.target.value})); }}),
        e(Btn,{v:"primary", sm:true, onClick:reg}, "Registrar pagamento")) :
    e("span",{className:"flex-[2] text-[13px] font-semibold text-warning"}, "Pendente · o financeiro registra o pagamento"));
}
function AbaAgBonus(){
  var c = useAg(), ag = c.ag, fd = fatEfetivo(c.s), pode = c.gerente || podeFinanceiro(c.s.usuario) || podeConferirPag(c.s.usuario);
  var dp = c.s.datasPag||{}, dia = (dp.setores||{}).agendamento || dp.geral || 15;
  var meses = Object.keys(ag.mes).sort().reverse().map(function(k){ return bonusDoMes(ag, k, fd, dia); }).filter(function(x){ return !!x; });
  var pend = meses.filter(function(x){ return x.fechado && !x.antes && x.aPagar>0; }), aPagar = pend.reduce(function(t,x){ return t+x.aPagar; }, 0), atras = meses.filter(function(x){ return x.atrasado; });
  var proxVenc = pend.length ? pend.map(function(x){ return x.vencimento; }).sort()[0] : null, pagoTotal = meses.reduce(function(t,x){ return t+x.pago; }, 0);
  var tile = function(t, v, cor, sub){ return e("div",{key:t, className:CARD+" flex flex-col items-center text-center"}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-[.12em] text-muted-foreground"}, t), e("b",{className:MONO+" text-[24px]", style:{color:cor}}, v), sub && e("span",{className:"text-[11.5px] text-muted-foreground"}, sub)); };
  var chip = function(x){ var cor = x.atrasado ? "#EF4444" : x.situacao==="pago" ? "#22C55E" : x.situacao==="pendente" ? "#F59E0B" : "#94A3B8"; return e("span",{className:"rounded-full px-2.5 py-0.5 text-[12px] font-bold capitalize", style:{background:cor+"26", color:cor}}, x.atrasado ? "atrasado" : x.situacao); };
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Bônus do Agendamento", sub:"O bônus das metas de cada mês fecha no último dia e é pago no dia "+dia+" do mês seguinte (o dia muda em Datas de pagamento). O financeiro registra a forma de pagamento e tudo fica guardado, mês a mês, para sempre."}),
    e("div",{className:"grid grid-cols-2 gap-3 xl:grid-cols-4"},
      tile("A pagar", BK(aPagar), "#FBBF24", pend.length+(pend.length===1 ? " mês pendente" : " meses pendentes")), tile("Próximo vencimento", proxVenc ? dataBr(proxVenc) : "—", "#E8B84B", "todo dia "+dia),
      tile("Atrasado", int(atras.length), atras.length ? "#EF4444" : "#4ADE80", atras.length ? "meses passaram do dia "+dia : "tudo em dia"), tile("Já pago (registrado)", BK(pagoTotal), "#4ADE80", "soma de todos os meses")),
    atras.length>0 && e(Aviso,{tom:"erro"}, "Bônus de "+atras.map(function(x){ return nomeMes(x.ym)+"/"+anoDe(x.ym); }).join(", ")+" passou do dia "+dia+" sem pagamento registrado."),
    meses.map(function(x){
      return e(BlocoBarra,{key:x.ym, cor:"roxo", t:nomeMes(x.ym)+" "+anoDe(x.ym), sub:x.fechado ? "vence em "+dataBr(x.vencimento)+(x.faixa ? " · faixa "+x.faixa+"% batida" : " · nenhuma faixa batida")+" · "+int(x.realizado)+" de "+int(x.previstos)+" acertos" : "mês em andamento · "+(x.faixa ? "faixa "+x.faixa+"% batida até agora" : "nenhuma faixa batida ainda")+" · vence em "+dataBr(x.vencimento)+" se fechar assim"},
        e("div",{className:"flex flex-col px-4 py-2"},
          e("div",{className:"flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2"}, chip(x), e("span",{className:"text-[13px]"}, "Total "+BK(x.total)+" · pago "+BK(x.pago)+" · ", e("b",{className:"text-[#F3D98B]"}, "a pagar "+BK(x.aPagar)))),
          x.linhas.length===0 ? e("p",{className:"py-3 text-[13px] text-muted-foreground"}, "Nenhuma funcionária cadastrada no Configurador.") : e("div",{className:"flex flex-col divide-y divide-white/10"}, x.linhas.map(function(l){ return e(LinhaBonus,{key:x.ym+l.nome, l:l, ym:x.ym, c:c, pode:pode, fechado:x.fechado, antes:x.antes}); })))); }));
}
// Comissões do Agendamento: uma aba só, com o que há a pagar e, ao lado, as metas e os valores
function AbaAgComissoes(){
  var tb = useState("bonus"), aba = tb[0], setAba = tb[1];
  return e("div",{className:"flex flex-col gap-4"},
    e("div",{className:"flex flex-wrap gap-2"}, [["bonus","Bônus a pagar"], ["metas","Metas e valores"]].map(function(x){ return e("button",{key:x[0], onClick:function(){ setAba(x[0]); }, className:"h-10 rounded-xl px-4 text-[13px] font-bold ring-1 "+(aba===x[0] ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-border hover:bg-muted/50")}, x[1]); })),
    aba==="bonus" ? e(AbaAgBonus) : e(AbaAgMetas));
}
export { AbaAgComissoes, AbaAgMetas, AbaAgBonus, AbaAgRemarc, AbaAgPainel, AbaAgReps, AbaAgAbertura, AbaAgConfig, AbaAgAnalises, AbaAgHistorico };

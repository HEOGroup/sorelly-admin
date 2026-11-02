// Sorelly Admin · montagem — pages/AgendamentoPainel.js
// Agendamento › Painel (Marcus, 01/11/2026): PRIMEIRA aba do setor, versão D (calendário no centro, a conta da meta ao lado, representantes embaixo).
// Refeito no mesmo dia, a pedido do Marcus: SEM faixa de totais no alto, SEM textos de explicação, SEM lista suspensa (os meses são botões). O calendário e a conta da meta ocupam o topo.
// Regra do previsto vigente (docs/negocio/FATURAMENTO-DIARIO.md): previsto do início − passadas pelo Marcus (45/60 dias) + entradas; a meta conta sobre ele. As contas ficam em domain/agendamento.js (painelDe).
// "Datas a confirmar" vem do módulo agrev (foto das datas da DevMaster, tela Revendedoras); o previsto de cada dia vem da mesma leitura (/agenda-revendedoras).
import { Botao, CAMPO, inteiro } from "@/apps/montagem/components/padrao-fin";
import { CalendarioAcertos } from "@/apps/montagem/components/calendario-acertos";
import { redistribuirContagem } from "@/apps/montagem/domain/feriados";
import { GradeFiltro } from "@/apps/montagem/components/grade-filtro";
import { anoDe, chaveMes, nomeProprio, mesAberto, nomeMes, painelDe } from "@/apps/montagem/domain/agendamento";
import { nomeDe, podeGerirAgend } from "@/apps/montagem/domain/equipe";
import { fatEfetivo } from "@/apps/montagem/domain/financeiro";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { BKC, isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { ListagemLeitura } from "@/apps/montagem/pages/encomendas/ListagemDia";
import { e, useEffect, useState } from "@/shared/react";

var pc = function(v){ return v===null || v===undefined ? "—" : v.toLocaleString("pt-BR", {minimumFractionDigits:1, maximumFractionDigits:1})+"%"; };
var dBR = function(iso){ return iso ? iso.slice(8, 10)+"/"+iso.slice(5, 7) : "—"; };
var LINHA = "flex h-8 items-center justify-between gap-2 border-b border-border px-1 text-[13px] last:border-b-0 ";

// caixa no mesmo tom escuro com borda dourada da tela Revendedoras
function Caixa(p){ return e("section",{className:"rounded-xl border border-[rgba(232,184,75,.22)] bg-[#131315] "+(p.cls||"")}, e("div",{className:"flex h-8 items-center justify-between gap-2 px-3 text-[13px] font-semibold text-foreground"}, e("span",{className:"truncate", title:p.t}, p.t), p.dir), e("div",{className:"px-3 pb-3"}, p.children)); }

function AbaAgPainel(){
  var cx = use(), s = cx.state, d = cx.dispatch, ag = s.agend, gerente = podeGerirAgend(s.usuario, ag), por = nomeDe(s.usuario);
  var es = useState(null), esc = es[0], setEsc = es[1], mu = useState([]), datas = mu[0], setDatas = mu[1], pd = useState(null), prevDia = pd[0], setPrevDia = pd[1], md = useState("sistema"), modo = md[0], setModo = md[1];
  var ks = Object.keys(ag.mes).sort(), ym = esc && ag.mes[esc] ? esc : (mesAberto(ag) || ks[ks.length-1] || null);
  // datas mudadas na DevMaster que esperam o Marcus (módulo agrev, chaves "d_..."); sem servidor, fica vazio
  useEffect(function(){
    if(!apiAtiva()) return undefined; var vivo = true;
    chamar("GET", "/estado/agrev").then(function(r){ if(!vivo) return; var c = (r && r.conteudo) || {}; setDatas(Object.keys(c).filter(function(k){ return k.indexOf("d_")===0 && c[k] && c[k].id && !c[k].quem; }).map(function(k){ return c[k]; })); }).catch(function(){});
    return function(){ vivo = false; };
  }, [setDatas]);
  // previsto de cada dia = kits abertos na DevMaster com data de acerto naquele dia (mesma leitura da tela Revendedoras, leva uns 20 s); dia que já passou só mostra o feito
  useEffect(function(){
    if(!apiAtiva()) return undefined; var vivo = true, hj = isoDia(new Date());
    chamar("GET", "/agenda-revendedoras").then(function(r){ if(!vivo) return; var m = {}, ma = {}, atras = 0; (r.itens || []).forEach(function(i){ if(!i.prev) return; if(i.prev<hj) atras++; else { m[i.prev] = (m[i.prev] || 0)+1; if(i.agenda) ma[i.prev] = (ma[i.prev] || 0)+1; } }); setPrevDia({dias:m, ag:ma, atrasadas:atras}); }).catch(function(){});
    return function(){ vivo = false; };
  }, [setPrevDia]);
  if(!ym) return e("div",{className:"flex flex-col gap-3"}, e("p",{className:"text-[13px] text-foreground"}, "Nenhum mês aberto. O mês abre sozinho na virada; aguarde a leitura da DevMaster."));
  var p = painelDe(ag, ym, undefined, fatEfetivo(s)), meses = Object.keys(ag.mes).sort();
  var agora = new Date(), hoje = chaveMes(agora)===ym ? agora.getDate() : 0, pctReal = p.previstos>0 ? p.realizado/p.previstos*100 : 0;
  var revAgora = (function(){ var r = Object.keys(s.revendedorasDiario||{}).sort(); return r.length ? s.revendedorasDiario[r[r.length-1]] : 0; })();
  var evIso = {}; p.evolucao.forEach(function(x){ evIso[ym+"-"+String(x.dia).padStart(2, "0")] = x.incremento; });
  var red = p.aoVivo && prevDia ? redistribuirContagem(modo==="agendado" ? prevDia.ag : prevDia.dias) : {eff:{}, saiu:{}, entra:{}};   // acerto de domingo ou feriado passa para o próximo dia útil
  var valorCal = function(i){ var f = evIso[i]; return {n:red.eff[i] || 0, sai:red.saiu[i], entra:red.entra[i], f:f===undefined || f===null ? undefined : f}; };
  var ir = function(aba){ d({type:"ABA", aba:aba}); };
  var fechar = function(){ if(window.confirm("Isso vai FECHAR "+nomeMes(ym)+" definitivamente (vira histórico travado). Confirma?")) d({type:"AG", op:"fechar", ym:ym, por:por}); };
  var reabrir = function(){ if(window.confirm("Reabrir "+nomeMes(ym)+"? Ele volta a ficar editável.")) d({type:"AG", op:"reabrir", ym:ym, por:por}); };
  var linha = function(rot, v, forte, cor){ return e("div",{key:rot, className:LINHA+(forte ? "font-semibold" : "")}, e("span",{className:"truncate", title:rot}, rot), e("b",{className:"whitespace-nowrap tabular-nums "+(cor||"")}, v)); };
  var reps = p.linhas.filter(function(l){ return l.cota>0; }).slice().sort(function(a, b){ return b.saldoAtual-a.saldoAtual; }).slice(0, 8);
  var comData = prevDia ? Object.keys(prevDia.dias).filter(function(k){ return k.slice(0, 7)===ym; }).reduce(function(tt, k){ return tt+prevDia.dias[k]; }, 0) : null;
  return e("div",{className:"flex flex-col gap-3"},
    e("div",{className:"flex flex-wrap items-center gap-1.5"},
      e("select",{value:ym, "aria-label":"Mês", className:CAMPO+" w-48! cursor-pointer", onChange:function(ev){ var k = ev.target.value; setEsc(k===mesAberto(ag) ? null : k); }},
        meses.slice().reverse().map(function(k){ return e("option",{key:k, value:k}, nomeMes(k)+" "+anoDe(k)); })),
      e("span",{className:"flex-1"}),
      p.alertaVencido && e("span",{className:"text-[13px] text-warning"}, nomeMes(ym)+" já virou: feche o mês"),
      gerente && p.aoVivo && e(Botao,{onClick:fechar}, "Fechar mês"), gerente && p.fechado && e(Botao,{onClick:reabrir}, "Reabrir mês")),
    e("div",{className:"grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,.9fr)]"},
      e(CalendarioAcertos,{ano:Number(ym.slice(0, 4)), mes:Number(ym.slice(5, 7))-1, valor:valorCal, hojeIso:isoDia(new Date()), modo:modo, setModo:setModo, celula:68}),
        e(Caixa,{t:"Meta", cls:"self-start"},
          linha("Revendedoras no início", inteiro(p.base)),
          p.base>p.previstosBase && linha("Sem acerto no mês", "−"+inteiro(p.base-p.previstosBase)),
          linha("Previsto do início", inteiro(p.previstosBase), true),
          linha("Passadas pelo Marcus", "−"+inteiro(p.saidasPropositais)),
          linha("Remarcadas para outro mês", "−"+inteiro(p.saidasOutras)),
          linha("Vindas de outro mês", "+"+inteiro(p.chegadas)),
          linha("Previsto vigente", inteiro(p.previstos), true, "text-primary"),
          linha("Feitos", inteiro(p.realizado)),
          linha("Faltam", inteiro(p.restante)),
          linha("Realizado", pc(pctReal), true),
          linha("Revendedoras agora", inteiro(revAgora)),
          comData!==null && linha("Com data no mês na DevMaster", inteiro(comData)),
          p.alertaConciliacao && linha("Soma das cotas das representantes", inteiro(p.alertaConciliacao.somaCotas))),
        e(Caixa,{t:"Faixas", cls:"self-start"},
        e(GradeFiltro,{chave:"faixas", rows:p.metas, cols:[{k:"pct", t:"Faixa", forte:true, v:function(m){ return m.pct; }, exib:function(m){ return m.pct+"%"; }}, {k:"alvo", t:"Alvo", tipo:"num", v:function(m){ return Math.ceil(m.alvo); }, exib:function(m){ return inteiro(Math.ceil(m.alvo)); }},
          {k:"falta", t:"Falta", tipo:"num", v:function(m){ return m.bateu ? 0 : m.falta; }, exib:function(m){ return m.bateu ? "✓" : inteiro(m.falta); }, cor:function(m){ return m.bateu ? "text-success" : ""; }}, {k:"bonus", t:"Bônus", tipo:"num", v:function(m){ return m.bonus; }, exib:function(m){ return BKC(m.bonus); }}]}))),
    datas.length>0 && e(Caixa,{t:"Datas a confirmar ("+datas.length+")", dir:e(Botao,{onClick:function(){ ir("agrevs"); }}, "Abrir Revendedoras")},
      e(GradeFiltro,{chave:"datas", vazio:"Nada a confirmar.", rows:datas.slice(0, 8), cols:[{k:"nome", t:"Revendedora", forte:true, v:function(m){ return nomeProprio(m.nome); }}, {k:"rep", t:"Representante", v:function(m){ return nomeProprio(m.rep); }},
        {k:"mud", t:"Mudança", v:function(m){ return m.de+m.para; }, exib:function(m){ return dBR(m.de)+" → "+dBR(m.para); }}, {k:"mes", t:"Mês", v:function(m){ return m.de.slice(0, 7)!==m.para.slice(0, 7) ? "Troca de mês" : "Mesmo mês"; }}]})),
    reps.length>0 && e(Caixa,{t:"Representantes", dir:e(Botao,{onClick:function(){ ir("agreps"); }}, "Abrir Representantes")},
      e(GradeFiltro,{chave:"reps", rows:reps, cols:[{k:"nome", t:"Representante", forte:true, v:function(l){ return nomeProprio(l.nome); }}, {k:"cota", t:"Cota", tipo:"num", v:function(l){ return l.cota; }, exib:function(l){ return inteiro(l.cota); }},
        {k:"feitos", t:"Feitos", tipo:"num", v:function(l){ return Math.max(0, l.cota-l.saldoAtual); }, exib:function(l){ return inteiro(Math.max(0, l.cota-l.saldoAtual)); }}, {k:"afazer", t:"A fazer", tipo:"num", v:function(l){ return l.saldoAtual; }, exib:function(l){ return inteiro(l.saldoAtual); }}, {k:"pct", t:"%", tipo:"num", v:function(l){ return l.pct; }, exib:function(l){ return pc(l.pct); }}]})),
    e(ListagemLeitura,{er:s.er}));
}

export { AbaAgPainel };

// Sorelly Admin · montagem — pages/Caixa.js
// Uma tela só para o caixa, com duas visões no topo: "Visão geral" (planilha e comparação) e "Lançar saldos" (onde a funcionária preenche o dia).
// Colunas = só os dias lançados (+ hoje); cada coluna é o saldo do FIM do dia. A variação é sempre do PRIMEIRO ao ÚLTIMO dia em aberto
// (dá para fechar qualquer dia com o ✕). Saldo base = último dia do mês anterior (no dia 1º já se pagam contas).
// Guarda em s.saldosContas (reducer SALDO_*). Regras em domain/saldos-contas.js.
import { MESES_LONGO, contasDoMes, fatEfetivo } from "@/apps/montagem/domain/financeiro";
import { ChavePixCaixa } from "@/apps/montagem/components/chave-pix-caixa";
import { CopiarChave } from "@/apps/montagem/components/copiar-chave";
import { pixDaCaixa } from "@/apps/montagem/domain/pix-regras";
import { RECEBER_LOCAL, RECEBER_MAPA_LOCAL, FERIADOS, chaveMes, datasLancadas, isoDia, posicaoEm, provaDoMes } from "@/apps/montagem/domain/saldos-contas";
import { BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MONO, MoneyInput, NumInput } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";
import { ConfigContas } from "@/apps/montagem/pages/ConfigContas";
import React from "react";

var p2 = function(n){ return String(n).padStart(2,"0"); };
var dp = function(k){ return k.split("-").reverse().join("/"); };
var dc = function(k){ return k.split("-").reverse().slice(0,2).join("/"); };
var sinal = function(v){ return (v>=0 ? "+ " : "− ")+BK(Math.abs(v)); };
var num = function(v){ return Number(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}); };
var neg = function(v){ return v<0 ? "text-destructive" : ""; };
var SEM = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
var diaSem = function(k){ return new Date(k+"T12:00:00").getDay(); };
var fimSem = function(k){ var d = diaSem(k); return d===0 || d===6 || !!FERIADOS[k]; };   // fim de semana e feriado: mesma cor
// nome completo de cada CNPJ (o nome salvo do bloco é curto)
var NOME_CNPJ = {"34":"CNPJ 34 · Sorelly Atacadista", "46":"CNPJ 46 · Mayz Comércio de Moda", "59":"CNPJ 59 · Serenity Porta Joias", "67":"CNPJ 67 · Axis Comércio de Joias", "HO":"H&O Apps"};
var COR_BLOCO = {"34":"#64748B","46":"#64748B","59":"#64748B","67":"#64748B","HO":"#64748B","PART":"#64748B","DIN":"#64748B","BLOQ":"#64748B","ITM":"#64748B","FORN":"#64748B"};   // 21/10/2026: uma cor neutra só (o Marcus não quer a tela colorida)
// cor do CNPJ misturada com branco: mesma família de cores, só mais clara
var clara = function(hex){ var n = parseInt(hex.slice(1), 16), m = function(c){ return Math.round(c+(255-c)*0.4); }; return "#"+[m(n>>16), m((n>>8)&255), m(n&255)].map(function(x){ return x.toString(16).padStart(2,"0"); }).join(""); };
var CAB = "sticky left-0 z-10 w-60 min-w-60 px-2 py-1.5 text-left text-[13px] shadow-[12px_0_16px_-8px_rgba(0,0,0,0.75)]";
var GRADE = "border border-border/50";
var STICKY_VAR = "sticky right-0 z-10 bg-linear-to-l from-[#1b1e25] to-[#14161b] shadow-[-12px_0_16px_-8px_rgba(0,0,0,0.75)] ";

function recebidoDoMes(s, ano, mes){
  var pref = chaveMes(ano, mes), fd = fatEfetivo(s), ks = Object.keys(fd).filter(function(k){ return k.slice(0,7)===pref; }).sort();
  return ks.length ? (fd[ks[ks.length-1]].recebido||0) : 0;
}
// saldo da conta numa data (último lançado até lá); ds = datas lançadas, ordenadas
function efetivo(sc, ds, id, ate){
  for(var i=ds.length-1; i>=0; i--){ if(ds[i]<=ate && sc.saldos[ds[i]][id]!==undefined) return sc.saldos[ds[i]][id]; }
  return null;
}

// número que CORRE até o novo valor (1, 2, 3 ... 10) em vez de pular de uma vez
function useCorrendo(alvo){
  var ref = React.useRef(alvo), st = useState(alvo), v = st[0], setV = st[1];
  React.useEffect(function(){
    var de = ref.current, ini = performance.now(), dur = 900, raf = 0;
    var passo = function(t){ var k = Math.min(1, (t-ini)/dur), x = de+(alvo-de)*(1-Math.pow(1-k, 3)); ref.current = x; setV(x); if(k<1) raf = requestAnimationFrame(passo); };
    raf = requestAnimationFrame(passo);
    return function(){ cancelAnimationFrame(raf); };
  }, [alvo]);
  return v;
}
function Corre(p){ var v = useCorrendo(p.v); return e("span",{className:p.className}, p.f ? p.f(v) : BK(v)); }

var NEUTRO = "from-white/[0.06] via-white/[0.03] to-card ring-white/10";
var FUNDO = {ouro:NEUTRO, verde:NEUTRO, azul:NEUTRO, verm:NEUTRO};
// cartão em degradê: título, número grande que corre, e a variação do período numa etiqueta (▲ sobe / ▼ desce)
function Cartao(p){
  var d = p.delta===null || p.delta===undefined ? p.delta : Math.round(p.delta*100)/100;
  return e("div",{className:"flex min-w-0 flex-col items-center gap-1 rounded-xl bg-linear-to-br px-3 py-2 text-center ring-1 "+FUNDO[p.fundo||"ouro"]+" "+(p.cls||"")},
    e("span",{className:"text-[12px] font-bold uppercase tracking-wide text-foreground"}, p.l),
    e(Corre,{v:p.v, className:"whitespace-nowrap font-mono text-[22px] font-bold leading-none tabular-nums "+(p.cor||"")}),
    d!==null && d!==undefined ? e("span",{className:"rounded-full px-2 py-0.5 text-[11.5px] font-bold "+(d===0 ? "bg-muted/40 text-foreground/70" : d>0 ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300")},
      (d>0 ? "▲ " : d<0 ? "▼ " : "• ")+BK(Math.abs(d))) : null,
    p.tag && e("span",{className:"rounded-full px-3 py-1 text-[12.5px] font-extrabold tracking-wide "+(p.tag.bom ? "bg-emerald-500/25 text-emerald-200" : "bg-red-500/25 text-red-200")}, p.tag.t),
    p.sub && e("div",{className:"mt-1 w-full border-t border-white/10 pt-1.5 text-[13px] font-medium leading-snug text-foreground/90"},
      [].concat(p.sub).map(function(l, i){ return e("div",{key:i, className:i ? "text-[12px] font-normal text-foreground/70" : ""}, l); })));
}

function Op(p){ return e("div",{className:"grid place-items-center px-1 text-[20px] font-bold text-primary"}, p.t); }
function Caixinha(p){
  return e("div",{className:"flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl xl:min-w-[8.5rem] bg-linear-to-br px-3 py-2 text-center ring-1 "+(p.forte ? FUNDO.azul : FUNDO.ouro)},
    e("span",{className:"text-[11.5px] font-bold uppercase tracking-wide"}, p.l),
    p.v===null||p.v===undefined ? e("span",{className:"font-mono text-[17px] font-bold text-foreground/50"}, "—") : e(Corre,{v:p.v, className:"whitespace-nowrap font-mono text-[17px] font-bold tabular-nums "+(p.cor || (p.v<0 ? "text-red-400" : ""))}),
    p.sub && e("span",{className:"text-[11.5px] text-foreground/80"}, p.sub),
    p.ir && e("button",{onClick:p.ir, className:"mt-0.5 rounded-md bg-black/30 px-2 py-0.5 text-[11px] font-bold hover:bg-primary/30"}, "ver diário ›"));
}

// célula editável: clica, digita (dígitos entram pela direita, "-" inverte o sinal), Enter grava
function Celula(p){
  var st = useState(null), ed = st[0], setEd = st[1];
  if(ed===null) return e("button",{onClick:function(){ setEd(p.v||0); }, title:"Clique para lançar",
    className:"w-full px-2 py-1.5 text-center text-[14px] "+MONO+" "+(p.lancado ? "font-semibold " : "text-foreground/55 ")+neg(p.v)+" hover:bg-primary/15"}, p.v===null ? "—" : num(p.v));
  return e("input",{ref:function(el){ if(el && document.activeElement!==el){ el.focus(); el.select(); } }, inputMode:"numeric", value:(ed<0?"-":"")+num(Math.abs(ed)),
    className:"w-full min-w-28 bg-primary/15 px-2 py-1.5 text-center text-[14px] outline-none ring-1 ring-primary "+MONO+" "+neg(ed),
    onChange:function(ev){ var raw = ev.target.value, n = (raw.match(/-/g)||[]).length%2===1, dg = raw.replace(/\D/g,"").slice(0,12); setEd((n?-1:1)*Number(dg||0)/100); },
    onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); if(ev.key==="Escape"){ setEd(null); } },
    onBlur:function(){ if(ed!==null && ed!==p.v) p.salvar(ed); setEd(null); }});
}

// ── Lançar saldos: a funcionária preenche o dia e vai fechando CNPJ por CNPJ (ou todos de uma vez). O que digita fica salvo na hora; pode sair e voltar. ──
function LancarTela(p){
  var cx = use(), sc = cx.state.saldosContas, hoje = isoDia(new Date());
  var dt = useState(hoje), data = dt[0], setData = dt[1];
  var blocos = sc.blocos.filter(function(b){ return sc.contas.some(function(c){ return c.bloco===b.id; }); });
  var fm = (sc.fechamentos||{})[data] || {};
  var nFech = blocos.filter(function(b){ return fm[b.id]; }).length;
  var ds = datasLancadas(sc);
  var inicial = function(){ var o = {}; sc.contas.forEach(function(c){ var v = (sc.saldos[data]||{})[c.id]; if(v===undefined) v = efetivo(sc, ds, c.id, data); o[c.id] = v===null||v===undefined ? 0 : v; }); return o; };
  var vl = useState(inicial), vals = vl[0], setVals = vl[1];
  var apS = useState({bloco:"34", valor:0, desc:""}), ap = apS[0], setAp = apS[1];
  var fS = useState(""), fil = fS[0], setFil = fS[1];   // CNPJ escolhido no topo (vazio = todos)
  var abS = useState({}), abertos = abS[0], setAbertos = abS[1];
  var contasF = sc.contas.filter(function(c){ return !fil || c.bloco===fil; });
  var qS = useState(""), busca = qS[0], setBusca = qS[1];   // campo de busca: CNPJ (34, 46...), nome do banco ou da conta
  var nq = function(x){ return String(x||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); };
  var casaB = function(b){ return !busca || nq((NOME_CNPJ[b.id] || "")+" "+b.nome+" "+b.id).indexOf(nq(busca))>=0; };
  var casaC = function(c){ return !busca || nq(c.nome).indexOf(nq(busca))>=0; };
  var guardado = function(id){ var v = (sc.saldos[data]||{})[id]; if(v===undefined) v = efetivo(sc, ds, id, data); return v===null||v===undefined ? 0 : v; };
  var trocar = function(d){ if(d && d<=hoje){ setData(d); var o = {}; sc.contas.forEach(function(c){ var v = (sc.saldos[d]||{})[c.id]; if(v===undefined) v = efetivo(sc, ds, c.id, d); o[c.id] = v===null||v===undefined ? 0 : v; }); setVals(o); } };
  var andar = function(n){ var d2 = new Date(data+"T12:00:00"); d2.setDate(d2.getDate()+n); trocar(isoDia(d2)); };
  var total = contasF.filter(function(c){ return !c.bloqueada; }).reduce(function(t,c){ return t+(vals[c.id]||0); },0);
  var limite = contasF.filter(function(c){ return !c.bloqueada; }).reduce(function(t,c){ return t+(c.limite||0); },0);
  var fechar = function(ids, fechado){ cx.dispatch({type:"SALDO_FECHAR", data:data, blocos:ids, valores:vals, fechado:fechado}); };
  var todos = blocos.map(function(b){ return b.id; });
  var fdia = (cx.state.fatDia||{})[data] || {acertos:0, recebido:0};
  var acum = Object.keys(cx.state.fatDia||{}).filter(function(k){ return k.slice(0,7)===data.slice(0,7) && k<=data; }), acumA = acum.reduce(function(x,k){ return x+cx.state.fatDia[k].acertos; },0), acumR = acum.reduce(function(x,k){ return x+cx.state.fatDia[k].recebido; },0);
  var cpd = (cx.state.contasPagasDiario||{})[data] || {}, pagoDoDia = function(id){ return id==="fora" ? (cpd.contasPorFora||0) : ((cpd.cnpjs||{})[id]||0); };
  var pagTotal = ["34","46","59","67","fora"].reduce(function(x,id){ return x+pagoDoDia(id); },0);
  return e("div",{"data-lancar":"1", className:"flex flex-col gap-3"},
    e("div",{className:"flex flex-wrap items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2"},
      e("h2",{className:"mr-1 font-heading text-[16px] font-bold"}, "Lançar saldos do dia"),
      e(Btn,{onClick:function(){ andar(-1); }}, "‹"),
      e("input",{type:"date", value:data, max:hoje, "aria-label":"Data do lançamento", className:INPUT+" h-9! w-44", onChange:function(ev){ trocar(ev.target.value); }}),
      e(Btn,{onClick:function(){ andar(1); }}, "›"),
      e("span",{className:"text-sm font-semibold "+(fimSem(data) ? "text-violet-300" : "")}, SEM[diaSem(data)]+(FERIADOS[data] ? " · Feriado ("+FERIADOS[data]+")" : "")),
      e("span",{className:"ml-auto rounded-full px-3 py-1 text-sm font-bold ring-1 "+(nFech===blocos.length ? "bg-emerald-500/25 ring-emerald-400/60 text-emerald-200" : "bg-card ring-border")}, nFech+" de "+blocos.length+" CNPJs fechados"),
      e(Btn,{onClick:function(){ fechar(todos, true); }}, "Fechar todos"), e(Btn,{onClick:function(){ fechar(todos, false); }}, "Reabrir todos")),
    // o que se lança todo dia, junto: saldos, pagamentos e faturamento
    e("div",{className:"flex flex-wrap items-center gap-2 text-[13px]"}, e("span",{className:"font-bold"}, "Hoje a Nayale lança:"),
      [["Saldos das contas", nFech===blocos.length, nFech+"/"+blocos.length+" CNPJs"], ["Pagamentos do dia", !!(cx.state.contasPagasDiario||{})[data], ""], ["Faturamento do dia", !!(cx.state.fatDia||{})[data], ""]].map(function(x){
        return e("span",{key:x[0], className:"rounded-full px-3 py-1 font-semibold ring-1 "+(x[1] ? "bg-emerald-500/25 ring-emerald-400/60 text-emerald-200" : "bg-card ring-border")}, (x[1] ? "✓ " : "○ ")+x[0]+(x[2] && !x[1] ? " · "+x[2] : "")); })),
    e("div",{className:"flex flex-wrap items-center gap-1.5"}, e("span",{className:"mr-1 text-[12.5px] font-bold text-foreground/80"}, "Ver só:"), [["", "Todos os CNPJs", "#64748B"]].concat(blocos.map(function(b){ return [b.id, NOME_CNPJ[b.id] || b.nome, COR_BLOCO[b.id]||"#64748B"]; })).map(function(x){ var on = fil===x[0]; return e("button",{key:x[0]||"todos", type:"button", onClick:function(){ setFil(x[0]); }, className:"h-8 rounded-lg px-3 text-[12px] font-bold ring-1 transition "+(on ? "text-white" : "bg-muted/40 text-white/85 ring-white/15 hover:bg-white/10"), style:on ? {background:"linear-gradient(135deg,"+x[2]+"cc,"+x[2]+"55)", boxShadow:"inset 0 0 0 1px "+x[2]} : {boxShadow:"inset 3px 0 0 "+x[2]}}, x[1]); }), e("input",{type:"search", value:busca, placeholder:"Buscar CNPJ, banco ou conta", "aria-label":"Buscar CNPJ, banco ou conta", className:INPUT+" ml-auto h-8! w-64 text-[12.5px]!", onChange:function(ev){ setBusca(ev.target.value); }})),
    e("div",{className:"grid grid-cols-2 gap-2 lg:grid-cols-3"},
      e(Cartao,{l:"Total do dia", v:total, cor:total<0 ? "text-red-400" : "", fundo:"ouro", sub:"saldo sem as bloqueadas"}),
      e(Cartao,{l:"Disponível", v:total+limite, cor:"", fundo:"verde", sub:"saldo + limite de crédito"}),
      e("div",{className:"col-span-2 flex items-center justify-center rounded-xl bg-card px-3 py-2 text-center text-[12.5px] text-foreground/80 ring-1 ring-border lg:col-span-1"},
        "O que ela digita fica salvo na hora, pode sair e voltar depois. Fechar o CNPJ confirma o saldo dele; para corrigir é só tocar em Editar.")),
    e("div",{className:"flex flex-col gap-2"}, blocos.filter(function(b){ return (!fil || b.id===fil) && (casaB(b) || sc.contas.some(function(c){ return c.bloco===b.id && casaC(c); })); }).map(function(b){
      var cs = sc.contas.filter(function(c){ return c.bloco===b.id; }), cor = COR_BLOCO[b.id]||"#64748B", fechado = !!fm[b.id], ab = abertos[b.id]!==false || !!fil || !!busca;
      var sub = cs.reduce(function(t,c){ return t+(vals[c.id]||0); },0), lim = cs.reduce(function(t,c){ return t+(c.limite||0); },0), usado = cs.reduce(function(t,c){ return t+((vals[c.id]||0)<0 ? -(vals[c.id]||0) : 0); },0);
      var semChave = cs.filter(function(c){ return c.tipo!=="CAIXA" && !(cx.state.px && (cx.state.px.contas||[]).some(function(k){ return k.caixaId===c.id && k.chave; })); }).length;
      return e("div",{key:b.id, className:"overflow-hidden rounded-xl bg-card ring-1 "+(fechado ? "ring-emerald-500/50" : "ring-border")},
        e("div",{onClick:function(){ var o = Object.assign({}, abertos); o[b.id] = !(o[b.id]!==false); setAbertos(o); }, className:"flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 hover:brightness-110", style:{background:"linear-gradient(90deg,"+clara(cor)+"66,"+clara(cor)+"1f)"}},
          e("span",{className:"text-[14px] font-bold"}, (ab ? "▲ " : "▾ ")+(NOME_CNPJ[b.id] || b.nome)), e("span",{className:"text-[13px] font-bold "+MONO+" "+neg(sub)}, num(sub)),
          lim>0 && e("span",{className:"text-[11.5px] text-white/70"}, "limite "+BK(lim)+" · usado "+BK(usado)+" · folga "+BK(Math.max(0, lim-usado))),
          semChave>0 && e("span",{className:"text-[11.5px] font-semibold", style:{color:"#FBBF24"}}, semChave+" sem chave Pix"),
          e("span",{className:"ml-auto rounded-full px-2.5 py-0.5 text-[11.5px] font-bold "+(fechado ? "bg-emerald-500/30 text-emerald-100" : "bg-black/30")}, fechado ? "✓ Fechado" : "Em aberto"),
          fechado ? e(Btn,{onClick:function(ev){ ev.stopPropagation(); fechar([b.id], false); }}, "Editar") : e("button",{onClick:function(ev){ ev.stopPropagation(); fechar([b.id], true); }, className:"rounded-lg bg-primary px-3 py-1 text-[12.5px] font-bold text-primary-foreground hover:brightness-110"}, "Fechar CNPJ")),
        ab && cs.filter(function(c){ return casaB(b) || casaC(c); }).map(function(c){ return e("label",{key:c.id, className:"flex flex-wrap items-center justify-between gap-2 border-t border-border/40 px-3 py-1.5"},
          e("span",{className:"min-w-0 flex-1 truncate text-[13.5px]"}, c.nome, c.limite ? e("span",{className:"ml-2 text-[11px] text-muted-foreground"}, "limite "+BK(c.limite)) : null),
          pixDaCaixa(cx.state.px, c.id) ? e(CopiarChave,{texto:pixDaCaixa(cx.state.px, c.id).chave}) : null,
          c.tipo!=="CAIXA" && e(ChavePixCaixa,{caixa:[c.id, c.nome, c.bloco], edita:!fechado, className:"w-44"}),
          e("input",{"data-saldo":"1", disabled:fechado, inputMode:"numeric", value:(vals[c.id]<0?"-":"")+num(Math.abs(vals[c.id]||0)), "aria-label":"Saldo de "+c.nome,
            className:"h-9 w-40 rounded-md border border-input bg-input/30 px-2 text-center text-[15px] outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 "+MONO+" "+neg(vals[c.id]),
            onFocus:function(ev){ ev.target.select(); },
            onBlur:function(){ if((vals[c.id]||0)!==guardado(c.id)) cx.dispatch({type:"SALDO_CEL", data:data, conta:c.id, valor:vals[c.id]||0}); },
            onKeyDown:function(ev){ if(ev.key==="Enter"){ ev.preventDefault(); var all = [].slice.call(ev.target.closest("[data-lancar]").querySelectorAll("input[data-saldo]:not([disabled])")), i = all.indexOf(ev.target); if(all[i+1]) all[i+1].focus(); else ev.target.blur(); } },
            onChange:function(ev){ var raw = ev.target.value, n = (raw.match(/-/g)||[]).length%2===1, dg = raw.replace(/\D/g,"").slice(0,12), o = Object.assign({}, vals); o[c.id] = (n?-1:1)*Number(dg||0)/100; setVals(o); }})); }));
    })),
    e("div",{className:"rounded-xl bg-card p-3 ring-1 ring-border"},
      e("h3",{className:"mb-2 font-heading text-[14px] font-bold"}, "Aporte de sócio", e("span",{className:"ml-2 text-[12px] font-normal text-foreground/70"}, "dinheiro que o sócio manda para um CNPJ (não é faturamento)")),
      e("div",{className:"flex flex-wrap items-center gap-2"},
        e("select",{value:ap.bloco, className:INPUT+" h-9!", onChange:function(ev){ setAp(Object.assign({}, ap, {bloco:ev.target.value})); }}, blocos.map(function(b){ return e("option",{key:b.id, value:b.id}, b.nome); })),
        e(MoneyInput,{sm:true, value:ap.valor, label:"Valor do aporte", onChange:function(v){ setAp(Object.assign({}, ap, {valor:v})); }}),
        e("input",{value:ap.desc, placeholder:"Quem mandou / observação", className:INPUT+" h-9! min-w-48 flex-1", onChange:function(ev){ setAp(Object.assign({}, ap, {desc:ev.target.value})); }}),
        e(Btn,{onClick:function(){ if(!ap.valor) return; cx.dispatch({type:"SALDO_APORTE", data:data, aporte:{id:"ap"+Date.now(), bloco:ap.bloco, valor:ap.valor, desc:ap.desc.trim()}}); setAp({bloco:ap.bloco, valor:0, desc:""}); }}, "Lançar aporte")),
      ((sc.aportes||{})[data]||[]).map(function(x){ return e("div",{key:x.id, className:"mt-1.5 flex items-center gap-3 text-sm"}, e("span",{className:"flex-1 truncate"}, ((sc.blocos.filter(function(b){ return b.id===x.bloco; })[0]||{}).nome||x.bloco)+(x.desc ? " · "+x.desc : "")), e("b",{className:MONO+" text-emerald-300"}, "+ "+BK(x.valor)), e(Btn,{onClick:function(){ cx.dispatch({type:"SALDO_APORTE", data:data, remover:x.id}); }}, "Remover")); })),
    e("div",{className:"grid gap-3 lg:grid-cols-2"},
      e("div",{className:"rounded-xl bg-card p-3 ring-1 ring-border"},
        e("h3",{className:"mb-2 font-heading text-[14px] font-bold"}, "Recebido do dia", fil ? e("span",{className:"ml-2 text-[12px] font-normal text-foreground/70"}, "vale para todos os CNPJs (o recebido não é separado por CNPJ)") : null),
        e("div",{className:"flex flex-wrap items-center gap-3"},
          e("label",{className:"flex items-center gap-2 text-[13px]", title:"Relatório de notas fiscais (lista de acertos do dia)"}, "Notas fiscais (R$)", e(MoneyInput,{sm:true, value:fdia.nf||0, label:"Notas fiscais do dia", onChange:function(v){ cx.dispatch({type:"FAT_DIA", data:data, acertos:fdia.acertos||0, recebido:fdia.recebido||0, loja:fdia.loja||0, recup:fdia.recup||0, nf:v}); }})),
          e("label",{className:"flex items-center gap-2 text-[13px]"}, "Acertos", e(NumInput,{value:fdia.acertos||0, label:"Acertos do dia", onChange:function(v){ cx.dispatch({type:"FAT_DIA", data:data, nf:(fdia.nf||0), acertos:Math.round(v), recebido:fdia.recebido||0, loja:fdia.loja||0, recup:fdia.recup||0}); }})),
          e("label",{className:"flex items-center gap-2 text-[13px]"}, "Recebido (R$)", e(MoneyInput,{value:fdia.recebido||0, label:"Recebido do dia", onChange:function(v){ cx.dispatch({type:"FAT_DIA", data:data, nf:(fdia.nf||0), acertos:fdia.acertos||0, recebido:v, loja:fdia.loja||0, recup:fdia.recup||0}); }}))),
        e("div",{className:"mt-2 flex flex-wrap items-center gap-3"},
          e("label",{className:"flex items-center gap-2 text-[13px]", title:"Está nas notas, mas NÃO entrou na conta (inadimplência)"}, "Acerto com loja (não entrou)", e(MoneyInput,{sm:true, value:fdia.loja||0, label:"Acerto com loja", onChange:function(v){ cx.dispatch({type:"FAT_DIA", data:data, nf:(fdia.nf||0), acertos:fdia.acertos||0, recebido:fdia.recebido||0, loja:v, recup:fdia.recup||0}); }})),
          e("label",{className:"flex items-center gap-2 text-[13px]", title:"Inadimplência paga hoje: ENTROU na conta"}, "Inadimplência recuperada (entrou)", e(MoneyInput,{sm:true, value:fdia.recup||0, label:"Inadimplência recuperada", onChange:function(v){ cx.dispatch({type:"FAT_DIA", data:data, nf:(fdia.nf||0), acertos:fdia.acertos||0, recebido:fdia.recebido||0, loja:fdia.loja||0, recup:v}); }}))),
        e("p",{className:"mt-2 text-[12px] text-foreground/75"}, "Acumulado do mês até este dia: "+acumA+" acertos · "+BK(acumR)+(acumA ? " · média "+BK(acumR/acumA)+" por acerto" : ""))),
      e("div",{className:"rounded-xl bg-card p-3 ring-1 ring-border"},
        e("div",{className:"mb-2 flex items-center justify-between"}, e("h3",{className:"font-heading text-[14px] font-bold"}, "Pagamentos do dia"+(fil ? " · "+((NOME_CNPJ[fil])||fil) : "")), e("span",{className:"text-[13px] font-bold "+MONO}, BK(fil ? pagoDoDia(fil) : pagTotal))),
        e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-1.5"}, [["34","CNPJ 34"],["46","CNPJ 46"],["59","CNPJ 59"],["67","CNPJ 67"],["fora","Contas por fora"]].filter(function(c){ return !fil || c[0]===fil; }).map(function(c){
          return e("label",{key:c[0], className:"flex items-center justify-between gap-2 text-[13px]"}, c[1], e(MoneyInput,{sm:true, value:pagoDoDia(c[0]), label:"Pago "+c[1], onChange:function(v){ cx.dispatch(c[0]==="fora" ? {type:"CPD_SET", data:data, campo:"contasPorFora", valor:v} : {type:"CPD_SET", data:data, cnpj:c[0], valor:v}); }})); })))),
    null);
}

// ── "Como ler": como a conta fecha, o que se lança todo dia, quem lança e quando (recolhido por padrão) ──
function ComoLer(p){
  var fl = p.fl || {}, atraso = function(u){ if(!u) return null; var d = Math.round((new Date(p.ontem+"T12:00:00")-new Date(u+"T12:00:00"))/86400000); return d<=0 ? 0 : d; };
  var passo = function(n, t, d){ return e("div",{className:"flex gap-2"}, e("span",{className:"grid size-6 shrink-0 place-items-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground"}, n), e("div",{className:"text-[13px] leading-snug"}, e("b",{}, t), d ? " — "+d : "")); };
  return e("section",{className:"flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-white/10"},
    e("h2",{className:"font-heading text-[16px] font-bold"}, "Como ler o Caixa"),
    e("div",{className:"grid gap-3 lg:grid-cols-2"},
      e("div",{className:"flex flex-col gap-2"},
        e("p",{className:"text-[12px] font-bold uppercase tracking-wide text-primary"}, "A conta que precisa fechar"),
        passo("1","Saldo no início","dinheiro nas contas no 1º dia do período (último saldo do dia anterior)"),
        passo("2","+ Recebido nas contas","baixas do contas a receber, sem o acerto com loja (não entrou) e sem os repasses diretos (não passam pelas contas), mais os aportes de sócio"),
        passo("3","− Contas pagas","pagos por CNPJ e por fora, sem os repasses diretos a fornecedores"),
        passo("4","= Saldo esperado  ×  Saldo real","a diferença é a divergência: SOBRANDO (mais dinheiro que o esperado) ou FALTANDO"),
        e("p",{className:"mt-1 text-[12px] text-foreground/75"}, "Durante o mês a divergência não é definitiva: venda do Carregar já entrou no banco e ainda não foi baixada, e inadimplência de outros meses entra nas baixas. O mês só fecha de verdade no fim.")),
      e("div",{className:"flex flex-col gap-2"},
        e("p",{className:"text-[12px] font-bold uppercase tracking-wide text-primary"}, "O funil do período"+(p.dA ? " ("+dc(p.dA)+" → "+dc(p.dB)+")" : "")),
        [["Notas fiscais (faturado)", fl.nf, "o que foi vendido e faturado"],["Contas a receber (baixas)", fl.baixas, "o que foi liquidado, inclui inadimplência antiga e compra de funcionários"],["Recebido nas contas", fl.fat, "baixas − acerto com loja − repasses diretos + aportes"],["Entrou de verdade", fl.entrou, "variação do saldo + o que foi pago (nas contas)"]].map(function(x){
          return e("div",{key:x[0], className:"flex items-baseline justify-between gap-3 rounded-lg bg-black/25 px-3 py-1.5 text-[13px]"}, e("span",{}, e("b",{}, x[0]), e("span",{className:"ml-2 text-[11.5px] text-foreground/70"}, x[2])), e("b",{className:MONO}, x[1]===undefined||x[1]===null ? "—" : BK(x[1]))); }),
        e("p",{className:"text-[12px] text-foreground/75"}, "Cada degrau tem um motivo diferente de diferença. Compare um com o outro para achar onde está a divergência.")),
    ),
    e("div",{},
      e("p",{className:"mb-1 text-[12px] font-bold uppercase tracking-wide text-primary"}, "O que se lança todo dia, quem e quando (sempre às 10h do dia seguinte, sobre o dia anterior)"),
      e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full text-[12.5px]"},
        e("thead",{}, e("tr",{className:"text-left text-[11px] uppercase text-muted-foreground"}, ["Item","Quem lança","Onde","Último dia lançado","Situação"].map(function(h){ return e("th",{key:h, className:"px-2 py-1"}, h); }))),
        e("tbody",{}, p.fontes.map(function(f){ var a = atraso(f.ultima);
          return e("tr",{key:f.nome, className:"border-t border-border/50"}, e("td",{className:"px-2 py-1.5 font-semibold"}, f.nome), e("td",{className:"px-2 py-1.5"}, f.quem), e("td",{className:"px-2 py-1.5 text-foreground/80"}, f.onde),
            e("td",{className:"px-2 py-1.5 "+MONO}, f.ultima ? dp(f.ultima) : "—"),
            e("td",{className:"px-2 py-1.5"}, a===null ? e("span",{className:"text-red-300"}, "nunca lançado") : a===0 ? e("span",{className:"rounded-full bg-emerald-500/25 px-2 py-0.5 font-bold text-emerald-200"}, "✓ em dia") : e("span",{className:"rounded-full bg-amber-500/25 px-2 py-0.5 font-bold text-amber-200"}, "atrasado "+a+" dia(s)"))); })))),
      e("p",{className:"mt-1 text-[11.5px] text-foreground/70"}, "Quem lança cada item ainda será definido (por enquanto, os dados do Marcus). O horário combinado é provisório e será revisto.")),
    e("div",{},
      e("p",{className:"mb-1 text-[12px] font-bold uppercase tracking-wide text-primary"}, "Regras e ideias deste sistema"),
      e("ul",{className:"list-disc space-y-0.5 pl-5 text-[12.5px] leading-snug text-foreground/90"},
        e("li",{}, "O saldo de cada dia é o do FIM do dia. Conta sem lançamento no dia vale o último saldo. Fim de semana e feriado aparecem em violeta."),
        e("li",{}, "Acerto com loja está nas baixas, mas não entra na conta. Inadimplência paga de outros meses entra nas baixas (ainda não dá para separar)."),
        e("li",{}, "Repasses diretos (Point, Pontual, Office Graf, Linda Acessórios, Prestadores, PIX Representantes): a revendedora paga direto ao fornecedor. Entram no recebido e já contam como pago (estão em “contas por fora”), por isso saem das contas."),
        e("li",{}, "Aporte de sócio: dinheiro que o sócio manda para um CNPJ. Não é faturamento; entra como aporte no dia."),
        e("li",{}, "Não há transferência entre CNPJs. O Itaú Marco PJ é conta da empresa, num bloco próprio."),
        e("li",{}, "A divergência por CNPJ usa a natureza do relatório (ex.: PIX SICREDI ATACADISTA = CNPJ 34): é uma aproximação."),
        e("li",{}, "Em breve: puxar as formas de pagamento direto da Calculadora de acertos e o PIX para representantes do Consolidado.")))
  );
}

// ── Posição das contas (visão simples): saldo do início do mês × agora, por CNPJ e por conta, com saldo real, cheque especial e disponível ──
var verde = "#4ADE80", ambar = "#FBBF24", verm = "#F87171";
var corSaldo = function(v){ return v<0 ? verm : verde; };
var corUso = function(p){ return p>=85 ? verm : p>=50 ? ambar : verde; };
function PosicaoContas(p){
  var sc = p.sc, ab = useState({}), abertos = ab[0], setAbertos = ab[1];
  var ds = datasLancadas(sc), fimMesAnt = isoDia(new Date(p.ano, p.mes, 0)), fimMes = isoDia(new Date(p.ano, p.mes+1, 0));
  var dI = ds.filter(function(k){ return k<=fimMesAnt; }).pop() || null, dN = ds.filter(function(k){ return k<=(p.hoje<fimMes ? p.hoje : fimMes); }).pop() || null;
  if(!dN) return null;
  var pI = dI ? posicaoEm(sc, dI) : null, pN = posicaoEm(sc, dN);
  var contaDe = function(pos, id){ var r = null; if(pos) pos.blocos.forEach(function(b){ b.contas.forEach(function(x){ if(x.conta.id===id) r = x; }); }); return r; };
  var limTotal = 0, usado = 0;
  pN.blocos.forEach(function(b){ b.contas.forEach(function(x){ if(x.conta.bloqueada) return; var l = x.conta.limite||0; limTotal += l; if(x.saldo<0) usado += Math.min(l, -x.saldo); }); });
  var iniReal = pI ? pI.real : null, varReal = iniReal===null ? null : pN.real-iniReal;
  var card = function(tit, v, sub, cor, extra){ return e("div",{className:"flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-3 text-center", style:{background:"rgba(255,255,255,.05)", boxShadow:"inset 0 0 0 1px rgba(255,255,255,.12)"}}, e("span",{className:"text-[12.5px] font-bold uppercase tracking-wide text-white"}, tit), e("b",{className:MONO+" text-[28px] leading-tight", style:{color:v<0 ? verm : "#fff"}}, BK(v)), e("span",{className:"text-[13px] font-semibold text-white"}, sub), extra || null); };
  var cab = e("div",{className:"grid grid-cols-[minmax(0,1fr)_repeat(5,minmax(5.5rem,7.5rem))] items-center gap-2 px-3 py-1.5 text-center text-[12px] font-bold uppercase tracking-wide text-[#F3D98B]"}, e("span",null, "Conta"), ["Início do mês", "Agora", "Variação", "Cheque especial", "Disponível"].map(function(h){ return e("span",{key:h, className:"text-center"}, h); }));
  var blocos = pN.blocos.filter(function(b){ return b.contas.length; }).sort(function(x, y){ return (x.id==="BLOQ" ? 1 : 0)-(y.id==="BLOQ" ? 1 : 0); });   // o bloqueado / retido vai sempre na última linha
  var todasContas = []; pN.blocos.forEach(function(b){ b.contas.forEach(function(x){ todasContas.push(x); }); });
  var iniTudo = pI ? pI.blocos.reduce(function(t, b){ return t+b.real; }, 0) : null, agoraTudo = pN.blocos.reduce(function(t, b){ return t+b.real; }, 0), limTudo = todasContas.reduce(function(t, x){ return t+(x.conta.bloqueada ? 0 : (x.conta.limite||0)); }, 0), dispTudo = pN.blocos.reduce(function(t, b){ return t+b.disp; }, 0);
  var colunas = "grid grid-cols-[minmax(0,1fr)_repeat(5,minmax(5.5rem,7.5rem))] items-center gap-2 px-3";
  var totalLinha = e("div",{className:colunas+" py-2.5", style:{background:"linear-gradient(90deg,rgba(255,255,255,.14),rgba(255,255,255,.05))", boxShadow:"inset 0 0 0 1px #E8B84Bcc"}},
    e("span",{className:"text-left text-[15px] font-bold uppercase tracking-wide text-white"}, "Total de tudo"),
    e("span",{className:MONO+" text-center text-[15px] font-bold text-white"}, iniTudo===null ? "—" : num(iniTudo)),
    e("span",{className:MONO+" text-center text-[16px] font-bold", style:{color:corSaldo(agoraTudo)}}, num(agoraTudo)),
    e("span",{className:MONO+" text-center text-[15px] font-bold", style:{color:iniTudo===null ? "#fff" : (agoraTudo-iniTudo)>=0 ? verde : verm}}, iniTudo===null ? "—" : ((agoraTudo-iniTudo)>=0 ? "+" : "−")+num(Math.abs(agoraTudo-iniTudo))),
    e("span",{className:MONO+" text-center text-[15px] font-bold", style:{color:"#93C5FD"}}, num(limTudo)),
    e("span",{className:MONO+" text-center text-[16px] font-bold", style:{color:dispTudo<0 ? verm : verde}}, num(dispTudo)));
  return e("section",{className:"overflow-hidden rounded-xl bg-card ring-1 ring-white/10"},
    e("div",{className:"flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 bg-white/[0.06] px-3 py-2 text-center"}, e("h2",{className:"font-heading text-[17px] font-bold"}, "Posição das contas"), e("span",{className:"text-[13.5px] font-semibold text-white"}, "início do mês ("+(dI ? dc(dI) : "sem lançamento")+") × agora ("+dc(dN)+")")),
    e("div",{className:"grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4"},
      card("Saldo real das contas", pN.real, iniReal===null ? "sem saldo do início do mês" : "início "+BK(iniReal)+" · "+(varReal>=0 ? "+" : "−")+" "+BK(Math.abs(varReal)), corSaldo(pN.real)),
      card("Cheque especial", limTotal, "usado "+BK(usado)+" · folga "+BK(Math.max(0, limTotal-usado)), "#60A5FA", e("div",{className:"mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10"}, e("div",{className:"h-full rounded-full", style:{width:Math.min(100, limTotal ? usado/limTotal*100 : 0)+"%", background:corUso(limTotal ? usado/limTotal*100 : 0)}}))),
      card("Disponível para pagar", pN.disp, "saldo real + cheque especial", verde),
      card("Bloqueado / a receber", pN.bloq, "retido fora do saldo", ambar)),
    e("div",{className:"flex flex-col gap-2 px-3 pb-3"}, cab, blocos.map(function(b){
      var cor = COR_BLOCO[b.id]||"#64748B", ab1 = abertos[b.id]!==false, contas = b.id==="BLOQ" ? b.contas : b.contas.filter(function(x){ return !x.conta.bloqueada; });
      var bI = pI ? pI.blocos.find(function(x){ return x.id===b.id; }) : null, lim = contas.reduce(function(t, x){ return t+(x.conta.limite||0); }, 0), us = contas.reduce(function(t, x){ return t+(x.saldo<0 ? Math.min(x.conta.limite||0, -x.saldo) : 0); }, 0), pct = lim ? us/lim*100 : 0;
      var linha = function(rot, ini, ag, limite, disp, o){ o = o || {}; var dv = ini===null ? null : ag-ini;
        return e("div",{key:o.key, className:"grid grid-cols-[minmax(0,1fr)_repeat(5,minmax(5.5rem,7.5rem))] items-center gap-2 px-3 "+(o.cls||"py-1")},
          e("span",{className:"min-w-0 truncate text-left "+(o.forte ? "text-[15px] font-bold" : "pl-5 text-[13.5px] font-semibold")}, rot),
          e("span",{className:MONO+" text-center text-[14px] text-white"}, ini===null ? "—" : num(ini)),
          e("span",{className:MONO+" text-center text-[15px] font-bold", style:{color:corSaldo(ag)}}, num(ag)),
          e("span",{className:MONO+" text-center text-[14px] font-semibold", style:{color:dv===null ? "#fff" : dv>=0 ? verde : verm}}, dv===null ? "—" : (dv>=0 ? "+" : "−")+num(Math.abs(dv))),
          e("span",{className:MONO+" text-center text-[14px]", style:{color:"#93C5FD"}}, limite>0 ? num(limite) : "—"),
          e("span",{className:MONO+" text-center text-[15px] font-bold", style:{color:disp<0 ? verm : verde}}, num(disp))); };
      return e("div",{key:b.id, className:"overflow-hidden rounded-lg", style:{boxShadow:"inset 0 0 0 1px "+cor+"88"}},
        e("div",{onClick:function(){ var o = Object.assign({}, abertos); o[b.id] = !(o[b.id]!==false); setAbertos(o); }, className:"cursor-pointer hover:brightness-110", style:{background:"linear-gradient(90deg,"+cor+"88,"+cor+"22)"}},
          linha((ab1 ? "▲ " : "▾ ")+(NOME_CNPJ[b.id] || (b.id==="BLOQ" ? "Bloqueado / retido (a receber)" : b.nome)), bI ? bI.real : null, b.real, lim, b.id==="BLOQ" ? 0 : b.real+lim, {forte:true, cls:"py-1.5", key:"h"})),
        ab1 && e("div",{className:"bg-black/30"}, contas.map(function(x, i){ var xi = contaDe(pI, x.conta.id); return e("div",{key:x.conta.id, className:"py-0.5 "+(i%2 ? "bg-black/20" : "")}, linha(x.conta.nome, xi ? xi.saldo : null, x.saldo, x.conta.limite||0, x.disp, {key:x.conta.id})); })));
    }), totalLinha));
}

function AbaCaixa(){
  var cx = use(), s = cx.state, sc = s.saldosContas, hojeD = new Date(), hoje = isoDia(hojeD);
  var tl = useState("visao"), tela = tl[0], setTela = tl[1];
  var st = useState({a:hojeD.getFullYear(), m:hojeD.getMonth()}), per = st[0], setPer = st[1], ano = per.a, mes = per.m;
  var fs = useState("todos"), filtro = fs[0], setFiltro = fs[1];
  var cf = useState(false), cfg = cf[0], setCfg = cf[1];
  var ab = useState({}), blocosAbertos = ab[0], setBlocosAbertos = ab[1];
  var ex = useState([]), extras = ex[0], setExtras = ex[1];
  var fxs = useState({de:"", ate:""}), fx = fxs[0], setFx = fxs[1];
  var oc = useState({}), ocultos = oc[0], setOcultos = oc[1];
  var scrollRef = React.useRef(null), arr = React.useRef({x:0, sl:0, down:false, moved:false});
  var ds = datasLancadas(sc), pref = chaveMes(ano, mes), ehAtual = ano===hojeD.getFullYear() && mes===hojeD.getMonth();
  var baseData = isoDia(new Date(ano, mes, 0)), baseLanc = ds.some(function(k){ return k<=baseData; });
  // colunas = só os dias lançados do mês (+ a base, + hoje no mês atual, + dias escolhidos); cada uma é o saldo do FIM do dia
  var colSet = {};
  if(fx.de || fx.ate){   // período livre: qualquer data de quando existem relatórios diários até hoje
    var deX = fx.de || ds[0] || hoje, ateX = fx.ate || hoje; ds.filter(function(k){ return k>=deX && k<=ateX; }).forEach(function(k){ colSet[k] = 1; }); if(hoje>=deX && hoje<=ateX) colSet[hoje] = 1;
  } else {
    ds.filter(function(k){ return k.slice(0,7)===pref; }).forEach(function(k){ colSet[k] = 1; });
    if(baseLanc) colSet[baseData] = 1; if(ehAtual) colSet[hoje] = 1; extras.filter(function(k){ return k.slice(0,7)===pref; }).forEach(function(k){ colSet[k] = 1; });
  }
  var cols = Object.keys(colSet).sort();
  var vcols = cols.filter(function(k){ return !ocultos[k]; });                       // dias em aberto
  var dA = vcols[0], dB = vcols[vcols.length-1];                                   // variação: do PRIMEIRO ao ÚLTIMO dia em aberto
  var rec = recebidoDoMes(s, ano, mes), pago = contasDoMes(s, String(ano), mes).pago, pr = provaDoMes(sc, ano, mes, rec, pago, hoje);
  var dif = null, ok = false;
  var mover = function(n){ var d2 = new Date(ano, mes+n, 1); setPer({a:d2.getFullYear(), m:d2.getMonth()}); setExtras([]); setOcultos({}); setFx({de:"", ate:""}); };
  var zero = {real:0, disp:0, bloq:0};
  var posA = dA ? posicaoEm(sc, dA) : zero, posB = dB ? posicaoEm(sc, dB) : zero;
  var doBloco = function(pos){ if(filtro==="todos" || !pos.blocos) return pos; var b = pos.blocos.filter(function(x){ return x.id===filtro; })[0]; if(!b) return pos;
    return {real:b.id==="BLOQ" ? 0 : b.real, disp:b.id==="BLOQ" ? 0 : b.disp, bloq:b.id==="BLOQ" ? b.real : 0}; };
  posA = doBloco(posA); posB = doBloco(posB);
  var limA = posA.disp-posA.real, limB = posB.disp-posB.real;
  var nomeFiltro = filtro==="todos" ? "" : ((sc.blocos.filter(function(b){ return b.id===filtro; })[0]||{}).nome||"");
  var pagoCnpj = 0; Object.keys(s.contasPagasDiario||{}).filter(function(k){ return k.slice(0,7)===pref; }).forEach(function(k){ pagoCnpj += (((s.contasPagasDiario[k]||{}).cnpjs||{})[filtro])||0; });
  var varBloco = posB.real-posA.real;
  var esperadoSaldo = pr.ini ? pr.ini.real+pr.resultado : null;
  var somaPagos = Object.keys(s.contasPagasDiario||{}).filter(function(k){ return k.slice(0,7)===pref; }).reduce(function(t2,k){ var d = s.contasPagasDiario[k]||{}; return t2+Object.keys(d.cnpjs||{}).reduce(function(x,id){ return x+(d.cnpjs[id]||0); },0)+(d.contasPorFora||0); },0);
  var totalDia = function(data){ return sc.contas.filter(function(c){ return !c.bloqueada; }).reduce(function(t,c){ return t+(efetivo(sc, ds, c.id, data)||0); },0); };
  var limiteTotal = sc.contas.filter(function(c){ return !c.bloqueada; }).reduce(function(t,c){ return t+(c.limite||0); },0);
  var blocos = sc.blocos.filter(function(b){ return sc.contas.some(function(c){ return c.bloco===b.id; }); });
  var vis = blocos.filter(function(b){ return filtro==="todos" || filtro===b.id; });
  var fechs = sc.fechamentos || {};
  var salvar = function(data, conta){ return function(v){ cx.dispatch({type:"SALDO_CEL", data:data, conta:conta, valor:v}); }; };
  var abrirTodos = function(v){ var o = {}; blocos.forEach(function(b){ o[b.id] = v; }); setBlocosAbertos(o); };
  var seta = function(v){ return e("span",{className:"mr-1 inline-block w-3"}, v ? "▾" : "▸"); };
  var fecharDia = function(k){ if(vcols.length<=1) return; var o = Object.assign({}, ocultos); o[k] = 1; setOcultos(o); };
  var apenasUltimos = function(){ var o = {}; cols.forEach(function(k,i){ if(i<cols.length-2) o[k] = 1; }); setOcultos(o); };
  var dd = useState(false), diasAberto = dd[0], setDiasAberto = dd[1];
  var dd2 = useState(false), diaADia = dd2[0], setDiaADia = dd2[1];   // a planilha com todos os dias fica fechada: o padrão é a posição simples (início do mês × agora)
  var feriadosVis = vcols.filter(function(k){ return FERIADOS[k]; });
  // arrastar a planilha para o lado: clica no meio, segura e arrasta
  var aoPressionar = function(ev){ if(ev.button!==0 || ev.target.tagName==="INPUT" || !scrollRef.current) return; arr.current = {x:ev.clientX, sl:scrollRef.current.scrollLeft, down:true, moved:false}; };
  var aoMover = function(ev){ var a = arr.current; if(!a.down || !scrollRef.current) return; var dx = ev.clientX-a.x; if(Math.abs(dx)>5 && !a.moved){ a.moved = true; scrollRef.current.style.userSelect = "none"; } if(a.moved) scrollRef.current.scrollLeft = a.sl-dx; };
  var aoSoltar = function(){ arr.current.down = false; if(scrollRef.current) scrollRef.current.style.userSelect = ""; };
  var aoClicar = function(ev){ if(arr.current.moved){ ev.preventDefault(); ev.stopPropagation(); arr.current.moved = false; } };
  var CELA = "px-2 py-1.5 text-center text-[14px] "+MONO+" "+GRADE;
  var VARC = STICKY_VAR+CELA+" whitespace-nowrap min-w-[10.5rem]";
  var pagoDia = function(k, id){ var d = (s.contasPagasDiario||{})[k]; if(!d) return 0; return id==="fora" ? (d.contasPorFora||0) : ((d.cnpjs||{})[id]||0); };
  var pagLinhas = [{id:"34",nome:"CNPJ 34"},{id:"46",nome:"CNPJ 46"},{id:"59",nome:"CNPJ 59"},{id:"67",nome:"CNPJ 67"},{id:"fora",nome:"Contas por fora"}].filter(function(l){ return filtro==="todos" || filtro===l.id; });
  var recDia = function(k, grupo){ var d = (RECEBER_LOCAL||{})[k]; if(!d) return 0; return Object.keys(d).reduce(function(x,n){ return x+((RECEBER_MAPA_LOCAL[n]||["DEF"])[0]===grupo ? d[n] : 0); },0); };
  var recGrupos = [{id:"34",nome:"CNPJ 34"},{id:"46",nome:"CNPJ 46"},{id:"59",nome:"CNPJ 59"},{id:"67",nome:"CNPJ 67"},{id:"HO",nome:"H&O"},{id:"PART",nome:"Particular (pessoa física)"},{id:"DIN",nome:"Dinheiro"},{id:"ITM",nome:"Itaú Marco PJ"},{id:"FORN",nome:"Fornecedores e repasses diretos (não passam pelas contas)"},{id:"DEF",nome:"A definir (sem CNPJ)"}].filter(function(g){ return filtro==="todos" || filtro===g.id; });
  var recTotalDia = function(k){ return ["34","46","59","67","HO","PART","DIN","ITM","FORN","DEF"].reduce(function(x,g){ return x+recDia(k, g); },0); };
  var aporteDia = function(k, b){ return (((sc.aportes||{})[k])||[]).reduce(function(x,a){ return x+((!b || a.bloco===b) ? a.valor : 0); },0); };   // aporte de sócio: dinheiro que o sócio manda para o CNPJ
  var rc = useState({}), recAb = rc[0], setRecAb = rc[1];
  var lr = useState(false), ler = lr[0], setLer = lr[1];
  var pagoTotalDia = function(k){ return ["34","46","59","67","fora"].reduce(function(t2,id){ return t2+pagoDia(k, id); },0); };
  // ── fluxo do período escolhido: tudo acompanha as datas de/até ──
  var diasDe = function(a, b){ var out = [], d = new Date(a+"T12:00:00"), f = new Date(b+"T12:00:00"); d.setDate(d.getDate()+1); while(d<=f){ out.push(isoDia(d)); d.setDate(d.getDate()+1); } return out; };
  var temDiario = function(mm){ return Object.keys(s.contasPagasDiario||{}).filter(function(k){ return k.slice(0,7)===mm && pagoTotalDia(k)>0; }).length>=5; };   // mês com pagamentos lançados dia a dia
  var pagoPeriodo = function(a, b){ var porMes = {}; diasDe(a, b).forEach(function(k){ var mm = k.slice(0,7); (porMes[mm] = porMes[mm] || []).push(k); });
    return Object.keys(porMes).reduce(function(tot, mm){ var dias = porMes[mm], an = Number(mm.slice(0,4)), mi = Number(mm.slice(5,7))-1;
      if(temDiario(mm)) return tot+dias.reduce(function(x,k){ return x+pagoTotalDia(k); },0);
      return tot+contasDoMes(s, String(an), mi).pago*dias.length/new Date(an, mi+1, 0).getDate(); }, 0); };   // sem diário: valor do mês na proporção dos dias
  var fdAll = fatEfetivo(s);
  var acumCampo = function(campo, d){ var pts = {}; Object.keys(fdAll).sort().forEach(function(k){ (pts[k.slice(0,7)] = pts[k.slice(0,7)] || []).push([k, fdAll[k][campo]||0]); }); var mm = d.slice(0,7), tot = 0, v = 0; Object.keys(pts).sort().forEach(function(x){ if(x<mm){ var q = pts[x]; tot += q[q.length-1][1]; } }); (pts[mm]||[]).forEach(function(q){ if(q[0]<=d) v = q[1]; }); return tot+v; };   // acumulado até a data (guardado como acumulado do mês)
  var fatAte = function(d){ return acumCampo("recebido", d)-acumCampo("loja", d)+acumCampo("recup", d); };   // o que de fato entrou nas contas   // faturamento acumulado até a data (só existe o acumulado do mês)
  var fl = {ini:null, fim:null, fat:0, pago:0, esperado:null, dif:null};
  if(dA && dB && dA<dB){ fl.ini = totalDia(dA); fl.fim = totalDia(dB); fl.fat = fatAte(dB)-fatAte(dA); fl.baixas = acumCampo("recebido", dB)-acumCampo("recebido", dA); fl.loja = acumCampo("loja", dB)-acumCampo("loja", dA); fl.recup = acumCampo("recup", dB)-acumCampo("recup", dA); fl.pago = pagoPeriodo(dA, dB); fl.pagoBruto = fl.pago;
    fl.dir = diasDe(dA, dB).reduce(function(x,k){ return x+recDia(k,"FORN"); },0);   // vai direto ao fornecedor/representante: nunca passa pelas contas (entra no recebido e já conta como pago)
    fl.aporte = diasDe(dA, dB).reduce(function(x,k){ return x+aporteDia(k); },0); fl.nf = acumCampo("nf", dB)-acumCampo("nf", dA);
    fl.fat = fl.fat-fl.dir+fl.aporte; fl.pago = Math.max(0, fl.pago-fl.dir); fl.esperado = fl.ini+fl.fat-fl.pago; fl.dif = fl.fim-fl.esperado; fl.entrou = fl.fim-fl.ini+fl.pago; }
  dif = fl.dif; ok = dif!==null && Math.abs(dif)<1000;
  var ultimaDe = function(obj, fn){ var ks = Object.keys(obj||{}).filter(fn).sort(); return ks.length ? ks[ks.length-1] : null; };
  var ontemIso = isoDia(new Date(hojeD.getFullYear(), hojeD.getMonth(), hojeD.getDate()-1));
  var fontes = [
    {nome:"Saldos das contas bancárias", quem:"Marcus (por enquanto)", onde:"Caixa › Lançar saldos", ultima:ds.length ? ds[ds.length-1] : null},
    {nome:"Pagamentos do dia (por CNPJ e por fora)", quem:"Nayale", onde:"Caixa › Lançar saldos (ou Contas a pagar › Diário)", ultima:ultimaDe(s.contasPagasDiario, function(k){ return pagoTotalDia(k)>0; })},
    {nome:"Notas fiscais (faturado)", quem:"Marcus (por enquanto)", onde:"Caixa › Lançar saldos › Recebido do dia", ultima:ultimaDe(s.fatDia, function(k){ return (s.fatDia[k].nf||0)>0; })},
    {nome:"Contas a receber (baixas)", quem:"Marcus (por enquanto)", onde:"Caixa › Lançar saldos › Recebido do dia", ultima:ultimaDe(s.fatDia, function(k){ return (s.fatDia[k].recebido||0)>0; })}];
  var somaId = function(id){ return diasDe(dA||hoje, dB||hoje).reduce(function(x,k){ return x+pagoDia(k, id); },0); };
  var pagoCnpjP = filtro==="todos" ? 0 : somaId(filtro);
  var somaRec = function(g){ return diasDe(dA||hoje, dB||hoje).reduce(function(x,k){ return x+recDia(k, g); },0); };
  var aporteCnpj = filtro==="todos" ? 0 : diasDe(dA||hoje, dB||hoje).reduce(function(x,k){ return x+aporteDia(k, filtro); },0), recCnpjP = filtro==="todos" ? 0 : somaRec(filtro), espCnpj = posA.real+recCnpjP+aporteCnpj-pagoCnpjP, difCnpj = posB.real-espCnpj, okCnpj = Math.abs(difCnpj)<1000;
  var colTh = function(k){
    var f = fechs[k], nf = f ? blocos.filter(function(b){ return f[b.id]; }).length : 0, parcial = f && nf<blocos.length;
    return e("th",{key:k, className:"min-w-28 px-1.5 py-1 text-center align-middle "+GRADE+" "+(fimSem(k) ? "bg-violet-500/35" : "")+(k===hoje ? " text-primary" : "")},
      e("div",{className:"flex items-center justify-center gap-1.5 whitespace-nowrap"},
        e("span",{className:"text-[10.5px] font-semibold uppercase tracking-wide opacity-80 "+(fimSem(k) ? "text-violet-200" : "")}, SEM[diaSem(k)].slice(0, 3)),
        e("span",{className:"text-[12.5px] font-bold"}, dc(k)+(k===hoje ? " · hoje" : "")),
        vcols.length>1 && e("button",{onClick:function(){ fecharDia(k); }, title:"Fechar este dia (sai da planilha e da variação)", className:"grid size-5 place-items-center rounded bg-black/35 text-[11px] font-bold hover:bg-red-500/50"}, "✕")),
      FERIADOS[k] && e("div",{className:"text-[10.5px] font-semibold text-violet-200"}, "Feriado"),
      parcial && e("div",{className:"text-[10.5px] font-semibold text-amber-300"}, nf+"/"+blocos.length+" CNPJs fechados"));
  };
  var linhaTotal = function(rot, valor, cls, fundo){ return e("tr",{className:"font-bold "+(fundo||"")},
    e("td",{className:CAB+" "+GRADE+" "+(fundo||"bg-card")}, rot),
    vcols.map(function(k){ var v = valor(k); return e("td",{key:k, className:CELA+" "+(cls||neg(v))}, num(v)); }),
    e("td",{className:VARC}, dA ? sinal(valor(dB)-valor(dA)) : "—")); };
  var abaBtn = function(id, nome){ return e("button",{key:id, onClick:function(){ setTela(id); }, className:"rounded-lg px-4 py-2 text-sm font-bold ring-1 "+(tela===id ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-border hover:bg-muted/40")}, nome); };
  var cabecalho = e("div",{className:"flex flex-wrap items-center gap-2"},
    e("h1",{className:"mr-2 font-heading text-2xl font-semibold tracking-wide"}, "Caixa"),
    abaBtn("visao","📊 Visão geral"), abaBtn("lancar","✏️ Lançar saldos"),
    tela==="visao" && e("div",{className:"ml-2 flex items-center gap-1 rounded-lg bg-card px-1 ring-1 ring-border"}, e(Btn,{onClick:function(){ mover(-1); }}, "‹"),
      e("span",{className:"w-36 text-center text-sm font-semibold"}, MESES_LONGO[mes]+" de "+ano), e(Btn,{onClick:function(){ mover(1); }}, "›")),
    tela==="visao" && e("div",{className:"flex flex-wrap gap-1"}, [["todos","Todos"]].concat(blocos.map(function(b){ return [b.id, b.nome.split(" · ")[1] ? b.nome.split(" · ")[1] : b.nome.split(" ")[0]]; })).map(function(x){
      return e("button",{key:x[0], onClick:function(){ setFiltro(x[0]); }, className:"rounded-full px-3 py-1 text-xs font-semibold ring-1 "+(filtro===x[0] ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-border hover:bg-muted/40")}, x[1]); })),
    e("div",{className:"ml-auto flex gap-2"}, tela==="visao" && e(Btn,{onClick:function(){ setLer(!ler); }}, ler ? "❔ Esconder" : "❔ Como ler"), e(Btn,{onClick:function(){ setCfg(!cfg); }}, "⚙ Contas")));
  if(tela==="lancar") return e("div",{className:"flex flex-col gap-3"}, cabecalho, cfg && e("div",{className:"rounded-xl bg-card p-3 ring-1 ring-border"}, e(ConfigContas,{})), e(LancarTela,{}));
  return e("div",{className:"flex flex-col gap-3"},
    cabecalho,
    ler && e(ComoLer,{fontes:fontes, ontem:ontemIso, fl:fl, dA:dA, dB:dB}),
    cfg && e("div",{className:"rounded-xl bg-card p-3 ring-1 ring-border"}, e(ConfigContas,{})),
    // resumo: compara o primeiro e o último dia em aberto
    e("section",{className:"overflow-hidden rounded-xl bg-card ring-1 ring-white/10"},
      e("div",{className:"flex flex-wrap items-center gap-2 bg-white/[0.06] px-3 py-2"},
        e("h2",{className:"mr-1 font-heading text-[15px] font-bold"}, "Resumo das contas"),
        e("span",{className:"text-sm"}, dA && dA!==dB ? "primeiro e último dia em aberto: "+dp(dA)+" → "+dp(dB) : "só um dia em aberto"),
        e("span",{className:"ml-auto flex flex-wrap items-center gap-1.5 text-xs"}, "Período: de",
          e("input",{type:"date", min:ds[0], max:hoje, value:dA||"", "aria-label":"Data inicial", className:INPUT+" h-8! w-36 text-sm!", onChange:function(ev){ if(ev.target.value) setFx({de:ev.target.value, ate:fx.ate || dB || hoje}); }}), "até",
          e("input",{type:"date", min:ds[0], max:hoje, value:dB||"", "aria-label":"Data final", className:INPUT+" h-8! w-36 text-sm!", onChange:function(ev){ if(ev.target.value) setFx({de:fx.de || dA || ds[0], ate:ev.target.value}); }}),
          (fx.de || fx.ate) && e(Btn,{onClick:function(){ setFx({de:"", ate:""}); }}, "Voltar ao mês"))),
      e("div",{className:"grid grid-cols-2 gap-2 p-3 lg:grid-cols-4"},
        e(Cartao,{l:"Saldo das contas bancárias", v:posB.real, cor:posB.real<0 ? "text-red-400" : "", delta:posB.real-posA.real, fundo:"ouro", sub:filtro==="todos" ? "soma de todas as contas bancárias" : "contas de "+nomeFiltro}),
        e(Cartao,{l:"Disponível", v:posB.disp, cor:"", delta:posB.disp-posA.disp, fundo:"verde", sub:"saldo das contas + cheque especial"}),
        e(Cartao,{l:"Cheque especial total", v:limB, delta:limB-limA, fundo:"azul", sub:"limite liberado pelos bancos"}),
        e(Cartao,{l:"Bloqueado / a receber", v:posB.bloq, delta:posB.bloq-posA.bloq, fundo:"ouro", sub:"retido fora do saldo"})),
      filtro!=="todos" ? e("div",{className:"flex flex-col gap-2 px-3 pb-3"},
        e("div",{className:"flex flex-wrap items-stretch justify-center gap-1.5 xl:flex-nowrap"},
          e(Caixinha,{l:"Saldo no início", sub:dA ? "contas de "+nomeFiltro+" em "+dc(dA) : "—", v:posA.real}), e(Op,{t:"+"}),
          e(Caixinha,{l:"Recebido", sub:["de "+(dA?dc(dA):"—")+" a "+(dB?dc(dB):"—"),"contas a receber"+(aporteCnpj ? " + aporte "+BK(aporteCnpj) : "")], v:recCnpjP+aporteCnpj, cor:""}), e(Op,{t:"−"}),
          e(Caixinha,{l:"Pago", sub:"Contas a pagar deste CNPJ", v:pagoCnpjP, cor:"text-red-400"}), e(Op,{t:"="}),
          e(Caixinha,{l:"Saldo esperado", sub:"início + recebido − pago", v:espCnpj, forte:true}), e(Op,{t:"vs"}),
          e(Caixinha,{l:"Saldo real", sub:dB ? "contas em "+dc(dB) : "—", v:posB.real, forte:true}), e(Op,{t:"→"}),
          e(Cartao,{cls:"flex-[1.4] xl:min-w-[12rem]", l:"Divergência", v:Math.abs(difCnpj), cor:(okCnpj || difCnpj>0) ? "text-emerald-400" : "text-red-400", fundo:(okCnpj || difCnpj>0) ? "verde" : "verm",
            tag:okCnpj ? {t:"BATEU", bom:true} : difCnpj>0 ? {t:"SOBRANDO", bom:true} : {t:"FALTANDO", bom:false},
            sub:okCnpj ? "saldo real igual ao esperado" : difCnpj>0 ? ["Tem "+BK(Math.abs(difCnpj))+" A MAIS","nas contas deste CNPJ"] : ["Faltam "+BK(Math.abs(difCnpj)),"nas contas deste CNPJ"]})),
        e("p",{className:"text-center text-[12px] text-foreground/75"}, "O recebido de cada CNPJ vem da natureza do relatório (ex.: PIX SICREDI ATACADISTA = CNPJ 34) e é uma aproximação; transferências entre CNPJs e naturezas ainda sem CNPJ distorcem a divergência."))  :
      e("div",{className:"flex flex-col gap-2 px-3 pb-3"},
        e("div",{className:"flex flex-wrap items-stretch justify-center gap-1.5 xl:flex-nowrap"},
          e(Caixinha,{l:"Saldo no início", sub:dA ? "dinheiro nas contas em "+dc(dA) : "—", v:fl.ini}), e(Op,{t:"+"}),
          e(Caixinha,{l:"Recebido nas contas", sub:dA ? ["de "+dc(dA)+" a "+dc(dB),"baixas "+BK(fl.baixas||0)+" − loja "+BK(fl.loja||0)+" − diretos "+BK(fl.dir||0)+(fl.aporte ? " + aporte "+BK(fl.aporte) : "")] : "—", v:dA<dB ? fl.fat : null, cor:""}), e(Op,{t:"−"}),
          e(Caixinha,{l:"Contas pagas", sub:dA ? ["pago de "+dc(dA)+" a "+dc(dB),"− diretos a fornecedores "+BK(fl.dir||0)] : "—", v:dA<dB ? fl.pago : null, cor:"text-red-400", ir:function(){ cx.dispatch({type:"ABA", aba:"contaspagar"}); }}), e(Op,{t:"="}),
          e(Caixinha,{l:"Saldo esperado", sub:"início + faturamento − pago", v:fl.esperado, forte:true}), e(Op,{t:"vs"}),
          e(Caixinha,{l:"Saldo real", sub:dB ? "o que está nas contas de verdade em "+dc(dB) : "—", v:fl.fim, forte:true}), e(Op,{t:"→"}),
          e(Cartao,{cls:"flex-[1.4] xl:min-w-[12rem]", l:"Divergência", v:dif===null ? 0 : Math.abs(dif), cor:dif===null ? "" : (ok || dif>0) ? "text-emerald-400" : "text-red-400", fundo:dif===null||ok||dif>0 ? "verde" : "verm",
            tag:dif===null ? null : ok ? {t:"BATEU", bom:true} : dif>0 ? {t:"SOBRANDO", bom:true} : {t:"FALTANDO", bom:false},
            sub:dif===null ? "falta saldo" : ok ? "o saldo real é igual ao esperado" : dif>0 ? ["Tem "+BK(Math.abs(dif))+" A MAIS nas contas","do que o fluxo previa (saldo real − esperado)"] : ["Faltam "+BK(Math.abs(dif))+" nas contas","saiu mais dinheiro do que o fluxo mostra"]})),
        e("p",{className:"text-center text-[12px] text-foreground/75"}, "Obs.: durante o mês as vendas já pagas e ainda não fechadas no Carregar não entram no faturamento; por isso a prova real só fica confiável no fechamento do mês."),
        somaPagos>0 && Math.abs(somaPagos-pago)>1 && e("p",{className:"rounded-lg bg-amber-500/15 px-3 py-2 text-center text-[12.5px] font-semibold text-amber-200"}, "Conferir o Pago do mês: Contas a pagar (Nayale) "+BK(pago)+" · soma dos pagamentos diários "+BK(somaPagos)+" · diferença "+BK(Math.abs(pago-somaPagos))+"."))),
    e(PosicaoContas,{sc:sc, ano:ano, mes:mes, hoje:hoje}),
    e("button",{type:"button", onClick:function(){ setDiaADia(!diaADia); }, className:"self-center rounded-lg bg-card px-4 py-2 text-[13px] font-bold ring-1 ring-white/10 hover:bg-primary/10"}, diaADia ? "▲ Esconder o saldo dia a dia" : "▾ Ver o saldo dia a dia (planilha)"),
    diaADia && e("div",{className:"flex flex-col gap-3"},
    // planilha em grade: contas nas linhas, dias lançados nas colunas; total logo abaixo do cabeçalho; CNPJs fechados mostram só o subtotal
    e("div",{className:"flex flex-wrap items-center justify-between gap-2"},
      e("h2",{className:"font-heading text-[15px] font-bold"}, "Saldo do fim de cada dia"),
      e("div",{className:"flex flex-wrap items-center gap-2"},
        e("div",{className:"relative"},
          e("button",{onClick:function(){ setDiasAberto(!diasAberto); }, className:"rounded-lg bg-card px-3 py-1.5 text-sm font-bold ring-1 ring-white/10 hover:bg-primary/10"}, "📅 Dias: "+vcols.length+" de "+cols.length+(diasAberto ? " ▴" : " ▾")),
          diasAberto && e("div",{className:"absolute right-0 top-full z-30 mt-1 w-72 rounded-xl bg-card p-3 shadow-2xl ring-1 ring-white/10"},
            e("div",{className:"mb-2 flex gap-2"}, e(Btn,{onClick:function(){ setOcultos({}); }}, "Todos"), e(Btn,{onClick:apenasUltimos}, "Só os 2 últimos"), e(Btn,{onClick:function(){ setDiasAberto(false); }}, "Fechar")),
            e("div",{className:"flex max-h-72 flex-col gap-0.5 overflow-y-auto"}, cols.map(function(k){ var marcado = !ocultos[k];
              return e("label",{key:k, className:"flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-primary/10 "+(fimSem(k) ? "text-violet-300" : "")},
                e("input",{type:"checkbox", checked:marcado, onChange:function(){ var o = Object.assign({}, ocultos); if(marcado){ if(vcols.length<=1) return; o[k] = 1; } else delete o[k]; setOcultos(o); }}),
                e("span",{className:"w-20 font-semibold"}, SEM[diaSem(k)].slice(0,3)), e("span",{className:MONO}, dp(k)), FERIADOS[k] && e("span",{className:"text-[11px]"}, "feriado")); })))),
        e(Btn,{onClick:function(){ abrirTodos(true); }}, "Abrir CNPJs"), e(Btn,{onClick:function(){ abrirTodos(false); }}, "Fechar CNPJs"))),
    e("div",{ref:scrollRef, onMouseDown:aoPressionar, onMouseMove:aoMover, onMouseUp:aoSoltar, onMouseLeave:aoSoltar, onClickCapture:aoClicar, title:"Clique no meio, segure e arraste para o lado",
        className:"cursor-grab overflow-x-auto rounded-xl bg-card ring-1 ring-white/10 active:cursor-grabbing"},
      e("table",{className:"w-full border-collapse text-[13px]"},
        e("thead",{}, e("tr",{className:"bg-white/[0.06] text-center"},
          e("th",{className:CAB+" "+GRADE+" bg-[#3a3118] text-[11px] font-bold uppercase tracking-wide"}, "Conta"),
          vcols.map(colTh),
          e("th",{className:"sticky right-0 z-10 min-w-[10.5rem] whitespace-nowrap bg-linear-to-l from-[#262a33] to-[#1b1e25] px-2 py-1 text-center text-[12px] shadow-[-12px_0_16px_-8px_rgba(0,0,0,0.75)] "+GRADE, title:"Do primeiro ao último dia em aberto"}, e("div",{className:"font-bold uppercase"}, "Variação"), e("div",{className:"text-[13px]"}, dA ? dc(dA)+" → "+dc(dB) : "")))),
        e("tbody",{},
          filtro==="todos" && linhaTotal("TOTAL · saldo (sem bloqueadas)", totalDia, "", "bg-[#4a3d1c]"),
          filtro==="todos" && linhaTotal("DISPONÍVEL · saldo + limite", function(k){ return totalDia(k)+limiteTotal; }, "text-emerald-400", "bg-[#123c2d]"),
          vis.map(function(b){
            var cs = sc.contas.filter(function(c){ return c.bloco===b.id; }), aberta = !!blocosAbertos[b.id] || filtro===b.id;
            var sub = function(data){ return cs.reduce(function(t,c){ return t+(efetivo(sc, ds, c.id, data)||0); },0); };
            var cor = COR_BLOCO[b.id]||"#64748B";
            return [e("tr",{key:"b"+b.id, style:{background:"linear-gradient(90deg,"+clara(cor)+"3d,"+clara(cor)+"14)"}, className:"cursor-pointer font-bold hover:brightness-125", onClick:function(){ var o = Object.assign({}, blocosAbertos); o[b.id] = !aberta; setBlocosAbertos(o); }},
                e("td",{className:CAB+" "+GRADE+" border-l-4 bg-card", style:{borderLeftColor:cor}}, seta(aberta), b.nome+" · "+cs.length+(b.id==="BLOQ" ? " · fora do total" : "")),
                vcols.map(function(k){ var v = sub(k); return e("td",{key:k, className:CELA+" "+neg(v)}, num(v)); }),
                e("td",{className:VARC+" "+neg(dA ? sub(dB)-sub(dA) : 0)}, dA ? sinal(sub(dB)-sub(dA)) : "—")),
              aberta && cs.map(function(c){
                var vb = dA ? efetivo(sc, ds, c.id, dA) : null, vu = dB ? efetivo(sc, ds, c.id, dB) : null, dv = (vu||0)-(vb||0);
                return e("tr",{key:c.id, className:"hover:bg-muted/20"},
                  e("td",{className:CAB+" "+GRADE+" truncate bg-card pl-6 text-[12px]", title:c.nome+(c.limite ? " · limite "+BK(c.limite) : "")}, c.nome, pixDaCaixa(cx.state.px, c.id) ? e("span",{className:"ml-1.5 inline-block align-middle"}, e(CopiarChave,{texto:pixDaCaixa(cx.state.px, c.id).chave, rot:"Pix"})) : null),
                  vcols.map(function(k){ var v = efetivo(sc, ds, c.id, k), lanc = !!(sc.saldos[k] && sc.saldos[k][c.id]!==undefined);
                    return e("td",{key:k, className:"p-0 "+GRADE+" "+(k===hoje ? "bg-primary/10" : fimSem(k) ? "bg-violet-500/10" : "")}, e(Celula,{key:k+(v===null?"n":v), v:v, lancado:lanc, salvar:salvar(k, c.id)})); }),
                  e("td",{className:VARC+" "+neg(dv)}, vb===null && vu===null ? "—" : sinal(dv)));
              })];
          }),
          filtro==="todos" && linhaTotal("SALDO REAL DAS CONTAS (sem bloqueadas)", totalDia, "", "bg-[#4a3d1c]", "real-fim"),
          filtro==="todos" && linhaTotal("SALDO COM CHEQUE ESPECIAL (saldo + limite)", function(k){ return totalDia(k)+limiteTotal; }, "text-emerald-400", "bg-[#123c2d]", "disp-fim"),
          vcols.length>0 && e("tr",{key:"pag-t", className:"bg-[#2b2416]"}, e("td",{className:CAB+" "+GRADE+" bg-[#2b2416] text-[12px] font-bold uppercase tracking-wide text-primary"}, "Pagamentos do dia"), e("td",{className:GRADE+" text-[12px] font-semibold text-foreground/70", colSpan:vcols.length+1}, e("button",{onClick:function(){ cx.dispatch({type:"ABA", aba:"contaspagar"}); }, className:"rounded-lg bg-primary px-3 py-1 text-[12.5px] font-bold text-primary-foreground hover:brightness-110"}, "Abrir Contas a pagar › Diário"), e("span",{className:"ml-3"}, "o que foi pago em cada dia (lançamento e conferência ficam lá)"))),
          pagLinhas.map(function(l){ var soma = somaId(l.id);
            return e("tr",{key:"pg"+l.id, className:"hover:bg-muted/20"},
              e("td",{className:CAB+" "+GRADE+" bg-card pl-6 text-[12.5px]"}, "Pago · "+l.nome),
              vcols.map(function(k){ var v = pagoDia(k, l.id); return e("td",{key:k, className:CELA+" "+(v>0 ? "" : "text-foreground/35")}, v>0 ? num(v) : "—"); }),
              e("td",{className:VARC, title:"Soma dos dias depois do primeiro em aberto"}, num(soma)));
          }),
          vcols.length>0 && e("tr",{key:"pag-total", className:"font-bold bg-[#4a3d1c]"},
            e("td",{className:CAB+" "+GRADE+" bg-[#4a3d1c]"}, "TOTAL PAGO NO DIA"),
            vcols.map(function(k){ var v = pagoTotalDia(k); return e("td",{key:k, className:CELA}, v>0 ? num(v) : "—"); }),
            e("td",{className:VARC}, num(filtro==="todos" ? fl.pago : somaId(filtro)))),
          vcols.length>0 && e("tr",{key:"rec-t", className:"bg-[#16301f]"}, e("td",{className:CAB+" "+GRADE+" bg-[#16301f] text-[12px] font-bold uppercase tracking-wide text-emerald-300"}, "Recebido do dia"), e("td",{className:GRADE+" text-[12px] font-semibold text-foreground/70", colSpan:vcols.length+1}, "Contas a receber · baixas por Dt. Baixa · clique num grupo para ver as naturezas")),
          recGrupos.map(function(g){ var aberto = !!recAb[g.id], nats = Object.keys(RECEBER_MAPA_LOCAL).filter(function(n){ return RECEBER_MAPA_LOCAL[n][0]===g.id && diasDe(dA||hoje, dB||hoje).concat([dA||hoje]).some(function(k){ return ((RECEBER_LOCAL||{})[k]||{})[n]; }); });
            return [e("tr",{key:"rc"+g.id, className:"cursor-pointer hover:bg-muted/20", onClick:function(){ var o = Object.assign({}, recAb); o[g.id] = !aberto; setRecAb(o); }},
              e("td",{className:CAB+" "+GRADE+" bg-card pl-4 text-[12.5px]"}, seta(aberto), "Recebido · "+g.nome),
              vcols.map(function(k){ var v = recDia(k, g.id); return e("td",{key:k, className:CELA+" "+(v>0 ? "" : "text-foreground/35")}, v>0 ? num(v) : "—"); }),
              e("td",{className:VARC}, num(somaRec(g.id)))),
              aberto && nats.map(function(n){ return e("tr",{key:"rn"+n, className:"text-[12px]"},
                e("td",{className:CAB+" "+GRADE+" bg-card pl-10 text-[11.5px] text-foreground/80"}, n+(RECEBER_MAPA_LOCAL[n][1] ? " → "+((sc.contas.filter(function(c){ return c.id===RECEBER_MAPA_LOCAL[n][1]; })[0]||{}).nome||"") : "")),
                vcols.map(function(k){ var v = ((RECEBER_LOCAL||{})[k]||{})[n]||0; return e("td",{key:k, className:CELA+" text-foreground/80 "+(v>0 ? "" : "text-foreground/30")}, v>0 ? num(v) : "—"); }),
                e("td",{className:VARC}, num(diasDe(dA||hoje, dB||hoje).reduce(function(x,k){ return x+(((RECEBER_LOCAL||{})[k]||{})[n]||0); },0)))); })]; }),
          filtro==="todos" && e("tr",{key:"rec-loja", className:"text-foreground/70"}, e("td",{className:CAB+" "+GRADE+" bg-card pl-4 text-[12px] italic"}, "Acerto com loja · não entrou na conta"),
            vcols.map(function(k){ var v = (fdAll[k]&&fdAll[k].loja!==undefined && s.fatDia && s.fatDia[k]) ? (s.fatDia[k].loja||0) : 0; return e("td",{key:k, className:CELA+" italic "+(v>0 ? "" : "text-foreground/30")}, v>0 ? num(v) : "—"); }),
            e("td",{className:VARC+" italic"}, num(fl.loja||0))),
          e("tr",{key:"rec-aporte", className:"text-foreground/80"}, e("td",{className:CAB+" "+GRADE+" bg-card pl-4 text-[12px]"}, "Aporte de sócio (entra no saldo)"),
            vcols.map(function(k){ var v = aporteDia(k, filtro==="todos" ? undefined : filtro); return e("td",{key:k, className:CELA+" "+(v>0 ? "" : "text-foreground/30")}, v>0 ? num(v) : "—"); }),
            e("td",{className:VARC}, num(diasDe(dA||hoje, dB||hoje).reduce(function(x,k){ return x+aporteDia(k, filtro==="todos" ? undefined : filtro); },0)))),
          vcols.length>0 && e("tr",{key:"rec-total", className:"font-bold bg-[#1d4a2e]"},
            e("td",{className:CAB+" "+GRADE+" bg-[#1d4a2e]"}, "TOTAL RECEBIDO NAS CONTAS (sem diretos)"),
            vcols.map(function(k){ var v = filtro==="todos" ? recTotalDia(k)-((s.fatDia&&s.fatDia[k]) ? (s.fatDia[k].loja||0) : 0)-recDia(k,"FORN")+aporteDia(k) : recDia(k, filtro)+aporteDia(k, filtro); return e("td",{key:k, className:CELA}, v>0 ? num(v) : "—"); }),
            e("td",{className:VARC}, num(filtro==="todos" ? fl.fat : recCnpjP)))
          ))),
    cols.length===0 && e("p",{className:"text-center text-sm text-muted-foreground"}, "Nenhum dia lançado neste mês ainda. Use a visão “Lançar saldos”."),
    feriadosVis.length>0 && e("p",{className:"text-center text-[12px] font-semibold text-violet-300"}, "Obs.: "+feriadosVis.map(function(k){ return dc(k)+" feriado ("+FERIADOS[k]+")"; }).join(" · ")+" — sem trabalho, mesma cor do fim de semana."),
    e("p",{className:"text-center text-[11px] text-muted-foreground"}, "Cada coluna é o saldo do FIM do dia. Clique no meio da planilha, segure e arraste para o lado. Use o ✕ do dia para fechá-lo: a variação passa a ser do primeiro ao último dia em aberto. Número fraco = vem do último lançamento; forte = lançado no dia.")));
}

export { AbaCaixa };

// Sorelly Admin · montagem — pages/LimiteFaturamento.js
// Um bloco por CNPJ com o fiscal do ano (faturamento, ILF, brindes, notas de entrada) e a projeção até 31/12 contra o limite anual.
// Em ordem do menor ILF para o maior. Quem lança: o resumo fiscal (botão no bloco, guardado em state.fiscal.hist) e as contas a pagar por CNPJ (tela Contas a pagar).
// Alerta pela projeção: verde até 90% do limite, amarelo até 100%, vermelho acima.
import { COLUNAS_CONTAS, SUBLIMITE_ANUAL, VERDE_ATE_PCT, cnpjsDe, fiscalAtual, indicadoresFiscais, projecaoCnpj } from "@/apps/montagem/domain/cnpjs";
import { use } from "@/apps/montagem/state/context";
import { INPUT, MONO, MoneyInput, brl } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { Linha, Secao } from "@/apps/montagem/pages/Cnpjs";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { e, useState } from "@/shared/react";
import React from "react";

var EDIT_INPUT = INPUT+" h-9! w-full border-white/30! bg-black/25! text-center text-white!";
var NIVEL = {verde:["✓ Dentro do limite","bg-white/90 text-black"], amarelo:["⚠ Perto do limite","bg-amber-300 text-black"], vermelho:["✕ Vai passar do limite","bg-red-600 text-white"]};
var BTN = "rounded-lg border border-white/40 bg-black/20 px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-black/35";
function pct(n, dec){ return n.toLocaleString("pt-BR",{minimumFractionDigits:dec||1, maximumFractionDigits:dec||1})+"%"; }
function dataBR(iso){ var p = (iso||"").split("-"); return p.length===3 ? p[2]+"/"+p[1]+"/"+p[0] : "—"; }
function hojeIso(){ var d = new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function Info(p){
  return e("div",{className:"flex min-w-0 flex-col items-center gap-0.5 text-center"},
    e("span",{className:"text-[11px] font-semibold uppercase tracking-wide text-white/70"}, p.rot),
    p.children || e("span",{className:MONO+" font-semibold text-white "+(p.big?"text-[20px] font-bold":"text-[15px]")}, p.v));
}
function IrContas(){
  var d = use().dispatch;
  return e("button",{className:BTN, onClick:function(){ d({type:"VER_FIN", v:"cnpj"}); d({type:"ABA", aba:"contaspagar"}); }}, "Lançar contas a pagar");
}
function FormLancar(p){
  var d = use().dispatch, a = p.atual;
  var st = useState({data:hojeIso(), fatAnual:a.fatAnual||0, brindesMes:a.brindesMes||0, entradaMes:a.entradaMes||0, entradaAnual:a.entradaAnual||0}), l = st[0], setL = st[1];
  var campo = function(k, rot){
    return e(Info,{rot:rot}, e(MoneyInput,{value:l[k], label:p.c.nome+" "+rot, className:"w-full border-white/30! bg-black/25! text-white!", onChange:function(x){ setL(Object.assign({}, l, {[k]:x})); }}));
  };
  return e("div",{className:"flex flex-col items-center gap-3 rounded-xl border border-white/30 bg-black/25 p-3"},
    e("span",{className:"text-center text-[13px] text-white/85"}, "Digite os números do resumo fiscal (acumulado do ano até a data escolhida) e clique em Salvar. O ILF e a projeção se atualizam sozinhos."),
    e("div",{className:"grid w-full grid-cols-1 gap-3 sm:grid-cols-2"},
      e(Info,{rot:"Valem até o dia"}, e("input",{type:"date", className:EDIT_INPUT, value:l.data, "aria-label":"Data do resumo fiscal", onChange:function(ev){ setL(Object.assign({}, l, {data:ev.target.value})); }})),
      campo("fatAnual","Faturamento fiscal anual"), campo("brindesMes","Brindes do mês"), campo("entradaMes","Notas de entrada do mês"), campo("entradaAnual","Notas de entrada no ano")),
    e("div",{className:"flex gap-2"},
      e("button",{disabled:!l.data, onClick:function(){ d({type:"FISCAL_LANCAR", id:p.c.id, l:l}); p.onFim(); }, className:"rounded-lg bg-white px-5 py-1.5 text-[13px] font-bold text-black disabled:opacity-50"}, "Salvar lançamento"),
      e("button",{onClick:p.onFim, className:BTN}, "Cancelar")));
}
var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

// bloco da lista (2 a 2): resumo do fiscal do CNPJ; clique abre tudo em tela cheia
function BlocoFiscal(p){
  var c = p.c, f = p.f, pr = p.pr, nv = NIVEL[pr.nivel], ind = indicadoresFiscais(f), tem = !!f.data;
  var cor = pr.nivel==="vermelho" ? "bg-red-500" : pr.nivel==="amarelo" ? "bg-amber-300" : "bg-white";
  return e("button",{onClick:p.abrir, className:"group flex w-full flex-col overflow-hidden rounded-2xl border text-left shadow-lg transition-transform hover:-translate-y-0.5", style:{borderColor:c.cor, background:"linear-gradient(180deg,"+c.cor+"33,rgba(0,0,0,.35))"}},
    e("div",{className:"flex items-center gap-3 px-4 py-2.5", style:{background:c.cor}},
      e("span",{className:"grid size-10 place-items-center rounded-xl bg-black/25 font-heading text-[15px] font-bold text-white"}, c.num || "H&O"),
      e("div",{className:"min-w-0 flex-1"}, e("h2",{className:"truncate font-heading text-[18px] font-bold leading-tight text-white"}, c.nome), e("p",{className:"truncate text-[11.5px] text-white/85"}, tem ? "Fiscal até "+dataBR(f.data) : "Sem informações fiscais")),
      tem && e("span",{className:"rounded-full px-2.5 py-1 text-[11.5px] font-bold "+nv[1]}, nv[0])),
    e("div",{className:"flex flex-col px-4 py-1.5"},
      tem ? [["Faturamento fiscal anual", brl(f.fatAnual)], ["ILF", pct(ind.ilf, 2)], ["Falta para o sublimite", brl(ind.falta)], ["Projetado em 31/12", brl(pr.projetado)], ["Pode faturar por mês", brl(pr.porMes)]].map(function(x){ return e(Linha,{key:x[0], t:x[0], v:x[1]}); })
          : e("p",{className:"py-3 text-[13px] text-white/75"}, "Abra e lance o resumo fiscal deste CNPJ.")),
    tem && e("div",{className:"flex flex-col gap-1 px-4 pb-2"},
      e("div",{className:"relative h-2.5 overflow-hidden rounded-full bg-black/35"}, e("div",{className:"h-full rounded-full "+cor, style:{width:Math.min(100, pr.pct)+"%"}}), e("div",{className:"absolute top-0 h-full w-0.5 bg-black/60", style:{left:VERDE_ATE_PCT+"%"}})),
      e("span",{className:"text-[11.5px] text-white/75"}, pct(pr.pct)+" do limite · "+(pr.sobra>=0 ? "sobram "+brl(pr.sobra) : "passa "+brl(-pr.sobra)))),
    e("div",{className:"mt-auto flex items-center justify-end gap-1.5 border-t border-white/10 px-4 py-2 text-[12px] font-semibold text-white/80 group-hover:text-white"}, "Abrir tudo em tela cheia", e(Ph,{n:"arrow-right", s:14})));
}

// tela cheia do fiscal de um CNPJ
function FiscalCheio(p){
  var cx = use(), s = cx.state, d = cx.dispatch, c = p.c, f = p.f, pr = p.pr, nv = NIVEL[pr.nivel], ind = indicadoresFiscais(f), tem = !!f.data;
  var hist = (((s.fiscal||{}).hist||{})[c.id]||[]).slice().sort(function(a,b){ return a.data<b.data ? 1 : -1; });
  var ano = String((f.data||"").slice(0,4) || new Date().getFullYear()), meses = ((s.contasCnpj||{})[ano]||{})[c.id] || {};
  var cor = pr.nivel==="vermelho" ? "bg-red-500" : pr.nivel==="amarelo" ? "bg-amber-300" : "bg-white";
  return e("div",{className:"flex flex-col gap-4"},
    e("div",{className:"flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 shadow-lg", style:{background:c.cor}},
      e("button",{onClick:p.voltar, className:"flex items-center gap-1.5 rounded-lg border border-white/40 bg-black/20 px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-black/35"}, e(Ph,{n:"arrow-left", s:15}), "Voltar"),
      e("div",{className:"min-w-0 flex-1"}, e("p",{className:"text-[11px] font-bold uppercase tracking-widest text-white/75"}, c.num ? "Fiscal · CNPJ "+c.num : "Fiscal"), e("h2",{className:"truncate font-heading text-2xl font-bold text-white"}, c.nome), e("p",{className:"text-[12.5px] text-white/85"}, tem ? "Resumo fiscal até "+dataBR(f.data) : "Sem informações fiscais ainda")),
      tem && e("span",{className:"rounded-full px-3 py-1.5 text-[13px] font-bold "+nv[1]}, nv[0]),
      tem && e("div",{className:"flex flex-col items-center rounded-xl bg-black/25 px-4 py-1.5 text-white"}, e("b",{className:"font-heading text-[24px] leading-none"}, pct(ind.ilf, 2)), e("span",{className:"text-[10.5px] font-semibold uppercase"}, "ILF"))),
    e("div",{className:"grid grid-cols-1 items-start gap-4 lg:grid-cols-2"},
      e(Secao,{t:"Fiscal do ano", ic:"relatorio", cor:c.cor},
        e(Linha,{t:"Faturamento fiscal anual", v:brl(f.fatAnual)}), e(Linha,{t:"Limite anual", v:brl(SUBLIMITE_ANUAL)}), e(Linha,{t:"Já usou do limite", v:pct(ind.pctSublimite)}), e(Linha,{t:"Falta para o sublimite", v:brl(ind.falta)}),
        e(Linha,{t:"Brindes do mês", v:brl(f.brindesMes)}), e(Linha,{t:"Notas de entrada do mês", v:brl(f.entradaMes)}), e(Linha,{t:"Notas de entrada no ano", v:brl(f.entradaAnual)})),
      e(Secao,{t:"Projeção até 31/12", ic:"calendario", cor:c.cor},
        e(Linha,{t:"Faturamento até agora", v:brl(f.fatAnual)}), e(Linha,{t:"+ Contas a pagar até 31/12", v:brl(pr.contas)}), e(Linha,{t:"= Projetado em 31/12", v:brl(pr.projetado)}),
        e(Linha,{t:"% do limite", v:pct(pr.pct)}), e(Linha,{t:pr.sobra>=0 ? "Sobra" : "Passa do limite", v:brl(Math.abs(pr.sobra))}), e(Linha,{t:"Pode faturar por mês", v:brl(pr.porMes)}),
        e("div",{className:"relative my-2 h-3 overflow-hidden rounded-full bg-black/35"}, e("div",{className:"h-full rounded-full "+cor, style:{width:Math.min(100, pr.pct)+"%"}}), e("div",{className:"absolute top-0 h-full w-0.5 bg-black/60", style:{left:VERDE_ATE_PCT+"%"}}))),
      e(Secao,{t:"Contas a pagar por mês · "+ano, ic:"banco", cor:c.cor, dir:e(IrContas,null)},
        MESES.map(function(m, i){ return e(Linha,{key:m, t:m, v:meses[i] ? brl(meses[i]) : "—"}); })),
      e("div",{className:"flex flex-col gap-4"},
        e(Secao,{t:"Lançar resumo fiscal", ic:"documento", cor:c.cor}, e(FormLancar,{c:c, atual:f, onFim:function(){}})),
        e(Secao,{t:"Lançamentos fiscais", ic:"relatorio", cor:c.cor, dir:e("span",{className:"text-[11px] text-white/70"}, hist.length+" lançamento"+(hist.length===1 ? "" : "s"))},
          hist.length===0 ? e("p",{className:"py-2 text-[13px] text-white/70"}, "Nenhum lançamento ainda.") : hist.map(function(h){
            return e("div",{key:h.data, className:"grid grid-cols-[5.5rem_minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-white/10 py-1.5 text-[13px] text-white last:border-b-0"},
              e("span",null, dataBR(h.data)), e("span",{className:MONO}, brl(h.fatAnual)), e("span",{className:MONO+" text-white/75"}, "ILF "+pct(indicadoresFiscais(h).ilf,2)),
              e("button",{onClick:function(){ d({type:"FISCAL_APAGAR", id:c.id, data:h.data}); }, className:"text-[12px] text-white/60 underline hover:text-white", "aria-label":"Apagar lançamento de "+dataBR(h.data)}, "apagar")); })))));
}

function AbaLimiteFaturamento(){
  var s = use().state, ab = useState(null), aberto = ab[0], setAberto = ab[1];
  var ano = String((fiscalAtual(s.fiscal,"34").data||"").slice(0,4) || new Date().getFullYear());
  var cc = (s.contasCnpj||{})[ano]||{};
  var lista = cnpjsDe(s.cnpjs).filter(function(c){ return c.num; }).map(function(c){ var f = fiscalAtual(s.fiscal, c.id); return {c:c, f:f, pr:projecaoCnpj(c.id, f, s.contasCnpj), ilf: f.data ? indicadoresFiscais(f).ilf : Infinity}; })
    .sort(function(a,b){ return a.ilf-b.ilf; });   // menor ILF primeiro; sem dados fiscais por último
  var ate = fiscalAtual(s.fiscal,"34").data, mesAte = ate ? Number(ate.slice(5,7))-1 : -1;   // meses depois do último lançamento fiscal
  var restantes = [0,1,2,3,4,5,6,7,8,9,10,11].filter(function(m){ return m>mesAte; });
  var somaCol = function(id){ return restantes.reduce(function(t,m){ return t+(((cc[id]||{})[m])||0); },0); };
  var contasSem = somaCol("sem");
  var totalContas = COLUNAS_CONTAS.reduce(function(t,col){ return t+somaCol(col[0]); },0);
  var x = lista.find(function(y){ return y.c.id===aberto; });
  if(x) return e(React.Fragment,null, e(PageHead,{t:"Fiscal", sub:"Tudo do fiscal de uma empresa em uma tela só."}), e(FiscalCheio,{c:x.c, f:x.f, pr:x.pr, voltar:function(){ setAberto(null); }}));
  return e(React.Fragment,null,
    e(PageHead,{t:"Fiscal · limite de faturamento", sub:"Fiscal do ano e contas a pagar até 31/12, contra o limite de "+brl(SUBLIMITE_ANUAL)+" por CNPJ. Em ordem do menor ILF. Verde até "+VERDE_ATE_PCT+"%. Clique em um CNPJ para abrir tudo."}),
    e("div",{className:"mx-auto flex w-full max-w-6xl flex-col gap-4"},
      e("div",{className:"grid grid-cols-1 gap-2 md:grid-cols-3"},
        [["Total de contas a pagar até 31/12", brl(totalContas)], ["Desse total, sem CNPJ", brl(contasSem)], ["Limite anual por CNPJ", brl(SUBLIMITE_ANUAL)]].map(function(k){
          return e("div",{key:k[0], className:"flex flex-col items-center rounded-xl bg-card px-3 py-2.5 text-center ring-1 ring-[#E8B84B]/30"}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-[.12em] text-muted-foreground"}, k[0]), e("b",{className:MONO+" text-[20px]"}, k[1])); })),
      e("div",{className:"grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2"}, lista.map(function(y){ return e(BlocoFiscal,{key:y.c.id, c:y.c, f:y.f, pr:y.pr, abrir:function(){ setAberto(y.c.id); }}); })),
      e("section",{className:"flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-card p-3"},
        e("div",null, e("h2",{className:"font-heading text-[15px] font-bold"}, "Contas sem CNPJ"), e("p",{className:"text-[12px] text-muted-foreground"}, "Não entram no limite de nenhum CNPJ. Ficam aqui para você enxergar o total: "+brl(contasSem))),
        e(IrContas,null))));
}

export { AbaLimiteFaturamento };

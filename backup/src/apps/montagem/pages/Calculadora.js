// Sorelly Admin · montagem e bipagem — pages/Calculadora.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { EmEspera } from "@/apps/montagem/components/em-espera";
import { BlocoBarra, TabelaEquipe } from "@/apps/montagem/components/equipe-blocos";
import { listagemDe } from "@/apps/montagem/domain/regras";
import { kit } from "@/apps/montagem/domain/seed";
import { SEM_KIT, TIPO_KIT } from "@/apps/montagem/domain/status";
import { comissaoRev } from "@/apps/montagem/domain/vendas";
import { BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { BADGE } from "@/apps/montagem/ui/badge";
import { Btn } from "@/apps/montagem/ui/button";
import { Icon } from "@/apps/montagem/ui/icon";
import { INPUT, MONO, brl } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { TD, TH, TR } from "@/apps/montagem/ui/table";
import { e, useState } from "@/shared/react";
import React from "react";

function LinhaPendente(p){
  var k = p.k, tipo = TIPO_KIT[k.tipoKit] || TIPO_KIT.acerto_kit, on = k.id===p.kitId;
  return e("tr",{className:TR+(on?" bg-primary/10":"")},
    e(TD,{className:"text-center! "+MONO+" text-muted-foreground"}, p.pos+"º"),
    e(TD,{className:"text-center! "+MONO+" text-[12.5px]!"}, k.horaAtend || "—"),
    e(TD,{className:"font-medium"}, k.prio && e("span",{className:"text-primary"},"★ "), k.rev, e("p",{className:"text-[12px] font-normal text-muted-foreground"}, k.bairro)),
    e(TD,null, e("span",{title:tipo[0], className:"inline-block max-w-full truncate rounded-md border px-1.5 py-0.5 text-[11.5px] font-semibold "+BADGE[tipo[2]]}, tipo[1])),
    e(TD,{className:"text-center!"}, e(Btn,{v: on?"primary":"ghost", sm:true, ic:"calc", onClick:function(){ p.escolher(k.id); }}, on?"Selecionada":"Definir")));
}
function GrupoPendente(p){
  var x = p.x, ab = useState(true), aberto = ab[0], setAberto = ab[1];
  return e("div",{className:"overflow-hidden rounded-xl"},
    e("button",{onClick:function(){ setAberto(!aberto); }, "aria-expanded":aberto,
        className:"flex w-full items-center gap-2 px-3.5 py-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,.35)] bg-linear-to-r from-[#B8862B] via-[#E8B84B] to-[#F1E4C6] text-[#1B1409] "+(aberto?"rounded-t-xl":"rounded-xl")},
      e(Icon,{n: aberto?"chevrondown":"chevron", s:16}),
      e("b",{className:"font-heading text-[15px] font-bold"}, x.l.rep),
      e("span",{className:"rounded-full bg-black/15 px-2 py-0.5 text-[12px] font-bold"}, x.l.horario),
      e("span",{className:"ml-auto rounded-full bg-black/20 px-2 py-0.5 text-[12px] font-bold"}, x.ks.length+(x.ks.length===1?" pendente":" pendentes"))),
    aberto && e("div",{className:"overflow-x-auto rounded-b-xl border border-t-0 border-border bg-card"},
      e("table",{className:"w-full min-w-[36rem] border-collapse text-sm"},
        e("thead",null, e("tr",{className:"bg-sidebar"},
          e(TH,{c:true},"Ordem"), e(TH,{c:true},"Horário"), e(TH,null,"Nome"), e(TH,null,"Tipo"), e(TH,{c:true},"Ação"))),
        e("tbody",null, x.ks.map(function(k,i){ return e(LinhaPendente,{key:k.id, k:k, pos:i+1, kitId:p.kitId, escolher:p.escolher}); })))));
}

function VendaInput(p){   // campo de venda que pode ficar vazio (vazio ≠ zero)
  return e("div",{className:"relative"},
    e("span",{className:"pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-primary"},"R$"),
    e("input",{inputMode:"numeric", disabled:p.disabled, value: p.value===null ? "" : p.value.toLocaleString("pt-BR",{minimumFractionDigits:2}), placeholder:"vazia", "aria-label":p.label,
      onChange:function(ev){ var d = ev.target.value.replace(/\D/g,"").slice(0,11); p.onChange(d ? Number(d)/100 : null); },
      className:INPUT+" h-11! w-full pl-10! text-right text-[15px]! "+MONO+(p.disabled?" opacity-70":"")}));
}
function AbaCalculadora(){
  var cx = use(), s = cx.state, d = cx.dispatch, c = s.cfg;
  // Kit novo não passa por aqui: o valor já vem pronto do setor Kit novo (NOVA_INCLUIR já grava direto no kit).
  var abertos = s.kits.filter(function(k){ var l = listagemDe(s, k);
    return l && !l.fechada && (k.status==="semvalor" || k.status==="pendente") && !SEM_KIT[k.tipoKit] && (k.tipoKit||"").indexOf("kit_novo")!==0; });
  var kIni = abertos.find(function(k){return k.id===s.calcKit;});
  // Última venda: puxada sozinha do nosso app quando é R$ 500 ou mais (regra em Regras). As outras 2, sempre manuais (DevMaster).
  var vendaAppOk = function(k){ return k && k.vendas && k.vendas[0]!==undefined && k.vendas[0]>=c.minVendaApp; };
  var deKit = function(k){ return [vendaAppOk(k) ? k.vendas[0] : null, null, null]; };
  var ks = useState(kIni ? kIni.id : ""), kitId = ks[0], setKitId = ks[1];
  var vs = useState(kIni ? deKit(kIni) : [null,null,null]), vendas = vs[0], setVendas = vs[1];
  var au = useState(kIni ? vendaAppOk(kIni) : false), autoApp = au[0], setAutoApp = au[1];
  var es = useState(c.tabelaAtiva||"alto"), estoque = es[0], setEstoque = es[1];
  var cs = useState(null), vendaCom = cs[0], setVendaCom = cs[1];
  var k = abertos.find(function(x){return x.id===kitId;});
  var escolherKit = function(id){ setKitId(id); var x = abertos.find(function(y){return y.id===id;});
    if(x){ setVendas(deKit(x)); setAutoApp(vendaAppOk(x)); } };
  var tab = (estoque==="baixo" ? c.tabelaKitBaixo : c.tabelaKit).slice().sort(function(a,b){return b.min-a.min;});
  var preenchidas = vendas.filter(function(v){return v!==null;});
  var media = preenchidas.length ? preenchidas.reduce(function(t,v){return t+v;},0)/preenchidas.length : null;
  var faixa = media!==null ? tab.find(function(f){return media>=f.min;}) : null;
  var kit = faixa ? faixa.kit : null;
  var marcus = media!==null && media > c.limiteMarcus;
  var precisaAnalise = media!==null && media > c.limiteAnaliseVendas;
  var vc = vendaCom!==null ? vendaCom : preenchidas[0]!==undefined ? preenchidas[0] : null, comAtual = vc!==null ? comissaoRev(vc, c) : null;
  var faixaTxt = function(lista, i, f){ var ant = lista[i-1]; return i===0 ? BK(f.min)+" ou mais" : f.min===0 ? "abaixo de "+BK(lista[i-1].min) : BK(f.min)+" a "+brl(ant.min-0.01); };
  var passo = function(n, t, sub){ return e("div",{className:"flex items-center gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-[#E8B84B]/20"},
    e("span",{className:"grid size-8 shrink-0 place-items-center rounded-full bg-primary text-[14px] font-bold text-primary-foreground"}, n),
    e("div",{className:"min-w-0 whitespace-nowrap"}, e("b",{className:"block truncate text-[14px]"}, t), e("span",{className:"block truncate text-[12.5px]"}, sub))); };
  var C = "py-2! px-3! text-center! ";
  var tabelaKit = function(qual, titulo, sub, cor){ var lista = (qual==="baixo" ? c.tabelaKitBaixo : c.tabelaKit).slice().sort(function(a,b){return b.min-a.min;});
    return e(BlocoBarra,{t:titulo, sub:sub, cor:cor},
      e(TabelaEquipe,{solta:true, min:"min-w-[24rem]", larg:[null,150], cols:["Valor médio","Kit liberado"]},
        lista.map(function(f,i){ var on = estoque===qual && faixa && faixa.min===f.min;
          return e("tr",{key:i, className:TR+(on?" bg-primary/20 font-bold":"")}, e(TD,{className:C}, faixaTxt(lista, i, f)), e(TD,{className:C+MONO+" text-primary"}, BK(f.kit))); }))); };
  var comLista = (c.comissoesRev||[]).slice().sort(function(a,b){return b.min-a.min;});
  var pendentes = abertos.filter(function(x){return x.status==="semvalor";});
  var porListagem = s.listagens.filter(function(l){return !l.fechada;}).map(function(l){
    return {l:l, ks: pendentes.filter(function(x){return x.lid===l.id;}).sort(function(a,b){return a.ordem-b.ordem;})}; }).filter(function(x){return x.ks.length>0;});
  return e(React.Fragment,null,
    e(PageHead,{t:"Calculadora de kits", sub:"Digite as vendas: o kit aparece sozinho. Pode puxar a revendedora direto da listagem e já gravar o valor."}),
    e("div",{className:"grid grid-cols-3 gap-2"},
      passo(1,"Puxe a revendedora","Da lista de pendentes ou do menu"), passo(2,"Digite as vendas","Pode ser 1, 2 ou 3, sem venda deixe vazia"),
      passo(3,"Veja o kit","Aparece sozinho ao lado")),
    e("div",{className:"whitespace-nowrap rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-2 text-center text-[13px]"},
      e("b",{className:"text-primary"},"Exemplo. "), "Vendeu 3.000 e 2.000? Coloque ", e("b",{className:MONO},"3000 · 2000 · vazia"), ". Se o valor médio passar de ", e("b",null, BK(c.limiteMarcus)), ", chame o Marcus."),
    e("div",{className:"flex items-center gap-2 px-1"}, e("b",{className:"text-[13px] font-semibold"},"Pendentes de cálculo"),
      e("span",{className:"text-[12.5px] text-muted-foreground"}, pendentes.length+(pendentes.length===1?" revendedora ainda sem valor":" revendedoras ainda sem valor")+", agrupadas por representante")),
    porListagem.length===0 ? e("p",{className:"rounded-xl border border-dashed border-border p-4 text-center text-[13px] text-muted-foreground"},"Nenhuma pendente — todas as revendedoras do dia já têm valor definido.")
    : e("div",{className:"flex flex-col gap-3"}, porListagem.map(function(x){ return e(GrupoPendente,{key:x.l.id, x:x, kitId:kitId, escolher:escolherKit}); })),
    e("div",{className:"grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4"},
      e(BlocoBarra,{t:"Calcular kit", sub:"puxe a revendedora e digite as vendas que tiver"},
        e("div",{className:"flex flex-col gap-4 p-4"},
          e("div",{className:"flex flex-nowrap items-center gap-2"},
            e("span",{className:"shrink-0 text-[13px] font-semibold"},"Revendedora da listagem"),
            e("select",{value:kitId, onChange:function(ev){ escolherKit(ev.target.value); }, "aria-label":"Revendedora da listagem",
                className:"h-10 min-w-0 flex-1 cursor-pointer rounded-lg border border-primary/50 bg-primary/10 px-3 text-sm font-semibold outline-none"},
              e("option",{value:""},"Nenhuma (só calcular)"),
              abertos.map(function(x){ var l = listagemDe(s, x); return e("option",{key:x.id, value:x.id}, x.rev+" · "+l.rep+" "+l.horario+(x.valor ? " · hoje "+BK(x.valor) : " · sem valor")); }))),
          e("div",null, e("p",{className:"mb-1.5 text-[13px] font-semibold"},"Últimas vendas"),
            e("div",{className:"grid grid-cols-3 gap-2"}, [["1ª venda","mais nova"],["2ª venda","do meio"],["3ª venda","mais velha"]].map(function(x,i){
              var trava = i===0 && autoApp;
              return e("div",{key:i, className:"flex flex-col gap-1"},
                e("div",{className:"flex items-baseline justify-between text-[12.5px]"}, e("b",null, x[0]), e("span",null, trava ? "automático (app)" : x[1])),
                e(VendaInput,{value:vendas[i], label:x[0], disabled:trava, onChange:function(v){ var o = vendas.slice(); o[i] = v; setVendas(o); }})); })),
            e("p",{className:"mt-1.5 text-[12.5px]"}, autoApp ? "A 1ª já veio sozinha do app (R$ 500 ou mais). Complete as outras 2 pela DevMaster." : "Sem venda boa no app: preencha as 3 manualmente, pela DevMaster.")),
          e("div",{className:"flex flex-nowrap items-center gap-2"},
            e("span",{className:"text-[13px] font-semibold"},"Tabela"),
            e("div",{className:"flex gap-1 rounded-lg bg-muted p-1"}, [["alto","Estoque alto"],["baixo","Estoque baixo"]].map(function(x){
              return e("button",{key:x[0], onClick:function(){setEstoque(x[0]);}, className:"rounded-md px-3 py-1 text-[13px] font-semibold "+(estoque===x[0]?"bg-primary text-primary-foreground":"hover:bg-card")}, x[1]+(c.tabelaAtiva===x[0]?" (em uso)":"")); }))))),
      e("section",{className:"flex flex-col overflow-hidden rounded-xl ring-2 "+(marcus?"ring-destructive/60":"ring-[#E8B84B]/50")},
        e("div",{className:"flex flex-1 flex-col items-center justify-center gap-1 bg-linear-to-br from-[#B8862B] via-[#E8B84B] to-[#F1E4C6] px-4 py-6 text-center text-[#1B1409]"},
          e("span",{className:"text-[13px] font-bold uppercase tracking-wider"},"Kit liberado"),
          e("b",{className:MONO+" text-[44px] leading-none"}, kit ? BK(kit) : "•••"),
          e("span",{className:"text-[13px] font-semibold"}, faixa ? "Tabela de estoque "+(estoque==="baixo"?"baixo":"alto") : "Digite pelo menos uma venda")),
        marcus && e("div",{className:"flex items-center justify-center gap-2 bg-destructive px-3 py-2 text-[13.5px] font-bold text-white"}, e(Icon,{n:"alert", s:16}), "Média acima de "+BK(c.limiteMarcus)+": chame o Marcus"),
        precisaAnalise && e("div",{className:"flex items-center justify-center gap-2 bg-warning px-3 py-2 text-center text-[13.5px] font-bold text-[#1B1409]"}, e(Icon,{n:"alert", s:16}), "Média acima de "+BK(c.limiteAnaliseVendas)+": obrigatório mandar a análise de vendas"),
        e("div",{className:"bg-card p-3"},
          e("div",{className:"rounded-lg bg-muted/40 px-3 py-2 text-center"}, e("p",{className:"text-[12px]"},"Valor médio"), e("b",{className:MONO+" text-lg"}, media!==null ? brl(media) : "—"))),
        e("div",{className:"flex flex-nowrap items-center gap-2 bg-card px-3 pb-3"},
          k ? e(Btn,{v:"primary", ic:"check", className:"flex-1", disabled:!kit, onClick:function(){
                d({type:"DEFINIR_VALOR", id:k.id, valor:kit, media:media}); d({type:"ABA", aba:"painel"}); }},
                "Ok, gravar "+(kit?BK(kit):"")+" e voltar")
            : e("span",{className:"flex-1 text-center text-[12.5px]"},"Escolha uma revendedora da listagem para gravar o valor.")))),
    e("div",{className:"grid grid-cols-2 gap-4"},
      tabelaKit("alto","Tabela de estoque alto","qual kit sai conforme o valor médio"),
      tabelaKit("baixo","Tabela de estoque baixo","use se o estoque estiver baixo · não muda o kit novo","roxo")),
    e(BlocoBarra,{cor:"azul", t:"Comissões e brindes da revendedora", sub:"pelo valor vendido · digite uma venda para destacar a faixa"},
      e("div",{className:"flex flex-nowrap items-center gap-2 px-4 pt-3"},
        e("span",{className:"text-[13px] font-semibold"},"Valor da venda"),
        e("div",{className:"w-48"}, e(VendaInput,{value:vc, label:"Valor da venda", onChange:setVendaCom})),
        comAtual ? e("span",{className:"text-[13px]"}, "Comissão ", e("b",{className:"text-success"}, comAtual.pct+"%"), " · brindes ", e("b",null, BK(comAtual.bn+comAtual.bb)))
          : vc!==null ? e("span",{className:"text-[13px]"},"Abaixo de "+BK(comLista[comLista.length-1].min)+": sem comissão na tabela") : null),
      e("div",{className:"p-3"}, e(TabelaEquipe,{min:"min-w-[44rem]", larg:[null,110,140,140,140], cols:["Vendas","Comissão","Brindes normal","Brindes BB","Total brindes"]},
        comLista.map(function(f,i){ var on = comAtual && comAtual.min===f.min;
          return e("tr",{key:i, className:TR+(on?" bg-info/20 font-bold":"")},
            e(TD,{className:C}, faixaTxt(comLista, i, f)), e(TD,{className:C+MONO+" text-success"}, f.pct+"%"),
            e(TD,{className:C+MONO}, brl(f.bn)), e(TD,{className:C+MONO}, brl(f.bb)), e(TD,{className:C+MONO+" font-semibold text-primary"}, brl(f.bn+f.bb))); })))));
}
function AbaCalculadoraAntiga(){
  return e(EmEspera,{t:"Calculadora de kits", sub:"A calculadora que a Sorelly usa hoje, com a média de vendas e o valor do kit, trazida para dentro do sistema.",
    resumo:"substitui a calculadora separada; o valor sugerido entra direto na listagem",
    itens:["Calcular a média de vendas da revendedora e o kit sugerido pela tabela (estoque alto ou baixo).",
      "Usar as mesmas regras da calculadora atual, sem mudar o resultado.",
      "Levar o valor calculado direto para a listagem, sem digitar de novo.",
      "Guardar quem calculou e quando."],
    falta:["A calculadora atual (o Marcus vai enviar).","As faixas de venda de cada kit (5 a 25 mil) nas duas tabelas."]});
}

export { VendaInput, AbaCalculadora, AbaCalculadoraAntiga };

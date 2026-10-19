// Sorelly Admin — pages/ConfigRepresentantes.js
// Representantes → Configurações: onde se EDITA tudo do consignado e das representantes. A tela "Regras" só mostra.
//   · Regras do consignado: régua de comissão e brinde, taxa, remarcação, pagamento (cria nova versão)
//   · Formas de pagamento: adicionar/retirar formas e as descrições (códigos das contas) de cada uma
//   · Regras internas: prazos e bloqueios das representantes (representante NÃO tem bônus, decisão de 19/10/2026)
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { formasPagamentoPadrao } from "@/apps/montagem/domain/consignado";
import { Din, EditorRegrasConsignado } from "@/apps/montagem/pages/RegrasConsignado";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MONO, NumInput } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

var copia = function(x){ return JSON.parse(JSON.stringify(x)); };
var slug = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,""); };

// ── Formas de pagamento ──
function EditorFormasPagamento(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var atual = s.formasPagamento || formasPagamentoPadrao();
  var fs = useState(function(){ return copia(atual); }), formas = fs[0], setFormas = fs[1];
  var nv = useState({}), novaDesc = nv[0], setNovaDesc = nv[1];     // texto digitado em cada "adicionar descrição"
  var nf = useState(""), novaForma = nf[0], setNovaForma = nf[1];
  var alterou = JSON.stringify(formas) !== JSON.stringify(atual);
  var muda = function(i, patch){ var n = copia(formas); Object.assign(n[i], patch); setFormas(n); };
  var addDesc = function(i){
    var t = (novaDesc[formas[i].k]||"").trim().toUpperCase(); if(!t || formas[i].descricoes.indexOf(t)>=0) return;
    var n = copia(formas); n[i].descricoes.push(t); setFormas(n);
    var o = Object.assign({}, novaDesc); o[formas[i].k] = ""; setNovaDesc(o);
  };
  var delDesc = function(i, j){ var n = copia(formas); n[i].descricoes.splice(j,1); setFormas(n); };
  var addForma = function(){
    var t = novaForma.trim(); if(!t) return;
    var k = slug(t) || "forma"; while(formas.some(function(f){return f.k===k;})) k += "_2";
    setFormas(formas.concat([{k:k, label:t, parcelas:false, descricoes:[]}])); setNovaForma("");
  };
  var delForma = function(i){ var n = copia(formas); n.splice(i,1); setFormas(n); };
  return e("div",{className:"flex flex-col gap-4"},
    e("div",{className:"flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-[#E8B84B]/25"},
      e("span",{className:"text-[13px]"},"É o que aparece na lista de ",e("b",null,"Forma de pagamento")," e ",e("b",null,"Descrição")," quando a representante lança um pagamento. Pagamentos já lançados não mudam."),
      e("div",{className:"flex items-center gap-2"},
        alterou && e("span",{className:"text-[12.5px] font-semibold text-warning"},"Alterações não salvas"),
        e(Btn,{v:"ghost", disabled:!alterou, onClick:function(){ setFormas(copia(atual)); }}, "Descartar"),
        e(Btn,{v:"primary", ic:"save", disabled:!alterou, onClick:function(){ d({type:"FORMAS_PAGAMENTO_SET", formas:formas}); }}, "Salvar formas"))),
    e("div",{className:"grid grid-cols-1 gap-4 xl:grid-cols-2"}, formas.map(function(f,i){
      return e(BlocoBarra,{key:f.k, t:f.label||"(sem nome)", sub:f.descricoes.length+(f.descricoes.length===1?" descrição":" descrições")+(f.parcelas?" · pede parcelas":"")},
        e("div",{className:"flex flex-col gap-3 p-3"},
          e("div",{className:"flex flex-wrap items-center gap-3"},
            e("input",{value:f.label, onChange:function(ev){ muda(i,{label:ev.target.value}); }, "aria-label":"Nome da forma", className:INPUT+" h-9! min-w-0 flex-1 text-sm!"}),
            e("label",{className:"flex items-center gap-1.5 text-[13px]"}, e("input",{type:"checkbox", checked:!!f.parcelas, onChange:function(ev){ muda(i,{parcelas:ev.target.checked}); }, className:"size-4"}), "Pede parcelas (1x a 6x)"),
            e("button",{onClick:function(){ delForma(i); }, className:"h-9 rounded-lg px-3 text-[12.5px] font-semibold text-destructive ring-1 ring-destructive/40 hover:bg-destructive/10"}, "Retirar forma")),
          e("div",{className:"flex max-h-56 flex-col divide-y divide-border overflow-y-auto rounded-lg border border-border"},
            f.descricoes.length===0 && e("p",{className:"px-3 py-2 text-[12.5px] text-muted-foreground"},"Nenhuma descrição ainda."),
            f.descricoes.map(function(t,j){ return e("div",{key:t, className:"flex items-center justify-between gap-2 px-3 py-1.5"},
              e("span",{className:MONO+" text-[12.5px]"}, t),
              e("button",{onClick:function(){ delDesc(i,j); }, "aria-label":"Retirar "+t, className:"grid size-6 place-items-center rounded-full bg-muted text-sm font-bold text-muted-foreground hover:bg-destructive/20 hover:text-destructive"}, "×")); })),
          e("div",{className:"flex gap-2"},
            e("input",{value:novaDesc[f.k]||"", placeholder:"Nova descrição (ex.: PIX - NOVA CONTA - 46)", className:INPUT+" h-9! min-w-0 flex-1 text-sm! uppercase",
              onChange:function(ev){ var o = Object.assign({}, novaDesc); o[f.k] = ev.target.value; setNovaDesc(o); },
              onKeyDown:function(ev){ if(ev.key==="Enter") addDesc(i); }}),
            e(Btn,{v:"ghost", sm:true, onClick:function(){ addDesc(i); }}, "+ Adicionar"))));
    })),
    e("div",{className:"flex gap-2 rounded-xl bg-card p-3 ring-1 ring-border"},
      e("input",{value:novaForma, placeholder:"Nova forma de pagamento (ex.: Cheque)", className:INPUT+" h-9! min-w-0 flex-1 text-sm!",
        onChange:function(ev){ setNovaForma(ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") addForma(); }}),
      e(Btn,{v:"primary", sm:true, onClick:addForma}, "+ Nova forma")));
}

// ── Regras internas das representantes (valores do Configurador geral que mexem com elas) ──
var INTERNAS = [
  {grupo:"Pedido de kit", itens:[
    {c:"prazoPedidoHoras", t:"Antecedência mínima do pedido", u:"horas", tipo:"num", dica:"Pedido com menos tempo entra como atrasado."},
    {c:"kitInicial", t:"Kit para revendedora sem vendas", tipo:"din", dica:"A confirmar."},
    {c:"minVendaApp", t:"Venda do app que preenche sozinha (a partir de)", tipo:"din", dica:"Abaixo disso a Deysiane lança as 3 vendas à mão."},
    {c:"reposicaoMax", t:"Valor máximo de reposição", tipo:"din", dica:"Provisório."}]},
  {grupo:"Avaliação e bloqueio", itens:[
    {c:"recusasBloqueio", t:"Recusas de kit novo para bloquear", u:"recusas", tipo:"num", dica:"Depois disso ela deixa de receber revendedoras novas."},
    {c:"perdaRecusa", t:"Desconto na nota por recusa", tipo:"num", step:"0.1"},
    {c:"perdaDiaParado", t:"Desconto na nota por dia parado", tipo:"num", step:"0.1"},
    {c:"diasParadosTolerancia", t:"Dias parados tolerados", u:"dias", tipo:"num"}]}
];
var GRUPO_AVAL = "Avaliação e bloqueio";
function EditorInternas(p){
  p = p || {};
  var cx = use(), s = cx.state, d = cx.dispatch, c = s.cfg;
  var muda = function(campo, v){ d({type:"CFG", campo:campo, valor:v}); };
  return e("div",{className:"grid grid-cols-1 gap-4 xl:grid-cols-2"}, INTERNAS.filter(function(g){ return p.so ? g.grupo===p.so : g.grupo!==GRUPO_AVAL; }).map(function(g){
    return e(BlocoBarra,{key:g.grupo, t:g.grupo, sub:"valores usados pelo app da representante"},
      e("div",{className:"flex flex-col divide-y divide-border p-2"}, g.itens.map(function(it){
        return e("div",{key:it.c, className:"grid grid-cols-[1fr_9rem] items-center gap-3 px-2 py-2.5"},
          e("div",{className:"min-w-0"}, e("p",{className:"text-[13.5px] font-medium"}, it.t), it.dica && e("p",{className:"text-[11.5px] text-muted-foreground"}, it.dica)),
          e("div",{className:"flex items-center justify-end gap-1.5"},
            it.tipo==="din" ? e(Din,{value:c[it.c]||0, label:it.t, onChange:function(v){ muda(it.c, v); }})
              : e(NumInput,{value:c[it.c], step:it.step, label:it.t, className:"w-full! h-9! text-sm!", onChange:function(v){ muda(it.c, v); }}),
            it.u && e("span",{className:"w-12 shrink-0 text-[12px] text-muted-foreground"}, it.u)));
      })));
  }));
}

var ABAS_CFG = [["consignado","Regras do consignado"],["formas","Formas de pagamento"],["internas","Regras internas"]];
function AbaConfigRepresentantes(){
  var ta = useState("consignado"), aba = ta[0], setAba = ta[1];
  return e(React.Fragment,null,
    e(PageHead,{t:"Configurações das representantes", sub:"Aqui se edita tudo. A tela Regras só mostra o que está configurado, e o app da representante lê dos mesmos números."}),
    e("div",{className:"flex flex-wrap gap-1.5"}, ABAS_CFG.map(function(a){
      return e("button",{key:a[0], onClick:function(){ setAba(a[0]); },
        className:"rounded-lg px-4 py-2 text-[13.5px] font-semibold ring-1 "+(aba===a[0] ? "bg-primary/15 text-primary ring-2 ring-primary" : "bg-card ring-border hover:bg-muted/40")}, a[1]); })),
    aba==="consignado" && e(EditorRegrasConsignado,null),
    aba==="formas" && e(EditorFormasPagamento,null),
    aba==="internas" && e(EditorInternas,null));
}

// as regras da avaliação (nota, bônus, bloqueio) moram na área Avaliações, não no Configurador
function EditorRegrasAvaliacao(){ return e(EditorInternas,{so:GRUPO_AVAL}); }
export { AbaConfigRepresentantes, EditorRegrasAvaliacao };

// Sorelly Admin — pages/ComprasJoias.js
// Representantes → Compras de joias (versão básica): joias que a representante compra da Sorelly. O valor é negociado e os pagamentos
// são lançados dentro de cada compra (forma, conta, data, valor). Quem lança é o financeiro. Melhorias combinadas para depois.
import { fmtDataBR, quemNome, repsEfetivas } from "@/apps/montagem/domain/comissoes";
import { podeFinanceiro } from "@/apps/montagem/domain/equipe";
import { BKC as BK, isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MONO, MoneyInput } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

var SEL = INPUT+" h-9! cursor-pointer text-sm!";
var campo = function(t, filho){ return e("label",{className:"flex flex-col gap-1"}, e("span",{className:"text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"}, t), filho); };

function PagamentoCompra(p){
  var s = p.s, d = p.d, k = p.compra, fin = p.fin, formas = s.formasPagamento||[];
  var st = useState({forma:"pix", conta:"", data:isoDia(new Date()), valor:0}), f = st[0], setF = st[1];
  var forma = formas.find(function(x){ return x.k===f.forma; }) || {descricoes:[]};
  var pago = (k.pagamentos||[]).reduce(function(t,x){ return t+(x.valor||0); }, 0), resta = Math.round((k.valor-pago)*100)/100;
  var valor = f.valor>0 ? f.valor : Math.max(0, resta);
  var pode = fin && valor>0 && f.conta && valor<=resta+0.009;
  return e("div",{className:"flex flex-col gap-2 border-t border-border bg-muted/20 p-3"},
    (k.pagamentos||[]).length>0 && e("div",{className:"flex flex-wrap gap-1.5"}, k.pagamentos.map(function(g,i){ return e("span",{key:i, className:"inline-flex items-center gap-1.5 rounded-md bg-success/15 px-2 py-1 text-[12px] font-semibold text-success"},
      ((formas.find(function(x){ return x.k===g.forma; })||{}).label||g.forma)+" · "+g.conta+" · "+fmtDataBR(g.data)+" · "+BK(g.valor)+" · "+quemNome(g.por),
      fin && e("button",{onClick:function(){ d({type:"COMPRA_REP_PAG", id:k.id, del:i}); }, "aria-label":"Desfazer pagamento", className:"text-[13px] opacity-70 hover:opacity-100"}, "×")); })),
    resta>0.009 ? e("div",{className:"flex flex-wrap items-end gap-2"},
      campo("Forma", e("select",{value:f.forma, disabled:!fin, "aria-label":"Forma do pagamento", className:SEL, onChange:function(ev){ setF(Object.assign({}, f, {forma:ev.target.value, conta:""})); }}, formas.map(function(x){ return e("option",{key:x.k, value:x.k}, x.label); }))),
      campo("Conta", e("select",{value:f.conta, disabled:!fin, "aria-label":"Conta", className:SEL, onChange:function(ev){ setF(Object.assign({}, f, {conta:ev.target.value})); }}, [e("option",{key:"",value:""},"Escolha…")].concat(forma.descricoes.map(function(x){ return e("option",{key:x, value:x}, x); })))),
      campo("Data", e("input",{type:"date", value:f.data, disabled:!fin, className:INPUT+" h-9! text-sm!", onChange:function(ev){ setF(Object.assign({}, f, {data:ev.target.value})); }})),
      campo("Valor", e(MoneyInput,{value:valor, sm:true, label:"Valor do pagamento", className:"w-32", disabled:!fin, onChange:function(v){ setF(Object.assign({}, f, {valor:v})); }})),
      e(Btn,{v:"primary", sm:true, ic:"check", disabled:!pode, onClick:function(){ d({type:"COMPRA_REP_PAG", id:k.id, por:s.usuario, pag:{forma:f.forma, conta:f.conta, data:f.data, valor:valor}}); setF(Object.assign({}, f, {valor:0})); }}, "Adicionar pagamento"))
    : e("b",{className:"text-[13px] text-success"},"Compra quitada"));
}

function AbaComprasJoias(){
  var cx = use(), s = cx.state, d = cx.dispatch, fin = podeFinanceiro(s.usuario);
  var nomes = repsEfetivas(s).map(function(x){ return x.nome; });
  var st = useState({rep:"", desc:"", data:isoDia(new Date()), valor:0}), f = st[0], setF = st[1];
  var lista = s.comprasRep||[];
  var pagoDe = function(k){ return (k.pagamentos||[]).reduce(function(t,x){ return t+(x.valor||0); }, 0); };
  var tTotal = lista.reduce(function(t,k){ return t+k.valor; }, 0), tPago = lista.reduce(function(t,k){ return t+pagoDe(k); }, 0);
  var add = function(){ d({type:"COMPRA_REP_ADD", por:s.usuario, compra:{rep:f.rep, desc:f.desc.trim(), data:f.data, valor:f.valor}}); setF(Object.assign({}, f, {desc:"", valor:0})); };
  return e(React.Fragment,null,
    e(PageHead,{t:"Compras de joias", sub:"Joias que as representantes compram da Sorelly. A compra é negociada e os pagamentos entram dentro dela."}),
    !fin && e("p",{className:"rounded-lg bg-warning/10 px-3 py-2 text-[12.5px] font-semibold text-warning"},"Você só consulta: o financeiro lança as compras e os pagamentos."),
    e("section",{className:"flex flex-wrap items-end gap-3 rounded-xl bg-linear-to-br from-[#E8B84B]/10 via-card to-card p-4 ring-1 ring-[#E8B84B]/20"},
      campo("Representante", e("select",{value:f.rep, disabled:!fin, "aria-label":"Representante", className:SEL, onChange:function(ev){ setF(Object.assign({}, f, {rep:ev.target.value})); }}, [e("option",{key:"",value:""},"Escolha…")].concat(nomes.map(function(n){ return e("option",{key:n, value:n}, n); })))),
      campo("O que comprou", e("input",{value:f.desc, disabled:!fin, placeholder:"Ex.: 20 colares", className:INPUT+" h-9! w-56 text-sm!", onChange:function(ev){ setF(Object.assign({}, f, {desc:ev.target.value})); }})),
      campo("Data", e("input",{type:"date", value:f.data, disabled:!fin, className:INPUT+" h-9! text-sm!", onChange:function(ev){ setF(Object.assign({}, f, {data:ev.target.value})); }})),
      campo("Valor negociado", e(MoneyInput,{value:f.valor, sm:true, label:"Valor negociado", className:"w-36", disabled:!fin, onChange:function(v){ setF(Object.assign({}, f, {valor:v})); }})),
      e(Btn,{v:"primary", sm:true, ic:"check", disabled:!fin || !f.rep || !(f.valor>0), onClick:add}, "Registrar compra")),
    e("div",{className:"grid grid-cols-3 gap-2"}, [["Total das compras", BK(tTotal), ""],["Pago", BK(tPago), "text-success"],["Restante", BK(tTotal-tPago), tTotal-tPago>0.009 ? "text-warning" : ""]].map(function(x){
      return e("div",{key:x[0], className:"flex flex-col rounded-lg bg-linear-to-b from-[#3A2912]/40 to-card px-3 py-2 ring-1 ring-[#E8B84B]/20"},
        e("span",{className:"text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground"}, x[0]), e("b",{className:MONO+" text-[17px] "+x[2]}, x[1])); })),
    lista.length===0 ? e("p",{className:"rounded-xl bg-card px-4 py-6 text-center text-[13px] text-muted-foreground ring-1 ring-border"},"Nenhuma compra registrada ainda.")
    : e("div",{className:"flex flex-col gap-3"}, lista.map(function(k){
      var pago = pagoDe(k), resta = Math.round((k.valor-pago)*100)/100;
      return e("div",{key:k.id, className:"overflow-hidden rounded-xl ring-2 ring-[#8C6A3F]/70"},
        e("div",{className:"flex flex-wrap items-center justify-between gap-3 bg-linear-to-r from-[#3A2912] via-[#5C4322] to-[#86653A] px-4 py-3 text-[#F1E4C6]"},
          e("div",{className:"min-w-0"}, e("b",{className:"block font-heading text-[15px]"}, k.rep+" · "+fmtDataBR(k.data)), e("span",{className:"block text-[12px] opacity-80"}, k.desc || "Compra de joias")),
          e("div",{className:"flex items-center gap-4"},
            [["Valor", k.valor, ""],["Pago", pago, "text-[#4ADE80]"],["Restante", resta, resta>0.009 ? "text-[#F87171]" : ""]].map(function(x){ return e("div",{key:x[0], className:"flex min-w-[5.5rem] flex-col items-end"}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-wide opacity-80"}, x[0]), e("b",{className:MONO+" text-[15px] "+x[2]}, BK(x[1]))); }),
            fin && pago<=0 && e("button",{onClick:function(){ d({type:"COMPRA_REP_DEL", id:k.id}); }, "aria-label":"Apagar compra", className:"text-[16px] opacity-70 hover:opacity-100"}, "×"))),
        e(PagamentoCompra,{s:s, d:d, compra:k, fin:fin})); })));
}

export { AbaComprasJoias };

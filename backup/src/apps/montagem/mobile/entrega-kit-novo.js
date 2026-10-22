// Sorelly Admin — mobile/entrega-kit-novo.js
// Entrega de kit novo no app da representante: marca as condicionais enviadas, confere as peças (divergência),
// lê as regras uma a uma e colhe a assinatura digital da revendedora.
import { condNovas, condNums } from "@/apps/montagem/domain/condicionais";
import { textoRegras } from "@/apps/montagem/domain/consignado";
import { pecasPara } from "@/apps/montagem/domain/regras";
import { CartaoPasso, TelaAssinatura } from "@/apps/montagem/mobile/assinatura";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";
import React from "react";

// Condicionais do kit (as da montagem e a nova digitada na bipagem). O total de peças vem da tabela "o que vai em cada kit"
// (Configurador) pelo valor do kit, dividido igual entre as condicionais — até existir a contagem real por condicional.
function pecasPorCondicional(s, k){
  var nums = condNums(k).concat(condNovas(k)).filter(function(n, i, a){ return n && a.indexOf(n)===i; });
  var pc = pecasPara(k.valor, s.cfg);
  var total = pc ? pc.itens.reduce(function(t,i){ return t+(Number(i.q)||0); }, 0) : 0;
  if(!nums.length) return {total:total, lista:[]};
  var base = Math.floor(total/nums.length), resto = total - base*nums.length;
  return {total:total, lista:nums.map(function(n,i){ return {numero:n, pecas:base + (i===0 ? resto : 0)}; })};
}

var CAMPO = "h-9 rounded-lg bg-white px-2 text-[13px] text-[#111827] outline-none ring-1 ring-black/10";

function EntregaKitNovo(p){
  var s = p.s, k = p.k;
  var info = pecasPorCondicional(s, k);
  var mn = useState([]), manuais = mn[0], setManuais = mn[1];          // condicionais digitadas na hora: {numero, pecas}
  var fm = useState({numero:"", pecas:""}), formManual = fm[0], setFormManual = fm[1];
  var sl = useState(info.lista.map(function(c){return c.numero;})), selecionadas = sl[0], setSelecionadas = sl[1];
  var cf = useState(null), conferencia = cf[0], setConferencia = cf[1];      // null | "ok" | "falta"
  var fl = useState(1), faltaram = fl[0], setFaltaram = fl[1];
  var ob = useState(""), obs = ob[0], setObs = ob[1];
  var todas = info.lista.concat(manuais);
  var pecasSel = todas.filter(function(c){ return selecionadas.indexOf(c.numero)>=0; }).reduce(function(t,c){ return t+c.pecas; }, 0);
  var alterna = function(n){ var o = selecionadas.slice(), i = o.indexOf(n); if(i>=0) o.splice(i,1); else o.push(n); setSelecionadas(o); setConferencia(null); };
  var manualOk = formManual.numero.length>=3 && Number(formManual.pecas)>0 && !todas.some(function(c){ return c.numero===formManual.numero; });
  var addManual = function(){
    if(!manualOk) return;
    setManuais(manuais.concat([{numero:formManual.numero, pecas:Number(formManual.pecas)}]));
    setSelecionadas(selecionadas.concat([formManual.numero])); setFormManual({numero:"", pecas:""}); setConferencia(null);
  };
  var conferenciaOk = selecionadas.length>0 && pecasSel>0 && (conferencia==="ok" || (conferencia==="falta" && faltaram>=1 && faltaram<=pecasSel));
  var faltouN = conferencia==="falta" ? faltaram : 0;
  var passo1 = e(CartaoPasso,{key:"p1", n:1, titulo:"Condicionais enviadas", cor:"#CA8A04", ok:selecionadas.length>0,
      direita: selecionadas.length ? pecasSel+" peças" : null},
    todas.length===0 && e("p",null,"Nenhuma condicional vinculada a este kit ainda. Digite o número da condicional que está sendo enviada e a quantidade de peças."),
    todas.map(function(c){ var on = selecionadas.indexOf(c.numero)>=0;
      return e("label",{key:c.numero, className:"flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 "+(on ? "bg-amber-50" : "bg-[#F4F5F7]")},
        e("span",{className:"flex items-center gap-2 text-[13px] font-semibold text-[#111827]"},
          e("input",{type:"checkbox", checked:on, onChange:function(){ alterna(c.numero); }, className:"size-4"}), "Condicional "+c.numero),
        e("span",{className:MONO+" text-[12.5px] text-[#6B7280]"}, c.pecas+" peças")); }),
    e("div",{className:"flex items-center gap-1.5 rounded-xl border border-dashed border-[#D9C58A] p-2"},
      e("input",{value:formManual.numero, inputMode:"numeric", placeholder:"Nº da condicional", "aria-label":"Número da condicional",
        onChange:function(ev){ setFormManual(Object.assign({}, formManual, {numero:ev.target.value.replace(/\D/g,"").slice(0,8)})); }, className:CAMPO+" min-w-0 flex-1 "+MONO}),
      e("input",{value:formManual.pecas, inputMode:"numeric", placeholder:"Peças", "aria-label":"Quantidade de peças",
        onChange:function(ev){ setFormManual(Object.assign({}, formManual, {pecas:ev.target.value.replace(/\D/g,"").slice(0,4)})); }, className:CAMPO+" w-16 text-right "+MONO}),
      e("button",{disabled:!manualOk, onClick:addManual, className:"h-9 shrink-0 rounded-lg bg-[#C9A13B] px-3 text-[12px] font-bold txt-branco disabled:opacity-40"}, "Adicionar")),
    selecionadas.length>0 && e("p",{className:"border-t border-[#E9DDBB] pt-2 text-[13px] font-bold text-[#A67C12]"},"Total enviado: "+pecasSel+" peças"));
  var passo2 = e(CartaoPasso,{key:"p2", n:2, titulo:"Conferência das peças", cor:"#16A34A", ok:conferenciaOk, travado:selecionadas.length===0 || pecasSel===0,
      direita: conferenciaOk ? (faltouN ? faltouN+" em falta" : "tudo certo") : null},
    e("p",null,"Confira com a revendedora: no kit devem estar as ",e("b",{className:"text-[#111827]"}, pecasSel+" peças"),"."),
    e("div",{className:"flex gap-2"},
      e("button",{onClick:function(){ setConferencia("ok"); }, className:"h-10 flex-1 rounded-xl text-[12.5px] font-bold txt-branco "+(conferencia==="ok" ? "bg-[#16A34A]" : "bg-[#16A34A]/60")}, "Tem todas as peças"),
      e("button",{onClick:function(){ setConferencia("falta"); }, className:"h-10 flex-1 rounded-xl text-[12.5px] font-bold txt-branco "+(conferencia==="falta" ? "bg-[#D97706]" : "bg-[#D97706]/60")}, "Faltou peça")),
    conferencia==="falta" && e("div",{className:"flex flex-col gap-2 rounded-xl bg-amber-50 p-2.5"},
      e("div",{className:"flex items-center justify-between gap-2"},
        e("span",{className:"text-[12.5px] font-semibold text-amber-900"},"Quantas peças faltaram?"),
        e("div",{className:"flex items-center gap-2"},
          e("button",{onClick:function(){ setFaltaram(Math.max(1, faltaram-1)); }, "aria-label":"Menos uma", className:"size-8 rounded-lg bg-white font-bold ring-1 ring-black/10"},"−"),
          e("b",{className:MONO+" w-7 text-center text-[15px]"}, faltaram),
          e("button",{onClick:function(){ setFaltaram(Math.min(pecasSel, faltaram+1)); }, "aria-label":"Mais uma", className:"size-8 rounded-lg bg-white font-bold ring-1 ring-black/10"},"+"))),
      e("input",{value:obs, onChange:function(ev){ setObs(ev.target.value); }, placeholder:"Quais peças faltaram? (opcional)", className:CAMPO+" w-full"})));
  var versao = p.versao;
  return e(TelaAssinatura,{titulo:"Entrega de kit novo", nome:k.rev, modo:"lista", regras:versao ? textoRegras(versao, versao.modalidade) : [],
    passosAntes:[passo1, passo2], antesOk:conferenciaOk, rotuloBotao:"Concluir entrega do kit novo", onVoltar:p.onVoltar,
    onConcluir:function(r){
      p.d({type:"KITNOVO_ENTREGAR", id:k.id, condicionais:selecionadas, pecasTotal:pecasSel, pecasFaltaram:faltouN, obsDivergencia:faltouN ? obs : "",
        regrasLidas:r.regrasLidas, assinatura:r.assinatura});
      p.onConcluido();
    }});
}

export { EntregaKitNovo, pecasPorCondicional };

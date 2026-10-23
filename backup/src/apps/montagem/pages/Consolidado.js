// Sorelly Admin · montagem e bipagem — pages/Consolidado.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { ListagemHistorico } from "@/apps/montagem/components/listagem-historico";
import { BK, hoje, isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { Vazio } from "@/apps/montagem/ui/card";
import { Icon } from "@/apps/montagem/ui/icon";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

function AbaConsolidado(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var hoje = new Date(), trinta = new Date(hoje.getTime() - 30*86400000);
  var fr = useState("todas"), rep = fr[0], setRep = fr[1];
  var fd = useState({de:isoDia(trinta), ate:isoDia(hoje)}), dt = fd[0], setDt = fd[1];
  var fb = useState(""), buscaTxt = fb[0], setBusca = fb[1];
  var ar = useState({}), repAb = ar[0], setRepAb = ar[1];
  var al = useState({}), lstAb = al[0], setLstAb = al[1];
  var busca = buscaTxt.trim().toLowerCase();
  var hist = s.histListagens || [];
  var reps = hist.map(function(h){return h.rep;}).filter(function(r,i,a){return a.indexOf(r)===i;}).sort();
  var ini = new Date(dt.de+"T00:00:00").getTime(), fim = new Date(dt.ate+"T23:59:59").getTime();
  var lista = hist.filter(function(h){
    if(rep!=="todas" && h.rep!==rep) return false;
    if(dt.de && h.ts < ini) return false;
    if(dt.ate && h.ts > fim) return false;
    if(busca && !(h.kits||[]).some(function(k){return k.rev.toLowerCase().indexOf(busca)>=0;})) return false;
    return true; }).sort(function(a,b){return b.ts-a.ts;});
  var grupos = reps.map(function(r){ return {rep:r, itens:lista.filter(function(h){return h.rep===r;})}; }).filter(function(g){return g.itens.length;});
  var totKits = lista.reduce(function(t,h){return t+h.qtd;},0), totValor = lista.reduce(function(t,h){return t+h.total;},0);
  // com busca por revendedora, abre automaticamente onde ela aparece
  var repAberto = function(r){ return busca ? true : !!repAb[r]; };
  var lstAberta = function(h){ return busca ? true : !!lstAb[h.id]; };
  var alt = function(obj, set, k){ var o = Object.assign({}, obj); o[k] = !o[k]; set(o); };
  var selCls = "h-10 cursor-pointer rounded-lg border border-primary/50 bg-primary/10 pl-9 pr-3 text-sm font-semibold outline-none hover:bg-primary/15 focus:ring-3 focus:ring-ring/50";
  var dataCls = "h-10 rounded-lg border border-primary/50 bg-primary/10 px-2 text-sm font-semibold outline-none focus:ring-3 focus:ring-ring/50 [color-scheme:dark]";
  return e(React.Fragment,null,
    e(PageHead,{t:"Consolidado", sub:"Histórico das listagens concluídas. Um bloco por representante; abra para ver as listagens e clique numa listagem para ver os kits."}),
    e("div",{className:"flex flex-wrap items-center gap-2"},
      e("div",{className:"relative"},
        e(Icon,{n:"user", s:16, className:"pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary"}),
        e("select",{value:rep, "aria-label":"Representante", onChange:function(ev){setRep(ev.target.value);}, className:selCls},
          e("option",{value:"todas"},"Todas as representantes"), reps.map(function(r){return e("option",{key:r, value:r}, r);}))),
      e("label",{className:"flex items-center gap-1.5 text-sm"}, e(Icon,{n:"clock", s:16, className:"text-primary"}), "De",
        e("input",{type:"date", value:dt.de, max:dt.ate, onChange:function(ev){setDt({de:ev.target.value, ate:dt.ate});}, className:dataCls})),
      e("label",{className:"flex items-center gap-1.5 text-sm"},"até",
        e("input",{type:"date", value:dt.ate, min:dt.de, onChange:function(ev){setDt({de:dt.de, ate:ev.target.value});}, className:dataCls})),
      e("div",{className:"relative"}, e(Icon,{n:"search", s:16, className:"pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"}),
        e("input",{className:INPUT+" w-56 pl-9 text-sm!", placeholder:"Buscar revendedora", value:buscaTxt, onChange:function(ev){setBusca(ev.target.value);}})),
      e("span",{className:"inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm"},
        e("b",null, lista.length), lista.length===1?" listagem":" listagens", e("span",{className:"text-muted-foreground"},"·"), e("b",null, totKits), " kits",
        e("span",{className:"text-muted-foreground"},"·"), e("b",{className:MONO+" text-primary"}, BK(totValor))),
      e("div",{className:"ml-auto flex h-10 items-center gap-1 rounded-lg border border-border px-1"},
        e(Btn,{v:"ghost", sm:true, ic:"chevrondown", onClick:function(){ var o={}; grupos.forEach(function(g){o[g.rep]=true;}); setRepAb(o); }},"Abrir todas"),
        e(Btn,{v:"ghost", sm:true, ic:"chevron", onClick:function(){ setRepAb({}); setLstAb({}); }},"Fechar todas"))),
    grupos.length===0 ? e(Vazio,{txt: busca ? "Nenhuma listagem com essa revendedora no período." : "Nenhuma listagem concluída nesse período."}) :
    e("div",{className:"flex flex-col gap-3"}, grupos.map(function(g){
      var aberto = repAberto(g.rep), kits = g.itens.reduce(function(t,h){return t+h.qtd;},0), valor = g.itens.reduce(function(t,h){return t+h.total;},0);
      var divs = g.itens.reduce(function(t,h){return t+h.divs;},0), atras = g.itens.reduce(function(t,h){return t+(h.atrasados||0);},0);
      return e("div",{key:g.rep, className:"overflow-hidden rounded-xl ring-2 ring-[#8C6A3F]/70"},
        // faixa da representante (tom bronze, diferente das listagens)
        e("button",{onClick:function(){ alt(repAb, setRepAb, g.rep); }, "aria-expanded":aberto,
            // grade com colunas fixas: todas as representantes ficam alinhadas
            className:"grid w-full grid-cols-[10rem_8rem_6rem_8.5rem_minmax(0,1fr)_12rem_9rem] items-center gap-3 bg-linear-to-r from-[#3A2912] via-[#5C4322] to-[#86653A] px-4 py-3 text-left text-[#F1E4C6] shadow-[inset_0_1px_0_rgba(255,255,255,.12)]"},
          e("span",{className:"inline-flex min-w-0 items-center gap-2 font-heading text-base font-bold"}, e(Icon,{n: aberto?"chevrondown":"chevron", s:17}), e("span",{className:"truncate"}, g.rep)),
          e("span",{className:"justify-self-start rounded-md bg-black/25 px-2 py-0.5 text-[13px] font-semibold"}, g.itens.length+(g.itens.length===1?" listagem":" listagens")),
          e("span",{className:"text-sm"}, kits+" kits"),
          e("span",{className:MONO+" text-sm font-semibold text-[#F3D98B]"}, BK(valor)),
          e("span",{className:"truncate text-sm opacity-80"},"última em "+(g.itens[0].hoje ? "hoje" : g.itens[0].data)),
          e("span",{className:"justify-self-end"}, atras>0 && e("span",{className:"rounded-md bg-[#9A4A00] px-2 py-0.5 text-[12px] font-semibold text-white", title:"Kits pedidos com menos de "+s.cfg.prazoPedidoHoras+" h de antecedência"}, atras+(atras>1?" enviados atrasados":" enviado atrasado"))),
          e("span",{className:"justify-self-end"}, divs>0 && e("span",{className:"rounded-md bg-[#7A1F1F] px-2 py-0.5 text-[12px] font-semibold text-white"}, divs+(divs>1?" divergências":" divergência")))),
        aberto && e("div",{className:"flex flex-col gap-2 overflow-x-auto bg-card/40 p-3"}, g.itens.map(function(h){
          return e(ListagemHistorico,{key:h.id, h:h, busca:busca, aberta:lstAberta(h), alternar:function(){ alt(lstAb, setLstAb, h.id); }, reabrir:function(lid){ d({type:"REABRIR", lid:lid}); }});
        })));
    })));
}

export { AbaConsolidado };

// Sorelly Admin · kits novos Curitiba — pages/Consolidado.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { ehIdAnuncio, listaDe, nomeEntrada } from "@/apps/kits-novos/domain/config";
import { aberto, atrasado, mesDe } from "@/apps/kits-novos/domain/etapas";
import { MESES, diasEntre } from "@/apps/kits-novos/lib/datas";
import { N1 } from "@/apps/kits-novos/lib/format";
import { use } from "@/apps/kits-novos/state/context";
import { Card, KPI } from "@/apps/kits-novos/ui/card";
import { PageHead, Secao } from "@/apps/kits-novos/ui/page";
import { TD, TR, Tabela } from "@/apps/kits-novos/ui/table";
import { e } from "@/shared/react";
import React from "react";

function Barras(p){
  var max = Math.max.apply(null, p.dados.map(function(x){return x.v;}).concat([1])), W = 720, H = 150, bw = W/p.dados.length;
  return e("svg",{viewBox:"0 0 "+W+" "+(H+28), className:"w-full max-w-3xl", role:"img", "aria-label":p.label}, p.dados.map(function(x,i){ var h = x.v/max*H;
    return e("g",{key:i}, e("rect",{x:i*bw+8, y:H-h, width:bw-16, height:h, rx:4, className:"fill-primary"}),
      e("text",{x:i*bw+bw/2, y:H-h-6, textAnchor:"middle", className:"fill-foreground font-mono text-[13px]"}, x.v),
      e("text",{x:i*bw+bw/2, y:H+20, textAnchor:"middle", className:"fill-muted-foreground text-[12px]"}, x.l)); }));
}
function AbaConsolidado(p){
  // ano corrente pela data de cadastro (como no admin antigo); os abertos de anos anteriores aparecem nas outras telas
  var s = use().state, ano = String(new Date().getFullYear()), ds = s.dados.filter(function(c){ return String(c.cad||"").slice(0, 4)===ano; }), cfg = s.cfg;
  var idAn = function(c){ return c.entId || (ehIdAnuncio(c.ent) ? c.ent : ""); };
  var mesesCom = MESES.filter(function(m){ return ds.some(function(c){return mesDe(c)===m;}); });
  var porMes = mesesCom.map(function(m){ return {l:m.slice(0,3), v:ds.filter(function(c){return mesDe(c)===m;}).length}; });
  var linha = function(g){ var en = g.filter(function(c){return c.st==="entregue" || c.st==="devolvido";}), ca = g.filter(function(c){return c.st==="cancelado";});
    var t = en.filter(function(c){return c.cad&&c.ret;}).map(function(c){return diasEntre(c.cad,c.ret);});
    return {n:g.length, en:en.length, ca:ca.length, ab:g.filter(aberto).length, atr:g.filter(function(c){return atrasado(c,cfg);}).length, t:t.length?t.reduce(function(a,b){return a+b;},0)/t.length:0}; };
  var tab = function(t, chave, lista, fmt){ return e(Secao,{t:t}, e(Tabela,{min:"min-w-[44rem]", cols:[{t:t.replace("Por ","")},{t:"Entradas",r:1},{t:"Entregues",r:1},{t:"Canceladas",r:1},{t:"Em aberto",r:1},{t:"Atrasadas",r:1},{t:"Tempo m\u00e9dio",r:1}]},
    lista.map(function(g){ var r = linha(ds.filter(function(c){return chave(c)===g;})); return e("tr",{key:g, className:TR}, e(TD,{className:"font-medium"}, fmt?fmt(g):(g||"(vazio)")), e(TD,{r:true}, r.n), e(TD,{r:true, className:"text-success"}, r.en),
      e(TD,{r:true, className:r.ca?"text-warning":""}, r.ca), e(TD,{r:true}, r.ab), e(TD,{r:true, className:r.atr?"text-destructive":""}, r.atr), e(TD,{r:true}, r.en?N1(r.t)+" d":"\u2014")); }))); };
  var canc = ds.filter(function(c){return c.st==="cancelado";}).length;
  var campanhas = listaDe(ds.map(function(c){ return {id:idAn(c)}; }).filter(function(x){ return x.id; }), "id");
  var pct = function(n){ return ds.length ? N1(n/ds.length*100)+"%" : "0%"; }, melhor = porMes.slice().sort(function(a,b){return b.v-a.v;})[0];
  var entregues = ds.filter(function(c){return c.st==="entregue" || c.st==="devolvido";}).length;
  return e(React.Fragment,null,
    e(PageHead,{t:"Consolidado", sub:"Todas as regi\u00f5es, cadastros de "+ano+" at\u00e9 hoje."}),
    e("div",{className:"grid grid-cols-2 gap-3 lg:grid-cols-4"},
      e(KPI,{l:"Entradas no ano", v:ds.length}), e(KPI,{l:"Entregues", v:entregues, tom:"text-success", sub:pct(entregues)}),
      e(KPI,{l:"Canceladas", v:canc, tom:"text-warning", sub:pct(canc)}), e(KPI,{l:"Melhor m\u00eas", v:melhor ? melhor.l : "\u2014", sub:"mais entradas"})),
    e(Secao,{t:"Entradas por m\u00eas"}, e(Card,null, e(Barras,{dados:porMes, label:"Entradas por m\u00eas"}))),
    e("div",{className:"grid grid-cols-1 gap-5 xl:grid-cols-2"}, tab("Por entrada", function(c){return c.ent;}, p.listas.ents.slice(0,10)), tab("Por campanha", idAn, campanhas, function(id){ return nomeEntrada({ent:"An\u00fancio", entId:id}, cfg); })),
    e("div",{className:"grid grid-cols-1 gap-5 xl:grid-cols-2"}, tab("Por representante", function(c){return c.rep;}, p.listas.reps.slice(0,15)), tab("Por cidade", function(c){return c.cid;}, p.listas.cids.slice(0,12))));
}

export { Barras, AbaConsolidado };

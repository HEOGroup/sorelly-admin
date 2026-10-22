// Sorelly Admin · montagem e bipagem — pages/Relatorios.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { BlocoBarra, ResumoCategorias } from "@/apps/montagem/components/equipe-blocos";
import { TIPO_KIT } from "@/apps/montagem/domain/status";
import { BK, N1, hoje, isoDia } from "@/apps/montagem/lib/format";
import { MESES_ABR } from "@/apps/montagem/mobile/representante";
import { use } from "@/apps/montagem/state/context";
import { KPI } from "@/apps/montagem/ui/card";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { TD, TH, TR } from "@/apps/montagem/ui/table";
import { e, useState } from "@/shared/react";
import React from "react";

function GraficoDia(p){
  var dados = p.dados, W = Math.max(dados.length*30, 300), H = 210, top = 22, base = H-40;
  var mx = Math.max.apply(null, dados.map(function(x){return x[p.campo];}).concat([1]));
  var passo = Math.ceil(dados.length/45);
  return e("div",{className:"overflow-x-auto"},
    e("svg",{viewBox:"0 0 "+W+" "+H, className:"h-56 w-full min-w-[36rem]", preserveAspectRatio:"none", role:"img", "aria-label":p.titulo},
      [0.25,0.5,0.75,1].map(function(f,i){ var y = base - (base-top)*f; return e("line",{key:"g"+i, x1:0, x2:W, y1:y, y2:y, stroke:"currentColor", strokeOpacity:.08}); }),
      dados.map(function(x,i){
        var v = x[p.campo], h = (base-top)*v/mx, xx = i*30 + 5;
        return e("g",{key:x.iso},
          e("rect",{x:xx, y:base-h, width:20, height:Math.max(h, v?2:0), rx:3, fill:p.cor}, e("title",null, x.dia+": "+p.fmt(v)+(p.campo==="v" ? " · "+x.q+" kits" : " · "+BK(x.v)))),
          v>0 && dados.length<=31 && e("text",{x:xx+10, y:base-h-5, textAnchor:"middle", fontSize:9.5, fontWeight:600, fill:"currentColor"}, p.curto(v)),
          // mês em cima (só no começo do período e no dia 1), número do dia embaixo de cada barra
          (i===0 || x.dd===1) && e("text",{x:xx, y:base+15, textAnchor:"start", fontSize:10, fontWeight:700, fill:"#D9A63A", letterSpacing:1}, x.mm.toUpperCase()),
          (i===0 || x.dd===1) && i>0 && e("line",{x1:xx-5, x2:xx-5, y1:top, y2:H-4, stroke:"#D9A63A", strokeOpacity:.35, strokeDasharray:"3 3"}),
          (dados.length<=45 || i%passo===0) && e("text",{x:xx+10, y:H-8, textAnchor:"middle", fontSize:10.5, fontWeight:600, fill:"currentColor"}, x.dd));
      })));
}
function AbaRelatorios(){
  var s = use().state;
  var hoje = new Date(), trinta = new Date(hoje.getTime() - 30*86400000);
  var fr = useState("todas"), rep = fr[0], setRep = fr[1];
  var fd = useState({de:isoDia(trinta), ate:isoDia(hoje)}), dt = fd[0], setDt = fd[1];
  var ft = useState({}), tipos = ft[0], setTipos = ft[1];
  var filtroTipo = Object.keys(tipos).filter(function(t){return tipos[t];});
  var passaTipo = function(k){ return !filtroTipo.length || filtroTipo.indexOf(k.tipoKit||"acerto_kit")>=0; };
  // registros: histórico + o que já foi bipado hoje nas listagens abertas
  var hojeAbertos = s.listagens.filter(function(l){return !l.fechada;}).map(function(l){
    var ks = s.kits.filter(function(k){return k.lid===l.id && k.fimB;});
    return {id:"A"+l.id, rep:l.rep, ts:Date.now(), kits:ks.map(function(k){return {valor:k.valor, real:k.valorReal, tipoKit:k.tipoKit, rev:k.rev};})}; }).filter(function(h){return h.kits.length;});
  var todos = (s.histListagens||[]).concat(hojeAbertos);
  var reps = todos.map(function(h){return h.rep;}).filter(function(r,i,a){return a.indexOf(r)===i;}).sort();
  var ini = new Date(dt.de+"T00:00:00").getTime(), fim = new Date(dt.ate+"T23:59:59").getTime();
  var lista = todos.filter(function(h){ return (rep==="todas" || h.rep===rep) && h.ts>=ini && h.ts<=fim; })
    .map(function(h){ return Object.assign({}, h, {kits:(h.kits||[]).filter(passaTipo)}); });
  // série diária
  var dias = [], mapa = {};
  for(var t = ini; t <= fim; t += 86400000){ var dd = new Date(t), iso = isoDia(dd);
    var o = {iso:iso, dia:String(dd.getDate()).padStart(2,"0")+"/"+String(dd.getMonth()+1).padStart(2,"0"), dd:dd.getDate(), mm:MESES_ABR[dd.getMonth()], q:0, v:0}; dias.push(o); mapa[iso] = o; }
  lista.forEach(function(h){ var o = mapa[isoDia(new Date(h.ts))]; if(!o) return;
    h.kits.forEach(function(k){ o.q++; o.v += k.valor || 0; }); });
  var totQ = dias.reduce(function(a,x){return a+x.q;},0), totV = dias.reduce(function(a,x){return a+x.v;},0);
  var diasCom = dias.filter(function(x){return x.q>0;}), melhor = diasCom.slice().sort(function(a,b){return b.v-a.v;})[0];
  var comValor = lista.reduce(function(a,h){return a + h.kits.filter(function(k){return k.valor;}).length;},0);
  var curtoK = function(v){ return v>=1000000 ? N1(v/1000000)+"M" : v>=1000 ? Math.round(v/1000)+"k" : String(v); };
  var porRep = reps.map(function(r){ var hs = lista.filter(function(h){return h.rep===r;});
    var q = hs.reduce(function(a,h){return a+h.kits.length;},0), v = hs.reduce(function(a,h){return a+h.kits.reduce(function(b,k){return b+(k.valor||0);},0);},0);
    return {rep:r, n:hs.filter(function(h){return h.kits.length;}).length, q:q, v:v}; }).filter(function(x){return x.q;}).sort(function(a,b){return b.v-a.v;});
  var selCls = "h-10 cursor-pointer rounded-lg border border-primary/50 bg-primary/10 pl-9 pr-3 text-sm font-semibold outline-none hover:bg-primary/15 focus:ring-3 focus:ring-ring/50";
  var dataCls = "h-10 rounded-lg border border-primary/50 bg-primary/10 px-2 text-sm font-semibold outline-none focus:ring-3 focus:ring-ring/50 [color-scheme:dark]";
  var chipT = function(t, lb){ var on = t==="todos" ? !filtroTipo.length : !!tipos[t];
    return e("button",{key:t, onClick:function(){ if(t==="todos") setTipos({}); else { var o = Object.assign({}, tipos); o[t] = !o[t]; setTipos(o); } },
      className:"h-8 rounded-full border px-3 text-[12.5px] font-semibold transition-colors "+(on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted")}, lb); };
  var C = "py-2! px-3! text-center! ";
  return e(React.Fragment,null,
    e(PageHead,{t:"Relatórios", sub:"Quantos kits saíram por dia e quanto valeram. Filtre por período, representante e tipo de item."}),
    e("div",{className:"flex flex-wrap items-center gap-2"},
      e("div",{className:"relative"},
        e(Icon,{n:"user", s:16, className:"pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary"}),
        e("select",{value:rep, "aria-label":"Representante", onChange:function(ev){setRep(ev.target.value);}, className:selCls},
          e("option",{value:"todas"},"Todas as representantes"), reps.map(function(r){return e("option",{key:r, value:r}, r);}))),
      e("label",{className:"flex items-center gap-1.5 text-sm"}, e(Icon,{n:"clock", s:16, className:"text-primary"}), "De",
        e("input",{type:"date", value:dt.de, max:dt.ate, onChange:function(ev){setDt({de:ev.target.value, ate:dt.ate});}, className:dataCls})),
      e("label",{className:"flex items-center gap-1.5 text-sm"},"até",
        e("input",{type:"date", value:dt.ate, min:dt.de, onChange:function(ev){setDt({de:dt.de, ate:ev.target.value});}, className:dataCls}))),
    e("div",{className:"flex flex-wrap items-center gap-1.5"}, chipT("todos","Todos"), Object.keys(TIPO_KIT).map(function(t){ return chipT(t, TIPO_KIT[t][1]); })),
    e("div",{className:"grid grid-cols-2 gap-2 md:grid-cols-5"},
      e(KPI,{compacto:true, l:"Kits no período", v:totQ, sub:diasCom.length+" dias com saída"}),
      e(KPI,{compacto:true, l:"Valor em kits", v:BK(totV), tom:"text-primary"}),
      e(KPI,{compacto:true, l:"Valor médio do kit", v:BK(comValor ? totV/comValor : 0), sub:"itens com kit"}),
      e(KPI,{compacto:true, l:"Média por dia", v:diasCom.length ? N1(totQ/diasCom.length)+" kits" : "—", sub:diasCom.length ? BK(totV/diasCom.length)+" por dia" : ""}),
      e(KPI,{compacto:true, l:"Melhor dia", v:melhor ? melhor.dia : "—", sub:melhor ? melhor.q+" kits · "+BK(melhor.v) : ""})),
    e(BlocoBarra,{t:"Valor em kits por dia", sub:"soma do valor dos kits que saíram em cada dia"},
      e("div",{className:"p-3 text-foreground"}, e(GraficoDia,{dados:dias, campo:"v", cor:"#D9A63A", fmt:BK, curto:curtoK, titulo:"Valor em kits por dia"}))),
    e(BlocoBarra,{cor:"azul", t:"Kits por dia", sub:"quantidade de itens da listagem em cada dia"},
      e("div",{className:"p-3 text-foreground"}, e(GraficoDia,{dados:dias, campo:"q", cor:"#3B82F6", fmt:function(v){return v+" kits";}, curto:String, titulo:"Kits por dia"}))),
    lista.some(function(h){return h.kits.length;}) && e(ResumoCategorias,{lista:lista, rep:rep}),
    porRep.length>0 && e(BlocoBarra,{t:"Por representante", sub:"no período e nos tipos filtrados"},
      e("table",{className:"w-full border-collapse text-sm"},
        e("thead",null, e("tr",{className:"bg-sidebar"}, ["Representante","Listagens","Kits","Valor em kits","Valor médio"].map(function(c,i){ return e(TH,{key:i, className:"py-2! text-center! text-[12px]! tracking-normal!"}, c); }))),
        e("tbody",null, porRep.map(function(x){ return e("tr",{key:x.rep, className:TR},
          e(TD,{className:C+"font-medium"}, x.rep), e(TD,{className:C+MONO}, x.n), e(TD,{className:C+MONO}, x.q),
          e(TD,{className:C+MONO+" font-semibold text-primary"}, BK(x.v)), e(TD,{className:C+MONO}, BK(x.q ? x.v/x.q : 0))); })))));
}

export { GraficoDia, AbaRelatorios };

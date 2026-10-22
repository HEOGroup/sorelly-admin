// Sorelly Admin · kits novos Curitiba — components/filtros.js
// Uma única barra de filtros alinhada: busca, representante, cidade, entrada, mês, atrasadas e limpar.
import { ETAPAS, aberto, atrasado, mesDe } from "@/apps/kits-novos/domain/etapas";
import { MESES } from "@/apps/kits-novos/lib/datas";
import { use } from "@/apps/kits-novos/state/context";
import { Icon } from "@/apps/kits-novos/ui/icon";
import { MONO } from "@/apps/kits-novos/ui/input";
import { e } from "@/shared/react";

function filtrar(s){ var f = s.filtro, b = f.busca.toLowerCase();
  return s.dados.filter(function(c){
    if(b && (c.nome+" "+c.bai+" "+c.cid+" "+c.rep).toLowerCase().indexOf(b)<0) return false;
    if(f.st && c.st!==f.st) return false; if(f.rep && c.rep!==f.rep) return false; if(f.cid && c.cid!==f.cid) return false;
    if(f.mes && mesDe(c)!==f.mes) return false; if(f.ent && c.ent!==f.ent) return false;
    if(f.so==="atrasadas" && !atrasado(c, s.cfg)) return false; if(f.so==="abertos" && !aberto(c)) return false;
    return true; }); }
function Chip(p){ return e("button",{onClick:p.onClick, className:"inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium "+(p.on?"border-primary bg-primary/15 text-primary":"border-border bg-card text-foreground hover:bg-muted/50")},
  p.children, e("span",{className:MONO+" rounded-md px-1.5 text-xs "+(p.on?"bg-primary/20":"bg-muted")}, p.n)); }

var CTRL = "h-9 w-full rounded-lg border border-input bg-input/30 pl-9 pr-2 text-sm font-medium outline-none placeholder:text-muted-foreground focus:ring-3 focus:ring-ring/50";
var CAIXA = "relative min-w-[10.5rem] flex-1 basis-[10.5rem] max-w-[15rem]";

// p.ocultar = lista de filtros que não fazem sentido na tela atual (ex.: ["rep","cid","ent","so"]).
function Filtros(p){
  var cx = use(), s = cx.state, d = cx.dispatch, f = s.filtro, up = function(k,v){ var o={}; o[k]=v; d({type:"FILTRO", f:o}); };
  var oc = p.ocultar || [], vis = function(k){ return oc.indexOf(k)<0; };
  var sel = function(k, lb, ops, ic){ return vis(k) && e("div",{className:CAIXA}, e(Icon,{n:ic, s:15, className:"pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary"}),
    e("select",{className:CTRL, value:f[k], "aria-label":lb, onChange:function(ev){up(k, ev.target.value);}},
      e("option",{value:""}, lb), ops.map(function(o){ return e("option",{key:o, value:o}, o); }))); };
  var l = p.listas, atras = s.dados.filter(function(c){return atrasado(c,s.cfg);}).length;
  var algum = f.busca||f.st||(vis("rep")&&f.rep)||(vis("cid")&&f.cid)||f.mes||(vis("ent")&&f.ent)||(vis("so")&&f.so);
  return e("div",{className:"flex flex-wrap items-center justify-center gap-2"},
    e("div",{className:CAIXA+" max-w-[18rem] basis-[13rem]"}, e(Icon,{n:"search", s:15, className:"pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"}),
      e("input",{className:CTRL, placeholder:p.placeholder||"Buscar revendedora", value:f.busca, onChange:function(ev){up("busca", ev.target.value);}})),
    sel("rep","Representante", l.reps, "user"), sel("cid","Cidade", l.cids, "map"), sel("ent","Entrada", l.ents, "flag"),
    sel("mes","Todos os meses", MESES.filter(function(m){return l.meses.indexOf(m)>=0;}), "calendar"),
    vis("so") && atras>0 && e("button",{type:"button", onClick:function(){up("so", f.so==="atrasadas"?"":"atrasadas");}, className:"inline-flex h-9 flex-none items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-medium "+(f.so==="atrasadas"?"border-destructive bg-destructive/20 text-destructive":"border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15")},
      e(Icon,{n:"alert", s:14}), atras+(atras>1?" atrasadas":" atrasada")),
    algum && e("button",{type:"button", onClick:function(){d({type:"FILTRO", f:{busca:"", st:"", rep:"", cid:"", mes:"", ent:"", so:""}});}, className:"inline-flex h-9 flex-none items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-muted-foreground hover:bg-muted/50"},
      e(Icon,{n:"x", s:14}), "Limpar"),
    e("span",{className:"flex-none text-sm text-muted-foreground"}, p.n+(p.rotulo||" revendedoras")));
}
// Mantido só para uso eventual (filtro por etapa); não aparece mais no Quadro.
function ChipsStatus(p){
  var cx = use(), s = cx.state, d = cx.dispatch, ds = p.base, f = s.filtro;
  var n = function(k){ return ds.filter(function(c){return c.st===k;}).length; };
  return e("div",{className:"flex flex-wrap justify-center gap-2"},
    e(Chip,{on:!f.st, n:ds.length, onClick:function(){d({type:"FILTRO", f:{st:""}});}},"Todas"),
    ETAPAS.concat([{k:"cancelado", nome:"Cancelado"}]).map(function(et){ return e(Chip,{key:et.k, on:f.st===et.k, n:n(et.k), onClick:function(){d({type:"FILTRO", f:{st: f.st===et.k?"":et.k}});}}, et.nome); }));
}

export { filtrar, Chip, Filtros, ChipsStatus };

// Sorelly Admin · kits novos Curitiba — components/entregues.js
// Listagem dos kits novos entregues, do mais recente para o mais antigo.
import { dataBR, diasEntre, tsDe } from "@/apps/kits-novos/lib/datas";
import { use } from "@/apps/kits-novos/state/context";
import { Vazio } from "@/apps/kits-novos/ui/card";
import { MONO } from "@/apps/kits-novos/ui/input";
import { e, useState } from "@/shared/react";

var TH = "border-b border-border px-2 py-2 text-center text-[12px] font-semibold uppercase tracking-wide text-muted-foreground";
var TD = "px-2 py-2 text-center text-sm";

function Entregues(p){
  var cx = use(), s = cx.state, d = cx.dispatch, vm = useState(100), lim = vm[0];
  var cs = p.dados.filter(function(c){ return c.st==="entregue"; }).sort(function(a,b){ return (tsDe(b.ret)||0)-(tsDe(a.ret)||0); });
  if(!cs.length) return e(Vazio,{txt:"Nenhum kit entregue neste filtro."});
  var dias = cs.map(function(c){ return diasEntre(c.cad, c.ret); }).filter(function(x){ return x!=null && x>=0; });
  var media = dias.length ? dias.reduce(function(a,b){return a+b;},0)/dias.length : 0;
  return e("div",{className:"flex flex-col gap-2"},
    e("p",{className:"text-center text-sm text-muted-foreground"}, e("b",{className:"text-foreground"}, cs.length+(cs.length===1?" kit entregue":" kits entregues")), " · média de "+media.toLocaleString("pt-BR",{maximumFractionDigits:1})+" dias do cadastro à entrega"),
    e("div",{className:"overflow-hidden rounded-xl border border-border bg-card"},
      e("table",{className:"w-full table-auto border-collapse"},
        e("thead",{className:"bg-sidebar"}, e("tr",null,
          e("th",{className:TH},"Revendedora"), e("th",{className:TH},"Representante"), e("th",{className:TH+" hidden md:table-cell"},"Cidade"),
          e("th",{className:TH+" hidden sm:table-cell"},"Cadastro"), e("th",{className:TH},"Entrega"), e("th",{className:TH},"Dias"))),
        e("tbody",null, cs.slice(0, lim).map(function(c){ var n = diasEntre(c.cad, c.ret);
          return e("tr",{key:c.id, className:"border-b border-border last:border-0 hover:bg-muted/40"},
            e("td",{className:TD},
              e("button",{type:"button", className:"font-medium hover:underline", onClick:function(){ d({type:"DIALOGO", d:{tipo:"detalhe", id:c.id}}); }}, c.nome),
              e("p",{className:"text-[12px] text-muted-foreground md:hidden"}, c.cid||"—")),
            e("td",{className:TD}, c.rep || e("span",{className:"text-warning"},"sem representante")),
            e("td",{className:TD+" hidden md:table-cell"}, c.cid||"—"),
            e("td",{className:TD+" "+MONO+" hidden sm:table-cell"}, dataBR(c.cad)),
            e("td",{className:TD+" "+MONO}, dataBR(c.ret)),
            e("td",{className:TD+" "+MONO+" font-semibold "+(n!=null && n<=s.cfg.metaDias?"text-success":"text-warning")}, n==null?"—":n)); })))),
    cs.length>lim && e("button",{type:"button", onClick:function(){ vm[1](lim+200); }, className:"mx-auto rounded-lg border border-border px-4 py-1.5 text-sm font-medium hover:bg-muted/50"}, "Ver mais "+Math.min(200, cs.length-lim)));
}

export { Entregues };

// Sorelly Admin · montagem e bipagem — components/tabela-pecas-ver.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { TabelaEquipe } from "@/apps/montagem/components/equipe-blocos";
import { textoPeca } from "@/apps/montagem/domain/config";
import { use } from "@/apps/montagem/state/context";
import { MONO } from "@/apps/montagem/ui/input";
import { TD, TR } from "@/apps/montagem/ui/table";
import { e } from "@/shared/react";
import React from "react";

function ehSugPeca(c, l, j){ return !!l.sug || (c.pecasSugCat||[]).indexOf(j)>=0; }
function TabelaPecasVer(){
  var c = use().state.cfg, ks = c.pecasKit;
  var C = "py-1.5! px-1! text-center! "+MONO;
  return e(React.Fragment,null,
    e(TabelaEquipe,{min:"min-w-[62rem]", larg:[180].concat(ks.map(function(){return null;})), cols:["Peça"].concat(ks.map(function(l){ return (l.kit/1000)+" mil"+(l.sug?" *":""); }))},
      c.categorias.map(function(nome, j){ return e("tr",{key:nome, className:TR},
        e(TD,{className:"py-1.5! px-3! text-left! font-medium"+((c.pecasSugCat||[]).indexOf(j)>=0?" text-warning":"")}, nome),
        ks.map(function(l,i){ var q = l.q[j], sg = ehSugPeca(c, l, j);
          return e(TD,{key:i, className:C+(q===null||q===undefined?" text-muted-foreground":sg?" text-warning":""), title: sg ? "Sugestão, a confirmar" : ""}, textoPeca(l, j)); })); }),
      e("tr",{className:"bg-primary/10 font-semibold"}, e(TD,{className:"py-1.5! px-3! text-left!"},"Total de peças"),
        ks.map(function(l,i){ return e(TD,{key:i, className:C+" text-primary"}, l.q.reduce(function(t,x){return t+(x||0);},0)); }))),
    e("p",{className:"text-[12.5px]"}, e("span",{className:"font-semibold text-warning"},"Em laranja: sugestão para confirmar"), " (kits de 9, 14, 16, 18, 20 e 25 mil, que não estavam na tabela, e a linha de anéis, que agora sobe junto com o valor do kit)."));
}

export { ehSugPeca, TabelaPecasVer };

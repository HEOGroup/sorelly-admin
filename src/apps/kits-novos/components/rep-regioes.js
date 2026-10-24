// Sorelly Admin · kits novos Curitiba — components/rep-regioes.js
// Representantes › Regiões: onde cada representante atende (mapa enviado por elas), em tabela, e a cobertura por região (1 pessoa só = alerta; 3 ou mais = rodízio).
// Clicar numa representante abre a janela de Editar, onde as regiões são BLOCOS que se adicionam e se excluem (components/rep-regioes-editor.js).
import { Bloco, FaixaTotais, Segmentado, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { cobertura, mapeada, todasReps } from "@/apps/kits-novos/domain/indicacao";
import { use } from "@/apps/kits-novos/state/context";
import { badge } from "@/apps/kits-novos/ui/badge";
import { e, useState } from "@/shared/react";

var resumo = function(a, max){ return a.slice(0, max).join(", ")+(a.length>max ? "  +"+(a.length-max) : ""); };
var SIT = {unica:["Única","destructive","alert"], rodizio:["Rodízio","info"], ok:["Ok","success","check"]};

function RepRegioes(){
  var cx = use(), s = cx.state, d = cx.dispatch, reps = todasReps(s), cob = cobertura(s);
  var fl = useState("todas"), filtro = fl[0];
  var mapeadas = reps.filter(function(x){ return mapeada(x.p); }).length, unicas = cob.filter(function(r){ return r.situacao==="unica"; }).length, rodizio = cob.filter(function(r){ return r.situacao==="rodizio"; }).length;
  var editar = function(nome){ d({type:"DIALOGO", d:{tipo:"perfilrep", nome:nome}}); };
  var linhas = cob.filter(function(r){ return filtro==="todas" || r.situacao===filtro; });
  var curitiba = function(p){ return p.curTodos ? "Inteira · "+p.cur.length+" citados" : p.cur.length ? resumo(p.cur, 5) : "—"; };
  var cidades = function(a){ return resumo(a.map(function(x){ return x.c+(x.b && x.b.length ? " ("+x.b.length+")" : ""); }), 4); };
  return e("div",{className:"flex flex-col gap-3"},
    e(FaixaTotais,{itens:[{t:"Mapeadas", v:mapeadas+" de "+reps.length, cor:"text-success"}, {t:"Pendentes", v:String(reps.length-mapeadas), cor:reps.length-mapeadas ? "text-warning" : ""},
      {t:"Regiões", v:String(cob.length)}, {t:"Cobertura única", v:String(unicas), cor:unicas ? "text-destructive" : ""}, {t:"Com rodízio", v:String(rodizio)}]}),
    e(Bloco,{t:"Mapa de regiões"},
      e(TabelaP,{minW:1420, cols:[{t:"Representante", w:170}, {t:"Situação", w:128}, {t:"Curitiba"}, {t:"Região metropolitana"}, {t:"P. Grossa", w:80}, {t:"Outras cidades", w:190}, {t:"Prioridade", w:140}, {t:"Não atende", w:140}, {t:"", w:84}]},
        reps.map(function(it){ var p = mapeada(it.p) ? it.p : null;
          return e(Tr,{key:it.nome, onClick:function(){ editar(it.nome); }},
            e(Td,{forte:true, title:p && p.completo ? p.completo+(it.func ? " (também funcionária)" : "") : it.nome+(it.func ? " (também funcionária)" : "")}, it.nome+(it.func ? " ◆" : "")),
            e(Td,null, p ? badge("Mapeada","success","check") : badge("Pendente","warning","clock")),
            e(Td,{title:p ? p.cur.join(", ") : ""}, p ? curitiba(p) : "—"),
            e(Td,{title:p ? (p.rmcTodos ? "Região inteira. " : "")+p.rmc.map(function(x){ return x.c+(x.b && x.b.length ? " ("+x.b.join(", ")+")" : ""); }).join(", ") : ""}, p ? (p.rmcTodos ? "Inteira · " : "")+cidades(p.rmc) : "—"),
            e(Td,null, p ? (p.pg ? "Sim" : "—") : "—"),
            e(Td,{title:p ? p.outras.map(function(x){ return x.c+(x.b && x.b.length ? " ("+x.b.join(", ")+")" : ""); }).join(", ") : ""}, p && p.outras.length ? cidades(p.outras) : "—"),
            e(Td,{title:p ? p.prior.join(", ") : ""}, p && p.prior.length ? p.prior.join(", ") : "—"),
            e(Td,{title:p ? (p.nao||[]).map(function(x){ return x.c+(x.b && x.b.length ? " ("+x.b.join(", ")+")" : ""); }).join(", ") : ""}, p && (p.nao||[]).length ? cidades(p.nao) : "—"),
            e(Td,null, e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); editar(it.nome); }, className:"inline-flex h-6 items-center rounded-md border border-border px-2 text-[12px] hover:bg-white/10"}, p ? "Editar" : "Mapear")));
        }))),
    e(Bloco,{t:"Cobertura por região", dir:e(Segmentado,{opcoes:[["todas","Todas"],["unica","Única"],["rodizio","Rodízio"],["ok","Ok"]], atual:filtro, onMudar:fl[1]})},
      e(TabelaP,{minW:760, cols:[{t:"Grupo", w:170}, {t:"Região", w:200}, {t:"Representantes"}, {t:"Quantas", w:80, n:1}, {t:"Situação", w:120}]},
        linhas.map(function(r){ var sit = SIT[r.situacao];
          return e(Tr,{key:r.grupo+r.regiao, alerta:r.situacao==="unica"},
            e(Td,null, r.grupo), e(Td,{forte:true}, r.regiao), e(Td,{title:r.reps.join(", ")}, r.reps.join(", ")), e(Td,{n:true}, String(r.n)), e(Td,null, badge(sit[0], sit[1], sit[2])));
        }))));
}

export { RepRegioes };

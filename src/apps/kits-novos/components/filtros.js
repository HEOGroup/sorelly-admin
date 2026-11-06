// Sorelly Admin · kits novos Curitiba — components/filtros.js
// Bloco "Filtros" no topo, no padrão do Financeiro: grade de 4 colunas iguais, controles de 32 px, rótulo em cima.
import { Botao, CAMPO, Rotulo } from "@/apps/montagem/components/padrao-fin";
import { aberto, atrasado, mesDe } from "@/apps/kits-novos/domain/etapas";
import { MESES } from "@/apps/kits-novos/lib/datas";
import { use } from "@/apps/kits-novos/state/context";
import { e } from "@/shared/react";

function filtrar(s){ var f = s.filtro, b = f.busca.toLowerCase();
  return s.dados.filter(function(c){
    if(b && (c.nome+" "+c.bai+" "+c.cid+" "+(c.prof||"")+" "+c.rep).toLowerCase().indexOf(b)<0) return false;
    if(f.st && c.st!==f.st) return false; if(f.rep && c.rep!==f.rep) return false; if(f.cid && c.cid!==f.cid) return false;
    if(f.mes && mesDe(c)!==f.mes) return false; if(f.ent && c.ent!==f.ent) return false;
    if(f.so==="atrasadas" && !atrasado(c, s.cfg)) return false; if(f.so==="abertos" && !aberto(c)) return false;
    return true; }); }

var LIMPO = {busca:"", st:"", rep:"", cid:"", mes:"", ent:"", so:""};

// p.ocultar = lista de filtros que não fazem sentido na tela atual (ex.: ["so"]). p.fim = peça colocada no fim da linha (o seletor Quadro/Planilha).
// Compacto (Marcus, 05/11/2026): uma linha só, campos de 32 px, sem barra de título.
var FC = "h-8 w-full min-w-0 rounded-md border border-border bg-card px-2 text-[11px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary";   // campo de 32 px com texto de 11 px
function Filtros(p){
  var cx = use(), s = cx.state, d = cx.dispatch, f = s.filtro, up = function(k,v){ var o={}; o[k]=v; d({type:"FILTRO", f:o}); };
  var oc = p.ocultar || [], vis = function(k){ return oc.indexOf(k)<0; }, l = p.listas;
  var ops = function(lista, todos){ return [["", todos]].concat(lista.map(function(o){ return [o, o]; })); };
  var atras = s.dados.filter(function(c){return atrasado(c,s.cfg);}).length;
  var algum = f.busca||f.st||(vis("rep")&&f.rep)||(vis("cid")&&f.cid)||f.mes||(vis("ent")&&f.ent)||(vis("so")&&f.so);
  var sel = function(k, rot, opcoes){ return e("div",{key:k, className:"w-32 min-w-0"}, e(Rotulo,{t:rot, id:"kn-"+k}), e("select",{id:"kn-"+k, value:f[k], className:FC, onChange:function(ev){ up(k, ev.target.value); }}, opcoes.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }))); };
  return e("section",{className:"rounded-lg border border-border bg-card/60 p-2"},
    e("div",{className:"flex items-end gap-2"},
      e("div",{className:"min-w-0 flex-1"}, e(Rotulo,{t:"Buscar", id:"kn-busca"}), e("input",{id:"kn-busca", type:"search", value:f.busca, placeholder:p.placeholder||"Nome, bairro, cidade ou profissão", className:FC, onChange:function(ev){ up("busca", ev.target.value); }})),
      vis("rep") && sel("rep", "Representante", ops(l.reps, "Todas")), vis("cid") && sel("cid", "Cidade", ops(l.cids, "Todas")), vis("ent") && sel("ent", "Entrada", ops(l.ents, "Todas")),
      sel("mes", "Mês", ops(MESES.filter(function(m){return l.meses.indexOf(m)>=0;}), "Todos")),
      vis("so") && sel("so", "Situação", [["", "Todas"], ["abertos", "Em aberto"], ["atrasadas", "Atrasadas ("+atras+")"]]),
      algum && e(Botao,{onClick:function(){ d({type:"FILTRO", f:LIMPO}); }}, "Limpar"),
      p.fim && e("div",{className:"ml-auto"}, p.fim)));
}

export { filtrar, Filtros };

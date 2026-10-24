// Sorelly Admin · kits novos Curitiba — components/filtros.js
// Bloco "Filtros" no topo, no padrão do Financeiro: grade de 4 colunas iguais, controles de 32 px, rótulo em cima.
import { Botao, BlocoFiltros, CampoBusca, CampoSel } from "@/apps/montagem/components/padrao-fin";
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

// p.ocultar = lista de filtros que não fazem sentido na tela atual (ex.: ["rep","cid","ent","so"]).
function Filtros(p){
  var cx = use(), s = cx.state, d = cx.dispatch, f = s.filtro, up = function(k,v){ var o={}; o[k]=v; d({type:"FILTRO", f:o}); };
  var oc = p.ocultar || [], vis = function(k){ return oc.indexOf(k)<0; }, l = p.listas;
  var ops = function(lista, todos){ return [["", todos]].concat(lista.map(function(o){ return [o, o]; })); };
  var atras = s.dados.filter(function(c){return atrasado(c,s.cfg);}).length;
  var algum = f.busca||f.st||(vis("rep")&&f.rep)||(vis("cid")&&f.cid)||f.mes||(vis("ent")&&f.ent)||(vis("so")&&f.so);
  var sel = function(k, rot, todos, lista){ return vis(k) && e(CampoSel,{key:k, t:rot, id:"kn-"+k, value:f[k], opcoes:ops(lista, todos), onChange:function(v){ up(k, v); }}); };
  return e(BlocoFiltros,null,
    e(CampoBusca,{t:"Buscar", id:"kn-busca", value:f.busca, placeholder:p.placeholder||"Nome, bairro, cidade ou profissão", onChange:function(v){ up("busca", v); }}),
    sel("rep", "Representante", "Todas", l.reps), sel("cid", "Cidade", "Todas", l.cids), sel("ent", "Entrada", "Todas", l.ents),
    e(CampoSel,{t:"Mês", id:"kn-mes", value:f.mes, opcoes:ops(MESES.filter(function(m){return l.meses.indexOf(m)>=0;}), "Todos"), onChange:function(v){ up("mes", v); }}),
    vis("so") && e(CampoSel,{key:"so", t:"Situação", id:"kn-so", value:f.so, onChange:function(v){ up("so", v); },
      opcoes:[["", "Todas"], ["abertos", "Em aberto"], ["atrasadas", "Atrasadas ("+atras+")"]]}),
    algum && e("div",{key:"limpar", className:"flex items-end justify-end"}, e(Botao,{onClick:function(){ d({type:"FILTRO", f:LIMPO}); }}, "Limpar")));
}

export { filtrar, Filtros };

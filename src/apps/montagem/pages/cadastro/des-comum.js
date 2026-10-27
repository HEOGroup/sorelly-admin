// Sorelly Admin · montagem — pages/cadastro/des-comum.js
// Peças comuns do Desempenho do cadastro, no padrão do Financeiro (23/10/2026): bloco "Filtros" no topo com o período (vale para todas as abas), números e datas.
// Todos os números vêm de domain/cadastro-leads.js (estado s.cl); aqui só se desenha.
import { BlocoFiltros, CAMPO, CampoSel, Rotulo } from "@/apps/montagem/components/padrao-fin";
import { hojeSP } from "@/apps/montagem/domain/cadastro-leads";
import { e } from "@/shared/react";

var nInt = function(n){ return Number(n||0).toLocaleString("pt-BR"); };
var nPct = function(n){ return Number(n||0).toLocaleString("pt-BR", {minimumFractionDigits:0, maximumFractionDigits:1})+"%"; };
var dbr = function(iso){ return iso ? String(iso).slice(0, 10).split("-").reverse().join("/") : ""; };
var hora = function(iso){ return iso && String(iso).length>=16 ? String(iso).slice(11, 16) : ""; };
var mesBr = function(m){ return m ? m.slice(5, 7)+"/"+m.slice(0, 4) : ""; };

var PERIODO0 = function(){ return {modo:"dias", dias:30, mes:hojeSP().slice(0, 7), de:"", ate:""}; };
var OPCOES = [["d7","7 dias"], ["d15","15 dias"], ["d30","30 dias"], ["d60","60 dias"], ["d90","90 dias"], ["mes","Mês"], ["tudo","Tudo"], ["intervalo","De / até"]];
var chaveDe = function(f){ return f.modo==="dias" ? "d"+f.dias : f.modo; };
function paramsDe(f){
  if(f.modo==="dias") return {dias:f.dias};
  if(f.modo==="tudo") return {dias:0};
  if(f.modo==="mes") return f.mes ? {mes:f.mes} : {};
  if(f.modo==="intervalo") return f.de && f.ate ? {from:f.de, to:f.ate} : {dias:30};
  return {dias:30};
}
function textoPeriodo(per){ return per.tudo && !per.from ? "Tudo até "+dbr(per.to) : dbr(per.from)+" a "+dbr(per.to); }

function CampoData(p){
  return e("div",{className:"min-w-0"}, e(Rotulo,{t:p.t, id:p.id}),
    e("input",{id:p.id, type:p.tipo||"date", value:p.value||"", onChange:function(ev){ p.onChange(ev.target.value); }, className:CAMPO}));
}

// bloco Filtros do Desempenho: período + o que cada aba acrescentar (p.children)
function FiltrosDesempenho(p){
  var f = p.f, set = function(k, v){ var n = Object.assign({}, f); n[k] = v; p.set(n); };
  var muda = function(k){ var n = Object.assign({}, f); if(k[0]==="d" && k.length>1){ n.modo = "dias"; n.dias = Number(k.slice(1)); } else n.modo = k; p.set(n); };
  return e(BlocoFiltros,null,
    e(CampoSel,{key:"per", t:"Período", id:"des-per", value:chaveDe(f), opcoes:OPCOES, onChange:muda}),
    f.modo==="mes" && e(CampoData,{key:"mes", t:"Mês", id:"des-mes", tipo:"month", value:f.mes, onChange:function(v){ if(v) set("mes", v); }}),
    f.modo==="intervalo" && e(CampoData,{key:"de", t:"De", id:"des-de", value:f.de, onChange:function(v){ set("de", v); }}),
    f.modo==="intervalo" && e(CampoData,{key:"ate", t:"Até", id:"des-ate", value:f.ate, onChange:function(v){ set("ate", v); }}),
    p.children);
}

// barra horizontal proporcional (0 a 100) para dentro de uma célula
function BarraPct(p){
  return e("div",{className:"mx-auto h-2 w-full max-w-40 overflow-hidden rounded-full bg-white/10"}, e("i",{className:"block h-full rounded-full", style:{width:Math.max(p.pct>0 ? 3 : 0, Math.min(100, p.pct))+"%", background:p.cor||"#E8B84B"}}));
}

export { nInt, nPct, dbr, hora, mesBr, PERIODO0, paramsDe, textoPeriodo, FiltrosDesempenho, CampoData, BarraPct };

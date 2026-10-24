// Sorelly Admin · kits novos Curitiba — pages/RepCadastro.js
// CADASTRO DAS REPRESENTANTES do setor (23/10/2026): uma linha (ou cartão) por representante com as regiões que atende, os dias e períodos, quantas revendedoras ela tem
// (lidas do AGENDAMENTO: cota do mês) e quantos kits novos já estão com ela. Regra do Marcus: acima de 120 revendedoras o ideal é NÃO mandar kit novo (pode, mas não é o ideal);
// o ideal é fortalecer quem tem menos, porque quem tem muita revendedora não atende bem. Os limites ficam em domain/indicacao.js.
import { Bloco, BlocoFiltros, Botao, CampoBusca, CampoSel, FaixaTotais, Segmentado, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { emCurso } from "@/apps/kits-novos/domain/etapas";
import { FORTALECER_ATE, LIMITE_REV, cotaDe, faixaCarga, mapeada, norm, slotsDe, todasReps } from "@/apps/kits-novos/domain/indicacao";
import { DIAS } from "@/apps/kits-novos/domain/regioes-rep";
import { revendedorasPorRep } from "@/apps/kits-novos/lib/bridge-montagem";
import { use } from "@/apps/kits-novos/state/context";
import { PageHead } from "@/apps/kits-novos/ui/page";
import { e, useState } from "@/shared/react";

var FAIXA = {fortalecer:["Fortalecer", "text-success"], normal:["Normal", ""], evitar:["Evitar kit novo", "text-destructive"]};
var LETRA = {m:"M", t:"T", n:"N"};
var resumo = function(a, max){ return a.slice(0, max).join(", ")+(a.length>max ? "  +"+(a.length-max) : ""); };
var nomes = function(a){ return (a||[]).map(function(x){ return x.c; }); };

// uma linha de dados por representante (mapa de regiões + Agendamento + kits novos em aberto)
function linhas(s){
  var mapa = revendedorasPorRep(), abertos = {};
  s.dados.forEach(function(c){ if(c.rep && emCurso(c)) abertos[c.rep] = (abertos[c.rep]||0)+1; });
  return todasReps(s).map(function(it){
    var p = it.p, cota = cotaDe(it.nome, mapa);
    return {nome:it.nome, func:it.func, p:p, mapa:mapeada(p), cota:cota, faixa:faixaCarga(cota), kits:abertos[it.nome]||0, cur:p ? (p.curTodos ? "Curitiba inteira" : resumo(p.cur, 4)) : "", curTodos:p ? p.cur.join(", ") : "", obs:p ? (p.obs||"") : "",
      rmc:p ? (p.rmcTodos ? "Região inteira · " : "")+resumo(nomes(p.rmc), 3) : "", outras:p ? resumo(nomes(p.outras).concat(p.pg ? ["Ponta Grossa"] : []), 3) : "", sim:p && slotsDe(p.jan).length>0 && p.sim, tem:p && slotsDe(p.jan).length>0};
  });
}

function MiniSemana(p){
  var jan = (p.p && p.p.jan) || {};
  return e("div",{className:"grid grid-cols-7 gap-px"}, DIAS.map(function(d){ var v = String(jan[d[0]]||"");
    return e("div",{key:d[0], title:d[1]+(v ? ": "+v.split("").map(function(l){ return LETRA[l]; }).join(" ") : ": não atende"), className:"flex h-8 flex-col items-center justify-center rounded border border-border text-[10px] leading-tight "+(v ? "bg-primary/15 font-semibold" : "text-foreground/40")},
      e("span",null, d[1].slice(0, 1)), e("span",null, v ? v.split("").map(function(l){ return LETRA[l]; }).join("") : "—")); }));
}

function Cartao(p){
  var r = p.r, f = FAIXA[r.faixa], pct = r.cota ? Math.min(100, r.cota/LIMITE_REV*100) : 0;
  return e("div",{className:"flex flex-col gap-2 rounded-lg border border-border bg-card/60 p-3"},
    e("div",{className:"flex items-center justify-between gap-2"}, e("b",{className:"truncate text-[14px]", title:r.nome}, r.nome+(r.func ? " ◆" : "")),
      e("span",{className:"shrink-0 rounded-md border px-2 text-[11px] font-semibold "+(r.mapa ? "border-success/40 bg-success/15 text-success" : "border-warning/40 bg-warning/15 text-warning")}, r.mapa ? "Mapeada" : "Pendente")),
    e("div",{className:"flex items-end justify-between gap-2"},
      e("div",null, e("div",{className:"text-[11px] uppercase tracking-[.05em]"}, "Revendedoras"), e("div",{className:"text-[22px] font-semibold leading-none tabular-nums "+(f ? f[1] : "")}, r.cota==null ? "—" : String(r.cota))),
      e("div",{className:"text-right"}, e("div",{className:"text-[11px] uppercase tracking-[.05em]"}, "Kits novos"), e("div",{className:"text-[22px] font-semibold leading-none tabular-nums"}, String(r.kits)))),
    e("div",{className:"h-1.5 overflow-hidden rounded-full bg-white/10", title:r.cota==null ? "Sem número no Agendamento" : r.cota+" de "+LIMITE_REV+" revendedoras"}, e("i",{className:"block h-full rounded-full", style:{width:pct+"%", background:r.faixa==="evitar" ? "#F87171" : r.faixa==="fortalecer" ? "#4ADE80" : "#E8B84B"}})),
    e("div",{className:"text-[12px] font-semibold "+(f ? f[1] : "text-foreground/50")}, f ? f[0] : "Sem número do Agendamento"),
    e("div",{className:"flex flex-col gap-0.5 text-[12px]"},
      e("div",{className:"truncate", title:r.curTodos}, e("b",null, "Curitiba: "), r.mapa ? r.cur || "—" : "—"),
      e("div",{className:"truncate"}, e("b",null, "Região: "), r.rmc || "—"),
      e("div",{className:"truncate"}, e("b",null, "Outras: "), r.outras || "—")),
    r.tem ? e(MiniSemana,{p:r.p}) : null,
    r.obs ? e("div",{className:"truncate text-[11.5px]", title:r.obs}, e("b",null, "Obs.: "), r.obs) : null,
    e("div",{className:"flex justify-between gap-2"}, e("span",{className:"text-[11px]"}, r.tem ? (r.sim ? "Horários: simulação" : "Horários: informados") : "Sem horários"),
      e(Botao,{onClick:p.editar}, r.mapa || r.tem ? "Editar" : "Mapear")));
}

function AbaRepCadastro(){
  var cx = use(), s = cx.state, d = cx.dispatch, vs = useState("planilha"), vista = vs[0], st = useState({q:"", faixa:"", mapa:""}), f = st[0];
  var up = function(k, v){ var n = Object.assign({}, f); n[k] = v; st[1](n); };
  var todas = linhas(s), termos = norm(f.q).split(/\s+/).filter(Boolean);
  var lista = todas.filter(function(r){
    if(f.faixa && r.faixa!==f.faixa) return false; if(f.mapa==="sim" && !r.mapa) return false; if(f.mapa==="nao" && r.mapa) return false;
    var t = norm([r.nome, r.cur, r.rmc, r.outras].join(" ")); return termos.every(function(w){ return t.indexOf(w)>=0; });
  });
  var comNumero = todas.filter(function(r){ return r.cota!=null; }), total = comNumero.reduce(function(t, r){ return t+r.cota; }, 0);
  var acima = todas.filter(function(r){ return r.faixa==="evitar"; }).length, fortalecer = todas.filter(function(r){ return r.faixa==="fortalecer"; }).length;
  var editar = function(nome){ d({type:"DIALOGO", d:{tipo:"perfilrep", nome:nome}}); };
  var cols = [{t:"Representante", w:200, c:1}, {t:"Revendedoras", w:135, c:1}, {t:"Situação", w:150, c:1}, {t:"Kits novos", w:105, c:1}, {t:"Mapa", w:90, c:1}, {t:"Curitiba", w:230, c:1}, {t:"Região metropolitana", w:200, c:1}, {t:"Outras cidades", w:190, c:1}, {t:"Horários", w:130, c:1}, {t:"", w:90, c:1}];
  return e("div",{className:"flex flex-col gap-3"},
    e(PageHead,{t:"Representantes", sub:"Cadastro das representantes do setor: regiões, horários e quantas revendedoras cada uma tem."},
      e(Segmentado,{opcoes:[["planilha","Planilha"], ["cartoes","Cartões"]], atual:vista, onMudar:vs[1]})),
    e(BlocoFiltros,null,
      e(CampoBusca,{key:"q", t:"Buscar", id:"rc-q", value:f.q, placeholder:"Nome, bairro ou cidade", onChange:function(v){ up("q", v); }}),
      e(CampoSel,{key:"faixa", t:"Situação", id:"rc-faixa", value:f.faixa, onChange:function(v){ up("faixa", v); }, opcoes:[["", "Todas"], ["fortalecer", "Fortalecer (até "+FORTALECER_ATE+")"], ["normal", "Normal"], ["evitar", "Evitar kit novo (acima de "+LIMITE_REV+")"]]}),
      e(CampoSel,{key:"mapa", t:"Mapa", id:"rc-mapa", value:f.mapa, onChange:function(v){ up("mapa", v); }, opcoes:[["", "Todas"], ["sim", "Mapeadas"], ["nao", "Pendentes"]]})),
    e(FaixaTotais,{itens:[{t:"Representantes", v:String(todas.length)}, {t:"Revendedoras", v:total.toLocaleString("pt-BR")}, {t:"Média por representante", v:comNumero.length ? String(Math.round(total/comNumero.length)) : "—"},
      {t:"Fortalecer", v:String(fortalecer), cor:fortalecer ? "text-success" : ""}, {t:"Acima de "+LIMITE_REV, v:String(acima), cor:acima ? "text-destructive" : ""}, {t:"Mapeadas", v:todas.filter(function(r){ return r.mapa; }).length+" de "+todas.length}]}),
    vista==="cartoes"
      ? e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"}, lista.map(function(r){ return e(Cartao,{key:r.nome, r:r, editar:function(){ editar(r.nome); }}); }))
      : e(Bloco,{t:"Planilha das representantes"},
          e(TabelaP,{cols:cols, minW:1560},
            lista.map(function(r){ var fx = FAIXA[r.faixa];
              return e(Tr,{key:r.nome, onClick:function(){ editar(r.nome); }, alerta:r.faixa==="evitar"},
                e(Td,{c:true, forte:true, title:r.p && r.p.completo ? r.p.completo : r.nome}, r.nome+(r.func ? " ◆" : "")), e(Td,{c:true, forte:true, cor:fx ? fx[1] : ""}, r.cota==null ? "—" : String(r.cota)),
                e(Td,{c:true, cor:fx ? fx[1] : "text-foreground/50"}, fx ? fx[0] : "Sem número"), e(Td,{c:true}, String(r.kits)), e(Td,{c:true, cor:r.mapa ? "text-success" : "text-warning"}, r.mapa ? "Mapeada" : "Pendente"),
                e(Td,{c:true, title:r.curTodos}, r.cur || "—"), e(Td,{c:true}, r.rmc || "—"), e(Td,{c:true}, r.outras || "—"), e(Td,{c:true, cor:r.tem ? "" : "text-foreground/50"}, r.tem ? (r.sim ? "Simulação" : "Informados") : "—"),
                e(Td,{c:true}, e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); editar(r.nome); }, className:"inline-flex h-6 items-center rounded-md border border-border px-2 text-[12px] hover:bg-white/10"}, r.mapa || r.tem ? "Editar" : "Mapear")));
            }))));
}

export { AbaRepCadastro };

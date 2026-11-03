// Sorelly Admin · montagem — pages/GarantiaCreditos.js
// Garantia → Créditos (03/11/2026, Marcus): a funcionária da Garantia lança o crédito liberado para uma revendedora e o valor sobe sozinho para o acerto no app da representante (ela não digita nada).
// A revendedora é escolhida pelo nome, na lista das revendedoras com kit ativo (DevMaster, só nome/código/representante: GET /revendedoras?basico=1). Sem servidor, usa os nomes que o sistema já conhece.
// Lógica e estado em domain/garantias-rev.js (s.gr.creditos, ação GR credito_add / credito_del / credito_usar).
import { GradeFiltro } from "@/apps/montagem/components/grade-filtro";
import { Dinheiro, Pagina } from "@/apps/montagem/components/padrao";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useEffect, useState } from "@/shared/react";

var IN = INPUT+" h-8! text-[13px]!";
var semAcento = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
var BR = function(n){ return "R$ "+Number(n||0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); };
var dataBr = function(iso){ var d = String(iso||"").slice(0, 10).split("-").reverse().join("/"), h = String(iso||"").slice(11, 16); return d+(h ? " "+h : ""); };

function AbaGarantiaCreditos(){
  var cx = use(), s = cx.state, creditos = ((s.gr && s.gr.creditos) || []).slice().reverse();
  var lst = useState(null), lista = lst[0], setLista = lst[1];
  var qs = useState(""), q = qs[0], setQ = qs[1];
  var sl = useState(null), escolhida = sl[0], setEscolhida = sl[1];
  var vl = useState(""), valor = vl[0], setValor = vl[1];
  var ob = useState(""), obs = ob[0], setObs = ob[1];
  useEffect(function(){ if(!apiAtiva()) return; chamar("GET", "/revendedoras?basico=1").then(function(d){ setLista((d && d.itens) || []); }).catch(function(){ setLista([]); }); }, []);
  // além da lista do servidor, os nomes que o sistema já conhece (kits do dia e fichas das revendedoras; é o que existe sem servidor)
  var locais = (function(){ var m = {}; (s.kits||[]).forEach(function(k){ if(k.rev) m[k.rev] = {cod:"", nome:k.rev, representante:""}; }); Object.keys(s.perfisRev||{}).forEach(function(n){ if(!m[n]) m[n] = {cod:"", nome:n, representante:""}; }); return Object.keys(m).map(function(n){ return m[n]; }); })();
  var nomes = {}; (lista||[]).forEach(function(r){ nomes[semAcento(r.nome)] = 1; });
  var base = (lista||[]).concat(locais.filter(function(r){ return !nomes[semAcento(r.nome)]; }));
  var achadas = escolhida || semAcento(q).length<2 ? [] : base.filter(function(r){ return semAcento(r.nome).indexOf(semAcento(q))>=0 || String(r.cod||"").indexOf(q.trim())===0; }).slice(0, 8);
  var pode = !!escolhida && Number(valor)>0;
  var lancar = function(){ if(!pode) return; cx.dispatch({type:"GR", op:"credito_add", revendedora:escolhida.nome, cod:escolhida.cod, valor:Number(valor), obs:obs, por:nomeDe(s.usuario)}); setEscolhida(null); setQ(""); setValor(""); setObs(""); };
  return e(Pagina,null,
    e(PageHead,{t:"Créditos de garantia", sub:"Lance o crédito liberado para a revendedora. O valor sobe para o acerto no app da representante."}),
    e("div",{className:"flex flex-col gap-2 rounded-xl border border-border p-2.5"},
      e("div",{className:"grid gap-2", style:{gridTemplateColumns:"repeat(auto-fit, minmax(12rem, 1fr))"}},
        e("label",{className:"flex min-w-0 flex-col gap-1 text-center text-[11px] font-semibold"}, "Revendedora",
          escolhida
            ? e("span",{className:"flex h-8 items-center justify-between gap-2 rounded-md border border-border bg-white/5 px-2.5 text-[13px] font-semibold"}, escolhida.nome+(escolhida.cod ? " · "+escolhida.cod : ""), e("button",{type:"button", onClick:function(){ setEscolhida(null); }, "aria-label":"Trocar revendedora", className:"grid size-5 place-items-center rounded-full bg-white/10 text-[13px]"}, "×"))
            : e("input",{value:q, placeholder:"Escreva o nome", "aria-label":"Revendedora", onChange:function(ev){ setQ(ev.target.value); }, className:IN+" w-full text-center"})),
        e("label",{className:"flex min-w-0 flex-col gap-1 text-center text-[11px] font-semibold"}, "Valor do crédito",
          e(Dinheiro,{value:valor, out:"ponto", label:"Valor do crédito", onChange:setValor, className:"w-full h-8!"})),
        e("label",{className:"flex min-w-0 flex-col gap-1 text-center text-[11px] font-semibold"}, "Observação",
          e("input",{value:obs, placeholder:"Opcional", "aria-label":"Observação", onChange:function(ev){ setObs(ev.target.value); }, className:IN+" w-full text-center"})),
        e("div",{className:"flex items-end justify-center"}, e(Btn,{v:"primary", ic:"plus", disabled:!pode, onClick:lancar}, "Lançar crédito"))),
      achadas.length>0 && e("div",{className:"flex flex-wrap justify-center gap-1.5"}, achadas.map(function(r){
        return e(Btn,{key:r.cod+r.nome, v:"ghost", sm:true, onClick:function(){ setEscolhida(r); setQ(""); }}, r.nome+(r.representante ? " · "+r.representante : "")); })),
      semAcento(q).length>=2 && !escolhida && achadas.length===0 && e("p",{className:"text-center text-[13px]"}, "Nenhuma revendedora com kit ativo com esse nome.")),
    e(GradeFiltro,{chave:"garantiacred", vazio:"Nenhum crédito lançado ainda.", rows:creditos, cols:[
      {k:"em", t:"Lançado em", v:function(c){ return c.em; }, exib:function(c){ return dataBr(c.em); }},
      {k:"rev", t:"Revendedora", forte:true, v:function(c){ return c.revendedora; }},
      {k:"valor", t:"Crédito", tipo:"num", v:function(c){ return c.valor; }, exib:function(c){ return BR(c.valor); }},
      {k:"obs", t:"Observação", v:function(c){ return c.obs || "—"; }},
      {k:"por", t:"Lançou", v:function(c){ return c.por; }},
      {k:"sit", t:"Situação", forte:true, v:function(c){ return c.usado ? "Usado no acerto" : "Disponível"; }, cor:function(c){ return c.usado ? "" : "text-green-400"; }},
      {k:"del", t:"Excluir", min:110, semFiltro:true, v:function(){ return ""; }, cel:function(c){ return c.usado ? "—" : e(Btn,{v:"ghost", sm:true, onClick:function(){ if(window.confirm("Excluir o crédito de "+c.revendedora+"?")) cx.dispatch({type:"GR", op:"credito_del", id:c.id, por:nomeDe(s.usuario)}); }}, "Excluir"); }}]}));
}

export { AbaGarantiaCreditos };

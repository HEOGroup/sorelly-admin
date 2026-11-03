// Sorelly Admin · montagem — pages/GarantiaCreditos.js
// Garantia → Créditos (03/11/2026, Marcus): a tela tem UM botão "Lançar crédito" que abre um bloco (o mesmo dos filtros) com: Revendedora (listagem que vai filtrando, DevMaster, revendedoras com kit ativo), Valor do crédito e Observações. O valor sobe sozinho para o acerto no app da representante (ela não digita nada).
// A lista vem de GET /revendedoras?basico=1 (só nome, código, representante e cidade). Sem servidor, usa os nomes que o sistema já conhece.
// Lógica e estado em domain/garantias-rev.js (s.gr.creditos, ação GR credito_add / credito_del / credito_usar).
import { GradeFiltro } from "@/apps/montagem/components/grade-filtro";
import { Dinheiro, Pagina } from "@/apps/montagem/components/padrao";
import { Botao, BlocoFiltros, CAMPO, Rotulo } from "@/apps/montagem/components/padrao-fin";
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
var MAX_LISTA = 8;

// bloco do lançamento (mesmo bloco dos filtros das telas do Financeiro e das Revendedoras): Revendedora (busca com listagem que filtra) · Valor do crédito · Observações · Lançar
function BlocoLancar(p){
  var qs = useState(""), q = qs[0], setQ = qs[1];
  var sl = useState(null), escolhida = sl[0], setEscolhida = sl[1];
  var vl = useState(""), valor = vl[0], setValor = vl[1];
  var ob = useState(""), obs = ob[0], setObs = ob[1];
  var nq = semAcento(q).trim();
  var achadas = p.base.filter(function(r){ return !nq || semAcento(r.nome).indexOf(nq)>=0 || String(r.cod||"").indexOf(q.trim())===0; });
  var mostra = achadas.slice(0, MAX_LISTA);
  var pode = !!escolhida && Number(valor)>0;
  return e(BlocoFiltros,{titulo:"Lançar crédito de garantia"},
    e("div",{className:"min-w-0"}, e(Rotulo,{t:"Revendedora", id:"gcrev"}),
      escolhida
        ? e("div",{className:CAMPO+" flex items-center justify-between gap-2 text-center"}, e("b",{className:"min-w-0 flex-1 font-semibold"}, escolhida.nome), e("button",{type:"button", onClick:function(){ setEscolhida(null); }, "aria-label":"Trocar revendedora", className:"grid size-5 shrink-0 place-items-center rounded-full bg-white/10 text-[13px]"}, "×"))
        : e("input",{id:"gcrev", value:q, autoFocus:true, placeholder:"Buscar revendedora", onChange:function(ev){ setQ(ev.target.value); }, className:CAMPO+" text-center"})),
    e("div",{className:"min-w-0"}, e(Rotulo,{t:"Valor do crédito", id:"gcval"}), e(Dinheiro,{value:valor, out:"ponto", label:"Valor do crédito", onChange:setValor, className:"w-full h-8!"})),
    e("div",{className:"min-w-0"}, e(Rotulo,{t:"Observações", id:"gcobs"}), e("input",{id:"gcobs", value:obs, placeholder:"Opcional", onChange:function(ev){ setObs(ev.target.value); }, className:CAMPO+" text-center"})),
    e("div",{className:"flex items-end gap-2"}, e(Botao,{onClick:p.fechar}, "Cancelar"), e(Botao,{principal:true, onClick:function(){ if(pode) p.lancar({revendedora:escolhida.nome, cod:escolhida.cod, valor:Number(valor), obs:obs}); }, desabilitado:!pode}, "Lançar")),
    !escolhida && e("div",{className:"col-span-2 flex flex-col md:col-span-4"},
      p.carregando && e("p",{className:"text-center text-[13px]"}, "Buscando as revendedoras…"),
      !p.carregando && mostra.length===0 && e("p",{className:"text-center text-[13px]"}, "Nenhuma revendedora com kit ativo com esse nome."),
      mostra.map(function(r){
        return e("button",{key:r.cod+"|"+r.nome, type:"button", onClick:function(){ setEscolhida(r); }, className:"flex min-h-8 items-center justify-center gap-3 border-t border-white/10 px-2 py-1 text-[13px] hover:bg-white/10"},
          e("b",{className:"font-semibold"}, r.nome), e("span",{className:"text-[11px]"}, [r.representante, r.cidade].filter(Boolean).join(" · "))); }),
      achadas.length>MAX_LISTA && e("p",{className:"text-center text-[13px]"}, "Mostrando "+MAX_LISTA+" de "+achadas.length+". Escreva mais letras do nome para filtrar.")));
}

function AbaGarantiaCreditos(){
  var cx = use(), s = cx.state, creditos = ((s.gr && s.gr.creditos) || []).slice().reverse();
  var lst = useState(null), lista = lst[0], setLista = lst[1];
  var ab = useState(false), aberto = ab[0], setAberto = ab[1];
  useEffect(function(){ if(!apiAtiva()){ setLista([]); return; } chamar("GET", "/revendedoras?basico=1").then(function(d){ setLista((d && d.itens) || []); }).catch(function(){ setLista([]); }); }, []);
  // sem servidor (ou lista vazia): os nomes que o sistema já conhece (kits do dia e fichas das revendedoras)
  var locais = (function(){ var m = {}; (s.kits||[]).forEach(function(k){ if(k.rev) m[k.rev] = {cod:"", nome:k.rev, representante:""}; }); Object.keys(s.perfisRev||{}).forEach(function(n){ if(!m[n]) m[n] = {cod:"", nome:n, representante:""}; }); return Object.keys(m).map(function(n){ return m[n]; }); })();
  var base = lista && lista.length ? lista : locais;
  var lancar = function(d){ cx.dispatch({type:"GR", op:"credito_add", revendedora:d.revendedora, cod:d.cod, valor:d.valor, obs:d.obs, por:nomeDe(s.usuario)}); setAberto(false); };
  return e(Pagina,null,
    e(PageHead,{t:"Créditos de garantia", sub:"Os créditos liberados para as revendedoras. O valor sobe para o acerto no app da representante."},
      e(Btn,{v:"primary", ic:"plus", onClick:function(){ setAberto(true); }}, "Lançar crédito")),
    aberto && e(BlocoLancar,{base:base, carregando:lista===null, fechar:function(){ setAberto(false); }, lancar:lancar}),
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

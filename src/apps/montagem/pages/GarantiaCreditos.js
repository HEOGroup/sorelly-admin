// Sorelly Admin · montagem — pages/GarantiaCreditos.js
// Garantia → Créditos (03/11/2026, Marcus): a tela tem UM botão "Lançar crédito" que abre um CARD DOURADO por cima de tudo com: Revendedora (menu suspenso: escreve para filtrar ou rola; DevMaster, revendedoras com kit ativo), Valor do crédito e Observações. O valor sobe sozinho para o acerto no app da representante (ela não digita nada).
// A lista vem de GET /revendedoras?basico=1 (só nome, código, representante e cidade). Sem servidor, usa os nomes que o sistema já conhece.
// Lógica e estado em domain/garantias-rev.js (s.gr.creditos, ação GR credito_add / credito_del / credito_usar).
import { GradeFiltro } from "@/apps/montagem/components/grade-filtro";
import { Dinheiro, Pagina } from "@/apps/montagem/components/padrao";
import { Botao, CAMPO, Rotulo } from "@/apps/montagem/components/padrao-fin";
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

// card dourado por cima de tudo: Revendedora (campo que abre um menu suspenso: dá para escrever e filtrar ou rolar) · Valor do crédito · Observações · Lançar
var MAX_MENU = 300;   // o menu rola; a lista inteira (≈2.000) só aparece conforme a pessoa escreve
function CardLancar(p){
  var qs = useState(""), q = qs[0], setQ = qs[1];
  var mn = useState(false), menu = mn[0], setMenu = mn[1];
  var sl = useState(null), escolhida = sl[0], setEscolhida = sl[1];
  var vl = useState(""), valor = vl[0], setValor = vl[1];
  var ob = useState(""), obs = ob[0], setObs = ob[1];
  var nq = semAcento(q).trim();
  var achadas = p.base.filter(function(r){ return !nq || semAcento(r.nome).indexOf(nq)>=0 || String(r.cod||"").indexOf(q.trim())===0; });
  var pode = !!escolhida && Number(valor)>0;
  return e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-black/65 p-3", onClick:p.fechar},
    e("div",{onClick:function(ev){ ev.stopPropagation(); setMenu(false); }, className:"flex w-full max-w-md flex-col gap-3 rounded-2xl p-4 text-center ring-2 ring-[#C9A13B]", style:{background:"linear-gradient(180deg, rgba(201,161,59,.22), rgba(21,21,23,.98) 45%)"}},
      e("div",{className:"relative"}, e("h2",{className:"font-heading text-lg font-bold"}, "Lançar crédito de garantia"),
        e("button",{type:"button", onClick:p.fechar, "aria-label":"Fechar", className:"absolute right-0 top-0 grid size-8 place-items-center rounded-lg bg-muted/50 hover:bg-white/15"}, "×")),
      e("div",{className:"relative min-w-0", onClick:function(ev){ ev.stopPropagation(); }}, e(Rotulo,{t:"Revendedora", id:"gcrev"}),
        e("input",{id:"gcrev", value:escolhida ? escolhida.nome : q, autoComplete:"off", placeholder:"Escreva ou escolha na lista", onClick:function(){ setMenu(true); }, onFocus:function(){ setMenu(true); },
          onChange:function(ev){ setEscolhida(null); setQ(ev.target.value); setMenu(true); }, className:CAMPO+" text-center"}),
        menu && e("div",{className:"absolute left-0 right-0 top-full z-10 mt-1 max-h-52 overflow-y-auto rounded-md border border-border bg-card shadow-xl", role:"listbox"},
          p.carregando && e("p",{className:"px-2 py-2 text-[13px]"}, "Buscando as revendedoras…"),
          !p.carregando && achadas.length===0 && e("p",{className:"px-2 py-2 text-[13px]"}, "Nenhuma revendedora com kit ativo com esse nome."),
          achadas.slice(0, MAX_MENU).map(function(r){
            return e("button",{key:r.cod+"|"+r.nome, type:"button", role:"option", onClick:function(){ setEscolhida(r); setQ(""); setMenu(false); }, className:"flex min-h-8 w-full flex-col items-center justify-center border-b border-white/10 px-2 py-1 text-[13px] hover:bg-white/10"},
              e("b",{className:"font-semibold"}, r.nome), e("span",{className:"text-[11px]"}, [r.representante, r.cidade].filter(Boolean).join(" · "))); }),
          achadas.length>MAX_MENU && e("p",{className:"px-2 py-2 text-[13px]"}, "Escreva mais letras do nome para filtrar."))),
      e("div",{className:"min-w-0"}, e(Rotulo,{t:"Valor do crédito", id:"gcval"}), e(Dinheiro,{value:valor, out:"ponto", label:"Valor do crédito", onChange:setValor, className:"w-full h-8!"})),
      e("div",{className:"min-w-0"}, e(Rotulo,{t:"Observações", id:"gcobs"}), e("input",{id:"gcobs", value:obs, placeholder:"Opcional", onChange:function(ev){ setObs(ev.target.value); }, className:CAMPO+" text-center"})),
      e(Botao,{principal:true, desabilitado:!pode, onClick:function(){ if(pode) p.lancar({revendedora:escolhida.nome, cod:escolhida.cod, valor:Number(valor), obs:obs}); }}, "Lançar crédito")));
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
    e(GradeFiltro,{chave:"garantiacred", vazio:"Nenhum crédito lançado ainda.", rows:creditos, cols:[
      {k:"em", t:"Lançado em", v:function(c){ return c.em; }, exib:function(c){ return dataBr(c.em); }},
      {k:"rev", t:"Revendedora", forte:true, v:function(c){ return c.revendedora; }},
      {k:"valor", t:"Crédito", tipo:"num", v:function(c){ return c.valor; }, exib:function(c){ return BR(c.valor); }},
      {k:"obs", t:"Observação", v:function(c){ return c.obs || "—"; }},
      {k:"por", t:"Lançou", v:function(c){ return c.por; }},
      {k:"sit", t:"Situação", forte:true, v:function(c){ return c.usado ? "Usado no acerto" : "Disponível"; }, cor:function(c){ return c.usado ? "" : "text-green-400"; }},
      {k:"del", t:"Excluir", min:110, semFiltro:true, v:function(){ return ""; }, cel:function(c){ return c.usado ? "—" : e(Btn,{v:"ghost", sm:true, onClick:function(){ if(window.confirm("Excluir o crédito de "+c.revendedora+"?")) cx.dispatch({type:"GR", op:"credito_del", id:c.id, por:nomeDe(s.usuario)}); }}, "Excluir"); }}]}),
    aberto && e(CardLancar,{base:base, carregando:lista===null, fechar:function(){ setAberto(false); }, lancar:lancar}));
}

export { AbaGarantiaCreditos };

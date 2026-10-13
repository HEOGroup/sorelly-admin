// Sorelly Admin — components/seletor-acesso.js
// Simulação do login: escolher quem está usando o sistema. Pessoas agrupadas por setor, com busca; cada setor com cor e ícone.
import { ACESSO_TOTAL, AGENDAMENTO, AMANDA_M, ATENDENTE_PECAS, BIPADORAS, DIRECAO_FAMILIA, DIRETORIA, FAMILIA, FINANCEIRO, KITNOVO, LISTAGENS_RESP, MONTADORAS, SUPERVISORA, grupoDe, nomeDe } from "@/apps/montagem/domain/equipe";
import { PAPEL_LB, VISUAL } from "@/apps/montagem/navigation/perfis";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useState } from "@/shared/react";

// ordem da lista: sócios primeiro, depois cada setor
var SETORES_LOGIN = function(){
  var socios = [16,29,28].map(function(i){ return DIRETORIA.concat(ACESSO_TOTAL).find(function(x){ return x.id===i; }); });
  return [["supervisao", socios], ["familia", DIRECAO_FAMILIA.concat(FAMILIA)], ["supervisora", [SUPERVISORA]], ["agendamento", AGENDAMENTO], ["financeiro", FINANCEIRO],
    ["inadimplencia", [AMANDA_M]], ["bipadora", BIPADORAS.concat([ATENDENTE_PECAS])], ["montadora", MONTADORAS], ["listagens", [LISTAGENS_RESP]], ["kitnovo", [KITNOVO]]]; };
var semAcento = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase(); };

function SeletorAcesso(){
  var cx = use(), s = cx.state, d = cx.dispatch, g = grupoDe(s.usuario), v = VISUAL[g] || ["#D9A63A","user"];
  var ab = useState(false), aberto = ab[0], setAberto = ab[1], bq = useState(""), busca = bq[0], setBusca = bq[1];
  var q = semAcento(busca);
  var escolher = function(id){ d({type:"LOGIN", id:id}); setAberto(false); setBusca(""); };
  return e("div",{className:"relative"},
    e("button",{onClick:function(){ setAberto(!aberto); }, "aria-label":"Acesso (simulação do login)", "aria-expanded":aberto,
        className:"flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 pl-1.5 pr-2.5 text-sm font-semibold outline-none hover:bg-primary/15"},
      e("span",{className:"grid size-6 place-items-center rounded-md text-white", style:{background:v[0]}}, e(Icon,{n:v[1], s:13})),
      e("span",{className:"flex flex-col items-start leading-none"}, e("span",null, nomeDe(s.usuario)), e("span",{className:"mt-0.5 text-[9.5px] font-medium opacity-70"}, PAPEL_LB[g])),
      e(Icon,{n: aberto ? "chevrondown" : "chevron", s:12})),
    aberto && e("div",{className:"fixed inset-0 z-40", onClick:function(){ setAberto(false); }}),
    aberto && e("div",{className:"absolute right-0 top-11 z-50 flex max-h-[75vh] w-[min(30rem,92vw)] flex-col gap-2 overflow-y-auto rounded-xl bg-card p-3 shadow-2xl ring-1 ring-[#E8B84B]/40"},
      e("input",{autoFocus:true, value:busca, placeholder:"Buscar pessoa…", "aria-label":"Buscar pessoa", onChange:function(ev){ setBusca(ev.target.value); },
        className:"h-9 w-full rounded-lg border border-border bg-black/20 px-3 text-[13px] outline-none focus:border-primary"}),
      SETORES_LOGIN().map(function(gr){ var vis = VISUAL[gr[0]], gente = gr[1].filter(function(p){ return !q || semAcento(p.nome).indexOf(q)>=0; });
        if(!gente.length) return null;
        return e("div",{key:gr[0], className:"flex flex-col gap-1.5 rounded-lg p-2", style:{background:vis[0]+"1A", boxShadow:"inset 3px 0 0 "+vis[0]}},
          e("div",{className:"flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide"},
            e("span",{className:"grid size-5 place-items-center rounded-md text-white", style:{background:vis[0]}}, e(Icon,{n:vis[1], s:11})), PAPEL_LB[gr[0]]),
          e("div",{className:"flex flex-wrap gap-1.5"}, gente.map(function(p){ var on = p.id===s.usuario;
            return e("button",{key:p.id, onClick:function(){ escolher(p.id); },
              className:"rounded-lg px-2.5 py-1 text-[12.5px] font-semibold ring-1 "+(on ? "text-white ring-2" : "bg-black/20 ring-border hover:bg-white/10"), style:on ? {background:vis[0], borderColor:vis[0]} : undefined}, p.nome); }))); }),
      e("button",{onClick:function(){ setAberto(false); d({type:"SAIR"}); }, className:"mt-1 h-9 rounded-lg bg-white/10 text-[13px] font-semibold hover:bg-white/15"},"Sair (voltar para a tela de entrada)")));
}

export { SeletorAcesso, SETORES_LOGIN };

// Sorelly Admin · montagem — mobile/aulas-rev.js
// Tela "Aulas sobre o aplicativo": lista curta por seção; "Assistir" abre o vídeo em nova aba, sem link mostra "Em breve".
// A lista é editável em domain/aulas-rev.js. Props: k (a revendedora), onVoltar.
import { AULAS_REV } from "@/apps/montagem/domain/aulas-rev";
import { CabecaTela, FolhaTela } from "@/apps/montagem/mobile/rev-comum";
import { Icon } from "@/apps/montagem/ui/icon";
import { e } from "@/shared/react";

function TelaAulasRev(p){
  var secoes = []; AULAS_REV.forEach(function(a){ var s = secoes.find(function(x){ return x.n===a.secao; }); if(!s){ s = {n:a.secao, l:[]}; secoes.push(s); } s.l.push(a); });
  return [e(CabecaTela,{key:"h", t:"Aulas sobre o aplicativo", sub:"Aprenda a usar o app", onVoltar:p.onVoltar}),
    e(FolhaTela,{key:"c"}, secoes.map(function(s){
      return e("div",{key:s.n, className:"flex flex-col gap-1.5"}, e("b",{className:"text-[12px] uppercase tracking-wider text-[#B8862B]"}, s.n),
        s.l.map(function(a){
          var tem = !!a.link;
          return e("div",{key:a.titulo, className:"flex flex-col gap-2 rounded-xl border border-[#E5E7EB] bg-white p-2.5"},
            e("div",{className:"flex items-center gap-2.5"},
              e("span",{className:"grid size-10 shrink-0 place-items-center rounded-lg bg-[#111113] text-[#E8B84B]"}, e(Icon,{n:"play", s:17})),
              e("span",{className:"min-w-0 flex-1"}, e("b",{className:"block truncate whitespace-nowrap text-[12.5px] text-[#111827]"}, a.titulo), e("span",{className:"block truncate whitespace-nowrap text-[11px] text-[#6B7280]"}, a.desc+(a.duracao ? " · "+a.duracao : "")))),
            tem ? e("a",{href:a.link, target:"_blank", rel:"noreferrer", className:"flex h-8 items-center justify-center rounded-lg text-[12.5px] font-bold text-[#1B1409]", style:{background:"#E8B84B"}}, "Assistir")
              : e("span",{className:"flex h-8 items-center justify-center rounded-lg bg-[#F3F4F6] text-[12px] font-semibold text-[#6B7280]"}, "Em breve"));
        }));
    }))];
}
export { TelaAulasRev };

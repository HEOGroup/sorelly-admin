// Sorelly Admin · montagem — mobile/ajuda-rev.js
// Tela "Central de Ajuda": busca, perguntas frequentes em acordeão, "Falar com a Sorelly" e "Ver aulas".
// Perguntas em domain/ajuda-rev.js. Props: k, onVoltar, onChat (opcional: abre o SorellyChat), onAulas (opcional: abre as aulas).
import { AJUDA_REV } from "@/apps/montagem/domain/ajuda-rev";
import { CabecaTela, FolhaTela } from "@/apps/montagem/mobile/rev-comum";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useState } from "@/shared/react";

var norm = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
function TelaAjudaRev(p){
  var q = useState(""), busca = q[0], setBusca = q[1], a = useState(-1), aberta = a[0], setAberta = a[1], d = useState(""), dica = d[0], setDica = d[1];
  var lista = AJUDA_REV.filter(function(x){ return !busca || norm(x.p+" "+x.r).indexOf(norm(busca))>=0; });
  var chat = function(){ if(p.onChat) p.onChat(); else setDica("Use o SorellyChat na tela inicial."); };
  var aulas = function(){ if(p.onAulas) p.onAulas(); else setDica("Abra Aulas sobre o aplicativo na tela inicial."); };
  var bt = "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-[13px] font-bold active:scale-[.98]";
  return [e(CabecaTela,{key:"h", t:"Central de Ajuda", sub:"Suporte e tutoriais", onVoltar:p.onVoltar}),
    e(FolhaTela,{key:"c"},
      e("div",{className:"flex gap-2"}, e("button",{onClick:chat, className:bt+" text-[#1B1409]", style:{background:"#E8B84B"}}, e(Icon,{n:"whats", s:15}), "Falar com a Sorelly"), e("button",{onClick:aulas, className:bt+" border border-[#E5E7EB] bg-white text-[#111827]"}, e(Icon,{n:"play", s:14}), "Ver aulas")),
      dica && e("p",{className:"rounded-lg bg-[#FBF3DC] px-3 py-2 text-center text-[12px] font-medium text-[#5B4410]"}, dica),
      e("label",{className:"flex h-11 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3"}, e(Icon,{n:"search", s:15, className:"text-[#9CA3AF]"}), e("input",{value:busca, onChange:function(x){ setBusca(x.target.value); setAberta(-1); }, placeholder:"Buscar uma dúvida", className:"min-w-0 flex-1 bg-transparent text-[13px] text-[#111827] outline-none"})),
      lista.length ? lista.map(function(x, i){
        var on = aberta===i;
        return e("div",{key:x.p, className:"rounded-xl border border-[#E5E7EB] bg-white"},
          e("button",{onClick:function(){ setAberta(on ? -1 : i); }, "aria-expanded":on, className:"flex w-full items-center gap-2 px-3 py-3 text-left"}, e("b",{className:"min-w-0 flex-1 text-[13px] leading-snug text-[#111827]"}, x.p), e(Icon,{n:on ? "chevronup" : "chevrondown", s:14, className:"shrink-0 text-[#B8862B]"})),
          on && e("p",{className:"px-3 pb-3 text-[12.5px] leading-snug text-[#4B5563]"}, x.r));
      }) : e("p",{className:"rounded-xl bg-[#F9FAFB] p-4 text-center text-[12.5px] text-[#6B7280]"}, "Nada encontrado. Fale com a Sorelly pelo botão acima."))];
}
export { TelaAjudaRev };

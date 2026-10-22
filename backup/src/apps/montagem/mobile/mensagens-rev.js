// Sorelly Admin · montagem — mobile/mensagens-rev.js
// SorellyChat no app da revendedora: ela fala com a representante dela e com os setores que a atendem (Indicação, Link de pagamento, Trocas e RH).
// Mesma ideia do app da representante: cada contato é uma conversa; quem da equipe responder primeiro pega a conversa.
import { api, useChat } from "@/apps/montagem/domain/chat-store";
import { CANAIS_REV } from "@/apps/montagem/domain/chat-canais";
import { contatoDaRepresentante, registrarRevendedora } from "@/apps/montagem/domain/chat-contatos";
import { Conversa } from "@/apps/montagem/components/chat/chat-conversa";
import { LogoChat, Ph, TemaChatClaro, horaLista, textoPreviaMsg } from "@/apps/montagem/components/chat/chat-ui";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useState } from "@/shared/react";

function MensagensRev(p){
  var st = useChat(), cid = registrarRevendedora(p.nome), repCid = contatoDaRepresentante(p.rep), ab = useState(null), aberto = ab[0], setAberto = ab[1];
  var topo = e("div",{className:"sticky -top-2 z-20 -mx-4 -mt-2 flex items-center gap-2 bg-[#0B0B0D] px-4 pb-3 pt-4"},
    e("button",{onClick:p.onInicio, "aria-label":"Voltar ao início", className:"grid size-8 shrink-0 place-items-center rounded-full bg-amber-200/10 text-amber-200"}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
    e("span",{className:"grid size-7 shrink-0 place-items-center rounded-lg bg-[#24180a] ring-1 ring-amber-200/40"}, e(LogoChat,{s:20})),
    e("b",{className:"text-[13px] font-black uppercase tracking-[.18em] text-amber-200"}, "SorellyChat"));
  if(aberto) return e("div",{className:"-mx-4 -mb-10 -mt-2 h-[676px]"}, e(TemaChatClaro,null, e(Conversa,{key:aberto, convId:aberto, eu:cid, compacto:true, onVoltar:function(){ setAberto(null); }})));
  var minhas = {}; api.getConversations(cid).forEach(function(x){ minhas[x.conv.id] = x; });
  var contatos = CANAIS_REV.filter(function(c){ return c.id!=="r_rep" || !!repCid; });
  return e("div",null, topo,
    e("div",{className:"mt-2 flex flex-col gap-2"}, contatos.map(function(c){
      var id = "cn_"+c.id+"_"+cid, x = minhas[id], u = x && x.ultima;
      var abrir = function(){ setAberto(api.openChannel(cid, c.id, c.id==="r_rep" ? [repCid] : undefined)); };
      return e("button",{key:c.id, onClick:abrir, className:"flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm active:scale-[.99]"},
        e("span",{className:"grid size-11 shrink-0 place-items-center rounded-2xl text-white", style:{background:c.cor}}, e(Ph,{n:c.ic, s:22, fill:true})),
        e("span",{className:"min-w-0 flex-1"},
          e("span",{className:"flex items-baseline gap-2"}, e("b",{className:"min-w-0 flex-1 truncate text-[14.5px] text-[#111827]"}, c.nome), u && e("span",{className:"shrink-0 text-[11px]", style:{color:x.naoLidas ? "#128C7E" : "#9CA3AF"}}, horaLista(u.t))),
          e("span",{className:"line-clamp-2 block text-[12.5px] leading-snug text-[#6B7280]"}, u ? (u.de===cid ? "Você: " : "")+textoPreviaMsg(u) : "Toque para conversar")),
        x && x.naoLidas>0 && e("span",{className:"grid min-w-5 place-items-center rounded-full px-1.5 text-[11.5px] font-bold text-white", style:{background:"#128C7E", height:20}}, x.naoLidas)); })));
}
export { MensagensRev };

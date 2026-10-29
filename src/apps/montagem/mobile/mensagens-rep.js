// Sorelly Admin · montagem — mobile/mensagens-rep.js
// SorellyChat no app da REPRESENTANTE: mesmo formato WhatsApp dos outros apps (mobile/chat-whats.js). Os setores da Sorelly (Diretoria, Financeiro, Agendamento…) são
// contatos fixos da lista; a conversa com cada revendedora abre aqui mesmo (pelo botão do card da revendedora, que pede a conversa por efem({conversaSel})).
import { CANAIS_REP } from "@/apps/montagem/domain/chat-canais";
import { api, useChat } from "@/apps/montagem/domain/chat-store";
import { contatoDaRepresentante } from "@/apps/montagem/domain/chat-contatos";
import { ChatWhats } from "@/apps/montagem/mobile/chat-whats";
import { e } from "@/shared/react";

function MensagensRep(p){
  var st = useChat(), cid = contatoDaRepresentante(p.rep);
  var aviso = function(t){ return e("div",{className:"flex flex-col gap-3"}, e("button",{onClick:p.onInicio, className:"self-start rounded-full bg-amber-200/10 px-3 py-1.5 text-[12px] font-bold text-amber-200"}, "‹ Início"), e("p",{className:"rounded-2xl bg-white p-4 text-[13.5px] text-[#6B7280]"}, t)); };
  if(!cid) return aviso("Não encontrei o seu cadastro no chat. Fale com a diretoria.");
  if(!st.config.representantes) return aviso("As mensagens com a Sorelly estão desligadas no momento. Quando a diretoria liberar, elas aparecem aqui.");
  return e(ChatWhats,{eu:cid, canais:CANAIS_REP, onInicio:p.onInicio, altura:718,
    subCanal:function(c){ return c.membros.join(" e "); },
    abrirCanal:function(c){ return api.openChannel(cid, c.id); }});
}
export { MensagensRep };

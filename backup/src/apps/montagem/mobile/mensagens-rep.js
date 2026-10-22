// Sorelly Admin · montagem — mobile/mensagens-rep.js
// SorellyChat no app da representante: abre DIRETO no chat normal (lista de conversas, como no admin). Lá em cima só existe o botão "Ajuda": a lista de contatos
// da Sorelly (Diretoria, Financeiro, Agendamento…). A conversa com cada revendedora abre aqui mesmo (pelo botão do card da revendedora).
import { CANAIS_REP } from "@/apps/montagem/domain/chat-canais";
import { api, definirEu, efem, useChat } from "@/apps/montagem/domain/chat-store";
import { contatoDaRepresentante } from "@/apps/montagem/domain/chat-contatos";
import { ChatApp } from "@/apps/montagem/components/chat/chat-app";
import { TemaChatClaro } from "@/apps/montagem/components/chat/chat-ui";
import { e } from "@/shared/react";

function MensagensRep(p){
  var st = useChat(), cid = contatoDaRepresentante(p.rep);
  var aviso = function(t){ return e("div",{className:"flex flex-col gap-3"}, e("button",{onClick:p.onInicio, className:"self-start rounded-full bg-amber-200/10 px-3 py-1.5 text-[12px] font-bold text-amber-200"}, "‹ Início"), e("p",{className:"rounded-2xl bg-white p-4 text-[13.5px] text-[#6B7280]"}, t)); };
  if(!cid) return aviso("Não encontrei o seu cadastro no chat. Fale com a diretoria.");
  if(!st.config.representantes) return aviso("As mensagens com a Sorelly estão desligadas no momento. Quando a diretoria liberar, elas aparecem aqui.");
  definirEu(cid);
  var ajuda = {canais:CANAIS_REP, abrir:function(canalId){ efem({conversaSel:api.openChannel(cid, canalId)}); }};
  return e("div",{className:"-mx-4 -mb-10 -mt-2 h-[718px] overflow-hidden"}, e(TemaChatClaro,null, e(ChatApp,{eu:cid, direcao:false, compacto:true, aoVoltarApp:p.onInicio, ajuda:ajuda})));
}
export { MensagensRep };

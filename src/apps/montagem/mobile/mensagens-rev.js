// Sorelly Admin · montagem — mobile/mensagens-rev.js
// SorellyChat no app da REVENDEDORA. O visual (cópia do WhatsApp do iPhone) vive em mobile/chat-whats.js e é o MESMO dos outros apps; aqui só se diz quem é ela e quais
// contatos existem: representante dela, Indique uma revendedora, Link de pagamento, Garantias, Currículo e SAC. Quem da equipe responder primeiro pega a conversa.
import { api } from "@/apps/montagem/domain/chat-store";
import { CANAIS_REV } from "@/apps/montagem/domain/chat-canais";
import { contatoDaRepresentante, registrarRevendedora } from "@/apps/montagem/domain/chat-contatos";
import { ChatWhats } from "@/apps/montagem/mobile/chat-whats";
import { e } from "@/shared/react";

var ICONE = {r_rep:"", r_indicacao:"♥", r_link:"$", r_garantias:"G", r_curriculo:"T", r_sac:"S"};

function MensagensRev(p){
  var cid = registrarRevendedora(p.nome), repCid = contatoDaRepresentante(p.rep);
  var canais = CANAIS_REV.filter(function(c){ return c.id!=="r_rep" || !!repCid; });
  var subDe = function(c){ return c.id==="r_rep" ? (p.rep ? p.rep+" · representante" : "Representante") : (c.membros && c.membros.length ? c.membros.join(" e ") : "Sorelly"); };
  return e(ChatWhats,{eu:cid, canais:canais, onInicio:p.onInicio, altura:718, subCanal:subDe,
    ini:function(c){ return c.id==="r_rep" ? String(p.rep || "R").charAt(0).toUpperCase() : ICONE[c.id] || c.nome.charAt(0); },
    abrirCanal:function(c){ return api.openChannel(cid, c.id, c.id==="r_rep" ? [repCid] : undefined); }});
}
export { MensagensRev };

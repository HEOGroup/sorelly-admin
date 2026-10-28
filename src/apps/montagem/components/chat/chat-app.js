// Sorelly Admin · montagem — components/chat/chat-app.js
// Junta lista + conversa (tela cheia ou compacta), o chat flutuante no canto e os avisos globais (menção, atraso, mensagem nova).
import { FAIXAS_H, api, efem, definirEu, marcarAlertada, mencaoAtraso, tempoUtil, tituloDe, totalNaoLidas, useChat, convPorId, MIN, DIA, iniciarServidor } from "@/apps/montagem/domain/chat-store";
import { contato, contatoDoLogin, ehDirecao } from "@/apps/montagem/domain/chat-contatos";
import { tocar } from "@/apps/montagem/lib/sons";
import { useNotif } from "@/apps/montagem/lib/notificacoes";
import { ListaConversas, OURO, OURO_TXT } from "@/apps/montagem/components/chat/chat-lista";
import { Conversa } from "@/apps/montagem/components/chat/chat-conversa";
import { LogoChat, Ph, TemaChatClaro, W, tempoCurto } from "@/apps/montagem/components/chat/chat-ui";
import { e, useEffect, useState } from "@/shared/react";

// quem sou eu no chat: o contato ligado a quem entrou no sistema
function useEu(idLogin){ var cid = contatoDoLogin(idLogin); useEffect(function(){ definirEu(cid); }, [cid]); definirEu(cid); useEffect(function(){ if(cid) return iniciarServidor(); return undefined; }, [cid]); return cid; }

function ChatApp(p){
  var st = useChat(), euReal = p.eu, vc = st.efem.verComo, leitura = !!(p.direcao && vc), eu = leitura ? vc : euReal;
  var sel = st.efem.conversaSel, existe = sel && st.convs.some(function(c){ return c.id===sel; });
  var voltar = function(){ efem({conversaSel:null}); };
  if(!euReal) return e("div",{className:"grid h-full place-items-center p-6 text-center text-[13px]", style:{background:W.painel, color:W.sec}}, "Seu usuário ainda não está ligado a um contato do chat. Troque o acesso no topo do sistema.");
  var lista = e(ListaConversas,{eu:eu, euReal:euReal, leitura:leitura, direcao:p.direcao, compacto:p.compacto, paginas:p.paginas, abrirCompleto:p.abrirCompleto, aoVoltarApp:p.aoVoltarApp, ajuda:p.ajuda});
  var conversa = existe ? e(Conversa,{key:sel+"|"+eu, convId:sel, eu:eu, leitura:leitura, direcao:p.direcao, onVoltar:voltar, compacto:p.compacto,
    extra:p.compacto && p.abrirCompleto ? e("button",{onClick:p.abrirCompleto, title:"Abrir em tela cheia", "aria-label":"Abrir em tela cheia", className:"grid size-9 place-items-center rounded-full hover:bg-white/10"}, e(Ph,{n:"arrows-out-simple", s:19, style:{color:W.sec}})) : null}) : null;
  if(p.compacto) return e("div",{className:"h-full min-h-0"}, conversa || lista);
  return e("div",{className:"flex h-full min-h-0 flex-col overflow-hidden", style:{background:W.fundo, border:"1px solid #d4a63a"}},
    e("div",{className:"flex min-h-0 flex-1 overflow-hidden"},
    e("div",{className:"min-h-0 w-full shrink-0 md:w-[380px] md:min-w-[340px] md:max-w-[40%] "+(existe ? "hidden md:block" : "block"), style:{borderRight:"1px solid "+W.borda}}, lista),
    e("div",{className:"min-h-0 min-w-0 flex-1 "+(existe ? "block" : "hidden md:block")}, conversa ||
      e("div",{className:"flex h-full flex-col items-center justify-center gap-3 px-8 text-center", style:{background:W.painel, color:W.sec}},
        e("span",{className:"grid size-28 place-items-center rounded-3xl", style:{background:"#24180a"}}, e(LogoChat,{s:76})),
        e("h2",{className:"text-[20px] font-light", style:{color:W.texto}}, "SorellyChat"),
        e("p",{className:"max-w-sm text-[13px]"}, "Converse com a equipe e com as representantes sem sair do sistema. Escolha uma conversa ao lado.")))));
}

// avisos globais: atraso de resposta, mensagens novas (toasts) — fica montado o tempo todo
function ChatGlobal(p){
  var st = useChat(), eu = p.eu, nt = useNotif();
  useEffect(function(){
    if(!eu || !nt.chat) return;   // notificações do chat desligadas: nem aviso na tela nem som
    var checar = function(){
      var agora = Date.now();
      st.mencoes.forEach(function(m){
        if(m.para!==eu || m.resp || m.alertado || agora-m.em>DIA) return;
        if(mencaoAtraso(m)){
          marcarAlertada(m.id); tocar("atraso");
          var t = {id:"at"+m.id, conv:m.conv, titulo:"Resposta atrasada", sub:contato(m.de).nome+" marcou você há "+Math.round(tempoUtil(m.em, agora, eu)/MIN)+" min (prazo "+m.prazo+" min)", atraso:true};
          efem({toasts:st.efem.toasts.concat([t]).slice(-3)});
        }
      });
    };
    var alertar = function(){
      var novos = api.checkAlerts(eu); if(!novos.length) return;
      tocar("atraso");
      var ts = novos.map(function(t){ var rep = t.conv.tipo==="setor" ? t.conv.repId : t.conv.membros.find(function(x){ return x!==t.resp[0]; });
        return {id:"al"+t.conv.id+t.nivel+Date.now(), conv:t.conv.id, titulo:"Sem resposta há "+FAIXAS_H[t.nivel-1]+"h", sub:contato(rep).nome.split(" ").slice(0,2).join(" ")+" · "+t.setor+" · "+t.pend+(t.pend===1 ? " mensagem" : " mensagens")+" esperando", atraso:true}; });
      efem({toasts:st.efem.toasts.concat(ts).slice(-3)});
    };
    checar(); alertar(); var t = setInterval(function(){ checar(); alertar(); }, 10000); return function(){ clearInterval(t); };
  }, [eu, st.mencoes, nt.chat]);
  if(!st.efem.toasts.length || !eu || !nt.chat) return null;
  return e("div",{className:"fixed bottom-24 right-4 z-[70] flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-2", "data-sem-clique":true},
    st.efem.toasts.map(function(t){
      return e("button",{key:t.id, onClick:function(){ efem({toasts:st.efem.toasts.filter(function(x){ return x.id!==t.id; })}); if(t.conv && convPorId(t.conv)){ efem({conversaSel:t.conv}); p.abrir(t.conv); } },
        className:"flex items-start gap-3 rounded-xl px-3.5 py-3 text-left shadow-2xl", style:{background:t.atraso ? "#4a1d24" : W.cab, color:W.texto, border:"1px solid "+(t.atraso ? W.vermelho : t.mencao ? W.verde : W.borda)}},
        e(Ph,{n:t.atraso ? "alarm" : t.mencao ? "at" : "chat-circle-text", s:22, fill:true, className:t.atraso ? "animate-pulse" : "", style:{color:t.atraso ? W.vermelho : W.verde}}),
        e("span",{className:"min-w-0 flex-1"}, e("span",{className:"block truncate text-[13px] font-semibold"}, (t.mencao ? "Você foi marcado · " : "")+t.titulo), e("span",{className:"line-clamp-2 text-[11.5px]", style:{color:W.sec}}, t.sub))); }));
}

// chat flutuante no canto da tela (some na tela cheia do SorellyChat)
function ChatMini(p){
  var st = useChat(), eu = p.eu, aberto = st.efem.mini, nl = eu ? totalNaoLidas(eu) : 0;
  var alternar = function(v){ efem({mini:v}); try{ localStorage.setItem("whatssorelly_mini", v ? "1" : "0"); }catch(x){} };
  useEffect(function(){ try{ if(localStorage.getItem("whatssorelly_mini")==="1") efem({mini:true}); }catch(x){} }, []);
  if(!eu) return null;
  return e("div",{className:"fixed bottom-4 right-4 z-[65]", "data-sem-clique":true},
    aberto && e("div",{className:"mb-3 flex h-[min(34rem,calc(100vh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl shadow-2xl", style:{border:"1px solid #d4a63a", background:W.painel}},
      e("div",{className:"min-h-0 flex-1"}, e(TemaChatClaro,null, e(ChatApp,{eu:eu, direcao:p.direcao, compacto:true, abrirCompleto:function(){ alternar(false); p.abrirCompleto(); }})))),
    e("div",{className:"flex justify-end"},
      e("button",{onClick:function(){ alternar(!aberto); }, "aria-label":aberto ? "Minimizar o chat" : "Abrir o SorellyChat"+(nl ? " ("+nl+" não lidas)" : ""), title:"SorellyChat",
        className:"relative grid size-14 place-items-center rounded-full shadow-2xl transition-transform hover:scale-105", style:{background:"#24180a", color:"#f6dc8c", border:"2px solid #E8B84B"}},
        aberto ? e(Ph,{n:"x", s:26, fill:true}) : e(LogoChat,{s:36}),
        !aberto && nl>0 && e("span",{className:"absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full px-1.5 text-[10.5px] font-bold text-white", style:{background:"#ef4444", height:20}}, nl>99 ? "99+" : nl))));
}
export { ChatApp, ChatMini, ChatGlobal, useEu };

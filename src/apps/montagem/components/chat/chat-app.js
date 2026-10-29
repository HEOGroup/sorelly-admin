// Sorelly Admin · montagem — components/chat/chat-app.js
// Junta lista + conversa (tela cheia ou compacta), o chat flutuante no canto e os avisos globais (menção, atraso, mensagem nova).
import { FAIXAS_H, api, efem, definirEu, marcarAlertada, mencaoAtraso, tempoUtil, tituloDe, totalNaoLidas, useChat, convPorId, MIN, DIA, iniciarServidor } from "@/apps/montagem/domain/chat-store";
import { contato, contatoDoLogin, ehDirecao } from "@/apps/montagem/domain/chat-contatos";
import { tocar } from "@/apps/montagem/lib/sons";
import { useNotif } from "@/apps/montagem/lib/notificacoes";
import { ListaConversas, OURO, OURO_TXT } from "@/apps/montagem/components/chat/chat-lista";
import { Conversa } from "@/apps/montagem/components/chat/chat-conversa";
import { Avatar, LogoChat, Ph, TemaChatClaro, W, tempoCurto } from "@/apps/montagem/components/chat/chat-ui";
import { usePerfil } from "@/apps/montagem/lib/perfil";
import { e, useEffect, useState } from "@/shared/react";

// quem sou eu no chat: o contato ligado a quem entrou no sistema
function useEu(idLogin){ var cid = contatoDoLogin(idLogin); useEffect(function(){ definirEu(cid); }, [cid]); definirEu(cid); useEffect(function(){ if(cid) return iniciarServidor(); return undefined; }, [cid]); return cid; }

function ChatApp(p){
  usePerfil();   // traz as fotos do perfil de todos e redesenha quando chegam
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

// Aviso grande (opção 3 escolhida pelo Marcus): vem de quem te marcou com @ ou do Marcus. Mostra a mensagem inteira e deixa responder ali mesmo; fica até fechar.
function CartaoAviso(p){
  var t = p.t, sv = useState(""), txt = sv[0], setTxt = sv[1];
  var fechar = function(){ efem({toasts:p.todos.filter(function(x){ return x.id!==t.id; })}); };
  var enviar = function(ev){ ev.preventDefault(); var v = txt.trim(); if(!v) return; api.sendMessage({conv:t.conv, eu:p.eu, texto:v}); setTxt(""); fechar(); };
  return e("div",{className:"rounded-2xl p-3.5 shadow-2xl", style:{background:W.cab, color:W.texto, border:"1px solid #E8B84B"}},
    e("div",{className:"mb-2 flex items-center gap-2.5"}, e(Avatar,{id:t.de, s:38}),
      e("div",{className:"min-w-0 flex-1"}, e("div",{className:"truncate text-[14px] font-semibold"}, t.nome, e("span",{className:"ml-2 rounded-full px-2 text-[11px] font-bold", style:{background:"#2a2108", border:"1px solid #E8B84B", color:"#E8B84B"}}, t.deMarcus ? "Marcus" : "te marcou")),
        e("div",{className:"truncate text-[11.5px]", style:{color:W.sec}}, t.titulo)),
      e("button",{onClick:fechar, "aria-label":"Fechar o aviso", className:"grid size-8 place-items-center rounded-full hover:bg-white/10"}, e(Ph,{n:"x", s:16}))),
    e("button",{onClick:function(){ fechar(); if(t.conv && convPorId(t.conv)){ efem({conversaSel:t.conv}); p.abrir(t.conv); } }, className:"mb-2.5 block w-full rounded-xl px-3 py-2.5 text-left text-[13.5px] leading-snug", style:{background:"#0e0e11", color:"#f1ecde", whiteSpace:"pre-wrap"}}, t.texto),
    e("form",{onSubmit:enviar, className:"flex gap-2"},
      e("input",{value:txt, onChange:function(ev){ setTxt(ev.target.value); }, placeholder:"Responder…", className:"h-9 min-w-0 flex-1 rounded-lg border px-3 text-[13px] outline-none", style:{background:"#0e0e11", color:W.texto, borderColor:"#3a3a40"}}),
      e("button",{type:"submit", className:"h-9 rounded-lg px-4 text-[13px] font-bold", style:{background:"#E8B84B", color:"#1a1405"}}, "Enviar")));
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
    // "Sem resposta há Xh" saiu (Marcus, 29/10/2026)
    checar(); var t = setInterval(function(){ checar(); }, 10000); return function(){ clearInterval(t); };
  }, [eu, st.mencoes, nt.chat]);
  if(!st.efem.toasts.length || !eu || !nt.chat) return null;
  // avisos no alto, à direita, por cima da barra do topo (cobrem o "Buscar tela"); modelo 4 escolhido pelo Marcus em 29/10/2026: cartão claro, letra maior, X para fechar
  var tira = function(t){ efem({toasts:st.efem.toasts.filter(function(x){ return x.id!==t.id; })}); };
  return e("div",{className:"fixed right-4 top-3 z-[90] flex w-[min(26rem,calc(100vw-2rem))] flex-col gap-2.5", "data-sem-clique":true},
    st.efem.toasts.map(function(t){
      var abrirConv = function(){ tira(t); if(t.conv && convPorId(t.conv)){ efem({conversaSel:t.conv}); p.abrir(t.conv); } };
      var fechar = e("button",{onClick:function(ev){ ev.stopPropagation(); tira(t); }, "aria-label":"Fechar o aviso", title:"Fechar", className:"absolute right-2 top-2 grid size-7 place-items-center rounded-full text-[18px] leading-none hover:bg-black/10", style:{background:"#eef1f3", color:"#54656f"}}, "×");
      if(t.atraso) return e("div",{key:t.id, role:"button", tabIndex:0, onClick:abrirConv, className:"relative flex cursor-pointer items-start gap-3 rounded-xl px-3.5 py-3 pr-11 text-left shadow-2xl", style:{background:"#4a1d24", color:W.texto, border:"1px solid "+W.vermelho}},
        e(Ph,{n:"alarm", s:24, fill:true, className:"animate-pulse", style:{color:W.vermelho}}),
        e("span",{className:"min-w-0 flex-1"}, e("span",{className:"block truncate text-[15px] font-semibold"}, t.titulo), e("span",{className:"line-clamp-2 text-[14px]", style:{color:W.sec}}, t.sub)), fechar);
      return e("div",{key:t.id, role:"button", tabIndex:0, onClick:abrirConv, className:"relative flex cursor-pointer items-start gap-3 rounded-2xl p-3.5 pr-11 text-left shadow-2xl", style:{background:"#ffffff", color:"#111b21", border:"1px solid #d1d7db"}},
        e(Avatar,{id:t.de, s:48}),
        e("span",{className:"min-w-0 flex-1"},
          e("span",{className:"block truncate text-[16px] font-semibold"}, (t.mencao ? "Você foi marcado · " : "")+((convPorId(t.conv)||{}).tipo==="grupo" ? t.titulo : (t.nome || t.titulo))),
          e("span",{className:"line-clamp-2 text-[16px] leading-snug", style:{color:"#3b4a54"}}, t.texto || t.sub),
          e("span",{className:"mt-1 block text-[12px]", style:{color:"#667781"}}, new Date().toTimeString().slice(0, 5))), fechar); }));
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
// Contador de não lidas do botão S do topo: número vermelho e um pulso curto quando chega mensagem comum.
function BadgeNaoLidas(p){
  var st = useChat(), eu = p.eu, nl = eu ? totalNaoLidas(eu) : 0, pulso = st.efem.pulso || 0;
  if(!eu) return null;
  return e("span",{key:pulso, className:"pointer-events-none absolute inset-0 grid place-items-center rounded-lg", style:pulso && Date.now()-pulso<1500 ? {animation:"sorelly-pulso .9s ease-out 1"} : undefined},
    e("style",null, "@keyframes sorelly-pulso{0%{box-shadow:0 0 0 0 rgba(232,184,75,.9)}100%{box-shadow:0 0 0 14px rgba(232,184,75,0)}}"),
    nl>0 && e("span",{className:"absolute -right-1.5 -top-1.5 grid min-w-[18px] place-items-center rounded-full px-1 text-[11px] font-bold text-white", style:{background:"#ef4444", height:18}}, nl>99 ? "99+" : nl));
}
export { ChatApp, ChatMini, ChatGlobal, BadgeNaoLidas, useEu };

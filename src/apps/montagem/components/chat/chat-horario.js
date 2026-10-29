// Sorelly Admin · montagem — components/chat/chat-horario.js
// Topo da conversa com um colaborador (restaurado 27/10/2026, formato "V1-B" escolhido pelo Marcus):
//  1ª linha: bolinha online/ausente/almoço + dias e horário de trabalho — SÓ a Direção vê a faixa inteira (chat-conversa.js, Marcus 29/10/2026; vem do cadastro do RH, domain/rh.js).
//  2ª faixa: só o resumo do mês (faltas e atrasos; sem bolinhas, o detalhe fica no RH) —
//            só quem tem a autorização "rh_presenca_chat" (Marcus, Nickolas, Lucas, RH) vê essa parte.
import { horarioDe, situacaoAgora } from "@/apps/montagem/domain/chat-store";
import { contato } from "@/apps/montagem/domain/chat-contatos";
import { presencaChat } from "@/apps/montagem/domain/rh";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { HorarioPessoa } from "@/apps/montagem/components/chat/chat-info";
import { Janela, Ph, W } from "@/apps/montagem/components/chat/chat-ui";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var ROT = ["dom","seg","ter","qua","qui","sex","sáb"], ORDEM = [1,2,3,4,5,6,0];
var COR = {ok:"#25d366", atraso:"#fb923c", atestado:"#a855f7", falta:"#f15c6d", aviso:"#facc15", afast:"#ec4899", vazio:"#3b4a54"};
var plural = function(n, um, varios){ return n+" "+(n===1 ? um : varios); };
// [1,2,3,4,6] -> "Seg a qui, sáb"
function faixaDias(dias){
  var l = ORDEM.filter(function(d){ return dias.indexOf(d)>=0; }), partes = [], i = 0;
  while(i<l.length){ var j = i; while(j+1<l.length && ORDEM.indexOf(l[j+1])===ORDEM.indexOf(l[j])+1) j++;
    partes.push(j-i>=2 ? ROT[l[i]]+" a "+ROT[l[j]] : l.slice(i, j+1).map(function(d){ return ROT[d]; }).join(", ")); i = j+1; }
  var t = partes.join(", "); return t.charAt(0).toUpperCase()+t.slice(1);
}
// texto que aparece ao passar o mouse (ou tocar) no item
function Dica(p){
  return e("span",{tabIndex:0, "aria-label":p.tip, className:"group relative inline-flex items-center outline-none "+(p.className||"")}, p.children,
    e("span",{role:"tooltip", className:"pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md px-2.5 py-1 text-[12px] font-normal group-hover:block group-focus:block", style:{background:W.cab, border:"1px solid #3b4a54", color:W.texto}}, p.tip));
}

// Só o resumo do mês: "Outubro · 0 faltas · 0 atrasos" (Marcus, 29/10/2026). Sem bolinhas; o resto fica no RH.
function Presenca(p){
  var m = p.pr.mes, faltas = (m.faltas||0)+(m.avisos||0), atrasos = m.atrasos||0;
  return e("div",{className:"flex flex-wrap items-center gap-x-3.5 gap-y-0.5 px-3 py-1.5", style:{background:W.cab, borderTop:"1px solid "+W.borda}},
    e("span",{className:"shrink-0 text-[10px] font-bold uppercase tracking-wide", style:{color:W.sec}}, m.nome),
    e("span",{className:"text-[12px] font-bold", style:{color:faltas ? COR.falta : W.sec}}, plural(faltas, "falta", "faltas")),
    e("span",{className:"text-[12px] font-bold", style:{color:atrasos ? COR.atraso : W.sec}}, plural(atrasos, "atraso", "atrasos")));
}

function CartaoHorario(p){
  var cx = use(), s = cx.state, ed = useState(false), editando = ed[0], setEditando = ed[1], h = horarioDe(p.cid), sit = situacaoAgora(p.cid);
  var cor = sit.tipo==="trabalhando" ? "#25d366" : sit.tipo==="almoco" ? "#f5c542" : "#8696a0";
  var pr = temAutorizacao("rh_presenca_chat", s.usuario) ? presencaChat(s, contato(p.cid).completo) : null;
  var difSex = h.dias.indexOf(5)>=0 && (h.sexIni!==h.ini || h.sexFim!==h.fim);
  var dias = difSex ? h.dias.filter(function(d){ return d!==5; }) : h.dias;
  var forte = {fontWeight:500};
  return e("div",{className:"shrink-0"},
    // 1ª linha: online/ausente/almoço + dias e horário — todo mundo vê
    e("div",{className:"flex flex-wrap items-center gap-x-3.5 gap-y-1 px-3 py-1.5 text-[12.5px]", style:{background:W.painel, borderBottom:pr ? "0" : "1px solid "+W.borda, color:W.texto}},
      h.h24
        ? e(Dica,{tip:"Trabalha 24 horas, todos os dias", className:"gap-1.5"}, e("span",{className:"block size-2 rounded-full", style:{background:cor}}), e("span",{style:forte}, "24 horas"), e("span",null, "todos os dias"))
        : [e(Dica,{key:"h", tip:sit.texto+(sit.volta ? " · "+(sit.tipo==="almoco" ? "volta" : "começa")+" às "+sit.volta : ""), className:"gap-1.5"}, e("span",{className:"block size-2 rounded-full", style:{background:cor}}),
            e("span",null, faixaDias(dias)+" ", e("span",{style:forte}, h.ini+"–"+h.fim))),
          difSex && e("span",{key:"s"}, "Sex ", e("span",{style:forte}, h.sexIni+"–"+h.sexFim)),
          e(Dica,{key:"a", tip:"Almoço", className:"gap-1"}, e(Ph,{n:"fork-knife", s:15, fill:true, style:{color:W.ouro}}), e("span",{style:{color:W.ouro}}, h.almIni+"–"+h.almFim))],
      p.pode && e("button",{onClick:function(){ setEditando(true); }, "aria-label":"Ajustar horário", title:"Ajustar horário", className:"ml-auto grid size-6 place-items-center rounded-full hover:bg-white/10"}, e(Ph,{n:"pencil-simple", s:15, style:{color:W.sec}}))),
    // 2ª faixa: só quem tem a autorização "rh_presenca_chat"
    pr && e(Presenca,{pr:pr}),
    editando && e(Janela,{titulo:"Horário de trabalho", fechar:function(){ setEditando(false); }, largura:440}, e(HorarioPessoa,{cid:p.cid, pode:true})));
}
export { CartaoHorario };

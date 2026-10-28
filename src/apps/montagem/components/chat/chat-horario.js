// Sorelly Admin · montagem — components/chat/chat-horario.js
// Topo da conversa com um colaborador (restaurado 27/10/2026, formato "V1-B" escolhido pelo Marcus):
//  1ª linha: bolinha online/ausente/almoço + dias e horário de trabalho — TODOS veem (vem do cadastro do RH, domain/rh.js).
//  2ª faixa: bolinhas dos últimos 10 dias + resumo do mês (falta COM justificativa × SEM justificativa, atraso, atestado) —
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

// V1-B: bolinhas dos 10 dias numa linha, resumo do mês (com cor por tipo) na linha de baixo
function Presenca(p){
  var pr = p.pr, m = pr.mes;
  var cab = m.nome+", dias 1 a "+m.ate+": ";
  return e("div",{className:"flex flex-col gap-1 px-3 py-1.5", style:{background:W.cab, borderTop:"1px solid "+W.borda}},
    e("div",{className:"flex items-center gap-2"},
      e("span",{className:"shrink-0 text-[10px] font-bold uppercase tracking-wide", style:{color:W.sec}}, "Últimos 10 dias"),
      e("span",{className:"flex items-center gap-[3px]", "aria-label":"Últimos 10 dias de trabalho"}, pr.dias.map(function(d){
        return e(Dica,{key:d.iso, tip:d.rotulo+" · "+d.r}, e("span",{className:"block size-[9px] rounded-full transition-transform group-hover:scale-125 group-focus:scale-125", style:{background:COR[d.k]}})); }))),
    e("div",{className:"flex flex-wrap items-center gap-x-3.5 gap-y-0.5"},
      e("span",{className:"shrink-0 text-[10px] font-bold uppercase tracking-wide", style:{color:W.sec}}, m.nome),
      m.faltas ? e(Dica,{tip:cab+plural(m.faltas, "falta", "faltas")+" sem justificativa"}, e("span",{className:"text-[11px] font-bold", style:{color:COR.falta}}, plural(m.faltas, "falta", "faltas")+" sem justificativa")) : null,
      m.avisos ? e(Dica,{tip:cab+plural(m.avisos, "falta", "faltas")+" com justificativa"}, e("span",{className:"text-[11px] font-bold", style:{color:COR.aviso}}, plural(m.avisos, "falta", "faltas")+" com justificativa")) : null,
      m.atrasos ? e(Dica,{tip:cab+plural(m.atrasos, "atraso", "atrasos")}, e("span",{className:"text-[11px] font-bold", style:{color:COR.atraso}}, plural(m.atrasos, "atraso", "atrasos"))) : null,
      e(Dica,{tip:m.atestados ? cab+plural(m.atestados, "atestado", "atestados") : "Nenhum atestado em "+m.nome.toLowerCase()}, e("span",{className:"text-[11px] font-medium", style:{color:W.sec}}, plural(m.atestados, "atestado", "atestados"))),
      !m.faltas && !m.avisos && !m.atrasos && !m.registrados ? e("span",{className:"text-[11px]", style:{color:W.sec}}, "O RH ainda não lançou a presença deste mês") : null));
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
      e(Dica,{tip:sit.texto+(sit.volta ? " · "+(sit.tipo==="almoco" ? "volta" : "começa")+" às "+sit.volta : ""), className:"gap-1.5"}, e("span",{className:"block size-2 rounded-full", style:{background:cor}}),
        e("span",null, faixaDias(dias)+" ", e("span",{style:forte}, h.ini+"–"+h.fim))),
      difSex && e("span",null, "Sex ", e("span",{style:forte}, h.sexIni+"–"+h.sexFim)),
      e(Dica,{tip:"Almoço", className:"gap-1"}, e(Ph,{n:"fork-knife", s:15, fill:true, style:{color:W.ouro}}), e("span",{style:{color:W.ouro}}, h.almIni+"–"+h.almFim)),
      p.pode && e("button",{onClick:function(){ setEditando(true); }, "aria-label":"Ajustar horário", title:"Ajustar horário", className:"ml-auto grid size-6 place-items-center rounded-full hover:bg-white/10"}, e(Ph,{n:"pencil-simple", s:15, style:{color:W.sec}}))),
    // 2ª faixa: só quem tem a autorização "rh_presenca_chat"
    pr && e(Presenca,{pr:pr}),
    editando && e(Janela,{titulo:"Horário de trabalho", fechar:function(){ setEditando(false); }, largura:440}, e(HorarioPessoa,{cid:p.cid, pode:true})));
}
export { CartaoHorario };

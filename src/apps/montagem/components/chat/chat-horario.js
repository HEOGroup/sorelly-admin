// Sorelly Admin · montagem — components/chat/chat-horario.js
// Topo da conversa com um colaborador (restaurado 27/10/2026, formato "V1-B" escolhido pelo Marcus):
//  1ª linha: bolinha online/ausente/almoço + dias e horário de trabalho — TODOS veem (vem do cadastro do RH, domain/rh.js).
import { horarioDe, situacaoAgora } from "@/apps/montagem/domain/chat-store";
import { HorarioPessoa } from "@/apps/montagem/components/chat/chat-info";
import { Janela, Ph, W } from "@/apps/montagem/components/chat/chat-ui";
import { e, useState } from "@/shared/react";

var ROT = ["dom","seg","ter","qua","qui","sex","sáb"], ORDEM = [1,2,3,4,5,6,0];
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

function CartaoHorario(p){
  var ed = useState(false), editando = ed[0], setEditando = ed[1], h = horarioDe(p.cid), sit = situacaoAgora(p.cid);
  var cor = sit.tipo==="trabalhando" ? "#25d366" : sit.tipo==="almoco" ? "#f5c542" : "#8696a0";
  var difSex = h.dias.indexOf(5)>=0 && (h.sexIni!==h.ini || h.sexFim!==h.fim);
  var dias = difSex ? h.dias.filter(function(d){ return d!==5; }) : h.dias;
  var forte = {fontWeight:500};
  return e("div",{className:"shrink-0"},
    // 1ª linha: online/ausente/almoço + dias e horário — todo mundo vê
    e("div",{className:"flex flex-wrap items-center gap-x-3.5 gap-y-1 px-3 py-1.5 text-[12.5px]", style:{background:W.painel, borderBottom:"1px solid "+W.borda, color:W.texto}},
      e(Dica,{tip:sit.texto+(sit.volta ? " · "+(sit.tipo==="almoco" ? "volta" : "começa")+" às "+sit.volta : ""), className:"gap-1.5"}, e("span",{className:"block size-2 rounded-full", style:{background:cor}}),
        e("span",null, faixaDias(dias)+" ", e("span",{style:forte}, h.ini+"–"+h.fim))),
      difSex && e("span",null, "Sex ", e("span",{style:forte}, h.sexIni+"–"+h.sexFim)),
      e(Dica,{tip:"Almoço", className:"gap-1"}, e(Ph,{n:"fork-knife", s:15, fill:true, style:{color:W.ouro}}), e("span",{style:{color:W.ouro}}, h.almIni+"–"+h.almFim)),
      p.pode && e("button",{onClick:function(){ setEditando(true); }, "aria-label":"Ajustar horário", title:"Ajustar horário", className:"ml-auto grid size-6 place-items-center rounded-full hover:bg-white/10"}, e(Ph,{n:"pencil-simple", s:15, style:{color:W.sec}}))),
    editando && e(Janela,{titulo:"Horário de trabalho", fechar:function(){ setEditando(false); }, largura:440}, e(HorarioPessoa,{cid:p.cid, pode:true})));
}
export { CartaoHorario };

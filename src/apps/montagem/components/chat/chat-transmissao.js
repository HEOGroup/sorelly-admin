// Sorelly Admin · montagem — components/chat/chat-transmissao.js
// Lista de transmissão (Marcus, 30/10/2026): uma mensagem para todos os funcionários ou só para os escolhidos. Cada pessoa recebe na conversa direta
// com quem enviou, como no WhatsApp (não vira grupo e ninguém vê quem mais recebeu). Só a Direção usa.
import { api, fotoDe } from "@/apps/montagem/domain/chat-store";
import { CONTATOS, sem } from "@/apps/montagem/domain/chat-contatos";
import { Avatar, Janela, Ph, W } from "@/apps/montagem/components/chat/chat-ui";
import { e, useState } from "@/shared/react";

function Transmissao(p){
  var eu = p.eu, sl = useState([]), marcados = sl[0], setMarcados = sl[1], bq = useState(""), busca = bq[0], setBusca = bq[1];
  var tx = useState(""), texto = tx[0], setTexto = tx[1], rp = useState(false), comReps = rp[0], setComReps = rp[1], ok = useState(null), enviado = ok[0], setEnviado = ok[1];
  var q = sem(busca);
  var pessoas = CONTATOS.filter(function(c){ return c.id!==eu && (c.tipo==="func" || (comReps && c.tipo==="rep")); });
  var visiveis = q ? pessoas.filter(function(c){ return sem(c.completo).indexOf(q)>=0 || sem(c.setorCurto).indexOf(q)>=0; }) : pessoas;
  var setores = {}, ordem = []; visiveis.forEach(function(c){ var k = c.tipo==="rep" ? "Representantes" : (c.setorCurto || c.setor || "Outros"); if(!setores[k]){ setores[k] = []; ordem.push(k); } setores[k].push(c); });
  ordem.sort(function(a, b){ return (a==="Representantes")-(b==="Representantes") || a.localeCompare(b, "pt-BR"); });
  var tem = function(id){ return marcados.indexOf(id)>=0; };
  var alternar = function(id){ setMarcados(tem(id) ? marcados.filter(function(i){ return i!==id; }) : marcados.concat([id])); };
  var todosDe = function(lista){ return lista.length>0 && lista.every(function(c){ return tem(c.id); }); };
  var alternarLista = function(lista){
    var ids = lista.map(function(c){ return c.id; });
    setMarcados(todosDe(lista) ? marcados.filter(function(i){ return ids.indexOf(i)<0; }) : marcados.concat(ids.filter(function(i){ return marcados.indexOf(i)<0; })));
  };
  var caixa = function(on){ return e("span",{className:"grid size-5 shrink-0 place-items-center rounded-md", style:{background:on ? W.verde : "transparent", border:"2px solid "+(on ? W.verde : W.sec), color:"#fff"}}, on && e(Ph,{n:"check", s:12, fill:true})); };
  var t = texto.trim(), pode = !!t && marcados.length>0;
  var enviar = function(){
    if(!pode) return;
    marcados.forEach(function(id){ api.sendMessage({conv:api.openDm(eu, id), eu:eu, texto:t}); });
    setEnviado(marcados.length); setTexto(""); setMarcados([]);
  };
  if(enviado) return e(Janela,{titulo:"Transmissão", fechar:p.fechar, largura:420},
    e("div",{className:"flex flex-col items-center gap-3 px-6 py-8 text-center"},
      e("span",{className:"grid size-14 place-items-center rounded-full", style:{background:W.verde, color:"#fff"}}, e(Ph,{n:"check", s:30, fill:true})),
      e("p",{className:"text-[13px] font-semibold"}, "Mensagem enviada para "+enviado+(enviado===1 ? " pessoa." : " pessoas.")),
      e("p",{className:"text-[13px]", style:{color:W.sec}}, "Cada uma recebeu na conversa direta com você."),
      e("div",{className:"flex gap-2"},
        e("button",{onClick:function(){ setEnviado(null); }, className:"h-8 rounded-full px-4 text-[13px] font-semibold", style:{background:W.campo, color:W.texto}}, "Nova transmissão"),
        e("button",{onClick:p.fechar, className:"h-8 rounded-full px-4 text-[13px] font-bold", style:{background:W.verde, color:"#fff"}}, "Fechar"))));
  return e(Janela,{titulo:"Transmissão", fechar:p.fechar, largura:560},
    e("div",{className:"flex min-h-0 flex-col", style:{height:"min(78vh, 640px)"}},
      e("div",{className:"flex shrink-0 items-center gap-2 px-3 pt-3"},
        e("div",{className:"flex h-8 min-w-0 flex-1 items-center gap-2 rounded-full px-3", style:{background:W.campo}}, e(Ph,{n:"magnifying-glass", s:15, style:{color:W.sec}}),
          e("input",{value:busca, onChange:function(ev){ setBusca(ev.target.value); }, placeholder:"Buscar pessoa ou setor", "aria-label":"Buscar", className:"min-w-0 flex-1 bg-transparent text-[13px] outline-none", style:{color:W.texto}})),
        e("button",{onClick:function(){ alternarLista(pessoas); }, className:"h-8 shrink-0 rounded-full px-3 text-[13px] font-semibold", style:{background:W.campo, color:W.texto}}, todosDe(pessoas) ? "Tirar todos" : "Todos"),
        e("button",{onClick:function(){ setMarcados(pessoas.filter(function(c){ return !fotoDe(c.id); }).map(function(c){ return c.id; })); }, title:"Marca só quem ainda não colocou foto no perfil", className:"h-8 shrink-0 rounded-full px-3 text-[13px] font-semibold", style:{background:W.campo, color:W.texto}}, "Sem foto")),
      e("label",{className:"flex shrink-0 cursor-pointer items-center gap-2 px-4 pb-1 pt-2 text-[13px]", style:{color:W.texto}},
        e("input",{type:"checkbox", checked:comReps, onChange:function(ev){ setComReps(ev.target.checked); }}), "Incluir representantes"),
      e("div",{className:"min-h-0 flex-1 overflow-y-auto"},
        !ordem.length && e("p",{className:"px-4 py-6 text-center text-[13px]", style:{color:W.sec}}, "Ninguém encontrado."),
        ordem.map(function(k){ var lista = setores[k];
          return e("div",{key:k},
            e("button",{onClick:function(){ alternarLista(lista); }, className:"flex w-full items-center gap-2.5 px-4 py-1.5 text-left", style:{background:W.cab}},
              caixa(todosDe(lista)), e("span",{className:"min-w-0 flex-1 truncate text-[11px] font-extrabold uppercase tracking-wide", style:{color:W.ouro}}, k), e("span",{className:"text-[11px]", style:{color:W.sec}}, lista.filter(function(c){ return tem(c.id); }).length+"/"+lista.length)),
            lista.map(function(c){ return e("button",{key:c.id, onClick:function(){ alternar(c.id); }, className:"flex w-full items-center gap-2.5 px-4 py-1.5 text-left hover:bg-white/5"},
              caixa(tem(c.id)), e(Avatar,{id:c.id, s:30}), e("span",{className:"min-w-0 flex-1"}, e("span",{className:"block truncate text-[13px]"}, c.completo), e("span",{className:"block truncate text-[11px]", style:{color:W.sec}}, c.funcao))); })); })),
      e("div",{className:"shrink-0 px-3 pb-3 pt-2", style:{borderTop:"1px solid "+W.borda}},
        e("textarea",{value:texto, onChange:function(ev){ setTexto(ev.target.value); }, rows:3, placeholder:"Escreva a mensagem (use *negrito* se quiser)", "aria-label":"Mensagem", className:"w-full resize-none rounded-xl px-3 py-2 text-[13px] outline-none", style:{background:W.campo, color:W.texto}}),
        e("div",{className:"mt-2 flex items-center gap-2"},
          e("span",{className:"flex-1 text-[13px]", style:{color:W.sec}}, marcados.length ? "Para "+marcados.length+(marcados.length===1 ? " pessoa" : " pessoas") : "Escolha quem recebe"),
          e("button",{onClick:enviar, disabled:!pode, className:"flex h-8 items-center gap-1.5 rounded-full px-4 text-[13px] font-bold disabled:opacity-40", style:{background:W.verde, color:"#fff"}}, e(Ph,{n:"paper-plane-right", s:15, fill:true}), "Enviar")))));
}
export { Transmissao };

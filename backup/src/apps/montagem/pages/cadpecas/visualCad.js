// Sorelly Admin · montagem — pages/cadpecas/visualCad.js
// Peças e ajudantes das abas do Cadastro de peças (setor Materiais & Estoque, azul #3B82F6). Regras de negócio NÃO ficam aqui (estão em domain/cadastro-pecas.js).
//   useCpc()   estado s.cpc, quem está logado, se é diretoria e exec(op, dados) → true se o domínio aceitou
//   Bt, Cel    botão azul e campo de célula (grava ao sair do campo, sem recarregar a tabela a cada letra)
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { cpcMigrar, cpcReduz } from "@/apps/montagem/domain/cadastro-pecas";
import { DIRETORIA, nomeDe } from "@/apps/montagem/domain/equipe";
import { use } from "@/apps/montagem/state/context";
import { e } from "@/shared/react";

var COR = "#3B82F6";   // azul das telas de Pagamentos a fornecedores (pedido do Marcus, 20/10/2026: mesmo estilo, sem blocos coloridos)
var NEUTRO = "#E5E7EB";   // número dos resumos: branco; só estado (ok, alerta, ruim) usa cor
var VAZIO = null;

function useCpc(){
  var cx = use(), s = cx.state, d = cx.dispatch, por = nomeDe(s.usuario);
  var admin = DIRETORIA.some(function(x){ return x.id===s.usuario; }) || s.usuario===29;
  if(!s.cpc && !VAZIO) VAZIO = cpcMigrar(null);
  var exec = function(op, dados){ var a = Object.assign({type:"CPC", op:op, por:por}, dados||{}); var r = cpcReduz(s, a); d(a); return !!(r.patch && r.patch.cpc); };
  return {s:s, c:s.cpc || VAZIO, por:por, admin:admin, exec:exec};
}

var BT = {normal:"bg-muted/50 hover:bg-white/15", forte:"bg-[#3B82F6] text-white hover:bg-[#60A5FA]", perigo:"bg-[#EF4444]/20 text-[#F87171] ring-1 ring-[#EF4444]/50 hover:bg-[#EF4444]/30"};
function Bt(p){
  return e("button",{type:"button", onClick:p.onClick, disabled:p.disabled, title:p.titulo, className:"inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[13px] font-bold transition disabled:cursor-not-allowed disabled:opacity-40 "+BT[p.tipo || "normal"]},
    p.ic && e(Ph,{n:p.ic, s:15}), p.children);
}
function Ic(p){
  return e("button",{type:"button", onClick:p.onClick, disabled:p.disabled, "aria-label":p.titulo, title:p.titulo, className:"grid size-7 shrink-0 place-items-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-35 "+(p.perigo ? "text-[#F87171] hover:bg-[#EF4444]/20" : "text-white/80 hover:bg-white/15")}, e(Ph,{n:p.ic, s:15}));
}
// célula editável: grava ao sair do campo (ou Enter) só se mudou; "key" muda quando o valor de fora muda
function Cel(p){
  var ini = p.v==null ? "" : String(p.v);
  return e("input",{key:ini, defaultValue:ini, type:p.data ? "date" : "text", readOnly:p.off, inputMode:p.texto || p.data ? "text" : "decimal", placeholder:p.dica, "aria-label":p.rot, title:p.rot,
    onBlur:function(ev){ if(!p.off && ev.target.value!==ini) p.onSet(ev.target.value); },
    onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); },
    className:"h-7 rounded-md bg-black/30 px-1 text-center text-[12px] ring-1 ring-white/15 outline-none focus:ring-white/45 "+(p.off ? "opacity-70 " : "")+(p.w || "w-14")});
}
// seleção simples (sem a opção vazia do Sel de compras): opcoes = [[valor, rótulo], ...]
function Sl(p){
  return e("select",{value:p.v, disabled:p.off, "aria-label":p.rot, title:p.rot, onChange:function(ev){ p.set(ev.target.value); }, className:"h-9 cursor-pointer rounded-lg bg-black/30 px-2 text-center text-[13px] ring-1 ring-white/15 outline-none focus:ring-white/45 disabled:cursor-not-allowed disabled:opacity-70 "+(p.className||"")},
    p.opcoes.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }));
}
export { COR, NEUTRO, useCpc, Bt, Ic, Cel, Sl };

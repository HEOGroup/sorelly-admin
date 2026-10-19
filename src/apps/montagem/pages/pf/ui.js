// Sorelly Admin · montagem — pages/pf/ui.js
// Peças comuns das telas de Pagamentos a Fornecedores (Financeiro): hook do estado, botão de mudar dados, campos, cartões, selos coloridos e janela (modal).
// Os dados e as contas ficam em domain/pf.js; as telas só desenham e chamam mut(c, function(pf){ ... }) para mudar dados (o sistema sincroniza as parcelas e salva).
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { nomeDe, podeConferirPag, podeFinanceiro } from "@/apps/montagem/domain/equipe";
import { pfReduz } from "@/apps/montagem/domain/pf";
import { BKC } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { Indicador } from "@/apps/montagem/components/padrao";
import { e } from "@/shared/react";

// cores dos selos (as mesmas classes b-* do HTML original)
var COR = {gray:"#94A3B8", green:"#22C55E", red:"#EF4444", orange:"#F59E0B", blue:"#3B82F6", purple:"#A855F7", cyan:"#06B6D4", yellow:"#EAB308"};
var brl = BKC;
var dbr = function(d){ return d ? d.split("-").reverse().join("/") : "—"; };
var num = function(t){ var n = Number(String(t||"").replace(/\./g,"").replace(",",".")); return isNaN(n) ? 0 : n; };
var fmtN = function(v){ return Number(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}); };
var th = function(t, c){ return e("th",{key:t, className:"whitespace-nowrap border-b border-border px-3 py-2 text-left text-[11.5px] font-semibold uppercase tracking-wide "+(c||"")}, t); };
var TD = "px-3 py-2 text-[13.5px] align-middle";
var CARD = "rounded-xl bg-linear-to-br from-[#3B82F6]/20 via-card to-card px-3 py-2 ring-1 ring-[#3B82F6]/40";

// estado + quem está agindo; edita = financeiro e diretoria
function usePf(){ var cx = use(), s = cx.state; return {s:s, d:cx.dispatch, pf:s.pf, por:nomeDe(s.usuario), edita:podeConferirPag(s.usuario) || podeFinanceiro(s.usuario)}; }
// muda os dados: fn recebe uma CÓPIA do estado (pf) para mexer e pode devolver um texto de aviso; depois o sistema sincroniza as parcelas e salva
function mut(c, fn){ c.d({type:"PF", op:"mut", fn:fn, por:c.por}); }
function op(c, nome, extra){ c.d(Object.assign({type:"PF", op:nome, por:c.por}, extra)); }
// igual a op(), mas se o domínio pedir confirmação (valor passa do que falta, parcelas que não fecham...), pergunta ao usuário e repete com forcar:true
function opc(c, nome, extra){ var a = Object.assign({type:"PF", op:nome, por:c.por}, extra), r = pfReduz(c.s, a); if(r.confirmar){ if(!window.confirm(r.msg+" Continuar mesmo assim?")) return; a.forcar = true; } c.d(a); }
function aviso(c, txt, tom){ c.d({type:"AVISO", txt:txt, tom:tom||"ok"}); }
function Campo(p){ return e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold "+(p.className||"")}, p.rot, p.children); }
function Sel(p){ return e("select",{value:p.value, "aria-label":p.label, className:INPUT+" h-10! cursor-pointer "+(p.className||"w-48"), onChange:function(ev){ p.onChange(ev.target.value); }}, p.children); }
function Txt(p){ return e("input",{value:p.value, type:p.type||"text", placeholder:p.ph||"", "aria-label":p.label, disabled:p.disabled, className:INPUT+" h-10! "+(p.className||"w-full"), onChange:function(ev){ p.onChange(ev.target.value); }, onKeyDown:p.onEnter ? function(ev){ if(ev.key==="Enter") p.onEnter(); } : undefined}); }
function Tile(p){ return e(Indicador,{t:p.t, v:p.v, cor:p.cor, sub:p.sub}); }   // padrão único: components/padrao.js
// selo colorido: <Chip cor="green">Quitado</Chip>; aceita o objeto {texto, cor} que as funções de domain/pf.js devolvem
function Chip(p){ var cor = COR[p.cor || (p.s && p.s.cor)] || COR.gray; return e("span",{className:"inline-flex w-fit whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-bold", style:{background:cor+"26", color:cor, boxShadow:"inset 0 0 0 1px "+cor+"44"}}, p.children || (p.s && p.s.texto)); }
function Modal(p){
  return e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-black/60 p-4", onClick:p.fechar},
    e("div",{className:"flex max-h-[92vh] w-full "+(p.largo ? "max-w-4xl" : "max-w-2xl")+" flex-col gap-3 overflow-y-auto rounded-2xl bg-card p-5 ring-1 ring-[#3B82F6]/50", onClick:function(ev){ ev.stopPropagation(); }},
      e("div",{className:"flex items-start justify-between gap-3"}, e("div",null, e("h2",{className:"font-heading text-xl font-bold"}, p.t), p.sub && e("p",{className:"text-[12.5px] text-muted-foreground"}, p.sub)), e("button",{onClick:p.fechar, "aria-label":"Fechar", className:"grid size-9 place-items-center rounded-lg bg-muted/50"}, e(Ph,{n:"x", s:16}))), p.children));
}
// botão pequeno de ícone (editar, excluir...)
function IconBtn(p){ return e("button",{type:"button", onClick:p.onClick, title:p.titulo, "aria-label":p.titulo, disabled:p.disabled, className:"grid size-8 place-items-center rounded-lg bg-muted/50 text-muted-foreground "+(p.perigo ? "hover:bg-destructive/20 hover:text-destructive" : "hover:bg-white/15 hover:text-white")+(p.disabled ? " opacity-40" : "")}, e(Ph,{n:p.ic, s:15})); }

export { COR, brl, dbr, num, fmtN, th, TD, CARD, usePf, mut, op, opc, aviso, Campo, Sel, Txt, Tile, Chip, Modal, IconBtn };

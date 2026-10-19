// Sorelly Admin · montagem — pages/producao/visualProd.js
// Peças e ajudantes das abas da Produção (setor Produção, cor turquesa #14B8A6). Regras de negócio NÃO ficam aqui (estão em domain/producao.js).
//   usePr()                    estado s.pr, quem está logado, se é diretoria e exec(op, dados) → true se o domínio aceitou
//   Bt, IndT, Barra, Aviso     botão turquesa, indicador com variação em seta, barra de proporção, linha formal "Somente a diretoria acessa"
import { degrade, ESTADO } from "@/apps/montagem/components/padrao";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { DIRETORIA, nomeDe } from "@/apps/montagem/domain/equipe";
import { formatarInteiro, prMigrar, prReduz } from "@/apps/montagem/domain/producao";
import { use } from "@/apps/montagem/state/context";
import { MONO } from "@/apps/montagem/ui/input";
import { e } from "@/shared/react";

var COR = "#14B8A6";
var VAZIO_PR = null;

// estado, permissão e execução de ações do módulo
function usePr(){
  var cx = use(), s = cx.state, d = cx.dispatch, por = nomeDe(s.usuario);
  var admin = DIRETORIA.some(function(x){ return x.id===s.usuario; }) || s.usuario===29;
  if(!s.pr && !VAZIO_PR) VAZIO_PR = prMigrar(null);
  var exec = function(op, dados){ var a = Object.assign({type:"PR", op:op, por:por}, dados||{}); var r = prReduz(s, a); d(a); return !!(r.patch && r.patch.pr); };
  return {s:s, pr:s.pr || VAZIO_PR, por:por, admin:admin, exec:exec};
}

// botão (forte = turquesa cheio); ic = ícone; mini = tamanho pequeno
var BT = {normal:"bg-muted/50 hover:bg-white/15", forte:"bg-[#14B8A6] text-[#04201C] hover:bg-[#2DD4BF]", perigo:"bg-[#EF4444]/20 text-[#F87171] ring-1 ring-[#EF4444]/50 hover:bg-[#EF4444]/30", marca:"bg-[#14B8A6]/25 text-[#99F6E4] ring-1 ring-[#14B8A6]/60 hover:bg-[#14B8A6]/35"};
function Bt(p){
  return e("button",{type:"button", onClick:p.onClick, disabled:p.disabled, title:p.titulo, className:"inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-bold transition disabled:cursor-not-allowed disabled:opacity-40 "+(p.mini ? "px-2 py-1 text-[11.5px] " : "px-3 py-2 text-[13px] ")+BT[p.tipo||"normal"]+" "+(p.className||"")},
    p.ic && e(Ph,{n:p.ic, s:p.mini ? 13 : 15}), p.children);
}
// botão só de ícone (dica obrigatória)
function Ic(p){
  return e("button",{type:"button", onClick:p.onClick, disabled:p.disabled, "aria-label":p.titulo, title:p.titulo, className:"grid size-8 shrink-0 place-items-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-35 "+(p.perigo ? "bg-[#EF4444]/15 text-[#F87171] hover:bg-[#EF4444]/30" : "bg-white/10 hover:bg-white/20")}, e(Ph,{n:p.ic, s:16}));
}

// variação em % contra o período anterior (seta verde = subiu, vermelha = caiu); null = sem base
function Variacao(p){
  var t = p.v; if(t==null || !isFinite(t)) return null;
  var cor = t>0.05 ? ESTADO.ok : t<-0.05 ? ESTADO.ruim : ESTADO.neutro, ic = t>0.05 ? "arrow-up" : t<-0.05 ? "arrow-down" : "minus";
  return e("span",{className:"mt-0.5 inline-flex items-center justify-center gap-0.5 text-[11px] font-bold leading-tight", style:{color:cor}, title:p.titulo},
    e(Ph,{n:ic, s:11}), Math.abs(t).toLocaleString("pt-BR", {minimumFractionDigits:1, maximumFractionDigits:1})+"%", p.rot && e("span",{className:"font-medium text-white/50"}, " "+p.rot));
}
// indicador (número até 20px, nome pequeno) com variação opcional (tend = %)
function IndT(p){
  var cor = ESTADO[p.cor] || p.cor || ESTADO.total;
  return e("div",{className:"flex min-w-0 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-center", style:degrade(p.cor)},
    e("b",{className:MONO+" text-[19px] leading-none", style:{color:cor}}, p.v),
    e("span",{className:"mt-1 text-[10.5px] font-bold uppercase leading-tight tracking-wide text-white/75"}, p.t),
    p.tend!==undefined && e(Variacao,{v:p.tend, rot:p.rotTend, titulo:p.tituloTend}));
}

// barra de proporção horizontal: rótulo à esquerda, barra, valor à direita (dentro dos gráficos simples)
function Barra(p){
  var pct = Math.max(2, Math.min(100, Math.round((p.pct||0)*100)));
  return e("div",{className:"grid items-center gap-2", style:{gridTemplateColumns:"minmax(4.5rem,9rem) 1fr auto"}},
    e("span",{className:"truncate text-right text-[12.5px] font-bold", title:p.rot}, p.rot),
    e("div",{className:"h-3 overflow-hidden rounded-full bg-white/10"}, e("div",{className:"h-full rounded-full", style:{width:pct+"%", background:"linear-gradient(90deg,"+(p.cor||COR)+"99,"+(p.cor||COR)+")"}})),
    e("span",{className:MONO+" whitespace-nowrap text-[12px] text-white/85"}, p.txt));
}

// linha formal para quem não tem acesso (sem dados)
function Aviso(p){
  return e("div",{className:"flex flex-col items-center justify-center gap-1.5 rounded-xl bg-black/20 px-4 py-8 text-center text-[13.5px] font-bold text-white/80 ring-1 ring-white/10"}, e(Ph,{n:"lock-simple", s:26, className:"text-white/45"}), p.children || "Somente a diretoria acessa.");
}

// resumo curto "N pç"
var pc = function(n){ return formatarInteiro(n)+" pç"; };

export { COR, usePr, Bt, Ic, Variacao, IndT, Barra, Aviso, pc };

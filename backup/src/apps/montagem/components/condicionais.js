// Sorelly Admin · montagem e bipagem — components/condicionais.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { condEstado, condNovas, condNums, condOk } from "@/apps/montagem/domain/condicionais";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MONO, MoneyInput } from "@/apps/montagem/ui/input";
import { RelogioB } from "@/apps/montagem/ui/relogio";
import { e, useEffect, useRef, useState } from "@/shared/react";

var COR_COND = {ok:"#16A34A", falta:"#DC2626", imp:"#7C3AED", pend:"#D97706", cedo:"#6B7280"};
function papelCond(k){ return ["bipando","bipado","retirado"].indexOf(k.status)>=0 ? "b" : "m"; }
function CondChips(p){
  var k = p.k, nums = condNums(k), fase = p.papel==="b" || p.papel==="m" ? p.papel : papelCond(k);
  var cedo = ["semvalor","pendente","ajuste"].indexOf(k.status)>=0;
  var max = p.max || 99, extra = nums.length - max;
  return e("span",{className:"inline-flex items-center gap-0.5"}, nums.slice(0, max).map(function(n, i){
    var st = condEstado(k, n), ok = fase==="b" ? st.b : st.m;
    var cor = ok ? COR_COND.ok : st.falta ? COR_COND.falta : st.imp ? COR_COND.imp : cedo ? COR_COND.cedo : COR_COND.pend;
    return e("span",{key:n, title:n+(ok ? " · conferida" : st.falta ? " · falta, aguardando impressão" : st.imp ? " · impressa" : " · a conferir"),
      className:"grid size-[18px] place-items-center rounded-full text-[10px] font-bold text-white txt-branco", style:{background:cor}}, st.falta ? "!" : i+1); }),
    extra>0 && e("span",{title:"Mais "+extra+" condicionais", className:"rounded-full bg-foreground/15 px-1 text-[10px] font-bold"}, "+"+extra));
}
function CondLista(p){
  var cx = use(), s = cx.state, d = cx.dispatch, k = p.k, nums = condNums(k), papel = p.papel;   // "m" | "b" | "sup"
  var novas = condNovas(k);
  var cx2 = function(num, pp, st, lb){ var marcado = pp==="b" ? st.b : st.m;
    return e("label",{className:"inline-flex cursor-pointer items-center gap-1.5 text-[12.5px] font-medium"+(st.falta?" opacity-50":"")},
      e("input",{type:"checkbox", checked:marcado, disabled:st.falta, onChange:function(){ d({type:"COND_CHK", id:k.id, num:num, papel:pp, v:!marcado, por:s.usuario}); },
        className:"size-4.5 "+(pp==="b"?"accent-sky-500":"accent-amber-500")}), lb); };
  var bt = function(txt, cor, onClick){ return e("button",{onClick:onClick, className:"h-7 rounded-md px-2 text-[11.5px] font-bold text-white txt-branco", style:{background:cor}}, txt); };
  // grade fixa: bolinha | número | check(s) | situação/ação — todas as linhas alinhadas, nada quebra para baixo
  var grade = papel==="sup" ? "grid-cols-[1.25rem_4.25rem_7rem_6.75rem_minmax(7rem,1fr)]" : "grid-cols-[1.25rem_4.25rem_5.5rem_minmax(0,1fr)]";
  var etq = function(txt, cor, tit){ return e("span",{title:tit, className:"whitespace-nowrap rounded px-1.5 py-0.5 text-[10.5px] font-bold text-white txt-branco", style:{background:cor}}, txt); };
  return e("div",{className:"flex flex-col gap-1.5"},
    nums.map(function(n, i){ var st = condEstado(k, n), feito = papel==="b" ? st.b : papel==="m" ? st.m : st.m && st.b;
      return e("div",{key:n, className:"grid items-center gap-2 whitespace-nowrap rounded-lg border border-border px-2.5 py-1.5 "+grade},
        e("span",{className:"grid size-5 place-items-center rounded-full text-[10.5px] font-bold text-white txt-branco", style:{background: st.falta ? COR_COND.falta : st.imp ? COR_COND.imp : "#A67C12"}}, i+1),
        e("b",{className:MONO+" text-[13.5px]"}, n),
        (papel==="m" || papel==="sup") && cx2(n, "m", st, papel==="sup" ? "Montadora" : "Peguei"),
        (papel==="b" || papel==="sup") && cx2(n, "b", st, papel==="sup" ? "Bipadora" : "Conferi"),
        e("span",{className:"flex items-center justify-end gap-1.5"},
          st.imp && etq("impressa", COR_COND.imp, "Impressa por "+nomeDe(st.imp.por)),
          st.falta && etq("falta", COR_COND.falta, "Pedido de impressão enviado à Deysiane"),
          !st.falta && !st.imp && !feito && bt("Falta", COR_COND.falta, function(){ d({type:"COND_FALTA", id:k.id, num:n, por:s.usuario}); }),
          st.falta && papel==="sup" && bt("Imprimi", COR_COND.imp, function(){ d({type:"COND_IMPRESSA", id:k.id, num:n, por:s.usuario}); }))); }),
    nums.some(function(n){return condEstado(k,n).falta;}) && papel!=="sup" && e("p",{className:"text-[11.5px] text-muted-foreground"},"A Deysiane recebe o pedido, imprime e marca como impressa. Depois é só dar o check."),
    novas.length>0 && e("p",{className:"pt-0.5 text-[12px]"}, e("span",{className:"text-muted-foreground"}, novas.length>1 ? "Novas condicionais: " : "Nova condicional: "), e("b",{className:MONO}, novas.join(" · "))));
}
function CondCampo(p){
  var k = p.k, nums = condNums(k);
  var ps = useState(null), pos = ps[0], setPos = ps[1], ref = useRef(null);
  useEffect(function(){
    if(!pos) return;
    var fechar = function(ev){ if(ref.current && ref.current.contains(ev.target)) return; setPos(null); };
    var sair = function(){ setPos(null); };
    document.addEventListener("mousedown", fechar); window.addEventListener("resize", sair);
    return function(){ document.removeEventListener("mousedown", fechar); window.removeEventListener("resize", sair); };
  }, [pos]);
  if(!nums.length) return p.vazio || null;
  return e("div",{ref:ref, className:"inline-flex"},
    e("button",{"aria-expanded":!!pos, title:"Condicionais: "+nums.join(", ")+" (clique para abrir)",
      onClick:function(ev){ if(pos){ setPos(null); return; } var r = ev.currentTarget.getBoundingClientRect(); setPos({top:r.bottom+4, left:Math.max(8, Math.min(window.innerWidth-490, r.left-200))}); },
      className:"inline-flex h-7 items-center gap-1 rounded-md px-1 ring-1 ring-transparent hover:bg-muted hover:ring-border "+(pos?"bg-muted ring-border!":"")}, e(CondChips,{k:k, max:3, papel:p.papel==="sup"?null:p.papel})),
    pos && e("div",{className:"fixed z-50 w-[30rem] rounded-lg bg-popover p-2.5 text-left shadow-xl ring-1 ring-foreground/10", style:{top:pos.top, left:pos.left}},
      e("p",{className:"mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground"}, "Condicionais de "+k.rev),
      e(CondLista,{k:k, papel:p.papel})));
}
function novasOk(v){ return v.length>0 && v.every(function(x){return x.length>=6;}); }
function NovasCond(p){
  var v = p.v, set = function(i, x){ var o = v.slice(); o[i] = x.replace(/\D/g,"").slice(0,8); p.onChange(o); };
  return e("div",{className:"flex flex-nowrap items-center gap-1.5"},
    v.map(function(x, i){ return e("div",{key:i, className:"relative shrink-0"},
      e("input",{inputMode:"numeric", value:x, placeholder: i ? "Outra nova condicional" : "Nº nova condicional", "aria-label":"Nova condicional "+(i+1),
        onChange:function(ev){ set(i, ev.target.value); }, className:INPUT+" "+(p.alto||"h-10!")+" "+(p.larg||"w-40")+" text-center "+MONO+(x && x.length<6 ? " border-warning!" : "")}),
      i>0 && e("button",{"aria-label":"Remover", onClick:function(){ p.onChange(v.filter(function(_,j){return j!==i;})); }, className:"absolute right-1 top-1/2 -translate-y-1/2 px-1 text-muted-foreground hover:text-destructive"},"×")); }),
    e("button",{onClick:function(){ p.onChange(v.concat([""])); }, title:"Adicionar outra nova condicional", className:"h-8 shrink-0 whitespace-nowrap rounded-md border border-dashed border-border px-2 text-[12px] font-semibold hover:bg-muted"},"+ outra"));
}
function LinhaFinalizar(p){
  var cx = use(), s = cx.state, d = cx.dispatch, k = p.k;
  var vr = useState(0), valor = vr[0], setValor = vr[1];
  var nc = useState([""]), novas = nc[0], setNovas = nc[1];
  var okC = condOk(k, "b"), ok = valor>0 && novasOk(novas) && okC;
  return e("div",{className:"flex flex-nowrap items-center gap-3 whitespace-nowrap"},
    e("span",{className:"text-[12px] font-semibold uppercase tracking-wide text-info"}, (k.bipId===s.usuario ? "Você está bipando" : nomeDe(k.bipId)+" bipando")),
    e(RelogioB,{desde:k.iniB, curto:true, className:"w-16 text-center text-lg font-bold text-info"}),
    e(MoneyInput,{value:valor, onChange:setValor, sm:true, label:"Total bipado", className:"h-8! w-32 text-center"}),
    condNums(k).length>0 && e("span",{className:"flex items-center gap-1.5 text-[12px] font-semibold "+(okC?"text-success":"text-warning")}, okC ? "Condicionais ok" : "Confira as condicionais", e(CondCampo,{k:k, papel:"b"})),
    e(NovasCond,{v:novas, onChange:setNovas, alto:"h-8!", larg:"w-36"}),
    e("span",{className:"ml-auto flex items-center gap-1.5"},
      p.fechar && e(Btn,{v:"ghost", sm:true, onClick:p.fechar},"Fechar"),
      e(Btn,{v:"primary", sm:true, ic:"check", disabled:!ok, title: !okC ? "Dê o check em todas as condicionais" : !novasOk(novas) ? "Digite a nova condicional" : "",
        onClick:function(){ d({type:"CONCLUIR_B", id:k.id, real:valor, novas:novas}); if(p.fechar) p.fechar(); }},"Finalizar bipagem")));
}

export { COR_COND, papelCond, CondChips, CondLista, CondCampo, novasOk, NovasCond, LinhaFinalizar };

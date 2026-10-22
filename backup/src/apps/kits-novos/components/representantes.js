// Sorelly Admin · kits novos Curitiba — components/representantes.js
// Controle por representante: kits novos recebidos, em aberto, atrasados, entregues, cancelados, % no prazo e recusas.
import { aberto, atrasado, mesDe } from "@/apps/kits-novos/domain/etapas";
import { diasEntre } from "@/apps/kits-novos/lib/datas";
import { recusasDaRep, recusasPorRep } from "@/apps/kits-novos/lib/bridge-montagem";
import { N1 } from "@/apps/kits-novos/lib/format";
import { use } from "@/apps/kits-novos/state/context";
import { Vazio } from "@/apps/kits-novos/ui/card";
import { Icon } from "@/apps/kits-novos/ui/icon";
import { Modal } from "@/apps/kits-novos/ui/modal";
import { e, useState } from "@/shared/react";

function estatisticas(s){
  var f = s.filtro, b = f.busca.toLowerCase(), rec = recusasPorRep(f.mes), m = {};
  s.dados.forEach(function(c){
    if(!c.rep) return; if(f.mes && mesDe(c)!==f.mes) return; if(b && c.rep.toLowerCase().indexOf(b)<0) return;
    var r = m[c.rep] || (m[c.rep] = {nome:c.rep, pegou:0, abertos:0, atrasados:0, entregues:0, cancelados:0, noPrazo:0, medidos:0, recusas:rec[c.rep]||0});
    r.pegou++;
    if(aberto(c)){ r.abertos++; if(atrasado(c, s.cfg)) r.atrasados++; }
    else if(c.st==="cancelado") r.cancelados++;
    else { r.entregues++; var dd = diasEntre(c.cad, c.ret); if(dd!=null && dd>=0){ r.medidos++; if(dd<=s.cfg.metaDias) r.noPrazo++; } }
  });
  return Object.keys(m).map(function(k){ return m[k]; }).sort(function(a,b){ return b.pegou-a.pegou || a.nome.localeCompare(b.nome); });
}

function Mini(p){
  return e(p.onClick ? "button" : "div",{type:p.onClick?"button":undefined, onClick:p.onClick, title:p.onClick?"Ver as recusas":undefined, className:"flex flex-col items-center rounded-lg px-1 py-1.5 "+p.bg+(p.onClick?" cursor-pointer ring-1 ring-orange-400/40 hover:ring-orange-400":"")},
    e("span",{className:"font-mono text-[17px] font-bold leading-none tabular-nums "+(p.cor||"")}, p.v),
    e("span",{className:"mt-1 text-[10.5px] leading-tight text-muted-foreground"}, p.l));
}

function CartaoRep(p){
  var r = p.r, pct = r.medidos ? r.noPrazo/r.medidos*100 : null;
  return e("div",{role:"button", tabIndex:0, onClick:p.abrir, onKeyDown:function(ev){ if(ev.key==="Enter") p.abrir(); }, title:"Ver os kits desta representante no quadro",
      className:"group flex flex-col items-center gap-2 rounded-xl bg-linear-to-br from-card to-muted/30 p-3 text-center ring-1 ring-foreground/10 transition hover:ring-primary/60"},
    e("div",{className:"flex w-full items-center justify-center gap-1.5"}, e(Icon,{n:"user", s:15, className:"text-primary"}),
      e("b",{className:"truncate text-[15px]"}, r.nome), e(Icon,{n:"chevright", s:14, className:"text-muted-foreground transition group-hover:translate-x-0.5"})),
    e("div",{className:"grid w-full grid-cols-3 gap-1.5"},
      e(Mini,{v:r.pegou, l:"Recebidos", bg:"bg-sky-500/10", cor:"text-sky-300"}),
      e(Mini,{v:r.abertos, l:"Em aberto", bg:"bg-amber-500/10", cor:"text-amber-300"}),
      e(Mini,{v:r.atrasados, l:"Atrasados", bg:r.atrasados?"bg-red-500/15":"bg-muted/40", cor:r.atrasados?"text-red-300":""}),
      e(Mini,{v:r.entregues, l:"Entregues", bg:"bg-emerald-500/10", cor:"text-emerald-300"}),
      e(Mini,{v:r.cancelados, l:"Cancelados", bg:"bg-muted/40"}),
      e(Mini,{v:r.recusas, l:"Recusas", bg:r.recusas?"bg-orange-500/15":"bg-muted/40", cor:r.recusas?"text-orange-300":"", onClick:r.recusas ? function(ev){ ev.stopPropagation(); p.recusas(); } : null})),
    e("div",{className:"flex w-full flex-col gap-1"},
      e("div",{className:"flex justify-between text-[11.5px] text-muted-foreground"}, e("span",null,"Entregues no prazo"), e("b",{className:"text-foreground"}, pct==null?"—":N1(pct)+"%")),
      e("div",{className:"h-1.5 overflow-hidden rounded-full bg-muted"}, e("div",{className:"h-full rounded-full bg-emerald-400", style:{width:(pct||0)+"%"}}))));
}

// Janela compacta com as recusas da representante (data, revendedora, motivo), respeitando o filtro de mês.
function ListaRecusas(p){
  var itens = recusasDaRep(p.rep, p.mes);
  return e(Modal,{open:true, titulo:"Recusas de "+p.rep, sub:itens.length+(itens.length===1?" recusa":" recusas")+(p.mes?" em "+p.mes:" no total"), confirmar:"Fechar", icone:"check", onClose:p.fechar, onConfirmar:p.fechar},
    e("div",{className:"overflow-hidden rounded-lg ring-1 ring-foreground/10"},
      e("div",{className:"grid grid-cols-[4.5rem_1fr_1.4fr] bg-muted/40 px-3 py-1.5 text-center text-[12px] font-semibold"}, e("span",null,"Data"), e("span",null,"Revendedora"), e("span",null,"Motivo")),
      itens.map(function(r, i){ return e("div",{key:i, className:"grid grid-cols-[4.5rem_1fr_1.4fr] items-center border-t border-border/60 px-3 py-1.5 text-center text-[13px]"}, e("span",{className:"font-mono"}, r.data), e("span",{className:"truncate"}, r.rev), e("span",null, r.motivo)); })));
}

function Representantes(){
  var cx = use(), s = cx.state, d = cx.dispatch, lista = estatisticas(s), vr = useState(""), verRec = vr[0];
  if(!lista.length) return e(Vazio,{txt:"Nenhuma representante encontrada neste filtro."});
  var tot = lista.reduce(function(a,r){ return a+r.pegou; }, 0);
  return e("div",{className:"flex flex-col gap-3"},
    e("p",{className:"text-center text-sm text-muted-foreground"}, lista.length+" representantes · "+tot+" kits novos recebidos. Clique em uma para ver os kits dela."),
    e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"},
      lista.map(function(r){ return e(CartaoRep,{key:r.nome, r:r, recusas:function(){ vr[1](r.nome); }, abrir:function(){ d({type:"FILTRO", f:{rep:r.nome, busca:""}}); d({type:"MODO", modo:"quadro"}); }}); })),
    verRec && e(ListaRecusas,{rep:verRec, mes:s.filtro.mes, fechar:function(){ vr[1](""); }}));
}

export { Representantes, estatisticas };

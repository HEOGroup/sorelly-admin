// Sorelly Admin · kits novos Curitiba — components/quadro.js
// Quadro kanban das etapas (usa a peça padrão shared/kanban.js). Mover = abre os mesmos diálogos de hoje (avançar, voltar, cancelar) ou reativa.
import { ETAPAS, aberto, atrasado, dataEtapa, dataFim, diasNaEtapa, etapaDe, seguro } from "@/apps/kits-novos/domain/etapas";
import { diasDesde, tsDe } from "@/apps/kits-novos/lib/datas";
import { use } from "@/apps/kits-novos/state/context";
import { Kanban } from "@/shared/kanban";
import { e, useState } from "@/shared/react";

var COR = {aguardando:"#F59E0B", cadastrada:"#9ca3af", liberado:"#a78bfa", solicitado:"#d4a64a", aceito:"#f0c36b", contato:"#38bdf8", agendado:"#c084fc", montando:"#facc15", bipado:"#60a5fa", retirado:"#fb923c", entregue:"#4ade80", devolvido:"#22d3ee", cancelado:"#f87171"};

// MODELO B (Marcus, 05/11/2026): cartão de duas linhas. Linha 1: nome e dias na etapa (vermelho = atrasada, verde = no prazo). Linha 2: representante, bairro, cidade e profissão.
// O "Mover para…" saiu do cartão: está no botão ⋯ (lista das outras etapas). A barra da lateral é vermelha (atrasada) ou verde (no prazo).
function MenuMover(p){
  var st = useState(false), aberto2 = st[0];
  return e("span",{className:"relative inline-flex", onClick:function(ev){ ev.stopPropagation(); }},
    e("button",{type:"button", "aria-label":"Mover para outra etapa", title:"Mover para outra etapa", onClick:function(){ st[1](!aberto2); }, className:"-my-1.5 h-8 w-7 rounded-md text-[13px] leading-none text-white/80 hover:bg-white/10"}, "⋯"),
    aberto2 && e("span",{className:"fixed inset-0 z-30", onClick:function(){ st[1](false); }}),
    aberto2 && e("span",{className:"absolute right-0 top-7 z-40 flex min-w-40 flex-col rounded-lg border border-border bg-card p-1 shadow-xl"},
      e("span",{className:"px-2 py-1 text-[11px] font-semibold uppercase tracking-[.05em]"}, "Mover para"),
      p.destinos.map(function(x){ return e("button",{key:x.k, type:"button", onClick:function(){ st[1](false); p.mover(p.c, p.c.st, x.k); }, className:"h-8 rounded-md px-2 text-left text-[13px] hover:bg-white/10"}, x.nome); })));
}
function CartaoKit(p){
  var s = use().state, c = p.c, atr = atrasado(c, s.cfg), expo = c.obs && /EXPOSITOR/i.test(c.obs), esp = seguro(c), dias = esp && c.apEm ? diasDesde(c.apEm) : diasNaEtapa(c);
  var linha2 = [c.rep ? c.rep : "sem representante", [c.bai, c.cid].filter(Boolean).join(", "), c.prof].filter(Boolean).join(" · ");
  return e("div",{className:"flex cursor-pointer flex-col", onClick:p.abrir},
    e("div",{className:"flex items-start justify-between gap-2"},
      e("b",{className:"text-[13px] leading-tight"}, (c.tipo==="Retornando" ? "↻ " : "")+c.nome, expo && e("span",{className:"ml-1.5 rounded-md bg-warning/20 px-1.5 text-[11px] font-semibold text-warning"}, "Expositor")),
      e("span",{className:"flex shrink-0 items-center gap-0.5"},
        aberto(c) && e("span",{className:"text-[11px] font-semibold tabular-nums "+(atr ? "text-destructive" : esp ? "text-warning" : "text-success"), title:atr ? "Atrasada" : esp ? "Aguardando peça" : "No prazo"}, dias+" d"),
        e(MenuMover,{c:c, destinos:p.destinos, mover:p.mover}))),
    e("span",{className:"text-[11px] leading-tight text-white/70", title:"Representante, bairro, cidade e profissão"}, linha2));
}

function Quadro(p){
  var cx = use(), s = cx.state, d = cx.dispatch, cs = p.dados;
  var grupos = ETAPAS.slice(0, 1).concat([{k:"aguardando", nome:"Aguardando peça"}], ETAPAS.slice(1), [{k:"cancelado", nome:"Cancelado"}]).filter(function(g){ return !s.filtro.st || s.filtro.st===g.k; });   // Aguardando peça: coluna ao lado de Liberado (Michele, 06/11/2026)
  var colunas = grupos.map(function(g){
    var itens = cs.filter(function(c){ return (g.k==="aguardando" ? seguro(c) : c.st===g.k && !seguro(c)) && (aberto(c) || diasDesde(dataFim(c)) <= s.cfg.ocultarApos); })
      .sort(function(a,b){ if(!aberto(a)) return (tsDe(dataFim(b))||0)-(tsDe(dataFim(a))||0); return (atrasado(b,s.cfg)?1:0)-(atrasado(a,s.cfg)?1:0) || (tsDe(dataEtapa(a))||0)-(tsDe(dataEtapa(b))||0); });
    var prazo = s.cfg.prazos[g.k], atr = itens.filter(function(c){ return atrasado(c,s.cfg); }).length;
    return {k:g.k, titulo:g.nome, cor:COR[g.k], itens:itens,
      dica:(prazo ? "prazo "+prazo+(prazo>1?" dias":" dia") : g.k==="aguardando" ? "sem prazo" : g.k==="devolvido" ? "últimos "+s.cfg.ocultarApos+" dias" : "")+(atr>0 ? (prazo?" · ":"")+atr+(atr>1?" atrasadas":" atrasada") : "")};
  });
  var aviso = function(txt){ d({type:"AVISO", txt:txt}); };
  var mover = function(item, de, para){
    var c = s.dados.find(function(x){ return x.id===item.id; }); if(!c || de===para) return;
    if(para==="aguardando"){ if(!aberto(c) || c.st==="entregue"){ aviso("Só kit antes da entrega pode ficar em Aguardando peça."); return; } if(!c.ap) d({type:"SEGURAR", id:c.id, on:true}); return; }
    if(de==="aguardando" && para!=="cancelado"){ if(para===c.st){ d({type:"SEGURAR", id:c.id, on:false}); } else { aviso("Para sair de Aguardando peça, leve o kit de volta para "+etapaDe(c).nome+" (a etapa em que ele estava). Depois avance normalmente."); } return; }
    if(c.st==="cancelado") { d({type:"REATIVAR", id:c.id}); return; }
    if(!aberto(c)) { aviso("Kit já devolvido: não dá para mover."); return; }
    if(para==="cancelado") { d({type:"DIALOGO", d:{tipo:"cancelar", id:c.id}}); return; }
    var n = etapaDe(c).n, alvo = ETAPAS.find(function(x){ return x.k===para; });
    if(!alvo) return;
    if(alvo.n===n+1) { d({type:"DIALOGO", d:{tipo:"avancar", id:c.id}}); return; }
    if(alvo.n===n-1) { d({type:"DIALOGO", d:{tipo:"voltar", id:c.id}}); return; }
    aviso("Mova uma etapa por vez.");
  };
  var corBarra = function(c, col){ return aberto(c) ? (atrasado(c, s.cfg) ? "#EF4444" : seguro(c) ? "#F59E0B" : "#4CC38A") : col.cor; };
  return e(Kanban,{colunas:colunas, onMover:mover, vazio:"Nenhuma revendedora nesta etapa.", compacto:true, semMover:true, corBarra:corBarra,
    card:function(c, col){ return e(CartaoKit,{c:c, mover:mover, destinos:grupos.filter(function(g){ return col.k==="aguardando" ? (g.k===c.st || g.k==="cancelado") : g.k!==col.k; }), abrir:function(){ d({type:"DIALOGO", d:{tipo:"detalhe", id:c.id}}); }}); }});
}

export { Quadro };

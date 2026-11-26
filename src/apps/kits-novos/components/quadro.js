// Sorelly Admin · kits novos Curitiba — components/quadro.js
// Quadro kanban das etapas (usa a peça padrão shared/kanban.js). Mover = abre os mesmos diálogos de hoje (avançar, voltar, cancelar) ou reativa.
import { ETAPAS, aberto, atrasado, colunasQuadro, dataEtapa, dataFim, diasNaEtapa, etapaDe, seguro } from "@/apps/kits-novos/domain/etapas";
import { diasDesde, tsDe } from "@/apps/kits-novos/lib/datas";
import { titulo } from "@/apps/kits-novos/domain/padroniza";
import { use } from "@/apps/kits-novos/state/context";
import { respostasDoApp } from "@/apps/kits-novos/lib/bridge-montagem";
import { Kanban } from "@/shared/kanban";
import { e, useEffect, useState } from "@/shared/react";

var COR = {aguardando:"#F59E0B", cadastrada:"#22c55e", liberado:"#a78bfa", solicitado:"#d4a64a", aceito:"#f0c36b", contato:"#38bdf8", agendado:"#c084fc", montando:"#facc15", bipado:"#60a5fa", retirado:"#fb923c", entregue:"#4ade80", devolvido:"#22d3ee", cancelado:"#f87171"};

// MODELO B (Marcus, 05/11/2026): cartão de duas linhas. Linha 1: nome e dias na etapa (vermelho = atrasada, verde = no prazo). Linha 2: representante, bairro, cidade e profissão.
// O "Mover para…" saiu do cartão: está no botão ⋯ (lista das outras etapas). A barra da lateral é vermelha (atrasada) ou verde (no prazo).
function MenuMover(p){
  var st = useState(false), aberto2 = st[0];
  return e("span",{className:"relative inline-flex", onClick:function(ev){ ev.stopPropagation(); }},
    e("button",{type:"button", "aria-label":"Mover para outra etapa", title:"Mover para outra etapa", onClick:function(){ st[1](!aberto2); }, className:"-my-1 h-6 w-6 rounded-md text-[13px] leading-none text-white/80 hover:bg-white/10"}, "⋯"),
    aberto2 && e("span",{className:"fixed inset-0 z-30", onClick:function(){ st[1](false); }}),
    aberto2 && e("span",{className:"absolute right-0 top-7 z-40 flex min-w-40 flex-col rounded-lg border border-border bg-card p-1 shadow-xl"},
      e("span",{className:"px-2 py-1 text-[11px] font-semibold uppercase tracking-[.05em]"}, "Mover para"),
      p.destinos.map(function(x){ return e("button",{key:x.k, type:"button", onClick:function(){ st[1](false); p.mover(p.c, p.c.st, x.k); }, className:"h-8 rounded-md px-2 text-left text-[13px] hover:bg-white/10"}, x.nome); })));
}
function CartaoKit(p){
  var s = use().state, c = p.c, atr = atrasado(c, s.cfg), expo = c.obs && /EXPOSITOR/i.test(c.obs), esp = seguro(c), dias = esp && c.apEm ? diasDesde(c.apEm) : diasNaEtapa(c);
  var linha2 = infoDaEtapa(c);
  // UMA linha só: nome, informação da etapa e dias (a informação só desce para a linha de baixo se não couber)
  return e("div",{className:"flex cursor-pointer flex-col", onClick:p.abrir},
    e("div",{className:"flex items-center justify-between gap-2"},
      e("b",{className:"whitespace-nowrap text-[13px] leading-tight"}, (c.tipo==="Retornando" ? "↻ " : "")+titulo(c.nome), expo && e("span",{className:"ml-1.5 rounded-md bg-warning/20 px-1.5 text-[11px] font-semibold text-warning"}, "Expositor")),
      e("span",{className:"flex shrink-0 items-center gap-0.5"},
        aberto(c) && e("span",{className:"text-[11px] font-semibold tabular-nums "+(atr ? "text-destructive" : esp ? "text-warning" : "text-success"), title:atr ? "Atrasada" : esp ? "Aguardando peça" : "No prazo"}, dias+" d"),
        e(MenuMover,{c:c, destinos:p.destinos, mover:p.mover}))),
    e("div",{className:"flex w-0 min-w-full items-center justify-between gap-2 text-[11px] leading-tight text-white/80"},
      e("span",null, linha2 || "Sem bairro e cidade"),
      c.st==="cadastrada" && c.cad && e("span",{className:"shrink-0 tabular-nums", title:"Data do cadastro"}, "Cadastro "+String(c.cad).slice(8, 10)+"/"+String(c.cad).slice(5, 7))),   // Marcus, 26/11/2026: na Cadastrada aparece o dia e o mês do cadastro
    p.resp && e(SeloApp,{r:p.resp}));
}
// O QUE APARECE NO CARTÃO EM CADA ETAPA (Marcus, 26/11/2026: cartão compacto): antes de ter representante só bairro e cidade; do Solicitado em diante entra a representante.
function infoDaEtapa(c){
  var local = [c.bai, c.cid].filter(Boolean).join(", ");
  return local;   // Marcus, 26/11/2026: todos os cartões iguais: nome em cima, bairro e cidade embaixo
}
// Resposta da representante no APP REAL (05/11/2026): agendou (dia e período), já entrou na listagem dela ou recusou (volta sem representante)
var PERIODO = {manha:"manhã", tarde:"tarde", noite:"noite"};
var diaBR = function(i){ return i ? String(i).slice(8, 10)+"/"+String(i).slice(5, 7) : ""; };
function SeloApp(p){
  var r = p.r, txt = r.tipo==="recusado" ? "Recusou no app"+(r.rep ? " · "+r.rep : "") : (r.tipo==="na listagem" ? "Na listagem do app" : "Agendado no app")+(r.data ? " · "+diaBR(r.data) : "")+(r.periodo ? " · "+(PERIODO[r.periodo]||r.periodo) : "");
  return e("span",{title:r.tipo==="recusado" && r.motivo ? "Motivo: "+r.motivo : txt, className:"rounded-md px-1.5 text-[11px] font-semibold "+(r.tipo==="recusado" ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success")}, txt);
}

// resposta do app gravada no próprio kit pelo servidor (25/11/2026): vale em qualquer computador; só enquanto o kit está com a representante
function respDoKit(c){ var a = c.app; if(!a || !aberto(c) || (a.tipo==="agendado" && c.st!=="solicitado") || (a.tipo==="recusado" && c.rep)) return null; return {tipo:a.tipo, data:a.data, periodo:a.periodo, motivo:a.motivo, rep:a.rep}; }
function Quadro(p){
  var cx = use(), s = cx.state, d = cx.dispatch, cs = p.dados;
  var tk = useState(0), setTick = tk[1];   // resposta do app chega pelo servidor: redesenha a cada 20 s
  useEffect(function(){ var t = setInterval(function(){ setTick(function(n){ return n+1; }); }, 20000); return function(){ clearInterval(t); }; }, []);
  var resps = respostasDoApp();
  var grupos = colunasQuadro().filter(function(g){ return !s.filtro.st || s.filtro.st===g.k; });   // Aguardando peça: coluna ao lado de Liberado (Michele, 06/11/2026)
  var colunas = grupos.map(function(g){
    var itens = cs.filter(function(c){ return c.st===g.k && (aberto(c) || diasDesde(dataFim(c)) <= s.cfg.ocultarApos); })
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
  return e(Kanban,{colunas:colunas, onMover:mover, vazio:"Nenhuma revendedora nesta etapa.", compacto:true, colado:true, semMover:true,
    card:function(c, col){ return e(CartaoKit,{c:c, resp:resps[c.id] || respDoKit(c), mover:mover, destinos:grupos.filter(function(g){ return col.k==="aguardando" ? (g.k===c.st || g.k==="cancelado") : g.k!==col.k; }), abrir:function(){ d({type:"DIALOGO", d:{tipo:"detalhe", id:c.id}}); }}); }});
}

export { Quadro };

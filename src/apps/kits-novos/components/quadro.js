// Sorelly Admin · kits novos Curitiba — components/quadro.js
// Quadro kanban das etapas (usa a peça padrão shared/kanban.js). Mover = abre os mesmos diálogos de hoje (avançar, voltar, cancelar) ou reativa.
import { Contatos } from "@/apps/kits-novos/components/badges";
import { ETAPAS, aberto, atrasado, dataEtapa, diasNaEtapa, etapaDe } from "@/apps/kits-novos/domain/etapas";
import { diasDesde, tsDe } from "@/apps/kits-novos/lib/datas";
import { use } from "@/apps/kits-novos/state/context";
import { Kanban } from "@/shared/kanban";
import { e } from "@/shared/react";

var COR = {cadastrada:"#9ca3af", liberado:"#a78bfa", solicitado:"#d4a64a", bipado:"#60a5fa", entregue:"#4ade80", cancelado:"#f87171"};

function CartaoKit(p){
  var s = use().state, c = p.c, atr = atrasado(c, s.cfg), expo = c.obs && /EXPOSITOR/i.test(c.obs);
  return e("div",{className:"flex cursor-pointer flex-col items-center gap-1", onClick:p.abrir},
    e("b",{className:"text-[13px] leading-tight"}, (c.tipo==="Retornando" ? "↻ " : "")+c.nome),
    e("span",{className:"text-[11.5px] leading-tight text-white/70"}, c.rep ? c.rep : "sem representante"),
    e("span",{className:"text-[11.5px] leading-tight text-white/60"}, c.cid||"—"),
    e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"},
      aberto(c) && e("span",{className:"font-mono text-[11.5px] font-semibold "+(atr?"text-destructive":"text-white/80")}, diasNaEtapa(c)+(diasNaEtapa(c)===1?" dia":" dias")+(atr?" (atrasada)":"")),
      e(Contatos,{c:c}),
      expo && e("span",{className:"rounded-md bg-warning/20 px-1.5 text-[11px] font-semibold text-warning"}, "Expositor")));
}

function Quadro(p){
  var cx = use(), s = cx.state, d = cx.dispatch, cs = p.dados;
  var grupos = ETAPAS.concat([{k:"cancelado", nome:"Cancelado"}]).filter(function(g){ return !s.filtro.st || s.filtro.st===g.k; });
  var colunas = grupos.map(function(g){
    var itens = cs.filter(function(c){ return c.st===g.k && (aberto(c) || diasDesde(c.ret) <= s.cfg.ocultarApos); })
      .sort(function(a,b){ if(!aberto(a)) return (tsDe(b.ret)||0)-(tsDe(a.ret)||0); return (atrasado(b,s.cfg)?1:0)-(atrasado(a,s.cfg)?1:0) || (tsDe(dataEtapa(a))||0)-(tsDe(dataEtapa(b))||0); });
    var prazo = s.cfg.prazos[g.k], atr = itens.filter(function(c){ return atrasado(c,s.cfg); }).length;
    return {k:g.k, titulo:g.nome, cor:COR[g.k], itens:itens,
      dica:(prazo ? "prazo "+prazo+(prazo>1?" dias":" dia") : g.k==="entregue" ? "últimos "+s.cfg.ocultarApos+" dias" : "")+(atr>0 ? (prazo?" · ":"")+atr+(atr>1?" atrasadas":" atrasada") : "")};
  });
  var aviso = function(txt){ d({type:"AVISO", txt:txt}); };
  var mover = function(item, de, para){
    var c = s.dados.find(function(x){ return x.id===item.id; }); if(!c || de===para) return;
    if(c.st==="cancelado") { d({type:"REATIVAR", id:c.id}); return; }
    if(!aberto(c)) { aviso("Kit já entregue: não dá para mover."); return; }
    if(para==="cancelado") { d({type:"DIALOGO", d:{tipo:"cancelar", id:c.id}}); return; }
    var n = etapaDe(c).n, alvo = ETAPAS.find(function(x){ return x.k===para; });
    if(!alvo) return;
    if(alvo.n===n+1) { d({type:"DIALOGO", d:{tipo:"avancar", id:c.id}}); return; }
    if(alvo.n===n-1) { d({type:"DIALOGO", d:{tipo:"voltar", id:c.id}}); return; }
    aviso("Mova uma etapa por vez.");
  };
  return e(Kanban,{colunas:colunas, onMover:mover, vazio:"Nenhuma revendedora nesta etapa.",
    card:function(c){ return e(CartaoKit,{c:c, abrir:function(){ d({type:"DIALOGO", d:{tipo:"detalhe", id:c.id}}); }}); }});
}

export { Quadro };

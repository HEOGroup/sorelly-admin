// Sorelly Admin · kits novos Curitiba — components/quadro.js
// Quadro kanban das etapas (usa a peça padrão shared/kanban.js). Mover = abre os mesmos diálogos de hoje (avançar, voltar, cancelar) ou reativa.
import { ETAPAS, aberto, atrasado, dataEtapa, dataFim, diasNaEtapa, etapaDe } from "@/apps/kits-novos/domain/etapas";
import { diasDesde, tsDe } from "@/apps/kits-novos/lib/datas";
import { use } from "@/apps/kits-novos/state/context";
import { respostasDoApp } from "@/apps/kits-novos/lib/bridge-montagem";
import { Kanban } from "@/shared/kanban";
import { e, useEffect, useState } from "@/shared/react";

var COR = {cadastrada:"#9ca3af", liberado:"#a78bfa", solicitado:"#d4a64a", aceito:"#f0c36b", contato:"#38bdf8", agendado:"#c084fc", montando:"#facc15", bipado:"#60a5fa", retirado:"#fb923c", entregue:"#4ade80", devolvido:"#22d3ee", cancelado:"#f87171"};

function CartaoKit(p){
  var s = use().state, c = p.c, atr = atrasado(c, s.cfg), expo = c.obs && /EXPOSITOR/i.test(c.obs);
  return e("div",{className:"flex cursor-pointer flex-col items-center gap-1", onClick:p.abrir},
    e("b",{className:"text-[13px] leading-tight"}, (c.tipo==="Retornando" ? "↻ " : "")+c.nome),
    e("span",{className:"text-[11.5px] leading-tight text-white/70"}, c.rep ? c.rep : "sem representante"),
    e("span",{className:"text-[11.5px] leading-tight text-white/80", title:"Bairro e cidade"}, (c.bai ? c.bai+" · " : "")+(c.cid||"—")),
    c.prof && e("span",{className:"text-[11.5px] leading-tight text-white/60", title:"Profissão"}, c.prof),
    e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"},
      aberto(c) && e("span",{className:"font-mono text-[11.5px] font-semibold "+(atr?"text-destructive":"text-white/80")}, diasNaEtapa(c)+(diasNaEtapa(c)===1?" dia":" dias")+(atr?" (atrasada)":"")),
      expo && e("span",{className:"rounded-md bg-warning/20 px-1.5 text-[11px] font-semibold text-warning"}, "Expositor")),
    p.resp && e(SeloApp,{r:p.resp}));
}
// Resposta da representante no APP REAL (05/11/2026): agendou (dia e período), já entrou na listagem dela ou recusou (volta sem representante)
var PERIODO = {manha:"manhã", tarde:"tarde", noite:"noite"};
var diaBR = function(i){ return i ? String(i).slice(8, 10)+"/"+String(i).slice(5, 7) : ""; };
function SeloApp(p){
  var r = p.r, txt = r.tipo==="recusado" ? "Recusou no app"+(r.rep ? " · "+r.rep : "") : (r.tipo==="na listagem" ? "Na listagem do app" : "Agendado no app")+(r.data ? " · "+diaBR(r.data) : "")+(r.periodo ? " · "+(PERIODO[r.periodo]||r.periodo) : "");
  return e("span",{title:r.tipo==="recusado" && r.motivo ? "Motivo: "+r.motivo : txt, className:"rounded-md px-1.5 text-[11px] font-semibold "+(r.tipo==="recusado" ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success")}, txt);
}

function Quadro(p){
  var cx = use(), s = cx.state, d = cx.dispatch, cs = p.dados;
  var tk = useState(0), setTick = tk[1];   // resposta do app chega pelo servidor: redesenha a cada 20 s
  useEffect(function(){ var t = setInterval(function(){ setTick(function(n){ return n+1; }); }, 20000); return function(){ clearInterval(t); }; }, []);
  var resps = respostasDoApp();
  var grupos = ETAPAS.concat([{k:"cancelado", nome:"Cancelado"}]).filter(function(g){ return !s.filtro.st || s.filtro.st===g.k; });
  var colunas = grupos.map(function(g){
    var itens = cs.filter(function(c){ return c.st===g.k && (aberto(c) || diasDesde(dataFim(c)) <= s.cfg.ocultarApos); })
      .sort(function(a,b){ if(!aberto(a)) return (tsDe(dataFim(b))||0)-(tsDe(dataFim(a))||0); return (atrasado(b,s.cfg)?1:0)-(atrasado(a,s.cfg)?1:0) || (tsDe(dataEtapa(a))||0)-(tsDe(dataEtapa(b))||0); });
    var prazo = s.cfg.prazos[g.k], atr = itens.filter(function(c){ return atrasado(c,s.cfg); }).length;
    return {k:g.k, titulo:g.nome, cor:COR[g.k], itens:itens,
      dica:(prazo ? "prazo "+prazo+(prazo>1?" dias":" dia") : g.k==="devolvido" ? "últimos "+s.cfg.ocultarApos+" dias" : "")+(atr>0 ? (prazo?" · ":"")+atr+(atr>1?" atrasadas":" atrasada") : "")};
  });
  var aviso = function(txt){ d({type:"AVISO", txt:txt}); };
  var mover = function(item, de, para){
    var c = s.dados.find(function(x){ return x.id===item.id; }); if(!c || de===para) return;
    if(c.st==="cancelado") { d({type:"REATIVAR", id:c.id}); return; }
    if(!aberto(c)) { aviso("Kit já devolvido: não dá para mover."); return; }
    if(para==="cancelado") { d({type:"DIALOGO", d:{tipo:"cancelar", id:c.id}}); return; }
    var n = etapaDe(c).n, alvo = ETAPAS.find(function(x){ return x.k===para; });
    if(!alvo) return;
    if(alvo.n===n+1) { d({type:"DIALOGO", d:{tipo:"avancar", id:c.id}}); return; }
    if(alvo.n===n-1) { d({type:"DIALOGO", d:{tipo:"voltar", id:c.id}}); return; }
    aviso("Mova uma etapa por vez.");
  };
  return e(Kanban,{colunas:colunas, onMover:mover, vazio:"Nenhuma revendedora nesta etapa.",
    card:function(c){ return e(CartaoKit,{c:c, resp:resps[c.id] || null, abrir:function(){ d({type:"DIALOGO", d:{tipo:"detalhe", id:c.id}}); }}); }});
}

export { Quadro };

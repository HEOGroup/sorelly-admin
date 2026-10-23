// Sorelly Admin · montagem e bipagem — components/tabela-crescimento.js
// Tabela compacta mês a mês: revendedoras no fim do mês, aumento/queda do mês e faturamento do mês. Usada na Faturamento e na Visão geral.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { MESES_LONGO, fatEfetivo, projetarAno, resumoMensalRevendedoras } from "@/apps/montagem/domain/financeiro";
import { BK } from "@/apps/montagem/lib/format";
import { MONO } from "@/apps/montagem/ui/input";
import { e } from "@/shared/react";

function TabelaCrescimento(p){
  var s = p.s, ano = p.ano, anoStr = String(ano), mesAtual = new Date().getMonth(), janela = p.janela===undefined ? 2 : p.janela;
  var real = resumoMensalRevendedoras(s, ano);
  var proj = projetarAno(Object.assign({}, s, {faturamentoDiario:fatEfetivo(s)}), anoStr, janela, (Number(s.metaPct)>=96 && Number(s.metaPct)<=98 ? Number(s.metaPct) : 97));
  var fatDe = function(i){ var x = proj.porMes[i]; return x ? x.valor : 0; };
  // meses até o atual vêm do real; os que faltam até dezembro são PREVISÃO (revendedoras pela janela escolhida)
  var linhas = [], anterior = null;
  real.forEach(function(l){
    if(l.mes<=mesAtual){ linhas.push(l); anterior = l.fim; return; }
    var pm = proj.porMes[l.mes], rev = pm && pm.revendedoras!==undefined ? pm.revendedoras : null;
    linhas.push({mes:l.mes, fim:rev, delta:rev!==null && anterior!==null ? rev-anterior : null, pct:rev!==null && anterior ? (rev-anterior)/anterior*100 : null, previsto:true}); if(rev!==null) anterior = rev;
  });
  var n = function(v){ return v===null || v===undefined ? "—" : Math.round(v).toLocaleString("pt-BR"); };
  var th = function(t){ return e("th",{key:t, className:"border-b border-border px-2 py-1.5 text-center text-[10.5px] font-semibold uppercase tracking-wide text-white/70"}, t); };
  var td = function(v, c){ return e("td",{className:"px-2 py-1 text-center text-[12.5px] "+(c||"")}, v); };
  var tabela = e("div",{className:"overflow-x-auto p-2"},
      e("table",{className:"w-full border-collapse"},
        e("thead",null, e("tr",null, ["Mês","Revendedoras","Aumento","Faturamento"].map(th))),
        e("tbody",null, linhas.map(function(l){
          var cor = l.delta>0 ? "text-success" : l.delta<0 ? "text-destructive" : "text-muted-foreground";
          return e("tr",{key:l.mes, className:"border-b border-border/40 last:border-0 "+(l.atual ? "bg-primary/10 font-bold" : l.previsto ? "opacity-85" : "")},
            td(e("span",{className:"inline-flex items-center gap-1.5"}, MESES_LONGO[l.mes], l.atual && e("span",{className:"rounded bg-success/20 px-1.5 text-[10px] font-bold text-success"},"ao vivo"), l.previsto && e("span",{className:"rounded bg-primary/20 px-1.5 text-[10px] font-bold text-primary"},"previsto")), "text-left! "),
            td(n(l.fim), MONO),
            td(l.delta===null || l.delta===undefined ? "—" : (l.delta>0 ? "+" : "")+n(l.delta)+(l.pct===null || l.pct===undefined ? "" : " ("+(l.pct>0 ? "+" : "")+l.pct.toFixed(1).replace(".",",")+"%)"), MONO+" font-bold "+cor),
            td(BK(fatDe(l.mes)), MONO+" text-success")); }))));
  if(p.dentro) return e("div",{className:"rounded-lg bg-black/20"}, e("p",{className:"px-3 pt-2 text-[12px] font-extrabold uppercase tracking-[.14em] text-primary"}, "Mês a mês · os meses que faltam até dezembro são previsão"), tabela);
  return e(BlocoBarra,{cor:"azul", t:"Crescimento por mês", sub:"revendedoras, aumento do mês e faturamento · o mês atual atualiza em tempo real"}, tabela);
}

export { TabelaCrescimento };

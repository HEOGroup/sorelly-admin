// Sorelly Admin · montagem — pages/avaliacoes/Visao.js
// Avaliações → Visão geral: nota geral, avaliações no período, notas boas e ruins, média por pergunta, quem precisa de atenção, as melhores e a evolução mensal.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Faixa, Indicador, Mosaico, Tab, Td, LINHA } from "@/apps/montagem/components/padrao";
import { PERIODOS, avVisaoGeral, formatarMes, formatarNota, percentualDaNota } from "@/apps/montagem/domain/avaliacoes";
import { Bt, Chip } from "@/apps/montagem/pages/indicacoes/visual";
import { COR, LinhaBarra, Nota, Vazio, corNota, useAv } from "@/apps/montagem/pages/avaliacoes/visual";
import { e, useState } from "@/shared/react";

// "▲ +0,3 contra o período anterior" (sem base de comparação: texto vazio)
function variacao(k, casas, un){
  if(k.deltaAbs==null) return null;
  var v = k.deltaAbs;
  return (v>0 ? "▲ +" : v<0 ? "▼ −" : "= ")+String(Math.abs(v).toFixed(casas)).replace(".", ",")+(un||"")+" no período anterior";
}

function AbaAvVisao(p){
  var a = useAv(), st = useState("mes_atual"), periodo = st[0];
  var v = avVisaoGeral(a.s, periodo, a.reps), cfg = a.av.config, sem = v.totalGeral.avaliacoes===0;
  var pct = v.notasBoas.valor;
  var lista = function(itens, vazio){
    return itens.length ? e("div",{className:"flex flex-col gap-1.5"}, itens.map(function(i){
      return e("button",{key:i.nome, type:"button", onClick:function(){ p.ir("revs"); }, title:"Abrir em Representantes", className:"flex flex-wrap items-center justify-center gap-x-3 rounded-lg bg-white/5 px-2 py-1.5 text-[13px] hover:bg-white/10"},
        e("b",null, i.nome), e(Nota,{v:i.mediaGeral, cor:corNota(i.mediaGeral, 5, cfg)}), e("span",{className:"text-[11.5px] text-white/60"}, i.totalAvaliacoes+(i.totalAvaliacoes===1 ? " avaliação" : " avaliações"))); }))
      : e(Vazio,{ic:"user-list"}, vazio); };
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"}, PERIODOS.map(function(x){ return e(Chip,{key:x.k, on:x.k===periodo, onClick:function(){ st[1](x.k); }}, x.rotulo); })),
    e(Faixa,{n:4},
      e(Indicador,{t:"Nota geral", v:formatarNota(v.notaGeral.valor), cor:corNota(v.notaGeral.valor, 5, cfg), sub:variacao(v.notaGeral, 1) || "De 0 a 5"}),
      e(Indicador,{t:"Avaliações no período", v:v.avaliacoesNoPeriodo.valor, cor:"total", sub:variacao(v.avaliacoesNoPeriodo, 0) || ("No total: "+v.totalGeral.avaliacoes)}),
      e(Indicador,{t:"Notas boas", v:pct==null ? "—" : Math.round(pct)+"%", cor:"ok", sub:"Nota a partir de "+formatarNota(cfg.notaBoaPiso)}),
      e(Indicador,{t:"Notas ruins", v:v.notasRuins.valor, cor:v.notasRuins.valor ? "ruim" : "neutro", sub:"Abaixo de "+formatarNota(cfg.notaRuimTeto)})),
    sem ? e(BlocoBarra,{cor:"laranja", t:"Avaliações", compacto:true}, e(Vazio,{ic:"star"}, "Nenhuma avaliação lançada até o momento."),
        e("div",{className:"flex justify-center pb-3"}, e(Bt,{tipo:"forte", ic:"plus-circle", onClick:function(){ p.ir("revs"); }}, "Lançar avaliação"))) :
    e(Mosaico,{min:"21rem"},
      e(BlocoBarra,{cor:"laranja", t:"Média por pergunta", compacto:true},
        e("div",{className:"flex flex-col gap-2 p-2.5"}, v.mediaPorPergunta.length ? v.mediaPorPergunta.map(function(m){
          return e(LinhaBarra,{key:m.perguntaId, t:m.texto, v:formatarNota(m.media)+(m.max===10 ? " de 10" : ""), sub:m.n ? "("+m.n+")" : null, pct:percentualDaNota(m.media, m.max), cor:corNota(m.media, m.max, cfg)}); })
          : e(Vazio,{ic:"chart-bar"}, "Sem respostas no período."))),
      e(BlocoBarra,{cor:"vermelho", t:"Precisam de atenção", compacto:true, dir:v.totalAbaixoDoCorte || undefined},
        e("div",{className:"p-2.5"}, lista(v.piores, "Nenhuma representante abaixo da nota de corte."))),
      e(BlocoBarra,{cor:"verde", t:"Melhores representantes", compacto:true, dir:v.totalAcimaDoCorte || undefined},
        e("div",{className:"p-2.5"}, lista(v.melhores, "Nenhuma representante acima da nota de corte."))),
      e(BlocoBarra,{cor:"laranja", t:"Evolução mensal", compacto:true},
        v.evolucaoMensal.length ? e("div",{className:"p-1.5"}, e(Tab,{cols:["Mês", "Avaliações", "Nota geral"]}, v.evolucaoMensal.map(function(m){
          return e("tr",{key:m.mes, className:LINHA}, e(Td,{forte:true}, formatarMes(m.mes)), e(Td,{dinheiro:true}, m.avaliacoes), e(Td,{dinheiro:true, forte:true, cor:corNota(m.notaGeral, 5, cfg)}, formatarNota(m.notaGeral))); })))
          : e(Vazio,{ic:"calendar-blank"}, "Sem avaliações para mostrar a evolução."))));
}

export { AbaAvVisao };

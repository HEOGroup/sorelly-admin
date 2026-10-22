// Sorelly Admin · montagem — pages/ComissoesTodos.js
// Comissões de todo mundo num lugar só (Financeiro e Representantes & Kits → Financeiro): representantes, bipagem de envio, bipagem interna (atendimento à revendedora) e montagem.
// Cada linha abre para mostrar a quem se refere; no alto, o total pago em comissões e bônus do mês. Quem vê: financeiro, Direção e acessos totais.
// Ainda a trazer: metas com bônus de Agendamento e Inadimplência e a comissão da montagem do atendimento interno.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Icon } from "@/apps/montagem/ui/icon";
import { resumoComissaoAg } from "@/apps/montagem/domain/agendamento";
import { BIPADORAS, podeConfigComissao } from "@/apps/montagem/domain/equipe";
import { AbaConfig } from "@/apps/montagem/pages/Config";
import { ConfigQuemBipa } from "@/apps/montagem/pages/ConfiguradorGeral";
import { Btn } from "@/apps/montagem/ui/button";
import { itensComissao, comisEfetiva } from "@/apps/montagem/domain/comissoes";
import { resumoInterno, resumoAtendimento, regraAtend } from "@/apps/montagem/domain/comissao-interno";
import { resumoMeta } from "@/apps/montagem/domain/metas-setor";
import { bonusDoValor, indicadoresLp } from "@/apps/montagem/domain/link-pagamento";
import { resumoBipadora, resumoMontadora } from "@/apps/montagem/domain/regras";
import { BKC as BK, isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var r2 = function(n){ return Math.round(n*100)/100; };
var TH = function(t, r){ return e("th",{key:t, className:"whitespace-nowrap border-b border-border px-3 py-2 text-[11.5px] font-semibold uppercase tracking-wide "+(r ? "text-right" : "text-left")}, t); };

// bloco colorido que abre e fecha; cada linha da tabela abre para mostrar a quem se refere
function Bloco(p){
  var ab = useState(null), aberto = ab[0], setAberto = ab[1];
  return e(BlocoBarra,{cor:p.cor, t:p.t, sub:p.sub, dir:BK(p.total)},
    p.linhas.length===0 ? e("p",{className:"px-4 py-4 text-[13px] text-muted-foreground"}, p.vazio || "Nada neste mês ainda.") :
    e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"},
      e("thead",null, e("tr",null, p.colunas.map(function(c, i){ return TH(c, i>0); }))),
      e("tbody",null, p.linhas.map(function(l){ var on = aberto===l.chave;
        return e(React.Fragment,{key:l.chave},
          e("tr",{onClick:function(){ setAberto(on ? null : l.chave); }, className:"cursor-pointer border-b border-border/60 hover:bg-muted/30 "+(on ? "bg-primary/10" : "")},
            e("td",{className:"whitespace-nowrap px-3 py-2 text-sm font-semibold"}, (on ? "▼ " : "▶ ")+l.nome),
            l.cels.map(function(c, i){ return e("td",{key:i, className:"whitespace-nowrap px-3 py-2 text-right text-sm "+MONO+(i===l.cels.length-1 ? " font-bold text-primary" : "")}, c); })),
          on && e("tr",null, e("td",{colSpan:p.colunas.length, className:"bg-muted/20 px-4 py-2.5"},
            l.detalhe.length===0 ? e("span",{className:"text-[12.5px] text-muted-foreground"}, "Sem detalhes.") :
            e("ul",{className:"flex flex-col gap-1 text-[12.5px]"}, l.detalhe.map(function(t, i){ return e("li",{key:i}, t); })))));
      })))));
}

// dia combinado de pagamento (Datas de pagamento) e a próxima vez que ele cai
var diaDe = function(s, setor){ var dp = s.datasPag || {}; return (dp.setores||{})[setor] || dp.geral || 15; };
var proxPag = function(dia){ var h = new Date(), y = h.getFullYear(), m = h.getMonth(), c = new Date(y, m, dia); if(c < new Date(y, m, h.getDate())) c = new Date(y, m+1, dia); return String(c.getDate()).padStart(2,"0")+"/"+String(c.getMonth()+1).padStart(2,"0"); };

// cartão de um setor: degradê na cor dele, valor, andamento e próxima data; clicar abre a aba do setor
function CartaoSetor(p){
  var d = use().dispatch, AZUL = "#3B82F6";
  return e("button",{type:"button", disabled:!p.aba, onClick:function(){ d({type:"ABA", aba:p.aba}); }, title:p.aba ? "Abrir "+p.t : "Em breve",
    className:"flex flex-col gap-1.5 rounded-xl p-3 text-left transition-transform "+(p.aba ? "hover:-translate-y-0.5" : "opacity-60"), style:{background:"linear-gradient(135deg,"+AZUL+"3d,"+AZUL+"0f 72%)", boxShadow:"inset 0 0 0 1px "+AZUL+"66"}},
    e("span",{className:"flex items-center gap-2.5"}, e("span",{className:"grid size-8 shrink-0 place-items-center rounded-xl", style:{background:AZUL+"33", color:AZUL, boxShadow:"inset 0 0 0 1px "+AZUL+"55"}}, e(Icon,{n:p.ic, s:18, peso:"fill"})),
      e("b",{className:"text-[13.5px] leading-tight"}, p.t), p.aba && e(Icon,{n:"chevron", s:14, className:"ml-auto opacity-60"})),
    p.valor!==undefined && e("span",{className:"flex flex-col"}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-[.12em] text-white/70"}, p.rotulo||"A pagar"), e("b",{className:MONO+" text-[20px] leading-tight"}, BK(p.valor))),
    p.barra && e("span",{className:"flex flex-col gap-1"}, e("span",{className:"h-2.5 overflow-hidden rounded-full bg-white/15"}, e("span",{className:"block h-full rounded-full", style:{width:Math.max(3, Math.min(100, p.barra.pct))+"%", background:"linear-gradient(90deg,"+AZUL+"aa,"+AZUL+")"}})), e("span",{className:"text-[12px] text-white/85"}, p.barra.txt)),
    p.info && e("span",{className:"text-[12.5px] text-white/85"}, p.info),
    e("span",{className:"mt-auto flex items-center gap-1.5 text-[12px] font-semibold", style:{color:AZUL}}, e(Icon,{n:"calendario", s:13}), p.data || "em breve"));
}
// as três metas do Agendamento no mês aberto: barra de cada faixa e o bônus de cada funcionária
function BlocoMetasAg(p){
  var ag = p.ag; if(!ag.painel) return null; var pn = ag.painel;
  return e(BlocoBarra,{cor:"azul", t:"Agendamento · metas do mês", sub:"quem está batendo a meta e o bônus que sobe em cada faixa", ir:"agbonus", dir:BK(ag.bonusProjetado)},
    e("div",{className:"grid grid-cols-1 gap-3 p-4 lg:grid-cols-[1.4fr_1fr]"},
      e("div",{className:"flex flex-col gap-2.5"}, pn.metas.map(function(m){ return e("div",{key:m.pct, className:"flex flex-col gap-1"},
        e("div",{className:"flex items-center justify-between text-[13.5px]"}, e("b",null, "Meta "+m.pct+"% · bônus "+BK(m.bonus)+" por funcionária"), e("span",{className:"rounded-full px-2 py-0.5 text-[11.5px] font-bold "+(m.bateu ? "bg-success/25 text-success" : "bg-white/10")}, m.bateu ? "✓ Batida" : "faltam "+m.falta+" acertos")),
        e("span",{className:"h-3 overflow-hidden rounded-full bg-white/15"}, e("span",{className:"block h-full rounded-full", style:{width:Math.max(3, Math.min(100, m.pctAtingido))+"%", background:m.bateu ? "linear-gradient(90deg,#16a34a,#4ade80)" : "linear-gradient(90deg,#7c3aed,#c084fc)"}}))); })),
      e("div",{className:"flex flex-col gap-1 rounded-xl bg-black/20 p-3 text-[13px]"}, e("b",{className:"mb-1"}, "Bônus no ritmo de hoje"),
        pn.bonus.map(function(b){ return e("div",{key:b.nome, className:"flex items-center justify-between"}, e("span",{className:"uppercase"}, b.nome), e("b",{className:MONO}, BK(b.valor))); }),
        e("span",{className:"mt-1 text-[12px] text-white/70"}, "Vence em "+proxPag(p.dia)+" do mês seguinte ao fechamento"))));
}
function CartoesSetores(p){
  var s = p.s, dia = function(k){ return diaDe(s, k); }, ag = resumoComissaoAg(s, dia("agendamento"));
  var geral = r2(p.totRep+p.totBip+p.totMont+p.totInt+ag.aPagar), pn = ag.painel, pf = ag.proxFaixa;
  return e("div",{className:"flex flex-col gap-3"},
    e("div",{className:"flex flex-wrap items-center justify-between gap-3 rounded-xl p-3", style:{background:"linear-gradient(135deg,#3B82F644,#3B82F610 75%)", boxShadow:"inset 0 0 0 1px #3B82F688"}},
      e("div",{className:"flex flex-col"}, e("span",{className:"text-[11px] font-bold uppercase tracking-[.14em] text-white/75"}, "Total de comissões e bônus · "+p.mesNome), e("b",{className:MONO+" text-[26px] leading-tight text-white"}, BK(geral))),
      e("div",{className:"flex flex-wrap gap-5 text-[13px]"}, e("span",null, "Comissões do mês ", e("b",{className:MONO}, BK(r2(p.totRep+p.totBip+p.totMont+p.totInt)))), e("span",null, "Bônus do Agendamento a pagar ", e("b",{className:MONO}, BK(ag.aPagar))), e("span",null, "Dia geral de pagamento ", e("b",{className:MONO}, dia("geral"))))),
    e("div",{className:"grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"},
      e(CartaoSetor,{t:"Representantes", ic:"representante", cor:"#8B5CF6", aba:"comissoes", valor:p.totRep, rotulo:"Comissão do mês", barra:{pct:p.totRep>0 ? p.confRep/p.totRep*100 : 0, txt:BK(p.confRep)+" já confirmada pelo financeiro"}, data:"pagamentos nos dias 1, 11 e 21 / 6, 16 e 26"}),
      e(CartaoSetor,{t:"Agendamento", ic:"agenda", cor:"#A855F7", aba:"agbonus", valor:ag.aPagar, rotulo:"Bônus a pagar", barra:pn && pf ? {pct:pf.pctAtingido, txt:"Meta "+pf.pct+"%: faltam "+pf.falta+" acertos"} : pn ? {pct:100, txt:"Todas as metas batidas"} : null,
        info:pn ? "Bônus no ritmo de hoje: "+BK(ag.bonusProjetado) : null, data:"próximo pagamento "+(ag.proxVenc ? ag.proxVenc.split("-").reverse().slice(0, 2).join("/") : proxPag(dia("agendamento")))}),
      e(CartaoSetor,{t:"Bipagem de envio", ic:"bipagem", cor:"#0EA5E9", aba:"comisbip", valor:p.totBip, rotulo:"Líquido do mês", info:p.nBip+" bipadoras com kits no mês", data:"pagamento dia "+dia("bipagem")+" · próximo "+proxPag(dia("bipagem"))}),
      e(CartaoSetor,{t:"Montagem de kits", ic:"montadora", cor:"#F59E0B", aba:"comismont", valor:p.totMont, rotulo:"Líquido do mês", info:p.nMont+" montadoras com kits no mês", data:"pagamento dia "+dia("montagem")+" · próximo "+proxPag(dia("montagem"))}),
      e(CartaoSetor,{t:"Atendimento interno", ic:"calendario", cor:"#E8B84B", aba:"comisint", valor:p.totInt, rotulo:"Total do mês", info:p.nInt+" bipadoras com atendimentos", data:"pagamento dia "+dia("interno")+" · próximo "+proxPag(dia("interno"))}),
      cartaoMeta(p.s, "cadastro", "Cadastro de revendedoras", "cadastro", "comcad", function(v){ return Math.round(v).toLocaleString("pt-BR"); }),
      cartaoMeta(p.s, "inad", "Inadimplência", "alert", "cominad", function(v){ return BK(v); }),
      cartaoLink(p.s)),
    e(BlocoMetasAg,{ag:ag, dia:dia("agendamento")}));
}

// cartões das metas mensais (Cadastro e Inadimplência) e do bônus do Link de pagamento, sempre do mês de hoje
function cartaoMeta(s, setor, titulo, ic, aba, fmt){
  var h = new Date(), ym = h.getFullYear()+"-"+String(h.getMonth()+1).padStart(2,"0"), r = resumoMeta(s, setor, ym);
  if(!r) return e(CartaoSetor,{t:titulo, ic:ic, cor:"#3B82F6", aba:aba, info:"Sem meta neste mês. Abra para criar."});
  var ini = setor==="cadastro" ? r.inicio : 0, topo = r.faixas.length ? r.faixas[r.faixas.length-1].alvo : 1;
  return e(CartaoSetor,{t:titulo, ic:ic, cor:"#3B82F6", aba:aba, valor:r.total, rotulo:"Bônus agora (máx. "+BK(r.max)+")", barra:{pct:topo>ini ? (r.medido-ini)/(topo-ini)*100 : 0, txt:""},
    info:r.prox ? "Faltam "+fmt(r.falta)+" para a próxima faixa" : "Todas as faixas batidas", data:r.meta.pagamento ? "pagamento "+r.meta.pagamento : "fecha em "+(r.meta.fechamento||"—")});
}
function cartaoLink(s){
  var h = new Date(), ym = h.getFullYear()+"-"+String(h.getMonth()+1).padStart(2,"0"), lp = s.lp, ind = lp ? indicadoresLp(s, ym) : null;
  if(!lp || !ind) return e(CartaoSetor,{t:"Link de pagamento", ic:"coins", cor:"#3B82F6", aba:"comlink", info:"Ainda não há links registrados."});
  var fx = ((lp.config.bonus||{}).faixas||[]).slice().sort(function(a, b){ return a.min-b.min; }), b = bonusDoValor(lp.config, ind.valorCoorte), topo = fx.length ? fx[fx.length-1] : null, prox = fx.find(function(x){ return x.min>ind.valorCoorte; });
  return e(CartaoSetor,{t:"Link de pagamento", ic:"coins", cor:"#3B82F6", aba:"comlink", valor:b.valor, rotulo:"Bônus agora"+(topo ? " (máx. "+BK(topo.valor)+")" : ""), barra:{pct:topo ? ind.valorCoorte/topo.min*100 : 0, txt:""},
    info:prox ? "Pago "+BK(ind.valorCoorte)+" · faltam "+BK(prox.min-ind.valorCoorte)+" para a próxima faixa" : "Pago "+BK(ind.valorCoorte), data:"fecha no fim do mês"});
}

function AbaComissoesTodos(props){
  var foco = (props && props.foco) || "todos", s = use().state, hoje = isoDia(new Date()), mes = hoje.slice(0, 7), c = comisEfetiva(s), agora = Date.now();
  var fmt = function(iso){ return iso ? iso.split("-").reverse().slice(0, 2).join("/") : ""; };
  // representantes (comissão por atendimento, do mês)
  var itens = itensComissao(c, s, agora).filter(function(i){ return !i.pixRep && String(i.data||"").slice(0, 7)===mes; }), porRep = {};
  itens.forEach(function(i){ var o = porRep[i.dest] || (porRep[i.dest] = {nome:i.dest, n:0, total:0, conf:0, pend:0, itens:[]}); o.n++; o.total = r2(o.total+i.comissao); if(i.confirmado) o.conf = r2(o.conf+i.comissao); else o.pend = r2(o.pend+i.comissao); o.itens.push(i); });
  var reps = Object.keys(porRep).map(function(k){ return porRep[k]; }).sort(function(a, b){ return b.total-a.total; });
  var totRep = r2(reps.reduce(function(t, o){ return t+o.total; }, 0));
  // bipagem de envio e montagem (cálculo do setor)
  var bip = BIPADORAS.map(function(b){ return resumoBipadora(b, s); }).filter(function(r){ return r.total>0; }), totBip = r2(bip.reduce(function(t, r){ return t+r.liquido; }, 0));
  var mont = (s.montadoras || []).map(function(m){ return resumoMontadora(m, s); }).filter(function(r){ return r.total>0; }), totMont = r2(mont.reduce(function(t, r){ return t+r.liquido; }, 0));
  var inte = resumoInterno(s, mes), totBipInt = r2(inte.reduce(function(t, o){ return t+o.total; }, 0)), aten = resumoAtendimento(s, mes), totAt = r2(aten.reduce(function(t, o){ return t+o.total; }, 0)), ra = regraAtend(s.cfg), totInt = r2(totBipInt+totAt);
  var geral = r2(totRep+totBip+totMont+totInt);
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:foco==="bip" ? "Comissões da bipagem" : foco==="mont" ? "Comissões da montagem" : foco==="int" ? "Comissões do atendimento interno" : "Comissões de todos", sub:foco==="todos" ? "Tudo o que é pago em comissões e bônus em "+MESES[+mes.slice(5, 7)-1]+": clique num cartão para abrir o setor, ou numa linha das tabelas para ver a quem se refere. Os blocos abrem e fecham." : "Mês de "+MESES[+mes.slice(5, 7)-1]+". Clique numa linha para ver a quem se refere. A comissão dos representantes tem tela própria, em Comissões → Representantes."}),
    foco==="todos" && e(CartoesSetores,{s:s, mesNome:MESES[+mes.slice(5, 7)-1], totRep:totRep, confRep:r2(reps.reduce(function(t, o){ return t+o.conf; }, 0)), totBip:totBip, totMont:totMont, totInt:totInt, nBip:bip.length, nMont:mont.length, nInt:inte.length}),
    foco==="todos" && e(Bloco,{cor:"azul", t:"Representantes", sub:"comissão por atendimento do mês (confirmada pelo financeiro + pendente)", total:totRep, colunas:["Representante","Atendimentos","Confirmada","Pendente","Comissão"],
      linhas:reps.map(function(o){ return {chave:"r"+o.nome, nome:o.nome, cels:[o.n, BK(o.conf), BK(o.pend), BK(o.total)],
        detalhe:o.itens.map(function(i){ return fmt(i.data)+" · "+i.rev+" · "+(i.status||"")+" · "+BK(i.comissao)+(i.confirmado ? " (confirmada)" : " (pendente)"); })}; })}),
    (foco==="todos" || foco==="bip") && e(Bloco,{cor:"azul", t:"Bipagem de envio de kits", sub:"kits bipados × valor, menos o desconto por peça faltando", total:totBip, colunas:["Bipadora","Kits","Bruto","Descontos","Líquido"],
      linhas:bip.map(function(r){ return {chave:"b"+r.b.id, nome:r.b.nome, cels:[r.total, BK(r.bruto), "− "+BK(r.perda), BK(r.liquido)], detalhe:["Normais: "+r.n+" · Especiais: "+r.e+" · peças faltando: "+r.faltas]}; })}),
    (foco==="todos" || foco==="int") && e(Bloco,{cor:"azul", t:"Bipagem interna (atendimento à revendedora)", sub:"R$ 10 por atendimento, menos R$ 5 a cada contagem errada marcada pela revendedora, mais bônus pela nota (provisório)", total:totBipInt, vazio:"Nenhum atendimento interno acertado neste mês ainda.",
      colunas:["Bipadora","Atendimentos","Base","Perda por erro","Bônus da nota","Nota média","Total"],
      linhas:inte.map(function(o){ return {chave:"i"+o.nome, nome:o.nome, cels:[o.n, BK(o.base), "− "+BK(o.perda), BK(o.bonus), o.media===null ? "—" : o.media.toFixed(1).replace(".", ","), BK(o.total)],
        detalhe:o.itens.map(function(x){ return fmt(x.it.data)+" · "+x.it.nome+" · nota "+(x.c.nota || "—")+" · "+x.c.erros+" contagem(ns) errada(s) · "+BK(x.c.total); })}; })}),
    (foco==="todos" || foco==="int") && e(Bloco,{cor:"azul", t:"Atendimento (acompanha a revendedora)", sub:"R$ "+ra.valor+" fixo por atendimento; venda acima de R$ "+ra.limiteAlto.toLocaleString("pt-BR")+" paga R$ "+ra.valorAlto+". Qualquer funcionária que atender recebe; hoje atendem Leci e Maria Aparecida.", total:totAt, vazio:"Nenhum atendimento acertado neste mês ainda.",
      colunas:["Funcionária","Atendimentos","Acima de R$ "+ra.limiteAlto.toLocaleString("pt-BR"),"Total"],
      linhas:aten.map(function(o){ return {chave:"a"+o.nome, nome:o.nome, cels:[o.n, o.nAlta, BK(o.total)], detalhe:o.itens.map(function(x){ return fmt(x.it.data)+" · "+x.it.nome+" · venda "+BK(x.v.venda)+" · "+BK(x.v.valor); })}; })}),
    (foco==="todos" || foco==="mont") && e(Bloco,{cor:"azul", t:"Montagem de kits", sub:"kits montados × valor, ajustado pela avaliação e pelas divergências", total:totMont, colunas:["Montadora","Kits","Bruto","Ajuste","Líquido"],
      linhas:mont.map(function(r){ return {chave:"m"+r.m.id, nome:r.m.nome, cels:[r.total, BK(r.bruto), "− "+BK(r.bruto-r.liquido), BK(r.liquido)], detalhe:["Média da avaliação: "+r.media.toFixed(1).replace(".", ",")+" · divergências: "+r.div]}; })}),
    foco==="todos" && e("p",{className:"rounded-xl bg-muted/30 px-4 py-3 text-[12.5px] text-muted-foreground"}, "A trazer: metas com bônus da Inadimplência, do Cadastro de revendedoras e do Link de pagamento."));
}
// Cada comissão tem, no fim da tela, o botão "Regras e configurações" (só o Marcus): abre OUTRA tela com as regras e, embaixo, os campos para mexer.
function ComConfig(p){
  var t = useState(false), aberto = t[0], setAberto = t[1], s = use().state, dono = podeConfigComissao(s.usuario);
  if(aberto && dono) return e("div",{className:"flex flex-col gap-4"},
    e("div",{className:"flex items-center gap-3"}, e(Btn,{v:"secondary", sm:true, onClick:function(){ setAberto(false); }}, "← Voltar às comissões")),
    e(PageHead,{t:p.titulo, sub:"As regras e os valores desta comissão. Mude aqui e vale para o sistema todo. Só o Marcus altera."}),
    e(AbaConfig), p.extra);
  return e("div",{className:"flex flex-col gap-4"}, p.children,
    dono && e("section",{className:"flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E8B84B]/40 bg-card p-3"},
      e("div",null, e("h2",{className:"font-heading text-[15px] font-bold"}, "Regras e configurações"), e("p",{className:"text-[12px] text-muted-foreground"}, "Os valores desta comissão e as regras ficam numa tela só.")),
      e(Btn,{v:"secondary", sm:true, ic:"config", onClick:function(){ setAberto(true); }}, "Abrir regras e configurações")));
}
function AbaComisBipagem(){ return e(ComConfig,{titulo:"Regras e configurações · bipagem", extra:e(ConfigQuemBipa)}, e(AbaComissoesTodos,{foco:"bip"})); }
function AbaComisMontagem(){ return e(ComConfig,{titulo:"Regras e configurações · montagem"}, e(AbaComissoesTodos,{foco:"mont"})); }
function AbaComisInterno(){ return e(ComConfig,{titulo:"Regras e configurações · atendimento interno"}, e(AbaComissoesTodos,{foco:"int"})); }
export { AbaComissoesTodos, AbaComisBipagem, AbaComisMontagem, AbaComisInterno };

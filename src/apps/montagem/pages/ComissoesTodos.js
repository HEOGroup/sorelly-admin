// Sorelly Admin · montagem — pages/ComissoesTodos.js
// Comissões de todo mundo num lugar só (Financeiro e Representantes & Kits → Financeiro): representantes, bipagem de envio, bipagem interna (atendimento à revendedora) e montagem.
// Cada linha abre para mostrar a quem se refere; no alto, o total pago em comissões e bônus do mês. Quem vê: financeiro, Direção e acessos totais.
// Ainda a trazer: metas com bônus de Agendamento e Inadimplência e a comissão da montagem do atendimento interno.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { resumoComissaoAg } from "@/apps/montagem/domain/agendamento";
import { BIPADORAS, podeConfigComissao } from "@/apps/montagem/domain/equipe";
import { AbaConfig } from "@/apps/montagem/pages/Config";
import { ConfigQuemBipa } from "@/apps/montagem/pages/ConfiguradorGeral";
import { Btn } from "@/apps/montagem/ui/button";
import { resumoInterno, resumoAtendimento, regraAtend } from "@/apps/montagem/domain/comissao-interno";
import { resumoMeta } from "@/apps/montagem/domain/metas-setor";
import { bonusDoValor, indicadoresLp } from "@/apps/montagem/domain/link-pagamento";
import { resumoBipadora, resumoMontadora } from "@/apps/montagem/domain/regras";
import { BKC as BK, isoDia } from "@/apps/montagem/lib/format";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var r2 = function(n){ return Math.round(n*100)/100; };
// Bloco de um setor no padrão do Financeiro (13/11/2026): barra azul, TabelaPlanilha (filtro e ordem no cabeçalho de cada coluna) e a linha abre para mostrar a quem se refere.
function Bloco(p){
  var cols = p.colunas.map(function(c, i){ return {k:"c"+i, t:c}; });
  var linhas = p.linhas.map(function(l){ var o = {chave:l.chave, det:l.detalhe, c0:l.nome}; l.cels.forEach(function(c, i){ o["c"+(i+1)] = c; }); return o; });
  return e(BlocoPainel,{titulo:p.t, compacto:true, dir:BK(p.total)},
    p.sub && e("p",{className:"px-3 py-1.5 text-[11px] text-white"}, p.sub),
    e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"chave", grade:true, semContagem:true, semLimpar:true, vazio:p.vazio || "Nada neste mês ainda.",
      detalhe:function(l){ return l.det && l.det.length ? e("ul",{className:"flex flex-col gap-1 px-3 py-2 text-[13px] text-white"}, l.det.map(function(t, i){ return e("li",{key:i}, t); })) : null; }}));
}

// dia combinado de pagamento (Datas de pagamento) e a próxima vez que ele cai
var diaDe = function(s, setor){ var dp = s.datasPag || {}; return (dp.setores||{})[setor] || dp.geral || 15; };
var proxPag = function(dia){ var h = new Date(), y = h.getFullYear(), m = h.getMonth(), c = new Date(y, m, dia); if(c < new Date(y, m, h.getDate())) c = new Date(y, m+1, dia); return String(c.getDate()).padStart(2,"0")+"/"+String(c.getMonth()+1).padStart(2,"0"); };

// Linha de um setor que tem meta mensal (Cadastro de revendedoras e Inadimplência): valor do bônus agora, o que falta e quando paga
function linhaMeta(s, ym, setor, titulo, aba, fmtF){
  var r = resumoMeta(s, setor, ym), base = {id:"s-"+setor, setor:titulo, pessoas:"—", aba:aba, fonte:"Meta mensal do setor ("+titulo+")"};
  if(!r) return Object.assign(base, {valor:0, sit:"Sem meta neste mês", pag:"—"});
  return Object.assign(base, {valor:r.total, sit:r.prox ? "Faltam "+fmtF(r.falta)+" para a próxima faixa" : "Todas as faixas batidas", pag:r.meta.pagamento ? "pagamento "+r.meta.pagamento : "fecha em "+(r.meta.fechamento || "—")});
}
function linhaLink(s, ym){
  var lp = s.lp, ind = lp ? indicadoresLp(s, ym) : null, base = {id:"s-link", setor:"Link de pagamento", pessoas:"—", aba:"comlink", fonte:"Links pagos no mês (Link de pagamento)", pag:"fecha no fim do mês"};
  if(!lp || !ind) return Object.assign(base, {valor:0, sit:"Ainda não há links registrados"});
  var fx = ((lp.config.bonus || {}).faixas || []).slice().sort(function(a, b){ return a.min-b.min; }), b = bonusDoValor(lp.config, ind.valorCoorte), prox = fx.find(function(x){ return x.min>ind.valorCoorte; });
  return Object.assign(base, {valor:b.valor, sit:prox ? "Pago "+BK(ind.valorCoorte)+" · faltam "+BK(prox.min-ind.valorCoorte)+" para a próxima faixa" : "Pago "+BK(ind.valorCoorte)});
}

// COMISSÃO INTERNA (13/11/2026, Marcus: "tem que ser comissão interna; sem Por pessoa; mais elaborado, para ver o resultado"): UM bloco de planilha, uma linha por setor.
// Mostra o resultado de cada setor (valor, % do total, média por pessoa, quem recebe mais), a situação, a próxima data de pagamento e DE ONDE VEM o número (para conferir setor por setor).
function VisaoSetores(p){
  var d = use().dispatch, abre = function(l){ if(l.aba) d({type:"ABA", aba:l.aba}); }, pct = function(v){ return v==null ? "—" : v.toFixed(1).replace(".", ",")+"%"; };
  var cols = [{k:"abrir", t:"Abrir", fixa:true, render:function(v, l){ return !l.aba ? "—" : e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); abre(l); }, className:"cursor-pointer text-[13px] font-semibold underline hover:text-primary"}, "Abrir"); }},
    {k:"setor", t:"Setor"}, {k:"pessoas", t:"Pessoas"}, {k:"valor", t:"Valor do mês", fmt:BK}, {k:"pct", t:"% do total", render:function(v){ return pct(v); }},
    {k:"media", t:"Média por pessoa", render:function(v){ return v==null ? "—" : BK(v); }}, {k:"top", t:"Quem recebe mais"}, {k:"sit", t:"Situação"}, {k:"pag", t:"Próximo pagamento"}, {k:"fonte", t:"De onde vem o número"}];
  var totalLinha = function(ls){ var n = ls.reduce(function(t, x){ return t+(typeof x.pessoas==="number" ? x.pessoas : 0); }, 0), v = r2(ls.reduce(function(t, x){ return t+x.valor; }, 0)); return [{span:2, t:"TOTAL · "+ls.length+" setores"}, n, BK(v), ls.length ? "100,0%" : "—", n ? BK(r2(v/n)) : "—", "", "", "", ""]; };
  return e(BlocoPainel,{titulo:"Comissão interna", compacto:true, dir:BK(p.total)}, e(TabelaPlanilha,{cols:cols, linhas:p.setores, chave:"id", grade:true, semContagem:true, semLimpar:true, aoClicar:abre, totalLinha:totalLinha, vazio:"Nenhum setor."}));
}

function AbaComissoesTodos(props){
  var foco = (props && props.foco) || "todos", s = use().state, hoje = isoDia(new Date()), mes = hoje.slice(0, 7);
  var fmt = function(iso){ return iso ? iso.split("-").reverse().slice(0, 2).join("/") : ""; };
  // bipagem de envio e montagem (cálculo do setor)
  var bip = BIPADORAS.map(function(b){ return resumoBipadora(b, s); }).filter(function(r){ return r.total>0; }), totBip = r2(bip.reduce(function(t, r){ return t+r.liquido; }, 0));
  var mont = (s.montadoras || []).map(function(m){ return resumoMontadora(m, s); }).filter(function(r){ return r.total>0; }), totMont = r2(mont.reduce(function(t, r){ return t+r.liquido; }, 0));
  var inte = resumoInterno(s, mes), totBipInt = r2(inte.reduce(function(t, o){ return t+o.total; }, 0)), aten = resumoAtendimento(s, mes), totAt = r2(aten.reduce(function(t, o){ return t+o.total; }, 0)), ra = regraAtend(s.cfg), totInt = r2(totBipInt+totAt);
  var visao = null;
  if(foco==="todos"){
    var dia = function(k){ return diaDe(s, k); };
    var diasAte = function(iso){ var h = new Date(), a = new Date(h.getFullYear(), h.getMonth(), h.getDate()), b = new Date(iso+"T00:00:00"); return Math.round((b-a)/86400000); };
    var proxIso = function(d0){ var h = new Date(), y = h.getFullYear(), m = h.getMonth(), c = new Date(y, m, d0); if(c < new Date(y, m, h.getDate())) c = new Date(y, m+1, d0); return c.getFullYear()+"-"+String(c.getMonth()+1).padStart(2, "0")+"-"+String(c.getDate()).padStart(2, "0"); };
    var pag = function(k, iso){ var i0 = iso || proxIso(dia(k)), n = diasAte(i0); return fmt(i0)+" · "+(n<0 ? "venceu há "+(-n)+(n===-1 ? " dia" : " dias") : n===0 ? "hoje" : "em "+n+(n===1 ? " dia" : " dias")); };
    var maior = function(lista){ var m = lista.slice().sort(function(a, b){ return b.valor-a.valor; })[0]; return m && m.valor>0 ? m.nome+" · "+BK(m.valor) : "—"; };
    var ag = resumoComissaoAg(s, dia("agendamento")), pn = ag.painel, pf = ag.proxFaixa, intPor = {};
    inte.concat(aten).forEach(function(o){ intPor[o.nome] = r2((intPor[o.nome] || 0)+o.total); });
    var listaInt = Object.keys(intPor).map(function(k){ return {nome:k, valor:intPor[k]}; });
    var linha = function(id, setor, pessoas, valor, aba, fonte, sit, pagTxt, lista){ return {id:id, setor:setor, pessoas:pessoas, valor:valor, aba:aba, fonte:fonte, sit:sit, pag:pagTxt, top:lista ? maior(lista) : "—", media:typeof pessoas==="number" && pessoas>0 ? r2(valor/pessoas) : null}; };
    var setores = [
      linha("s-agendamento", "Agendamento", pn ? pn.bonus.length : 0, ag.aPagar, "agbonus", "Agendamento › Painel (acertos do mês contra as metas)",
        (pn && pf ? "Meta "+pf.pct+"%: faltam "+pf.falta+" acertos" : pn ? "Todas as metas batidas" : "Sem painel neste mês")+(pn ? " · no ritmo de hoje "+BK(ag.bonusProjetado) : ""), pag("agendamento", ag.proxVenc), pn ? pn.bonus.map(function(b){ return {nome:b.nome, valor:b.valor}; }) : []),
      linha("s-bipagem", "Bipagem de envio", bip.length, totBip, temAutorizacao("comissao_bipagem", s.usuario) ? "comisbip" : null, "Kits bipados nas Listagens, menos o desconto por peça faltando", bip.length ? "Mês em apuração" : "Sem kits bipados neste mês", pag("bipagem"), bip.map(function(r){ return {nome:r.b.nome, valor:r.liquido}; })),
      linha("s-montagem", "Montagem de kits", mont.length, totMont, "comismont", "Kits montados × valor do kit, ajustado pela avaliação e pelas divergências", mont.length ? "Mês em apuração" : "Sem kits lançados neste mês", pag("montagem"), mont.map(function(r){ return {nome:r.m.nome, valor:r.liquido}; })),
      linha("s-interno", "Atendimento interno", listaInt.length, totInt, "comisint", "Atendimentos fechados na Atendimento Sorelly (quem bipa e quem atende)", listaInt.length ? "Mês em apuração" : "Sem atendimentos neste mês", pag("interno"), listaInt),
      Object.assign(linhaMeta(s, mes, "cadastro", "Cadastro de revendedoras", "comcad", function(v){ return Math.round(v).toLocaleString("pt-BR")+" revendedoras"; }), {top:"—", media:null}),
      Object.assign(linhaMeta(s, mes, "inad", "Inadimplência", "cominad", function(v){ return BK(v); }), {top:"—", media:null}),
      Object.assign(linhaLink(s, mes), {top:"—", media:null})];
    var totalGeral = r2(setores.reduce(function(t, x){ return t+x.valor; }, 0));
    setores.forEach(function(x){ x.pct = totalGeral>0 ? x.valor/totalGeral*100 : null; });
    visao = e(VisaoSetores,{setores:setores, total:totalGeral});
  }
  return e("div",{className:"flex flex-col gap-4 -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3 "+PADRAO_BLOCOS},
    visao,
    (foco==="bip") && e(Bloco,{t:"Bipagem de envio de kits", sub:"kits bipados × valor, menos o desconto por peça faltando", total:totBip, colunas:["Bipadora","Kits","Bruto","Descontos","Líquido"],
      linhas:bip.map(function(r){ return {chave:"b"+r.b.id, nome:r.b.nome, cels:[r.total, BK(r.bruto), "− "+BK(r.perda), BK(r.liquido)], detalhe:["Normais: "+r.n+" · Especiais: "+r.e+" · peças faltando: "+r.faltas]}; })}),
    (foco==="int") && e(Bloco,{t:"Bipagem interna (atendimento à revendedora)", sub:"R$ 10 por atendimento, menos R$ 5 a cada contagem errada marcada pela revendedora, mais bônus pela nota (provisório)", total:totBipInt, vazio:"Nenhum atendimento interno acertado neste mês ainda.",
      colunas:["Bipadora","Atendimentos","Base","Perda por erro","Bônus da nota","Nota média","Total"],
      linhas:inte.map(function(o){ return {chave:"i"+o.nome, nome:o.nome, cels:[o.n, BK(o.base), "− "+BK(o.perda), BK(o.bonus), o.media===null ? "—" : o.media.toFixed(1).replace(".", ","), BK(o.total)],
        detalhe:o.itens.map(function(x){ return fmt(x.it.data)+" · "+x.it.nome+" · nota "+(x.c.nota || "—")+" · "+x.c.erros+" contagem(ns) errada(s) · "+BK(x.c.total); })}; })}),
    (foco==="int") && e(Bloco,{t:"Atendimento (acompanha a revendedora)", sub:"R$ "+ra.valor+" fixo por atendimento; venda acima de R$ "+ra.limiteAlto.toLocaleString("pt-BR")+" paga R$ "+ra.valorAlto+". Qualquer funcionária que atender recebe; hoje atendem Leci e Maria Aparecida.", total:totAt, vazio:"Nenhum atendimento acertado neste mês ainda.",
      colunas:["Funcionária","Atendimentos","Acima de R$ "+ra.limiteAlto.toLocaleString("pt-BR"),"Total"],
      linhas:aten.map(function(o){ return {chave:"a"+o.nome, nome:o.nome, cels:[o.n, o.nAlta, BK(o.total)], detalhe:o.itens.map(function(x){ return fmt(x.it.data)+" · "+x.it.nome+" · venda "+BK(x.v.venda)+" · "+BK(x.v.valor); })}; })}),
    (foco==="mont") && e(Bloco,{t:"Montagem de kits", sub:"kits montados × valor, ajustado pela avaliação e pelas divergências", total:totMont, colunas:["Montadora","Kits","Bruto","Ajuste","Líquido"],
      linhas:mont.map(function(r){ return {chave:"m"+r.m.id, nome:r.m.nome, cels:[r.total, BK(r.bruto), "− "+BK(r.bruto-r.liquido), BK(r.liquido)], detalhe:["Média da avaliação: "+r.media.toFixed(1).replace(".", ",")+" · divergências: "+r.div]}; })}));
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
      e("div",null, e("h2",{className:"text-[13px] font-semibold text-white"}, "Regras e configurações"), e("p",{className:"text-[11px] text-white"}, "Os valores desta comissão e as regras ficam numa tela só.")),
      e(Btn,{v:"secondary", sm:true, ic:"config", onClick:function(){ setAberto(true); }}, "Abrir regras e configurações")));
}
function AbaComisBipagem(){ return e(ComConfig,{titulo:"Regras e configurações · bipagem", extra:e(ConfigQuemBipa)}, e(AbaComissoesTodos,{foco:"bip"})); }
function AbaComisMontagem(){ return e(ComConfig,{titulo:"Regras e configurações · montagem"}, e(AbaComissoesTodos,{foco:"mont"})); }
function AbaComisInterno(){ return e(ComConfig,{titulo:"Regras e configurações · atendimento interno"}, e(AbaComissoesTodos,{foco:"int"})); }
export { AbaComissoesTodos, AbaComisBipagem, AbaComisMontagem, AbaComisInterno };

// Sorelly Admin · montagem — pages/link-pagamento/Analises.js
// Tela Análises: pago por mês e conversão, bônus do setor por mês, rankings de representantes e revendedoras, parcelas, bandeira, canal, link/CNPJ e motivos de não conclusão.
// Todas as contas vêm de analiseLp (domain/link-pagamento.js), agrupadas pelo mês em que o link foi gerado. As faixas do bônus ficam em config.bonus (editáveis aqui).
// REFEITA em 16/11/2026 (Marcus: "arruma as outras telas conforme as nossas regras"): blocos azuis (BlocoPainel), mês e números na faixa azul, tabelas em planilha com filtro nas colunas e fontes padrão (13 e 11 px). Nada saiu.
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { Dinheiro, Mosaico } from "@/apps/montagem/components/padrao";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { ROTULO_STATUS, COR_STATUS, MOTIVOS_NAO_CONCLUSAO, analiseLp, bonusDoValor, formatarReais, meioDe, nomeMeio } from "@/apps/montagem/domain/link-pagamento";
import { FormasDeVenda, ResumoLinks } from "@/apps/montagem/pages/link-pagamento/Resumo";
import { pct, useLp } from "@/apps/montagem/pages/link-pagamento/visual";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useMemo, useState } from "@/shared/react";

var COR = "#0EA5E9";   // cor do setor Link de pagamento
var NOME_MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
var NOME_MES_LONGO = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
var curto = function(m){ var p = String(m).split("-"); return NOME_MES[+p[1]-1]+"/"+p[0].slice(2); };
var longo = function(m){ var p = String(m).split("-"); return NOME_MES_LONGO[+p[1]-1]+"/"+p[0]; };
var din = function(x){ return formatarReais(x || 0); };
var SEL = "h-8 rounded-md border border-white/50 bg-[#14233f] px-2 text-[13px] font-semibold text-white [color-scheme:dark]";
var BTN = "h-8 whitespace-nowrap rounded-md border border-white/50 px-3 text-[13px] font-semibold text-white hover:bg-white/15";

// Item das distribuições: quantidade de links gerados e, na linha de baixo, quantos foram pagos, o valor pago e a conversão
var item = function(i, nome, cor){ return {nome:nome, qtd:i.gerados, cor:cor, extra:"Pagos: "+i.pagos+" ("+formatarReais(i.valor)+") · conversão "+pct(i.conversao)}; };

// Gráfico simples: uma barra por mês (valor pago) com a conversão embaixo
function GraficoMeses(p){
  var max = Math.max.apply(null, p.meses.map(function(m){ return m.valorPago; }).concat([1]));
  return e("div",{className:"flex items-end justify-center gap-2 overflow-x-auto px-2 pb-1 pt-2"}, p.meses.map(function(m){
    var h = Math.max(4, Math.round(m.valorPago/max*90));
    return e("div",{key:m.mes, className:"flex min-w-14 flex-col items-center gap-1", title:longo(m.mes)+": "+formatarReais(m.valorPago)+" pagos de "+formatarReais(m.valorGerado)+" gerados"},
      e("span",{className:MONO+" text-[11px] font-bold"}, Math.round(m.valorPago/1000)+" mil"),
      e("div",{className:"w-8 rounded-t-md", style:{height:h+"px", background:"linear-gradient(180deg,"+COR+","+COR+"55)"}}),
      e("span",{className:"text-[11px] font-bold"}, curto(m.mes)),
      e("span",{className:MONO+" text-[11px] "+(m.conversao>=65 ? "text-[#4ADE80]" : m.conversao>=55 ? "text-[#FBBF24]" : "text-[#EF4444]")}, pct(m.conversao)));
  }));
}

// Barras horizontais para distribuições (parcelas, bandeira, canal, link, motivos). itens = [{nome, qtd, valor, extra}]
function Distribuicao(p){
  var max = Math.max.apply(null, p.itens.map(function(i){ return i.qtd; }).concat([1])), total = p.itens.reduce(function(a, i){ return a+i.qtd; }, 0) || 1;
  return p.itens.length ? e("div",{className:"flex flex-col gap-1.5 p-2"}, p.itens.map(function(i){
    return e("div",{key:i.nome, className:"flex flex-col gap-0.5"},
      e("div",{className:"flex items-center justify-between gap-2 text-[13px]"}, e("b",null, i.nome), e("span",{className:MONO+" text-[11px]"}, i.qtd+" · "+pct(i.qtd/total*100)+(i.valor!=null ? " · "+formatarReais(i.valor) : ""))),
      e("div",{className:"h-2 overflow-hidden rounded-full bg-black/30"}, e("div",{className:"h-full rounded-full", style:{width:Math.max(2, Math.round(i.qtd/max*100))+"%", background:i.cor || COR}})),
      i.extra && e("span",{className:"text-[11px]"}, i.extra));
  })) : e("p",{className:"py-4 text-center text-[13px]"}, "Sem dados no período.");
}

// Ranking (representantes ou revendedoras): mostra os 10 primeiros e "Mostrar mais 10"
function Ranking(p){
  var linhas = p.itens.map(function(i, k){ return {id:i.nome, pos:k+1, nome:i.nome, valor:i.valor, pagos:i.pagos, gerados:i.gerados, conversao:i.conversao}; });
  var cols = [{k:"pos", t:"#"}, {k:"nome", t:p.rot}, {k:"valor", t:"Valor pago", fmt:din, render:function(v){ return e("b",{className:"tabular-nums text-success"}, din(v)); }}, {k:"pagos", t:"Links pagos"}, {k:"gerados", t:"Gerados"}, {k:"conversao", t:"Conversão", fmt:pct, render:pct}];
  return p.itens.length ? e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", centro:true, grade:true, semLimpar:true, semContagem:true, limite:10})
    : e("p",{className:"py-4 text-center text-[13px]"}, "Sem dados no período.");
}

// Faixas do bônus (config.bonus.faixas): cada faixa = valor pago no mês a partir de → bônus
function EditorFaixas(p){
  var fx = p.faixas, st = useState(null), rasc = st[0], lista = rasc || fx;
  var muda = function(i, k, v){ var n = lista.map(function(x, j){ return j===i ? Object.assign({}, x, (function(){ var o = {}; o[k] = v || 0; return o; })()) : x; }); st[1](n); };
  var linhas = lista.map(function(x, i){ return {id:String(i), i:i, min:x.min, valor:x.valor}; });
  var cols = [{k:"min", t:"A partir de (valor pago no mês)", render:function(v, l){ return e(Dinheiro,{value:l.min, label:"Valor mínimo", className:"w-36", onChange:function(x){ muda(l.i, "min", x); }}); }},
    {k:"valor", t:"Bônus", render:function(v, l){ return e(Dinheiro,{value:l.valor, label:"Bônus", className:"w-28", onChange:function(x){ muda(l.i, "valor", x); }}); }},
    {k:"x", t:"Remover", render:function(v, l){ return e("button",{type:"button", "aria-label":"Remover faixa", title:"Remover faixa", onClick:function(){ st[1](lista.filter(function(y, j){ return j!==l.i; })); }, className:"h-8 rounded-md border border-white/30 px-2 text-[13px] font-semibold text-destructive hover:bg-white/10"}, "Remover"); }}];
  return e("div",{className:"flex flex-col"},
    linhas.length ? e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", centro:true, grade:true, semFiltro:true, semLimpar:true, semContagem:true}) : e("p",{className:"py-3 text-center text-[13px]"}, "Nenhuma faixa."),
    e("div",{className:"flex flex-wrap justify-center gap-2 p-2"},
      e("button",{type:"button", className:BTN, onClick:function(){ st[1](lista.concat([{min:0, valor:0}])); }}, "Adicionar faixa"),
      rasc && e("button",{type:"button", className:BTN+" !border-primary !bg-primary/20 !text-primary", onClick:function(){ if(p.onSalvar(rasc)) st[1](null); }}, "Salvar faixas"),
      rasc && e("button",{type:"button", className:BTN, onClick:function(){ st[1](null); }}, "Descartar")));
}

function AbaLpAnalises(){
  var L = useLp(), lp = L.lp, st = useState(""), mes = st[0];
  var an = useMemo(function(){ return analiseLp({lp:lp}, {mes:mes}); }, [lp.solicitacoes, lp.config, mes]);
  var todos = useMemo(function(){ return mes ? analiseLp({lp:lp}, {}) : an; }, [lp.solicitacoes, lp.config, mes, an]);
  var t = an.totais, c = an.canais, cfg = lp.config, faixas = ((cfg.bonus || {}).faixas || []).slice().sort(function(a, b){ return b.min-a.min; });
  var meses = todos.meses;
  var motivos = MOTIVOS_NAO_CONCLUSAO.filter(function(k){ return an.motivos[k]; }).map(function(k){ return {nome:ROTULO_STATUS[k], qtd:an.motivos[k].qtd, valor:an.motivos[k].valor, cor:COR_STATUS[k]}; }).sort(function(a, b){ return b.qtd-a.qtd; });
  var preJul = (!mes || mes<"2026-07") && lp.solicitacoes.some(function(x){ return x.importado; });
  var num = function(rot, v, cor){ return e("span",{key:rot, className:"whitespace-nowrap px-1 text-[13px]", title:rot==="Para conferir" ? "Possíveis duplicadas e datas incoerentes na planilha (veja no Histórico)" : undefined}, rot+" ", e("b",{className:"tabular-nums "+(cor || "")}, v)); };
  var linhasBonus = meses.map(function(m){ var b = bonusDoValor(cfg, m.valorPago); return {id:m.mes, mes:m.mes, valorPago:m.valorPago, faixa:b.min!=null ? "≥ "+formatarReais(b.min) : "—", bonus:b.valor}; });
  var colsBonus = [{k:"mes", t:"Mês", fmt:longo, render:function(v){ return e("b",null, longo(v)); }}, {k:"valorPago", t:"Valor pago", fmt:din, render:din}, {k:"faixa", t:"Faixa alcançada"},
    {k:"bonus", t:"Bônus", fmt:din, render:function(v){ return e("b",{className:"tabular-nums "+(v ? "text-success" : "")}, din(v)); }}];
  var faixa = e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    e("label",{className:"flex items-center gap-1.5 text-[13px] font-semibold"}, "Mês", e("select",{"aria-label":"Mês", value:mes, onChange:function(ev){ st[1](ev.target.value); }, className:SEL}, [e("option",{key:"", value:""}, "Todos os meses")].concat(meses.map(function(m){ return [m.mes, longo(m.mes)]; }).reverse().map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })))),
    e("div",{className:"flex flex-wrap items-center gap-x-1"},
      num("Links gerados", t.gerados), num("Links pagos", t.pagos), num("Conversão", pct(t.conversao), t.conversao>=65 ? "text-success" : t.conversao>=55 ? "text-[#FBBF24]" : "text-[#fca5a5]"),
      num("Valor pago", formatarReais(t.valorPago)), num("Ticket médio", formatarReais(t.ticket)), num("Para conferir", t.suspeitas, t.suspeitas ? "text-[#FBBF24]" : "")),
    e("span",{className:"flex-1"}),
    e("span",{className:"text-[13px] font-semibold"}, "Contas pelo mês em que o link foi gerado"));
  return e("div",{className:"flex flex-col gap-2"},
    e(BlocoPainel,{titulo:"Análises dos links", compacto:true}, faixa),
    e(ResumoLinks,{lp:lp, mes:mes || (meses.length ? meses[meses.length-1].mes : "")}),
    e(BlocoPainel,{titulo:"Pago por mês e conversão", compacto:true, dir:String(meses.length)},
      meses.length ? e(GraficoMeses,{meses:meses}) : e("p",{className:"py-4 text-center text-[13px]"}, "Ainda não há links gerados.")),
    e(BlocoPainel,{titulo:"Bônus do setor por mês", compacto:true},
      meses.length ? e(TabelaPlanilha,{cols:colsBonus, linhas:linhasBonus, chave:"id", centro:true, grade:true, semLimpar:true, semContagem:true}) : e("p",{className:"py-4 text-center text-[13px]"}, "Sem meses para calcular."),
      (cfg.bonus && cfg.bonus.obs) ? e("p",{className:"px-2 py-1.5 text-center text-[11px]"}, cfg.bonus.obs) : null,
      e("p",{className:"border-t border-white/30 px-2 py-1.5 text-center text-[13px] font-bold"}, "Faixas do bônus"),
      e(EditorFaixas,{key:JSON.stringify(faixas), faixas:faixas, onSalvar:function(f){ return L.exec("bonus_salvar", {faixas:f}); }})),
    e(Mosaico,{min:"24rem"},
      e(BlocoPainel,{titulo:"Ranking de representantes", compacto:true, dir:String(an.reps.length)}, e(Ranking,{itens:an.reps, rot:"Representante"})),
      e(BlocoPainel,{titulo:"Ranking de revendedoras", compacto:true, dir:String(an.revs.length)}, e(Ranking,{itens:an.revs, rot:"Revendedora"})),
      e(BlocoPainel,{titulo:"Parcelas", compacto:true}, e(Distribuicao,{itens:an.parcelas.map(function(i){ return item(i, i.nome+"x"); })})),
      e(BlocoPainel,{titulo:"Bandeira", compacto:true}, e(Distribuicao,{itens:an.bandeiras.map(function(i){ return item(i, i.nome); })})),
      e(BlocoPainel,{titulo:"Canal: aplicativo e WhatsApp", compacto:true},
        e(Distribuicao,{itens:[item({gerados:c.app.gerados, pagos:c.app.pagos, valor:c.app.valor, conversao:c.app.conversao}, "Aplicativo"), item({gerados:c.whatsapp.gerados, pagos:c.whatsapp.pagos, valor:c.whatsapp.valor, conversao:c.whatsapp.conversao}, "WhatsApp", "#4ADE80")]}),
        preJul && e("p",{className:"px-2 pb-2 text-center text-[11px]"}, "Antes de julho/2026 a planilha não registrava a plataforma: esses links contam como aplicativo.")),
      e(BlocoPainel,{titulo:"Por link e CNPJ", compacto:true}, e(Distribuicao,{itens:an.meios.map(function(i){ var m = meioDe({lp:lp}, i.nome); return item(i, m ? nomeMeio(m) : "Sem link"); })})),
      e(FormasDeVenda,{lp:lp, mes:mes}),
      e(BlocoPainel,{titulo:"Motivos de não conclusão", compacto:true, dir:String(motivos.reduce(function(a, m){ return a+m.qtd; }, 0))}, e(Distribuicao,{itens:motivos}))));
}
export { AbaLpAnalises };

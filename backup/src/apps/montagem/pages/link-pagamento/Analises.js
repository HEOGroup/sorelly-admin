// Sorelly Admin · montagem — pages/link-pagamento/Analises.js
// Aba Análises: pago por mês e conversão, bônus do setor por mês, rankings de representantes e revendedoras, parcelas, bandeira, canal, link/CNPJ e motivos de não conclusão.
// Todas as contas vêm de analiseLp (domain/link-pagamento.js), agrupadas pelo mês em que o link foi gerado. As faixas do bônus ficam em config.bonus (editáveis aqui).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { BarraFiltros, Dinheiro, Faixa, LINHA, Mosaico, Tab, Td } from "@/apps/montagem/components/padrao";
import { ROTULO_STATUS, COR_STATUS, MOTIVOS_NAO_CONCLUSAO, analiseLp, bonusDoValor, formatarReais, meioDe, nomeMeio } from "@/apps/montagem/domain/link-pagamento";
import { Bt, Ind, Sel, Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { FormasDeVenda, ResumoLinks } from "@/apps/montagem/pages/link-pagamento/Resumo";
import { pct, useLp } from "@/apps/montagem/pages/link-pagamento/visual";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useMemo, useState } from "@/shared/react";

var COR = "#0EA5E9";   // cor do setor Link de pagamento
var NOME_MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
var NOME_MES_LONGO = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
var curto = function(m){ var p = String(m).split("-"); return NOME_MES[+p[1]-1]+"/"+p[0].slice(2); };
var longo = function(m){ var p = String(m).split("-"); return NOME_MES_LONGO[+p[1]-1]+"/"+p[0]; };

// Item das distribuições: quantidade de links gerados e, na linha de baixo, quantos foram pagos, o valor pago e a conversão
var item = function(i, nome, cor){ return {nome:nome, qtd:i.gerados, cor:cor, extra:"Pagos: "+i.pagos+" ("+formatarReais(i.valor)+") · conversão "+pct(i.conversao)}; };

// Gráfico simples: uma barra por mês (valor pago) com a conversão embaixo
function GraficoMeses(p){
  var max = Math.max.apply(null, p.meses.map(function(m){ return m.valorPago; }).concat([1]));
  return e("div",{className:"flex items-end justify-center gap-2 overflow-x-auto px-2 pb-1 pt-2"}, p.meses.map(function(m){
    var h = Math.max(4, Math.round(m.valorPago/max*110));
    return e("div",{key:m.mes, className:"flex min-w-14 flex-col items-center gap-1", title:longo(m.mes)+": "+formatarReais(m.valorPago)+" pagos de "+formatarReais(m.valorGerado)+" gerados"},
      e("span",{className:MONO+" text-[11px] font-bold text-white/85"}, Math.round(m.valorPago/1000)+" mil"),
      e("div",{className:"w-9 rounded-t-md", style:{height:h+"px", background:"linear-gradient(180deg,"+COR+","+COR+"55)"}}),
      e("span",{className:"text-[11.5px] font-bold"}, curto(m.mes)),
      e("span",{className:MONO+" rounded-full bg-black/30 px-1.5 text-[10.5px] "+(m.conversao>=65 ? "text-[#4ADE80]" : m.conversao>=55 ? "text-[#FBBF24]" : "text-[#EF4444]")}, pct(m.conversao)));
  }));
}

// Barras horizontais para distribuições (parcelas, bandeira, canal, link, motivos). itens = [{nome, qtd, valor, extra}]
function Distribuicao(p){
  var max = Math.max.apply(null, p.itens.map(function(i){ return i.qtd; }).concat([1])), total = p.itens.reduce(function(a, i){ return a+i.qtd; }, 0) || 1;
  return p.itens.length ? e("div",{className:"flex flex-col gap-1.5 p-2"}, p.itens.map(function(i){
    return e("div",{key:i.nome, className:"flex flex-col gap-0.5"},
      e("div",{className:"flex items-center justify-between gap-2 text-[12.5px]"}, e("b",null, i.nome), e("span",{className:MONO+" text-white/80"}, i.qtd+" · "+pct(i.qtd/total*100)+(i.valor!=null ? " · "+formatarReais(i.valor) : ""))),
      e("div",{className:"h-2 overflow-hidden rounded-full bg-black/30"}, e("div",{className:"h-full rounded-full", style:{width:Math.max(2, Math.round(i.qtd/max*100))+"%", background:i.cor || COR}})),
      i.extra && e("span",{className:"text-center text-[11px] text-white/55"}, i.extra));
  })) : e("div",{className:"p-2"}, e(Vazio,{ic:"chart-bar"}, "Sem dados no período."));
}

// Ranking (representantes ou revendedoras): mostra os 10 primeiros e "Ver todas"
function Ranking(p){
  var st = useState(false), todos = st[0], lista = todos ? p.itens : p.itens.slice(0, 10);
  return p.itens.length ? e("div",{className:"p-2"},
    e(Tab,{cols:["#", p.rot, "Valor pago", "Links pagos", "Gerados", "Conversão"]}, lista.map(function(i, k){
      return e("tr",{key:i.nome, className:LINHA}, e(Td,{dinheiro:true}, k+1), e(Td,{forte:true}, i.nome), e(Td,{dinheiro:true, cor:"ok"}, formatarReais(i.valor)), e(Td,{dinheiro:true}, i.pagos), e(Td,{dinheiro:true}, i.gerados), e(Td,{dinheiro:true}, pct(i.conversao)));
    })),
    p.itens.length>10 && e("div",{className:"flex justify-center pt-2"}, e(Bt,{onClick:function(){ st[1](!todos); }}, todos ? "Ver só as 10 primeiras" : "Ver todas ("+p.itens.length+")")))
    : e("div",{className:"p-2"}, e(Vazio,{ic:"trophy"}, "Sem dados no período."));
}

// Faixas do bônus (config.bonus.faixas): cada faixa = valor pago no mês a partir de → bônus
function EditorFaixas(p){
  var fx = p.faixas, st = useState(null), rasc = st[0], lista = rasc || fx;
  var muda = function(i, k, v){ var n = lista.map(function(x, j){ return j===i ? Object.assign({}, x, (function(){ var o = {}; o[k] = v || 0; return o; })()) : x; }); st[1](n); };
  return e("div",{className:"flex flex-col items-center gap-2 p-2"},
    e(Tab,{cols:["A partir de (valor pago no mês)", "Bônus", ""]}, lista.map(function(x, i){
      return e("tr",{key:i, className:LINHA},
        e(Td,null, e(Dinheiro,{value:x.min, label:"Valor mínimo", className:"w-36", onChange:function(v){ muda(i, "min", v); }})),
        e(Td,null, e(Dinheiro,{value:x.valor, label:"Bônus", className:"w-28", onChange:function(v){ muda(i, "valor", v); }})),
        e(Td,null, e("button",{type:"button", "aria-label":"Remover faixa", title:"Remover faixa", onClick:function(){ st[1](lista.filter(function(y, j){ return j!==i; })); }, className:"grid size-8 place-items-center rounded-lg bg-[#EF4444]/15 text-[#F87171] hover:bg-[#EF4444]/30"}, "×")));
    })),
    e("div",{className:"flex flex-wrap justify-center gap-2"},
      e(Bt,{onClick:function(){ st[1](lista.concat([{min:0, valor:0}])); }}, "Adicionar faixa"),
      rasc && e(Bt,{tipo:"forte", ic:"floppy-disk", onClick:function(){ if(p.onSalvar(rasc)) st[1](null); }}, "Salvar faixas"),
      rasc && e(Bt,{onClick:function(){ st[1](null); }}, "Descartar")));
}

function AbaLpAnalises(){
  var L = useLp(), lp = L.lp, st = useState(""), mes = st[0];
  var an = useMemo(function(){ return analiseLp({lp:lp}, {mes:mes}); }, [lp.solicitacoes, lp.config, mes]);
  var todos = useMemo(function(){ return mes ? analiseLp({lp:lp}, {}) : an; }, [lp.solicitacoes, lp.config, mes, an]);
  var t = an.totais, c = an.canais, cfg = lp.config, faixas = ((cfg.bonus || {}).faixas || []).slice().sort(function(a, b){ return b.min-a.min; });
  var meses = todos.meses;
  var motivos = MOTIVOS_NAO_CONCLUSAO.filter(function(k){ return an.motivos[k]; }).map(function(k){ return {nome:ROTULO_STATUS[k], qtd:an.motivos[k].qtd, valor:an.motivos[k].valor, cor:COR_STATUS[k]}; }).sort(function(a, b){ return b.qtd-a.qtd; });
  var preJul = (!mes || mes<"2026-07") && lp.solicitacoes.some(function(x){ return x.importado; });
  return e("div",{className:"flex flex-col gap-2.5"},
    e(BarraFiltros,{ativo:!!mes, onLimpar:function(){ st[1](""); }},
      e(Sel,{v:mes, set:st[1], rot:"Mês", todos:"Todos os meses", opcoes:meses.map(function(m){ return [m.mes, longo(m.mes)]; }).reverse()}),
      e("span",{className:"text-[12.5px] font-bold text-white/70"}, "Contas pelo mês em que o link foi gerado")),
    e(Faixa,{n:6},
      e(Ind,{t:"Links gerados", v:t.gerados, cor:"info"}), e(Ind,{t:"Links pagos", v:t.pagos, cor:"ok"}),
      e(Ind,{t:"Conversão", v:pct(t.conversao), cor:t.conversao>=65 ? "ok" : t.conversao>=55 ? "alerta" : "ruim", titulo:"Pagos divididos por gerados"}),
      e(Ind,{t:"Valor pago", v:formatarReais(t.valorPago), cor:"ok"}), e(Ind,{t:"Ticket médio", v:formatarReais(t.ticket), cor:"total"}),
      e(Ind,{t:"Para conferir", v:t.suspeitas, cor:t.suspeitas ? "alerta" : "ok", titulo:"Possíveis duplicadas e datas incoerentes na planilha (veja no Histórico)"})),
    e(ResumoLinks,{lp:lp, mes:mes || (meses.length ? meses[meses.length-1].mes : "")}),
    e(BlocoBarra,{cor:"turquesa", t:"Pago por mês e conversão", compacto:true, dir:String(meses.length)},
      meses.length ? e(GraficoMeses,{meses:meses}) : e("div",{className:"p-2"}, e(Vazio,{ic:"chart-bar"}, "Ainda não há links gerados."))),
    e(BlocoBarra,{cor:"turquesa", t:"Bônus do setor por mês", compacto:true},
      e("div",{className:"flex flex-col gap-2 p-2"},
        meses.length ? e(Tab,{cols:["Mês", "Valor pago", "Faixa alcançada", "Bônus"]}, meses.map(function(m){
          var b = bonusDoValor(cfg, m.valorPago);
          return e("tr",{key:m.mes, className:LINHA}, e(Td,{forte:true}, longo(m.mes)), e(Td,{dinheiro:true}, formatarReais(m.valorPago)), e(Td,{dinheiro:true}, b.min!=null ? "≥ "+formatarReais(b.min) : "—"), e(Td,{dinheiro:true, cor:b.valor ? "ok" : "neutro"}, formatarReais(b.valor)));
        })) : e(Vazio,{ic:"coins"}, "Sem meses para calcular."),
        (cfg.bonus && cfg.bonus.obs) ? e("p",{className:"text-center text-[11.5px] text-white/60"}, cfg.bonus.obs) : null,
        e("p",{className:"text-center text-[12px] font-bold text-white/80"}, "Faixas do bônus"),
        e(EditorFaixas,{key:JSON.stringify(faixas), faixas:faixas, onSalvar:function(f){ return L.exec("bonus_salvar", {faixas:f}); }}))),
    e(Mosaico,{min:"24rem"},
      e(BlocoBarra,{cor:"turquesa", t:"Ranking de representantes", compacto:true, dir:String(an.reps.length)}, e(Ranking,{itens:an.reps, rot:"Representante"})),
      e(BlocoBarra,{cor:"turquesa", t:"Ranking de revendedoras", compacto:true, dir:String(an.revs.length)}, e(Ranking,{itens:an.revs, rot:"Revendedora"})),
      e(BlocoBarra,{cor:"turquesa", t:"Parcelas", compacto:true}, e(Distribuicao,{itens:an.parcelas.map(function(i){ return item(i, i.nome+"x"); })})),
      e(BlocoBarra,{cor:"turquesa", t:"Bandeira", compacto:true}, e(Distribuicao,{itens:an.bandeiras.map(function(i){ return item(i, i.nome); })})),
      e(BlocoBarra,{cor:"turquesa", t:"Canal: aplicativo e WhatsApp", compacto:true},
        e(Distribuicao,{itens:[item({gerados:c.app.gerados, pagos:c.app.pagos, valor:c.app.valor, conversao:c.app.conversao}, "Aplicativo"), item({gerados:c.whatsapp.gerados, pagos:c.whatsapp.pagos, valor:c.whatsapp.valor, conversao:c.whatsapp.conversao}, "WhatsApp", "#4ADE80")]}),
        preJul && e("p",{className:"px-2 pb-2 text-center text-[11px] text-white/55"}, "Antes de julho/2026 a planilha não registrava a plataforma: esses links contam como aplicativo.")),
      e(BlocoBarra,{cor:"turquesa", t:"Por link e CNPJ", compacto:true}, e(Distribuicao,{itens:an.meios.map(function(i){ var m = meioDe({lp:lp}, i.nome); return item(i, m ? nomeMeio(m) : "Sem link"); })})),
      e(FormasDeVenda,{lp:lp}),
      e(BlocoBarra,{cor:"turquesa", t:"Motivos de não conclusão", compacto:true, dir:String(motivos.reduce(function(a, m){ return a+m.qtd; }, 0))}, e(Distribuicao,{itens:motivos}))));
}
export { AbaLpAnalises };

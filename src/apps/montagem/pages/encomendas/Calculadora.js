// Sorelly Admin · montagem — pages/encomendas/Calculadora.js
// Encomendas e reposições → Calculadora de direito: digita a média dos 3 meses (e a maior venda) e mostra na hora o direito de reposição (quantidade, limite, taxa),
// o direito de expositor e o bloqueio. Só leitura das regras (domain/encomendas.js); as regras mudam em "Regras e configuração".
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Dinheiro, Faixa, Mosaico } from "@/apps/montagem/components/padrao";
import { bloqueioReposicao, calcularDireito, formatarDia, formatarReais, hojeSP } from "@/apps/montagem/domain/encomendas";
import { useEr } from "@/apps/montagem/pages/encomendas/visual";
import { Campo, Ind, Selo } from "@/apps/montagem/pages/compras/visualCompras";
import { INPUT } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

function AbaErCalculadora(){
  var E = useEr(), cfg = E.cfg, st = useState({media:0, maior:0, usadas:0, valorRep:0, vendas:0}), v = st[0];
  var set = function(k, x){ st[1](function(o){ var n = Object.assign({}, o); n[k] = x; return n; }); };
  var c = calcularDireito(cfg, v.media, v.maior, v.usadas), r = c.reposicao, x = c.expositor, ex = cfg.expositor, b = bloqueioReposicao(cfg, v.valorRep, v.vendas, hojeSP());
  var temMedia = v.media>0 || v.maior>0;
  var msg = function(ok, t){ return e("p",{className:"rounded-lg px-2 py-1.5 text-center text-[12.5px] font-bold "+(ok ? "bg-[#22C55E]/15 text-[#4ADE80]" : "bg-[#EF4444]/20 text-[#F87171]")}, t); };
  var dados = e("div",{className:"grid grid-cols-1 gap-2 p-2.5 sm:grid-cols-3"},
    e(Campo,{rot:"Média de vendas dos 3 meses"}, e(Dinheiro,{value:v.media, label:"Média dos 3 meses", onChange:function(y){ set("media", y); }})),
    e(Campo,{rot:"Maior venda (expositor)"}, e(Dinheiro,{value:v.maior, label:"Maior venda", onChange:function(y){ set("maior", y); }})),
    e(Campo,{rot:"Reposições já feitas no mês"}, e("input",{type:"number", min:0, step:1, value:v.usadas, onChange:function(ev){ set("usadas", Math.max(0, Math.round(Number(ev.target.value)||0))); }, className:INPUT+" w-full text-center"})));
  var reposicao = e("div",{className:"flex flex-col gap-2 p-2.5"},
    e("div",{className:"flex justify-center"}, e(Selo,{cor:!temMedia ? "#94A3B8" : r.quantidadeMes>0 ? "#4ADE80" : "#EF4444", ic:"arrows-clockwise"}, !temMedia ? "Aguardando a média" : r.quantidadeMes>0 ? "Tem direito à reposição" : "Sem direito à reposição")),
    e(Faixa,{n:4}, e(Ind,{t:"Reposições por mês", v:r.quantidadeMes, cor:r.quantidadeMes ? "info" : "neutro"}), e(Ind,{t:"Restantes no mês", v:r.restantes, cor:r.restantes ? "ok" : "neutro"}),
      e(Ind,{t:"Limite por reposição", v:formatarReais(r.limite), cor:"total"}), e(Ind,{t:"Taxa", v:formatarReais(r.taxa), cor:"alerta"})),
    temMedia && r.motivo && msg(false, r.motivo),
    temMedia && c.proxima && e("p",{className:"text-center text-[12px] text-white/70"}, "Faltam "+formatarReais(c.proxima.de-v.media)+" de média para a próxima faixa: "+c.proxima.qtd+(c.proxima.qtd===1 ? " reposição" : " reposições")+" de até "+formatarReais(c.proxima.limite)+" (taxa "+formatarReais(c.proxima.taxa)+")."));
  var expositor = e("div",{className:"flex flex-col gap-2 p-2.5"},
    e("div",{className:"flex justify-center"}, e(Selo,{cor:!temMedia ? "#94A3B8" : x.tem ? "#4ADE80" : "#EF4444", ic:"storefront"}, !temMedia ? "Aguardando a média" : x.tem ? "Tem direito ao expositor" : "Sem direito ao expositor")),
    e(Faixa,{n:2}, e(Ind,{t:"Média exigida", v:formatarReais(ex.media3m), cor:v.media>=ex.media3m ? "ok" : "neutro", sub:"3 meses"}), e(Ind,{t:"Venda exigida", v:formatarReais(ex.vendaMinima), cor:v.maior>=ex.vendaMinima ? "ok" : "neutro", sub:"uma venda"})),
    temMedia && !x.tem && msg(false, x.motivo),
    x.tem && msg(true, x.por==="media" ? "Liberado pela média dos 3 meses." : "Liberado pela venda de "+formatarReais(ex.vendaMinima)+"."),
    e("p",{className:"text-center text-[12px] text-white/70"}, (ex.exigeFoto ? "Exige foto do local. " : "")+"Taxa de entrega de "+formatarReais(ex.taxaEntrega)+"."));
  var bloqueio = e("div",{className:"flex flex-col gap-2 p-2.5"},
    e("div",{className:"grid grid-cols-1 gap-2 sm:grid-cols-2"}, e(Campo,{rot:"Valor da reposição"}, e(Dinheiro,{value:v.valorRep, label:"Valor da reposição", onChange:function(y){ set("valorRep", y); }})),
      e(Campo,{rot:"Vendas depois dela"}, e(Dinheiro,{value:v.vendas, label:"Vendas", onChange:function(y){ set("vendas", y); }}))),
    e(Faixa,{n:2}, e(Ind,{t:"Vendas sobre a reposição", v:b.pct.toLocaleString("pt-BR")+"%", cor:v.valorRep>0 ? (b.bloqueia ? "ruim" : "ok") : "neutro"}), e(Ind,{t:"Mínimo exigido", v:cfg.bloqueio.pctMinimo+"%", cor:"total"})),
    v.valorRep>0 && msg(!b.bloqueia, b.bloqueia ? b.motivo : "Sem bloqueio: vendas acima de "+cfg.bloqueio.pctMinimo+"% do valor da reposição."),
    e("p",{className:"text-center text-[12px] text-white/70"}, "Bloqueio de "+cfg.bloqueio.meses+" meses para novas solicitações."));
  return e("div",{className:"flex flex-col gap-2.5"},
    e(BlocoBarra,{cor:"turquesa", t:"Dados para o cálculo", compacto:true}, dados),
    e(Mosaico,{min:"24rem"},
      e(BlocoBarra,{cor:"turquesa", t:"Reposição", compacto:true}, reposicao),
      e(BlocoBarra,{cor:"turquesa", t:"Expositor", compacto:true}, expositor),
      e(BlocoBarra,{cor:"turquesa", t:"Bloqueio de reposição", compacto:true}, bloqueio)));
}
export { AbaErCalculadora };

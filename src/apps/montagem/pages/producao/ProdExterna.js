// Sorelly Admin · montagem — pages/producao/ProdExterna.js
// Produção › PRODUÇÃO EXTERNA (Dávila), tela única e simples (Marcus, 18/11/2026: "está muito confuso, muita coisa e muita tela; precisa bater o olho e ver").
// De cima para baixo: (1) RESUMO DO MÊS em 3 blocos de lista — dinheiro (valor do mês, já recebeu, a receber), peças do mês e peças com ela agora;
// (2) PEÇAS POR CÓDIGO e ENVIADAS A ELA lado a lado (o botão "+ Enviada" lança o que a Sorelly mandou para ela fazer); (3) PAGAMENTOS por quarta-feira (enviar ao Financeiro, marcar pago).
// Saíram desta tela o controle diário (enviadas, sobra, erros) e o comparativo com as funcionárias: o controle por código já diz o que está com ela. Contas em domain/producao.js (resumoExterna).
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { formatarInteiro, formatarReais, hojeSP, listaExternas, resumoExterna } from "@/apps/montagem/domain/producao";
import { AbaProdPagamentos } from "@/apps/montagem/pages/producao/ProdPagamentos";
import { AbaProdPecasCasa } from "@/apps/montagem/pages/producao/ProdPecasCasa";
import { Aviso, CAMPO_FAIXA, FaixaAzul, GRADE_LIMPA, Raiz, usePr } from "@/apps/montagem/pages/producao/visualProd";
import { e, useState } from "@/shared/react";

var n0 = function(v){ return formatarInteiro(v); };
var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function AbaProdExterna(){
  var x = usePr(), hoje = hojeSP(), ano = Number(hoje.slice(0, 4)), mes = Number(hoje.slice(5, 7)), sP = useState("Davila Aline");
  if(!x.admin && !x.leitura) return e(Raiz,null, e(BlocoPainel,{titulo:"Produção externa", compacto:true}, e(Aviso,null, "Somente a diretoria acessa.")));
  var pessoas = listaExternas(x.pr), func = pessoas.indexOf(sP[0])>=0 ? sP[0] : pessoas[0];   // Dávila, Leci, Didi: cada uma com o seu estoque, as suas peças e os seus pagamentos
  var r = resumoExterna(x.pr, ano, mes, func), nome = MESES[mes-1]+" · "+func.split(" ")[0];
  // bloco azul do padrão da Produção (Marcus, 18/11/2026: "tira essa cor dourado"): lista de duas colunas, cor só no estado (verde recebeu, amarelo falta)
  var bloco = function(chave, titulo, itens){ return e(BlocoPainel,{key:chave, titulo:titulo, compacto:true}, e(TabelaPlanilha,{fina:true, cols:[{k:"r", t:"Item"}, {k:"v", t:"Valor", cor:function(l){ return l.cor || ""; }}], linhas:itens.map(function(l, i){ return {id:chave+i, r:l[0], v:l[1], cor:l[2]}; }), chave:"id", grade:true, semContagem:true, semLimpar:true, semFiltro:true})); };
  return e(Raiz,null,
    e(BlocoPainel,{titulo:"Produção externa", dir:func, compacto:true}, e(FaixaAzul,null,
      e("label",{className:"flex items-center gap-2 text-[13px] font-semibold text-white"}, "Pessoa", e("select",{value:func, "aria-label":"Pessoa", onChange:function(ev){ sP[1](ev.target.value); }, className:CAMPO_FAIXA+" w-48 cursor-pointer"}, pessoas.map(function(n){ return e("option",{key:n, value:n}, n); }))))),
    e("div",{className:GRADE_LIMPA+" grid grid-cols-1 items-stretch gap-2 md:grid-cols-3"},
      bloco("d", "Dinheiro de "+nome, [["Valor do mês", formatarReais(r.valor)], ["Já recebeu", formatarReais(r.recebido), "text-success"], ["A receber", formatarReais(r.aReceber), r.aReceber>0 ? "text-warning" : "text-success"], ["Enviado ao Financeiro", formatarReais(r.enviadoFin)]]),
      bloco("p", "Peças de "+nome, [["Peças feitas e devolvidas", n0(r.pecas)], ["Dias com produção", n0(r.diasPecas)], ["Média por dia", r.diasPecas ? n0(Math.round(r.pecas/r.diasPecas)) : "—"], ["Valor por peça", formatarReais(0.45)]]),
      bloco("c", "Com ela agora", [["Enviadas a ela", n0(r.enviadoPecas)], ["Devolvidas à Sorelly", n0(r.devolvidoPecas), "text-success"], ["Com ela agora", n0(r.comEla), r.comEla>0 ? "text-warning" : "text-success"], ["Códigos com ela", n0(r.codigosComEla)]])),
    e(AbaProdPecasCasa,{key:"k"+func, func:func, semRaiz:true}),
    e(AbaProdPagamentos,{key:"g"+func, func:func, semRaiz:true}));
}
export { AbaProdExterna };

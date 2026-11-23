// Sorelly Admin · montagem — pages/encomendas/Ranking.js
// Encomendas e reposições › Ranking (19/11/2026, pedido do Marcus): a classificação das revendedoras pelo TOTAL de vendas dos últimos 3 meses, com a posição de 1 mês atrás e a situação de cada uma
// diante da lista do Top 100 (regra em docs/setores/encomendas-e-reposicoes/regras-top100.md). Só leitura: nada aqui muda a lista.
// Situação: Ativa = posição 1 a 100 e já na lista · Entrar = posição 1 a 100 e fora da lista · Protegida = 101 a 150 e já na lista · Sem acesso = 101 a 150 e fora da lista · Em saída = depois do 150 e ainda na lista.
// Dados: GET /api/encomendas/ranking (src/server/encomendas-ranking.js). Filtro e ordem ficam no título de cada coluna (TabelaPlanilha).
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { Pagina } from "@/apps/montagem/components/padrao";
import { PAGINA_CHEIA, CLS_FINA, CLS_FINA_ESPACO, refCheia } from "@/apps/montagem/components/planilha-cheia";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { formatarReais } from "@/apps/montagem/domain/encomendas";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { useEr } from "@/apps/montagem/pages/encomendas/visual";
import { e, useEffect, useState } from "@/shared/react";

var CACHE = null;   // leitura guardada por 1 minuto; a tela se atualiza sozinha a cada minuto (tempo real, 23/11/2026)
var FUNDO = "!bg-[#0f1729] [&_tbody_tr:hover]:!bg-[#1e2d4c]";   // azul-marinho da Home do Financeiro familiar
var norm = function(t){ return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ").trim(); };
var PART = {DA:1, DE:1, DO:1, DOS:1, DAS:1, E:1};
var palavras = function(t){ return norm(t).split(" ").filter(function(p){ return p && !PART[p]; }); };
// mesma pessoa: nomes iguais, ou o mais curto (2 palavras ou mais) inteiro dentro do mais longo
var mesma = function(a, b){
  var x = palavras(a), y = palavras(b); if(!x.length || !y.length) return false;
  var c = x.length<=y.length ? [x, y] : [y, x];
  return c[0].join(" ")===c[1].join(" ") || (c[0].length>=2 && c[0].every(function(t){ return c[1].indexOf(t)>=0; }));
};
var tresNomes = function(t){ var p = String(t || "").trim().split(" ").filter(function(w, k){ return w && (k===0 || !PART[norm(w)]); }); return p.slice(0, 3).join(" "); };   // revendedora: até o 3º nome
var nomeCurto = function(t){ var w = String(t || "").trim().split(" ").filter(Boolean); if(w.length<2) return w.join(" "); var o = [w[0]]; if(PART[norm(w[1]).toLowerCase ? norm(w[1]) : ""] && w[2]){ o.push(w[1], w[2]); } else o.push(w[1]); return o.join(" "); };   // 1º e 2º nome (mantém o "de" do meio: Janaina de Fatima)
var doisNomes = function(t){ var p = String(t || "").split(/\s+-\s+/)[0].trim().split(/\s+/).filter(function(w, k){ return w && (k===0 || !PART[norm(w)]); }); return p.slice(0, 2).join(" "); };   // representante: só o 1º e o 2º nome
var dia = function(v){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || "")); return m ? m[3]+"/"+m[2]+"/"+m[1] : ""; };
var COR_SIT = {"Na lista":"text-success font-normal", "Fora da lista":"text-warning font-normal", "Ativa":"text-success font-normal", "Entrar":"text-warning font-normal", "Protegida":"text-warning", "Sem acesso":"", "Em saída":"text-destructive font-normal"};

function useRanking(){
  var st = useState(CACHE ? CACHE.dados : null), dados = st[0];
  var buscar = function(forcar, limpa){
    if(!apiAtiva()) return;
    if(limpa) st[1](null);
    chamar("GET", "/encomendas/ranking"+(forcar ? "?atualizar=1" : "")).then(function(j){ if(j && j.pronto){ CACHE = {em:Date.now(), dados:j}; st[1](j); } else if(!CACHE) st[1](j); }).catch(function(){ if(!CACHE) st[1]({erro:true}); });
  };
  useEffect(function(){
    if(!CACHE || Date.now()-CACHE.em>=60*1000) buscar(false, false);
    var t = setInterval(function(){ buscar(false, false); }, 60*1000);
    return function(){ clearInterval(t); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  return {dados:dados, atualizar:function(){ buscar(true, true); }};
}
var hora = function(iso){ var d = new Date(iso); return isNaN(d) ? "" : d.toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit", second:"2-digit"}); };

var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var nomeMes = function(ym){ return MESES[Number(String(ym).slice(5, 7))-1]; };
var soma = function(ls, k){ return Math.round(ls.reduce(function(t, l){ return t+(Number(l[k]) || 0); }, 0)*100)/100; };

// Tela de premiação das revendedoras (Marcus, 23/11/2026): em cima o Top 20 do mês até agora; embaixo 3 blocos, um para cada um dos 3 meses anteriores, cada um com o Top 20 do mês e, ao lado, a venda desta revendedora no mês atual.
// Quem já fez acerto no mês atual mostra o valor; quem ainda falta fica de outra cor (amarelo) com "Falta". Filtro e ordem no título de cada coluna.
var MEDALHA = function(l){ return l.pos===1 ? "text-[#E8B84B]" : l.pos===2 ? "text-[#C9D1DC]" : l.pos===3 ? "text-[#D98A4B]" : ""; };   // ouro, prata e bronze nos 3 primeiros
var R = function(v){ return formatarReais(v); };

// Top 50 pelo ACERTO somado dos 3 meses fechados (Marcus, 23/11/2026): quem ainda não acertou no mês atual fica em amarelo, com a previsão do acerto; quem já acertou fica com a letra mais clara e a data em que acertou.
var br = function(iso){ var t = String(iso || "").slice(0, 10).split("-"); return t.length===3 && t[0].length===4 ? t[2]+"/"+t[1] : ""; };
function BlocoTop50(p){
  var rk = p.rk, mAtual = nomeMes(rk.mesAtual);
  var linhas = rk.itens.map(function(x){
    var o = {id:x.cod, pos:x.pos, nome:nomeCurto(x.nome), rep:doisNomes(x.rep), app:x.vendaApp===null || x.vendaApp===undefined ? "" : x.vendaApp, fez:x.fezMes, tv:0, ta:0, acertoMes:x.fezMes ? x.acertoMes : "", dia:x.fezMes ? br(x.dataMes) : "", prev:x.fezMes ? "" : (br(x.previsao) || "Sem data")};
    (x.mm || []).forEach(function(v, i){ o["v"+i] = v[0]; o["a"+i] = v[1]; o.tv += v[0]; o.ta += v[1]; });
    return o; });
  var cols = [{k:"pos", t:"#", w:"1.8rem", cor:MEDALHA}, {k:"nome", t:"Revendedora", w:"8rem"}];
  var larg = function(t){ return Math.max(5.1, t.length*0.33+0.55)+"rem"; };   // a coluna sempre cabe o título inteiro, sem abreviar
  rk.meses.forEach(function(k, i){ cols.push({k:"v"+i, t:"Venda "+nomeMes(k), w:larg("Venda "+nomeMes(k)), fmt:R, sep:true}, {k:"a"+i, t:"Acerto "+nomeMes(k), w:larg("Acerto "+nomeMes(k)), fmt:R}); });
  var TOT = function(){ return "!bg-[#2d5190] font-normal text-white"; };   // Total 3 meses: cor própria (Marcus, 23/11/2026)
  cols.push({k:"tv", t:"Total venda", w:"5.1rem", fmt:R, sep:true, cor:TOT}, {k:"ta", t:"Total acerto", w:"5.1rem", fmt:R, cor:TOT},
    {k:"acertoMes", t:"Acerto "+mAtual, w:larg("Acerto "+mAtual), sep:true, render:function(v){ return e("span",null, v==="" ? "Falta" : R(v)); }},
    {k:"dia", t:"Acertou em", w:"3.9rem", render:function(v){ return e("span",null, v || "—"); }},
    {k:"prev", t:"Previsão", w:"3.7rem", render:function(v){ return e("span",null, v || "—"); }},
    {k:"rep", t:"Representante", w:"5.6rem", sep:true},
    {k:"app", t:"Venda no app", w:"5.6rem", fmt:R, sep:true});
  var faltam = linhas.filter(function(l){ return !l.fez; }).length;
  var total = function(ls){ return cols.map(function(c, i){
    if(i===0) return "Total";
    if(c.k==="nome") return ls.length+" revendedoras";
    if(c.k==="tv" || c.k==="ta" || c.k==="acertoMes" || c.k==="app" || (c.k.length===2 && (c.k.charAt(0)==="v" || c.k.charAt(0)==="a"))) return R(soma(ls, c.k));
    return ""; }); };
  return e(BlocoPainel,{titulo:"Top 50 · acerto dos últimos 3 meses", compacto:true, cls:FUNDO, dir:faltam+" faltam · "+(linhas.length-faltam)+" já acertaram"},
    e("div",{ref:refCheia(), className:CLS_FINA+" [&_table_td]:!px-[3px] [&_table_th]:!px-[3px] [&_table]:!min-w-[70rem] [&_th]:!font-normal [&_td]:!font-normal [&_tfoot_td]:sticky [&_tfoot_td]:bottom-0 [&_tfoot_td]:z-10 [&_tfoot_td]:!bg-[#1f3358] [&_tfoot_th]:sticky [&_tfoot_th]:bottom-0 [&_tfoot_th]:z-10 [&_tfoot_th]:!bg-[#1f3358] [&_td:nth-child(3)]:!border-l-[3px] [&_td:nth-child(3)]:!border-l-white [&_th:nth-child(3)]:!border-l-[3px] [&_th:nth-child(3)]:!border-l-white [&_td:nth-child(5)]:!border-l-[3px] [&_td:nth-child(5)]:!border-l-white [&_th:nth-child(5)]:!border-l-[3px] [&_th:nth-child(5)]:!border-l-white [&_td:nth-child(7)]:!border-l-[3px] [&_td:nth-child(7)]:!border-l-white [&_th:nth-child(7)]:!border-l-[3px] [&_th:nth-child(7)]:!border-l-white [&_td:nth-child(9)]:!border-l-[3px] [&_td:nth-child(9)]:!border-l-white [&_th:nth-child(9)]:!border-l-[3px] [&_th:nth-child(9)]:!border-l-white [&_td:nth-child(11)]:!border-l-[3px] [&_td:nth-child(11)]:!border-l-white [&_th:nth-child(11)]:!border-l-[3px] [&_th:nth-child(11)]:!border-l-white [&_td:nth-child(9)]:!bg-[#2d5190] [&_th:nth-child(9)]:!bg-[#2d5190] [&_td:nth-child(10)]:!bg-[#2d5190] [&_th:nth-child(10)]:!bg-[#2d5190]", style:{"--lh":"17px"}},   // linhas brancas grossas entre os grupos (Agosto, Setembro, Outubro, Total 3 meses, Novembro) e cor própria no Total 3 meses
      e(TabelaPlanilha,{fina:true, cols:cols, linhas:linhas, chave:"id", semCaixaAlta:true, grade:true, semMao:true, centro:true, semContagem:true, alturaMax:"15rem", totalRodape:total,
        linhaCls:function(l){ return l.fez ? "[&>td]:!text-white" : "!bg-[#4a3a10] [&>td]:!text-warning"; }, vazio:"Sem vendas."})));
}

function AbaEncRanking(){
  var rk = useRanking(), d = rk.dados;
  var todos = d && d.meses ? d.meses : [], atual = todos[todos.length-1];
  var ant3 = atual ? todos.slice(Math.max(0, todos.length-4), todos.length-1) : [];   // os 3 acertos anteriores de cada vendedora (do mais antigo ao mais novo)
  var linhas = (atual ? atual.itens.slice(0, 20) : []).map(function(x){
    var o = {id:x.cod, pos:x.pos, nome:tresNomes(x.nome), rep:doisNomes(x.rep), venda:x.venda, acerto:x.acerto};
    ant3.forEach(function(m){ var v = m.ac ? m.ac[x.cod] : null; o["a_"+m.ym] = v>0 ? v : ""; });
    return o; });
  var cols = [
    {k:"pos", t:"#", w:"2rem", fixa:true, cor:MEDALHA},
    {k:"nome", t:"Revendedora", w:"11rem", fixa:"2rem"},
    {k:"rep", t:"Representante", w:"7rem"},
    {k:"venda", t:"Venda do mês", fmt:R},
    {k:"acerto", t:"Acerto do mês", fmt:R}]
    .concat(ant3.map(function(m){ var k = "a_"+m.ym;
      return {k:k, t:"Acerto em "+nomeMes(m.ym), render:function(v){ return e("span",null, v==="" ? "—" : R(v)); },
        cor:function(l){ return l[k]==="" ? "" : l.acerto>l[k] ? "font-normal text-success" : l.acerto<l[k] ? "font-normal text-destructive" : ""; }}; }));
  var total = function(ls){ return cols.map(function(c, i){
    if(i===0) return "Total";
    if(c.k==="nome") return ls.length+" revendedoras";
    if(c.k==="venda" || c.k==="acerto" || c.k.indexOf("a_")===0) return R(soma(ls, c.k));
    return ""; }); };
  var titulo = "Top 20 · "+(atual ? nomeMes(atual.ym)+" até "+dia(atual.ate).slice(0, 5) : "");
  // tudo num fundo branco: só as linhas brancas grossas separam os blocos (sem faixa preta)
  return e(Pagina,{className:PAGINA_CHEIA},
    e("div",{className:"flex min-w-0 flex-col gap-1 bg-white p-1"},
      e(BlocoPainel,{titulo:titulo, compacto:true, cls:FUNDO},
        e("div",{className:CLS_FINA_ESPACO+" [&_table]:!min-w-[46rem] [&_th]:!font-normal [&_td]:!font-normal", style:{"--lh":"17px"}},   // Top 20 mais fino (letra e linha menores) para o Top 50 começar mais em cima
          e(TabelaPlanilha,{fina:true, cols:cols, linhas:linhas, chave:"id", semCaixaAlta:true, grade:true, semMao:true, centro:true, semContagem:true, alturaMax:"27rem", totalRodape:total, cabAcima:ant3.length ? [[{t:"", span:5}, {t:e("span",{className:"inline-flex items-center justify-center gap-2 whitespace-nowrap"}, e("span",{className:"inline-flex items-center gap-1"}, e("span",{className:"inline-block size-2 rounded-full bg-[#22c55e]"}), "Acerto atual maior que o do mês"), e("span",{className:"inline-flex items-center gap-1"}, e("span",{className:"inline-block size-2 rounded-full bg-[#ef4444]"}), "Acerto atual menor que o do mês")), span:ant3.length}]] : undefined,
            vazio:!d ? "Carregando o ranking." : d.erro ? "Não foi possível ler as vendas agora." : "Nenhuma venda no período."}))),
      d && d.rankAcerto && e(BlocoTop50,{rk:d.rankAcerto})));
}
export { AbaEncRanking, useRanking };

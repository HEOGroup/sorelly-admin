// Sorelly Admin · montagem — pages/encomendas/Ranking.js
// Encomendas e reposições › Ranking (19/11/2026, pedido do Marcus): a classificação das revendedoras pelo TOTAL de vendas dos últimos 3 meses, com a posição de 1 mês atrás e a situação de cada uma
// diante da lista do Top 100 (regra em docs/setores/encomendas-e-reposicoes/regras-top100.md). Só leitura: nada aqui muda a lista.
// Situação: Ativa = posição 1 a 100 e já na lista · Entrar = posição 1 a 100 e fora da lista · Protegida = 101 a 150 e já na lista · Sem acesso = 101 a 150 e fora da lista · Em saída = depois do 150 e ainda na lista.
// Dados: GET /api/encomendas/ranking (src/server/encomendas-ranking.js). Filtro e ordem ficam no título de cada coluna (TabelaPlanilha).
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { Pagina } from "@/apps/montagem/components/padrao";
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { formatarReais } from "@/apps/montagem/domain/encomendas";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { useEr } from "@/apps/montagem/pages/encomendas/visual";
import { e, useEffect, useState } from "@/shared/react";

var CACHE = null;   // leitura guardada por 10 minutos para não repetir ao trocar de tela
var norm = function(t){ return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ").trim(); };
var PART = {DA:1, DE:1, DO:1, DOS:1, DAS:1, E:1};
var palavras = function(t){ return norm(t).split(" ").filter(function(p){ return p && !PART[p]; }); };
// mesma pessoa: nomes iguais, ou o mais curto (2 palavras ou mais) inteiro dentro do mais longo
var mesma = function(a, b){
  var x = palavras(a), y = palavras(b); if(!x.length || !y.length) return false;
  var c = x.length<=y.length ? [x, y] : [y, x];
  return c[0].join(" ")===c[1].join(" ") || (c[0].length>=2 && c[0].every(function(t){ return c[1].indexOf(t)>=0; }));
};
var doisNomes = function(t){ var p = String(t || "").split(/\s+-\s+/)[0].trim().split(/\s+/).filter(function(w, k){ return w && (k===0 || !PART[norm(w)]); }); return p.slice(0, 2).join(" "); };   // representante: só o 1º e o 2º nome
var dia = function(v){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || "")); return m ? m[3]+"/"+m[2]+"/"+m[1] : ""; };
var COR_SIT = {"Ativa":"text-success font-semibold", "Entrar":"text-warning font-semibold", "Protegida":"text-warning", "Sem acesso":"", "Em saída":"text-destructive font-semibold"};

function useRanking(){
  var st = useState(CACHE ? CACHE.dados : null), dados = st[0];
  var buscar = function(forcar){
    if(!apiAtiva()) return;
    chamar("GET", "/encomendas/ranking"+(forcar ? "?atualizar=1" : "")).then(function(j){ if(j && j.pronto){ CACHE = {em:Date.now(), dados:j}; } st[1](j); }).catch(function(){ st[1]({erro:true}); });
  };
  useEffect(function(){ if(!CACHE || Date.now()-CACHE.em>=10*60*1000) buscar(false); }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  return {dados:dados, atualizar:function(){ st[1](null); buscar(true); }};
}

function AbaEncRanking(){
  var E = useEr(), er = E.er, rk = useRanking(), d = rk.dados;
  var lista = er.revendedoras.filter(function(r){ return r.top50; });
  var itens = d && d.itens ? d.itens : [];
  var achadas = {};
  var linhas = itens.map(function(x){
    var r = lista.find(function(l){ return mesma(l.nome, x.nome); }), na = !!r; if(r) achadas[r.id] = true;
    var sit = x.pos<=100 ? (na ? "Ativa" : "Entrar") : x.pos<=150 ? (na ? "Protegida" : "Sem acesso") : (na ? "Em saída" : "Fora");
    var mud = x.posAntes ? x.posAntes-x.pos : "";
    return {id:x.cod, pos:x.pos, nome:x.nome, rep:doisNomes(x.rep), total:x.total, media:x.media, acertos:x.acertos, ultimo:x.ultimo, antes:x.posAntes || "", mud:mud, na:na ? "Sim" : "Não", sit:sit};
  });
  linhas = linhas.filter(function(l){ return l.pos<=150 || l.na==="Sim"; });   // mostra o Top 150 e quem ainda está na lista depois dele
  var foraDoRanking = lista.filter(function(r){ return !achadas[r.id]; }).length;
  var cols = [
    {k:"pos", t:"Posição", w:"4.5rem", fixa:true},
    {k:"nome", t:"Revendedora", w:"17rem", fixa:"4.5rem"},
    {k:"rep", t:"Representante", w:"9.5rem"},
    {k:"total", t:"Total 3 meses", w:"7.5rem", fmt:function(v){ return formatarReais(v); }},
    {k:"media", t:"Média", w:"7rem", fmt:function(v){ return formatarReais(v); }},
    {k:"acertos", t:"Acertos", w:"4.5rem"},
    {k:"ultimo", t:"Último acerto", w:"6.5rem", data:true, fmt:dia},
    {k:"mud", t:"Há 1 mês", w:"7rem", fmt:function(v, l){ return v==="" ? "Nova" : (l.antes+" · "+(v>0 ? "▲ "+v : v<0 ? "▼ "+(-v) : "=")); }, cor:function(l){ return l.mud==="" ? "text-warning" : l.mud>0 ? "text-success" : l.mud<0 ? "text-destructive" : ""; }},
    {k:"na", t:"Na lista", w:"5rem"},
    {k:"sit", t:"Situação", w:"6.5rem", cor:function(l){ return COR_SIT[l.sit] || ""; }}];
  var total = function(ls){ return cols.map(function(c, i){
    if(i===0) return "Total";
    if(c.k==="nome") return ls.length.toLocaleString("pt-BR")+(ls.length===1 ? " revendedora" : " revendedoras");
    if(c.k==="na") return String(ls.filter(function(l){ return l.na==="Sim"; }).length);
    if(c.k==="sit") return foraDoRanking ? foraDoRanking+" da lista fora do ranking" : "";
    return ""; }); };
  var titulo = "Ranking"+(d && d.janela ? " · "+dia(d.janela.ini)+" a "+dia(d.janela.fim) : "");
  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    e(BlocoPainel,{titulo:titulo, compacto:true},
      e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1"},
        e(Botao,{principal:true, onClick:rk.atualizar, title:"Lê as vendas de novo"}, "Atualizar ranking")),
      e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", semCaixaAlta:true, grade:true, semContagem:true, barraGrossa:true, alturaMax:"calc(100vh - 9rem)", totalRodape:total, linhaCls:function(l){ return l.pos>100 ? "[&>td]:!bg-[#FBBF24]/10" : ""; },
        vazio:!d ? "Carregando o ranking." : d.erro ? "Não foi possível ler as vendas agora." : "Nenhuma venda no período."})));
}
export { AbaEncRanking };

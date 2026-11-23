// Sorelly Admin · montagem — pages/encomendas/Cronograma.js
// Encomendas e reposições › Ranking › Cronograma de postagens (Marcus, 23/11/2026): um tema por dia para o Marketing postar sobre o ranking.
// Temas e legendas em domain/cronograma-ranking.js. A situação de cada dia (Para fazer, Feito, Postado) fica no servidor, módulo "ercrono", uma chave por dia: quem abre vê o que já foi postado.
// O acerto do 1º e do 10º lugar nos dias de parcial vem do ranking ao vivo (sem nomes). Filtro e ordem no título de cada coluna.
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { Pagina } from "@/apps/montagem/components/padrao";
import { PAGINA_CHEIA, CLS_FINA_ESPACO } from "@/apps/montagem/components/planilha-cheia";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { DIAS_CRONOGRAMA, MODULO_CRONOGRAMA, SITUACOES } from "@/apps/montagem/domain/cronograma-ranking";
import { formatarReais } from "@/apps/montagem/domain/encomendas";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { useRanking } from "@/apps/montagem/pages/encomendas/Ranking";
import { e, useEffect, useState } from "@/shared/react";

var FUNDO = "!bg-[#0f1729] [&_tbody_tr:hover]:!bg-[#1e2d4c]";   // azul-marinho da Home do Financeiro familiar
var SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
var COR_SIT = {fazer:"text-warning", feito:"text-info", postado:"text-success"};
var br = function(iso){ var t = String(iso || "").slice(0, 10).split("-"); return t.length===3 ? t[2]+"/"+t[1] : ""; };
var diaSemana = function(iso){ var t = iso.split("-"); return SEMANA[new Date(Number(t[0]), Number(t[1])-1, Number(t[2])).getDay()]; };
var hojeIso = function(){ var d = new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2, "0")+"-"+String(d.getDate()).padStart(2, "0"); };

// situação de cada dia: lê do servidor ao abrir e a cada 30 s; grava só a chave do dia que mudou
function useSituacao(){
  var st = useState({}), mapa = st[0], setMapa = st[1];
  var lerTudo = function(){
    if(!apiAtiva()) return;
    chamar("GET", "/estado/"+MODULO_CRONOGRAMA).then(function(r){
      var c = r && r.conteudo ? r.conteudo : {}, novo = {};
      Object.keys(c).forEach(function(k){ if(k.charAt(0)==="d" && c[k] && c[k].s) novo[k.slice(1)] = c[k]; });
      setMapa(function(a){ return Object.assign({}, a, novo); });
    }).catch(function(){});
  };
  useEffect(function(){ lerTudo(); var t = setInterval(lerTudo, 30000); return function(){ clearInterval(t); }; }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  var mudar = function(data, s){
    var v = {s:s, em:Date.now()}, ch = {}; ch["d"+data] = v;
    setMapa(function(a){ var n = Object.assign({}, a); n[data] = v; return n; });
    if(apiAtiva()) chamar("PUT", "/estado/"+MODULO_CRONOGRAMA, {chaves:ch}).catch(function(){});
  };
  return {mapa:mapa, mudar:mudar};
}

function AbaEncCronograma(){
  var rk = useRanking(), d = rk.dados, pr = d && d.premiacao ? d.premiacao : null;
  var sit = useSituacao(), hoje = hojeIso();
  var dadoParcial = function(){
    if(!pr || !pr.itens || pr.itens.length<10) return "Aguardando o ranking";
    var p1 = pr.itens.filter(function(x){ return x.pos===1; })[0], p10 = pr.itens.filter(function(x){ return x.pos===10; })[0];
    return "Top 1: "+formatarReais(p1.acerto)+" · 10º lugar: "+formatarReais(p10.acerto)+" (até "+br(pr.ate)+")";
  };
  var linhas = DIAS_CRONOGRAMA.map(function(x){
    var s = sit.mapa[x.data] ? sit.mapa[x.data].s : "fazer";
    return {id:x.data, data:x.data, dia:br(x.data)+" · "+diaSemana(x.data), tema:x.tema, formato:x.formato, ideia:x.ideia, legenda:x.legenda, dado:x.dado==="parcial" ? dadoParcial() : "—", s:s};
  });
  var texto = "block whitespace-normal px-2 text-left text-[13px] leading-tight";
  var cols = [
    {k:"dia", t:"Dia", w:"9.5rem"},
    {k:"tema", t:"Tema", w:"11rem", render:function(v){ return e("span",{className:"block whitespace-normal px-1 font-semibold text-white"}, v); }},
    {k:"formato", t:"Formato", w:"6.5rem"},
    {k:"ideia", t:"O que postar", render:function(v){ return e("span",{className:texto}, v); }},
    {k:"legenda", t:"Legenda sugerida", render:function(v){ return e("span",{className:texto}, v); }},
    {k:"dado", t:"Dado do dia", w:"11rem", render:function(v){ return e("span",{className:"block whitespace-normal px-1 text-[13px] tabular-nums leading-tight"}, v); }},
    {k:"s", t:"Situação", w:"8.5rem", render:function(v, l){
      return e("select",{value:v, "aria-label":"Situação de "+l.dia, onChange:function(ev){ sit.mudar(l.data, ev.target.value); },
        className:"h-8 w-full rounded-md border border-border bg-card px-2 text-[13px] "+(COR_SIT[v] || "")},
        SITUACOES.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })); }}];
  return e(Pagina,{className:PAGINA_CHEIA},
    e(BlocoPainel,{titulo:"Cronograma de postagens do ranking · Marketing", compacto:true, cls:FUNDO},
      e("div",{className:CLS_FINA_ESPACO+" [&_table]:!min-w-[72rem] [&_th]:!font-normal [&_th]:!text-[11px] [&_td]:!text-[13px] [&_td]:!font-normal"},
        e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", semCaixaAlta:true, grade:true, semMao:true, centro:true, semContagem:true, alturaMax:"calc(100vh - 9rem)",
          linhaCls:function(l){ return l.data===hoje ? "[&>td:first-child]:!border-l-4 [&>td:first-child]:!border-l-[#E8B84B]" : ""; },
          vazio:"Sem dias no cronograma."}))));
}
export { AbaEncCronograma };

// Sorelly Admin · montagem — pages/expositores/SemKit.js
// Aba "Com revendedoras" (09/11/2026, Marcus): TODAS as revendedoras que estão com expositor, em quatro visões (Segmentado): Todos, Com kit ativo, Sem kit e Kit há mais de 70 dias.
// Lida da DevMaster pela rota /api/expositores/revendedoras (só leitura). Kit ativo = kit aberto há até 70 dias; peça na condicional = a revendedora está com kit (regra do Marcus).
// "Sem kit há" conta da ÚLTIMA VENDA: é quando o último kit dela fechou, e aí começa o tempo real com expositor e sem kit (a data do expositor sozinha engana).
// Observação: texto livre por revendedora, gravado no módulo Expositores (ex.obsCampo) e igual para todo mundo; digita e sai do campo para salvar.
// Mesma tabela das telas Agendamento e Revendedoras (TabelaPlanilha): barra dourada, filtro e ordem NO TÍTULO de cada coluna, linha de TOTAL acima do cabeçalho, nada abreviado.
import { Botao, Segmentado, brl, inteiro } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { useEx } from "@/apps/montagem/pages/expositores/comum";
import { e, useEffect, useState } from "@/shared/react";

var SEM_VENDA = 99999;
var tempo = function(d){ return d===null || d===undefined || d==="" ? "Sem data" : d<60 ? d+" dias" : Math.floor(d/30)+" meses"; };
var dataBr = function(iso){ return iso ? iso.slice(8, 10)+"/"+iso.slice(5, 7)+"/"+iso.slice(0, 4) : "—"; };
var diasDe = function(iso){ return iso ? Math.max(0, Math.floor((Date.now()-new Date(iso+"T12:00:00").getTime())/86400000)) : null; };
var CAMPO_OBS = "h-8 w-80 rounded-md border border-border bg-card px-2.5 text-center text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary";
var VISOES = {todos:function(){ return true; }, comkit:function(r){ return r.categoria==="comkit"; }, semkit:function(r){ return r.categoria==="semkit"; }, kitvelho:function(r){ return r.categoria==="kitvelho"; }};
var ROTULOS = [["todos", "Todos"], ["comkit", "Com kit ativo"], ["semkit", "Sem kit"], ["kitvelho", "Kit há mais de 70 dias"]];

function AbaExSemKit(){
  var cx = useEx(), obsTodas = (cx.ex && cx.ex.obsCampo) || {};
  var st = useState({carregando:true, itens:[], erro:""}), dados = st[0], setDados = st[1], sv = useState("semkit"), visao = sv[0], setVisao = sv[1];
  var carregar = function(){
    setDados({carregando:true, itens:[], erro:""});
    if(!apiAtiva()){ setDados({carregando:false, itens:[], erro:"Sem conexão com o servidor."}); return; }
    chamar("GET", "/expositores/revendedoras").then(function(d){ setDados({carregando:false, itens:(d && d.itens) || [], erro:""}); })
      .catch(function(){ setDados({carregando:false, itens:[], erro:"Não foi possível ler a lista agora."}); });
  };
  useEffect(function(){ carregar(); }, []);
  var TODAS = [
    {k:"cod", t:"Código"}, {k:"nome", t:"Revendedora"}, {k:"representante", t:visao==="semkit" ? "Última representante" : visao==="todos" ? "Representante" : "Representante do kit"}, {k:"cidadeUf", t:"Cidade"}, {k:"celular", t:"Celular"},
    {k:"semKitDias", t:"Sem kit há", fmt:function(v){ return v==="" ? "—" : v>=SEM_VENDA ? "Sem venda" : tempo(v); }, cor:function(l){ return l.semKitDias==="" ? "" : l.semKitDias>60 ? "text-destructive font-semibold" : ""; }},
    {k:"ultimaVenda", t:"Última venda", fmt:function(v){ return v ? dataBr(v) : "Sem venda"; }},
    {k:"kitDias", t:"Kit aberto há", fmt:function(v){ return v==="" ? "Sem kit" : v+" dias"; }, cor:function(l){ return l.kitDias==="" ? "" : l.kitDias>70 ? "text-warning font-semibold" : ""; }},
    {k:"kitDesde", t:"Kit desde", fmt:function(v){ return v ? dataBr(v) : "—"; }},
    {k:"dias", t:"Expositor aberto há", fmt:tempo}, {k:"desde", t:"Expositor desde", fmt:dataBr},
    {k:"resumo", t:"Expositores"}, {k:"pecas", t:"Peças", fmt:inteiro}, {k:"valor", t:"Valor", fmt:function(v){ return brl(v); }},
    {k:"obs", t:"Observação", render:function(v, l){
      return e("input",{key:l.cod+"|"+v, defaultValue:v, maxLength:300, "aria-label":"Observação de "+l.nome, title:l.obsInfo || "Escreva e saia do campo para salvar", placeholder:"Escrever…", className:CAMPO_OBS,
        onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); },
        onBlur:function(ev){ var novo = ev.target.value.trim(); if(novo!==String(v||"").trim()) cx.exec({op:"obs_rev", cod:l.cod, txt:novo}); }}); }}];
  // cada visão mostra só as colunas que têm resposta: Sem kit não tem "Kit aberto há" nem "Kit desde"; Com kit e Kit há mais de 70 dias não têm "Sem kit há"; Todos mostra tudo
  var TIRA = {semkit:["kitDias", "kitDesde"], comkit:["semKitDias"], kitvelho:["semKitDias"], todos:[]};
  var COLS = TODAS.filter(function(c){ return (TIRA[visao] || []).indexOf(c.k)<0; });
  var conta = function(k){ return dados.itens.filter(VISOES[k]).length; };
  var opcoes = ROTULOS.map(function(o){ return [o[0], o[1]+(dados.carregando ? "" : " · "+conta(o[0]))]; });
  var linhas = dados.itens.filter(VISOES[visao]).map(function(r){
    var o = obsTodas[r.cod], dv = diasDe(r.ultimaVenda);
    return {cod:r.cod, nome:r.nome, representante:r.representante || "Sem registro", cidadeUf:[r.cidade, r.uf].filter(Boolean).join(" - ") || "—", celular:r.celular || "Sem celular",
      semKitDias:r.categoria==="semkit" ? (dv===null ? SEM_VENDA : dv) : "", ultimaVenda:r.ultimaVenda || "", kitDias:r.kitDias===null || r.kitDias===undefined ? "" : r.kitDias, kitDesde:r.kitDesde || "",
      dias:r.dias===null || r.dias===undefined ? "" : r.dias, desde:r.desde || "", resumo:r.resumo || "—", pecas:r.pecas, valor:r.valor,
      obs:o ? o.txt : "", obsInfo:o ? "Por "+o.por+" em "+String(o.em||"").slice(0, 16).replace("T", " ") : ""}; });
  if(visao==="semkit") linhas.sort(function(a, b){ return b.semKitDias-a.semKitDias; });
  var soma = function(ls, k){ return ls.reduce(function(t, l){ return t+l[k]; }, 0); };
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"flex justify-center"}, e(Segmentado,{opcoes:opcoes, atual:visao, onMudar:setVisao})),
    dados.carregando && e("p",{className:"py-6 text-center text-[13px] text-foreground"}, "Carregando a lista… a primeira leitura pode levar até 30 segundos."),
    dados.erro && e("div",{className:"flex flex-col items-center gap-2 py-6"}, e("p",{className:"text-[13px] text-foreground"}, dados.erro), e(Botao,{onClick:carregar}, "Tentar de novo")),
    !dados.carregando && !dados.erro && e(TabelaPlanilha,{key:visao, cols:COLS, linhas:linhas, chave:"cod", centro:true,
      totalLinha:function(ls){ return [{span:2, t:"TOTAL · "+inteiro(ls.length)+(ls.length===1 ? " revendedora" : " revendedoras")}].concat(COLS.slice(2).map(function(c){ return c.k==="pecas" ? inteiro(soma(ls, "pecas")) : c.k==="valor" ? brl(soma(ls, "valor")) : ""; })); }, vazio:"Nenhuma revendedora nesta visão."}));
}
export { AbaExSemKit };

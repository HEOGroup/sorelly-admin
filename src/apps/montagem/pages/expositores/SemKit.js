// Sorelly Admin · montagem — pages/expositores/SemKit.js
// Aba "Com revendedoras" (09/11/2026, Marcus): TODAS as revendedoras que estão com expositor, em quatro visões (Segmentado): Todos, Com kit ativo, Sem kit e Kit há mais de 70 dias.
// Lida da DevMaster pela rota /api/expositores/revendedoras (só leitura). Kit ativo = kit aberto há até 70 dias; peça na condicional = a revendedora está com kit (regra do Marcus).
// "Sem kit há" conta da ÚLTIMA VENDA: é quando o último kit dela fechou, e aí começa o tempo real com expositor e sem kit (a data do expositor sozinha engana).
// Observação: texto livre por revendedora, gravado no módulo Expositores (uma chave ex.obs_CÓDIGO por revendedora, para uma pessoa não apagar a observação da outra) e igual para todo mundo; na tabela só aparece Sim ou Não (tem observação ou não); clicar abre a janela para ler e escrever (Marcus, 11/11/2026: "não dá pra ler nada ali").
// Contém: Expositor, Só equipamento ou Expositor e equipamento; o equipamento vem separado por tipo em colunas próprias (Leitor, Notebook, Telefone, Outro equipamento). Leitor, notebook, celular e kit de apoio ficam com a representante e NÃO são expositor (ex.: Rayssa tem só um leitor).
// Mesma tabela das telas Agendamento e Revendedoras (TabelaPlanilha): barra dourada, filtro e ordem NO TÍTULO de cada coluna, linha de TOTAL acima do cabeçalho, nada abreviado.
import { Botao, Segmentado, brl, inteiro } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { useEx } from "@/apps/montagem/pages/expositores/comum";
import { e, useEffect, useState } from "@/shared/react";

var SEM_VENDA = 99999;
// observações: uma chave por revendedora (obs_CÓDIGO); o mapa antigo obsCampo ainda é lido, e a chave nova vale mais. Texto vazio = sem observação.
function obsDe(ex){ var m = {}; if(!ex) return m; Object.keys(ex.obsCampo || {}).forEach(function(k){ if(ex.obsCampo[k] && ex.obsCampo[k].txt) m[k] = ex.obsCampo[k]; }); Object.keys(ex).forEach(function(k){ if(k.indexOf("obs_")===0){ var c = k.slice(4); if(ex[k] && ex[k].txt) m[c] = ex[k]; else delete m[c]; } }); return m; }
var tempo = function(d){ return d===null || d===undefined || d==="" ? "Sem data" : d<60 ? d+" dias" : Math.floor(d/30)+" meses"; };
var dataBr = function(iso){ return iso ? iso.slice(8, 10)+"/"+iso.slice(5, 7)+"/"+iso.slice(0, 4) : "—"; };
var diasDe = function(iso){ return iso ? Math.max(0, Math.floor((Date.now()-new Date(iso+"T12:00:00").getTime())/86400000)) : null; };
var AREA_OBS = "w-full resize-none rounded-md border border-border bg-card p-2.5 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary";

// janela da observação: ler e escrever o texto inteiro
function JanelaObs(p){
  var st = useState(p.txt || ""), txt = st[0], setTxt = st[1];
  useEffect(function(){ var esc = function(ev){ if(ev.key==="Escape") p.fechar(); }; document.addEventListener("keydown", esc); return function(){ document.removeEventListener("keydown", esc); }; }, []);
  var igual = txt.trim()===String(p.txt || "").trim();
  return e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-black/60 p-3", onClick:p.fechar},
    e("div",{onClick:function(ev){ ev.stopPropagation(); }, className:"flex w-full max-w-xl flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-white/20"},
      e("div",{className:"flex items-start justify-between gap-3"},
        e("div",null, e("h2",{className:"text-[13px] font-bold"}, p.nome), e("p",{className:"text-[11px]"}, "Observação · código "+p.cod)),
        e("button",{type:"button", "aria-label":"Fechar", onClick:p.fechar, className:"grid size-8 place-items-center rounded-md border border-border bg-card text-[13px] hover:bg-white/10"}, "×")),
      e("textarea",{value:txt, rows:7, maxLength:300, autoFocus:true, "aria-label":"Observação de "+p.nome, placeholder:"Escreva aqui o que a representante ou a revendedora informou.", onChange:function(ev){ setTxt(ev.target.value); }, className:AREA_OBS}),
      e("p",{className:"text-[11px]"}, (p.info || "Ainda sem observação.")+" · "+txt.length+" de 300 letras"),
      e("div",{className:"flex flex-wrap items-center justify-center gap-2 border-t border-white/10 pt-3"},
        e(Botao,{onClick:p.fechar}, "Fechar"),
        p.txt && e(Botao,{onClick:function(){ if(p.salvar("")) p.fechar(); }}, "Apagar"),
        e(Botao,{principal:true, desabilitado:igual, onClick:function(){ if(p.salvar(txt.trim())) p.fechar(); }}, "Salvar"))));
}
var VISOES = {todos:function(){ return true; }, comkit:function(r){ return r.categoria==="comkit"; }, semkit:function(r){ return r.categoria==="semkit"; }, kitvelho:function(r){ return r.categoria==="kitvelho"; }};
var ROTULOS = [["todos", "Todos"], ["comkit", "Com kit ativo"], ["semkit", "Sem kit"], ["kitvelho", "Kit há mais de 70 dias"]];

function AbaExSemKit(){
  var cx = useEx(), obsTodas = obsDe(cx.ex);
  var st = useState({carregando:true, itens:[], erro:""}), dados = st[0], setDados = st[1], sv = useState("semkit"), visao = sv[0], setVisao = sv[1], so = useState(null), obsAberta = so[0], setObsAberta = so[1];
  var carregar = function(){
    setDados({carregando:true, itens:[], erro:""});
    if(!apiAtiva()){ setDados({carregando:false, itens:[], erro:"Sem conexão com o servidor."}); return; }
    chamar("GET", "/expositores/revendedoras").then(function(d){ setDados({carregando:false, itens:(d && d.itens) || [], erro:""}); })
      .catch(function(){ setDados({carregando:false, itens:[], erro:"Não foi possível ler a lista agora."}); });
  };
  useEffect(function(){ carregar(); }, []);
  var TODAS = [
    {k:"cod", t:"Código"}, {k:"nome", t:"Revendedora"},
    {k:"obs", t:"Observação", render:function(v, l){
      return e("button",{type:"button", title:v==="Sim" ? "Ler ou mudar a observação" : "Escrever uma observação", "aria-label":"Observação de "+l.nome+": "+v, onClick:function(){ setObsAberta(l.cod); }, className:"h-8 min-w-16 rounded-md border px-3 text-[13px] hover:bg-white/10 "+(v==="Sim" ? "border-primary bg-primary/20 font-semibold text-primary" : "border-border")}, v); }},
    {k:"contem", t:"Contém", cor:function(l){ return l.contem==="Só equipamento" ? "text-warning font-semibold" : ""; }},
    {k:"representante", t:visao==="semkit" ? "Última representante" : visao==="todos" ? "Representante" : "Representante do kit"}, {k:"cidadeUf", t:"Cidade"}, {k:"celular", t:"Celular"},
    {k:"semKitDias", t:"Sem kit há", fmt:function(v){ return v==="" ? "—" : v>=SEM_VENDA ? "Sem venda" : tempo(v); }, cor:function(l){ return l.semKitDias==="" ? "" : l.semKitDias>60 ? "text-destructive font-semibold" : ""; }},
    {k:"ultimaVenda", t:"Última venda", fmt:function(v){ return v ? dataBr(v) : "Sem venda"; }},
    {k:"kitDias", t:"Kit aberto há", fmt:function(v){ return v==="" ? "Sem kit" : v+" dias"; }, cor:function(l){ return l.kitDias==="" ? "" : l.kitDias>70 ? "text-warning font-semibold" : ""; }},
    {k:"kitDesde", t:"Kit desde", fmt:function(v){ return v ? dataBr(v) : "—"; }},
    {k:"dias", t:"Expositor aberto há", fmt:tempo}, {k:"desde", t:"Expositor desde", fmt:dataBr},
    {k:"resumo", t:"Expositores"}, {k:"leitores", t:"Leitor", fmt:function(v){ return v ? v : "—"; }}, {k:"notebooks", t:"Notebook", fmt:function(v){ return v ? v : "—"; }}, {k:"telefones", t:"Telefone", fmt:function(v){ return v ? v : "—"; }}, {k:"outrosEquip", t:"Outro equipamento"}, {k:"pecas", t:"Peças", fmt:inteiro}, {k:"valor", t:"Valor", fmt:function(v){ return brl(v); }}];
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
      obs:o ? "Sim" : "Não", obsTxt:o ? o.txt : "", obsInfo:o ? "Por "+o.por+" em "+String(o.em||"").slice(0, 16).replace("T", " ") : "",
      contem:r.contem || "Expositor", leitores:r.leitores || 0, notebooks:r.notebooks || 0, telefones:r.telefones || 0, outrosEquip:r.outrosEquip || "—"}; });
  if(visao==="semkit") linhas.sort(function(a, b){ return b.semKitDias-a.semKitDias; });
  var soma = function(ls, k){ return ls.reduce(function(t, l){ return t+l[k]; }, 0); };
  var linhaObs = obsAberta ? linhas.concat(dados.itens.filter(function(r){ return r.cod===obsAberta; }).map(function(r){ var o = obsTodas[r.cod]; return {cod:r.cod, nome:r.nome, obsTxt:o ? o.txt : "", obsInfo:o ? "Por "+o.por+" em "+String(o.em||"").slice(0, 16).replace("T", " ") : ""}; })).filter(function(l){ return l.cod===obsAberta; })[0] : null;
  return e("div",{className:"flex flex-col gap-2.5"},
    obsAberta && linhaObs && e(JanelaObs,{key:obsAberta, cod:linhaObs.cod, nome:linhaObs.nome, txt:linhaObs.obsTxt, info:linhaObs.obsInfo, salvar:function(t){ return cx.exec({op:"obs_rev", cod:linhaObs.cod, txt:t}); }, fechar:function(){ setObsAberta(null); }}),
    e("div",{className:"flex justify-center"}, e(Segmentado,{opcoes:opcoes, atual:visao, onMudar:setVisao})),
    dados.carregando && e("p",{className:"py-6 text-center text-[13px] text-foreground"}, "Carregando a lista… a primeira leitura pode levar até 30 segundos."),
    dados.erro && e("div",{className:"flex flex-col items-center gap-2 py-6"}, e("p",{className:"text-[13px] text-foreground"}, dados.erro), e(Botao,{onClick:carregar}, "Tentar de novo")),
    !dados.carregando && !dados.erro && e(TabelaPlanilha,{key:visao, cols:COLS, linhas:linhas, chave:"cod", centro:true,
      totalLinha:function(ls){ return [{span:2, t:"TOTAL · "+inteiro(ls.length)+(ls.length===1 ? " revendedora" : " revendedoras")}].concat(COLS.slice(2).map(function(c){ return c.k==="pecas" ? inteiro(soma(ls, "pecas")) : c.k==="valor" ? brl(soma(ls, "valor")) : ""; })); }, vazio:"Nenhuma revendedora nesta visão."}));
}
export { AbaExSemKit };

// Sorelly Admin · montagem — pages/PesquisaClima.js
// RH › Pesquisa de clima (18/11/2026, plano da NR-1 da Maria (RH)): abre e encerra RODADAS da pesquisa (a primeira e depois a cada trimestre) e mostra o resultado.
// A pesquisa é respondida pelo link público /pesquisa-de-clima (anônima). Aqui só o resultado em grupo: média e % favorável por pergunta, média por setor (só com 5 respostas ou mais) e comentários.
// ACESSO RESTRITO a quem está em LEITORES_CLIMA (src/server/clima.js, conferido no servidor): Marcus e Maria (RH). Os dados NÃO ficam no estado do sistema: são lidos do servidor a cada abertura.
import { Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { CAMPO } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { chamar } from "@/apps/montagem/lib/api";
import { Bt } from "@/apps/montagem/pages/compras/pecas";
import { use } from "@/apps/montagem/state/context";
import { e, useCallback, useEffect, useState } from "@/shared/react";

var virgula = function(n){ return Number(n || 0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); };
var dia = function(iso){ if(!iso) return ""; var d = new Date(iso); if(isNaN(d)) return ""; var z = function(n){ return (n<10 ? "0" : "")+n; }; return z(d.getDate())+"/"+z(d.getMonth()+1)+"/"+d.getFullYear(); };
var nomeSugerido = function(){ var h = new Date(); return "Clima "+Math.ceil((h.getMonth()+1)/3)+"º trimestre "+h.getFullYear(); };

function AbaPesquisaClima(){
  var cx = use(), d = cx.dispatch, dd = useState(null), dados = dd[0], er = useState(""), erroTxt = er[0], nm = useState(nomeSugerido()), nome = nm[0], oc = useState(false), ocupado = oc[0];
  var aviso = function(t, tom){ d({type:"AVISO", txt:t, tom:tom || "alerta"}); };
  var carregar = useCallback(function(id){
    return chamar("GET", "/clima"+(id ? "?rodada="+id : "")).then(function(j){ dd[1](j); er[1](""); }).catch(function(x){ er[1](x && x.message || "Não consegui abrir a pesquisa de clima."); });
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(function(){ carregar(); }, [carregar]);

  var rodadas = dados ? dados.rodadas : [], atual = dados ? rodadas.find(function(r){ return r.id==dados.rodada; }) : null, res = dados ? dados.resultado : null;
  var acao = function(corpo, ok){ oc[1](true); return chamar("POST", "/clima", corpo).then(function(){ aviso(ok, "ok"); return carregar(); }).catch(function(x){ aviso(x && x.message || "Não consegui concluir."); }).then(function(){ oc[1](false); }); };
  var copiarLink = function(){
    var link = window.location.origin+"/pesquisa-de-clima";
    try{ navigator.clipboard.writeText(link).then(function(){ aviso("Link da pesquisa copiado", "ok"); }, function(){ aviso("Não consegui copiar o link."); }); }catch(x){ aviso("Não consegui copiar o link."); }
  };

  var colsPerg = [{k:"t", t:"Afirmação"}, {k:"media", t:"Média (1 a 5)"}, {k:"fav", t:"Favorável (4 e 5)"}, {k:"n", t:"Respostas"}];
  var linhasPerg = res ? res.porPergunta.map(function(p){ return {id:p.k, t:p.t, media:virgula(p.media), fav:p.favoravel+"%", n:String(p.respostas)}; }) : [];
  var colsSetor = [{k:"setor", t:"Setor"}, {k:"n", t:"Respostas"}, {k:"media", t:"Média geral (1 a 5)"}];
  var linhasSetor = res ? res.porSetor.map(function(s){ return {id:s.setor, setor:s.setor, n:String(s.respostas), media:virgula(s.media)}; }) : [];
  var colsCom = [{k:"bom", t:"O que funciona bem"}, {k:"melhorar", t:"O que precisa melhorar"}];
  var linhasCom = res ? res.comentarios.map(function(c, i){ return {id:String(i), bom:c.bom || "—", melhorar:c.melhorar || "—"}; }) : [];

  var topo = e("div",{className:"flex flex-wrap items-center gap-2 rounded-lg border-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    e("h2",{className:"shrink-0 whitespace-nowrap text-[13px] font-bold uppercase"}, "Pesquisa de clima"),
    rodadas.length>0 && e("select",{value:dados.rodada || "", "aria-label":"Rodada", onChange:function(ev){ carregar(ev.target.value); }, className:CAMPO+" w-auto shrink-0"},
      rodadas.map(function(r){ return e("option",{key:r.id, value:r.id}, r.nome+(r.aberta ? " (aberta)" : "")); })),
    atual && e("span",{className:"whitespace-nowrap text-[13px] tabular-nums"}, atual.respostas+" respostas · "+(atual.aberta ? "aberta desde "+dia(atual.criada_em) : "encerrada em "+dia(atual.encerrada_em))),
    e("span",{className:"ml-auto flex flex-wrap items-center gap-2"},
      e(Bt,{tipo:"normal", onClick:copiarLink}, "Copiar link da pesquisa"),
      atual && atual.aberta && e(Bt,{tipo:"perigo", disabled:ocupado, onClick:function(){ acao({acao:"encerrar", id:atual.id}, "Rodada encerrada"); }}, "Encerrar rodada"),
      e("input",{value:nome, "aria-label":"Nome da nova rodada", maxLength:80, onChange:function(ev){ nm[1](ev.target.value); }, className:CAMPO+" w-64"}),
      e(Bt,{tipo:"forte", disabled:ocupado || nome.trim().length<3, onClick:function(){ acao({acao:"abrir", nome:nome}, "Rodada aberta"); }}, "Abrir nova rodada")));

  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    topo,
    erroTxt
      ? e("p",{className:"rounded-lg border-2 border-[var(--bloco-titulo)] bg-card/60 px-3 py-4 text-center text-[13px]"}, erroTxt)
      : !dados
        ? e("p",{className:"rounded-lg border-2 border-[var(--bloco-titulo)] bg-card/60 px-3 py-4 text-center text-[13px]"}, "Carregando a pesquisa.")
        : rodadas.length===0
          ? e("p",{className:"rounded-lg border-2 border-[var(--bloco-titulo)] bg-card/60 px-3 py-4 text-center text-[13px]"}, "Nenhuma rodada ainda. Dê um nome e toque em Abrir nova rodada.")
          : e("div",{className:"flex min-w-0 flex-col gap-2"},
              e(BlocoPainel,{titulo:"Resultado por afirmação", compacto:true, dir:res ? res.total+" respostas" : ""},
                e("div",{className:"min-h-0 flex-1"}, e(TabelaPlanilha,{cols:colsPerg, linhas:linhasPerg, chave:"id", grade:true, semContagem:true, semLimpar:true, vazio:"Sem respostas ainda."}))),
              e("div",{className:"grid grid-cols-1 gap-2 lg:grid-cols-2"},
                e("div",{className:"flex min-w-0 [&>section]:min-w-0 [&>section]:flex-1"}, e(BlocoPainel,{titulo:"Resultado por setor", compacto:true},
                  e("div",{className:"min-h-0 flex-1"}, e(TabelaPlanilha,{cols:colsSetor, linhas:linhasSetor, chave:"id", grade:true, semFiltro:true, semContagem:true, semLimpar:true, vazio:"Só aparecem setores com "+(res ? res.minSetor : 5)+" respostas ou mais."}))),),
                e("div",{className:"flex min-w-0 [&>section]:min-w-0 [&>section]:flex-1"}, e(BlocoPainel,{titulo:"Comentários", compacto:true, dir:linhasCom.length+""},
                  e("div",{className:"min-h-0 flex-1"}, e(TabelaPlanilha,{cols:colsCom, linhas:linhasCom, chave:"id", grade:true, semContagem:true, semLimpar:true, vazio:"Nenhum comentário ainda."}))),))));
}

export { AbaPesquisaClima };

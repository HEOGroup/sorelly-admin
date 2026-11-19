// Sorelly Admin · montagem — pages/ArrumarDevmaster.js
// Financeiro › Arrumar na DevMaster (Marcus, 19/11/2026: "tela de coisas para arrumar a DevMaster, depois de Relatórios, no estilo do Resumo geral").
// Lista, título por título, o que está ERRADO na DevMaster e só se corrige lá: título a pagar sem vencimento, com o ano do vencimento errado (ex.: 21/11/0226) e título baixado que ainda tem saldo.
// Lido pelo servidor em /api/arrumar-devmaster (só leitura, cache de 5 min). Nada é gravado na DevMaster: a pessoa corrige lá e aperta Atualizar agora.
// Mesmo desenho do Resumo geral e das Atividades: barra de título e blocos com tabela de filtro e ordem no cabeçalho de cada coluna. Acesso: Financeiro e Diretoria.
import { Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { chamar } from "@/apps/montagem/lib/api";
import { BKC } from "@/apps/montagem/lib/format";
import { Bt } from "@/apps/montagem/pages/compras/pecas";
import { e, useCallback, useEffect, useState } from "@/shared/react";

var ISO = /^\d{4}-\d{2}-\d{2}$/;
var dmy = function(iso){ return ISO.test(String(iso || "")) ? iso.slice(8, 10)+"/"+iso.slice(5, 7)+"/"+iso.slice(0, 4) : (iso || "—"); };
var hora = function(ts){ var d = new Date(ts); return isNaN(d) ? "" : String(d.getHours()).padStart(2, "0")+":"+String(d.getMinutes()).padStart(2, "0"); };
var vermelho = function(l){ return l.qtd>0 ? "text-red-400 font-semibold" : "text-emerald-400 font-semibold"; };

function AbaArrumarDevmaster(){
  var sd = useState(null), dados = sd[0], se = useState(""), erroTxt = se[0], so = useState(false), ocupado = so[0];
  var carregar = useCallback(function(agora){
    so[1](true);
    return chamar("GET", "/arrumar-devmaster"+(agora ? "?agora=1" : "")).then(function(j){ sd[1](j); se[1](""); }).catch(function(x){ se[1](x && x.message || "Não consegui ler a DevMaster."); }).then(function(){ so[1](false); });
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(function(){ carregar(false); }, [carregar]);

  var resumo = dados ? dados.resumo.map(function(r){ return Object.assign({id:r.problema}, r); }) : [];
  var colsResumo = [{k:"problema", t:"Problema"}, {k:"qtd", t:"Quantidade", cor:vermelho}, {k:"valor", t:"Valor", fmt:BKC}, {k:"onde", t:"Onde corrigir"}];
  var totalResumo = function(ls){ return ["Total", String(ls.reduce(function(t, l){ return t+l.qtd; }, 0)), BKC(ls.reduce(function(t, l){ return t+l.valor; }, 0)), ""]; };

  var itens = dados ? dados.itens : [];
  var colsItens = [
    {k:"problema", t:"Problema"}, {k:"titulo", t:"Título"}, {k:"emissao", t:"Emissão", data:true, fmt:dmy}, {k:"fornecedor", t:"Fornecedor"}, {k:"historico", t:"Histórico"},
    {k:"valor", t:"Valor", fmt:BKC}, {k:"saldo", t:"Saldo", fmt:BKC}, {k:"vencimento", t:"Vencimento na DevMaster", fmt:function(v){ return v ? dmy(v) : "Sem data"; }, cor:function(){ return "text-red-400"; }},
    {k:"corrigirPara", t:"Corrigir para", fmt:dmy, cor:function(){ return "text-emerald-400"; }}, {k:"onde", t:"Onde corrigir"}];
  var totalItens = function(ls){ return ["Total", ls.length+(ls.length===1 ? " título" : " títulos"), "", "", "", BKC(ls.reduce(function(t, l){ return t+l.valor; }, 0)), "", "", "", ""]; };

  var topo = e("div",{className:"flex flex-wrap items-center gap-2 rounded-lg border-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    e("h2",{className:"shrink-0 whitespace-nowrap text-[13px] font-bold uppercase"}, "Arrumar na DevMaster"),
    dados && e("span",{className:"whitespace-nowrap text-[13px] tabular-nums"}, "lido às "+hora(dados.geradoEm)),
    e("span",{className:"ml-auto flex flex-wrap items-center gap-2"}, e(Bt,{tipo:"normal", disabled:ocupado, onClick:function(){ carregar(true); }}, ocupado ? "Lendo a DevMaster" : "Atualizar agora")));
  var aviso = function(t){ return e("p",{className:"rounded-lg border-2 border-[var(--bloco-titulo)] bg-card/60 px-3 py-4 text-center text-[13px]"}, t); };

  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    topo,
    erroTxt ? aviso(erroTxt) : !dados ? aviso("Lendo os títulos na DevMaster.") :
      e("div",{className:"flex min-w-0 flex-col gap-2"},
        e(BlocoPainel,{titulo:"Resumo", compacto:true},
          e("div",{className:"min-h-0 flex-1"}, e(TabelaPlanilha,{cols:colsResumo, linhas:resumo, chave:"id", grade:true, centro:true, semFiltro:true, semContagem:true, semLimpar:true, totalRodape:totalResumo, vazio:"Nada para corrigir."}))),
        e(BlocoPainel,{titulo:"Títulos para corrigir", compacto:true, dir:String(itens.length)},
          e("div",{className:"min-h-0 flex-1"}, e(TabelaPlanilha,{cols:colsItens, linhas:itens, chave:"id", grade:true, centro:true, semContagem:true, totalRodape:totalItens, limite:200, vazio:"Nada para corrigir na DevMaster."})))));
}

export { AbaArrumarDevmaster };

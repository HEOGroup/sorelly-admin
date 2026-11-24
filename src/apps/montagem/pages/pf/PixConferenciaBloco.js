// Sorelly Admin · montagem — pages/pf/PixConferenciaBloco.js
// Bloco do fim do Resumo geral (Financeiro › Pagamentos › Resumo geral, depois do total; 24/11/2026, pedido do Marcus: a tela Pix (conferência) saiu e ficou só aqui): TODOS os Pix lançados em Pagamentos a fornecedores numa tabela só, com aviso de duplicado.
// Duplicado provável = mesmo fornecedor, mesma data e mesmo valor, e a mesma revendedora (ou o mesmo comprovante). Partes de um Pix dividido (mesmo "par") nunca contam.
// Quem confere (autorização financeiro_confere ou financeiro) apaga o duplicado aqui mesmo: usa a ação lanc_del de domain/pf.js (a mesma do estorno). Filtro e ordem no cabeçalho de cada coluna.
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { brl } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { BotaoMini, COMPACTA } from "@/apps/montagem/pages/pf/Lancamentos";
import { op } from "@/apps/montagem/pages/pf/ui";
import { e, useMemo, useState } from "@/shared/react";

var dia = function(iso){ var p = String(iso||"").slice(0, 10).split("-"); return p.length===3 ? p[2]+"/"+p[1]+"/"+p[0] : ""; };
var nm = function(t){ return String(t||"").trim().toLowerCase(); };
var pontos = function(l){ return (l.conferido ? 2 : 0)+(l.arqNome ? 1 : 0); };   // quanto mais conferido e documentado, mais o lançamento merece ficar

// monta as linhas da tabela e marca os duplicados prováveis
function montarLinhas(pf){
  var forn = {}; (pf.fornecedores||[]).forEach(function(f){ forn[f.id] = f.nome; });
  var lancs = (pf.lancamentos||[]).filter(function(l){ return l.valor>0.005; });
  var grupos = {};
  lancs.forEach(function(l){ var k = [l.fornId, l.data, Math.round(l.valor*100)].join("|"); (grupos[k] = grupos[k] || []).push(l); });
  var iguais = {}, gdo = {};
  Object.keys(grupos).forEach(function(k){ var g = grupos[k]; if(g.length<2) return;
    g.forEach(function(l){ var out = g.filter(function(o){ if(o===l) return false; if(l.par && l.par===o.par) return false;
      return nm(l.revendedora)===nm(o.revendedora) || (l.arqNome && l.arqNome===o.arqNome); });
      if(out.length){ iguais[l.id] = out; gdo[l.id] = k; } }); });
  return lancs.map(function(l){ var out = iguais[l.id] || [], apagar = out.length>0 && out.every(function(o){ return pontos(l)<pontos(o) || (pontos(l)===pontos(o) && l.id>o.id); });
    return {id:l.id, data:l.data||"", forn:forn[l.fornId]||"", rev:l.revendedora||"", valor:l.valor, conta:l.conta||"", sit:l.conferido ? "Conferido" : l.arqNome ? "Com comprovante" : "Sem comprovante", conf:!!l.conferido, par:l.par||"",
      dup:out.length>0, gk:gdo[l.id] || "", apagar:apagar, aviso:out.length ? (apagar ? "Cópia: apagar (é igual ao nº " : "Original: manter (a cópia é o nº ")+out.map(function(o){ return o.id; }).join(", ")+")" : ""}; })
    .sort(function(a, b){ return String(b.data).localeCompare(String(a.data)) || b.id-a.id; });
}

function BlocoPixConferencia(p){
  var c = p.c, pf = c.pf, sv = useState(null), vista = sv[0];
  var todas = useMemo(function(){ return pf ? montarLinhas(pf) : []; }, [pf]);
  var nDup = useMemo(function(){ return todas.filter(function(l){ return l.dup; }).length; }, [todas]);
  var ver = vista || (nDup>0 ? "dup" : "todos");
  var linhas = ver==="dup" ? todas.filter(function(l){ return l.dup; }).sort(function(a, b){ return String(a.gk).localeCompare(String(b.gk)) || (a.apagar ? 1 : 0)-(b.apagar ? 1 : 0) || a.id-b.id; }) : todas;
  if(ver==="dup") linhas = linhas.map(function(l, i){ return Object.assign({}, l, {novoGrupo:i>0 && linhas[i-1].gk!==l.gk}); });
  var apaga = function(l){
    var msg = "Apagar o Pix de "+brl(l.valor)+" ("+(l.rev || l.forn)+", "+dia(l.data)+", código "+l.id+")?"+(l.par ? " Apaga também as partes ligadas a ele." : "")+(l.conf ? " Ele já está conferido." : "")+" Não dá para desfazer.";
    if(!window.confirm(msg)) return;
    op(c, "lanc_del", {id:l.id});
  };
  var cols = [
    {k:"data", t:"Data", fmt:dia}, {k:"forn", t:"Fornecedor"}, {k:"rev", t:"Revendedora"}, {k:"valor", t:"Valor", fmt:function(v){ return brl(v); }},
    {k:"conta", t:"Conta"}, {k:"sit", t:"Situação", cor:function(l){ return l.conf ? "text-emerald-400" : l.sit==="Sem comprovante" ? "text-warning" : ""; }},
    {k:"id", t:"Código"}, {k:"aviso", t:"Duplicado", cor:function(l){ return l.dup ? (l.apagar ? "text-red-400 font-semibold" : "text-emerald-400 font-semibold") : ""; }},
    {k:"acao", t:"Ação", semFiltro:true, render:function(v, l){ return l.dup && c.edita ? e(BotaoMini, {onClick:function(){ apaga(l); }, title:"Apagar este Pix"}, "Apagar") : ""; }}];
  var botoes = e("div",{className:"flex items-center gap-1"}, [["dup", "Duplicados ("+nDup+")"], ["todos", "Todos ("+todas.length+")"]].map(function(x){ return e(BotaoMini, {key:x[0], principal:ver===x[0], onClick:function(){ sv[1](x[0]); }}, x[1]); }));
  return e("div", {className:"mt-2 border-t-2 border-white"}, e(BlocoPainel, {titulo:"Pix lançados · conferência", compacto:true, cls:COMPACTA, acao:botoes},
    !pf ? e("p", {className:"py-6 text-center text-[13px] text-foreground"}, "Dados de Pagamentos a fornecedores indisponíveis.")
      : e(TabelaPlanilha, {key:ver, cols:cols, linhas:linhas, chave:"id", grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true, limite:100, linhaCls:function(l){ return l.novoGrupo ? "rg-dono" : ""; },
        totalRodape:function(ls){ var t = 0; ls.forEach(function(l){ t += l.valor; }); return ["Total", ls.length.toLocaleString("pt-BR")+" Pix", "", brl(t)]; },
        vazio:ver==="dup" ? "Nenhum duplicado provável." : "Nenhum Pix lançado."})));
}

export { BlocoPixConferencia, montarLinhas };

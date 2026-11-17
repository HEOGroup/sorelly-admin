// Sorelly Admin · montagem — pages/compras/VisaoCompras.js
// Materiais e estoque → VISÃO GERAL das compras, no padrão do Financeiro e do Funil de compras. Versão D escolhida pelo Marcus (17/11/2026), com a regra dele:
// "não pode ter bloco quebrado entre um e outro": a tela é uma GRADE DE FAIXAS. Os blocos da mesma faixa têm sempre a mesma altura e as bordas alinhadas, mesmo que a tabela de um deles fique com sobra
// (a tabela estica as linhas para preencher). Faixa 1: um bloco de largura inteira com Situação das compras e Tempo médio por etapa lado a lado (tabela horizontal de 2 linhas). Faixa 2: Solicitações mais paradas | Gasto (menu Setor, Categoria, Classificação, Conta).
// Cada linha clicável abre o Funil de compras já filtrado (onIrQuadro) ou a ficha da compra. Os números vêm de dashboardCompras (domain/compras-estoque.js); aqui só se desenha.
import { Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { dashboardCompras, formatarDia, formatarHoras, formatarReais } from "@/apps/montagem/domain/compras-estoque";
import { SEL } from "@/apps/montagem/components/faixa-azul";
import { useAcoes } from "@/apps/montagem/pages/compras/janelas";
import { normal, useCompras } from "@/apps/montagem/pages/compras/pecas";
import { e, useState } from "@/shared/react";

var PERIODOS = [["hoje", "Hoje"], ["7d", "7 dias"], ["30d", "30 dias"], ["mes", "Mês"], ["tudo", "Tudo"]];
var GASTOS = [["setor", "Por setor"], ["categoria", "Por categoria"], ["classificacao", "Por classificação"], ["conta", "Por conta"]];
var plural = function(n, um, varios){ return n+" "+(n===1 ? um : varios); };
var FAIXA = "flex min-w-0 [&>section]:min-w-0 [&>section]:flex-1";   // o bloco estica até a altura da faixa: bordas de cima e de baixo alinhadas com o vizinho

// bloco azul com UMA tabela; cheia = a tabela estica as linhas para preencher a altura da faixa
function Bloco(p){
  return e("div",{className:FAIXA},
    e(BlocoPainel,{titulo:p.t, compacto:true, dir:p.dir}, p.faixa,
      e("div",{className:"min-h-0 flex-1"}, e(TabelaPlanilha,{cols:p.cols, linhas:p.linhas, chave:"id", grade:true, semFiltro:true, semContagem:true, semLimpar:true, cheia:p.cheia!==false, cabAcima:p.cabAcima, aoClicar:p.aoClicar, vazio:p.vazio}))));
}
// valor que também é botão (leva ao Funil já filtrado)
function Num(p){ return p.f ? e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); p.f(); }, title:"Abrir no funil de compras", className:"cursor-pointer text-[13px] font-bold hover:underline"}, p.v) : e("span",{className:"text-[13px] font-bold"}, p.v); }
// gasto com barra azul de fundo (só para comparar tamanhos)
var comBarra = function(v, l){ return e("div",{className:"relative"}, e("div",{"aria-hidden":true, className:"absolute inset-y-0.5 left-0 bg-[var(--bloco-titulo)] opacity-70", style:{width:l.w}}), e("span",{className:"relative"}, v)); };

function AbaCompraVisao(props){
  var c = useCompras(), ac = useAcoes(c), ce = c.ce, st = useState("30d"), per = st[0], sg = useState("setor"), modo = sg[0], ir = props.onIrQuadro;
  if(!c.opera) return e(Pagina,null, e("p",{className:"px-3 py-4 text-center text-[13px]"}, "A visão geral das compras é restrita ao financeiro e à diretoria."));
  var d = dashboardCompras(c.s, per), lt = d.leadTime, total = d.gastoTotal || 0;
  var vai = function(filtro){ return ir && filtro ? function(){ ir(filtro); } : undefined; };
  var idPorNome = function(lista, nome){ var x = lista.find(function(y){ return y.nome===nome; }); return x ? x.id : null; };
  var pct = function(v){ return total>0 ? Math.round(100*v/total)+"%" : "0%"; };
  var larg = function(v, max){ return max>0 ? Math.max(2, Math.round(100*v/max))+"%" : "0%"; };

  // ── faixa 1a: situação das compras (tabela horizontal: linha 1 = valores, linha 2 = detalhe)
  var SIT = [
    {k:"gasto", t:"Gasto no período", v:formatarReais(d.gastoTotal), det:plural(d.qtdCompras, "compra efetuada", "compras efetuadas")},
    {k:"atrasadas", t:"Atrasadas", v:String(d.atrasadasNoSla), det:"Sem resposta além de "+ce.config.slaHoras+" horas", cor:d.atrasadasNoSla>0 ? "text-destructive" : "", f:{ind:"atrasadas"}},
    {k:"autoriz", t:"Aguardando autorização", v:String(d.aguardandoAutorizacao), det:"Esperando quem autoriza", cor:d.aguardandoAutorizacao>0 ? "text-warning" : "", f:{ind:"autoriz"}},
    {k:"aprovadas", t:"Aprovadas a liberar", v:String(d.aprovadasParaComprar), det:"Falta o financeiro liberar", f:{ind:"aprovadas"}},
    {k:"liberadas", t:"Liberadas para comprar", v:String(d.liberadasParaComprar), det:"Esperando quem efetua", f:{ind:"liberadas"}},
    {k:"gargalo", t:"Gargalo", v:lt.gargalo || "—", det:"Etapa que mais demora", cor:lt.gargalo ? "text-warning" : ""}];
  var colsSit = SIT.map(function(x){ return {k:x.k, t:x.t, cor:function(l){ return l.tipo==="valor" ? (x.cor || "") : ""; }, render:function(v, l){ return l.tipo==="valor" ? e(Num,{v:v, f:vai(x.f)}) : v; }}; });
  var linhasSit = [Object.assign({id:"valor", tipo:"valor"}, SIT.reduce(function(o, x){ o[x.k] = x.v; return o; }, {})), Object.assign({id:"det", tipo:"det"}, SIT.reduce(function(o, x){ o[x.k] = x.det; return o; }, {}))];

  // ── faixa 1b: tempo médio por etapa (mesma forma: linha 1 = tempo, linha 2 = marca do gargalo)
  var ETAPAS = [["Resposta", lt.respostaHoras], ["Compra", lt.compraHoras], ["Entrega", lt.entregaHoras]];
  var colsTempo = ETAPAS.map(function(x, i){ return {k:"t"+x[0], t:x[0], sep:i===0, cor:function(l){ return l.tipo==="det" ? "text-warning" : ""; }, render:function(v, l){ return l.tipo==="valor" ? e("span",{className:"text-[13px] font-bold"}, v) : v; }}; });
  var linhasTempo = [Object.assign({id:"valor", tipo:"valor"}, ETAPAS.reduce(function(o, x){ o["t"+x[0]] = x[1]!=null ? formatarHoras(x[1]) : "—"; return o; }, {})), Object.assign({id:"det", tipo:"det"}, ETAPAS.reduce(function(o, x){ o["t"+x[0]] = lt.gargalo===x[0] ? "Gargalo" : ""; return o; }, {}))];
  var linhasFaixa1 = linhasSit.map(function(l, i){ return Object.assign({}, l, linhasTempo[i]); });

  // ── faixa 2a: solicitações mais paradas
  var paradas = d.maisParadas.map(function(p){ return {id:p.id, compra:normal(p.titulo), sol:p.solicitante, parada:formatarHoras(p.horasParado)}; });

  // ── faixa 2b: gasto, um recorte por vez
  var linhasG, colsG, tituloG = (GASTOS.filter(function(g){ return g[0]===modo; })[0] || GASTOS[0])[1];
  var barra = {k:"gasto", t:"Gasto", render:comBarra};
  if(modo==="setor" || modo==="categoria"){
    var lista = modo==="setor" ? d.porSetor : d.porCategoria, mx = Math.max.apply(null, [0].concat(lista.map(function(x){ return x.gasto; })));
    colsG = [{k:"nome", t:modo==="setor" ? "Setor" : "Categoria"}, {k:"ped", t:"Pedidos"}, {k:"valor", t:"Valor pedido"}, barra, {k:"pct", t:"%"}];
    linhasG = lista.map(function(x){ var id = modo==="setor" ? idPorNome(ce.setores, x.nome) : null; return {id:x.nome, nome:normal(x.nome), ped:String(x.pedidos), valor:formatarReais(x.valorPedido), gasto:formatarReais(x.gasto), w:larg(x.gasto, mx), pct:pct(x.gasto), f:id!=null ? {setor:id} : null}; });
  } else if(modo==="classificacao"){
    var mk = Math.max.apply(null, [0].concat(d.porClassificacao.map(function(x){ return x.gasto; })));
    colsG = [{k:"nome", t:"Classificação"}, barra, {k:"pct", t:"%"}];
    linhasG = d.porClassificacao.map(function(x){ var cl = ce.config.classificacoes.find(function(y){ return y.nome===x.nome; }); return {id:x.nome, nome:x.nome, gasto:formatarReais(x.gasto), w:larg(x.gasto, mk), pct:pct(x.gasto), f:cl ? {cls:cl.id} : null}; });
  } else {
    var mc = Math.max.apply(null, [0].concat(d.porConta.map(function(x){ return x.gasto; })));
    colsG = [{k:"nome", t:"Conta"}, {k:"compras", t:"Compras"}, barra, {k:"pct", t:"%"}];
    linhasG = d.porConta.map(function(x){ return {id:x.rotulo, nome:x.rotulo, compras:String(x.compras), gasto:formatarReais(x.gasto), w:larg(x.gasto, mc), pct:Math.round(x.parte*100)+"%"}; });
  }
  var faixaGasto = e("div",{className:"flex items-center gap-2 border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    e("select",{"aria-label":"Recorte do gasto", value:modo, onChange:function(ev){ sg[1](ev.target.value); }, className:SEL+" w-auto shrink-0"}, GASTOS.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })));

  // ── barra azul do topo: título e período
  var topo = e("div",{className:"flex flex-nowrap items-center gap-2 overflow-x-auto rounded-lg border-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    e("h2",{className:"shrink-0 whitespace-nowrap text-[13px] font-bold uppercase"}, "Visão geral das compras"),
    e("select",{"aria-label":"Período", value:per, onChange:function(ev){ st[1](ev.target.value); }, className:SEL+" ml-2 w-auto shrink-0"}, PERIODOS.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })),
    e("span",{className:"ml-auto whitespace-nowrap text-[13px] tabular-nums"}, d.periodo.rotulo+(d.periodo.de ? " · "+formatarDia(d.periodo.de)+" a "+formatarDia(d.periodo.ate) : "")));
  var vaiLinha = function(l){ var f = vai(l.f); if(f) f(); };

  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    topo,
    e(Bloco,{t:"Situação e tempo das compras", cols:colsSit.concat(colsTempo), linhas:linhasFaixa1, cheia:false, cabAcima:[[{t:"Situação das compras", span:colsSit.length}, {t:"Tempo médio por etapa", span:colsTempo.length, sep:true}]], vazio:"Nenhuma compra registrada ainda."}),
    e("div",{className:"grid grid-cols-1 gap-2 lg:grid-cols-2"},
      e(Bloco,{t:"Solicitações mais paradas", dir:paradas.length || undefined, cols:[{k:"compra", t:"Compra"}, {k:"sol", t:"Solicitante"}, {k:"parada", t:"Parada há"}], linhas:paradas, aoClicar:function(l){ ac.abrir(l.id); }, vazio:"Nenhuma solicitação parada."}),
      e(Bloco,{t:"Gasto · "+tituloG.replace(/^Por /, ""), dir:formatarReais(d.gastoTotal), faixa:faixaGasto, cols:colsG, linhas:linhasG, aoClicar:vaiLinha, vazio:"Sem dados neste período."})),
    ac.janelas());
}

export { AbaCompraVisao };

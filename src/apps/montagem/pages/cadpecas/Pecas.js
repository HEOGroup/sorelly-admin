// Sorelly Admin · montagem — pages/cadpecas/Pecas.js
// Cadastro de peças › Pedidos › "Peças" (17/11/2026, pedido do Marcus): quadro igual ao dos pedidos, mas com CARTÕES GRANDES, um por categoria, em cada etapa da vida da peça:
//   Falta comprar → Comprado → No banho → Na empresa → Estoque.
// Falta comprar e Estoque vêm da DevMaster (só leitura, lida pelo servidor: src/server/reposicao.js, salva em c.reposicao); Comprado, No banho e Na empresa vêm dos pedidos de bruto (categorias lançadas na ficha do pedido).
// A conta e os fatores de dezembro e janeiro estão em domain/falta-comprar.js. "Até" escolhe até quando a peça precisa (novembro, dezembro ou janeiro).
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { Pagina, degrade } from "@/apps/montagem/components/padrao";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { etapaPed } from "@/apps/montagem/domain/cadastro-pecas";
import { COLUNAS_REP, MESES_PLANO, montarRep } from "@/apps/montagem/domain/falta-comprar";
import { chamar } from "@/apps/montagem/lib/api";
import { useCpc } from "@/apps/montagem/pages/cadpecas/visualCad";
import { Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { e, useState } from "@/shared/react";

var n = function(v){ return Math.round(v||0).toLocaleString("pt-BR"); };
var VERMELHO = "#F87171";
var CAMPO_P = "h-7 rounded-md border border-border bg-card px-2 text-[11px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary";   // padrao-ok: controle de 28 px dentro da barra azul, como no Pedidos e no Controle de compras (Marcus, 17/11/2026)
var BOTAO_P = "h-7 shrink-0 whitespace-nowrap rounded-md border border-primary bg-primary/20 px-2.5 text-[11px] font-semibold text-primary hover:bg-primary/30";   // padrao-ok: botão de 28 px na barra azul, mesmo motivo

// cartão compacto (Marcus, 17/11/2026: "muito mais compacto"): UMA linha com o nome e o número lado a lado e UMA linha de detalhe em letra pequena (quebra só se não couber)
// visual (Marcus, 17/11/2026: "melhore eles visualmente"): fundo em degradê na cor da coluna com fio fino, nome e número juntos, os detalhes em pares separados por um fio, e uma barrinha que mostra a proporção
function Barra(p){
  return e("div",{className:"flex h-[3px] w-full overflow-hidden rounded-full", style:{background:p.fundo || "rgba(255,255,255,0.14)"}},
    p.partes.map(function(x, i){ return e("div",{key:i, style:{width:Math.max(0, Math.min(1, x.w))*100+"%", background:x.c}}); }));
}
function Cartao(p){
  return e("div",{title:p.dica, className:"flex flex-col items-center gap-0.5 rounded-md px-1.5 py-1 text-center", style:degrade(p.cor)},
    e("div",{className:"flex items-baseline justify-center gap-2"},
      e("b",{className:"text-[11px] leading-tight"}, p.nome),
      e("b",{className:"text-[13px] font-bold leading-none tabular-nums", style:p.numCor ? {color:p.numCor} : undefined}, n(p.numero))),
    p.pares && p.pares.length>0 && e("div",{className:"flex flex-wrap items-center justify-center text-[11px] leading-tight tabular-nums"},
      p.pares.map(function(x, i){ return e("span",{key:i, className:"px-1.5 "+(i ? "border-l border-white/30" : "")}, x[0]+" ", e("b",null, x[1])); })),
    p.barra && e(Barra,p.barra));
}

// fornecedores de uma coluna do pedido (comprado, banho, empresa), do maior para o menor: os pares e a barra (cada fornecedor um trecho, do mais forte ao mais fraco)
function porForn(o, cor){
  var ks = Object.keys(o.forn).sort(function(a, b){ return o.forn[b]-o.forn[a]; }), tons = ["", "A6", "70", "4A"];
  return {pares:ks.map(function(f){ return [f, n(o.forn[f])]; }), barra:{partes:ks.map(function(f, i){ return {w:o.forn[f]/o.q, c:cor+(tons[Math.min(i, 3)])}; })}};
}

function AbaPecasQuadro(){
  var x = useCpc(), c = x.c, hs = useState("jan"), h = hs[0], oc = useState(false), ocupado = oc[0], ms = useState(""), msg = ms[0];
  var q = montarRep(c.reposicao, c.pedidos, etapaPed, h);
  var atualizar = async function(){
    oc[1](true); ms[1]("");
    try { var r = await chamar("POST", "/automatico/reposicao"); ms[1](r.erro ? r.erro : r.jaAtualizado ? "Já foi lido há pouco" : "Lido agora; o quadro atualiza em instantes"); }
    catch(err){ ms[1](err.message || "Não foi possível ler a DevMaster."); }
    oc[1](false);
  };
  var quando = q.atualizadoEm ? new Date(q.atualizadoEm).toLocaleString("pt-BR", {day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit"}) : "";

  // controles no CANTO DIREITO da barra azul (Marcus, 17/11/2026: "tira do topo, joga para a direita"): menu Até e botão Atualizar; a data da leitura fica na dica do botão
  var acao = e("div",{className:"flex items-center gap-1.5"},
    e("select",{"aria-label":"Até quando precisa", value:h, onChange:function(ev){ hs[1](ev.target.value); }, className:CAMPO_P+" cursor-pointer"},
      MESES_PLANO.map(function(m){ return e("option",{key:m[0], value:m[0]}, "Até "+m[2].toLowerCase()); })),
    e("button",{type:"button", onClick:atualizar, disabled:ocupado, title:msg || (quando ? "DevMaster lida em "+quando+(q.diaAte ? " · novembro até o dia "+q.diaAte : "")+". Clique para ler de novo (só leitura)." : "Lê o estoque e as saídas na DevMaster (só leitura)"), className:BOTAO_P+(ocupado ? " opacity-50" : "")}, ocupado ? "Lendo" : "Atualizar"));

  // uma coluna do quadro: cabeçalho (nome e total de peças) e os cartões
  var coluna = function(k, nome, cor){
    var cartoes = [], total = 0;
    q.linhas.forEach(function(l){
      if(k==="falta"){ if(l.falta.pecas>0){ total += l.falta.pecas; cartoes.push(e(Cartao,{key:l.k, nome:l.nome, cor:cor, numero:l.falta.pecas, numCor:VERMELHO,
        pares:[["Precisa", n(l.precisa)], ["Já vindo", n(l.falta.vindo)]],
        barra:{partes:[{w:l.falta.bruta>0 ? l.falta.vindo/l.falta.bruta : 0, c:"#4ADE80"}], fundo:"rgba(239,68,68,0.45)"},
        dica:"Faltam "+n(l.falta.bruta)+" peças em "+n(l.falta.modelos)+(l.falta.modelos===1 ? " modelo" : " modelos")+"; já vindo "+n(l.falta.vindo)+" (barra verde)."})); } }
      else if(k==="estoque"){ if(l.estoque.q>0){ total += l.estoque.q; cartoes.push(e(Cartao,{key:l.k, nome:l.nome, cor:cor, numero:l.estoque.q,
        pares:[["Vende", n(l.estoque.vivo)], ["Parado", n(l.estoque.parado)]].concat(l.cobre!=null ? [["Cobre", String(l.cobre).replace(".", ",")+(l.cobre===1 ? " mês" : " meses")]] : []),
        barra:{partes:[{w:l.estoque.vivo/l.estoque.q, c:"#4ADE80"}], fundo:"#E8B84B"},
        dica:"Barra verde: estoque de modelos que vendem. Barra dourada: estoque parado, de modelos que não venderam."})); } }
      else { var o = l[k]; if(o.q>0){ total += o.q; var pf = porForn(o, cor); cartoes.push(e(Cartao,{key:l.k, nome:l.nome, cor:cor, numero:o.q, pares:pf.pares, barra:pf.barra})); } }
    });
    return e("section",{key:k, className:"flex min-w-0 flex-col gap-1 rounded-lg bg-black/25 p-1 ring-1 ring-white/10"},
      e("div",{title:cartoes.length+(cartoes.length===1 ? " categoria" : " categorias"), className:"flex items-baseline justify-center gap-2 rounded-md px-1.5 py-1 text-center", style:{background:cor+"33", boxShadow:"inset 0 -2px 0 "+cor}},
        e("b",{className:"text-[11px] uppercase tracking-[.04em]"}, nome),
        e("b",{className:"text-[13px] font-bold leading-none tabular-nums"}, n(total))),
      cartoes.length ? cartoes : e("p",{className:"py-1 text-center text-[13px]"}, k==="falta" && q.temDados ? "Nada falta" : "Nenhuma peça"));
  };
  var quadro = e("div",{className:"overflow-x-auto p-1"},
    e("div",{className:"grid items-start gap-1", style:{gridTemplateColumns:"repeat(5, minmax(190px, 1fr))"}}, COLUNAS_REP.map(function(k){ return coluna(k[0], k[1], k[2]); })));

  // 3 BLOCOS DE ANÁLISE NO TOPO, lado a lado, letra pequena (Marcus, 17/11/2026, "igual ao Pedidos"): Falta comprar, Estoque e O que está vindo, cada um com as categorias em linhas; embaixo o quadro por etapa.
  // Os controles (até quando precisa e Atualizar) ficam no canto direito da barra do último bloco.
  var soma = function(f){ return q.linhas.reduce(function(s, l){ return s+(f(l) || 0); }, 0); };
  var tab = function(cols, linhas, rodape){ return q.temDados ? e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true, totalRodape:rodape}) : e(Vazio,{ic:"package"}, "Sem leitura da DevMaster. Clique em Atualizar."); };
  var nomeAte = (MESES_PLANO.find(function(m){ return m[0]===h; }) || [])[2] || "";
  var blocoFalta = e(BlocoPainel,{titulo:"Falta comprar · até "+nomeAte.toLowerCase(), compacto:true},
    tab([{k:"nome", t:"Categoria"}, {k:"precisa", t:"Precisa", fmt:n}, {k:"vindo", t:"Já vindo", fmt:n}, {k:"falta", t:"Falta", fmt:n, cor:function(l){ return l.falta>0 ? "text-destructive" : ""; }}],
      q.linhas.map(function(l){ return {id:l.k, nome:l.nome, precisa:l.precisa, vindo:l.falta.vindo, falta:l.falta.pecas}; }),
      function(){ return ["Total", n(soma(function(l){ return l.precisa; })), n(soma(function(l){ return l.falta.vindo; })), n(soma(function(l){ return l.falta.pecas; }))]; }));
  var blocoEstoque = e(BlocoPainel,{titulo:"Estoque principal", compacto:true},
    tab([{k:"nome", t:"Categoria"}, {k:"estoque", t:"Estoque", fmt:n}, {k:"vende", t:"Vende", fmt:n}, {k:"parado", t:"Parado", fmt:n}, {k:"cobre", t:"Cobre", fmt:function(v){ return v==null ? "—" : String(v).replace(".", ",")+(v===1 ? " mês" : " meses"); }}],
      q.linhas.map(function(l){ return {id:l.k, nome:l.nome, estoque:l.estoque.q, vende:l.estoque.vivo, parado:l.estoque.parado, cobre:l.cobre}; }),
      function(){ return ["Total", n(soma(function(l){ return l.estoque.q; })), n(soma(function(l){ return l.estoque.vivo; })), n(soma(function(l){ return l.estoque.parado; })), "—"]; }));
  var blocoVindo = e(BlocoPainel,{titulo:"O que está vindo", compacto:true, dir:acao},
    tab([{k:"nome", t:"Categoria"}, {k:"comprado", t:"Comprado", fmt:n}, {k:"banho", t:"No banho", fmt:n}, {k:"empresa", t:"Na empresa", fmt:n}, {k:"total", t:"Total", fmt:n}],
      q.linhas.map(function(l){ return {id:l.k, nome:l.nome, comprado:l.comprado.q, banho:l.banho.q, empresa:l.empresa.q, total:l.comprado.q+l.banho.q+l.empresa.q}; }),
      function(){ return ["Total", n(soma(function(l){ return l.comprado.q; })), n(soma(function(l){ return l.banho.q; })), n(soma(function(l){ return l.empresa.q; })), n(soma(function(l){ return l.comprado.q+l.banho.q+l.empresa.q; }))]; }));

  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    e("div",{className:"grid items-start gap-2 lg:grid-cols-3"}, blocoFalta, blocoEstoque, blocoVindo),
    e(BlocoPainel,{titulo:"Peças por etapa"},
      q.temDados ? quadro : e(Vazio,{ic:"package"}, "Ainda não há leitura da DevMaster. Clique em Atualizar.")));
}

export { AbaPecasQuadro };

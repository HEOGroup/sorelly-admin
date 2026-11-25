// Sorelly Admin · montagem — pages/producao/ProdModelos.js
// PRODUÇÃO POR MODELO (17/11/2026, pedido do Marcus: "saber o que elas estão fazendo, quantos mil reais de peças foram produzidas no dia, o custo do que foi produzido").
// Fica EMBAIXO da grade do mês, só para a diretoria (tem custo). Cada código lançado na grade é buscado na DevMaster (preço de venda e custo da peça):
// Código · Modelo · Quem · Quantidade · Custo e Preço de cada peça · Custo total · Valor total (o que entra na pista). Exemplo: 100 peças com custo R$ 8 e preço R$ 88 = custo R$ 800 e valor R$ 8.800.
// DIA mostra o dia escolhido; MÊS soma o mês inteiro por código. Código que a DevMaster não conhece fica com traço e não entra na soma. Servidor: /api/produtos-dm (src/server/produtos-dm.js).
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { diaDaSemana, formatarDia, formatarInteiro, formatarReais, hojeSP, listaExternas, nomeMes, situacaoCasa } from "@/apps/montagem/domain/producao";
import { tipoDaPeca } from "@/apps/montagem/domain/producao-tipos";
import { chamar } from "@/apps/montagem/lib/api";
import { BtFaixa, CAMPO_FAIXA, FaixaAzul, GRADE_LIMPA, MenuFaixa, grupoBtn, usePr } from "@/apps/montagem/pages/producao/visualProd";
import { e, useEffect, useState } from "@/shared/react";

var limpa = function(c){ return String(c||"").toUpperCase().replace(/\s+/g, "").trim(); };
var cacheDm = {};   // CODIGO → {descricao, preco, custo} | null (não existe na DevMaster); vale enquanto a tela estiver aberta

function ProdModelos(){
  var x = usePr(), lc = x.pr.lancamentos || {}, hoje = hojeSP();
  var diasComDado = Object.keys(lc).filter(function(d){ return d<=hoje && (lc[d]||[]).some(function(l){ return Number(l.qtd)>0; }); }).sort();
  var sDia = useState(""), sModo = useState("mes"), sVis = useState("tipo"), sVer = useState(0), sErro = useState(""), sEst = useState("");
  var dia = sDia[0] || diasComDado[diasComDado.length-1] || hoje, modo = sModo[0], mes = dia.slice(0, 7);
  var admin = x.admin;
  // linhas do período, juntando o mesmo código (soma das peças, nomes de quem fez)
  var dias = modo==="mes" ? Object.keys(lc).filter(function(d){ return d.slice(0, 7)===mes; }) : [dia], por = {};
  dias.forEach(function(d){ (lc[d]||[]).forEach(function(l){ var q = Number(l.qtd)||0, c = limpa(l.codigo); if(q<=0 || !c) return; var p = por[c] || (por[c] = {codigo:c, qtd:0, quem:{}, linhaValor:0}); p.qtd += q; if(l.func) p.quem[l.func] = 1; if(Number(l.valor)>0) p.linhaValor = Number(l.valor); }); });
  var codigos = Object.keys(por).sort();
  // o estoque (peças com as pessoas da produção externa) também precisa de custo e preço da DevMaster: busca os códigos dele junto
  var codigosEst = situacaoCasa(x.pr, null).linhas.filter(function(l){ return l.comEla>0; }).map(function(l){ return limpa(l.codigo); });
  var codigosBusca = codigos.slice(); codigosEst.forEach(function(c){ if(codigosBusca.indexOf(c)<0) codigosBusca.push(c); }); codigosBusca.sort();
  var chave = codigosBusca.join(",");
  // busca na DevMaster o que ainda não veio (uma chamada por vez, em lotes)
  useEffect(function(){
    if(!admin) return;
    var faltam = codigosBusca.filter(function(c){ return cacheDm[c]===undefined; }); if(!faltam.length) return;
    var vivo = true, i = 0;
    var lote = function(){
      if(!vivo || i>=faltam.length) return;
      var fatia = faltam.slice(i, i+120); i += 120;
      chamar("GET", "/produtos-dm?codigos="+encodeURIComponent(fatia.join(","))).then(function(r){
        fatia.forEach(function(c){ cacheDm[c] = (r.itens||{})[c] || null; }); sErro[1](""); sVer[1](function(v){ return v+1; }); lote(); })
        .catch(function(er){ sErro[1](er.message || "Não foi possível buscar na DevMaster."); });
    };
    lote();
    return function(){ vivo = false; };
  }, [chave, admin]);   // eslint-disable-line react-hooks/exhaustive-deps
  if(!admin) return null;

  var carregando = codigosBusca.some(function(c){ return cacheDm[c]===undefined; }) && !sErro[0];
  var linhas = codigos.map(function(c){
    var p = por[c], dm = cacheDm[c], ok = !!dm, custo = ok ? dm.custo : 0, preco = ok ? dm.preco : 0;
    return {id:c, codigo:c, tipo:tipoDaPeca(dm), modelo:ok ? dm.descricao : "Sem cadastro na DevMaster", quem:Object.keys(p.quem).join(", ") || "—", qtd:p.qtd, ok:ok, custo:custo, preco:preco, custoTotal:Math.round(custo*p.qtd*100)/100, valorTotal:Math.round(preco*p.qtd*100)/100};
  }).sort(function(a, b){ return b.valorTotal-a.valorTotal || b.qtd-a.qtd; });
  var R = function(v){ return v>0 ? formatarReais(v) : "—"; };
  var cols = [{k:"codigo", t:"Código"}, {k:"tipo", t:"Tipo"}, {k:"modelo", t:"Modelo", cor:function(r){ return r.ok ? "" : "text-warning"; }}, {k:"quem", t:"Quem"}, {k:"qtd", t:"Quantidade", fmt:formatarInteiro},
    {k:"custo", t:"Custo da peça", fmt:R}, {k:"preco", t:"Preço da peça", fmt:R}, {k:"custoTotal", t:"Custo total", fmt:R}, {k:"valorTotal", t:"Valor total", fmt:R, cor:function(r){ return r.valorTotal>0 ? "text-success" : ""; }}];
  // VISÃO POR TIPO: soma por tipo de peça (anel, colar, pulseira...), com a parte de cada um no valor produzido
  var porTipo = {}; linhas.forEach(function(r){ var g = porTipo[r.tipo] || (porTipo[r.tipo] = {id:r.tipo, tipo:r.tipo, modelos:0, qtd:0, custoTotal:0, valorTotal:0}); g.modelos++; g.qtd += r.qtd; g.custoTotal += r.custoTotal; g.valorTotal += r.valorTotal; });
  var valorGeral = linhas.reduce(function(t2, r){ return t2+r.valorTotal; }, 0);
  var linhasTipo = Object.keys(porTipo).map(function(k){ var g = porTipo[k]; g.parte = valorGeral>0 ? Math.round(g.valorTotal/valorGeral*1000)/10 : 0; g.custoTotal = Math.round(g.custoTotal*100)/100; g.valorTotal = Math.round(g.valorTotal*100)/100; return g; }).sort(function(a, b){ return b.valorTotal-a.valorTotal || b.qtd-a.qtd; });
  var colsTipo = [{k:"tipo", t:"Tipo"}, {k:"modelos", t:"Modelos", fmt:formatarInteiro}, {k:"qtd", t:"Quantidade", fmt:formatarInteiro}, {k:"custoTotal", t:"Custo total", fmt:R}, {k:"valorTotal", t:"Valor total", fmt:R, cor:function(r){ return r.valorTotal>0 ? "text-success" : ""; }}, {k:"parte", t:"% do valor", fmt:function(v){ return v>0 ? String(v).replace(".", ",")+"%" : "—"; }}];
  var totalTipo = function(ls){ var s = function(k){ return ls.reduce(function(t2, r){ return t2+(r[k]||0); }, 0); }; return ["TOTAL · "+ls.length+(ls.length===1 ? " tipo" : " tipos"), formatarInteiro(s("modelos")), formatarInteiro(s("qtd")), formatarReais(s("custoTotal")), formatarReais(s("valorTotal")), ""]; };
  var totalRodape = function(ls){
    var q = ls.reduce(function(t, r){ return t+r.qtd; }, 0), qOk = ls.filter(function(r){ return r.ok; }).reduce(function(t, r){ return t+r.qtd; }, 0), c = ls.reduce(function(t, r){ return t+r.custoTotal; }, 0), v = ls.reduce(function(t, r){ return t+r.valorTotal; }, 0);
    return cols.map(function(col, i){ return i===0 ? "TOTAL · "+ls.length+(ls.length===1 ? " modelo" : " modelos") : col.k==="qtd" ? formatarInteiro(q) : col.k==="custo" ? (qOk ? formatarReais(c/qOk) : "—") : col.k==="preco" ? (qOk ? formatarReais(v/qOk) : "—") : col.k==="custoTotal" ? formatarReais(c) : col.k==="valorTotal" ? formatarReais(v) : ""; }); };
  // RANKING DE PRODUTIVIDADE (Marcus, 17/11/2026): por funcionária, no mesmo período. Ordem padrão = PEÇAS POR DIA (pedido do Marcus); o botão troca para VALOR POR DIA (reais produzidos por dia trabalhado), que também pesa colar mais que brinco.
  var pessoas = {};
  dias.forEach(function(d){ (lc[d]||[]).forEach(function(l){ var q = Number(l.qtd)||0, c = limpa(l.codigo); if(q<=0 || !l.func) return;
    var g = pessoas[l.func] || (pessoas[l.func] = {id:l.func, nome:l.func, dias:{}, qtd:0, modelos:{}, custoTotal:0, valorTotal:0, semPreco:0});
    var dm = c ? cacheDm[c] : null; g.dias[d] = 1; g.qtd += q; if(c) g.modelos[c] = 1; if(dm){ g.custoTotal += dm.custo*q; g.valorTotal += dm.preco*q; } else g.semPreco += q; }); });
  var titulo = modo==="mes" ? (sVis[0]==="tipo" ? "Produção por tipo · " : "Produção por modelo · ")+nomeMes(Number(mes.slice(0, 4)), Number(mes.slice(5, 7))) : (sVis[0]==="tipo" ? "Produção por tipo · " : "Produção por modelo · ")+formatarDia(dia)+" · "+diaDaSemana(dia);
  // ESTOQUE (Marcus, 24/11/2026: "um bloco para a direita com estoque total, valor de venda e valor de custo; abre sempre com o estoque de todos e no botão troco para o de cada uma"): peças que estão COM cada pessoa da produção externa (enviado menos devolvido), com custo e preço da DevMaster
  var pessoaEst = sEst[0], sitEst = situacaoCasa(x.pr, pessoaEst || null);
  var linhasEst = sitEst.linhas.filter(function(l){ return l.comEla>0; }).map(function(l){
    var c = limpa(l.codigo), dm = cacheDm[c], ok = !!dm, q = l.comEla;
    return {id:c, codigo:c, modelo:ok ? tipoDaPeca(dm) : "Sem cadastro", qtd:q, ok:ok, custoTotal:ok ? Math.round(dm.custo*q*100)/100 : 0, valorTotal:ok ? Math.round(dm.preco*q*100)/100 : 0};
  }).sort(function(a, b){ return b.valorTotal-a.valorTotal || b.qtd-a.qtd; });
  var colsEst = [{k:"codigo", t:"Código"}, {k:"modelo", t:"Tipo", cor:function(r){ return r.ok ? "" : "text-warning"; }}, {k:"qtd", t:"Estoque", fmt:formatarInteiro}, {k:"custoTotal", t:"Valor de custo", fmt:R}, {k:"valorTotal", t:"Valor de venda", fmt:R, cor:function(r){ return r.valorTotal>0 ? "text-success" : ""; }}];
  var totalEst = function(ls){ var s = function(k){ return ls.reduce(function(t2, r){ return t2+(r[k]||0); }, 0); }; return ["TOTAL · "+ls.length+(ls.length===1 ? " código" : " códigos"), "", formatarInteiro(s("qtd")), formatarReais(s("custoTotal")), formatarReais(s("valorTotal"))]; };
  var opcoesEst = [{t:"", itens:[["", "Estoque de todos"]].concat(listaExternas(x.pr).map(function(n){ return [n, n]; }))}];
  var blocoEst = e(BlocoPainel,{key:"est", titulo:"Estoque · "+(pessoaEst || "todos"), dir:carregando ? "Buscando custos na DevMaster" : "", compacto:true},
    e(FaixaAzul,null, e("label",{className:"flex items-center gap-2 text-[13px] font-semibold text-white"}, "Pessoa", e(MenuFaixa,{aria:"Estoque de", valor:pessoaEst, grupos:opcoesEst, onChange:function(v){ sEst[1](v); }}))),
    e(TabelaPlanilha,{fina:true, key:"est"+pessoaEst+sVer[0], cols:colsEst, linhas:linhasEst, chave:"id", grade:true, semContagem:true, semLimpar:true, totalRodape:totalEst, vazio:carregando ? "Buscando custos na DevMaster..." : "Nenhuma peça em estoque."}));

  return e("div",{className:GRADE_LIMPA+" grid grid-cols-1 items-stretch gap-0 lg:grid-cols-2"},
    e(BlocoPainel,{key:"mod", titulo:titulo, dir:sErro[0] ? "Sem conexão com a DevMaster" : "", compacto:true},
      e(FaixaAzul,null,
        grupoBtn([["modelo", "Por modelo"], ["tipo", "Por tipo"]], sVis[0], sVis[1]),
        grupoBtn([["dia", "Dia"], ["mes", "Mês"]], modo, sModo[1]),
        modo==="dia" && e("input",{type:"date", value:dia, max:hoje, "aria-label":"Dia", onChange:function(ev){ if(ev.target.value) sDia[1](ev.target.value); }, className:CAMPO_FAIXA}),
        modo==="mes" && e("input",{type:"month", value:mes, "aria-label":"Mês", onChange:function(ev){ if(ev.target.value) sDia[1](ev.target.value+"-01"); }, className:CAMPO_FAIXA}),
        modo==="dia" && diasComDado.length>0 && e(BtFaixa,{onClick:function(){ sDia[1](diasComDado[diasComDado.length-1]); }, titulo:"Vai para o último dia com produção"}, "Último dia"),
        sErro[0] && e(BtFaixa,{onClick:function(){ sErro[1](""); sVer[1](function(v){ return v+1; }); }}, "Tentar de novo")),
      e(TabelaPlanilha,{fina:true, key:"mod"+sVis[0]+modo+dia+sVer[0], cols:sVis[0]==="tipo" ? colsTipo : cols, linhas:sVis[0]==="tipo" ? linhasTipo : linhas, chave:"id", grade:true, semContagem:true, semLimpar:true, totalRodape:sVis[0]==="tipo" ? totalTipo : totalRodape, vazio:carregando ? "Buscando custos na DevMaster..." : (sErro[0] || "Nenhuma peça lançada neste período.")})),
    blocoEst);
}
export { ProdModelos };

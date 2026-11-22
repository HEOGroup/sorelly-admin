// Sorelly Admin · montagem — pages/pf/Point.js
// Painel "Point · Conta corrente" (aparece em Negociações quando o fornecedor escolhido é a Point). Igual ao pt-wrap do HTML original:
// saldo de abertura, 1 · pedidos lançados (dívida sem NF) e 2 · acerto mensal (pix negociado + boleto/NF).
// Visual no padrão azul das outras telas (Marcus, 22/11/2026): blocos azuis, tabelas, letra de 11 px, linha branca entre os blocos.
// Contas em domain/pf.js (ptDados); aqui só desenha e chama as ações pt_*.
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { mesLabel, ptDados } from "@/apps/montagem/domain/pf";
import { INPUT } from "@/apps/montagem/ui/input";
import { e } from "@/shared/react";
import { BotaoMini, COMPACTA } from "./Lancamentos";
import { brl, op, opc } from "./ui";

var r2 = function(v){ return Math.round((Number(v)||0)*100)/100; };
// campo de número que só grava ao sair do campo ou apertar Enter (como o onchange do HTML); a chave refaz o campo quando o valor muda por fora
function Num(p){
  var v = r2(p.valor).toFixed(2);
  var grava = function(ev){ if(ev.target.value !== v) p.grava(ev.target.value); };
  return e("input",{key:p.k+"|"+v, type:"number", step:"0.01", defaultValue:v, "aria-label":p.label, className:INPUT+" w-full min-w-0", onBlur:grava, onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); }});
}
function Dia(p){ return e("input",{key:p.k+"|"+p.valor, type:"date", defaultValue:p.valor, "aria-label":p.label, className:INPUT+" w-full min-w-0", onChange:function(ev){ if(ev.target.value) p.grava(ev.target.value); }}); }

// mesmo azul e mesma letra das outras telas; campos de 20 px em caixa clara, centralizados
var AZ = "!bg-[#17284e] [&_input]:!rounded-md [&_select]:!rounded-md [&_input]:!bg-white/10 [&_select]:!bg-white/10 [&_input]:!border [&_select]:!border [&_input]:!border-white/35 [&_select]:!border-white/35 [&_input]:!text-center [&_select]:!text-center [&_input]:!px-2 [&_select_option]:bg-[#16264a] "+COMPACTA;
var TJ = {escura:true, grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true, semFiltro:true};
var sep = function(k){ return e("div",{key:k, className:"h-[3px] bg-white"}); };

function PointPainel(p){
  var c = p.c, pf = c.pf, pt = pf && pf.fornecedores ? ptDados(pf) : null;
  if(!pt) return null;
  var ed = c.edita, tp = pt.totaisPedidos, tx = pt.totaisPix;
  var LK = function(txt, fn, cls){ return e("a",{href:"#", role:"button", className:"underline "+(cls || "text-[#7DD3FC]"), onClick:function(ev){ ev.preventDefault(); ev.stopPropagation(); fn(); }}, txt); };
  var tab = function(extra){ return e(TabelaPlanilha, Object.assign({}, TJ, extra)); };

  // ---- resumo da conta corrente (uma linha de tabela, com o saldo de abertura para digitar)
  var resumo = e(BlocoPainel,{titulo:"Point · Conta corrente", compacto:true, cls:AZ, acao:ed ? e(BotaoMini,{principal:true, onClick:function(){ op(c, "pt_mes_novo"); }}, "Novo mês") : null},
    tab({chave:"id", linhas:[{id:"r", ini:pt.saldoIni, saldoPed:tp.saldo, pedidos:tp.soma, pago:pt.jaPago, devedor:tx.saldo}], cols:[
      {k:"ini", t:"Saldo devedor de abertura", render:function(){ return e(Num,{k:"ini", valor:pt.saldoIni, label:"Saldo devedor de abertura", grava:function(v){ if(ed) op(c, "pt_ini_set", {valor:v}); }}); }},
      {k:"saldoPed", t:"Saldo total dos pedidos", fmt:brl, cor:function(){ return "text-warning"; }}, {k:"pedidos", t:"Pedidos lançados ("+tp.nItens+" em "+pt.nMeses+" meses)", fmt:brl},
      {k:"pago", t:"Já pago", fmt:brl, cor:function(){ return "text-success"; }}, {k:"devedor", t:"Saldo devedor atual", fmt:brl, cor:function(){ return "text-destructive"; }}]}));

  // ---- bloco 1: pedidos do mês; clicar no mês abre os pedidos (código, data e valor)
  var itensDe = function(l){
    var m = l.m, ls = m.itens.map(function(it, i){ return {id:i, n:i+1, it:it, i:i}; });
    return tab({chave:"id", linhas:ls, vazio:"Nenhum pedido lançado neste mês.", cols:[
      {k:"n", t:"#", w:"3rem"},
      {k:"cod", t:"Código do pedido", render:function(v, r){ return e("input",{key:"c"+m.id+r.i+"|"+(r.it.cod || ""), defaultValue:r.it.cod || "", placeholder:"código do pedido", disabled:!ed, "aria-label":"Código do pedido", className:INPUT+" w-full min-w-0", onBlur:function(ev){ if(ev.target.value!==(r.it.cod || "")) op(c, "pt_item_set", {id:m.id, i:r.i, campo:"cod", valor:ev.target.value}); }}); }},
      {k:"data", t:"Data", render:function(v, r){ return e(Dia,{k:"d"+m.id+r.i, valor:r.it.data || m.data, label:"Data do pedido", grava:function(x){ if(ed) op(c, "pt_item_set", {id:m.id, i:r.i, campo:"data", valor:x}); }}); }},
      {k:"valor", t:"Valor", render:function(v, r){ return e(Num,{k:"v"+m.id+r.i, valor:r.it.valor, label:"Valor do pedido", grava:function(x){ if(ed) op(c, "pt_item_set", {id:m.id, i:r.i, campo:"valor", valor:x}); }}); }},
      {k:"x", t:"Tirar", w:"4rem", render:function(v, r){ return ed ? LK("Tirar", function(){ op(c, "pt_item_del", {id:m.id, i:r.i}); }, "text-destructive") : "—"; }}],
      totalRodape:function(){ return ["Total do mês", "", "", brl(m.soma), ""]; }});
  };
  var linhasPed = pt.pedidos.map(function(m){ return {id:m.id, mes:mesLabel(m.data), n:m.nItens || 0, soma:m.soma, acum:m.acumulado, m:m}; });
  var pedidos = e(BlocoPainel,{titulo:"1 · Pedidos lançados — dívida sem NF", dir:brl(tp.saldo), compacto:true, cls:AZ},
    tab({chave:"id", linhas:linhasPed, detalhe:itensDe, vazio:"Nenhum mês lançado: use Novo mês.", cols:[
      {k:"mes", t:"Mês do pedido", cor:function(){ return ""; }}, {k:"n", t:"Pedidos"}, {k:"soma", t:"Total do mês", fmt:brl}, {k:"acum", t:"Dívida acumulada", fmt:brl},
      {k:"ac", t:"Ações", w:"11rem", render:function(v, r){ return ed ? e("span",{className:"flex items-center justify-center gap-3"}, LK("+ Pedido", function(){ op(c, "pt_item_add", {id:r.m.id}); }), LK("Apagar mês", function(){ opc(c, "pt_mes_del", {id:r.m.id, data:r.m.data}); }, "text-destructive")) : "—"; }}],
      totalRodape:function(){ return ["Total", String(tp.nItens), brl(tp.soma), brl(tp.saldo), ""]; }}));

  // ---- bloco 2: pix e boleto, mês a mês
  var linhasPix = pt.pix.map(function(x){ return {id:x.id, mes:mesLabel(x.data), x:x, saldo:x.saldo}; });
  var pix = e(BlocoPainel,{titulo:"2 · Acerto mensal — valor do pix negociado", dir:brl(tx.saldo), compacto:true, cls:AZ},
    tab({chave:"id", linhas:linhasPix, vazio:"Nenhum mês lançado.", cols:[
      {k:"mes", t:"Mês", cor:function(){ return ""; }},
      {k:"pix", t:"Pix negociado", render:function(v, r){ return e(Num,{k:"p"+r.x.id, valor:r.x.pix, label:"Pix negociado", grava:function(x){ if(ed) op(c, "pt_acerto_set", {id:r.x.id, campo:"valor", valor:x}); }}); }},
      {k:"data", t:"Data do pix", render:function(v, r){ return e(Dia,{k:"e"+r.x.id, valor:r.x.venc, label:"Data do pix", grava:function(x){ if(ed) op(c, "pt_acerto_set", {id:r.x.id, campo:"venc", valor:x}); }}); }},
      {k:"sit", t:"Situação", render:function(v, r){ return e("select",{value:r.x.status==="Pago" ? "Pago" : "Pendente", disabled:!ed, "aria-label":"Situação do pix", className:INPUT+" w-full min-w-0 cursor-pointer", onChange:function(ev){ op(c, "pt_acerto_set", {id:r.x.id, campo:"status", valor:ev.target.value}); }}, e("option",{value:"Pendente"}, "Pendente"), e("option",{value:"Pago"}, "Pago")); }},
      {k:"bol", t:"Boleto ou NF abatido", render:function(v, r){ return e(Num,{k:"b"+r.x.id, valor:r.x.boleto, label:"Boleto ou NF abatido", grava:function(x){ if(ed) op(c, "pt_boleto_set", {mes:r.x.mes, valor:x}); }}); }},
      {k:"saldo", t:"Saldo após o mês", fmt:brl, cor:function(){ return ""; }}],
      totalRodape:function(){ return ["Total", brl(tx.pix), brl(tx.pago)+" pago", brl(tx.aberto)+" em aberto", brl(tx.boleto), brl(tx.saldo)]; }}));

  return e("div",{className:"flex flex-col gap-0"}, e("div",{key:"a"}, resumo), sep("s1"), e("div",{key:"b"}, pedidos), sep("s2"), e("div",{key:"c"}, pix));
}
export { PointPainel };

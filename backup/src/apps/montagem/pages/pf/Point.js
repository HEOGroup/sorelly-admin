// Sorelly Admin · montagem — pages/pf/Point.js
// Painel "Point · Conta corrente" (aparece em Negociações quando o filtro de fornecedor é a Point). Igual ao pt-wrap do HTML original:
// saldo de abertura, 4 números, 1 · pedidos lançados (dívida sem NF) e 2 · acerto mensal (pix negociado + boleto/NF).
// Contas em domain/pf.js (ptDados); aqui só desenha e chama as ações pt_*.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { mesLabel, ptDados } from "@/apps/montagem/domain/pf";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { e } from "@/shared/react";
import { CARD, IconBtn, Tile, TD, brl, op, th } from "./ui";

var r2 = function(v){ return Math.round((Number(v)||0)*100)/100; };
// campo de número que só grava ao sair do campo ou apertar Enter (como o onchange do HTML); a chave refaz o campo quando o valor muda por fora
function Num(p){
  var v = r2(p.valor).toFixed(2);
  var grava = function(ev){ if(ev.target.value !== v) p.grava(ev.target.value); };
  return e("input",{key:p.k+"|"+v, type:"number", step:"0.01", defaultValue:v, "aria-label":p.label, className:INPUT+" h-9! text-right "+MONO+" "+(p.className||"w-32"), onBlur:grava, onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); }});
}
function Dia(p){ return e("input",{key:p.k+"|"+p.valor, type:"date", defaultValue:p.valor, "aria-label":p.label, className:INPUT+" h-9! w-40", onChange:function(ev){ if(ev.target.value) p.grava(ev.target.value); }}); }
var ROT = "text-[10.5px] font-bold uppercase tracking-[.12em] text-muted-foreground";
var TH_N = " text-right!";

function PointPainel(p){
  var c = p.c, pf = c.pf, pt = pf && pf.fornecedores ? ptDados(pf) : null;
  if(!pt) return null;
  var ed = c.edita, tp = pt.totaisPedidos, tx = pt.totaisPix;

  // ---- bloco 1: pedidos do mês (linha + lista de pedidos quando aberto)
  var linhasPed = [];
  pt.pedidos.forEach(function(m){
    linhasPed.push(e("tr",{key:"m"+m.id, className:"border-b border-border/60 "+(m.aberto ? "bg-white/5" : "")},
      e("td",{className:TD}, e("button",{type:"button", "aria-label":m.aberto ? "Fechar pedidos do mês" : "Abrir pedidos do mês", onClick:function(){ op(c,"pt_toggle",{id:m.id}); }, className:"grid size-7 place-items-center rounded-lg bg-muted/50 hover:bg-white/15"}, e(Ph,{n:m.aberto ? "caret-down" : "caret-right", s:14}))),
      e("td",{className:TD}, e("b",null, mesLabel(m.data))),
      e("td",{className:TD+" text-right "+MONO}, m.nItens || "—"),
      e("td",{className:TD+" text-right "+MONO}, e("b",null, brl(m.soma))),
      e("td",{className:TD+" text-right "+MONO+" text-muted-foreground"}, brl(m.acumulado)),
      e("td",{className:TD}, ed && e("button",{type:"button", onClick:function(){ op(c,"pt_item_add",{id:m.id}); }, className:"inline-flex items-center gap-1 rounded-lg bg-linear-to-br from-[#3B82F6] to-[#1D4ED8] px-2.5 py-1 text-[12px] font-bold text-white"}, e(Ph,{n:"plus", s:13}), "pedido"))));
    if(!m.aberto) return;
    var itens = m.itens.map(function(it, i){
      return e("tr",{key:"i"+m.id+"-"+i, className:"border-b border-border/40"},
        e("td",{className:TD+" text-muted-foreground"}, i+1),
        e("td",{className:TD}, e("input",{key:"c"+m.id+i+"|"+(it.cod||""), defaultValue:it.cod||"", placeholder:"código do pedido", disabled:!ed, "aria-label":"Código do pedido", className:INPUT+" h-9! w-44", onBlur:function(ev){ if(ev.target.value!==(it.cod||"")) op(c,"pt_item_set",{id:m.id, i:i, campo:"cod", valor:ev.target.value}); }})),
        e("td",{className:TD}, e(Dia,{k:"d"+m.id+i, valor:it.data||m.data, label:"Data do pedido", grava:function(v){ if(ed) op(c,"pt_item_set",{id:m.id, i:i, campo:"data", valor:v}); }})),
        e("td",{className:TD+" text-right"}, e(Num,{k:"v"+m.id+i, valor:it.valor, label:"Valor do pedido", grava:function(v){ if(ed) op(c,"pt_item_set",{id:m.id, i:i, campo:"valor", valor:v}); }})),
        e("td",{className:TD}, ed && e(IconBtn,{ic:"trash", titulo:"Remover pedido", perigo:true, onClick:function(){ op(c,"pt_item_del",{id:m.id, i:i}); }})));
    });
    if(!itens.length) itens = [e("tr",{key:"vz"+m.id}, e("td",{colSpan:5, className:TD+" py-5 text-center text-muted-foreground"}, "Nenhum pedido lançado neste mês."))];
    linhasPed.push(e("tr",{key:"d"+m.id}, e("td",null), e("td",{colSpan:5, className:"pb-3"},
      e("div",{className:"overflow-hidden rounded-xl bg-background/40 ring-1 ring-white/10"},
        e("div",{className:"flex items-center justify-between gap-3 px-4 py-2.5"}, e("div",null, e("h3",{className:"font-heading text-[15px] font-bold"}, "Pedidos de "+mesLabel(m.data)), e("p",{className:"text-[12px] text-muted-foreground"}, "Sem parcela — o pedido só entra na dívida")),
          ed && e("button",{type:"button", onClick:function(){ op(c,"pt_item_add",{id:m.id}); }, className:"inline-flex items-center gap-1 rounded-lg bg-linear-to-br from-[#3B82F6] to-[#1D4ED8] px-2.5 py-1 text-[12px] font-bold text-white"}, e(Ph,{n:"plus", s:13}), "pedido")),
        e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"},
          e("thead",null, e("tr",null, th("#"), th("Código"), th("Data"), th("Valor", TH_N), th(""))),
          e("tbody",null, itens,
            e("tr",{key:"t"}, e("td",null), e("td",{colSpan:2, className:TD+" text-muted-foreground"}, e("b",null, "Total do mês")), e("td",{className:TD+" text-right "+MONO}, e("b",null, brl(m.soma))), e("td",null)))))))));
  });
  linhasPed.push(e("tr",{key:"tot"}, e("td",null), e("td",{className:TD}, e("b",null, "Total")), e("td",{className:TD+" text-right "+MONO}, e("b",null, tp.nItens)), e("td",{className:TD+" text-right "+MONO}, e("b",null, brl(tp.soma))), e("td",{className:TD+" text-right "+MONO}, e("b",null, brl(tp.saldo))), e("td",null)));
  if(!pt.pedidos.length) linhasPed = [e("tr",{key:"vz"}, e("td",{colSpan:6, className:TD+" py-6 text-center text-muted-foreground"}, "Nenhum mês lançado — use “+ Novo mês”."))];

  // ---- bloco 2: pix e boleto, mês a mês
  var linhasPix = pt.pix.map(function(x){
    return e("tr",{key:"x"+x.id, className:"border-b border-border/60"},
      e("td",{className:TD}, e("b",null, mesLabel(x.data))),
      e("td",{className:TD+" text-right"}, e(Num,{k:"p"+x.id, valor:x.pix, label:"Pix negociado", className:"w-32 font-bold!", grava:function(v){ if(ed) op(c,"pt_acerto_set",{id:x.id, campo:"valor", valor:v}); }})),
      e("td",{className:TD}, e(Dia,{k:"e"+x.id, valor:x.venc, label:"Data do pix", grava:function(v){ if(ed) op(c,"pt_acerto_set",{id:x.id, campo:"venc", valor:v}); }})),
      e("td",{className:TD}, e("select",{value:x.status==="Pago" ? "Pago" : "Pendente", disabled:!ed, "aria-label":"Situação do pix", className:INPUT+" h-9! w-32 cursor-pointer", onChange:function(ev){ op(c,"pt_acerto_set",{id:x.id, campo:"status", valor:ev.target.value}); }}, e("option",{value:"Pendente"}, "Pendente"), e("option",{value:"Pago"}, "Pago"))),
      e("td",{className:TD+" text-right"}, e(Num,{k:"b"+x.id, valor:x.boleto, label:"Boleto ou NF abatido", className:"w-32", grava:function(v){ if(ed) op(c,"pt_boleto_set",{mes:x.mes, valor:v}); }})),
      e("td",{className:TD+" text-right "+MONO}, e("b",null, brl(x.saldo))));
  });
  linhasPix.push(e("tr",{key:"tot"}, e("td",{className:TD}, e("b",null, "Total")), e("td",{className:TD+" text-right "+MONO}, e("b",null, brl(tx.pix))), e("td",{colSpan:2, className:TD+" text-muted-foreground"}, brl(tx.pago)+" pago · "+brl(tx.aberto)+" em aberto"), e("td",{className:TD+" text-right "+MONO}, e("b",null, brl(tx.boleto))), e("td",{className:TD+" text-right "+MONO}, e("b",null, brl(tx.saldo)))));
  if(!pt.pix.length) linhasPix = [e("tr",{key:"vz"}, e("td",{colSpan:6, className:TD+" py-6 text-center text-muted-foreground"}, "Nenhum mês lançado."))];

  var chip = function(rot, v){ return e("div",{className:"text-right"}, e("div",{className:ROT}, rot), e("div",{className:MONO+" text-[19px] font-extrabold"}, brl(v))); };
  var hint = function(t){ return e("p",{className:"border-t border-border/60 px-4 py-2.5 text-[12.5px] text-muted-foreground"}, t); };
  var tabela = function(cab, corpo){ return e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",null, cab)), e("tbody",null, corpo))); };

  return e("div",{className:"flex flex-col gap-4"},
    e("div",{className:CARD+" flex flex-wrap items-end gap-4"},
      e("div",null, e("div",{className:"font-heading text-[17px] font-extrabold"}, "Point · Conta corrente"), e("p",{className:"text-[12.5px] text-muted-foreground"}, "Os pedidos entram soltos e só acumulam a dívida sem NF · o valor do pix é definido à parte, mês a mês")),
      e("div",{className:"flex-1"}),
      e("label",{className:"flex flex-col gap-1"}, e("span",{className:ROT}, "Saldo devedor de abertura"), e(Num,{k:"ini", valor:pt.saldoIni, label:"Saldo devedor de abertura", className:"w-40", grava:function(v){ if(ed) op(c,"pt_ini_set",{valor:v}); }})),
      ed && e("button",{type:"button", onClick:function(){ op(c,"pt_mes_novo"); }, className:"inline-flex h-10 items-center gap-1.5 rounded-lg bg-linear-to-br from-[#3B82F6] to-[#1D4ED8] px-4 text-[13px] font-bold text-white"}, e(Ph,{n:"plus", s:15}), "Novo mês")),

    e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"},
      e(Tile,{t:"Saldo total dos pedidos", v:brl(tp.saldo), cor:COR_Y, sub:"abertura de "+brl(pt.saldoIni)+" + "+brl(tp.soma)+" em pedidos"}),
      e(Tile,{t:"Pedidos lançados", v:brl(tp.soma), sub:tp.nItens+" pedido(s) em "+pt.nMeses+" mês(es)"}),
      e(Tile,{t:"Já pago", v:brl(pt.jaPago), cor:COR_G, sub:brl(tx.pago)+" em pix · "+brl(tx.boleto)+" em boleto/NF"}),
      e(Tile,{t:"Saldo devedor atual", v:brl(tx.saldo), cor:COR_R, sub:brl(tx.aberto)+" de pix negociado ainda em aberto"})),

    e(BlocoBarra,{cor:"azul", t:"1 · Pedidos lançados — dívida sem NF", sub:"Cada pedido entra solto, sem parcela definida — só código, data e valor. O saldo é a soma de tudo que foi pedido.", dir:brl(tp.saldo)},
      tabela([th("", "w-9"), th("Mês do pedido"), th("Qtd. de pedidos", TH_N), th("Total do mês", TH_N), th("Dívida acumulada", TH_N), th("")], linhasPed),
      hint("Clique na seta para abrir os pedidos do mês e lançar, corrigir ou remover cada um pelo código. A dívida acumulada parte do saldo de abertura e vai somando os pedidos, sem descontar nada.")),

    e(BlocoBarra,{cor:"azul", t:"2 · Acerto mensal — valor do pix negociado", sub:"Aqui você define quanto vai pagar em cada mês. O valor é livre e não tem vínculo com nenhum pedido.", dir:brl(tx.saldo)},
      tabela([th("Mês"), th("Pix negociado", TH_N), th("Data do pix"), th("Situação"), th("Boleto / NF abatido", TH_N), th("Saldo após o mês", TH_N)], linhasPix),
      hint("Mudou a negociação? Basta digitar o novo valor — o saldo de todos os meses seguintes se recalcula na hora. O saldo aqui é a dívida dos pedidos menos tudo que já foi pago em pix e em boleto/NF.")));
}
var COR_Y = "#EAB308", COR_G = "#22C55E", COR_R = "#EF4444";
export { PointPainel };

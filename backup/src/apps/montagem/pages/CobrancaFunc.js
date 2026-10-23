// Sorelly Admin · montagem — pages/CobrancaFunc.js
// Financeiro → Cobrança de funcionárias, trazida do SorellyAdmin (Crédito de Peças): Visão geral, Devendo, Quitados, Relatórios mensais, Funcionárias, Configuração e Regras.
// As regras e as contas ficam em domain/cobranca-func.js; aqui só as telas. Dado sensível: só sócios e a Amanda (Cobranças) abrem; Regras qualquer pessoa logada vê.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { cnpjsDe } from "@/apps/montagem/domain/cnpjs";
import { AMANDA_M, nomeDe } from "@/apps/montagem/domain/equipe";
import { ACESSO_COBRANCA_BASE, LIMITE_SALDO, calcularDescontoPct, hojeIso, relatorioMensal, resumoGeral, situacaoDe, todasSituacoes, contaDoPagamento } from "@/apps/montagem/domain/cobranca-func";
import { colaboradoresRh } from "@/apps/montagem/domain/rh";
import { apagarArquivo, baixarArquivo, salvarArquivo } from "@/apps/montagem/lib/arquivos";
import { BKC as BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { Indicador } from "@/apps/montagem/components/padrao";
import { e, useState } from "@/shared/react";
import React from "react";

var ACESSO = ACESSO_COBRANCA_BASE.concat([AMANDA_M.id]);
var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var int = function(v){ return Math.round(v||0).toLocaleString("pt-BR"); };
var num = function(t){ var n = Number(String(t||"").replace(/\./g,"").replace(",",".")); return isNaN(n) ? 0 : n; };
var fmtN = function(v){ return v ? Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}) : ""; };
var br = function(iso){ return iso ? iso.split("-").reverse().join("/") : "—"; };
var mesNome = function(ym){ return MESES[Number(ym.slice(5,7))-1]+"/"+ym.slice(0,4); };
var th = function(t, c){ return e("th",{key:t, className:"whitespace-nowrap border-b border-border px-3 py-2 text-left text-[11.5px] font-semibold uppercase tracking-wide "+(c||"")}, t); };
var TD = "px-3 py-2 text-[13.5px] align-middle";
var CARD = "rounded-xl bg-linear-to-br from-[#3B82F6]/20 via-card to-card px-3 py-2 ring-1 ring-[#3B82F6]/40";

function useCF(){ var cx = use(), s = cx.state; return {s:s, d:cx.dispatch, cf:s.cf, por:nomeDe(s.usuario), pode:ACESSO.indexOf(s.usuario)>=0}; }
function acao(c, op, extra){ c.d(Object.assign({type:"CF", op:op, por:c.por}, extra)); }
function Guarda(p){ return p.c.pode ? p.children : e("div",{className:"flex flex-col gap-3"}, e(PageHead,{t:"Cobrança de funcionárias", sub:"Dívida de funcionárias por compra de peças."}), e("p",{className:"rounded-xl bg-muted/30 px-4 py-6 text-center text-[14px] text-muted-foreground"}, "Só os sócios e a Amanda (Cobranças) abrem esta tela. As regras de compra, qualquer pessoa vê em Regras.")); }
function Campo(p){ return e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold "+(p.className||"")}, p.rot, p.children); }
function Sel(p){ return e("select",{value:p.value, "aria-label":p.label, className:INPUT+" h-10! cursor-pointer "+(p.className||"w-48"), onChange:function(ev){ p.onChange(ev.target.value); }}, p.children); }
function Txt(p){ return e("input",{value:p.value, type:p.type||"text", placeholder:p.ph||"", "aria-label":p.label, className:INPUT+" h-10! "+(p.className||"w-full"), onChange:function(ev){ p.onChange(ev.target.value); }}); }
function Tile(p){ return e(Indicador,{t:p.t, v:p.v, cor:p.cor, sub:p.sub}); }   // padrão único: components/padrao.js
function Modal(p){
  return e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-black/60 p-4", onClick:p.fechar},
    e("div",{className:"flex max-h-[92vh] w-full "+(p.largo ? "max-w-4xl" : "max-w-2xl")+" flex-col gap-3 overflow-y-auto rounded-2xl bg-card p-5 ring-1 ring-[#EF4444]/50", onClick:function(ev){ ev.stopPropagation(); }},
      e("div",{className:"flex items-start justify-between gap-3"}, e("div",null, e("h2",{className:"font-heading text-xl font-bold"}, p.t), p.sub && e("p",{className:"text-[12.5px] text-muted-foreground"}, p.sub)), e("button",{onClick:p.fechar, "aria-label":"Fechar", className:"grid size-9 place-items-center rounded-lg bg-muted/50"}, e(Ph,{n:"x", s:16}))), p.children));
}
var chip = function(t, cor){ return e("span",{className:"inline-flex w-fit whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-bold", style:{background:cor+"26", color:cor, boxShadow:"inset 0 0 0 1px "+cor+"44"}}, t); };
var statusDe = function(s){ return s.f.bloqueado ? chip("Bloqueada", "#94A3B8") : s.quitado ? chip("Quitada", "#22C55E") : s.atrasada ? chip("Em atraso", "#EF4444") : chip("OK", "#22C55E"); };
var iconBtn = function(ic, titulo, fn, perigo){ return e("button",{key:ic+titulo, type:"button", onClick:fn, title:titulo, "aria-label":titulo, className:"grid size-8 place-items-center rounded-lg bg-muted/50 text-muted-foreground "+(perigo ? "hover:bg-destructive/20 hover:text-destructive" : "hover:bg-white/15 hover:text-white")}, e(Ph,{n:ic, s:15})); };

// ── pagamento
function ModalPagamento(p){
  var c = p.c, s = p.s, st = useState({valor:s.minimo>0 ? fmtN(s.minimo) : "", data:hojeIso(), obs:"", conta:"", arq:null}), f = st[0], set = function(o){ st[1](Object.assign({}, f, o)); };
  var registrar = function(){ var fim = function(comp){ acao(c, "pag_add", {funcId:s.f.id, valor:num(f.valor), data:f.data, obs:f.obs, conta:f.conta, comp:comp}); p.fechar(); };
    if(f.arq){ var id = "ar"+Date.now().toString(36)+Math.floor(Math.random()*999).toString(36); salvarArquivo(id, f.arq).then(function(){ fim({id:id, nome:f.arq.name}); }); } else fim(null); };
  return e(Modal,{t:"Pagamento · "+s.f.nome, sub:"Saldo devedor "+BK(s.saldo)+" · pagamento mínimo "+BK(s.minimo)+". O pagamento abate o saldo total (não é de uma compra só).", fechar:p.fechar},
    e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"}, e(Campo,{rot:"Valor pago (R$)"}, e(Txt,{value:f.valor, label:"Valor", onChange:function(v){ set({valor:v.replace(/[^\d,.]/g,"")}); }})), e(Campo,{rot:"Data"}, e(Txt,{value:f.data, type:"date", label:"Data", onChange:function(v){ set({data:v}); }})),
      e(Campo,{rot:"Conta onde o dinheiro entrou", className:"sm:col-span-2"}, e("select",{value:f.conta, "aria-label":"Conta onde o dinheiro entrou", className:INPUT+" h-10! w-full cursor-pointer", onChange:function(ev){ set({conta:ev.target.value}); }}, e("option",{value:""}, "A definir (o financeiro escolhe no Controle de pagamentos)"), (c.s.px ? c.s.px.contas.filter(function(a){ return a.ativa; }) : []).map(function(a){ return e("option",{key:a.id, value:a.label}, a.label); }))),
      e(Campo,{rot:"Observação", className:"sm:col-span-2"}, e(Txt,{value:f.obs, label:"Observação", onChange:function(v){ set({obs:v}); }})),
      e(Campo,{rot:"Comprovante (foto ou PDF)", className:"sm:col-span-2"}, e("input",{type:"file", accept:"image/*,application/pdf", className:INPUT+" h-10! w-full py-1.5", onChange:function(ev){ set({arq:ev.target.files[0]||null}); }}))),
    e("div",{className:"flex justify-end gap-2"}, e(Btn,{v:"ghost", onClick:p.fechar}, "Cancelar"), e(Btn,{v:"primary", disabled:!(num(f.valor)>0), onClick:registrar}, "Registrar pagamento")));
}
// ── negociação
function ModalNegociar(p){
  var c = p.c, s = p.s, abertas = s.compras.filter(function(x){ return !x.paga; }), st = useState({ids:abertas.map(function(x){ return x.compra.id; }), data:hojeIso(), dataAcordada:"", obs:""}), f = st[0], set = function(o){ st[1](Object.assign({}, f, o)); };
  var alterna = function(id){ set({ids:f.ids.indexOf(id)>=0 ? f.ids.filter(function(x){ return x!==id; }) : f.ids.concat([id])}); };
  return e(Modal,{t:"Negociar · "+s.f.nome, sub:"A data acordada substitui o prazo original das compras escolhidas. Quem tem negociação com data futura sai da lista de atrasadas.", fechar:p.fechar},
    abertas.length===0 ? e("p",{className:"text-[13.5px] text-muted-foreground"}, "Não há compra em aberto para negociar.") : e("div",{className:"flex flex-col gap-1.5 rounded-xl bg-black/20 p-3"}, abertas.map(function(x){ return e("label",{key:x.compra.id, className:"flex cursor-pointer items-center gap-2 text-[13px]"}, e("input",{type:"checkbox", checked:f.ids.indexOf(x.compra.id)>=0, className:"size-4", onChange:function(){ alterna(x.compra.id); }}),
      e("span",{className:"flex-1"}, br(x.compra.data)+" · "+x.compra.codigos.join(", ")), e("b",{className:MONO}, BK(x.valorEf))); })),
    e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"}, e(Campo,{rot:"Data da negociação"}, e(Txt,{value:f.data, type:"date", label:"Data", onChange:function(v){ set({data:v}); }})), e(Campo,{rot:"Data acordada para pagar"}, e(Txt,{value:f.dataAcordada, type:"date", label:"Data acordada", onChange:function(v){ set({dataAcordada:v}); }})),
      e(Campo,{rot:"O que foi combinado (obrigatório)", className:"sm:col-span-2"}, e(Txt,{value:f.obs, label:"Observação", ph:"Ex.: vai pagar R$ 100 por mês a partir do dia 15", onChange:function(v){ set({obs:v}); }}))),
    e("div",{className:"flex justify-end gap-2"}, e(Btn,{v:"ghost", onClick:p.fechar}, "Cancelar"), e(Btn,{v:"primary", disabled:!f.ids.length || !f.obs.trim(), onClick:function(){ acao(c, "neg_add", {funcId:s.f.id, compraIds:f.ids, data:f.data, dataAcordada:f.dataAcordada, obs:f.obs}); p.fechar(); }}, "Registrar negociação")));
}
// ── formulário de compra (nova ou edição) com prévia do desconto e aviso do limite de R$ 500
function FormCompra(p){
  var c = p.c, cf = c.cf, x = p.compra, st = useState({funcId:p.funcId||(x ? x.funcId : ""), data:x ? x.data : hojeIso(), codigos:x ? x.codigos.join(", ") : "", valor:x ? fmtN(x.valorOriginal) : "", promocao:x ? x.promocao : false, portaJoias:x ? x.portaJoias : false, luxo:x ? x.luxo : false, previsao:x ? (x.previsao||"") : ""}), f = st[0], set = function(o){ st[1](Object.assign({}, f, o)); };
  var vo = num(f.valor), pct = vo>0 ? Math.round(calcularDescontoPct(vo, f.promocao, f.portaJoias, f.luxo, cf.config)*1000)/10 : 0, cobrado = Math.round(vo*(1-pct/100)*100)/100;
  var saldoAtual = f.funcId ? situacaoDe(cf, f.funcId).saldo-(x ? x.valorCobrado : 0) : 0, passa = vo>0 && saldoAtual+cobrado>LIMITE_SALDO;
  var enviar = function(conf){ var cods = f.codigos.split(/[\s,;]+/).filter(Boolean), dados = {data:f.data, codigos:cods, valorOriginal:vo, promocao:f.promocao, portaJoias:f.portaJoias, luxo:f.luxo, previsao:f.previsao};
    if(passa && !conf && !window.confirm("O saldo devedor passaria de "+BK(LIMITE_SALDO)+" (ficaria "+BK(saldoAtual+cobrado)+"). Lançar mesmo assim? É uma decisão manual do Jurídico.")) return;
    if(x) acao(c, "compra_set", {id:x.id, dados:dados, confirmarLimite:true}); else acao(c, "compra_add", Object.assign({funcId:f.funcId, confirmarLimite:true}, dados)); if(p.fechar) p.fechar(); else set({codigos:"", valor:"", promocao:false, portaJoias:false, luxo:false, previsao:""}); };
  var corpo = e("div",{className:"flex flex-col gap-3"},
    e("div",{className:"flex flex-wrap items-end gap-3"},
      !x && e(Campo,{rot:"Funcionária"}, e(Sel,{value:f.funcId, label:"Funcionária", className:"w-64", onChange:function(v){ set({funcId:v}); }}, e("option",{value:""}, "Escolha…"), cf.funcionarias.filter(function(q){ return q.ativo && !q.bloqueado; }).sort(function(a, b){ return a.nome.localeCompare(b.nome); }).map(function(q){ return e("option",{key:q.id, value:q.id}, q.nome); }))),
      e(Campo,{rot:"Data da compra"}, e(Txt,{value:f.data, type:"date", label:"Data", className:"w-44", onChange:function(v){ set({data:v}); }})), e(Campo,{rot:"Código(s) da peça", className:"min-w-[12rem] flex-1"}, e(Txt,{value:f.codigos, label:"Códigos", ph:"Ex.: 12345, 12346", onChange:function(v){ set({codigos:v}); }})),
      e(Campo,{rot:"Valor original (R$)"}, e(Txt,{value:f.valor, label:"Valor original", className:"w-36", onChange:function(v){ set({valor:v.replace(/[^\d,.]/g,"")}); }})), e(Campo,{rot:"Previsão de pagamento"}, e(Txt,{value:f.previsao, type:"date", label:"Previsão", className:"w-44", onChange:function(v){ set({previsao:v}); }}))),
    e("div",{className:"flex flex-wrap items-center gap-4"}, [["promocao","Adesivo de promoção"], ["portaJoias","Porta-joias"], ["luxo","Peça de luxo"]].map(function(k){ return e("label",{key:k[0], className:"flex cursor-pointer items-center gap-1.5 text-[13px]"}, e("input",{type:"checkbox", checked:f[k[0]], className:"size-4", onChange:function(ev){ var o = {}; o[k[0]] = ev.target.checked; set(o); }}), k[1]); }),
      vo>0 && e("span",{className:"ml-auto rounded-xl bg-black/30 px-3 py-1.5 text-[13.5px]"}, "Desconto ", e("b",{className:MONO+" text-primary"}, pct+"%"), " · cobrar ", e("b",{className:MONO+" text-primary"}, BK(cobrado)))),
    passa && e("p",{className:"rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-[12.5px] font-semibold text-warning"}, "Atenção: com esta compra o saldo passa do limite de "+BK(LIMITE_SALDO)+" (ficaria "+BK(saldoAtual+cobrado)+"). O sistema pede confirmação."),
    e("div",{className:"flex justify-end gap-2"}, p.fechar && e(Btn,{v:"ghost", onClick:p.fechar}, "Cancelar"), e(Btn,{v:"primary", disabled:!f.funcId || !(vo>0) || !f.codigos.trim(), onClick:function(){ enviar(false); }}, x ? "Salvar compra" : "Lançar compra")));
  return p.fechar ? e(Modal,{t:"Editar compra", sub:"O desconto é recalculado com a configuração de hoje.", fechar:p.fechar}, corpo) : corpo;
}
// ── compras de uma funcionária
function ModalCompras(p){
  var c = p.c, s = situacaoDe(c.cf, p.funcId), ed = useState(null), editando = ed[0], setEd = ed[1];
  return e(Modal,{t:"Compras de "+s.f.nome, sub:"Comprado "+BK(s.comprado)+" · pago "+BK(s.pago)+" · saldo "+BK(s.saldo), largo:true, fechar:p.fechar},
    s.compras.length===0 ? e("p",{className:"text-[13.5px] text-muted-foreground"}, "Nenhuma compra.") : e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Data"), th("Peças"), th("Original"), th("Desconto"), th("Cobrado"), th("Próx. cobrança"), th("Situação"), th("")])),
      e("tbody",null, s.compras.slice().reverse().map(function(x){ var cp = x.compra; return e("tr",{key:cp.id, className:"border-b border-border/60"}, e("td",{className:TD}, br(cp.data)), e("td",{className:TD+" text-[12.5px]"}, cp.codigos.join(", ")), e("td",{className:TD+" "+MONO}, BK(cp.valorOriginal)),
        e("td",{className:TD+" "+MONO}, x.descEf+"%"+(x.multa ? " (multa)" : "")), e("td",{className:TD+" font-bold "+MONO}, BK(x.paga ? cp.valorCobrado : x.valorEf)), e("td",{className:TD}, x.proxima ? br(x.proxima) : "—"),
        e("td",{className:TD}, x.paga ? chip("Paga", "#22C55E") : x.emAtraso ? chip("Em atraso", "#EF4444") : chip("Em aberto", "#F59E0B")),
        e("td",{className:TD}, e("div",{className:"flex gap-1.5"}, !x.paga && (x.multa ? e(Btn,{v:"ghost", sm:true, onClick:function(){ acao(c, "compra_multa", {id:cp.id, aplicar:false}); }}, "Tirar multa") : x.emAtraso && e(Btn,{v:"ghost", sm:true, onClick:function(){ if(window.confirm("Aplicar a multa de atraso nesta compra? Reduz o desconto em "+c.cf.config.penalidadeAtrasoPct+" pontos.")) acao(c, "compra_multa", {id:cp.id, aplicar:true}); }}, "Aplicar multa")),
          iconBtn("pencil-simple", "Editar compra", function(){ setEd(cp); }), iconBtn("trash", "Excluir compra", function(){ if(window.confirm("Excluir esta compra?")) acao(c, "compra_del", {id:cp.id}); }, true)))); })))),
    s.pagamentos.length>0 && e("div",{className:"flex flex-col gap-1 rounded-xl bg-black/20 p-3"}, e("b",{className:"text-[13px]"}, "Pagamentos"), s.pagamentos.map(function(g){ return e("div",{key:g.id, className:"flex items-center justify-between gap-2 text-[13px]"}, e("span",null, br(g.data)+(contaDoPagamento(c.s.lancFin, g) ? " · "+contaDoPagamento(c.s.lancFin, g) : "")+(g.obs ? " · "+g.obs : "")+" · "+g.por),
      e("span",{className:"flex items-center gap-2"}, g.comp && e("button",{onClick:function(){ baixarArquivo(g.comp.id, g.comp.nome).catch(function(){ c.d({type:"AVISO", txt:"Esse comprovante não está neste computador.", tom:"alerta"}); }); }, className:"rounded-md bg-success/15 px-2 py-0.5 text-[12px] font-semibold text-success"}, "📎 comprovante"), e("b",{className:MONO}, BK(g.valor)), iconBtn("trash", "Excluir pagamento", function(){ if(window.confirm("Excluir este pagamento?")){ if(g.comp) apagarArquivo(g.comp.id); acao(c, "pag_del", {id:g.id}); } }, true))); })),
    editando && e(FormCompra,{key:editando.id, c:c, compra:editando, fechar:function(){ setEd(null); }}));
}

// ───────────────── Visão geral ─────────────────
function AbaCfVisao(){
  var c = useCF(), cf = c.cf, r = resumoGeral(cf), rel = relatorioMensal(cf).slice(0, 6);
  return e(Guarda,{c:c}, e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Cobrança de funcionárias", sub:"Joias que as funcionárias compram a crédito, com desconto. Aqui: quanto está em aberto, quem está em atraso, as negociações em andamento e o resumo dos últimos meses."}),
    e("div",{className:"grid grid-cols-2 gap-3 xl:grid-cols-4"}, e(Tile,{t:"Total em aberto", v:BK(r.totalEmAberto), cor:"#F87171"}), e(Tile,{t:"Inadimplentes", v:int(r.inadimplentes), cor:r.inadimplentes ? "#EF4444" : "#4ADE80", sub:"com compra em atraso"}), e(Tile,{t:"Quitadas", v:int(r.quitados), cor:"#4ADE80"}), e(Tile,{t:"Negociadas", v:int(r.negociados), cor:"#FBBF24"})),
    e(BlocoBarra,{cor:"azul", t:"Vendas × pagamentos por mês", sub:"os últimos 6 meses com movimento"}, rel.length===0 ? e("p",{className:"px-4 py-6 text-center text-[13.5px] text-muted-foreground"}, "Nenhum lançamento ainda.") : e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Mês"), th("Vendido"), th("Pago"), th("Pendente")])),
      e("tbody",null, rel.map(function(m){ return e("tr",{key:m.mes, className:"border-b border-border/60"}, e("td",{className:TD+" font-semibold"}, mesNome(m.mes)), e("td",{className:TD+" "+MONO}, BK(m.comprado)), e("td",{className:TD+" "+MONO}, BK(m.pago)), e("td",{className:TD+" font-bold "+MONO}, BK(m.pendente))); })))),
    e(BlocoBarra,{cor:"azul", t:"Negociações em andamento", sub:r.negociacoes.length+(r.negociacoes.length===1 ? " negociação" : " negociações"), dir:String(r.negociacoes.length)}, r.negociacoes.length===0 ? e("p",{className:"px-4 py-6 text-center text-[13.5px] text-muted-foreground"}, "Nenhuma negociação.") :
      e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Funcionária"), th("Peças"), th("Valor"), th("Negociada em"), th("Data acordada"), th("Combinado"), th("")])),
        e("tbody",null, r.negociacoes.map(function(n){ return e("tr",{key:n.id, className:"border-b border-border/60"}, e("td",{className:TD+" font-semibold"}, n.nome), e("td",{className:TD+" text-[12.5px]"}, n.codigos.join(", ")), e("td",{className:TD+" "+MONO}, BK(n.valor)), e("td",{className:TD}, br(n.data)), e("td",{className:TD}, n.dataAcordada ? br(n.dataAcordada) : "—"), e("td",{className:TD+" text-[12.5px]"}, n.obs),
          e("td",{className:TD}, iconBtn("trash", "Excluir negociação", function(){ if(window.confirm("Excluir esta negociação?")) acao(c, "neg_del", {id:n.id}); }, true))); })))))));
}

// ───────────────── Devendo ─────────────────
function AbaCfDevendo(){
  var c = useCF(), cf = c.cf, sts = todasSituacoes(cf).filter(function(s){ return s.saldo>0.01; }), md = useState(null), modal = md[0], setModal = md[1], bq = useState(""), busca = bq[0], setBusca = bq[1], q = busca.trim().toLowerCase();
  var lista = sts.filter(function(s){ return !q || s.f.nome.toLowerCase().indexOf(q)>=0; }).sort(function(a, b){ return (b.atrasada?1:0)-(a.atrasada?1:0) || b.saldo-a.saldo; });
  return e(Guarda,{c:c}, e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Devendo", sub:"Lance uma compra e acompanhe quem tem saldo em aberto. Saldo = o que comprou − o que pagou. O limite é de "+BK(LIMITE_SALDO)+" de saldo devedor (passar disso pede confirmação)."}),
    e(BlocoBarra,{cor:"azul", t:"Nova compra"}, e("div",{className:"p-4"}, e(FormCompra,{c:c}))),
    e("div",{className:"flex flex-wrap items-center gap-3"}, e(Txt,{value:busca, ph:"Buscar funcionária…", label:"Buscar", className:"w-64", onChange:setBusca}), e("span",{className:"text-[12.5px] text-muted-foreground"}, lista.length+" com saldo em aberto")),
    e(BlocoBarra,{cor:"azul", t:"Quem está devendo", sub:"atrasadas primeiro", dir:String(lista.length)}, lista.length===0 ? e("p",{className:"px-4 py-8 text-center text-[13.5px] text-muted-foreground"}, "Ninguém com saldo em aberto.") :
      e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Funcionária"), th("Comprado"), th("Pago"), th("Saldo"), th("Mínimo"), th("Próx. cobrança"), th("Situação"), th("")])),
        e("tbody",null, lista.map(function(s){ return e("tr",{key:s.f.id, className:"border-b border-border/60 "+(s.atrasada ? "bg-destructive/10" : "")}, e("td",{className:TD+" font-semibold"}, s.f.nome, s.f.setor && e("span",{className:"block text-[11.5px] font-normal text-muted-foreground"}, s.f.setor)),
          e("td",{className:TD+" "+MONO}, BK(s.comprado)), e("td",{className:TD+" "+MONO}, BK(s.pago)), e("td",{className:TD+" text-[15px] font-bold "+MONO}, BK(s.saldo)), e("td",{className:TD+" "+MONO}, BK(s.minimo)), e("td",{className:TD}, s.proximaCobranca ? br(s.proximaCobranca) : "—"), e("td",{className:TD}, statusDe(s)),
          e("td",{className:TD}, e("div",{className:"flex items-center gap-1.5"}, e(Btn,{v:"primary", sm:true, onClick:function(){ setModal({tipo:"pag", id:s.f.id}); }}, "Pagamento"), e(Btn,{v:"secondary", sm:true, onClick:function(){ setModal({tipo:"neg", id:s.f.id}); }}, "Negociar"), e(Btn,{v:"ghost", sm:true, onClick:function(){ setModal({tipo:"compras", id:s.f.id}); }}, "Compras"),
            iconBtn(s.f.bloqueado ? "lock-simple-open" : "lock-simple", s.f.bloqueado ? "Liberar para novas compras" : "Bloquear novas compras", function(){ acao(c, "func_set", {id:s.f.id, patch:{bloqueado:!s.f.bloqueado}}); })))); }))))),
    modal && modal.tipo==="pag" && e(ModalPagamento,{key:"pg"+modal.id, c:c, s:situacaoDe(cf, modal.id), fechar:function(){ setModal(null); }}),
    modal && modal.tipo==="neg" && e(ModalNegociar,{key:"ng"+modal.id, c:c, s:situacaoDe(cf, modal.id), fechar:function(){ setModal(null); }}),
    modal && modal.tipo==="compras" && e(ModalCompras,{key:"cp"+modal.id, c:c, funcId:modal.id, fechar:function(){ setModal(null); }})));
}

// ───────────────── Quitados ─────────────────
function AbaCfQuitados(){
  var c = useCF(), cf = c.cf, lista = todasSituacoes(cf).filter(function(s){ return s.quitado; }), md = useState(null), ver = md[0], setVer = md[1];
  return e(Guarda,{c:c}, e("div",{className:"flex flex-col gap-4"}, e(PageHead,{t:"Quitadas", sub:"Funcionárias sem saldo devedor e com pelo menos uma compra."}),
    e(BlocoBarra,{cor:"azul", t:"Quitadas", sub:lista.length+" funcionárias", dir:String(lista.length)}, lista.length===0 ? e("p",{className:"px-4 py-8 text-center text-[13.5px] text-muted-foreground"}, "Ninguém quitada ainda.") :
      e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Funcionária"), th("Setor"), th("Comprado"), th("Pago"), th("")])),
        e("tbody",null, lista.map(function(s){ return e("tr",{key:s.f.id, className:"border-b border-border/60"}, e("td",{className:TD+" font-semibold"}, s.f.nome), e("td",{className:TD}, s.f.setor||"—"), e("td",{className:TD+" "+MONO}, BK(s.comprado)), e("td",{className:TD+" "+MONO}, BK(s.pago)), e("td",{className:TD}, e(Btn,{v:"ghost", sm:true, onClick:function(){ setVer(s.f.id); }}, "Ver compras"))); }))))),
    ver && e(ModalCompras,{key:ver, c:c, funcId:ver, fechar:function(){ setVer(null); }})));
}

// ───────────────── Relatórios mensais ─────────────────
function AbaCfRelatorio(){
  var c = useCF(), meses = relatorioMensal(c.cf);
  return e(Guarda,{c:c}, e("div",{className:"flex flex-col gap-4"}, e(PageHead,{t:"Relatórios mensais", sub:"Comprado × pago por funcionária, mês a mês (pelas datas dos lançamentos)."}),
    meses.length===0 ? e("p",{className:"rounded-xl bg-muted/30 px-4 py-6 text-center text-[13.5px] text-muted-foreground"}, "Sem movimento ainda.") : meses.map(function(m){
      return e(BlocoBarra,{key:m.mes, cor:"azul", t:mesNome(m.mes), sub:"vendido "+BK(m.comprado)+" · pago "+BK(m.pago)+" · pendente "+BK(m.pendente), dir:BK(m.pendente)},
        e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Funcionária"), th("Comprado"), th("Pago"), th("Diferença")])),
          e("tbody",null, m.funcionarias.map(function(x){ return e("tr",{key:x.funcId, className:"border-b border-border/60"}, e("td",{className:TD+" font-semibold"}, x.nome), e("td",{className:TD+" "+MONO}, BK(x.comprado)), e("td",{className:TD+" "+MONO}, BK(x.pago)), e("td",{className:TD+" "+MONO+(x.comprado-x.pago>0.005 ? " text-[#FBBF24]" : " text-success")}, BK(x.comprado-x.pago))); }))))); })));
}

// ───────────────── Funcionárias ─────────────────
function AbaCfFuncionarias(){
  var c = useCF(), cf = c.cf, nf = useState({nome:"", setor:"", cnpj:"", admissao:""}), f = nf[0], set = function(o){ nf[1](Object.assign({}, f, o)); }, empresas = cnpjsDe(c.s.cnpjs).filter(function(x){ return x.num; });
  var trazer = function(){ var nomes = {}; empresas.forEach(function(x){ nomes[x.id] = x.nome; }); acao(c, "func_lote", {itens:colaboradoresRh(c.s).filter(function(x){ return x.status!=="DESLIGADO"; }).map(function(x){ return {nome:x.nome, setor:x.setor, cnpj:nomes[x.cnpj]||"", admissao:x.admissao}; })}); };
  var lista = cf.funcionarias.filter(function(x){ return x.ativo; }).sort(function(a, b){ return a.nome.localeCompare(b.nome); });
  return e(Guarda,{c:c}, e("div",{className:"flex flex-col gap-4"}, e(PageHead,{t:"Funcionárias da cobrança", sub:"Quem pode comprar peças a crédito. O bloqueio é manual (decisão do Jurídico) e impede compras novas. Quem tem saldo não se exclui; quem já quitou é arquivada."}),
    e("div",{className:"flex flex-wrap items-end gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-[#EF4444]/30"}, e(Campo,{rot:"Nome", className:"min-w-[14rem] flex-1"}, e(Txt,{value:f.nome, label:"Nome", onChange:function(v){ set({nome:v}); }})), e(Campo,{rot:"Setor"}, e(Txt,{value:f.setor, label:"Setor", className:"w-44", onChange:function(v){ set({setor:v}); }})),
      e(Campo,{rot:"Empresa"}, e(Sel,{value:f.cnpj, label:"Empresa", className:"w-52", onChange:function(v){ set({cnpj:v}); }}, e("option",{value:""}, "A informar"), empresas.map(function(x){ return e("option",{key:x.id, value:x.nome}, x.nome); }))), e(Campo,{rot:"Admissão"}, e(Txt,{value:f.admissao, type:"date", label:"Admissão", className:"w-44", onChange:function(v){ set({admissao:v}); }})),
      e(Btn,{v:"primary", disabled:!f.nome.trim(), onClick:function(){ acao(c, "func_add", f); set({nome:""}); }}, "+ Funcionária"), e(Btn,{v:"ghost", onClick:trazer}, "Trazer as funcionárias do cadastro do RH")),
    e(BlocoBarra,{cor:"azul", t:"Funcionárias", sub:lista.length+" cadastradas", dir:String(lista.length)}, lista.length===0 ? e("p",{className:"px-4 py-8 text-center text-[13.5px] text-muted-foreground"}, "Nenhuma funcionária cadastrada.") :
      e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Nome"), th("Setor"), th("Empresa"), th("Admissão"), th("Situação"), th("")])),
        e("tbody",null, lista.map(function(x){ var s = situacaoDe(cf, x.id); return e("tr",{key:x.id, className:"border-b border-border/60"}, e("td",{className:TD+" font-semibold"}, x.nome), e("td",{className:TD}, x.setor||"—"), e("td",{className:TD}, x.cnpj||"—"), e("td",{className:TD}, br(x.admissao)), e("td",{className:TD}, statusDe(s)),
          e("td",{className:TD}, e("div",{className:"flex gap-1.5"}, e(Btn,{v:"ghost", sm:true, onClick:function(){ acao(c, "func_set", {id:x.id, patch:{bloqueado:!x.bloqueado}}); }}, x.bloqueado ? "Liberar" : "Bloquear"), iconBtn("trash", "Excluir ou arquivar", function(){ if(window.confirm("Excluir "+x.nome+"? Sem compras, apaga; com histórico quitado, arquiva.")) acao(c, "func_del", {id:x.id}); }, true)))); })))))));
}

// ───────────────── Configuração ─────────────────
var CAMPOS_CFG = [["Desconto por faixa do valor da peça", [["descontoAte200","Até R$ 200,00","%"], ["desconto200a300","De R$ 200,01 a R$ 300,00","%"], ["desconto300a400","De R$ 300,01 a R$ 400,00","%"], ["descontoAcima400","Acima de R$ 400,00","%"]]],
  ["Descontos fixos", [["descontoPromocaoPortaJoias","Promoção ou porta-joias","%"], ["descontoPecaLuxo","Peça de luxo","%"]]], ["Multa de atraso", [["penalidadeAtrasoPct","Pontos de desconto que saem quando a multa é aplicada","pontos"]]],
  ["Pagamento mínimo por faixa do saldo devedor", [["pagamentoMinimoAte99","Saldo até R$ 99,99","R$"], ["pagamentoMinimo100a199","De R$ 100 a R$ 199,99","R$"], ["pagamentoMinimo200a299","De R$ 200 a R$ 299,99","R$"], ["pagamentoMinimo300a399","De R$ 300 a R$ 399,99","R$"], ["pagamentoMinimo400a500","De R$ 400 a R$ 500","R$"]]]];
function AbaCfConfig(){
  var c = useCF(), cfg = c.cf.config;
  return e(Guarda,{c:c}, e("div",{className:"flex flex-col gap-4"}, e(PageHead,{t:"Configuração da cobrança", sub:"Os percentuais de desconto, a multa e o pagamento mínimo. Mudou aqui, a página de Regras se atualiza sozinha. Compras já lançadas guardam o desconto da época (editar a compra recalcula)."}),
    e("div",{className:"grid grid-cols-1 gap-4 lg:grid-cols-2"}, CAMPOS_CFG.map(function(g){ return e(BlocoBarra,{key:g[0], cor:"azul", t:g[0]}, e("div",{className:"flex flex-col gap-2 p-4"}, g[1].map(function(k){ return e("div",{key:k[0], id:"cfg-"+k[0], className:"flex items-center justify-between gap-3 text-[13.5px]"}, e("span",null, k[1]),
      e("span",{className:"flex items-center gap-1.5"}, k[2]==="R$" && e("span",{className:"text-muted-foreground"}, "R$"), e("input",{key:cfg[k[0]], defaultValue:cfg[k[0]], inputMode:"decimal", "aria-label":k[1], className:INPUT+" h-9! w-24 text-center "+MONO, onBlur:function(ev){ var v = num(ev.target.value); if(v!==cfg[k[0]]){ var o = {}; o[k[0]] = v; acao(c, "config_set", {patch:o}); } }, onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); }}), k[2]!=="R$" && e("span",{className:"text-muted-foreground"}, k[2]))); }))); })),
    e("p",{className:"rounded-xl bg-muted/30 px-4 py-3 text-[12.5px] text-muted-foreground"}, "O limite de "+BK(LIMITE_SALDO)+" de saldo devedor é política fixa da empresa (passar dele pede confirmação do Jurídico).")));
}

// ───────────────── Regras (texto gerado da configuração; valores clicáveis levam à Configuração) ─────────────────
function AbaCfRegras(){
  var cx = use(), s = cx.state, d = cx.dispatch, cfg = s.cf.config, pode = ACESSO.indexOf(s.usuario)>=0;
  var v = function(k, suf){ var txt = (suf==="R$" ? "R$ " : "")+String(cfg[k]).replace(".", ",")+(suf==="%" ? "%" : ""); return pode ? e("button",{type:"button", title:"Mudar este valor na Configuração", onClick:function(){ d({type:"ABA", aba:"cfconfig"}); }, className:"mx-0.5 rounded-md bg-primary/15 px-1.5 font-mono font-bold text-primary underline decoration-dotted underline-offset-2 hover:bg-primary/25"}, txt) : e("b",{className:"mx-0.5 font-mono text-primary"}, txt); };
  var t = function(k, suf){ return (suf==="R$" ? "R$ " : "")+String(cfg[k]).replace(".", ",")+(suf==="%" ? "%" : ""); };
  var whats = "📢 *REGRAS DE COMPRA DE PEÇAS — FUNCIONÁRIAS* 📢\n\n💰 *DESCONTO POR VALOR DA PEÇA*\n✅ Até R$200,00 → *"+t("descontoAte200","%")+" de desconto*\n✅ De R$200,01 até R$300,00 → *"+t("desconto200a300","%")+" de desconto*\n✅ De R$300,01 até R$400,00 → *"+t("desconto300a400","%")+" de desconto*\n✅ Acima de R$400,00 → *"+t("descontoAcima400","%")+" de desconto*\n\n⚠️ Peça com *adesivo de promoção* ou *porta-joias* → desconto fixo de *"+t("descontoPromocaoPortaJoias","%")+"*, independente do valor.\n⚠️ *Peça de luxo* → desconto fixo de *"+t("descontoPecaLuxo","%")+"*.\n\n📊 *LIMITE DE COMPRA*\nO limite é de *"+BK(LIMITE_SALDO)+" em saldo devedor*: é o total que você pode dever, somando todas as compras em aberto. Não é por compra.\n\n💳 *PAGAMENTO E SALDO*\nCada pagamento abate direto do saldo devedor total. Existe um *pagamento mínimo por mês*, conforme o saldo: até R$99 → *"+t("pagamentoMinimoAte99","R$")+"*; R$100 a R$199 → *"+t("pagamentoMinimo100a199","R$")+"*; R$200 a R$299 → *"+t("pagamentoMinimo200a299","R$")+"*; R$300 a R$399 → *"+t("pagamentoMinimo300a399","R$")+"*; R$400 a R$500 → *"+t("pagamentoMinimo400a500","R$")+"*.\n\n⏰ *ATRASO E MULTA*\nPassando da data combinada sem pagar o mínimo do mês, a compra fica em atraso. O Jurídico pode aplicar uma multa, que reduz o desconto da compra em *"+t("penalidadeAtrasoPct","pontos").replace("pontos","pontos percentuais")+"*.\n\n🚫 *BLOQUEIO*\nO Jurídico acompanha o saldo e pode bloquear novas compras a qualquer momento.\n\n💸 *PAGAMENTO*\nVia *PIX* (dados enviados individualmente), com comprovante.\n\n📝 *RESCISÃO*\nNo desligamento, o saldo pendente é *quitado ou descontado da rescisão*, conforme o termo assinado na primeira compra.\n\nQualquer dúvida, falar com a *Amanda* (Cobranças). 🙏";
  var copiar = function(){ try{ navigator.clipboard.writeText(whats); d({type:"AVISO", txt:"Mensagem copiada! Já pode colar no WhatsApp."}); }catch(x){} };
  var item = function(ch){ return e("p",{className:"leading-relaxed"}, "✓ ", ch); };
  return e("div",{className:"flex flex-col gap-4"}, e(PageHead,{t:"Regras de compra de peças", sub:"Para todas as funcionárias. "+(pode ? "Os valores em dourado são clicáveis: levam à Configuração, onde se mudam." : "Leia com atenção.")}),
    e(BlocoBarra,{cor:"azul", t:"Desconto por valor da peça"}, e("div",{className:"flex flex-col gap-2 p-4 text-[14.5px]"}, item(["Peça de até R$ 200,00: ", v("descontoAte200","%"), " de desconto."]), item(["De R$ 200,01 até R$ 300,00: ", v("desconto200a300","%"), "."]), item(["De R$ 300,01 até R$ 400,00: ", v("desconto300a400","%"), "."]), item(["Acima de R$ 400,00: ", v("descontoAcima400","%"), "."]),
      item(["Peça com adesivo de promoção ou porta-joias: desconto fixo de ", v("descontoPromocaoPortaJoias","%"), ", seja qual for o valor."]), item(["Peça de luxo: desconto fixo de ", v("descontoPecaLuxo","%"), "."]))),
    e(BlocoBarra,{cor:"azul", t:"Limite, pagamento e atraso"}, e("div",{className:"flex flex-col gap-2 p-4 text-[14.5px]"}, item(["O limite é de ", e("b",{className:"font-mono text-primary"}, BK(LIMITE_SALDO)), " em saldo devedor (a soma de todas as compras em aberto, não por compra)."]), item("Cada pagamento abate do saldo total. Não existe parcela fixa."),
      item(["Pagamento mínimo por mês, conforme o saldo: até R$ 99 → ", v("pagamentoMinimoAte99","R$"), "; R$ 100 a 199 → ", v("pagamentoMinimo100a199","R$"), "; R$ 200 a 299 → ", v("pagamentoMinimo200a299","R$"), "; R$ 300 a 399 → ", v("pagamentoMinimo300a399","R$"), "; R$ 400 a 500 → ", v("pagamentoMinimo400a500","R$"), "."]),
      item("Passou da data combinada sem pagar o mínimo do mês: a compra fica em atraso."), item(["Se o Jurídico aplicar a multa, o desconto da compra cai ", v("penalidadeAtrasoPct","pontos"), " pontos percentuais."]), item("O Jurídico pode bloquear novas compras a qualquer momento."), item("Pagamento por PIX (dados enviados individualmente), com comprovante."),
      item("No desligamento, o saldo pendente é quitado ou descontado da rescisão, conforme o termo assinado na primeira compra."))),
    e("div",null, e(Btn,{v:"primary", ic:"copiar", onClick:copiar}, "Copiar mensagem para o WhatsApp")));
}

export { AbaCfVisao, AbaCfDevendo, AbaCfQuitados, AbaCfRelatorio, AbaCfFuncionarias, AbaCfConfig, AbaCfRegras };

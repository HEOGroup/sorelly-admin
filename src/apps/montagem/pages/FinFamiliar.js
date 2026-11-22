// Sorelly Admin · montagem — pages/FinFamiliar.js
// Financeiro Familiar trazido do SorellyAdmin: Home, Alertas, Contas a pagar, Contas pagas, PIX revendedoras, Prestadores, Pró-labores, Relatório, Histórico e Configurações.
// As regras e as contas ficam em domain/financeiro-familiar.js; aqui só as telas. Só os sócios (ACESSO_FF) abrem. Dados só neste navegador.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { nomePropio, rotuloPrestadorFamilia } from "@/apps/montagem/lib/nome-conta";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { FAMILIA4, daPessoa, membrosFamilia, ACESSO_FF, FORMAS, FORMAS_REPASSE, MESES, TIPOS_REGRA, br, hojeIso, hojeYm, janela, liquidoDe, nomeMes, parcelasDe, baixaDividas, casaDe, pixCasa, pixDivisao, pixDoMes, relatorioMes, saldoPrestador, somaMes, totaisPersona, vigenciaEm, ultimoDia, r2 } from "@/apps/montagem/domain/financeiro-familiar";
import { abrirAnexo, buscarAnexo, enviarAnexo, lerArquivo as lerAnexo } from "@/apps/montagem/lib/anexo";
import { BKC as BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { Indicador, Pagina } from "@/apps/montagem/components/padrao";
import { Bloco, BlocoFiltros, Botao, CAMPO, CampoSel, Rotulo, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { BlocoResumo } from "@/apps/montagem/components/bloco-resumo";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { CampoMini } from "@/apps/montagem/components/planilha-cheia";
import { chavesParaGravar } from "@/apps/montagem/lib/chave-do-destino";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { e, useState } from "@/shared/react";
import React from "react";

var int = function(v){ return Math.round(v||0).toLocaleString("pt-BR"); };
var num = function(t){ var n = Number(String(t||"").replace(/\./g,"").replace(",",".")); return isNaN(n) ? 0 : n; };
var fmtN = function(v){ return Number(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}); };
var th = function(t, c){ return e("th",{key:t, className:"whitespace-nowrap border-b border-border px-3 py-2 text-left text-[11.5px] font-semibold uppercase tracking-wide "+(c||"")}, t); };
var TD = "px-3 py-2 text-[13.5px]";
var CARD = "rounded-xl bg-linear-to-br from-[#3B82F6]/20 via-card to-card px-3 py-2 ring-1 ring-[#3B82F6]/40";
var AVISO = "flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-[13.5px] font-medium text-destructive";

function useFF(){ var cx = use(), s = cx.state; return {s:s, d:cx.dispatch, ff:s.ff, por:nomeDe(s.usuario), pode:temAutorizacao("financeiro_familia", s.usuario)}; }
function acao(c, op, extra){ c.d(Object.assign({type:"FF", op:op, por:c.por}, extra)); }
function Guarda(p){ return p.c.pode ? p.children : e("div",{className:"flex flex-col gap-3"}, e(PageHead,{t:"Financeiro Familiar", sub:"Finanças pessoais dos sócios."}), e("p",{className:"rounded-xl bg-muted/30 px-4 py-6 text-center text-[14px] text-muted-foreground"}, "Só os sócios abrem o Financeiro Familiar.")); }
function Campo(p){ return e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold "+(p.className||"")}, p.rot, p.children); }
function Sel(p){ return e("select",{value:p.value, "aria-label":p.label, className:INPUT+" h-10! cursor-pointer "+(p.className||"w-48"), onChange:function(ev){ p.onChange(ev.target.value); }}, p.children); }
function Txt(p){ return e("input",{value:p.value, type:p.type||"text", placeholder:p.ph||"", "aria-label":p.label, list:p.list, className:INPUT+" h-10! "+(p.className||"w-full"), onChange:function(ev){ p.onChange(ev.target.value); }, onKeyDown:p.onEnter ? function(ev){ if(ev.key==="Enter") p.onEnter(); } : undefined}); }
function Tile(p){ return e(Indicador,{t:p.t, v:p.v, cor:p.cor, sub:p.sub}); }   // padrão único: components/padrao.js
function Modal(p){
  return e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-black/60 p-4", onClick:p.fechar},
    e("div",{className:"flex max-h-[92vh] w-full max-w-2xl flex-col gap-3 overflow-y-auto rounded-2xl bg-card p-5 ring-1 ring-[#EC4899]/50", onClick:function(ev){ ev.stopPropagation(); }},
      e("div",{className:"flex items-start justify-between gap-3"}, e("div",null, e("h2",{className:"font-heading text-xl font-bold"}, p.t), p.sub && e("p",{className:"text-[12.5px] text-muted-foreground"}, p.sub)), e("button",{onClick:p.fechar, "aria-label":"Fechar", className:"grid size-9 place-items-center rounded-lg bg-muted/50"}, e(Ph,{n:"x", s:16}))), p.children));
}
function MesSel(p){ var l = janela(); return e(Sel,{value:p.ym, label:"Mês", className:"w-52", onChange:p.set}, p.todos && e("option",{value:""}, "Todos os meses"), l.map(function(k){ return e("option",{key:k, value:k}, nomeMes(k)); })); }
var pessoaNome = function(ff, id){ var p = ff.personas.find(function(x){ return x.id===id; }); return p ? p.nome : "—"; };
var contaLabel = function(ff, id){ var c = ff.contasBanc.find(function(x){ return x.id===id; }); return c ? (c.banco ? c.banco+" — " : "")+c.nome : ""; };
var corPessoa = function(ff, id){ var p = ff.personas.find(function(x){ return x.id===id; }); return p ? p.cor : "#EC4899"; };
var catNome = function(ff, k){ var c = ff.categorias.find(function(x){ return x.chave===k; }); return c ? c.nome : k; };
var statusChip = function(x){ var cor = x.status==="PAGO" ? "#22C55E" : x.atrasada ? "#EF4444" : x.status==="PARCIAL" ? "#F59E0B" : "#94A3B8", lb = x.status==="PAGO" ? "Pago" : x.atrasada ? "Atrasado" : x.status==="PARCIAL" ? "Parcial" : "Pendente";
  return e("span",{className:"whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-bold", style:{background:cor+"26", color:cor}}, lb); };
var casaValor = function(q, v){ if(!q) return true; var bruto = q.replace(/\./g,"").replace(",","."); return fmtN(v).indexOf(q)>=0 || String(r2(v)).indexOf(bruto)>=0; };
var iconBtn = function(ic, titulo, fn, perigo){ return e("button",{key:ic+titulo, onClick:fn, title:titulo, "aria-label":titulo, className:"grid size-8 place-items-center rounded-lg bg-muted/50 text-muted-foreground "+(perigo ? "hover:bg-destructive/20 hover:text-destructive" : "hover:bg-white/15 hover:text-white")}, e(Ph,{n:ic, s:15})); };

// ───────────────── Home ─────────────────
// Totais do ano: soma dos 12 meses (pró-labore, contas e PIX) de cada pessoa
function totaisAno(ff, pid, ano){
  var ts = []; for(var i=1; i<=12; i++) ts.push(totaisPersona(ff, pid, ano+"-"+(i<10 ? "0" : "")+i));
  var s = function(fn){ return r2(ts.reduce(function(a, x){ return a+fn(x); }, 0)); };
  return {contas:{total:s(function(x){ return x.contas.total; }), pago:s(function(x){ return x.contas.pago; }), restante:s(function(x){ return x.contas.restante; }), pendentes:ts.reduce(function(a, x){ return a+x.contas.pendentes; }, 0)},
    pro:{total:s(function(x){ return x.pro.total; }), recebido:s(function(x){ return x.pro.recebido; }), restante:s(function(x){ return x.pro.restante; })},
    pix:{meta:s(function(x){ return x.pix.meta; }), recebido:s(function(x){ return x.pix.recebido; }), restante:s(function(x){ return x.pix.restante; })}};
}
// HOME EM TABELA ÚNICA (Marcus, 22/11/2026): igual às Negociações e ao Prestadores: uma tabela só, uma linha por pessoa, cor só para estado (verde = pago/recebido/enviado, vermelho = conta atrasada).
// Clicar na linha abre embaixo as contas em aberto da pessoa e os atalhos para as telas dela.
var diaBr = function(iso){ return iso ? iso.slice(8,10)+"/"+iso.slice(5,7)+"/"+iso.slice(2,4) : "—"; };
function DetHome(p){
  var ff = p.ff, pid = p.l.id, yms = p.ANO ? janela().filter(function(k){ return k.slice(0,4)===p.ANO && k<=hojeYm(); }) : [p.ym];
  var itens = parcelasDe(ff, {yms:yms}).filter(function(x){ return daPessoa(x.conta, pid) && x.status!=="PAGO"; }).map(function(x){ var q = x.conta.rateio && x.conta.rateio.length ? 1/x.conta.rateio.length : 1;
    return {id:x.chave, conta:x.conta.descricao+(x.conta.categoria==="PRO_LABORE" ? " (pró-labore)" : ""), venc:diaBr(x.venc), valor:r2(x.valor*q), pago:r2(x.pago*q), restante:r2(x.restante*q), atrasada:x.atrasada, sit:x.atrasada ? "Atrasada" : x.status==="PARCIAL" ? "Parcial" : "Pendente"}; })
    .sort(function(a, b){ return a.venc.split("/").reverse().join("").localeCompare(b.venc.split("/").reverse().join("")); });
  var cols = [{k:"conta", t:"Conta"}, {k:"venc", t:"Vencimento"}, {k:"valor", t:"Valor", fmt:BK}, {k:"pago", t:"Pago", fmt:BK, cor:function(l){ return l.pago>0 ? "text-success" : ""; }}, {k:"restante", t:"Restante", fmt:BK, cor:function(l){ return l.atrasada ? "text-destructive" : ""; }},
    {k:"sit", t:"Situação", cor:function(l){ return l.atrasada ? "text-destructive" : l.sit==="Parcial" ? "text-warning" : ""; }}];
  return e("div",{className:"flex flex-col gap-1.5 p-1.5", onClick:function(ev){ ev.stopPropagation(); }},
    itens.length===0 ? e("p",{className:"py-2 text-center text-[11px]"}, "Nenhuma conta em aberto para "+p.l.pessoa+" neste período.") :
      e(TabelaPlanilha,{cols:cols, linhas:itens, chave:"id", grade:true, semMao:true, centro:true, semFiltro:true, semContagem:true, semLimpar:true, vazio:"Nenhuma conta."}),
    e("div",{className:"flex flex-wrap items-center justify-center gap-2"},
      p.l.p.mostrarContas && e(Botao,{onClick:function(){ p.ir("ffcontas"); }}, "Abrir contas a pagar"),
      p.l.p.mostrarProlabore && e(Botao,{onClick:function(){ p.ir("ffprolab"); }}, "Abrir pró-labore"),
      p.l.p.mostrarPix && e(Botao,{onClick:function(){ p.ir("ffpix"); }}, "Abrir Pix revendedora")));
}
function AbaFfHome(){
  var c = useFF(), ff = c.ff, ms = useState(hojeYm()), ym = ms[0], setYm = ms[1], ANO = /^ANO:/.test(ym) ? ym.slice(4) : "";
  var mesesOp = janela().filter(function(k){ return k<=hojeYm(); }), anosOp = mesesOp.map(function(k){ return k.slice(0,4); }).filter(function(a, i, l){ return l.indexOf(a)===i; });
  var ir = function(aba){ c.d({type:"ABA", aba:aba}); };
  var ND = "—", num = function(ok, v){ return ok ? v : ND; };
  var linhas = ff.personas.filter(function(p){ return p.ativo; }).map(function(p){ var t = ANO ? totaisAno(ff, p.id, ANO) : totaisPersona(ff, p.id, ym);
    return {id:p.id, p:p, pessoa:p.nome, tipo:p.tipo==="SOCIO" ? "Sócio" : "Família",
      proRec:num(p.mostrarProlabore, t.pro.recebido), proRest:num(p.mostrarProlabore, t.pro.restante), proTot:num(p.mostrarProlabore, t.pro.total),
      ctPago:num(p.mostrarContas, t.contas.pago), ctRest:num(p.mostrarContas, t.contas.restante), ctTot:num(p.mostrarContas, t.contas.total), ctPend:num(p.mostrarContas, t.contas.pendentes), ctAtr:t.contas.atrasado || 0,
      pxEnv:num(p.mostrarPix, t.pix.recebido), pxRest:num(p.mostrarPix, t.pix.restante), pxMeta:num(p.mostrarPix, t.pix.meta),
      pagar:r2((p.mostrarContas ? t.contas.total : 0)+(p.mostrarProlabore ? t.pro.total : 0))}; });
  var D = function(v){ return typeof v==="number" ? BK(v) : ND; }, I = function(v){ return typeof v==="number" ? String(v) : ND; };
  var verde = function(k){ return function(l){ return typeof l[k]==="number" && l[k]>0.005 ? "text-success" : ""; }; };
  var cols = [{k:"pessoa", t:"Pessoa"},
    {k:"proRec", t:"Recebido", fmt:D, cor:verde("proRec")}, {k:"proRest", t:"Restante", fmt:D}, {k:"proTot", t:"Total", fmt:D},
    {k:"ctPago", t:"Pago", fmt:D, cor:verde("ctPago")}, {k:"ctRest", t:"Restante", fmt:D, cor:function(l){ return l.ctAtr>0.005 ? "text-destructive" : ""; }}, {k:"ctTot", t:"Total", fmt:D}, {k:"ctPend", t:"Pendentes", fmt:I},
    {k:"pxEnv", t:"Enviado", fmt:D, cor:verde("pxEnv")}, {k:"pxRest", t:"Restante", fmt:D}, {k:"pxMeta", t:"Meta", fmt:D},
    {k:"pagar", t:ANO ? "A pagar no ano" : "A pagar no mês", fmt:BK}];
  var soma = function(ls, k){ return r2(ls.reduce(function(t, x){ return t+(typeof x[k]==="number" ? x[k] : 0); }, 0)); };
  var rodape = function(ls){ return ["Total"].concat(["proRec", "proRest", "proTot", "ctPago", "ctRest", "ctTot"].map(function(k){ return BK(soma(ls, k)); }), [String(soma(ls, "ctPend"))], ["pxEnv", "pxRest", "pxMeta", "pagar"].map(function(k){ return BK(soma(ls, k)); })); };
  var FUNDO = "!bg-[#0f1729] [&_tbody_tr:hover]:!bg-[#1e2d4c] [&_tbody_tr[aria-expanded=true]]:!bg-[#26385c] [&_tbody_tr:not([aria-expanded])>td[colspan]]:!bg-[#1a2540]";   // mesmo fundo azul-marinho do Prestadores (Marcus, 18/11/2026)
  var COMPACTA = FUNDO+" [&_td]:!h-[22px] [&_td]:!px-2 [&_td]:!py-0 [&_td]:!leading-[14px] [&_td]:!text-[11px] [&_th]:!h-6 [&_td[colspan]]:!p-0 [&_th]:!text-[10px] [&_th_button]:!px-1 [&_th_button]:!gap-0.5 [&_th_button]:!tracking-normal [&_th_span]:!tracking-normal [&_th_button>span]:!hidden";   // padrao-ok: linhas de 22 px, letra de 11 px e cabeçalho de 10 px sem seta, para as 12 colunas caberem sem rolar
  var seletor = e(CampoMini,{valor:ym, aoMudar:setYm, rotulo:"Mês", ops:mesesOp.map(function(k){ return [k, nomeMes(k)]; }).concat(anosOp.map(function(a){ return ["ANO:"+a, "Total "+a]; }))});
  return e(Guarda,{c:c}, e("div",{className:PADRAO_BLOCOS+" -mb-2 -ml-3 -mr-2 -mt-5 flex flex-col gap-1.5 pl-0 md:-mb-3 md:-ml-5 md:-mr-3 md:pl-0"},
    linhas.length===0 ? e("p",{className:"rounded-lg border-2 border-[var(--bloco-titulo)] bg-card/60 px-3 py-4 text-center text-[13px]"}, "Nenhuma pessoa ativa. Crie em Configurações.") :
      e(BlocoPainel,{titulo:"Financeiro familiar", acao:seletor, compacto:false, cls:COMPACTA},
        e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true, totalRodape:rodape, vazio:"Nenhuma pessoa.", cabAcima:[[{t:"", span:1}, {t:"Pró-labore", span:3}, {t:"Contas", span:4}, {t:"Pix revendedora", span:3}, {t:"", span:1}]],   // linha de cima agrupa as colunas: Pró-labore, Contas e Pix revendedora (Marcus, 22/11/2026)
         
          detalhe:function(l){ return e(DetHome,{ff:ff, l:l, ym:ym, ANO:ANO, ir:ir}); }}))));
}

// ───────────────── Alertas ─────────────────
function ModalPagar(p){
  var c = p.c, x = p.x, st = useState({paraQuem:(x.conta.rateio && x.conta.rateio.length ? FAMILIA4 : x.conta.personaId), valor:fmtN(x.restante), em:hojeIso(), forma:"PIX", contaTxt:contaLabel(c.ff, x.conta.contaBancId), obs:"", dividir:false, linhas:[{valor:"", forma:"PIX", contaTxt:""}, {valor:"", forma:"Dinheiro", contaTxt:""}]}), f = st[0], set = function(o){ st[1](Object.assign({}, f, o)); };
  var somaL = r2(f.linhas.reduce(function(t, l){ return t+num(l.valor); }, 0)), falta = r2(x.restante-somaL);
  var setL = function(i, o){ set({linhas:f.linhas.map(function(l, j){ return j===i ? Object.assign({}, l, o) : l; })}); };
  var pagar = function(){ var atual = x.conta.rateio && x.conta.rateio.length ? FAMILIA4 : x.conta.personaId; if(f.paraQuem && f.paraQuem!==atual) acao(c, "conta_set", {id:x.conta.id, patch:{personaId:f.paraQuem}});
    if(f.dividir) acao(c, "parc_baixa_multipla", {id:x.conta.id, ym:x.ym, em:f.em, linhas:f.linhas.map(function(l){ return {valor:num(l.valor), forma:l.forma, contaTxt:l.contaTxt}; })});
    else acao(c, "parc_baixa", {id:x.conta.id, ym:x.ym, valor:num(f.valor), em:f.em, forma:f.forma, contaTxt:f.contaTxt, obs:f.obs}); p.fechar(); };
  return e(Modal,{t:"Pagar · "+x.conta.descricao, sub:nomeMes(x.ym)+" · vence "+br(x.venc)+" · falta "+BK(x.restante)+(x.pago>0 ? " (já pago "+BK(x.pago)+")" : ""), fechar:p.fechar},
    e("datalist",{id:"ff-contas"}, c.ff.contasBanc.map(function(b){ return e("option",{key:b.id, value:contaLabel(c.ff, b.id)}); })),
    e("label",{className:"flex cursor-pointer items-center gap-2 text-[13px] font-semibold"}, e("input",{type:"checkbox", checked:f.dividir, className:"size-4", onChange:function(ev){ set({dividir:ev.target.checked}); }}), "Dividir entre formas de pagamento"),
    !f.dividir ? e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"},
      e(Campo,{rot:"Valor pago (R$)"}, e(Txt,{value:f.valor, label:"Valor", onChange:function(v){ set({valor:v.replace(/[^\d,.]/g,"")}); }})), e(Campo,{rot:"Data do pagamento"}, e(Txt,{value:f.em, type:"date", label:"Data", onChange:function(v){ set({em:v}); }})),
      e(Campo,{rot:"Forma"}, e(Sel,{value:f.forma, label:"Forma", className:"w-full", onChange:function(v){ set({forma:v}); }}, FORMAS.map(function(k){ return e("option",{key:k, value:k}, k); }))), e(Campo,{rot:"Conta utilizada"}, e(Txt,{value:f.contaTxt, list:"ff-contas", label:"Conta", onChange:function(v){ set({contaTxt:v}); }})),
      e(Campo,{rot:"Observação", className:"sm:col-span-2"}, e(Txt,{value:f.obs, label:"Observação", onChange:function(v){ set({obs:v}); }}))) :
    e("div",{className:"flex flex-col gap-2"}, f.linhas.map(function(l, i){ return e("div",{key:i, className:"grid grid-cols-[7rem_1fr_1fr] gap-2"}, e(Txt,{value:l.valor, ph:"Valor", label:"Valor "+(i+1), onChange:function(v){ setL(i, {valor:v.replace(/[^\d,.]/g,"")}); }}),
        e(Sel,{value:l.forma, label:"Forma", className:"w-full", onChange:function(v){ setL(i, {forma:v}); }}, FORMAS.map(function(k){ return e("option",{key:k, value:k}, k); })), e(Txt,{value:l.contaTxt, list:"ff-contas", ph:"Conta", label:"Conta", onChange:function(v){ setL(i, {contaTxt:v}); }})); }),
      e("div",{className:"flex items-center justify-between"}, e(Btn,{v:"ghost", sm:true, onClick:function(){ set({linhas:f.linhas.concat([{valor:"", forma:"PIX", contaTxt:""}])}); }}, "+ Outra forma"),
        e("span",{className:"text-[13px] "+(Math.abs(falta)<0.005 ? "text-success" : "text-warning")}, Math.abs(falta)<0.005 ? "✓ Soma certa" : "Falta distribuir "+BK(falta)))),
    e(Campo,{rot:"Para quem entra este pagamento"}, e(Sel,{value:f.paraQuem, label:"Para quem entra", className:"w-full", onChange:function(v){ set({paraQuem:v}); }}, e("option",{value:FAMILIA4}, "Família (divide igual entre os "+membrosFamilia(c.ff).length+")"), c.ff.personas.map(function(q){ return e("option",{key:q.id, value:q.id}, q.nome); }))),
    e("div",{className:"flex justify-end gap-2 pt-1"}, e(Btn,{v:"ghost", onClick:p.fechar}, "Cancelar"), e(Btn,{v:"primary", onClick:pagar}, "Registrar pagamento")));
}
function FormConta(p){   // lançar ou editar conta
  var c = p.c, ff = c.ff, x = p.x, nova = !x;
  var st = useState({personaId:x ? (x.rateio && x.rateio.length ? FAMILIA4 : x.personaId) : (ff.personas[0]||{}).id||"", descricao:x ? x.descricao : "", categoria:x ? x.categoria : "OUTROS", contaBancId:x ? x.contaBancId : "", dia:x ? String(x.dia) : "10", forma:x ? x.forma : "PIX", beneficiario:x ? x.beneficiario : "", obs:x ? x.obs : "",
    recorrencia:"unica", mesInicio:hojeYm(), mesFim:somaMes(hojeYm(), 5), valor:"", estAte:"", estValor:""}), f = st[0], set = function(o){ st[1](Object.assign({}, f, o)); };
  var salvar = function(){ if(nova) acao(c, "conta_add", {personaId:f.personaId, descricao:f.descricao, categoria:f.categoria, contaBancId:f.contaBancId, dia:Number(f.dia), forma:f.forma, beneficiario:f.beneficiario, obs:f.obs, recorrencia:f.recorrencia, mesInicio:f.mesInicio, mesFim:f.mesFim, valor:num(f.valor)});
    else acao(c, "conta_set", {id:x.id, patch:{personaId:f.personaId, descricao:f.descricao, categoria:f.categoria, contaBancId:f.contaBancId, dia:Number(f.dia)||1, forma:f.forma, beneficiario:f.beneficiario, obs:f.obs}}); p.fechar(); };
  var ctas = ff.contasBanc.filter(function(b){ return b.ativo; });
  return e(Modal,{t:nova ? "Lançar conta" : "Editar conta", sub:nova ? "Cria as parcelas dos meses na hora." : "Vale para todas as parcelas. Para mudar o valor de um mês, use o lápis da linha.", fechar:p.fechar},
    e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"},
      e(Campo,{rot:"Para quem entra"}, e(Sel,{value:f.personaId, label:"Para quem entra", className:"w-full", onChange:function(v){ set({personaId:v}); }}, e("option",{value:FAMILIA4}, "Família (divide entre os "+membrosFamilia(ff).length+")"), ff.personas.map(function(q){ return e("option",{key:q.id, value:q.id}, q.nome); }))),
      e(Campo,{rot:"Categoria"}, e(Sel,{value:f.categoria, label:"Categoria", className:"w-full", onChange:function(v){ set({categoria:v}); }}, ff.categorias.map(function(k){ return e("option",{key:k.chave, value:k.chave}, k.nome); }))),
      e(Campo,{rot:"Descrição", className:"sm:col-span-2"}, e(Txt,{value:f.descricao, label:"Descrição", onChange:function(v){ set({descricao:v}); }})),
      e(Campo,{rot:"Conta pagadora"}, e(Sel,{value:f.contaBancId, label:"Conta pagadora", className:"w-full", onChange:function(v){ set({contaBancId:v}); }}, e("option",{value:""}, "Não definida"), ctas.map(function(b){ return e("option",{key:b.id, value:b.id}, contaLabel(ff, b.id)); }))),
      e(Campo,{rot:"Dia do vencimento"}, e(Txt,{value:f.dia, label:"Dia", className:"w-28 text-center", onChange:function(v){ set({dia:v.replace(/\D/g,"").slice(0,2)}); }})),
      e(Campo,{rot:"Forma de pagamento"}, e(Sel,{value:f.forma, label:"Forma", className:"w-full", onChange:function(v){ set({forma:v}); }}, FORMAS.map(function(k){ return e("option",{key:k, value:k}, k); }))),
      e(Campo,{rot:"Beneficiário"}, e(Txt,{value:f.beneficiario, label:"Beneficiário", onChange:function(v){ set({beneficiario:v}); }})),
      e(Campo,{rot:"Observação", className:"sm:col-span-2"}, e(Txt,{value:f.obs, label:"Observação", onChange:function(v){ set({obs:v}); }})),
      nova && e(React.Fragment,null,
        e(Campo,{rot:"Recorrência"}, e(Sel,{value:f.recorrencia, label:"Recorrência", className:"w-full", onChange:function(v){ set({recorrencia:v}); }}, e("option",{value:"unica"}, "Única (1 mês)"), e("option",{value:"parcelada"}, "Parcelada (vários meses)"), e("option",{value:"fixa"}, "Fixa (24 meses, dá para estender)"))),
        e(Campo,{rot:"Valor de cada mês (R$)"}, e(Txt,{value:f.valor, label:"Valor", onChange:function(v){ set({valor:v.replace(/[^\d,.]/g,"")}); }})),
        e(Campo,{rot:"Começa em"}, e(Txt,{value:f.mesInicio, type:"month", label:"Início", onChange:function(v){ set({mesInicio:v}); }})), f.recorrencia==="parcelada" && e(Campo,{rot:"Termina em"}, e(Txt,{value:f.mesFim, type:"month", label:"Fim", onChange:function(v){ set({mesFim:v}); }})))),
    !nova && e("div",{className:"flex flex-col gap-2 rounded-xl bg-black/25 p-3"}, e("b",{className:"text-[13px]"}, "Estender a conta"), e("div",{className:"flex flex-wrap items-end gap-2"},
      e(Campo,{rot:"Até (vazio = mais 24 meses)"}, e(Txt,{value:f.estAte, type:"month", label:"Até", className:"w-44", onChange:function(v){ set({estAte:v}); }})), e(Campo,{rot:"Valor das novas parcelas"}, e(Txt,{value:f.estValor, label:"Valor", className:"w-36", onChange:function(v){ set({estValor:v.replace(/[^\d,.]/g,"")}); }})),
      e(Btn,{v:"secondary", sm:true, disabled:!(num(f.estValor)>0), onClick:function(){ acao(c, "conta_estender", {id:x.id, ateMes:f.estAte||null, valor:num(f.estValor)}); p.fechar(); }}, "Estender"))),
    e("div",{className:"flex justify-end gap-2 pt-1"}, e(Btn,{v:"ghost", onClick:p.fechar}, "Cancelar"), e(Btn,{v:"primary", disabled:!f.descricao.trim() || (nova && !(num(f.valor)>0)), onClick:salvar}, nova ? "Lançar" : "Salvar")));
}
function AbaFfContas(){
  var c = useFF(), ff = c.ff, es = useState({ym:hojeYm(), pessoa:"", cat:"", status:"", busca:""}), f = es[0], set = function(o){ es[1](Object.assign({}, f, o)); };
  var md = useState(null), modal = md[0], setModal = md[1], nt = useState({origem:"", destino:"", valor:"", data:hojeIso()}), tr = nt[0], setTr = nt[1];
  var q = f.busca.trim().toLowerCase();
  var lista = parcelasDe(ff, f.ym ? {ym:f.ym} : {yms:janela()}).filter(function(x){ return x.status!=="PAGO" && (!f.pessoa || daPessoa(x.conta, f.pessoa)) && (!f.cat || x.conta.categoria===f.cat) &&
    (!f.status || (f.status==="atrasado" ? x.atrasada : f.status==="parcial" ? x.status==="PARCIAL" : (!x.atrasada))) && (!q || (x.conta.descricao+" "+x.conta.beneficiario+" "+x.conta.obs).toLowerCase().indexOf(q)>=0 || casaValor(f.busca.trim(), x.valor) || casaValor(f.busca.trim(), x.restante)); });
  var totR = r2(lista.reduce(function(t, x){ return t+x.restante; }, 0)), atr = r2(lista.filter(function(x){ return x.atrasada; }).reduce(function(t, x){ return t+x.restante; }, 0));
  var trans = ff.transf.filter(function(t){ return !f.ym || t.data.slice(0,7)===f.ym; }).sort(function(a, b){ return b.data.localeCompare(a.data); });
  var cbs = ff.contasBanc.filter(function(b){ return b.ativo; });
  var pend = lista.filter(function(x){ return x.status==="PENDENTE"; }), parc = lista.filter(function(x){ return x.status==="PARCIAL"; }), atrL = lista.filter(function(x){ return x.atrasada; });
  var somaR = function(l){ return r2(l.reduce(function(s, x){ return s+x.restante; }, 0)); };
  var filtrando = !!(f.pessoa || f.cat || f.status || f.busca.trim() || f.ym!==hojeYm());
  var op = function(l, todos){ return [["", todos]].concat(l); };
  return e(Guarda,{c:c}, e(Pagina,null,
    e(PageHead,{t:"Contas a pagar da família"}, e(Botao,{principal:true, onClick:function(){ setModal({tipo:"conta"}); }}, "+ Lançar conta")),
    e("div",{className:"grid grid-cols-1 items-start gap-2.5 lg:grid-cols-[340px_minmax(0,1fr)]"},
      e(BlocoResumo,{t:"Resumo · "+(f.ym ? nomeMes(f.ym) : "todos os meses"), compacto:true, cab:["Situação", "Falta pagar", "Parcelas"], rodape:{r:"Total", v:BK(totR), p:String(lista.length)}, linhas:[
        {r:"Pendentes", v:BK(somaR(pend)), p:String(pend.length)}, {r:"Parciais", v:BK(somaR(parc)), p:String(parc.length)}, {r:"Atrasadas", v:BK(atr), p:String(atrL.length), cor:atr>0 ? "ruim" : "ok", pcor:atr>0 ? "ruim" : undefined}]}),
      e(BlocoFiltros,{onLimpar:filtrando ? function(){ set({ym:hojeYm(), pessoa:"", cat:"", status:"", busca:""}); } : undefined},
        e(CampoSel,{t:"Mês", id:"ff-mes", value:f.ym, onChange:function(v){ set({ym:v}); }, opcoes:op(janela().map(function(k){ return [k, nomeMes(k)]; }), "Todos os meses")}),
        e(CampoSel,{t:"Pessoa", id:"ff-pessoa", value:f.pessoa, onChange:function(v){ set({pessoa:v}); }, opcoes:op(ff.personas.map(function(p){ return [p.id, p.nome]; }), "Todas as pessoas")}),
        e(CampoSel,{t:"Categoria", id:"ff-cat", value:f.cat, onChange:function(v){ set({cat:v}); }, opcoes:op(ff.categorias.map(function(k){ return [k.chave, k.nome]; }), "Todas as categorias")}),
        e(CampoSel,{t:"Situação", id:"ff-sit", value:f.status, onChange:function(v){ set({status:v}); }, opcoes:[["", "Qualquer situação"], ["pendente", "Pendente"], ["parcial", "Parcial"], ["atrasado", "Atrasado"]]}),
        e("div",{className:"col-span-2 min-w-0"}, e(Rotulo,{t:"Buscar", id:"ff-busca"}), e("input",{id:"ff-busca", type:"search", value:f.busca, placeholder:"Descrição, beneficiário ou valor", className:CAMPO, onChange:function(ev){ set({busca:ev.target.value}); }})))),
    e(Bloco,{t:"A pagar", dir:e("span",{className:"tabular-nums"}, (f.ym ? nomeMes(f.ym) : "Todos os meses")+" · "+BK(totR))},
      lista.length===0 ? e("p",{className:"py-3 text-center text-[13px]"}, "Nada para pagar neste filtro.") :
      e(TabelaP,{minW:1640, cols:[{t:"Vence", w:90, c:true}, {t:"Pessoa", w:190, c:true}, {t:"Descrição", w:320, c:true}, {t:"Categoria", w:120, c:true}, {t:"Beneficiário", w:160, c:true}, {t:"Valor", w:120, c:true}, {t:"Falta", w:120, c:true}, {t:"Situação", w:110, c:true}, {t:"Observação", w:230, c:true}, {t:"Ações", w:220, c:true}]},
        lista.map(function(x){ return e(Tr,{key:x.chave},
          e(Td,{c:true}, br(x.venc).slice(0,5)+(f.ym ? "" : "/"+x.ym.slice(2,4))),
          e(Td,{c:true, title:pessoaNome(ff, x.conta.personaId)}, e("span",{className:"inline-flex items-center justify-center gap-1.5"}, e("span",{className:"size-2.5 rounded-full", style:{background:corPessoa(ff, x.conta.personaId)}}), pessoaNome(ff, x.conta.personaId)+(x.conta.rateio && x.conta.rateio.length ? " ÷"+x.conta.rateio.length : ""))),
          e(Td,{c:true, forte:true}, x.conta.descricao), e(Td,{c:true}, catNome(ff, x.conta.categoria)), e(Td,{c:true}, x.conta.beneficiario||"—"),
          e(Td,{c:true}, BK(x.valor)), e(Td,{c:true, forte:true, title:x.pago>0 ? "Já pago "+BK(x.pago) : undefined}, BK(x.restante)), e(Td,{c:true}, statusChip(x)),
          e(Td,{c:true}, x.conta.obs||"—"),
          e(Td,{c:true}, e("div",{className:"flex items-center justify-center gap-1.5"}, e(Botao,{principal:true, onClick:function(){ setModal({tipo:"pagar", x:x}); }}, "Pagar"), iconBtn("pencil-simple", "Corrigir o valor deste mês", function(){ var v = window.prompt("Novo valor de "+nomeMes(x.ym)+" (R$):", fmtN(x.valor)); if(v!==null && num(v)>0) acao(c, "parc_valor", {id:x.conta.id, ym:x.ym, valor:num(v)}); }),
            iconBtn("gear-six", "Editar a conta", function(){ setModal({tipo:"conta", x:x.conta}); }), iconBtn("prohibit", "Encerrar a conta: tira as parcelas em aberto e guarda o histórico pago", function(){ if(window.confirm("Encerrar \""+x.conta.descricao+"\"? As parcelas em aberto saem. O que já foi pago continua no histórico.")) acao(c, "conta_encerrar", {id:x.conta.id}); }), iconBtn("trash", "Excluir a conta inteira", function(){ if(window.confirm("Excluir \""+x.conta.descricao+"\" com TODAS as parcelas e pagamentos?")) acao(c, "conta_del", {id:x.conta.id}); }, true)))); }))),
    e(BlocoBarra,{cor:"azul", t:"Transferências entre contas", sub:"só um registro: não entra nos totais"}, e("div",{className:"flex flex-col gap-3 p-4"},
      e("div",{className:"flex flex-wrap items-end gap-3"}, e(Campo,{rot:"De"}, e(Sel,{value:tr.origem, label:"Origem", className:"w-56", onChange:function(v){ setTr(Object.assign({}, tr, {origem:v})); }}, e("option",{value:""}, "Escolha…"), cbs.map(function(b){ return e("option",{key:b.id, value:b.id}, contaLabel(ff, b.id)); }))),
        e(Campo,{rot:"Para"}, e(Sel,{value:tr.destino, label:"Destino", className:"w-56", onChange:function(v){ setTr(Object.assign({}, tr, {destino:v})); }}, e("option",{value:""}, "Escolha…"), cbs.map(function(b){ return e("option",{key:b.id, value:b.id}, contaLabel(ff, b.id)); }))),
        e(Campo,{rot:"Valor (R$)"}, e(Txt,{value:tr.valor, label:"Valor", className:"w-32", onChange:function(v){ setTr(Object.assign({}, tr, {valor:v.replace(/[^\d,.]/g,"")})); }})), e(Campo,{rot:"Data"}, e(Txt,{value:tr.data, type:"date", label:"Data", className:"w-44", onChange:function(v){ setTr(Object.assign({}, tr, {data:v})); }})),
        e(Btn,{v:"secondary", disabled:!tr.origem || !tr.destino || !(num(tr.valor)>0), onClick:function(){ acao(c, "transf_add", {origem:tr.origem, destino:tr.destino, valor:num(tr.valor), data:tr.data}); setTr(Object.assign({}, tr, {valor:""})); }}, "Anotar")),
      cbs.length<2 && e("p",{className:"text-[12.5px] text-muted-foreground"}, "Cadastre ao menos duas contas bancárias em Configurações para anotar transferências."),
      trans.length>0 && e("div",{className:"flex flex-col divide-y divide-white/10"}, trans.map(function(t){ return e("div",{key:t.id, className:"flex flex-wrap items-center justify-between gap-2 py-2 text-[13.5px]"}, e("span",null, br(t.data)+" · "+contaLabel(ff, t.origem)+" → "+contaLabel(ff, t.destino)+" · ", e("b",{className:MONO}, BK(t.valor))),
        e("span",{className:"flex items-center gap-2"}, t.status==="PAGO" ? e("span",{className:"rounded-full bg-success/20 px-2.5 py-0.5 text-[11.5px] font-bold text-success"}, "Feita em "+br(t.pagoEm)) : e(Btn,{v:"secondary", sm:true, onClick:function(){ acao(c, "transf_baixa", {id:t.id}); }}, "Dar baixa"), iconBtn("trash", "Excluir", function(){ acao(c, "transf_del", {id:t.id}); }, true))); })))),
    modal && modal.tipo==="pagar" && e(ModalPagar,{key:modal.x.chave, c:c, x:modal.x, fechar:function(){ setModal(null); }}),
    modal && modal.tipo==="conta" && e(FormConta,{key:modal.x ? modal.x.id : "nova", c:c, x:modal.x, fechar:function(){ setModal(null); }})));
}

// ───────────────── Contas pagas ─────────────────
function AbaFfPagas(){
  var c = useFF(), ff = c.ff, es = useState({ym:hojeYm(), pessoa:"", cat:"", forma:"", conta:"", busca:""}), f = es[0], set = function(o){ es[1](Object.assign({}, f, o)); }, ed = useState(null), edit = ed[0], setEdit = ed[1];
  var q = f.busca.trim().toLowerCase(), qc = f.conta.trim().toLowerCase();
  var lista = parcelasDe(ff, f.ym ? {ym:f.ym} : {yms:janela()}).filter(function(x){ return x.pago>0 && (!f.pessoa || daPessoa(x.conta, f.pessoa)) && (!f.cat || x.conta.categoria===f.cat) && (!f.forma || x.pagamentos.some(function(g){ return g.forma===f.forma; })) &&
    (!qc || x.pagamentos.some(function(g){ return String(g.conta||"").toLowerCase().indexOf(qc)>=0; })) && (!q || (x.conta.descricao+" "+x.conta.beneficiario).toLowerCase().indexOf(q)>=0 || casaValor(f.busca.trim(), x.valor) || casaValor(f.busca.trim(), x.pago)); });
  var tot = r2(lista.reduce(function(t, x){ return t+x.pago; }, 0)), por = function(fn){ var o = {}; lista.forEach(function(x){ var k = fn(x); o[k] = r2((o[k]||0)+x.pago); }); return Object.keys(o).map(function(k){ return [k, o[k]]; }).sort(function(a, b){ return b[1]-a[1]; }); };
  var barras = function(t, dados, cor){ var max = Math.max.apply(null, dados.map(function(d){ return d[1]; }).concat([1])); return e(BlocoBarra,{cor:"azul", t:t}, e("div",{className:"flex flex-col gap-2 p-4"}, dados.length===0 ? e("p",{className:"text-[13px] text-muted-foreground"}, "Sem pagamentos.") : dados.map(function(d){ return e("div",{key:d[0], className:"grid grid-cols-[10rem_1fr_7rem] items-center gap-2 text-[13px]"}, e("span",{className:"truncate"}, d[0]), e("span",{className:"h-3 overflow-hidden rounded-full bg-white/15"}, e("span",{className:"block h-full rounded-full", style:{width:Math.max(3, d[1]/max*100)+"%", background:"linear-gradient(90deg,#be185d,#f472b6)"}})), e("b",{className:MONO+" text-right"}, BK(d[1]))); }))); };
  return e(Guarda,{c:c}, e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Contas pagas", sub:"O que já foi pago (inclusive o que foi pago em parte). Para corrigir um pagamento ou desfazer, use os botões da linha. Mês passado travado só se libera em Configurações."}),
    e("div",{className:"grid grid-cols-2 gap-3"}, e(Tile,{t:"Total pago", v:BK(tot), cor:"#4ADE80", sub:lista.length+" parcelas"}), e(Tile,{t:"Maior categoria", v:por(function(x){ return catNome(ff, x.conta.categoria); })[0] ? por(function(x){ return catNome(ff, x.conta.categoria); })[0][0] : "—", cor:"#F472B6"})),
    e("div",{className:"flex flex-wrap items-end gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-[#EC4899]/30"}, e(MesSel,{ym:f.ym, set:function(v){ set({ym:v}); }, todos:true}),
      e(Sel,{value:f.pessoa, label:"Pessoa", className:"w-44", onChange:function(v){ set({pessoa:v}); }}, e("option",{value:""}, "Todas as pessoas"), ff.personas.map(function(p){ return e("option",{key:p.id, value:p.id}, p.nome); })),
      e(Sel,{value:f.cat, label:"Categoria", className:"w-48", onChange:function(v){ set({cat:v}); }}, e("option",{value:""}, "Todas as categorias"), ff.categorias.map(function(k){ return e("option",{key:k.chave, value:k.chave}, k.nome); })),
      e(Sel,{value:f.forma, label:"Forma", className:"w-44", onChange:function(v){ set({forma:v}); }}, e("option",{value:""}, "Todas as formas"), FORMAS.map(function(k){ return e("option",{key:k, value:k}, k); })),
      e(Txt,{value:f.conta, ph:"Conta utilizada", label:"Conta", className:"w-44", onChange:function(v){ set({conta:v}); }}), e(Txt,{value:f.busca, ph:"Buscar descrição ou valor", label:"Buscar", className:"w-56", onChange:function(v){ set({busca:v}); }})),
    e("div",{className:"grid grid-cols-1 gap-4 lg:grid-cols-2"}, barras("Por categoria", por(function(x){ return catNome(ff, x.conta.categoria); })), barras("Por pessoa", por(function(x){ return pessoaNome(ff, x.conta.personaId); }))),
    e(BlocoBarra,{cor:"azul", t:"Pagamentos", sub:f.ym ? nomeMes(f.ym) : "todos os meses", dir:BK(tot)}, lista.length===0 ? e("p",{className:"px-4 py-8 text-center text-[13.5px] text-muted-foreground"}, "Nenhum pagamento neste filtro.") :
      e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Pago em"), th("Pessoa"), th("Descrição"), th("Categoria"), th("Forma"), th("Conta utilizada"), th("Pago"), th("")])),
        e("tbody",null, lista.map(function(x){ var g = x.pagamentos[x.pagamentos.length-1]||{};
          return e("tr",{key:x.chave, className:"border-b border-border/60"}, e("td",{className:TD}, br(g.em)), e("td",{className:TD}, pessoaNome(ff, x.conta.personaId)+(x.conta.rateio && x.conta.rateio.length ? " ÷"+x.conta.rateio.length : "")), e("td",{className:TD+" font-semibold"}, x.conta.descricao, e("span",{className:"block text-[11.5px] font-normal text-muted-foreground"}, nomeMes(x.ym)+(x.status==="PARCIAL" ? " · Parcial: de "+BK(x.valor) : ""))),
            e("td",{className:TD}, catNome(ff, x.conta.categoria)), e("td",{className:TD}, g.forma||"—"), e("td",{className:TD+" text-[12.5px]"}, g.conta||"—"), e("td",{className:TD+" font-bold "+MONO}, BK(x.pago)),
            e("td",{className:TD}, e("div",{className:"flex gap-1.5"}, x.status==="PAGO" && iconBtn("pencil-simple", "Editar o pagamento", function(){ setEdit(x); }), iconBtn("trash", "Excluir o pagamento (volta para Contas a pagar)", function(){ if(window.confirm("Excluir TODOS os pagamentos de \""+x.conta.descricao+"\" ("+nomeMes(x.ym)+")? A parcela volta para Contas a pagar.")) acao(c, "parc_reverter", {id:x.conta.id, ym:x.ym}); }, true)))); }))))),
    edit && e(EditarPago,{key:edit.chave, c:c, x:edit, fechar:function(){ setEdit(null); }})));
}
function EditarPago(p){
  var g = p.x.pagamentos[p.x.pagamentos.length-1]||{}, st = useState({valor:fmtN(p.x.pago), em:g.em||hojeIso(), forma:g.forma||"PIX", contaTxt:g.conta||"", obs:g.obs||""}), f = st[0], set = function(o){ st[1](Object.assign({}, f, o)); };
  return e(Modal,{t:"Editar pagamento · "+p.x.conta.descricao, sub:nomeMes(p.x.ym)+" · a divisão anterior (se houve) se perde", fechar:p.fechar},
    e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"}, e(Campo,{rot:"Valor (R$)"}, e(Txt,{value:f.valor, label:"Valor", onChange:function(v){ set({valor:v.replace(/[^\d,.]/g,"")}); }})), e(Campo,{rot:"Data"}, e(Txt,{value:f.em, type:"date", label:"Data", onChange:function(v){ set({em:v}); }})),
      e(Campo,{rot:"Forma"}, e(Sel,{value:f.forma, label:"Forma", className:"w-full", onChange:function(v){ set({forma:v}); }}, FORMAS.map(function(k){ return e("option",{key:k, value:k}, k); }))), e(Campo,{rot:"Conta utilizada"}, e(Txt,{value:f.contaTxt, label:"Conta", onChange:function(v){ set({contaTxt:v}); }})),
      e(Campo,{rot:"Observação", className:"sm:col-span-2"}, e(Txt,{value:f.obs, label:"Observação", onChange:function(v){ set({obs:v}); }}))),
    e("div",{className:"flex justify-end gap-2"}, e(Btn,{v:"ghost", onClick:p.fechar}, "Cancelar"), e(Btn,{v:"primary", onClick:function(){ acao(p.c, "parc_pago_edit", {id:p.x.conta.id, ym:p.x.ym, valor:num(f.valor), em:f.em, forma:f.forma, contaTxt:f.contaTxt, obs:f.obs}); p.fechar(); }}, "Salvar")));
}

// ───────────────── PIX revendedoras ─────────────────
// Total do dia só quando o Marcus liga no filtro "Com total por dia" (pedido de 04/11/2026: os PIX vêm em sequência). Refeita em 04/11/2026 (Marcus: compacta, sem bolinhas coloridas, sem topo gigante): só peças do padrão (Bloco com barra dourada, TabelaP, Botao). Resumo escrito em UMA linha, formulário numa linha, tabela com o TOTAL DO DIA dentro dela (linha de total), tudo em branco.
function DivPix(p){
  var x = p.x, cbs = p.cbs, ff = p.ff, nd = useState({tipo:p.tipo, valor:fmtN(x.valor), conta:x.contaId||"", data:x.data, obs:(x.div && x.div.obs) || ""}), f = nd[0], set = function(o){ nd[1](Object.assign({}, f, o)); };
  var salvar = function(){ if(f.tipo==="valor" && !(num(f.valor)>0)) return; if(f.tipo==="conta" && !f.conta) return; if(f.tipo==="data" && !f.data) return; acao(p.c, "pix_div", {id:x.id, tipo:f.tipo, valor:num(f.valor), contaId:f.conta, data:f.data, obs:f.obs}); p.onFecha(); };
  var antes = x.valorOriginal!=null || x.contaOriginal!=null || x.dataOriginal!=null;
  return e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-black/50", onClick:p.onFecha}, e("div",{className:"w-64 rounded-md border border-border bg-background p-3 shadow-lg", onClick:function(ev){ ev.stopPropagation(); }},
    e("p",{className:"pb-2 text-center text-[13px] font-semibold"}, "Divergência de "+(f.tipo==="conta" ? "conta" : f.tipo==="data" ? "data" : "valor")),
    antes && e("p",{className:"pb-2 text-center text-[13px]"}, "Informado antes: "+(x.valorOriginal!=null ? BK(x.valorOriginal) : BK(x.valor))+" · "+(x.contaOriginal!=null ? contaLabel(ff, x.contaOriginal) : contaLabel(ff, x.contaId) || "sem conta")+(x.dataOriginal!=null ? " · "+br(x.dataOriginal) : "")),
    f.tipo==="valor"
      ? e("div",null, e(Rotulo,{t:"Valor que entrou (R$)"}), e("input",{value:f.valor, "aria-label":"Valor real", className:CAMPO+" text-center tabular-nums", onChange:function(ev){ set({valor:ev.target.value.replace(/[^\d,.]/g,"")}); }}))
      : f.tipo==="data" ? e("div",null, e(Rotulo,{t:"Data em que entrou"}), e("input",{type:"date", value:f.data, "aria-label":"Data real", className:CAMPO+" text-center", onChange:function(ev){ set({data:ev.target.value}); }}))
      : e("div",null, e(Rotulo,{t:"Conta em que entrou"}), e("select",{value:f.conta, "aria-label":"Conta certa", className:CAMPO, onChange:function(ev){ set({conta:ev.target.value}); }}, e("option",{value:""}, "Escolha a conta"), cbs.map(function(b){ return e("option",{key:b.id, value:b.id}, contaLabel(ff, b.id)); }))),
    e("div",{className:"pt-2"}, e(Rotulo,{t:"Observação"}), e("input",{value:f.obs, "aria-label":"Observação", className:CAMPO, onChange:function(ev){ set({obs:ev.target.value}); }})),
    e("div",{className:"flex justify-center gap-2 pt-3"}, e(Botao,{principal:true, onClick:salvar}, "Salvar"), e(Botao,{onClick:p.onFecha}, "Cancelar"))));
}
function CartaoPix(p){
  var c = p.c, ff = c.ff, pe = p.p, ym = p.ym, casa = !!p.casa, todos = ym==="TODOS" || casa, t = todos ? null : totaisPersona(ff, pe.id, ym), dv = todos ? null : pixDivisao(ff, pe.id, ym), nf = useState({data:hojeIso(), valor:"", origem:"", contaId:"", forma:"PIX"}), f = nf[0], setF = nf[1];
  var listaTodas = ff.pix.filter(function(x){ return (casa ? pixCasa(ff, x) : x.personaId===pe.id && !pixCasa(ff, x)) && (ym==="TODOS" || x.data.slice(0,7)===ym); }).sort(function(a, b){ return b.data.localeCompare(a.data); }), cbs = ff.contasBanc.filter(function(b){ return b.ativo && (casa ? (!!casaDe(ff, b.id) || b.personaId==="familia") : (!b.personaId || b.personaId===pe.id || b.prestadorId)); });
  var nab = useState(""), abre = nab[0], setAbre = nab[1], ab = abre ? abre.split("|") : [];
  var abrirDiv = function(id, tipo, el){ var r = el.getBoundingClientRect(); setAbre([id, tipo, Math.round(r.left), Math.round(r.bottom)].join("|")); };
  var rotAud = {CONFIRMADO:"Confirmado", PENDENTE:"Aguardando", NAOIDENT:"Não identificado", DIVERG:"Divergência"};
  var stDe = function(x){ return x.auditoria==="REJEITADO" ? "NAOIDENT" : (x.auditoria || "PENDENTE"); };
  var valSel = function(x){ var s = stDe(x); return s==="DIVERG" ? ((x.div && x.div.tipo)==="conta" ? "DIVC" : (x.div && x.div.tipo)==="data" ? "DIVD" : "DIVV") : s; };
  var contaDe = function(id){ return ff.contasBanc.find(function(b){ return b.id===id; }) || {}; };
  var prestDe = function(id){ var b = contaDe(id), pr = b.prestadorId && ff.prest.find(function(y){ return y.id===b.prestadorId; }), pe2 = !pr && b.personaId && ff.personas.find(function(y){ return y.id===b.personaId; }); return pr ? pr.nome : pe2 ? pe2.nome : "—"; };
  var nomeConta = function(id){ var b = contaDe(id), n = String(b.nome || "").replace(/^Conta\s+/i, ""), lo = n.toLowerCase(), bk = String(b.banco || "").toLowerCase(), k = bk ? lo.lastIndexOf(bk) : -1; if(k>0 && lo.slice(k).trim()===bk) n = n.slice(0, k).replace(/[\s—-]+$/, ""); n = n.replace(/\s*\([^)]*\)\s*$/, "").trim(); return n || "—"; };
  // FILTRO da lista (Lucas, 06/11/2026): as meninas conferem PIX por PIX; buscam por revendedora, valor, data ou conta e filtram por conta e por conferência. O total do cartão continua sendo o de todos os PIX.
  var nfl = useState({q:"", conta:"", conf:""}), fl = nfl[0], setFl = function(o){ nfl[1](Object.assign({}, fl, o)); };
  var semAc = function(t2){ return String(t2||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }, nq = semAc(fl.q);
  var lista = listaTodas.filter(function(x){ return (!nq || semAc((x.origem||"")+" "+BK(x.valor)+" "+x.valor+" "+br(x.data)+" "+(contaDe(x.contaId).banco||"")+" "+nomeConta(x.contaId)).indexOf(nq)>=0) && (!fl.conta || x.contaId===fl.conta) && (!fl.conf || stDe(x)===fl.conf); });
  var contasLista = []; listaTodas.forEach(function(x){ if(x.contaId && contasLista.indexOf(x.contaId)<0) contasLista.push(x.contaId); });
  var filtrando = !!(fl.q || fl.conta || fl.conf);
  var recTodos = r2(listaTodas.filter(function(x){ return stDe(x)!=="NAOIDENT"; }).reduce(function(s, x){ return s+x.valor; }, 0));
  // EDITAR o PIX na própria linha, só enquanto estiver "Aguardando" (Lucas, 18/11/2026)
  var ned = useState(null), ed = ned[0], setEd = ned[1], setE = function(o){ setEd(Object.assign({}, ed, o)); };
  var salvarEd = function(){ if(!(num(ed.valor)>0) || !ed.data) return; acao(c, "pix_editar", {id:ed.id, patch:{data:ed.data, valor:num(ed.valor), origem:ed.origem, contaId:ed.contaId}}); setEd(null); };
  var anotar = function(){ if(!(num(f.valor)>0) || !f.data) return; acao(c, "pix_add", {personaId:casa ? "familia" : pe.id, data:f.data, valor:num(f.valor), origem:f.origem, contaId:f.contaId, forma:f.forma}); setF(Object.assign({}, f, {valor:"", origem:""})); };
  var TC = "h-8 border-b border-border px-2.5 text-center text-[13px] tabular-nums";
  // linhas da tabela: cada dia com os seus PIX e, logo depois, a linha de TOTAL DO DIA (Anamaria, 03/11/2026)
  var linhas = [], dia = "", soma = 0, cont = 0, fecha = function(){ if(p.porDia && dia) linhas.push(e("tr",{key:"t"+dia, className:"border-t-2 border-border bg-white/5 font-semibold"}, e("td",{className:TC, colSpan:5}, "Total do dia "+br(dia)+(cont>1 ? " ("+cont+" PIX)" : "")), e("td",{className:TC}, BK(soma)), e("td",{className:TC, colSpan:2}, ""))); };
  lista.forEach(function(x){
    if(x.data!==dia){ fecha(); dia = x.data; soma = 0; cont = 0; }
    cont++;
    if(stDe(x)!=="NAOIDENT") soma = r2(soma+x.valor);
    linhas.push(e("tr",{key:x.id},
      e("td",{className:TC}, br(x.data)), e("td",{className:TC+" font-semibold"}, x.origem||"—"), e("td",{className:TC}, contaDe(x.contaId).banco||"—"), e("td",{className:TC}, nomeConta(x.contaId)), e("td",{className:TC}, casa ? (casaDe(ff, x.contaId) || prestDe(x.contaId)) : prestDe(x.contaId)),
      e("td",{className:TC+(stDe(x)==="NAOIDENT" ? " line-through opacity-60" : "")}, BK(x.valor)),
      e("td",{className:TC}, e("span",{className:"inline-flex items-center justify-center gap-2"},
        e("select",{value:valSel(x), disabled:c.leitura, "aria-label":"Conferência", className:CAMPO+" w-40! text-center", style:{textAlignLast:"center"}, onChange:function(ev){ var v = ev.target.value; if(v==="DIVV") abrirDiv(x.id, "valor", ev.target); else if(v==="DIVC") abrirDiv(x.id, "conta", ev.target); else if(v==="DIVD") abrirDiv(x.id, "data", ev.target); else acao(c, "pix_aud", {id:x.id, auditoria:v}); }},
          stDe(x)==="PENDENTE" && e("option",{value:"PENDENTE"}, "Aguardando"),
          e("option",{value:"CONFIRMADO"}, "Confirmado"), e("option",{value:"NAOIDENT"}, "Não identificado"), e("option",{value:"DIVV"}, "Divergência de valor"), e("option",{value:"DIVC"}, "Divergência de conta"), e("option",{value:"DIVD"}, "Divergência de data")),
        stDe(x)==="PENDENTE" && !c.leitura && iconBtn("pencil-simple", "Editar PIX", function(){ setEd({id:x.id, data:x.data, valor:fmtN(x.valor), origem:x.origem||"", contaId:x.contaId||""}); }),
        stDe(x)==="DIVERG" && !c.leitura && e("button",{type:"button", onClick:function(ev){ if(ab[0]===x.id) setAbre(""); else abrirDiv(x.id, (x.div && x.div.tipo) || "valor", ev.currentTarget); }, className:"rounded-md border border-border px-2 text-[11px] font-semibold hover:bg-white/10"}, "Ver"))),
      e("td",{className:TC}, c.leitura ? null : iconBtn("trash", "Excluir PIX", function(){ if(window.confirm("Excluir este PIX?")) acao(c, "pix_del", {id:x.id}); }, true))));
    if(ed && ed.id===x.id) linhas.push(e("tr",{key:x.id+"ed", className:"bg-white/5"}, e("td",{colSpan:8, className:"border-b border-border px-2.5 py-2"},
      e("div",{className:"grid grid-cols-2 items-end gap-x-3 gap-y-2 md:grid-cols-[150px_130px_minmax(0,1fr)_minmax(0,1fr)_auto]"},
        e("div",null, e(Rotulo,{t:"Data"}), e("input",{type:"date", value:ed.data, "aria-label":"Data", className:CAMPO+" text-center", onChange:function(ev){ setE({data:ev.target.value}); }})),
        e("div",null, e(Rotulo,{t:"Valor (R$)"}), e("input",{value:ed.valor, "aria-label":"Valor", className:CAMPO+" text-center tabular-nums", onChange:function(ev){ setE({valor:ev.target.value.replace(/[^d,.]/g,"")}); }, onKeyDown:function(ev){ if(ev.key==="Enter") salvarEd(); }})),
        e("div",null, e(Rotulo,{t:"Revendedora"}), e("input",{value:ed.origem, "aria-label":"Revendedora", className:CAMPO, onChange:function(ev){ setE({origem:ev.target.value}); }, onKeyDown:function(ev){ if(ev.key==="Enter") salvarEd(); }})),
        e("div",null, e(Rotulo,{t:"Conta que recebeu"}), e("select",{value:ed.contaId, "aria-label":"Conta que recebeu", className:CAMPO, onChange:function(ev){ setE({contaId:ev.target.value}); }}, e("option",{value:""}, "Sem conta definida"), cbs.concat(ed.contaId && !cbs.some(function(b){ return b.id===ed.contaId; }) ? [contaDe(ed.contaId)] : []).map(function(b){ return e("option",{key:b.id, value:b.id}, contaLabel(ff, b.id)); }))),
        e("span",{className:"inline-flex items-center gap-2"}, e(Botao,{principal:true, desabilitado:!(num(ed.valor)>0) || !ed.data, onClick:salvarEd}, "Salvar"), e(Botao,{onClick:function(){ setEd(null); }}, "Cancelar"))))));
  });
  fecha();
  var fechado = p.aberto===false;
  return e("div",{className:fechado ? "cursor-pointer" : "", onClick:fechado ? p.onToggle : undefined}, e(Bloco,{ouro:true, cls:fechado ? "[&>div:last-child]:hidden" : "", t:pe.nome, dir:e("span",{className:"inline-flex items-center gap-3 tabular-nums"}, (ym==="TODOS" ? "Todos os meses" : nomeMes(ym))+" · "+BK(todos ? recTodos : t.pix.recebido), p.aberto===true && e("button",{type:"button", onClick:p.onToggle, className:"rounded-md border border-[#1a1306]/40 px-2 text-[11px] font-semibold"}, "Recolher"))},
    listaTodas.length>0 && e("div",{className:"flex flex-wrap items-end gap-2 pb-2"},
      e("div",{className:"min-w-[10rem] flex-1"}, e(Rotulo,{t:"Buscar"}), e("input",{type:"search", value:fl.q, "aria-label":"Buscar na lista", placeholder:"Revendedora, valor, data ou conta", className:CAMPO, onChange:function(ev){ setFl({q:ev.target.value}); }})),
      e("div",{className:"w-52"}, e(Rotulo,{t:"Conta"}), e("select",{value:fl.conta, "aria-label":"Filtrar por conta", className:CAMPO, onChange:function(ev){ setFl({conta:ev.target.value}); }}, e("option",{value:""}, "Todas as contas"), contasLista.map(function(id){ return e("option",{key:id, value:id}, nomeConta(id)+(contaDe(id).banco ? " · "+contaDe(id).banco : "")); }))),
      e("div",{className:"w-44"}, e(Rotulo,{t:"Conferência"}), e("select",{value:fl.conf, "aria-label":"Filtrar por conferência", className:CAMPO, onChange:function(ev){ setFl({conf:ev.target.value}); }}, e("option",{value:""}, "Todas"), e("option",{value:"PENDENTE"}, "Aguardando"), e("option",{value:"CONFIRMADO"}, "Confirmado"), e("option",{value:"NAOIDENT"}, "Não identificado"), e("option",{value:"DIVERG"}, "Divergência"))),
      filtrando && e(Botao,{onClick:function(){ setFl({q:"", conta:"", conf:""}); }}, "Limpar"),
      e("span",{className:"pb-1.5 text-[13px] tabular-nums"}, lista.length+" de "+listaTodas.length+" PIX")),
    lista.length===0 ? e("p",{className:"py-3 text-center text-[13px]"}, filtrando ? "Nenhum PIX com esse filtro." : ym==="TODOS" ? "Nenhum PIX lançado." : "Nenhum PIX neste mês.")
    : e(TabelaP,{minW:1100, cols:[{t:"Data", w:90}, {t:"Revendedora"}, {t:"Banco", w:120}, {t:"Conta"}, {t:"Favorecido", w:170}, {t:"Valor", w:120}, {t:"Conferência", w:220}, {t:"", w:56}]}, linhas),
    ab.length>0 && lista.some(function(x){ return x.id===ab[0]; }) && e(DivPix,{key:abre, tipo:ab[1], x:lista.find(function(x){ return x.id===ab[0]; }), c:c, ff:ff, cbs:cbs, left:Math.max(8, Math.min(+ab[2], window.innerWidth-300)), top:Math.max(8, Math.min(+ab[3]+4, window.innerHeight-330)), onFecha:function(){ setAbre(""); }})));
}
// RESUMO NO TOPO DA TELA (Marcus, 04/11/2026): 3 blocos de todos os sócios juntos; filtrando um sócio, os blocos são só dele. Mês que já passou não mostra meta.
var ALT_RESUMO = 272;   // os 3 (ou 4) blocos do resumo têm a MESMA altura; a lista rola dentro (Marcus, 06/11/2026)
function ResumoPix(p){
  var c = p.c, ff = c.ff, ym = p.ym, todos = ym==="TODOS", pes = p.pes, atual = !todos && ym===hojeYm(), ids = {};
  pes.forEach(function(pe){ ids[pe.id] = 1; });
  var contaDe = function(id){ return ff.contasBanc.find(function(b){ return b.id===id; }) || {}; };
  var prestDe = function(id){ var b = contaDe(id), pr = b.prestadorId && ff.prest.find(function(y){ return y.id===b.prestadorId; }), pe2 = !pr && b.personaId && ff.personas.find(function(y){ return y.id===b.personaId; }); return pr ? pr.nome : pe2 ? pe2.nome : "—"; };
  var nomeContaR = function(id){ var b = contaDe(id), n = String(b.nome || "").replace(/^Conta\s+/i, ""), lo = n.toLowerCase(), bk = String(b.banco || "").toLowerCase(), k = bk ? lo.lastIndexOf(bk) : -1; if(k>0 && lo.slice(k).trim()===bk) n = n.slice(0, k).replace(/[\s—-]+$/, ""); return n.replace(/\s*\([^)]*\)\s*$/, "").trim(); };
  var rotuloFav = function(id){ if(!id || !contaDe(id).id) return "Sem conta definida"; if(casaDe(ff, id)) return casaDe(ff, id); var fav = prestDe(id), nc = nomeContaR(id), bk = contaDe(id).banco; return fav+(bk ? " · "+bk : "")+(nc && fav.toLowerCase().indexOf(nc.toLowerCase())<0 && nc.toLowerCase().indexOf(fav.toLowerCase())<0 && nc.toLowerCase().indexOf(String(bk||"").toLowerCase())<0 ? " · "+nc : ""); };
  var nomesFav = {}, casa = !!p.casa;
  var vl = ff.pix.filter(function(x){ return (casa ? pixCasa(ff, x) : ids[x.personaId] && !pixCasa(ff, x)) && (todos || x.data.slice(0,7)===ym) && x.auditoria!=="REJEITADO" && x.auditoria!=="NAOIDENT"; });
  var recL = r2(vl.reduce(function(s, x){ return s+x.valor; }, 0)), rec = recL, dir = 0, pres = 0, meta = 0, um = pes.length===1 ? pes[0] : null;
  if(!casa){ var mesesC = todos ? Object.keys(vl.reduce(function(o, x){ o[x.data.slice(0,7)] = 1; return o; }, {})) : [ym]; rec = 0;   // Direto e Prestadores também em "Todos os meses": soma mês a mês (Marcus, 06/11/2026)
    pes.forEach(function(pe){ mesesC.forEach(function(m){ var dv = pixDivisao(ff, pe.id, m); rec += pixDoMes(ff, pe.id, m); dir += dv.direto; pres += dv.prestadores; if(!todos) meta += (ff.pixMeta[pe.id+"|"+m]||0); }); }); rec = r2(rec); dir = r2(dir); pres = r2(pres); }
  var pct = function(v, base){ return base>0 ? (v/base*100).toFixed(1).replace(".", ",")+"%" : ""; };
  var porFav = {}, porDia = {}, nDia = {};
  vl.forEach(function(x){ var k = x.contaId || "—", d = todos ? x.data.slice(0,7) : x.data; nomesFav[k] = rotuloFav(x.contaId); porFav[k] = r2((porFav[k]||0)+x.valor); porDia[d] = r2((porDia[d]||0)+x.valor); nDia[d] = (nDia[d]||0)+1; });
  var rodTotal = {r:"Recebido", v:BK(casa ? recL : rec), p:vl.length+" PIX"}, rodFav = {r:"Total enviado", v:BK(recL), p:vl.length+" PIX"}, rodDia = {r:"Total", v:BK(recL), p:vl.length+" PIX"};   // o total fica numa linha fixa no fundo de cada bloco
  var linTotal = casa ? []
    : [{r:"Direto", v:BK(dir), p:pct(dir, rec)}, {r:"Prestadores", v:BK(pres), p:pct(pres, rec)}]
      .concat(atual && !um ? pes.filter(function(pe){ return ["marco", "anabeatriz", "marcus", "lucas", "anamaria"].indexOf(pe.id)>=0; }).map(function(pe){ var t = totaisPersona(ff, pe.id, ym); return {r:"Meta · "+pe.nome, v:t.pix.meta>0 ? BK(t.pix.meta) : "Sem meta", p:t.pix.meta>0 ? Math.round(t.pix.recebido/t.pix.meta*100)+"% da meta" : ""}; }) : [])   // meta de cada sócio em uma linha (Marcus, 04/11/2026)
      .concat(atual && meta>0 ? [{r:"Meta do mês", v:BK(meta), p:"", total:!um}, {r:"Falta", v:BK(Math.max(0, r2(meta-rec))), p:Math.round(rec/meta*100)+"% da meta"}] : []);
  var linFav = Object.keys(porFav).sort(function(a, b){ return porFav[b]-porFav[a]; }).map(function(k){ return {r:nomesFav[k], v:BK(porFav[k]), p:pct(porFav[k], recL)}; });
  var linDia = Object.keys(porDia).sort().reverse().map(function(d){ return {r:todos ? nomeMes(d) : br(d), v:BK(porDia[d]), p:nDia[d]+" PIX"}; });
  var quem = casa ? " · Casa" : um ? " · "+um.nome : " · todos os sócios", vazio = [{r:"Nenhum PIX", v:BK(0), p:""}];
  var famIds = membrosFamilia(ff), parte = famIds.length ? Math.floor(recL/famIds.length*100)/100 : 0, resto = r2(recL-parte*famIds.length);
  var linDiv = famIds.map(function(id, i){ var pp = ff.personas.find(function(y){ return y.id===id; }); return {r:pp ? pp.nome : id, v:BK(i===0 ? r2(parte+resto) : parte), p:famIds.length ? pct(1, famIds.length) : ""}; });
  return e("div",null,
    e("div",{className:"grid grid-cols-1 items-start gap-3 pb-3 "+(casa ? "md:grid-cols-4" : "md:grid-cols-3")},
      e(BlocoResumo,{t:(todos ? "Total de todos os meses" : "Total do mês")+quem, compacto:true, altura:ALT_RESUMO, rodape:rodTotal, cab:["Item", "Valor", "Parte"], linhas:linTotal}),
      e(BlocoResumo,{t:"Enviado por favorecido"+quem, compacto:true, altura:ALT_RESUMO, rodape:rodFav, cab:["Favorecido", "Enviado", "Do total"], linhas:linFav}),
      e(BlocoResumo,{t:(todos ? "Por mês" : "Por dia")+quem, compacto:true, altura:ALT_RESUMO, rodape:rodDia, cab:[todos ? "Mês" : "Dia", "Total", "PIX"], linhas:linDia}),
      casa && e(BlocoResumo,{t:"Divisão da família", compacto:true, altura:ALT_RESUMO, rodape:{r:"Total da Casa", v:BK(recL), p:vl.length+" PIX"}, cab:["Pessoa", "Parte", "Fração"], linhas:linDiv})),
    um && atual && e("div",{className:"flex items-center justify-center gap-2 pb-3 text-[13px]"}, "Meta do mês de "+um.nome+" (R$):",
      e("input",{key:meta, defaultValue:meta ? fmtN(meta) : "", readOnly:!!c.leitura, placeholder:"definir", "aria-label":"Meta do mês", className:CAMPO+" w-36! text-center tabular-nums", onBlur:function(ev){ var v = num(ev.target.value); if(v!==meta) acao(c, "pix_meta", {personaId:um.id, ym:ym, valor:v}); }, onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); }})));
}
function AbaFfPix(){
  var c = useFF(), edita = c.pode || temAutorizacao("ff_pix", c.s.usuario), leitura = !edita && temAutorizacao("ff_pix_ver", c.s.usuario); c = Object.assign({}, c, {pode:edita || leitura, leitura:leitura});   // ff_pix_ver = só consulta (Bruna, 06/11/2026): sem formulário, sem apagar, sem mudar a conferência   // quem tem só a autorização ff_pix abre esta tela e nenhuma outra da família
  var ff = c.ff, comPix = {}; ff.pix.forEach(function(x){ comPix[x.data.slice(0,7)] = 1; });
  // abre no último mês que tem PIX lançado (não no mês de hoje, que pode estar vazio); "Todos os meses" mostra tudo
  var ultimo = Object.keys(comPix).filter(function(m){ return m<=hojeYm(); }).sort().pop() || hojeYm();
  var ms = useState(ultimo), ym = ms[0], setYm = ms[1], pf = useState(""), quem = pf[0], setQuem = pf[1], pdd = useState(false), porDia = pdd[0], setPorDia = pdd[1], pab = useState({}), abertos = pab[0], setAbertos = pab[1];
  var mesesOp = Object.keys(Object.keys(comPix).concat([hojeYm()]).reduce(function(o, k){ o[k] = 1; return o; }, {})).sort().reverse();   // só os meses com PIX e o mês de hoje
  var pessoas = ff.personas.filter(function(p){ return p.ativo && p.mostrarPix && p.id!=="familia" && !(/^Casa/i.test(p.nome) && !ff.pix.some(function(x){ return x.personaId===p.id; })); }), ehCasa = quem==="__casa", casaP = {id:"casa", nome:"Casa"};   // Casa/Família saiu da lista: a Casa agora é uma tela própria (Lucas, 05/11/2026); casas sem PIX (Casa/Praia) ficam escondidas até terem PIX (Marcus, 06/11/2026)
  return e(Guarda,{c:c}, e(Pagina,null,
    e(PageHead,{t:"PIX revendedoras"},
      e("select",{value:ym, "aria-label":"Mês", className:CAMPO+" w-44!", onChange:function(ev){ setYm(ev.target.value); }}, e("option",{value:"TODOS"}, "Todos os meses"), mesesOp.map(function(k){ return e("option",{key:k, value:k}, nomeMes(k)); })),
      e("select",{value:porDia ? "1" : "", "aria-label":"Total por dia", className:CAMPO+" w-48!", onChange:function(ev){ setPorDia(ev.target.value==="1"); }}, e("option",{value:""}, "Sem total por dia"), e("option",{value:"1"}, "Com total por dia")),
      e("select",{value:quem, "aria-label":"Sócio", className:CAMPO+" w-40!", onChange:function(ev){ setQuem(ev.target.value); }}, e("option",{value:""}, "Todos os sócios"), pessoas.map(function(p){ return e("option",{key:p.id, value:p.id}, p.nome); }), e("option",{value:"__casa"}, "Casa"))),
    e(ResumoPix,{c:c, ym:ym, casa:ehCasa, pes:ehCasa ? [] : pessoas.filter(function(p){ return !quem || p.id===quem; })}),
    (ehCasa ? [casaP] : quem ? pessoas.filter(function(p){ return p.id===quem; }) : ["marco", "anabeatriz", "marcus", "lucas", "anamaria"].map(function(id){ return pessoas.find(function(p){ return p.id===id; }); }).filter(Boolean).concat([casaP])).map(function(p){ return e(CartaoPix,{key:p.id+ym+porDia, c:c, p:p, casa:p.id==="casa", ym:ym, porDia:porDia, aberto:quem ? undefined : !!abertos[p.id], onToggle:function(){ var o = Object.assign({}, abertos); o[p.id] = !o[p.id]; setAbertos(o); }}); })));
}

// ───────────────── Prestadores ─────────────────
// 18/11/2026 (Marcus: "azul, diminui fonte, mais compacto, sem perder nada"): tela refeita no bloco padrão do Financeiro (BlocoPainel azul, compacto, letra de 11 px) e na TabelaPlanilha.
// Nada saiu: o resumo (em aberto e saldo por sócio) virou tabela com total; cada prestador é um bloco que abre e fecha na barra azul (todos nascem fechados; Abrir todos e Fechar todos em cima da lista);
// o filtro de mês virou a coluna Mês das tabelas (filtro no título da coluna, e o total de baixo acompanha o filtro); as explicações viraram dica ao passar o mouse.
// Novo: cada dívida mostra Pago e Falta (o repasse liquida a dívida mais antiga primeiro, baixaDividas) e o Prazo é trocado na própria linha (vale como vencimento em Contas a pagar).
var mesTxt = function(iso){ return nomeMes(String(iso||"").slice(0, 7)); };
var somaDe = function(ls, k){ return r2(ls.reduce(function(t, l){ return t+(Number(l[k]) || 0); }, 0)); };
function CampoSelI(p){ return e("div",{className:"flex min-w-0 items-center gap-1.5 "+(p.cls||"")}, e("label",{htmlFor:p.id, className:"shrink-0 whitespace-nowrap text-[11px] font-medium uppercase tracking-[.05em]"}, p.t), e("select",{id:p.id, value:p.value, onChange:function(ev){ p.onChange(ev.target.value); }, className:SEL_AZUL}, p.opcoes.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }))); }
var BTN_BARRA = "h-8 rounded-md border border-[#5b74ad] bg-[#22365e] px-3 text-[11px] font-semibold hover:bg-[#2b4170]";   // botão da faixa de cima da lista de prestadores
var SEL_AZUL = CAMPO+" !w-auto min-w-[7rem] max-w-full !border-[#6ea0f0]/60 !bg-[#27508f] !text-[11px]";   // menu suspenso: azul mais claro e menor (Marcus, 18/11/2026)
var FORM_PREST = "flex flex-wrap items-center gap-x-3 gap-y-0.5 border-b border-border px-2 py-0.5";   // linha de lançamento: rótulo de 11 px em cima, campo e botão de 32 px na mesma linha; em tela estreita os campos descem (nada é cortado)
var FAIXA_PREST = "w-20 shrink-0 text-[11px] font-bold uppercase tracking-[.05em]";   // título pequeno de seção (sem barra colorida)
function CampoTxt(p){ return e("div",{className:"flex min-w-0 items-center gap-1.5 "+(p.cls||"")}, e("label",{htmlFor:p.id, className:"shrink-0 whitespace-nowrap text-[11px] font-medium uppercase tracking-[.05em]"}, p.t), e("input",{id:p.id, value:p.value, type:p.type||"text", className:CAMPO+(p.type==="date" ? " [color-scheme:dark]" : ""), onChange:function(ev){ p.onChange(ev.target.value); }, onKeyDown:p.onEnter ? function(ev){ if(ev.key==="Enter") p.onEnter(); } : undefined})); }
var fixo = function(el){ return e("div",{className:"shrink-0"}, el); };   // o botão do formulário não encolhe: o rótulo nunca é cortado
var botaoLinha = function(rot, titulo, fn){ return e("button",{type:"button", title:titulo, "aria-label":titulo, onClick:function(ev){ ev.stopPropagation(); fn(); }, className:"h-[18px] px-2 text-[11px] font-semibold leading-none hover:underline"}, rot); };

function DescTip(p){   // 4 primeiras palavras; passar o mouse mostra o texto completo (Marcus, 18/11/2026). O bloco é "fixed" (não é cortado pela rolagem da tabela) e fecha sozinho: mouse fora, rolagem ou clique.
  var st = useState(null), pos = st[0], setPos = st[1], ref = React.useRef(null), pal = String(p.v || "").split(/\s+/).filter(Boolean), longo = pal.length>(p.n || 4);
  var cp = pal.slice(0, p.n || 4); while(longo && cp.length>1 && /^(de|da|do|dos|das|e|·)$/i.test(cp[cp.length-1])) cp.pop();   // o texto curto nunca termina em "de", "da", "e"...
  var curto = cp.join(" ");
  React.useEffect(function(){
    if(!pos) return undefined;
    var fecha = function(){ setPos(null); };
    var move = function(ev){ if(!ref.current || !ref.current.contains(ev.target)) fecha(); };
    document.addEventListener("mousemove", move); document.addEventListener("mousedown", fecha); window.addEventListener("scroll", fecha, true); window.addEventListener("blur", fecha);
    return function(){ document.removeEventListener("mousemove", move); document.removeEventListener("mousedown", fecha); window.removeEventListener("scroll", fecha, true); window.removeEventListener("blur", fecha); };
  }, [pos, setPos]);
  return e("span",{ref:ref, className:"inline-block max-w-full overflow-hidden whitespace-nowrap align-middle leading-[13px] "+(longo ? "cursor-help" : ""), onMouseEnter:longo ? function(ev){ var r = ev.currentTarget.getBoundingClientRect(); st[1]({x:r.left+r.width/2, abaixo:r.bottom+4, acima:window.innerHeight-r.top+4, cima:r.bottom>window.innerHeight-150}); } : undefined, onMouseLeave:function(){ st[1](null); }},
    curto,
    pos && e("span",{role:"tooltip", style:Object.assign({position:"fixed", width:300, left:Math.max(8, Math.min(pos.x-150, window.innerWidth-308))}, pos.cima ? {bottom:pos.acima} : {top:pos.abaixo}), className:"pointer-events-none z-[100] block whitespace-normal rounded-lg border border-[#6a81b4] bg-gradient-to-b from-[#2f5aa8] to-[#0f1729] px-3 py-2 text-left text-[11px] font-medium leading-[15px] text-white shadow-xl"}, p.v));
}
function DetPrest(p){   // o que abre embaixo da linha do prestador (Prestadores › tabela): sócio, chave Pix, dívidas e repasses
  var c = p.c, ff = c.ff, x = p.x, nd = useState({data:hojeIso(), valor:"", prazo:"", descricao:""}), d = nd[0], setD = nd[1];
  var nr = useState({data:hojeIso(), valor:"", origem:"", forma:"PIX", contaTxt:"", pixRev:false}), r = nr[0], setR = nr[1];
  var ed = useState(false), editando = ed[0], dr = useState(null), rasc = dr[0], aD = useState(false), aberD = aD[0], aR = useState(false), aberR = aR[0];   // formulários de lançar: fechados até clicar em + Lançar
  var irCartao = function(id){ setTimeout(function(){ var el = document.getElementById(id); if(el && el.scrollIntoView) el.scrollIntoView({behavior:"smooth", block:"nearest"}); }, 80); };   // o cartão de lançar fica embaixo das colunas: a tela desce até ele
  var vr = useState(null), ver = vr[0];   // comprovante aberto no cartão: {l, nome, url}
  var cf = useState(null), conf = cf[0], pedir = function(msg, fn){ cf[1]({msg:msg, fn:fn}); };   // "Tem certeza?" antes de excluir (Marcus, 18/11/2026: a dívida da Truck Plaza foi apagada sem aviso)
  var recente = function(a, b){ return a.data.localeCompare(b.data); };   // do mais antigo (em cima) para o mais novo (embaixo) (Marcus, 18/11/2026)
  var bx = baixaDividas(ff, x.id), sd = saldoPrestador(ff, x.id), socios = ff.personas.filter(function(q){ return q.tipo==="SOCIO"; });
  var cbp = (ff.contasBanc||[]).filter(function(z){ return z.prestadorId===x.id && z.ativo!==false; })[0];
  var lancarDivida = function(){ if(!(num(d.valor)>0)) return; acao(c, "divida_add", {prestId:x.id, data:d.data, valor:num(d.valor), prazo:d.prazo, descricao:d.descricao}); setD(Object.assign({}, d, {valor:"", descricao:""})); aD[1](false); };
  var lancarRepasse = function(){ if(!(num(r.valor)>0) || !r.origem.trim()) return; acao(c, "repasse_add", {prestId:x.id, data:r.data, valor:num(r.valor), origem:r.origem, forma:r.forma, contaTxt:r.contaTxt, pixRevendedora:r.pixRev}); setR(Object.assign({}, r, {valor:"", origem:""})); aR[1](false); };

  var linhasDv = ff.dividas.filter(function(y){ return y.prestId===x.id; }).sort(recente).map(function(y){ var b = bx.porId[y.id];
    return {id:y.id, y:y, data:br(y.data), mes:mesTxt(y.data), desc:[y.titulo, y.descricao, y.codigo].filter(Boolean).join(" · ") || "—", prazo:y.prazo || "", valor:y.valor, pago:b ? b.pago : "", falta:b ? Math.max(0, b.falta) : "", acao:"Excluir"}; });
  var colsDv = [{k:"data", t:"Data", w:"4.5rem"}, {k:"desc", t:"Descrição", render:function(v){ return e(DescTip,{v:v, n:3}); }},   // descrição longa quebra em linhas (nada cortado e a tabela não rola para o lado)
    {k:"prazo", t:"Prazo", w:"6rem", render:function(v, l){ return l.y.valor>0 ? e("input",{type:"date", key:l.id+"|"+l.y.prazo, defaultValue:l.y.prazo || "", "aria-label":"Prazo da dívida", title:"Prazo de pagamento. Sem prazo, vale o último dia do mês.", className:"h-[18px] w-[5.25rem] rounded border border-white/20 bg-transparent px-1 text-[11px] text-white [color-scheme:dark]", onClick:function(ev){ ev.stopPropagation(); }, onBlur:function(ev){ if(ev.target.value!==(l.y.prazo||"")) acao(c, "divida_set", {id:l.id, patch:{prazo:ev.target.value}}); }}) : "—"; }},
    {k:"valor", t:"Dívida", w:"5.25rem", fmt:BK, cor:function(){ return "text-destructive"; }}, {k:"pago", t:"Pago", w:"5.25rem", fmt:BK, cor:function(){ return "text-success"; }}, {k:"falta", t:"Falta", w:"4.75rem", fmt:BK, cor:function(l){ return l.falta>0.005 ? "text-destructive" : "text-success"; }},
    {k:"acao", t:"Excluir", w:"4.75rem", render:function(v, l){ return botaoLinha("Excluir", "Excluir dívida", function(){ pedir("a dívida de "+BK(l.valor)+" de "+l.data, function(){ acao(c, "divida_del", {id:l.id}); }); }); }}];

  // COMPROVANTE (Marcus, 19/11/2026): o Pix automático guarda o comprovante no próprio PIX (ff.pix); pago lançado à mão ou vindo do Direcionar guarda no repasse. A imagem fica no servidor (/api/anexos, módulo ff).
  var linhasRp = ff.repasses.filter(function(y){ return y.prestId===x.id; }).sort(recente).map(function(y){ var auto = !!y.origemPixLancId, dir = !!y.origemDirecionar, rot = auto ? "PIX automático" : dir ? "Direcionar" : "Lançado à mão";
    var px = auto ? ((ff.pix || []).filter(function(q){ return q.id===y.origemPixLancId; })[0] || null) : null, fonte = px || y, usado = px && (ff.pixUsados || {})[px.id];
    return {id:y.id, pixId:px ? px.id : "", data:br(y.data), forma:y.forma || "—", quem:((y.origem==="PIX revendedora" ? (px || {}).origem : "") || y.origem || "—"), origem:(y.forma && y.forma!=="PIX" ? y.forma+" · " : "")+rot, valor:y.valor, trava:auto || dir, acao:auto ? "Automático" : dir ? "Direcionar" : "Excluir", compKey:fonte.compKey || "", usado:usado ? (usado.rev || "revendedora") : ""}; });
  var subirComp = function(l, arq){ if(!arq) return; lerAnexo(arq).then(function(a){ return enviarAnexo("ff", a); }).then(function(sv){ acao(c, l.pixId ? "pix_comp" : "repasse_comp", {id:l.pixId || l.id, key:sv.key, nome:arq.name, tipo:arq.type}); }, function(err){ c.d({type:"AVISO", txt:((err && err.message) ? err.message+" " : "")+"Não consegui anexar o comprovante."}); }); };
  // O PRÓPRIO VALOR é o link do comprovante (Marcus, 19/11/2026): com comprovante o valor fica sublinhado e abre o comprovante num cartão (um clique fecha); sem comprovante o valor é normal e o clique oferece anexar (foto ou PDF).
  var abrirComp = function(l){ buscarAnexo(l.compKey).then(function(r){ if(r.mime==="application/pdf") return abrirAnexo(l.compKey); vr[1]({l:l, nome:r.nome || "", url:r.url}); }).catch(function(){ c.d({type:"AVISO", txt:"Não consegui abrir o comprovante."}); }); };
  var celValor = function(v, l){ return l.compKey
    ? e("button",{type:"button", title:"Abrir o comprovante deste pagamento", "aria-label":"Abrir o comprovante de "+BK(v), onClick:function(ev){ ev.stopPropagation(); abrirComp(l); }, className:"cursor-pointer font-semibold underline decoration-1 underline-offset-2 hover:opacity-80"}, BK(v))
    : e("label",{title:"Sem comprovante. Clique para anexar (foto ou PDF).", onClick:function(ev){ ev.stopPropagation(); }, className:"cursor-pointer hover:underline hover:decoration-dotted hover:underline-offset-2"}, BK(v),
        e("input",{type:"file", accept:"image/*,application/pdf", "aria-label":"Anexar comprovante de "+BK(v), className:"hidden", onChange:function(ev){ var f = ev.target.files && ev.target.files[0]; ev.target.value = ""; subirComp(l, f); }})); };
  var quebra = function(v){ return e("span",{className:"inline-block whitespace-normal break-words leading-[13px]"}, v); };   // nome e origem quebram em linhas em vez de empurrar a tabela para o lado
  var colsRp = [{k:"data", t:"Data", w:"4.5rem"}, {k:"quem", t:"Quem pagou", render:function(v, l){ return e(React.Fragment,null, e(DescTip,{v:v, n:2}), l.usado ? e("span",{className:"block text-[11px] font-semibold leading-[13px] text-primary", title:"Este PIX já foi usado no acerto de "+l.usado+": não entra de novo."}, "usado no acerto") : null); }}, {k:"valor", t:"Pago", w:"5.25rem", fmt:BK, cor:function(){ return "text-success"; }, render:function(v, l){ return celValor(v, l); }},
    {k:"acao", t:"Excluir", w:"4.75rem", render:function(v, l){ if(l.usado) return botaoLinha("Soltar", "Soltar o PIX do acerto de "+l.usado+" (só se o acerto foi cancelado)", function(){ if(window.confirm("Soltar este PIX do acerto de "+l.usado+"?\n\nSó solte se o acerto foi cancelado. Se o acerto já foi concluído, o mesmo valor entra duas vezes.")) acao(c, "pix_soltar", {id:l.pixId}); });
      return l.trava ? e("span",{className:"cursor-help", title:l.origem+" · não se exclui aqui."}, v) : botaoLinha("Excluir", "Excluir repasse", function(){ pedir("o pago de "+BK(l.valor)+" de "+l.data, function(){ acao(c, "repasse_del", {id:l.id}); }); }); }}];


  // os totais ficam todos na MESMA linha do fundo do bloco, nas quatro colunas (Marcus, 18/11/2026: "o total fica na linha lá no fundo")
  var totDv = somaDe(linhasDv, "valor"), totDvPago = somaDe(linhasDv, "pago"), totDvFalta = somaDe(linhasDv, "falta"), totRp = somaDe(linhasRp, "valor");
  var dvPos = ff.dividas.filter(function(y){ return y.prestId===x.id && y.valor>0; }).sort(recente);
  var totDv4 = somaDe(dvPos, "valor"), totPago4 = r2(Object.keys(bx.porId).reduce(function(t, k){ return t+bx.porId[k].pago; }, 0)+bx.sobra), falta4 = bx.falta;
  var nomeCred = function(cr){ if(cr.tipo==="pix"){ var rp = ff.repasses.find(function(q){ return q.id===cr.rid; }); return rp && rp.origem ? rp.origem : "Repasse"; } return "Desconto"; };
  var COL = "flex min-w-0 flex-col border-t border-[#5b74ad] bg-[#1b2a4a] @min-[1155px]:border-t-0 @min-[1155px]:border-l";
  var CAB = "flex h-8 shrink-0 items-center justify-between gap-2 border-b border-[#5b74ad] bg-[#2b4170] px-2 text-[11px] font-bold uppercase";
  var RODA = "mt-auto flex h-10 shrink-0 items-center justify-between gap-2 border-t-2 border-[#7f98cf] bg-[#2b4170] px-2 text-[13px] font-semibold";   // a linha de total: mt-auto empurra para o fundo e as quatro colunas têm a mesma altura
  var BTN_RODA = "h-8 min-w-0 flex-1 rounded-md border border-white/25 px-2 text-[11px] font-semibold hover:bg-white/10";
  var RODA_G = "mt-auto grid h-10 shrink-0 items-stretch border-t-2 border-[#7f98cf] bg-[#2b4170] text-[11px] font-semibold";   // linha de total em grade: cada célula cai debaixo da sua coluna, com traço entre elas
  var celT = function(txt, cls){ return e("span",{className:"flex items-center justify-center border-l border-[#5b74ad] px-1 first:border-l-0 "+(cls || "")}, txt); };
  var MINI = "h-6 shrink-0 rounded border border-white/25 px-2 text-[11px] font-semibold hover:bg-white/10";
  var Stk = function(t, el, cls){ return e("label",{className:"flex min-w-0 flex-col gap-0.5 text-[11px] font-medium uppercase tracking-[.05em] "+(cls||"")}, t, el); };
  var LIN = "grid grid-cols-[5rem_minmax(0,1fr)] border-b border-[#3d5086] text-[11px]";
  var LIN_T = "flex min-h-[24px] items-center whitespace-nowrap border-r border-[#3d5086] bg-[#22365e] px-1.5 font-semibold uppercase tracking-[.05em]";
  var LIN_V = "flex min-h-[24px] min-w-0 items-center break-words px-2 text-[11px] ";
  var Lin = function(t, v, cor){ return e("div",{className:LIN}, e("span",{className:LIN_T}, t), e("span",{className:LIN_V+(cor||"")}, v)); };   // uma linha de tabela: rótulo | valor
  var LinCtl = function(t, ctl){ return e("div",{className:LIN}, e("span",{className:LIN_T}, t), e("span",{className:"flex min-w-0 items-center p-0.5"}, ctl)); };   // o mesmo, com campo para editar
  var inp = function(id, v, fn, tipo, extra){ return e("input",{id:id, value:v, type:tipo||"text", className:CAMPO+" w-full"+(tipo==="date" ? " [color-scheme:dark]" : ""), onChange:function(ev){ fn(ev.target.value); }, onKeyDown:extra ? function(ev){ if(ev.key==="Enter") extra(); } : undefined}); };
  var rolagem = function(el, mw){ return e("div",{className:"min-w-0 flex-1 overflow-x-auto [&_td]:!h-[22px] [&_td]:!px-1.5 [&_td]:!py-0.5 [&_td]:!text-[11px] [&_td]:!leading-[14px] [&_th]:!h-6 [&_th]:!px-0 [&_th]:!text-[11px] [&_th_button]:!gap-0.5 [&_th_button]:!px-1.5 [&_tbody_tr:last-child_td]:!border-b-2 [&_tbody_tr:last-child_td]:!border-b-white/40", "data-sem-arrastar":""}, mw ? e("div",{style:{minWidth:mw}}, el) : el); };   // letra de 11 px e células justas: as quatro colunas cabem sem rolar para o lado

  var grade = e("div",{className:"grid min-w-0 grid-cols-1 bg-[#1b2a4a] @min-[1155px]:grid-cols-[12rem_minmax(38.5rem,2.6fr)_minmax(22rem,1fr)]"},
    ver && e("div",{role:"dialog", "aria-label":"Comprovante do pagamento", className:"fixed inset-0 z-[100] grid cursor-pointer place-items-center bg-black/70 p-4", onClick:function(){ vr[1](null); }},
      e("div",{className:"flex max-h-[92vh] max-w-[92vw] cursor-default flex-col gap-2 rounded-lg border border-white/25 bg-[#0a1226] p-2", onClick:function(ev){ ev.stopPropagation(); }},
        e("div",{className:"flex h-8 items-center justify-between gap-3 px-1 text-[13px] font-semibold"}, e("span",null, "Comprovante · "+BK(ver.l.valor)+" · "+ver.l.data),
          e("span",{className:"flex gap-1"},
            e("label",{className:MINI+" inline-flex cursor-pointer items-center", title:"Trocar o comprovante (foto ou PDF)"}, "Trocar", e("input",{type:"file", accept:"image/*,application/pdf", "aria-label":"Trocar comprovante", className:"hidden", onChange:function(ev){ var f = ev.target.files && ev.target.files[0]; ev.target.value = ""; vr[1](null); subirComp(ver.l, f); }})),
            e("button",{type:"button", className:MINI, onClick:function(){ vr[1](null); }}, "Fechar"))),
        e("img",{src:ver.url, alt:"Comprovante de "+BK(ver.l.valor), className:"max-h-[82vh] max-w-full rounded object-contain"}))),
    conf && e("div",{role:"alertdialog", className:"col-span-full flex flex-wrap items-center justify-center gap-3 border-b-2 border-destructive bg-[#431616] px-2 py-1.5 text-[13px] font-semibold"},
      e("span",null, "Tem certeza que quer excluir "+conf.msg+"?"),
      e(Botao,{principal:true, onClick:function(){ var fn = conf.fn; cf[1](null); fn(); }}, "Sim"),
      e(Botao,{onClick:function(){ cf[1](null); }}, "Não")),
    e("div",{className:COL+" @min-[1155px]:border-l-0"},
      e("div",{className:CAB}, e("span",null, "Prestador"), e("span",{className:"flex gap-1"}, e("button",{type:"button", className:MINI, onClick:function(){ if(!editando){ dr[1]({nome:x.nome || "", servico:x.servico || "", chavePix:x.chavePix || "", banco:cbp ? (cbp.banco || "") : "", responsavelId:x.responsavelId || ""}); irCartao("cartao-e-"+x.id); } ed[1](!editando); }}, editando ? "Cancelar" : "Editar"), p.fechar && e("button",{type:"button", className:MINI, onClick:p.fechar}, "Fechar"))),
      e("div",{className:"m-2 overflow-hidden rounded-md border border-[#3d5086] [&>div:last-child]:border-b-0"},
        e(React.Fragment,null,
          Lin("Sócio", x.responsavelId ? pessoaNome(ff, x.responsavelId) : "Sem sócio"),
          Lin("Prestador", nomePropio(x.nome)),
          Lin("Chave PIX", x.chavePix || "Sem chave"),
          Lin("Banco", cbp ? (cbp.banco || cbp.nome) : "—")),
        Lin("Serviço", x.servico || "—"),
        Lin("Situação", x.ativo ? "Em aberto" : "Finalizado", x.ativo ? "text-warning" : "text-success")),
      e("div",{className:RODA},
        e("button",{type:"button", className:BTN_RODA, onClick:function(){ acao(c, "prest_set", {id:x.id, patch:{ativo:!x.ativo}}); }}, x.ativo ? "Finalizar" : "Reabrir"),
        e("button",{type:"button", className:BTN_RODA+" text-destructive", onClick:function(){ pedir("o prestador "+x.nome+" com todas as dívidas e pagos", function(){ acao(c, "prest_del", {id:x.id}); }); }}, "Excluir"))),

    e("div",{className:COL},
      e("div",{className:CAB, title:"O que se deve ao prestador. O saldo é a soma das dívidas menos os repasses, de todas as datas."}, e("span",null, "Dívidas"), e("button",{type:"button", className:MINI, onClick:function(){ aD[1](!aberD); if(!aberD) irCartao("cartao-d-"+x.id); }}, aberD ? "Fechar" : "+ Lançar")),
      rolagem(e(TabelaPlanilha,{cols:colsDv, linhas:linhasDv, chave:"id", alturaMax:"22rem", grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true, vazio:"Nenhuma dívida lançada."}), "34rem"),
      e("div",{className:RODA_G, style:{gridTemplateColumns:"4.5rem minmax(0,1fr) 6rem 5.25rem 5.25rem 4.75rem 4.75rem"}}, celT("Total"), celT(""), celT(""), celT(BK(totDv), "text-destructive"), celT(BK(totDvPago), "text-success"), celT(BK(totDvFalta), totDvFalta>0.005 ? "text-destructive" : "text-success"), celT(""))),

    e("div",{className:COL},
      e("div",{className:CAB, title:"O que já foi pago ao prestador. O repasse liquida a dívida mais antiga primeiro."}, e("span",null, "Pago"), e("button",{type:"button", className:MINI, onClick:function(){ aR[1](!aberR); if(!aberR) irCartao("cartao-r-"+x.id); }}, aberR ? "Fechar" : "+ Lançar")),
      rolagem(e(TabelaPlanilha,{cols:colsRp, linhas:linhasRp, chave:"id", grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true, alturaMax:"22rem", vazio:"Nenhum pago lançado."})),
      e("div",{className:RODA_G, style:{gridTemplateColumns:"4.5rem minmax(0,1fr) 5.25rem 4.75rem"}}, celT("Total"), celT(""), celT(BK(totRp), "text-success"), celT(""))));
  // cartão de lançar: um bloco à parte DENTRO do bloco do prestador, embaixo das quatro colunas (Marcus, 18/11/2026: "mais um cardzinho para lançar nova dívida")
  var cartao = function(id, titulo, fecha, campos, botao){ return e("div",{id:id, className:"m-2 rounded-lg border border-white/25 bg-[#0a1226]"},
    e("div",{className:"flex h-8 items-center justify-between border-b border-[#3d4f77] px-2 text-[11px] font-bold uppercase"}, e("span",null, titulo), e("button",{type:"button", className:MINI, onClick:fecha}, "Fechar")),
    e("div",{className:"flex flex-wrap items-end gap-x-3 gap-y-1.5 p-2"}, campos, botao)); };
  // Editar: cartão à parte com tudo do prestador. O sócio só muda enquanto não há dívida nem pago lançado (Marcus, 18/11/2026).
  var temMov = ff.dividas.some(function(y){ return y.prestId===x.id; }) || ff.repasses.some(function(y){ return y.prestId===x.id; });
  var mudaRasc = function(k, v){ var o = Object.assign({}, rasc); o[k] = v; dr[1](o); };
  var salvarEd = function(){ if(!rasc || !rasc.nome.trim()) return; var patch = {nome:rasc.nome.trim(), servico:rasc.servico.trim(), chavePix:rasc.chavePix.trim()}; if(!temMov) patch.responsavelId = rasc.responsavelId; acao(c, "prest_set", {id:x.id, patch:patch}); if(cbp && rasc.banco!==(cbp.banco || "")) acao(c, "cb_set", {id:cbp.id, patch:{banco:rasc.banco.trim()}}); else if(!cbp && rasc.banco.trim()) acao(c, "cb_add", {nome:"Conta "+rasc.nome.trim(), banco:rasc.banco.trim(), chavePix:rasc.chavePix.trim(), personaId:(temMov ? x.responsavelId : rasc.responsavelId) || "", prestadorId:x.id}); ed[1](false); };
  var cartaoE = editando && rasc && cartao("cartao-e-"+x.id, "Editar prestador · "+nomePropio(x.nome), function(){ ed[1](false); }, [
    Stk("Nome", inp("ed-nome-"+x.id, rasc.nome, function(v){ mudaRasc("nome", v); }, "text", salvarEd), "min-w-[12rem] flex-1"),
    Stk("Serviço", inp("ed-serv-"+x.id, rasc.servico, function(v){ mudaRasc("servico", v); }, "text", salvarEd), "min-w-[10rem] flex-1"),
    Stk("Chave PIX", inp("ed-chave-"+x.id, rasc.chavePix, function(v){ mudaRasc("chavePix", v); }, "text", salvarEd), "min-w-[12rem] flex-1"),
    Stk("Banco", e("input",{id:"ed-banco-"+x.id, value:rasc.banco, title:cbp ? "" : "Sem conta ligada: ao salvar com o banco preenchido, a conta é criada e o Pix que cair nela vira pagamento do prestador sozinho", className:CAMPO+" w-full", onChange:function(ev){ mudaRasc("banco", ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") salvarEd(); }}), "w-40"),
    Stk(temMov ? "Sócio (travado)" : "Sócio", e("select",{id:"ed-socio-"+x.id, value:rasc.responsavelId, disabled:temMov, title:temMov ? "Travado: este prestador já tem dívida ou pago lançado" : "", className:SEL_AZUL+" disabled:opacity-50", onChange:function(ev){ mudaRasc("responsavelId", ev.target.value); }}, [["", "Nenhum"]].concat(socios.map(function(q){ return [q.id, q.nome]; })).map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })), "w-40")
  ].map(function(el, i){ return e(React.Fragment,{key:i}, el); }), e(Botao,{principal:true, desabilitado:!rasc.nome.trim(), onClick:salvarEd}, "Salvar"));
  var cartaoD = aberD && cartao("cartao-d-"+x.id, "Nova dívida · "+nomePropio(x.nome), function(){ aD[1](false); }, [
    Stk("Data", inp("dv-data-"+x.id, d.data, function(v){ setD(Object.assign({}, d, {data:v})); }, "date"), "w-44"),
    Stk("Valor (R$)", inp("dv-valor-"+x.id, d.valor, function(v){ setD(Object.assign({}, d, {valor:v.replace(/[^\d,.]/g, "")})); }, "text", lancarDivida), "w-36"),
    Stk("Prazo", inp("dv-prazo-"+x.id, d.prazo, function(v){ setD(Object.assign({}, d, {prazo:v})); }, "date"), "w-44"),
    Stk("Descrição", inp("dv-desc-"+x.id, d.descricao, function(v){ setD(Object.assign({}, d, {descricao:v})); }, "text", lancarDivida), "min-w-[14rem] flex-1")
  ].map(function(el, i){ return e(React.Fragment,{key:i}, el); }), e(Botao,{principal:true, desabilitado:!(num(d.valor)>0), onClick:lancarDivida}, "Lançar dívida"));
  var cartaoR = aberR && cartao("cartao-r-"+x.id, "Novo pago · "+nomePropio(x.nome), function(){ aR[1](false); }, [
    Stk("Data", inp("rp-data-"+x.id, r.data, function(v){ setR(Object.assign({}, r, {data:v})); }, "date"), "w-44"),
    Stk("Valor (R$)", inp("rp-valor-"+x.id, r.valor, function(v){ setR(Object.assign({}, r, {valor:v.replace(/[^\d,.]/g, "")})); }, "text", lancarRepasse), "w-36"),
    Stk("Quem pagou", inp("rp-quem-"+x.id, r.origem, function(v){ setR(Object.assign({}, r, {origem:v})); }, "text", lancarRepasse), "min-w-[14rem] flex-1"),
    Stk("Forma", e("select",{id:"rp-forma-"+x.id, value:r.forma, className:SEL_AZUL, onChange:function(ev){ setR(Object.assign({}, r, {forma:ev.target.value})); }}, FORMAS_REPASSE.map(function(k){ return e("option",{key:k, value:k}, k); })), "w-32"),
    e("label",{key:"pr", className:"flex h-8 cursor-pointer items-center gap-1.5 whitespace-nowrap text-[13px]", title:"Marque quando o repasse veio de um PIX de revendedora: ele conta como PIX do sócio responsável."}, e("input",{type:"checkbox", checked:r.pixRev, className:"size-4", onChange:function(ev){ setR(Object.assign({}, r, {pixRev:ev.target.checked})); }}), "PIX de revendedora")
  ].map(function(el, i){ return e(React.Fragment,{key:i}, el); }), e(Botao,{principal:true, desabilitado:!(num(r.valor)>0) || !r.origem.trim(), onClick:lancarRepasse}, "Lançar pago"));
  return e("div",{className:"@container flex min-w-0 flex-col overflow-hidden rounded-b-lg border-2 border-[#5b74ad] bg-[#1b2a4a]"}, grade, cartaoE, cartaoD, cartaoR);
}
function AbaFfPrest(){
  var c = useFF(), ff = c.ff, nf = useState({nome:"", servico:"", chavePix:"", responsavelId:""}), f = nf[0], setF = nf[1], ncb = useState({nome:"", banco:"", chavePix:"", prestadorId:""}), cb = ncb[0], setCb = ncb[1];
  var am = useState({}), abMap = am[0], nv = useState(false), novoAberto = nv[0], sel = useState(""), selId = sel[0], cc = useState(null), confC = cc[0], vf = useState(false), verFin = vf[0];   // prestador escolhido na tabela: os dados dele abrem num bloco separado embaixo (Marcus, 18/11/2026)
  if(!c.pode) return e(Guarda,{c:c});
  // chaves Pix que o prestador ainda não tem no cadastro mas existem por outro caminho (arquivo local, conta ligada, Greicy universal): um clique grava no servidor e o Direcionar e o Atendimento passam a puxar (Marcus, 18/11/2026)
  var paraGravar = chavesParaGravar(c.s);
  var gravarChaves = function(){ paraGravar.forEach(function(k){ acao(c, "prest_set", {id:k.id, patch:{chavePix:k.chave, chavePixTipo:k.tipo, chavePixEm:Date.now(), chavePixPor:c.por}}); }); };
  var socios = ff.personas.filter(function(q){ return q.tipo==="SOCIO"; });
  var abertos = ff.prest.filter(function(x){ return x.ativo; }), porResp = {};
  abertos.forEach(function(x){ var k = x.responsavelId || "—", g = porResp[k] || (porResp[k] = {n:0, saldo:0}); g.n++; g.saldo = r2(g.saldo+saldoPrestador(ff, x.id)); });
  // resumo em tabela larga de 2 linhas (Marcus, 18/11/2026: "outro layout"): uma coluna por sócio e o total; sem bloco vazio ao lado
  var chavesResp = Object.keys(porResp).sort(function(x, y){ return porResp[y].saldo-porResp[x].saldo; });
  var nomeResp = function(k){ return k==="—" ? "Sem responsável" : pessoaNome(ff, k); };
  var totN = chavesResp.reduce(function(s, k){ return s+porResp[k].n; }, 0), totS = r2(chavesResp.reduce(function(s, k){ return s+porResp[k].saldo; }, 0));
  var colsResumo = [{k:"ind", t:"Resumo"}].concat(chavesResp.map(function(k){ return {k:"r"+k, t:nomeResp(k), fmt:function(v, l){ return l.id==="saldo" ? BK(v) : String(v); }, cor:function(l){ return l.id==="saldo" ? "text-destructive" : ""; }}; }), [{k:"total", t:"Total", fmt:function(v, l){ return l.id==="saldo" ? BK(v) : String(v); }, cor:function(l){ return l.id==="saldo" ? "text-destructive" : ""; }}]);
  var lnAberto = {id:"aberto", ind:"Em aberto", total:totN}, lnSaldo = {id:"saldo", ind:"Saldo devedor", total:totS};
  chavesResp.forEach(function(k){ lnAberto["r"+k] = porResp[k].n; lnSaldo["r"+k] = porResp[k].saldo; });
  var linhasResumo = [lnAberto, lnSaldo];
  var criar = function(){ if(!f.nome.trim()) return; acao(c, "prest_add", f); setF({nome:"", servico:"", chavePix:"", responsavelId:""}); nv[1](false); };
  var criarConta = function(){ if(!cb.nome.trim() || !cb.prestadorId) return; acao(c, "cb_add", cb); setCb({nome:"", banco:"", chavePix:"", prestadorId:""}); };
  var linhasContas = ff.contasBanc.filter(function(b){ if(!b.prestadorId) return false; var pp = ff.prest.find(function(x){ return x.id===b.prestadorId; }); return !pp || pp.ativo!==false || verFin; }).map(function(b){ return {id:b.id, conta:b.nome || "—", banco:b.banco || "—", chave:b.chavePix || "Sem chave", prest:(ff.prest.find(function(x){ return x.id===b.prestadorId; }) || {}).nome || "—", acao:"Excluir"}; });
  var colsContas = [{k:"conta", t:"Conta"}, {k:"banco", t:"Banco"}, {k:"chave", t:"Chave PIX"}, {k:"prest", t:"Prestador"}, {k:"acao", t:"Excluir", render:function(v, l){ return botaoLinha("Excluir", "Excluir conta", function(){ cc[1]({id:l.id, nome:l.conta}); }); }}];
  var ordenados = ff.prest.slice().sort(function(a, b){ return (b.ativo ? 1 : 0)-(a.ativo ? 1 : 0) || a.nome.localeCompare(b.nome); });
  // UMA tabela de prestadores, uma linha por prestador (Marcus, 18/11/2026: "não quero essas barras"): clicar na linha abre o detalhe embaixo; filtro e ordem em cada coluna
  var nFin = ff.prest.filter(function(x){ return !x.ativo; }).length;
  var linhasPrest = ordenados.filter(function(x){ return x.ativo || verFin || x.id===selId; }).map(function(x){ var cbp = (ff.contasBanc||[]).filter(function(z){ return z.prestadorId===x.id && z.ativo!==false; })[0];
    var dv = ff.dividas.filter(function(y){ return y.prestId===x.id && y.valor>0; }), rp = ff.repasses.filter(function(y){ return y.prestId===x.id; });
    return {id:x.id, x:x, socio:x.responsavelId ? pessoaNome(ff, x.responsavelId) : "Sem responsável", prest:nomePropio(x.nome), serv:x.servico || "—", banco:cbp ? (cbp.banco || cbp.nome) : "—", sit:x.ativo ? "Em aberto" : "Finalizado", dividas:somaDe(dv, "valor"), repasses:somaDe(rp, "valor"), saldo:saldoPrestador(ff, x.id), sobra:baixaDividas(ff, x.id).sobra}; });
  var colsPrest = [{k:"socio", t:"Sócio"}, {k:"prest", t:"Prestador"}, {k:"serv", t:"Serviço"}, {k:"banco", t:"Banco"}, {k:"sit", t:"Situação", cor:function(l){ return l.x.ativo ? "" : "text-muted-foreground"; }},
    {k:"dividas", t:"Dívidas", fmt:BK}, {k:"repasses", t:"Repasses", fmt:BK, cor:function(){ return "text-success"; }}, {k:"saldo", t:"Saldo", fmt:function(v, l){ return l.sobra>0.005 ? "Pago a mais "+BK(l.sobra) : BK(v); }, cor:function(l){ return l.sobra>0.005 ? "text-warning" : l.saldo>0.005 ? "text-destructive" : "text-success"; }}];   // "Pago a mais": os repasses passam das dívidas (falta lançar uma dívida ou o repasse é de outro prestador)
  var rodapePrest = function(ls){ return ["Total", String(ls.length)+" prestadores", "", "", "", BK(somaDe(ls, "dividas")), BK(somaDe(ls, "repasses")), BK(somaDe(ls, "saldo"))]; };
  var FUNDO = "!bg-[#0f1729] [&_tbody_tr:hover]:!bg-[#1e2d4c] [&_tbody_tr[aria-expanded=true]]:!bg-[#26385c] [&_tbody_tr:not([aria-expanded])>td[colspan]]:!bg-[#1a2540]";   // fundo azul-marinho (Marcus, 18/11/2026: "uma cor de fundo melhor"): a linha aberta fica mais clara e o detalhe numa faixa marinho
  var COMPACTA = FUNDO+" [&_td]:!h-[22px] [&_td]:!px-2 [&_td]:!py-0 [&_td]:!leading-[14px] [&_td]:!text-[11px] [&_th]:!h-6 [&_td[colspan]]:!p-0";   // linhas de 26 px e letra de 11 px na tabela de prestadores (sem mexer nos campos do detalhe)
  var escolhido = ff.prest.find(function(x){ return x.id===selId; }), cbEsc = escolhido ? (ff.contasBanc||[]).filter(function(z){ return z.prestadorId===escolhido.id && z.ativo!==false; })[0] : null;
  var tituloEsc = escolhido ? nomePropio(escolhido.nome)+(escolhido.servico ? " · "+escolhido.servico : "") : "";   // título curto: sócio e conta já estão na coluna Prestador (nada se sobrepõe em janela estreita)
  var dirEsc = escolhido ? "Saldo "+BK(saldoPrestador(ff, escolhido.id)) : "";
  return e("div",{className:PADRAO_BLOCOS+" -mb-2 -ml-3 -mr-2 -mt-5 flex flex-col gap-1.5 pl-0 md:-mb-3 md:-ml-5 md:-mr-3 md:pl-0"},
    e("div",{title:"Quem presta serviço e recebe dos sócios: o que se deve (dívidas), o que já foi pago (repasses) e o saldo."},
      e(BlocoPainel,{titulo:"Prestadores em aberto", compacto:true, cls:FUNDO},
        e(TabelaPlanilha,{cols:colsResumo, linhas:linhasResumo, chave:"id", grade:true, semMao:true, centro:true, semFiltro:true, semContagem:true, semLimpar:true, vazio:"Nenhum prestador em aberto."}))),
    e("div",{key:"barra", className:"flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#5b74ad] bg-[#1b2a4a] px-2 py-1"},
      e("span",{className:"text-[11px] font-bold uppercase tracking-[.05em]", title:"Clique numa linha da tabela para ver os dados do prestador embaixo."}, ff.prest.length+" prestadores · "+abertos.length+" em aberto"),
      e("span",{className:"flex items-center gap-2"},
        paraGravar.length>0 && e("button",{type:"button", className:BTN_BARRA, title:"Grava no servidor a chave Pix de: "+paraGravar.map(function(k){ return k.nome; }).join(", "), onClick:gravarChaves}, "Gravar "+paraGravar.length+" chaves Pix"),
        nFin>0 && e("button",{type:"button", className:BTN_BARRA, title:"Prestadores finalizados ficam fechados. Lançar uma dívida nova num deles reabre sozinho.", onClick:function(){ vf[1](!verFin); }}, verFin ? "Ocultar finalizados" : "Finalizados ("+nFin+")"),
        e(Botao,{principal:!novoAberto, onClick:function(){ nv[1](!novoAberto); }}, novoAberto ? "Fechar novo prestador" : "Novo prestador"))),
    novoAberto && e("div",{className:"rounded-lg border border-border bg-card/60"},
      e("div",{className:FORM_PREST+" border-b-0"},
        e(CampoTxt,{t:"Nome", cls:"min-w-[12rem] flex-1", id:"np-nome", value:f.nome, onChange:function(v){ setF(Object.assign({}, f, {nome:v})); }, onEnter:criar}),
        e(CampoTxt,{t:"Serviço", cls:"min-w-[10rem] flex-1", id:"np-serv", value:f.servico, onChange:function(v){ setF(Object.assign({}, f, {servico:v})); }, onEnter:criar}),
        e(CampoTxt,{t:"Chave PIX", cls:"w-72", id:"np-chave", value:f.chavePix, onChange:function(v){ setF(Object.assign({}, f, {chavePix:v})); }, onEnter:criar}),
        e(CampoSelI,{t:"Responsável", cls:"w-60", id:"np-resp", value:f.responsavelId, onChange:function(v){ setF(Object.assign({}, f, {responsavelId:v})); }, opcoes:[["", "Nenhum"]].concat(socios.map(function(q){ return [q.id, q.nome]; }))}),
        fixo(e(Botao,{principal:true, desabilitado:!f.nome.trim(), onClick:criar}, "Criar prestador")))),
    ff.prest.length===0 ? e("p",{className:"rounded-lg border-2 border-[var(--bloco-titulo)] bg-card/60 px-3 py-4 text-center text-[13px]"}, "Nenhum prestador ainda.") :
      e(BlocoPainel,{titulo:"Prestadores", compacto:false, cls:COMPACTA},
        e(TabelaPlanilha,{cols:colsPrest, linhas:linhasPrest, chave:"id", grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true, totalRodape:rodapePrest, vazio:"Nenhum prestador.",
          aoClicar:function(l){ sel[1](l.id); setTimeout(function(){ var el = document.getElementById("prest-detalhe"); if(el && el.scrollIntoView) el.scrollIntoView({behavior:"smooth", block:"nearest"}); }, 60); },
          linhaCls:function(l){ return l.id===selId ? "!bg-[#26385c]" : ""; }})),
    e("div",{id:"prest-detalhe", key:"detalhe"},
      escolhido ? e(BlocoPainel,{titulo:tituloEsc, compacto:false, cls:FUNDO, dir:dirEsc},
        e("div",{className:"w-0 min-w-full overflow-x-auto", "data-sem-arrastar":""}, e(DetPrest,{key:escolhido.id, c:c, x:escolhido, fechar:function(){ sel[1](""); }}))) :
      ordenados.length>0 && e("p",{className:"rounded-lg border border-border bg-[#0f1729] px-3 py-3 text-center text-[13px]"}, "Escolha um prestador na tabela para ver todos os dados dele aqui.")));
}

// ───────────────── Pró-labores ─────────────────
function CartaoProlab(p){
  var c = p.c, ff = c.ff, pe = p.p, pr = ff.prolabore[pe.id]||{empresa:"", cnpj:"", vigencias:[]}, ve = useState({empresa:pr.empresa, cnpj:pr.cnpj}), emp = ve[0], setEmp = ve[1];
  var nv = useState({desde:hojeYm(), bruto:"", inss:"", irrf:"", split:false, valor1:"", dia1:"20", dia2:"5"}), v = nv[0], setV = nv[1], liq = liquidoDe(num(v.bruto), num(v.inss), num(v.irrf));
  var vig = vigenciaEm(ff, pe.id, p.ym);
  return e(BlocoBarra,{cor:"azul", t:pe.nome+" · pró-labore", sub:vig ? "vigência atual: desde "+nomeMes(vig.desde)+" · líquido "+BK(vig.liquido) : "sem vigência para "+nomeMes(p.ym), dir:vig ? BK(vig.liquido) : ""}, e("div",{className:"flex flex-col gap-3 p-4"},
    e("div",{className:"flex flex-wrap items-end gap-3"}, e(Campo,{rot:"Empresa", className:"min-w-[14rem] flex-1"}, e(Txt,{value:emp.empresa, label:"Empresa", onChange:function(x){ setEmp(Object.assign({}, emp, {empresa:x})); }})), e(Campo,{rot:"CNPJ"}, e(Txt,{value:emp.cnpj, label:"CNPJ", className:"w-52", onChange:function(x){ setEmp(Object.assign({}, emp, {cnpj:x})); }})),
      e(Btn,{v:"secondary", disabled:!emp.empresa.trim(), onClick:function(){ acao(c, "prolab_set", {personaId:pe.id, empresa:emp.empresa, cnpj:emp.cnpj}); }}, "Salvar empresa")),
    e("div",{className:"flex flex-col gap-2 rounded-xl bg-black/20 p-3"}, e("b",{className:"text-[13.5px]"}, "Nova vigência (muda o valor daqui para a frente; o passado não muda)"),
      e("div",{className:"flex flex-wrap items-end gap-2"}, e(Campo,{rot:"A partir de"}, e(Txt,{value:v.desde, type:"month", label:"Desde", className:"w-40", onChange:function(x){ setV(Object.assign({}, v, {desde:x})); }})),
        e(Campo,{rot:"Bruto (R$)"}, e(Txt,{value:v.bruto, label:"Bruto", className:"w-28", onChange:function(x){ setV(Object.assign({}, v, {bruto:x.replace(/[^\d,.]/g,"")})); }})), e(Campo,{rot:"INSS"}, e(Txt,{value:v.inss, label:"INSS", className:"w-24", onChange:function(x){ setV(Object.assign({}, v, {inss:x.replace(/[^\d,.]/g,"")})); }})), e(Campo,{rot:"IRRF"}, e(Txt,{value:v.irrf, label:"IRRF", className:"w-24", onChange:function(x){ setV(Object.assign({}, v, {irrf:x.replace(/[^\d,.]/g,"")})); }})),
        e("span",{className:"pb-2 text-[13px]"}, "Líquido ", e("b",{className:MONO+" text-primary"}, BK(liq))), e("label",{className:"flex cursor-pointer items-center gap-1.5 pb-2 text-[12.5px]"}, e("input",{type:"checkbox", checked:v.split, className:"size-4", onChange:function(ev){ setV(Object.assign({}, v, {split:ev.target.checked})); }}), "pagar em duas datas")),
      v.split && e("div",{className:"flex flex-wrap items-end gap-2"}, e(Campo,{rot:"Dia do adiantamento"}, e(Txt,{value:v.dia1, label:"Dia 1", className:"w-24 text-center", onChange:function(x){ setV(Object.assign({}, v, {dia1:x.replace(/\D/g,"")})); }})), e(Campo,{rot:"Valor do adiantamento"}, e(Txt,{value:v.valor1, label:"Valor 1", className:"w-32", onChange:function(x){ setV(Object.assign({}, v, {valor1:x.replace(/[^\d,.]/g,"")})); }})),
        e(Campo,{rot:"Dia do saldo"}, e(Txt,{value:v.dia2, label:"Dia 2", className:"w-24 text-center", onChange:function(x){ setV(Object.assign({}, v, {dia2:x.replace(/\D/g,"")})); }})), e("span",{className:"pb-2 text-[13px]"}, "Saldo ", e("b",{className:MONO}, BK(Math.max(0, r2(liq-num(v.valor1))))))),
      e("div",null, e(Btn,{v:"primary", sm:true, disabled:!(liq>0), onClick:function(){ acao(c, "prolab_vig_add", {personaId:pe.id, desde:v.desde, bruto:num(v.bruto), inss:num(v.inss), irrf:num(v.irrf), split:v.split, valor1:num(v.valor1), dia1:v.dia1, dia2:v.dia2}); }}, "Criar vigência"))),
    pr.vigencias.length>0 && e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Desde"), th("Bruto"), th("INSS"), th("IRRF"), th("Líquido"), th("Datas"), th("")])), e("tbody",null, pr.vigencias.slice().sort(function(a, b){ return b.desde.localeCompare(a.desde); }).map(function(x){ return e("tr",{key:x.id, className:"border-b border-border/60"},
      e("td",{className:TD+" font-semibold"}, nomeMes(x.desde)), e("td",{className:TD+" "+MONO}, BK(x.bruto)), e("td",{className:TD+" "+MONO}, BK(x.inss)), e("td",{className:TD+" "+MONO}, BK(x.irrf)), e("td",{className:TD+" font-bold "+MONO}, BK(x.liquido)), e("td",{className:TD+" text-[12.5px]"}, x.valor1 ? "dia "+x.dia1+": "+BK(x.valor1)+" · dia "+x.dia2+": "+BK(x.valor2) : "dia 5"), e("td",{className:TD}, iconBtn("trash", "Excluir vigência", function(){ acao(c, "prolab_vig_del", {personaId:pe.id, id:x.id}); }, true))); }))))));
}
function AbaFfProlab(){
  var c = useFF(), ff = c.ff, ms = useState(hojeYm()), ym = ms[0], setYm = ms[1];
  return e(Guarda,{c:c}, e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Pró-labores", sub:"O valor do pró-labore de cada sócio por vigência. Em \"Gerar contas do mês\" ele vira conta a pagar (uma ou duas parcelas). Gerar de novo não repete nem apaga o que já foi pago."}),
    e("div",{className:"flex flex-wrap items-center gap-3"}, e(MesSel,{ym:ym, set:setYm}), e(Btn,{v:"primary", onClick:function(){ acao(c, "prolab_gerar", {ym:ym}); }}, "Gerar contas de "+MESES[Number(ym.slice(5,7))-1])),
    ff.personas.filter(function(p){ return p.ativo && p.tipo==="SOCIO"; }).map(function(p){ return e(CartaoProlab,{key:p.id+ym, c:c, p:p, ym:ym}); })));
}

// ───────────────── Relatório ─────────────────
function AbaFfRelatorio(){
  var c = useFF(), ff = c.ff, ms = useState(hojeYm()), ym = ms[0], setYm = ms[1], fech = ff.fechamentos[ym], dados = fech ? fech.snapshot : relatorioMes(ff, ym);
  var tot = function(k){ return r2(dados.reduce(function(t, x){ return t+k(x); }, 0)); };
  return e(Guarda,{c:c}, e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Relatório do mês", sub:"Os números de cada pessoa no mês. Fechar o mês guarda uma foto dos números (não trava as edições; quem trava é a liberação em Configurações)."}),
    e("div",{className:"flex flex-wrap items-center gap-3"}, e(MesSel,{ym:ym, set:setYm}), fech ? e(React.Fragment,null, e("span",{className:"rounded-full bg-success/20 px-3 py-1 text-[12.5px] font-bold text-success"}, "Fechado em "+new Date(fech.em).toLocaleDateString("pt-BR")+" por "+fech.por), e(Btn,{v:"ghost", onClick:function(){ if(window.confirm("Reabrir "+nomeMes(ym)+"? A foto guardada será apagada.")) acao(c, "reabrir", {ym:ym}); }}, "Reabrir")) :
      e(Btn,{v:"secondary", onClick:function(){ if(window.confirm("Fechar "+nomeMes(ym)+" e guardar os números?")) acao(c, "fechar", {ym:ym}); }}, "Fechar o mês")),
    e("div",{className:"grid grid-cols-2 gap-3 xl:grid-cols-4"}, e(Tile,{t:"Contas do mês", v:BK(tot(function(x){ return x.contas.total; })), cor:"#F472B6"}), e(Tile,{t:"Já pago", v:BK(tot(function(x){ return x.contas.pago; })), cor:"#4ADE80"}), e(Tile,{t:"Falta pagar", v:BK(tot(function(x){ return x.contas.restante; })), cor:"#F59E0B"}), e(Tile,{t:"PIX recebido", v:BK(tot(function(x){ return x.pix.recebido; })), cor:"#60A5FA"})),
    e(BlocoBarra,{cor:"azul", t:"Por pessoa", sub:fech ? "foto guardada no fechamento" : "ao vivo (sem o pró-labore nas contas, para não contar em dobro)"}, e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"},
      e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Pessoa"), th("Contas"), th("Pago"), th("Pendente"), th("PIX meta"), th("PIX recebido"), th("Pró-labore líquido"), th("Saldo de prestadores")])),
      e("tbody",null, dados.map(function(x){ return e("tr",{key:x.id, className:"border-b border-border/60"}, e("td",{className:TD+" font-semibold"}, x.nome), e("td",{className:TD+" "+MONO}, BK(x.contas.total)), e("td",{className:TD+" "+MONO}, BK(x.contas.pago)), e("td",{className:TD+" "+MONO}, BK(x.contas.restante)), e("td",{className:TD+" "+MONO}, BK(x.pix.meta)), e("td",{className:TD+" "+MONO}, BK(x.pix.recebido)), e("td",{className:TD+" "+MONO}, BK(x.proLiquido)), e("td",{className:TD+" "+MONO}, BK(x.saldoPrest))); })))))));
}

// ───────────────── Histórico ─────────────────
function AbaFfHist(){
  var c = useFF(), ff = c.ff, es = useState({area:"", usuario:"", busca:"", de:"", ate:"", pag:0}), f = es[0], set = function(o){ es[1](Object.assign({}, f, {pag:0}, o)); }, q = f.busca.trim().toLowerCase();
  var areas = [], usuarios = []; ff.hist.forEach(function(h){ if(areas.indexOf(h.area)<0) areas.push(h.area); if(usuarios.indexOf(h.por)<0) usuarios.push(h.por); });
  var iso = function(t){ var d = new Date(t); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
  var lista = ff.hist.filter(function(h){ return (!f.area || h.area===f.area) && (!f.usuario || h.por===f.usuario) && (!f.de || iso(h.em)>=f.de) && (!f.ate || iso(h.em)<=f.ate) && (!q || (h.alvo+" "+h.detalhe+" "+h.acao+" "+h.por).toLowerCase().indexOf(q)>=0); });
  var pg = lista.slice(f.pag*50, f.pag*50+50), perigo = function(a){ return /Excluiu|Reverteu|Rejeitou|Tirou/.test(a); }, bom = function(a){ return /baixa|Confirmou|Fechou|Lançou|Anotou/.test(a); };
  return e(Guarda,{c:c}, e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Histórico", sub:"Tudo o que foi feito no Financeiro Familiar, do mais novo para o mais antigo: quando, quem, em quê. Começa a contar a partir de hoje."}),
    e("div",{className:"flex flex-wrap items-end gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-[#EC4899]/30"}, e(Txt,{value:f.de, type:"date", label:"De", className:"w-40", onChange:function(v){ set({de:v}); }}), e(Txt,{value:f.ate, type:"date", label:"Até", className:"w-40", onChange:function(v){ set({ate:v}); }}),
      e(Sel,{value:f.area, label:"Área", className:"w-48", onChange:function(v){ set({area:v}); }}, e("option",{value:""}, "Todas as áreas"), areas.map(function(a){ return e("option",{key:a, value:a}, a); })), e(Sel,{value:f.usuario, label:"Quem", className:"w-44", onChange:function(v){ set({usuario:v}); }}, e("option",{value:""}, "Todos"), usuarios.map(function(a){ return e("option",{key:a, value:a}, a); })),
      e(Txt,{value:f.busca, ph:"Buscar", label:"Buscar", className:"w-56", onChange:function(v){ set({busca:v}); }})),
    e(BlocoBarra,{cor:"azul", t:"Ações registradas", sub:lista.length+" no filtro", dir:String(lista.length)}, lista.length===0 ? e("p",{className:"px-4 py-8 text-center text-[13.5px] text-muted-foreground"}, "Nada registrado ainda.") :
      e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Quando"), th("Quem"), th("Área"), th("Ação"), th("Em quê")])),
        e("tbody",null, pg.map(function(h){ return e("tr",{key:h.id, className:"border-b border-border/60"}, e("td",{className:TD+" whitespace-nowrap text-[12.5px]"}, new Date(h.em).toLocaleString("pt-BR",{dateStyle:"short", timeStyle:"short"})), e("td",{className:TD}, h.por), e("td",{className:TD}, h.area),
          e("td",{className:TD}, e("span",{className:"whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-bold "+(perigo(h.acao) ? "bg-destructive/20 text-destructive" : bom(h.acao) ? "bg-success/20 text-success" : "bg-white/10")}, h.acao)), e("td",{className:TD}, h.alvo, h.detalhe && e("span",{className:"block text-[11.5px] text-muted-foreground"}, h.detalhe))); }))))),
    lista.length>50 && e("div",{className:"flex items-center justify-center gap-3"}, e(Btn,{v:"ghost", sm:true, disabled:f.pag===0, onClick:function(){ es[1](Object.assign({}, f, {pag:f.pag-1})); }}, "‹ Anterior"), e("span",{className:"text-[13px]"}, "Página "+(f.pag+1)+" de "+Math.ceil(lista.length/50)), e(Btn,{v:"ghost", sm:true, disabled:(f.pag+1)*50>=lista.length, onClick:function(){ es[1](Object.assign({}, f, {pag:f.pag+1})); }}, "Próxima ›"))));
}

// ───────────────── Configurações ─────────────────
function AbaFfConfig(){
  var c = useFF(), ff = c.ff, np = useState({nome:"", tipo:"SOCIO", cor:"#EC4899"}), pn = np[0], setPn = np[1], nc = useState(""), cat = nc[0], setCat = nc[1], nb = useState({nome:"", banco:"", tipo:"PF", chavePix:"", personaId:""}), cb = nb[0], setCb = nb[1], nm = useState(somaMes(hojeYm(), -1)), mes = nm[0], setMes = nm[1];
  var campo = function(v, ac, cls){ return e("input",{key:v, defaultValue:v, className:INPUT+" h-9! "+(cls||"w-full"), onBlur:function(ev){ if(ev.target.value!==v) ac(ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); }}); };
  var chk = function(on, ac, t){ return e("label",{className:"flex cursor-pointer items-center gap-1.5 text-[12.5px]"}, e("input",{type:"checkbox", checked:!!on, className:"size-4", onChange:function(ev){ ac(ev.target.checked); }}), t); };
  var contasFam = ff.contasBanc.filter(function(b){ return !b.prestadorId; }), passados = []; for(var i=1; i<=12; i++) passados.push(somaMes(hojeYm(), -i));
  return e(Guarda,{c:c}, e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Configurações do Financeiro Familiar", sub:"Pessoas, categorias, contas bancárias da família e a liberação de meses passados."}),
    e(BlocoBarra,{cor:"azul", t:"Pessoas", sub:"o que aparece na Home de cada uma"}, e("div",{className:"flex flex-col gap-2 p-4"}, ff.personas.map(function(p){ return e("div",{key:p.id, className:"flex flex-wrap items-center gap-3"},
      e("input",{type:"color", value:p.cor, "aria-label":"Cor", className:"h-9 w-10 cursor-pointer rounded", onChange:function(ev){ acao(c, "persona_set", {id:p.id, patch:{cor:ev.target.value}}); }}), campo(p.nome, function(v){ acao(c, "persona_set", {id:p.id, patch:{nome:v}}); }, "w-48"), e("span",{className:"w-16 text-[12px] text-muted-foreground"}, p.tipo==="SOCIO" ? "Sócio" : "Família"),
      chk(p.ativo, function(v){ acao(c, "persona_set", {id:p.id, patch:{ativo:v}}); }, "ativa"), chk(p.mostrarProlabore, function(v){ acao(c, "persona_set", {id:p.id, patch:{mostrarProlabore:v}}); }, "pró-labore"), chk(p.mostrarContas, function(v){ acao(c, "persona_set", {id:p.id, patch:{mostrarContas:v}}); }, "contas"), chk(p.mostrarPix, function(v){ acao(c, "persona_set", {id:p.id, patch:{mostrarPix:v}}); }, "PIX")); }),
      e("div",{className:"flex flex-wrap items-end gap-2 border-t border-white/10 pt-2"}, e("input",{type:"color", value:pn.cor, "aria-label":"Cor", className:"h-9 w-10 cursor-pointer rounded", onChange:function(ev){ setPn(Object.assign({}, pn, {cor:ev.target.value})); }}), e(Txt,{value:pn.nome, ph:"Nome", label:"Nome", className:"w-48", onChange:function(v){ setPn(Object.assign({}, pn, {nome:v})); }}),
        e(Sel,{value:pn.tipo, label:"Tipo", className:"w-36", onChange:function(v){ setPn(Object.assign({}, pn, {tipo:v})); }}, e("option",{value:"SOCIO"}, "Sócio"), e("option",{value:"FAMILIAR"}, "Família")), e(Btn,{v:"secondary", sm:true, disabled:!pn.nome.trim(), onClick:function(){ acao(c, "persona_add", pn); setPn(Object.assign({}, pn, {nome:""})); }}, "+ Pessoa")))),
    e(BlocoBarra,{cor:"azul", t:"Categorias", sub:"Pró-labore é do sistema e não se exclui"}, e("div",{className:"flex flex-col gap-2 p-4"}, ff.categorias.map(function(k){ return e("div",{key:k.chave, className:"flex items-center gap-2"}, k.sistema ? e("span",{className:"w-64 text-[13.5px] font-semibold"}, k.nome+" (sistema)") : campo(k.nome, function(v){ acao(c, "cat_set", {chave:k.chave, nome:v}); }, "w-64"), !k.sistema && iconBtn("trash", "Excluir", function(){ acao(c, "cat_del", {chave:k.chave}); }, true)); }),
      e("div",{className:"flex items-center gap-2 border-t border-white/10 pt-2"}, e(Txt,{value:cat, ph:"Nova categoria", label:"Nova categoria", className:"w-64", onChange:setCat, onEnter:function(){ if(cat.trim()){ acao(c, "cat_add", {nome:cat}); setCat(""); } }}), e(Btn,{v:"secondary", sm:true, disabled:!cat.trim(), onClick:function(){ acao(c, "cat_add", {nome:cat}); setCat(""); }}, "+ Categoria")))),
    e(BlocoBarra,{cor:"azul", t:"Contas bancárias da família", sub:"usadas como conta pagadora e como conta que recebe PIX (as de prestadores ficam em Prestadores)"}, e("div",{className:"flex flex-col gap-2 p-4"},
      contasFam.map(function(b){ return e("div",{key:b.id, className:"flex flex-wrap items-center gap-2 text-[13.5px]"}, e("b",{className:"min-w-[12rem]"}, contaLabel(ff, b.id)), e("span",{className:"text-muted-foreground"}, b.tipo+" · "+(b.chavePix||"sem chave PIX")+" · "+(b.personaId ? pessoaNome(ff, b.personaId) : "sem pessoa")), chk(b.ativo, function(v){ acao(c, "cb_set", {id:b.id, patch:{ativo:v}}); }, "ativa"), iconBtn("trash", "Excluir", function(){ acao(c, "cb_del", {id:b.id}); }, true)); }),
      e("div",{className:"flex flex-wrap items-end gap-2 border-t border-white/10 pt-2"}, e(Txt,{value:cb.nome, ph:"Nome / titular", label:"Nome", className:"w-44", onChange:function(v){ setCb(Object.assign({}, cb, {nome:v})); }}), e(Txt,{value:cb.banco, ph:"Banco", label:"Banco", className:"w-32", onChange:function(v){ setCb(Object.assign({}, cb, {banco:v})); }}),
        e(Sel,{value:cb.tipo, label:"Tipo", className:"w-24", onChange:function(v){ setCb(Object.assign({}, cb, {tipo:v})); }}, e("option",{value:"PF"}, "PF"), e("option",{value:"PJ"}, "PJ")), e(Txt,{value:cb.chavePix, ph:"Chave PIX", label:"Chave PIX", className:"w-44", onChange:function(v){ setCb(Object.assign({}, cb, {chavePix:v})); }}),
        e(Sel,{value:cb.personaId, label:"Pessoa", className:"w-40", onChange:function(v){ setCb(Object.assign({}, cb, {personaId:v})); }}, e("option",{value:""}, "Sem pessoa"), ff.personas.map(function(p){ return e("option",{key:p.id, value:p.id}, p.nome); })), e(Btn,{v:"secondary", sm:true, disabled:!cb.nome.trim(), onClick:function(){ acao(c, "cb_add", cb); setCb(Object.assign({}, cb, {nome:"", chavePix:""})); }}, "+ Conta")))),
    e(BlocoBarra,{cor:"azul", t:"Lançamento retroativo", sub:"mês passado fica travado para corrigir valor ou desfazer pagamento; libere aqui só quando precisar"}, e("div",{className:"flex flex-col gap-3 p-4"},
      e("div",{className:"flex flex-wrap items-end gap-2"}, e(Sel,{value:mes, label:"Mês", className:"w-52", onChange:setMes}, passados.map(function(k){ return e("option",{key:k, value:k}, nomeMes(k)); })), e(Btn,{v:"secondary", disabled:ff.liberados.indexOf(mes)>=0, onClick:function(){ acao(c, "mes_liberar", {ym:mes}); }}, "Liberar")),
      ff.liberados.length>0 && e("div",{className:"flex flex-wrap gap-2"}, ff.liberados.slice().sort().map(function(k){ return e("span",{key:k, className:"flex items-center gap-2 rounded-full bg-warning/20 px-3 py-1 text-[12.5px] font-bold text-warning"}, nomeMes(k)+" liberado", e("button",{onClick:function(){ acao(c, "mes_revogar", {ym:k}); }, className:"underline"}, "travar")); }))))));
}

export { DetPrest, DetHome, AbaFfHome, AbaFfContas, AbaFfPagas, AbaFfPix, AbaFfPrest, AbaFfProlab, AbaFfRelatorio, AbaFfHist, AbaFfConfig };

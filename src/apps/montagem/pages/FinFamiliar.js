// Sorelly Admin · montagem — pages/FinFamiliar.js
// Financeiro Familiar trazido do SorellyAdmin: Home, Alertas, Contas a pagar, Contas pagas, PIX revendedoras, Prestadores, Pró-labores, Relatório, Histórico e Configurações.
// As regras e as contas ficam em domain/financeiro-familiar.js; aqui só as telas. Só os sócios (ACESSO_FF) abrem. Dados só neste navegador.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { FAMILIA4, daPessoa, membrosFamilia, ACESSO_FF, FORMAS, FORMAS_REPASSE, MESES, TIPOS_REGRA, alertasDe, br, hojeIso, hojeYm, janela, liquidoDe, nomeMes, parcelasDe, pixDivisao, pixDoMes, relatorioMes, saldoPrestador, somaMes, totaisPersona, vigenciaEm, ultimoDia, r2 } from "@/apps/montagem/domain/financeiro-familiar";
import { BKC as BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { Indicador } from "@/apps/montagem/components/padrao";
import { e, useState } from "@/shared/react";
import React from "react";

var int = function(v){ return Math.round(v||0).toLocaleString("pt-BR"); };
var num = function(t){ var n = Number(String(t||"").replace(/\./g,"").replace(",",".")); return isNaN(n) ? 0 : n; };
var fmtN = function(v){ return Number(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}); };
var th = function(t, c){ return e("th",{key:t, className:"whitespace-nowrap border-b border-border px-3 py-2 text-left text-[11.5px] font-semibold uppercase tracking-wide "+(c||"")}, t); };
var TD = "px-3 py-2 text-[13.5px]";
var CARD = "rounded-xl bg-linear-to-br from-[#3B82F6]/20 via-card to-card px-3 py-2 ring-1 ring-[#3B82F6]/40";
var AVISO = "flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-[13.5px] font-medium text-destructive";

function useFF(){ var cx = use(), s = cx.state; return {s:s, d:cx.dispatch, ff:s.ff, por:nomeDe(s.usuario), pode:ACESSO_FF.indexOf(s.usuario)>=0}; }
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
function AbaFfHome(){
  var c = useFF(), ff = c.ff, ms = useState(hojeYm()), ym = ms[0], setYm = ms[1];
  var ir = function(aba){ c.d({type:"ABA", aba:aba}); };
  var bloco = function(t, linhas, aba, cor){ return e("button",{key:t, type:"button", onClick:function(){ ir(aba); }, className:"flex flex-col gap-1 rounded-xl bg-black/25 p-3 text-left transition hover:bg-black/35"},
    e("span",{className:"text-[11px] font-bold uppercase tracking-[.12em]", style:{color:cor}}, t), linhas.map(function(l){ return e("span",{key:l[0], className:"flex items-center justify-between text-[13px]"}, e("span",{className:"text-white/75"}, l[0]), e("b",{className:MONO}, l[1])); })); };
  return e(Guarda,{c:c}, e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Financeiro Familiar", sub:"A foto do mês de cada pessoa: pró-labore, contas a pagar e PIX das revendedoras. Clique num bloco para abrir a tela."}),
    e("div",null, e(MesSel,{ym:ym, set:setYm})),
    ff.personas.filter(function(p){ return p.ativo; }).length===0 ? e("p",{className:"rounded-xl bg-muted/30 px-4 py-6 text-center text-[14px] text-muted-foreground"}, "Nenhuma pessoa ativa. Crie em Configurações.") :
    e("div",{className:"grid grid-cols-1 gap-4 xl:grid-cols-2"}, ff.personas.filter(function(p){ return p.ativo; }).map(function(p){ var t = totaisPersona(ff, p.id, ym);
      return e("div",{key:p.id, className:"flex flex-col gap-3 rounded-2xl p-4", style:{background:"linear-gradient(135deg,"+p.cor+"3d,"+p.cor+"0d 70%)", boxShadow:"inset 0 0 0 1px "+p.cor+"66"}},
        e("div",{className:"flex items-center justify-between"}, e("b",{className:"text-[17px]"}, p.nome), e("span",{className:"rounded-full bg-black/30 px-2.5 py-0.5 text-[11px] font-bold"}, p.tipo==="SOCIO" ? "Sócio" : "Família")),
        e("div",{className:"grid grid-cols-1 gap-2 md:grid-cols-3"},
          p.mostrarProlabore && bloco("Pró-labore", [["Recebido", BK(t.pro.recebido)], ["Restante", BK(t.pro.restante)], ["Total", BK(t.pro.total)]], "ffprolab", p.cor),
          p.mostrarContas && bloco("Contas a pagar", [["Pago", BK(t.contas.pago)], ["Restante", BK(t.contas.restante)], ["Total", BK(t.contas.total)], ["Pendentes", String(t.contas.pendentes)]], "ffcontas", p.cor),
          p.mostrarPix && bloco("PIX revendedora", [["Enviado", BK(t.pix.recebido)], ["Restante", BK(t.pix.restante)], ["Meta", BK(t.pix.meta)]], "ffpix", p.cor)),
        e("div",{className:"flex items-center justify-between rounded-xl bg-black/30 px-3 py-2 text-[13.5px]"}, e("span",null, "A pagar no mês (contas + pró-labore)"), e("b",{className:MONO+" text-[17px]"}, BK(t.contas.total+t.pro.total)))); }))));
}

// ───────────────── Alertas ─────────────────
function AbaFfAlertas(){
  var c = useFF(), ff = c.ff, al = alertasDe(ff), nf = useState({tipo:"CONTAS_MES_ACIMA", limite:"", personaId:""}), f = nf[0], setF = nf[1];
  return e(Guarda,{c:c}, e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Alertas", sub:"O que precisa de atenção neste mês: prazos de dívida, contas atrasadas, PIX esperando conferência e os alertas que você mesmo cria."}),
    e(BlocoBarra,{cor:"azul", t:"Agora", sub:al.length+(al.length===1 ? " alerta" : " alertas"), dir:String(al.length)}, al.length===0 ? e("p",{className:"px-4 py-8 text-center text-[13.5px] text-success"}, "✓ Nada a resolver agora.") :
      e("div",{className:"flex flex-col gap-2 p-4"}, al.map(function(x, i){ return e("div",{key:i, className:"flex items-start gap-3 rounded-xl border px-4 py-2.5 "+(x.grave ? "border-destructive/40 bg-destructive/10" : "border-warning/40 bg-warning/10")}, e(Ph,{n:"warning", s:18, fill:true, className:x.grave ? "text-destructive" : "text-warning"}), e("span",null, e("b",{className:"block text-[14px]"}, x.titulo), e("span",{className:"text-[13px] opacity-90"}, x.texto))); }))),
    e(BlocoBarra,{cor:"azul", t:"Meus alertas (regras)", sub:"dispara quando o limite é passado no mês corrente"}, e("div",{className:"flex flex-col gap-3 p-4"},
      e("div",{className:"flex flex-wrap items-end gap-3"},
        e(Campo,{rot:"Quando"}, e(Sel,{value:f.tipo, label:"Tipo", className:"w-72", onChange:function(v){ setF(Object.assign({}, f, {tipo:v})); }}, TIPOS_REGRA.map(function(t){ return e("option",{key:t[0], value:t[0]}, t[1]); }))),
        e(Campo,{rot:"Limite"}, e(Txt,{value:f.limite, label:"Limite", className:"w-32 text-center", ph:"0", onChange:function(v){ setF(Object.assign({}, f, {limite:v.replace(/[^\d,.]/g,"")})); }})),
        e(Campo,{rot:"Para"}, e(Sel,{value:f.personaId, label:"Pessoa", onChange:function(v){ setF(Object.assign({}, f, {personaId:v})); }}, e("option",{value:""}, "Todos"), ff.personas.map(function(p){ return e("option",{key:p.id, value:p.id}, p.nome); }))),
        e(Btn,{v:"primary", disabled:!(num(f.limite)>0), onClick:function(){ acao(c, "regra_add", {tipo:f.tipo, limite:num(f.limite), personaId:f.personaId}); setF(Object.assign({}, f, {limite:""})); }}, "Criar regra")),
      ff.regras.length>0 && e("div",{className:"flex flex-col divide-y divide-white/10"}, ff.regras.map(function(r){ return e("div",{key:r.id, className:"flex flex-wrap items-center justify-between gap-2 py-2 text-[13.5px]"},
        e("span",null, (TIPOS_REGRA.find(function(t){ return t[0]===r.tipo; })||[])[1]+": ", e("b",{className:MONO}, int(r.limite)), " · "+(r.personaId ? pessoaNome(ff, r.personaId) : "todos")),
        e("span",{className:"flex items-center gap-2"}, e("label",{className:"flex cursor-pointer items-center gap-1.5 text-[12.5px]"}, e("input",{type:"checkbox", checked:r.ativo, className:"size-4", onChange:function(ev){ acao(c, "regra_set", {id:r.id, patch:{ativo:ev.target.checked}}); }}), "ativa"), iconBtn("trash", "Excluir", function(){ acao(c, "regra_del", {id:r.id}); }, true))); }))))));
}

// ───────────────── Contas a pagar ─────────────────
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
  return e(Guarda,{c:c}, e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Contas a pagar", sub:"O que ainda falta pagar. Pagou? Clique em Pagar (total ou parcial, ou dividido entre formas). Vencimento no dia 31 em fevereiro vira o último dia do mês."}),
    e("div",{className:"grid grid-cols-2 gap-3 xl:grid-cols-4"}, e(Tile,{t:"Falta pagar", v:BK(totR), cor:"#F472B6", sub:lista.length+" parcelas"}), e(Tile,{t:"Atrasado", v:BK(atr), cor:atr>0 ? "#EF4444" : "#4ADE80", sub:atr>0 ? "já venceu" : "tudo em dia"}),
      e(Tile,{t:"Pendentes", v:int(lista.filter(function(x){ return x.status==="PENDENTE"; }).length), cor:"#E8B84B"}), e(Tile,{t:"Parciais", v:int(lista.filter(function(x){ return x.status==="PARCIAL"; }).length), cor:"#F59E0B"})),
    e("div",{className:"flex flex-wrap items-end gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-[#EC4899]/30"},
      e(MesSel,{ym:f.ym, set:function(v){ set({ym:v}); }, todos:true}),
      e(Sel,{value:f.pessoa, label:"Pessoa", className:"w-44", onChange:function(v){ set({pessoa:v}); }}, e("option",{value:""}, "Todas as pessoas"), ff.personas.map(function(p){ return e("option",{key:p.id, value:p.id}, p.nome); })),
      e(Sel,{value:f.cat, label:"Categoria", className:"w-48", onChange:function(v){ set({cat:v}); }}, e("option",{value:""}, "Todas as categorias"), ff.categorias.map(function(k){ return e("option",{key:k.chave, value:k.chave}, k.nome); })),
      e(Sel,{value:f.status, label:"Situação", className:"w-40", onChange:function(v){ set({status:v}); }}, e("option",{value:""}, "Qualquer situação"), e("option",{value:"pendente"}, "Pendente"), e("option",{value:"parcial"}, "Parcial"), e("option",{value:"atrasado"}, "Atrasado")),
      e(Txt,{value:f.busca, ph:"Buscar descrição, beneficiário ou valor", label:"Buscar", className:"w-64", onChange:function(v){ set({busca:v}); }}), e("span",{className:"flex-1"}), e(Btn,{v:"primary", onClick:function(){ setModal({tipo:"conta"}); }}, "+ Lançar conta")),
    e(BlocoBarra,{cor:"azul", t:"A pagar", sub:f.ym ? nomeMes(f.ym) : "todos os meses (6 para trás, 12 para a frente)", dir:BK(totR)},
      lista.length===0 ? e("p",{className:"px-4 py-8 text-center text-[13.5px] text-muted-foreground"}, "Nada para pagar neste filtro.") :
      e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Vence"), th("Pessoa"), th("Descrição"), th("Categoria"), th("Beneficiário"), th("Valor"), th("Falta"), th("Situação"), th("")])),
        e("tbody",null, lista.map(function(x){ return e("tr",{key:x.chave, className:"border-b border-border/60"},
          e("td",{className:TD+" "+MONO}, br(x.venc).slice(0,5)+(f.ym ? "" : "/"+x.ym.slice(2,4))), e("td",{className:TD}, e("span",{className:"inline-flex items-center gap-1.5"}, e("span",{className:"size-2.5 rounded-full", style:{background:corPessoa(ff, x.conta.personaId)}}), pessoaNome(ff, x.conta.personaId)+(x.conta.rateio && x.conta.rateio.length ? " ÷"+x.conta.rateio.length : ""))),
          e("td",{className:TD+" font-semibold"}, x.conta.descricao, x.conta.obs && e("span",{className:"block text-[11.5px] font-normal text-muted-foreground"}, x.conta.obs)), e("td",{className:TD}, catNome(ff, x.conta.categoria)), e("td",{className:TD}, x.conta.beneficiario||"—"),
          e("td",{className:TD+" "+MONO}, BK(x.valor)), e("td",{className:TD+" font-bold "+MONO}, BK(x.restante), x.pago>0 && e("span",{className:"block text-[11px] font-normal text-muted-foreground"}, "pago "+BK(x.pago))), e("td",{className:TD}, statusChip(x)),
          e("td",{className:TD}, e("div",{className:"flex items-center gap-1.5"}, e(Btn,{v:"primary", sm:true, onClick:function(){ setModal({tipo:"pagar", x:x}); }}, "Pagar"), iconBtn("pencil-simple", "Corrigir o valor deste mês", function(){ var v = window.prompt("Novo valor de "+nomeMes(x.ym)+" (R$):", fmtN(x.valor)); if(v!==null && num(v)>0) acao(c, "parc_valor", {id:x.conta.id, ym:x.ym, valor:num(v)}); }),
            iconBtn("gear-six", "Editar a conta", function(){ setModal({tipo:"conta", x:x.conta}); }), iconBtn("trash", "Excluir a conta inteira", function(){ if(window.confirm("Excluir \""+x.conta.descricao+"\" com TODAS as parcelas e pagamentos?")) acao(c, "conta_del", {id:x.conta.id}); }, true)))); }))))),
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
function CartaoPix(p){
  var c = p.c, ff = c.ff, pe = p.p, ym = p.ym, t = totaisPersona(ff, pe.id, ym), dv = pixDivisao(ff, pe.id, ym), nf = useState({data:hojeIso(), valor:"", origem:"", contaId:"", forma:"PIX"}), f = nf[0], setF = nf[1];
  var lista = ff.pix.filter(function(x){ return x.personaId===pe.id && x.data.slice(0,7)===ym; }).sort(function(a, b){ return b.data.localeCompare(a.data); }), cbs = ff.contasBanc.filter(function(b){ return b.ativo && (!b.personaId || b.personaId===pe.id || b.prestadorId); });
  var cor = {CONFIRMADO:["#22C55E","Confirmado"], PENDENTE:["#F59E0B","Aguardando"], REJEITADO:["#EF4444","Rejeitado"]};
  return e(BlocoBarra,{cor:"azul", t:pe.nome+" · PIX das revendedoras", sub:nomeMes(ym), dir:BK(t.pix.recebido)}, e("div",{className:"flex flex-col gap-3 p-4"},
    e("div",{className:"grid grid-cols-2 gap-3 xl:grid-cols-4"}, e(Tile,{t:"Recebido", v:BK(t.pix.recebido), cor:"#4ADE80"}),
      e("div",{className:CARD+" flex flex-col items-center text-center"}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-[.12em] text-muted-foreground"}, "Meta do mês (R$)"), e("input",{key:t.pix.meta, defaultValue:t.pix.meta ? fmtN(t.pix.meta) : "", placeholder:"definir", className:INPUT+" mt-1 h-9! w-36 text-center "+MONO, onBlur:function(ev){ var v = num(ev.target.value); if(v!==t.pix.meta) acao(c, "pix_meta", {personaId:pe.id, ym:ym, valor:v}); }, onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); }})),
      e(Tile,{t:"Falta para a meta", v:BK(t.pix.restante), cor:"#F472B6", sub:t.pix.meta>0 ? Math.round(t.pix.recebido/t.pix.meta*100)+"% da meta" : "sem meta"}), e(Tile,{t:"Direto × prestadores", v:BK(dv.direto), cor:"#60A5FA", sub:"prestadores: "+BK(dv.prestadores)})),
    e("div",{className:"flex flex-wrap items-end gap-2 rounded-xl bg-black/25 p-3"},
      e(Campo,{rot:"Data"}, e(Txt,{value:f.data, type:"date", label:"Data", className:"w-40", onChange:function(v){ setF(Object.assign({}, f, {data:v})); }})), e(Campo,{rot:"Valor (R$)"}, e(Txt,{value:f.valor, label:"Valor", className:"w-32", onChange:function(v){ setF(Object.assign({}, f, {valor:v.replace(/[^\d,.]/g,"")})); }})),
      e(Campo,{rot:"Revendedora", className:"min-w-[10rem] flex-1"}, e(Txt,{value:f.origem, label:"Revendedora", onChange:function(v){ setF(Object.assign({}, f, {origem:v})); }})), e(Campo,{rot:"Conta que recebeu"}, e(Sel,{value:f.contaId, label:"Conta", className:"w-52", onChange:function(v){ setF(Object.assign({}, f, {contaId:v})); }}, e("option",{value:""}, "Sem conta definida"), cbs.map(function(b){ return e("option",{key:b.id, value:b.id}, contaLabel(ff, b.id)); }))),
      e(Btn,{v:"primary", disabled:!(num(f.valor)>0) || !f.data, onClick:function(){ acao(c, "pix_add", {personaId:pe.id, data:f.data, valor:num(f.valor), origem:f.origem, contaId:f.contaId, forma:f.forma}); setF(Object.assign({}, f, {valor:"", origem:""})); }}, "Anotar PIX")),
    lista.length===0 ? e("p",{className:"py-3 text-center text-[13px] text-muted-foreground"}, "Nenhum PIX neste mês.") : e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Data"), th("Revendedora"), th("Conta"), th("Valor"), th("Conferência"), th("")])),
      e("tbody",null, lista.map(function(x){ var k = cor[x.auditoria]; return e("tr",{key:x.id, className:"border-b border-border/60"}, e("td",{className:TD}, br(x.data)), e("td",{className:TD+" font-semibold"}, x.origem||"—"), e("td",{className:TD+" text-[12.5px]"}, contaLabel(ff, x.contaId)||"—"), e("td",{className:TD+" "+MONO+(x.auditoria==="REJEITADO" ? " line-through opacity-60" : "")}, BK(x.valor)),
        e("td",{className:TD}, e("div",{className:"flex flex-wrap items-center gap-1.5"}, e("span",{className:"rounded-full px-2.5 py-0.5 text-[11.5px] font-bold", style:{background:k[0]+"26", color:k[0]}}, k[1]), ["CONFIRMADO","PENDENTE","REJEITADO"].filter(function(a){ return a!==x.auditoria; }).map(function(a){ return e("button",{key:a, onClick:function(){ acao(c, "pix_aud", {id:x.id, auditoria:a}); }, className:"rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold hover:bg-white/20"}, cor[a][1]); }))),
        e("td",{className:TD}, iconBtn("trash", "Excluir PIX", function(){ if(window.confirm("Excluir este PIX?")) acao(c, "pix_del", {id:x.id}); }, true))); }))))));
}
function AbaFfPix(){
  var c = useFF(), ms = useState(hojeYm()), ym = ms[0], setYm = ms[1], ff = c.ff;
  return e(Guarda,{c:c}, e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"PIX das revendedoras", sub:"O que cada pessoa recebeu das revendedoras no mês, contra a meta. O PIX nasce \"aguardando\"; confirme quando conferir no extrato. PIX que cai em conta de prestador vira repasse sozinho."}),
    e("div",null, e(MesSel,{ym:ym, set:setYm})),
    ff.personas.filter(function(p){ return p.ativo && p.mostrarPix; }).map(function(p){ return e(CartaoPix,{key:p.id+ym, c:c, p:p, ym:ym}); })));
}

// ───────────────── Prestadores ─────────────────
function CartaoPrest(p){
  var c = p.c, ff = c.ff, x = p.x, fm = useState("todos"), mesF = fm[0], setMesF = fm[1], nd = useState({data:hojeIso(), valor:"", prazo:""}), d = nd[0], setD = nd[1];
  var nr = useState({data:hojeIso(), valor:"", origem:"", forma:"PIX", contaTxt:"", pixRev:false}), r = nr[0], setR = nr[1];
  var dv = ff.dividas.filter(function(y){ return y.prestId===x.id && (mesF==="todos" || y.data.slice(0,7)===mesF); }).sort(function(a, b){ return b.data.localeCompare(a.data); }), rp = ff.repasses.filter(function(y){ return y.prestId===x.id && (mesF==="todos" || y.data.slice(0,7)===mesF); }).sort(function(a, b){ return b.data.localeCompare(a.data); });
  var sd = saldoPrestador(ff, x.id), somaDv = r2(dv.reduce(function(t, y){ return t+y.valor; }, 0)), somaRp = r2(rp.reduce(function(t, y){ return t+y.valor; }, 0));
  return e(BlocoBarra,{cor:"azul", t:x.nome+(x.servico ? " · "+x.servico : ""), sub:(x.ativo ? "em aberto" : "finalizado")+(x.responsavelId ? " · responsável: "+pessoaNome(ff, x.responsavelId) : ""), dir:"saldo "+BK(sd)}, e("div",{className:"flex flex-col gap-3 p-4"},
    e("div",{className:"flex flex-wrap items-end gap-3"},
      e(Campo,{rot:"Responsável (sócio)"}, e(Sel,{value:x.responsavelId, label:"Responsável", className:"w-48", onChange:function(v){ acao(c, "prest_set", {id:x.id, patch:{responsavelId:v}}); }}, e("option",{value:""}, "Nenhum"), ff.personas.filter(function(q){ return q.tipo==="SOCIO"; }).map(function(q){ return e("option",{key:q.id, value:q.id}, q.nome); }))),
      e(Campo,{rot:"Chave PIX", className:"min-w-[12rem] flex-1"}, e("input",{key:x.chavePix, defaultValue:x.chavePix, className:INPUT+" h-10!", onBlur:function(ev){ if(ev.target.value!==x.chavePix) acao(c, "prest_set", {id:x.id, patch:{chavePix:ev.target.value}}); }})),
      e(Campo,{rot:"Mês"}, e(Sel,{value:mesF, label:"Mês", className:"w-44", onChange:setMesF}, e("option",{value:"todos"}, "Todos os meses"), janela().map(function(k){ return e("option",{key:k, value:k}, nomeMes(k)); }))),
      e(Btn,{v:"ghost", sm:true, onClick:function(){ acao(c, "prest_set", {id:x.id, patch:{ativo:!x.ativo}}); }}, x.ativo ? "Finalizar" : "Reabrir"), e(Btn,{v:"ghost", sm:true, onClick:function(){ if(window.confirm("Excluir "+x.nome+" com dívidas e repasses?")) acao(c, "prest_del", {id:x.id}); }}, "Excluir")),
    e("div",{className:"grid grid-cols-1 gap-3 lg:grid-cols-2"},
      e("div",{className:"flex flex-col gap-2 rounded-xl bg-black/20 p-3"}, e("b",{className:"text-[13.5px]"}, "Dívidas ", e("span",{className:MONO+" text-[#F472B6]"}, BK(somaDv))),
        e("div",{className:"flex flex-wrap items-end gap-2"}, e(Txt,{value:d.data, type:"date", label:"Data", className:"w-36", onChange:function(v){ setD(Object.assign({}, d, {data:v})); }}), e(Txt,{value:d.valor, ph:"Valor", label:"Valor", className:"w-28", onChange:function(v){ setD(Object.assign({}, d, {valor:v.replace(/[^\d,.]/g,"")})); }}), e(Txt,{value:d.prazo, type:"date", label:"Prazo (opcional)", className:"w-36", onChange:function(v){ setD(Object.assign({}, d, {prazo:v})); }}),
          e(Btn,{v:"secondary", sm:true, disabled:!(num(d.valor)>0), onClick:function(){ acao(c, "divida_add", {prestId:x.id, data:d.data, valor:num(d.valor), prazo:d.prazo}); setD(Object.assign({}, d, {valor:""})); }}, "+ Dívida")),
        dv.map(function(y){ return e("div",{key:y.id, className:"flex items-center justify-between text-[13px]"}, e("span",null, br(y.data)+(y.prazo ? " · prazo "+br(y.prazo) : "")), e("span",{className:"flex items-center gap-2"}, e("b",{className:MONO}, BK(y.valor)), iconBtn("trash", "Excluir dívida", function(){ acao(c, "divida_del", {id:y.id}); }, true))); })),
      e("div",{className:"flex flex-col gap-2 rounded-xl bg-black/20 p-3"}, e("b",{className:"text-[13.5px]"}, "Repasses (pagamentos) ", e("span",{className:MONO+" text-[#4ADE80]"}, BK(somaRp))),
        e("div",{className:"flex flex-wrap items-end gap-2"}, e(Txt,{value:r.data, type:"date", label:"Data", className:"w-36", onChange:function(v){ setR(Object.assign({}, r, {data:v})); }}), e(Txt,{value:r.valor, ph:"Valor", label:"Valor", className:"w-28", onChange:function(v){ setR(Object.assign({}, r, {valor:v.replace(/[^\d,.]/g,"")})); }}),
          e(Txt,{value:r.origem, ph:"Quem pagou", label:"Quem pagou", className:"w-32", onChange:function(v){ setR(Object.assign({}, r, {origem:v})); }}), e(Sel,{value:r.forma, label:"Forma", className:"w-36", onChange:function(v){ setR(Object.assign({}, r, {forma:v})); }}, FORMAS_REPASSE.map(function(k){ return e("option",{key:k, value:k}, k); })),
          e("label",{className:"flex cursor-pointer items-center gap-1.5 text-[12px]"}, e("input",{type:"checkbox", checked:r.pixRev, className:"size-4", onChange:function(ev){ setR(Object.assign({}, r, {pixRev:ev.target.checked})); }}), "veio de PIX de revendedora"),
          e(Btn,{v:"secondary", sm:true, disabled:!(num(r.valor)>0) || !r.origem.trim(), onClick:function(){ acao(c, "repasse_add", {prestId:x.id, data:r.data, valor:num(r.valor), origem:r.origem, forma:r.forma, contaTxt:r.contaTxt, pixRevendedora:r.pixRev}); setR(Object.assign({}, r, {valor:"", origem:""})); }}, "+ Repasse")),
        rp.map(function(y){ return e("div",{key:y.id, className:"flex items-center justify-between text-[13px]"}, e("span",null, br(y.data)+" · "+y.forma+" · "+y.origem+(y.origemPixLancId ? " (PIX automático)" : "")), e("span",{className:"flex items-center gap-2"}, e("b",{className:MONO}, BK(y.valor)), !y.origemPixLancId && iconBtn("trash", "Excluir repasse", function(){ acao(c, "repasse_del", {id:y.id}); }, true))); })))));
}
function AbaFfPrest(){
  var c = useFF(), ff = c.ff, nf = useState({nome:"", servico:"", chavePix:"", responsavelId:""}), f = nf[0], setF = nf[1], ncb = useState({nome:"", banco:"", chavePix:"", prestadorId:""}), cb = ncb[0], setCb = ncb[1];
  var abertos = ff.prest.filter(function(x){ return x.ativo; }), porResp = {}; abertos.forEach(function(x){ var k = x.responsavelId || "—"; porResp[k] = r2((porResp[k]||0)+saldoPrestador(ff, x.id)); });
  var contasPrest = ff.contasBanc.filter(function(b){ return b.prestadorId; });
  return e(Guarda,{c:c}, e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Prestadores", sub:"Quem presta serviço e recebe dos sócios: o que se deve (dívidas), o que já foi pago (repasses) e o saldo. Saldo = dívidas − repasses, de todas as datas."}),
    e("div",{className:"grid grid-cols-2 gap-3 xl:grid-cols-4"}, e(Tile,{t:"Em aberto", v:int(abertos.length), cor:"#F472B6"}), e(Tile,{t:"Saldo devedor", v:BK(r2(abertos.reduce(function(t, x){ return t+saldoPrestador(ff, x.id); }, 0))), cor:"#F59E0B"}),
      Object.keys(porResp).slice(0, 2).map(function(k){ return e(Tile,{key:k, t:"Saldo · "+(k==="—" ? "sem responsável" : pessoaNome(ff, k)), v:BK(porResp[k]), cor:"#60A5FA"}); })),
    e(BlocoBarra,{cor:"azul", t:"Novo prestador"}, e("div",{className:"flex flex-wrap items-end gap-3 p-4"}, e(Campo,{rot:"Nome", className:"min-w-[12rem] flex-1"}, e(Txt,{value:f.nome, label:"Nome", onChange:function(v){ setF(Object.assign({}, f, {nome:v})); }})), e(Campo,{rot:"Serviço"}, e(Txt,{value:f.servico, label:"Serviço", className:"w-48", onChange:function(v){ setF(Object.assign({}, f, {servico:v})); }})),
      e(Campo,{rot:"Chave PIX"}, e(Txt,{value:f.chavePix, label:"Chave PIX", className:"w-52", onChange:function(v){ setF(Object.assign({}, f, {chavePix:v})); }})),
      e(Campo,{rot:"Responsável"}, e(Sel,{value:f.responsavelId, label:"Responsável", className:"w-44", onChange:function(v){ setF(Object.assign({}, f, {responsavelId:v})); }}, e("option",{value:""}, "Nenhum"), ff.personas.filter(function(q){ return q.tipo==="SOCIO"; }).map(function(q){ return e("option",{key:q.id, value:q.id}, q.nome); }))),
      e(Btn,{v:"primary", disabled:!f.nome.trim(), onClick:function(){ acao(c, "prest_add", f); setF({nome:"", servico:"", chavePix:"", responsavelId:""}); }}, "Criar"))),
    ff.prest.length===0 ? e("p",{className:"rounded-xl bg-muted/30 px-4 py-6 text-center text-[13.5px] text-muted-foreground"}, "Nenhum prestador ainda.") : ff.prest.slice().sort(function(a, b){ return (b.ativo ? 1 : 0)-(a.ativo ? 1 : 0) || a.nome.localeCompare(b.nome); }).map(function(x){ return e(CartaoPrest,{key:x.id, c:c, x:x}); }),
    e(BlocoBarra,{cor:"azul", t:"Contas de prestadores", sub:"conta de prestador: PIX que cai nela vira repasse automático"}, e("div",{className:"flex flex-col gap-3 p-4"},
      e("div",{className:"flex flex-wrap items-end gap-3"}, e(Campo,{rot:"Nome da conta"}, e(Txt,{value:cb.nome, label:"Nome", className:"w-48", onChange:function(v){ setCb(Object.assign({}, cb, {nome:v})); }})), e(Campo,{rot:"Banco"}, e(Txt,{value:cb.banco, label:"Banco", className:"w-36", onChange:function(v){ setCb(Object.assign({}, cb, {banco:v})); }})), e(Campo,{rot:"Chave PIX"}, e(Txt,{value:cb.chavePix, label:"Chave", className:"w-48", onChange:function(v){ setCb(Object.assign({}, cb, {chavePix:v})); }})),
        e(Campo,{rot:"Prestador"}, e(Sel,{value:cb.prestadorId, label:"Prestador", className:"w-48", onChange:function(v){ setCb(Object.assign({}, cb, {prestadorId:v})); }}, e("option",{value:""}, "Escolha…"), ff.prest.map(function(x){ return e("option",{key:x.id, value:x.id}, x.nome); }))),
        e(Btn,{v:"secondary", disabled:!cb.nome.trim() || !cb.prestadorId, onClick:function(){ acao(c, "cb_add", cb); setCb({nome:"", banco:"", chavePix:"", prestadorId:""}); }}, "+ Conta")),
      contasPrest.map(function(b){ return e("div",{key:b.id, className:"flex items-center justify-between text-[13.5px]"}, e("span",null, contaLabel(ff, b.id)+" · "+(b.chavePix||"sem chave")+" · "+((ff.prest.find(function(x){ return x.id===b.prestadorId; })||{}).nome||"—")), iconBtn("trash", "Excluir conta", function(){ acao(c, "cb_del", {id:b.id}); }, true)); })))));
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

export { AbaFfHome, AbaFfAlertas, AbaFfContas, AbaFfPagas, AbaFfPix, AbaFfPrest, AbaFfProlab, AbaFfRelatorio, AbaFfHist, AbaFfConfig };

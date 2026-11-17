// Sorelly Admin · montagem e bipagem — components/etiqueta.js
// Cartão do kit no app da montadora (próximo kit / kit que ela está montando). Compacto: texto 13 px, rótulo 11 px, sem letra colorida (Marcus, 09/11/2026).
// REFEITO em 16/11/2026 (Marcus: "o foco é a montagem do kit, sobe tudo"): cabeçalho em 2 linhas, botão, e UMA lista de peças em que cada linha traz o que enviar (ouro e prata),
// o OK e a PREFERÊNCIA DELA daquela peça embaixo (com as fotos que ela mandou). O que não é de uma peça (observações, encomenda, pedido) fica em "Antes de começar", logo acima da lista.
// Atenção: o Marcus pediu para a montadora VER o valor de vendas e o valor do kit neste cartão (decisão de 09/11/2026, vale no lugar do "montadora nunca vê valor").
import { PrefVisual } from "@/apps/montagem/components/pref-visual";
import { modalidadeDe } from "@/apps/montagem/domain/consignado";
import { kitSugerido } from "@/apps/montagem/domain/kit-perfeito";
import { blocosDaPeca, semAcento } from "@/apps/montagem/domain/peca-blocos";
import { pkResumoParaMontagem } from "@/apps/montagem/domain/preferencias-relatorio";
import { pecasPara } from "@/apps/montagem/domain/regras";
import { usePrefsApp } from "@/apps/montagem/lib/prefs-app";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { Relogio } from "@/apps/montagem/ui/relogio";
import { e, useState } from "@/shared/react";
import React from "react";

var BORDA = "border border-[#E9DDBB]";
var PRETO = {color:"#111827"}, BRANCO = {color:"#FFFFFF"}, OURO = {color:"#F0D58A"}, MARROM = {color:"#8A6A12"};   // cor explícita: a regra global do app escurece texto sem estilo próprio
// bloco com título pequeno em cima e conteúdo embaixo
function Bloco(p){ return e("div",{className:"flex flex-col gap-1 rounded-xl bg-[#FAFAF7] px-2.5 py-1.5 "+BORDA+" "+(p.className||"")}, p.t && e("p",{className:"text-[11px] font-bold uppercase tracking-wide", style:MARROM}, p.t), p.children); }
function Selinho(p){ return e("span",{className:"rounded-full bg-[#F7E8BF] px-2 py-0.5 text-[11px] font-bold", style:PRETO}, p.children); }

// OK de cada peça (Marcus, 09/11/2026: a montadora vai dando OK no que enviar, uma a uma). Fica guardado por kit enquanto a página estiver aberta.
var CHECKS = {};
function Caixa(p){ return e("button",{onClick:p.onClick, "aria-label":p.on ? "Desmarcar" : "Marcar OK", className:"mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border "+(p.on ? "border-[#C9A13B] bg-[#C9A13B]" : "border-[#9CA3AF] bg-white")}, p.on && e(Icon,{n:"check", s:13, className:"text-[#1B1409]"})); }
// linhas de envio agrupadas (ouro e prata da mesma peça numa linha só), já com a faixa "de X a Y" (tabela do kit ajustada pelas vendas dos últimos 90 dias; domain/kit-perfeito.js)
function agrupar(pecas, mix){
  var linhas = mix ? kitSugerido(pecas, mix) : null;
  var maxDe = {}; pecas.itens.forEach(function(x){ maxDe[x.nome] = x.max; });
  var faixa = function(q, mx, sug){ var s = sug===undefined ? q : sug, de = Math.min(q, s), ate = Math.max(mx || q, s); return de===ate ? String(de) : de+" a "+ate; };
  var rows = (linhas ? linhas.map(function(x){ return {nome:x.nome, env:faixa(x.q, maxDe[x.nome], x.sug), q:x.q, sug:x.sug}; })
    : pecas.itens.map(function(x){ return {nome:x.nome, env:faixa(x.q, x.max), q:x.q, sug:x.q}; })).filter(function(x){ return x.sug > 0 || x.q > 0; });
  var grupos = [], porBase = {};
  rows.forEach(function(x){
    var m = /^(.*) (ouro|prata)$/.exec(x.nome), base = m ? m[1] : x.nome;
    if(!porBase[base]){ porBase[base] = {base:base, partes:[]}; grupos.push(porBase[base]); }
    porBase[base].partes.push({metal:m ? m[2] : "", env:x.env});
  });
  return grupos;
}

// A LISTA DE MONTAGEM: cada peça com a quantidade (● ouro e ● prata em número grande), o OK e a preferência dela numa linha embaixo (texto + fotos)
var COLS = {gridTemplateColumns:"1.5rem minmax(0,1fr) 3.4rem 3.4rem"};
function ListaMontar(p){
  var oks = p.oks, alterna = p.alterna, grupos = agrupar(p.pecas, p.mix), prefs = p.prefs, usados = {};
  var feitos = grupos.filter(function(g){ return oks["e:"+g.base]; }).length;
  var num = function(v, cor){ return e("span",{className:"inline-flex items-center justify-end gap-1"}, cor && e("i",{className:"inline-block size-2.5 rounded-full", style:{background:cor}}), e("b",{className:MONO+" tabular-nums whitespace-nowrap text-[20px] leading-none", style:PRETO}, v)); };
  var daPeca = function(base){ var alvo = blocosDaPeca(base); return prefs.filter(function(x){ var ok = alvo.indexOf(semAcento(x.titulo))>=0; if(ok) usados[x.titulo] = true; return ok; }); };
  var linhas = grupos.map(function(g){
    var ouro = g.partes.find(function(x){ return x.metal==="ouro"; }), prata = g.partes.find(function(x){ return x.metal==="prata"; }), solo = g.partes.find(function(x){ return !x.metal; });
    var pr = daPeca(g.base), on = !!oks["e:"+g.base];
    return e("div",{key:g.base, className:"flex flex-col gap-1 border-t border-[#EEF0F4] py-1.5"},
      e("div",{className:"grid items-center gap-x-1.5", style:COLS},
        e(Caixa,{on:on, onClick:function(){ alterna("e:"+g.base); }}),
        e("span",{className:"text-[13px] font-extrabold leading-tight", style:PRETO}, g.base),
        solo ? e("span",{className:"col-span-2 text-right"}, num(solo.env)) : e(React.Fragment, null, e("span",{className:"text-right"}, num(ouro ? ouro.env : "—", "#C9A13B")), e("span",{className:"text-right"}, num(prata ? prata.env : "—", "#9CA3AF")))),
      pr.map(function(x, i){ return e("div",{key:i, className:"pl-[1.875rem]"}, e(PrefVisual,{dados:x.dados, texto:x.texto, fotos:x.fotos, titulo:pr.length>1 ? x.titulo : ""})); }));
  });
  return {feitos:feitos, total:grupos.length, sobra:prefs.filter(function(x){ return !usados[x.titulo]; }),
    corpo:e(Bloco,{t:"Montar · "+feitos+" de "+grupos.length}, e("div",{className:"flex flex-col"}, linhas))};
}

function Etiqueta(p){
  var cx = use(), s = cx.state, d = cx.dispatch, k = p.k;
  usePrefsApp();   // preferências lidas do app (todas as revendedoras): refaz o cartão quando chegam
  var ativo = k.status==="montando", pecas = pecasPara(k.valor, s.cfg);   // 16/11/2026 (Marcus): a montadora só monta; retirada, venda, valor e condicionais não aparecem para ela
  var tk = useState(0), oks = CHECKS[k.id] || (CHECKS[k.id] = {}), alterna = function(chave){ oks[chave] = !oks[chave]; tk[1](function(n){ return n+1; }); };
  var prefsReais = pkResumoParaMontagem(s, k.rev); if(!prefsReais.length && k.prefDemo) prefsReais = k.prefDemo;
  var lista = pecas ? ListaMontar({pecas:pecas, mix:k.mix, oks:oks, alterna:alterna, prefs:prefsReais}) : null;
  var faltam = lista ? lista.total - lista.feitos : 0;
  var gerais = lista ? lista.sobra : prefsReais;
  var destaque = ativo || p.tipo==="pedido" ? " ring-2 ring-[#C9A13B]" : "";
  var botao = "flex h-8 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#B8862B] via-[#E8B84B] to-[#F1E4C6] px-3 text-[13px] font-bold active:translate-y-px disabled:opacity-40";
  var acao = ativo
    ? e("div",{className:"flex flex-col gap-1.5"},
        e("div",{className:"flex items-center justify-between rounded-xl bg-[#202023] px-3 py-1"},
          e("span",{className:"text-[13px] font-semibold", style:BRANCO}, k.pausadoEm ? "Pausado em" : "Montando há"),
          e("span",{style:OURO}, e(Relogio,{k:k, className:MONO+" tabular-nums text-[20px] font-extrabold"}))),
        e("div",{className:"grid grid-cols-[1fr_auto_auto] gap-2"},
          e("button",{disabled:faltam>0, onClick:function(){d({type:"CONCLUIR_M", id:k.id, condPegas:true});}, className:botao, style:{color:"#1B1409"}},
            e(Icon,{n:"check", s:14}), faltam>0 ? "Falta conferir "+faltam : "Concluir montagem"),
          e("button",{onClick:function(){d({type: k.pausadoEm ? "RETOMAR" : "PAUSAR", id:k.id});}, title:k.pausadoEm ? "Retomar" : "Pausar", className:"grid h-8 w-10 place-items-center rounded-xl bg-[#F1F2F4] active:translate-y-px", style:PRETO}, e(Icon,{n:k.pausadoEm ? "play" : "pause", s:14})),
          e("button",{onClick:function(){d({type:"DEVOLVER", id:k.id});}, title:"Devolver", className:"grid h-8 w-10 place-items-center rounded-xl bg-[#F1F2F4] active:translate-y-px", style:PRETO}, e(Icon,{n:"undo", s:14}))))
    : e("div",{className:"flex flex-col gap-1.5"},
        e("button",{onClick:function(){d({type:"INICIAR_M", id:k.id, montId:p.montId});}, className:botao+" w-full", style:{color:"#1B1409"}},
          e(Icon,{n:"play", s:14}), k.status==="ajuste" ? "Iniciar ajuste" : "Iniciar montagem"));
  var obs = gerais.find(function(x){ return x.titulo==="Observações"; });   // das preferências gerais (flanela, material de apoio...) só as observações dela interessam a quem monta
  var temAntes = !!obs || k.pref.enc || k.pref.evitar;
  return e("div",{className:"overflow-hidden rounded-2xl bg-white shadow-sm "+BORDA+destaque},
    e("div",{className:"flex flex-col gap-1.5 p-2.5"},
      p.tipo==="pedido" && e("div",{className:"rounded-lg bg-[#F7E8BF] px-3 py-1 text-[13px] font-bold", style:PRETO}, "A Deysiane pediu este kit agora"),
      k.status==="ajuste" && e("div",{className:"rounded-lg bg-[#F7E8BF] px-3 py-1 text-[13px] font-bold", style:PRETO}, "Voltou para ajuste: "+k.motivo),
      e("div",{className:"flex flex-col gap-1"},
        e("p",{className:"text-[13px] font-extrabold leading-tight", style:PRETO}, k.rev),
        e("div",{className:"flex flex-wrap gap-1"},
          p.fila && e(Selinho,null, p.fila),
          modalidadeDe(s, k.rev)==="prata" && e(Selinho,null, "Kit 100% Prata"),
          k.prio && e(Selinho,null, "Prioridade"),
          k.ultimaHora && e(Selinho,null, "Última hora"))),
      acao,
      temAntes && e(Bloco,{t:"Antes de começar"},
        obs && e("div",{className:"rounded-lg bg-[#F7E8BF] px-2.5 py-1.5"}, e("p",{className:"text-[11px] font-bold uppercase", style:MARROM}, "Observações dela"), e("p",{className:"text-[13px] font-semibold leading-tight", style:PRETO}, obs.texto)),
        k.pref.enc ? e("p",{className:"text-[13px] leading-tight", style:PRETO}, e("b",null, "Encomendas: "), k.pref.enc+(k.pref.enc>1 ? " peças separadas" : " peça separada")) : null,
        k.pref.evitar && e("p",{className:"text-[13px] leading-tight", style:PRETO}, e("b",null, "Pedido dela: "), k.pref.evitar)),
      lista && lista.corpo));
}

export { Etiqueta, agrupar };

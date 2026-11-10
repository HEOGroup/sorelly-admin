// Sorelly Admin · montagem e bipagem — components/etiqueta.js
// Cartão do kit no app da montadora (próximo kit / kit que ela está montando). Compacto: texto 13 px, rótulo 11 px, sem letra colorida (Marcus, 09/11/2026).
// Ordem (pedido do Marcus, 09/11/2026): quem é + vendas e valor do kit → botão de ação → O QUE ENVIAR (faixa de X a Y, em 2 colunas) → preferências e pedidos.
// Atenção: o Marcus pediu para a montadora VER o valor de vendas e o valor do kit neste cartão (decisão de 09/11/2026, vale no lugar do "montadora nunca vê valor").
import { CondChips, CondLista } from "@/apps/montagem/components/condicionais";
import { condOk } from "@/apps/montagem/domain/condicionais";
import { modalidadeDe } from "@/apps/montagem/domain/consignado";
import { kitSugerido } from "@/apps/montagem/domain/kit-perfeito";
import { pkResumoParaMontagem } from "@/apps/montagem/domain/preferencias-relatorio";
import { ehAtencao, listagemDe, pecasPara } from "@/apps/montagem/domain/regras";
import { TIPO_KIT } from "@/apps/montagem/domain/status";
import { BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { Relogio } from "@/apps/montagem/ui/relogio";
import { e, useState } from "@/shared/react";
import React from "react";

var BORDA = "border border-[#E9DDBB]";
var PRETO = {color:"#111827"}, BRANCO = {color:"#FFFFFF"}, OURO = {color:"#F0D58A"};   // cor explícita: a regra global do app escurece texto sem estilo próprio
// bloco com título pequeno em cima e conteúdo embaixo
function Bloco(p){ return e("div",{className:"flex flex-col gap-1.5 rounded-xl bg-[#FAFAF7] px-3 py-2 "+BORDA+" "+(p.className||"")}, p.t && e("p",{className:"text-[11px] font-bold uppercase tracking-wide", style:{color:"#8A6A12"}}, p.t), p.children); }
function Selinho(p){ return e("span",{className:"rounded-full bg-[#F7E8BF] px-2.5 py-0.5 text-[11px] font-bold", style:PRETO}, p.children); }

// OK de cada item (Marcus, 09/11/2026: a montadora vai dando OK no que enviar e nas preferências, uma a uma). Fica guardado por kit enquanto a página estiver aberta.
var CHECKS = {};
function Caixa(p){ return e("button",{onClick:p.onClick, "aria-label":p.on ? "Desmarcar" : "Marcar OK", className:"grid size-6 shrink-0 place-items-center rounded-md border "+(p.on ? "border-[#C9A13B] bg-[#C9A13B]" : "border-[#9CA3AF] bg-white")}, p.on && e(Icon,{n:"check", s:14, className:"text-[#1B1409]"})); }
// O QUE ENVIAR: só a faixa "de X a Y" de cada peça (ouro e prata na mesma linha) (tabela do kit ajustada pelas vendas dos últimos 90 dias; domain/kit-perfeito.js)
// linhas de envio agrupadas (ouro e prata da mesma peça numa linha só), já com a faixa "de X a Y"
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
function ComoMontar(p){
  var oks = p.oks, alterna = p.alterna, grupos = agrupar(p.pecas, p.mix);
  var num = function(v, extra){ return e("b",{className:MONO+" tabular-nums whitespace-nowrap text-right text-[13px] "+(extra||""), style:PRETO}, v); };
  var feitos = 0;
  var rot = function(v, i){ return e("span",{key:i, className:"text-right text-[11px] font-bold uppercase", style:{color:"#8A6A12"}}, v); };
  grupos.forEach(function(g){ if(oks["e:"+g.base]) feitos++; });
  return e(Bloco,{t:"O que enviar · "+feitos+" de "+grupos.length},
    e("div",{className:"grid items-center gap-x-2 gap-y-1", style:{gridTemplateColumns:"1.5rem minmax(0,1fr) 3.9rem 3.9rem"}},
      ["", "", "Ouro", "Prata"].map(rot),
      grupos.map(function(g){
        var ouro = g.partes.find(function(p){ return p.metal==="ouro"; }), prata = g.partes.find(function(p){ return p.metal==="prata"; }), solo = g.partes.find(function(p){ return !p.metal; });
        return e(React.Fragment, {key:g.base},
          e(Caixa,{on:!!oks["e:"+g.base], onClick:function(){ alterna("e:"+g.base); }}),
          e("span",{className:"text-[13px] font-semibold leading-tight", style:PRETO}, g.base),
          solo ? e("b",{className:MONO+" tabular-nums col-span-2 text-right text-[13px]", style:PRETO}, solo.env)
               : e(React.Fragment, null, e("span",{className:"text-right"}, num(ouro ? ouro.env : "—")), e("span",{className:"text-right"}, num(prata ? prata.env : "—"))));
      })));
}

// PREFERÊNCIAS: pode haver muitas; cada uma tem o seu OK. Título em cima, texto embaixo (quebra à vontade).
function PrefLista(p){
  var feitos = p.lista.filter(function(x){ return p.oks["p:"+x.titulo]; }).length;
  return e(Bloco,{t:"Preferências da revendedora"+(p.lista.length ? " · "+feitos+" de "+p.lista.length : "")},
    p.lista.length===0 ? e("p",{className:"text-[13px]", style:PRETO}, "Ela ainda não informou as preferências do kit.")
      : e("div",{className:"flex flex-col"}, p.lista.map(function(x){ return e("div",{key:x.titulo, className:"flex items-start gap-2 border-b border-[#EEF0F4] py-1 last:border-b-0"},
          e(Caixa,{on:!!p.oks["p:"+x.titulo], onClick:function(){ p.alterna("p:"+x.titulo); }}),
          e("div",{className:"min-w-0 flex-1"}, e("b",{className:"block text-[13px] leading-tight", style:PRETO}, x.titulo), e("span",{className:"block text-[13px] leading-tight", style:PRETO}, x.texto))); })));
}

function Etiqueta(p){
  var cx = use(), s = cx.state, d = cx.dispatch, k = p.k, l = listagemDe(s, k);
  var ativo = k.status==="montando", atencao = ehAtencao(k.valor, s.cfg), pecas = pecasPara(k.valor, s.cfg);
  var conds = (k.cond && k.cond.nums) || [];
  var tk = useState(0), oks = CHECKS[k.id] || (CHECKS[k.id] = {}), alterna = function(chave){ oks[chave] = !oks[chave]; tk[1](function(n){ return n+1; }); };
  var prefsReais = pkResumoParaMontagem(s, k.rev); if(!prefsReais.length && k.prefDemo) prefsReais = k.prefDemo;
  var gruposEnv = pecas ? agrupar(pecas, k.mix) : [];
  var total = gruposEnv.length + prefsReais.length, feitos = gruposEnv.filter(function(g){ return oks["e:"+g.base]; }).length + prefsReais.filter(function(x){ return oks["p:"+x.titulo]; }).length, faltam = total - feitos;
  var tipo = (TIPO_KIT[k.tipoKit]||TIPO_KIT.acerto_kit)[0];
  var destaque = ativo || p.tipo==="pedido" ? " ring-2 ring-[#C9A13B]" : "";
  var venda = k.vendas && k.vendas[0] ? BK(k.vendas[0]) : "—", valorKit = k.valor ? BK(k.valor) : "—";
  var celula = function(t, v){ return e("div",{className:"flex flex-1 flex-col items-center py-1 first:border-r first:border-[#E9DDBB]"}, e("span",{className:"text-[11px] font-bold uppercase", style:{color:"#8A6A12"}}, t), e("b",{className:MONO+" tabular-nums text-[13px]", style:PRETO}, v)); };
  var acao = ativo
    ? e("div",{className:"flex flex-col gap-2"},
        e("div",{className:"flex items-center justify-between rounded-xl bg-[#202023] px-3 py-1.5"},
          e("span",{className:"text-[13px] font-semibold", style:BRANCO}, k.pausadoEm ? "Pausado em" : "Montando há"),
          e("span",{style:OURO}, e(Relogio,{k:k, className:MONO+" tabular-nums text-[20px] font-extrabold"}))),
        conds.length>0 && e(Bloco,{t:"Pegue e marque cada condicional ("+conds.length+")"},
          e("p",{className:"text-[11px]", style:PRETO}, "Só conclui com todas marcadas."), e(CondLista,{k:k, papel:"m"})),
        e("div",{className:"grid grid-cols-[1fr_auto_auto] gap-2"},
          e("button",{disabled:!condOk(k, "m") || faltam>0, onClick:function(){d({type:"CONCLUIR_M", id:k.id});}, className:"flex h-8 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#B8862B] via-[#E8B84B] to-[#F1E4C6] px-3 text-[13px] font-bold active:translate-y-px disabled:opacity-40", style:{color:"#1B1409"}},
            e(Icon,{n:"check", s:14}), faltam>0 ? "Falta conferir "+faltam : atencao ? "Concluir e enviar para conferência" : "Concluir montagem"),
          e("button",{onClick:function(){d({type: k.pausadoEm ? "RETOMAR" : "PAUSAR", id:k.id});}, title:k.pausadoEm ? "Retomar" : "Pausar", className:"grid h-8 w-10 place-items-center rounded-xl bg-[#F1F2F4] active:translate-y-px", style:PRETO}, e(Icon,{n:k.pausadoEm ? "play" : "pause", s:14})),
          e("button",{onClick:function(){d({type:"DEVOLVER", id:k.id});}, title:"Devolver", className:"grid h-8 w-10 place-items-center rounded-xl bg-[#F1F2F4] active:translate-y-px", style:PRETO}, e(Icon,{n:"undo", s:14}))))
    : e("button",{onClick:function(){d({type:"INICIAR_M", id:k.id, montId:p.montId});}, className:"flex h-8 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#B8862B] via-[#E8B84B] to-[#F1E4C6] px-3 text-[13px] font-bold active:translate-y-px", style:{color:"#1B1409"}},
        e(Icon,{n:"play", s:14}), k.status==="ajuste" ? "Iniciar ajuste" : "Iniciar montagem");
  return e("div",{className:"overflow-hidden rounded-2xl bg-white shadow-sm "+BORDA+destaque},
    e("div",{className:"flex items-center justify-between gap-2 bg-[#F6EBCB] px-3 py-1.5"},
      e("b",{className:"text-[13px]", style:PRETO}, "Representante "+l.rep),
      e("span",{className:"inline-flex items-center gap-1 text-[11px] font-bold", style:PRETO}, e(Icon,{n:"clock", s:12}), "Retirada às "+l.horario+(l.viagem ? " · viagem para "+l.destino : ""))),
    e("div",{className:"flex flex-col gap-2 p-3"},
      p.tipo==="pedido" && e("div",{className:"rounded-lg bg-[#F7E8BF] px-3 py-1.5 text-[13px] font-bold", style:PRETO}, "A Deysiane pediu este kit agora"),
      k.status==="ajuste" && e("div",{className:"rounded-lg bg-[#F7E8BF] px-3 py-1.5 text-[13px] font-bold", style:PRETO}, "Voltou para ajuste: "+k.motivo),
      e("div",{className:"flex items-center justify-between gap-2"},
        e("div",{className:"min-w-0"}, e("p",{className:"text-[13px] font-extrabold leading-tight", style:PRETO}, k.rev), k.bairro && e("p",{className:"text-[11px] leading-tight", style:PRETO}, k.bairro)),
        e("div",{className:"flex shrink-0 flex-wrap justify-end gap-1"},
          e(Selinho,null, tipo),
          modalidadeDe(s, k.rev)==="prata" && e(Selinho,null, "Kit 100% Prata"),
          k.prio && e(Selinho,null, "Prioridade"),
          atencao && e(Selinho,null, "Precisa de conferência"),
          k.tipo==="ac_sai" && e(Selinho,null, "Vai sair"),
          k.ultimaHora && e(Selinho,null, "Última hora"))),
      e("div",{className:"flex rounded-xl bg-[#FAFAF7] "+BORDA}, celula("Vendas", venda), celula("Valor do kit", valorKit)),
      acao,
      conds.length>0 && !ativo && e(Bloco,{t:conds.length>1 ? conds.length+" condicionais para pegar" : "1 condicional para pegar"},
        e(CondChips,{k:k, papel:"m"}), e("p",{className:"text-[11px]", style:PRETO}, "Só dá para marcar depois de iniciar a montagem.")),
      pecas && e(ComoMontar,{pecas:pecas, mix:k.mix, oks:oks, alterna:alterna}),
      e(PrefLista,{lista:prefsReais, oks:oks, alterna:alterna}),
      e(Bloco,{t:"Pedidos dela"},
        e("div",{className:"flex items-baseline justify-between gap-3 text-[13px]", style:PRETO}, e("span",null, "Encomendas"), e("b",null, k.pref.enc ? k.pref.enc+(k.pref.enc>1 ? " peças separadas" : " peça separada") : "Nenhuma encomenda")),
        k.pref.evitar && e("div",{className:"flex items-baseline justify-between gap-3 text-[13px]", style:PRETO}, e("span",null, "Pedido dela"), e("b",{className:"text-right"}, k.pref.evitar)))));
}

export { Etiqueta };

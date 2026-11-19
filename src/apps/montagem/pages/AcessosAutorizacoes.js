// Sorelly Admin · montagem — pages/AcessosAutorizacoes.js
// RH → Acessos e autorizações: duas abas. "Quem vê o quê" (a matriz de telas por setor, pages/Acessos.js) e "Quem pode fazer o quê" (autorizações por pessoa, domain/autorizacoes.js).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Mosaico, Pagina } from "@/apps/montagem/components/padrao";
import { SETORES_LOGIN } from "@/apps/montagem/components/seletor-acesso";
import { CATALOGO, listaDe } from "@/apps/montagem/domain/autorizacoes";
import { BIPA_RETORNO_PADRAO, nomeDe } from "@/apps/montagem/domain/equipe";
import { quemBipa } from "@/apps/montagem/domain/retornos";
import { AbaAcessos } from "@/apps/montagem/pages/Acessos";
import { AbaAcessosPessoas } from "@/apps/montagem/pages/AcessosPessoas";
import { AbaConfigAvisos } from "@/apps/montagem/pages/ConfigAvisos";
import { use } from "@/apps/montagem/state/context";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { e, useState } from "@/shared/react";

var EDITORES = [16,17,28,29,32,44];   // quem altera: Marcus, Nickolas, Lucas, Anamaria e Amanda de Miranda (igual à matriz de acessos)
var DIRETORIA_IDS = [16,17,28];
var COR = "#3B82F6";

function pessoas(){ var r = []; SETORES_LOGIN().forEach(function(g){ g[1].forEach(function(p){ if(!r.some(function(x){ return x.id===p.id; })) r.push({id:p.id, nome:p.nome}); }); }); return r.sort(function(a,b){ return a.nome.localeCompare(b.nome); }); }

function CartaoAutorizacao(p){
  var cx = use(), s = cx.state, d = cx.dispatch, c = p.c, edita = p.edita, st = useState(""), esc = st[0];
  var ids = c.especial==="agend" ? ((s.agend && s.agend.config && s.agend.config.gerentes) || [24]) : c.especial==="bipa" ? quemBipa(s, BIPA_RETORNO_PADRAO()) : listaDe(c.k);
  var fixos = c.especial==="agend" ? DIRETORIA_IDS : [];
  var grava = function(novos, id, ligar){
    if(c.especial==="agend") d({type:"AG", op:"gerente", id:id, on:ligar, por:nomeDe(s.usuario)});
    else if(c.especial==="bipa") d({type:"BIPA_RETORNO_SET", ids:novos});
    else d({type:"AUTORIZ_SET", k:c.k, ids:novos}); };
  var tirar = function(id){ grava(ids.filter(function(x){ return x!==id; }), id, false); };
  var por = function(id){ if(!id) return; id = parseInt(id); if(ids.indexOf(id)<0) grava(ids.concat([id]), id, true); st[1](""); };
  var disponiveis = pessoas().filter(function(x){ return ids.indexOf(x.id)<0 && fixos.indexOf(x.id)<0; });
  return e("div",{className:"flex min-w-0 flex-col items-center gap-2 rounded-xl bg-black/25 p-3 text-center ring-1 ring-white/10"},
    e("span",{className:"rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide", style:{background:COR+"26", color:"#93C5FD"}}, c.setor),
    e("b",{className:"text-[15px] leading-tight"}, c.t),
    e("p",{className:"text-[12.5px] text-white/70"}, c.desc),
    e("div",{className:"flex flex-wrap justify-center gap-1.5"},
      fixos.map(function(id){ return e("span",{key:"f"+id, title:"Sempre pode", className:"rounded-full bg-white/10 px-2.5 py-1 text-[12.5px] font-semibold"}, nomeDe(id)); }),
      ids.filter(function(id){ return fixos.indexOf(id)<0; }).map(function(id){ return e("span",{key:id, className:"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-semibold", style:{background:COR+"33"}}, nomeDe(id),
        edita && e("button",{type:"button", "aria-label":"Retirar "+nomeDe(id), title:"Retirar", onClick:function(){ tirar(id); }, className:"grid size-4 place-items-center rounded-full bg-black/30 text-[11px] hover:bg-destructive/50"}, "×")); }),
      !ids.length && !fixos.length && e("span",{className:"text-[12.5px] text-white/60"}, "Ninguém marcado.")),
    edita && e("select",{value:esc, "aria-label":"Adicionar pessoa", onChange:function(ev){ por(ev.target.value); }, className:"h-9 w-full max-w-[14rem] cursor-pointer rounded-lg bg-black/30 px-2 text-[13px] ring-1 ring-white/15"},
      e("option",{value:""}, "+ Adicionar pessoa"), disponiveis.map(function(x){ return e("option",{key:x.id, value:x.id}, x.nome); })));
}

function AbaAutorizacoes(){
  var s = use().state, edita = EDITORES.indexOf(s.usuario)>=0;
  return e(Pagina,null,
    !edita && e("p",{className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Somente a diretoria e a Anamaria alteram as autorizações. Você está apenas visualizando."),
    e(BlocoBarra,{cor:"azul", t:"Quem pode fazer o quê", sub:"Cada cartão é uma autorização; as pessoas marcadas podem executá-la. Vale imediatamente.", compacto:true},
      e("div",{className:"p-2"}, e(Mosaico,{min:"20rem"}, CATALOGO.map(function(c){ return e(CartaoAutorizacao,{key:c.k, c:c, edita:edita}); })))));
}

// Uma visão por vez, escolhida em menu suspenso (19/11/2026, Marcus: "diminuir e simplificar"). Pessoas = uma tabela, uma linha por pessoa, com a conta, as telas e as autorizações no detalhe.
var VISOES = [["pessoas", "Pessoas"], ["telas", "Telas por grupo"], ["fazer", "Autorizações por tipo"], ["avisos", "Avisos"]];
// Visual do Financeiro (19/11/2026, Marcus: "cadê as cores e os tamanhos de letra"): bloco com barra azul do sistema, título em maiúsculas, o menu de visões no canto esquerdo da barra e a planilha compacta (11 px) por dentro.
var SEL_BARRA = "h-8 cursor-pointer rounded-md border border-white/30 bg-white/20 px-2 text-center text-[13px] text-white outline-none [text-align-last:center] hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white";
function AbaAcessosAutorizacoes(){
  var st = useState("pessoas"), aba = st[0];
  var seletor = e("select",{value:aba, "aria-label":"Visão", className:SEL_BARRA+" w-52", onChange:function(ev){ st[1](ev.target.value); }}, VISOES.map(function(o){ return e("option",{key:o[0], value:o[0], className:"bg-card"}, o[1]); }));
  return e("div",{className:PADRAO_BLOCOS+" flex min-h-[calc(100vh-6.5rem)] flex-col gap-1.5"},
    aba==="pessoas" ? e("div",{className:"flex min-h-0 flex-1 flex-col [&>section]:flex-1"}, e(BlocoPainel,{titulo:"Acessos e autorizações", acao:seletor, alta:true, compacto:true}, e(AbaAcessosPessoas,null)))
      : e(React_Frag,null, e(BlocoPainel,{titulo:"Acessos e autorizações", acao:seletor, alta:true, fechado:true}), aba==="telas" ? e(AbaAcessos,null) : aba==="avisos" ? e(AbaConfigAvisos,null) : e(AbaAutorizacoes,null)));
}
var React_Frag = function(p){ return e("div",{className:"flex flex-col gap-1.5"}, p.children); };
export { AbaAcessosAutorizacoes };

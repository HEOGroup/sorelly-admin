// Sorelly Admin · montagem — mobile/app-funcionarias.js
// O "App das funcionárias" (27/10/2026, pedido do Marcus): UM app só para quem trabalha na rua/na empresa (montagem, bipagem,
// condicionais, agendamento, financeiro, supervisão, diretoria). A ENTRADA é sempre a mesma (components/Entrada); depois de
// entrar, cada pessoa vê só as tarefas do seu acesso (ACESSOS) — a montadora cai direto na tela de montagem, a bipadora na
// retirada, etc. Extraído de pages/Apps.js para servir também a tela de verdade (pages/CelularFuncionarios.js).
import { LogoChat } from "@/apps/montagem/components/chat/chat-ui";
import { ChatApp } from "@/apps/montagem/components/chat/chat-app";
import { contatoDoLogin, ehDirecao, idPorNome } from "@/apps/montagem/domain/chat-contatos";
import { definirEu, efem } from "@/apps/montagem/domain/chat-store";
import { TemaChatClaro } from "@/apps/montagem/components/chat/chat-ui";
import { ACESSO_TOTAL, AGENDAMENTO, BIPADORAS, FINANCEIRO, LISTAGENS_RESP, MONTADORAS, SUPERVISORA } from "@/apps/montagem/domain/equipe";
import { PainelDinheiro } from "@/apps/montagem/pages/Dinheiro";
import { AppBipagemRetirada } from "@/apps/montagem/mobile/bipagem";
import { CelCondicionais } from "@/apps/montagem/mobile/condicionais";
import { Celular, CelListagens } from "@/apps/montagem/mobile/montadora";
import { Avatar } from "@/apps/montagem/mobile/theme";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useState } from "@/shared/react";
import React from "react";

var TAREFAS = {ret:{t:"Retirada de kits", ic:"caixa"}, mon:{t:"Montagem de kits", ic:"montadora"}, cond:{t:"Condicionais", ic:"scan"}, list:{t:"Listagens", ic:"registro"}, whats:{t:"SorellyChat", ic:"whats"}, din:{t:"Dinheiro", ic:"wallet"}};
var TUDO = ["ret","mon","cond","list","din"];
var BIP7 = [9,10,22,14,15,13,12];   // Natasha, Edna, Renata, Sthefany, Kawany, Nataly, Natalia
// quem tem acesso a cada tipo de entrada do App das funcionárias
var ACESSOS = [
  {k:"dir", titulo:"Diretoria", nota:"vê tudo do app", tarefas:TUDO, pessoas:[{id:16, nome:"Marcus"}, {id:"rh", nome:"Maria (RH)"}, {id:17, nome:"Nickolas"}, {id:28, nome:"Lucas"}]},
  {k:"dey", titulo:"Supervisão da montagem", nota:"Deysiane", tarefas:TUDO, pessoas:[SUPERVISORA]},
  {k:"mon", titulo:"Montagem de kits", nota:"só montagem", tarefas:["mon"], pessoas:MONTADORAS},
  {k:"bip", titulo:"Bipagem", nota:"só retirada de kits", tarefas:["ret","din"], pessoas:BIP7.map(function(id){ return BIPADORAS.find(function(b){ return b.id===id; }); }).filter(Boolean)},
  {k:"con", titulo:"Condicionais", nota:"só condicionais", tarefas:["cond"], pessoas:[LISTAGENS_RESP]},
  {k:"age", titulo:"Agendamento", nota:"recebe kits e dinheiro", tarefas:["din"], pessoas:AGENDAMENTO},
  {k:"fin", titulo:"Financeiro", nota:"recebe o dinheiro", tarefas:["din"], pessoas:FINANCEIRO.concat(ACESSO_TOTAL.slice(0, 1))}];

// acha o acesso e a pessoa de quem já está logado no sistema (conta do topo), para o App das funcionárias abrir direto nela
function acessoDoUsuario(usuarioId){
  for(var i = 0; i<ACESSOS.length; i++){ var ac = ACESSOS[i], p = ac.pessoas.find(function(x){ return x.id===usuarioId; }); if(p) return {pessoa:p, acesso:ac}; }
  return null;
}

// lista suspensa em cima do celular (um botão só; a lista de pessoas abre ali mesmo)
function Seletor(p){
  var ab = useState(false), aberto = ab[0], setAberto = ab[1];
  var escolher = function(g, it){ setAberto(false); p.onEscolher(g, it); };
  return e("div",{className:"relative w-full"},
    e("button",{type:"button", onClick:function(){ setAberto(!aberto); }, "aria-expanded":aberto, className:"flex h-10 w-full items-center gap-2 rounded-xl border border-[#E8B84B]/50 bg-card px-3 text-left text-[13px] font-semibold"},
      e("span",{className:"min-w-0 flex-1 truncate"}, p.atual || p.rotulo), e(Icon,{n:"chevrondown", s:13})),
    aberto && e("div",{className:"fixed inset-0 z-30", onClick:function(){ setAberto(false); }}),
    aberto && e("div",{className:"absolute inset-x-0 top-11 z-40 max-h-[26rem] overflow-y-auto rounded-xl border border-[#E8B84B]/40 bg-card p-1.5 shadow-2xl"},
      e("button",{type:"button", onClick:function(){ escolher(null, null); }, className:"flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] font-semibold text-muted-foreground hover:bg-white/5"}, "↩ Voltar à tela de entrada"),
      p.grupos.length===0 && e("p",{className:"px-2.5 py-2 text-[12.5px] text-muted-foreground"}, p.vazio || "Ninguém para escolher."),
      p.grupos.map(function(g, i){ return e("div",{key:i, className:"mt-1 flex flex-col"},
        g.titulo && e("p",{className:"px-2.5 pb-0.5 pt-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-primary"}, g.titulo, g.nota && e("span",{className:"ml-1.5 font-semibold normal-case tracking-normal text-muted-foreground"}, "· "+g.nota)),
        g.itens.map(function(it){ var on = p.atualId===it.id;
          return e("button",{key:it.id, type:"button", onClick:function(){ escolher(g, it); }, className:"flex min-h-9 w-full items-center gap-2.5 rounded-lg px-2.5 py-1 text-left text-[13px] leading-tight "+(on ? "bg-primary/15 font-semibold text-primary" : "hover:bg-white/5")},
            e("span",{className:"min-w-0 flex-1"}, e("span",{className:"block truncate"}, it.nome), it.sub && e("span",{className:"block truncate text-[11.5px] text-muted-foreground"}, it.sub))); })); })));
}

// entrada de cada app: só login (usuário, senha e o botão Entrar como TESTE) — A MESMA tela para montagem, bipagem e condicionais
function Entrada(p){
  var logo = ("/"||"/")+"logo-sorelly.png", campo = "h-11 w-full rounded-full border border-white/15 bg-[#121212] px-5 text-[14px] text-white outline-none placeholder:text-white/45";
  return e("div",{className:"-mx-4 -mt-2 -mb-10 flex flex-col bg-[#070707] text-white", style:{height:p.altura||679}},
    e("div",{className:"flex flex-col items-center gap-2 px-6 pb-6 pt-10", style:{background:"radial-gradient(ellipse at 50% 35%, #3a2d12 0%, #0b0a08 60%)"}},
      e("img",{src:logo, alt:"Sorelly Joias", draggable:false, className:"h-20 w-auto select-none"}),
      e("p",{className:"text-center text-[11px] uppercase tracking-[0.3em] text-white/90"}, p.titulo)),
    e("div",{className:"h-[3px] w-full", style:{background:"linear-gradient(90deg,#B8862B,#E8B84B,#F1E4C6)"}}),
    e("div",{className:"flex flex-1 flex-col items-center justify-center px-8 pb-24"},
      e("button",{type:"button", onClick:p.onTeste, className:"h-14 w-full rounded-full border border-dashed border-[#E8B84B] text-[16px] font-bold text-[#E8B84B]"}, "Entrar como TESTE")));
}

// mistura a cor com branco (fundo claro das linhas), igual ao app da representante
function claro(hex, p){ var n = parseInt(hex.slice(1),16), r = (n>>16)&255, g = (n>>8)&255, b = n&255, m = function(c){ return Math.round(c+(255-c)*(1-p)); };
  return "#"+[m(r),m(g),m(b)].map(function(x){ return x.toString(16).padStart(2,"0"); }).join(""); }
var COR_TAREFA = {din:"#0891B2", ret:"#EA580C", mon:"#7C3AED", cond:"#CA8A04", list:"#2563EB", whats:"#C9A13B"};

// SorellyChat (chat interno) dentro do App das funcionárias: a pessoa conversa como ela mesma
function WhatsInterno(p){   // ocupa a tela toda do celular, como o WhatsApp de verdade
  var pes = p.pessoa, cid = pes.id==="rh" ? idPorNome("Maria Claudia") : contatoDoLogin(pes.id);
  if(!cid) return e("p",{className:"rounded-2xl bg-white p-4 text-[13.5px] text-[#6B7280]"}, "Não encontrei o cadastro desta pessoa no chat.");
  definirEu(cid);
  return e("div",{className:"-mx-4 -mb-10 -mt-2 h-[679px] overflow-hidden"}, e(TemaChatClaro,null, e(ChatApp,{eu:cid, direcao:ehDirecao(pes.id), compacto:true, aoVoltarApp:p.aoVoltar})));
}

// App das funcionárias: tela inicial no mesmo estilo do app da representante (topo escuro, linhas coloridas); ao tocar, a tarefa
// abre dentro do mesmo celular. É o MESMO componente para montagem, bipagem e condicionais — só muda o que a pessoa pode tocar (ac.tarefas).
function AppInterno(p){
  var cx = use(), s = cx.state, d = cx.dispatch, tl = useState(null), tela = tl[0], setTela = tl[1];
  var pes = p.pessoa, ac = p.acesso, ehMontadora = MONTADORAS.some(function(m){ return m.id===pes.id; });
  var abrir = function(k){ if(k==="whats") efem({conversaSel:null}); if(k==="mon" && ehMontadora) d({type:"CEL", id:pes.id}); setTela(k); };
  var n = function(sts){ return s.kits.filter(function(k){ return sts.indexOf(k.status)>=0; }).length; };
  var nRet = n(["bipado"]), nMon = n(["semvalor","pendente","montando","ajuste","supervisao","montado","bipando"]), nCond = n(["condicional","precond"]), nList = s.listagens.filter(function(l){ return !l.fechada; }).length;
  var SUB = {ret:nRet+(nRet===1 ? " kit pronto para retirar" : " kits prontos para retirar"), mon:nMon+(nMon===1 ? " kit na montagem" : " kits na montagem"), cond:nCond+(nCond===1 ? " revendedora esperando" : " revendedoras esperando"), list:nList+(nList===1 ? " listagem aberta" : " listagens abertas"), whats:"Converse com a equipe", din:"Quem entrega mostra o código; quem recebe digita"};
  var corpo = tela==="ret" ? e(AppBipagemRetirada,{bip:{id:pes.id, nome:pes.nome}, semMoldura:true})
    : tela==="mon" ? e(Celular,{logado:true, setLogado:function(){}, semMoldura:true})
    : tela==="cond" ? e(CelCondicionais) : tela==="list" ? e(CelListagens) : tela==="whats" ? e(WhatsInterno,{pessoa:pes, aoVoltar:function(){ setTela(null); }}) : tela==="din" ? e(PainelDinheiro,{s:s, d:d, usuario:pes.id, modo:ac.k, compacto:true}) : null;
  var flame = e("svg",{viewBox:"0 0 24 30", width:13, height:16, "aria-hidden":true},
    e("defs",null, e("linearGradient",{id:"intFlame", x1:"0%", y1:"0%", x2:"0%", y2:"100%"}, e("stop",{offset:"0%", stopColor:"#F1E4C6"}), e("stop",{offset:"55%", stopColor:"#E8B84B"}), e("stop",{offset:"100%", stopColor:"#B8862B"}))),
    e("path",{fill:"url(#intFlame)", d:"M12 0c2 4-3 6-3 10a3 3 0 0 0 6 0c0-1-.4-2-.4-2 2 1.5 3.4 4.2 3.4 7a6 6 0 1 1-12 0c0-6 4-8 6-15Z"}));
  var metricas = [["ret","Kits para retirar",nRet,"caixa","#F3D8A0"], ["mon","Em montagem",nMon,"montadora","#C6DFF8"], ["cond","Condicionais",nCond,"scan","#C1EDD1"]].filter(function(m){ return ac.tarefas.indexOf(m[0])>=0; });
  var header = e("div",{className:"relative -mx-4 -mt-2 overflow-hidden rounded-b-[34px] bg-[#0B0B0D] px-5 pb-5 pt-4"},
    e("svg",{viewBox:"0 0 380 190", preserveAspectRatio:"none", className:"pointer-events-none absolute inset-0 h-full w-full", "aria-hidden":true},
      e("defs",null, e("linearGradient",{id:"intGoldA", x1:"0%", y1:"0%", x2:"100%", y2:"100%"}, e("stop",{offset:"0%", stopColor:"#B8862B", stopOpacity:0.9}), e("stop",{offset:"55%", stopColor:"#E8B84B", stopOpacity:0.5}), e("stop",{offset:"100%", stopColor:"#F1E4C6", stopOpacity:0}))),
      e("path",{d:"M80 -30 C 200 15 250 65 410 35 L 410 -30 Z", fill:"url(#intGoldA)"}),
      e("path",{d:"M-30 140 C 90 95 220 175 410 105 L 410 210 L -30 210 Z", fill:"url(#intGoldA)", opacity:.35})),
    e("div",{className:"relative flex items-center justify-between gap-2"},
      e("div",{className:"flex min-w-0 items-center gap-2"}, e(Avatar,{nome:pes.nome, i:0, className:"size-10 shrink-0 text-base"}),
        e("span",{className:"flex min-w-0 items-center gap-1"}, e("b",{className:"max-w-[6.5rem] truncate text-[15px] font-bold txt-branco"}, pes.nome), e(Icon,{n:"chevrondown", s:12, className:"shrink-0 text-white/50"}))),
      e("span",{className:"flex shrink-0 items-center gap-1.5"}, flame, e("b",{className:"text-[12.5px] font-black tracking-[.25em] text-amber-200"}, "SORELLY")),
      e("span",{className:"grid size-9 shrink-0 place-items-center rounded-full bg-white/10"}, e(Icon,{n:"sino", s:15, className:"txt-branco"}))));
  // lista compacta, igual à lista de conversas do SorellyChat (linha contínua com fio embaixo, sem cartão nem espaço entre itens)
  var lista = e("div",{className:"mt-3 flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm"}, ["whats"].concat(ac.tarefas).map(function(k, i, arr){ var t = TAREFAS[k], cor = COR_TAREFA[k], chat = k==="whats";
    return e("button",{key:k, type:"button", onClick:function(){ abrir(k); }, className:"flex w-full items-center gap-3 px-3 py-2 text-left active:bg-black/5", style:{borderBottom: i<arr.length-1 ? "1px solid #EEF0F4" : "none"}},
      e("span",{className:"grid size-10 shrink-0 place-items-center rounded-full", style:chat ? {background:"#24180a"} : {background:cor+"1F", color:cor}}, chat ? e(LogoChat,{s:24}) : e(Icon,{n:t.ic, s:18, peso:"fill"})),
      e("div",{className:"min-w-0 flex-1"}, e("b",{className:"block truncate text-[14px] text-[#111827]"}, t.t), e("span",{className:"block truncate text-[12px] text-[#6B7280]"}, SUB[k])),
      e(Icon,{n:"chevron", s:14, className:"shrink-0 text-[#C7CAD1]"})); }));
  if(tela==="whats") return e(React.Fragment,null, e("span",{key:"h", className:"hidden"}), corpo);
  if(tela) return e(React.Fragment,null,
    e("div",{key:"b", className:"flex items-center gap-2"}, e("button",{type:"button", onClick:function(){ setTela(null); }, className:"flex h-8 items-center gap-1 rounded-full bg-[#1C1C1E] px-3 text-[12px] font-semibold text-amber-200"}, "‹ Início"), e("b",{className:"text-[16px]"}, TAREFAS[tela].t)),
    e("div",{key:"c", className:"flex flex-col gap-3"}, corpo));
  return e(React.Fragment,null, header, lista, e("p",{key:"ac", className:"mt-4 text-center text-[11.5px] font-semibold text-[#8E8E93]"}, "Acesso: "+ac.titulo.toLowerCase()+" · "+ac.nota));
}

export { ACESSOS, TAREFAS, COR_TAREFA, claro, Entrada, Seletor, WhatsInterno, AppInterno, acessoDoUsuario };

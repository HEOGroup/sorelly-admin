// Sorelly Admin · montagem — pages/Apps.js
// Página "Apps": os três celulares lado a lado, no meio da tela. Revendedora e Representante são apps de iPhone (feitos fora; aqui só a visão de teste, cada um
// com a sua tela como já era) e dá para escolher quem está usando em cada um, para testar um kit novo nos dois juntos. O App interno é o admin no celular só com as
// tarefas da rua (retirada de kits, montagem, condicionais e listagens); cada pessoa vê só as tarefas do seu acesso.
import { AtalhosAdmin, ATALHOS_REVENDEDORA } from "@/apps/montagem/components/atalhos-admin";
import { LogoChat } from "@/apps/montagem/components/chat/chat-ui";
import { ChatApp } from "@/apps/montagem/components/chat/chat-app";
import { contatoDoLogin, ehDirecao, idPorNome } from "@/apps/montagem/domain/chat-contatos";
import { definirEu, efem } from "@/apps/montagem/domain/chat-store";
import { TemaChatClaro } from "@/apps/montagem/components/chat/chat-ui";
import { ACESSO_TOTAL, AGENDAMENTO, BIPADORAS, FINANCEIRO, LISTAGENS_RESP, MONTADORAS, SUPERVISORA } from "@/apps/montagem/domain/equipe";
import { PainelDinheiro } from "@/apps/montagem/pages/Dinheiro";
import { listagemDe } from "@/apps/montagem/domain/regras";
import { STATUS_LB } from "@/apps/montagem/domain/status";
import { IPhone15, IPhone17ProMax } from "@/apps/montagem/mobile/iphone";
import { AppBipagemRetirada } from "@/apps/montagem/mobile/bipagem";
import { CelCondicionais } from "@/apps/montagem/mobile/condicionais";
import { Celular, CelListagens } from "@/apps/montagem/mobile/montadora";
import { AppRepresentante } from "@/apps/montagem/mobile/representante";
import { AppRevendedora } from "@/apps/montagem/mobile/revendedora";
import { Avatar } from "@/apps/montagem/mobile/theme";
import { isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

var TAREFAS = {ret:{t:"Retirada de kits", ic:"caixa"}, mon:{t:"Montagem de kits", ic:"montadora"}, cond:{t:"Condicionais", ic:"scan"}, list:{t:"Listagens", ic:"registro"}, whats:{t:"SorellyChat", ic:"whats"}, din:{t:"Dinheiro", ic:"wallet"}};
var TUDO = ["ret","mon","cond","list","din"];
var BIP7 = [9,10,22,14,15,13,12];   // Natasha, Edna, Renata, Sthefany, Kawany, Nataly, Natalia
// quem tem acesso a cada tipo de entrada do App interno
var ACESSOS = [
  {k:"dir", titulo:"Diretoria", nota:"vê tudo do app", tarefas:TUDO, pessoas:[{id:16, nome:"Marcus"}, {id:"rh", nome:"Maria (RH)"}, {id:17, nome:"Nickolas"}, {id:28, nome:"Lucas"}]},
  {k:"dey", titulo:"Supervisão da montagem", nota:"Deysiane", tarefas:TUDO, pessoas:[SUPERVISORA]},
  {k:"mon", titulo:"Montagem de kits", nota:"só montagem", tarefas:["mon"], pessoas:MONTADORAS},
  {k:"bip", titulo:"Bipagem", nota:"só retirada de kits", tarefas:["ret","din"], pessoas:BIP7.map(function(id){ return BIPADORAS.find(function(b){ return b.id===id; }); }).filter(Boolean)},
  {k:"con", titulo:"Condicionais", nota:"só condicionais", tarefas:["cond"], pessoas:[LISTAGENS_RESP]},
  {k:"age", titulo:"Agendamento", nota:"recebe kits e dinheiro", tarefas:["din"], pessoas:AGENDAMENTO},
  {k:"fin", titulo:"Financeiro", nota:"recebe o dinheiro", tarefas:["din"], pessoas:FINANCEIRO.concat(ACESSO_TOTAL.slice(0, 1))}];

// lista suspensa em cima de cada celular (um botão só; a lista de pessoas abre ali mesmo)
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

// entrada de cada app: só login (usuário, senha e o botão Entrar como TESTE)
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

// SorellyChat (chat interno) dentro do App interno: a pessoa conversa como ela mesma
function WhatsInterno(p){   // ocupa a tela toda do celular, como o WhatsApp de verdade
  var pes = p.pessoa, cid = pes.id==="rh" ? idPorNome("Maria Claudia") : contatoDoLogin(pes.id);
  if(!cid) return e("p",{className:"rounded-2xl bg-white p-4 text-[13.5px] text-[#6B7280]"}, "Não encontrei o cadastro desta pessoa no chat.");
  definirEu(cid);
  return e("div",{className:"-mx-4 -mb-10 -mt-2 h-[679px] overflow-hidden"}, e(TemaChatClaro,null, e(ChatApp,{eu:cid, direcao:ehDirecao(pes.id), compacto:true, aoVoltarApp:p.aoVoltar})));
}

// App interno: tela inicial no mesmo estilo do app da representante (topo escuro com barras empilhadas e linhas coloridas); ao tocar, a tarefa abre dentro do mesmo celular
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
  var lista = e("div",{className:"mt-3.5 flex flex-col gap-2.5"}, ["whats"].concat(ac.tarefas).map(function(k){ var t = TAREFAS[k], cor = COR_TAREFA[k], chat = k==="whats";
    return e("button",{key:k, type:"button", onClick:function(){ abrir(k); }, style:{background:chat ? "#F6EBCB" : claro(cor,.2), boxShadow:chat ? "inset 0 0 0 2px #C9A13B" : undefined}, className:"flex w-full items-center gap-3 rounded-2xl p-3 text-left shadow-sm active:scale-[.99]"},
      e("span",{className:"grid size-11 shrink-0 place-items-center rounded-2xl", style:chat ? {background:"#24180a"} : {background:cor+"1F", color:cor}}, chat ? e(LogoChat,{s:28}) : e(Icon,{n:t.ic, s:20, peso:"fill"})),
      e("div",{className:"min-w-0 flex-1"}, e("b",{className:"block text-[15px] text-[#111827]"}, t.t), e("span",{className:"block truncate text-[12.5px] text-[#6B7280]"}, SUB[k])),
      e(Icon,{n:"chevron", s:16, className:"shrink-0 text-[#9CA3AF]"})); }));
  if(tela==="whats") return e(React.Fragment,null, e("span",{key:"h", className:"hidden"}), corpo);
  if(tela) return e(React.Fragment,null,
    e("div",{key:"b", className:"flex items-center gap-2"}, e("button",{type:"button", onClick:function(){ setTela(null); }, className:"flex h-8 items-center gap-1 rounded-full bg-[#1C1C1E] px-3 text-[12px] font-semibold text-amber-200"}, "‹ Início"), e("b",{className:"text-[16px]"}, TAREFAS[tela].t)),
    e("div",{key:"c", className:"flex flex-col gap-3"}, corpo));
  return e(React.Fragment,null, header, lista, e("p",{key:"ac", className:"mt-4 text-center text-[11.5px] font-semibold text-[#8E8E93]"}, "Acesso: "+ac.titulo.toLowerCase()+" · "+ac.nota));
}

var titulo = function(t){ return String(t||"").toLowerCase().replace(/(^|\s)([a-zà-ú])/g, function(m, a, b){ return a+b.toUpperCase(); }).replace(/ (De|Da|Do|Dos|Das|E) /g, function(m){ return m.toLowerCase(); }); };
// app da "representante Sorelly": quantidade de acertos, total vendido e total pago do atendimento interno (a visão do Marcus; ele usa direto o admin)
function AppSorelly(p){
  var s = p.s, mes = isoDia(new Date()).slice(0, 7), r2 = function(n){ return Math.round(n*100)/100; };
  var ac = (s.acertosConsignado||[]).filter(function(r){ return r.origem==="interno" && r.tipo==="acerto" && String(r.data||"").slice(0, 7)===mes; });
  var vendido = r2(ac.reduce(function(t, r){ return t+(r.vendaBruta||0); }, 0)), pago = r2(ac.reduce(function(t, r){ return t+(r.pagamentos||[]).reduce(function(x, y){ return x+(y.valor||0); }, 0); }, 0));
  var hojeIso = isoDia(new Date()), dia = (s.internos||[]).filter(function(x){ return x.data===hojeIso; });
  var brl = function(v){ return "R$ "+v.toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); };
  var barra = function(lb, v, cor, ic){ return e("div",{key:lb, className:"flex items-center justify-between gap-2 rounded-xl bg-white/8 px-3 py-2"},
    e("span",{className:"flex min-w-0 items-center gap-2"}, e("span",{className:"grid size-6 shrink-0 place-items-center rounded-full bg-white/10", style:{color:cor}}, e(Icon,{n:ic, s:13, peso:"fill"})), e("b",{className:"truncate text-[12.5px] font-semibold txt-branco"}, lb)),
    e("span",{className:"shrink-0 whitespace-nowrap text-[13.5px] font-extrabold text-amber-200"}, v)); };
  return e(React.Fragment,null,
    e("div",{key:"h", className:"relative -mx-4 -mt-2 overflow-hidden rounded-b-[34px] bg-[#0B0B0D] px-5 pb-5 pt-4"},
      e("div",{className:"relative flex items-center justify-between gap-2"},
        e("div",{className:"flex min-w-0 items-center gap-2"}, e(Avatar,{nome:"Sorelly", i:0, className:"size-10 shrink-0 text-base"}), e("div",{className:"min-w-0"}, e("b",{className:"block truncate text-[15px] font-bold txt-branco"}, "Sorelly"), e("span",{className:"block text-[11px] text-white/60"}, "Atendimento interno · "+mes.split("-").reverse().join("/")))),
        e("b",{className:"text-[12.5px] font-black tracking-[.25em] text-amber-200"}, "SORELLY")),
      e("div",{className:"relative mt-3 flex flex-col gap-1.5"}, barra("Acertos no mês", String(ac.length), "#F3D8A0", "grafico"), barra("Vendido total", brl(vendido), "#C6DFF8", "wallet"), barra("Pago total", brl(pago), "#C1EDD1", "coins"))),
    e("p",{key:"t", className:"mt-3 px-1 text-[11px] font-bold uppercase tracking-wider text-[#9A8B63]"}, "Hoje no atendimento · "+dia.length+" revendedoras"),
    e("div",{key:"l", className:"mt-1.5 flex flex-col gap-1.5"}, dia.length===0 ? e("p",{className:"rounded-2xl bg-white p-4 text-[13px] text-[#6B7280]"}, "Ninguém agendada para hoje.") : dia.map(function(x){ var feito = x.status==="acertado", canc = x.status==="cancelado";
      return e("div",{key:x.id, className:"flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm"},
        e("b",{className:"w-11 shrink-0 text-[12px] text-[#6B7280]"}, x.hora||"—"), e("span",{className:"min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[#111827]"}, titulo(x.nome)),
        e("span",{className:"shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold", style:{background:feito ? "#DCFCE7" : canc ? "#FEE2E2" : "#FEF3C7", color:feito ? "#15803D" : canc ? "#B91C1C" : "#B45309"}}, feito ? "Atendida" : canc ? "Cancelada" : "A atender")); })));
}

function Coluna(p){   // seletor em cima, celular no meio (os três com a mesma altura na tela), nome do app embaixo
  return e("div",{className:"flex w-[318px] shrink-0 flex-col items-center gap-3"},
    p.seletor, e("div",{style:{zoom:p.zoom || 0.85}}, p.celular),
    p.admin && e(AtalhosAdmin,{titulo:"O que este app gera no admin", itens:p.admin}),
    e("div",{className:"flex flex-col items-center gap-2 text-center"}, e("b",{className:"text-[18px] font-extrabold tracking-wide"}, p.nome),
      e("span",{className:"rounded-full px-4 py-1 text-[13px] font-extrabold tracking-wide", style:p.azul ? {backgroundImage:"linear-gradient(90deg,#1D4ED8,#38BDF8)", color:"#FFFFFF"} : {backgroundImage:"linear-gradient(90deg,#B8862B,#E8B84B,#F1E4C6)", color:"#1B1409"}}, p.sub)));
}

function AbaApps(){
  var s = use().state;
  // Revendedora: quem já teve kit retirado ou bipado
  var ksReais = s.kits.filter(function(k){ return k.status==="retirado" || k.status==="bipado"; });
  // revendedoras do atendimento interno: o "kit" de cada uma é só o cadastro dela (representante = Sorelly)
  var ksSorelly = (s.internos||[]).map(function(it){ return {id:"INT-"+it.id, rev:titulo(it.nome), rep:"Sorelly", interno:true, internoId:it.id, vendas:[it.vendaApp||0], status:"retirado", tipoKit:"acerto_kit", lid:null}; });
  var rv = useState({logado:true, id:null}), rev = rv[0], setRev = rv[1];
  var rp = useState({logado:true, id:null}), rep = rp[0], setRep = rp[1];
  var it = useState({pessoa:ACESSOS[0].pessoas[0], acesso:ACESSOS[0]}), inte = it[0], setInte = it[1];   // os três apps já abrem direto, sem tela de entrada
  var lAtual = s.listagens.find(function(x){ return x.id===rep.id; }) || s.listagens[0];
  // com uma representante conectada, o app da revendedora só mostra as revendedoras dela (facilita testar kit novo nos dois juntos)
  var sorelly = rep.logado && rep.id==="SORELLY";
  var ks = sorelly ? ksSorelly : rep.logado ? ksReais.filter(function(k){ return listagemDe(s,k).rep===lAtual.rep; }) : ksReais;
  var kAtual = ks.find(function(x){ return x.id===rev.id; }) || ks[0];
  var gruposRev = ks.length ? [{itens:ks.map(function(k){ return {id:k.id, nome:k.rev, sub:k.interno ? "Sorelly · atendimento interno" : listagemDe(s,k).rep+" · "+STATUS_LB[k.status]}; })}] : [];
  var gruposRep = [{itens:[{id:"SORELLY", nome:"Sorelly", sub:"Atendimento interno (revendedoras que vêm à empresa)"}].concat(s.listagens.map(function(l){ return {id:l.id, nome:l.rep, sub:"Retirada "+l.horario+(l.fechada ? " · concluída" : "")}; }))}];
  var gruposInt = ACESSOS.map(function(a){ return {titulo:a.titulo, nota:a.nota, acesso:a, itens:a.pessoas.map(function(x){ return {id:x.id, nome:x.nome, pessoa:x}; })}; });
  var entradaRev = e(Entrada,{titulo:"App da revendedora", onEntrar:function(){ setRev({logado:true, id:kAtual && kAtual.id}); }, onTeste:function(){ setRev({logado:true, id:kAtual && kAtual.id}); }});
  var entradaRep = e(Entrada,{altura:722, titulo:"App da representante", onEntrar:function(){ setRep({logado:true, id:lAtual.id}); }, onTeste:function(){ setRep({logado:true, id:lAtual.id}); }});
  var entradaInt = e(Entrada,{titulo:"Sorelly interno", onEntrar:function(){ setInte({pessoa:ACESSOS[0].pessoas[0], acesso:ACESSOS[0]}); }, onTeste:function(){ setInte({pessoa:ACESSOS[0].pessoas[0], acesso:ACESSOS[0]}); }});
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Apps", sub:"Os apps, lado a lado. Revendedora e Representante são apps de celular; o App interno é o admin no navegador, só com as tarefas da rua. Escolha quem está usando em cada um."}),
    e("div",{className:"flex flex-wrap items-start justify-center gap-6"},
      e(Coluna,{nome:"Revendedora", sub:"App para iOS ou Android", admin:ATALHOS_REVENDEDORA,
        seletor:e(Seletor,{rotulo:"Escolher revendedora", atual:rev.logado && kAtual ? "Revendedora: "+kAtual.rev : "Escolher revendedora", atualId:rev.logado && kAtual ? kAtual.id : null, grupos:gruposRev, vazio:sorelly ? "Nenhuma revendedora no atendimento interno." : rep.logado ? "Nenhuma revendedora dessa representante com kit entregue." : "Nenhum kit entregue ainda.",
          onEscolher:function(g, i){ setRev(i ? {logado:true, id:i.id} : {logado:false, id:null}); }}),
        celular: rev.logado && kAtual ? e(AppRevendedora,{key:kAtual.id, k:kAtual}) : e(IPhone15,null, entradaRev)}),
      e(Coluna,{nome:"Representante", sub:"App para iOS ou Android", zoom:0.81,
        seletor:e(Seletor,{rotulo:"Escolher representante", atual:rep.logado ? "Representante: "+(sorelly ? "Sorelly" : lAtual.rep) : "Escolher representante", atualId:rep.logado ? (sorelly ? "SORELLY" : lAtual.id) : null, grupos:gruposRep,
          onEscolher:function(g, i){ setRep(i ? {logado:true, id:i.id} : {logado:false, id:null}); }}),
        celular: rep.logado ? (sorelly ? e(IPhone17ProMax,null, e(AppSorelly,{s:s})) : e(AppRepresentante,{key:lAtual.id, l:lAtual})) : e(IPhone17ProMax,null, entradaRep)}),
      e(Coluna,{nome:"App interno", azul:true, sub:"Admin · visualização em navegador",
        seletor:e(Seletor,{rotulo:"Escolher acesso e pessoa", atual:inte.pessoa ? inte.acesso.titulo+": "+inte.pessoa.nome : "Escolher acesso e pessoa", atualId:inte.pessoa ? inte.pessoa.id : null, grupos:gruposInt,
          onEscolher:function(g, i){ setInte(i ? {pessoa:i.pessoa, acesso:g.acesso} : {pessoa:null, acesso:null}); }}),
        celular:e(IPhone15,null, inte.pessoa ? e(AppInterno,{key:inte.acesso.k+"|"+inte.pessoa.id, pessoa:inte.pessoa, acesso:inte.acesso}) : entradaInt)})),
    null);
}
export { AbaApps };

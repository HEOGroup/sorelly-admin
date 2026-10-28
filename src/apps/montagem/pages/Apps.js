// Sorelly Admin · montagem — pages/Apps.js
// Página "Apps": duas abas. 1) Representante & revendedora — os dois apps de iPhone lado a lado (feitos fora; aqui só a visão de
// teste), dá para escolher quem está usando em cada um, para testar um kit novo nos dois juntos. 2) Funcionárias — o App das
// funcionárias (mobile/app-funcionarias.js), o MESMO app que monta, bipa e confere condicionais; cada pessoa vê só as tarefas
// do seu acesso. A versão de verdade (usada pela equipe) fica em pages/CelularFuncionarios.js, com o mesmo componente.
import { AtalhosAdmin, ATALHOS_REVENDEDORA } from "@/apps/montagem/components/atalhos-admin";
import { ACESSOS, AppInterno, Entrada, Seletor } from "@/apps/montagem/mobile/app-funcionarias";
import { listagemDe } from "@/apps/montagem/domain/regras";
import { STATUS_LB } from "@/apps/montagem/domain/status";
import { IPhone15, IPhone17ProMax } from "@/apps/montagem/mobile/iphone";
import { AppRepresentante } from "@/apps/montagem/mobile/representante";
import { AppRevendedora } from "@/apps/montagem/mobile/revendedora";
import { Avatar } from "@/apps/montagem/mobile/theme";
import { Segmentado } from "@/apps/montagem/components/padrao-fin";
import { isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

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

// aba 1: Representante & revendedora (os dois juntos, para testar um kit novo nos dois)
function AbaRepRev(){
  var s = use().state;
  var ksReais = s.kits.filter(function(k){ return k.status==="retirado" || k.status==="bipado"; });
  var ksSorelly = (s.internos||[]).map(function(it){ return {id:"INT-"+it.id, rev:titulo(it.nome), rep:"Sorelly", interno:true, internoId:it.id, vendas:[it.vendaApp||0], status:"retirado", tipoKit:"acerto_kit", lid:null}; });
  var rv = useState({logado:true, id:null}), rev = rv[0], setRev = rv[1];
  var rp = useState({logado:true, id:null}), rep = rp[0], setRep = rp[1];
  var lAtual = s.listagens.find(function(x){ return x.id===rep.id; }) || s.listagens[0];
  var sorelly = rep.logado && rep.id==="SORELLY";
  var ks = sorelly ? ksSorelly : rep.logado ? ksReais.filter(function(k){ return listagemDe(s,k).rep===lAtual.rep; }) : ksReais;
  var kAtual = ks.find(function(x){ return x.id===rev.id; }) || ks[0];
  var gruposRev = ks.length ? [{itens:ks.map(function(k){ return {id:k.id, nome:k.rev, sub:k.interno ? "Sorelly · atendimento interno" : listagemDe(s,k).rep+" · "+STATUS_LB[k.status]}; })}] : [];
  var gruposRep = [{itens:[{id:"SORELLY", nome:"Sorelly", sub:"Atendimento interno (revendedoras que vêm à empresa)"}].concat(s.listagens.map(function(l){ return {id:l.id, nome:l.rep, sub:"Retirada "+l.horario+(l.fechada ? " · concluída" : "")}; }))}];
  var entradaRev = e(Entrada,{titulo:"App da revendedora", onEntrar:function(){ setRev({logado:true, id:kAtual && kAtual.id}); }, onTeste:function(){ setRev({logado:true, id:kAtual && kAtual.id}); }});
  var entradaRep = e(Entrada,{altura:722, titulo:"App da representante", onEntrar:function(){ setRep({logado:true, id:lAtual.id}); }, onTeste:function(){ setRep({logado:true, id:lAtual.id}); }});
  return e("div",{className:"flex flex-wrap items-start justify-center gap-6"},
    e(Coluna,{nome:"Revendedora", sub:"App para iOS ou Android", admin:ATALHOS_REVENDEDORA,
      seletor:e(Seletor,{rotulo:"Escolher revendedora", atual:rev.logado && kAtual ? "Revendedora: "+kAtual.rev : "Escolher revendedora", atualId:rev.logado && kAtual ? kAtual.id : null, grupos:gruposRev, vazio:sorelly ? "Nenhuma revendedora no atendimento interno." : rep.logado ? "Nenhuma revendedora dessa representante com kit entregue." : "Nenhum kit entregue ainda.",
        onEscolher:function(g, i){ setRev(i ? {logado:true, id:i.id} : {logado:false, id:null}); }}),
      celular: rev.logado && kAtual ? e(AppRevendedora,{key:kAtual.id, k:kAtual}) : e(IPhone15,null, entradaRev)}),
    e(Coluna,{nome:"Representante", sub:"App para iOS ou Android", zoom:0.81,
      seletor:e(Seletor,{rotulo:"Escolher representante", atual:rep.logado ? "Representante: "+(sorelly ? "Sorelly" : lAtual.rep) : "Escolher representante", atualId:rep.logado ? (sorelly ? "SORELLY" : lAtual.id) : null, grupos:gruposRep,
        onEscolher:function(g, i){ setRep(i ? {logado:true, id:i.id} : {logado:false, id:null}); }}),
      celular: rep.logado ? (sorelly ? e(IPhone17ProMax,null, e(AppSorelly,{s:s})) : e(AppRepresentante,{key:lAtual.id, l:lAtual})) : e(IPhone17ProMax,null, entradaRep)}));
}

// aba 2: Funcionárias — UM app só (mobile/app-funcionarias.js); muda só o que cada pessoa pode tocar
function AbaFuncionarias(){
  var it = useState({pessoa:ACESSOS[0].pessoas[0], acesso:ACESSOS[0]}), inte = it[0], setInte = it[1];   // já abre direto, sem tela de entrada
  var gruposInt = ACESSOS.map(function(a){ return {titulo:a.titulo, nota:a.nota, acesso:a, itens:a.pessoas.map(function(x){ return {id:x.id, nome:x.nome, pessoa:x}; })}; });
  var entradaInt = e(Entrada,{titulo:"App das funcionárias", onEntrar:function(){ setInte({pessoa:ACESSOS[0].pessoas[0], acesso:ACESSOS[0]}); }, onTeste:function(){ setInte({pessoa:ACESSOS[0].pessoas[0], acesso:ACESSOS[0]}); }});
  return e("div",{className:"flex flex-wrap items-start justify-center gap-6"},
    e(Coluna,{nome:"Funcionárias", azul:true, sub:"Montagem, bipagem e condicionais — um app só",
      seletor:e(Seletor,{rotulo:"Escolher acesso e pessoa", atual:inte.pessoa ? inte.acesso.titulo+": "+inte.pessoa.nome : "Escolher acesso e pessoa", atualId:inte.pessoa ? inte.pessoa.id : null, grupos:gruposInt,
        onEscolher:function(g, i){ setInte(i ? {pessoa:i.pessoa, acesso:g.acesso} : {pessoa:null, acesso:null}); }}),
      celular:e(IPhone15,null, inte.pessoa ? e(AppInterno,{key:inte.acesso.k+"|"+inte.pessoa.id, pessoa:inte.pessoa, acesso:inte.acesso}) : entradaInt)}));
}

function AbaApps(){
  var vt = useState("reprev"), vista = vt[0], setVista = vt[1];
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Apps", sub:"Visão de teste dos apps. Escolha quem está usando em cada um."}),
    e("div",{className:"flex justify-center"}, e(Segmentado,{opcoes:[["reprev","Representante & revendedora"],["func","Funcionárias"]], atual:vista, onMudar:setVista})),
    vista==="reprev" ? e(AbaRepRev) : e(AbaFuncionarias));
}
export { AbaApps };

// Sorelly Admin · montagem — pages/Apps.js
// Página "Apps": duas abas. 1) Representante & revendedora — os dois apps de iPhone lado a lado (feitos fora; aqui só a visão de
// teste), dá para escolher quem está usando em cada um, para testar um kit novo nos dois juntos. 2) Funcionárias — o App das
// funcionárias (mobile/app-funcionarias.js), o MESMO app que monta, bipa e confere condicionais; cada pessoa vê só as tarefas
// do seu acesso. A versão de verdade (usada pela equipe) fica em pages/CelularFuncionarios.js, com o mesmo componente.
import { ACESSOS, AppInterno, Entrada, Seletor } from "@/apps/montagem/mobile/app-funcionarias";
import { listagemDe } from "@/apps/montagem/domain/regras";
import { STATUS_LB } from "@/apps/montagem/domain/status";
import { IPhone15, IPhone17ProMax } from "@/apps/montagem/mobile/iphone";
import { AppCliente } from "@/apps/montagem/mobile/cliente";
import { AppMotoboy } from "@/apps/montagem/mobile/motoboy";
import { AppRepresentante } from "@/apps/montagem/mobile/representante";
import { AppRevendedora } from "@/apps/montagem/mobile/revendedora";
import { Avatar } from "@/apps/montagem/mobile/theme";
import { isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useEffect, useRef, useState } from "@/shared/react";
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

// Celular que age no passo do fluxo: contorno na cor dele que pisca (appsGlow, definido no <style> de AbaApps). Dois celulares no mesmo passo brilham juntos.
// Com muitos celulares na linha o zoom cai (f pequeno): aí o seletor e os atalhos do admin somem para o celular caber (volte ao tamanho M ou G para usá-los).
// Cada celular é um CARTÃO (todos iguais, alinhados pelo topo e pela base): em cima o cargo (clica para escolher a pessoa) e a bolinha com o nome dela;
// no meio o celular; embaixo o tipo do app. Os nomes de pessoa de dentro dos apps são só de teste: quem manda é o cargo.
function Coluna(p){
  var z = (p.zoom || 0.85)*(p.f || 1), cor = p.cor || "#E8B84B", compacto = (p.f || 1) < 0.75;
  var larg = Math.round(362*0.85*(p.f || 1))+4;   // todos os cartões com a MESMA largura (o celular da representante é um pouco mais estreito e fica centralizado)
  // cabeçalho fino e igual em todos os cartões (altura fixa): cargo à esquerda (até 2 linhas) e a bolinha da pessoa à direita
  // barra baixa (34 px, uma linha só): o cargo e, AO LADO, o nome da pessoa; a bolinha com a inicial só aparece quando há largura de sobra
  var comBolinha = larg >= 200, soInicial = larg < 175;   // cartão muito estreito (tamanho P): só a inicial da pessoa (o nome inteiro aparece ao passar o mouse)
  var conteudoCab = function(aberto){ return [
    e("span",{key:"n", className:"shrink-0 whitespace-nowrap text-[12px] font-semibold", title:p.nome}, p.nome),
    p.pessoa && e("span",{key:"p", className:"flex min-w-0 shrink items-center gap-1 rounded-full text-[11px] font-semibold "+(comBolinha ? "pl-0.5 pr-1.5" : "px-1.5"), title:p.pessoa, style:{background:"rgba(0,0,0,.28)", color:"#fff"}},
      (comBolinha || soInicial) && e("span",{className:"grid size-4 shrink-0 place-items-center rounded-full text-[10px] font-extrabold", style:{background:cor, color:"#14110A"}}, String(p.pessoa).charAt(0).toUpperCase()),
      !soInicial && e("span",{className:"truncate"}, String(p.pessoa).split(" ")[0]))]; };
  var estiloCab = {background:p.age ? cor : hexA(cor, .22), color:p.age ? "#14110A" : null};
  // cabeçalho centralizado e igual em todos os cartões; clicar na barra já abre a lista (sem seta)
  var CAB = "mx-auto flex h-[22px] w-fit max-w-full items-center justify-center gap-1.5 overflow-hidden rounded-md px-2 text-center leading-tight";   // barra pequena: só o tamanho do texto, centralizada
  var cab = p.seletorProps
    ? e(Seletor,Object.assign({gatilho:function(aberto, alterna){ return e("button",{type:"button", onClick:alterna, "aria-expanded":aberto, title:"Clique para escolher a pessoa", className:CAB, style:estiloCab}, conteudoCab(aberto)); }}, p.seletorProps))
    : e("div",{className:CAB, style:estiloCab}, conteudoCab(false));
  // sem contorno em volta do cartão: ficam só a barra de cima (cargo + pessoa) e o celular
  return e("div",{style:{width:larg+16, order:p.ordem}, className:"flex shrink-0 flex-col items-center gap-2 p-2"},
    // o tipo do app fica EM CIMA da barra do cargo (nada embaixo do celular); a barra é baixa e mais estreita que o celular
    e("div",{className:"flex w-full flex-col items-center gap-1"},
      e("span",{className:"h-[18px] shrink-0 whitespace-nowrap rounded-full px-2.5 text-[10px] font-extrabold leading-[18px]", style:p.azul ? {backgroundImage:"linear-gradient(90deg,#1D4ED8,#38BDF8)", color:"#FFFFFF"} : {backgroundImage:"linear-gradient(90deg,#B8862B,#E8B84B,#F1E4C6)", color:"#1B1409"}}, p.sub),
      e("div",{className:"w-full"}, cab)),
    e("div",{className:"flex flex-1 items-start justify-center"}, e("div",{style:{zoom:z}}, e("div",{style:p.age ? {borderRadius:66, "--gc":cor, animation:"appsGlow 1.3s ease-in-out infinite"} : null}, p.celular))));
}

// Revendedora e representante dividem o mesmo contexto (os kits da revendedora vêm da representante escolhida); cada um só aparece se estiver ligado em "Celulares"
function ColsRepRev(p){
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
  return e(React.Fragment,null,
    p.rev && e(Coluna,{key:"rev", f:p.f, ordem:1, cor:COR_CEL.rev, age:!!(p.age && p.age.rev), nome:"Revendedora", sub:"App para iOS ou Android",
      pessoa:rev.logado && kAtual ? titulo(kAtual.rev) : null,
      seletorProps:{rotulo:"Escolher revendedora", atual:rev.logado && kAtual ? "Revendedora: "+kAtual.rev : "Escolher revendedora", atualId:rev.logado && kAtual ? kAtual.id : null, grupos:gruposRev, vazio:sorelly ? "Nenhuma revendedora no atendimento interno." : rep.logado ? "Nenhuma revendedora dessa representante com kit entregue." : "Nenhum kit entregue ainda.",
        onEscolher:function(g, i){ setRev(i ? {logado:true, id:i.id} : {logado:false, id:null}); }},
      celular: rev.logado && kAtual ? e(AppRevendedora,{key:kAtual.id, k:kAtual}) : e(IPhone15,null, entradaRev)}),
    p.rep && e(Coluna,{key:"rep", f:p.f, ordem:0, cor:COR_CEL.rep, age:!!(p.age && p.age.rep), nome:"Representante", sub:"App para iOS ou Android", zoom:0.806,
      pessoa:rep.logado ? (sorelly ? "Sorelly" : lAtual.rep) : null,
      seletorProps:{rotulo:"Escolher representante", atual:rep.logado ? "Representante: "+(sorelly ? "Sorelly" : lAtual.rep) : "Escolher representante", atualId:rep.logado ? (sorelly ? "SORELLY" : lAtual.id) : null, grupos:gruposRep,
        onEscolher:function(g, i){ setRep(i ? {logado:true, id:i.id} : {logado:false, id:null}); }},
      celular: rep.logado ? (sorelly ? e(IPhone17ProMax,null, e(AppSorelly,{s:s})) : e(AppRepresentante,{key:lAtual.id, l:lAtual})) : e(IPhone17ProMax,null, entradaRep)}));
}

// nome curto do cargo na barra de cima do cartão (o nome inteiro continua na linha do tempo e na dica)
var NOME_CURTO = {dir:"Diretoria", dey:"Supervisão", mon:"Montagem", bip:"Bipagem", con:"Condicionais", age:"Agendamento", fin:"Financeiro"};
// Um celular do App das funcionárias para CADA acesso ligado (montagem, bipagem, condicionais...), cada um com a sua pessoa
function ColFunc(p){
  var ac = p.ac, ps = useState(ac.pessoas[0]), pessoa = ps[0], setPessoa = ps[1];
  var grupos = [{titulo:ac.titulo, nota:ac.nota, itens:ac.pessoas.map(function(x){ return {id:x.id, nome:x.nome, pessoa:x}; })}];
  return e(Coluna,{f:p.f, ordem:2, cor:COR_CEL[ac.k], age:!!(p.age && p.age[ac.k]), nome:NOME_CURTO[ac.k] || ac.titulo, azul:true, sub:"App interno",
    pessoa:pessoa ? pessoa.nome : null,
    seletorProps:{rotulo:"Escolher pessoa", atual:pessoa ? ac.titulo+": "+pessoa.nome : "Escolher pessoa", atualId:pessoa ? pessoa.id : null, grupos:grupos,
      onEscolher:function(g, i){ setPessoa(i ? i.pessoa : ac.pessoas[0]); }},
    celular:e(IPhone15,null, e(AppInterno,{key:ac.k+"|"+pessoa.id, pessoa:pessoa, acesso:ac}))});
}

// Topo da tela (29/10/2026, escolha do Marcus: "linha do tempo"): escolhe-se um fluxo, o cursor anda pelos passos e o celular de quem age fica com o contorno dourado "Age agora".
// Cada fluxo liga os seus celulares; cada pista (celular) pode ser ligada ou ocultada; qualquer celular avulso também pode ser ligado. A escolha dos celulares fica neste navegador.
// Os apps ainda não trocam dados entre si: a linha do tempo mostra o caminho e quem age, não muda o conteúdo de cada celular.
var CELULARES = [["rep","Representante"], ["rev","Revendedora"]].concat(ACESSOS.map(function(a){ return [a.k, a.titulo]; })).concat([["mot","Motoboy"], ["cli","Cliente final"]]);
var NOME_CEL = {}, TODOS = {}, PRINCIPAIS = {}; CELULARES.forEach(function(c){ NOME_CEL[c[0]] = c[1]; TODOS[c[0]] = true; });
["rep","rev","dey","con","mon","bip","mot","cli"].forEach(function(k){ PRINCIPAIS[k] = true; });   // sem fluxo escolhido = estes 8 (cabem na tela); com fluxo = só os dele; "Todos" liga os 11
// Fluxos de exemplo montados com as regras do sistema; o Marcus ajusta nomes, passos e participantes.
var FLUXOS = [
  {nome:"Kit novo + venda + entrega", pistas:["rep","rev","dey","con","mon","bip","mot","cli"], passos:[
    {n:"Agendamento", a:["rep"], t:{rep:"Agenda o kit novo da revendedora"}},
    {n:"Listagem", a:["dey"], t:{dey:"Vê o kit novo na listagem", rep:"Aguarda"}},
    {n:"Condicionais", a:["con"], t:{con:"Acessa a listagem e libera a condicional", dey:"Vê aguardando condicional", rep:"Aguarda"}},
    {n:"Montagem", a:["mon"], t:{mon:"Acessa, monta e informa quem montou", dey:"Vê montando", con:"Condicional liberada"}},
    {n:"Bipagem", a:["bip"], t:{bip:"Recebe o kit liberado e bipa", dey:"Vê aguardando bipagem", mon:"Montagem concluída"}},
    {n:"Retirada", a:["bip","rep"], t:{bip:"Entrega o kit", rep:"Retira o kit", dey:"Vê bipado"}},
    {n:"Volta", a:["rep"], t:{rep:"Volta com o kit para a revendedora", rev:"Aguarda a representante"}},
    {n:"Entrega do kit", a:["rep","rev"], t:{rep:"Entrega o kit novo e confere as peças", rev:"Confirma cada etapa e assina"}},
    {n:"Venda", a:["rev","cli"], t:{rev:"Efetua uma venda no app", cli:"Compra da revendedora"}},
    {n:"Motoboy", a:["rev","mot"], t:{rev:"Agenda a entrega com o motoboy", mot:"Recebe a oferta e aceita", cli:"Aguarda"}},
    {n:"Coleta", a:["mot"], t:{mot:"Chega, registra a foto e retira", rev:"Acompanha", cli:"Acompanha o pedido"}},
    {n:"Entrega", a:["mot","cli"], t:{mot:"Entrega e confirma com o PIN", cli:"Recebe e informa o PIN", rev:"Acompanha"}},
    {n:"Concluída", a:["rev","cli","mot"], t:{rev:"Vê a venda concluída", cli:"Avalia a entrega", mot:"Recebe o repasse"}}]},
  {nome:"Listagem de kits", pistas:["rep","con","dey","mon","bip"], passos:[
    {n:"Pedido", a:["rep"], t:{rep:"Preenche e envia o pedido da nova listagem"}},
    {n:"Condicionais", a:["con"], t:{con:"Confere números e peças e libera a condicional", rep:"Aguarda", dey:"Vê aguardando condicionais"}},
    {n:"Listagem", a:["dey"], t:{dey:"Vê o kit na fila, com valor e horário", rep:"Aguarda", con:"Condicional liberada", mon:"Vê o kit na fila"}},
    {n:"Montagem", a:["mon"], t:{mon:"Inicia, monta e informa quem montou", dey:"Vê montando", rep:"Aguarda"}},
    {n:"Bipagem", a:["bip"], t:{bip:"Bipa o kit; divergência acima de 20% é registrada", dey:"Vê aguardando bipagem", mon:"Montagem concluída"}},
    {n:"Retirada", a:["bip","rep"], t:{bip:"Entrega o kit", rep:"Retira o kit", dey:"Vê bipado"}}]},
  {nome:"Pagamento do acerto", pistas:["rep","age","fin"], passos:[
    {n:"Acerto", a:["rep"], t:{rep:"Faz o acerto no app e lança os pagamentos"}},
    {n:"Conferência", a:["age"], t:{age:"Confere o dinheiro e a condicional assinada", rep:"Aguarda", fin:"Vê pendente"}},
    {n:"Conciliação", a:["fin"], t:{fin:"Dá o OK com a conta onde o dinheiro entrou", age:"Conferido", rep:"Vê a comissão pendente"}},
    {n:"Comissão", a:["fin","rep"], t:{fin:"A comissão entra em A pagar", rep:"Vê a comissão liberada"}}]},
  {nome:"Entrega", pistas:["rev","mot","cli"], passos:[
    {n:"Pedido", a:["rev"], t:{rev:"Pede o motoboy", cli:"Aguarda"}},
    {n:"Oferta", a:["mot"], t:{mot:"Recebe a oferta e aceita", rev:"Aguarda", cli:"Aguarda"}},
    {n:"Coleta", a:["mot"], t:{mot:"Chega, registra a foto e retira", rev:"Acompanha", cli:"Acompanha o pedido"}},
    {n:"Entrega", a:["mot","cli"], t:{mot:"Entrega e confirma com o PIN", cli:"Recebe e informa o PIN", rev:"Acompanha"}},
    {n:"Concluída", a:["rev","cli","mot"], t:{rev:"Vê a entrega concluída", cli:"Avalia a entrega", mot:"Recebe o repasse"}}]},
  {nome:"Retirada de kits", pistas:["bip","rep"], passos:[
    {n:"Pronto", a:["bip"], t:{bip:"Kit bipado e pronto"}},
    {n:"Retirada", a:["bip","rep"], t:{bip:"Entrega o kit", rep:"Retira o kit"}},
    {n:"Concluído", a:["rep"], t:{rep:"Vê o kit como retirado", bip:"Retirada registrada"}}]},
  {nome:"Kit novo", pistas:["rep","rev","mon"], passos:[
    {n:"Montagem", a:["mon"], t:{mon:"Monta o kit novo", rep:"Aguarda", rev:"Aguarda"}},
    {n:"Entrega", a:["rep","rev"], t:{rep:"Inicia a entrega e conduz as etapas", rev:"Confirma cada etapa e assina"}},
    {n:"Conferência", a:["rep"], t:{rep:"Confere as peças e finaliza", rev:"Vê o resumo da entrega"}}]},
  {nome:"Atendimento interno", pistas:["rev","bip","mon"], passos:[
    {n:"Chegada", a:["rev"], t:{rev:"Chega à Sorelly para o acerto"}},
    {n:"Acerto", a:["bip"], t:{bip:"Bipa o acerto", rev:"Aguarda"}},
    {n:"Kit novo", a:["mon"], t:{mon:"Acompanha a escolha e monta o kit", rev:"Escolhe o kit", bip:"Acerto bipado"}},
    {n:"Bipagem", a:["bip"], t:{bip:"Bipa o kit novo", rev:"Recebe o kit"}}]}
];
function Chip(p){
  return e("button",{type:"button", onClick:p.onClick, disabled:p.disabled, className:"h-7 whitespace-nowrap rounded-md border px-3 text-[13px] disabled:opacity-40 "+(p.on ? "font-semibold" : "border-border bg-card text-foreground hover:border-primary"), style:p.on ? {background:"#E8B84B", borderColor:"#E8B84B", color:"#1B1409"} : null}, p.children);
}
function Rotulo(p){ return e("span",{className:"text-[11px] font-bold uppercase tracking-wider text-muted-foreground"}, p.children); }

// Cor de cada celular na grade (barra, ponto e fundo do quadro de quem age)
var COR_CEL = {rev:"#EC4899", rep:"#8B5CF6", mot:"#14B8A6", cli:"#22D3EE", dir:"#E8B84B", dey:"#F59E0B", mon:"#38BDF8", bip:"#F97316", con:"#34D399", age:"#A78BFA", fin:"#60A5FA"};
function hexA(h, a){ var n = parseInt(h.slice(1), 16); return "rgba("+(n>>16)+","+((n>>8)&255)+","+(n&255)+","+a+")"; }

// grade: uma pista por celular, uma coluna por passo. Linhas finas de 1 px entre os quadros; passo atual em dourado; passos já feitos com ✓; quadro de quem age na cor do celular.
function GradeTempo(p){
  var fl = p.fl, n = fl.passos.length, cels = [];
  cels.push(e("div",{key:"c0", className:"bg-card"}));
  fl.passos.forEach(function(x, k){
    var cur = k===p.passo, feito = k<p.passo;
    cels.push(e("button",{key:"h"+k, type:"button", onClick:function(){ p.vai(k); }, className:"h-8 bg-card px-2 text-center text-[13px] "+(cur ? "font-bold" : feito ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"),
      style:cur ? {color:"#E8B84B", boxShadow:"inset 0 -2px 0 #E8B84B", backgroundImage:"linear-gradient(rgba(232,184,75,.10),rgba(232,184,75,.10))"} : null},
      e("span",{style:{color:feito ? "#34C27A" : null}}, feito ? "✓ " : ""), (k+1)+" · "+x.n));
  });
  fl.pistas.forEach(function(a){
    var cor = COR_CEL[a] || "#E8B84B";
    cels.push(e("div",{key:"l"+a, className:"flex min-h-8 items-center justify-between gap-2 bg-card px-2", style:{boxShadow:"inset 3px 0 0 "+cor}},
      e("b",{className:"text-[13px] font-semibold leading-tight", title:NOME_CEL[a]}, NOME_CEL[a]),
      e("button",{type:"button", onClick:function(){ p.alterna(a); }, className:"h-6 shrink-0 rounded px-2 text-[12px] font-semibold", style:p.sel[a] ? {background:cor, color:"#14110A"} : {border:"1px solid var(--border)", color:"var(--muted-foreground)"}}, p.sel[a] ? "Ligado" : "Oculto")));
    fl.passos.forEach(function(x, k){
      var ac = x.a.indexOf(a)>=0, t = x.t[a], cur = k===p.passo, feito = k<p.passo, camadas = [];
      if(cur) camadas.push("linear-gradient(rgba(232,184,75,.07),rgba(232,184,75,.07))");
      if(ac) camadas.unshift("linear-gradient("+hexA(cor, feito ? .12 : .26)+","+hexA(cor, feito ? .12 : .26)+")");
      cels.push(e("button",{key:a+k, type:"button", onClick:function(){ p.vai(k); }, className:"min-h-8 bg-card px-2 py-1 text-left text-[13px] leading-snug "+(ac ? "font-semibold" : t ? "text-muted-foreground" : "text-muted-foreground opacity-30"),
        style:{backgroundImage:camadas.length ? camadas.join(",") : null, boxShadow:ac ? "inset 3px 0 0 "+cor : null, opacity:feito && !ac ? .6 : null}}, t || "—"));
    });
  });
  return e("div",{className:"overflow-x-auto"}, e("div",{className:"grid gap-px overflow-hidden rounded-lg border border-border bg-border", style:{gridTemplateColumns:"225px repeat("+n+",minmax(150px,1fr))"}}, cels));
}

function AbaApps(){
  var st = useState(null), selRaw = st[0], setSelRaw = st[1];
  var sel = selRaw || PRINCIPAIS;
  var zs = useState(100), tam = zs[0], setF = zs[1];             // tamanho em % (50 a 100, de 5 em 5; abre sempre em 100%): 50% = celular de ~216 px, 100% = ~370 px de largura
  var rf = useRef(null), ws = useState(0), larguraLinha = ws[0], setLargura = ws[1];
  useEffect(function(){
    var el = rf.current; if(!el) return;
    var mede = function(){ setLargura(el.clientWidth); };
    mede(); var ro = new ResizeObserver(mede); ro.observe(el);
    return function(){ ro.disconnect(); };
  }, []);
  var ab = useState(false), aberto = ab[0], setAberto = ab[1];     // bloco de cima (fluxos e apps) aberto ou fechado
  var fs = useState(-1), fi = fs[0], setFi = fs[1];            // fluxo escolhido (-1 = nenhum)
  var ps = useState(0), passo = ps[0], setPasso = ps[1];
  var ts = useState(false), toca = ts[0], setToca = ts[1];
  var fl = fi>=0 ? FLUXOS[fi] : null;
  useEffect(function(){
    if(!toca || !fl) return;
    var t = setTimeout(function(){ if(passo < fl.passos.length-1) setPasso(passo+1); else setToca(false); }, 1800);
    return function(){ clearTimeout(t); };
  }, [toca, passo, fl]);
  var muda = function(n){ setSelRaw(n); };
  var alterna = function(k){ var n = Object.assign({}, sel); if(n[k]) delete n[k]; else n[k] = true; muda(n); };
  var escolhe = function(i){ var n = {}; FLUXOS[i].pistas.forEach(function(k){ n[k] = true; }); muda(n); setFi(i); setPasso(0); setToca(false); };
  var limpa = function(){ muda(PRINCIPAIS); setFi(-1); setPasso(0); setToca(false); };
  var todos = function(){ muda(TODOS); setFi(-1); setPasso(0); setToca(false); };
  var age = {}; if(fl) fl.passos[passo].a.forEach(function(k){ age[k] = true; });
  var acPorK = {}; ACESSOS.forEach(function(a){ acPorK[a.k] = a; });
  var funcsLigadas = ACESSOS.filter(function(a){ return sel[a.k]; });
  var qtd = (sel.rev ? 1 : 0)+(sel.rep ? 1 : 0)+funcsLigadas.length+(sel.mot ? 1 : 0)+(sel.cli ? 1 : 0);
  // zoom automático: largura da linha dividida pelos celulares ligados (um celular a 0,85 de zoom ocupa uns 308 px), no máximo 1,2 e no mínimo 0,3
  var f = 0.2+tam/100;   // 50% = fator 0,70 (o menor tamanho que o Marcus aceita); 100% = fator 1,20
  var BORDA = {borderColor:"rgba(232,184,75,.55)"};
  var CLASSE_BLOCO = "rounded-xl border-2 bg-card p-2";
  var bloco = function(filhos){ return e("div",{ref:rf, className:"overflow-x-auto px-1"}, e("div",{className:"mx-auto flex w-max min-w-full flex-nowrap items-stretch justify-center gap-2"}, filhos)); };
  // Layout (Marcus, 29/10/2026): UM bloco em cima, com seta que abre e fecha; dentro ficam os FLUXOS e os APPS (por fluxo ou um a um). Os celulares ocupam a largura toda embaixo.
  var nomeFluxo = fl ? fl.nome : "Sem fluxo";
  var bloco_cima = e("div",{style:BORDA, className:"flex flex-col gap-1 rounded-xl border-2 bg-card px-2 py-1"},
    e("div",{className:"flex flex-wrap items-center gap-2"},
      e("button",{type:"button", onClick:function(){ setAberto(!aberto); }, "aria-expanded":aberto, className:"flex h-7 items-center gap-2 rounded-md px-2 text-[13px] hover:bg-muted"},
        e(Icon,{n:"chevrondown", s:13, className:"shrink-0 transition-transform "+(aberto ? "" : "-rotate-90")}),
        e("b",{className:"text-[15px] font-bold"}, "Apps e fluxos"),
        e("span",{className:"text-muted-foreground"}, "· "+nomeFluxo+" · "+qtd+" apps")),
      e("span",{className:"ml-auto flex items-center gap-1.5"}, e(Rotulo,null, "Tamanho"), e(Chip,{disabled:tam<=50, onClick:function(){ setF(Math.max(50, tam-5)); }}, "−"), e("input",{type:"range", min:50, max:100, step:5, value:tam, "aria-label":"Tamanho dos celulares", onChange:function(ev){ setF(Number(ev.target.value)); }, className:"h-1 w-28 cursor-pointer accent-[#E8B84B]"}), e(Chip,{disabled:tam>=100, onClick:function(){ setF(Math.min(100, tam+5)); }}, "+"), e("b",{className:"w-10 text-right text-[13px] tabular-nums"}, tam+"%"))),
    aberto && e("div",{className:"flex flex-col gap-1.5 border-t border-border pt-1.5"},
      e("div",{className:"flex flex-wrap items-center gap-1.5"}, e("span",{className:"w-12 shrink-0"}, e(Rotulo,null, "Fluxos")),
        e(Chip,{on:fi<0, onClick:limpa}, "Sem fluxo"),
        FLUXOS.map(function(x, i){ return e(Chip,{key:x.nome, on:fi===i, onClick:function(){ escolhe(i); }}, x.nome); })),
      e("div",{className:"flex flex-wrap items-center gap-1.5"}, e("span",{className:"w-12 shrink-0"}, e(Rotulo,null, "Apps")),
        CELULARES.map(function(c){ var cor = COR_CEL[c[0]] || "#E8B84B", on = !!sel[c[0]];
          return e("button",{key:c[0], type:"button", onClick:function(){ alterna(c[0]); }, "aria-pressed":on, className:"h-7 whitespace-nowrap rounded-md border px-3 text-[13px] "+(on ? "font-semibold" : "border-border bg-card text-foreground hover:border-primary"), style:on ? {background:cor, borderColor:cor, color:"#14110A"} : {boxShadow:"inset 3px 0 0 "+cor}}, c[1]); }),
        e(Chip,{onClick:limpa}, "Principais"), e(Chip,{onClick:todos}, "Todos"))),
    fl && e("div",{className:"flex flex-wrap items-center gap-1.5"},
      e(Chip,{disabled:passo===0, onClick:function(){ setToca(false); setPasso(passo-1); }}, "‹ Anterior"),
      e(Chip,{on:true, disabled:passo>=fl.passos.length-1, onClick:function(){ setToca(false); setPasso(passo+1); }}, "Próximo ›"),
      e(Chip,{onClick:function(){ if(toca){ setToca(false); } else { if(passo>=fl.passos.length-1) setPasso(0); setToca(true); } }}, toca ? "Parar" : "Reproduzir"),
      e(Chip,{onClick:function(){ setToca(false); setPasso(0); }}, "Reiniciar"),
      e("span",{className:"ml-1 text-[13px] text-muted-foreground"}, "Passo "+(passo+1)+" de "+fl.passos.length+" · "+fl.passos[passo].n)));
  return e("div",{className:"-mx-3 -mt-4 flex flex-col gap-2 md:-mx-5 md:-mt-6"},
    e("style",null, "@keyframes appsGlow{0%,100%{box-shadow:0 0 0 6px var(--gc),0 0 18px 6px var(--gc)}50%{box-shadow:0 0 0 12px var(--gc),0 0 56px 24px var(--gc)}}"),
    bloco_cima,
    qtd===0 && e("p",{style:BORDA, className:"rounded-xl border-2 bg-card p-4 text-center text-[13px] text-muted-foreground"}, "Nenhum app ligado. Abra a seta em cima e escolha um app ou um fluxo."),
    qtd>0 && bloco([e(ColsRepRev,{key:"rr", f:f, rev:!!sel.rev, rep:!!sel.rep, age:age})].concat(funcsLigadas.map(function(a){ return e(ColFunc,{key:a.k, ac:acPorK[a.k], f:f, age:age}); }),
      sel.mot ? [e(Coluna,{key:"mot", f:f, ordem:3, cor:COR_CEL.mot, age:!!age.mot, nome:"Motoboy", sub:"App para iOS ou Android", zoom:0.85, celular:e(AppMotoboy)})] : [],
      sel.cli ? [e(Coluna,{key:"cli", f:f, ordem:4, cor:COR_CEL.cli, age:!!age.cli, nome:"Cliente final", sub:"App para iOS ou Android", zoom:0.85, celular:e(AppCliente)})] : [])),
    fl && e("div",{style:BORDA, className:CLASSE_BLOCO}, e("div",{className:"mb-2 text-center"}, e(Rotulo,null, "Linha do tempo · "+fl.nome)), e(GradeTempo,{fl:fl, passo:passo, sel:sel, alterna:alterna, vai:function(k){ setToca(false); setPasso(k); }})));
}
export { AbaApps };

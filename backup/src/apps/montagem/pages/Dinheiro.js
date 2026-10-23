// Sorelly Admin · montagem — pages/Dinheiro.js
// Dinheiro: onde está cada valor em dinheiro, em tempo real (nas mãos das representantes, na bipagem, com o agendamento, entregue ao financeiro).
// No admin é uma TABELA no padrão do Consolidado; dentro do App interno (celular) são cartões claros. Cada troca de mãos tem confirmação dupla com código:
// quem entrega vê o código no app, quem recebe digita.
import { grupoDe, nomeDe } from "@/apps/montagem/domain/equipe";
import { codigoDinheiro, etapaDe, itensDinheiro } from "@/apps/montagem/domain/dinheiro";
import { BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

var ETAPAS = ["Com a representante / na bipagem", "Com o agendamento", "Entregue ao financeiro"];
var COR = ["#F59E0B", "#3B82F6", "#22C55E"];
var br = function(iso){ return iso ? iso.split("-").reverse().slice(0, 2).join("/") : "—"; };
var th = function(t){ return e("th",{key:t, className:"whitespace-nowrap border-b border-r border-border px-3 py-3 text-center text-[12.5px] font-semibold uppercase tracking-wide last:border-r-0"}, t); };
var td = function(v, c){ return e("td",{className:"whitespace-nowrap border-r border-border/60 px-3 py-2.5 text-center text-[13.5px] last:border-r-0 "+(c||"")}, v); };

// modo: "age" (agendamento) · "fin" (financeiro) · "bip" (bipagem: mostra os códigos do atendimento interno) · qualquer outro = visão geral (Direção)
function PainelDinheiro(p){
  var s = p.s, d = p.d, usuario = p.usuario, compacto = !!p.compacto, modo = p.modo || "tudo";
  var g = grupoDe(usuario), direcao = g==="supervisao" || g==="familia" || g==="supervisora";
  var podeReceber1 = modo==="age" || (modo==="tudo" && (direcao || g==="agendamento")), podeReceber2 = modo==="fin" || (modo==="tudo" && (direcao || g==="financeiro"));
  var ver1 = modo==="bip" || (modo==="tudo" && direcao), ver2 = modo==="age" || (modo==="tudo" && direcao);   // quem vê o código de quem entrega (a representante vê o dela no app dela)
  var itens = itensDinheiro(s), ft = useState("todos"), filtro = ft[0], setFiltro = ft[1], cd = useState({}), codigos = cd[0], setCodigos = cd[1], er = useState({}), erros = er[0], setErros = er[1];
  var soma = function(et, origem){ return itens.filter(function(i){ return etapaDe(i)===et && (!origem || i.origem===origem); }).reduce(function(t, i){ return t+i.valor; }, 0); };
  var confirmar = function(it, etapa){
    var cod = String(codigos[it.id+"|"+etapa]||"").trim();
    var etapaCod = (it.origem==="interno" && etapaDe(it)===0 && etapa===2) ? 1 : etapa;   // direto da bipadora ao financeiro: vale o código que a bipadora mostra
    if(cod!==codigoDinheiro(it.id, etapaCod)){ var o = {}; o[it.id+"|"+etapa] = true; setErros(Object.assign({}, erros, o)); return; }
    d({type:"DIN_ETAPA", id:it.id, etapa:etapa, por:usuario, valor:it.valor}); var l = Object.assign({}, codigos); delete l[it.id+"|"+etapa]; setCodigos(l);
  };
  var lista = itens.filter(function(i){ var et = etapaDe(i); return filtro==="todos" ? true : filtro==="rep" ? et===0 && i.origem==="rep" : filtro==="bip" ? et===0 && i.origem==="interno" : filtro==="age" ? et===1 : et===2; }).slice().reverse();
  // no celular de quem entrega/recebe, só o que é dele
  if(modo==="age") lista = lista.filter(function(i){ return etapaDe(i)<=1; });
  if(modo==="fin") lista = lista.filter(function(i){ return etapaDe(i)>=1 || i.origem==="interno"; });
  if(modo==="bip") lista = lista.filter(function(i){ return i.origem==="interno" && etapaDe(i)===0; });
  // o que cada linha pode fazer agora
  var estado = function(it){
    var et = etapaDe(it), meu1 = et===0 && podeReceber1, meu2 = (et===1 || (et===0 && it.origem==="interno")) && podeReceber2, acao = meu1 ? 1 : meu2 ? 2 : 0;
    var mostrar = (et===0 && ver1 && (it.origem==="interno" || modo==="bip" || direcao)) || (et===1 && ver2);
    return {et:et, acao:acao, chave:it.id+"|"+acao, mostrarCod:mostrar && (!acao || direcao), codEtapa:et===0 ? 1 : 2};
  };
  var campoCod = function(it, st, cls){ return e("input",{inputMode:"numeric", maxLength:4, value:codigos[st.chave]||"", placeholder:"Código", "aria-label":"Código de quem entregou", className:INPUT+" h-9! w-24 text-center! "+MONO+" "+(cls||""), style:erros[st.chave] ? {borderColor:"#DC2626"} : undefined,
    onChange:function(ev){ var o = {}; o[st.chave] = ev.target.value.replace(/\D/g, "").slice(0, 4); setCodigos(Object.assign({}, codigos, o)); if(erros[st.chave]){ var q = Object.assign({}, erros); delete q[st.chave]; setErros(q); } }}); };
  var rotBotao = function(st){ return st.acao===1 ? "Recebi o dinheiro" : st.et===0 ? "Recebi da bipadora" : "Recebi do agendamento"; };
  var quemTxt = function(it){ return it.origem==="rep" ? "Representante "+it.quem : "Atendimento interno · "+it.quem; };
  var historico = function(it){ return [it.e1 ? "Agendamento: "+nomeDe(it.e1.por) : null, it.e2 ? "Financeiro: "+nomeDe(it.e2.por) : null].filter(Boolean).join(" · "); };

  // ── celular (App interno): cartões claros ──
  var cartao = function(it){
    var st = estado(it);
    return e("div",{key:it.id, className:"flex flex-col gap-2 rounded-2xl bg-white p-3 text-[#111827] shadow-sm ring-1 ring-[#E5E7EB]"},
      e("div",{className:"flex items-start justify-between gap-2"}, e("div",{className:"min-w-0"}, e("b",{className:"block truncate text-[14px]"}, it.rev), e("span",{className:"block truncate text-[12px] text-[#6B7280]"}, quemTxt(it)+" · "+br(it.data))), e("b",{className:MONO+" shrink-0 text-[16px]"}, BK(it.valor))),
      e("div",{className:"flex items-center gap-1"}, [0,1,2].map(function(n){ var atual = st.et===n; return e("span",{key:n, className:"flex-1 rounded-full px-1.5 py-0.5 text-center text-[10.5px] font-bold", style:{background:atual ? COR[n]+"33" : n<st.et ? "#E7F6EC" : "#F3F4F6", color:atual ? COR[n] : n<st.et ? "#15803D" : "#9CA3AF"}}, (n<st.et ? "✓ " : "")+ETAPAS[n]); })),
      historico(it) && e("p",{className:"text-[11.5px] text-[#6B7280]"}, historico(it)),
      st.mostrarCod && e("p",{className:"rounded-lg bg-[#FEF5DC] px-2.5 py-1.5 text-[12.5px] font-semibold text-[#92400E]"}, "Código para quem recebe: ", e("b",{className:MONO+" text-[15px] tracking-widest"}, codigoDinheiro(it.id, st.codEtapa))),
      st.acao>0 && e("div",{className:"flex items-center gap-2"}, campoCod(it, st, "text-[#111827]!"), e("button",{type:"button", onClick:function(){ confirmar(it, st.acao); }, className:"h-9 rounded-lg bg-[#16A34A] px-3 text-[13px] font-bold text-white"}, rotBotao(st)), erros[st.chave] && e("span",{className:"text-[12px] font-semibold text-[#DC2626]"}, "Código incorreto")));
  };
  if(compacto) return e("div",{className:"flex flex-col gap-3"},
    e("p",{className:"px-1 text-[12px] leading-snug text-[#6B7280]"}, modo==="age" ? "Quem entrega mostra o código e você digita para dar o dinheiro como recebido. Depois você entrega ao financeiro mostrando o código de cada um."
      : modo==="fin" ? "Digite o código que a funcionária do agendamento mostrar para dar o dinheiro como recebido."
      : modo==="bip" ? "Mostre o código para a funcionária do agendamento digitar quando você entregar o dinheiro do atendimento." : "Onde está cada valor em dinheiro."),
    lista.length===0 ? e("p",{className:"rounded-2xl bg-white p-4 text-center text-[13px] text-[#6B7280] ring-1 ring-[#E5E7EB]"}, "Nenhum dinheiro por aqui agora.") : e("div",{className:"flex flex-col gap-2"}, lista.map(cartao)));

  // ── admin: tabela no padrão do Consolidado ──
  var tile = function(rot, v, c){ return e("div",{key:rot, className:"flex flex-col items-center rounded-xl bg-card px-3 py-2.5 text-center ring-1 ring-[#E8B84B]/30"},
    e("span",{className:"text-[10.5px] font-bold uppercase tracking-[.12em] text-muted-foreground"}, rot), e("b",{className:MONO+" text-[20px]", style:{color:c}}, BK(v))); };
  var chip = function(k, lb){ return e("button",{key:k, type:"button", onClick:function(){ setFiltro(k); }, className:"rounded-lg px-3 py-1.5 text-[12.5px] font-semibold ring-1 "+(filtro===k ? "bg-primary/15 ring-2 ring-primary" : "bg-card ring-border hover:bg-muted/40")}, lb); };
  var linhaTab = function(it){
    var st = estado(it);
    return e("tr",{key:it.id, className:"border-b border-border/60 hover:bg-muted/30"},
      td(br(it.data), MONO), td(it.origem==="rep" ? "Representante" : "Atendimento interno"), td(it.quem, "font-semibold"), td(it.rev, "text-left! font-semibold"), td(BK(it.valor), MONO+" font-bold text-primary"),
      td(e("span",{className:"inline-flex gap-1"}, [0,1,2].map(function(n){ var atual = st.et===n, feito = n<st.et;
        return e("span",{key:n, title:ETAPAS[n], className:"rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ring-1", style:{background:atual ? COR[n]+"33" : feito ? "#22C55E22" : "transparent", color:atual ? COR[n] : feito ? "#22C55E" : "#8E8E93", borderColor:atual ? COR[n] : "transparent"}}, (feito ? "✓ " : "")+["Rep./bipagem","Agendamento","Financeiro"][n]); }))),
      td(st.mostrarCod ? e("b",{className:MONO+" tracking-widest text-[#E8B84B]", title:"Código para quem recebe (só a Direção vê aqui)"}, codigoDinheiro(it.id, st.codEtapa)) : e("span",{className:"text-muted-foreground"}, "—")),
      td(st.acao>0 ? e("span",{className:"inline-flex items-center gap-2"}, campoCod(it, st), e("button",{type:"button", onClick:function(){ confirmar(it, st.acao); }, className:"h-9 rounded-lg bg-primary px-3 text-[12.5px] font-bold text-primary-foreground"}, rotBotao(st)), erros[st.chave] && e("span",{className:"text-[12px] font-semibold text-destructive"}, "Código incorreto"))
        : e("span",{className:"text-[12px] text-muted-foreground"}, historico(it) || "—")));
  };
  return e("div",{className:"flex flex-col gap-3"},
    e("div",{className:"grid grid-cols-2 gap-2 md:grid-cols-4"}, tile("Com representantes", soma(0, "rep"), COR[0]), tile("Na bipagem / atendimento", soma(0, "interno"), COR[0]), tile("Com o agendamento", soma(1), COR[1]), tile("Entregue ao financeiro", soma(2), COR[2])),
    modo==="tudo" && e("div",{className:"flex flex-wrap gap-1.5"}, chip("todos","Todos"), chip("rep","Com representantes"), chip("bip","Na bipagem"), chip("age","Com o agendamento"), chip("fin","Entregues")),
    e("div",{className:"overflow-x-auto rounded-xl border border-border bg-card"},
      e("table",{className:"w-full min-w-[1000px] border-collapse"},
        e("thead",null, e("tr",{className:"bg-sidebar"}, ["Data","Origem","Quem entregou","Revendedora","Valor","Onde está","Código","Confirmar"].map(th))),
        e("tbody",null, lista.length===0 ? e("tr",null, e("td",{colSpan:8, className:"px-3 py-6 text-center text-[13.5px] text-muted-foreground"}, "Nenhum dinheiro por aqui agora.")) : lista.map(linhaTab)))));
}

// Como o dinheiro anda, em blocos: cada seta é uma troca de mãos com confirmação dupla (quem entrega mostra o código, quem recebe digita)
function FluxoDinheiro(){
  var passo = function(n, t, sub, cor){ return e("div",{key:n, className:"flex min-w-0 flex-1 flex-col gap-1 rounded-xl border bg-card px-3 py-2.5", style:{borderColor:cor+"88", background:"linear-gradient(180deg,"+cor+"22,transparent)"}},
    e("span",{className:"grid size-6 place-items-center rounded-full text-[12px] font-extrabold text-black", style:{background:cor}}, n), e("b",{className:"text-[14px] leading-tight"}, t), e("span",{className:"text-[12px] leading-snug text-muted-foreground"}, sub)); };
  var seta = function(k){ return e("span",{key:k, className:"hidden shrink-0 self-center text-[22px] font-bold text-[#E8B84B] md:block"}, "→"); };
  var linha = function(titulo, cor, passos){ var out = []; passos.forEach(function(x, i){ if(i) out.push(seta("s"+i)); out.push(passo(i+1, x[0], x[1], cor)); });
    return e("section",{className:"flex flex-col gap-2 rounded-2xl p-3 ring-1", style:{boxShadow:"inset 0 0 0 1px "+cor+"55"}}, e("h3",{className:"font-heading text-[14px] font-bold", style:{color:cor}}, titulo), e("div",{className:"flex flex-col gap-2 md:flex-row"}, out)); };
  var regra = function(ic, t, sub){ return e("div",{key:t, className:"flex flex-col gap-0.5 rounded-xl bg-card px-3 py-2 ring-1 ring-[#E8B84B]/25"}, e("b",{className:"text-[13px] text-[#F3D98B]"}, ic+" "+t), e("span",{className:"text-[12px] leading-snug text-muted-foreground"}, sub)); };
  return e("div",{className:"flex flex-col gap-3"},
    linha("Representante (na rua)", "#F59E0B", [["Revendedora paga em dinheiro","Entrega o dinheiro à representante no acerto."],["Representante","Registra no app. Ao levar à empresa, mostra o código no app dela."],["Agendamento","Digita o código da representante e confirma o valor recebido."],["Financeiro","Digita o código que o agendamento mostra e dá como entregue."]]),
    linha("Atendimento interno (a revendedora vem à Sorelly)", "#3B82F6", [["Revendedora paga em dinheiro","Paga no atendimento, para a bipadora interna."],["Bipadora interna","Registra e fica com o dinheiro. O código aparece no app dela."],["Agendamento OU financeiro","Ou entrega ao agendamento, ou leva ela mesma ao financeiro: quem receber digita o código do app da bipadora."],["Financeiro","Confirma o recebimento. Fica registrado quem, quando e quanto."]]),
    e("div",{className:"grid grid-cols-1 gap-2 md:grid-cols-4"},
      regra("🔑","Um código por troca","Quem entrega vê o código no app dele (representante, bipadora interna ou agendamento)."),
      regra("⌨️","Quem recebe digita","Sem o código certo o dinheiro não muda de mãos."),
      regra("⚖️","Valor diferente","Se o valor contado for diferente, vira divergência e a diferença fica em aberto."),
      regra("📋","Tudo registrado","Fica gravado quem entregou, quem recebeu, a hora e o valor.")));
}

function AbaDinheiro(){
  var cx = use();
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Dinheiro", sub:"Onde está cada valor em dinheiro, em tempo real. Toda troca de mãos tem confirmação dupla: quem entrega mostra o código no app e quem recebe digita."}),
    e(FluxoDinheiro),
    e(PainelDinheiro,{s:cx.state, d:cx.dispatch, usuario:cx.state.usuario, modo:"tudo"}));
}
export { AbaDinheiro, PainelDinheiro };

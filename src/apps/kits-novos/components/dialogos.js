// Sorelly Admin · kits novos Curitiba — components/dialogos.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { EntBadge, Etiquetas, StBadge } from "@/apps/kits-novos/components/badges";
import { ETAPA, ETAPAS, aberto, diasNaEtapa, etapaDe } from "@/apps/kits-novos/domain/etapas";
import { dataBR, hojeISO } from "@/apps/kits-novos/lib/datas";
import { direcionarParaRepresentante, registrarRecusa } from "@/apps/kits-novos/lib/bridge-montagem";
import { DlgPerfilRep } from "@/apps/kits-novos/components/rep-editar";
import { GradeJanelas } from "@/apps/kits-novos/components/grade-janelas";
import { Sugestoes } from "@/apps/kits-novos/components/rep-indicar";
import { motivoSugestao, sugerir, todasReps } from "@/apps/kits-novos/domain/indicacao";
import { use } from "@/apps/kits-novos/state/context";
import { badge } from "@/apps/kits-novos/ui/badge";
import { Btn } from "@/apps/kits-novos/ui/button";
import { Icon } from "@/apps/kits-novos/ui/icon";
import { INPUT, MONO, MoneyInput } from "@/apps/kits-novos/ui/input";
import { Modal } from "@/apps/kits-novos/ui/modal";
import { e, useState } from "@/shared/react";

function Campo(p){ return e("label",{className:"flex flex-col gap-1.5 "+(p.className||"")}, e("span",{className:"text-sm font-medium"}, p.l), p.children); }
function linkWhats(tel){ var d = (tel||"").replace(/\D/g,""); if(!d) return null; return "https://wa.me/55"+d; }
// Campo compacto (rótulo pequeno) para a janela de detalhe.
function Cp(p){ return e("label",{className:"flex flex-col gap-1 "+(p.className||"")}, e("span",{className:"text-[12px] font-medium text-muted-foreground"}, p.l), p.children); }
var IN = INPUT+" h-9! text-sm!";
// Seção que abre e fecha ao clicar no título.
function Sec(p){
  var vm = useState(p.aberta!==false), on = vm[0];
  return e("section",{className:"rounded-xl bg-muted/30 ring-1 ring-foreground/10"},
    e("button",{type:"button", onClick:function(){ vm[1](!on); }, className:"flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"},
      e("span",{className:"flex items-center gap-2 text-sm font-semibold"}, p.ic && e(Icon,{n:p.ic, s:15, className:"text-primary"}), p.t, p.extra),
      e(Icon,{n:"chevrondown", s:15, className:"text-muted-foreground transition-transform "+(on?"rotate-180":"")})),
    on && e("div",{className:"flex flex-col gap-2.5 px-3 pb-3"}, p.children));
}
// Um contato de referência, em cartão estreito: nome, telefone, quem é, WhatsApp e confirmado (fica verde).
function LinhaContato(p){
  var f = p.f, up = p.up, n = p.n, pre = "c"+n, link = linkWhats(f[pre+"t"]), ok = !!f[pre];
  return e("div",{className:"flex flex-col gap-1.5 rounded-lg border p-2 "+(ok?"border-success/50 bg-success/5":"border-border/60")},
    e("div",{className:"flex items-center justify-between gap-2"},
      e("span",{className:"text-[12.5px] font-semibold"}, (n===1?"1º":n===2?"2º":"3º")+" contato"),
      e("span",{className:"flex items-center gap-2"},
        e("a",{href:link||undefined, target:"_blank", rel:"noreferrer", "aria-disabled":!link, title:link?"Chamar no WhatsApp":"Sem telefone",
            className:"inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[12px] font-semibold "+(link?"border-success/40 bg-success/10 text-success hover:bg-success/15":"pointer-events-none border-border text-muted-foreground/50"),
            onClick:function(ev){ if(!link) ev.preventDefault(); }}, e(Icon,{n:"send", s:12}),"WhatsApp"),
        e("label",{className:"flex items-center gap-1.5 text-[12.5px] font-medium"}, e("input",{type:"checkbox", checked:ok, onChange:function(){up(pre,!ok);}, className:"size-4 accent-primary"}), "Confirmado"))),
    e("div",{className:"grid grid-cols-2 gap-1.5"},
      e("input",{className:IN+" col-span-2", placeholder:"Nome", value:f[pre+"n"]||"", onChange:function(ev){up(pre+"n", ev.target.value);}}),
      e("input",{className:IN, placeholder:"(41) 9…", value:f[pre+"t"]||"", onChange:function(ev){up(pre+"t", ev.target.value);}}),
      e("input",{className:IN, placeholder:"Mãe, vizinha…", value:f[pre+"r"]||"", onChange:function(ev){up(pre+"r", ev.target.value);}})));
}
// Linha do tempo: etapa feita fica verde com a data (clique na data para corrigir); a etapa atual e a próxima ganham destaque.
function Linha2(p){
  var c = p.c, f = p.f, up = p.up, et = etapaDe(c), canc = c.st==="cancelado", ate = canc ? (ETAPA[c.stAnterior]||ETAPAS[0]).n : et.n;
  var ev = useState(""), edit = ev[0];
  return e("ol",{className:"flex flex-col"}, ETAPAS.map(function(x, i){
    var alcancou = x.n<=ate, feito = alcancou && (x.n<ate || (!canc && x.k==="devolvido")), atual = alcancou && !feito && !canc, parou = alcancou && !feito && canc,
      proxima = !canc && aberto(c) && x.n===et.n+1, ultimo = i===ETAPAS.length-1;
    var circ = feito ? "bg-success text-primary-foreground" : atual ? "bg-primary text-primary-foreground ring-4 ring-primary/25" : parou ? "bg-warning text-primary-foreground" : proxima ? "border-2 border-primary/60 text-primary" : "bg-muted text-muted-foreground";
    var caixa = atual ? "bg-primary/10 ring-1 ring-primary/40" : proxima ? "border border-dashed border-primary/50" : "";
    var dt = f[x.campo];
    return e("li",{key:x.k, className:"flex gap-3"},
      e("div",{className:"flex flex-col items-center"},
        e("span",{className:"grid size-7 shrink-0 place-items-center rounded-full "+circ}, e(Icon,{n:feito?"check":x.ic, s:14})),
        !ultimo && e("span",{className:"my-0.5 min-h-3 w-0.5 flex-1 "+(feito?"bg-success/60":"bg-border")})),
      e("div",{className:"mb-2 flex min-h-8 flex-1 flex-col justify-center gap-0.5 rounded-lg px-2 py-1 "+caixa},
        e("div",{className:"flex flex-wrap items-center justify-between gap-2"},
          e("b",{className:"text-sm "+(alcancou||proxima?"":"text-muted-foreground")}, x.nome),
          alcancou && dt && (edit===x.k
            ? e("input",{type:"date", autoFocus:true, className:IN+" w-auto "+MONO, value:dt, onChange:function(e2){ if(e2.target.value) up(x.campo, e2.target.value); }, onBlur:function(){ ev[1](""); }})
            : e("button",{type:"button", title:"Corrigir a data", onClick:function(){ ev[1](x.k); }, className:MONO+" inline-flex items-center gap-1 rounded-md px-1.5 text-[13px] hover:bg-muted/60"}, dataBR(dt), e(Icon,{n:"pencil", s:12, className:"text-muted-foreground"})))),
        atual && e("span",{className:"text-[12px] text-primary"}, "Etapa atual · "+diasNaEtapa(c)+(diasNaEtapa(c)===1?" dia":" dias")),
        parou && e("span",{className:"text-[12px] text-warning"}, "Parou nesta etapa"),
        x.k==="agendado" && alcancou && c.agDia && e("span",{className:"text-[12px]"}, "Marcada para "+dataBR(c.agDia).slice(0,5)+(c.agPer ? ", "+c.agPer.toLowerCase() : "")),
        proxima && e("span",{className:"text-[12px] text-primary"}, "Próxima etapa")));
  }).concat(canc ? [e("li",{key:"canc", className:"flex gap-3"},
      e("div",{className:"flex flex-col items-center"}, e("span",{className:"grid size-7 shrink-0 place-items-center rounded-full bg-destructive text-primary-foreground"}, e(Icon,{n:"ban", s:14}))),
      e("div",{className:"flex flex-1 flex-col justify-center gap-0.5 rounded-lg bg-destructive/10 px-2 py-1 ring-1 ring-destructive/40"},
        e("div",{className:"flex items-center justify-between gap-2"}, e("b",{className:"text-sm text-destructive"}, "Cancelada"), e("span",{className:MONO+" text-[13px]"}, dataBR(c.ret))),
        c.obs && e("span",{className:"text-[12px] text-muted-foreground"}, c.obs.split("|").pop().trim())))] : []));
}
function DlgDetalhe(p){
  var cx = use(), s = cx.state, d = cx.dispatch, c = p.c, listas = p.listas;
  var st = useState({rep:c.rep, mod:c.mod, val:c.val||0, retirada:c.retirada, disp:c.disp, obs:c.obs, obs2:c.obs2, tipo:c.tipo, ent:c.ent, bai:c.bai, cid:c.cid, prof:c.prof, trab:c.trab, trabEnd:c.trabEnd,
    cad:c.cad, lib:c.lib, sol:c.sol, ace:c.ace, con:c.con, age:c.age, bip:c.bip, rtd:c.rtd, agDia:c.agDia, agPer:c.agPer, jan:c.jan,
    c1:c.c1, c2:c.c2, c3:c.c3, c1n:c.c1n, c1t:c.c1t, c1r:c.c1r, c2n:c.c2n, c2t:c.c2t, c2r:c.c2r, c3n:c.c3n, c3t:c.c3t, c3r:c.c3r});
  var f = st[0], set = st[1], up = function(k,v){ var n = Object.assign({}, f); n[k]=v; set(n); };
  var et = etapaDe(c), prox = et && ETAPAS[et.n];
  var inp = function(k, extra){ return e("input",Object.assign({className:IN, value:f[k]||"", onChange:function(ev){up(k, ev.target.value);}}, extra||{})); };
  var area = function(k){ return e("textarea",{className:INPUT+" min-h-16 py-2 text-sm", rows:2, value:f[k]||"", onChange:function(ev){up(k, ev.target.value);}}); };
  var selecao = function(k, ops){ return e("select",{className:IN, value:f[k]||"", onChange:function(ev){up(k, ev.target.value);}},
    e("option",{value:""},"—"), (ops.indexOf(f[k])<0 && f[k] ? [f[k]] : []).concat(ops).map(function(o){ return e("option",{key:o, value:o}, o); })); };
  var abtn = "w-full justify-start!";
  return e(Modal,{open:true, largo:true, titulo:c.nome, sub:(c.bai?c.bai+", ":"")+c.cid+(c.prof?" · "+c.prof:"")+(c.op?" · cadastro por "+c.op:"")+(c.entId?" · campanha "+c.entId:""), confirmar:"Salvar alterações", icone:"save", onClose:p.fechar,
      onConfirmar:function(){ d({type:"SALVAR", id:c.id, campos:f}); }},
    e("div",{className:"flex flex-wrap items-center gap-1.5"}, e(StBadge,{c:c}), e(EntBadge,{c:c}), e(Etiquetas,{c:c}), aberto(c) && badge(diasNaEtapa(c)+" dias na etapa","muted","clock")),
    e("div",{className:"grid grid-cols-1 items-start gap-3 lg:grid-cols-3"},
      // Coluna da esquerda: quem é a revendedora e os contatos.
      e("div",{className:"flex flex-col gap-3"},
        e(Sec,{t:"Revendedora", ic:"user"},
          e("div",{className:"grid grid-cols-2 gap-2"},
            e(Cp,{l:"Representante", className:"col-span-2"}, selecao("rep", listas.reps)), e(Cp,{l:"Cidade"}, selecao("cid", listas.cids)), e(Cp,{l:"Bairro"}, inp("bai")),
            e(Cp,{l:"Tipo"}, selecao("tipo", ["Vendedora","Retornando"])), e(Cp,{l:"Entrada"}, selecao("ent", listas.ents)),
            e(Cp,{l:"Profissão", className:"col-span-2"}, inp("prof")),
            e(Cp,{l:"Trabalho (local)", className:"col-span-2"}, inp("trab")), e(Cp,{l:"Endereço do trabalho", className:"col-span-2"}, inp("trabEnd")))),
        e(Sec,{t:"Contatos de referência", ic:"phone", extra:e("span",{className:MONO+" rounded-md bg-muted px-1.5 text-[12px] "+(f.c1&&f.c2&&f.c3?"text-success":"text-muted-foreground")}, ((f.c1?1:0)+(f.c2?1:0)+(f.c3?1:0))+"/3")},
          e("p",{className:"text-[12px] text-muted-foreground"},"Vai junto pro app da representante, com botão direto pro WhatsApp."),
          [1,2,3].map(function(n){ return e(LinhaContato,{key:n, f:f, up:up, n:n}); }))),
      // Coluna do meio: linha do tempo das etapas e o kit.
      e("div",{className:"flex flex-col gap-3"},
        e(Sec,{t:"Etapas", ic:"clock"}, e(Linha2,{c:c, f:f, up:up})),
        e(Sec,{t:"Representantes indicadas", ic:"user", aberta:aberto(c) && !c.rep},
          e(GradeJanelas,{valor:f.jan||{}, onChange:function(v){ up("jan", v); }}),
          e(Sugestoes,{rev:{cid:f.cid, bai:f.bai, jan:f.jan||{}}, max:3, onEscolher:function(nome){ up("rep", nome); }})),
        e(Sec,{t:"Kit e retirada", ic:"box"},
          e("div",{className:"grid grid-cols-2 gap-2"},
            e(Cp,{l:"Modelo do kit"}, selecao("mod", ["Misto","Prata"])),
            e(Cp,{l:"Valor do kit"}, e(MoneyInput,{value:f.val, onChange:function(v){up("val", v);}, label:"Valor do kit", sm:true})),
            e(Cp,{l:"Retirada na empresa", className:"col-span-2"}, inp("retirada", {placeholder:"06/01 às 13:30"}))))),
      // Coluna da direita: ações, observações e histórico.
      e("div",{className:"flex flex-col gap-3"},
        e(Sec,{t:"Ações", ic:"arrowright"},
          (c.desm||0)>=s.cfg.maxDesmarcacoes && e("p",{className:"rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-[13px] text-destructive"},"Já desmarcou "+c.desm+" vezes com a representante. Pela regra, pode cancelar."),
          aberto(c) && prox && e(Btn,{v:"primary", ic:"arrowright", className:abtn, onClick:function(){d({type:"DIALOGO", d:{tipo:"avancar", id:c.id}});}},"Avançar para "+prox.nome.toLowerCase()),
          aberto(c) && et.n>1 && e(Btn,{ic:"undo", className:abtn, onClick:function(){d({type:"DIALOGO", d:{tipo:"voltar", id:c.id}});}},"Voltar etapa"),
          aberto(c) && e(Btn,{ic:"calendar", className:abtn, v:(c.desm||0)>=s.cfg.maxDesmarcacoes-1?"destructive":"secondary", onClick:function(){d({type:"DESMARCOU", id:c.id});}}, "Desmarcou ("+(c.desm||0)+"/"+s.cfg.maxDesmarcacoes+")"),
          c.rep && (c.st==="liberado"||c.st==="solicitado") && e(Btn,{v:"destructive", ic:"userx", className:abtn, onClick:function(){d({type:"DIALOGO", d:{tipo:"recusou", id:c.id}});}},"Recusou"),
          aberto(c) && e(Btn,{v:"destructive", ic:"ban", className:abtn, onClick:function(){d({type:"DIALOGO", d:{tipo:"cancelar", id:c.id}});}},"Cancelar revendedora"),
          c.st==="cancelado" && e(Btn,{v:"success", ic:"refresh", className:abtn, onClick:function(){d({type:"REATIVAR", id:c.id});}},"Reativar"),
          s.usuario==="nickolas" && e(Btn,{v:"destructive", ic:"trash", className:abtn, onClick:function(){d({type:"EXCLUIR", id:c.id});}},"Excluir")),
        e(Sec,{t:"Observações", ic:"message"},
          e(Cp,{l:"Disponibilidade"}, area("disp")), e(Cp,{l:"Observação"}, area("obs")), e(Cp,{l:"Indicação / origem"}, area("obs2"))),
        (c.hist||[]).length>0 && e(Sec,{t:"Histórico no sistema", ic:"history", aberta:false},
          e("ol",{className:"ml-1 flex flex-col gap-1 border-l-2 border-primary pl-3"}, c.hist.slice().reverse().map(function(h,i){ return e("li",{key:i, className:"text-[13px]"}, e("span",{className:MONO+" text-muted-foreground"}, new Date(h.em).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})), " ", e("b",null,h.quem), " ", h.txt); }))))));
}
// lista de representantes: as do quadro + todas do mapa (inclui a sugerida)
function opcoesRep(base, s, atual){ var o = {}, r = []; (base||[]).concat(todasReps(s).map(function(x){ return x.nome; }), atual ? [atual] : []).forEach(function(n){ if(n && !o[n]){ o[n] = 1; r.push(n); } }); return r; }
function DlgAvancar(p){
  var cx2 = use(), d = cx2.dispatch, c = p.c, et = etapaDe(c), prox = ETAPAS[et.n];
  // Solicitar o kit: o sistema já sugere a representante e diz o porquê; a Michele só dá o OK (ou escolhe outra)
  var sug = prox.k==="solicitado" ? sugerir(cx2.state, {cid:c.cid, bai:c.bai, jan:c.jan||{}}).lista.slice(0, 3) : [], revSug = {cid:c.cid, bai:c.bai};
  var st = useState({data:hojeISO(), retirada:c.retirada||"", rep:c.rep || (sug[0] ? sug[0].nome : ""), ok:false, agDia:c.agDia||"", agPer:c.agPer||"Manhã"}), f = st[0], set = st[1], up = function(k,v){ var n = Object.assign({}, f); n[k]=v; set(n); };
  var precisaRep = prox.k==="solicitado" && !f.rep, precisaOk = prox.k==="entregue" && !f.ok;
  return e(Modal,{open:true, titulo:"Avan\u00e7ar para "+prox.nome, sub:c.nome+", hoje em "+et.nome, confirmar:"Confirmar", icone:"arrowright", desabilitado:!f.data||precisaRep||precisaOk||(prox.k==="agendado" && !f.agDia),
      onClose:p.fechar, onConfirmar:function(){ var extra = {}; if(prox.k==="solicitado") extra.rep = f.rep; if(prox.k==="retirado") extra.retirada = f.retirada; if(prox.k==="agendado"){ extra.agDia = f.agDia; extra.agPer = f.agPer; }
        d({type:"AVANCAR", id:c.id, data:f.data, extra:extra});
        if(prox.k==="solicitado" && f.rep) direcionarParaRepresentante(c, f.rep); }},
    e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"},
      e(Campo,{l:"Data de "+prox.nome.toLowerCase()}, e("input",{type:"date", className:INPUT+" "+MONO, value:f.data, onChange:function(ev){up("data", ev.target.value);}})),
      prox.k==="solicitado" && e(Campo,{l:"Representante"}, e("select",{className:INPUT, value:f.rep, onChange:function(ev){up("rep", ev.target.value);}}, e("option",{value:""},"Escolha"), opcoesRep(p.listas.reps, cx2.state, f.rep).map(function(r){return e("option",{key:r, value:r}, r);}))),
      prox.k==="agendado" && e(Campo,{l:"Dia marcado com a revendedora"}, e("input",{type:"date", className:INPUT+" "+MONO, value:f.agDia, onChange:function(ev){up("agDia", ev.target.value);}})),
      prox.k==="agendado" && e(Campo,{l:"Per\u00edodo"}, e("select",{className:INPUT, value:f.agPer, onChange:function(ev){up("agPer", ev.target.value);}}, ["Manh\u00e3","Tarde","Noite"].map(function(m){ return e("option",{key:m, value:m}, m); }))),
      prox.k==="retirado" && e(Campo,{l:"Retirada na empresa (dia e hora)"}, e("input",{className:INPUT, value:f.retirada, placeholder:"24/09 \u00e0s 14:00", onChange:function(ev){up("retirada", ev.target.value);}}))),
    prox.k==="solicitado" && e("div",{className:"flex flex-col gap-1.5 rounded-lg border border-primary/40 bg-primary/5 p-2"},
      e("b",{className:"text-sm"}, sug.length ? "Sugestão do sistema (confira e confirme)" : "Nenhuma representante cobre esta região e este horário. Escolha uma na lista acima."),
      sug.map(function(x, i){ var ativa = f.rep===x.nome;
        return e("button",{key:x.nome, type:"button", onClick:function(){ up("rep", x.nome); }, className:"flex flex-col gap-0.5 rounded-md border px-2 py-1.5 text-left text-[13px] "+(ativa ? "border-primary bg-primary/15" : "border-border hover:bg-white/5")},
          e("span",{className:"flex items-center gap-2 font-semibold"}, (ativa ? "✓ " : "")+x.nome, i===0 && badge("Melhor opção","success","star")),
          e("span",{className:"text-[12px] text-foreground/80"}, "Porque "+motivoSugestao(x, revSug)+"."));
      })),
    prox.k==="liberado" && e("p",{className:"text-sm text-muted-foreground"},"Liberado = cadastro ok, pode solicitar o kit."),
    prox.k==="aceito" && e("p",{className:"text-sm text-muted-foreground"},"Aceito = a representante confirmou que atende esta revendedora."),
    prox.k==="contato" && e("p",{className:"text-sm text-muted-foreground"},"Em contato = a representante já falou com a revendedora."),
    prox.k==="agendado" && e("p",{className:"text-sm text-muted-foreground"},"Agendado = dia e período combinados com a revendedora."),
    prox.k==="retirado" && e("p",{className:"text-sm text-muted-foreground"},"Retirado = a representante pegou o kit na empresa."),
    prox.k==="montando" && e("p",{className:"text-sm text-muted-foreground"},"Montando = a montagem começou o kit na listagem da representante."),
    prox.k==="devolvido" && e("p",{className:"text-sm text-muted-foreground"},"Devolvido = a condicional assinada voltou para a Sorelly (prazo de 3 dias depois da entrega)."),
    prox.k==="solicitado" && e("p",{className:"text-sm text-muted-foreground"},"Direciona pra representante escolhida: entra em Kits \u2192 Kits novos (e no app dela) pra aceitar ou recusar, do jeito que j\u00e1 funciona hoje."),
    prox.k==="entregue" && e("label",{className:"flex items-center gap-2 text-sm font-medium"}, e("input",{type:"checkbox", checked:f.ok, onChange:function(){up("ok",!f.ok);}, className:"size-4 accent-primary"}), "Kit entregue \u00e0 revendedora"),
    precisaRep && e("p",{className:"text-sm text-warning"},"Para solicitar o kit \u00e9 preciso definir a representante."));
}
function DlgMotivo(p){
  var cx = use(), s = cx.state, d = cx.dispatch, c = p.c, canc = p.tipo==="cancelar";
  var mt = useState(canc && (c.desm||0)>=s.cfg.maxDesmarcacoes ? "Fica desmarcando com a representante" : ""), mot = mt[0], setMot = mt[1];
  return e(Modal,{open:true, titulo:canc?"Cancelar revendedora":"Voltar etapa", sub:c.nome, confirmar:canc?"Cancelar revendedora":"Voltar", icone:canc?"ban":"undo", perigo:true, desabilitado:!mot.trim(),
      onClose:p.fechar, onConfirmar:function(){ d({type:canc?"CANCELAR":"VOLTAR", id:c.id, motivo:mot.trim()}); }},
    canc ? e(Campo,{l:"Motivo"}, e("select",{className:INPUT, value:mot, onChange:function(ev){setMot(ev.target.value);}}, e("option",{value:""},"Escolha"), s.cfg.motivosCancel.map(function(m){return e("option",{key:m, value:m}, m);})))
         : e(Campo,{l:"Motivo"}, e("input",{className:INPUT, value:mot, autoFocus:true, onChange:function(ev){setMot(ev.target.value);}})));
}
// Recusa da representante (avisou por WhatsApp): registra, tira a representante deste kit e avisa se ela passou do limite.
var MOTIVOS_RECUSA = ["Sem horário disponível", "Revendedora fora da rota", "Longe da região dela", "Já está com muitos kits", "Prefere não atender esta revendedora"];
function DlgRecusa(p){
  var d = use().dispatch, c = p.c;
  var st = useState({mot:"", outro:""}), f = st[0], set = st[1], outro = f.mot==="Outro";
  var motivo = outro ? f.outro.trim() : f.mot;
  return e(Modal,{open:true, titulo:"Registrar recusa", sub:c.nome+" · representante "+c.rep, confirmar:"Registrar recusa", icone:"ban", perigo:true, desabilitado:!motivo,
      onClose:p.fechar, onConfirmar:function(){
        var r = registrarRecusa({rep:c.rep, rev:c.nome, id:c.id, motivo:motivo});
        d({type:"RECUSOU", id:c.id, motivo:motivo, registrada:!!r, bloqueou:!!(r&&r.bloqueou), total:r?r.total:0}); }},
    e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-3"},
      e(Campo,{l:"Representante"}, e("input",{className:INPUT, value:c.rep, readOnly:true})),
      e(Campo,{l:"Data"}, e("input",{className:INPUT+" "+MONO, value:dataBR(hojeISO()), readOnly:true})),
      e(Campo,{l:"Motivo"}, e("select",{className:INPUT, value:f.mot, onChange:function(ev){ set({mot:ev.target.value, outro:f.outro}); }},
        e("option",{value:""},"Escolha"), MOTIVOS_RECUSA.concat(["Outro"]).map(function(m){ return e("option",{key:m, value:m}, m); })))),
    outro && e(Campo,{l:"Descreva o motivo"}, e("input",{className:INPUT, autoFocus:true, value:f.outro, onChange:function(ev){ set({mot:f.mot, outro:ev.target.value}); }})),
    e("p",{className:"text-sm text-muted-foreground"},"A recusa entra na avaliação da representante e a revendedora volta a ficar sem representante, na mesma etapa. Ao atingir o limite de recusas, a representante deixa de receber kits novos."));
}
function DlgNova(p){
  var cx = use(), s = cx.state, d = cx.dispatch, listas = p.listas;
  var st = useState({nome:"", cid:"Curitiba", bai:"", prof:"", rep:"", mod:"Misto", val:s.cfg.valorPadrao, tipo:"Vendedora", ent:"", trab:"", trabEnd:"", disp:"", obs2:"", c1n:"", c1t:"", c1r:""}), f = st[0], set = st[1], up = function(k,v){ var n = Object.assign({}, f); n[k]=v; set(n); };
  var inp = function(k, ph){ return e("input",{className:INPUT, value:f[k], placeholder:ph||"", onChange:function(ev){up(k, ev.target.value);}}); };
  var sel = function(k, ops){ return e("select",{className:INPUT, value:f[k], onChange:function(ev){up(k, ev.target.value);}}, e("option",{value:""},"\u2014"), ops.map(function(o){return e("option",{key:o, value:o}, o);})); };
  return e(Modal,{open:true, titulo:"Nova revendedora", sub:"Entra como Cadastrada com a data de hoje", confirmar:"Cadastrar", icone:"plus", desabilitado:!f.nome.trim(), onClose:p.fechar, onConfirmar:function(){ d({type:"NOVA", dados:f}); }},
    e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"},
      e(Campo,{l:"Nome", className:"sm:col-span-2"}, e("input",{className:INPUT, value:f.nome, autoFocus:true, onChange:function(ev){up("nome", ev.target.value);}})),
      e(Campo,{l:"Cidade"}, sel("cid", listas.cids)), e(Campo,{l:"Bairro"}, inp("bai")),
      e(Campo,{l:"Representante (pode definir depois)"}, sel("rep", listas.reps)), e(Campo,{l:"Entrada"}, sel("ent", listas.ents)),
      e(Campo,{l:"Modelo do kit"}, sel("mod", ["Misto","Prata"])), e(Campo,{l:"Valor do kit"}, e(MoneyInput,{value:f.val, onChange:function(v){up("val", v);}, label:"Valor do kit"})),
      e(Campo,{l:"Tipo"}, sel("tipo", ["Vendedora","Retornando"])), e(Campo,{l:"Profiss\u00e3o"}, inp("prof")),
      e(Campo,{l:"Trabalho (nome do local)"}, inp("trab")), e(Campo,{l:"Endere\u00e7o do trabalho"}, inp("trabEnd")),
      e(Campo,{l:"Disponibilidade", className:"sm:col-span-2"}, inp("disp", "Kit novo - Disponibilidade 24/09 a 02/10 ou VEM NA EMPRESA")),
      e(Campo,{l:"Indica\u00e7\u00e3o / origem", className:"sm:col-span-2"}, inp("obs2"))),
    e("div",{className:"flex flex-col gap-2 rounded-lg bg-muted/40 p-3"},
      e("span",{className:"text-sm font-semibold"},"1\u00ba contato de refer\u00eancia"),
      e("div",{className:"grid grid-cols-1 gap-2 sm:grid-cols-3"},
        inp("c1n","Nome"), inp("c1t","Telefone"), inp("c1r","O que \u00e9 da pessoa")),
      e("p",{className:"text-[12px] text-muted-foreground"},"O 2\u00ba e 3\u00ba contato d\u00e3o pra completar depois, no detalhe da revendedora.")));
}
function Dialogos(p){
  var cx = use(), s = cx.state, d = cx.dispatch, dg = s.dialogo; if(!dg) return null;
  var fechar = function(){ d({type:"DIALOGO", d:null}); };
  if(dg.tipo==="nova") return e(DlgNova,{fechar:fechar, listas:p.listas});
  if(dg.tipo==="perfilrep") return e(DlgPerfilRep,{key:dg.nome, nome:dg.nome, fechar:fechar});
  var c = s.dados.find(function(x){return x.id===dg.id;}); if(!c) return null;
  var key = c.id+c.st+(c.hist||[]).length;
  if(dg.tipo==="detalhe") return e(DlgDetalhe,{key:key, c:c, fechar:fechar, listas:p.listas});
  if(dg.tipo==="avancar") return e(DlgAvancar,{key:key, c:c, fechar:fechar, listas:p.listas});
  if(dg.tipo==="recusou") return e(DlgRecusa,{key:key, c:c, fechar:fechar});
  return e(DlgMotivo,{key:key+dg.tipo, c:c, tipo:dg.tipo, fechar:fechar});
}

export { Campo, DlgDetalhe, DlgAvancar, DlgMotivo, DlgNova, Dialogos };

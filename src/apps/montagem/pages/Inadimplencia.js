// Sorelly Admin — pages/Inadimplencia.js
// Kits → Representantes → Inadimplência. Acerto em que a revendedora pagou menos do que devia: o que falta fica aqui, um bloco por representante.
// Nada é descontado: só a comissão sobre o valor em aberto fica retida até a revendedora pagar. O pagamento feito depois vira linha extra do acerto;
// o financeiro confirma a conta em Comissões e a comissão retida é liberada.
import { analisar, comisEfetiva, dataHora, fmtDataBR, prazoPendente, quemNome } from "@/apps/montagem/domain/comissoes";
import { AGENDAMENTO, BIPADORAS, FINANCEIRO, SUPERVISORA, podeAgendar, veTotais } from "@/apps/montagem/domain/equipe";
import { BKC as BK, isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { Icon } from "@/apps/montagem/ui/icon";
import { INPUT, MONO, MoneyInput } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var SEL = INPUT+" h-10! cursor-pointer text-sm!";
var th = function(t, r){ return e("th",{className:"whitespace-nowrap border-b border-border px-3 py-2.5 text-[12px] font-semibold uppercase tracking-wide "+(r ? "text-right" : "text-left")}, t); };
var td = function(v, o){ o = o||{}; return e("td",{className:"whitespace-nowrap px-3 py-2 text-sm "+(o.r ? "text-right "+MONO : "")+" "+(o.c||"")}, v); };
var dash = e("span",{className:"text-muted-foreground"},"—");
function Kpi(p){ return e("div",{className:"flex flex-col items-center gap-0.5 rounded-xl bg-linear-to-b from-[#3A2912]/40 to-card px-3 py-3 text-center ring-1 ring-[#E8B84B]/20"},
  e("span",{className:"text-[11.5px] font-bold uppercase tracking-wide"}, p.t), e("b",{className:MONO+" text-[22px] "+(p.cor||"")}, p.v)); }

// Situação de um acerto que já foi inadimplente
function situacao(r, a, hoje){
  var negs = r.negoc||[], ult = negs.slice().reverse().find(function(n){ return n.promessa; });
  var extras = (r.pagamentos||[]).filter(function(p){ return p.extra; });
  if(a.falta<=0.009){ var q = extras.length ? extras[extras.length-1].data : r.data; return {k:"quitada", txt:"Quitado em "+fmtDataBR(q), tom:"text-success"}; }
  if(ult && ult.promessa){ return ult.promessa < hoje ? {k:"vencida", txt:"Promessa vencida ("+fmtDataBR(ult.promessa)+")", tom:"text-destructive"} : {k:"prometida", txt:"Prometido para "+fmtDataBR(ult.promessa), tom:"text-info"}; }
  return {k:"aberta", txt:"Em aberto", tom:"text-warning"};
}

function Detalhe(p){
  var r = p.r, a = p.a, s = p.s, d = p.d, agenda = p.agenda;
  var nt = useState({txt:"", promessa:"", valor:0}), neg = nt[0], setNeg = nt[1];
  var pg = useState({forma:"pix", descricao:"", valor:0, quem:""}), pag = pg[0], setPag = pg[1];
  var formas = s.formasPagamento||[], forma = formas.find(function(f){ return f.k===pag.forma; }) || {descricoes:[]};
  var pessoas = BIPADORAS.concat([SUPERVISORA], AGENDAMENTO, FINANCEIRO);
  var aberto = a.falta > 0.009;
  var okNeg = agenda && (neg.txt.trim() || neg.promessa);
  var okPag = agenda && aberto && pag.valor>0 && pag.valor <= a.falta + 0.009 && forma.descricoes.length>0 && pag.descricao && (pag.forma!=="dinheiro" || pag.quem);
  return e("div",{className:"grid grid-cols-1 gap-4 bg-muted/20 p-4 lg:grid-cols-2"},
    e("div",{className:"flex flex-col gap-2"},
      e("h3",{className:"text-[13px] font-bold uppercase tracking-wide"},"Negociações"),
      (r.negoc||[]).length===0 && e("p",{className:"text-[13px] text-muted-foreground"},"Nenhuma negociação ainda."),
      (r.negoc||[]).slice().reverse().map(function(n,i){ return e("div",{key:i, className:"rounded-lg border border-border bg-card px-3 py-2 text-[13px]"},
        e("div",{className:"flex justify-between text-[12px] text-muted-foreground"}, e("span",null, quemNome(n.por)), e("span",null, dataHora(n.ts))),
        n.txt && e("p",null, n.txt), n.promessa && e("p",{className:"font-semibold text-info"},"Prometeu pagar "+(n.valor>0 ? BK(n.valor)+" " : "")+"em "+fmtDataBR(n.promessa))); }),
      e("div",{className:"flex flex-col gap-2 rounded-lg border border-border p-3"},
        e("span",{className:"text-[12.5px] font-semibold"},"Nova negociação"),
        e("textarea",{value:neg.txt, rows:2, placeholder:"O que ficou combinado com a revendedora", disabled:!agenda, className:INPUT+" h-auto! py-2 text-sm!", onChange:function(ev){ setNeg(Object.assign({}, neg, {txt:ev.target.value})); }}),
        e("div",{className:"flex flex-wrap items-center gap-2"},
          e("label",{className:"flex items-center gap-1.5 text-[12.5px]"},"Prometeu pagar em", e("input",{type:"date", value:neg.promessa, disabled:!agenda, className:INPUT+" h-9! text-sm! [color-scheme:dark]", onChange:function(ev){ setNeg(Object.assign({}, neg, {promessa:ev.target.value})); }})),
          e("label",{className:"flex items-center gap-1.5 text-[12.5px]"},"valor", e(MoneyInput,{value:neg.valor, sm:true, disabled:!agenda, label:"Valor prometido", className:"w-32", onChange:function(v){ setNeg(Object.assign({}, neg, {valor:v})); }})),
          e(Btn,{v:"secondary", sm:true, ic:"check", disabled:!okNeg, onClick:function(){ d({type:"INAD_NEGOCIAR", id:r.id, por:s.usuario, txt:neg.txt.trim(), promessa:neg.promessa, valor:neg.valor}); setNeg({txt:"", promessa:"", valor:0}); }}, "Registrar"))),
    ),
    e("div",{className:"flex flex-col gap-2"},
      e("h3",{className:"text-[13px] font-bold uppercase tracking-wide"},"Pagamentos do acerto"),
      e("div",{className:"overflow-hidden rounded-lg border border-border bg-card"},
        e("table",{className:"w-full border-collapse"}, e("tbody",null, (r.pagamentos||[]).map(function(x,i){ var f = r.fin && r.fin[i];
          return e("tr",{key:i, className:"border-b border-border/60 last:border-0"},
            td(fmtDataBR(x.data)+(x.extra ? " · depois" : "")), td((formas.find(function(y){ return y.k===x.forma; })||{label:x.forma}).label), td(BK(x.valor),{r:true}),
            td(f ? e("span",{className:"text-[12px] font-semibold text-success"},"OK financeiro") : e("span",{className:"text-[12px] text-warning"},"sem OK"))); })))),
      aberto && e("div",{className:"flex flex-col gap-2 rounded-lg border border-border p-3"},
        e("span",{className:"text-[12.5px] font-semibold"},"Registrar pagamento recebido (falta "+BK(a.falta)+")"),
        e("div",{className:"flex flex-wrap items-center gap-2"},
          e("select",{value:pag.forma, "aria-label":"Forma", disabled:!agenda, className:INPUT+" h-9! text-sm!", onChange:function(ev){ setPag(Object.assign({}, pag, {forma:ev.target.value, descricao:""})); }},
            formas.map(function(f){ return e("option",{key:f.k, value:f.k}, f.label); })),
          e("select",{value:pag.descricao, "aria-label":"Conta", disabled:!agenda, className:INPUT+" h-9! w-64 text-sm!", onChange:function(ev){ setPag(Object.assign({}, pag, {descricao:ev.target.value})); }},
            e("option",{value:""},"Conta…"), forma.descricoes.map(function(x){ return e("option",{key:x, value:x}, x); })),
          e(MoneyInput,{value:pag.valor, sm:true, disabled:!agenda, label:"Valor recebido", className:"w-32", onChange:function(v){ setPag(Object.assign({}, pag, {valor:v})); }}),
          pag.forma==="dinheiro" && e("select",{value:pag.quem, "aria-label":"Quem recebeu", disabled:!agenda, className:INPUT+" h-9! text-sm!", onChange:function(ev){ setPag(Object.assign({}, pag, {quem:ev.target.value})); }},
            e("option",{value:""},"Quem recebeu…"), pessoas.map(function(x){ return e("option",{key:x.id, value:x.nome}, x.nome); })),
          e(Btn,{v:"primary", sm:true, ic:"check", disabled:!okPag, onClick:function(){ d({type:"INAD_PAGAR", id:r.id, forma:pag.forma, descricao:pag.descricao, valor:pag.valor, quem:pag.quem}); setPag({forma:"pix", descricao:"", valor:0, quem:""}); }}, "Registrar pagamento")),
        pag.valor > a.falta + 0.009 && e("p",{className:"text-[12px] text-destructive"},"Maior do que falta pagar."))));
}

function AbaInadimplencia(){
  var cx = use(), s = cx.state, d = cx.dispatch, c = comisEfetiva(s), agenda = podeAgendar(s.usuario);
  var hoje = isoDia(new Date()), mesAtual = hoje.slice(0,7);
  var fs = useState("abertas"), sit = fs[0], setSit = fs[1];
  var fr = useState("todas"), repF = fr[0], setRepF = fr[1];
  var fb = useState(""), busca = fb[0], setBusca = fb[1];
  var op = useState(null), aberta = op[0], setAberta = op[1];
  var todos = (s.acertosConsignado||[]).filter(function(r){ return r.tipo==="acerto"; }).map(function(r){ var a = analisar(c, r);
    return {r:r, a:a, quem:r.origem==="interno" ? "Atendimento interno" : (r.rep||"—"), houve:a.falta>0.009 || (r.pagamentos||[]).some(function(p){ return p.extra; }) || (r.negoc||[]).length>0}; })
    .filter(function(x){ return x.houve; });
  // regras de 27/10/2026: prazo de 15 dias e multa de atraso (1% ao dia, teto 10%) sobre o que falta; a multa de 10% do pendente já está no acerto (r.multas)
  todos.forEach(function(x){ x.pz = x.a.falta>0.009 ? prazoPendente(x.r, hoje) : null; x.multaAt = x.pz ? r2(x.a.falta*x.pz.pct/100) : 0; x.saldo = r2(x.a.falta + x.multaAt); });
  // Etapas da pendência (Marcus, 26/10/2026): No prazo → Atrasado → Jurídico (60 dias) → Retirar kit (veio o próximo acerto e não pagou) → Executar nota (última negociação não cumprida).
  var todosAc = (s.acertosConsignado||[]).filter(function(r){ return r.tipo==="acerto"; });
  todos.forEach(function(x){ x.sit = situacao(x.r, x.a, hoje);
    if(!x.pz){ x.etapa = null; return; }
    var proximo = todosAc.some(function(o){ return o.rev===x.r.rev && o.id!==x.r.id && (o.data||"")>(x.r.data||""); }), jur = x.pz.dias>=((x.r.regrasNovas||{}).juridicoDias||60);
    x.etapa = x.sit.k==="vencida" && (jur || proximo) ? {t:"Executar nota", tom:"text-destructive"} : proximo ? {t:"Retirar kit", tom:"text-destructive"} : jur ? {t:"Jurídico", tom:"text-destructive"} : x.pz.atraso>0 ? {t:"Atrasado", tom:"text-warning"} : {t:"No prazo", tom:"text-warning"}; });
  // mesma revendedora com mais de uma pendência aberta: as duas ficam juntas
  var porRev = {}; todos.forEach(function(x){ if(x.a.falta>0.009 && x.pz){ (porRev[x.r.rev] = porRev[x.r.rev] || []).push(x); } });
  todos.forEach(function(x){ var l = porRev[x.r.rev]; x.juntas = l && l.length>1 ? {n:l.length, total:r2(l.reduce(function(t,y){ return t+y.saldo; }, 0))} : null; });
  todos.forEach(function(x){ x.comRet = x.a.falta>0.009 ? r2(Math.min(x.a.falta, x.r.valorAcerto||0)*x.a.pct/100) : 0; });
  var b = busca.trim().toLowerCase();
  var linhas = todos.filter(function(x){
    if(repF!=="todas" && x.quem!==repF) return false;
    if(sit==="abertas" && x.sit.k==="quitada") return false;
    if(sit==="prometidas" && x.sit.k!=="prometida") return false;
    if(sit==="quitadas" && x.sit.k!=="quitada") return false;
    if(b && (x.r.rev||"").toLowerCase().indexOf(b)<0) return false;
    return true; }).sort(function(p,q){ return q.saldo-p.saldo; });
  var quemLista = todos.map(function(x){ return x.quem; }).filter(function(v,i,arr){ return arr.indexOf(v)===i; }).sort();
  var abertas = todos.filter(function(x){ return x.sit.k!=="quitada"; });
  var totInad = abertas.reduce(function(t,x){ return t+x.saldo; }, 0);
  var prometido = abertas.filter(function(x){ return x.sit.k==="prometida"; }).reduce(function(t,x){ var u = (x.r.negoc||[]).slice().reverse().find(function(n){ return n.promessa; }); return t+Math.min(x.a.falta, (u && u.valor) || x.a.falta); }, 0);
  var retida = abertas.reduce(function(t,x){ return t+x.comRet; }, 0);
  var recuperado = todos.reduce(function(t,x){ return t+(x.r.pagamentos||[]).filter(function(p){ return p.extra && (p.data||"").slice(0,7)===mesAtual; }).reduce(function(u,p){ return u+(p.valor||0); }, 0); }, 0);
  var grupos = quemLista.map(function(n){ return {nome:n, itens:linhas.filter(function(x){ return x.quem===n; })}; }).filter(function(g){ return g.itens.length; });
  return e(React.Fragment,null,
    e(PageHead,{t:"Inadimplência", sub:"Valor que a revendedora ainda não pagou do acerto. Não desconta nada: só segura a comissão da representante até pagar."}),
    veTotais(s.usuario) && e("div",{className:"grid grid-cols-2 gap-3 md:grid-cols-5"},
      e(Kpi,{t:"Total inadimplente", v:BK(totInad), cor:totInad>0.009 ? "text-destructive" : ""}), e(Kpi,{t:"Revendedoras", v:abertas.length}),
      e(Kpi,{t:"Prometido", v:BK(prometido), cor:"text-info"}), e(Kpi,{t:"Comissão retida", v:BK(retida), cor:"text-warning"}), e(Kpi,{t:"Recuperado no mês", v:BK(recuperado), cor:"text-success"})),
    e("div",{className:"flex flex-wrap items-center gap-2"},
      e("div",{className:"relative"}, e(Icon,{n:"search", s:16, className:"pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"}),
        e("input",{className:INPUT+" h-10! w-64 pl-9 text-sm!", placeholder:"Buscar revendedora", value:busca, onChange:function(ev){ setBusca(ev.target.value); }})),
      e("select",{value:repF, "aria-label":"Representante", className:SEL, onChange:function(ev){ setRepF(ev.target.value); }},
        e("option",{value:"todas"},"Todas as representantes"), quemLista.map(function(q){ return e("option",{key:q, value:q}, q); })),
      e("select",{value:sit, "aria-label":"Situação", className:SEL, onChange:function(ev){ setSit(ev.target.value); }},
        e("option",{value:"abertas"},"Abertas"), e("option",{value:"prometidas"},"Prometidas"), e("option",{value:"quitadas"},"Quitadas"), e("option",{value:"todas"},"Todas")),
      !agenda && e("span",{className:"rounded-md bg-warning/10 px-2 py-1 text-[12px] font-semibold text-warning"},"Você só consulta: negociar é com o agendamento"),
      e("span",{className:"ml-auto text-[13px] text-muted-foreground"}, linhas.length+(linhas.length===1 ? " acerto" : " acertos"))),
    grupos.length===0 && e("p",{className:"rounded-xl border border-dashed border-border p-10 text-center text-[14px] text-muted-foreground"},"Nenhuma inadimplência nesta lista. Quando uma revendedora pagar menos do que o acerto, o saldo aparece aqui."),
    e("div",{className:"flex flex-col gap-3"}, grupos.map(function(g){ var tot = g.itens.reduce(function(t,x){ return t+x.saldo; }, 0);
      return e("div",{key:g.nome, className:"overflow-hidden rounded-xl ring-2 ring-[#8C6A3F]/70"},
        e("div",{className:"flex flex-wrap items-center gap-3 bg-linear-to-r from-[#3A2912] via-[#5C4322] to-[#86653A] px-4 py-3 text-[#F1E4C6] shadow-[inset_0_1px_0_rgba(255,255,255,.12)]"},
          e("span",{className:"font-heading text-base font-bold"}, g.nome),
          e("span",{className:"rounded-md bg-black/25 px-2 py-0.5 text-[13px] font-semibold"}, g.itens.length+(g.itens.length===1 ? " acerto" : " acertos")),
          e("b",{className:MONO+" ml-auto text-[15px] text-[#F3D98B]"}, "falta "+BK(tot))),
        e("div",{className:"overflow-x-auto bg-card/40"}, e("table",{className:"w-full border-collapse"},
          e("thead",null, e("tr",{className:"bg-sidebar"}, th("Revendedora"), th("Acerto em"), th("Valor do acerto",true), th("Pago",true), th("Saldo devedor",true), th("Prazo"), th("Comissão retida",true), th("Última negociação"), th("Situação"))),
          e("tbody",null, g.itens.map(function(x){ var r = x.r, ult = (r.negoc||[]).slice(-1)[0], on = aberta===r.id;
            return e(React.Fragment,{key:r.id},
              e("tr",{className:"cursor-pointer border-b border-border/60 hover:bg-muted/30", onClick:function(){ setAberta(on ? null : r.id); }},
                td(e("span",{className:"inline-flex items-center gap-1.5 font-semibold"}, e(Icon,{n:on ? "chevrondown" : "chevron", s:14}), r.rev, x.juntas && e("span",{className:"rounded bg-destructive/15 px-1.5 py-px text-[11px] font-bold text-destructive", title:"A mesma revendedora tem mais de uma pendência: ficam juntas"}, x.juntas.n+" pendências · "+BK(x.juntas.total)))), td(fmtDataBR(r.data)),
                td(BK(r.valorAcerto),{r:true}), td(BK(x.a.pago),{r:true}), td(x.saldo>0.009 ? e("span",{title:x.multaAt>0 ? "Falta "+BK(x.a.falta)+" (com a multa de 10% do pendente) + multa de atraso "+BK(x.multaAt) : ""}, BK(x.saldo)) : dash,{r:true, c:"font-semibold text-destructive"}),
                td(x.pz ? e("span",{className:"font-semibold "+(x.pz.atraso>0 ? "text-destructive" : "text-warning")}, x.pz.atraso>0 ? x.pz.atraso+" dias de atraso · +"+x.pz.pct+"%" : x.pz.dias+"/"+x.pz.prazo+" dias", e("span",{className:"ml-1.5 rounded bg-destructive/15 px-1.5 py-px text-[11.5px] font-bold "+x.etapa.tom}, x.etapa.t), e("span",{className:"ml-1.5 text-[11.5px] font-bold text-destructive"},"kit bloqueado")) : dash),
                td(x.comRet>0 ? BK(x.comRet) : dash,{r:true, c:"text-warning"}), td(ult ? fmtDataBR((ult.ts||"").slice(0,10))+" · "+(ult.txt||"promessa").slice(0,28) : dash),
                td(e("span",{className:"font-semibold "+x.sit.tom}, x.sit.txt))),
              on && e("tr",null, e("td",{colSpan:9, className:"p-0"}, e(Detalhe,{r:r, a:x.a, s:s, d:d, agenda:agenda}))));
          }))))); })));
}

export { AbaInadimplencia };

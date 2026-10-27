// Sorelly Admin — pages/ConfigComissoes.js
// Kits → Representantes → Configurador de comissões: tudo que mexe no cálculo e nas datas de pagamento das comissões das representantes.
//   · Representantes: % de comissão e grupo de pagamento (A: dias 1/11/21 · B: dias 6/16/26), com sorteio e balanceamento pelo volume
//   · Ciclos: dias de pagamento de cada grupo e o corte (hora e quantos dias antes)
//   · Kit novo: comissão fixa pela entrega com termo assinado
//   · Promissória: exigir ou não para liberar a comissão
// As contas onde o dinheiro entra continuam em Representantes → Configurações → Formas de pagamento.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { analisar, comisEfetiva, datasDoGrupo, fmtDataBR, proximasDatas, repsEfetivas } from "@/apps/montagem/domain/comissoes";
import { BK, isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MONO, MoneyInput, NumInput } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

var copia = function(x){ return JSON.parse(JSON.stringify(x)); };
var diasTxt = function(v){ return (v||[]).join(", "); };
var lerDias = function(t){ return String(t).split(/[^0-9]+/).map(Number).filter(function(n){ return n>=1 && n<=31; }).filter(function(n,i,a){ return a.indexOf(n)===i; }).sort(function(a,b){ return a-b; }); };

function AbaConfigComissoes(props){
  var embutido = !!(props && props.embutido);   // dentro de Comissões (botão Configurar): sem título de página
  var cx = use(), s = cx.state, d = cx.dispatch, atual = comisEfetiva(s);
  var base = function(){ return {reps:repsEfetivas(s).map(function(x){ return {nome:x.nome, pct:x.pct, grupo:x.grupo}; }), pctPadrao:atual.pctPadrao,
    A:diasTxt(atual.ciclos.A), B:diasTxt(atual.ciclos.B), corteHora:atual.corteHora, corteDias:atual.corteDias, kitNovo:atual.kitNovo, kitNovoExpo:atual.kitNovoExpo, reposicao:atual.reposicao, exigirProm:atual.exigirProm, kmPorLitro:atual.kmPorLitro, combSemEnvio:atual.combSemEnvio, gasolina:copia(atual.gasolina||{}), nf:copia(atual.nf)}; };
  var st = useState(base), f = st[0], setF = st[1];
  var nn = useState(""), novoNome = nn[0], setNovoNome = nn[1], nr = useState(""), novaRev = nr[0], setNovaRev = nr[1], nk = useState(""), novaKit = nk[0], setNovaKit = nk[1];
  var mudaNf = function(patch){ muda({nf:Object.assign({}, f.nf, patch)}); };
  var revsConhecidas = (function(){ var o = {}; (s.acertosConsignado||[]).forEach(function(r){ if(r.origem!=="interno" && r.rev) o[r.rev] = 1; }); return Object.keys(o).sort(); })();
  var addNf = function(){ var rv = novaRev.trim(), kn = (novaKit || (f.reps[0] && f.reps[0].nome) || "").trim(); if(!rv || !kn || (f.nf.revs||[]).some(function(x){ return x.rev.toLowerCase()===rv.toLowerCase(); })) return;
    mudaNf({revs:(f.nf.revs||[]).concat([{rev:rv, repKitNovo:kn, desde:isoDia(new Date())}])}); setNovaRev(""); };
  var alterou = JSON.stringify(f) !== JSON.stringify(base());
  var muda = function(patch){ setF(Object.assign({}, f, patch)); };
  var mudaRep = function(i, patch){ var r = f.reps.slice(); r[i] = Object.assign({}, r[i], patch); muda({reps:r}); };
  var addRep = function(){ var n = novoNome.trim(); if(!n || f.reps.some(function(x){ return x.nome.toLowerCase()===n.toLowerCase(); })) return; muda({reps:f.reps.concat([{nome:n, pct:f.pctPadrao, grupo:"A"}]).sort(function(a,b){ return a.nome.localeCompare(b.nome); })}); setNovoNome(""); };
  var sortear = function(){ var ord = f.reps.map(function(x,i){ return {i:i, k:Math.random()}; }).sort(function(a,b){ return a.k-b.k; }), r = f.reps.slice();
    ord.forEach(function(o,j){ r[o.i] = Object.assign({}, r[o.i], {grupo: j%2===0 ? "A" : "B"}); }); muda({reps:r}); };
  // divide para que os dois grupos tenham quase o mesmo valor de comissão a pagar (últimos 60 dias)
  var balancear = function(){
    var corte = isoDia(new Date(Date.now()-60*86400000)), vol = {};
    (s.acertosConsignado||[]).filter(function(r){ return r.tipo==="acerto" && r.origem!=="interno" && (r.data||"")>=corte; }).forEach(function(r){ vol[r.rep] = (vol[r.rep]||0)+analisar(Object.assign({}, atual, {reps:f.reps}), r).total; });
    var tot = {A:0, B:0}, r = f.reps.slice();
    f.reps.map(function(x,i){ return {i:i, v:vol[x.nome]||0}; }).sort(function(a,b){ return b.v-a.v; }).forEach(function(o){ var g = tot.A<=tot.B ? "A" : "B"; tot[g] += o.v; r[o.i] = Object.assign({}, r[o.i], {grupo:g}); });
    muda({reps:r}); };
  var salvar = function(){
    var A = lerDias(f.A), B = lerDias(f.B);
    if(!A.length || !B.length) return d({type:"AVISO", txt:"Cada grupo precisa de pelo menos um dia de pagamento"});
    d({type:"COMIS_CONFIG", aviso:"Configurador de comissões salvo", patch:{reps:f.reps.map(function(x){ return {nome:x.nome, pct:x.pct, grupo:x.grupo}; }), pctPadrao:f.pctPadrao, ciclos:{A:A, B:B},
      corteHora:f.corteHora, corteDias:f.corteDias, kitNovo:f.kitNovo, kitNovoExpo:f.kitNovoExpo, reposicao:f.reposicao, exigirProm:f.exigirProm, kmPorLitro:f.kmPorLitro, combSemEnvio:f.combSemEnvio, gasolina:f.gasolina, nf:f.nf, v2:true}});
  };
  var cfgPrev = Object.assign({}, atual, {ciclos:{A:lerDias(f.A), B:lerDias(f.B)}, corteHora:f.corteHora, corteDias:f.corteDias});
  var agora = Date.now(), nA = f.reps.filter(function(x){ return x.grupo==="A"; }).length, nB = f.reps.length-nA;
  // datas de pagamento próximas (as duas turmas): a Nayale preenche o preço da gasolina de cada dia pago
  var datasGas = datasDoGrupo(cfgPrev, "A", agora, 1, 1).map(function(x){ return {data:x, g:"A"}; }).concat(datasDoGrupo(cfgPrev, "B", agora, 1, 1).map(function(x){ return {data:x, g:"B"}; }))
    .filter(function(x){ var t = new Date(x.data+"T12:00:00").getTime(); return t>=agora-35*86400000 && t<=agora+45*86400000; }).sort(function(a,b){ return a.data.localeCompare(b.data); });
  var lb = function(t, filho){ return e("label",{className:"flex flex-col gap-1.5"}, e("span",{className:"text-[12.5px] font-semibold"}, t), filho); };
  return e(React.Fragment,null,
    e("div",{className:"flex flex-wrap items-end justify-between gap-3"},
      embutido ? e("span",null) : e(PageHead,{t:"Configurador de comissões", sub:"% de cada representante, grupos de pagamento, corte e comissão do kit novo. O que muda aqui muda no Consolidado e em Comissões."}),
      e("div",{className:"flex items-center gap-2"},
        alterou && e("span",{className:"text-[12.5px] font-semibold text-warning"},"Alterações não salvas"),
        e(Btn,{v:"ghost", disabled:!alterou, onClick:function(){ setF(base()); }}, "Descartar"),
        e(Btn,{v:"primary", ic:"save", disabled:!alterou, onClick:salvar}, "Salvar"))),
    e("div",{className:"grid grid-cols-1 gap-4 xl:grid-cols-3"},
      e("div",{className:"xl:col-span-2"},
        e(BlocoBarra,{t:"Representantes", sub:f.reps.length+" no total · grupo A: "+nA+" · grupo B: "+nB},
          e("div",{className:"flex flex-col gap-3 p-3"},
            e("div",{className:"flex flex-wrap items-center gap-2"},
              e(Btn,{v:"secondary", sm:true, onClick:sortear}, "Sortear A/B"),
              e(Btn,{v:"secondary", sm:true, onClick:balancear}, "Balancear pelo volume de comissão (60 dias)"),
              e("span",{className:"text-[12px] text-muted-foreground"},"Os dois botões só preenchem a tabela: vale depois de Salvar.")),
            e("div",{className:"max-h-[28rem] overflow-y-auto rounded-lg border border-border"},
              e("table",{className:"w-full border-collapse"},
                e("thead",{className:"sticky top-0"}, e("tr",{className:"bg-sidebar"}, ["Representante","Comissão %","Grupo",""].map(function(t,i){ return e("th",{key:i, className:"border-b border-border px-3 py-2 text-left text-[12px] font-semibold uppercase tracking-wide"}, t); }))),
                e("tbody",null, f.reps.length===0 && e("tr",null, e("td",{colSpan:4, className:"px-3 py-4 text-[13px] text-muted-foreground"},"Nenhuma representante ainda. Adicione abaixo.")),
                  f.reps.map(function(x,i){ return e("tr",{key:x.nome, className:"border-b border-border/60 last:border-0"},
                    e("td",{className:"px-3 py-1.5 text-sm font-semibold"}, x.nome),
                    e("td",{className:"px-3 py-1.5"}, e(NumInput,{value:x.pct, step:"0.5", label:"Comissão de "+x.nome, className:"h-9! w-24 text-sm!", onChange:function(v){ mudaRep(i,{pct:v}); }}), e("span",{className:"ml-1 text-sm"},"%")),
                    e("td",{className:"px-3 py-1.5"}, e("div",{className:"inline-flex overflow-hidden rounded-lg ring-1 ring-border"}, ["A","B"].map(function(g){ return e("button",{key:g, onClick:function(){ mudaRep(i,{grupo:g}); },
                      className:"h-9 w-12 text-sm font-bold "+(x.grupo===g ? "bg-primary text-primary-foreground" : "hover:bg-muted")}, g); }))),
                    e("td",{className:"px-3 py-1.5 text-right"}, e("button",{onClick:function(){ muda({reps:f.reps.filter(function(y){ return y.nome!==x.nome; })}); }, "aria-label":"Retirar "+x.nome,
                      className:"grid size-7 place-items-center rounded-full bg-muted text-sm font-bold text-muted-foreground hover:bg-destructive/20 hover:text-destructive"}, "×"))); })))),
            e("div",{className:"flex gap-2"},
              e("input",{value:novoNome, placeholder:"Nova representante", className:INPUT+" h-9! min-w-0 flex-1 text-sm!", onChange:function(ev){ setNovoNome(ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") addRep(); }}),
              e(Btn,{v:"ghost", sm:true, onClick:addRep}, "+ Adicionar"))))),
      e("div",{className:"flex flex-col gap-4"},
        e(BlocoBarra,{t:"Pagamento e corte"},
          e("div",{className:"flex flex-col gap-3 p-3"},
            lb("Dias de pagamento do grupo A", e("input",{value:f.A, className:INPUT+" h-9! text-sm! "+MONO, onChange:function(ev){ muda({A:ev.target.value}); }})),
            lb("Dias de pagamento do grupo B", e("input",{value:f.B, className:INPUT+" h-9! text-sm! "+MONO, onChange:function(ev){ muda({B:ev.target.value}); }})),
            e("div",{className:"flex flex-wrap items-end gap-3"},
              lb("Hora do corte", e(NumInput,{value:f.corteHora, label:"Hora do corte", className:"h-9! w-20 text-sm!", onChange:function(v){ muda({corteHora:Math.max(0, Math.min(23, Math.round(v)))}); }})),
              lb("Dias antes do pagamento", e(NumInput,{value:f.corteDias, label:"Dias antes", className:"h-9! w-20 text-sm!", onChange:function(v){ muda({corteDias:Math.max(0, Math.round(v))}); }}))),
            e("p",{className:"text-[12px] text-muted-foreground"},"Com 12h e 1 dia antes: o que for liberado até 12h do dia anterior entra no pagamento; depois disso, no próximo."))),
        e(BlocoBarra,{t:"Regras"},
          e("div",{className:"flex flex-col gap-3 p-3"},
            lb("Comissão padrão (% para quem não tem)", e(NumInput,{value:f.pctPadrao, step:"0.5", label:"Comissão padrão", className:"h-9! w-24 text-sm!", onChange:function(v){ muda({pctPadrao:v}); }})),
            lb("Kit novo com termo assinado", e(MoneyInput,{value:f.kitNovo, label:"Kit novo", sm:true, className:"w-36", onChange:function(v){ muda({kitNovo:v}); }})),
            lb("Kit novo + expositor", e(MoneyInput,{value:f.kitNovoExpo, label:"Kit novo com expositor", sm:true, className:"w-36", onChange:function(v){ muda({kitNovoExpo:v}); }})),
            lb("Reposição entregue (com condicional assinada)", e(MoneyInput,{value:f.reposicao, label:"Comissão da reposição", sm:true, className:"w-36", onChange:function(v){ muda({reposicao:v}); }})),
            e("p",{className:"-mt-1 text-[12px] text-warning"},"R$ 20 e R$ 35 são valores provisórios: confirmar."),
            e("label",{className:"flex cursor-pointer items-center gap-2 text-[13px]"}, e("input",{type:"checkbox", checked:f.exigirProm, className:"size-4", onChange:function(ev){ muda({exigirProm:ev.target.checked}); }}),
              "Exigir promissória assinada para liberar a comissão"))),
        e(BlocoBarra,{t:"Novo fluxo (teste de 60 dias)", sub:f.nf.ativo ? (f.nf.revs||[]).length+" revendedoras marcadas" : "desligado"},
          e("div",{className:"flex flex-col gap-3 p-3"},
            e("label",{className:"flex cursor-pointer items-center gap-2 text-[13px] font-semibold"}, e("input",{type:"checkbox", checked:!!f.nf.ativo, className:"size-4", onChange:function(ev){ mudaNf({ativo:ev.target.checked}); }}), "Ligar o teste do novo fluxo"),
            lb("Entrega do kit pela Rep. Kit Novo (condicional assinada)", e(MoneyInput,{value:f.nf.entrega, label:"Entrega do kit novo", sm:true, className:"w-36", onChange:function(v){ mudaNf({entrega:v}); }})),
            e("div",{className:"flex flex-wrap items-end gap-3"},
              lb("1º acerto · Rep. Kit Novo (%)", e(NumInput,{value:f.nf.pctKitNovo, step:"0.5", label:"Percentual da Rep. Kit Novo", className:"h-9! w-24 text-sm!", onChange:function(v){ mudaNf({pctKitNovo:v}); }})),
              lb("1º acerto · Rep. Acerto (%)", e(NumInput,{value:f.nf.pctAcerto1, step:"0.5", label:"Percentual da Rep. Acerto no 1º acerto", className:"h-9! w-24 text-sm!", onChange:function(v){ mudaNf({pctAcerto1:v}); }}))),
            e("p",{className:"text-[12px] text-muted-foreground"},"A gasolina segue o mesmo esquema das outras representantes. Do 2º acerto em diante a Rep. Acerto leva a % normal dela. Sem a revendedora na lista abaixo, nada muda."),
            e("div",{className:"flex flex-col gap-1.5"},
              (f.nf.revs||[]).length===0 && e("span",{className:"text-[12.5px] text-muted-foreground"},"Nenhuma revendedora marcada."),
              (f.nf.revs||[]).map(function(x, i){ return e("div",{key:x.rev, className:"flex items-center justify-between gap-2 rounded-lg border border-border px-2.5 py-1.5"},
                e("span",{className:"min-w-0 flex-1 truncate text-[13px]", title:x.rev+" · Rep. Kit Novo: "+x.repKitNovo}, e("b",null, x.rev), " · "+x.repKitNovo),
                e("button",{type:"button", "aria-label":"Retirar "+x.rev, onClick:function(){ mudaNf({revs:f.nf.revs.filter(function(_, k){ return k!==i; })}); }, className:"grid size-7 place-items-center rounded-full bg-muted text-sm font-bold text-muted-foreground hover:bg-destructive/20 hover:text-destructive"}, "×")); })),
            e("div",{className:"flex flex-col gap-2"},
              e("input",{value:novaRev, list:"nf-revs", placeholder:"Revendedora do teste", className:INPUT+" h-9! text-sm!", onChange:function(ev){ setNovaRev(ev.target.value); }}),
              e("datalist",{id:"nf-revs"}, revsConhecidas.map(function(n){ return e("option",{key:n, value:n}); })),
              e("div",{className:"flex gap-2"},
                e("select",{value:novaKit, "aria-label":"Representante Kit Novo", className:INPUT+" h-9! min-w-0 flex-1 text-sm!", onChange:function(ev){ setNovaKit(ev.target.value); }}, e("option",{value:""}, "Rep. Kit Novo"), f.reps.map(function(x){ return e("option",{key:x.nome, value:x.nome}, x.nome); })),
                e(Btn,{v:"ghost", sm:true, onClick:addNf}, "+ Marcar"))))),
        e(BlocoBarra,{t:"Combustível", sub:"Preencher no dia em que a comissão é paga"},
          e("div",{className:"flex flex-col gap-3 p-3"},
            lb("Combustível sem km no prazo (valor fixo)", e(MoneyInput,{value:f.combSemEnvio, sm:true, label:"Combustível sem km no prazo", className:"w-36", onChange:function(v){ muda({combSemEnvio:v}); }})),
            lb("Consumo (km por litro)", e(NumInput,{value:f.kmPorLitro, step:"0.5", label:"Km por litro", className:"h-9! w-24 text-sm!", onChange:function(v){ muda({kmPorLitro:v}); }})),
            e("p",{className:"text-[12px] text-muted-foreground"},"O preço do litro (média da ANP no Paraná) é atualizado por quem paga, na tela Comissões. O combustível sai de km × preço ÷ km por litro."))),
        e(BlocoBarra,{t:"Próximas remessas"},
          e("div",{className:"grid grid-cols-2 gap-3 p-3"}, ["A","B"].map(function(g){ return e("div",{key:g, className:"flex flex-col gap-1"},
            e("b",{className:"text-[12.5px]"},"Grupo "+g),
            proximasDatas(cfgPrev, g, agora, 4).map(function(x){ return e("span",{key:x, className:MONO+" text-[13px]"}, fmtDataBR(x)); })); }))))),
    e("p",{className:"text-[12.5px] text-muted-foreground"},"Contas em que o dinheiro entra (PIX, cartão, dinheiro): ficam em Representantes → Configurações → Formas de pagamento, e o financeiro escolhe a conta ao dar o OK em Comissões."));
}

export { AbaConfigComissoes };

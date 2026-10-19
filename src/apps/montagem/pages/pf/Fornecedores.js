// Sorelly Admin · montagem — pages/pf/Fornecedores.js
// Tela "Fornecedores" (v-config do HTML original): cadastro base com categoria, ciclo de acerto e a conta em aberto (sem NF) derivada dos pedidos.
// Contas em domain/pf.js (contaForn, cicloLabel...); aqui só desenha. Janela "Novo fornecedor / Editar" igual ao m-forn do HTML.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { FORN_CATS, PREST_CATS, VINCULOS, ehPrestador, cicloCor, cicloDe, cicloLabel, contaForn, cortesDoPreset, limpaCortes, mesAtual, previewCiclo } from "@/apps/montagem/domain/pf";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";
import { CARD, Chip, Modal, Sel, TD, brl, dbr, op, th, usePf } from "./ui";

var PERS = [["d10","A cada 10 dias","3 acertos no mês"], ["d15","A cada 15 dias","2 acertos no mês"], ["mensal","Mensal","1 acerto no mês"], ["custom","Livre","datas manuais"]];
var PRAZOS = [[0,"No próprio dia do corte"], [1,"1 dia após"], [2,"2 dias após"], [3,"3 dias após"], [5,"5 dias após"], [7,"7 dias após"], [10,"10 dias após"]];
var LBL = "text-[12px] font-semibold";
var BTN = "inline-flex items-center gap-1.5 rounded-lg bg-linear-to-br from-[#3B82F6] to-[#1D4ED8] px-4 py-2 text-[13px] font-bold text-white";

// janela de cadastro: f = fornecedor a editar (ou null = novo)
function ModalForn(p){
  var c = p.c, f = p.f, prest = !!p.prest, QUEM = prest ? "prestador" : "fornecedor", cats = prest ? PREST_CATS : FORN_CATS, ini = f ? cicloDe(f) : {periodicidade:"mensal", cortes:[31], prazoDias:0};
  var sNome = useState(f ? f.nome : ""), sCat = useState(f ? f.cat : cats[0]), sVin = useState(f && f.vinculo ? f.vinculo : "externo"), sPer = useState(ini.periodicidade), sCor = useState(ini.cortes.map(String)), sPrazo = useState(ini.prazoDias||0);
  var nome = sNome[0], cat = sCat[0], vinc = sVin[0], per = sPer[0], cortes = sCor[0], prazo = sPrazo[0];
  var setPer = function(pp){ sPer[1](pp); if(pp!=="custom") sCor[1](cortesDoPreset(pp, mesAtual()).map(String)); };   // ao escolher um ciclo pronto, preenche os cortes; "Livre" mantém os atuais
  var setCorte = function(i, v){ var n = cortes.slice(); n[i] = v; sCor[1](n); sPer[1]("custom"); };
  var limpos = limpaCortes(cortes), prev = limpos.length ? previewCiclo(limpos, prazo) : [];
  var salvar = function(){
    if(!nome.trim()){ window.alert("Informe o nome do "+QUEM+"."); return; }
    var ciclo = {periodicidade:per, cortes:limpos.length ? limpos : [31], prazoDias:parseInt(prazo)||0};
    if(f) op(c, "forn_set", {id:f.id, patch:prest ? {nome:nome, cat:cat, vinculo:vinc, ciclo:ciclo} : {nome:nome, cat:cat, ciclo:ciclo}});
    else op(c, "forn_add", prest ? {nome:nome, cat:cat, tipo:"prestador", vinculo:vinc, ciclo:ciclo} : {nome:nome, cat:cat, ciclo:ciclo});
    p.fechar();
  };
  var excluir = function(){
    if(c.pf.pedidos.some(function(x){ return x.fornId===f.id; })){ window.alert("Este cadastro tem pedidos lançados. Exclua os pedidos primeiro."); return; }
    if(!window.confirm("Excluir este cadastro e seus pagamentos?")) return;
    op(c, "forn_del", {id:f.id}); p.fechar();
  };
  return e(Modal,{t:(f ? "Editar " : "Novo ")+QUEM, sub:prest ? "Quem presta serviço e recebe por fora: vínculo, tipo de serviço e ciclo de pagamento." : "Nome, categoria, ciclo de acerto e a conta em aberto deste fornecedor.", fechar:p.fechar},
    e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"},
      e("label",{className:"flex flex-col gap-1 "+LBL}, (prest ? "Nome do prestador" : "Nome do fornecedor"), e("input",{value:nome, placeholder:"Ex.: Pontual", "aria-label":"Nome do fornecedor", className:INPUT+" h-10!", onChange:function(ev){ sNome[1](ev.target.value); }})),
      e("label",{className:"flex flex-col gap-1 "+LBL}, prest ? "Tipo de serviço" : "Categoria", e(Sel,{value:cat, label:"Categoria", className:"w-full", onChange:sCat[1]}, cats.map(function(x){ return e("option",{key:x, value:x}, x); }))),
      prest && e("label",{className:"flex flex-col gap-1 "+LBL}, "Vínculo com a Sorelly", e(Sel,{value:vinc, label:"Vínculo", className:"w-full", onChange:sVin[1]}, VINCULOS.map(function(x){ return e("option",{key:x[0], value:x[0]}, x[1]); })))),

    e("div",{className:"mt-1 flex items-center gap-2 border-t border-border pt-3 text-[11px] font-bold uppercase tracking-[.12em] text-primary"}, e(Ph,{n:"calendar-blank", s:15}), "Ciclo de acerto — como este fornecedor é pago"),
    e("span",{className:LBL}, "Periodicidade"),
    e("div",{className:"grid grid-cols-2 gap-2 sm:grid-cols-4"}, PERS.map(function(x){
      var on = per===x[0];
      return e("button",{key:x[0], type:"button", onClick:function(){ setPer(x[0]); }, className:"rounded-xl px-3 py-2 text-center text-[13px] font-bold ring-1 "+(on ? "bg-linear-to-br from-[#3B82F6]/50 to-[#1D4ED8]/40 text-white ring-[#3B82F6]" : "bg-muted/40 text-white ring-border hover:bg-white/10")},
        x[1], e("span",{className:"block text-[11.5px] font-medium opacity-80"}, x[2])); })),

    e("div",{className:"flex flex-col gap-2 rounded-xl bg-background/40 p-3 ring-1 ring-white/10"},
      e("span",{className:LBL}, "Dias de corte no mês — cada corte fecha uma janela e gera um PIX"),
      e("div",{className:"grid grid-cols-2 gap-2 sm:grid-cols-4"}, cortes.map(function(v, i){
        return e("div",{key:i, className:"flex items-center gap-1.5"},
          e("input",{type:"number", min:1, max:31, value:v, "aria-label":"Dia de corte "+(i+1), className:INPUT+" h-10! w-full "+MONO, onChange:function(ev){ setCorte(i, ev.target.value); }}),
          e("button",{type:"button", "aria-label":"Remover corte", title:"Remover corte", onClick:function(){ sCor[1](cortes.filter(function(_, j){ return j!==i; })); }, className:"grid size-9 shrink-0 place-items-center rounded-lg bg-muted/50 hover:bg-destructive/20 hover:text-destructive"}, e(Ph,{n:"x", s:14}))); })),
      e("button",{type:"button", onClick:function(){ sCor[1](cortes.concat(["31"])); sPer[1]("custom"); }, className:"inline-flex w-fit items-center gap-1 rounded-lg bg-muted/50 px-3 py-1.5 text-[12.5px] font-bold hover:bg-white/15"}, e(Ph,{n:"plus", s:13}), "Adicionar corte"),
      e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"},
        e("label",{className:"flex flex-col gap-1 "+LBL}, "Pagamento após o corte", e(Sel,{value:String(prazo), label:"Pagamento após o corte", className:"w-full", onChange:function(v){ sPrazo[1](parseInt(v)||0); }}, PRAZOS.map(function(x){ return e("option",{key:x[0], value:String(x[0])}, x[1]); }))),
        e("p",{className:"self-end pb-2 text-[12.5px] text-muted-foreground"}, "O dia 31 vira o último dia em meses menores.")),
      e("div",{className:"rounded-lg bg-muted/30 px-3 py-2 text-[13px]"},
        !limpos.length ? e("span",{className:"font-semibold text-[#F59E0B]"}, "Defina ao menos um dia de corte.") : [
          e("div",{key:"h", className:"mb-1 flex justify-between border-b-2 border-border pb-1.5"}, e("b",null, "Pré-visualização em "+mesAtual().split("-").reverse().join("/")), e("b",null, limpos.length+" acerto(s)")),
          prev.map(function(x){ return e("div",{key:x.ordem, className:"flex justify-between py-0.5"}, e("span",null, x.ordem+"ª janela — fecha "+dbr(x.fim)), e("b",{className:"text-[#22C55E]"}, "pagar "+dbr(x.limite))); })])),
    e("p",{className:"text-[12.5px] text-muted-foreground"}, "Valores, prazos e saldo em aberto deste fornecedor são calculados a partir dos pedidos e parcelas lançados na aba Negociações."),
    e("div",{className:"flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3"},
      f && e("button",{type:"button", onClick:excluir, className:"mr-auto inline-flex items-center gap-1.5 rounded-lg bg-destructive/20 px-4 py-2 text-[13px] font-bold text-destructive hover:bg-destructive/30"}, e(Ph,{n:"trash", s:14}), "Excluir cadastro"),
      e("button",{type:"button", onClick:p.fechar, className:"rounded-lg bg-muted/50 px-4 py-2 text-[13px] font-bold hover:bg-white/15"}, "Cancelar"),
      e("button",{type:"button", onClick:salvar, className:BTN}, prest ? "Salvar prestador" : "Salvar fornecedor")));
}

// lista de fornecedores OU de prestadores de serviço (separados): prest = true mostra só quem presta serviço e recebe por fora
function ListaCad(p){
  var c = usePf(), pf = c.pf, st = useState(null), modal = st[0], prest = !!p.prest;
  if(!pf) return null;
  var lista = pf.fornecedores.filter(function(f){ return ehPrestador(f)===prest; });
  var vinc = function(v){ var x = VINCULOS.filter(function(y){ return y[0]===v; })[0]; return x ? x[1] : "—"; };
  var linhas = lista.map(function(f){
    var ct = contaForn(pf, f.id);
    return e("tr",{key:f.id, className:"border-b border-border/60"},
      e("td",{className:TD}, e("b",null, f.nome)),
      prest ? e("td",{className:TD}, e(Chip,{cor:f.vinculo==="socio" ? "purple" : f.vinculo==="funcionario" ? "blue" : f.vinculo==="dentro" ? "cyan" : "gray"}, vinc(f.vinculo))) : null,
      e("td",{className:TD+" text-muted-foreground"}, f.cat),
      e("td",{className:TD}, e(Chip,{cor:cicloCor(f)}, cicloLabel(f))),
      e("td",{className:TD+" text-right "+MONO}, brl(ct.total)),
      e("td",{className:TD}, ct.dMin ? dbr(ct.dMin) : "—"),
      e("td",{className:TD}, c.edita && e("button",{type:"button", onClick:function(){ st[1]({f:f}); }, className:"inline-flex items-center gap-1 rounded-lg bg-muted/50 px-3 py-1 text-[12.5px] font-bold hover:bg-white/15"}, e(Ph,{n:"pencil-simple", s:13}), "Editar")));
  });
  var nCol = prest ? 7 : 6;
  if(!linhas.length) linhas = [e("tr",{key:"vz"}, e("td",{colSpan:nCol, className:TD+" py-6 text-center text-muted-foreground"}, prest ? "Nenhum prestador cadastrado." : "Nenhum fornecedor cadastrado."))];
  var tt = prest ? "Prestadores de serviço" : "Fornecedores";
  return e("div",{className:"flex flex-col gap-4"},
    e("div",{className:CARD+" flex flex-wrap items-center gap-3"},
      e("div",null, e("h1",{className:"font-heading text-[20px] font-extrabold"}, tt), e("p",{className:"text-[12.5px] text-muted-foreground"}, prest ? "Quem presta serviço e recebe por fora (funcionários, sócios e externos) — separado dos fornecedores" : "Cadastro base — categoria, ciclo de acerto e conta em aberto")),
      e("div",{className:"flex-1"}),
      c.edita && e("button",{type:"button", onClick:function(){ st[1]({f:null}); }, className:BTN}, e(Ph,{n:"plus", s:15}), prest ? "Novo prestador" : "Novo fornecedor")),
    e(BlocoBarra,{cor:"azul", t:tt, dir:lista.length},
      e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"},
        e("thead",null, e("tr",null, th(prest ? "Prestador" : "Fornecedor"), prest ? th("Vínculo") : null, th(prest ? "Serviço" : "Categoria"), th(prest ? "Ciclo de pagamento" : "Ciclo de acerto"), th(prest ? "A pagar" : "A pagar (sem NF)", "text-right!"), th("Próxima data"), th(""))),
        e("tbody",null, linhas)))),
    modal && e(ModalForn,{key:modal.f ? modal.f.id : "novo", c:c, f:modal.f, prest:prest, fechar:function(){ st[1](null); }}));
}
function AbaPfForn(){ return e(ListaCad,{prest:false}); }
function AbaPfPrest(){ return e(ListaCad,{prest:true}); }
export { AbaPfForn, AbaPfPrest };

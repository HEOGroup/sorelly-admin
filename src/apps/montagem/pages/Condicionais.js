// Sorelly Admin · montagem e bipagem — pages/Condicionais.js
//
// Antes de uma revendedora entrar na fila de montagem, a funcionária de condicionais confere se a condicional de cada peça está no armário;
// o que não tiver, ela marca "Falta" e sai o pedido de impressão para a Deysiane. Só depois de tudo conferido é que dá para liberar.
//
// Os números vêm da DevMaster (lib/condicionais-kits.js, ação KIT_COND_NUMS): entram só as condicionais ANTIGAS, as que voltam no acerto.
// A condicional NOVA do kit que a revendedora vai receber fica fora (cond.novaDm). Saída de revendedora traz todas, inclusive expositor.
//
// Refeita em 16/11/2026 no padrão do Financeiro, copiando o Contas a pagar (Marcus: "cores azuis, do topo, tamanho das fontes", "uma linha para cada
// revendedora", "sem valor do kit", "sem fundo escuro, analise o Direcionar e o Contas a pagar"):
//   - tela = bloco com barra azul (BlocoPainel) e UMA tabela (TabelaPlanilha), UMA LINHA POR REVENDEDORA, agrupada por listagem, filtro e ordem no cabeçalho;
//   - "Achei todas" e "Liberar" na própria linha; clicar na linha abre a FICHA da revendedora (janela como a da conta a pagar, components/pagamento-conta.js):
//     barra azul, faixa de células, tabela com cada número (Achei, Falta, Desfazer), número à mão e navegação Revendedora anterior / Próxima.
// Reaproveita os números de condicional (`k.cond`) da montadora e da bipadora, com um check próprio (chkP).
import { condEstado, condVisiveisPre, condOkPre } from "@/apps/montagem/domain/condicionais";
import { TIPO_KIT } from "@/apps/montagem/domain/status";
import { use } from "@/apps/montagem/state/context";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { Pagina } from "@/apps/montagem/components/padrao";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { MONO } from "@/apps/montagem/ui/input";
import { createPortal } from "react-dom";
import { e, useEffect, useRef, useState } from "@/shared/react";

var dia = function(iso){ return iso ? String(iso).slice(8, 10)+"/"+String(iso).slice(5, 7)+"/"+String(iso).slice(0, 4) : "—"; };
var diaCurto = function(iso){ return iso ? String(iso).slice(8, 10)+"/"+String(iso).slice(5, 7) : ""; };
var SEMANA = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
var tituloAba = function(iso){   // dia padronizado, sem Hoje/Amanhã: "16/11/2026 · Segunda-feira" (Marcus, 16/11/2026)
  if(!iso || iso==="sem-data") return "Sem data";
  return dia(iso)+" · "+SEMANA[new Date(iso+"T12:00:00Z").getUTCDay()];
};
var parar = function(ev){ ev.stopPropagation(); };   // botão dentro da linha não abre a ficha
// Botões e campo SEM fundo cinza (Marcus, 16/11/2026: "não quero fundo cinza em nada"): contorno branco fino sobre o fundo da própria janela, como o Desfazer do Contas a pagar;
// o principal leva o azul do bloco. Na tabela (CelaBotoes) continuam BOTÕES com contorno, centralizados na célula (Marcus: "Achei e Falta têm que ficar como botão").
var BT = "inline-flex h-8 min-w-24 items-center justify-center whitespace-nowrap rounded-md border px-3.5 text-[13px] font-semibold text-white hover:bg-white/10 disabled:opacity-40 ";
function Botao(p){
  return e("button",{type:"button", onClick:p.onClick, disabled:p.desabilitado, title:p.title, "aria-label":p.rotulo, className:(p.estreito ? BT.replace("min-w-24", "w-8 min-w-0").replace("px-3.5", "px-0") : BT)+(p.principal ? "border-white bg-[var(--bloco-titulo)] hover:brightness-125" : "border-border bg-transparent")}, p.children);
}
var CAMPO = "h-8 min-w-0 rounded-md border border-border bg-transparent px-2.5 text-[13px] text-foreground outline-none placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-[var(--bloco-titulo)]";
function CelaBotoes(p){
  return e("div",{className:"flex h-8 items-center justify-center gap-1.5", onClick:parar},
    p.itens.filter(Boolean).map(function(b, i){
      return e("button",{key:i, type:"button", disabled:b.desabilitado, title:b.title, onClick:b.onClick, className:"inline-flex h-7 min-w-20 items-center justify-center whitespace-nowrap rounded-md border px-3 text-[13px] font-semibold text-white hover:bg-white/10 disabled:opacity-40 "+(b.principal ? "border-white bg-[var(--bloco-titulo)] hover:brightness-125" : "border-white/60 bg-transparent")}, b.t); }));   // padrao-ok: botão de 28 px dentro da linha de 32 px; o Marcus aprovou esse tamanho em 16/11/2026 ("28px ok")
}
var COR_ST = {"Conferida":"text-success", "Liberada":"text-success", "Impressa":"text-primary", "Falta":"text-destructive", "A conferir":"text-warning"};

// campo para digitar o número que a DevMaster não trouxe (já entra conferido: ela só digita o que já está com ela em mãos)
function AddNum(p){
  var vs = useState(""), v = vs[0], setV = vs[1];
  var add = function(){ if(!v.trim()) return; p.d({type:"COND_ADD_NUM", id:p.id, num:v.trim()}); setV(""); };
  return e("div",{className:"flex items-center gap-2"},
    e("input",{value:v, onChange:function(ev){ setV(ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") add(); }, placeholder:"Número", "aria-label":"Número da condicional à mão", className:CAMPO+" w-40"}),
    e(Botao,{desabilitado:!v.trim(), onClick:add}, "Adicionar"));
}

// FICHA da revendedora: abre ao clicar na linha. Mesmo desenho da ficha da conta a pagar: overlay escuro, janela com barra azul, faixa de células, tabela e rodapé.
function Ficha(p){
  var k = p.k, l = p.l, d = p.d, nums = condVisiveisPre(k), lib = k.status!=="precond", ok = condOkPre(k);
  var idx = p.lista.findIndex(function(x){ return x.kit.id===k.id; }), ant = idx>0 ? p.lista[idx-1] : null, prox = idx>=0 && idx<p.lista.length-1 ? p.lista[idx+1] : null;
  var feitas = nums.filter(function(n){ return condEstado(k, n).p; }).length, faltas = nums.filter(function(n){ return condEstado(k, n).falta; }).length;
  var sit = lib ? "Liberada" : faltas ? faltas+" falta"+(faltas>1 ? "m" : "") : ok ? "Conferida" : "A conferir";
  var cel = function(rot, valor){ return e("div",{key:rot, className:"min-w-0 border-b border-r border-border px-3 py-1 text-center"}, e("p",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, rot), e("p",{className:"text-[13px] font-semibold"}, valor)); };
  var celulas = e("div",{className:"grid grid-cols-2 border-b border-border md:grid-cols-4 [&>div:nth-child(4n)]:md:border-r-0 [&>div:nth-last-child(-n+4)]:md:border-b-0"},
    cel("Revendedora", k.rev), cel("Representante", l ? l.rep : "—"), cel("Listagem", l ? diaCurto(l.data)+" · "+l.horario : "—"), cel("Tipo", (TIPO_KIT[k.tipoKit] || TIPO_KIT.acerto_kit)[1]));
  var linhas = nums.map(function(n){
    var st = condEstado(k, n), s0 = st.p ? "Conferida" : st.imp ? "Impressa" : st.falta ? "Falta" : "A conferir";
    return {id:n, n:n, prev:(k.cond.prev||{})[n] || "—", sit:s0, st:st};
  });
  var cols = [
    {k:"n", t:"Condicional", render:function(v){ return e("span",{className:MONO+" font-bold tabular-nums"}, v); }},
    {k:"prev", t:"Devolução", fmt:function(v){ return v==="—" ? v : dia(v); }},
    {k:"sit", t:"Situação", cor:function(r){ return (COR_ST[r.sit] || "")+" font-semibold"; }},
    {k:"acao", t:"Conferir", render:function(v, r){
      if(lib) return "";
      return e(CelaBotoes,{itens:[
        {t:r.st.p ? "Desfazer" : "Achei", onClick:function(){ d({type:"COND_CHK_PRE", id:k.id, num:r.n, v:!r.st.p}); }},
        !r.st.p && {t:r.st.falta ? "Pedida" : "Falta", desabilitado:r.st.falta, onClick:function(){ d({type:"COND_FALTA", id:k.id, num:r.n, por:p.usuario}); }}]}); }}];
  var achar = function(){ nums.forEach(function(n){ var st = condEstado(k, n); if(!st.p && !st.falta) d({type:"COND_CHK_PRE", id:k.id, num:n, v:true}); }); };
  var liberar = function(){ d({type:"LIBERAR_COND", ids:[k.id], por:p.usuario}); var seg = p.lista.slice(idx+1).filter(function(x){ return !x.lib; })[0]; if(seg) p.ir(seg.kit.id); else p.fechar(); };
  var nova = (k.cond.novaDm || []);
  return e("div",{className:"fixed inset-0 z-[80] flex justify-center overflow-y-auto bg-black/70 p-3 md:p-6", onClick:function(ev){ if(ev.target===ev.currentTarget) p.fechar(); }},
    e("div",{className:PADRAO_BLOCOS+" m-auto w-full max-w-2xl rounded-lg bg-[#14171c] text-[13px] [&>section]:!bg-[#14171c]"},
      e(BlocoPainel,{titulo:k.rev+" · "+(l ? l.rep+" · "+diaCurto(l.data)+" · "+l.horario : ""), dir:e("span",{className:COR_ST[lib ? "Liberada" : faltas ? "Falta" : ok ? "Conferida" : "A conferir"]}, sit+" · "+feitas+" de "+nums.length)},
        celulas,
        e("p",{className:"border-b border-border px-3 py-1 text-center text-[11px] font-semibold uppercase tracking-[.05em]"}, "Condicionais que voltam no acerto"),
        nums.length ? e(TabelaPlanilha,{semContagem:true, semFiltro:true, grade:true, chave:"id", cols:cols, linhas:linhas}) : e("p",{className:"px-3 py-3 text-center text-[13px]"}, "Nenhuma condicional aberta para conferir."),
        nova.length>0 && e("p",{className:"border-t border-border px-3 py-1 text-center text-[13px]"}, "Condicional nova deste kit (fica fora da conferência): ", e("b",{className:MONO+" font-semibold"}, nova.join("   "))),
        !lib && e("div",{className:"flex flex-wrap items-center justify-center gap-2 border-t border-border px-3 py-1.5"}, e("span",null, "Número que não veio da DevMaster:"), e(AddNum,{id:k.id, d:d})),
        e("div",{className:"flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-1.5"},
          e("div",{className:"flex gap-2"}, e(Botao,{desabilitado:!ant, onClick:function(){ p.ir(ant.kit.id); }}, "‹ Anterior"), e(Botao,{desabilitado:!prox, onClick:function(){ p.ir(prox.kit.id); }}, "Próxima ›")),
          e("div",{className:"flex gap-2"},
            !lib && !ok && nums.length>0 && e(Botao,{onClick:achar}, "Achei todas"),
            !lib && e(Botao,{principal:true, desabilitado:!ok, title:ok ? "" : "Confira todas antes de liberar", onClick:liberar}, "Liberar"),
            e(Botao,{estreito:true, rotulo:"Fechar", title:"Fechar", onClick:p.fechar}, "✕"))))));
}

// MENU DE DIAS (Marcus, 16/11/2026: "ela tem que poder abrir mais de um dia se quiser"): campo na barra azul que abre uma lista com caixa de marcar, Todos os dias e um dia por linha.
// A lista sai da barra (portal no body): a barra do bloco corta o que passa dela. Sempre fica pelo menos um dia marcado.
function MenuDias(p){
  var st = useState(null), pos = st[0], setPos = st[1], bt = useRef(null), lista = useRef(null), sel = p.sel, todos = p.dias.length>1 && sel.length===p.dias.length;
  useEffect(function(){
    if(!pos) return undefined;
    var fora = function(ev){ if(lista.current && !lista.current.contains(ev.target) && bt.current && !bt.current.contains(ev.target)) setPos(null); };
    document.addEventListener("mousedown", fora); return function(){ document.removeEventListener("mousedown", fora); };
  }, [pos, setPos]);
  var rot = todos ? "Todos os dias" : sel.length===1 ? tituloAba(sel[0]) : sel.length+" dias";   // o campo fechado escreve igual à lista aberta (Marcus, 16/11/2026)
  var alterna = function(d0){ var n = sel.indexOf(d0)>=0 ? sel.filter(function(x){ return x!==d0; }) : sel.concat([d0]); if(n.length) p.onChange(p.dias.filter(function(x){ return n.indexOf(x)>=0; })); };
  var abre = function(){ if(pos){ setPos(null); return; } var r = bt.current.getBoundingClientRect(); setPos({top:r.bottom+4, left:r.left}); };
  var linha = "flex h-8 cursor-pointer items-center gap-2 rounded px-2 text-[13px] font-normal normal-case text-white hover:bg-white/15";   // dentro da lista: letra normal, minúscula e sem negrito (Marcus: "escrever normal ali dentro"); só o campo fechado fica grande e em maiúsculas
  return e("div",{className:"flex items-center gap-2"},
    e("span",{className:"text-[13px] font-bold uppercase"}, "Dia"),
    e("button",{ref:bt, id:"cd-dia", type:"button", "aria-expanded":!!pos, onClick:abre, className:"flex h-8 items-center gap-2 whitespace-nowrap rounded-md border border-white/50 bg-[#14233f] px-2.5 text-[13px] font-normal normal-case text-white outline-none"}, e("span",null, rot), e("span",{"aria-hidden":"true"}, pos ? "▴" : "▾")),
    pos && createPortal(e("div",{ref:lista, role:"listbox", "aria-multiselectable":true, style:{top:pos.top, left:pos.left}, className:"fixed z-[90] max-h-[60vh] min-w-72 overflow-y-auto rounded-md border border-white/50 bg-[#14233f] p-1 shadow-lg"},
      p.dias.length>1 && e("label",{className:linha+" border-b border-white/30"}, e("input",{type:"checkbox", checked:todos, onChange:function(){ p.onChange(todos ? [sel[0]] : p.dias.slice()); }}), "Todos os dias"),
      p.dias.map(function(d0){ return e("label",{key:d0, className:linha}, e("input",{type:"checkbox", checked:sel.indexOf(d0)>=0, onChange:function(){ alterna(d0); }}), tituloAba(d0)); }),
      e("label",{className:linha+" border-t border-white/30"}, e("input",{type:"checkbox", checked:!!p.antigas, onChange:function(){ p.onAntigas(!p.antigas); }}), "Mostrar também as liberadas antigas")), document.body));
}

function AbaCondicionais(){
  var cx = use(), s = cx.state, d = cx.dispatch, fechados = useState({}), fech = fechados[0], setFech = fechados[1], ab = useState(null), aberta = ab[0], setAberta = ab[1], ds = useState(null), diaSel = ds[0], setDiaSel = ds[1], va = useState(false), verAntigas = va[0], setVerAntigas = va[1];
  // Liberadas ANTIGAS saem da lista (Marcus, 16/11/2026): só ficam as que ainda aguardam e as liberadas HOJE (para a funcionária ver o que acabou de fazer).
  var hojeBR = new Date(Date.now()-3*3600000).toISOString().slice(0, 10);
  var liberadaHoje = function(k){ var m = k.cond && k.cond.liberadoEm; return !!m && new Date(Number(m)-3*3600000).toISOString().slice(0, 10)===hojeBR; };
  var doDia = s.kits.filter(function(k){ return k.status==="precond" || liberadaHoje(k) || (verAntigas && !!(k.cond && k.cond.liberadoEm)); });   // as liberadas antigas voltam só se a funcionária marcar no menu do dia
  var pend = doDia.filter(function(k){ return k.status==="precond"; });
  var abertas = s.listagens.filter(function(l){ return !l.fechada; }).slice().sort(function(a, b){ return (String(a.data||"")+String(a.horario||"")).localeCompare(String(b.data||"")+String(b.horario||"")); });

  // UMA ABA POR DIA (Marjory, 16/11/2026: "uma aba com o dia e todas as listagens desse dia dentro, e o horário delas"): dentro da aba, cada listagem é um grupo
  // (representante e horário) com uma linha por revendedora. A aba que abre é a de hoje (ou a próxima com kit esperando).
  var dataDe = function(l){ return String(l.data||"").slice(0, 10) || "sem-data"; };
  var dias = []; abertas.forEach(function(l){ if(doDia.some(function(k){ return k.lid===l.id; }) && dias.indexOf(dataDe(l))<0) dias.push(dataDe(l)); }); dias.sort();
  var hojeIso = new Date(Date.now()-3*3600000).toISOString().slice(0, 10);
  var diaPadrao = dias.indexOf(hojeIso)>=0 ? hojeIso : (dias.filter(function(x){ return x>=hojeIso; })[0] || dias[0]);
  var diasAtivos = (diaSel||[]).filter(function(x){ return dias.indexOf(x)>=0; }); if(!diasAtivos.length && diaPadrao) diasAtivos = [diaPadrao];   // dias marcados no menu (pode ser mais de um)
  // UMA linha por revendedora, agrupada por listagem
  var linhas = [];
  abertas.filter(function(l){ return diasAtivos.indexOf(dataDe(l))>=0; }).forEach(function(l){
    var grupo = dataDe(l)+"|"+l.horario+"|"+l.rep+"|"+l.id;   // chave = dia e horário primeiro: os grupos saem em ordem de data e de horário
    doDia.filter(function(k){ return k.lid===l.id; }).sort(function(a, b){ return (a.ordem||0)-(b.ordem||0); }).forEach(function(k){
      var nums = condVisiveisPre(k), lib = k.status!=="precond", ok = condOkPre(k), feitas = nums.filter(function(n){ return condEstado(k, n).p; }).length, faltas = nums.filter(function(n){ return condEstado(k, n).falta; }).length;
      var sit = lib ? "Liberada" : faltas ? faltas+" falta"+(faltas>1 ? "m" : "") : ok ? "Conferida" : "A conferir";
      linhas.push({id:k.id, kit:k, l:l, grupo:grupo, hora:k.horaAtend || l.horario, rev:(k.prio ? "★ " : "")+k.rev, tipo:(TIPO_KIT[k.tipoKit] || TIPO_KIT.acerto_kit)[1],
        conds:nums.length ? nums.map(function(n){ var st = condEstado(k, n); return (st.p ? "✓ " : st.falta ? "! " : "")+n; }).join("   ") : "Sem condicional",
        feitas:feitas+" de "+nums.length, sit:sit, lib:lib, ok:ok, n:nums.length});
    });
  });

  var cols = [
    {k:"hora", t:"Horário"},
    {k:"rev", t:"Revendedora"},
    {k:"tipo", t:"Tipo"},
    {k:"conds", t:"Condicionais", render:function(v, l){ var ns = condVisiveisPre(l.kit); return ns.length ? e("span",{className:MONO+" font-bold tabular-nums whitespace-nowrap"}, ns.map(function(n, i){ var st = condEstado(l.kit, n); return e("span",{key:n, className:(st.p ? "text-success" : st.falta ? "text-destructive" : "")+(i ? " ml-3" : "")}, (st.p ? "✓ " : st.falta ? "! " : "")+n); })) : v; }},
    {k:"feitas", t:"Conferidas"},
    {k:"sit", t:"Situação", cor:function(l){ return (COR_ST[l.sit] || "text-destructive")+" font-semibold"; }},
    {k:"acao", t:"Ação", render:function(v, l){ return e(CelaBotoes,{itens:[{t:l.lib ? "Ver" : "Conferir", principal:!l.lib && l.ok, title:l.lib ? "Abrir a ficha" : l.ok ? "Tudo conferido: abrir para liberar" : "Abrir a ficha e conferir", onClick:function(){ setAberta(l.id); }}]}); }}];

  // fila de impressão: condicional que a funcionária não achou e pediu à Deysiane
  var fila = [];
  pend.forEach(function(k){ condVisiveisPre(k).forEach(function(n){ if(condEstado(k, n).falta){ var f = ((k.cond||{}).faltas||{})[n] || {}, l0 = abertas.find(function(l){ return l.id===k.lid; }) || {}, min = f.em ? Math.max(0, Math.round((Date.now()-new Date(f.em).getTime())/60000)) : null;
    fila.push({id:k.id+"|"+n, k:k, n:n, rep:l0.rep || "", rev:k.rev, espera:min===null ? "—" : min<60 ? min+" min" : Math.floor(min/60)+" h"}); } }); });
  var colsFila = [
    {k:"n", t:"Condicional", cor:function(){ return MONO+" font-bold text-destructive"; }},
    {k:"rep", t:"Representante"}, {k:"rev", t:"Revendedora"}, {k:"espera", t:"Espera"},
    {k:"acao", t:"Impressão", render:function(v, l){ return e(CelaBotoes,{itens:[{t:"Impressa", onClick:function(){ d({type:"COND_IMPRESSA", id:l.k.id, num:l.n, por:s.usuario}); }}]}); }}];

  var linhaAberta = aberta && linhas.find(function(x){ return x.id===aberta; });
  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    linhaAberta && e(Ficha,{key:linhaAberta.id, k:linhaAberta.kit, l:linhaAberta.l, lista:linhas, d:d, usuario:s.usuario, fechar:function(){ setAberta(null); }, ir:setAberta}),
    fila.length>0 && e(BlocoPainel,{titulo:"Aguardando impressão", compacto:true},
      e(TabelaPlanilha,{key:"fila", cols:colsFila, linhas:fila, chave:"id", grade:true, semContagem:true, semLimpar:true, vazio:"Nenhum pedido de impressão."})),
    e(BlocoPainel,{titulo:"Condicionais", compacto:true, alta:true,
        // o dia fica à ESQUERDA, na mesma linha do título (uma linha só no topo; Marcus, 16/11/2026)
        acao:dias.length>0 ? e(MenuDias,{dias:dias, sel:diasAtivos, onChange:setDiaSel, antigas:verAntigas, onAntigas:setVerAntigas}) : null},
      e("div",{className:"[&_td[colspan]]:!bg-[var(--bloco-colunas)] [&_td[colspan]]:!text-white [&_tr]:!cursor-default [&_td]:!cursor-default"}, e(TabelaPlanilha,{key:"cond", cols:cols, linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true,
        agrupar:"grupo", rotuloGrupo:function(g, q){ var p0 = String(g).split("|"); return tituloAba(p0[0])+" · "+p0[2]+" · "+p0[1]+" · "+q+" revendedora"+(q>1 ? "s" : ""); },
        grupoAberto:function(g){ return !fech[g]; }, aoGrupo:function(g){ var o = Object.assign({}, fech); o[g] = !fech[g]; setFech(o); },
        aoClicar:function(l){ setAberta(l.id); },
        vazio:"Nenhuma condicional aguardando conferência."}))));
}

export { AbaCondicionais, Ficha };

// Sorelly Admin · montagem — pages/pf/Negociacoes.js
// Tela "Negociação de Fornecedores" (Pagamentos a Fornecedores): filtros, avisos da semana, painel de endividamento (3 abas), resumo da negociação,
// pedidos sem parcela, relação por mês com as parcelas e as janelas: Lançar pedido, Lançar parcela, Detalhe do pedido e Datas limite.
// Quando o fornecedor filtrado é a Point, mostra o painel de conta corrente dela (pf/Point.js). As contas ficam em domain/pf.js; aqui só desenha.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { FILTRO_PADRAO, FORMAS, FORN_CATS, F_PER, F_SIT, F_TIPO, NF_LABEL, PT_FORN, acertoPreset, acertoPresetAtivo, acertoResumo, agregar, alertasDe, blocosDoMes, cicloLabel,
  coletar, dividirNF, diaISO, ehPrestador, expandirParcelas, pendentesPrestadores, forn, formasDoPedido, gerarParcelas, hojeIso, mesLabel, painelTotais, parcelaSituacao, pedidoDetalhe, pedidosSemParcela, pfReduz,
  relacaoPorMes, resumoAlertas, resumoNegociacao, saldoParcela, tabelaJanelas, temOverride, ultDia, viewMatriz, viewTempo } from "@/apps/montagem/domain/pf";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { Dinheiro } from "@/apps/montagem/components/padrao";
import { e, useState } from "@/shared/react";
import { PointPainel } from "./Point";
import { CARD, COR, Campo, Chip, Modal, TD, Tile, Txt, aviso, brl, dbr, opc, th, usePf } from "./ui";

// ---------- pequenas peças de desenho ----------
var NUM = TD+" text-right "+MONO, TN = " text-right!";
var LIN = "border-b border-border/40", CLIC = " cursor-pointer hover:bg-white/5";
var TOTAL = "border-t-2 border-border bg-white/10 font-extrabold";
var MUTED = "text-white/70";
var cor = function(k){ return COR[k] || COR.gray; };
var tom = function(k){ return {color:cor(k)}; };   // verde/vermelho/laranja de números
var Rot = function(t, extra){ return e("div",{className:"text-[12px] font-bold uppercase tracking-[.12em] text-white/80 "+(extra||"")}, t); };
var Vazio = function(t, k){ return e("p",{key:k, className:"rounded-xl bg-muted/30 px-4 py-5 text-center text-[14px] text-white/80"}, t); };
var Rolagem = function(children){ return e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, children)); };
var AL = function(rot, val, st, k){ return e("div",{key:k, className:"flex items-center justify-between gap-3 text-[13.5px]"}, e("span",{className:"text-white/90"}, rot), e("b",{className:MONO, style:st}, val)); };
var Btn = function(p){
  var cl = p.perigo ? "bg-destructive/25 text-destructive hover:bg-destructive/40" : p.neutro ? "bg-muted/60 text-white hover:bg-white/15" : "bg-linear-to-r from-[#B8862B] to-[#E8B84B] text-[#1B1409] hover:brightness-110";
  return e("button",{type:"button", disabled:p.disabled, onClick:p.onClick, title:p.titulo, className:"inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-bold transition disabled:opacity-40 "+(p.g ? "h-10 px-4 text-[14px] " : "h-8 px-3 text-[12.5px] ")+cl+" "+(p.className||"")}, p.ic && e(Ph,{n:p.ic, s:p.g ? 16 : 14}), p.children);
};
var Chips = function(lista, atual, muda){
  return e("div",{className:"flex flex-wrap gap-1.5"}, lista.map(function(x){ var on = atual===x[0];
    return e("button",{key:x[0], type:"button", onClick:function(){ muda(x[0]); }, className:"rounded-full px-3.5 py-1.5 text-[13px] font-bold transition "+(on ? "bg-linear-to-r from-[#B8862B] to-[#E8B84B] text-[#1B1409]" : "bg-muted/50 text-white hover:bg-white/15")}, x[1]); }));
};
// campo pequeno para as linhas de parcela
var In = function(p){ return e("input",{value:p.value, type:p.type||"text", step:p.type==="number" ? "0.01" : undefined, min:p.min, placeholder:p.ph||"", disabled:p.disabled, "aria-label":p.label, className:INPUT+" h-9! w-full min-w-0 px-2! text-[13.5px]! "+(p.num ? "text-right " : "")+(p.disabled ? "opacity-50" : ""), onChange:function(ev){ p.onChange(ev.target.value); }}); };
var Sl = function(p){ return e("select",{value:p.value, "aria-label":p.label, className:INPUT+" h-9! w-full min-w-0 cursor-pointer px-2! text-[13.5px]!", onChange:function(ev){ p.onChange(ev.target.value); }}, p.children); };
var CNPJS = ["CNPJ 34 · Sorelly Atacadista","CNPJ 46 · Sorelly Comércio","CNPJ 59 · Serenity","CNPJ 67 · Axis Joias"];
var NF_SEG = [["com","Todo com NF"],["sem","Todo sem NF"],["misto","Parte com / parte sem"]];

// grava via domínio; devolve true se salvou (para fechar a janela). Pergunta confirmação quando o domínio pede; recusa vira aviso na tela.
function grava(c, nome, extra){
  var a = Object.assign({type:"PF", op:nome, por:c.por}, extra), r = pfReduz(c.s, a);
  if(r.confirmar){ if(!window.confirm(r.msg+" Continuar mesmo assim?")) return false; a.forcar = true; r = pfReduz(c.s, a); }
  if(!(r.patch && r.patch.pf)){ aviso(c, r.msg || "Não foi possível salvar.", "alerta"); return false; }
  c.d(a); return true;
}
var linhaNova = function(parte, venc, valor){ return {forma:parte==="com" ? "boleto" : "pix_revendedora", venc:venc, valor:valor===undefined ? "" : valor, qtd:"1", conta:"", status:"Pendente"}; };
var pedidoNovo = function(pf){ return {fornId:pf.fornecedores.length ? pf.fornecedores[0].id : 0, numero:"", data:hojeIso(), total:"", nf:"misto", editado:"", com:"", sem:"", cnpj:CNPJS[0], nfNum:"", lcom:[], lsem:[], qCom:"3", qSem:"2", nova:false, nomeNovo:"", catNovo:FORN_CATS[0], descricao:"", limite:"", pixMin:""}; };

function AbaPfNeg(){
  var c = usePf(), pf = c.pf, ed = c.edita;
  var sf = useState(FILTRO_PADRAO), filtro = sf[0], setFiltro = sf[1];
  var sfo = useState(""), fornF = sfo[0], setFornF = sfo[1];
  var sa = useState("tempo"), aba = sa[0], setAba = sa[1];
  var sm = useState(null), mesAb = sm[0], setMesAb = sm[1];
  var sal = useState(false), alAb = sal[0], setAlAb = sal[1];
  var ss = useState({}), secs = ss[0], setSecs = ss[1];
  var sp = useState(null), ped = sp[0], setPed = sp[1];       // janela "Lançar pedido"
  var spc = useState(null), parc = spc[0], setParc = spc[1];  // janela "Lançar parcela"
  var sd = useState(null), detId = sd[0], setDetId = sd[1];   // janela "detalhe do pedido"
  var sac = useState(null), ac = sac[0], setAc = sac[1];      // janela "Datas limite"
  if(!pf || !pf.fornecedores) return e("p",{className:"p-6"}, "Carregando…");

  var fId = fornF ? parseInt(fornF) : null, fo = fId ? forn(pf, fId) : null, ehPoint = fId===PT_FORN;
  var secAb = function(k){ return secs[k]!==false; };
  var togSec = function(k){ var n = Object.assign({}, secs); n[k] = !secAb(k); setSecs(n); };
  var verForn = function(id){ setFornF(String(id)); try{ window.scrollTo(0,0); }catch(x){} };
  var abrirMes = function(m){ setMesAb(mesAb===m ? null : m); setAba("tempo"); };
  var abrirParcela = function(pedId, voltar){
    var pd = pf.pedidos.find(function(p){ return p.id===pedId; }); if(!pd) return;
    var fs = formasDoPedido(pd);
    setParc({pedId:pedId, forma:fs[0]||"", venc:diaISO(hojeIso().slice(0,7), 31), valor:"", qtd:"1", conta:"", status:"Pendente", voltar:!!voltar});
  };
  var baixa = function(pedId, idx){ opc(c, "parcela_baixa", {pedId:pedId, idx:idx}); };

  // ---------- cabeçalho + filtros ----------
  var topo = e(PageHead,{t:"Negociação de Fornecedores", sub:"Endividamento por mês e por janela de pagamento — quanto devemos, quando vence e onde está apertado"},
    e(Btn,{g:true, ic:"plus", disabled:!ed, onClick:function(){ setPed(pedidoNovo(pf)); }}, "Lançar pedido"));
  var barra = e("div",{className:"flex flex-wrap items-end gap-x-6 gap-y-3 rounded-xl bg-card px-4 py-3 ring-1 ring-[#3B82F6]/30"},
    e("div",{className:"flex flex-col gap-1.5"}, Rot("Tipo"), Chips(F_TIPO, filtro.tipo, function(v){ setFiltro(Object.assign({}, filtro, {tipo:v})); })),
    e("div",{className:"flex flex-col gap-1.5"}, Rot("Fornecedor"),
      e("select",{value:fornF, "aria-label":"Fornecedor", className:INPUT+" h-10! min-w-[225px] cursor-pointer", onChange:function(ev){ setFornF(ev.target.value); }},
        e("option",{value:""}, "Todos os fornecedores"), pf.fornecedores.map(function(f){ return e("option",{key:f.id, value:String(f.id)}, f.nome); }))),
    e("div",{className:"flex flex-col gap-1.5"}, Rot("Período"), Chips(F_PER, filtro.per, function(v){ setFiltro(Object.assign({}, filtro, {per:v})); })),
    e("div",{className:"flex flex-col gap-1.5"}, Rot("Situação"), Chips(F_SIT, filtro.sit, function(v){ setFiltro(Object.assign({}, filtro, {sit:v})); })));

  var modais = [
    ped && e(JanelaPedido,{key:"mp", c:c, pf:pf, ped:ped, setPed:setPed}),
    parc && e(JanelaParcela,{key:"mc", c:c, pf:pf, parc:parc, setParc:setParc, voltarDet:function(id){ setDetId(id); }}),
    detId && e(JanelaDetalhe,{key:"md", c:c, pf:pf, id:detId, fechar:function(){ setDetId(null); }, lancar:function(id){ setDetId(null); abrirParcela(id, true); }, baixa:baixa}),
    ac && e(JanelaAcerto,{key:"ma", c:c, pf:pf, ac:ac, setAc:setAc})
  ];

  if(ehPoint) return e("div",{className:"flex flex-col gap-4"}, topo, barra, e(PointPainel,{c:c}), modais);

  // ---------- dados da tela ----------
  var ags = agregar(pf, coletar(pf, filtro, fId)), tot = painelTotais(ags);

  // ---------- avisos da semana ----------
  var A = alertasDe(pf, ags, {fornFiltro:fId}), alertas = null;
  if(A.length){
    var RA = resumoAlertas(A), cb = cor(RA.cor);
    alertas = e("div",{className:"flex flex-col gap-1.5"},
      e("button",{type:"button", onClick:function(){ setAlAb(!alAb); }, className:"flex w-full flex-wrap items-center gap-3 rounded-xl px-4 py-2.5 text-left transition hover:brightness-125", style:{border:"2px solid "+cb, background:cb+"1F"}},
        e("span",{className:"grid size-6 shrink-0 place-items-center rounded-full text-[13px] font-extrabold", style:{border:"2px solid "+cb, color:cb}}, "!"),
        e("b",{className:"text-[15px]", style:{color:cb}}, A.length+" aviso"+(A.length>1 ? "s" : "")),
        e("span",{className:"text-[14px] font-medium text-white/90"}, RA.partes.join(" · ")),
        e("span",{className:"ml-auto flex items-center gap-1 text-[13.5px] font-bold", style:{color:cb}}, alAb ? "ocultar" : "ver avisos", e(Ph,{n:alAb ? "caret-up" : "caret-down", s:14}))),
      alAb && A.map(function(a, i){ var ca = cor(a.cor);
        return e("button",{key:i, type:"button", onClick:function(){ if(a.pedId) setDetId(a.pedId); else abrirMes(a.mes); }, className:"flex w-full flex-wrap items-center gap-2 rounded-lg px-4 py-2 text-left text-[13.5px] hover:brightness-125", style:{borderLeft:"4px solid "+ca, background:ca+"14"}},
          e("b",{style:{color:ca}}, a.titulo), e("span",{className:"text-white/90"}, "— "+a.texto), e("b",{className:"ml-auto "+MONO}, brl(a.valor))); }));
  }

  // ---------- prestadores de serviço: o que está pendente, com botão para abrir a negociação ----------
  var PP = pendentesPrestadores(pf, hojeIso()).filter(function(x){ return !fId || x.f.id===fId; }), prestPend = null;
  if(PP.length){
    prestPend = e(BlocoBarra,{cor:"azul", t:"Prestadores de serviço — pendente", sub:"O que estamos pagando agora. Abra a negociação para ver o combinado.", dir:String(PP.length)},
      Rolagem([
        e("thead",{key:"h"}, e("tr",null, th("Prestador"), th("Pagar até"), th("Pix mínimo", TN), th("Total", TN), th("Pago", TN), th("Falta pagar", TN), th(""))),
        e("tbody",{key:"b"}, PP.map(function(x){
          var cd = x.atrasado ? "red" : x.dias!==null && x.dias<=3 ? "orange" : null;
          return e("tr",{key:x.pd.id, className:LIN},
            e("td",{className:TD}, e("b",null, x.f.nome)),
            e("td",{className:TD, style:cd ? tom(cd) : null}, x.pd.limite ? dbr(x.pd.limite)+(x.atrasado ? " · atrasado" : "") : "—"),
            e("td",{className:NUM}, x.pd.pixMin ? brl(x.pd.pixMin) : "—"), e("td",{className:NUM}, brl(x.pd.total)), e("td",{className:NUM, style:tom("green")}, brl(x.pago)), e("td",{className:NUM, style:tom("red")}, e("b",null, brl(x.falta))),
            e("td",{className:TD}, e(Btn,{ic:"eye", onClick:function(){ setDetId(x.pd.id); }}, "Ver negociação"))); }))]));
  }

  // ---------- painel de endividamento ----------
  var abas = [["tempo","Linha do tempo"],["janela","Janelas de pagamento"],["matriz","Fornecedor × mês"]];
  var tabJan = function(lista, comMes){
    var T = tabelaJanelas(pf, lista);
    if(!T.grupos.length) return Vazio("Sem janelas no filtro atual.");
    var corpo = [];
    T.grupos.forEach(function(g){
      corpo.push(e("tr",{key:"g"+g.fornId, className:"bg-white/5 "+LIN},
        e("td",{colSpan:comMes ? 4 : 3, className:TD}, e("b",null, g.nome), " ", e("span",{className:"text-[12px] font-semibold "+MUTED}, g.ciclo), " ", e("span",{className:"text-[12px] "+MUTED}, g.janelas.length+" acerto(s)")),
        e("td",{className:NUM}, brl(g.sT)), e("td",{className:NUM}, brl(g.sP)), e("td",{className:NUM, style:g.sA>0.005 ? tom("orange") : null}, brl(g.sA)), e("td",{className:NUM}, brl(g.sC)), e("td",{className:NUM}, e("b",null, brl(g.sA+g.sC)))));
      g.janelas.forEach(function(j, i){
        var st = j.cor==="gray" ? null : tom(j.cor);
        corpo.push(e("tr",{key:"j"+g.fornId+"-"+i, onClick:function(){ verForn(j.fornId); }, className:LIN+CLIC},
          comMes && e("td",{className:TD}, mesLabel(j.mes+"-01")),
          e("td",{className:TD, style:st}, e("b",null, dbr(j.limite))),
          e("td",{className:TD}, "fecha "+dbr(j.fim)),
          e("td",{className:TD}, j.nParcelas+" parc · ", e("span",{style:st}, j.nota)),
          e("td",{className:NUM}, brl(j.total)), e("td",{className:NUM}, brl(j.pago)), e("td",{className:NUM, style:j.aberto>0.005 ? tom("orange") : tom("green")}, brl(j.aberto)), e("td",{className:NUM}, brl(j.comNF)), e("td",{className:NUM}, brl(j.divida))));
      });
    });
    var X = T.totais;
    return Rolagem([
      e("thead",{key:"h"}, e("tr",null, comMes && th("Mês"), th("Pagar até"), th("Corte"), th("Situação"), th("Sem NF", TN), th("Pago", TN), th("A pagar", TN), th("Com NF", TN), th("Dívida", TN))),
      e("tbody",{key:"b"}, corpo, e("tr",{className:TOTAL}, e("td",{colSpan:comMes ? 4 : 3, className:TD}, "TOTAL GERAL"), e("td",{className:NUM}, brl(X.total)), e("td",{className:NUM}, brl(X.pago)), e("td",{className:NUM}, brl(X.aberto)), e("td",{className:NUM}, brl(X.comNF)), e("td",{className:NUM}, brl(X.divida))))]);
  };
  var vTempo = function(){
    var V = viewTempo(ags);
    var linha = function(r){
      var aberto = mesAb===r.mes, M = ags.find(function(x){ return x.mes===r.mes; }), rows = [
        e("tr",{key:r.mes, onClick:function(){ abrirMes(r.mes); }, className:LIN+CLIC+(aberto ? " bg-white/10" : "")+(r.quitado ? " opacity-70" : "")},
          e("td",{className:TD}, e("b",{className:"text-[16px]"}, mesLabel(r.mes+"-01")), r.atraso && e("span",{className:"ml-2 inline-block"}, e(Chip,{cor:"red"}, "atraso "+brl(r.semAtraso)))),
          e("td",{className:TD}, r.nJanelas), e("td",{className:NUM, style:r.semAberto>0.005 ? tom("orange") : null}, brl(r.semAberto)), e("td",{className:NUM}, brl(r.comTotal)), e("td",{className:NUM}, e("b",null, brl(r.divida))),
          e("td",{className:TD}, e(Ph,{n:aberto ? "caret-down" : "caret-right", s:14})))];
      if(aberto && M) rows.push(e("tr",{key:r.mes+"d", className:"bg-black/20"}, e("td",{colSpan:6, className:"p-2"}, tabJan([M], false))));
      return rows;
    };
    return e("div",{className:"flex flex-col gap-2"},
      Rolagem([
        e("thead",{key:"h"}, e("tr",null, th("Mês"), th("Acertos"), th("A pagar sem NF", TN), th("Com NF", TN), th("Dívida do mês", TN), th(""))),
        e("tbody",{key:"b"}, V.abertos.map(linha),
          V.quitados.length>0 && e("tr",{className:"bg-[#22C55E]/10"}, e("td",{colSpan:6, className:TD+" font-bold", style:tom("green")}, "✓ Finalizados — sem Pix em aberto ("+V.quitados.length+" mês(es))")),
          V.quitados.map(linha),
          e("tr",{className:TOTAL}, e("td",{className:TD}, "TOTAL"), e("td",{className:TD}, V.totais.nJanelas), e("td",{className:NUM}, brl(V.totais.semAberto)), e("td",{className:NUM}, brl(V.totais.comTotal)), e("td",{className:NUM}, brl(V.totais.divida)), e("td",null)))]),
      e("p",{className:"text-[12.5px] "+MUTED}, "“A pagar sem NF” já é o lançado menos o que foi pago. Clique no mês para ver as janelas."));
  };
  var vMatriz = function(){
    var X = viewMatriz(pf, ags);
    if(!X.fornecedores.length) return Vazio("Sem dados no filtro.");
    return Rolagem([
      e("thead",{key:"h"}, e("tr",null, th("Fornecedor"), X.meses.map(function(m){ return th(mesLabel(m+"-01"), TN); }), th("Total", TN))),
      e("tbody",{key:"b"}, X.fornecedores.map(function(r){
        return e("tr",{key:r.fornId, onClick:function(){ verForn(r.fornId); }, className:LIN+CLIC},
          e("td",{className:TD}, e("b",null, r.nome)),
          r.celulas.map(function(x){ return e("td",{key:x.mes, className:NUM+(x.alto ? " bg-[#EAB308]/15" : ""), style:x.vazio ? {color:"rgba(255,255,255,.4)"} : null}, x.vazio ? "—" : brl(x.valor)); }),
          e("td",{className:NUM}, e("b",null, brl(r.total)))); }),
        e("tr",{className:TOTAL}, e("td",{className:TD}, "TOTAL"), X.totaisMes.map(function(v, i){ return e("td",{key:i, className:NUM}, brl(v)); }), e("td",{className:NUM}, brl(X.totalGeral))))]);
  };
  var painel = e(BlocoBarra,{cor:"azul", t:"Painel de endividamento", sub:(fo ? fo.nome+" · "+cicloLabel(fo) : "Todos os fornecedores")},
    e("div",{className:"flex flex-col gap-3 p-4"},
      e("div",{className:"grid grid-cols-2 gap-2 lg:grid-cols-4"},
        e(Tile,{t:"A pagar sem NF", v:brl(tot.totSem), cor:COR.orange}), e(Tile,{t:"Em aberto", v:brl(tot.totAb), cor:tot.totAb>0.005 ? COR.red : COR.green}),
        e(Tile,{t:"Registro com NF", v:brl(tot.totCom), cor:COR.blue}), e(Tile,{t:"Dívida total", v:brl(tot.divida), cor:COR.yellow})),
      e("div",{className:"flex flex-wrap gap-1.5"}, abas.map(function(x){ var on = aba===x[0];
        return e("button",{key:x[0], type:"button", onClick:function(){ setAba(x[0]); }, className:"rounded-t-lg px-4 py-2 text-[14px] font-bold "+(on ? "bg-linear-to-r from-[#B8862B] to-[#E8B84B] text-[#1B1409]" : "bg-muted/50 text-white hover:bg-white/15")}, x[1]); })),
      !ags.length ? Vazio("Nenhuma parcela no filtro atual.") : aba==="tempo" ? vTempo() : aba==="janela" ? tabJan(ags, true) : vMatriz()));

  // ---------- resumo da negociação ----------
  var RN = resumoNegociacao(pf, fId), resumo = null;
  if(RN.modo==="todos" && RN.linhas.length){
    var TT = RN.totais;
    resumo = e(BlocoBarra,{cor:"azul", t:"Negociações por fornecedor", sub:"Clique numa linha para filtrar e ver o detalhe da negociação"},
      Rolagem([
        e("thead",{key:"h"}, e("tr",null, th("Fornecedor"), th("Pedidos"), th("Total", TN), th("Com NF", TN), th("Sem NF", TN), th("Pago", TN), th("Dívida", TN), th("Sem parcela", TN))),
        e("tbody",{key:"b"}, RN.linhas.map(function(r){
          return e("tr",{key:r.fornId, onClick:function(){ verForn(r.fornId); }, className:LIN+CLIC},
            e("td",{className:TD}, e("b",null, r.nome)), e("td",{className:TD+" "+MUTED}, r.nPedidos), e("td",{className:NUM}, brl(r.total)), e("td",{className:NUM}, brl(r.comNF)), e("td",{className:NUM}, brl(r.semNF)),
            e("td",{className:NUM, style:tom("green")}, brl(r.pago)), e("td",{className:NUM, style:r.divida>0.005 ? tom("red") : null}, brl(r.divida)), e("td",{className:NUM, style:r.semParcela>0.005 ? tom("orange") : null}, r.semParcela>0.005 ? brl(r.semParcela) : "—")); }),
          e("tr",{className:TOTAL}, e("td",{className:TD}, "TOTAL"), e("td",{className:TD}, TT.nPedidos), e("td",{className:NUM}, brl(TT.total)), e("td",{className:NUM}, brl(TT.comNF)), e("td",{className:NUM}, brl(TT.semNF)),
            e("td",{className:NUM, style:tom("green")}, brl(TT.pago)), e("td",{className:NUM, style:tom("red")}, brl(TT.divida)), e("td",{className:NUM, style:tom("orange")}, brl(TT.semParcela))))]));
  } else if(RN.modo==="um" && RN.itens.length){
    resumo = e("div",{className:"flex flex-col gap-4"}, RN.itens.map(function(it){
      var X = it.totaisMensal;
      return e(BlocoBarra,{key:it.fornId, cor:"azul", t:it.nome+" — resumo da negociação", sub:it.nPedidos+" pedido(s) · "+it.cat},
        e("div",{className:"flex flex-col gap-3 p-4"},
          e("div",{className:"flex items-center gap-2"}, it.divida>0.005 ? e(Chip,{cor:"orange"}, "Dívida em aberto") : e(Chip,{cor:"green"}, "Sem dívida")),
          e("div",{className:"grid grid-cols-2 gap-2 lg:grid-cols-5"},
            e(Tile,{t:"Dívida total", v:brl(it.divida), cor:it.divida>0.005 ? COR.red : COR.green}), e(Tile,{t:"Total em pedidos", v:brl(it.total), cor:"#fff"}), e(Tile,{t:"Total com NF", v:brl(it.comNF), cor:COR.blue}),
            e(Tile,{t:"Total sem NF", v:brl(it.semNF), cor:COR.orange}), e(Tile,{t:"Já pago", v:brl(it.pago), cor:COR.green})),
          it.semParcela>0.005 && e("div",{className:"flex items-center justify-between rounded-lg bg-[#3B82F6]/15 px-4 py-2 text-[13.5px]"}, e("span",null, "Valor de pedidos ainda ", e("b",null, "sem parcela lançada")), e("b",{className:MONO, style:tom("orange")}, brl(it.semParcela))),
          Rot("Total por mês — com e sem NF"),
          Rolagem([
            e("thead",{key:"h"}, e("tr",null, th("Mês de vencimento"), th("Com NF", TN), th("Sem NF", TN), th("Total do mês", TN), th("Pago", TN), th("Em aberto", TN))),
            e("tbody",{key:"b"}, it.mensal.length
              ? [it.mensal.map(function(m){ return e("tr",{key:m.mes, className:LIN}, e("td",{className:TD}, e("b",null, mesLabel(m.mes+"-01"))), e("td",{className:NUM}, brl(m.com)), e("td",{className:NUM}, brl(m.sem)), e("td",{className:NUM}, brl(m.total)),
                  e("td",{className:NUM, style:tom("green")}, brl(m.pago)), e("td",{className:NUM, style:m.aberto>0.005 ? tom("red") : null}, brl(m.aberto))); }),
                e("tr",{key:"t", className:TOTAL}, e("td",{className:TD}, "TOTAL"), e("td",{className:NUM}, brl(X.com)), e("td",{className:NUM}, brl(X.sem)), e("td",{className:NUM}, brl(X.total)), e("td",{className:NUM, style:tom("green")}, brl(X.pago)), e("td",{className:NUM, style:tom("red")}, brl(X.aberto)))]
              : e("tr",null, e("td",{colSpan:6, className:"px-3 py-4 text-center text-[13.5px] "+MUTED}, "Nenhuma parcela lançada — os totais mensais aparecem conforme as parcelas forem lançadas.")))])));
    }));
  }

  // ---------- pedidos sem parcela + relação por mês ----------
  var lista = fId ? pf.pedidos.filter(function(p){ return p.fornId===fId; }) : pf.pedidos, pedidos = null;
  if(!lista.length){
    pedidos = Vazio(fId ? "Este fornecedor ainda não tem pedidos lançados." : "Nenhum pedido lançado. Clique em “Lançar pedido” para começar.");
  } else {
    var semP = pedidosSemParcela(pf, fId), rel = relacaoPorMes(pf, coletar(pf, filtro, fId), fId), parts = [];
    if(semP.length) parts.push(e(BlocoBarra,{key:"sp", cor:"azul", t:"Pedidos sem parcela lançada", sub:"Lance as parcelas para que entrem na relação por mês abaixo", dir:String(semP.length)},
      Rolagem([
        e("thead",{key:"h"}, e("tr",null, th("Fornecedor"), th("Pedido"), th("Data"), th("Total", TN), th("Com NF", TN), th("Sem NF", TN), th(""))),
        e("tbody",{key:"b"}, semP.map(function(pd){ var f = forn(pf, pd.fornId);
          return e("tr",{key:pd.id, onClick:function(){ setDetId(pd.id); }, className:LIN+CLIC},
            e("td",{className:TD}, e("b",null, f ? f.nome : "—")), e("td",{className:TD+" "+MUTED}, pd.numero), e("td",{className:TD+" "+MUTED}, dbr(pd.data)),
            e("td",{className:NUM}, brl(pd.total)), e("td",{className:NUM}, brl(pd.comNF)), e("td",{className:NUM}, brl(pd.semNF)),
            e("td",{className:TD}, e(Btn,{ic:"plus", disabled:!ed, onClick:function(ev){ ev.stopPropagation(); abrirParcela(pd.id, false); }}, "Lançar parcela"))); }))])));
    if(rel.length) parts.push(e("div",{key:"rt"}, Rot("Relação detalhada por mês", "text-[15px]! mt-1")));
    if(!rel.length) parts.push(Vazio("Nenhuma parcela lançada ainda — lance as parcelas dos pedidos acima para vê-las organizadas por mês.", "rv"));
    rel.forEach(function(R){
      var NC = fId ? 8 : 9, kS = R.mes+"|sem", kC = R.mes+"|com";
      var linhaParcela = function(l, i){
        var sit = parcelaSituacao(l), F = sit.forma, late = sit.atrasada;
        return e("tr",{key:"p"+l.pd.id+"-"+l.idx, onClick:function(){ setDetId(l.pd.id); }, className:LIN+CLIC+(late ? " bg-[#EF4444]/10" : "")},
          e("td",{className:TD, style:sit.cor ? tom(sit.cor) : null}, dbr(l.p.venc)+(late ? " · "+Math.abs(sit.dias)+"d" : "")),
          !fId && e("td",{className:TD}, e("b",null, l.f ? l.f.nome : "—")),
          e("td",{className:TD+" "+MUTED}, l.pd.numero), e("td",{className:TD}, e(Chip,{cor:F.cor}, F.label)), e("td",{className:TD+" "+MUTED}, sit.nfLabel), e("td",{className:TD+" "+MUTED}, l.p.conta || "—"),
          e("td",{className:NUM}, brl(l.p.valor)), e("td",{className:TD}, e(Chip,{cor:sit.statusCor}, sit.statusTexto)),
          e("td",{className:TD}, e(Btn,{perigo:l.p.status==="Pago", disabled:!ed, onClick:function(ev){ ev.stopPropagation(); baixa(l.pd.id, l.idx); }}, l.p.status==="Pago" ? "Estornar" : "Dar baixa")));
      };
      var linhaRegistro = function(l){
        var F = FORMAS[l.p.forma];
        return e("tr",{key:"r"+l.pd.id+"-"+l.idx, onClick:function(){ setDetId(l.pd.id); }, className:LIN+CLIC+" opacity-90"},
          e("td",{className:TD+" "+MUTED}, dbr(l.p.venc)), !fId && e("td",{className:TD}, l.f ? l.f.nome : "—"), e("td",{className:TD+" "+MUTED}, l.pd.numero), e("td",{className:TD}, e(Chip,{cor:F.cor}, F.label)),
          e("td",{className:TD+" "+MUTED}, l.pd.nfNum ? "NF "+l.pd.nfNum : "Com NF"), e("td",{className:TD+" "+MUTED}, l.pd.cnpj || "—"), e("td",{className:NUM}, brl(l.p.valor)),
          e("td",{className:TD}, e(Chip,{cor:"gray"}, "Registro")), e("td",{className:TD+" text-[13px] "+MUTED}, "sem baixa"));
      };
      var secao = function(t, sub, ck, k){ var ab = secAb(k), cc = cor(ck);
        return e("tr",{key:"s"+k, onClick:function(){ togSec(k); }, className:"cursor-pointer border-y-2 border-border bg-white/5 hover:bg-white/10"},
          e("td",{colSpan:NC, className:"px-3 py-2.5"}, e("span",{className:"flex flex-wrap items-center gap-2"}, e(Ph,{n:ab ? "caret-down" : "caret-right", s:15, style:{color:cc}}), e("b",{className:"text-[14.5px]", style:{color:cc}}, t), e("span",{className:"text-[13px] text-white/85"}, sub),
            e("span",{className:"ml-auto text-[12.5px] font-bold text-white/80"}, ab ? "ocultar parcelas ▲" : "ver parcelas ▾")))); };
      var corpo = [secao("SEM NF · pix revendedora", "— controle de pagamento · "+R.sem.length+" parcela(s) · "+brl(R.total)+(R.sem.length ? " · em aberto "+brl(R.aberto) : ""), "orange", kS)];
      if(secAb(kS)){
        if(!R.sem.length) corpo.push(e("tr",{key:"sv"}, e("td",{colSpan:NC, className:"px-3 py-4 text-center text-[13.5px] "+MUTED}, "Nenhuma parcela sem NF neste mês.")));
        else if(fId) R.blocos.forEach(function(b){
          if(!b.usado) return;
          var st = b.cor==="gray" ? null : tom(b.cor);
          corpo.push(e("tr",{key:"b"+b.ordem, className:"border-t-2 border-border bg-white/10"},
            e("td",{colSpan:5, className:"px-3 py-2.5 text-[14px]"}, e("b",null, b.ordem+"º acerto · pagar até "+dbr(b.limite)), e("span",{className:"text-white/85"}, " — parcelas com vencimento até "+dbr(b.fim)+" · "+b.itens.length+" parcela(s)"+(b.aberto>0.005 ? " · "+b.prazo.texto : " · quitado"))),
            e("td",{className:NUM+" font-extrabold", style:st}, brl(b.total)), e("td",{colSpan:2, className:"px-3 py-2.5 text-[13px] text-white/85"}, b.aberto>0.005 ? "em aberto "+brl(b.aberto) : "pago")));
          b.itens.forEach(function(l){ corpo.push(linhaParcela(l)); });
        });
        else R.sem.forEach(function(l){ corpo.push(linhaParcela(l)); });
      }
      if(R.com.length){
        corpo.push(secao("COM NF · registro", "— faturado, entra só na dívida total · "+R.com.length+" parcela(s) · "+brl(R.registro), "blue", kC));
        if(secAb(kC)) R.com.forEach(function(l){ corpo.push(linhaRegistro(l)); });
      }
      var usados = fId ? R.blocos.filter(function(b){ return b.usado; }) : [];
      var limBar = fId && e("button",{type:"button", onClick:function(){ setAc({fornId:fId, mes:R.mes, blocos:blocosDoMes(pf, fId, R.mes), custom:false}); }, title:"Editar as datas limite deste mês",
        className:"flex w-full flex-wrap items-center gap-2.5 rounded-xl border-2 border-border bg-muted/30 px-4 py-2.5 text-left hover:border-[#EAB308]"},
        e("span",{className:"text-[12.5px] font-bold uppercase tracking-wide text-white/90"}, "Datas limite"),
        usados.length ? usados.map(function(b){ var cc = b.chip==="ok" ? COR.green : b.chip==="late" ? COR.red : b.chip==="soon" ? COR.orange : null;
          return e("span",{key:b.ordem, className:"inline-flex items-baseline gap-2 rounded-lg border-2 bg-card px-3 py-1 text-[13.5px] font-semibold", style:{borderColor:cc || "var(--border)", color:cc || undefined}}, dbr(b.limite), e("b",{className:MONO+" text-[15px]"}, brl(b.total)), b.aberto<=0.005 && e("span",{style:tom("green")}, "✓")); })
          : e("span",{className:"text-[13.5px] "+MUTED}, "nenhuma parcela nas datas definidas"),
        R.custom ? e(Chip,{cor:"yellow"}, "Datas próprias deste mês") : e(Chip,{cor:R.cicloCor}, R.cicloTxt),
        e("span",{className:"ml-auto flex items-center gap-1 text-[12.5px] font-bold text-white/85"}, "Editar datas", e(Ph,{n:"pencil", s:13})));
      parts.push(e(BlocoBarra,{key:"m"+R.mes, cor:"azul", t:mesLabel(R.mes+"-01"), sub:R.sem.length+" sem NF (controle) · "+R.com.length+" com NF (registro)", dir:R.aberto>0.005 ? "em aberto "+brl(R.aberto) : "quitado"},
        e("div",{className:"flex flex-col gap-3 p-4"},
          e("div",{className:"grid grid-cols-2 gap-2 lg:grid-cols-4"},
            e(Tile,{t:"A pagar sem NF", v:brl(R.total), cor:COR.orange}), e(Tile,{t:"Pago", v:brl(R.pago), cor:COR.green}), e(Tile,{t:"Em aberto", v:brl(R.aberto), cor:R.aberto>0.005 ? COR.red : "#fff"}), e(Tile,{t:"Com NF (registro)", v:brl(R.registro), cor:COR.blue})),
          limBar,
          Rolagem([
            e("thead",{key:"h"}, e("tr",null, th("Vencimento"), !fId && th("Fornecedor"), th("Pedido"), th("Forma"), th("NF / doc"), th("Conta / CNPJ"), th("Valor", TN), th("Status"), th(" "))),
            e("tbody",{key:"b"}, corpo)]))));
    });
    pedidos = e("div",{className:"flex flex-col gap-4"}, parts);
  }

  return e("div",{className:"flex flex-col gap-4"}, topo, barra, alertas, prestPend, painel, resumo, pedidos, modais);
}

// ───────────────── Janela: Lançar pedido ─────────────────
function JanelaPedido(p){
  var c = p.c, pf = p.pf, ped = p.ped;
  var split = function(n){ return dividirNF(n.nf, n.total, n.editado, n.com, n.sem); };
  // atualiza e limpa as parcelas de uma parte que deixou de existir (como o HTML)
  var upd = function(patch){ var n = Object.assign({}, ped, patch), x = split(n); if(n.nf!=="misto"){ n.com = x.com.toFixed(2); n.sem = x.sem.toFixed(2); } if(x.com<=0.005) n.lcom = []; if(x.sem<=0.005) n.lsem = []; p.setPed(n); };
  var X = split(ped), misto = ped.nf==="misto";
  var vCom = misto ? ped.com : X.com.toFixed(2), vSem = misto ? ped.sem : X.sem.toFixed(2);
  var setNF = function(t){ upd({nf:t}); };
  var fechar = function(){ p.setPed(null); };
  var parte = function(pt){
    var key = pt==="com" ? "lcom" : "lsem", lines = ped[key], alvo = pt==="com" ? X.com : X.sem, qk = pt==="com" ? "qCom" : "qSem";
    if(alvo<=0.005) return null;
    var set = function(i, campo, v){ var l = lines.map(function(x, j){ if(j!==i) return x; var y = Object.assign({}, x); y[campo] = v; if(campo==="forma" && v!=="cartao") y.qtd = "1"; return y; }); var o = {}; o[key] = l; upd(o); };
    var add = function(l){ var o = {}; o[key] = lines.concat([l]); upd(o); };
    var aloc = expandirParcelas(lines).reduce(function(s, x){ return s+x.valor; }, 0), rest = alvo-aloc, nPar = expandirParcelas(lines).length;
    var dividir = function(){
      if(alvo<=0){ aviso(c, "Informe primeiro o valor desta parte do pedido.", "alerta"); return; }
      var o = {}; o[key] = gerarParcelas(alvo, ped[qk], ped.data || "2026-09-15", pt==="com" ? "boleto" : undefined).map(function(g){ return {forma:g.forma, venc:g.venc, valor:g.valor.toFixed(2), qtd:"1", conta:"", status:"Pendente"}; }); upd(o);
    };
    var grade = pt==="com" ? "grid-cols-[1.1fr_1.25fr_1fr_.55fr_1.4fr_1fr_2rem]" : "grid-cols-[1.1fr_1.25fr_1fr_1.4fr_1fr_2rem]";
    var cab = pt==="com" ? ["Forma","Vencimento","Valor (R$)","Nº parc.","Conta / bandeira","Status",""] : ["Forma","Vencimento","Valor (R$)","Conta / origem","Status",""];
    return e("div",{className:"flex flex-col gap-2 rounded-xl bg-muted/25 p-3 ring-1 "+(pt==="com" ? "ring-[#3B82F6]/40" : "ring-[#3B82F6]/40")},
      e("div",{className:"flex flex-wrap items-center justify-between gap-2"},
        e("div",{className:"flex flex-wrap items-center gap-2"}, e(Chip,{cor:pt==="com" ? "blue" : "orange"}, pt==="com" ? "Parcelas com NF" : "Parcelas sem NF"), e("span",{className:"text-[13px] text-white/80"}, pt==="com" ? "boleto · pix empresa · cartão" : "pix revendedora")),
        e("div",{className:"flex items-center gap-2"},
          e("input",{type:"number", min:"1", value:ped[qk], title:"Quantidade", "aria-label":"Quantidade de parcelas", className:INPUT+" h-8! w-16 px-2!", onChange:function(ev){ var o = {}; o[qk] = ev.target.value; upd(o); }}),
          e(Btn,{neutro:true, onClick:dividir}, "Dividir saldo em Nx"), e(Btn,{ic:"plus", onClick:function(){ add(linhaNova(pt, ped.data || "2026-09-15")); }}, "Parcela"))),
      e("div",{className:"hidden gap-2 px-1 text-[11px] font-bold uppercase tracking-wide text-white/80 sm:grid "+grade}, cab.map(function(t, i){ return e("span",{key:i}, t); })),
      lines.length ? lines.map(function(l, i){
        return e("div",{key:i, className:"grid items-center gap-2 "+grade},
          pt==="com"
            ? e(Sl,{value:l.forma, label:"Forma", onChange:function(v){ set(i, "forma", v); }}, e("option",{value:"boleto"}, "Boleto"), e("option",{value:"pix_empresa"}, "Pix empresa"), e("option",{value:"cartao"}, "Cartão"))
            : e("span",{className:"truncate rounded-lg bg-[#3B82F6]/15 px-2 py-2 text-[13px] font-semibold", style:tom("orange")}, "Pix revendedora"),
          e(In,{type:"date", value:l.venc, label:"Vencimento", onChange:function(v){ set(i, "venc", v); }}),
          e(Dinheiro,{out:"ponto", value:l.valor, label:"Valor", onChange:function(v){ set(i, "valor", v); }}),
          pt==="com" && e(In,{type:"number", min:"1", num:true, value:l.qtd, disabled:l.forma!=="cartao", label:"Nº de parcelas", onChange:function(v){ set(i, "qtd", v); }}),
          e(In,{value:l.conta, ph:pt==="com" ? "Conta / bandeira" : "Conta / origem", label:"Conta", onChange:function(v){ set(i, "conta", v); }}),
          e(Sl,{value:l.status, label:"Status", onChange:function(v){ set(i, "status", v); }}, e("option",null, "Pendente"), e("option",null, "Pago")),
          e("button",{type:"button", "aria-label":"Remover parcela", onClick:function(){ var o = {}; o[key] = lines.filter(function(x, j){ return j!==i; }); upd(o); }, className:"grid size-8 place-items-center rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/40"}, e(Ph,{n:"x", s:14}))); })
        : e("p",{className:"rounded-lg bg-black/20 px-3 py-3 text-center text-[13px] text-white/80"}, "Nenhuma parcela — use “+ Parcela” ou divida o saldo em Nx."),
      e("div",{className:"flex flex-wrap items-center justify-between gap-2 text-[13.5px]"}, e("span",null, nPar+" parcela(s) · alocado ", e("b",{className:MONO}, brl(aloc)), " de "+brl(alvo)),
        e("b",{style:tom(Math.abs(rest)<0.005 ? "green" : rest<0 ? "red" : "orange")}, Math.abs(rest)<0.005 ? "fecha certo ✓" : rest<0 ? "excede em "+brl(-rest) : "faltam "+brl(rest))));
  };
  var salvar = function(){
    var linhas = (X.com>0.005 ? ped.lcom : []).concat(X.sem>0.005 ? ped.lsem : []);
    var ok = grava(c, "pedido_add", {fornId:ped.fornId, numero:ped.numero, data:ped.data, total:X.total, nfTipo:ped.nf, comNF:X.com, semNF:X.sem, cnpj:ped.cnpj, nfNum:ped.nfNum, linhas:linhas, descricao:ped.descricao, limite:ped.limite, pixMin:ped.pixMin});
    if(ok) fechar();
  };
  var addRapido = function(){
    var nome = String(ped.nomeNovo||"").trim(); if(!nome){ aviso(c, "Informe o nome do fornecedor.", "alerta"); return; }
    var a = {type:"PF", op:"forn_add", por:c.por, nome:nome, cat:ped.catNovo, rapido:true}, r = pfReduz(c.s, a);
    if(!(r.patch && r.patch.pf)){ aviso(c, r.msg, "alerta"); return; }
    var novo = r.patch.pf.fornecedores.find(function(f){ return f.nome===nome; });
    c.d(a); p.setPed(Object.assign({}, ped, {nova:false, nomeNovo:"", fornId:novo ? novo.id : ped.fornId}));
  };
  var selForn = function(v){ if(v==="__novo") p.setPed(Object.assign({}, ped, {nova:true, nomeNovo:""})); else p.setPed(Object.assign({}, ped, {nova:false, fornId:parseInt(v)})); };
  return e(Modal,{largo:true, t:"Lançar pedido", sub:"Pedido, divisão de NF e parcelas de cada parte — tudo em um lançamento só.", fechar:fechar},
    e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-4"},
      e(Campo,{rot:"Fornecedor"}, e(Sel2,{value:ped.nova ? "__novo" : String(ped.fornId), onChange:selForn, forns:pf.fornecedores})),
      e(Campo,{rot:"Nº do pedido"}, e(Txt,{value:ped.numero, ph:"Ex.: 31568", label:"Nº do pedido", onChange:function(v){ upd({numero:v}); }})),
      e(Campo,{rot:"Data do pedido"}, e(Txt,{type:"date", value:ped.data, label:"Data do pedido", onChange:function(v){ upd({data:v}); }})),
      e(Campo,{rot:"Valor total (R$)"}, e(Txt,{type:"number", value:ped.total, label:"Valor total", onChange:function(v){ upd({total:v}); }}))),
    ped.nova && e("div",{className:"flex flex-wrap items-center gap-2 rounded-xl bg-muted/30 p-3"},
      e("input",{value:ped.nomeNovo, placeholder:"Nome do novo fornecedor", "aria-label":"Nome do novo fornecedor", autoFocus:true, className:INPUT+" h-10! min-w-[220px] flex-1", onChange:function(ev){ p.setPed(Object.assign({}, ped, {nomeNovo:ev.target.value})); }, onKeyDown:function(ev){ if(ev.key==="Enter") addRapido(); }}),
      e("select",{value:ped.catNovo, "aria-label":"Categoria", className:INPUT+" h-10! cursor-pointer", onChange:function(ev){ p.setPed(Object.assign({}, ped, {catNovo:ev.target.value})); }}, FORN_CATS.map(function(k){ return e("option",{key:k}, k); })),
      e(Btn,{onClick:addRapido}, "Adicionar"),
      e(Btn,{neutro:true, onClick:function(){ p.setPed(Object.assign({}, ped, {nova:false})); }}, "Cancelar")),
    ehPrestador(forn(pf, ped.fornId)) && !ped.nova && e("div",{className:"flex flex-col gap-3 rounded-xl bg-[#3B82F6]/10 p-3 ring-1 ring-[#3B82F6]/40"},
      Rot("Negociação do prestador"),
      e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"},
        e(Campo,{rot:"Pagar até (data limite)"}, e(Txt,{type:"date", value:ped.limite, label:"Data limite", onChange:function(v){ upd({limite:v}); }})),
        e(Campo,{rot:"Valor mínimo de cada pix (R$)"}, e(Txt,{type:"number", value:ped.pixMin, label:"Valor mínimo de pix", onChange:function(v){ upd({pixMin:v}); }})))),
    e(Campo,{rot:"O que estamos pagando (itens e combinado — aparece em Ver negociação)"}, e(Txt,{value:ped.descricao, ph:"Ex.: 3 refis de tinta + 9 bolsas de tinta, combinado R$ 3.600,00", label:"Resumo da negociação", onChange:function(v){ upd({descricao:v}); }})),
    Rot("Divisão da nota fiscal"),
    e("div",{className:"grid grid-cols-1 gap-1.5 sm:grid-cols-3"}, NF_SEG.map(function(x){ var on = ped.nf===x[0];
      return e("button",{key:x[0], type:"button", onClick:function(){ setNF(x[0]); }, className:"rounded-lg px-3 py-2.5 text-[14px] font-bold "+(on ? "bg-linear-to-r from-[#B8862B] to-[#E8B84B] text-[#1B1409]" : "bg-muted/50 text-white hover:bg-white/15")}, x[1]); })),
    e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-4"},
      e(Campo,{rot:"Valor com NF (R$)"}, e(Txt,{type:"number", value:vCom, disabled:!misto, label:"Valor com NF", onChange:function(v){ var y = dividirNF("misto", ped.total, "com", v, ped.sem); upd({editado:"com", com:v, sem:y.sem.toFixed(2)}); }})),
      e(Campo,{rot:"Valor sem NF (R$)"}, e(Txt,{type:"number", value:vSem, disabled:!misto, label:"Valor sem NF", onChange:function(v){ var y = dividirNF("misto", ped.total, "sem", ped.com, v); upd({editado:"sem", sem:v, com:y.com.toFixed(2)}); }})),
      e(Campo,{rot:"CNPJ faturado (parte com NF)"}, e(Sl,{value:ped.cnpj, label:"CNPJ faturado", onChange:function(v){ upd({cnpj:v}); }}, CNPJS.map(function(k){ return e("option",{key:k}, k); }))),
      e(Campo,{rot:"Nº da nota fiscal"}, e(Txt,{value:X.com>0.005 ? ped.nfNum : "", disabled:X.com<=0.005, ph:"Ex.: 12345", label:"Nº da nota fiscal", onChange:function(v){ upd({nfNum:v}); }}))),
    e("div",{className:"flex flex-col gap-1.5 rounded-xl bg-black/20 px-4 py-3"},
      AL("Com NF — pagável por boleto, pix empresa ou cartão", brl(X.com), null, "a"), AL("Sem NF — pagável por pix revendedora", brl(X.sem), null, "b"),
      e("div",{className:"mt-1 border-t border-border pt-2"}, AL("Diferença em relação ao valor do pedido", X.fecha ? "fecha certo ✓" : brl(X.dif), tom(X.fecha ? "green" : "red"), "c"))),
    parte("com"), parte("sem"),
    e("div",{className:"flex justify-end gap-2 pt-1"}, e(Btn,{g:true, neutro:true, onClick:fechar}, "Cancelar"), e(Btn,{g:true, onClick:salvar}, "Salvar pedido e parcelas")));
}
// seletor de fornecedor com a última opção "+ Novo fornecedor…"
function Sel2(p){ return e("select",{value:p.value, "aria-label":"Fornecedor", className:INPUT+" h-10! w-full cursor-pointer", onChange:function(ev){ p.onChange(ev.target.value); }},
  p.forns.map(function(f){ return e("option",{key:f.id, value:String(f.id)}, f.nome); }), e("option",{value:"__novo"}, "+ Novo fornecedor…")); }

// ───────────────── Janela: Lançar parcela ─────────────────
function JanelaParcela(p){
  var c = p.c, pf = p.pf, pc = p.parc, pd = pf.pedidos.find(function(x){ return x.id===pc.pedId; });
  var set = function(patch){ p.setParc(Object.assign({}, pc, patch)); };
  var fechar = function(){ p.setParc(null); };
  if(!pd){ return null; }
  var f = forn(pf, pd.fornId), fs = formasDoPedido(pd), F = FORMAS[pc.forma], sd = pc.forma ? saldoParcela(pf, pc.pedId, pc.forma, pc.valor, pc.qtd) : null;
  var salvar = function(){
    if(grava(c, "parcela_add", {pedId:pc.pedId, forma:pc.forma, venc:pc.venc, valor:pc.valor, qtd:pc.qtd, conta:pc.conta, status:pc.status})){ fechar(); if(pc.voltar) p.voltarDet(pc.pedId); }
  };
  var unit = parseFloat(pc.valor) || 0;
  return e(Modal,{t:"Lançar parcela", sub:(f ? f.nome : "—")+" · Pedido "+pd.numero+" · total "+brl(pd.total), fechar:fechar},
    e(Campo,{rot:"Forma de pagamento"}, e(Sl,{value:pc.forma, label:"Forma de pagamento", onChange:function(v){ set({forma:v, qtd:v==="cartao" ? pc.qtd : "1"}); }}, fs.map(function(k){ return e("option",{key:k, value:k}, FORMAS[k].label+" — "+NF_LABEL[FORMAS[k].nf]); }))),
    e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-3"},
      e(Campo,{rot:"Vencimento (1ª parcela)"}, e(Txt,{type:"date", value:pc.venc, label:"Vencimento", onChange:function(v){ set({venc:v}); }})),
      e(Campo,{rot:"Valor de cada parcela (R$)"}, e(Txt,{type:"number", value:pc.valor, label:"Valor de cada parcela", onChange:function(v){ set({valor:v}); }})),
      e(Campo,{rot:"Nº de parcelas (cartão)"}, e(Txt,{type:"number", value:pc.qtd, disabled:pc.forma!=="cartao", label:"Nº de parcelas", onChange:function(v){ set({qtd:v}); }}))),
    e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"},
      e(Campo,{rot:"Conta / bandeira"}, e(Txt,{value:pc.conta, ph:"Ex.: Sicredi 34 · Máquina Cielo · Mastercard", label:"Conta / bandeira", onChange:function(v){ set({conta:v}); }})),
      e(Campo,{rot:"Status"}, e(Sl,{value:pc.status, label:"Status", onChange:function(v){ set({status:v}); }}, e("option",{value:"Pendente"}, "Pendente"), e("option",{value:"Pago"}, "Pago")))),
    sd && F && e("div",{className:"flex flex-col gap-1.5 rounded-xl bg-black/20 px-4 py-3"},
      AL("Parte "+NF_LABEL[F.nf].toLowerCase()+" do pedido", brl(sd.alvo), null, "a"), AL("Já alocado em parcelas", brl(sd.usado), null, "b"),
      AL(sd.qtd>1 ? "Este lançamento ("+sd.qtd+"x de "+brl(unit)+")" : "Este lançamento", brl(sd.val), null, "c"),
      e("div",{className:"mt-1 border-t border-border pt-2"}, AL("Saldo restante desta parte", sd.fecha ? "fecha certo ✓" : brl(sd.sobra), tom(sd.fecha ? "green" : sd.sobra<0 ? "red" : "orange"), "d"))),
    e("div",{className:"flex justify-end gap-2 pt-1"}, e(Btn,{g:true, neutro:true, onClick:fechar}, "Cancelar"), e(Btn,{g:true, onClick:salvar}, "Lançar parcela")));
}

// ───────────────── Janela: detalhe do pedido ─────────────────
function JanelaDetalhe(p){
  var c = p.c, D = pedidoDetalhe(p.c.pf, p.id);
  if(!D) return null;
  var pd = D.pd, f = D.forn;
  var excluir = function(){
    if(!window.confirm("Excluir este pedido e todas as suas parcelas? A conta do fornecedor será recalculada.")) return;
    p.fechar(); opc(c, "pedido_del", {id:pd.id});
  };
  var nfChip = pd.nfTipo==="com" ? e(Chip,{cor:"blue"}, "Todo com NF") : pd.nfTipo==="sem" ? e(Chip,{cor:"orange"}, "Todo sem NF") : e(Chip,{cor:"yellow"}, "Parte com / parte sem NF");
  var lin = function(rot, a, de, rest, k){ var fecha = Math.abs(rest)<0.005; return e("div",{key:k, className:"flex flex-wrap items-center justify-between gap-2 text-[13.5px]"}, e("span",{className:"text-white/90"}, rot), e("b",{className:MONO, style:tom(fecha ? "green" : "orange")}, brl(a)+" de "+brl(de)+(fecha ? " ✓" : " · faltam "+brl(rest)))); };
  return e(Modal,{largo:true, t:(f ? f.nome : "—")+" · Pedido "+pd.numero, sub:dbr(pd.data)+" · "+pd.cnpj+(pd.nfNum ? " · NF "+pd.nfNum : ""), fechar:p.fechar},
    e("div",{className:"flex"}, nfChip),
    (pd.descricao || pd.limite || pd.pixMin) && e("div",{className:"flex flex-col gap-1.5 rounded-xl bg-[#3B82F6]/10 px-4 py-3 ring-1 ring-[#3B82F6]/40"},
      Rot("O que estamos pagando"),
      pd.descricao && e("p",{className:"text-[14px] text-white"}, pd.descricao),
      pd.limite && AL("Pagar até", dbr(pd.limite), null, "l"), pd.pixMin>0 && AL("Valor mínimo de cada pix", brl(pd.pixMin), null, "m")),
    e("div",{className:"grid grid-cols-2 gap-2 lg:grid-cols-5"},
      e(Tile,{t:"Valor do pedido", v:brl(pd.total), cor:"#fff"}), e(Tile,{t:"Com NF", v:brl(pd.comNF), cor:COR.blue}), e(Tile,{t:"Sem NF", v:brl(pd.semNF), cor:COR.orange}),
      e(Tile,{t:"Já pago", v:brl(D.pago), cor:COR.green}), e(Tile,{t:"Em aberto", v:brl(D.aberto), cor:D.aberto>0.005 ? COR.red : "#fff"})),
    e("div",{className:"flex flex-col gap-1.5 rounded-xl bg-black/20 px-4 py-3"},
      lin("Parcelas alocadas na parte com NF — boleto · pix empresa · cartão", D.comAloc, pd.comNF, D.restCom, "a"), lin("Parcelas alocadas na parte sem NF — pix revendedora", D.semAloc, pd.semNF, D.restSem, "b")),
    Rot("Parcelas"),
    Rolagem([
      e("thead",{key:"h"}, e("tr",null, th("Nº"), th("Forma"), th("NF"), th("Vencimento"), th("Conta / bandeira"), th("Valor", TN), th("Status"), th(" "))),
      e("tbody",{key:"b"}, D.parcelas.length ? D.parcelas.map(function(x){
        return e("tr",{key:x.i, className:LIN+(x.registro ? " opacity-90" : "")},
          e("td",{className:TD}, x.i+1), e("td",{className:TD}, e(Chip,{cor:x.forma.cor}, x.forma.label)), e("td",{className:TD+" "+MUTED}, x.nfLabel), e("td",{className:TD}, dbr(x.p.venc)), e("td",{className:TD+" "+MUTED}, x.p.conta || "—"),
          e("td",{className:NUM}, brl(x.p.valor)), e("td",{className:TD}, x.registro ? e(Chip,{cor:"gray"}, "Registro") : e(Chip,{cor:x.p.status==="Pago" ? "green" : "orange"}, x.p.status)),
          e("td",{className:TD}, x.registro ? e("span",{className:"text-[13px] "+MUTED}, "sem baixa") : e(Btn,{perigo:x.p.status==="Pago", disabled:!c.edita, onClick:function(){ p.baixa(pd.id, x.i); }}, x.p.status==="Pago" ? "Estornar" : "Dar baixa"))); })
        : e("tr",null, e("td",{colSpan:8, className:"px-3 py-4 text-center text-[13.5px] "+MUTED}, "Nenhuma parcela lançada neste pedido.")))]),
    e("div",{className:"flex flex-wrap items-center gap-2 pt-1"},
      e(Btn,{g:true, perigo:true, ic:"trash", disabled:!c.edita, onClick:excluir, className:"mr-auto"}, "Excluir pedido"),
      e(Btn,{g:true, ic:"plus", disabled:!c.edita, onClick:function(){ p.lancar(pd.id); }}, "Lançar parcela"), e(Btn,{g:true, neutro:true, onClick:p.fechar}, "Fechar")));
}

// ───────────────── Janela: Datas limite de pagamento ─────────────────
function JanelaAcerto(p){
  var c = p.c, pf = p.pf, ac = p.ac, f = forn(pf, ac.fornId), fechar = function(){ p.setAc(null); };
  if(!f) return null;
  var set = function(blocos, custom){ p.setAc(Object.assign({}, ac, {blocos:blocos, custom:!!custom})); };
  var validos = ac.blocos.filter(function(b){ return b.fim && b.limite; });
  var R = acertoResumo(pf, ac.fornId, ac.mes, ac.blocos);
  var ativo = ac.custom ? "custom" : acertoPresetAtivo(pf, ac.fornId, ac.mes, validos);
  var ordem = ac.blocos.map(function(b, i){ return {b:b, i:i}; }).filter(function(x){ return x.b.fim && x.b.limite; }).sort(function(a, b){ return a.b.fim.localeCompare(b.b.fim); });
  var somaDe = function(i){ var k = ordem.findIndex(function(x){ return x.i===i; }); return k>=0 && R.blocos[k] ? R.blocos[k].total : null; };
  var presets = [["mensal","Data única","último dia do mês"],["d15","A cada 15 dias","2 acertos"],["d10","A cada 10 dias","3 acertos"],["custom","Personalizado","datas manuais"]];
  var escolhe = function(r){ if(r==="custom"){ set(ac.blocos, true); return; } set(acertoPreset(pf, ac.fornId, ac.mes, r), false); };
  var edita = function(i, campo, v){ set(ac.blocos.map(function(b, j){ if(j!==i) return b; var y = Object.assign({}, b); y[campo] = v; return y; }), false); };
  var u = diaISO(ac.mes, ultDia(ac.mes));
  var salvar = function(){ if(grava(c, "acerto_set", {fornId:ac.fornId, mes:ac.mes, blocos:validos})) fechar(); };
  var voltar = function(){ opc(c, "acerto_reset", {fornId:ac.fornId, mes:ac.mes}); fechar(); };
  return e(Modal,{t:"Datas limite — "+mesLabel(ac.mes+"-01"), sub:f.nome+" · padrão do cadastro: "+cicloLabel(f)+(temOverride(pf, ac.fornId, ac.mes) ? " · este mês tem datas próprias" : ""), fechar:fechar},
    Rot("Como dividir o pagamento deste mês"),
    e("div",{className:"grid grid-cols-2 gap-1.5 sm:grid-cols-4"}, presets.map(function(x){ var on = ativo===x[0];
      return e("button",{key:x[0], type:"button", onClick:function(){ escolhe(x[0]); }, className:"flex flex-col items-center rounded-lg px-2 py-2 text-[14px] font-bold "+(on ? "bg-linear-to-r from-[#B8862B] to-[#E8B84B] text-[#1B1409]" : "bg-muted/50 text-white hover:bg-white/15")}, x[1], e("span",{className:"text-[12px] font-normal opacity-85"}, x[2])); })),
    e("div",{className:"flex flex-col gap-2 rounded-xl bg-muted/25 p-3"},
      e("div",{className:"grid grid-cols-[1fr_1fr_.8fr_2rem] gap-2 px-1 text-[11px] font-bold uppercase tracking-wide text-white/80"}, e("span",null, "Fecha as parcelas até"), e("span",null, "Pagar até (data limite)"), e("span",{className:"text-right"}, "Somatório"), e("span",null)),
      ac.blocos.map(function(b, i){ var sm = somaDe(i);
        return e("div",{key:i, className:"grid grid-cols-[1fr_1fr_.8fr_2rem] items-center gap-2"},
          e(In,{type:"date", value:b.fim, label:"Fecha as parcelas até", onChange:function(v){ edita(i, "fim", v); }}), e(In,{type:"date", value:b.limite, label:"Data limite", onChange:function(v){ edita(i, "limite", v); }}),
          e("span",{className:MONO+" text-right text-[13.5px] font-semibold", style:sm!==null && sm>0.005 ? null : {color:"rgba(255,255,255,.5)"}}, sm!==null ? brl(sm) : "—"),
          e("button",{type:"button", "aria-label":"Remover data", onClick:function(){ set(ac.blocos.filter(function(x, j){ return j!==i; }), false); }, className:"grid size-8 place-items-center rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/40"}, e(Ph,{n:"x", s:14}))); }),
      e("div",null, e(Btn,{ic:"plus", neutro:true, onClick:function(){ set(ac.blocos.concat([{fim:u, limite:u}]), false); }}, "Adicionar data"))),
    e("div",{className:"flex flex-col gap-1.5 rounded-xl bg-black/20 px-4 py-3"},
      AL("Parcelas sem NF em "+mesLabel(ac.mes+"-01")+" (com NF não entra no acerto)", brl(R.totalMes), null, "a"),
      AL("Distribuído nos acertos acima", brl(R.alocado)+(R.fecha ? " ✓" : ""), tom(R.fecha ? "green" : "orange"), "b"),
      R.semDatas && e("p",{className:"text-[13.5px] font-semibold", style:tom("orange")}, "Sem nenhuma data definida — adicione ao menos uma.")),
    e("p",{className:"text-[12.5px] text-white/80"}, "Cada acerto soma as parcelas sem NF que vencem até a data da coluna “fecha as parcelas até”. O que é faturado com NF não entra aqui. O último acerto sempre recolhe o que sobrar do mês."),
    e("div",{className:"flex flex-wrap items-center justify-end gap-2 pt-1"},
      temOverride(pf, ac.fornId, ac.mes) && e(Btn,{g:true, neutro:true, disabled:!c.edita, onClick:voltar, className:"mr-auto"}, "Voltar ao padrão do fornecedor"),
      e(Btn,{g:true, neutro:true, onClick:fechar}, "Cancelar"), e(Btn,{g:true, disabled:!c.edita, onClick:salvar}, "Salvar datas")));
}

export { AbaPfNeg };

// Sorelly Admin · montagem — pages/pf/Maquininha.js
// Maquininha Banho (Pagamentos a Fornecedores): vendas passadas nas maquininhas do banho; o líquido volta como desconto parcelado, abatido nas dezenas de pagamento.
// Igual ao HTML original (v-maquininha): mês, totais, fechamento, desconto do mês, relação de descontos, passadas, envio de listagem e as janelas (passada, retorno, personalizar, baixa).
// Contas e regras ficam em domain/pf.js; aqui só desenho e chamo as ações.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { FORN_CATS, MQ_MAQUINAS, diaISO, hojeIso, mesAtual, mesCurto, mesLabel, mesMais, mqBaixado, mqBaixasDoMes, mqBruto, mqCandidatas, mqColunas, mqDescontoNoMes, mqDisponivel, mqDistribuicao, mqDistribuido, mqEhAuto, mqLinhas, mqManualNaJanela, mqMesesDesconto, mqMesesSel, mqOrdinal, mqOrigensDoMes, mqParcela, mqPassadasDoMes, mqPreviewDist, mqPreviewFech, mqSobra, mqSomaPassadas, pagoPix, excedenteJanela, janelaPorChave, pfReduz, ultDia } from "@/apps/montagem/domain/pf";
import { Campo, Chip, COR, Modal, Sel, Txt, aviso, brl, dbr, fmtN, op, th, TD, usePf } from "@/apps/montagem/pages/pf/ui";
import { abrirHtml, baixarHtml, copiar, htmlListagemMq, mqeGrupos, mqeLink, mqeMensagem, mqeNomeArq } from "@/apps/montagem/pages/pf/mq-extrato";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { Dinheiro } from "@/apps/montagem/components/padrao";
import { e, useState } from "@/shared/react";

var BTN = "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg bg-muted/50 px-3 text-[13px] font-bold text-white hover:bg-white/15";
var PRIM = "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg bg-linear-to-r from-[#C2410C] via-[#F97316] to-[#FED7AA] px-3 text-[13px] font-bold text-white hover:brightness-110";
var PERIGO = "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg bg-destructive/20 px-3 text-[13px] font-bold text-destructive hover:bg-destructive/30";
var HINT = "rounded-xl bg-black/20 px-3 py-2 text-[12.5px] text-white/80";
var BANDEIRAS = ["MASTERCARD","VISA","ELO","HIPERCARD","AMEX","OUTRA"];
var PARCELAS = ["DÉBITO"].concat(Array.from({length:12}, function(_, i){ return (i+1)+"x"; }));
var VERDE = COR.green, VERM = COR.red, LARA = COR.orange;

// roda uma ação do domínio; só fecha a janela (depois) quando o domínio aceitou. Pergunta quando o domínio pede confirmação.
function tenta(c, nome, extra, depois){
  var a = Object.assign({type:"PF", op:nome, por:c.por}, extra), r = pfReduz(c.s, a);
  if(r.confirmar){ if(!window.confirm(r.msg+" Continuar mesmo assim?")) return; a.forcar = true; r = pfReduz(c.s, a); }
  c.d(a);
  if(r.patch && r.patch.pf && depois) depois();
}
function Barra(p){ return e("div",{className:"h-2 overflow-hidden rounded-full bg-black/30"}, e("i",{className:"block h-full rounded-full", style:{width:Math.max(0, Math.min(p.pct, 100))+"%", background:p.ok ? VERDE : LARA}})); }
function Stat(p){
  return e("div",{className:"flex flex-col gap-0.5 rounded-xl px-3 py-2", style:{background:"linear-gradient(135deg,"+p.cor+"33,var(--card) 70%)", boxShadow:"inset 0 0 0 1px "+p.cor+"66"}},
    e("span",{className:"text-[10.5px] font-bold uppercase tracking-[.12em] text-white"}, p.t),
    e("b",{className:MONO+" text-[18px] leading-tight", style:{color:p.vc}}, p.v),
    p.barra,
    e("span",{className:"truncate text-[11px] text-white/80"}, p.sub));
}
function Trio(p){ return e("div",{className:"grid grid-cols-3 gap-2"}, p.itens.map(function(x){ return e("div",{key:x[0], className:"flex flex-col items-center rounded-xl bg-black/25 px-2 py-2 text-center"}, e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-white/80"}, x[0]), e("b",{className:MONO+" text-[15px]", style:{color:x[2]}}, x[1])); })); }
function CartaoMq(p){ return e("div",{className:"flex flex-col gap-3 rounded-2xl bg-linear-to-br from-[#3B82F6]/15 via-card to-card p-4 "+(p.soon ? "ring-2 ring-[#3B82F6]/70" : "ring-1 ring-[#3B82F6]/35")}, p.children); }
function Topo(p){ return e("div",{className:"flex flex-wrap items-center justify-between gap-2"}, e("h3",{className:"font-heading text-[16px] font-bold"}, p.t), p.chip); }
function Linha(p){ return e("div",{className:"flex items-center justify-between gap-2 rounded-lg bg-black/20 px-3 py-1.5 text-[13px]"}, e("span",{className:"flex flex-wrap items-center gap-1.5"}, p.l), e("b",{className:MONO, style:{color:p.cor||VERDE}}, p.v)); }

// ───────────────── janela: lançar / editar passada ─────────────────
function ModalPassada(p){
  var pf = p.pf, ed = p.id ? pf.mqPassadas.find(function(x){ return x.id===p.id; }) : null;
  var st = useState({data:ed ? ed.data : (p.mes===mesAtual() ? hojeIso() : diaISO(p.mes,1)), rev:ed ? ed.rev : "", valor:ed ? String(ed.valor) : "", band:ed ? ed.band : "MASTERCARD", parc:ed ? ed.parc : "1x", maq:ed ? ed.maq : MQ_MAQUINAS[0]}), f = st[0], set = st[1];
  var up = function(k){ return function(v){ var n = Object.assign({}, f); n[k] = v; set(n); }; };
  var maqs = MQ_MAQUINAS.slice(); if(ed && ed.maq && maqs.indexOf(ed.maq)<0) maqs.push(ed.maq);
  var salvar = function(){ tenta(p.c, ed ? "mq_passada_set" : "mq_passada_add", ed ? {id:ed.id, patch:f} : f, function(){ p.setMes(f.data.slice(0,7)); p.fechar(); }); };
  var excluir = function(){ if(!window.confirm("Excluir a passada de "+brl(ed.valor)+" de "+ed.rev+"?")) return; tenta(p.c, "mq_passada_del", {id:ed.id}, p.fechar); };
  return e(Modal,{t:ed ? "Editar passada" : "Lançar passada na maquininha", sub:ed ? "Competência de "+mesLabel(ed.data.slice(0,7)+"-01") : "Entra na competência de "+mesLabel(p.mes+"-01")+" conforme a data lançada", fechar:p.fechar},
    e("div",{className:"grid grid-cols-1 gap-3 md:grid-cols-2"},
      e(Campo,{rot:"Data"}, e(Txt,{type:"date", value:f.data, label:"Data", onChange:up("data")})),
      e(Campo,{rot:"Nome da revendedora"}, e(Txt,{value:f.rev, ph:"Ex.: Ana Paula de Lima", label:"Nome da revendedora", onChange:up("rev")})),
      e(Campo,{rot:"Valor (R$)"}, e(Dinheiro,{out:"ponto", value:f.valor, label:"Valor", onChange:up("valor")})),
      e(Campo,{rot:"Bandeira"}, e(Sel,{value:f.band, label:"Bandeira", className:"w-full", onChange:up("band")}, BANDEIRAS.map(function(b){ return e("option",{key:b}, b); }))),
      e(Campo,{rot:"Parcela"}, e(Sel,{value:f.parc, label:"Parcela", className:"w-full", onChange:up("parc")}, PARCELAS.map(function(b){ return e("option",{key:b}, b); }))),
      e(Campo,{rot:"Maquininha"}, e(Sel,{value:f.maq, label:"Maquininha", className:"w-full", onChange:up("maq")}, maqs.map(function(b){ return e("option",{key:b}, b); })))),
    e("p",{className:HINT}, "A soma das passadas do mês vira o ", e("b",null, "Valor total"), " da competência na relação de descontos."),
    e("div",{className:"flex flex-wrap items-center justify-end gap-2"},
      ed && e("button",{type:"button", onClick:excluir, className:PERIGO+" mr-auto"}, e(Ph,{n:"trash", s:15}), "Excluir passada"),
      e("button",{type:"button", onClick:p.fechar, className:BTN}, "Cancelar"),
      e("button",{type:"button", onClick:salvar, className:PRIM}, "Salvar passada")));
}

// ───────────────── janela: retorno do fornecedor (fechamento do mês) ─────────────────
function ModalFech(p){
  var pf = p.pf, mes = p.mes, fe = pf.mqFech[mes], soma = mqSomaPassadas(pf, mes);
  var st = useState({bruto:fe ? String(fe.bruto) : (soma>0 ? soma.toFixed(2) : ""), liq:fe ? String(fe.liquido) : "", parc:fe ? String(fe.parcelas) : "3"}), f = st[0], set = st[1];
  var up = function(k){ return function(v){ var n = Object.assign({}, f); n[k] = v; set(n); }; };
  var pv = mqPreviewFech(pf, mes, f.bruto, f.liq, f.parc);
  var salvar = function(){ tenta(p.c, "mq_fech_set", {mes:mes, bruto:f.bruto, liquido:f.liq, parcelas:f.parc}, function(){ p.setMes(mes); p.fechar(); }); };
  var apagar = function(){ if(!window.confirm("Apagar o retorno de "+mesLabel(mes+"-01")+"? As parcelas deste mês somem da relação.")) return; tenta(p.c, "mq_fech_del", {mes:mes}, p.fechar); };
  return e(Modal,{t:"Retorno do fornecedor — "+mesLabel(mes+"-01"), sub:"Soma das passadas lançadas no mês: "+brl(soma)+". Informe o que o fornecedor devolveu já sem as taxas e a média de parcelamento.", fechar:p.fechar},
    e("div",{className:"grid grid-cols-1 gap-3 md:grid-cols-3"},
      e(Campo,{rot:"Valor total passado (R$)"}, e(Txt,{type:"number", value:f.bruto, label:"Valor total passado", onChange:up("bruto")})),
      e(Campo,{rot:"Valor líquido informado (R$)"}, e(Txt,{type:"number", value:f.liq, label:"Valor líquido informado", onChange:up("liq")})),
      e(Campo,{rot:"Média de parcelamento (Nx)"}, e(Txt,{type:"number", value:f.parc, label:"Média de parcelamento", onChange:up("parc")}))),
    e("div",{className:"flex flex-col gap-1.5 rounded-xl bg-black/20 p-3"},
      !pv ? e("span",{className:"text-[13px] text-white/80"}, "Preencha o líquido e a média de parcelamento para ver a distribuição.") : [
        e(Linha,{key:"t", l:"Taxas retidas", cor:pv.taxas>=0 ? VERM : LARA, v:brl(pv.taxas)+(pv.taxaPct!=null ? " · "+pv.taxaPct.toFixed(2).replace(".",",")+"%" : "")}),
        e(Linha,{key:"p", l:"Valor de cada parcela", cor:"#fff", v:brl(pv.parcela)})
      ].concat(pv.meses.map(function(m){ return e(Linha,{key:m.mes, l:[e("span",{key:"a"}, m.i+"ª parcela · "+mesLabel(m.mes+"-01")), e("span",{key:"b", className:"text-[11.5px] text-white/70"}, "total do mês com as demais competências: "+brl(m.totalMes))], v:brl(pv.parcela)}); }))),
    e("p",{className:HINT}, "O líquido é dividido em parcelas iguais e começa a ser descontado ", e("b",null, "no mês seguinte"), " à competência."),
    e("div",{className:"flex flex-wrap items-center justify-end gap-2"},
      fe && e("button",{type:"button", onClick:apagar, className:PERIGO+" mr-auto"}, e(Ph,{n:"trash", s:15}), "Apagar retorno"),
      e("button",{type:"button", onClick:p.fechar, className:BTN}, "Cancelar"),
      e("button",{type:"button", onClick:salvar, className:PRIM}, "Salvar retorno")));
}

// ───────────────── janela: personalizar o desconto (dezena por dezena) ─────────────────
function ModalDist(p){
  var pf = p.pf, mes = p.mes, disp = mqDisponivel(pf, mes), fn = pf.fornecedores.find(function(x){ return x.id===pf.mqFornId; });
  var ini = mqDistribuicao(pf, mes).map(function(d){ return {chave:d.chave, valor:d.valor ? d.valor.toFixed(2) : ""}; });
  var st = useState(ini.length ? ini : [{chave:"", valor:disp ? disp.toFixed(2) : ""}]), ls = st[0], set = st[1];
  var mexe = function(i, k, v){ set(ls.map(function(l, j){ if(j!==i) return l; var n = Object.assign({}, l); n[k] = v; return n; })); };
  var pv = mqPreviewDist(pf, mes, ls), cands = mqCandidatas(pf, mes);
  var salvar = function(){ tenta(p.c, "mq_dist_set", {mes:mes, linhas:ls}, p.fechar); };
  var auto = function(){ if(!window.confirm("Voltar o desconto de "+mesLabel(mes+"-01")+" para o automático (primeira dezena do mês)?")) return; tenta(p.c, "mq_dist_reset", {mes:mes}, p.fechar); };
  return e(Modal,{t:"Desconto de "+mesLabel(mes+"-01"), sub:"Saldo do mês: "+brl(disp)+". Escolha em quais dezenas da "+(fn ? fn.nome : "—")+" ele vai ser abatido — dá para dividir em mais de uma e usar dezenas de outros meses ainda em aberto.", fechar:p.fechar},
    e("div",{className:"flex flex-col gap-2 rounded-xl bg-black/20 p-3"},
      e("div",{className:"grid grid-cols-[1fr_9rem_2rem] gap-2 text-[11.5px] font-bold uppercase tracking-wide text-white/80"}, e("span",null, "Dezena de pagamento"), e("span",null, "Valor do desconto (R$)"), e("span")),
      ls.map(function(l, i){ return e("div",{key:i, className:"grid grid-cols-[1fr_9rem_2rem] items-center gap-2"},
        e(Sel,{value:l.chave, label:"Dezena", className:"w-full", onChange:function(v){ mexe(i,"chave",v); }}, e("option",{value:""}, "— escolher dezena —"), cands.map(function(j){
          var o = mqOrdinal(pf, j.chave), falta = j.total-pagoPix(pf, j.chave)-mqManualNaJanela(pf, j.chave, mes);
          return e("option",{key:j.chave, value:j.chave}, o.txt+" · "+mesCurto(j.mes)+" — a pagar "+brl(Math.max(falta,0))); })),
        e(Dinheiro,{out:"ponto", value:l.valor, label:"Valor do desconto", onChange:function(v){ mexe(i,"valor",v); }}),
        e("button",{type:"button", title:"Remover", "aria-label":"Remover", onClick:function(){ set(ls.filter(function(x, j){ return j!==i; })); }, className:"grid size-8 place-items-center rounded-lg bg-muted/50 text-white hover:bg-destructive/20 hover:text-destructive"}, e(Ph,{n:"x", s:14}))); }),
      e("div",null, e("button",{type:"button", onClick:function(){ set(ls.concat([{chave:"", valor:""}])); }, className:BTN}, e(Ph,{n:"plus", s:15}), "Adicionar dezena"))),
    e("div",{className:"flex flex-col gap-1.5 rounded-xl bg-black/20 p-3"},
      e(Linha,{l:"Saldo do mês", cor:"#fff", v:brl(pv.disponivel)}),
      e(Linha,{l:"Distribuído nas dezenas", v:brl(pv.distribuido)}),
      e(Linha,{l:pv.passou ? "Passou do saldo em" : "Sobra de crédito", cor:pv.passou ? VERM : LARA, v:brl(pv.diferenca)}),
      pv.linhas.map(function(l, i){ return e(Linha,{key:i, l:[e("span",{key:"a", className:"text-white/85"}, l.txt+" — fica "), l.quitada
        ? (l.sobra>0.005 ? e("span",{key:"b"}, e("b",{style:{color:VERDE}}, "quitada"), " e sobram ", e("b",{style:{color:LARA}}, brl(l.sobra))) : e("b",{key:"b", style:{color:VERDE}}, "quitada"))
        : e("span",{key:"b"}, e("b",{style:{color:VERM}}, brl(l.restante)), " em Pix")], cor:"#fff", v:brl(l.valor)}); })),
    e("p",{className:HINT}, "No automático o saldo entra na primeira dezena do mês e o que passar dela cobre a dezena seguinte. Aqui você divide como quiser — mandando parte para as dezenas seguintes ou para uma dezena de mês anterior que ficou em aberto."),
    e("div",{className:"flex flex-wrap items-center justify-end gap-2"},
      !mqEhAuto(pf, mes) && e("button",{type:"button", onClick:auto, className:BTN+" mr-auto"}, e(Ph,{n:"arrow-counter-clockwise", s:15}), "Voltar ao automático"),
      e("button",{type:"button", onClick:p.fechar, className:BTN}, "Cancelar"),
      e("button",{type:"button", onClick:salvar, className:PRIM}, "Salvar distribuição")));
}

// ───────────────── janela: baixa manual do desconto ─────────────────
function ModalBaixa(p){
  var pf = p.pf, mes = p.mes, falta = Math.max(0, mqSobra(pf, mes)), fn = pf.fornecedores.find(function(x){ return x.id===pf.mqFornId; });
  var st = useState({data:mes===mesAtual() ? hojeIso() : diaISO(mes, ultDia(mes)), valor:falta>0.005 ? falta.toFixed(2) : "", forma:"Desconto em conta", conta:"", arqNome:"", arqData:""}), f = st[0], set = st[1];
  var up = function(k){ return function(v){ var n = Object.assign({}, f); n[k] = v; set(n); }; };
  var arq = function(ev){
    var fl = ev.target.files && ev.target.files[0]; if(!fl){ set(Object.assign({}, f, {arqNome:"", arqData:""})); return; }
    var fr = new FileReader();
    fr.onload = function(){ set(function(a){ return Object.assign({}, a, {arqNome:fl.name, arqData:String(fr.result)}); }); };
    fr.onerror = function(){ window.alert("Não foi possível ler o comprovante. Será lançado sem anexo."); };
    fr.readAsDataURL(fl);
  };
  var salvar = function(){ tenta(p.c, "mq_baixa_add", {mes:mes, data:f.data, valor:f.valor, forma:f.forma, conta:f.conta, arqNome:f.arqNome, arqData:f.arqData}, function(){ p.setAberto(true); p.setMes(mes); p.fechar(); }); };
  return e(Modal,{t:"Baixa manual do desconto", sub:"Para quando o desconto não passar por uma dezena da "+(fn ? fn.nome : "conta")+". Sobra de "+mesLabel(mes+"-01")+": "+brl(falta)+" de "+brl(mqDescontoNoMes(pf, mes)), fechar:p.fechar},
    e("div",{className:"grid grid-cols-1 gap-3 md:grid-cols-2"},
      e(Campo,{rot:"Data"}, e(Txt,{type:"date", value:f.data, label:"Data", onChange:up("data")})),
      e(Campo,{rot:"Valor (R$)"}, e(Dinheiro,{out:"ponto", value:f.valor, label:"Valor", onChange:up("valor")})),
      e(Campo,{rot:"Forma"}, e(Sel,{value:f.forma, label:"Forma", className:"w-full", onChange:up("forma")}, ["Desconto em conta","Pix","Boleto","Outro"].map(function(x){ return e("option",{key:x}, x); }))),
      e(Campo,{rot:"Conta / observação"}, e(Txt,{value:f.conta, ph:"Ex.: Abatido no pedido 4590", label:"Conta ou observação", onChange:up("conta")}))),
    e(Campo,{rot:"Comprovante"}, e("div",{className:"flex flex-wrap items-center gap-3 rounded-xl bg-black/20 px-3 py-2"},
      e("label",{className:BTN+" cursor-pointer"}, e(Ph,{n:"paperclip", s:15}), "Selecionar arquivo", e("input",{type:"file", accept:"image/*,application/pdf", onChange:arq, className:"hidden"})),
      e("span",{className:"text-[13px] text-white/85"}, f.arqNome || "Nenhum arquivo selecionado"))),
    e("div",{className:"flex flex-wrap items-center justify-end gap-2"},
      e("button",{type:"button", onClick:p.fechar, className:BTN}, "Cancelar"),
      e("button",{type:"button", onClick:salvar, className:PRIM}, "Lançar")));
}

// ───────────────── janela: enviar listagem de cartão ao fornecedor ─────────────────
function ModalEnvio(p){
  var pf = p.pf, c = p.c, st = useState(p.mes), mes = st[0], setMes = st[1], sm = useState(""), maq0 = sm[0], setMaq = sm[1], sg = useState(null), msg = sg[0], setMsg = sg[1];
  var meses = mqMesesSel(pf, p.mes).filter(function(m){ return mqSomaPassadas(pf, m)>0.005 || m===p.mes; });
  if(meses.indexOf(mes)<0) meses = meses.concat([mes]).sort();
  var usadas = mqeGrupos(pf, mes, "").map(function(g){ return g.maq; }), maq = usadas.indexOf(maq0)>=0 ? maq0 : "";
  var gs = mqeGrupos(pf, mes, maq), tot = gs.reduce(function(s, g){ return s+g.total; }, 0), n = gs.reduce(function(s, g){ return s+g.itens.length; }, 0);
  var fn = pf.fornecedores.find(function(x){ return x.id===pf.mqFornId; }), link = mqeLink(pf, mes, maq);
  var trocaMes = function(v){ setMes(v); setMsg(null); }, trocaMaq = function(v){ setMaq(v); setMsg(null); };
  var separados = function(){
    var todos = mqeGrupos(pf, mes, ""); if(!todos.length){ aviso(c, "Nenhuma passada neste mês"); return; }
    todos.forEach(function(g, i){ setTimeout(function(){ baixarHtml(htmlListagemMq(pf, mes, g.maq), mqeNomeArq(pf, mes, g.maq)); }, i*400); });
    aviso(c, todos.length+" arquivo(s) — um por maquininha");
  };
  return e(Modal,{t:"Enviar listagem de cartão ao fornecedor", sub:[fn ? fn.nome : "Fornecedor", " · passadas de ", mesLabel(mes+"-01"), " — ", n, " passada(s), total ", brl(tot)].join(""), fechar:p.fechar},
    e("div",{className:"grid grid-cols-1 gap-3 md:grid-cols-2"},
      e(Campo,{rot:"Mês"}, e(Sel,{value:mes, label:"Mês", className:"w-full", onChange:trocaMes}, meses.map(function(m){ return e("option",{key:m, value:m}, mesLabel(m+"-01")); }))),
      e(Campo,{rot:"Maquininha"}, e(Sel,{value:maq, label:"Maquininha", className:"w-full", onChange:trocaMaq}, e("option",{value:""}, "Todas (separadas por maquininha)"), usadas.map(function(m){ return e("option",{key:m, value:m}, m); })))),
    e("div",{className:"flex flex-col gap-1.5"}, gs.length ? gs.map(function(g){ return e(Linha,{key:g.maq, l:[e("span",{key:"a"}, g.maq), e("span",{key:"b", className:"text-white/70"}, "· "+g.itens.length+" passada(s)")], cor:"#fff", v:brl(g.total)}); }) : e("span",{className:"text-[13px] text-white/80"}, "Nenhuma passada lançada neste mês.")),
    e(Campo,{rot:"Link de conferência (somente leitura)"}, e("div",{className:"flex gap-2"},
      e("input",{value:link, readOnly:true, "aria-label":"Link de conferência", className:INPUT+" h-10! min-w-0 flex-1"}),
      e("button",{type:"button", onClick:function(){ copiar(link, function(){ aviso(c, "Link copiado"); }); }, className:BTN}, e(Ph,{n:"copy", s:15}), "Copiar"))),
    e("div",{className:"flex flex-wrap gap-2"},
      e("button",{type:"button", onClick:function(){ abrirHtml(htmlListagemMq(pf, mes, maq)); }, className:BTN}, e(Ph,{n:"eye", s:15}), "Ver como o fornecedor vê"),
      e("button",{type:"button", onClick:function(){ baixarHtml(htmlListagemMq(pf, mes, maq), mqeNomeArq(pf, mes, maq)); aviso(c, "Listagem baixada"); }, className:BTN}, e(Ph,{n:"download-simple", s:15}), "Baixar HTML"),
      e("button",{type:"button", onClick:separados, className:BTN}, e(Ph,{n:"download-simple", s:15}), "Um HTML por maquininha"),
      e("button",{type:"button", onClick:function(){ setMsg(mqeMensagem(pf, mes, maq)); }, className:BTN}, e(Ph,{n:"chat-circle-text", s:15}), "Gerar mensagem"),
      msg!=null && e("button",{type:"button", onClick:function(){ copiar(msg, function(){ aviso(c, "Mensagem copiada"); }); }, className:BTN}, e(Ph,{n:"copy", s:15}), "Copiar mensagem")),
    msg!=null && e("textarea",{value:msg, rows:10, onChange:function(ev){ setMsg(ev.target.value); }, "aria-label":"Mensagem", className:INPUT+" h-auto! w-full py-2"}),
    e("p",{className:HINT}, "A página mostra só as passadas do mês escolhido, separadas por maquininha, com subtotal de cada uma e o total geral. Não dá acesso a nenhuma outra informação do sistema."),
    e("div",{className:"flex justify-end"}, e("button",{type:"button", onClick:p.fechar, className:BTN}, "Fechar")));
}

// ───────────────── tela ─────────────────
function AbaPfMaq(){
  var c = usePf(), pf = c.pf, ed = c.edita;
  var s1 = useState(mesAtual()), mes = s1[0], setMes = s1[1], s2 = useState(false), aberto = s2[0], setAberto = s2[1], s3 = useState(null), md = s3[0], setMd = s3[1], s4 = useState(null), nv = s4[0], setNv = s4[1];
  var hoje = mesAtual(), linhas = mqLinhas(pf, mes), cols = mqColunas(pf, mes);
  var totBruto = linhas.reduce(function(s, m){ return s+mqBruto(pf, m); }, 0);
  var totLiq = linhas.reduce(function(s, m){ return s+((pf.mqFech[m] && pf.mqFech[m].liquido)||0); }, 0);
  var taxas = linhas.filter(function(m){ return pf.mqFech[m]; }).reduce(function(s, m){ return s+(mqBruto(pf, m)-pf.mqFech[m].liquido); }, 0);
  // abatido = o que já virou desconto de fato (dezenas + baixa manual); aAbater = o resto do líquido, ainda sem destino
  var abatido = cols.reduce(function(s, m){ return s+Math.min(mqDescontoNoMes(pf, m), mqBaixado(pf, m)+mqDistribuido(pf, m)); }, 0);
  var aAbater = Math.max(0, totLiq-abatido), mesesSobra = cols.filter(function(m){ return mqSobra(pf, m)>0.005; }).length;
  var passMes = mqSomaPassadas(pf, mes), descMes = mqDescontoNoMes(pf, mes), baixMes = mqBaixado(pf, mes), fe = pf.mqFech[mes];
  var comFech = linhas.filter(function(m){ return mqBruto(pf, m)>0.005; }).length;
  var diverge = fe && Math.abs(fe.bruto-passMes)>0.005 && passMes>0;
  var origens = mqOrigensDoMes(pf, mes), dist = mqDistribuicao(pf, mes), distTot = mqDistribuido(pf, mes), sobra = mqSobra(pf, mes), bx = mqBaixasDoMes(pf, mes);
  var pcMes = descMes>0 ? (baixMes+distTot)/descMes*100 : 0, fn = pf.fornecedores.find(function(x){ return x.id===pf.mqFornId; });
  var excesso = dist.reduce(function(s, d){ var j = janelaPorChave(pf, d.chave); return s+(j ? excedenteJanela(pf, d.chave, j.total) : 0); }, 0);
  var ps = mqPassadasDoMes(pf, mes), todosMeses = mqMesesSel(pf, mes);
  var fechar = function(){ setMd(null); };

  var trocaForn = function(v){
    if(v==="__novo"){ setNv({nome:"", cat:"Galvânica / banho"}); return; }
    setNv(null); tenta(c, "mq_forn_set", {id:v});
  };
  var addForn = function(){
    if(Object.keys(pf.mqDist).length && !window.confirm("Trocar a conta apaga as distribuições personalizadas, que apontam para as dezenas da conta atual. Continuar?")) return;
    var novoId = pf.seq.F;
    tenta(c, "forn_add", {nome:nv.nome, cat:nv.cat, rapido:true, ciclo:{periodicidade:"mensal", cortes:[31], prazoDias:0}}, function(){ setNv(null); c.d({type:"PF", op:"mq_forn_set", por:c.por, id:novoId, forcar:true}); });
  };
  var origemTxt = origens.length ? origens.map(function(o){ return mesCurto(o.comp)+" ("+o.i+"/"+o.n+") "+brl(o.valor); }).join(" · ") : "Nenhuma competência parcelada cai neste mês.";

  var cardFech = e(CartaoMq,{key:"f", soon:!fe},
    e(Topo,{t:"Fechamento de "+mesLabel(mes+"-01"), chip:fe ? e(Chip,{cor:"green"}, "Retorno registrado") : e(Chip,{cor:"orange"}, "Aguardando retorno")}),
    e("p",{className:"text-[13px] text-white/85"}, fe ? "Taxa de "+brl(mqBruto(pf, mes)-fe.liquido)+" · média de "+fe.parcelas+"x · desconta em "+mqMesesDesconto(pf, mes).map(mesCurto).join(", ") : "O fornecedor ainda não informou o líquido e a média de parcelamento deste mês."),
    e(Trio,{itens:[["Passado", brl(mqBruto(pf, mes)), "#fff"], ["Líquido", fe ? brl(fe.liquido) : "—", fe ? VERDE : "#fff"], ["Parcela", fe ? brl(mqParcela(pf, mes)) : "—", fe ? LARA : "#fff"]]}),
    diverge && e("p",{className:"flex items-center gap-1.5 text-[12.5px] font-semibold", style:{color:LARA}}, e(Ph,{n:"warning", s:15}), "O valor total registrado difere da soma das passadas ("+brl(passMes)+")."),
    ed && e("div",{className:"flex flex-wrap gap-2"}, e("button",{type:"button", onClick:function(){ setMd({t:"fech", mes:mes}); }, className:PRIM}, e(Ph,{n:fe ? "pencil" : "plus", s:15}), fe ? "Editar retorno" : "Registrar retorno do fornecedor")));

  var cardDesc = e(CartaoMq,{key:"d", soon:descMes>0.005 && sobra>0.005},
    e(Topo,{t:"Desconto de "+mesLabel(mes+"-01"), chip:descMes<=0.005 ? e(Chip,{cor:"gray"}, "Nada a descontar") : (mqEhAuto(pf, mes) ? e(Chip,{cor:"cyan"}, "Automático") : e(Chip,{cor:"purple"}, "Personalizado"))}),
    e("p",{className:"text-[13px] text-white/85"}, origemTxt),
    e(Trio,{itens:[["A descontar", brl(descMes), "#fff"], ["Nas dezenas", brl(distTot), VERDE], ["Sobra", brl(sobra), sobra>0.005 ? LARA : "#fff"]]}),
    e(Barra,{pct:pcMes, ok:pcMes>=99.5}),
    e("div",{className:"flex flex-col gap-1.5"},
      dist.length ? dist.map(function(d){ var o = mqOrdinal(pf, d.chave); return e(Linha,{key:d.chave, l:[e("span",{key:"a"}, o.txt), o.mes!==mes && e(Chip,{key:"b", cor:"gray"}, mesCurto(o.mes))], v:brl(d.valor)}); })
        : e("p",{className:"rounded-lg bg-black/20 px-3 py-1.5 text-[13px] text-white/80"}, descMes>0.005 ? "Nenhuma dezena da "+(fn ? fn.nome : "—")+" em aberto para receber o desconto." : "Sem saldo para distribuir."),
      baixMes>0.005 && e(Linha,{l:e("span",{className:"text-white/80"}, "baixa manual"), v:brl(baixMes)}),
      excesso>0.005 && e(Linha,{l:"sobra parada na dezena", cor:LARA, v:brl(excesso)})),
    e("div",{className:"flex flex-wrap gap-2"},
      ed && e("button",{type:"button", onClick:function(){ setMd({t:"dist", mes:mes}); }, className:PRIM}, e(Ph,{n:"sliders", s:15}), "Personalizar desconto"),
      ed && !mqEhAuto(pf, mes) && e("button",{type:"button", onClick:function(){ if(window.confirm("Voltar o desconto de "+mesLabel(mes+"-01")+" para o automático (primeira dezena do mês)?")) tenta(c, "mq_dist_reset", {mes:mes}); }, className:BTN}, e(Ph,{n:"arrow-counter-clockwise", s:15}), "Voltar ao automático"),
      e("button",{type:"button", onClick:function(){ setAberto(!aberto); }, className:BTN}, aberto ? "Ocultar baixas ▲" : "Baixa manual ("+bx.length+") ▾")),
    aberto && e("div",{className:"flex flex-col gap-2 rounded-xl bg-black/25 p-3"},
      e("b",{className:"text-[12px] uppercase tracking-wide text-white"}, "Baixas manuais (fora das dezenas)"),
      ed && e("div",null, e("button",{type:"button", onClick:function(){ setMd({t:"baixa", mes:mes}); }, className:BTN}, e(Ph,{n:"plus", s:15}), "Lançar baixa manual")),
      !bx.length ? e("p",{className:"text-[13px] text-white/80"}, "Nenhuma baixa manual neste mês.")
        : bx.map(function(b){ return e("div",{key:b.id, className:"flex flex-wrap items-center justify-between gap-2 rounded-lg bg-black/20 px-3 py-1.5 text-[13px]"},
          e("span",{className:"flex flex-wrap items-center gap-x-3 gap-y-1"}, e("span",null, dbr(b.data)), e("span",{className:"text-white/80"}, b.forma), e("span",{className:"text-white/80"}, b.conta||"—"),
            b.arqData ? e("a",{href:b.arqData, target:"_blank", rel:"noreferrer", download:b.arqNome, className:"inline-flex items-center gap-1 font-semibold underline"}, e(Ph,{n:"paperclip", s:13}), "comprovante") : e("span",{className:"text-white/60"}, "sem comprovante")),
          e("span",{className:"flex items-center gap-2"}, e("b",{className:MONO, style:{color:VERDE}}, brl(b.valor)),
            ed && e("button",{type:"button", onClick:function(){ if(window.confirm("Estornar este lançamento de "+brl(b.valor)+"?")) tenta(c, "mq_baixa_del", {id:b.id}); }, className:PERIGO+" h-7! px-2!"}, "Estornar"))); })));

  var cab = [["Competência",""],["Valor total","text-right"],["Taxas","text-right"],["Líquido","text-right"],["Nº parc.","text-right"],["Valor parcela","text-right"]];
  var alto = function(m){ return m===hoje ? " bg-[#3B82F6]/15" : ""; };
  var tabela = e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"},
    e("thead",null, e("tr",null, cab.map(function(x){ return th(x[0], x[1]); }), cols.map(function(m){ return th(mesCurto(m), "text-right"+alto(m)); }), th("Total descontado","text-right"))),
    e("tbody",null,
      linhas.map(function(m){
        var f = pf.mqFech[m], br = mqBruto(pf, m), pa = mqParcela(pf, m), meses = mqMesesDesconto(pf, m);
        return e("tr",{key:m, onClick:ed ? function(){ setMd({t:"fech", mes:m}); } : undefined, className:"border-b border-border/60 "+(ed ? "cursor-pointer hover:bg-white/5" : "")},
          e("td",{className:TD}, e("b",null, mesLabel(m+"-01")), m===hoje && e("span",{className:"ml-2"}, e(Chip,{cor:"yellow"}, "mês atual"))),
          e("td",{className:TD+" text-right "+MONO}, br>0 ? fmtN(br) : "—"),
          e("td",{className:TD+" text-right "+MONO, style:{color:f ? VERM : undefined}}, f ? fmtN(br-f.liquido) : "—"),
          e("td",{className:TD+" text-right "+MONO, style:{color:f ? VERDE : undefined}}, f ? fmtN(f.liquido) : "—"),
          e("td",{className:TD+" text-right "+MONO, style:f ? undefined : {color:LARA}}, f ? f.parcelas+"x" : "lançar"),
          e("td",{className:TD+" text-right "+MONO}, f ? fmtN(pa) : "—"),
          cols.map(function(cl){ var on = meses.indexOf(cl)>=0; return e("td",{key:cl, className:TD+" text-right "+MONO+alto(cl), style:on ? undefined : {opacity:.45}}, on ? fmtN(pa) : "—"); }),
          e("td",{className:TD+" text-right "+MONO}, f ? fmtN(f.liquido) : "—")); }),
      e("tr",{key:"tot", className:"border-t-2 border-[#3B82F6]/50 bg-black/25 font-bold"},
        e("td",{className:TD}, "TOTAL A DESCONTAR POR MÊS"), e("td",{className:TD+" text-right "+MONO}, fmtN(totBruto)), e("td",{className:TD+" text-right "+MONO, style:{color:VERM}}, fmtN(taxas)), e("td",{className:TD+" text-right "+MONO, style:{color:VERDE}}, fmtN(totLiq)), e("td",{className:TD}), e("td",{className:TD}),
        cols.map(function(cl){ var v = mqDescontoNoMes(pf, cl); return e("td",{key:cl, className:TD+" text-right "+MONO+alto(cl), style:v>0.005 ? undefined : {opacity:.45}}, v>0.005 ? fmtN(v) : "—"); }),
        e("td",{className:TD+" text-right "+MONO}, fmtN(totLiq))),
      e("tr",{key:"bx", className:"bg-black/25 font-bold"},
        e("td",{className:TD}, "JÁ BAIXADO / EM ABERTO"), e("td",{className:TD+" text-[12.5px] font-normal text-white/80", colSpan:5}, "verde = desconto confirmado · vermelho = ainda em aberto"),
        cols.map(function(cl){
          var v = mqDescontoNoMes(pf, cl), b = mqBaixado(pf, cl)+mqDistribuido(pf, cl);
          if(v<=0.005) return e("td",{key:cl, className:TD+" text-right "+MONO+alto(cl), style:{opacity:.45}}, "—");
          var ok = v-b<=0.005;
          return e("td",{key:cl, className:TD+" text-right "+MONO+alto(cl), style:{color:ok ? VERDE : VERM}}, fmtN(ok ? b : v-b)); }),
        e("td",{className:TD+" text-right "+MONO, style:{color:VERDE}}, fmtN(cols.reduce(function(s, cl){ return s+mqBaixado(pf, cl)+mqDistribuido(pf, cl); }, 0)))))));

  var tabPass = e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"},
    e("thead",null, e("tr",null, th("Data"), th("Nome da revendedora"), th("Valor","text-right"), th("Bandeira"), th("Parcela"), th("Maquininha"), th(" "))),
    e("tbody",null, ps.length ? ps.map(function(x){
      return e("tr",{key:x.id, onClick:ed ? function(){ setMd({t:"passada", id:x.id}); } : undefined, className:"border-b border-border/60 "+(ed ? "cursor-pointer hover:bg-white/5" : "")},
        e("td",{className:TD}, dbr(x.data)), e("td",{className:TD}, x.rev), e("td",{className:TD+" text-right "+MONO}, fmtN(x.valor)), e("td",{className:TD}, e(Chip,{cor:"blue"}, x.band)), e("td",{className:TD}, x.parc), e("td",{className:TD+" text-white/85"}, x.maq),
        e("td",{className:TD+" text-right text-white/70"}, ed ? "editar ›" : "")); }).concat([
      e("tr",{key:"tot", className:"border-t-2 border-[#3B82F6]/50 bg-black/25 font-bold"}, e("td",{className:TD}, "TOTAL DO MÊS"), e("td",{className:TD}), e("td",{className:TD+" text-right "+MONO}, fmtN(passMes)), e("td",{className:TD, colSpan:4}))])
      : [e("tr",{key:"v"}, e("td",{className:"px-3 py-6 text-center text-[13.5px] text-white/80", colSpan:7}, "Nenhuma passada lançada em "+mesLabel(mes+"-01")+". Use “+ Lançar passada”."))])));

  return e("div",{className:"flex flex-col gap-4"},
    e("div",{className:"flex flex-wrap items-start justify-between gap-3"},
      e("div",null, e("h1",{className:"font-heading text-2xl font-bold"}, "Maquininha Banho"), e("p",{className:"max-w-3xl text-[13px] text-white/85"}, "Vendas passadas na maquininha do banho — o líquido volta como desconto parcelado, abatido automaticamente na primeira dezena de pagamento de cada mês")),
      e("div",{className:"flex flex-wrap items-center gap-2"},
        e("span",{className:"inline-flex h-9 items-center gap-1.5 rounded-lg bg-black/25 px-3 text-[13px] font-semibold"}, "Conta descontada: ", e("b",null, fn ? fn.nome : "—")),
        ed && e("button",{type:"button", onClick:function(){ setMd({t:"passada", id:null}); }, className:PRIM}, e(Ph,{n:"plus", s:15}), "Lançar passada"))),
    e("div",{className:"flex flex-wrap items-center gap-2 rounded-xl bg-linear-to-r from-[#3B82F6]/20 via-card to-card px-3 py-2 ring-1 ring-[#3B82F6]/40"},
      e("button",{type:"button", onClick:function(){ setMes(mesMais(mes,-1)); }, title:"Mês anterior", "aria-label":"Mês anterior", className:BTN}, e(Ph,{n:"caret-left", s:15})),
      e(Sel,{value:mes, label:"Mês", className:"w-60", onChange:setMes}, todosMeses.map(function(m){ return e("option",{key:m, value:m}, mesLabel(m+"-01")+(m===hoje ? " · mês atual" : "")); })),
      e("button",{type:"button", onClick:function(){ setMes(mesMais(mes,1)); }, title:"Próximo mês", "aria-label":"Próximo mês", className:BTN}, e(Ph,{n:"caret-right", s:15})),
      e("button",{type:"button", onClick:function(){ setMes(hoje); }, className:BTN}, "Mês atual"),
      e("div",{className:"ml-auto flex flex-wrap gap-x-5 gap-y-1 text-[13px]"},
        [["Passado no mês", brl(passMes), "#fff"], ["Desconto do mês", brl(descMes), LARA], ["Sobra a direcionar", brl(Math.max(0, sobra)), sobra>0.005 ? LARA : VERDE]].map(function(x){ return e("div",{key:x[0], className:"flex flex-col"}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-wide text-white/80"}, x[0]), e("b",{className:MONO, style:{color:x[2]}}, x[1])); }))),

    e("div",{className:"grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"},
      e(Stat,{t:"Total passado nas maquininhas", v:brl(totBruto), vc:"#EAB308", cor:"#EAB308", sub:comFech+" competência(s) · "+pf.mqPassadas.length+" passada(s) lançada(s)"}),
      e(Stat,{t:"Taxas retidas pelo fornecedor", v:brl(taxas), vc:VERM, cor:"#94A3B8", sub:(totBruto>0 ? (taxas/totBruto*100).toFixed(2).replace(".",",") : "0,00")+"% do que foi passado"}),
      e(Stat,{t:"Já abatido na conta", v:brl(abatido), vc:VERDE, cor:"#22C55E", barra:e(Barra,{pct:totLiq>0 ? abatido/totLiq*100 : 0, ok:totLiq>0 && abatido/totLiq>=.995}), sub:(totLiq>0 ? (abatido/totLiq*100).toFixed(0) : "0")+"% do líquido de "+brl(totLiq)}),
      e(Stat,{t:"Saldo ainda a abater", v:brl(aAbater), vc:LARA, cor:"#EF4444", sub:mesesSobra ? "sobra em "+mesesSobra+" mês(es) · use Personalizar para direcionar" : "tudo direcionado para as dezenas"})),

    e("div",{className:"grid grid-cols-1 gap-4 xl:grid-cols-2"}, cardFech, cardDesc),

    e(BlocoBarra,{cor:"azul", t:"Relação de descontos", sub:"Cada competência vira parcelas iguais nos meses seguintes · o acumulado por mês é a linha final", dir:"Saldo a abater "+brl(aAbater)},
      e("div",{className:"flex flex-col gap-2 p-3"}, tabela, e("p",{className:HINT}, "Clique na linha do mês para registrar ou corrigir o retorno do fornecedor (valor líquido e média de parcelamento). O ", e("b",null, "Valor total"), " vem das passadas lançadas no mês e pode ser ajustado no mesmo lugar."))),

    e(BlocoBarra,{cor:"azul", t:"Passadas do mês", sub:ps.length ? mesLabel(mes+"-01")+" · "+ps.length+" passada(s) · total de "+brl(passMes) : mesLabel(mes+"-01")+" · nenhuma passada lançada neste mês"},
      e("div",{className:"flex flex-col gap-2 p-3"},
        e("div",{className:"flex flex-wrap justify-end gap-2"},
          e("button",{type:"button", onClick:function(){ setMd({t:"envio"}); }, className:BTN}, e(Ph,{n:"paper-plane-tilt", s:15}), "Enviar listagem"),
          ed && e("button",{type:"button", onClick:function(){ setMd({t:"passada", id:null}); }, className:PRIM}, e(Ph,{n:"plus", s:15}), "Lançar passada")),
        tabPass)),

    md && md.t==="passada" && e(ModalPassada,{c:c, pf:pf, id:md.id, mes:mes, setMes:setMes, fechar:fechar}),
    md && md.t==="fech" && e(ModalFech,{c:c, pf:pf, mes:md.mes, setMes:setMes, fechar:fechar}),
    md && md.t==="dist" && e(ModalDist,{c:c, pf:pf, mes:md.mes, fechar:fechar}),
    md && md.t==="baixa" && e(ModalBaixa,{c:c, pf:pf, mes:md.mes, setMes:setMes, setAberto:setAberto, fechar:fechar}),
    md && md.t==="envio" && e(ModalEnvio,{c:c, pf:pf, mes:mes, fechar:fechar}));
}
export { AbaPfMaq };

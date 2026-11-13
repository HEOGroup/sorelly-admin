// Sorelly Admin · montagem — pages/ContasPagarLista.js
// Financeiro › Contas › CONTAS A PAGAR e CONTAS PAGAS (Marcus, 12/11/2026): duas telas, cada uma UMA TABELA GIGANTE (sem resumo, sem abas, sem filtros no alto: o filtro fica no nome de cada coluna).
// Um arquivo, duas telas (TelaContas, modo "pagar" ou "pagas"). Sem coluna Marcar e sem Lançar conta (Marcus, 12/11/2026); clicar na conta abre a ficha, onde se registra o pagamento. Contas pagas: Pago em e botão Desfazer.
// Representantes: a comissão e o combustível de cada representante entram somados numa linha só; clicar na linha abre cada título. Parcela escrita assim: 02/06.
// Empresa + pró-labore e retiradas juntos, como na Análise de custos. Dados do DevMaster (domain/contas-empresa.js).
import { Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { chamar } from "@/apps/montagem/lib/api";
import { FILIAIS, anosCarregados, definirHistorico, filtrar, historicoItens, meses, setBaixas, setClasse, setLancamentos, setPf, temDados } from "@/apps/montagem/domain/contas-empresa";
import { hojeIso, hojeYm, nomeMes } from "@/apps/montagem/domain/financeiro-familiar";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { PagamentoConta } from "@/apps/montagem/components/pagamento-conta";
import { BKC } from "@/apps/montagem/lib/format";
import { CNPJS0 } from "@/apps/montagem/domain/cnpjs";
import { use } from "@/apps/montagem/state/context";
import { createPortal } from "react-dom";
import { e, useEffect, useRef, useState } from "@/shared/react";

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var soma = function(l){ return r2(l.reduce(function(t, i){ return t+i.valor; }, 0)); };
var dm = function(iso){ return iso ? iso.slice(8,10)+"/"+iso.slice(5,7)+"/"+iso.slice(2,4) : "—"; };
var sitDe = function(i){ return i.status==="pago" ? "Pago" : i.atraso>0 ? "Atrasada · "+i.atraso+" dias" : "A pagar"; };
var numDe = function(i){ return ((i.pref||"")+" "+(i.num||"")).trim() || "—"; };
var cnpjDe = function(id){ return CNPJS0.filter(function(c){ return c.id===id; })[0] || null; };
var cnpjTxt = function(id){ var c = cnpjDe(id); return c && c.cnpj ? c.cnpj : (id==="fora" ? "Por fora" : c ? c.nome : id); };
var CNPJ_LETRA = {"34":"#D8C48F", "46":"#DBAAC3", "59":"#92CBC2", "67":"#9FBBE3", "ho":"#BCB1E3", "fora":"#E2E8F0"};   // só a LETRA muda de cor (Marcus, 02/11/2026)
var corCnpj = function(v, l){ return e("span",{style:{color:CNPJ_LETRA[l.fil] || "#E2E8F0"}}, v); };
var nomeCnpj = function(f){ return f==="fora" ? "Por fora" : "CNPJ "+f; };
var hojeYm0 = function(){ var d = new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2, "0"); };
var somaMes = function(n){ var d = new Date(); d.setDate(1); d.setMonth(d.getMonth()+n); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2, "0"); };   // mês de hoje mais n (a lista do mês mostra de 12 meses atrás a 12 à frente; o resto fica em Todos os meses)
var FORMAS = {PIX:"Pix", BOLETO:"Boleto", DEBITO_CONTA:"Débito em conta", TRANSF:"Transferência", DINHEIRO:"Dinheiro", CARTAO:"Cartão"};
var soNumero = function(v){ return /^\d+$/.test(String(v||"")); };
var chaveTitulo = function(i){ return i.filial+"|"+i.pref+"|"+i.num+"|"+i.forn; };
// parcela no formato 02/06: o total é a maior parcela que existe do mesmo título (CNPJ, prefixo, número e fornecedor), entre pagas e em aberto
var parcelaTxt = function(i, maximo){ if(!soNumero(i.parc)) return i.parc || "—"; var n = parseInt(i.parc, 10), m = Math.max(maximo[chaveTitulo(i)] || 0, n); return String(n).padStart(2, "0")+"/"+String(m).padStart(2, "0"); };
var chaveGrupo = function(i, pagas){ return i.nome+"|"+i.filial+"|"+i.status+"|"+(pagas ? i.baixa : ""); };

// grupo de botões juntos (sem folga entre eles), menores e brancos sobre a faixa azul
var grupoBtn = function(ops, atual, aoMudar){ return e("div",{className:"inline-flex overflow-hidden rounded-md border border-white/50"}, ops.map(function(o, i){ var on = atual===o[0]; return e("button",{key:o[0], type:"button", "aria-pressed":on, onClick:function(){ aoMudar(o[0]); }, className:"h-7 px-2.5 text-[13px] font-semibold normal-case "+(i ? "border-l border-white/50 " : "")+(on ? "bg-white text-[#14233f]" : "text-white hover:bg-white/15")}, o[1]); })); };   // padrao-ok: botões menores a pedido do Marcus (12/11/2026)

// SELETOR DE PERÍODO na faixa azul (Marcus, 12/11/2026): três jeitos de escolher um INTERVALO, todos iguais: Dias (de tal dia a tal dia), Meses (de tal mês/ano a tal mês/ano, ex.: Out/2025 a Out/2026) e Anos (de tal ano a tal ano).
// Todos os botões e campos têm o MESMO tamanho. O bloco tem borda azul. Abre por cima de tudo. Anos antigos (2022 até o ano passado) são lidos da DevMaster sozinhos quando entram no intervalo.
var BTN_PER = "h-7 rounded-md border border-white/50 bg-[#14233f] px-2.5 text-[13px] font-semibold normal-case text-white hover:bg-white/15";   // padrao-ok: controles menores a pedido do Marcus (12/11/2026)
var BTN_PER2 = "h-7 w-full rounded border px-1 text-center text-[13px] hover:bg-white/10 disabled:opacity-60";   // padrao-ok: botões menores a pedido do Marcus (12/11/2026)
var CAMPO_PER = "h-7 w-full min-w-0 rounded border border-border bg-card px-1.5 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary";   // padrao-ok: campos menores a pedido do Marcus (12/11/2026)
var MES3 = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"], MES_LONGO = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
var ultimoDia = function(ym){ var a0 = Number(ym.slice(0, 4)), m0 = Number(ym.slice(5, 7)); return ym+"-"+String(new Date(a0, m0, 0).getDate()).padStart(2, "0"); };
// faixa de datas [de, ate] do período escolhido (ou null = sem limite); se o "de" ficar depois do "até", troca os dois
function faixaDe(per){
  if(!per.filtra) return null;
  var f = per.modo==="dias" ? [per.dDe, per.dAte] : per.modo==="meses" ? [per.mDe+"-01", ultimoDia(per.mAte)] : [per.aDe+"-01-01", per.aAte+"-12-31"];
  return f[0] && f[1] && f[0]>f[1] ? [f[1], f[0]] : f;
}
function rotuloPeriodo(per){
  var nm = function(k){ return MES3[Number(k.slice(5, 7))-1]+"/"+k.slice(0, 4); }, dmx = function(iso){ return iso ? iso.slice(8, 10)+"/"+iso.slice(5, 7)+"/"+iso.slice(2, 4) : "…"; };
  var t = !per.filtra ? "Todos os períodos" : per.modo==="dias" ? (per.dDe===per.dAte ? dmx(per.dDe) : dmx(per.dDe)+" a "+dmx(per.dAte)) : per.modo==="meses" ? (per.mDe===per.mAte ? MES_LONGO[Number(per.mDe.slice(5, 7))-1]+"/"+per.mDe.slice(0, 4) : nm(per.mDe)+" a "+nm(per.mAte)) : (per.aDe===per.aAte ? String(per.aDe) : per.aDe+" a "+per.aAte);
  return t+(per.atras ? " + atrasadas" : "");
}
function SeletorPeriodo(p){
  var st = useState(null), pos = st[0], setPos = st[1], bt = useRef(null), per = p.per, set = p.setPer;
  useEffect(function(){ if(!pos) return undefined; var fora = function(ev){ if(bt.current && bt.current.contains(ev.target)) return; if(ev.target.closest && ev.target.closest("[data-periodo]")) return; setPos(null); }; document.addEventListener("mousedown", fora); return function(){ document.removeEventListener("mousedown", fora); }; }, [pos]);   // eslint-disable-line react-hooks/exhaustive-deps
  var abre = function(){ if(pos){ setPos(null); return; } var r0 = bt.current.getBoundingClientRect(); setPos({top:r0.bottom+4, left:Math.max(8, Math.min(r0.left, window.innerWidth-300))}); };
  var cel = function(on){ return BTN_PER2+" "+(on ? "border-primary bg-primary/20 font-semibold text-primary" : "border-border text-foreground"); };
  var aba = function(k, t){ return e("button",{key:k, type:"button", "aria-pressed":per.modo===k && per.filtra, onClick:function(){ set({modo:k, filtra:true}); }, className:cel(per.modo===k && per.filtra)}, t); };
  var rotulo = function(t){ return e("span",{className:"flex h-7 items-center text-[13px] font-semibold"}, t); };
  var selAno = function(valor, onMuda, qual, maisUm){ var l = []; for(var y = 2022; y<=p.anoAtual+(maisUm || 0); y++) l.push(y); return e("select",{"aria-label":qual, value:valor, onChange:function(ev){ onMuda(Number(ev.target.value)); }, className:CAMPO_PER}, l.map(function(y){ return e("option",{key:y, value:y}, y); })); };
  var selMes = function(valorYm, onMuda, qual){ var a0 = Number(valorYm.slice(0, 4)), m0 = Number(valorYm.slice(5, 7)); return e("div",{className:"grid grid-cols-2 gap-1"},
    e("select",{"aria-label":qual+": mês", value:m0, onChange:function(ev){ onMuda(a0+"-"+String(ev.target.value).padStart(2, "0")); }, className:CAMPO_PER}, MES_LONGO.map(function(n, i){ return e("option",{key:i, value:i+1}, n); })),
    selAno(a0, function(y){ onMuda(y+"-"+String(m0).padStart(2, "0")); }, qual+": ano", 2)); };
  var linha2 = function(rot, campo){ return e("div",{className:"grid items-center gap-1", style:{gridTemplateColumns:"2.5rem minmax(0, 1fr)"}}, rotulo(rot), campo); };
  var corpo = per.modo==="dias" ? e("div",{className:"flex flex-col gap-1"},
      linha2("De", e("input",{type:"date", "aria-label":"De", value:per.dDe, onChange:function(ev){ set({dDe:ev.target.value, filtra:true}); }, className:CAMPO_PER})),
      linha2("Até", e("input",{type:"date", "aria-label":"Até", value:per.dAte, onChange:function(ev){ set({dAte:ev.target.value, filtra:true}); }, className:CAMPO_PER})))
    : per.modo==="meses" ? e("div",{className:"flex flex-col gap-1"}, linha2("De", selMes(per.mDe, function(v){ set({mDe:v, filtra:true}); }, "De")), linha2("Até", selMes(per.mAte, function(v){ set({mAte:v, filtra:true}); }, "Até")))
    : e("div",{className:"flex flex-col gap-1"}, linha2("De", selAno(per.aDe, function(y){ set({aDe:y, filtra:true}); }, "De", 0)), linha2("Até", selAno(per.aAte, function(y){ set({aAte:y, filtra:true}); }, "Até", 0)));
  var lendo = p.anos.filter(function(a){ return p.carr[a]==="lendo"; }), falhou = p.anos.filter(function(a){ return p.carr[a] && p.carr[a]!=="lendo" && p.carr[a]!=="ok"; });
  var mesAtual = hojeYm0(), colsAt = p.comAtraso ? 3 : 2;
  var menu = pos && createPortal(e("div",{"data-periodo":"1", style:{top:pos.top, left:pos.left}, className:"fixed z-50 flex w-72 flex-col gap-1.5 rounded-lg border-2 border-[var(--bloco-titulo)] bg-popover p-1.5 text-foreground shadow-xl"},
    e("div",{className:"grid grid-cols-3 gap-1"}, aba("dias", "Dias"), aba("meses", "Meses"), aba("anos", "Anos")),
    e("div",{className:"rounded border border-border p-1"}, corpo),
    lendo.length ? e("p",{className:"px-1 text-[11px]"}, "Lendo "+lendo.join(", ")+" da DevMaster…") : null,
    falhou.length ? e("p",{className:"px-1 text-[11px] text-warning"}, "Não consegui ler "+falhou.join(", ")+". Mude o período e volte para tentar de novo.") : null,
    e("div",{className:"grid gap-1", style:{gridTemplateColumns:"repeat("+colsAt+", minmax(0, 1fr))"}},
      e("button",{type:"button", onClick:function(){ set({filtra:false}); }, className:cel(!per.filtra)}, "Todos"),
      e("button",{type:"button", onClick:function(){ set({modo:"meses", filtra:true, mDe:mesAtual, mAte:mesAtual}); }, className:cel(per.filtra && per.modo==="meses" && per.mDe===mesAtual && per.mAte===mesAtual)}, "Mês atual"),
      p.comAtraso ? e("button",{type:"button", onClick:function(){ set({atras:!per.atras}); }, className:cel(per.atras)}, "+ Atrasadas") : null)), document.body);
  return e("div",{className:"inline-flex"}, e("button",{ref:bt, type:"button", "aria-label":"Período", "aria-expanded":!!pos, onClick:abre, className:BTN_PER+" flex items-center gap-1.5 whitespace-nowrap"}, rotuloPeriodo(per), e("span",{"aria-hidden":true}, pos ? "▴" : "▾")), menu);
}

// ABERTURA (Marcus, 12/11/2026): A pagar abre em A pagar + mês de hoje + atrasadas (o que está em aberto, o que já venceu e o que vence até o fim do mês). Contas pagas abre em Pagas + mês de hoje.
function TelaContas(props){
  var cx = use(), s = cx.state;
  setClasse((s.cpe||{}).classe); setLancamentos((s.cpe||{}).lanc); setBaixas((s.cpe||{}).baixas); setPf(s.pf);
  var sca = useState({}), carr = sca[0], setCarr = sca[1], stk = useState(0), setTick = stk[1], se = useState(props.modo==="pagas" ? "pagas" : "apagar"), escopo = se[0], setEscopo = se[1], sv = useState("lista"), vista = sv[0], setVista = sv[1], sp = useState({modo:"meses", filtra:true, atras:props.modo!=="pagas", dDe:hojeYm()+"-01", dAte:hojeIso(), mDe:hojeYm(), mAte:hojeYm(), aDe:new Date().getFullYear(), aAte:new Date().getFullYear()}), per = sp[0], setPerRaw = sp[1], sa = useState(null), aberta = sa[0], setAberta = sa[1], gx = useState({}), grAb = gx[0], setGrAb = gx[1];
  // HISTÓRICO (Marcus, 12/11/2026): lê UM ano da DevMaster quando o botão do ano é clicado (2022 até o ano passado; só contas pagas; só leitura). Depois marca os 12 meses do ano e vai para Pagas.
  var anoAtual = new Date().getFullYear(), anosHist = []; for(var ah = 2022; ah<anoAtual; ah++) anosHist.push(ah);
  var setPer = function(mudanca){ setPerRaw(function(o){ return Object.assign({}, o, mudanca); }); };
  var faixa = faixaDe(per);
  var carregaAno = function(a){
    var ok = function(){ setTick(function(n){ return n+1; }); };
    if(anosCarregados().indexOf(String(a))>=0){ ok(); return; }
    setCarr(function(c){ var o = Object.assign({}, c); o[a] = "lendo"; return o; });
    chamar("GET", "/contas-dm?ano="+a).then(function(rr){ definirHistorico(a, rr.pagas || []); setCarr(function(c){ var o = Object.assign({}, c); o[a] = "ok"; return o; }); ok(); })
      .catch(function(x){ setCarr(function(c){ var o = Object.assign({}, c); o[a] = "erro: "+(x && x.message ? x.message : "falhou"); return o; }); });
  };
  // anos antigos que entram no intervalo escolhido: lê da DevMaster sozinho (um por vez, só uma vez) e passa para Pagas se estava em A pagar (o histórico só tem contas pagas)
  var anoDe = faixa ? Number(faixa[0].slice(0, 4)) : 0, anoAte = faixa ? Number(faixa[1].slice(0, 4)) : 0, chaveAnos = faixa ? anoDe+"-"+anoAte : "";
  useEffect(function(){ if(!faixa) return; for(var y = Math.max(2022, anoDe); y<=Math.min(anoAte, anoAtual-1); y++){ if(anosCarregados().indexOf(String(y))<0 && !carr[y]) carregaAno(y); } if(anoDe<anoAtual && escopo==="apagar") setEscopo("pagas"); }, [chaveAnos]);   // eslint-disable-line react-hooks/exhaustive-deps
  var podePagar = temAutorizacao("pagamento_registra", s.usuario);
  if(!temDados()) return e("p",{className:"rounded-lg border border-border px-4 py-6 text-center text-[13px] text-foreground"}, "Sem contas da empresa neste computador.");
  var todas = filtrar("", "", "", "", "", "").concat(historicoItens()), maximo = {};
  todas.forEach(function(i){ if(!soNumero(i.parc)) return; var k = chaveTitulo(i), n0 = parseInt(i.parc, 10); if(n0>(maximo[k]||0)) maximo[k] = n0; });
  var hoje0 = hojeIso(), ABERTO = escopo!=="pagas", PAGO = escopo!=="apagar", DESC = escopo==="pagas";   // escopo: A pagar, Pagas ou Todas, na MESMA tela (Marcus, 12/11/2026)
  // FILTRO DO MÊS (Marcus, 12/11/2026: "sempre abrindo do mês"): a tela abre no mês de hoje. A pagar conta pelo vencimento (sem data, pela emissão); pagas, pela data do pagamento.
  var dataBase = function(i){ return i.status==="pago" ? (i.baixa || "") : (i.venc || i.emissao || ""); };
  // PERÍODO (Marcus, 12/11/2026): escolher VÁRIOS meses (cada um é uma linha na visão Por mês) ou de tal dia a tal dia. Sem nenhum mês marcado = todos. "atraso" marcado = também o que já venceu e está em aberto.
  var noMes = function(i){ var d = dataBase(i); if(!faixa) return true; return (d>=faixa[0] && d<=faixa[1]) || (per.atras && i.status==="apagar" && !!i.venc && i.venc<hoje0); };
  var ls = todas.filter(function(i){ return (escopo==="todas" || i.status===(DESC ? "pago" : "apagar")) && noMes(i); }).sort(function(x, y){ var p = dataBase(x), q = dataBase(y); return DESC ? q.localeCompare(p) || x.nome.localeCompare(y.nome) : (p||"9999").localeCompare(q||"9999") || x.nome.localeCompare(y.nome); });   // ordem: vence primeiro no alto (atrasadas em cima), SEM data no fim; em Pagas, o pago mais recente primeiro
  var colAcao = podePagar && PAGO;
  // REPRESENTANTES: comissão e combustível do mesmo representante, CNPJ e situação viram uma linha somada; abre ao clicar
  var linha = function(i, filho){ return {id:i.id, it:i, fil:i.filial, nome:(filho ? "↳ " : "")+i.nome, venc:dm(i.venc), pago:dm(i.baixa), cnpj:cnpjTxt(i.filial), num:numDe(i), parc:parcelaTxt(i, maximo), nat:i.natNome, nota:i.nota==="sem" ? "Sem nota" : "Com nota", valor:i.valor, orig:i.valorTitulo==null ? i.valor : i.valorTitulo, emis:dm(i.emissao), atr:i.atraso>0 ? i.atraso : 0, setor:i.grupo || "—", cod:i.nat || "—", sit:sitDe(i), acao:i.bx ? "Desfazer" : "", forma:i.bx ? (FORMAS[i.bx.forma] || i.bx.forma || "—") : "—", saida:i.bx ? (i.bx.contaNome || "—") : "—", compro:i.status!=="pago" ? "—" : !i.bx ? "—" : i.bx.comprovante ? "Ver" : "Falta anexar", por:i.bx ? nomeDe(i.bx.por) : "—", filho:!!filho}; };
  var grupos = {};
  ls.forEach(function(i){ if(i.grupo!=="Representantes") return; var k = chaveGrupo(i, i.status==="pago"); if(!grupos[k]) grupos[k] = []; grupos[k].push(i); });
  var linhas = [], feitos = {};
  ls.forEach(function(i){
    if(i.grupo!=="Representantes"){ linhas.push(linha(i)); return; }
    var k = chaveGrupo(i, i.status==="pago"), its = grupos[k];
    if(its.length===1){ linhas.push(linha(i)); return; }
    if(feitos[k]) return;
    feitos[k] = 1;
    var ap = i.status==="apagar", op = !!grAb[k], nats = [], venc = its.map(function(x){ return x.venc || ""; }).sort()[0], atr = Math.max.apply(null, its.map(function(x){ return x.atraso || 0; }));
    its.forEach(function(x){ if(nats.indexOf(x.natNome)<0) nats.push(x.natNome); });
    linhas.push({id:"g|"+k, grupo:true, k:k, its:its, fil:i.filial, nome:(op ? "▾ " : "▸ ")+i.nome, venc:dm(venc), pago:dm(i.baixa), cnpj:cnpjTxt(i.filial), num:its.length+" títulos", parc:"—", nat:nats.join(" · "), nota:its.every(function(x){ return x.nota==="sem"; }) ? "Sem nota" : "Com nota", valor:soma(its), orig:r2(its.reduce(function(t0, x){ return t0+(x.valorTitulo==null ? x.valor : x.valorTitulo); }, 0)), emis:dm(its.map(function(x){ return x.emissao || ""; }).sort()[0]), setor:"Representantes", cod:its[0].nat || "—", sit:ap ? (atr>0 ? "Atrasada · "+atr+" dias" : "A pagar") : "Pago", acao:"", ap:ap, atr:atr});
    if(op) its.forEach(function(x){ linhas.push(linha(x, true)); });
  });
  var corSit = function(l){ var ap = l.grupo ? l.ap : l.it.status==="apagar", atr = l.grupo ? l.atr : l.it.atraso; return ap && atr>0 ? "text-warning" : !ap ? "text-success" : ""; };
  var botaoDesfazer = function(v, l){ return l.it && l.it.bx ? e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); if(window.confirm("Desfazer este pagamento? A conta volta para A pagar.")) cx.dispatch({type:"CPE_BAIXA_DESFAZ", id:l.it.bx.id, por:s.usuario}); }, className:"h-8 rounded-md border border-border px-2 text-[13px] text-foreground hover:bg-white/10"}, "Desfazer") : ""; };
  // COMPROVANTE: o anexo feito na janela de pagamento. "Ver" abre o arquivo; "Falta anexar" = pago pelo Admin sem comprovante; "—" = pago na DevMaster (não vem anexo)
  var verComp = function(v, l){ var b = l.it && l.it.bx; if(v==="Ver" && b && b.comprovante) return e("a",{href:b.comprovante.url, target:"_blank", rel:"noreferrer", onClick:function(ev){ ev.stopPropagation(); }, className:"cursor-pointer underline"}, "Ver"); return v==="Falta anexar" ? e("span",{className:"text-warning"}, v) : v; };
  var cols = [{k:"sit", t:"Situação", cor:corSit}].concat(PAGO ? [{k:"pago", t:"Pago em"}] : [], [{k:"venc", t:"Vence"}, {k:"nome", t:"Fornecedor"}, {k:"valor", t:"Valor", fmt:BKC}], PAGO ? [{k:"forma", t:"Forma"}, {k:"saida", t:"Conta de saída"}, {k:"compro", t:"Comprovante", render:verComp}, {k:"por", t:"Pago por"}] : [],
    [{k:"cnpj", t:"CNPJ", render:corCnpj}, {k:"num", t:"Número"}, {k:"parc", t:"Parcela"}, {k:"nat", t:"Natureza"}, {k:"nota", t:"Nota"}, {k:"setor", t:"Setor"}, {k:"cod", t:"Cód. natureza"}].concat(ABERTO ? [{k:"emis", t:"Emissão"}, {k:"orig", t:"Valor original", fmt:BKC}, {k:"atr", t:"Dias de atraso"}] : []), [],
    colAcao && linhas.some(function(l){ return l.it && l.it.bx; }) ? [{k:"acao", t:"Desfazer", render:botaoDesfazer}] : []);   // a coluna só aparece quando há pagamento feito pelo Admin na tela (os da DevMaster não podem ser desfeitos aqui)
  // POR DIA (Marcus, 12/11/2026): uma linha por dia (vencimento em Contas a pagar, pagamento em Contas pagas): quantas contas, total e quanto em cada CNPJ
  // TOTAL POR DIA e POR MÊS (Marcus, 12/11/2026): uma linha por dia (ou por mês), com quantas contas, quanto em cada CNPJ, o total e o ACUMULADO (soma linha após linha; na última dá o total de tudo que está na tela)
  var mesHoje = hoje0.slice(0, 7);
  var totaisPor = function(chaveDe, rotuloDe, sitDe2){ var gr = {}; ls.forEach(function(i){ var k = chaveDe(i); (gr[k] = gr[k] || []).push(i); });
    var ks = Object.keys(gr).filter(function(k){ return k; }).sort(); if(gr[""]) ks.push(""); var acum = 0;
    return ks.map(function(k){ var its = gr[k], tot = soma(its), tudoPago = its.every(function(i){ return i.status==="pago"; }); acum = r2(acum+tot);
      var o = {id:"d"+k, dia:k ? rotuloDe(k) : "Sem data", qtd:its.length, total:tot, acum:acum, sit:tudoPago ? "Pago" : !k ? "Sem data" : sitDe2(k)};
      FILIAIS.forEach(function(f){ o["c"+f[0]] = soma(its.filter(function(i){ return i.filial===f[0]; })); }); return o; }); };
  // O TOTAL ACOMPANHA A ABA DO PERÍODO (Marcus, 12/11/2026): Dias = uma linha por dia, Meses = uma por mês, Anos = uma por ano.
  var anoHoje = hoje0.slice(0, 4);
  var linhasDia = per.modo==="anos" ? totaisPor(function(i){ return dataBase(i).slice(0, 4); }, function(k){ return k; }, function(k){ return k<anoHoje ? "Atrasadas" : k===anoHoje ? "Ano atual" : "A vencer"; })
    : per.modo==="meses" ? totaisPor(function(i){ return dataBase(i).slice(0, 7); }, function(k){ return nomeMes(k); }, function(k){ return k<mesHoje ? "Atrasadas" : k===mesHoje ? "Mês atual" : "A vencer"; })
    : totaisPor(dataBase, dm, function(k){ return k<hoje0 ? "Atrasadas" : k===hoje0 ? "Hoje" : "A vencer"; });
  var corDia = function(l){ return l.sit==="Atrasadas" ? "text-warning" : l.sit==="Pago" ? "text-success" : ""; };
  var colsDia = [{k:"dia", t:per.modo==="anos" ? "Ano" : per.modo==="meses" ? "Mês" : escopo==="pagas" ? "Pago em" : escopo==="apagar" ? "Vence" : "Data", cor:corDia}, {k:"sit", t:"Situação", cor:corDia}, {k:"qtd", t:escopo==="pagas" ? "Pagamentos" : "Contas"}].concat(FILIAIS.map(function(f){ return {k:"c"+f[0], t:f[0]==="fora" ? "Por fora" : f[1], fmt:BKC}; }), [{k:"total", t:"Total", fmt:BKC}, {k:"acum", t:"Acumulado", fmt:BKC}]);   // os CNPJs vêm ANTES do Total e do Acumulado (Marcus, 12/11/2026)
  var aoClicar = function(l){ if(l.grupo){ var o = Object.assign({}, grAb); o[l.k] = !grAb[l.k]; setGrAb(o); return; } setAberta(l.it); };
  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    aberta && e(PagamentoConta,{key:aberta.id, s:s, item:aberta, lista:ls, podePagar:podePagar, fechar:function(){ setAberta(null); }, ir:function(x){ if(x) setAberta(x); }, salvar:function(b){ cx.dispatch({type:"CPE_BAIXA", baixas:[b]}); setAberta(null); }, desfazer:function(id){ cx.dispatch({type:"CPE_BAIXA_DESFAZ", id:id, por:s.usuario}); setAberta(null); }, excluir:function(id){ cx.dispatch({type:"CPE_LANC_DEL", id:id, por:s.usuario}); setAberta(null); }, trocarFilial:function(it, f){ cx.dispatch({type:"CPE_FILIAL", chave:it.chave, filial:f, por:s.usuario, desc:it.nome, valor:it.valor}); setAberta(null); }}),
    e(BlocoPainel,{titulo:escopo==="apagar" ? "Contas a pagar" : escopo==="pagas" ? "Contas pagas" : "Contas a pagar e pagas", compacto:true},
      // controles compactos numa faixa azul: visão (Separado | Total), situação (A pagar | Pagas | Todas) e mês (Marcus, 12/11/2026)
      e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1"},
        grupoBtn([["lista", "Separado"], ["dia", "Total"]], vista, setVista),   // o Total muda com a aba do período: Dias, Meses ou Anos
        grupoBtn([["apagar", "A pagar"], ["pagas", "Pagas"], ["todas", "Todas"]], escopo, function(k){ setEscopo(k); if(k==="pagas") setPer({atras:false}); }),
        e(SeletorPeriodo,{anoAtual:anoAtual, anos:anosHist.concat([anoAtual]), carr:carr, per:per, setPer:setPer, comAtraso:ABERTO})),
      vista!=="lista" ? e(TabelaPlanilha,{key:escopo+vista, cols:colsDia, linhas:linhasDia, chave:"id", grade:true, semContagem:true, vazio:"Nenhuma conta."}) : e(TabelaPlanilha,{key:escopo, cols:cols, linhas:linhas, chave:"id", grade:true, semContagem:true, soNoTexto:true, limite:200, aoClicar:aoClicar, linhaCls:function(l){ return l.filho || (l.grupo && grAb[l.k]) ? "bg-white/[0.16]" : ""; }, vazio:"Nenhuma conta neste filtro."})));
}

function AbaCtaLista(){ return e(TelaContas,{modo:"pagar"}); }
function AbaCtaPagas(){ return e(TelaContas,{modo:"pagas"}); }
export { AbaCtaLista, AbaCtaPagas };

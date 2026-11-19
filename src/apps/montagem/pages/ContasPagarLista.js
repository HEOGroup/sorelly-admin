// Sorelly Admin · montagem — pages/ContasPagarLista.js
// Financeiro › Contas › CONTAS A PAGAR e CONTAS PAGAS (Marcus, 12/11/2026): duas telas, cada uma UMA TABELA GIGANTE (sem resumo, sem abas, sem filtros no alto: o filtro fica no nome de cada coluna).
// Um arquivo, duas telas (TelaContas, modo "pagar" ou "pagas"). Sem coluna Marcar e sem Lançar conta (Marcus, 12/11/2026); clicar na conta abre a ficha, onde se registra o pagamento. Contas pagas: Pago em e botão Desfazer.
// Representantes: a comissão e o combustível de cada representante entram somados numa linha só; clicar na linha abre cada título. Parcela escrita assim: 02/06.
// Empresa + pró-labore e retiradas juntos, como na Análise de custos. Dados do DevMaster (domain/contas-empresa.js).
import { Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { MenuMulti } from "@/apps/montagem/components/padrao-fin";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { chamar } from "@/apps/montagem/lib/api";
import { abrirAnexo } from "@/apps/montagem/lib/anexo";
import { FILIAIS, anosCarregados, definirHistorico, ehFam, filtrar, historicoItens, meses, setBaixas, setClasse, setLancamentos, setPf, temDados } from "@/apps/montagem/domain/contas-empresa";
import { hojeIso, hojeYm, itensDividasPrestadores, nomeMes, parcelasDe } from "@/apps/montagem/domain/financeiro-familiar";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { PagamentoConta } from "@/apps/montagem/components/pagamento-conta";
import { BKC } from "@/apps/montagem/lib/format";
import { CNPJS0 } from "@/apps/montagem/domain/cnpjs";
import { use } from "@/apps/montagem/state/context";
import { createPortal } from "react-dom";
import { e, useEffect, useRef, useState } from "@/shared/react";

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var soma = function(l){ return r2(l.reduce(function(t, i){ return t+i.valor; }, 0)); };
// Data errada no DevMaster (18/11/2026, Marcus: "que ordem é essa"): vencimento com ano 0226 ou 2006 (erro de digitação) ia para o topo escrito como 21/11/26. Agora o ano sai inteiro e a Situação diz "Data errada".
var anoErrado = function(iso){ var a = parseInt(String(iso || "").slice(0, 4), 10); return !!iso && (a<2020 || a>2100); };
var dm = function(iso){ return iso ? iso.slice(8,10)+"/"+iso.slice(5,7)+"/"+(anoErrado(iso) ? iso.slice(0,4) : iso.slice(2,4)) : "—"; };
// CONTAS DA FAMÍLIA lançadas no Admin (módulo ff) como linhas da lista (Marcus, 16/11/2026: uma tela só, duas origens). SÓ LEITURA: o módulo da Família não é mexido; clicar leva para o Financeiro familiar.
function itensFamiliaAdmin(s){
  var ff = s.ff; if(!ff || !ff.contas) return [];
  var pers = {}; (ff.personas || []).forEach(function(p){ pers[p.id] = p.nome; });
  var hj = hojeIso();
  return parcelasDe(ff, {}, hj).map(function(p){
    var c = p.conta, pg = p.pagamentos || [], ult = pg.length ? String(pg[pg.length-1].em || pg[pg.length-1].data || "") : "", pago = p.status==="PAGO", cb = (ff.contasBanc || []).find(function(b){ return b.id===c.contaBancId; });
    var atraso = p.atrasada ? Math.max(1, Math.round((new Date(hj+"T00:00:00") - new Date(p.venc+"T00:00:00")) / 86400000)) : 0, dono = (c.rateio && c.rateio.length ? c.rateio : [c.personaId]).map(function(id){ return pers[id] || id; }).join(", ");
    return {id:"ff|"+p.chave, chave:"ff|"+p.chave, ff:true, nome:c.descricao+(c.beneficiario ? " · "+c.beneficiario : ""), nat:"", natNome:c.categoria || "", filial:"fam", pref:"FAM", num:"", parc:"", nota:"sem", grupo:"Família", venc:p.venc, emissao:"", valor:pago ? p.valor : p.restante, valorTitulo:p.valor, status:pago ? "pago" : "apagar", baixa:pago ? (ult || p.venc) : "", mes:(pago ? (ult || p.venc) : p.ym).slice(0, 7), atraso:atraso, rateioTxt:dono, saidaTxt:cb ? cb.nome : "—", formaTxt:c.forma || "—"}; });
}
// CONTA NOS DOIS LUGARES = UMA LINHA SÓ (Marcus, 16/11/2026): a conta da Família lançada no Admin e a mesma conta que veio da DevMaster viram uma linha (a do Admin vale; o valor entra uma vez só). A DevMaster fica marcada "Falta dar baixa" até o financeiro dar a baixa lá.
// Regra do par: mesma situação, mesmo valor e mesmo mês de vencimento, e SÓ UMA candidata de cada lado (se houver mais de uma, não junta: não adivinha).
function juntarDuplicadas(lista){
  var chave = function(i){ return i.status+"|"+r2(i.valor).toFixed(2)+"|"+String(i.venc || "").slice(0, 7); };
  var porAdmin = {}, porDm = {};
  lista.forEach(function(i){ if(i.ffAba) return; if(i.ff){ (porAdmin[chave(i)] = porAdmin[chave(i)] || []).push(i); } else if(ehFam(i) && !i.manual && !i.bx && i.venc){ (porDm[chave(i)] = porDm[chave(i)] || []).push(i); } });
  var some = {}, par = {};
  Object.keys(porDm).forEach(function(k){ var a = porAdmin[k], d = porDm[k]; if(a && a.length===1 && d.length===1){ some[d[0].id] = true; par[a[0].id] = d[0]; } });
  // 2ª rodada (Marcus, 16/11/2026): onde sobrou mais de uma candidata, junta só se o DIA do vencimento é o mesmo, o nome tem palavra em comum e SÓ UMA candidata cumpre isso (nome igual desempata)
  var pals = function(t){ return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().split(/[^a-z0-9]+/).filter(function(w){ return w.length>=4; }); };
  var igual = function(x, y){ return pals(x).join(" ")===pals(y).join(" "); };
  Object.keys(porDm).forEach(function(k){ var a = porAdmin[k]; if(!a) return;
    porDm[k].filter(function(d){ return !some[d.id]; }).forEach(function(d){
      var livres = a.filter(function(x){ return !par[x.id] && x.venc===d.venc && pals(x.nome).some(function(w){ return pals(d.nome).indexOf(w)>=0; }); });
      if(livres.length>1){ var iguais = livres.filter(function(x){ return igual(x.nome, d.nome); }); if(iguais.length) livres = iguais; }
      if(livres.length===1){ some[d.id] = true; par[livres[0].id] = d; } }); });
  return lista.filter(function(i){ return !some[i.id]; }).map(function(i){ return par[i.id] ? Object.assign({}, i, {tambemDm:par[i.id]}) : i; });
}
// PAGA NA DEVMASTER = PAGA (Marcus, 16/11/2026: "se tá pago na DevMaster tá pago"): a conta da Família lançada no Admin que está em aberto, mas que a DevMaster já deu como paga, aparece como PAGA (Pago em = data da DevMaster) e a linha da DevMaster paga some (uma linha só). SÓ NA TELA: nada é gravado no Admin nem no Financeiro familiar; o financeiro confere e dá a baixa no Admin depois.
// Regra do par: mesmo valor, baixa a até 20 dias do vencimento, nome com palavra em comum, um para um.
function marcarPagasDm(lista){
  var pals = function(t){ return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().split(/[^a-z0-9]+/).filter(function(w){ return w.length>=4; }); };
  var dias = function(a, b){ return Math.abs((new Date(a+"T00:00:00") - new Date(b+"T00:00:00")) / 86400000); };
  var pagasDm = lista.filter(function(i){ return !i.ff && !i.manual && !i.bx && i.status==="pago" && i.baixa; }), usadas = {}, par = {}, porValor = {};
  pagasDm.forEach(function(d){ var k = r2(d.valor).toFixed(2); (porValor[k] = porValor[k] || []).push(d); });
  lista.forEach(function(a){
    if(!a.ff || a.ffAba || a.status!=="apagar" || a.tambemDm || !a.venc) return;   // dívida de prestador (ffd|) não é conta da casa: não casa com título da DevMaster
    var w = pals(a.nome);
    var c = (porValor[r2(a.valor).toFixed(2)] || []).filter(function(d){ return !usadas[d.id] && Math.abs(d.valor-a.valor)<0.005 && dias(d.baixa, a.venc)<=20 && pals(d.nome+" "+(d.natNome || "")).some(function(k){ return w.indexOf(k)>=0; }); });
    if(c.length){ c.sort(function(x, y){ return dias(x.baixa, a.venc)-dias(y.baixa, a.venc); }); usadas[c[0].id] = true; par[a.id] = c[0]; }
  });
  return lista.filter(function(i){ return !usadas[i.id]; }).map(function(i){ var d = par[i.id]; return d ? Object.assign({}, i, {status:"pago", baixa:d.baixa, atraso:0, valor:i.valorTitulo==null ? i.valor : i.valorTitulo, mes:String(d.baixa).slice(0, 7), tambemDm:d, pagoNaDm:true}) : i; });
}
// PESSOA DA CONTA (Marcus, 16/11/2026: "isso é um gasto meu"): conta do Admin usa a pessoa lançada lá; conta da família vinda da DevMaster usa o nome que aparece no título (Marcus, Anamaria, Marco Antonio, Ana Beatriz), só se for UM nome. Só para mostrar e filtrar: nada é gravado.
var PES_RX = [["Marcus", /\bmarcus\b/], ["Anamaria", /\banamaria\b/], ["Marco Antonio", /\bmarco\b/], ["Ana Beatriz", /\bana beatriz\b|\banabeatriz\b/]];
var pessoaTxt = function(i){ if(i.rateioTxt) return i.rateioTxt; if(!(i.ff || ehFam(i))) return ""; var t = String(i.nome+" "+(i.natNome || "")).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(), a = PES_RX.filter(function(r){ return r[1].test(t); }); return a.length===1 ? a[0][0] : ""; };
var TEXTO_BUSCA = new WeakMap();   // texto de busca de cada conta, guardado (a busca fica rápida)
var sitDe = function(i){ return i.status==="pago" ? "Pago" : anoErrado(i.venc) ? "Data errada" : i.atraso>0 ? "Atrasada · "+i.atraso+" dias" : "A pagar"; };
var numDe = function(i){ return ((i.pref||"")+" "+(i.num||"")).trim() || "—"; };
var cnpjDe = function(id){ return CNPJS0.filter(function(c){ return c.id===id; })[0] || null; };
var cnpjTxt = function(id){ var c = cnpjDe(id); return c && c.cnpj ? c.cnpj : (id==="fora" ? "Por fora" : id==="fam" ? "Família" : c ? c.nome : id); };
var CNPJ_LETRA = {"34":"#D8C48F", "46":"#DBAAC3", "59":"#92CBC2", "67":"#9FBBE3", "ho":"#BCB1E3", "fora":"#E2E8F0"};   // só a LETRA muda de cor (Marcus, 02/11/2026)
var corCnpj = function(v, l){ return e("span",{style:{color:CNPJ_LETRA[l.fil] || "#E2E8F0"}}, v); };
var nomeCnpj = function(f){ return f==="fora" ? "Por fora" : "CNPJ "+f; };
var hojeYm0 = function(){ var d = new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2, "0"); };
var somaMes = function(n){ var d = new Date(); d.setDate(1); d.setMonth(d.getMonth()+n); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2, "0"); };   // mês de hoje mais n (a lista do mês mostra de 12 meses atrás a 12 à frente; o resto fica em Todos os meses)
var FORMAS = {PIX:"Pix", BOLETO:"Boleto", DEBITO_CONTA:"Débito em conta", TRANSF:"Transferência", DINHEIRO:"Dinheiro", CARTAO:"Cartão", CHEQUE:"Cheque"};
var soNumero = function(v){ return /^\d+$/.test(String(v||"")); };
var chaveTitulo = function(i){ return i.filial+"|"+i.pref+"|"+i.num+"|"+i.forn; };
// parcela no formato 02/06: o total é a maior parcela que existe do mesmo título (CNPJ, prefixo, número e fornecedor), entre pagas e em aberto
var parcelaTxt = function(i, maximo){ if(!soNumero(i.parc)) return i.parc || "—"; var n = parseInt(i.parc, 10), m = Math.max(maximo[chaveTitulo(i)] || 0, n); return String(n).padStart(2, "0")+"/"+String(m).padStart(2, "0"); };
var chaveGrupo = function(i, pagas){ return i.nome+"|"+i.filial+"|"+i.status+"|"+(pagas ? i.baixa : ""); };

// grupo de botões juntos (sem folga entre eles), menores e brancos sobre a faixa azul
var menuSusp = function(ops, atual, aoMudar, rotulo, larg){ return e("select",{value:atual, "aria-label":rotulo, onChange:function(ev){ aoMudar(ev.target.value); }, className:"h-8 min-w-0 rounded-md border border-border bg-card px-2 text-[13px] font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary "+(larg || "w-32")}, ops.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })); };   // MENU SUSPENSO no lugar dos botões Separado/Total, A pagar/Pagas/Todas e Empresa/Família/Junto (Marcus, 16/11/2026)

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
  var sca = useState({}), carr = sca[0], setCarr = sca[1], stk = useState(0), setTick = stk[1], se = useState(props.modo==="pagas" ? "pagas" : "apagar"), escopo = se[0], setEscopo = se[1], sv = useState("lista"), vista = sv[0], setVista = sv[1], sq = useState("empresa"), quemSel = sq[0], setQuem = sq[1], sp = useState({modo:"meses", filtra:true, atras:props.modo!=="pagas", dDe:hojeYm()+"-01", dAte:hojeIso(), mDe:hojeYm(), mAte:hojeYm(), aDe:new Date().getFullYear(), aAte:new Date().getFullYear()}), per = sp[0], setPerRaw = sp[1], sa = useState(null), aberta = sa[0], setAberta = sa[1], gx = useState({}), grAb = gx[0], setGrAb = gx[1];
  // HISTÓRICO (Marcus, 12/11/2026): lê UM ano da DevMaster quando o botão do ano é clicado (2022 até o ano passado; só contas pagas; só leitura). Depois marca os 12 meses do ano e vai para Pagas.
  var chavePref = "sorelly_cpa_colunas_v1_"+(s.usuario || "x");
  var scp = useState(function(){ try{ var g = JSON.parse(localStorage.getItem(chavePref) || "null"); if(g && typeof g==="object") return g; }catch(x){} return {}; }), prefCols = scp[0], setPrefCols = scp[1];
  var spp = useState(function(){ try{ var g = Number(localStorage.getItem("sorelly_cpa_porpag")); if(g>=50 && g<=500) return g; }catch(x){} return 100; }), porPag = spp[0], setPorPag = spp[1];
  var sbt = useState(""), buscaTxt = sbt[0], setBuscaTxt = sbt[1], sbu = useState(""), busca = sbu[0], setBusca = sbu[1], spe = useState(""), pessoaSel = spe[0], setPessoaSel = spe[1];
  useEffect(function(){ var t = setTimeout(function(){ setBusca(buscaTxt); }, 300); return function(){ clearTimeout(t); }; }, [buscaTxt]);   // eslint-disable-line react-hooks/exhaustive-deps -- espera parar de digitar (0,3 s) antes de procurar
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
  var verFam = temAutorizacao("financeiro_familia", s.usuario), quem = verFam ? quemSel : "empresa";   // quem não tem a autorização só vê a empresa; as linhas da Família nem aparecem (Marcus, 16/11/2026)
  if(!temDados()) return e("p",{className:"rounded-lg border border-border px-4 py-6 text-center text-[13px] text-foreground"}, "Sem contas da empresa neste computador.");
  var buscaTudo = String(busca || "").trim()!=="";   // com algo digitado na busca, procura em TUDO (Empresa, Família e DevMaster), qualquer que seja o botão marcado
  var todas = filtrar("", "", "", "", "", "").concat(historicoItens()).filter(function(i){ return quem==="junto" || buscaTudo || (quem==="familia" ? ehFam(i) : !ehFam(i)); }).concat(verFam && (quem!=="empresa" || buscaTudo) ? itensFamiliaAdmin(s).concat(itensDividasPrestadores(s.ff, hojeIso())) : []), maximo = {};
  if(verFam && (quem!=="empresa" || buscaTudo)) todas = marcarPagasDm(juntarDuplicadas(todas));
  todas.forEach(function(i){ if(!soNumero(i.parc)) return; var k = chaveTitulo(i), n0 = parseInt(i.parc, 10); if(n0>(maximo[k]||0)) maximo[k] = n0; });
  var hoje0 = hojeIso(), ABERTO = escopo!=="pagas", PAGO = escopo!=="apagar", DESC = escopo==="pagas";   // escopo: A pagar, Pagas ou Todas, na MESMA tela (Marcus, 12/11/2026)
  // FILTRO DO MÊS (Marcus, 12/11/2026: "sempre abrindo do mês"): a tela abre no mês de hoje. A pagar conta pelo vencimento (sem data, pela emissão); pagas, pela data do pagamento.
  var dataBase = function(i){ return i.status==="pago" ? (i.baixa || "") : (i.venc || i.emissao || ""); };
  // PERÍODO (Marcus, 12/11/2026): escolher VÁRIOS meses (cada um é uma linha na visão Por mês) ou de tal dia a tal dia. Sem nenhum mês marcado = todos. "atraso" marcado = também o que já venceu e está em aberto.
  var noMes = function(i){ var d = dataBase(i); if(!faixa) return true; return (d>=faixa[0] && d<=faixa[1]) || (per.atras && i.status==="apagar" && !!i.venc && i.venc<hoje0); };
  var buscando = String(busca || "").trim()!=="";   // BUSCA (Marcus, 16/11/2026): digitou algo, procura em qualquer mês e em DevMaster ou Admin, MAS respeita a situação marcada (A pagar mostra só em aberto, Pagas só pagas, Todas as duas)
  var ls = todas.filter(function(i){ return (escopo==="todas" || i.status===(DESC ? "pago" : "apagar")) && (buscando || noMes(i)); });   // ordem: vence primeiro no alto (atrasadas em cima), SEM data no fim; em Pagas, o pago mais recente primeiro
  // BUSCA NO ALTO (Marcus, 16/11/2026: "quero puxar Marcus e ver tudo que é meu"): procura em todos os campos da conta (nome, pessoa, CNPJ, natureza, número, valor, origem). Várias palavras = todas precisam aparecer. Exceção pedida pelo Marcus à regra de "sem busca no topo".
  var semAc = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
  var termos = semAc(busca).split(/\s+/).filter(Boolean);
  if(termos.length) ls = ls.filter(function(i){
    var tx = TEXTO_BUSCA.get(i); if(tx===undefined){ tx = semAc([i.nome, pessoaTxt(i), i.natNome, i.grupo, cnpjTxt(i.filial), numDe(i), i.forn, i.nat, (i.ff || ehFam(i)) ? "familia" : "sorelly", i.ff ? "admin familia" : i.manual ? "so no admin" : "devmaster", r2(i.valor).toFixed(2).replace(".", ","), r2(i.valor).toLocaleString("pt-BR", {minimumFractionDigits:2}), dm(i.venc), dm(i.baixa)].join(" ")); TEXTO_BUSCA.set(i, tx); }
    return termos.every(function(t0){ return tx.indexOf(t0)>=0; });
  });
  // PESSOA (Marcus, 16/11/2026: "quero puxar Marcus e clicar"): lista das pessoas que aparecem nas contas; escolher uma mostra tudo dela (inclui conta com rateio em que ela entra).
  var pessoasDe = function(i){ return pessoaTxt(i).split(", ").filter(function(n0){ return n0 && n0!=="—"; }); };
  var listaPessoas = []; todas.forEach(function(i){ pessoasDe(i).forEach(function(n0){ if(listaPessoas.indexOf(n0)<0) listaPessoas.push(n0); }); }); listaPessoas.sort(function(a, b){ return a.localeCompare(b, "pt-BR"); });
  if(pessoaSel) ls = ls.filter(function(i){ return pessoasDe(i).indexOf(pessoaSel)>=0; });
  ls = ls.sort(function(x, y){ var p = dataBase(x), q = dataBase(y); return DESC ? q.localeCompare(p) || x.nome.localeCompare(y.nome) : (p||"9999").localeCompare(q||"9999") || x.nome.localeCompare(y.nome); });   // ordena DEPOIS de filtrar (antes ordenava as 15 mil contas a cada letra da busca)
  var colAcao = podePagar && PAGO;
  // REPRESENTANTES: comissão e combustível do mesmo representante, CNPJ e situação viram uma linha somada; abre ao clicar
  var linha = function(i, filho){ return {id:i.id, it:i, fil:i.filial, nome:(filho ? "↳ " : "")+i.nome, venc:dm(i.venc), pago:dm(i.baixa), cnpj:cnpjTxt(i.filial), num:i.tambemDm ? "DevMaster "+numDe(i.tambemDm) : numDe(i), parc:i.tambemDm ? parcelaTxt(i.tambemDm, maximo) : parcelaTxt(i, maximo), nat:i.natNome, nota:i.nota==="sem" ? "Sem nota" : "Com nota", valor:i.valor, orig:i.valorTitulo==null ? i.valor : i.valorTitulo, emis:dm(i.emissao), atr:i.atraso>0 ? i.atraso : 0, setor:i.grupo || "—", cod:i.nat || "—", sit:sitDe(i), abrir:"Abrir", dono:(i.ff || ehFam(i)) ? (pessoaTxt(i) && pessoaTxt(i).indexOf(",")<0 && PES_RX.some(function(r){ return r[0]===pessoaTxt(i); }) ? pessoaTxt(i) : "Família") : "Sorelly", origem:i.tambemDm ? "Admin + DevMaster" : i.ff ? "Admin · Família" : i.manual ? "Só no Admin" : "DevMaster", dm:i.pagoNaDm ? "Paga em "+dm(i.baixa)+" · falta baixa no Admin" : i.tambemDm ? (i.status==="pago" ? "—" : "Falta dar baixa") : i.ff || i.manual ? "Não precisa" : i.bx ? "Falta dar baixa" : "—", rateio:pessoaTxt(i) || "—", acao:i.bx ? "Desfazer" : "", forma:i.bx ? (FORMAS[i.bx.forma] || i.bx.forma || "—") : (i.formaTxt || "—"), saida:i.bx ? (i.bx.contaNome || "—") : (i.saidaTxt || "—"), compro:i.ff ? ((i.comps || []).length ? "Ver" : (i.pagoPorPix ? "Falta anexar" : "—")) : i.status!=="pago" ? "—" : !i.bx ? "—" : i.bx.comprovante ? "Ver" : "Falta anexar", por:i.bx ? nomeDe(i.bx.por) : "—", filho:!!filho}; };
  var grupos = {};
  ls.forEach(function(i){ if(i.grupo!=="Representantes") return; var k = chaveGrupo(i, i.status==="pago"); if(!grupos[k]) grupos[k] = []; grupos[k].push(i); });
  var linhas = [], feitos = {};
  ls.forEach(function(i){
    if(i.grupo!=="Representantes"){ linhas.push(linha(i)); return; }
    var k = chaveGrupo(i, i.status==="pago"), its = grupos[k];
    if(its.length===1){ linhas.push(linha(i)); return; }
    if(feitos[k]) return;
    feitos[k] = 1;
    var ap = i.status==="apagar", op = !!grAb[k], nats = [], venc = its.map(function(x){ return x.venc || ""; }).filter(Boolean).sort()[0] || "", atr = Math.max.apply(null, its.map(function(x){ return anoErrado(x.venc) ? 0 : (x.atraso || 0); })), errada = its.some(function(x){ return anoErrado(x.venc); });
    its.forEach(function(x){ if(nats.indexOf(x.natNome)<0) nats.push(x.natNome); });
    linhas.push({id:"g|"+k, grupo:true, k:k, its:its, fil:i.filial, nome:(op ? "▾ " : "▸ ")+i.nome, venc:dm(venc), pago:dm(i.baixa), cnpj:cnpjTxt(i.filial), num:its.length+" títulos", parc:"—", nat:nats.join(" · "), nota:its.every(function(x){ return x.nota==="sem"; }) ? "Sem nota" : "Com nota", valor:soma(its), orig:r2(its.reduce(function(t0, x){ return t0+(x.valorTitulo==null ? x.valor : x.valorTitulo); }, 0)), emis:dm(its.map(function(x){ return x.emissao || ""; }).sort()[0]), setor:"Representantes", cod:its[0].nat || "—", sit:ap ? (errada ? "Data errada" : atr>0 ? "Atrasada · "+atr+" dias" : "A pagar") : "Pago", abrir:op ? "Fechar" : "Abrir", acao:"", ap:ap, atr:atr});
    if(op) its.forEach(function(x){ linhas.push(linha(x, true)); });
  });
  var corSit = function(l){ var ap = l.grupo ? l.ap : l.it.status==="apagar", atr = l.grupo ? l.atr : l.it.atraso; return ap && atr>0 ? "text-warning" : !ap ? "text-success" : ""; };
  var botaoDesfazer = function(v, l){ return l.it && l.it.bx ? e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); if(window.confirm("Desfazer este pagamento? A conta volta para A pagar.")) cx.dispatch({type:"CPE_BAIXA_DESFAZ", id:l.it.bx.id, por:s.usuario}); }, className:"h-8 rounded-md border border-border px-2 text-[13px] text-foreground hover:bg-white/10"}, "Desfazer") : ""; };
  // COMPROVANTE: o anexo feito na janela de pagamento. "Ver" abre o arquivo; "Falta anexar" = pago pelo Admin sem comprovante; "—" = pago na DevMaster (não vem anexo)
  // dívida de prestador (Financeiro familiar): os comprovantes vêm dos Pix/repasses que a quitaram (itensDividasPrestadores → comps); um só = "Ver", vários = "Ver 1", "Ver 2" (o valor aparece ao passar o mouse)
  var verCompFam = function(l){ var cs = (l.it && l.it.comps) || []; return e("span",{className:"inline-flex items-center justify-center gap-2"}, cs.map(function(c, k){ return e("button",{key:c.key, type:"button", title:"Comprovante de "+BKC(c.valor)+" · "+dm(c.data), onClick:function(ev){ ev.stopPropagation(); abrirAnexo(c.key).catch(function(){ window.alert("Não consegui abrir o comprovante."); }); }, className:"cursor-pointer underline"}, cs.length>1 ? "Ver "+(k+1) : "Ver"); })); };
  var verComp = function(v, l){ if(v==="Ver" && l.it && l.it.comps && l.it.comps.length) return verCompFam(l); var b = l.it && l.it.bx; if(v==="Ver" && b && b.comprovante) return e("a",{href:b.comprovante.url, target:"_blank", rel:"noreferrer", onClick:function(ev){ ev.stopPropagation(); }, className:"cursor-pointer underline"}, "Ver"); return v==="Falta anexar" ? e("span",{className:"text-warning"}, v) : v; };
  // PRIMEIRA COLUNA "Abrir" (Marcus, 12/11/2026): fica parada à esquerda; o meio da tabela só rola para o lado com a mãozinha. Só ela abre a conta (ou abre/fecha o grupo do representante).
  var botaoAbrir = function(v, l){ return e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); aoClicar(l); }, className:"cursor-pointer text-[13px] font-semibold underline hover:text-primary"}, l.grupo ? v : "Abrir"); };
  var cols = [{k:"abrir", t:"Abrir", fixa:true, render:botaoAbrir}, {k:"sit", t:"Situação", cor:corSit}].concat(PAGO ? [{k:"pago", t:"Pago em"}] : [], [{k:"venc", t:"Vence"}, {k:"nome", t:"Fornecedor"}, {k:"valor", t:"Valor", fmt:BKC}], PAGO ? [{k:"forma", t:"Forma"}, {k:"saida", t:"Conta de saída"}, {k:"compro", t:"Comprovante", render:verComp}, {k:"por", t:"Pago por"}] : [],
    (verFam ? [{k:"rateio", t:"Pessoa"}] : []).concat([{k:"cnpj", t:"CNPJ", render:corCnpj}, {k:"dono", t:"Dono"}, {k:"origem", t:"Origem"}, {k:"dm", t:"Na DevMaster"}], [{k:"num", t:"Número"}, {k:"parc", t:"Parcela"}, {k:"nat", t:"Natureza"}, {k:"nota", t:"Nota"}, {k:"setor", t:"Setor"}, {k:"cod", t:"Cód. natureza"}]).concat(ABERTO ? [{k:"emis", t:"Emissão"}, {k:"orig", t:"Valor original", fmt:BKC}] : []), [],
    colAcao && linhas.some(function(l){ return l.it && l.it.bx; }) ? [{k:"acao", t:"Desfazer", render:botaoDesfazer}] : []);   // a coluna só aparece quando há pagamento feito pelo Admin na tela (os da DevMaster não podem ser desfeitos aqui)
  // COLUNAS DO JEITO DE CADA UM (Marcus, 16/11/2026): cada pessoa abre/fecha colunas (menu "Colunas") e muda a ordem segurando o título e soltando em cima de outra. Fica guardado neste navegador, por usuário. "Abrir" e "Desfazer" não mudam.
  var ordenaCols = function(lista){
    var od = prefCols.ordem || [], pos = [], ks = [], out = lista.slice();
    lista.forEach(function(c, ci){ if(!c.fixa && c.k!=="acao" && od.indexOf(c.k)>=0){ pos.push(ci); ks.push(c.k); } });
    ks.sort(function(a, b){ return od.indexOf(a)-od.indexOf(b); });
    pos.forEach(function(ci, j){ out[ci] = lista.filter(function(c){ return c.k===ks[j]; })[0]; });
    return out;
  };
  var colsOrdenadas = ordenaCols(cols), ocultas = prefCols.ocultas || [];
  cols = colsOrdenadas.filter(function(c){ return c.fixa || c.k==="acao" || ocultas.indexOf(c.k)<0; });
  var opcoesCols = colsOrdenadas.filter(function(c){ return !c.fixa && c.k!=="acao"; });
  var mudaPref = function(novo){ var o = Object.assign({}, prefCols, novo); setPrefCols(o); try{ localStorage.setItem(chavePref, JSON.stringify(o)); }catch(x){} };
  var moverCol = function(de, para){
    if(de===para) return;
    var ks = opcoesCols.map(function(c){ return c.k; }), a = ks.indexOf(de), b = ks.indexOf(para); if(a<0 || b<0) return;
    ks.splice(a, 1); ks.splice(b, 0, de); mudaPref({ordem:ks});
  };
  var temPref = (prefCols.ordem && prefCols.ordem.length) || ocultas.length;
  // POR DIA (Marcus, 12/11/2026): uma linha por dia (vencimento em Contas a pagar, pagamento em Contas pagas): quantas contas, total e quanto em cada CNPJ
  // TOTAL POR DIA e POR MÊS (Marcus, 12/11/2026): uma linha por dia (ou por mês), com quantas contas, quanto em cada CNPJ, o total e o ACUMULADO (soma linha após linha; na última dá o total de tudo que está na tela)
  var mesHoje = hoje0.slice(0, 7);
  var totaisPor = function(chaveDe, rotuloDe, sitDe2){ var gr = {}; ls.forEach(function(i){ var k = chaveDe(i); (gr[k] = gr[k] || []).push(i); });
    var ks = Object.keys(gr).filter(function(k){ return k; }).sort(); if(gr[""]) ks.push(""); var acum = 0;
    return ks.map(function(k){ var its = gr[k], tot = soma(its), tudoPago = its.every(function(i){ return i.status==="pago"; }); acum = r2(acum+tot);
      // linha fora do período escolhido: só entrou o que está atrasado e em aberto (as pagas daquele mês não entram); a situação avisa isso (Marcus, 13/11/2026)
      var soAtraso = !!faixa && its.every(function(i){ var db = dataBase(i); return !(db>=faixa[0] && db<=faixa[1]); });
      var o = {id:"d"+k, dia:k ? rotuloDe(k) : "Sem data", qtd:its.length, total:tot, acum:acum, sit:tudoPago ? "Pago" : !k ? "Sem data" : soAtraso ? "Atrasadas · só em aberto" : sitDe2(k)};
      FILIAIS.forEach(function(f){ o["c"+f[0]] = soma(its.filter(function(i){ return i.filial===f[0]; })); }); o.cfam = soma(its.filter(function(i){ return i.filial==="fam"; })); return o; }); };
  // O TOTAL ACOMPANHA A ABA DO PERÍODO (Marcus, 12/11/2026): Dias = uma linha por dia, Meses = uma por mês, Anos = uma por ano.
  var anoHoje = hoje0.slice(0, 4);
  var linhasDia = per.modo==="anos" ? totaisPor(function(i){ return dataBase(i).slice(0, 4); }, function(k){ return k; }, function(k){ return k<anoHoje ? "Atrasadas" : k===anoHoje ? "Ano atual" : "A vencer"; })
    : per.modo==="meses" ? totaisPor(function(i){ return dataBase(i).slice(0, 7); }, function(k){ return nomeMes(k); }, function(k){ return k<mesHoje ? "Atrasadas" : k===mesHoje ? "Mês atual" : "A vencer"; })
    : totaisPor(dataBase, dm, function(k){ return k<hoje0 ? "Atrasadas" : k===hoje0 ? "Hoje" : "A vencer"; });
  var corDia = function(l){ return l.sit.indexOf("Atrasadas")===0 ? "text-warning" : l.sit==="Pago" ? "text-success" : ""; };
  var colsDia = [{k:"dia", t:per.modo==="anos" ? "Ano" : per.modo==="meses" ? "Mês" : escopo==="pagas" ? "Pago em" : escopo==="apagar" ? "Vence" : "Data", cor:corDia}, {k:"sit", t:"Situação", cor:corDia}, {k:"qtd", t:escopo==="pagas" ? "Pagamentos" : "Contas"}].concat(FILIAIS.map(function(f){ return {k:"c"+f[0], t:f[0]==="fora" ? "Por fora" : f[1], fmt:BKC}; }), [{k:"total", t:"Total", fmt:BKC}, {k:"acum", t:"Acumulado", fmt:BKC}]);   // os CNPJs vêm ANTES do Total e do Acumulado (Marcus, 12/11/2026)
  if(quem!=="empresa") colsDia.splice(colsDia.length-1, 0, {k:"cfam", t:"Família", fmt:BKC});   // coluna Família no Total por dia (antes do Acumulado)
  var aoClicar = function(l){ if(l.grupo){ var o = Object.assign({}, grAb); o[l.k] = !grAb[l.k]; setGrAb(o); return; } if(l.it && l.it.ff){ cx.dispatch({type:"ABA", aba:l.it.ffAba || "ffcontas"}); return; } setAberta(l.it); };
  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    aberta && e(PagamentoConta,{key:aberta.id, s:s, item:aberta, lista:ls, podePagar:podePagar, fechar:function(){ setAberta(null); }, ir:function(x){ if(x) setAberta(x); }, salvar:function(b){ cx.dispatch({type:"CPE_BAIXA", baixas:[b]}); setAberta(null); }, desfazer:function(id){ cx.dispatch({type:"CPE_BAIXA_DESFAZ", id:id, por:s.usuario}); setAberta(null); }, excluir:function(id){ cx.dispatch({type:"CPE_LANC_DEL", id:id, por:s.usuario}); setAberta(null); }, trocarFilial:function(it, f){ cx.dispatch({type:"CPE_FILIAL", chave:it.chave, filial:f, por:s.usuario, desc:it.nome, valor:it.valor}); setAberta(null); }}),
    e(BlocoPainel,{titulo:escopo==="apagar" ? "Contas a pagar" : escopo==="pagas" ? "Contas pagas" : "Contas a pagar e pagas", compacto:true},
      // controles compactos numa faixa azul: visão (Separado | Total), situação (A pagar | Pagas | Todas) e mês (Marcus, 12/11/2026)
      e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1"},
        menuSusp([["lista", "Separado"], ["dia", "Total"]], vista, setVista, "Visão", "w-32"),   // o Total muda com a aba do período: Dias, Meses ou Anos
        menuSusp([["apagar", "A pagar"], ["pagas", "Pagas"], ["todas", "Todas"]], escopo, function(k){ setEscopo(k); if(k==="pagas") setPer({atras:false}); }, "Situação", "w-32"),
        e(SeletorPeriodo,{anoAtual:anoAtual, anos:anosHist.concat([anoAtual]), carr:carr, per:per, setPer:setPer, comAtraso:ABERTO}),
        verFam && listaPessoas.length>0 && e("select",{value:pessoaSel, onChange:function(ev){ setPessoaSel(ev.target.value); }, "aria-label":"Pessoa", className:"h-8 w-44 min-w-0 rounded-md border border-border bg-card px-2 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"}, [e("option",{key:"", value:""}, "Todas as pessoas")].concat(listaPessoas.map(function(n0){ return e("option",{key:n0, value:n0}, n0); }))),
        e("input",{type:"search", value:buscaTxt, onChange:function(ev){ setBuscaTxt(ev.target.value); }, placeholder:"Buscar: nome, pessoa, valor...", "aria-label":"Buscar nas contas", className:"h-8 w-56 min-w-0 rounded-md border border-border bg-card px-2.5 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"}),   // padrao-ok: busca no alto pedida pelo Marcus em 16/11/2026
        vista==="lista" && e(MenuMulti,{cls:"w-32", rodape:{rotulo:"Voltar ao padrão", onClick:function(){ mudaPref({ordem:[], ocultas:[]}); }}, opcoes:opcoesCols.map(function(c){ return [c.k, c.t]; }), valor:opcoesCols.filter(function(c){ return ocultas.indexOf(c.k)<0; }).map(function(c){ return c.k; }), onChange:function(lista){ mudaPref({ocultas:opcoesCols.map(function(c){ return c.k; }).filter(function(k){ return lista.indexOf(k)<0; })}); }, plural:"colunas", vazio:"Nenhuma coluna"}),
        verFam && menuSusp([["empresa", "Empresa"], ["familia", "Família"], ["junto", "Junto"]], quem, setQuem, "Contas", "w-32")),   // só quem tem a autorização financeiro_familia vê este botão; padrão = Empresa
      vista!=="lista" ? e(TabelaPlanilha,{key:escopo+vista, cols:colsDia, linhas:linhasDia, chave:"id", grade:true, semContagem:true, vazio:"Nenhuma conta."}) : e(TabelaPlanilha,{key:escopo, cols:cols, aoMoverColuna:moverCol, alturaMax:"calc(100vh - 12rem)", linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true, maozinha:true, paginas:true, limite:porPag, opcoesLimite:[50, 100, 200, 500], aoMudarLimite:function(n0){ setPorPag(n0); try{ localStorage.setItem("sorelly_cpa_porpag", String(n0)); }catch(x){} }, linhaCls:function(l){ return l.filho || (l.grupo && grAb[l.k]) ? "bg-white/[0.16]" : ""; }, vazio:"Nenhuma conta neste filtro."})));
}

function AbaCtaLista(){ return e(TelaContas,{modo:"pagar"}); }
function AbaCtaPagas(){ return e(TelaContas,{modo:"pagas"}); }
export { AbaCtaLista, AbaCtaPagas };

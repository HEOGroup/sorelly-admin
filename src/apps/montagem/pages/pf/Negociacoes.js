// Sorelly Admin · montagem — pages/pf/Negociacoes.js
// Tela "Negociação de Fornecedores" (Pagamentos a Fornecedores): filtros, avisos da semana, painel de endividamento (3 abas), resumo da negociação,
// pedidos sem parcela, relação por mês com as parcelas e as janelas: Lançar pedido, Lançar parcela, Detalhe do pedido e Datas limite.
// Quando o fornecedor filtrado é a Point, mostra o painel de conta corrente dela (pf/Point.js). As contas ficam em domain/pf.js; aqui só desenha.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { CNPJS0 } from "@/apps/montagem/domain/cnpjs";
import { extrasDevmaster, parcelasBaixadasDm } from "@/apps/montagem/domain/contas-empresa";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { menuMini } from "@/apps/montagem/pages/ContasReceberLista";
import { FILTRO_PADRAO, FORMAS, FORN_CATS, addDias, addMeses, F_PER, F_SIT, F_TIPO, NF_LABEL, PT_FORN, acertoPreset, acertoPresetAtivo, acertoResumo, agregar, alertasDe, blocosDoMes, cicloLabel,
  coletar, dataValida, janelasDoForn, pagoJanela, dividirNF, diaISO, ehPrestador, expandirParcelas, pendentesPrestadores, forn, formasDoPedido, gerarParcelas, hojeIso, mesLabel, painelTotais, parcelaSituacao, pedidoDetalhe, pedidosSemParcela, pfReduz,
  relacaoPorMes, resumoAlertas, resumoNegociacao, saldoParcela, tabelaJanelas, temOverride, ultDia, viewMatriz, viewTempo } from "@/apps/montagem/domain/pf";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { Dinheiro } from "@/apps/montagem/components/padrao";
import { Segmentado } from "@/apps/montagem/components/padrao-fin";
import { abrirAnexo, enviarAnexo, lerArquivo as lerAnexo } from "@/apps/montagem/lib/anexo";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { e, useEffect, useState } from "@/shared/react";
import { apiAtiva, chamar, token } from "@/apps/montagem/lib/api";
import { BotaoMini, COMPACTA } from "./Lancamentos";
import { PointPainel } from "./Point";
import { PainelPontual } from "./Resumo";
import { CARD, COR, Campo, Chip, Modal, TD, Tile, Txt, aviso, brl, dbr, opc, th, usePf } from "./ui";

// ---------- pequenas peças de desenho ----------
// mesmo visual da tela Lançamento de pagamentos (Marcus, 20/11/2026): blocos colados na largura toda, letra e linha finas, faixa de escolha dentro do bloco
var BlocoBarra = function(p){ return e(BlocoPainel,{titulo:p.t, dir:p.dir, acao:p.acao, semBarra:p.semBarra, compacto:true, cls:COMPACTA+(p.semBarra ? "" : " [&>div:first-child]:!py-1")+(p.extra || "")}, p.children); };
var MIUDO = " [&_*]:!text-[10px] [&_*]:!leading-tight [&_button]:!h-[18px] [&_button]:!min-h-0 [&_button]:!py-0 [&_button]:!px-1.5 [&_select]:!h-[18px] [&_select]:!py-0 [&_input]:!h-[18px] [&_input]:!py-0 [&_td]:!text-center [&_th]:!text-center [&_td]:!whitespace-nowrap [&_th]:!whitespace-nowrap [&_tbody_tr]:!border-b [&_tbody_tr]:!border-white/45 [&_tbody_td]:!border-b [&_tbody_td]:!border-white/45 [&_td_span.rounded-full]:!px-1.5 [&_td_span.rounded-full]:!py-0 [&_td_span.rounded-full]:!leading-[14px]";   // padrao-ok: tela inteira com a letra fina da tela de Lançamento (pedido do Marcus, 20/11/2026)
var GRANDE = "[&_table_tbody_td]:!h-[46px] [&_table_tbody_tr]:!h-[46px] [&_table_tbody_td]:!text-[17px] [&_table_tbody_td]:!leading-tight";   // padrao-ok: fornecedor escolhido, linha e letra 3 vezes maiores (pedido do Marcus, 21/11/2026)
var BARRA_TOPO = "flex flex-wrap items-center gap-x-3 gap-y-0.5 border-b-2 border-white/30 bg-[var(--bloco-titulo)] px-2 py-0.5 [&_button]:!h-[18px] [&_button]:!py-0 [&_button]:!leading-none [&_button]:!px-1 [&_button]:!text-[10px] [&_button]:!border-white/25 [&_button]:!bg-white/10";   // padrao-ok: barra única de filtros e abas (Marcus, 21/11/2026)
var COR_TIPO = {"Banho":"text-[#e0b64a]", "Bruto":"text-sky-400", "Material gráfico":"text-violet-300", "Sistema":"text-emerald-300", "Tintas":"text-pink-300", "Prestador":"text-orange-300"};   // padrao-ok: cor por tipo de fornecedor (pedido do Marcus, 23/11/2026)
var corTipo = function(l){ return (COR_TIPO[l.tipo] || "") + " font-bold"; };
var LISTA = "[&_table_tbody_td]:!h-[24px] [&_table_tbody_tr]:!h-[24px] [&_table_tbody_td]:!text-[10px] [&_table_tbody_td:nth-child(-n+2)]:!text-[11px] [&_table_tfoot_td]:!text-[11px] [&_table_tfoot_td]:!h-[24px] [&_table_tfoot_tr]:!h-[24px] [&_table_td]:!px-1 [&_table_th]:!px-1 [&_table_th]:!tracking-normal [&_table_th]:!text-[10px] [&_table_th_div]:!px-1 [&_table_th_div]:!text-[10px] [&_table_th_div]:!tracking-normal [&_thead_tr:first-child_th:nth-child(2)]:!bg-[rgba(45,212,191,0.1)] [&_thead_tr:first-child_th:nth-child(3)]:!bg-[rgba(45,212,191,0.16)] [&_thead_tr:first-child_th:nth-child(4)]:!bg-[rgba(45,212,191,0.24)] [&_thead_tr:nth-child(2)_th:nth-child(n+3):nth-child(-n+5)]:!bg-[rgba(45,212,191,0.1)] [&_thead_tr:nth-child(2)_th:nth-child(n+6):nth-child(-n+8)]:!bg-[rgba(45,212,191,0.16)] [&_thead_tr:nth-child(2)_th:nth-child(n+9):nth-child(-n+11)]:!bg-[rgba(45,212,191,0.24)] [&_.border-l-2]:!border-l-[3px] [&_.border-l-2]:!border-l-white/85 [&_table_tfoot_td]:!font-bold [&_table_tbody_td]:!leading-tight";   // padrao-ok: lista de fornecedores 20% maior, Tipo e Fornecedor 13 px, números 1,5 px menores, Total maior (Marcus, 23/11/2026)
var GRANDE_TOTAL = "[&_table_tbody_td]:!h-[29px] [&_table_tbody_tr]:!h-[29px] [&_table_tbody_td]:!text-[14px] [&_table_tbody_td]:!leading-tight";   // padrao-ok: total do pedido com letra maior (Marcus, 21/11/2026)
var MEIO = "[&_.overflow-x-auto]:!h-full [&_table]:!h-full";   // as linhas do mini bloco esticam (a letra não muda), para o Total ficar embaixo, na mesma altura da direita
var FONTE_ESQ = "[&_table_tbody_td]:!text-[12px] [&_table_tfoot_td]:!text-[12px] [&_table_th]:!text-[11px] [&_table_tbody_td]:!leading-tight";   // padrao-ok: coluna da esquerda com uma fonte só (Marcus, 21/11/2026)
var sepBloco = function(k){ return e("div",{key:k, className:"h-[3px] bg-white"}); };   // faixa que separa um bloco do outro (Marcus, 20/11/2026)
var TELA = PADRAO_BLOCOS+MIUDO+" -mx-4 -mb-4 md:-mx-6 md:-mb-6 flex flex-col gap-0 [&_section]:!rounded-none [&_section]:!border-x-[4px] [&_section]:!border-y-0";
var FAIXA = "flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5 border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-1.5 py-1 [&_button]:!h-[18px] [&_button]:!py-0 [&_button]:!leading-none [&_button]:!px-1 [&_button]:!text-[10px] [&_button]:!justify-center [&_button]:!border-white/25 [&_button]:!bg-white/10";   // padrao-ok: mesma faixa da Contas a receber
var NUM = TD+" text-right "+MONO, TN = " text-right!";
var LIN = "border-b border-border/40", CLIC = " cursor-pointer hover:bg-white/5";
var TOTAL = "border-t-2 border-border bg-white/10 font-extrabold";
var MUTED = "text-white/70";
var cor = function(k){ return COR[k] || COR.gray; };
var tom = function(k){ return {color:cor(k)}; };   // verde/vermelho/laranja de números
var Rot = function(t, extra){ return e("div",{className:"text-[12px] font-bold uppercase tracking-[.12em] text-white/80 "+(extra||"")}, t); };
var Vazio = function(t, k){ return e("p",{key:k, className:"rounded-xl bg-muted/30 px-4 py-5 text-center text-[14px] text-white/80"}, t); };
var Rolagem = function(children){ return e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, children)); };
var AL = function(rot, val, st, k){ return e("div",{key:k, className:"flex items-center justify-between gap-3 text-[11px]"}, e("span",{className:"text-white/90"}, rot), e("b",{className:MONO, style:st}, val)); };
var Btn = function(p){
  var cl = p.perigo ? "bg-destructive/25 text-destructive hover:bg-destructive/40" : p.neutro ? "bg-muted/60 text-white hover:bg-white/15" : "bg-linear-to-r from-[#B8862B] to-[#E8B84B] text-[#1B1409] hover:brightness-110";
  return e("button",{type:"button", disabled:p.disabled, onClick:p.onClick, title:p.titulo, className:"inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-bold transition disabled:opacity-40 "+(p.g ? "h-10 px-4 text-[14px] " : "h-8 px-3 text-[12.5px] ")+cl+" "+(p.className||"")}, p.ic && e(Ph,{n:p.ic, s:p.g ? 16 : 14}), p.children);
};
var BtJ = function(p){ return e("button",{type:"button", disabled:p.disabled, onClick:p.onClick, title:p.titulo, className:"inline-flex h-[28px] items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-3 text-[11px] font-bold transition disabled:opacity-40 "+(p.neutro ? "border-[#5b8bd9]/60 bg-[#2d5190]/40 text-white hover:bg-[#2d5190]/70" : "border-[#7fa6ea] bg-[#2d5190] text-white hover:bg-[#3a63ad]")}, p.ic && e(Ph,{n:p.ic, s:14}), p.children); };   // padrao-ok: botões da janela de 28 px, em azul (Marcus, 21/11/2026)
var ModalAzul = function(p){ return e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-black/60 p-4", onClick:p.fechar},
  e("div",{className:"flex max-h-[92vh] w-full "+(p.larga ? "max-w-6xl" : "max-w-5xl")+" flex-col overflow-hidden border border-white/40 bg-[#0f1729] text-white", onClick:function(ev){ ev.stopPropagation(); }},
    e("div",{className:"relative bg-[#2d5190] px-3 py-1.5 text-center text-[13px] font-bold uppercase"}, p.t, e("button",{type:"button", "aria-label":"Fechar", onClick:p.fechar, className:"absolute right-2 top-1/2 -translate-y-1/2 text-[13px] hover:text-white/70"}, "✕")),
    p.sub && e("p",{className:"border-b border-white/30 bg-[#1b2a4a] px-3 py-1 text-center text-[11px]"}, p.sub),
    e("div",{className:"min-h-0 flex-1 overflow-y-auto p-3"}, p.children))); };
var BAR_J = "bg-[#2d5190] px-2 py-1 text-center text-[11px] font-bold uppercase";
var Sec = function(titulo){ var filhos = Array.prototype.slice.call(arguments, 1); return e("div",{className:"border border-white/35"}, e("div",{className:BAR_J}, titulo), e.apply(null, ["div",{className:"flex flex-col gap-2 p-2"}].concat(filhos))); };
var MODAL_PED = "[&_input]:!h-[20px] [&_select]:!h-[20px] [&_input]:!py-0 [&_select]:!py-0 [&_input]:!text-[11px] [&_select]:!text-[11px] [&_textarea]:!text-[11px] [&_input]:!rounded-md [&_select]:!rounded-md [&_input]:!bg-white/10 [&_select]:!bg-white/10 [&_textarea]:!bg-transparent [&_input]:!border [&_select]:!border [&_input]:!border-white/35 [&_select]:!border-white/35 [&_input]:!text-center [&_select]:!text-center [&_input[type=date]]:![text-align-last:center] [&_input::-webkit-datetime-edit]:!flex-1 [&_input::-webkit-datetime-edit]:!text-center [&_input]:!px-2 [&_select]:!px-2 [&_input]:!shadow-none [&_select]:!shadow-none [&_input:focus]:!border-[#E8B84B] [&_select:focus]:!border-[#E8B84B] [&_input::placeholder]:!text-white/60 [&_select_option]:bg-[#16264a] [&_label]:!gap-1 [&_label]:!text-[11px] [&_label]:!font-bold [&_label]:!uppercase";   // padrao-ok: janela azul, campos de 20 px com caixa clara, centralizados, letra de 11 px (Marcus, 21/11/2026)
var Chips = function(lista, atual, muda){
  return e("div",{className:"flex flex-wrap gap-1.5"}, lista.map(function(x){ var on = atual===x[0];
    return e("button",{key:x[0], type:"button", onClick:function(){ muda(x[0]); }, className:"rounded-full px-3.5 py-1.5 text-[13px] font-bold transition "+(on ? "bg-linear-to-r from-[#B8862B] to-[#E8B84B] text-[#1B1409]" : "bg-muted/50 text-white hover:bg-white/15")}, x[1]); }));
};
// campo pequeno para as linhas de parcela
var In = function(p){ return e("input",{value:p.value, type:p.type||"text", step:p.type==="number" ? "0.01" : undefined, min:p.min, placeholder:p.ph||"", disabled:p.disabled, "aria-label":p.label, className:INPUT+" h-8! w-full min-w-0 px-2! text-[11px]! "+(p.num ? "text-right " : "")+(p.disabled ? "opacity-50" : ""), onChange:function(ev){ p.onChange(ev.target.value); }}); };
var Sl = function(p){ return e("select",{value:p.value, "aria-label":p.label, className:INPUT+" h-8! w-full min-w-0 cursor-pointer px-2! text-[11px]!", onChange:function(ev){ p.onChange(ev.target.value); }}, p.children); };
// data com calendário: a data aparece escrita no meio e clicar em qualquer ponto abre o calendário do navegador (o campo de data do navegador não centraliza)
var DataCal = function(p){
  var v = /^\d{4}-\d{2}-\d{2}$/.test(p.value || "") ? p.value.slice(8, 10)+"/"+p.value.slice(5, 7)+"/"+p.value.slice(0, 4) : "dd/mm/aaaa";
  return e("div",{className:"relative flex h-[20px] w-full min-w-0 items-center justify-center rounded-md border border-white/35 bg-white/10 text-[11px]"},   // padrao-ok: campo de data de 20 px com calendário (Marcus, 21/11/2026)
    e("span",null, v), e("span",{className:"absolute right-2 text-[11px]", "aria-hidden":true}, "▾"),
    e("input",{type:"date", value:p.value || "", "aria-label":p.label, className:"absolute inset-0 h-full w-full cursor-pointer opacity-0", onClick:function(ev){ try{ ev.target.showPicker(); }catch(x){} }, onChange:function(ev){ p.onChange(ev.target.value); }}));
};
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
// Regra de negociação de cada fornecedor (Marcus, 21/11/2026): uma linha para o que tem nota (boleto) e outra para o Pix. Os números padrão vêm dos pedidos já lançados; "Salvar como padrão" grava no fornecedor (regraNeg).
var REGRA_FORN = {"pontual":[30,6,6,30,30,"boleto"], "ellos galvânica":[30,5,5,0,0,"boleto"], "mega sul":[30,6,6,0,0,"cheque"], "art ello":[30,3,3,0,0,"boleto"], "office graf":[20,5,5,30,30,"boleto"], "point":[0,0,1,30,30,"boleto"], "devmaster":[0,0,1,30,30,"boleto"]};   // regra padrão por fornecedor, dos pedidos já lançados (Marcus, 21/11/2026: a mesma janela para todos)
var ehPontual = function(pf, fornId){ var f = forn(pf, fornId); return !!f && String(f.nome).toLowerCase()==="pontual"; };
// Banho = operação triangular (Sorelly manda o bruto de um fornecedor para a galvânica): Pontual e Ellos. O Cadastro de peças (Rayssa) já liga cada fatura ao fornecedor do bruto e aos pedidos de bruto (com a nota do fornecedor).
var ehBanho = function(pf, id){ return id===pf.mqFornId || /ellos/i.test((forn(pf, id) || {}).nome || ""); };
var normForn = function(n){ var t = String(n || "").trim(); if(!/saldo/i.test(t)) return t; var b = t.replace(/saldo/ig, "").replace(/[-–]/g, " ").replace(/\s+/g, " ").trim(); return (b || "Saldo")+" (Saldo)"; };   // "Mega Sul - Saldo", "Saldo Mega Sul", "Adereço Saldo" => "Mega Sul (Saldo)"
var ligarCadastro = function(cpc, fatTxt){
  var fats = ((cpc && cpc.fatP) || []).concat((cpc && cpc.fatE) || []), peds = (cpc && cpc.pedidos) || [], forns = [], notas = [], ids = [];
  String(fatTxt || "").split(/[^0-9]+/).filter(function(x){ return x.length>=4; }).forEach(function(n){ fats.filter(function(f){ return String(f.fatura)===n; }).forEach(function(f){
    var nf = normForn(f.forn); if(nf && forns.indexOf(nf)<0) forns.push(nf);
    (f.pedidos || []).forEach(function(id){ var o = peds.find(function(x){ return x.id===id; }); if(!o) return; if(ids.indexOf(id)<0) ids.push(id); var nt = String(o.nota || "").trim(); if(nt && notas.indexOf(nt)<0) notas.push(nt); }); }); });
  return {forn:forns.join(" - "), nota:notas.join(" - "), ids:ids};
};
var regraPadrao = function(pf, fornId){
  var f = forn(pf, fornId); if(f && f.regraNeg) return JSON.parse(JSON.stringify(f.regraNeg));
  var a = (f && REGRA_FORN[String(f.nome).toLowerCase()]) || [0,0,1,30,30,"boleto"];
  return {pct:a[0], arq:null, com:{n:a[1], forma:a[5], primeiro:a[3], intervalo:30}, sem:{n:a[2], forma:"pix_revendedora", primeiro:a[4], intervalo:30}};
};
var linhasRegra = function(ped, L, valor, forma){
  var n = parseInt(L.n) || 0; if(n<=0 || valor<=0.005) return [];
  var base = addDias(ped.data || hojeIso(), parseInt(L.primeiro) || 0), iv = parseInt(L.intervalo) || 30, un = Math.floor(valor/n*100)/100, resto = Math.round((valor-un*n)*100)/100, out = [];
  for(var i=0; i<n; i++) out.push({forma:forma, venc:iv===30 ? addMeses(base, i) : addDias(base, i*iv), valor:(i===n-1 ? Math.round((un+resto)*100)/100 : un).toFixed(2), qtd:"1", conta:"", status:"Pendente"});
  return out;
};
// as 5 propostas do sistema: a regra do fornecedor, uma mais curta, uma mais longa e duas com mais prazo no 1º pagamento
var PROPOSTAS = [[null,null,null], ["Mais curta (4x)",4,null], ["Mais longa (8x)",8,null], ["1º em 45 dias (5x)",5,45], ["1º em 60 dias (4x)",4,60]];
var propostasDe = function(ped, regra, X){
  return PROPOSTAS.map(function(q, i){
    var com = Object.assign({}, regra.com), sem = Object.assign({}, regra.sem);
    if(q[1]!==null){ com.n = parseInt(regra.com.n) ? q[1] : 0; sem.n = parseInt(regra.sem.n) ? q[1] : 0; }
    if(q[2]!==null){ com.primeiro = q[2]; sem.primeiro = q[2]; }
    return {i:i, nome:q[0] || "Padrão ("+Math.max(parseInt(regra.com.n) || 0, parseInt(regra.sem.n) || 0)+"x)", nx:Math.max(parseInt(com.n) || 0, parseInt(sem.n) || 0), com:linhasRegra(ped, com, X.com, regra.com.forma), sem:linhasRegra(ped, sem, X.sem, "pix_revendedora")};
  });
};
// pedido já lançado → o mesmo formulário do "Lançar pedido", preenchido (chamado do Lucas, 09/11/2026). Parcela paga entra com status Pago e fica travada no domínio.
var pedidoParaEdicao = function(pd){
  var lin = function(p){ return {forma:p.forma, venc:p.venc, valor:(+p.valor||0).toFixed(2), qtd:"1", conta:p.conta==="—" ? "" : (p.conta||""), status:p.status||"Pendente", arq:p.arq || null}; };
  var comNF = (+pd.comNF||0)>0.005, semNF = (+pd.semNF||0)>0.005, nf = comNF && semNF ? "misto" : comNF ? "com" : "sem";
  return {prop:0, parcManual:true, msgManual:null, verParc:true, editId:pd.id, fornId:pd.fornId, numero:pd.numero==="s/nº" || pd.numero==="---" ? "" : (pd.numero||""), ref:pd.ref||"", nfArq:pd.nfArq || null, fornBruto:pd.fornBruto || "", notaForn:pd.notaForn || "", cpcId:pd.cpcId || "", pct:"", data:pd.data, total:String(pd.total), nf:nf, editado:"", com:String(pd.comNF||0), sem:String(pd.semNF||0), cnpj:pd.cnpj && pd.cnpj!=="Sem NF" ? pd.cnpj : CNPJS[0], nfNum:pd.nfNum||"",
    lcom:(pd.parcelas||[]).filter(function(p){ return FORMAS[p.forma] && FORMAS[p.forma].nf==="com"; }).map(lin), lsem:(pd.parcelas||[]).filter(function(p){ return FORMAS[p.forma] && FORMAS[p.forma].nf==="sem"; }).map(lin),
    qCom:"3", qSem:"2", nova:false, nomeNovo:"", catNovo:FORN_CATS[0], descricao:pd.descricao||"", limite:pd.limite||"", pixMin:pd.pixMin ? String(pd.pixMin) : ""};
};
var pedidoNovo = function(pf, fornId){ var id = fornId || (pf.fornecedores.length ? pf.fornecedores[0].id : 0); return {prop:0, parcManual:false, msgManual:null, verParc:false, fornId:id, numero:"", ref:"", nfArq:null, fornBruto:"", notaForn:"", cpcId:"", pct:id ? String(regraPadrao(pf, id).pct) : "", data:hojeIso(), total:"", nf:"misto", editado:"", com:"", sem:"", cnpj:CNPJS[0], nfNum:"", lcom:[], lsem:[], qCom:"3", qSem:"2", nova:false, nomeNovo:"", catNovo:FORN_CATS[0], descricao:"", limite:"", pixMin:""}; };

// Boletos da Point (C Group, Mayz...) lidos da DevMaster pelo servidor, ligados pelo número da nota fiscal (Marcus, 23/11/2026). Só leitura.
var POINT_NF = null;
function usePointNf(){
  var st = useState(0), setTick = st[1], tk = token();
  useEffect(function(){
    if(!apiAtiva() || !tk) return undefined;
    var vivo = true;
    chamar("GET", "/point-nf").then(function(r){ if(!vivo || !r || !r.boletos) return; POINT_NF = r; setTick(function(n){ return n+1; }); }).catch(function(){});
    return function(){ vivo = false; };
  }, [tk]);
  return POINT_NF;
}
// o que os boletos da Point somam: em aberto (todos os meses) e, no mês de hoje, o que vence, o que já foi pago e o que falta
function somaBoletosPoint(nf, mes){
  var o = {aberto:0, mesAP:0, mesPg:0};
  ((nf && nf.boletos) || []).forEach(function(b){
    o.aberto += b.saldo;
    if(String(b.venc).slice(0,7)===mes){ o.mesAP += b.valor; o.mesPg += b.valor-b.saldo; }
  });
  return o;
}
function AbaPfNeg(props){
  var visao = (props && props.visao) || "neg";
  var c = usePf(), pf = c.pf, ed = c.edita;
  var pnf = usePointNf();   // boletos da Point na DevMaster, ligados pela nota fiscal
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
  var sfb = useState(""), fBusca = sfb[0], setFBusca = sfb[1], sft = useState("todos"), fTipo = sft[0], setFTipo = sft[1], sfs = useState("aberto"), fSit = sfs[0], setFSit = sfs[1];   // filtros do resumo de fornecedores
  var sps = useState(null), selPed = sps[0], setSelPed = sps[1];   // pedido escolhido na tabela de pedidos: as parcelas mostram só ele
  var slc = useState(false), todosLanc = slc[0], setTodosLanc = slc[1];   // lista "Pedidos lançados": 30 mais novos ou todos
  var sab = useState({}), abPt = sab[0], setAbPt = sab[1], alPt = function(k, atual){ var o = Object.assign({}, abPt); o[k] = !atual; setAbPt(o); };   // linhas abertas da tela da Pontual
  if(!pf || !pf.fornecedores) return e("p",{className:"p-6"}, "Carregando…");

  var fId = fornF ? parseInt(fornF) : null, fo = fId ? forn(pf, fId) : null, ehPoint = fId===PT_FORN;
  var secAb = function(k){ return secs[k]!==false; };
  var togSec = function(k){ var n = Object.assign({}, secs); n[k] = !secAb(k); setSecs(n); };
  var verForn = function(id){ setFornF(fornF===String(id) ? "" : String(id)); setSelPed(null); };   // clicar na linha abre o fornecedor embaixo; clicar de novo fecha
  var abrirMes = function(m){ setMesAb(mesAb===m ? null : m); setAba("tempo"); };
  var abrirParcela = function(pedId, voltar){
    var pd = pf.pedidos.find(function(p){ return p.id===pedId; }); if(!pd) return;
    var fs = formasDoPedido(pd);
    setParc({pedId:pedId, forma:fs[0]||"", venc:diaISO(hojeIso().slice(0,7), 31), valor:"", qtd:"1", conta:"", status:"Pendente", voltar:!!voltar});
  };
  var baixa = function(pedId, idx){ opc(c, "parcela_baixa", {pedId:pedId, idx:idx}); };

  var TP = {escura:true, grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true};
  var tab = function(extra){ return e(TabelaPlanilha, Object.assign({}, TP, extra)); };
  var verde = function(){ return "text-success"; }, vermelhoSe = function(k){ return function(l){ return l[k]>0.005 ? "text-destructive" : ""; }; };
  var brlOu = function(v){ return v>0.005 ? brl(v) : "—"; };
  var LK = function(txt, fn){ return e("a",{href:"#", role:"button", onClick:function(ev){ ev.preventDefault(); ev.stopPropagation(); fn(); }, className:"underline text-[#7DD3FC]"}, txt); };
  var zeros = function(n){ var a = []; for(var i = 0; i<n; i++) a.push(""); return a; };

  // ---------- cabeçalho + filtros ----------
  var topo = null;
  var faixa = e("div",{className:FAIXA},
      menuMini(F_TIPO.map(function(x){ return [x[0], x[1]]; }), filtro.tipo, function(v){ setFiltro(Object.assign({}, filtro, {tipo:v})); }, "Tipo"),
      menuMini([["", "Todos os fornecedores"]].concat(pf.fornecedores.map(function(f){ return [String(f.id), f.nome]; })), fornF, setFornF, "Fornecedor"),
      menuMini(F_PER.map(function(x){ return [x[0], x[1]]; }), filtro.per, function(v){ setFiltro(Object.assign({}, filtro, {per:v})); }, "Período"),
      menuMini(F_SIT.map(function(x){ return [x[0], x[1]]; }), filtro.sit, function(v){ setFiltro(Object.assign({}, filtro, {sit:v})); }, "Situação"));
  var barra = e(BlocoPainel,{titulo:"Negociações", semBarra:true, compacto:true, cls:COMPACTA}, faixa);

  var modais = [
    ped && e(JanelaPedido,{key:"mp", c:c, pf:pf, ped:ped, setPed:setPed}),
    parc && e(JanelaParcela,{key:"mc", c:c, pf:pf, parc:parc, setParc:setParc, voltarDet:function(id){ setDetId(id); }}),
    detId && e(JanelaDetalhe,{key:"md", c:c, pf:pf, id:detId, fechar:function(){ setDetId(null); }, lancar:function(id){ setDetId(null); abrirParcela(id, true); }, editar:function(pd){ setDetId(null); setPed(pedidoParaEdicao(pd)); }, baixa:baixa}),
    ac && e(JanelaAcerto,{key:"ma", c:c, pf:pf, ac:ac, setAc:setAc})
  ];

  // ---------- PEDIDOS do fornecedor (Marcus, 20/11/2026): uma linha por pedido; clicar escolhe o pedido e as parcelas mostram só ele ----------
  var mesHoje = hojeIso().slice(0,7);
  var semNome = function(txt, f){ var t = String(txt || "").trim(); if(f && t.toLowerCase().indexOf(f.nome.toLowerCase())===0) t = t.slice(f.nome.length).replace(/^[\s·-]+/, ""); return !t || t==="s/nº" ? "s/nº" : t; };   // o nome do fornecedor não se repete em cada linha
  var listaL = (fId ? pf.pedidos.filter(function(p){ return p.fornId===fId; }) : pf.pedidos).slice().sort(function(a, b){ return b.id-a.id; });
  // um pedido é UM SÓ e se divide em formas de pagamento (boleto, cheque, Pix...): a tabela mostra a divisão em vez de texto comprido (Marcus, 21/11/2026)
  var forma = function(pd, nf){ var g = {}, ordem = []; (pd.parcelas || []).forEach(function(x){ if(FORMAS[x.forma].nf!==nf) return; var r = FORMAS[x.forma].label; if(!g[r]){ g[r] = 0; ordem.push(r); } g[r]++; }); return ordem.length ? ordem.map(function(r){ return r+" "+g[r]+"x"; }).join(" + ") : "---"; };
  var mmaa = function(d){ return d.slice(5, 7)+"/"+d.slice(2, 4); };
  var venc = function(pd){ var v = (pd.parcelas || []).map(function(x){ return x.venc; }).sort(); return v.length ? (mmaa(v[0])===mmaa(v[v.length-1]) ? mmaa(v[0]) : mmaa(v[0])+" a "+mmaa(v[v.length-1])) : "---"; };
  var COLS_L = [{k:"id", t:"Nº", fmt:function(v){ return "#"+v; }}, {k:"data", t:"Data", fmt:dbr}];
  if(!fId) COLS_L.push({k:"forn", t:"Fornecedor"});
  var pontual = ehBanho(pf, fId);   // Pontual e Ellos: operação triangular (a Sorelly manda o bruto do fornecedor para a Pontual banhar): NF da Pontual, Fatura, Fornecedor do bruto e a nota dele
  COLS_L = COLS_L.concat(pontual ? [{k:"mes", t:"Mês"}, {k:"nf", t:"NF do banho"}, {k:"fat", t:"Fatura"}, {k:"fb", t:"Fornecedor"}, {k:"nfb", t:"Nota do fornecedor"}] : [{k:"numero", t:"Pedido"}, {k:"ref", t:"Referência"}], [{k:"total", t:"Total", fmt:brl}, {k:"comNF", t:"Com NF", fmt:brlOu}].concat(pontual ? [] : [{k:"fNF", t:"Pagamento NF"}], [{k:"semNF", t:"Sem NF", fmt:brlOu}], pontual ? [] : [{k:"fPix", t:"Pagamento sem NF"}], [{k:"venc", t:"Vencimentos"},
    {k:"sit", t:"Situação", cor:function(l){ return l.sit==="Sem parcela" ? "text-warning" : l.sit==="Quitado" ? "text-success" : ""; }},
    {k:"ac", t:"", render:function(v, l){ return l.semParcela ? (ed ? LK("Lançar parcela", function(){ abrirParcela(l.id, false); }) : "---") : LK("Abrir", function(){ setDetId(l.id); }); }}]));
  var linhasL = listaL.map(function(pd){
    var f = forn(pf, pd.fornId), np = pd.parcelas.length, pg = pd.parcelas.reduce(function(t, x){ return t+(x.status==="Pago" || (FORMAS[x.forma].nf==="com" && x.venc.slice(0,7)<mesHoje) ? x.valor : 0); }, 0);
    var mNF = /NF\s*([\d./-]+)/i.exec(String(pd.numero || "")), mFat = /Fatura[s]?\s*([\d][\d\s·,/–-]*)/i.exec(String(pd.numero || "")), soNum = /^[\d][\d\s·,/–-]*$/.test(String(pd.numero || "").trim()) ? String(pd.numero).trim() : "";
    var fatTxt = (mFat ? mFat[1].trim() : soNum), cad = pontual ? ligarCadastro((c.s && c.s.cpc) || {}, fatTxt) : {forn:"", nota:""};
    return {id:pd.id, data:pd.data, forn:f ? f.nome : "—", numero:pd.numero || "---", ref:pd.ref || "---", mes:mesLabel(String(pd.data).slice(0, 7)+"-01"), nf:pd.nfNum || (mNF ? mNF[1] : "—"), fat:(mFat ? mFat[1].trim() : soNum) || "—", fb:normForn(pd.fornBruto) || cad.forn || "—", nfb:pd.notaForn || cad.nota || "—", total:pd.total, comNF:pd.comNF, fNF:forma(pd, "com"), semNF:pd.semNF, fPix:forma(pd, "sem"), venc:venc(pd), semParcela:!np, sit:!np ? "Sem parcela" : (pd.total-pg>0.005 ? "Em aberto" : "Quitado"), ac:""};
  });
  var lancados = (!listaL.length && !fId) ? null : e(BlocoBarra,{t:"Pedidos"+(fo ? " · "+fo.nome : ""), dir:String(listaL.length), acao:fId ? e(BotaoMini,{principal:true, desabilitado:!ed, onClick:function(){ setPed(pedidoNovo(pf, fId)); }}, "Lançar pedido") : null},
    tab({cols:COLS_L, linhas:linhasL, chave:"id", limite:30, aoClicar:function(l){ if(ehPoint || fId===pf.mqFornId) setDetId(l.id); else setSelPed(selPed===l.id ? null : l.id); }, linhaCls:function(l){ return l.id===selPed ? "!bg-[#26385c]" : ""; }, vazio:"Nenhum pedido lançado.",   // Pontual e Point não têm o bloco do pedido embaixo: clicar na linha abre o detalhe do pedido
      totalRodape:function(ls){ var sm = function(k){ return brl(ls.reduce(function(t, x){ return t+Number(x[k]||0); }, 0)); }; var a = [ "Total", "" ]; if(!fId) a.push(""); return a.concat(pontual ? ["", "", "", "", ""] : ["", ""], [sm("total"), sm("comNF")], pontual ? [] : [""], [sm("semNF")], pontual ? [] : [""], ["", "", ""]); }}));

  var especial = visao==="mes" ? null : ehPoint ? e("div",{key:"pt", className:"flex flex-col gap-0"}, lancados, lancados && sepBloco("spt"), e(PointPainel,{c:c})) : fId===pf.mqFornId ? e("div",{key:"pq", className:"flex flex-col gap-0"}, lancados, lancados && sepBloco("spq"), e(PainelPontual,{pf:pf, f:fo, hoje:hojeIso(), abrirDetalhe:setDetId, abertos:abPt, alterna:alPt})) : null;

  // ---------- dados da tela ----------
  var ags = agregar(pf, coletar(pf, filtro, fId)), tot = painelTotais(ags);

  // ---------- tabelas no padrão do Lançamento de pagamentos (Marcus, 20/11/2026): TabelaPlanilha, letra fina, filtro em cada coluna ----------
  // ---------- painel de endividamento ----------
  var abas = [["tempo","Linha do tempo"],["janela","Janelas de pagamento"],["matriz","Fornecedor × mês"]];
  var tabJan = function(lista, comMes){
    var T = tabelaJanelas(pf, lista), linhasJ = [];
    T.grupos.forEach(function(g){ g.janelas.forEach(function(j, i){ linhasJ.push({id:g.fornId+"-"+i+"-"+j.limite, fornId:j.fornId, forn:g.nome, ciclo:g.ciclo, mes:mesLabel(j.mes+"-01"), limite:dbr(j.limite), fecha:dbr(j.fim), sit:j.nParcelas+" parc · "+j.nota, cor:j.cor, total:j.total, pago:j.pago, aberto:j.aberto, comNF:j.comNF, divida:j.divida}); }); });
    var X = T.totais, cj = [{k:"forn", t:"Fornecedor"}, {k:"ciclo", t:"Ciclo"}];
    if(comMes) cj.push({k:"mes", t:"Mês"});
    cj = cj.concat([{k:"limite", t:"Pagar até"}, {k:"fecha", t:"Fecha"}, {k:"sit", t:"Situação", cor:function(l){ return l.cor==="red" ? "text-destructive" : l.cor==="orange" ? "text-warning" : l.cor==="green" ? "text-success" : ""; }},
      {k:"total", t:"Sem NF", fmt:brl}, {k:"pago", t:"Pago", fmt:brl, cor:verde}, {k:"aberto", t:"A pagar", fmt:brl, cor:function(l){ return l.aberto>0.005 ? "text-warning" : "text-success"; }}, {k:"comNF", t:"Com NF", fmt:brl}, {k:"divida", t:"Dívida", fmt:brl}]);
    return tab({cols:cj, linhas:linhasJ, chave:"id", aoClicar:function(l){ verForn(l.fornId); }, vazio:"Sem janelas no filtro atual.",
      totalRodape:function(){ return ["Total geral", ""].concat(comMes ? [""] : [], ["", "", "", brl(X.total), brl(X.pago), brl(X.aberto), brl(X.comNF), brl(X.divida)]); }});
  };
  var vTempo = function(){
    var V = viewTempo(ags), M = mesAb ? ags.find(function(x){ return x.mes===mesAb; }) : null;
    var linhasT = V.abertos.concat(V.quitados).map(function(r){ return {id:r.mes, mes:mesLabel(r.mes+"-01")+(r.atraso ? " · atraso "+brl(r.semAtraso) : ""), sit:r.quitado ? "Finalizado" : "Em aberto", nJanelas:r.nJanelas, semAberto:r.semAberto, comTotal:r.comTotal, divida:r.divida, atraso:r.atraso}; });
    var ct = [{k:"mes", t:"Mês", cor:function(l){ return l.atraso ? "text-destructive" : ""; }}, {k:"sit", t:"Situação"}, {k:"nJanelas", t:"Acertos"}, {k:"semAberto", t:"A pagar sem NF", fmt:brl, cor:function(l){ return l.semAberto>0.005 ? "text-warning" : ""; }}, {k:"comTotal", t:"Com NF", fmt:brl}, {k:"divida", t:"Dívida do mês", fmt:brl}];
    return e("div",{className:"flex flex-col gap-0"},
      tab({cols:ct, linhas:linhasT, chave:"id", aoClicar:function(l){ abrirMes(l.id); }, linhaCls:function(l){ return l.id===mesAb ? "!bg-[#26385c]" : ""; }, vazio:"Sem meses.",
        totalRodape:function(){ return ["Total", "", String(V.totais.nJanelas), brl(V.totais.semAberto), brl(V.totais.comTotal), brl(V.totais.divida)]; }}),
      M && e("div",{className:"border-t-2 border-[var(--bloco-titulo)]"}, tabJan([M], false)));
  };
  var vMatriz = function(){
    var X = viewMatriz(pf, ags);
    if(!X.fornecedores.length) return Vazio("Sem dados no filtro.");
    var cm = [{k:"nome", t:"Fornecedor"}].concat(X.meses.map(function(m, i){ return {k:"m"+i, t:mesLabel(m+"-01"), fmt:function(v){ return v===null ? "—" : brl(v); }}; }), [{k:"total", t:"Total", fmt:brl}]);
    var lm = X.fornecedores.map(function(r){ var o = {id:String(r.fornId), fornId:r.fornId, nome:r.nome, total:r.total}; r.celulas.forEach(function(x, i){ o["m"+i] = x.vazio ? null : x.valor; }); return o; });
    return tab({cols:cm, linhas:lm, chave:"id", aoClicar:function(l){ verForn(l.fornId); }, vazio:"Sem dados no filtro.", totalRodape:function(){ return ["Total"].concat(X.totaisMes.map(function(v){ return brl(v); }), [brl(X.totalGeral)]); }});
  };
  var painel = e(BlocoBarra,{t:"Painel de endividamento", dir:(fo ? fo.nome+" · "+cicloLabel(fo) : "Todos os fornecedores")},
    e("div",{className:"flex justify-center border-b border-border py-1"}, e(Segmentado,{opcoes:abas, atual:aba, onMudar:setAba})),
    !ags.length ? Vazio("Nenhuma parcela no filtro atual.") : aba==="tempo" ? vTempo() : aba==="janela" ? tabJan(ags, true) : vMatriz());

  // ---------- resumo da negociação ----------
  var RN = resumoNegociacao(pf, null), resumo = null;
  if(RN.linhas.length){
    // situação de cada fornecedor: Em aberto, Sem parcela, Quitado, ou Encerrado (tudo pago e sem nova negociação há mais de 30 dias: some da lista, só aparece no filtro) — Marcus, 20/11/2026
    var ultAtiv = {}, ultPed = {}, sobe = function(m, fid, d){ if(d && (!m[fid] || d>m[fid])) m[fid] = d; };
    pf.pedidos.forEach(function(pd){ sobe(ultAtiv, pd.fornId, pd.data); sobe(ultPed, pd.fornId, pd.data); (pd.parcelas || []).forEach(function(x){ sobe(ultAtiv, pd.fornId, x.venc); }); });
    pf.lancamentos.forEach(function(l){ sobe(ultAtiv, l.fornId, l.data); });
    var diasDesde = function(d){ return d ? Math.round((new Date(hojeIso()+"T12:00:00") - new Date(d+"T12:00:00"))/864e5) : 9999; };
    var baixaDm = parcelasBaixadasDm(pf), extraDm = extrasDevmaster(pf, hojeIso().slice(0,7));
    var linhasR = RN.linhas.map(function(x){
      var ff = forn(pf, x.fornId), tipo = (ff && ff.tipoNeg) || (ff && ehPrestador(ff) ? "Prestador" : "—");
      var aberto = x.divida>0.005, semP = x.semParcela>0.005, parado = diasDesde(ultAtiv[x.fornId]);
      var sit = aberto ? "Em aberto" : semP ? "Sem parcela" : parado>30 ? "Encerrado" : "Quitado";
      var abCom = 0, abSem = 0, nAb = 0, em7 = 0, dmAbat = 0, apC = 0, pgC = 0, apS = 0, pgS = 0, prox = "", hj = hojeIso(), lim7 = addDias(hj, 7);
      pf.pedidos.filter(function(pd){ return pd.fornId===x.fornId; }).forEach(function(pd){ var tem = false, alocCom = 0, alocSem = 0;
        (pd.parcelas || []).forEach(function(pc, kp){ var com = FORMAS[pc.forma].nf==="com"; if(com) alocCom += pc.valor; else alocSem += pc.valor; var bdm = baixaDm[pd.id+"#"+kp], pago = pc.status==="Pago" || (com && pc.venc.slice(0,7)<mesHoje && !(pc.forma==="cheque" && bdm && !bdm.pago)), dmPg = !pago && !!(bdm && bdm.pago); if(!pago && com && pc.status!=="Pago" && pc.forma==="cheque" && pc.venc.slice(0,7)<mesHoje) dmAbat -= pc.valor; if(pc.venc.slice(0,7)===hj.slice(0,7)){ var pg = pago || dmPg; if(com){ apC += pc.valor; if(pg) pgC += pc.valor; } else { apS += pc.valor; if(pg) pgS += pc.valor; } } if(pago) return; if(dmPg){ dmAbat += pc.valor; return; } tem = true; if(com) abCom += pc.valor; else abSem += pc.valor; if(pc.venc.slice(0,7)===hj.slice(0,7)) em7 += pc.valor; if(pc.venc>=hj){ if(!prox || pc.venc<prox) prox = pc.venc; } });   // o sistema não sabe quando cada Pix ou boleto foi pago (Pix paga no acerto, boleto some no fim do mês): por isso não há coluna Vencido, só o que vem pela frente   // cheque vencido que a DevMaster ainda tem em aberto continua em aberto
        var rest = pd.total-alocCom-alocSem;   // o que ainda não tem parcela entra no a pagar (a coluna Sem parcela saiu): sem nota se o pedido tem parte sem nota, senão com nota
        if(pd.semNF>0.005) abSem += rest; else abCom += rest; if(tem || rest>0.005) nAb++; });
      var exd = extraDm[x.fornId]; if(exd){ abCom += exd.aberto; apC += exd.mesAP; pgC += exd.mesPg; dmAbat -= exd.aberto; }   // boletos e cheques que só a DevMaster tem
      if(ff && ff.nome==="Point" && pnf){ var bp = somaBoletosPoint(pnf, hj.slice(0,7)); abCom += bp.aberto; apC += bp.mesAP; pgC += bp.mesPg; dmAbat -= bp.aberto; }   // boletos com nota da Point (DevMaster, pela NF) entram no Com NF; dmAbat negativo soma ao Em aberto
      var lancMes = pf.lancamentos.filter(function(l){ return l.fornId===x.fornId && l.valor>0 && String(l.data).slice(0,7)===hj.slice(0,7); }).reduce(function(t, l){ return t+l.valor; }, 0);
      pgS = Math.min(apS, Math.max(pgS, lancMes));   // Pix já lançado no Admin conta como pago no mês, mesmo sem baixa na DevMaster (Marcus, 23/11/2026; caso Point)
      var dv = Math.max(0, x.divida-dmAbat), sit2 = dv>0.005 ? "Em aberto" : semP ? "Sem parcela" : parado>30 ? "Encerrado" : "Quitado";   // a baixa que a DevMaster já deu tira a parcela do aberto
      return Object.assign({}, x, {divida:dv, dmAbat:dmAbat, apC:apC, pgC:pgC, fC:apC-pgC, apS:apS, pgS:pgS, fS:apS-pgS, apT:apC+apS, pgT:pgC+pgS, fT:apC+apS-pgC-pgS, tipo:tipo, sit:sit2, ultimo:ultPed[x.fornId] || "", abCom:abCom, abSem:abSem, nAb:nAb, em7:em7, prox:prox});
    }).filter(function(x){
      if(fTipo!=="todos" && x.tipo!==fTipo) return false;
      if(fSit==="ativos" ? x.sit==="Encerrado" : fSit==="todos" ? false : x.sit!==({aberto:"Em aberto", semparcela:"Sem parcela", quitado:"Quitado", encerrado:"Encerrado"})[fSit]) return false;
      var q = fBusca.trim().toLowerCase(); if(q && (x.nome+" "+x.tipo+" "+x.sit).toLowerCase().indexOf(q)<0 && String(x.total).indexOf(q)<0) return false;
      return true;
    }).sort(function(a, b){ var O = ["Banho", "Bruto", "Material gráfico", "Sistema", "Tintas", "Prestador"], i = O.indexOf(a.tipo), j = O.indexOf(b.tipo); var N = ["Pontual", "Ellos Galvânica", "Point", "Point · Compra de NF", "Mega Sul"], p = N.indexOf(a.nome), q = N.indexOf(b.nome); return (i<0 ? 99 : i)-(j<0 ? 99 : j) || (p<0 ? 99 : p)-(q<0 ? 99 : q) || String(a.nome).localeCompare(String(b.nome)); });   // ordem pedida pelo Marcus (23/11/2026): Pontual, Ellos; no bruto Point, Point · Compra de NF, Mega Sul
    if(fornF) linhasR = linhasR.filter(function(x){ return String(x.fornId)===fornF; });   // fornecedor escolhido: fecha os outros e fica só a linha dele (clicar de novo reabre a lista)
    var ocultos = RN.linhas.length - linhasR.length;
    var colsFull = [{k:"nome", t:"Fornecedor", cor:corTipo}, {k:"tipo", t:"Tipo", cor:function(l){ return COR_TIPO[l.tipo] || ""; }}, {k:"sit", t:"Situação", cor:function(l){ return l.sit==="Em aberto" ? "text-warning" : l.sit==="Sem parcela" ? "text-destructive" : l.sit==="Quitado" ? "text-success" : ""; }},
      {k:"nPedidos", t:"Pedidos"}, {k:"total", t:"Total negociado", fmt:brl}, {k:"comNF", t:"Com NF", fmt:brl}, {k:"semNF", t:"Sem NF", fmt:brl},
      {k:"pago", t:"Pago", fmt:brl, cor:function(){ return "text-success"; }}, {k:"divida", t:"Falta", fmt:brlOu, cor:function(l){ return l.divida>0.005 ? "text-destructive" : ""; }}];
    var cG = function(k, t, extra){ return Object.assign({k:k, t:t, fmt:brlOu}, extra || {}); }, cF = function(k){ return cG(k, "Falta", {cor:function(){ return "text-destructive"; }}); }, cPg = function(k, t){ return cG(k, t, {cor:function(){ return "text-success"; }}); };
    var colsAb = [{k:"nome", t:"Fornecedor", cor:corTipo}, {k:"tipo", t:"Tipo", cor:function(l){ return COR_TIPO[l.tipo] || ""; }},
      cG("apS", "A pagar", {sep:true}), cPg("pgS", "Pago"), cF("fS"),
      cG("apC", "A pagar", {sep:true}), cPg("pgC", "Pago"), cF("fC"),
      cG("apT", "A pagar", {sep:true}), cPg("pgT", "Pago"), cF("fT"),
      cG("abCom", "Com NF", {sep:true}), cG("abSem", "Sem NF"), {k:"divida", t:"Total", fmt:brl}];
    var emAberto = fSit==="aberto", colsR = emAberto ? colsAb : colsFull;
    var campo = function(rot, ctl){ return e("label",{className:"flex items-center gap-1", title:rot}, ctl); };   // padrao-ok: letra de 10 px igual à faixa do Lançamento de pagamentos (Marcus, 21/11/2026)
    var filtrosR = e("div",{className:BARRA_TOPO},   // padrao-ok: filtros à esquerda e abas à direita, na mesma linha
      campo("Buscar", e("input",{type:"search", value:fBusca, onChange:function(ev){ setFBusca(ev.target.value); }, placeholder:"Nome, tipo, valor...", "aria-label":"Buscar fornecedor", className:"h-[18px] w-44 rounded border border-white/25 bg-white/10 px-1 text-center text-[10px] text-white placeholder:text-white/70 outline-none"})),   // padrao-ok: letra de 10 px da barra de filtros (Marcus, 21/11/2026)
      campo("Tipo", menuMini([["todos", "Todos"], ["Banho", "Banho"], ["Bruto", "Bruto"], ["Material gráfico", "Material gráfico"], ["Sistema", "Sistema"], ["Tintas", "Tintas"], ["Prestador", "Prestador"]], fTipo, setFTipo, "Tipo")),
      campo("Situação", menuMini([["aberto", "Em aberto"], ["semparcela", "Sem parcela"], ["quitado", "Quitados"], ["encerrado", "Encerrados"], ["todos", "Todos"]], fSit, setFSit, "Situação")),
      props && props.abasEl);
    resumo = e(BlocoBarra,{t:"Fornecedores", semBarra:true},
      filtrosR,
      e("div",{className:LISTA},   // fornecedor escolhido usa o mesmo tamanho da lista (Marcus, 23/11/2026)
      tab({cols:colsR, cabAcima:emAberto ? [[{t:"", span:2}, {t:"Mês sem NF", span:3, sep:true}, {t:"Mês com NF", span:3, sep:true}, {t:"Soma do mês", span:3, sep:true}, {t:"Total geral a pagar", span:3, sep:true}]] : undefined, linhas:linhasR, chave:"fornId", semFiltro:true, aoClicar:function(l){ verForn(l.fornId); }, linhaCls:function(l){ return String(l.fornId)===fornF ? "!bg-[#26385c]" : ""; }, vazio:"Nenhum fornecedor neste filtro.",
        key:emAberto ? "ab" : "todos", totalRodape:fornF ? undefined : function(ls){ var sm = function(k){ return brl(ls.reduce(function(t, x){ return t+Number(x[k]||0); }, 0)); }; if(emAberto) return ["Total", "", sm("apS"), sm("pgS"), sm("fS"), sm("apC"), sm("pgC"), sm("fC"), sm("apT"), sm("pgT"), sm("fT"), sm("abCom"), sm("abSem"), sm("divida")]; return ["Total", "", "", String(ls.reduce(function(t, x){ return t+Number(x.nPedidos||0); }, 0)), sm("total"), sm("comNF"), sm("semNF"), sm("pago"), sm("divida")]; }})));
  }

  // ---------- PEDIDO ABERTO (versão 2 aprovada pelo Marcus, 21/11/2026): à esquerda o mini bloco do pedido (CNPJ nosso, número, fornecedor, data) e o Resumo por forma; à direita o calendário por mês, com uma coluna para cada forma de pagamento ----------
  var parcelasBloco = null;
  if(fId && !especial && selPed){
    var pdSel = pf.pedidos.find(function(x){ return x.id===selPed; });
    if(pdSel){
      var pagaP = function(x){ return x.status==="Pago" || (FORMAS[x.forma].nf==="com" && x.venc.slice(0,7)<mesHoje); };
      // CNPJ nosso: só o número completo
      var mNum = /CNPJ\s*(\d+)/i.exec(pdSel.cnpj || ""), cadC = mNum ? CNPJS0.find(function(c){ return c.num===mNum[1]; }) : null, cnpjNum = cadC ? cadC.cnpj : (pdSel.cnpj || "---");
      var fSel = forn(pf, pdSel.fornId);
      // o Pix de revendedora é pago na data de acerto e nunca no valor exato: cada parcela recebe a parte dela do que foi pago na data (proporcional ao valor)
      var pagoIdx = {};
      janelasDoForn(pf, pdSel.fornId).forEach(function(j){ var pj = pagoJanela(pf, j.chave); (j.itens || []).filter(function(it){ return it.pd.id===pdSel.id; }).forEach(function(it){ var v = j.total>0.005 ? pj*(it.p.valor/j.total) : 0; pagoIdx[it.idx] = Math.min(it.p.valor, Math.round(v*100)/100); }); });
      var parc = (pdSel.parcelas || []).map(function(x, idx){ return {x:x, idx:idx, fk:x.forma, pago:FORMAS[x.forma].nf==="sem" ? (pagoIdx[idx] || 0) : (pagaP(x) ? x.valor : 0)}; });
      var ordemF = Object.keys(FORMAS).filter(function(k){ return parc.some(function(o){ return o.fk===k; }); });
      // resumo por forma
      var linhasF = ordemF.map(function(k){ var ps = parc.filter(function(o){ return o.fk===k; }), tot = ps.reduce(function(t, o){ return t+o.x.valor; }, 0), pg = ps.reduce(function(t, o){ return t+o.pago; }, 0); return {id:k, forma:FORMAS[k].label, pct:pdSel.total>0 ? Math.round(tot/pdSel.total*100)+"%" : "---", total:tot, pago:pg, falta:Math.max(0, tot-pg)}; });
      var cF = [{k:"forma", t:"Forma"}, {k:"pct", t:"%"}, {k:"total", t:"Total", fmt:brl}, {k:"pago", t:"Pago", fmt:brlOu, cor:verde}, {k:"falta", t:"Falta", fmt:brlOu}];
      var sF = function(k){ return linhasF.reduce(function(t, x){ return t+x[k]; }, 0); };
      // calendário por mês: uma linha por data de vencimento
      var datas = {}; parc.forEach(function(o){ var d = o.x.venc, r = datas[d] = datas[d] || {id:d, venc:d, mes:mesLabel(d.slice(0,7)+"-01"), total:0, pago:0}; r["f_"+o.fk] = (r["f_"+o.fk] || 0)+o.x.valor; r.total += o.x.valor; r.pago += o.pago; });
      var linhasC = Object.keys(datas).sort().map(function(d){ var r = datas[d]; r.falta = Math.max(0, r.total-r.pago); return r; });
      var cC = [{k:"mes", t:"Mês"}, {k:"venc", t:"Vencimento", fmt:dbr}].concat(ordemF.map(function(k){ return {k:"f_"+k, t:FORMAS[k].label, fmt:function(v){ return v ? brl(v) : "—"; }}; }),
        [{k:"total", t:"Total do mês", fmt:brl}, {k:"pago", t:"Pago", fmt:brlOu, cor:verde}, {k:"falta", t:"Falta", fmt:brlOu}]);
      var sC = function(k){ return linhasC.reduce(function(t, x){ return t+(x[k] || 0); }, 0); };
      parcelasBloco = e("div",{className:"flex flex-col gap-0 border-b-[3px] border-white [&_tfoot_td]:!h-[26px] [&_tfoot_td]:!text-[11px] [&_tfoot_td]:!font-bold [&_td]:!px-1 [&_th]:!px-1 [&_td]:!whitespace-nowrap [&_th]:!whitespace-nowrap"},   // padrao-ok: rodapé dos dois lados com a mesma altura; letras como antes (Marcus, 22/11/2026)
        e(BlocoBarra,{t:"Pedido "+(pdSel.numero || "---")+" · "+(fSel ? fSel.nome : ""), acao:e(BotaoMini,{onClick:function(){ setSelPed(null); }}, "Fechar pedido")}),
        e("div",{className:"grid grid-cols-1 items-stretch gap-0 lg:grid-cols-[minmax(300px,34%)_1fr]"},
          e("div",{className:"flex flex-col border-r border-white/35 "+FONTE_ESQ},
            e("div",{className:"flex flex-1 flex-col [&>section]:flex-1 "+MEIO},
              e(BlocoBarra,{t:"Pedido"},
                e("div",{className:"flex-1 [&>div]:!h-full [&>div>div]:!h-full [&_table]:!table-fixed [&_th]:!w-1/2"}, tab({cols:[{k:"cnpj", t:"CNPJ"}, {k:"num", t:"Nº do pedido"}], linhas:[{id:"i1", cnpj:cnpjNum, num:pdSel.numero || "---"}], semFiltro:true, vazio:""})),
                e("div",{className:"flex-1 [&>div]:!h-full [&>div>div]:!h-full [&_table]:!table-fixed [&_th]:!w-1/2"}, tab({cols:[{k:"forn", t:"Fornecedor"}, {k:"data", t:"Data", fmt:dbr}], linhas:[{id:"i2", forn:fSel ? fSel.nome : "---", data:pdSel.data}], semFiltro:true, vazio:""})))),
            e("div",{className:"flex flex-1 flex-col [&>section]:flex-1 "+MEIO},
              e(BlocoBarra,{t:"Resumo por forma"}, e("div",{className:"flex-1 [&>div]:!h-full [&>div>div]:!h-full [&_table_tbody_tr_td]:!text-[10px] [&_table_tfoot_tr_td]:!text-[10px] [&_table_thead_tr_th]:!text-[10px] [&_td]:!px-1 [&_th]:!px-1"}, tab({cols:cF, linhas:linhasF, chave:"id", semFiltro:true, vazio:"", totalRodape:function(){ return ["Total", pdSel.total>0 ? "100%" : "---", brl(sF("total")), brl(sF("pago")), brl(sF("falta"))]; }}))))),   // padrao-ok: letra de 10 px para caber a coluna Falta (Marcus, 22/11/2026)
          e(BlocoBarra,{t:"Calendário"}, tab({cols:cC, linhas:linhasC, chave:"id", semFiltro:true, vazio:"Sem parcelas.", totalRodape:function(){ return ["Total", ""].concat(ordemF.map(function(k){ return brl(sC("f_"+k)); }), [brl(sC("total")), brl(sC("pago")), brl(sC("falta"))]); }}))));
    }
  }
  var painelMes = visao==="mes" ? e("div",{className:TELA}, e("div",{className:BARRA_TOPO}, props && props.abasEl), painel, sepBloco("fim")) : null;
  if(visao==="mes") return e("div",null, painelMes, modais);

  return e("div",null, e("div",{className:TELA}, topo, resumo, fId ? (especial ? [sepBloco("s0"), especial] : [sepBloco("s1"), e("div",{key:"pd", className:"flex flex-col gap-0"}, lancados || Vazio("Este fornecedor ainda não tem pedidos lançados.")), parcelasBloco && sepBloco("s2"), parcelasBloco && e("div",{key:"pc", className:"flex flex-col gap-0"}, parcelasBloco)]) : null, sepBloco("fim")), modais);
}


// ───────────────── Proposta ao fornecedor (mensagem no formato do Nickolas) ─────────────────
var NUMS = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];
var FORMA_MSG = {boleto:"📄 BOLETO", cheque:"🧾 CHEQUE", pix_empresa:"💸 PIX EMPRESA", cartao:"💳 CARTÃO", pix_revendedora:"💸 PIX"};
function cnpjDoPedido(txt){ var m = /CNPJ\s*(\d+)/i.exec(txt || ""), c = m ? CNPJS0.find(function(x){ return x.num===m[1]; }) : null; return c ? {nome:c.nome, cnpj:c.cnpj} : null; }
function msgProposta(pf, ped, X){
  var f = forn(pf, ped.fornId), c = cnpjDoPedido(ped.cnpj), linhas = (X.com>0.005 ? ped.lcom : []).concat(X.sem>0.005 ? ped.lsem : []), todas = expandirParcelas(linhas);
  var dia = function(iso){ var q = new Date(iso+"T12:00:00"); return q.getDay(); };
  var m = [];
  m.push("🧾 PEDIDO "+(f ? f.nome.toUpperCase() : "")+(ped.nfNum ? " — NF "+ped.nfNum : "")+(ped.numero ? " — Pedido "+ped.numero : ""));
  m.push("");
  m.push("🏢 Pagador: "+(c ? "CNPJ "+c.nome+" "+c.cnpj : (ped.cnpj || "---")));
  m.push("🏭 Beneficiário: "+(f ? f.nome+(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(String(f.cnpj || "")) ? " ("+f.cnpj+")" : "") : "---"));
  m.push("📅 Doc.: "+dbr(ped.data));
  m.push("");
  m.push("💰 VALOR TOTAL: "+brl(X.total));
  var formas = []; todas.forEach(function(x){ if(formas.indexOf(x.forma)<0) formas.push(x.forma); });
  formas.forEach(function(k){
    var ps = todas.filter(function(x){ return x.forma===k; }).sort(function(a, b){ return a.venc.localeCompare(b.venc); }), tot = ps.reduce(function(t, x){ return t+x.valor; }, 0);
    m.push(""); m.push("━━━━━━━━━━━━━━━"); m.push("");
    m.push((FORMA_MSG[k] || k)+" ("+(X.total>0 ? Math.round(tot/X.total*100) : 0)+"%) — "+brl(tot)); m.push("");
    ps.forEach(function(x, i){ var w = dia(x.venc), aviso = w===6 ? " ⚠️ (sábado)" : w===0 ? " ⚠️ (domingo)" : ""; m.push((NUMS[i] || (i+1)+".")+" "+dbr(x.venc)+" — "+brl(x.valor)+aviso); });
    m.push(""); m.push("✅ Total "+(FORMA_MSG[k] || k).replace(/^\S+\s/, "").toLowerCase().replace(/^./, function(q){ return q.toUpperCase(); })+": "+brl(tot));
  });
  m.push(""); m.push("━━━━━━━━━━━━━━━"); m.push(""); m.push("💰 TOTAL GERAL: "+brl(X.total));
  return m.join("\n");
}

// ───────────────── Janela: Lançar pedido ─────────────────
// Só abre a partir da tela do fornecedor (o fornecedor já vem escolhido). Tudo em tabelas. Todo fornecedor tem regra e 5 propostas (Marcus, 21/11/2026); a edição de pedido já lançado usa só a tabela de parcelas.
var TJ = {escura:true, grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true, semFiltro:true};
var TJ_CLS = "[&_td]:!h-[26px] [&_td]:!py-0 [&_td]:!px-1 [&_td]:!text-[11px] [&_th]:!px-1 [&_th]:!text-[11px] [&_td]:!whitespace-nowrap [&_th]:!whitespace-nowrap [&_td_input]:!w-full [&_td_select]:!w-full";   // padrao-ok: tabelas da janela com letra de 11 px e linha de 26 px (Marcus, 21/11/2026)
function JanelaPedido(p){
  var c = p.c, pf = p.pf, ped = p.ped;
  var split = function(n){ return dividirNF(n.nf, n.total, n.editado, n.com, n.sem); };
  var novoPed = !ped.editId, comProp = novoPed, fo = forn(pf, ped.fornId);   // pedido novo: regra e propostas para todo fornecedor; editar um pedido já lançado mostra só a tabela de parcelas
  var regra = ped.regra || regraPadrao(pf, ped.fornId);
  // sem ajuste manual das parcelas, as parcelas vêm da proposta escolhida; a mensagem volta ao texto do sistema quando algo muda
  var upd = function(patch){ var n = Object.assign({}, ped, {msgManual:null}, patch), x = split(n); if(n.nf!=="misto"){ n.com = x.com.toFixed(2); n.sem = x.sem.toFixed(2); } if(x.com<=0.005) n.lcom = []; if(x.sem<=0.005) n.lsem = [];
    if(comProp && !n.parcManual){ var pr = propostasDe(n, n.regra || regraPadrao(pf, n.fornId), x)[n.prop || 0]; n.lcom = pr.com; n.lsem = pr.sem; }
    p.setPed(n); };
  var updL = function(o){ o.parcManual = true; upd(o); };   // mexeu numa parcela à mão: a proposta deixa de refazer as parcelas
  var X = split(ped), misto = ped.nf==="misto";
  var vCom = misto ? ped.com : X.com.toFixed(2), vSem = misto ? ped.sem : X.sem.toFixed(2);
  var fechar = function(){ p.setPed(null); };
  var copiaTxt = function(t){ try{ navigator.clipboard.writeText(t); }catch(x){} };
  var aplicaPct = function(total, pct){ var t = parseFloat(total) || 0, q = Math.max(0, Math.min(100, parseFloat(pct) || 0)), com = Math.round(t*q)/100; return {nf:q<=0 ? "sem" : q>=100 ? "com" : "misto", editado:"com", com:com.toFixed(2), sem:(t-com).toFixed(2), pct:pct}; };
  var pctAtual = ped.pct!=="" && ped.pct!==undefined ? ped.pct : (X.total>0 ? String(Math.round(X.com/X.total*1000)/10) : "");
  var pctNum = parseFloat(pctAtual) || 0;
  var setRegra = function(parte, campo, v){ var R = JSON.parse(JSON.stringify(regra)); if(parte) R[parte][campo] = v; else R[campo] = v; upd({regra:R, parcManual:false}); };
  var salvarRegra = function(){ var R = Object.assign({}, regra, {pct:pctNum}); if(grava(c, "forn_set", {id:ped.fornId, patch:{regraNeg:R}})) aviso(c, "Regra salva: vale para os próximos pedidos deste fornecedor.", "ok"); };
  var anexa = function(ev, depois, msgErro){ var arq = ev.target.files && ev.target.files[0]; if(!arq) return;
    lerAnexo(arq).then(function(a){ return enviarAnexo("pf", a); }).then(function(sv){ depois({key:sv.key, nome:arq.name}); }, function(err){ aviso(c, ((err && err.message) ? err.message+" " : "")+msgErro, "alerta"); }); };
  // ligação com o pedido de bruto que a Rayssa lança (Cadastro de peças › Pedidos de bruto): mesmo número
  var cp = c.s && c.s.cpc, lig = (cp && cp.pedidos || []).find(function(o){ var n = String(o.nota || "").trim(); return n && n===String(ped.numero || "").trim(); });
  var msg = ped.msgManual!=null ? ped.msgManual : msgProposta(pf, ped, X);
  var salvar = function(enviar){
    var linhas = (X.com>0.005 ? ped.lcom : []).concat(X.sem>0.005 ? ped.lsem : []);
    var ruim = linhas.find(function(l){ return !dataValida(l.venc); });
    if(ruim){ aviso(c, "Vencimento inválido ou vazio"+(ruim.venc ? ": "+ruim.venc : "")+". Confira as datas das parcelas (o mês pode não ter esse dia).", "alerta"); return; }
    var ok = grava(c, ped.editId ? "pedido_editar" : "pedido_add", {id:ped.editId, fornId:ped.fornId, numero:ped.numero, ref:ped.ref, fornBruto:ped.fornBruto || cadAuto.forn, notaForn:ped.notaForn || cadAuto.nota, nfArq:ped.nfArq, cpcId:lig ? lig.id : ped.cpcId, data:ped.data, total:X.total, nfTipo:ped.nf, comNF:X.com, semNF:X.sem, cnpj:ped.cnpj, nfNum:ped.nfNum, linhas:linhas, descricao:ped.descricao, limite:ped.limite, pixMin:ped.pixMin});
    if(!ok) return;
    if(enviar){ copiaTxt(msg); try{ window.open("https://wa.me/?text="+encodeURIComponent(msg), "_blank"); }catch(x){} aviso(c, "Pedido lançado. A proposta foi copiada e o WhatsApp foi aberto para você escolher o fornecedor.", "ok"); }
    fechar();
  };
  var tabJ = function(extra){ return e("div",{className:TJ_CLS}, e(TabelaPlanilha, Object.assign({}, TJ, extra))); };

  // ----- tabela do pedido (campo, dado, campo, dado) -----
  var nfArqNome = ped.nfArq && ped.nfArq.nome ? ped.nfArq.nome : "";
  var nfCel = e("span",{className:"flex items-center justify-center gap-2"}, nfArqNome && e("span",{title:nfArqNome}, nfArqNome),
    e("label",{className:"cursor-pointer underline text-[#7DD3FC]"}, nfArqNome ? "Trocar" : "Anexar", e("input",{type:"file", accept:"image/*,application/pdf", className:"hidden", onChange:function(ev){ anexa(ev, function(a){ upd({nfArq:a}); }, "Não consegui anexar a nota fiscal."); }})),
    nfArqNome && e("a",{href:"#", role:"button", className:"underline text-destructive", onClick:function(ev){ ev.preventDefault(); upd({nfArq:null}); }}, "Remover"));
  var Cel = function(k, rot, node, rot2, node2){ return {id:k, a:rot, av:node, b:rot2, bv:node2}; };
  var din = function(valor, rot, aoMudar){ return e(Dinheiro,{out:"ponto", value:valor, label:rot, className:"w-full min-w-0 px-1! text-[11px]!", onChange:aoMudar}); };   // o valor sobe em reais enquanto se digita
  var Cel = function(k, rot, node){ return {id:k, a:rot, av:node}; };
  var cadAuto = ehBanho(pf, ped.fornId) ? ligarCadastro((c.s && c.s.cpc) || {}, ped.numero) : {forn:"", nota:"", ids:[]};
  var cpcJ = (c.s && c.s.cpc) || {}, fornAtual = ped.fornBruto || cadAuto.forn, notaAtual = ped.notaForn || cadAuto.nota;
  var opFornBruto = []; ((cpcJ.fatP || []).concat(cpcJ.fatE || [], cpcJ.pedidos || [])).forEach(function(x){ var n = normForn(x.forn); if(n && opFornBruto.indexOf(n)<0) opFornBruto.push(n); });
  opFornBruto.sort(function(a2, b2){ return a2.localeCompare(b2); }); if(fornAtual && opFornBruto.indexOf(fornAtual)<0) opFornBruto.unshift(fornAtual);
  var partesForn = String(fornAtual || "").split(" - ").map(function(x){ return x.trim(); }).filter(Boolean);
  var opNotas = (cpcJ.pedidos || []).filter(function(o){ return String(o.nota || "").trim() && o.nota!=="000" && (!partesForn.length || partesForn.indexOf(normForn(o.forn))>=0); })
    .sort(function(a2, b2){ return String(b2.data || "").localeCompare(String(a2.data || "")); }).slice(0, 80)
    .map(function(o){ return {v:String(o.nota).trim(), t:String(o.nota).trim()+" · "+normForn(o.forn)+(o.romaneio ? " · romaneio "+o.romaneio : "")+" · "+brl(o.valor || 0)+(o.status ? " · "+o.status : ""), forn:normForn(o.forn)}; });
  if(notaAtual && !opNotas.some(function(o){ return o.v===notaAtual; })) opNotas.unshift({v:notaAtual, t:notaAtual, forn:""});
  var linhasPed = [
    Cel("r1", "Fornecedor", e("b",null, fo ? fo.nome : "---")),
    Cel("r2", ehBanho(pf, ped.fornId) ? "Fatura" : "Nº do pedido", e(Txt,{value:ped.numero, ph:ehBanho(pf, ped.fornId) ? "Ex.: 13782" : "Ex.: 1416", label:"Nº do pedido", onChange:function(v){ upd({numero:v}); }})),
    Cel("r3", "Data do pedido", e(DataCal,{value:ped.data, label:"Data do pedido", onChange:function(v){ upd({data:v}); }})),
    Cel("r4", "CNPJ (quem paga)", e(Sl,{value:ped.cnpj, label:"CNPJ", onChange:function(v){ upd({cnpj:v}); }}, CNPJS.map(function(k){ var cc = cnpjDoPedido(k); return e("option",{key:k, value:k}, cc ? cc.cnpj : k); }))),
    Cel("r5", "Valor total", din(ped.total, "Valor total", function(v){ var q = ped.pct!=="" && ped.pct!==undefined ? aplicaPct(v, ped.pct) : {}; upd(Object.assign({total:v}, q)); })),
    Cel("r6", "% com nota", e(Txt,{type:"number", value:pctAtual, ph:"Ex.: 30", label:"Percentual com nota", onChange:function(v){ upd(aplicaPct(ped.total, v)); }})),
    Cel("r7", "Valor com nota", din(vCom, "Valor com nota", function(v){ var y = dividirNF("misto", ped.total, "com", v, ped.sem); upd({nf:"misto", editado:"com", com:v, sem:y.sem.toFixed(2), pct:""}); })),
    Cel("r8", "Valor sem nota", din(vSem, "Valor sem nota", function(v){ var y = dividirNF("misto", ped.total, "sem", ped.com, v); upd({nf:"misto", editado:"sem", sem:v, com:y.com.toFixed(2), pct:""}); })),
    Cel("r9", "Nº da nota fiscal", e(Txt,{value:X.com>0.005 ? ped.nfNum : "", disabled:X.com<=0.005, ph:"Ex.: 11881", label:"Nº da nota fiscal", onChange:function(v){ upd({nfNum:v}); }})),
    Cel("r10", "Nota fiscal (arquivo)", nfCel)].concat(ehBanho(pf, ped.fornId) ? [
    Cel("r11", "Fornecedor do bruto", e(Sl,{value:fornAtual || "", label:"Fornecedor do bruto", onChange:function(v){ upd({fornBruto:v, notaForn:""}); }}, e("option",{value:""}, "Escolha no Cadastro de peças"), opFornBruto.map(function(n){ return e("option",{key:n, value:n}, n); }))),
    Cel("r12", "Nota do fornecedor", e(Sl,{value:notaAtual || "", label:"Nota do fornecedor", onChange:function(v){ var o = opNotas.find(function(x){ return x.v===v; }); upd({notaForn:v, fornBruto:ped.fornBruto || (o && o.forn) || ped.fornBruto}); }}, e("option",{value:""}, "Escolha o pedido de bruto"), opNotas.map(function(o){ return e("option",{key:o.v+o.t, value:o.v}, o.t); })))] : []);
  var _fimPedido = [
  ];
  var tabPedido = tabJ({chave:"id", linhas:linhasPed, cols:[{k:"a", t:"Campos", w:"50%", cor:function(){ return "font-bold"; }}, {k:"av", t:"Dados", w:"50%", render:function(v, r){ return r.av; }}]});

  // ----- regra e propostas -----
  var props = comProp ? propostasDe(ped, regra, X) : [], escolhida = ped.prop || 0;
  var datasDe = function(q){ return q.com.concat(q.sem).map(function(x){ return x.venc; }).sort(); };
  var linhasProp = props.map(function(q){ var v = datasDe(q); return {id:q.i, nome:q.nome, primeiro:v.length ? dbr(v[0]) : "—", nx:q.nx+"x", bol:q.com.length ? brl(parseFloat(q.com[0].valor)) : "—", pix:q.sem.length ? brl(parseFloat(q.sem[0].valor)) : "—", ultimo:v.length ? dbr(v[v.length-1]) : "—"}; });
  var linhaRegra = function(parte){ var L = regra[parte], com = parte==="com"; return {id:parte, tipo:(com ? "Com nota " : "Sem nota ")+(com ? pctNum : 100-pctNum)+"%", valor:brl(com ? X.com : X.sem), L:L, com:com}; };
  var tabRegra = tabJ({chave:"id", linhas:[linhaRegra("com"), linhaRegra("sem")], cols:[
    {k:"tipo", t:"Forma", cor:function(){ return "font-bold"; }},
    {k:"n", t:"Parcelas", w:"5rem", render:function(v, r){ return e(In,{type:"number", min:"0", value:r.L.n, label:"Parcelas", onChange:function(x){ setRegra(r.id, "n", x); }}); }},
    {k:"forma", t:"Pagamento", w:"8rem", render:function(v, r){ return r.com ? e(Sl,{value:r.L.forma, label:"Forma", onChange:function(x){ setRegra("com", "forma", x); }}, e("option",{value:"boleto"}, "Boleto"), e("option",{value:"pix_empresa"}, "Pix empresa"), e("option",{value:"cartao"}, "Cartão"), e("option",{value:"cheque"}, "Cheque")) : "Pix revendedora"; }},
    {k:"primeiro", t:"Primeiro", w:"5rem", render:function(v, r){ return e(In,{type:"number", min:"0", value:r.L.primeiro, label:"Primeiro vencimento em dias", onChange:function(x){ setRegra(r.id, "primeiro", x); }}); }},
    {k:"intervalo", t:"Intervalo", w:"5rem", render:function(v, r){ return e(In,{type:"number", min:"1", value:r.L.intervalo, label:"Intervalo em dias", onChange:function(x){ setRegra(r.id, "intervalo", x); }}); }}]});
  var tabProp = tabJ({chave:"id", linhas:linhasProp, cols:[{k:"nome", t:"Proposta"}, {k:"primeiro", t:"Primeiro"}, {k:"bol", t:"Com nota"}, {k:"pix", t:"Sem nota"}, {k:"ultimo", t:"Último"}],
    aoClicar:function(l){ var mesma = !ped.parcManual && escolhida===l.id; upd({prop:l.id, parcManual:false, verProp:mesma ? !ped.verProp : true}); }, linhaCls:function(l){ return !ped.parcManual && escolhida===l.id ? "bg-white/15 font-bold" : ""; }});
  var detTab = function(rot, ls){
    if(!ls.length) return null;
    var cols = [{k:"rot", t:rot, w:"13rem", cor:function(){ return "font-bold"; }}], r1 = {id:"d", rot:"Vencimento", tot:""}, r2 = {id:"v", rot:"Valor", tot:brl(ls.reduce(function(t, l){ return t+(parseFloat(l.valor) || 0); }, 0))};
    ls.forEach(function(l, k){ cols.push({k:"c"+k, t:(k+1)+"ª parcela"}); r1["c"+k] = dbr(l.venc); r2["c"+k] = brl(parseFloat(l.valor) || 0); });
    cols.push({k:"tot", t:"Total", w:"8rem", cor:function(){ return "font-bold"; }});
    return e("div",{key:rot}, tabJ({chave:"id", linhas:[r1, r2], cols:cols}));
  };

  // ----- parcelas (uma tabela só, com e sem nota) -----
  var lcom = X.com>0.005 ? ped.lcom : [], lsem = X.sem>0.005 ? ped.lsem : [];
  var setL = function(pt, i, campo, v){ var key = pt==="com" ? "lcom" : "lsem", l = ped[key].map(function(x, j){ if(j!==i) return x; var y = Object.assign({}, x); y[campo] = v; if(campo==="forma" && v!=="cartao") y.qtd = "1"; return y; }); var o = {}; o[key] = l; updL(o); };
  var addL = function(pt){ var key = pt==="com" ? "lcom" : "lsem", o = {}; o[key] = ped[key].concat([linhaNova(pt, ped.data || hojeIso())]); updL(o); };
  var delL = function(pt, i){ var key = pt==="com" ? "lcom" : "lsem", o = {}; o[key] = ped[key].filter(function(x, j){ return j!==i; }); updL(o); };
  var dividirL = function(pt){ var key = pt==="com" ? "lcom" : "lsem", alvo = pt==="com" ? X.com : X.sem, qk = pt==="com" ? "qCom" : "qSem"; if(alvo<=0.005){ aviso(c, "Informe primeiro o valor desta parte do pedido.", "alerta"); return; }
    var o = {parcManual:true}; o[key] = gerarParcelas(alvo, ped[qk], ped.data || hojeIso(), pt==="com" ? "boleto" : undefined).map(function(g){ return {forma:g.forma, venc:g.venc, valor:g.valor.toFixed(2), qtd:"1", conta:"", status:"Pendente"}; }); upd(o); };
  var linhasParc = []; lcom.forEach(function(l, i){ linhasParc.push({id:"c"+i, pt:"com", i:i, l:l}); }); lsem.forEach(function(l, i){ linhasParc.push({id:"s"+i, pt:"sem", i:i, l:l}); });
  var tabParc = tabJ({chave:"id", linhas:linhasParc, vazio:"Nenhuma parcela: use + Parcela ou divida o saldo em Nx.", cols:[
    {k:"pt", t:"Parte", w:"6rem", fmt:function(v){ return v==="com" ? "Com nota" : "Sem nota"; }},
    {k:"forma", t:"Forma", w:"8rem", render:function(v, r){ return r.pt==="com" ? e(Sl,{value:r.l.forma, label:"Forma", onChange:function(x){ setL("com", r.i, "forma", x); }}, e("option",{value:"boleto"}, "Boleto"), e("option",{value:"pix_empresa"}, "Pix empresa"), e("option",{value:"cartao"}, "Cartão"), e("option",{value:"cheque"}, "Cheque")) : "Pix revendedora"; }},
    {k:"venc", t:"Vencimento", w:"8.5rem", render:function(v, r){ return e(In,{type:"date", value:r.l.venc, label:"Vencimento", onChange:function(x){ setL(r.pt, r.i, "venc", x); }}); }},
    {k:"valor", t:"Valor", w:"8rem", render:function(v, r){ return e(Dinheiro,{out:"ponto", value:r.l.valor, label:"Valor", className:"w-full min-w-0 px-1.5! text-[11px]!", onChange:function(x){ setL(r.pt, r.i, "valor", x); }}); }},
    {k:"qtd", t:"Nº parcelas", w:"5.5rem", render:function(v, r){ return r.pt==="com" ? e(In,{type:"number", min:"1", value:r.l.qtd, disabled:r.l.forma!=="cartao", label:"Nº de parcelas", onChange:function(x){ setL("com", r.i, "qtd", x); }}) : "1"; }},
    {k:"boleto", t:"Boleto", w:"9rem", render:function(v, r){ if(r.pt!=="com" || r.l.forma!=="boleto") return "—"; var nome = r.l.arq && r.l.arq.nome; return e("span",{className:"flex items-center justify-center gap-1"}, nome && e("span",{title:nome}, "Anexado"), e("label",{className:"cursor-pointer underline text-[#7DD3FC]"}, nome ? "Trocar" : "Anexar", e("input",{type:"file", accept:"image/*,application/pdf", className:"hidden", onChange:function(ev){ anexa(ev, function(a){ setL("com", r.i, "arq", a); }, "Não consegui anexar o boleto."); }}))); }},
    {k:"conta", t:"Conta ou bandeira", render:function(v, r){ return e(In,{value:r.l.conta, ph:"Conta / origem", label:"Conta", onChange:function(x){ setL(r.pt, r.i, "conta", x); }}); }},
    {k:"status", t:"Situação", w:"6.5rem", render:function(v, r){ return e(Sl,{value:r.l.status, label:"Status", onChange:function(x){ setL(r.pt, r.i, "status", x); }}, e("option",null, "Pendente"), e("option",null, "Pago")); }},
    {k:"x", t:"Tirar", w:"3.5rem", render:function(v, r){ return e("a",{href:"#", role:"button", className:"underline text-destructive", onClick:function(ev){ ev.preventDefault(); delL(r.pt, r.i); }}, "Tirar"); }}]});
  var conf = function(pt){ var alvo = pt==="com" ? X.com : X.sem, ls = expandirParcelas(pt==="com" ? lcom : lsem), aloc = ls.reduce(function(t, x){ return t+x.valor; }, 0), rest = alvo-aloc;
    return {id:pt, pt:pt, parte:pt==="com" ? "Com nota" : "Sem nota", alvo:brl(alvo), aloc:brl(aloc), n:ls.length, sit:Math.abs(rest)<0.005 ? "fecha certo ✓" : rest<0 ? "excede em "+brl(-rest) : "faltam "+brl(rest), ok:Math.abs(rest)<0.005, rest:rest, qk:pt==="com" ? "qCom" : "qSem"}; };
  var tabConf = tabJ({chave:"id", linhas:[conf("com"), conf("sem")], cols:[{k:"parte", t:"Parte", w:"6rem", cor:function(){ return "font-bold"; }}, {k:"alvo", t:"Do pedido"}, {k:"aloc", t:"Nas parcelas"}, {k:"n", t:"Parcelas"},
    {k:"sit", t:"Situação", cor:function(r){ return r.ok ? "text-success" : r.rest<0 ? "text-destructive" : "text-warning"; }},
    {k:"q", t:"Dividir em", w:"5.5rem", render:function(v, r){ return e(In,{type:"number", min:"1", value:ped[r.qk], label:"Quantidade de parcelas", onChange:function(x){ var o = {}; o[r.qk] = x; upd(o); }}); }},
    {k:"d", t:"Dividir saldo", w:"7rem", render:function(v, r){ return e("a",{href:"#", role:"button", className:"underline text-[#7DD3FC]", onClick:function(ev){ ev.preventDefault(); dividirL(r.pt); }}, "Dividir saldo"); }},
    {k:"m", t:"Parcela nova", w:"7rem", render:function(v, r){ return e("a",{href:"#", role:"button", className:"underline text-[#7DD3FC]", onClick:function(ev){ ev.preventDefault(); addL(r.pt); }}, "+ Parcela"); }}]});
  var mostraParc = !comProp || ped.verParc;

  var caixa = function(titulo, filhos, k, extra){ return e.apply(null, [BlocoPainel,{key:k, titulo:titulo, cls:"!bg-[#17284e]"+(extra || "")}].concat(filhos)); };
  var esq = [caixa("Pedido", [tabPedido, cadAuto.ids.length>0 && e("p",{key:"lcf", className:"border-t border-white/30 px-3 py-1 text-center text-[11px]"}, "Fatura ligada ao Cadastro de peças: pedidos de bruto "+cadAuto.ids.join(", ")+(cadAuto.forn ? " · "+cadAuto.forn : "")+(cadAuto.nota ? " · nota "+cadAuto.nota : "")), lig && e("p",{className:"border-t border-white/30 px-3 py-1 text-center text-[11px]"}, "Ligado ao pedido de bruto do Cadastro de peças: ", e("b",null, lig.forn || ""), " · nota ", e("b",null, lig.nota), " · a pagar ", e("b",null, brl(lig.pagar || 0)))], "pedido")];
  if(comProp) esq.push(caixa("Regra de "+(fo ? fo.nome : "fornecedor")+" · prazos em dias", [tabRegra], "regra"));
  var dir = [];
  if(comProp) dir.push(caixa("5 propostas · toque numa linha", [tabProp, ped.parcManual && e("p",{className:"border-t border-white/30 py-1 text-center text-[11px]"}, "Parcelas ajustadas à mão. ", e("a",{href:"#", role:"button", className:"underline text-[#7DD3FC]", onClick:function(ev){ ev.preventDefault(); upd({parcManual:false}); }}, "Voltar à proposta escolhida"))], "props"));
  dir.push(caixa("Mensagem da proposta · você pode mudar o texto", [
    e("textarea",{value:msg, "aria-label":"Mensagem de proposta", style:{minHeight:250}, className:INPUT+" w-full flex-1 rounded-none! border-0! font-mono leading-snug", onChange:function(ev){ p.setPed(Object.assign({}, ped, {msgManual:ev.target.value})); }}),
    ped.msgManual!=null && e("p",{className:"border-t border-white/30 py-1 text-center text-[11px]"}, "Texto mudado à mão. ", e("a",{href:"#", role:"button", className:"underline text-[#7DD3FC]", onClick:function(ev){ ev.preventDefault(); p.setPed(Object.assign({}, ped, {msgManual:null})); }}, "Refazer pelas parcelas"))], "msg", " flex-1"));
  var linhaBotoes = e("div",{className:"flex flex-wrap justify-center gap-2"},
    e(BtJ,{neutro:true, onClick:fechar}, "Cancelar"),
    comProp && e(BtJ,{neutro:true, onClick:function(){ p.setPed(Object.assign({}, ped, {verParc:!ped.verParc})); }}, ped.verParc ? "Esconder parcelas" : "Ajustar parcelas"),
    e(BtJ,{neutro:true, onClick:function(){ copiaTxt(msg); aviso(c, "Proposta copiada.", "ok"); }}, "Copiar proposta"),
    e(BtJ,{neutro:true, onClick:function(){ salvar(false); }}, ped.editId ? "Salvar alterações" : "Só lançar pedido"),
    !ped.editId && e(BtJ,{onClick:function(){ salvar(true); }}, "Enviar e lançar pedido"));
  esq.push(linhaBotoes);
  return e(ModalAzul,{larga:true, t:ped.editId ? "Editar pedido" : "Lançar pedido"+(fo ? " · "+fo.nome : "")+(comProp ? " e enviar proposta" : ""), sub:ped.editId ? "Parcela já paga fica travada: para mudar, estorne a baixa antes. Cada alteração fica no histórico do pedido." : comProp ? "Preencha o pedido: o sistema monta 5 propostas pela regra do fornecedor. Escolha uma, mude o que quiser e envie." : "Preencha o pedido e as parcelas; no fim sai a mensagem de proposta para o fornecedor.", fechar:fechar},
    e("div",{className:"flex flex-col gap-3 "+MODAL_PED+" "+PADRAO_BLOCOS},
      e("div",{className:"grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2"}, e.apply(null, ["div",{className:"flex flex-col gap-3"}].concat(esq)), e.apply(null, ["div",{className:"flex flex-col gap-3"}].concat(dir))),
      comProp && ped.verProp && caixa("Proposta escolhida · datas e valores", [detTab("Com nota · "+(regra.com.forma==="boleto" ? "Boleto" : regra.com.forma==="cheque" ? "Cheque" : regra.com.forma==="cartao" ? "Cartão" : "Pix empresa"), lcom), detTab("Sem nota · Pix revendedora", lsem)], "det"),
      mostraParc && caixa("Parcelas do pedido", [tabParc, tabConf], "parc")));
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
  // mesma estrutura da janela Lançar pedido: fundo azul, blocos, tabelas, letra de 11 px, botões azuis (Marcus, 22/11/2026)
  var tabJ = function(extra){ return e("div",{className:TJ_CLS}, e(TabelaPlanilha, Object.assign({}, TJ, extra))); };
  var caixa = function(titulo, filhos, k){ return e.apply(null, [BlocoPainel,{key:k, titulo:titulo, cls:"!bg-[#17284e]"}].concat(filhos)); };
  var LKJ = function(txt, fn, cls){ return e("a",{href:"#", role:"button", className:"underline "+(cls || "text-[#7DD3FC]"), onClick:function(ev){ ev.preventDefault(); ev.stopPropagation(); fn(); }}, txt); };
  var tipoNF = pd.nfTipo==="com" ? "Todo com NF" : pd.nfTipo==="sem" ? "Todo sem NF" : "Parte com e parte sem NF";
  var linhaResumo = [{id:"r", tipo:tipoNF, total:pd.total, com:pd.comNF, sem:pd.semNF, pago:D.pago, aberto:D.aberto}];
  var tabResumo = tabJ({chave:"id", linhas:linhaResumo, cols:[{k:"tipo", t:"Tipo"}, {k:"total", t:"Valor do pedido", fmt:brl}, {k:"com", t:"Com NF", fmt:brl}, {k:"sem", t:"Sem NF", fmt:brl}, {k:"pago", t:"Já pago", fmt:brl, cor:function(){ return "text-success"; }}, {k:"aberto", t:"Em aberto", fmt:brl, cor:function(r){ return r.aberto>0.005 ? "text-destructive" : ""; }}]});
  var linhaAloc = function(id, parte, a2, de, rest){ var ok2 = Math.abs(rest)<0.005; return {id:id, parte:parte, alocado:a2, de:de, sit:ok2 ? "fecha certo ✓" : "faltam "+brl(rest), ok:ok2}; };
  var tabAloc = tabJ({chave:"id", linhas:[linhaAloc("a", "Com NF · boleto, Pix empresa, cartão ou cheque", D.comAloc, pd.comNF, D.restCom), linhaAloc("b", "Sem NF · Pix revendedora", D.semAloc, pd.semNF, D.restSem)],
    cols:[{k:"parte", t:"Parcelas alocadas"}, {k:"alocado", t:"Nas parcelas", fmt:brl}, {k:"de", t:"Do pedido", fmt:brl}, {k:"sit", t:"Situação", cor:function(r){ return r.ok ? "text-success" : "text-warning"; }}]});
  var anexaB = function(ev, idx){ var arq = ev.target.files && ev.target.files[0]; if(!arq) return; lerAnexo(arq).then(function(a2){ return enviarAnexo("pf", a2); }).then(function(sv){ grava(c, "parcela_set", {pedId:pd.id, idx:idx, patch:{arq:{key:sv.key, nome:arq.name}}}); }, function(err){ aviso(c, ((err && err.message) ? err.message+" " : "")+"Não consegui anexar o boleto.", "alerta"); }); };
  // parcelas divididas em Com NF e Sem NF, cada parte em ordem de vencimento
  var blocosParc = D.parcelas.length ? [{t:"Parcelas com NF", com:true}, {t:"Parcelas sem NF", com:false}].map(function(g){
    var ls = D.parcelas.filter(function(x){ return !!x.registro===g.com; }).sort(function(a2, b2){ return a2.p.venc.localeCompare(b2.p.venc) || a2.i-b2.i; })
      .map(function(x){ return {id:x.i, venc:x.p.venc, forma:x.forma.label, conta:x.p.conta || "—", valor:x.p.valor, sit:x.registro ? "Registro" : x.p.status, x:x}; });
    if(!ls.length) return null;
    return caixa(g.t+" · "+ls.length+" · "+brl(ls.reduce(function(t, r){ return t+r.valor; }, 0)), [tabJ({chave:"id", linhas:ls, cols:[
      {k:"venc", t:"Vencimento", w:"7.5rem", fmt:function(v){ return dbr(v); }}, {k:"forma", t:"Forma"}, {k:"conta", t:"Conta ou bandeira"}, {k:"valor", t:"Valor", fmt:brl},
      {k:"bol", t:"Boleto", w:"8rem", render:function(v, r){ if(r.x.p.forma!=="boleto") return "—"; var ar = r.x.p.arq;
        return e("span",{className:"flex items-center justify-center gap-2", onClick:function(ev){ ev.stopPropagation(); }}, ar && LKJ("Ver", function(){ abrirAnexo(ar.key); }), c.edita && e("label",{className:"cursor-pointer underline text-[#7DD3FC]"}, ar ? "Trocar" : "Anexar", e("input",{type:"file", accept:"image/*,application/pdf", className:"hidden", onChange:function(ev){ anexaB(ev, r.x.i); }}))); }},
      {k:"sit", t:"Situação", w:"7rem", cor:function(r){ return "font-semibold "+(r.sit==="Pago" ? "text-success" : (r.sit==="Registro" ? "text-white" : "text-warning")); }},
      {k:"n", t:"Ação", w:"7rem", render:function(v, r){ return r.x.registro ? "sem baixa" : (c.edita ? LKJ(r.sit==="Pago" ? "Estornar" : "Dar baixa", function(){ p.baixa(pd.id, r.x.i); }, r.sit==="Pago" ? "text-destructive" : "text-[#7DD3FC]") : "—"); }}]})], g.t);
  }) : [caixa("Parcelas", [e("p",{key:"v", className:"py-3 text-center text-[11px]"}, "Nenhuma parcela lançada neste pedido.")], "vazio")];
  var extras = [];
  if(pd.avisoLimite) extras.push(caixa("Aviso do teto mensal", [e("p",{key:"av", className:"px-3 py-2 text-center text-[11px] font-bold text-warning"}, pd.avisoLimite)], "aviso"));
  if((pd.historico || []).length>0) extras.push(caixa("Histórico de alterações", [e("div",{key:"h", className:"flex flex-col gap-0.5 px-3 py-2 text-center text-[11px]"}, pd.historico.slice().reverse().map(function(h, i){ return e("div",{key:i}, e("b",null, h.em+" · "+(h.por || "—")+": "), h.mudou); }))], "hist"));
  return e(ModalAzul,{larga:true, t:(f ? f.nome : "—")+" · Pedido "+pd.numero, sub:dbr(pd.data)+" · "+pd.cnpj+(pd.nfNum ? " · NF "+pd.nfNum : ""), fechar:p.fechar},
    e("div",{className:"flex flex-col gap-3 "+PADRAO_BLOCOS},
      caixa("Resumo do pedido", [tabResumo, tabAloc], "resumo"),
      e.apply(null, ["div",{className:"flex flex-col gap-3"}].concat(blocosParc)),
      e.apply(null, ["div",{className:"flex flex-col gap-3"}].concat(extras)),
      e("div",{className:"flex flex-wrap justify-center gap-2"},
        e(BtJ,{neutro:true, disabled:!c.edita, onClick:excluir}, "Excluir pedido"),
        e(BtJ,{neutro:true, disabled:!c.edita, onClick:function(){ p.editar(pd); }}, "Editar"),
        e(BtJ,{disabled:!c.edita, onClick:function(){ p.lancar(pd.id); }}, "Lançar parcela"),
        e(BtJ,{neutro:true, onClick:p.fechar}, "Fechar"))));
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

export { AbaPfNeg, JanelaPedido, pedidoNovo };

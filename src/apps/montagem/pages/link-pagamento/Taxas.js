// Sorelly Admin · montagem — pages/link-pagamento/Taxas.js
// Tela Taxas e recebimentos: SIMULADOR (meio, valor, parcelas, antecipa sim/não → taxa, líquido, quando entra, por parcela) e a tabela das taxas de cada meio.
// Contas em domain/link-pagamento.js (calcularTaxa). Meio que "vira pagamento de fornecedor" (Getnet, Cielo) mostra o aviso e gera o dado para o módulo Pagamentos a fornecedores.
// REFEITA em 16/11/2026 (Marcus: "arruma as outras telas conforme as nossas regras"): dois blocos azuis; os campos do simulador ficam na faixa azul, o resultado vira uma linha de números e as duas tabelas são planilha (TabelaPlanilha). Nada saiu.
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { Dinheiro } from "@/apps/montagem/components/padrao";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { BANDEIRAS, MAX_PARCELAS, avisoFornecedor, calcularTaxa, formatarDia, formatarReais, hojeSP, nomeMeio, passadaParaFornecedor, rotuloCnpj, sugestaoContaPix, taxaDe } from "@/apps/montagem/domain/link-pagamento";
import { copiar, pct, useLp } from "@/apps/montagem/pages/link-pagamento/visual";
import { e, useState } from "@/shared/react";

var SEL = "h-8 rounded-md border border-white/50 bg-[#14233f] px-2 text-[13px] font-semibold text-white [color-scheme:dark]";
var AVISO = "px-2 py-1.5 text-center text-[13px] font-semibold";

function AbaLpTaxas(){
  var L = useLp(), s = L.s, lp = L.lp, meios = lp.meios.filter(function(m){ return m.ativo; });
  var st = useState({meioId:"", valor:0, parcelas:"1", antecipa:"sim", bandeira:""}), v = st[0], ok = useState(false);
  var set = function(k, x){ st[1](function(o){ var n = Object.assign({}, o); n[k] = x; return n; }); };
  var meio = meios.find(function(m){ return m.id===v.meioId; }) || meios[0] || null, valor = Number(v.valor)||0;
  var r = meio && valor>0 ? calcularTaxa(meio, valor, v.parcelas, v.antecipa==="sim", hojeSP(), v.bandeira) : null;
  var forn = meio && r ? passadaParaFornecedor(meio, {valor:valor, parcelas:v.parcelas, data:hojeSP(), bandeira:v.bandeira || "Outras"}) : null;
  var pix = meio ? sugestaoContaPix(s, meio.cnpjId) : null;
  var nParc = []; for(var i = 1; i<=MAX_PARCELAS; i++) nParc.push(i);
  var campo = function(rot, el){ return e("label",{className:"flex items-center gap-1.5 text-[13px] font-semibold text-white"}, rot, el); };
  var din = function(x){ return formatarReais(x || 0); };
  var num = function(rot, val, cor){ return e("span",{key:rot, className:"whitespace-nowrap px-1 text-[13px]"}, rot+" ", e("b",{className:"tabular-nums "+(cor || "")}, val)); };

  // ── bloco 1: simulador ──
  var faixaSim = !meios.length ? null : e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1"},
    campo("Meio", e("select",{"aria-label":"Meio", value:meio ? meio.id : "", onChange:function(ev){ set("meioId", ev.target.value); }, className:SEL}, meios.map(function(m){ return e("option",{key:m.id, value:m.id}, nomeMeio(m)); }))),
    campo("Valor da venda", e("span",{className:"w-36"}, e(Dinheiro,{value:valor, label:"Valor da venda", onChange:function(x){ set("valor", x); }}))),
    campo("Parcelas", e("select",{"aria-label":"Parcelas", value:v.parcelas, onChange:function(ev){ set("parcelas", ev.target.value); }, className:SEL}, nParc.map(function(n){ return e("option",{key:n, value:String(n)}, n+"x"); }))),
    campo("Bandeira", e("select",{"aria-label":"Bandeira", value:v.bandeira, onChange:function(ev){ set("bandeira", ev.target.value); }, className:SEL}, [e("option",{key:"", value:""}, "Todas")].concat(BANDEIRAS.map(function(b){ return e("option",{key:b, value:b}, b); })))),
    campo("Antecipar", e("select",{"aria-label":"Antecipar", value:v.antecipa, onChange:function(ev){ set("antecipa", ev.target.value); }, className:SEL}, e("option",{value:"sim"}, "Sim"), e("option",{value:"nao"}, "Não"))));
  var linhasParc = r ? r.previsaoCredito.map(function(p){ return {id:String(p.parcela), parcela:p.parcela+"/"+r.parcelas, entra:String(p.data || "").slice(0, 10), bruto:p.bruto, taxa:p.taxa, antecipacao:p.antecipacao, liquido:p.liquido}; }) : [];
  var colsParc = [{k:"parcela", t:"Parcela"}, {k:"entra", t:"Entra em", render:function(x){ return formatarDia(x); }}, {k:"bruto", t:"Bruto", render:din}, {k:"taxa", t:"Taxa", render:function(x){ return e("span",{className:"text-[#FBBF24]"}, din(x)); }},
    {k:"antecipacao", t:"Antecipação", render:function(x){ return e("span",{className:x>0 ? "text-[#FBBF24]" : ""}, din(x)); }}, {k:"liquido", t:"Líquido", render:function(x){ return e("b",{className:"text-success"}, din(x)); }}];
  var sim = e(BlocoPainel,{titulo:"Simulador de taxa e recebimento", compacto:true},
    !meios.length ? e("p",{className:"py-6 text-center text-[13px]"}, "Cadastre um meio de recebimento na tela Meios e acessos.") : [
      faixaSim,
      meio && v.antecipa==="sim" && !meio.antecipacao.ativa && e("p",{key:"a1", className:AVISO+" text-[#FBBF24]"}, "Este meio não tem antecipação ligada: o cálculo segue sem antecipar."),
      meio && avisoFornecedor(meio) && e("p",{key:"a2", className:AVISO+" text-[#BFDBFE]"}, avisoFornecedor(meio)),
      !r ? e("p",{key:"v", className:"py-6 text-center text-[13px]"}, "Informe o valor da venda para calcular.") : e("div",{key:"r", className:"flex flex-col"},
        e("div",{className:"flex flex-wrap items-center justify-center gap-x-3 border-b border-white/30 px-2 py-1.5"},
          num("Taxa", pct(r.taxaPct)+" · "+formatarReais(r.taxaValor), "text-[#FBBF24]"),
          num("Antecipação", formatarReais(r.antecipacaoValor)+(r.antecipa ? " (antecipando)" : " (sem antecipar)"), r.antecipacaoValor>0 ? "text-[#FBBF24]" : ""),
          num("Total de descontos", formatarReais(r.totalDescontos), "text-[#fca5a5]"),
          num("Líquido", formatarReais(r.liquido)+" · "+pct(r.liquidoPct)+" da venda", "text-success"),
          num("Primeiro crédito", formatarDia(r.previsaoCredito[0].data)+(r.previsaoCredito.length===1 ? " · à vista" : " · último em "+formatarDia(r.previsaoCredito[r.previsaoCredito.length-1].data)))),
        e(TabelaPlanilha,{cols:colsParc, linhas:linhasParc, chave:"id", centro:true, grade:true, semFiltro:true, semContagem:true, semLimpar:true}),
        pix && pix.cnpjId && e("p",{className:AVISO+" border-t border-white/30"}, pix.aviso),
        forn && e("div",{className:"flex flex-wrap items-center justify-center gap-2 border-t border-white/30 px-2 py-1.5 text-[13px]"},
          e("b",{className:"text-[#60A5FA]"}, "Vira pagamento de fornecedor"), e("span",null, "Desconto da maquininha: "+formatarReais(forn.descontoMaquininha)),
          e("button",{type:"button", onClick:function(){ if(copiar(JSON.stringify(forn, null, 2))){ ok[1](true); setTimeout(function(){ ok[1](false); }, 2500); } }, className:"h-8 rounded-md border border-white/50 px-3 font-semibold hover:bg-white/10"}, ok[0] ? "✓ Copiado" : "Copiar dado para Pagamentos a fornecedores")))]);

  // ── bloco 2: taxas de cada meio ──
  var colsMeios = [{k:"meio", t:"Meio"}, {k:"cnpj", t:"CNPJ"}, {k:"adquirente", t:"Adquirente"}]
    .concat(nParc.slice(0, lp.config.maxParcelasSemJuros).map(function(n){ return {k:"p"+n, t:n+"x"}; }), [{k:"antecipacao", t:"Antecipação"}, {k:"credito", t:"Crédito"}]);
  var linhasMeios = lp.meios.map(function(m){
    var a = m.antecipacao, pz = m.prazoCredito, o = {id:m.id, meio:m.nome+(m.ativo ? "" : " (inativo)"), cnpj:rotuloCnpj(m.cnpjId), adquirente:m.adquirente, _inativo:!m.ativo,
      antecipacao:a.ativa ? (a.modo==="mes" ? pct(a.pctMes)+" ao mês" : "Por parcelas") : "Desligada", credito:a.ativa ? pz.antecipado+(pz.antecipado===1 ? " dia" : " dias") : pz.primeira+" dias"+(pz.intervalo ? " + "+pz.intervalo+"/parc." : "")};
    nParc.slice(0, lp.config.maxParcelasSemJuros).forEach(function(n){ o["p"+n] = pct(taxaDe(m, "", n)); });
    return o; });
  return e("div",{className:"flex flex-col gap-2"}, sim,
    e(BlocoPainel,{titulo:"Taxas de cada meio", compacto:true, dir:String(lp.meios.length)},
      !lp.meios.length ? e("p",{className:"py-6 text-center text-[13px]"}, "Nenhum meio de recebimento cadastrado.")
        : e(TabelaPlanilha,{cols:colsMeios, linhas:linhasMeios, chave:"id", centro:true, grade:true, maozinha:true, semLimpar:true, semContagem:true, linhaCls:function(l){ return l._inativo ? "opacity-50" : ""; }})));
}
export { AbaLpTaxas };

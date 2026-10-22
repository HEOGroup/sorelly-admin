// Sorelly Admin · montagem — pages/link-pagamento/Taxas.js
// Aba Taxas e recebimentos: SIMULADOR (meio, valor, parcelas, antecipa sim/não → taxa, líquido, quando entra, por parcela) e a tabela das taxas de cada meio.
// Contas em domain/link-pagamento.js (calcularTaxa). Meio que "vira pagamento de fornecedor" (Getnet, Cielo) mostra o aviso e gera o dado para o módulo Pagamentos a fornecedores.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Dinheiro, Faixa, LINHA, Tab, Td } from "@/apps/montagem/components/padrao";
import { BANDEIRAS, MAX_PARCELAS, avisoFornecedor, calcularTaxa, formatarDia, formatarReais, hojeSP, nomeMeio, passadaParaFornecedor, rotuloCnpj, sugestaoContaPix, taxaDe } from "@/apps/montagem/domain/link-pagamento";
import { Bt, Campo, Ind, Selo, Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { copiar, pct, useLp } from "@/apps/montagem/pages/link-pagamento/visual";
import { INPUT } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

function AbaLpTaxas(){
  var L = useLp(), s = L.s, lp = L.lp, meios = lp.meios.filter(function(m){ return m.ativo; });
  var st = useState({meioId:"", valor:0, parcelas:"1", antecipa:"sim", bandeira:""}), v = st[0], ok = useState(false);
  var set = function(k, x){ st[1](function(o){ var n = Object.assign({}, o); n[k] = x; return n; }); };
  var meio = meios.find(function(m){ return m.id===v.meioId; }) || meios[0] || null, valor = Number(v.valor)||0;
  var r = meio && valor>0 ? calcularTaxa(meio, valor, v.parcelas, v.antecipa==="sim", hojeSP(), v.bandeira) : null;
  var forn = meio && r ? passadaParaFornecedor(meio, {valor:valor, parcelas:v.parcelas, data:hojeSP(), bandeira:v.bandeira || "Outras"}) : null;
  var pix = meio ? sugestaoContaPix(s, meio.cnpjId) : null;
  var nParc = []; for(var i = 1; i<=MAX_PARCELAS; i++) nParc.push(i);
  var cab = ["Meio", "CNPJ", "Adquirente"].concat(nParc.slice(0, lp.config.maxParcelasSemJuros).map(function(n){ return n+"x"; }), ["Antecipação", "Crédito"]);
  return e("div",{className:"flex flex-col gap-2.5"},
    e(BlocoBarra,{cor:"turquesa", t:"Simulador de taxa e recebimento"},
      !meios.length ? e("div",{className:"p-2"}, e(Vazio,{ic:"calculator"}, "Cadastre um meio de recebimento na aba Meios e acessos.")) :
      e("div",{className:"flex flex-col gap-2.5 p-2.5"},
        e("div",{className:"grid items-end gap-2", style:{gridTemplateColumns:"repeat(auto-fit, minmax(10rem, 1fr))"}},
          e(Campo,{rot:"Meio"}, e("select",{value:meio ? meio.id : "", onChange:function(ev){ set("meioId", ev.target.value); }, className:INPUT+" w-full cursor-pointer text-center"}, meios.map(function(m){ return e("option",{key:m.id, value:m.id}, nomeMeio(m)); }))),
          e(Campo,{rot:"Valor da venda"}, e(Dinheiro,{value:valor, label:"Valor da venda", onChange:function(x){ set("valor", x); }})),
          e(Campo,{rot:"Parcelas"}, e("select",{value:v.parcelas, onChange:function(ev){ set("parcelas", ev.target.value); }, className:INPUT+" w-full cursor-pointer text-center"}, nParc.map(function(n){ return e("option",{key:n, value:String(n)}, n+"x"); }))),
          e(Campo,{rot:"Bandeira"}, e("select",{value:v.bandeira, onChange:function(ev){ set("bandeira", ev.target.value); }, className:INPUT+" w-full cursor-pointer text-center"}, [e("option",{key:"", value:""}, "Todas")].concat(BANDEIRAS.map(function(b){ return e("option",{key:b, value:b}, b); })))),
          e(Campo,{rot:"Antecipar"}, e("select",{value:v.antecipa, onChange:function(ev){ set("antecipa", ev.target.value); }, className:INPUT+" w-full cursor-pointer text-center"}, e("option",{value:"sim"}, "Sim"), e("option",{value:"nao"}, "Não")))),
        meio && v.antecipa==="sim" && !meio.antecipacao.ativa && e("p",{className:"rounded-lg bg-[#FBBF24]/15 px-3 py-1.5 text-center text-[12.5px] font-bold text-[#FBBF24]"}, "Este meio não tem antecipação ligada: o cálculo segue sem antecipar."),
        meio && avisoFornecedor(meio) && e("p",{className:"rounded-lg bg-[#3B82F6]/15 px-3 py-1.5 text-center text-[12.5px] font-bold text-[#BFDBFE]"}, avisoFornecedor(meio)),
        !r ? e(Vazio,{ic:"calculator"}, "Informe o valor da venda para calcular.") : e("div",{className:"flex flex-col gap-2.5"},
          e(Faixa,{n:5},
            e(Ind,{t:"Taxa", v:pct(r.taxaPct), cor:"alerta", sub:formatarReais(r.taxaValor)}),
            e(Ind,{t:"Antecipação", v:formatarReais(r.antecipacaoValor), cor:r.antecipacaoValor>0 ? "alerta" : "neutro", sub:r.antecipa ? "Antecipando" : "Sem antecipar"}),
            e(Ind,{t:"Total de descontos", v:formatarReais(r.totalDescontos), cor:"ruim"}),
            e(Ind,{t:"Líquido", v:formatarReais(r.liquido), cor:"ok", sub:pct(r.liquidoPct)+" da venda"}),
            e(Ind,{t:"Primeiro crédito", v:formatarDia(r.previsaoCredito[0].data), cor:"info", sub:r.previsaoCredito.length===1 ? "À vista" : "Último em "+formatarDia(r.previsaoCredito[r.previsaoCredito.length-1].data)})),
          e(Tab,{cols:["Parcela", "Entra em", "Bruto", "Taxa", "Antecipação", "Líquido"]}, r.previsaoCredito.map(function(p){
            return e("tr",{key:p.parcela, className:LINHA}, e(Td,{forte:true}, p.parcela+"/"+r.parcelas), e(Td,null, formatarDia(p.data)), e(Td,{dinheiro:true}, formatarReais(p.bruto)), e(Td,{dinheiro:true, cor:"alerta"}, formatarReais(p.taxa)),
              e(Td,{dinheiro:true, cor:p.antecipacao>0 ? "alerta" : undefined}, formatarReais(p.antecipacao)), e(Td,{dinheiro:true, forte:true, cor:"ok"}, formatarReais(p.liquido))); })),
          pix && pix.cnpjId && e("p",{className:"rounded-lg bg-black/25 px-3 py-1.5 text-center text-[12.5px] text-white/80"}, pix.aviso),
          forn && e("div",{className:"flex flex-wrap items-center justify-center gap-2 rounded-lg bg-black/25 px-3 py-2"},
            e(Selo,{cor:"#60A5FA", ic:"truck"}, "Vira pagamento de fornecedor"),
            e("span",{className:"text-[12.5px] text-white/80"}, "Desconto da maquininha: "+formatarReais(forn.descontoMaquininha)),
            e(Bt,{ic:ok[0] ? "check" : "copy", onClick:function(){ if(copiar(JSON.stringify(forn, null, 2))){ ok[1](true); setTimeout(function(){ ok[1](false); }, 2500); } }}, "Copiar dado para Pagamentos a fornecedores"))))),
    e(BlocoBarra,{cor:"turquesa", t:"Taxas de cada meio", compacto:true, dir:String(lp.meios.length)},
      !lp.meios.length ? e("div",{className:"p-2"}, e(Vazio,{ic:"percent"}, "Nenhum meio de recebimento cadastrado.")) :
      e("div",{className:"p-2"}, e(Tab,{cols:cab}, lp.meios.map(function(m){
        var a = m.antecipacao, pz = m.prazoCredito;
        return e("tr",{key:m.id, className:LINHA+(m.ativo ? "" : " opacity-50")}, e(Td,{forte:true}, m.nome+(m.ativo ? "" : " (inativo)")), e(Td,null, rotuloCnpj(m.cnpjId)), e(Td,null, m.adquirente),
          nParc.slice(0, lp.config.maxParcelasSemJuros).map(function(n){ return e(Td,{key:n, dinheiro:true}, pct(taxaDe(m, "", n))); }),
          e(Td,null, a.ativa ? (a.modo==="mes" ? pct(a.pctMes)+" ao mês" : "Por parcelas") : "Desligada"),
          e(Td,null, a.ativa ? pz.antecipado+(pz.antecipado===1 ? " dia" : " dias") : pz.primeira+" dias"+(pz.intervalo ? " + "+pz.intervalo+"/parc." : ""))); })))));
}
export { AbaLpTaxas };

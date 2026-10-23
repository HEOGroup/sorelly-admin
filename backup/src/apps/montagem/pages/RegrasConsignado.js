// Sorelly Admin — pages/RegrasConsignado.js
// Editor das regras do consignado: régua de comissão e brinde, taxa, remarcação, pagamento e kit novo.
// Salvar cria uma NOVA VERSÃO (REGRAS_CONSIGNADO_ATUALIZAR). O app da representante lê a mesma versão, então o que muda aqui
// muda lá: vale para os kits criados a partir de agora (kits já em andamento mantêm a versão que carimbaram).
// É usado dentro de Representantes → Configurações.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { reais, versaoVigente } from "@/apps/montagem/domain/consignado";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MONO, MoneyInput } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";
import React from "react";

var copia = function(x){ return JSON.parse(JSON.stringify(x)); };
var CELULA = "w-full text-right "+MONO+" h-9! px-2.5! text-sm!";

// Dinheiro (R$ 7.000,00, digitando só números) e percentual (35 %) com a mesma largura e alinhamento à direita.
function Din(p){ return e(MoneyInput,{value:p.value, label:p.label, onChange:p.onChange, className:CELULA}); }
function Pct(p){
  return e("div",{className:"relative"},
    e("input",{type:"number", step:p.step||"1", value:p.value, "aria-label":p.label, className:INPUT+" "+CELULA+" pr-7!",
      onChange:function(ev){ var n = parseFloat(ev.target.value); p.onChange(isNaN(n) ? 0 : n); }}),
    e("span",{className:"pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-muted-foreground"}, "%"));
}
function Th(p){ return e("th",{className:"px-2 py-2 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground "+(p.esq ? "text-left" : "text-right"), style:p.w ? {width:p.w} : undefined}, p.children); }
function Td(p){ return e("td",{className:"px-2 py-1.5 "+(p.esq ? "text-left" : "text-right")}, p.children); }
function X(p){ return e("button",{onClick:p.onClick, "aria-label":p.label, className:"grid size-8 place-items-center rounded-full bg-muted text-base font-bold text-muted-foreground hover:bg-destructive/20 hover:text-destructive"}, "×"); }
function Tabela(p){
  return e("table",{className:"w-full table-fixed border-collapse text-sm"},
    e("thead",null, e("tr",{className:"border-b border-border"}, p.cols.map(function(c,i){ return e(Th,{key:i, esq:c.esq, w:c.w}, c.t); }))),
    e("tbody",null, p.children));
}
function Rodape(p){ return e("div",{className:"mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3"}, p.children); }
function Campo(p){ return e("label",{className:"flex items-center gap-2 text-[13px]"}, e("span",{className:"text-muted-foreground"}, p.rotulo), p.children); }

function EditorRegrasConsignado(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var vig = versaoVigente(s);
  var pegar = function(v){ return {faixas:copia(v.faixas), remarcacao:copia(v.remarcacao), pagamentoBrinde:copia(v.pagamentoBrinde), taxaBaixa:copia(v.taxaBaixa), gerais:copia(v.gerais)}; };
  var ini = function(){ return Object.assign(pegar(vig), {prata:pegar(vig.prata)}); };
  var rs = useState(ini), rasc = rs[0], setRasc = rs[1];
  var md = useState("padrao"), mod = md[0], setMod = md[1];        // qual modalidade está sendo editada: Kit padrão ou Kit 100% Prata
  var ehPrata = mod==="prata", R = ehPrata ? rasc.prata : rasc;
  var alterou = JSON.stringify(rasc) !== JSON.stringify(ini());
  var alvo = function(n){ return ehPrata ? n.prata : n; };
  var set = function(chave, i, campo, v){ var n = copia(rasc); alvo(n)[chave][i][campo] = v; setRasc(n); };
  var add = function(chave, linha){ var n = copia(rasc); alvo(n)[chave].push(linha); setRasc(n); };
  var del = function(chave, i){ var n = copia(rasc); alvo(n)[chave].splice(i,1); setRasc(n); };
  var setG = function(campo, v){ var n = copia(rasc); alvo(n).gerais[campo] = v; setRasc(n); };
  var salvar = function(){
    var ord = function(a, campo){ return a.slice().sort(function(x,y){ return x[campo]-y[campo]; }); };
    var fecha = function(r){ return {faixas:ord(r.faixas,"min"), remarcacao:r.remarcacao, pagamentoBrinde:ord(r.pagamentoBrinde,"max"), taxaBaixa:ord(r.taxaBaixa,"min").reverse(), gerais:r.gerais}; };
    d({type:"REGRAS_CONSIGNADO_ATUALIZAR", campos:Object.assign(fecha(rasc), {prata:fecha(rasc.prata)})});
  };
  var versoes = (s.regrasConsignado.versoes||[]).slice().reverse();
  // texto da faixa de cada linha ("R$ 300,00 a R$ 499,99"), calculado pelas outras linhas — fica certo mesmo com a tabela fora de ordem
  var mins = R.faixas.map(function(f){return f.min;}).sort(function(a,b){return a-b;});
  var rotuloFaixa = function(min){ var prox = mins.find(function(m){return m>min;}); return prox ? reais(min)+" a "+reais(prox-0.01) : reais(min)+" ou mais"; };
  var taxMins = R.taxaBaixa.map(function(t){return t.min;}).sort(function(a,b){return a-b;});
  var rotuloTaxa = function(min){ var prox = taxMins.find(function(m){return m>min;}); var fim = (prox!=null ? prox : R.gerais.taxaAbaixoDe)-0.01; return min<=0 ? "Até "+reais(fim) : reais(min)+" a "+reais(fim); };
  return e("div",{className:"flex flex-col gap-4"},
    e("div",{className:"flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-[#E8B84B]/25"},
      e("span",{className:"text-[13px]"}, "Versão vigente desde ", e("b",null, vig.vigenciaDesde.split("-").reverse().join("/")), " · ", versoes.length, versoes.length===1?" versão":" versões",
        e("span",{className:"text-muted-foreground"}," · vale para os kits criados a partir de agora")),
      e("div",{className:"flex items-center gap-2"},
        alterou && e("span",{className:"text-[12.5px] font-semibold text-warning"},"Alterações não salvas"),
        e(Btn,{v:"ghost", disabled:!alterou, onClick:function(){ setRasc(ini()); }}, "Descartar"),
        e(Btn,{v:"primary", ic:"save", disabled:!alterou, onClick:salvar}, "Salvar nova versão"))),
    e("div",{className:"flex w-fit gap-1 rounded-xl bg-muted p-1"}, [["padrao","Kit Padrão"],["prata","Kit 100% Prata"]].map(function(o){
      return e("button",{key:o[0], onClick:function(){ setMod(o[0]); }, "aria-pressed":mod===o[0],
        className:"rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-colors "+(mod===o[0] ? "bg-card text-foreground shadow ring-1 ring-[#E8B84B]/40" : "text-muted-foreground hover:text-foreground")}, o[1]); })),
    ehPrata && e(BlocoBarra,{cor:"azul", t:"Regras gerais do Kit 100% Prata", sub:"valem só para revendedoras no Kit 100% Prata · o Kit Padrão não muda"},
      e("div",{className:"grid grid-cols-1 gap-3 p-3 md:grid-cols-2 xl:grid-cols-3"},
        [["atrasoPctDia","Atraso: comissão −","% por dia","pct"],["parcelaMinimaCredito","Parcela mínima no crédito","","din"],
          ["agendarAntecedenciaDias","Agendar com antecedência mínima de","dias","num"],["reagendarAntecedenciaDias","Reagendar com antecedência mínima de","dias","num"],
          ["trocaModalidadeDias","Trocar de modalidade avisando com","dias de antecedência","num"]].map(function(c){
          var val = R.gerais[c[0]];
          return e(Campo,{key:c[0], rotulo:c[1]}, e("div",{className:"w-32"},
            c[3]==="din" ? e(Din,{value:val, label:c[1], onChange:function(v){ setG(c[0],v); }})
              : c[3]==="pct" ? e(Pct,{value:val, step:"0.5", label:c[1], onChange:function(v){ setG(c[0],v); }})
              : e("input",{type:"number", value:val, "aria-label":c[1], className:INPUT+" "+CELULA, onChange:function(ev){ setG(c[0], parseInt(ev.target.value,10)||0); }})),
            c[2] && e("span",{className:"text-muted-foreground"}, c[2])); }))),
    e("div",{className:"grid grid-cols-1 gap-4 2xl:grid-cols-2"},
      e(BlocoBarra,{t:"Régua de comissão e brinde"+(ehPrata ? " · Kit 100% Prata" : ""), sub:"venda líquida · o teto de cada faixa inclui o centavo"},
        e("div",{className:"p-3"},
          e(Tabela,{cols:[{t:"Faixa", esq:true, w:"34%"}, {t:"A partir de", w:"22%"}, {t:"Comissão", w:"14%"}, {t:"Normal", w:"14%"}, {t:"Select", w:"14%"}, {t:"", w:"2.5rem"}]},
            R.faixas.map(function(f,i){ return e("tr",{key:i, className:"border-b border-border/50 last:border-0"},
              e(Td,{esq:true}, e("span",{className:MONO+" text-[12.5px] text-muted-foreground"}, rotuloFaixa(f.min))),
              e(Td,null, e(Din,{value:f.min, label:"Faixa a partir de", onChange:function(v){ set("faixas",i,"min",v); }})),
              e(Td,null, e(Pct,{value:f.pct, label:"Comissão", onChange:function(v){ set("faixas",i,"pct",v); }})),
              e(Td,null, e(Din,{value:f.bn, label:"Brinde normal", onChange:function(v){ set("faixas",i,"bn",v); }})),
              e(Td,null, e(Din,{value:f.bb, label:"Brinde select", onChange:function(v){ set("faixas",i,"bb",v); }})),
              e(Td,null, e(X,{label:"Remover faixa", onClick:function(){ del("faixas",i); }}))); })),
          e(Rodape,null,
            e(Btn,{v:"ghost", sm:true, onClick:function(){ add("faixas",{min:0,pct:0,bn:0,bb:0}); }}, "+ Adicionar faixa"),
            e(Campo,{rotulo:"Abaixo de"}, e("div",{className:"w-36"}, e(Din,{value:R.gerais.minRenovar, label:"Mínimo para ter faixa", onChange:function(v){ setG("minRenovar",v); }})), e("span",{className:"text-muted-foreground"},"não existe faixa (comissão zero)"))))),
      e("div",{className:"flex flex-col gap-4"},
        e(BlocoBarra,{cor:"azul", t:"Taxa de deslocamento", sub:"fixa, em venda líquida abaixo do limite · soma no que a revendedora paga"},
          e("div",{className:"p-3"},
            e(Tabela,{cols:[{t:"Venda líquida", esq:true, w:"46%"}, {t:"A partir de", w:"26%"}, {t:"Taxa", w:"20%"}, {t:"", w:"2.5rem"}]},
              R.taxaBaixa.map(function(t,i){ return e("tr",{key:i, className:"border-b border-border/50 last:border-0"},
                e(Td,{esq:true}, e("span",{className:MONO+" text-[12.5px] text-muted-foreground"}, rotuloTaxa(t.min))),
                e(Td,null, e(Din,{value:t.min, label:"Taxa a partir de", onChange:function(v){ set("taxaBaixa",i,"min",v); }})),
                e(Td,null, e(Din,{value:t.taxa, label:"Taxa", onChange:function(v){ set("taxaBaixa",i,"taxa",v); }})),
                e(Td,null, e(X,{label:"Remover", onClick:function(){ del("taxaBaixa",i); }}))); })),
            e(Rodape,null,
              e(Btn,{v:"ghost", sm:true, onClick:function(){ add("taxaBaixa",{min:0,taxa:0}); }}, "+ Adicionar linha"),
              e(Campo,{rotulo:"Vale abaixo de"}, e("div",{className:"w-36"}, e(Din,{value:R.gerais.taxaAbaixoDe, label:"Taxa vale abaixo de", onChange:function(v){ setG("taxaAbaixoDe",v); }})))))),
        e(BlocoBarra,{cor:"roxo", t:"Remarcação", sub:"desconto na comissão (pontos %) e no brinde (%, proporcional em Normal e Select) · a última linha vale dali em diante"},
          e("div",{className:"p-3"},
            e(Tabela,{cols:[{t:"Vez", esq:true, w:"36%"}, {t:"Comissão −", w:"26%"}, {t:"Brinde −", w:"26%"}, {t:"", w:"2.5rem"}]},
              R.remarcacao.map(function(r,i){ return e("tr",{key:i, className:"border-b border-border/50 last:border-0"},
                e(Td,{esq:true}, e("b",null,(i+1)+"ª remarcação"), i===R.remarcacao.length-1 && e("span",{className:"text-muted-foreground"}," em diante")),
                e(Td,null, e(Pct,{value:r.comissaoPct, label:"Comissão", onChange:function(v){ set("remarcacao",i,"comissaoPct",v); }})),
                e(Td,null, e(Pct,{value:r.brindePct, label:"Brinde", onChange:function(v){ set("remarcacao",i,"brindePct",v); }})),
                e(Td,null, e(X,{label:"Remover", onClick:function(){ del("remarcacao",i); }}))); })),
            e(Rodape,null, e(Btn,{v:"ghost", sm:true, onClick:function(){ add("remarcacao",{comissaoPct:0,brindePct:0}); }}, "+ Adicionar vez")))),
        e(BlocoBarra,{t:"Pagamento e brindes", sub:"quanto do acerto ficou em aberto → quanto do brinde ela recebe · acima da última linha, sem brinde"},
          e("div",{className:"p-3"},
            e(Tabela,{cols:[{t:"Faltou até", esq:true, w:"42%"}, {t:"Recebe do brinde", w:"36%"}, {t:"", w:"2.5rem"}]},
              R.pagamentoBrinde.map(function(t,i){ return e("tr",{key:i, className:"border-b border-border/50 last:border-0"},
                e(Td,{esq:true}, e(Pct,{value:t.max, step:"0.5", label:"Faltou até", onChange:function(v){ set("pagamentoBrinde",i,"max",v); }})),
                e(Td,null, e(Pct,{value:Math.round(t.fator*100), label:"Recebe do brinde", onChange:function(v){ set("pagamentoBrinde",i,"fator",v/100); }})),
                e(Td,null, e(X,{label:"Remover", onClick:function(){ del("pagamentoBrinde",i); }}))); })),
            e(Rodape,null,
              e(Btn,{v:"ghost", sm:true, onClick:function(){ add("pagamentoBrinde",{max:0,fator:1}); }}, "+ Adicionar linha"),
              e(Campo,{rotulo:"Kit novo liberado com"}, e("div",{className:"w-28"}, e(Pct,{value:R.gerais.kitNovoMinPct, label:"Kit novo a partir de", onChange:function(v){ setG("kitNovoMinPct",v); }})), e("span",{className:"text-muted-foreground"},"do acerto pago"))))))),
    e(BlocoBarra,{t:"Histórico de versões", sub:"a vigente é a de cima"},
      e("div",{className:"flex flex-col divide-y divide-border p-2"}, versoes.map(function(v,i){
        return e("div",{key:v.id, className:"flex items-center justify-between gap-2 px-2 py-2 text-[13px]"},
          e("span",null, "Desde ", e("b",null, v.vigenciaDesde.split("-").reverse().join("/")), " · ", v.faixas.length, " faixas"),
          e("span",{className:"rounded-md px-2 py-0.5 text-[11.5px] font-semibold "+(i===0?"bg-success/20 text-success":"bg-muted text-muted-foreground")}, i===0?"vigente":"anterior")); }))));
}

export { EditorRegrasConsignado, Din, Pct, Th, Td, X, Tabela, Rodape, Campo };

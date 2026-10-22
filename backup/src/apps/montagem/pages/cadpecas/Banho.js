// Sorelly Admin · montagem — pages/cadpecas/Banho.js
// Cadastro de peças → "Tabela do banho": preço do banho de ouro (R$ por grama) de cada milésimo na Ellos e na Pontual, com a cotação do ouro da Ellos
// e o comparativo (quem é mais barata). Valores reais só em domain/cadastro-pecas.local.js. Quem edita: quem lança as faturas de banho (e a diretoria).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Faixa, Indicador, Pagina, Tab, Td } from "@/apps/montagem/components/padrao";
import { brl, podeFazer } from "@/apps/montagem/domain/cadastro-pecas";
import { Bt, Cel, NEUTRO, useCpc } from "@/apps/montagem/pages/cadpecas/visualCad";
import { e, useState } from "@/shared/react";

function dia(iso){ var p = String(iso||"").split("-"); return p.length===3 ? p[2]+"/"+p[1]+"/"+p[0] : "—"; }
var rg = function(n){ return n==null ? "—" : "R$ "+n.toFixed(2).replace(".", ",")+"/g"; };

function AbaBanho(){
  var x = useCpc(), c = x.c, bc = c.config.banhoComp, pode = podeFazer(c, "faturas_banho", x.por, x.admin), nm = useState("");
  var mils = Object.keys(bc.ellos).concat(Object.keys(bc.pontual)).map(Number).filter(function(v, i, a){ return a.indexOf(v)===i; }).sort(function(a, b){ return a-b; });
  var linhas = mils.map(function(m){ var el = bc.ellos[m], po = bc.pontual[m], dif = el!=null && po!=null ? po-el : null; return {m:m, el:el, po:po, dif:dif}; });
  var comp = linhas.filter(function(l){ return l.dif!=null; }), ellosMais = comp.filter(function(l){ return l.dif>0.004; }).length, mediaDif = comp.length ? comp.reduce(function(s, l){ return s + l.dif; }, 0)/comp.length : 0;
  var melhor = comp.reduce(function(b, l){ return !b || l.dif>b.dif ? l : b; }, null);
  var set = function(g, m){ return function(v){ x.exec("comp_set", {galv:g, mil:m, valor:v}); }; };
  return e(Pagina,null,
    e("div",{className:"flex flex-wrap items-center justify-center gap-2 rounded-xl bg-black/25 px-3 py-2 ring-1 ring-white/10"},
      e("label",{className:"flex items-center gap-1.5 text-[12.5px] font-bold"}, "Cotação do ouro (Ellos) R$/g", e(Cel,{v:bc.cotacaoEllos || "", dica:"640", off:!pode, rot:"Cotação do ouro da Ellos em R$ por grama", w:"w-20", onSet:function(v){ x.exec("comp_cotacao", {valor:v}); }})),
      pode && e(Bt,{ic:"arrows-clockwise", titulo:"Recalcula os preços da Ellos: cada milésimo a mais custa a cotação ÷ 1.000, a partir do milésimo 1", onClick:function(){ if(window.confirm("Recalcular os preços da Ellos pela cotação, a partir do milésimo 1?")) x.exec("comp_recalc", {}); }}, "Recalcular a Ellos"),
      e("span",{className:"text-[12px] text-white/70"}, "Atualizado em "+dia(bc.atualizado)),
      !pode && e("span",{className:"text-[12px] font-bold text-white/70"}, "Somente quem lança as faturas edita")),
    e(Faixa,{n:3},
      e(Indicador,{t:"Ellos mais barata em", v:comp.length ? ellosMais+" de "+comp.length : "—", cor:NEUTRO, sub:"milésimos comparados"}),
      e(Indicador,{t:"Diferença média (Pontual − Ellos)", v:rg(mediaDif), cor:NEUTRO}),
      e(Indicador,{t:"Maior vantagem da Ellos", v:melhor ? rg(melhor.dif) : "—", cor:NEUTRO, sub:melhor ? "no milésimo "+melhor.m : undefined})),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Banho de ouro, preço por milésimo (R$/g)", dir:mils.length+" milésimos"},
      linhas.length ? e(Tab,{cols:["Milésimo", "Ellos", "Pontual", "Diferença", "Mais barata"], className:"text-[12px]"},
        linhas.map(function(l){ var elMelhor = l.dif!=null && l.dif>0.004, poMelhor = l.dif!=null && l.dif<-0.004;
          return e("tr",{key:l.m, className:"border-t border-white/5 hover:bg-white/5"}, e(Td,{forte:true}, "Ouro "+l.m),
            e(Td,{className:"px-1! py-0.5!", cor:elMelhor ? "ok" : undefined, forte:elMelhor}, e(Cel,{v:l.el!=null ? l.el : "", dica:"—", off:!pode, rot:"Preço da Ellos, milésimo "+l.m, w:"w-20", onSet:set("ellos", l.m)})),
            e(Td,{className:"px-1! py-0.5!", cor:poMelhor ? "ok" : undefined, forte:poMelhor}, e(Cel,{v:l.po!=null ? l.po : "", dica:"—", off:!pode, rot:"Preço da Pontual, milésimo "+l.m, w:"w-20", onSet:set("pontual", l.m)})),
            e(Td,{dinheiro:true}, l.dif==null ? "—" : (l.dif>0 ? "+" : "")+l.dif.toFixed(2).replace(".", ",")),
            e(Td,{forte:true, cor:l.dif==null ? undefined : "ok"}, l.dif==null ? (l.el!=null ? "só a Ellos" : "só a Pontual") : elMelhor ? "Ellos" : poMelhor ? "Pontual" : "Igual")); })) :
      e("p",{className:"text-center text-[13px] text-white/70"}, "Nenhum preço lançado ainda."),
      pode && e("div",{className:"mt-2 flex flex-wrap items-center justify-center gap-1.5"},
        e("input",{value:nm[0], onChange:function(ev){ nm[1](ev.target.value); }, placeholder:"Novo milésimo (ex.: 10)", inputMode:"numeric", "aria-label":"Novo milésimo", className:"h-8 w-40 rounded-md bg-black/30 px-2 text-center text-[12px] ring-1 ring-white/15 outline-none"}),
        e(Bt,{ic:"plus", onClick:function(){ var m = Math.round(parseFloat(nm[0])); if(m>=1 && m<=40 && mils.indexOf(m)<0){ x.exec("comp_set", {galv:"ellos", mil:m, valor:bc.ellos[1] ? bc.ellos[1] + (m-1)*(bc.cotacaoEllos||0)/1000 : ""}); nm[1](""); } }}, "Adicionar milésimo"))),
    e("p",{className:"text-center text-[12px] text-white/70"}, "A Ellos cobra o milésimo 1 mais a cotação do ouro ÷ 1.000 por milésimo a mais (R$ 640/g = +R$ 0,64). O valor da Ellos adicionado já vem calculado: confira com a tabela dela."),
    (bc.pendencias||[]).length>0 && e(BlocoBarra,{cor:"azul", compacto:true, t:"Pendências com as galvânicas", dir:bc.pendencias.length},
      e("ul",{className:"flex flex-col gap-1 text-[13px]"}, bc.pendencias.map(function(t, i){ return e("li",{key:i, className:"text-center"}, t); }))));
}
export { AbaBanho };

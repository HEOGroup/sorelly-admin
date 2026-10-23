// Sorelly Admin · montagem — pages/producao/ProdPremiacao.js
// Produção → aba "Premiação" (só diretoria): ranking do mês com medalha, progresso até a faixa mais alta, faixa atingida, peças que faltam e valor do bônus (editável).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Dinheiro, Faixa, Janela, Pagina, Tab, Td } from "@/apps/montagem/components/padrao";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { formatarInteiro, formatarReais, hojeSP, premiacaoDoMes } from "@/apps/montagem/domain/producao";
import { Aviso, Bt, COR, Ic, IndT, usePr } from "@/apps/montagem/pages/producao/visualProd";
import { Data, Painel, Selo, Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var MEDALHA = ["#FBBF24", "#CBD5E1", "#D6925A"];
var COR_FAIXA = ["#FBBF24", "#22D3EE", "#4ADE80"];   // 1ª faixa, 2ª faixa, a partir da 3ª
var faixaTxt = function(f){ return formatarInteiro(f.min)+(f.max==null ? "+" : "–"+formatarInteiro(f.max)); };

function AbaProdPremiacao(){
  var x = usePr();
  var sMes = useState(hojeSP().slice(0, 7)), sEd = useState(null), sVal = useState(0);
  if(!x.admin) return e(Pagina,null, e(Aviso,null, "Somente a diretoria acessa."));
  var ym = sMes[0].split("-").map(Number), pm = premiacaoDoMes(x.pr, ym[0], ym[1]);
  var vazio = pm.totalPecas===0 && !pm.linhas.some(function(l){ return l.ajuste; });
  var comBonus = pm.linhas.filter(function(l){ return l.valor>0; }).length;
  var abrir = function(l){ sEd[1](l); sVal[1](l.valor); };
  var salvar = function(){ if(x.exec("ajuste_set", {func:sEd[0].nome, ano:pm.ano, mes:pm.mes, valor:sVal[0]})) sEd[1](null); };
  var limpar = function(l){ x.exec("ajuste_limpar", {func:l.nome, ano:pm.ano, mes:pm.mes}); };
  var corDe = function(l){ if(!l.faixa) return "#64748B"; var i = pm.faixas.indexOf(l.faixa); return COR_FAIXA[Math.min(2, Math.max(0, i))]; };
  var ed = sEd[0];

  return e(Pagina,null,
    e("div",{className:"flex flex-wrap items-center justify-center gap-2 rounded-xl bg-black/25 px-3 py-2 ring-1 ring-white/10"},
      e(Data,{rot:"Mês", tipo:"month", v:sMes[0], set:function(v){ if(v) sMes[1](v); }}),
      e("span",{className:"inline-flex h-9 items-center rounded-lg bg-white/5 px-3 text-[12.5px] font-bold capitalize ring-1 ring-white/10"}, pm.rotulo),
      pm.usaPadrao && e(Selo,{cor:"info", titulo:"Nenhuma faixa cadastrada: vale o padrão. Altere em Configurações."}, "Faixas padrão")),
    e(Faixa,{n:3}, e(IndT,{t:"Total de bônus", v:formatarReais(pm.totalBonus), cor:COR}), e(IndT,{t:"Peças no mês", v:formatarInteiro(pm.totalPecas), cor:"info"}), e(IndT,{t:"Com bônus", v:comBonus, cor:"ok"})),
    vazio ? e(Vazio,{ic:"trophy"}, "Nenhuma produção lançada neste mês.") :
    e(BlocoBarra,{cor:"turquesa", compacto:true, t:"Ranking do mês", dir:pm.linhas.length},
      e("div",{className:"p-2"}, e(Tab,{cols:["#", "Funcionária", "Peças", "Progresso", "Faixa", "Próxima faixa", "Bônus", "Ações"]}, pm.linhas.map(function(l){
        var cor = corDe(l), med = l.posicao<=3 && l.pecas>0;
        return e("tr",{key:l.nome, className:"border-t border-white/10 "+(l.pecas===0 && !l.ajuste ? "opacity-55" : "")},
          e(Td,{dinheiro:true, forte:true}, med ? e("span",{className:"inline-flex items-center gap-1", style:{color:MEDALHA[l.posicao-1]}, title:l.posicao+"º lugar"}, e(Ph,{n:"medal", s:18, fill:true}), l.posicao) : l.posicao),
          e(Td,{forte:true}, l.nome),
          e(Td,{dinheiro:true}, formatarInteiro(l.pecas)),
          e(Td,null, e("div",{className:"mx-auto h-2.5 w-36 overflow-hidden rounded-full bg-white/10", role:"img", "aria-label":"Progresso: "+Math.round(l.progresso*100)+"% da faixa mais alta", title:Math.round(l.progresso*100)+"% da faixa mais alta"}, e("div",{className:"h-full rounded-full transition-all", style:{width:Math.round(l.progresso*100)+"%", background:cor}}))),
          e(Td,null, l.faixa ? e(Selo,{cor:cor}, faixaTxt(l.faixa)) : "—"),
          e(Td,{className:"text-[12px]"}, l.proxima ? "Faltam "+formatarInteiro(l.proxima.faltam)+" pç para "+formatarReais(l.proxima.faixa.valor) : l.faixa ? "Faixa mais alta" : "—"),
          e(Td,{dinheiro:true, forte:true}, formatarReais(l.valor), l.ajuste && e("span",{className:"ml-1.5 align-middle"}, e(Selo,{cor:"alerta", titulo:"Ajustado por "+l.ajuste.por+(l.ajuste.em ? " em "+l.ajuste.em : "")+". Calculado: "+formatarReais(l.calculado)}, "Ajustado"))),
          e(Td,null, e("span",{className:"inline-flex gap-1"}, e(Ic,{ic:"pencil-simple", titulo:"Editar o valor do bônus", onClick:function(){ abrir(l); }}), l.ajuste && e(Ic,{ic:"arrow-counter-clockwise", titulo:"Limpar ajuste (volta ao valor calculado)", onClick:function(){ limpar(l); }}))));
      })))),
    ed && e(Janela,{t:"Valor do bônus", sub:ed.nome+" · "+pm.rotulo, fechar:function(){ sEd[1](null); }, colunas:[
      e(Painel,{key:"d", t:"Apuração", ic:"chart-bar"}, e("div",{className:"flex flex-col gap-1 text-[13px]"}, e("span",null, "Peças no mês: ", e("b",{className:MONO}, formatarInteiro(ed.pecas))), e("span",null, "Valor calculado: ", e("b",{className:MONO}, formatarReais(ed.calculado))), ed.faixa && e("span",null, "Faixa: ", e("b",null, faixaTxt(ed.faixa))))),
      e(Painel,{key:"v", t:"Valor final", ic:"pencil-simple"}, e(Dinheiro,{value:sVal[0] || 0, label:"Valor do bônus", onChange:function(v){ sVal[1](v || 0); }})),
      e(Painel,{key:"a", t:"Ações", ic:"gear"}, e(Bt,{tipo:"forte", ic:"floppy-disk", onClick:salvar}, "Salvar valor"), ed.ajuste && e(Bt,{ic:"arrow-counter-clockwise", onClick:function(){ limpar(ed); sEd[1](null); }}, "Voltar ao calculado"), e(Bt,{ic:"x", onClick:function(){ sEd[1](null); }}, "Cancelar"))]}));
}
export { AbaProdPremiacao };

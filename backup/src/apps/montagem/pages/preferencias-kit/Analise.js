// Sorelly Admin · montagem — pages/preferencias-kit/Analise.js
// Aba "Análise": soma das respostas por categoria (mosaico), resumo ouro/prata, ranking das opções mais pedidas, fontes e sincronia da configuração.
import { BarraFiltros, Faixa, Indicador, Mosaico, Pagina } from "@/apps/montagem/components/padrao";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { AVISO_CONFIANCA, FONTES, ROTULO_FONTE, ROTULO_SITUACAO, formatarDataHora, pkAnalise, pkRegioes } from "@/apps/montagem/domain/preferencias-kit";
import { Aviso, BarraMetal, BarraPct, Data, MCOR, OURO, Busca, Selo, Sel, Vazio, pct1, usePk } from "@/apps/montagem/pages/preferencias-kit/visual";
import { e, useState } from "@/shared/react";

var F0 = {busca:"", estado:"", cidade:"", situacao:"", fonte:"", desde:"", ate:""};
var LIMITE = 8;
var num1 = function(v){ return String(Math.round((v||0)*10)/10).replace(".", ","); };

// uma opção: nome, barra de porcentagem e, quando há metal, a quebra ouro/prata
function Opcao(p){
  var o = p.o, ouro = (o.metais||[]).find(function(m){ return m.value==="Ouro"; }), prata = (o.metais||[]).find(function(m){ return m.value==="Prata"; }), amb = (o.metais||[]).find(function(m){ return m.value==="Ouro + Prata"; });
  return e("div",{className:"flex flex-col gap-0.5 text-left"},
    e("div",{className:"flex items-baseline justify-between gap-2 text-[12.5px]"}, e("span",{className:"min-w-0 truncate font-bold"}, o.value), e("span",{className:"shrink-0 font-mono text-[12px] text-white/85"}, o.total+" · "+pct1(o.pct))),
    e(BarraPct,{pct:o.pct, rot:o.value+": "+pct1(o.pct)}),
    o.metais && e("div",{className:"flex flex-wrap justify-between gap-x-2 text-[10.5px] font-bold"},
      ouro && e("span",{style:{color:MCOR["Ouro"]}}, "Ouro "+pct1(ouro.pct)), prata && e("span",{style:{color:MCOR["Prata"]}}, "Prata "+pct1(prata.pct)), amb && e("span",{style:{color:MCOR["Ouro + Prata"]}}, "Ambos "+pct1(amb.pct))),
    o.naoVende>0 && e("span",{className:"text-[10.5px] text-white/55"}, o.naoVende+(o.naoVende===1 ? " não vende" : " não vendem")));
}
function Campo(p){
  var st = useState(false), tudo = st[0], cp = p.cp, ops = cp.opcoes, vis = tudo ? ops : ops.slice(0, LIMITE);
  return e("div",{className:"flex flex-col gap-1.5"},
    e("div",{className:"text-[11px] font-bold uppercase tracking-wide text-[#F3D98B]"}, cp.label),
    vis.map(function(o){ return e(Opcao,{key:o.value, o:o}); }),
    ops.length>LIMITE && e("button",{type:"button", onClick:function(){ st[1](!tudo); }, className:"mx-auto rounded-lg bg-white/10 px-3 py-1 text-[11.5px] font-bold hover:bg-white/20"}, tudo ? "Ver menos" : "Ver todas ("+ops.length+")"));
}
function CartaoCategoria(p){
  var c = p.c;
  return e(BlocoBarra,{cor:"ouro", t:c.title, compacto:true},
    e("div",{className:"flex flex-col gap-2 p-2.5"},
      e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"}, e(Selo,{cor:"#E8B84B"}, c.total+(c.total===1 ? " resposta" : " respostas")), e(Selo,{cor:"#60A5FA"}, pct1(c.pctRespondida)+" responderam"), !c.enabled && e(Selo,{cor:"#94A3B8"}, "Bloco inativo")),
      c.campos.map(function(cp){ return cp.opcoes[0] && cp.opcoes[0].total>0 ? e("div",{key:"top"+cp.key, className:"rounded-lg bg-[#E8B84B]/15 px-2.5 py-1.5 text-center text-[12.5px]"}, "Mais pedido"+(c.campos.length>1 ? " em "+cp.label.toLowerCase() : "")+": ", e("b",null, cp.opcoes[0].value), " ("+pct1(cp.opcoes[0].pct)+" de quem respondeu este bloco)") : null; }),
      c.resumoGeral && e(BarraMetal,{ouro:c.resumoGeral.ouro, prata:c.resumoGeral.prata}),
      c.campos.length===0 && e("p",{className:"text-center text-[12px] text-white/55"}, c.type==="observacoes" ? "Campo livre: sem opções para somar." : "Sem opções cadastradas."),
      c.campos.map(function(cp){ return e(Campo,{key:cp.key, cp:cp}); })));
}

function AbaPkAnalise(){
  var ctx = usePk(), s = ctx.s;
  var sf = useState(F0), f = sf[0];
  var an = pkAnalise(s, f), reg = pkRegioes(s);
  var set = function(k){ return function(v){ var c = Object.assign({}, f); c[k] = v; sf[1](c); }; };
  var ativo = !!(f.busca || f.estado || f.cidade || f.situacao || f.fonte || f.desde || f.ate);
  var vazio = an.totalRevendedoras===0 && !ativo;
  return e(Pagina,null,
    e(Aviso,null, AVISO_CONFIANCA),
    e(BarraFiltros,{ativo:ativo, onLimpar:function(){ sf[1](F0); }},
      e(Busca,{v:f.busca, set:set("busca"), ph:"Buscar por nome, telefone ou cidade"}),
      e(Sel,{v:f.estado, set:set("estado"), rot:"Estado", opcoes:reg.estados.map(function(x){ return [x, x]; })}),
      e(Sel,{v:f.cidade, set:set("cidade"), rot:"Cidade", opcoes:reg.cidades.map(function(x){ return [x, x]; })}),
      e(Sel,{v:f.situacao, set:set("situacao"), rot:"Situação", opcoes:[["sem", ROTULO_SITUACAO.sem], ["pendente", ROTULO_SITUACAO.pendente], ["montado", ROTULO_SITUACAO.montado]]}),
      e(Sel,{v:f.fonte, set:set("fonte"), rot:"Fonte", opcoes:FONTES.map(function(x){ return [x, ROTULO_FONTE[x]]; })}),
      e(Data,{rot:"De", v:f.desde, set:set("desde")}), e(Data,{rot:"Até", v:f.ate, set:set("ate")})),
    e(Faixa,{n:4},
      e(Indicador,{t:"Revendedoras", v:an.totalRevendedoras, cor:"total"}),
      e(Indicador,{t:"Com preferências", v:an.totalComPreferencias, cor:"ok", sub:"Taxa de preenchimento "+pct1(an.taxaPreenchimento)}),
      e(Indicador,{t:"Sem preferências", v:an.totalSemPreferencias, cor:"neutro"}),
      e(Indicador,{t:"Média de categorias", v:num1(an.mediaCategoriasPorRevendedora), cor:"info", sub:"Por revendedora"})),
    vazio
      ? e(Vazio,{ic:"chart-bar"}, "Sem dados para analisar. Cadastre revendedoras ou importe uma tabela.")
      : e(Mosaico,{min:"21rem"}, [
          e(BlocoBarra,{key:"geral", cor:"ouro", t:"Resumo geral ouro e prata", compacto:true}, e("div",{className:"flex flex-col items-center gap-1.5 p-2.5"},
            an.resumoGeral ? e(BarraMetal,{ouro:an.resumoGeral.ouro, prata:an.resumoGeral.prata}) : e("p",{className:"text-[12.5px] text-white/60"}, "Nenhuma resposta com proporção de ouro e prata."),
            e("span",{className:"text-[11px] text-white/55"}, "Média das categorias respondidas pelas revendedoras."))),
          ].concat(an.categorias.filter(function(c){ return c.enabled!==false || c.total>0; }).map(function(c){ return e(CartaoCategoria,{key:c.key, c:c}); }), [
          e(BlocoBarra,{key:"fontes", cor:"ouro", t:"Fontes e configuração", compacto:true}, e("div",{className:"flex flex-col items-center gap-2 p-2.5"},
            e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"}, FONTES.map(function(fo){ return e(Selo,{key:fo, cor:"#60A5FA"}, ROTULO_FONTE[fo]+": "+an.fontes[fo]); })),
            an.ultimaAtualizacao && e("span",{className:"text-[11.5px] text-white/65"}, "Última atualização em "+formatarDataHora(an.ultimaAtualizacao)),
            an.configSync ? e(Selo,{cor:"#4ADE80", ic:"check-circle"}, "Configuração em sincronia com o app") : e(Selo,{cor:"#FBBF24", ic:"warning"}, "Configuração fora de sincronia"),
            an.orfas.length>0 && e("div",{className:"flex flex-col gap-0.5 text-[11.5px] text-white/70"}, an.orfas.map(function(o){ return e("span",{key:o.key}, "Bloco \""+o.key+"\" sem estrutura: "+o.revendedoras+(o.revendedoras===1 ? " revendedora" : " revendedoras")); }))))])));
}

export { AbaPkAnalise };

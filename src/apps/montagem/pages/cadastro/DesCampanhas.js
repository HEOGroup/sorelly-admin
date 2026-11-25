// Sorelly Admin · montagem — pages/cadastro/DesCampanhas.js
// Desempenho do cadastro › Campanhas (tráfego): Meta Ads AO VIVO desde 25/11/2026 (antes era digitado à mão), como no admin antigo: faixa de totais,
// tabela de campanhas (clique abre os anúncios) e os funis de Facebook Ads (leads com a tag FACEBOOK ADS, da Kommo, com o gasto diluído) e geral.
import { Bloco, Botao, CAMPO, FaixaTotais, Rotulo, Segmentado, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { FiltrosDesempenho, mesBr, nInt, nPct, paramsDe, textoPeriodo } from "@/apps/montagem/pages/cadastro/des-comum";
import { FunilTabela } from "@/apps/montagem/pages/cadastro/DesFunil";
import { anunciosDa, campanhas, funilDesempenho, janela } from "@/apps/montagem/domain/cadastro-leads";
import { qsPeriodo, useRelatorio } from "@/apps/montagem/lib/cadastro-real";
import { AvisoLigacao } from "@/apps/montagem/pages/cadastro/des-comum";
import { BKC } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

// colunas: campanha (ou anúncio), conta da Meta (só nas campanhas), gasto, impressões, cliques, CPC e CTR
var COLS_CAMP = function(rot, comMes){ return [{t:rot, w:260, c:1}].concat(comMes ? [{t:"Conta", w:150, c:1}] : []).concat([{t:"Gasto", w:120, c:1}, {t:"Impressões", w:110, c:1}, {t:"Cliques", w:90, c:1}, {t:"CPC", w:100, c:1}, {t:"CTR", w:80, c:1}]); };

function TabelaMeta(p){
  return e(TabelaP,{cols:COLS_CAMP(p.rotulo, p.comMes), minW:p.comMes ? 960 : 880},
    p.linhas.length ? p.linhas.map(function(l){
      return e(Tr,{key:l.id, onClick:p.abrir ? function(){ p.abrir(l.id); } : undefined, title:p.abrir ? "Ver os anúncios desta campanha" : undefined},
        e(Td,{c:true, forte:true}, l.nome), p.comMes && e(Td,{c:true}, l.conta || "—"), e(Td,{c:true}, BKC(l.gasto)), e(Td,{c:true}, nInt(l.impressoes)), e(Td,{c:true}, nInt(l.cliques)), e(Td,{c:true}, BKC(l.cpc)), e(Td,{c:true}, nPct(l.ctr)));
    }) : e(Tr,{key:"vazio"}, e(Td,{c:true}, "Nada neste período"), p.comMes && e(Td,{c:true}, "—"), e(Td,{c:true}, "—"), e(Td,{c:true}, "—"), e(Td,{c:true}, "—"), e(Td,{c:true}, "—"), e(Td,{c:true}, "—")));
}

function DesCampanhas(p){
  var ctx = use(), cl = ctx.state.cl, vs = useState("campanhas"), vista = vs[0], ds = useState(null), detalhe = ds[0];
  var par = paramsDe(p.f), qs = qsPeriodo(janela(par));
  var rc = useRelatorio("/cadastro/campanhas"+qs), rd = useRelatorio("/cadastro/desempenho"+qs), ra = useRelatorio(detalhe ? "/cadastro/campanhas/"+detalhe+qs : null);
  var cp = campanhas(cl, par, undefined, {campanhas:rc.dados ? rc.dados.campanhas : [], fb:rc.dados ? rc.dados.fb : null});
  var fu = funilDesempenho(cl, par, undefined, rd.dados ? rd.dados.todos : {estoque:{}, total:0}), k = cp.kpis, fb = cp.funil;
  var aberta = detalhe ? cp.campanhas.find(function(c){ return c.id===detalhe; }) : null, anuncios = aberta ? anunciosDa(cl, aberta.id, ra.dados ? ra.dados.anuncios : []) : [];
  var tagFb = "FACEBOOK ADS", corpo;
  if(vista==="campanhas" && aberta){
    corpo = e(Bloco,{t:"Anúncios · "+aberta.nome, dir:e(Botao,{onClick:function(){ ds[1](null); }}, "Voltar")},
      e(AvisoLigacao,{erro:ra.erro, carregando:ra.carregando && !ra.dados}),
      e(TabelaMeta,{linhas:anuncios, rotulo:"Anúncio"}));
  } else if(vista==="campanhas"){
    corpo = e(Bloco,{t:"Campanhas · "+textoPeriodo(cp.periodo)},
      e(TabelaMeta,{linhas:cp.campanhas, rotulo:"Campanha", comMes:true, abrir:ds[1]}));
  } else if(vista==="facebook"){
    corpo = e(Bloco,{t:"Funil de Facebook Ads · leads com a tag "+tagFb, dir:e("span",{className:"text-[13px]"}, fb.insight || "")},
      rc.dados && rc.dados.erroKommo && e(AvisoLigacao,{erro:"Funil da Kommo: "+rc.dados.erroKommo}),
      e(FunilTabela,{stages:fb.stages, exits:fb.exits, comCusto:true}));
  } else {
    corpo = e(Bloco,{t:"Funil geral · todos os contatos do período", dir:e("span",{className:"text-[13px]"}, fu.insight || "")}, e(AvisoLigacao,{erro:rd.erro, carregando:rd.carregando && !rd.dados}), e(FunilTabela,{stages:fu.stages, exits:fu.exits}));
  }
  return e("div",{className:"flex flex-col gap-3"},
    e(FiltrosDesempenho,{f:p.f, set:function(n){ ds[1](null); p.set(n); }}),
    e(AvisoLigacao,{erro:rc.erro, carregando:rc.carregando && !rc.dados}),
    e(FaixaTotais,{itens:[{t:"Gasto", v:BKC(k.gasto)}, {t:"Impressões", v:nInt(k.impressoes)}, {t:"Cliques", v:nInt(k.cliques)}, {t:"CPC", v:BKC(k.cpc)}, {t:"CTR", v:nPct(k.ctr)}, {t:"Campanhas", v:nInt(k.campanhasQtd)}]}),
    e("div",{className:"flex"}, e(Segmentado,{opcoes:[["campanhas","Campanhas"], ["facebook","Funil Facebook Ads"], ["geral","Funil geral"]], atual:vista, onMudar:function(v){ vs[1](v); ds[1](null); }})),
    corpo);
}

export { DesCampanhas };

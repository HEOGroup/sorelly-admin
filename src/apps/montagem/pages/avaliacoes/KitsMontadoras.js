// Sorelly Admin · montagem — pages/avaliacoes/KitsMontadoras.js
// Avaliações › Kits, opção A escolhida pelo Marcus em 12/11/2026 (desenho: docs/design/testes-de-layout/avaliacoes-kits-4-opcoes.local.html):
// planilha por montadora (as 3 perguntas do kit, nota, kits mal avaliados e, para quem vê valores, o efeito no bônus) e a lista dos kits mal avaliados.
// Fonte única da nota: domain/avaliacoes-kits.js (estado s.avk). O bônus e os kits montados vêm de domain/bonus-montagem.js (s.bm).
// Tabelas na peça padrão TabelaPlanilha: escura, com filtro e ordem no cabeçalho de cada coluna e a linha de total em cima (soma o que está filtrado).
import { CampoSel, brl, inteiro } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { avKits } from "@/apps/montagem/domain/avaliacoes";
import { avkMes, avkMeses, notasDoMes, totalDoMes } from "@/apps/montagem/domain/avaliacoes-kits";
import { resumoMes } from "@/apps/montagem/domain/bonus-montagem";
import { veTotais } from "@/apps/montagem/domain/equipe";
import { AbaAvKits } from "@/apps/montagem/pages/avaliacoes/KitsMontagem";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var AMARELO = "text-[#FBBF24]", VERMELHO = "text-[#EF4444]";
var MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
var nomeMes = function(m){ return MESES[+m.slice(5, 7)-1]+" de "+m.slice(0, 4); };
var dataBr = function(d){ return d ? d.slice(8, 10)+"/"+d.slice(5, 7)+"/"+d.slice(0, 4) : ""; };
// a nota vai para a tabela como número inteiro (nota × 100) para a ordem das colunas ficar certa; vazio = sem nota
var n100 = function(v){ return v===null || v===undefined ? "" : Math.round(v*100); };
var nota2 = function(v){ return v==="" || v===null || v===undefined ? "—" : (v/100).toFixed(2).replace(".", ","); };
var reais = function(v){ return v==="" || v===undefined ? "—" : brl(v/100); };
var qtd = function(v){ return v==="" || v===undefined ? "—" : inteiro(v); };
var texto = function(t){ return e("p",{className:"text-center text-[13px] text-foreground"}, t); };
var titulo = function(t){ return e("div",{className:"pt-1 text-center text-[13px] font-bold text-foreground"}, t); };

function AbaAvKitsMontadora(){
  var s = use().state, avk = s.avk, cfg = s.cfg || {}, atencao = (cfg.alertaAmarelo || 4)*100, risco = (cfg.alertaVermelho || 3)*100;
  var meses = avkMeses(avk), st = useState(""), soma = function(k){ return totalDoMes((avkMes(avk, k) || {}).porMontadora).aval; };
  var mes = meses.indexOf(st[0])>=0 ? st[0] : meses.slice().sort(function(a, b){ return soma(b)-soma(a); })[0];   // abre no mês com mais avaliações (o mês corrente ainda tem poucas)
  var antiga = avKits(s).total>0 ? e(AbaAvKits,null) : null;   // blocos antigos (média geral, distribuição, evolução): só aparecem quando houver avaliações lançadas uma a uma
  if(!meses.length) return e("div",{className:"flex flex-col gap-2.5"}, texto("Nenhuma avaliação de kit carregada. As avaliações das revendedoras chegam pelo aplicativo."), antiga);
  var m = avkMes(avk, mes), porNome = {}; (m.porMontadora || []).forEach(function(x){ porNome[x.nome] = x; });
  // bônus e kits montados: só para quem vê valores e só se o mês tiver kits lançados no Bônus da montagem
  var bonus = veTotais(s.usuario) && s.bm ? resumoMes(s.bm, mes, notasDoMes(avk, mes)) : null, comBonus = !!(bonus && bonus.linhas.length), porBonus = {};
  var nomes = Object.keys(porNome);
  if(comBonus) bonus.linhas.forEach(function(b){ porBonus[b.c] = b; if(!porNome[b.c] && b.n+b.e>0) nomes.push(b.c); });
  var linhas = nomes.map(function(nome){ var x = porNome[nome] || {aval:0}, b = porBonus[nome], tem = x.aval>0;
    return {nome:nome, kits:b ? b.n+b.e : "", aval:x.aval, certo:tem ? n100(x.certo) : "", capricho:tem ? n100(x.capricho) : "", combinou:tem ? n100(x.combinou) : "", nota:tem ? n100(x.nota) : "",
      b35:tem ? x.b35 : "", b25:tem ? x.b25 : "", bonus:b ? Math.round(b.bruto*100) : "", fator:b ? Math.round(b.fator*100) : "", pagar:b ? Math.round(b.pagar*100) : ""}; })
    .sort(function(a, b){ return b.aval-a.aval || a.nome.localeCompare(b.nome); });
  var corNota = function(k){ return function(l){ var v = l[k]; return v==="" ? "" : v<risco ? VERMELHO : v<atencao ? AMARELO : ""; }; };
  var colNota = function(k, t){ return {k:k, t:t, fmt:nota2, render:function(v){ return nota2(v); }, cor:corNota(k)}; };
  var colQtd = function(k, t, cor){ return {k:k, t:t, fmt:qtd, render:function(v){ return qtd(v); }, cor:cor ? function(l){ return l[k] ? cor : ""; } : undefined}; };
  var colReais = function(k, t){ return {k:k, t:t, fmt:reais, render:function(v){ return reais(v); }}; };
  var cols = [{k:"nome", t:"Montadora"}].concat(comBonus ? [colQtd("kits", "Kits montados")] : [],
    [colQtd("aval", "Avaliações"), colNota("certo", "Veio certo"), colNota("capricho", "Capricho"), colNota("combinou", "Combinou"),
      {k:"nota", t:"Nota do kit", fmt:nota2, render:function(v){ return v==="" ? "Sem nota" : nota2(v); }, cor:corNota("nota")}, colQtd("b35", "Abaixo de 3,5", AMARELO), colQtd("b25", "Abaixo de 2,5", VERMELHO)],
    comBonus ? [colReais("bonus", "Bônus"), {k:"fator", t:"Pela nota", fmt:function(v){ return v+"%"; }, render:function(v){ return v==="" ? "—" : v+"%"; }, cor:function(l){ return l.fator==="" || l.fator===100 ? "" : l.fator===0 ? VERMELHO : AMARELO; }}, colReais("pagar", "Bônus a pagar")] : []);
  // linha de total: soma só as linhas que estão na tabela (com o filtro), com a média de cada pergunta pesada pelas avaliações
  var totalLinha = function(ls){
    var t = totalDoMes(ls.map(function(l){ return l.aval ? {aval:l.aval, certo:l.certo/100, capricho:l.capricho/100, combinou:l.combinou/100, nota:l.nota/100, n5:0, b35:l.b35, b25:l.b25} : null; }));
    var som = function(k){ return ls.reduce(function(tt, l){ return tt+(l[k]==="" ? 0 : l[k]); }, 0); };
    return ["Total"].concat(comBonus ? [inteiro(som("kits"))] : [], [inteiro(t.aval), nota2(n100(t.certo)), nota2(n100(t.capricho)), nota2(n100(t.combinou)), nota2(n100(t.nota)), inteiro(t.b35), inteiro(t.b25)], comBonus ? [brl(som("bonus")/100), "", brl(som("pagar")/100)] : []);
  };
  var baixas = (m.baixas || []).map(function(a, i){ return {id:i, dia:a.dia, rev:a.rev, rep:a.rep, mont:a.mont, certo:a.certo*100, capricho:a.capricho*100, combinou:a.combinou*100, nota:n100(a.nota)}; })
    .sort(function(a, b){ return a.nota-b.nota || (a.dia<b.dia ? 1 : -1); });
  var estrela = function(k, t){ return {k:k, t:t, fmt:function(v){ return String(v/100); }, cor:corNota(k)}; };
  var g = avk.geral;
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"flex justify-end"}, e(CampoSel,{t:"Mês do kit", id:"avk-mes", cls:"w-52", value:mes, onChange:st[1], opcoes:meses.map(function(k){ return [k, nomeMes(k)]; })})),
    e(TabelaPlanilha,{key:"m"+mes, grade:true, semContagem:true, chave:"nome", linhas:linhas, cols:cols, totalLinha:totalLinha}),
    texto("Veio certo = \"Veio tudo certo, sem defeito?\" · Capricho = \"Capricho na organização e embalagem?\" · Combinou = \"Combinou com o que você pediu?\""),
    titulo("Kits mal avaliados (nota abaixo de 3,5)"),
    e(TabelaPlanilha,{key:"b"+mes, grade:true, semContagem:true, chave:"id", linhas:baixas, vazio:"Nenhum kit com nota abaixo de 3,5 em "+nomeMes(mes)+".",
      cols:[{k:"dia", t:"Data", fmt:dataBr}, {k:"rev", t:"Revendedora"}, {k:"rep", t:"Representante"}, {k:"mont", t:"Montadora"}, estrela("certo", "Veio certo"), estrela("capricho", "Capricho"), estrela("combinou", "Combinou"), {k:"nota", t:"Nota do kit", fmt:nota2, cor:corNota("nota")}]}),
    g && texto("Desde "+dataBr(g.desde)+" chegaram "+inteiro(g.total)+" avaliações. "+inteiro(g.total-g.semMontadora)+" ligam a um kit montado. "+inteiro(g.semMontadora)+" não ligam, porque o kit não foi registrado no nome de quem montou. "+inteiro(g.repetidas)+" repetiram a avaliação do mesmo kit e não contam."),
    texto("Conta uma avaliação por kit, a primeira. Lido do admin antigo em "+dataBr((avk.lidoEm || "").slice(0, 10))+"."),
    antiga);
}

export { AbaAvKitsMontadora };

// Sorelly Admin · montagem — pages/AgendamentoAnalises.js
// Agendamento › Análises (Marcus, 01/11/2026): UMA tela no lugar das antigas Análises e Histórico, na versão C (planilha mestra) do protótipo docs/design/agendamento-analises-4-versoes.html.
// Sem faixa de totais, sem textos de explicação, sem lista suspensa e sem cor de estado: ano e visão são botões; a tabela traz tudo (mês a mês, representantes, fechamentos).
// % realizado sobre o previsto VIGENTE (previsto do início − passadas pelo Marcus + entradas). Faturado e média vêm do faturamento lançado (último dia de cada mês).
import { Botao, Segmentado, brl, inteiro } from "@/apps/montagem/components/padrao-fin";
import { GradeFiltro } from "@/apps/montagem/components/grade-filtro";
import { agrupar, anoDe, mesAberto, nomeMes, nomeProprio, painelDe } from "@/apps/montagem/domain/agendamento";
import { fatEfetivo } from "@/apps/montagem/domain/financeiro";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var pc = function(v){ return v===null || v===undefined ? "—" : v.toLocaleString("pt-BR", {minimumFractionDigits:1, maximumFractionDigits:1})+"%"; };
var dBR = function(iso){ return iso ? new Date(iso).toLocaleDateString("pt-BR") : "—"; };

// último lançamento do faturamento no mês (recebido acumulado e acertos)
function fatDoMes(fd, ym){
  var ks = Object.keys(fd||{}).filter(function(k){ return k.slice(0, 7)===ym; }).sort(), u = ks.length ? fd[ks[ks.length-1]] : null;
  return u ? {recebido:u.recebido||0, acertos:u.acertos||0} : null;
}
// uma linha por mês do ano, sempre pelo painelDe (mês fechado usa a foto guardada no fechamento)
function linhasDoAno(ag, fd, ano){
  return Object.keys(ag.mes).filter(function(k){ return anoDe(k)===ano; }).sort().map(function(ym){
    var p = painelDe(ag, ym, undefined, fd), f = fatDoMes(fd, ym), vigente = p.previstos, pctM = vigente>0 ? p.realizado/vigente*100 : 0;
    return {ym:ym, mes:nomeMes(ym), rev:p.base, inicio:p.previstosBase, saiu:Math.max(0, p.previstosBase-p.previstos), vigente:vigente, feitos:p.realizado, pct:pctM, faixa:p.maior ? p.maior.pct+"%" : "—",
      fat:f ? f.recebido : null, media:f && f.acertos>0 ? f.recebido/f.acertos : null, vivo:p.aoVivo, por:(ag.mes[ym].fechadoPor||"")}; });
}

function AbaAgAnalises(){
  var cx = use(), s = cx.state, ag = s.agend, fd = fatEfetivo(s);
  var anos = Object.keys(ag.mes).map(anoDe).filter(function(v, i, x){ return x.indexOf(v)===i; }).sort().reverse(), an = useState(anos[0] || String(new Date().getFullYear())), ano = an[0], setAno = an[1], vs = useState("meses"), vis = vs[0], setVis = vs[1];
  var linhas = linhasDoAno(ag, fd, ano), logs = ag.log || [];
  var csv = function(){
    var cab = "Mes;Revendedoras;PrevistoInicio;Adiaram45_60;Vigente;Feitos;PctMeta;Faixa;Faturado;Media\n";
    var corpo = linhas.map(function(l){ return [l.mes+"/"+ano, l.rev, l.inicio, l.saiu, l.vigente, l.feitos, l.pct.toFixed(2), l.faixa, l.fat===null ? "" : l.fat.toFixed(2), l.media===null ? "" : l.media.toFixed(2)].join(";"); }).join("\n");
    var blob = new Blob(["﻿"+cab+corpo], {type:"text/csv;charset=utf-8;"}), url = URL.createObjectURL(blob), l = document.createElement("a"); l.href = url; l.download = "agendamento_"+ano+".csv"; l.click(); URL.revokeObjectURL(url);
  };
  // por representante: % final de cada mês fechado do ano (média, melhor, pior, último) e a situação do mês aberto
  var vivoYm = mesAberto(ag), vivo = vivoYm && anoDe(vivoYm)===ano ? agrupar(painelDe(ag, vivoYm, undefined, fd).linhas) : [], porRep = {}, viagemDe = {};
  (ag.config.representantes||[]).forEach(function(r){ viagemDe[r.codigo] = r.viagem || "Curitiba"; });
  Object.keys(ag.mes).sort().forEach(function(ym){ var m = ag.mes[ym]; if(anoDe(ym)!==ano || !m.fechadoEm || !m.snapshot) return;
    agrupar((m.snapshot.representantes||[]).map(function(r){ return {codigo:r.codigo, nome:r.nome, grupo:r.grupo, cota:r.cota, saldoAtual:r.saldoFinal, pct:r.pctFinal}; })).forEach(function(r){
      var g = porRep[r.codigo] || (porRep[r.codigo] = {codigo:r.codigo, nome:r.nome, pcts:[]}); if(r.pct!==null && r.pct!==undefined) g.pcts.push(r.pct); }); });
  vivo.forEach(function(r){ if(!porRep[r.codigo]) porRep[r.codigo] = {codigo:r.codigo, nome:r.nome, pcts:[]}; });
  var vivoDe = {}; vivo.forEach(function(r){ vivoDe[r.codigo] = r; });
  var reps = Object.keys(porRep).map(function(k){ var g = porRep[k], ps = g.pcts, v = vivoDe[k];
    return {codigo:k, nome:g.nome, viagem:viagemDe[k] || "—", meses:ps.length, media:ps.length ? ps.reduce(function(s2, x){ return s2+x; }, 0)/ps.length : null, melhor:ps.length ? Math.max.apply(null, ps) : null, pior:ps.length ? Math.min.apply(null, ps) : null, ultimo:ps.length ? ps[ps.length-1] : null,
      cota:v ? v.cota : null, feitos:v ? Math.max(0, v.cota-v.saldoAtual) : null, afazer:v ? v.saldoAtual : null, agora:v ? v.pct : null}; }).sort(function(a1, b1){ return (b1.media===null ? -1 : b1.media)-(a1.media===null ? -1 : a1.media); });
  // fechamentos: um mês por linha, quem fechou, quando e o que valeu
  var fechos = linhas.map(function(l){ var m = ag.mes[l.ym], p = painelDe(ag, l.ym, undefined, fd), reab = logs.filter(function(g){ return g.ym===l.ym && g.acao==="REABERTO"; }).length;
    return {ym:l.ym, mes:l.mes, fechado:!!m.fechadoEm, por:m.fechadoPor || "", em:m.fechadoEm, vigente:p.previstos, feitos:p.realizado, pct:l.pct, faixa:p.maior ? p.maior.pct+"%" : "Nenhuma", bonus:p.maior ? p.maior.bonus : 0, reab:reab}; });
  var maxP = Math.max.apply(null, linhas.map(function(l){ return l.pct; }).concat([100])), minP = 85;
  var barra = function(v){ return e("div",{className:"h-1.5 w-full overflow-hidden rounded bg-white/10"}, e("div",{className:"h-full rounded bg-primary", style:{width:Math.max(4, Math.min(100, (v-minP)/(maxP-minP)*100))+"%"}})); };
  var linha = function(rot, txt){ return e("p",{key:rot, className:"leading-snug"}, e("b",null, rot+" "), txt); };
  return e("div",{className:"flex flex-col gap-3"},
    e("section",{className:"flex flex-col gap-1.5 rounded-xl border border-[rgba(232,184,75,.22)] bg-[#131315] px-3 py-2.5 text-[13px] text-foreground"},
      e("b",{className:"text-[13px] text-primary"}, "As regras mudaram a partir de novembro de 2026"),
      linha("Antes:", "a meta era de 94%, 95% e 96% sobre o previsto do início do mês."),
      linha("Agora:", "a meta é de 96%, 97% e 98% sobre o previsto vigente. O bônus por funcionária é de R$ 200, R$ 300 e R$ 600."),
      linha("Por quê:", "com mais revendedoras, o Marcus adia acertos para 45 ou 60 dias. Esses acertos saem do previsto. Se continuassem na conta, o setor seria cobrado por um acerto que foi adiado de propósito."),
      linha("Previsto vigente =", "previsto do início, menos os adiaram 45/60 dias e as remarcadas, mais os que vieram de outro mês."),
      linha("Exemplo, outubro:", "previsto do início 1.976, vigente 1.886, feitos 1.843. Sobre o vigente dá 97,7%. Sobre o início daria 93,3%."),
      linha("Calendário:", "acerto de domingo ou feriado passa para o próximo dia útil. O sábado tem expediente.")),
    e("div",{className:"flex flex-wrap items-center gap-2"},
      anos.length>1 ? e(Segmentado,{opcoes:anos.map(function(x){ return [x, x]; }), atual:ano, onMudar:setAno}) : e("span",{className:"text-[13px] font-semibold text-foreground"}, ano),
      e(Segmentado,{opcoes:[["meses", "Meses"], ["reps", "Representantes"], ["fech", "Fechamentos"]], atual:vis, onMudar:setVis}),
      e("span",{className:"flex-1"}), e(Botao,{onClick:csv, desabilitado:!linhas.length}, "Exportar CSV")),
    vis==="meses" && e(GradeFiltro,{chave:"meses"+ano, rows:linhas, vazio:"Nenhum mês neste ano.", cols:[
      {k:"mes", t:"Mês", forte:true, v:function(l){ return l.ym; }, exib:function(l){ return l.mes+(l.vivo ? " ·" : ""); }}, {k:"rev", t:"Revend.", tipo:"num", v:function(l){ return l.rev; }, exib:function(l){ return inteiro(l.rev); }},
      {k:"ini", t:"Início", tipo:"num", v:function(l){ return l.inicio; }, exib:function(l){ return inteiro(l.inicio); }}, {k:"saiu", t:"Adiaram 45/60 dias", tipo:"num", v:function(l){ return l.saiu; }, exib:function(l){ return l.saiu ? "−"+inteiro(l.saiu) : "—"; }},
      {k:"vig", t:"Vigente", tipo:"num", v:function(l){ return l.vigente; }, exib:function(l){ return inteiro(l.vigente); }}, {k:"fe", t:"Feitos", tipo:"num", v:function(l){ return l.feitos; }, exib:function(l){ return inteiro(l.feitos); }},
      {k:"pct", t:"%", tipo:"num", forte:true, v:function(l){ return l.pct; }, exib:function(l){ return pc(l.pct); }}, {k:"faixa", t:"Faixa", v:function(l){ return l.faixa; }},
      {k:"fat", t:"Faturado", tipo:"num", v:function(l){ return l.fat; }, exib:function(l){ return l.fat===null ? "—" : brl(l.fat); }}, {k:"media", t:"Média", tipo:"num", v:function(l){ return l.media; }, exib:function(l){ return l.media===null ? "—" : brl(l.media); }},
      {k:"meta", t:"Meta", semFiltro:true, min:130, v:function(l){ return l.pct; }, exib:function(){ return ""; }, cel:function(l){ return barra(l.pct); }}],
      rodape:function(rows){ var tt = rows.reduce(function(s, l){ if(l.vivo) return s; return {ini:s.ini+l.inicio, vig:s.vig+l.vigente, fe:s.fe+l.feitos, fat:s.fat+(l.fat||0), fatAce:s.fatAce+(l.fat!==null ? l.feitos : 0)}; }, {ini:0, vig:0, fe:0, fat:0, fatAce:0});
        return {mes:"Ano", rev:"", ini:inteiro(tt.ini), saiu:"", vig:inteiro(tt.vig), fe:inteiro(tt.fe), pct:pc(tt.vig>0 ? tt.fe/tt.vig*100 : null), faixa:"", fat:tt.fat>0 ? brl(tt.fat) : "—", media:tt.fatAce>0 ? brl(tt.fat/tt.fatAce) : "—", meta:""}; }}),
    vis==="reps" && e(GradeFiltro,{chave:"reps"+ano, rows:reps, vazio:"Nenhuma representante com cota em "+ano+".", cols:[
      {k:"nome", t:"Representante", forte:true, v:function(r){ return nomeProprio(r.nome); }}, {k:"viagem", t:"Destino", v:function(r){ return r.viagem; }},
      {k:"meses", t:"Meses", tipo:"num", v:function(r){ return r.meses; }, exib:function(r){ return inteiro(r.meses); }}, {k:"media", t:"Média", tipo:"num", forte:true, v:function(r){ return r.media; }, exib:function(r){ return pc(r.media); }},
      {k:"melhor", t:"Melhor", tipo:"num", v:function(r){ return r.melhor; }, exib:function(r){ return pc(r.melhor); }}, {k:"pior", t:"Pior", tipo:"num", v:function(r){ return r.pior; }, exib:function(r){ return pc(r.pior); }}, {k:"ultimo", t:"Último", tipo:"num", v:function(r){ return r.ultimo; }, exib:function(r){ return pc(r.ultimo); }},
      {k:"cota", t:"Cota", tipo:"num", v:function(r){ return r.cota; }, exib:function(r){ return r.cota===null ? "—" : inteiro(r.cota); }}, {k:"feitos", t:"Feitos", tipo:"num", v:function(r){ return r.feitos; }, exib:function(r){ return r.feitos===null ? "—" : inteiro(r.feitos); }},
      {k:"afazer", t:"A fazer", tipo:"num", v:function(r){ return r.afazer; }, exib:function(r){ return r.afazer===null ? "—" : inteiro(r.afazer); }}, {k:"agora", t:"% agora", tipo:"num", v:function(r){ return r.agora; }, exib:function(r){ return pc(r.agora); }},
      {k:"meta", t:"Meta", semFiltro:true, min:130, v:function(r){ return r.media; }, exib:function(){ return ""; }, cel:function(r){ return r.media===null ? null : barra(r.media); }}]}),
    vis==="fech" && e(GradeFiltro,{chave:"fech"+ano, rows:fechos, vazio:"Nenhum mês neste ano.", cols:[
      {k:"mes", t:"Mês", forte:true, v:function(x){ return x.ym; }, exib:function(x){ return x.mes; }}, {k:"sit", t:"Situação", v:function(x){ return x.fechado ? "Fechado" : "Aberto"; }},
      {k:"por", t:"Fechado por", v:function(x){ return x.fechado ? (x.por || "—") : "—"; }}, {k:"em", t:"Fechado em", tipo:"data", v:function(x){ return x.fechado && x.em ? String(x.em).slice(0, 10) : ""; }, exib:function(x){ return x.fechado ? dBR(x.em) : "—"; }},
      {k:"vig", t:"Previsto vigente", tipo:"num", v:function(x){ return x.vigente; }, exib:function(x){ return inteiro(x.vigente); }}, {k:"fe", t:"Feitos", tipo:"num", v:function(x){ return x.feitos; }, exib:function(x){ return inteiro(x.feitos); }},
      {k:"pct", t:"%", tipo:"num", forte:true, v:function(x){ return x.pct; }, exib:function(x){ return pc(x.pct); }}, {k:"faixa", t:"Faixa batida", v:function(x){ return x.faixa; }},
      {k:"bonus", t:"Bônus por funcionária", tipo:"num", v:function(x){ return x.bonus; }, exib:function(x){ return x.bonus>0 ? brl(x.bonus) : "—"; }}, {k:"reab", t:"Reaberto", tipo:"num", v:function(x){ return x.reab; }, exib:function(x){ return x.reab ? inteiro(x.reab)+"x" : "—"; }}]}));
}

export { AbaAgAnalises };

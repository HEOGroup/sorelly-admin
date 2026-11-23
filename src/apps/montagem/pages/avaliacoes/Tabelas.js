// Sorelly Admin · montagem — pages/avaliacoes/Tabelas.js
// Avaliações SÓ EM TABELA (Marcus, 12/11/2026: "não é pra ter esse topo, os filtros ficam nas barras, faz somente em tabela").
// Abas Visão geral, Representantes (pelas revendedoras), Representantes (pelo sistema), Montagem e Funcionários no padrão: sem blocos de números no topo,
// sem barra de busca e sem chips; tabela escura com filtro e ordem no cabeçalho de cada coluna (peça TabelaPlanilha). As janelas de detalhe continuam as de antes.
import { Botao, CampoSel } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { PERIODOS, avFuncPendentes, avFuncPorFuncionaria, avFuncPorSetor, avFuncSetoresVisiveis, avMontagem, avPainelRep, avPerguntas, avRepresentanteDetalhe, avRepresentantes, avVisaoGeral, formatarDia, formatarMes, hojeSP } from "@/apps/montagem/domain/avaliacoes";
import { funcionarios } from "@/apps/montagem/domain/pessoas";
import { AbaAvalRep } from "@/apps/montagem/pages/AvalRep";
import { HistoricoJanela, NotaJanela } from "@/apps/montagem/pages/avaliacoes/Funcionarios";
import { DetalheRep, LancarAvaliacao, RevendedorasQueAvaliaram } from "@/apps/montagem/pages/avaliacoes/Representantes";
import { cap, nomeCurto, useAv } from "@/apps/montagem/pages/avaliacoes/visual";
import { brl } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var AMARELO = "text-[#FBBF24]", VERMELHO = "text-[#EF4444]", VERDE = "text-[#22C55E]";
// a nota vai para a tabela como número inteiro (nota × 100) para a ordem das colunas ficar certa; vazio = sem nota
var n100 = function(v){ return v===null || v===undefined ? "" : Math.round(v*100); };
var nota1 = function(v){ return v==="" || v===null || v===undefined ? "—" : (v/100).toFixed(1).replace(".", ","); };
var titulo = function(t){ return e("div",{className:"pt-1 text-center text-[13px] font-bold text-foreground"}, t); };
// coluna de nota: cor só para estado (vermelho abaixo da nota ruim, amarelo abaixo da nota boa)
function colNota(k, t, boa, ruim){
  return {k:k, t:t, fmt:nota1, render:function(v){ return nota1(v); }, cor:function(l){ var v = l[k]; return v==="" || v===undefined ? "" : v<ruim*100 ? VERMELHO : v<boa*100 ? AMARELO : ""; }};
}
var seletorPeriodo = function(valor, mudar){ return e("div",{className:"flex justify-end"}, e(CampoSel,{t:"Período", id:"av-periodo", cls:"w-44", value:valor, onChange:mudar, opcoes:PERIODOS.map(function(x){ return [x.k, x.rotulo]; })})); };
var variacao = function(k, casas, un){ if(!k || k.deltaAbs==null) return "—"; var v = k.deltaAbs; return (v>0 ? "+" : v<0 ? "−" : "")+String(Math.abs(v).toFixed(casas)).replace(".", ",")+(un || ""); };

// ── Visão geral ──
function AbaAvVisaoTabelas(p){
  var a = useAv(), st = useState("mes_atual"), v = avVisaoGeral(a.s, st[0], a.reps), cfg = a.av.config, boa = cfg.notaBoaPiso, ruim = cfg.notaRuimTeto;
  var pct = v.notasBoas.valor, n1 = function(x){ return x===null || x===undefined ? "—" : Number(x).toFixed(1).replace(".", ","); };
  var resumo = [
    {i:"Nota geral (de 0 a 5)", v:n1(v.notaGeral.valor), d:variacao(v.notaGeral, 1)},
    {i:"Avaliações no período", v:String(v.avaliacoesNoPeriodo.valor), d:variacao(v.avaliacoesNoPeriodo, 0)},
    {i:"Notas boas (a partir de "+n1(boa)+")", v:pct==null ? "—" : Math.round(pct)+"%", d:variacao(v.notasBoas, 0, " pontos")},
    {i:"Notas ruins (abaixo de "+n1(ruim)+")", v:String(v.notasRuins.valor), d:"—"},
    {i:"Avaliações desde o começo", v:String(v.totalGeral.avaliacoes), d:"—"}];
  var perguntas = v.mediaPorPergunta.map(function(m){ return {p:cap(m.texto), n:m.n || 0, nota:n100(m.media==null ? null : m.media/m.max*5)}; });
  var reps = v.piores.map(function(x){ return {nome:x.nome, n:x.totalAvaliacoes, nota:n100(x.mediaGeral), sit:"Precisa de atenção"}; }).concat(v.melhores.map(function(x){ return {nome:x.nome, n:x.totalAvaliacoes, nota:n100(x.mediaGeral), sit:"Acima da nota boa"}; }));
  var meses = v.evolucaoMensal.map(function(m){ return {mes:m.mes, n:m.avaliacoes, nota:n100(m.notaGeral)}; });
  return e("div",{className:"flex flex-col gap-2.5"},
    seletorPeriodo(st[0], st[1]),
    e(TabelaPlanilha,{grade:true, semContagem:true, semFiltro:true, chave:"i", linhas:resumo, cols:[{k:"i", t:"Indicador"}, {k:"v", t:"Valor"}, {k:"d", t:"Diferença para o período anterior"}]}),
    titulo("Média por pergunta"),
    e(TabelaPlanilha,{grade:true, semContagem:true, chave:"p", linhas:perguntas, vazio:"Nenhuma resposta no período.", cols:[{k:"p", t:"Pergunta"}, {k:"n", t:"Respostas"}, colNota("nota", "Nota de 0 a 5", boa, ruim)]}),
    titulo("Representantes: as que precisam de atenção e as melhores"),
    e(TabelaPlanilha,{grade:true, semContagem:true, chave:"nome", linhas:reps, vazio:"Nenhuma representante avaliada.", aoClicar:function(){ p.ir("revs"); },
      cols:[{k:"nome", t:"Representante"}, {k:"n", t:"Avaliações"}, colNota("nota", "Nota", boa, ruim), {k:"sit", t:"Situação", cor:function(l){ return l.sit==="Precisa de atenção" ? AMARELO : ""; }}]}),
    titulo("Evolução mensal"),
    e(TabelaPlanilha,{grade:true, semContagem:true, chave:"mes", linhas:meses, vazio:"Nenhuma avaliação para mostrar a evolução.", cols:[{k:"mes", t:"Mês", fmt:formatarMes}, {k:"n", t:"Avaliações"}, colNota("nota", "Nota geral", boa, ruim)]}));
}

// ── Representantes (pelas revendedoras) ──
function AbaAvRepsRevTabela(){
  var a = useAv(), sj = useState(null), jan = sj[0], cfg = a.av.config, boa = cfg.notaBoaPiso, ruim = cfg.notaRuimTeto;
  var perguntas = avPerguntas(a.s, "representante");
  var linhas = avRepresentantes(a.s, a.reps).map(function(r){
    var d = avRepresentanteDetalhe(a.s, r.nome), l = {nome:r.nome, n:r.totalAvaliacoes, nota:n100(r.mediaGeral)};
    perguntas.forEach(function(q){ var m = d.medias.filter(function(x){ return x.perguntaId===q.id; })[0]; l["q_"+q.id] = n100(m && m.media!=null ? m.media/m.max*5 : null); });
    return l; });
  var cols = [{k:"nome", t:"Representante"}, {k:"n", t:"Avaliações"}, colNota("nota", "Nota geral", boa, ruim)].concat(perguntas.map(function(q){ return colNota("q_"+q.id, cap(q.texto), boa, ruim); }));
  var fecha = function(){ sj[1](null); };
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"flex flex-wrap justify-end gap-2"},
      e(Botao,{onClick:function(){ sj[1]({t:"revs"}); }}, "Revendedoras que avaliaram"),
      e(Botao,{principal:true, onClick:function(){ sj[1]({t:"lancar"}); }}, "Lançar avaliação")),
    e(TabelaPlanilha,{grade:true, semContagem:true, chave:"nome", linhas:linhas, cols:cols, vazio:"Nenhuma representante cadastrada.", aoClicar:function(l){ sj[1]({t:"rep", nome:l.nome}); }}),
    jan && jan.t==="rep" && e(DetalheRep,{nome:jan.nome, fechar:fecha}),
    jan && jan.t==="lancar" && e(LancarAvaliacao,{fechar:fecha}),
    jan && jan.t==="revs" && e(RevendedorasQueAvaliaram,{fechar:fecha}));
}

// ── Representantes (pelo sistema): revendedoras e sistema lado a lado; embaixo, a tela da nota do sistema que já existia ──
function AbaAvRepsSisTabela(){
  var a = useAv(), cfg = a.av.config, boa = cfg.notaBoaPiso, ruim = cfg.notaRuimTeto;
  var linhas = a.reps.map(function(r){ var x = avPainelRep(a.s, r); return {nome:x.nome, n:x.revendedoras.total, rev:n100(x.revendedoras.nota), sis:n100(x.sistema.pontos), dif:x.diferenca==null ? "" : Math.round(x.diferenca*100)}; });
  var dif = function(v){ return v==="" ? "—" : (v>0 ? "+" : v<0 ? "−" : "")+(Math.abs(v)/100).toFixed(1).replace(".", ","); };
  return e("div",{className:"flex flex-col gap-2.5"},
    e(TabelaPlanilha,{grade:true, semContagem:true, chave:"nome", linhas:linhas, vazio:"Nenhuma representante cadastrada.",
      cols:[{k:"nome", t:"Representante"}, {k:"n", t:"Avaliações das revendedoras"}, colNota("rev", "Nota das revendedoras", boa, ruim), colNota("sis", "Nota do sistema", boa, ruim),
        {k:"dif", t:"Diferença", fmt:dif, render:function(v){ return dif(v); }, cor:function(l){ return l.dif!=="" && Math.abs(l.dif)>=50 ? AMARELO : ""; }}]}),
    e("div",{className:"flex flex-col gap-2.5 [&>div:first-child]:hidden"}, e(AbaAvalRep,null)));
}

// ── Montagem: erros de bipagem e divergências (vêm da conferência das peças) ──
function AbaAvMontagemTabelas(){
  var a = useAv(), st = useState("mes_atual"), m = avMontagem(a.s, st[0]), t = m.totais, ver = a.ver;
  var taxa = function(v){ return v===null || v===undefined || v==="" ? "—" : String(v).replace(".", ",")+"%"; };
  var dinheiro = {fmt:function(v){ return brl(v/100); }, render:function(v){ return brl(v/100); }};
  var colsGrupo = function(rot){ return [{k:"nome", t:rot}, {k:"registros", t:"Registros"}, {k:"erros", t:"Erros", cor:function(l){ return l.erros ? VERMELHO : ""; }}, {k:"faltas", t:"Faltas"}, {k:"sobras", t:"Sobras"}, {k:"taxa", t:"Taxa de erro"}]
    .concat(ver ? [Object.assign({k:"desc", t:"Desconto estimado"}, dinheiro)] : []); };
  var grupo = function(lista){ return lista.map(function(x){ return {nome:x.nome, registros:x.registros, erros:x.erros, faltas:x.faltas, sobras:x.sobras, taxa:taxa(x.taxaErro), desc:Math.round((x.descontoEstimado || 0)*100)}; }); };
  var resumo = [{registros:t.registros, erros:t.erros, faltas:t.faltas, sobras:t.sobras, esperadas:t.pecasEsperadas, taxa:taxa(t.taxaErro), desc:Math.round((t.descontoEstimado || 0)*100)}];
  var tab = function(nome, rot, lista){ return e("div",{key:nome, className:"flex flex-col gap-2.5"}, titulo(nome), e(TabelaPlanilha,{grade:true, semContagem:true, chave:"nome", linhas:grupo(lista), cols:colsGrupo(rot), vazio:"Nenhum registro no período."})); };
  return e("div",{className:"flex flex-col gap-2.5"},
    seletorPeriodo(st[0], st[1]),
    e(TabelaPlanilha,{grade:true, semContagem:true, semFiltro:true, linhas:resumo, cols:[{k:"registros", t:"Registros"}, {k:"erros", t:"Erros", cor:function(l){ return l.erros ? VERMELHO : ""; }}, {k:"faltas", t:"Faltas"}, {k:"sobras", t:"Sobras"}, {k:"esperadas", t:"Peças esperadas"}, {k:"taxa", t:"Taxa de erro"}]
      .concat(ver ? [Object.assign({k:"desc", t:"Desconto estimado"}, dinheiro)] : [])}),
    tab("Por bipadora", "Bipadora", m.porBipadora), tab("Por montadora", "Montadora", m.porMontadora), tab("Por representante", "Representante", m.porRepresentante),
    titulo("Peças que mais faltam"),
    e(TabelaPlanilha,{grade:true, semContagem:true, chave:"codigo", linhas:m.pecasMaisFaltantes, vazio:"Nenhuma peça em falta no período.", cols:[{k:"codigo", t:"Código"}, {k:"qtd", t:"Faltas"}]}),
    titulo("Por mês"),
    e(TabelaPlanilha,{grade:true, semContagem:true, chave:"mes", linhas:m.porMes, vazio:"Nenhum registro no período.", cols:[{k:"mes", t:"Mês", fmt:formatarMes}, {k:"registros", t:"Registros"}, {k:"erros", t:"Erros"}]}),
    titulo("Últimos registros"),
    e(TabelaPlanilha,{grade:true, semContagem:true, linhas:m.ultimos.map(function(x){ return {data:String(x.data || "").slice(0, 10), kit:x.kitId || "", rep:x.rep || "", bip:x.bipadora || "", erros:x.erros || 0}; }), vazio:"Nenhum registro de conferência no período.",
      cols:[{k:"data", t:"Data", fmt:formatarDia}, {k:"kit", t:"Kit"}, {k:"rep", t:"Representante"}, {k:"bip", t:"Bipadora"}, {k:"erros", t:"Erros", cor:function(l){ return l.erros ? VERMELHO : ""; }}]}));
}

// ── Funcionários (pelos supervisores): uma linha por funcionária; clicar avalia (pendente) ou abre o histórico ──
function AbaAvFuncTabelas(){
  var a = useAv(), cfg = a.av.config.func, sj = useState(null), jan = sj[0], mes = hojeSP().slice(0, 7);
  var todos = funcionarios().filter(function(f){ return f.vinculo==="clt"; }).map(function(f){ return {id:f.nome, nome:f.nome, setor:f.setor}; });
  var visiveis = avFuncSetoresVisiveis(a.s, a.quem, todos.map(function(f){ return f.setor; }).filter(function(x, i, v){ return v.indexOf(x)===i; }));
  if(!visiveis.length) return e("p",{className:"py-6 text-center text-[13px] text-foreground"}, "Nenhum setor sob a sua supervisão. A diretoria define os supervisores no Configurador.");
  var pend = {}; avFuncPendentes(a.s, a.quem, todos, mes).forEach(function(x){ pend[x.id] = 1; });
  var medias = {}; avFuncPorFuncionaria(a.s, a.quem).forEach(function(x){ medias[x.funcId] = x; });
  var linhas = todos.filter(function(f){ return visiveis.indexOf(f.setor)>=0; }).map(function(f){ var x = medias[f.id];
    return {id:f.id, nome:nomeCurto(f.nome), inteiro:f.nome, setor:f.setor, sit:pend[f.id] ? "Pendente" : "Avaliada", n:x ? x.n : 0, media:n100(x ? x.media : null), ultimo:x && x.ultima ? x.ultima.mes : ""}; });
  var setores = avFuncPorSetor(a.s, a.quem).filter(function(x){ return visiveis.indexOf(x.setor)>=0; }).map(function(x){ return {setor:x.setor, n:x.funcionarias, media:n100(x.media), bons:x.bons, ruins:x.ruins}; });
  var fecha = function(){ sj[1](null); };
  return e("div",{className:"flex flex-col gap-2.5"},
    e(TabelaPlanilha,{grade:true, semContagem:true, chave:"id", linhas:linhas, vazio:"Nenhuma funcionária encontrada.",
      aoClicar:function(l){ var f = {id:l.id, nome:l.inteiro, setor:l.setor}; sj[1](l.sit==="Pendente" ? {t:"nota", func:f} : {t:"hist", func:f}); },
      cols:[{k:"nome", t:"Funcionária"}, {k:"setor", t:"Setor"}, {k:"sit", t:"Avaliação de "+formatarMes(mes), cor:function(l){ return l.sit==="Pendente" ? AMARELO : VERDE; }}, {k:"n", t:"Avaliações"}, colNota("media", "Média", cfg.notaBoa, cfg.notaRuim), {k:"ultimo", t:"Último mês", fmt:formatarMes}]}),
    titulo("Média por setor"),
    e(TabelaPlanilha,{grade:true, semContagem:true, chave:"setor", linhas:setores, vazio:"Nenhum setor avaliado até o momento.",
      cols:[{k:"setor", t:"Setor"}, {k:"n", t:"Funcionárias"}, colNota("media", "Média", cfg.notaBoa, cfg.notaRuim), {k:"bons", t:"Notas boas"}, {k:"ruins", t:"Notas ruins", cor:function(l){ return l.ruins ? VERMELHO : ""; }}]}),
    jan && jan.t==="nota" && e(NotaJanela,{key:jan.func.id+(jan.mes || ""), func:jan.func, mes:jan.mes, fechar:fecha}),
    jan && jan.t==="hist" && e(HistoricoJanela,{func:jan.func, fechar:fecha, refazer:function(mm){ sj[1]({t:"nota", func:jan.func, mes:mm}); }}));
}

export { AbaAvVisaoTabelas, AbaAvRepsRevTabela, AbaAvRepsSisTabela, AbaAvMontagemTabelas, AbaAvFuncTabelas };

// Sorelly Admin · montagem — pages/producao/ProdGrade.js
// Produção › GRADE DO MÊS (Marcus, 16/11/2026: "a tela de produção está muito ruim e confusa"; desenho aprovado por ele): UMA tela, uma linha por funcionária e uma coluna por dia. O número da célula é
// QUANTAS PEÇAS a funcionária fez naquele dia. Logo depois do nome ficam o Total do mês, o Bônus e quanto Falta para a próxima faixa (as faixas são as da Premiação). Sem faixa de números no topo e sem R$ da peça:
// o que importa é o feito. Clicar num número abre a janela com os lançamentos daquela pessoa naquele dia (ver e alterar); clicar no total do dia (última linha) abre o dia inteiro, para lançar.
// Quem aparece: só quem produziu no mês (nomes que só diferem em maiúscula e minúscula somam juntos). Dias: todos, menos domingo sem lançamento.
import { ProdModelos } from "@/apps/montagem/pages/producao/ProdModelos";
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { ROTULO_UNIDADE, metaDoDia, UNIDADES, bonusDoDia, diaDaSemana, eCasa, ehExterna, resumoExterna, formatarInteiro, formatarReais, hojeSP, intervaloPeriodo, linhasDoPeriodo, nomeMes, somaDias, valorDiaCasa } from "@/apps/montagem/domain/producao";
import { EditorDia } from "@/apps/montagem/pages/producao/ProdEditorDia";
import { BtFaixa, CAMPO_FAIXA, FaixaAzul, MIUDA, MenuFaixa, Raiz, grupoBtn, usePr } from "@/apps/montagem/pages/producao/visualProd";
import { e, useState } from "@/shared/react";

var n0 = function(v){ return typeof v==="number" ? formatarInteiro(v) : v; };

function AbaProdGrade(){
  var x = usePr(), pr = x.pr;
  var sM = useState(hojeSP().slice(0, 7)), sU = useState(""), sE = useState(null), sTodas = useState(false), sMod = useState("pecas");
  var mes = sM[0], unidade = sU[0], editor = sE[0], emReais = sMod[0]==="din";   // visão Peças ou Dinheiro (Marcus, 24/11/2026): em Dinheiro cada célula mostra o valor a pagar do dia, no lugar das peças
  var restrito = !x.admin;   // funcionária: só anota a produção; não vê a externa (a que faz em casa) nem o bônus em dinheiro (Marcus, 18/11/2026)
  var iv = intervaloPeriodo("mes", mes+"-01"), todas = linhasDoPeriodo(pr, iv.from, iv.to, unidade || null).filter(function(l){ return !restrito || (l.unidade!=="CASA" && !ehExterna(l.func)); });
  var ym = mes.split("-").map(Number), hoje = hojeSP();

  // DUAS TABELAS SEPARADAS, uma colada na outra (Marcus, 24/11/2026: "diminui o tamanho das linhas e cola em baixo a produção de casa separado, para melhor controle"):
  // em cima a produção da EMPRESA (paga por bônus do dia); embaixo a produção de CASA (paga R$ 0,45 por peça). Quem faz as duas aparece nas duas, cada uma com as suas peças.
  var linhasEmp = todas.filter(function(l){ return !eCasa(l); }), linhasCasa = todas.filter(eCasa);
  // TODOS os dias do mês, do 1 ao último (Marcus, 16/11/2026: "cadê os dias 17 em diante?"); domingo e hoje ficam marcados no topo da coluna
  var diasMes = []; for(var d = iv.from; d<=iv.to; d = somaDias(d, 1)) diasMes.push(d);

  // soma por funcionária e dia (nomes iguais sem diferenciar maiúscula e minúscula entram juntos; o nome mostrado é o da grafia com mais peças)
  var rowsDe = function(subLinhas, daCasa){
    var por = {};
    subLinhas.forEach(function(l){
      var q = Number(l.qtd) || 0, nm = String(l.func || "").trim() || "Sem nome", k = nm.toLowerCase(), g = por[k] || (por[k] = {nome:nm, graf:{}, dia:{}, total:0});
      g.graf[nm] = (g.graf[nm] || 0)+q; g.dia[l.dia] = (g.dia[l.dia] || 0)+q; g.total += q;
    });
    return Object.keys(por).map(function(k){
      var g = por[k], melhor = Object.keys(g.graf).sort(function(a, b){ return g.graf[b]-g.graf[a]; })[0];
      // casa: recebe pelas peças (diária até 15/11, R$ 0,45 por peça depois); empresa: bônus por DIA (R$ 15 com 300, R$ 20 com 350, R$ 25 com 400+), somado no mês; quem só faz produção externa não tem bônus
      var bonus = daCasa ? resumoExterna(pr, ym[0], ym[1], melhor).valor : (ehExterna(melhor) ? 0 : Object.keys(g.dia).reduce(function(t, dd){ return t+bonusDoDia(g.dia[dd], melhor); }, 0));
      var r = {id:(daCasa ? "c|" : "e|")+k, nome:melhor, casa:daCasa, total:g.total, bonus:bonus};
      var somaV = 0;
      diasMes.forEach(function(dd){ r["d"+dd] = g.dia[dd] || 0; var vd = g.dia[dd] ? (daCasa ? valorDiaCasa(pr, melhor, dd) : (ehExterna(melhor) ? 0 : bonusDoDia(g.dia[dd], melhor))) : 0; r["v"+dd] = vd; somaV += vd; });   // valor a pagar do dia: casa = diária ou R$ 0,45 por peça; empresa = bônus do dia
      r.totalV = Math.round(somaV*100)/100;
      return r;
    }).sort(function(a, b){ return b.total-a.total; });
  };
  var rowsEmp = rowsDe(linhasEmp, false), rowsCasa = rowsDe(linhasCasa, true);

  // QUEM FICA FECHADO (Marcus, 18/11/2026), só na tabela da empresa: no mês de hoje, quem não lançou nos últimos 2 dias úteis (sábado e domingo não contam) e não tem bônus no mês some da tela; só abre no botão "+"
  var recentes = []; if(mes===hoje.slice(0, 7)){ for(var q = hoje, guarda = 0; recentes.length<2 && guarda<12; q = somaDias(q, -1), guarda++){ var ds = diaDaSemana(q); if(ds!=="sábado" && ds!=="domingo") recentes.push(q); } }
  var ocultas = recentes.length ? rowsEmp.filter(function(r){ return !recentes.some(function(dd){ return r["d"+dd]>0; }) && !(typeof r.bonus==="number" && r.bonus>0); }) : [];
  var rowsVis = sTodas[0] ? rowsEmp : rowsEmp.filter(function(r){ return ocultas.indexOf(r)<0; });
  var abrir = function(dia, func, nova){ sE[1]({dia:dia, func:func || "", nova:!!nova}); };
  var H18 = "h-[22px]";   // linha baixa (Marcus, 24/11/2026: "diminui o tamanho das linhas")
  var cel = function(dd){ return function(v, r){ return e("span",{role:"button", tabIndex:0, onKeyDown:function(ev){ if(ev.key==="Enter") abrir(dd, r.nome); }, onClick:function(){ abrir(dd, r.nome); }, "aria-label":r.nome+", dia "+dd.slice(8)+": "+(v ? (emReais ? formatarReais(r["v"+dd] || 0) : formatarInteiro(v)+" peças") : "sem lançamento")+". Clique para ver ou alterar", style:{width:"100%", fontSize:"10px", minWidth:0, padding:0}, className:"group flex "+H18+" w-full cursor-pointer items-center justify-center text-[10px] tabular-nums hover:bg-white/10"+(emReais ? ((r["v"+dd] || 0)>0 ? " text-success" : "") : (v>=metaDoDia(r.nome) && !r.casa ? " text-success" : ""))}, v ? (emReais ? ((r["v"+dd] || 0)>0 ? formatarReais(r["v"+dd]) : "—") : String(v)) : dd<=hoje ? "—" : e("span",{className:"opacity-0 group-hover:opacity-60"}, "+")); }; };   // padrao-ok: número do dia em 10 px para caber os 30 dias na tela (Marcus, 22/11/2026)
  var cols = [{k:"nome", t:"Funcionária", w:emReais ? "8rem" : "6.5rem", fixa:true, semFiltro:true}, {k:emReais ? "totalV" : "total", t:"Total", w:emReais ? "5rem" : "4%", semFiltro:true, fmt:emReais ? formatarReais : n0}, {k:"bonus", t:"A receber", w:emReais ? "5.5rem" : "6%", semFiltro:true, fmt:function(v){ return typeof v==="number" ? formatarReais(v) : v; }, cor:function(r){ return r.bonus>0 ? "text-success" : ""; }}]
    .concat(diasMes.map(function(dd){ return {k:"d"+dd, t:dd.slice(8), w:emReais ? "3.6rem" : (80/diasMes.length)+"%", semFiltro:true, render:cel(dd), corTopo:dd===hoje ? "#5BB8FF" : undefined}; }));
  if(restrito) cols = cols.filter(function(c){ return c.k!=="bonus"; });
  // linha de TOTAL no FIM de cada tabela (Marcus, 16/11/2026): soma do mês, bônus e, em cada dia, o total do dia (clicar no total do dia abre o dia inteiro); os totais somam TODAS as linhas da tabela (inclusive as fechadas)
  var totalDe = function(todasLinhas){ return function(ls){ return cols.map(function(c, i){
    if(i===0) return "TOTAL · "+ls.length;
    if(c.k==="total") return formatarInteiro(todasLinhas.reduce(function(t, r){ return t+r.total; }, 0));
    if(c.k==="totalV") return formatarReais(todasLinhas.reduce(function(t, r){ return t+(r.totalV || 0); }, 0));
    if(c.k==="bonus") return formatarReais(todasLinhas.reduce(function(t, r){ return t+(typeof r.bonus==="number" ? r.bonus : 0); }, 0));
    var dd = c.k.slice(1), s = todasLinhas.reduce(function(t, r){ return t+(r[c.k] || 0); }, 0), sv = todasLinhas.reduce(function(t, r){ return t+(r["v"+dd] || 0); }, 0);
    return e("span",{role:"button", tabIndex:0, onKeyDown:function(ev){ if(ev.key==="Enter") abrir(dd, ""); }, onClick:function(){ abrir(dd, ""); }, title:"Abrir o dia inteiro para lançar", style:{width:"100%", fontSize:"10px", minWidth:0, padding:0}, className:"group flex "+H18+" w-full cursor-pointer items-center justify-center text-[10px] tabular-nums hover:text-primary"}, s ? (emReais ? (sv>0 ? formatarReais(Math.round(sv*100)/100) : "—") : String(s)) : dd<=hoje ? "—" : e("span",{className:"opacity-0 group-hover:opacity-60"}, "+"));   // padrao-ok: mesmo 10 px da linha dos dias (Marcus, 22/11/2026)
  }); }; };

  // as duas tabelas (empresa e casa) vão dentro de UM só bloco, coladas, sem a faixa branca de separação (Marcus, 24/11/2026)
  return e(Raiz,{cls:MIUDA},
    e("div",{key:"duas", className:"flex min-w-0 flex-col gap-0"},
    e(BlocoPainel,{titulo:(restrito ? "Produção" : "Produção da empresa")+" · "+nomeMes(ym[0], ym[1]), compacto:true},
      e(FaixaAzul,null,
        e("label",{className:"flex items-center gap-2 text-[13px] font-semibold text-white"}, "Mês", e("input",{type:"month", value:mes, "aria-label":"Mês", onChange:function(ev){ if(ev.target.value) sM[1](ev.target.value); }, className:CAMPO_FAIXA})),
        grupoBtn([["", "Todas"]].concat(UNIDADES.filter(function(u){ return !restrito || u!=="CASA"; }).map(function(u){ return [u, ROTULO_UNIDADE[u]]; })), unidade, sU[1]),
        !restrito && e(MenuFaixa,{aria:"Mostrar", valor:sMod[0], larg:"w-28", grupos:[{t:"", itens:[["pecas", "Peças"], ["din", "Dinheiro"]]}], onChange:function(v){ sMod[1](v); }}),   // só a Diretoria vê dinheiro
        e("span",{className:"flex-1"}),
        ocultas.length>0 && e(BtFaixa,{titulo:sTodas[0] ? "Fecha de novo quem não lançou nos últimos 2 dias úteis" : "Mostra quem não lançou nos últimos 2 dias úteis e não tem bônus no mês", onClick:function(){ sTodas[1](!sTodas[0]); }}, sTodas[0] ? "− "+ocultas.length : "+ "+ocultas.length),
        e(BtFaixa,{titulo:"Abre a janela de lançamento no dia de hoje, já com uma linha nova para digitar", onClick:function(){ abrir(hojeSP(), "", true); }}, "+ Adicionar lançamento")),
            e(TabelaPlanilha,{key:"emp"+mes+unidade+sMod[0]+(sTodas[0] ? "t" : "f"), fina:true, cols:cols, linhas:rowsVis, chave:"id", grade:true, barraFina:true, semContagem:true, semLimpar:true, totalRodape:totalDe(rowsEmp), vazio:"Nenhuma produção lançada neste mês."})),
    !restrito && (!unidade || unidade==="CASA") && e(BlocoPainel,{key:"casa", titulo:"Produção de casa · "+nomeMes(ym[0], ym[1]), dir:"R$ 0,45 por peça", compacto:true},
      e(TabelaPlanilha,{key:"casa"+mes+unidade+sMod[0], fina:true, cols:cols, linhas:rowsCasa, chave:"id", grade:true, barraFina:true, semContagem:true, semLimpar:true, totalRodape:totalDe(rowsCasa), vazio:"Nenhuma produção de casa neste mês."})),
    ),
    e(ProdModelos,{key:"modelos"}),   // embaixo da grade: o que foi produzido por modelo, com custo e valor (só diretoria)
    editor && e(EditorDia,{key:editor.dia+"|"+editor.func+"|"+editor.nova, dia:editor.dia, func:editor.func, nova:editor.nova, aoFechar:function(){ sE[1](null); }}));
}
export { AbaProdGrade };

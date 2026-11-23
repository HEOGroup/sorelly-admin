// Sorelly Admin · montagem — pages/producao/ProdGrade.js
// Produção › GRADE DO MÊS (Marcus, 16/11/2026: "a tela de produção está muito ruim e confusa"; desenho aprovado por ele): UMA tela, uma linha por funcionária e uma coluna por dia. O número da célula é
// QUANTAS PEÇAS a funcionária fez naquele dia. Logo depois do nome ficam o Total do mês, o Bônus e quanto Falta para a próxima faixa (as faixas são as da Premiação). Sem faixa de números no topo e sem R$ da peça:
// o que importa é o feito. Clicar num número abre a janela com os lançamentos daquela pessoa naquele dia (ver e alterar); clicar no total do dia (última linha) abre o dia inteiro, para lançar.
// Quem aparece: só quem produziu no mês (nomes que só diferem em maiúscula e minúscula somam juntos). Dias: todos, menos domingo sem lançamento.
import { ProdModelos } from "@/apps/montagem/pages/producao/ProdModelos";
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { ROTULO_UNIDADE, metaDoDia, UNIDADES, bonusDoDia, diaDaSemana, eCasa, ehExterna, resumoExterna, formatarInteiro, formatarReais, hojeSP, intervaloPeriodo, linhasDoPeriodo, nomeMes, somaDias } from "@/apps/montagem/domain/producao";
import { EditorDia } from "@/apps/montagem/pages/producao/ProdEditorDia";
import { BtFaixa, CAMPO_FAIXA, FaixaAzul, Raiz, grupoBtn, usePr } from "@/apps/montagem/pages/producao/visualProd";
import { e, useState } from "@/shared/react";

var n0 = function(v){ return typeof v==="number" ? formatarInteiro(v) : v; };

function AbaProdGrade(){
  var x = usePr(), pr = x.pr;
  var sM = useState(hojeSP().slice(0, 7)), sU = useState(""), sE = useState(null), sTodas = useState(false);
  var mes = sM[0], unidade = sU[0], editor = sE[0];
  var restrito = !x.admin;   // funcionária: só anota a produção; não vê a externa (a que faz em casa) nem o bônus em dinheiro (Marcus, 18/11/2026)
  var iv = intervaloPeriodo("mes", mes+"-01"), linhas = linhasDoPeriodo(pr, iv.from, iv.to, unidade || null).filter(function(l){ return !restrito || (l.unidade!=="CASA" && !ehExterna(l.func)); });

  // soma por funcionária e dia (nomes iguais sem diferenciar maiúscula e minúscula entram juntos; o nome mostrado é o da grafia com mais peças)
  var por = {}, dias = {}, comDado = {};
  linhas.forEach(function(l){
    var q = Number(l.qtd) || 0, nm = String(l.func || "").trim() || "Sem nome", k = nm.toLowerCase(), g = por[k] || (por[k] = {nome:nm, graf:{}, dia:{}, diaB:{}, unid:{}, total:0});
    g.unid[l.unidade || ""] = 1; if(eCasa(l)) g.temCasa = true; else g.diaB[l.dia] = (g.diaB[l.dia] || 0)+q; g.graf[nm] = (g.graf[nm] || 0)+q; g.dia[l.dia] = (g.dia[l.dia] || 0)+q; g.total += q; dias[l.dia] = (dias[l.dia] || 0)+q; comDado[l.dia] = 1;
  });
  var diasMes = [];
  // TODOS os dias do mês, do 1 ao último (Marcus, 16/11/2026: "cadê os dias 17 em diante?"); domingo e hoje ficam marcados no topo da coluna
  var hoje = hojeSP();
  for(var d = iv.from; d<=iv.to; d = somaDias(d, 1)) diasMes.push(d);

  var rows = Object.keys(por).map(function(k){
    var g = por[k], melhor = Object.keys(g.graf).sort(function(a, b){ return g.graf[b]-g.graf[a]; })[0];
    var casa = !Object.keys(g.unid).some(function(u){ return u!=="CASA"; }) || ehExterna(melhor);   // só produz em casa: fora do bônus (paga por dia), então Bônus e Falta ficam em traço
    var bonusMes = Object.keys(g.diaB).reduce(function(t, dd){ return t+bonusDoDia(g.diaB[dd], melhor); }, 0);   // bônus só das peças internas (a produção em casa paga R$ 0,45 por peça, sem bônus)   // bônus por DIA: R$ 15 (300), R$ 20 (350), R$ 25 (400+), somado no mês
    var r = {id:k, nome:melhor, casa:casa, total:g.total, bonus:(casa || g.temCasa) ? (casa ? 0 : bonusMes)+resumoExterna(pr, Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), melhor).valor : bonusMes};   // a externa recebe pelas peças (diária até 15/11, R$ 0,45 por peça depois), não bônus
    diasMes.forEach(function(dd){ r["d"+dd] = g.dia[dd] || 0; });
    return r;
  }).sort(function(a, b){ return (b.casa ? 1 : 0)-(a.casa ? 1 : 0) || b.total-a.total; });   // a produção externa (Dávila) vem PRIMEIRO, só para a Diretoria; depois quem mais fez

  // QUEM FICA FECHADO (Marcus, 18/11/2026): no mês de hoje, quem não lançou nos últimos 2 dias úteis (sábado e domingo não contam) e não tem bônus no mês some da tela; só abre no botão "+"
  var recentes = []; if(mes===hoje.slice(0, 7)){ for(var q = hoje, guarda = 0; recentes.length<2 && guarda<12; q = somaDias(q, -1), guarda++){ var ds = diaDaSemana(q); if(ds!=="sábado" && ds!=="domingo") recentes.push(q); } }
  var ocultas = recentes.length ? rows.filter(function(r){ return !recentes.some(function(dd){ return r["d"+dd]>0; }) && !(typeof r.bonus==="number" && r.bonus>0); }) : [];
  var rowsVis = sTodas[0] ? rows : rows.filter(function(r){ return ocultas.indexOf(r)<0; });
  var abrir = function(dia, func, nova){ sE[1]({dia:dia, func:func || "", nova:!!nova}); };
  var cel = function(dd){ return function(v, r){ return e("span",{role:"button", tabIndex:0, onKeyDown:function(ev){ if(ev.key==="Enter") abrir(dd, r.nome); }, onClick:function(){ abrir(dd, r.nome); }, "aria-label":r.nome+", dia "+dd.slice(8)+": "+(v ? formatarInteiro(v)+" peças" : "sem lançamento")+". Clique para ver ou alterar", style:{width:"100%", fontSize:"10px", minWidth:0, padding:0}, className:"group flex h-8 w-full cursor-pointer items-center justify-center text-[10px] tabular-nums hover:bg-white/10"+(v>=metaDoDia(r.nome) && !r.casa ? " text-success" : "")}, v ? String(v) : dd<=hoje ? "—" : e("span",{className:"opacity-0 group-hover:opacity-60"}, "+")); }; };   // padrao-ok: número do dia em 10 px para caber os 30 dias na tela (Marcus, 22/11/2026)
  var cols = [{k:"nome", t:"Funcionária", w:"6.5rem", fixa:true, semFiltro:true}, {k:"total", t:"Total", w:"4%", semFiltro:true, fmt:n0}, {k:"bonus", t:"A receber", w:"6%", semFiltro:true, fmt:function(v){ return typeof v==="number" ? formatarReais(v) : v; }, cor:function(r){ return r.bonus>0 ? "text-success" : ""; }}]
    .concat(diasMes.map(function(dd){ return {k:"d"+dd, t:dd.slice(8), w:(80/diasMes.length)+"%", semFiltro:true, render:cel(dd), corTopo:dd===hoje ? "#5BB8FF" : undefined}; }));
  if(restrito) cols = cols.filter(function(c){ return c.k!=="bonus"; });
  // linha de TOTAL no FIM da tabela (Marcus, 16/11/2026): soma do mês, bônus e, em cada dia, o total do dia (clicar no total do dia abre o dia inteiro)
  var totalRodape = function(ls){ return cols.map(function(c, i){
    if(i===0) return "TOTAL · "+ls.length;
    if(c.k==="total") return formatarInteiro(rows.reduce(function(t, r){ return t+r.total; }, 0));   // os totais somam TODAS (inclusive as fechadas)
    if(c.k==="bonus") return formatarReais(rows.reduce(function(t, r){ return t+(typeof r.bonus==="number" ? r.bonus : 0); }, 0));
    if(c.k==="falta") return "";
    var dd = c.k.slice(1), s = rows.reduce(function(t, r){ return t+(r[c.k] || 0); }, 0);
    return e("span",{role:"button", tabIndex:0, onKeyDown:function(ev){ if(ev.key==="Enter") abrir(dd, ""); }, onClick:function(){ abrir(dd, ""); }, title:"Abrir o dia inteiro para lançar", style:{width:"100%", fontSize:"10px", minWidth:0, padding:0}, className:"group flex h-8 w-full cursor-pointer items-center justify-center text-[10px] tabular-nums hover:text-primary"}, s ? String(s) : dd<=hoje ? "—" : e("span",{className:"opacity-0 group-hover:opacity-60"}, "+"));   // padrao-ok: mesmo 10 px da linha dos dias (Marcus, 22/11/2026)
  }); };
  var ym = mes.split("-").map(Number);

  return e(Raiz,null,
    e(BlocoPainel,{titulo:"Produção · "+nomeMes(ym[0], ym[1]), compacto:true},
      e(FaixaAzul,null,
        e("label",{className:"flex items-center gap-2 text-[13px] font-semibold text-white"}, "Mês", e("input",{type:"month", value:mes, "aria-label":"Mês", onChange:function(ev){ if(ev.target.value) sM[1](ev.target.value); }, className:CAMPO_FAIXA})),
        grupoBtn([["", "Todas"]].concat(UNIDADES.filter(function(u){ return !restrito || u!=="CASA"; }).map(function(u){ return [u, ROTULO_UNIDADE[u]]; })), unidade, sU[1]),
        e("span",{className:"flex-1"}),
        ocultas.length>0 && e(BtFaixa,{titulo:sTodas[0] ? "Fecha de novo quem não lançou nos últimos 2 dias úteis" : "Mostra quem não lançou nos últimos 2 dias úteis e não tem bônus no mês", onClick:function(){ sTodas[1](!sTodas[0]); }}, sTodas[0] ? "− "+ocultas.length : "+ "+ocultas.length),
        e(BtFaixa,{titulo:"Abre a janela de lançamento no dia de hoje, já com uma linha nova para digitar", onClick:function(){ abrir(hojeSP(), "", true); }}, "+ Adicionar lançamento")),
            e(TabelaPlanilha,{key:mes+unidade+(sTodas[0] ? "t" : "f"), fina:true, cols:cols, linhas:rowsVis, chave:"id", grade:true, barraFina:true, semContagem:true, semLimpar:true, totalRodape:totalRodape, vazio:"Nenhuma produção lançada neste mês."})),
    e(ProdModelos,{key:"modelos"}),   // embaixo da grade: o que foi produzido por modelo, com custo e valor (só diretoria)
    editor && e(EditorDia,{key:editor.dia+"|"+editor.func+"|"+editor.nova, dia:editor.dia, func:editor.func, nova:editor.nova, aoFechar:function(){ sE[1](null); }}));
}
export { AbaProdGrade };

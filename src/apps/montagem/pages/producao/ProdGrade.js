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

// NOMES ERRADOS (Marcus, 26/11/2026: "Agatna", "Isqadora"): erros de digitação do histórico viram o nome certo SÓ na tela (o dado salvo não muda). Só o que é claramente o mesmo nome.
var NOME_CERTO = {agatna:"Agatha Mota", isqadora:"Isadora", madlin:"Medlin", mdlin:"Medlin", eliernanda:"Eli Ernanda", ellen:"Elen", audrielli:"Audrieli", graziela:"Graziella", grazielle:"Graziella", kislieidy:"Kislieydi", kaillany:"Kailany", jeniffer:"Jheniffer", sonia:"Sonia"};
function nomeCerto(nm){ return NOME_CERTO[String(nm || "").toLowerCase()] || nm; }
var n0 = function(v){ return typeof v==="number" ? formatarInteiro(v) : v; };

function AbaProdGrade(){
  var x = usePr(), pr = x.pr;
  var sM = useState(hojeSP().slice(0, 7)), sU = useState(""), sE = useState(null), sTodas = useState(false), sMod = useState("pecas"), sExp = useState({});
  var mes = sM[0], unidade = sU[0], editor = sE[0], emReais = sMod[0]==="din";   // visão Peças ou Dinheiro (Marcus, 24/11/2026): em Dinheiro cada célula mostra o valor a pagar do dia, no lugar das peças
  var restrito = !x.admin;   // funcionária: só anota a produção; não vê a externa (a que faz em casa) nem o bônus em dinheiro (Marcus, 18/11/2026)
  var iv = intervaloPeriodo("mes", mes+"-01"), todas = linhasDoPeriodo(pr, iv.from, iv.to, unidade || null).filter(function(l){ return !restrito || (l.unidade!=="CASA" && !ehExterna(l.func)); });
  var ym = mes.split("-").map(Number), hoje = hojeSP();

  // DUAS TABELAS SEPARADAS, uma colada na outra (Marcus, 24/11/2026: "diminui o tamanho das linhas e cola em baixo a produção de casa separado, para melhor controle"):
  // em cima a produção da EMPRESA (paga por bônus do dia); embaixo a produção de CASA (paga R$ 0,45 por peça). Quem faz as duas aparece nas duas, cada uma com as suas peças.
  // 26/11/2026 (Marcus): TRÊS produções: Sorelly (só anota, não paga), Serenity (meta e bônus; era "Produção da empresa") e Externa (paga por peça). A mesma pessoa pode estar nas três.
  var linhasSor = todas.filter(function(l){ return !eCasa(l) && l.unidade==="SORELLY"; }), linhasEmp = todas.filter(function(l){ return !eCasa(l) && l.unidade!=="SORELLY"; }), linhasCasa = todas.filter(eCasa);
  // TODOS os dias do mês, do 1 ao último (Marcus, 16/11/2026: "cadê os dias 17 em diante?"); domingo e hoje ficam marcados no topo da coluna
  var diasMes = []; for(var d = iv.from; d<=iv.to; d = somaDias(d, 1)) diasMes.push(d);

  // soma por funcionária e dia (nomes iguais sem diferenciar maiúscula e minúscula entram juntos; o nome mostrado é o da grafia com mais peças)
  var rowsDe = function(subLinhas, daCasa, semPag){
    var por = {};
    subLinhas.forEach(function(l){
      var q = Number(l.qtd) || 0, nm = nomeCerto(String(l.func || "").trim()) || "Sem nome", k = nm.toLowerCase(), g = por[k] || (por[k] = {nome:nm, graf:{}, dia:{}, total:0});
      g.graf[nm] = (g.graf[nm] || 0)+q; g.dia[l.dia] = (g.dia[l.dia] || 0)+q; g.total += q;
    });
    return Object.keys(por).map(function(k){
      var g = por[k], melhor = Object.keys(g.graf).sort(function(a, b){ return g.graf[b]-g.graf[a]; })[0];
      // casa: recebe pelas peças (diária até 15/11, R$ 0,45 por peça depois); empresa: bônus por DIA (R$ 15 com 300, R$ 20 com 350, R$ 25 com 400+), somado no mês; quem só faz produção externa não tem bônus
      var bonus = semPag ? "—" : daCasa ? resumoExterna(pr, ym[0], ym[1], melhor).valor : (ehExterna(melhor) ? 0 : Object.keys(g.dia).reduce(function(t, dd){ return t+bonusDoDia(g.dia[dd], melhor); }, 0));
      var r = {id:(semPag ? "s|" : daCasa ? "c|" : "e|")+k, nome:melhor, casa:daCasa, total:g.total, bonus:bonus};
      var somaV = 0;
      diasMes.forEach(function(dd){ r["d"+dd] = g.dia[dd] || 0; var vd = g.dia[dd] && !semPag ? (daCasa ? valorDiaCasa(pr, melhor, dd) : (ehExterna(melhor) ? 0 : bonusDoDia(g.dia[dd], melhor))) : 0; r["v"+dd] = vd; somaV += vd; });   // valor a pagar do dia: casa = diária ou R$ 0,45 por peça; empresa = bônus do dia
      r.totalV = Math.round(somaV*100)/100;
      return r;
    }).sort(function(a, b){ return b.total-a.total; });
  };
  var rowsEmp = rowsDe(linhasEmp, false), rowsCasa = rowsDe(linhasCasa, true), rowsSor = rowsDe(linhasSor, false, true);

  // QUEM FICA FECHADO (Marcus, 18/11/2026), só na tabela da empresa: no mês de hoje, quem não lançou nos últimos 2 dias úteis (sábado e domingo não contam) e não tem bônus no mês some da tela; só abre no botão "+"
  var recentes = []; if(mes===hoje.slice(0, 7)){ for(var q = hoje, guarda = 0; recentes.length<2 && guarda<12; q = somaDias(q, -1), guarda++){ var ds = diaDaSemana(q); if(ds!=="sábado" && ds!=="domingo") recentes.push(q); } }
  var ocultas = recentes.length ? rowsEmp.filter(function(r){ return !recentes.some(function(dd){ return r["d"+dd]>0; }) && !(typeof r.bonus==="number" && r.bonus>0); }) : [];
  var rowsVis = sTodas[0] ? rowsEmp : rowsEmp.filter(function(r){ return ocultas.indexOf(r)<0; });
  var abrir = function(dia, func, nova){ sE[1]({dia:dia, func:func || "", nova:!!nova}); };
  var H18 = "h-[22px]";   // linha baixa (Marcus, 24/11/2026: "diminui o tamanho das linhas")
  var cel = function(dd){ return function(v, r){ return e("span",{role:"button", tabIndex:0, onKeyDown:function(ev){ if(ev.key==="Enter") abrir(dd, r.nome); }, onClick:function(){ abrir(dd, r.nome); }, "aria-label":r.nome+", dia "+dd.slice(8)+": "+(v ? (emReais ? formatarReais(r["v"+dd] || 0) : formatarInteiro(v)+" peças") : "sem lançamento")+". Clique para ver ou alterar", style:{width:"100%", fontSize:"10px", minWidth:0, padding:0}, className:"group flex "+H18+" w-full cursor-pointer items-center justify-center text-[10px] tabular-nums hover:bg-white/10"+(emReais ? ((r["v"+dd] || 0)>0 ? " text-success" : "") : (v>=metaDoDia(r.nome) && !r.casa ? " text-success" : ""))}, v ? (emReais ? ((r["v"+dd] || 0)>0 ? formatarReais(r["v"+dd]) : "—") : String(v)) : dd<=hoje ? "—" : e("span",{className:"opacity-0 group-hover:opacity-60"}, "+")); }; };   // padrao-ok: número do dia em 10 px para caber os 30 dias na tela (Marcus, 22/11/2026)
  var cols = [{k:"nome", t:"Funcionária", w:"8rem", fixa:true, semTopo:true, semFiltro:true}, {k:emReais ? "totalV" : "total", t:"Total", w:"5rem", fixa:"8rem", semTopo:true, semFiltro:true, fmt:emReais ? formatarReais : n0}, {k:"bonus", t:"A receber", w:"5.5rem", fixa:"13rem", semTopo:true, semFiltro:true, fmt:function(v){ return typeof v==="number" ? formatarReais(v) : v; }, cor:function(r){ return r.bonus>0 ? "text-success" : ""; }}]
    .concat(diasMes.map(function(dd){ return {k:"d"+dd, t:dd.slice(8), w:emReais ? "4.6rem" : (80/diasMes.length)+"%", semFiltro:true, render:cel(dd), corTopo:dd===hoje ? "#5BB8FF" : undefined}; }));
  if(restrito) cols = cols.filter(function(c){ return c.k!=="bonus"; });
  // linha de TOTAL no FIM de cada tabela (Marcus, 16/11/2026): soma do mês, bônus e, em cada dia, o total do dia (clicar no total do dia abre o dia inteiro); os totais somam TODAS as linhas da tabela (inclusive as fechadas)
  var totalDe = function(todasLinhas, colsX){ var cs = colsX || cols; return function(ls){ return cs.map(function(c, i){
    if(i===0) return "TOTAL · "+ls.length;
    if(c.k==="total") return formatarInteiro(todasLinhas.reduce(function(t, r){ return t+r.total; }, 0));
    if(c.k==="totalV") return formatarReais(todasLinhas.reduce(function(t, r){ return t+(r.totalV || 0); }, 0));
    if(c.k==="bonus") return formatarReais(todasLinhas.reduce(function(t, r){ return t+(typeof r.bonus==="number" ? r.bonus : 0); }, 0));
    var dd = c.k.slice(1), s = todasLinhas.reduce(function(t, r){ return t+(r[c.k] || 0); }, 0), sv = todasLinhas.reduce(function(t, r){ return t+(r["v"+dd] || 0); }, 0);
    return e("span",{role:"button", tabIndex:0, onKeyDown:function(ev){ if(ev.key==="Enter") abrir(dd, ""); }, onClick:function(){ abrir(dd, ""); }, title:"Abrir o dia inteiro para lançar", style:{width:"100%", fontSize:"10px", minWidth:0, padding:0}, className:"group flex "+H18+" w-full cursor-pointer items-center justify-center text-[10px] tabular-nums hover:text-primary"}, s ? (emReais ? (sv>0 ? formatarReais(Math.round(sv*100)/100) : "—") : String(s)) : dd<=hoje ? "—" : e("span",{className:"opacity-0 group-hover:opacity-60"}, "+"));   // padrao-ok: mesmo 10 px da linha dos dias (Marcus, 22/11/2026)
  }); }; };

  // TRÊS tabelas coladas, num só bloco (Marcus, 26/11/2026): Produção Sorelly (só anota, sem pagamento), Produção Serenity (meta e bônus) e Produção Externa (paga por peça). Os controles ficam na primeira tabela que aparece.
  var verSor = (!unidade || unidade==="SORELLY") && !emReais, verSer = !unidade || unidade==="SERENITY", verCasa = !restrito && (!unidade || unidade==="CASA");
  var colsSor = cols.filter(function(c){ return c.k!=="bonus"; });
  var faixa = function(){ return e(FaixaAzul,null,
        e("label",{className:"flex items-center gap-2 text-[13px] font-semibold text-white"}, "Mês", e("input",{type:"month", value:mes, "aria-label":"Mês", onChange:function(ev){ if(ev.target.value) sM[1](ev.target.value); }, className:CAMPO_FAIXA})),
        grupoBtn([["", "Todas"]].concat(UNIDADES.filter(function(u){ return !restrito || u!=="CASA"; }).map(function(u){ return [u, ROTULO_UNIDADE[u]]; })), unidade, sU[1]),
        !restrito && e(MenuFaixa,{aria:"Mostrar", valor:sMod[0], larg:"w-28", grupos:[{t:"", itens:[["pecas", "Peças"], ["din", "Dinheiro"]]}], onChange:function(v){ sMod[1](v); }}),   // só a Diretoria vê dinheiro
        e("span",{className:"flex-1"}),
        ocultas.length>0 && verSer && e(BtFaixa,{titulo:sTodas[0] ? "Fecha de novo quem não lançou nos últimos 2 dias úteis" : "Mostra quem não lançou nos últimos 2 dias úteis e não tem bônus no mês", onClick:function(){ sTodas[1](!sTodas[0]); }}, sTodas[0] ? "− "+ocultas.length : "+ "+ocultas.length),
        e(BtFaixa,{titulo:"Abre a janela de lançamento no dia de hoje, já com uma linha nova para digitar", onClick:function(){ abrir(hojeSP(), "", true); }}, "+ Adicionar lançamento")); };
  // Cada bloco tem a sua borda e a sua tabela de 5 linhas com rolagem por dentro; o botão Expandir mostra todas. O TOTAL fica fixo embaixo (Marcus, 26/11/2026).
  var bloco = function(ch, titulo, rows, colsX, totalRows, vazio, extra){
    var ex = !!sExp[0][ch], atual = sExp[0];
    return e(BlocoPainel,{key:ch, titulo:titulo+" · "+nomeMes(ym[0], ym[1]), compacto:true, acao:rows.length>5 ? e("button",{type:"button", onClick:function(){ var n = Object.assign({}, atual); n[ch] = !ex; sExp[1](n); }, "aria-label":ex ? "Recolher a tabela" : "Expandir a tabela", title:ex ? "Volta a mostrar só 5 linhas" : "Mostra todas as linhas", className:"h-[18px] cursor-pointer rounded border border-white/60 px-2 text-[10px] font-semibold text-white hover:bg-white/10"}, ex ? "Recolher" : "Expandir") : null},
      e(TabelaPlanilha,{key:ch+mes+unidade+sMod[0]+(ex ? "x" : "r")+(extra || ""), alturaMax:ex ? undefined : "164px", fina:true, cols:colsX, linhas:rows, chave:"id", grade:true, barraFina:true, semContagem:true, semLimpar:true, totalRodape:totalDe(totalRows, colsX), vazio:vazio}));
  };
  // Produção geral diária: uma linha por produção e o TOTAL de todas por dia (Marcus, 26/11/2026)
  var somaGrupo = function(id, nome, rs){ var r = {id:id, nome:nome, casa:false, total:0, bonus:"—", totalV:0}; diasMes.forEach(function(dd){ r["d"+dd] = 0; r["v"+dd] = 0; }); rs.forEach(function(x){ r.total += x.total; r.totalV += (x.totalV || 0); diasMes.forEach(function(dd){ r["d"+dd] += x["d"+dd] || 0; r["v"+dd] += x["v"+dd] || 0; }); }); r.totalV = Math.round(r.totalV*100)/100; return r; };
  var rowsGer = [somaGrupo("g|sor", "Interna", rowsSor), somaGrupo("g|ser", "Serenity", rowsEmp), somaGrupo("g|ext", "Externa", rowsCasa)].filter(function(r, i){ return [verSor, verSer, verCasa][i]; });
  var colsGer = colsSor.map(function(c, i){ if(i===0) return Object.assign({}, c, {t:"Produção"}); if(!c.render) return c; var dd = c.k.slice(1); return Object.assign({}, c, {render:function(v, r){ return e("span",{className:"whitespace-nowrap text-[10px] tabular-nums"}, emReais ? ((r["v"+dd] || 0)>0 ? formatarReais(r["v"+dd]) : "—") : (v ? String(v) : "—")); }}); });
  return e(Raiz,{cls:MIUDA+" !bg-[var(--bloco-colunas)] [&_div_section]:!border-2 [&_div_section]:!border-white [&_section_tfoot_td]:!bg-[var(--bloco-colunas)]"},
    e("div",{key:"tres", className:"flex min-w-0 flex-col gap-0 bg-[var(--bloco-colunas)]"},
    e("h1",{key:"tit", className:"bg-[var(--bloco-colunas)] py-1.5 text-center text-[20px] font-bold leading-tight text-white"}, "PRODUÇÃO SORELLY"),   // padrao-ok: título maior no topo, pedido do Marcus (26/11/2026)
    e("div",{key:"filtro", className:"overflow-hidden border-2 border-white"}, faixa()),
    verSor && bloco("sor", "Produção interna", rowsSor, colsSor, rowsSor, "Nenhuma produção interna lançada neste mês."),
    verSer && bloco("ser", "Produção Serenity", rowsVis, cols, rowsEmp, "Nenhuma produção Serenity lançada neste mês.", sTodas[0] ? "t" : "f"),
    verCasa && bloco("casa", "Produção Externa", rowsCasa, cols, rowsCasa, "Nenhuma produção externa neste mês."),
    e(BlocoPainel,{key:"ger", titulo:"Produção geral diária · "+nomeMes(ym[0], ym[1]), compacto:true},
      e(TabelaPlanilha,{key:"ger"+mes+unidade+sMod[0], fina:true, cols:colsGer, linhas:rowsGer, chave:"id", grade:true, barraFina:true, semContagem:true, semLimpar:true, totalRodape:function(){ return colsGer.map(function(c, i){ if(i===0) return "TOTAL GERAL"; if(c.k==="total") return formatarInteiro(rowsGer.reduce(function(s2, r){ return s2+r.total; }, 0)); if(c.k==="totalV") return formatarReais(rowsGer.reduce(function(s2, r){ return s2+r.totalV; }, 0)); var s3 = rowsGer.reduce(function(s2, r){ return s2+(r[c.k] || 0); }, 0), dd = c.k.slice(1), sv = rowsGer.reduce(function(s2, r){ return s2+(r["v"+dd] || 0); }, 0); return emReais ? (sv>0 ? formatarReais(Math.round(sv*100)/100) : "—") : (s3 ? String(s3) : "—"); }); }, vazio:"Nenhuma produção neste mês."}))),
    e(ProdModelos,{key:"modelos"}),   // embaixo da grade: o que foi produzido por modelo, com custo e valor (só diretoria)
    editor && e(EditorDia,{key:editor.dia+"|"+editor.func+"|"+editor.nova, dia:editor.dia, func:editor.func, nova:editor.nova, aoFechar:function(){ sE[1](null); }}));
}
export { AbaProdGrade };

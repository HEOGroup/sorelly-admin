// Sorelly Admin · montagem — pages/rh/SalarioVisao.js
// RH › Colaboradores, visão "Salário e bônus" (17/11/2026, pedido do Marcus): uma pessoa por linha, mês a mês.
// Sub-visão Remuneração: salário base (vem do Cadastro › Pessoal), bônus, comissão, adicionais, benefícios, descontos e total do mês (soma automática).
// Sub-visão Pagamentos: o recebimento SEPARADO em dois dias: adiantamento no dia 20 e salário (o que sobra) no 5º dia útil, cada um com a data prevista, o valor pago e o dia em que foi pago.
// Regra de datas: o mês escolhido é o mês em que o dinheiro é PAGO. Adiantamento: dia 20 do mês. Salário: 5º dia útil do mês (segunda a sábado, sem os feriados do Configurador do RH). O sábado conta porque o Financeiro mostra o salário pago no dia 06 em outubro e em novembro de 2026, o que só bate assim. A confirmar com o Marcus.
// Os valores ficam em rh.pagamentos[AAAA-MM][idDaPessoa] (ação RH pag_set em domain/rh.js). Entram à mão por enquanto. Só quem vê salário (diretoria e RH) abre esta visão.
import { Avatar } from "@/apps/montagem/components/chat/chat-ui";
import { FichaCaixa, FichaMoldura, FichaPar } from "@/apps/montagem/components/ficha-moldura";
import React from "react";
import { Janela } from "@/apps/montagem/components/padrao";
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { chamar } from "@/apps/montagem/lib/api";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { CNPJ_COR, DIAS_SEMANA, MESES, br, colaboradoresRh, dataIso, diaSem, hojeIso, rotuloCnpj, ultimoDia } from "@/apps/montagem/domain/rh";
import { BKC as BK } from "@/apps/montagem/lib/format";
import { CampoDin, CampoTexto } from "@/apps/montagem/pages/trafego/comum";
import { e, useState } from "@/shared/react";

var ITENS = [["bonus", "Bônus"], ["comissao", "Comissão"], ["adicionais", "Adicionais"], ["beneficios", "Benefícios"], ["descontos", "Descontos"]];
var num = function(v){ var n = Number(v); return isFinite(n) && n>0 ? Math.round(n*100)/100 : 0; };
var chaveMes = function(esc){ return esc.ano+"-"+String(esc.mes).padStart(2, "0"); };
var doMes = function(c, mes, id){ var m = (c.rh.pagamentos && c.rh.pagamentos[mes]) || {}; return m[id] || {}; };
var totalDe = function(salario, o){ return Math.round((num(salario)+num(o.bonus)+num(o.comissao)+num(o.adicionais)+num(o.beneficios)-num(o.descontos))*100)/100; };
var rhOp = function(c, op, extra){ c.d(Object.assign({type:"RH", op:op, por:c.por}, extra)); };
var salarioDe = function(x){ return Number(x.salario)||0; };
var din = function(v){ return v ? BK(v) : ""; };
var dataTxt = function(iso){ return iso ? br(iso)+" · "+DIAS_SEMANA[diaSem(iso)].toLowerCase() : "—"; };

// ---------- datas do pagamento ----------
// 5º dia útil do mês (segunda a sábado, fora os feriados cadastrados no Configurador do RH)
function quintoDiaUtil(c, ano, mes){
  var fer = {}; ((c.rh.config && c.rh.config.feriados) || []).forEach(function(f){ fer[f.data] = 1; });
  var n = 0, ult = ultimoDia(ano, mes);
  for(var d = 1; d<=ult; d++){ var iso = dataIso(ano, mes, d), w = diaSem(iso); if(w!==0 && !fer[iso]){ n++; if(n===5) return iso; } }
  return "";
}
// no mês escolhido: adiantamento no dia 20 e salário no 5º dia útil
function datasDoMes(c, esc){ return {adiant:dataIso(esc.ano, esc.mes, 20), salario:quintoDiaUtil(c, esc.ano, esc.mes)}; }
// situação de cada pessoa no mês: o que já foi pago e o que está atrasado
function situacaoDe(o, datas, hoje){
  var adOk = num(o.advValor)>0 && !!o.advData, saOk = num(o.salValor)>0 && !!o.salData;
  if(adOk && saOk) return "Pago";
  if((!adOk && datas.adiant<hoje) || (!saOk && datas.salario && datas.salario<hoje)) return "Atrasado";
  return adOk || saOk ? "Parcial" : "Pendente";
}
var COR_SIT = {Pago:"text-emerald-400", Parcial:"text-amber-400", Pendente:"", Atrasado:"text-red-400"};

function salDados(c, esc, sub){
  var mes = chaveMes(esc), datas = datasDoMes(c, esc), hoje = hojeIso(), ativos = colaboradoresRh(c.s).filter(function(x){ return x.status!=="DESLIGADO"; });
  var linhas = ativos.map(function(x){ var o = doMes(c, mes, x.id), sal = salarioDe(x), total = totalDe(sal, o), ad = num(o.advValor);
    return {id:x.id, nome:x.nome, setor:x.setor, salario:sal, bonus:num(o.bonus), comissao:num(o.comissao), adicionais:num(o.adicionais), beneficios:num(o.beneficios), descontos:num(o.descontos), total:total, obs:o.obs || "",
      advPrev:datas.adiant, advValor:ad, advData:o.advData || "", salPrev:datas.salario, salValor:num(o.salValor), salData:o.salData || "", sit:situacaoDe(o, datas, hoje)}; })
    .sort(function(a, b){ return a.nome.localeCompare(b.nome, "pt-BR"); });
  var soma = function(ls, k){ return ls.reduce(function(t, x){ return t+(x[k]||0); }, 0); };
  if(sub==="pag"){
    var cols = [{k:"nome", t:"Nome"}, {k:"setor", t:"Setor"}, {k:"total", t:"Total do mês", fmt:din},
      {k:"advPrev", t:"Adiantamento · previsto para o dia 20", fmt:dataTxt}, {k:"advValor", t:"Adiantamento · valor pago", fmt:din}, {k:"advData", t:"Adiantamento · pago em", fmt:dataTxt},
      {k:"salPrev", t:"Salário · previsto para o 5º dia útil", fmt:dataTxt}, {k:"salValor", t:"Salário · valor pago", fmt:din}, {k:"salData", t:"Salário · pago em", fmt:dataTxt},
      {k:"sit", t:"Situação", cor:function(l){ return COR_SIT[l.sit] || ""; }}];
    return {cols:cols, linhas:linhas, totalLinha:function(ls){ return ["Total", ls.length+" pessoas", din(soma(ls, "total")), "", din(soma(ls, "advValor")), "", "", din(soma(ls, "salValor")), "", ""]; }, datas:datas};
  }
  var cols2 = [{k:"nome", t:"Nome"}, {k:"setor", t:"Setor"}, {k:"salario", t:"Salário base", fmt:din}, {k:"bonus", t:"Bônus", fmt:din}, {k:"comissao", t:"Comissão", fmt:din}, {k:"adicionais", t:"Adicionais", fmt:din}, {k:"beneficios", t:"Benefícios", fmt:din}, {k:"descontos", t:"Descontos", fmt:din, cor:function(l){ return l.descontos ? "text-red-400" : ""; }},
    {k:"total", t:"Total do mês", fmt:din, cor:function(){ return "text-emerald-400"; }}, {k:"obs", t:"Observação"}];
  return {cols:cols2, linhas:linhas, totalLinha:function(ls){ return ["Total", ls.length+" pessoas", din(soma(ls, "salario")), din(soma(ls, "bonus")), din(soma(ls, "comissao")), din(soma(ls, "adicionais")), din(soma(ls, "beneficios")), din(soma(ls, "descontos")), din(soma(ls, "total")), ""]; }, datas:datas};
}

// ---------- card da pessoa ----------
function SalCard(pp){
  var c = pp.c, esc = pp.esc, mes = chaveMes(esc), x = colaboradoresRh(c.s).find(function(y){ return y.id===pp.id; });
  var salvo = x ? doMes(c, mes, x.id) : {}, st = useState(null), d = st[0], setD = st[1], st2 = useState(null), p = st2[0], setP = st2[1];
  if(!x) return null;
  var datas = datasDoMes(c, esc), hoje = hojeIso();
  var edR = d!==null, val = edR ? d : {bonus:salvo.bonus||null, comissao:salvo.comissao||null, adicionais:salvo.adicionais||null, beneficios:salvo.beneficios||null, descontos:salvo.descontos||null, obs:salvo.obs||""};
  var edP = p!==null, pag = edP ? p : {advValor:salvo.advValor||null, advData:salvo.advData||"", salValor:salvo.salValor||null, salData:salvo.salData||""};
  var sal = salarioDe(x), total = totalDe(sal, val), titulo = MESES[esc.mes-1]+" de "+esc.ano;
  var setV = function(k, v){ var o = Object.assign({}, val); o[k] = v; setD(o); };
  var setPg = function(k, v){ var o = Object.assign({}, pag); o[k] = v; setP(o); };
  var salvarR = function(){ var patch = {obs:String(val.obs||"").trim()}; ITENS.forEach(function(i){ patch[i[0]] = num(val[i[0]]) || null; }); rhOp(c, "pag_set", {mes:mes, id:x.id, patch:patch}); setD(null); };
  var salvarP = function(){ rhOp(c, "pag_set", {mes:mes, id:x.id, patch:{advValor:num(pag.advValor) || null, advData:pag.advData || "", salValor:num(pag.salValor) || null, salData:pag.salData || ""}}); setP(null); };
  var botaoEd = function(ligado, abre){ return !ligado && e("button",{type:"button", onClick:abre, className:"h-5 rounded border border-white/45 bg-white/10 px-2 text-[11px] font-normal normal-case leading-none tracking-normal hover:bg-white/25"}, "Editar"); };
  var rodBloco = function(salvar, cancelar){ return e("div",{className:"flex justify-end gap-2 border-t border-white/20 pt-2"}, e(Botao,{onClick:cancelar}, "Cancelar"), e(Botao,{principal:true, onClick:salvar}, "Salvar")); };
  var campoData = function(rot, k, valor){ return e(CampoTexto,{t:rot, id:"sal-"+k, tipo:"date", value:valor || "", onChange:function(v){ setPg(k, v); }}); };
  var corpoR = edR ? e("div",{className:"flex flex-col gap-2"}, e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-5"},
      ITENS.map(function(i){ return e(CampoDin,{key:i[0], t:i[1], id:"sal-"+i[0], value:val[i[0]] ? Number(val[i[0]]) : null, onChange:function(v){ setV(i[0], v==="" || v===null ? null : Number(v)); }}); })),
      e(CampoTexto,{t:"Observação", id:"sal-obs", value:val.obs || "", onChange:function(v){ setV("obs", v); }}), rodBloco(salvarR, function(){ setD(null); }))
    : e("div",{className:"flex flex-col"}, e(FichaPar,{t:"Salário base (do Cadastro)", v:sal ? BK(sal) : "—"}), ITENS.map(function(i){ return e(FichaPar,{key:i[0], t:i[1], v:num(val[i[0]]) ? BK(num(val[i[0]])) : "—", cor:i[0]==="descontos" && num(val[i[0]]) ? "text-red-400" : ""}); }), val.obs && e(FichaPar,{t:"Observação", v:val.obs}),
      e(FichaPar,{t:"Total do mês", v:BK(total), cor:"text-emerald-400"}));
  var atraso = function(prev, ok){ return !ok && prev && prev<hoje ? "text-red-400" : ""; };
  var adOk = num(pag.advValor)>0 && !!pag.advData, saOk = num(pag.salValor)>0 && !!pag.salData;
  var corpoP = edP ? e("div",{className:"flex flex-col gap-2"}, e("div",{className:"grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2"},
      e("div",{className:"flex flex-col gap-2"}, e("span",{className:"text-[11px] font-semibold uppercase"}, "Adiantamento · previsto "+dataTxt(datas.adiant)), e(CampoDin,{t:"Valor pago", id:"sal-advValor", value:pag.advValor ? Number(pag.advValor) : null, onChange:function(v){ setPg("advValor", v==="" || v===null ? null : Number(v)); }}), campoData("Pago em", "advData", pag.advData)),
      e("div",{className:"flex flex-col gap-2"}, e("span",{className:"text-[11px] font-semibold uppercase"}, "Salário · previsto "+dataTxt(datas.salario)), e(CampoDin,{t:"Valor pago", id:"sal-salValor", value:pag.salValor ? Number(pag.salValor) : null, onChange:function(v){ setPg("salValor", v==="" || v===null ? null : Number(v)); }}), campoData("Pago em", "salData", pag.salData))),
      rodBloco(salvarP, function(){ setP(null); }))
    : e("div",{className:"grid grid-cols-1 gap-x-6 md:grid-cols-2"},
      e("div",{className:"flex flex-col"}, e("span",{className:"pb-1 text-[11px] font-semibold uppercase"}, "Adiantamento (dia 20)"), e(FichaPar,{t:"Previsto para", v:dataTxt(datas.adiant)}), e(FichaPar,{t:"Valor pago", v:num(pag.advValor) ? BK(num(pag.advValor)) : "—"}), e(FichaPar,{t:"Pago em", v:pag.advData ? dataTxt(pag.advData) : "—", cor:atraso(datas.adiant, adOk)}), e(FichaPar,{t:"Situação", v:adOk ? "Pago" : (datas.adiant<hoje ? "Atrasado" : "Pendente"), cor:adOk ? "text-emerald-400" : atraso(datas.adiant, adOk)})),
      e("div",{className:"flex flex-col"}, e("span",{className:"pb-1 text-[11px] font-semibold uppercase"}, "Salário (5º dia útil)"), e(FichaPar,{t:"Previsto para", v:dataTxt(datas.salario)}), e(FichaPar,{t:"Valor pago", v:num(pag.salValor) ? BK(num(pag.salValor)) : "—"}), e(FichaPar,{t:"Pago em", v:pag.salData ? dataTxt(pag.salData) : "—", cor:atraso(datas.salario, saOk)}), e(FichaPar,{t:"Situação", v:saOk ? "Pago" : (datas.salario && datas.salario<hoje ? "Atrasado" : "Pendente"), cor:saOk ? "text-emerald-400" : atraso(datas.salario, saOk)})));
  var todos = c.rh.pagamentos || {}, hist = Object.keys(todos).filter(function(m){ return todos[m] && todos[m][x.id]; }).sort().reverse().map(function(m){ var o = todos[m][x.id], t2 = totalDe(sal, o); return {id:m, mes:MESES[Number(m.slice(5, 7))-1]+" de "+m.slice(0, 4), total:t2, advValor:num(o.advValor), advData:o.advData || "", salValor:num(o.salValor), salData:o.salData || ""}; });
  var esquerda = e(FichaCaixa,{key:"p", t:"Colaboradora"}, e("div",{className:"flex flex-col gap-2"}, e("div",{className:"grid place-items-center"}, e(Avatar,{id:"f_"+String(x.id).replace(/-/g, ""), nome:x.nome, s:160})),
    e("div",{className:"flex flex-col"}, e(FichaPar,{t:"Nome", v:x.nome}), e(FichaPar,{t:"Setor", v:x.setor}), e(FichaPar,{t:"Função", v:x.funcao || "—"}), e(FichaPar,{t:"Empresa", v:e("span",{style:{color:CNPJ_COR[x.cnpj] || "#E2E8F0"}}, rotuloCnpj(x.cnpj))}))));
  var direita = [e(FichaCaixa,{key:"r", t:"Remuneração · "+titulo, dir:botaoEd(edR, function(){ setD(Object.assign({}, val)); })}, corpoR),
    e(FichaCaixa,{key:"pg", t:"Pagamentos de "+titulo+" · adiantamento no dia 20 e salário no 5º dia útil", dir:botaoEd(edP, function(){ setP(Object.assign({}, pag)); })}, corpoP),
    e(FichaCaixa,{key:"h", t:"Meses lançados"}, e(TabelaPlanilha,{cols:[{k:"mes", t:"Mês"}, {k:"total", t:"Total do mês", fmt:din}, {k:"advValor", t:"Adiantamento pago", fmt:din}, {k:"advData", t:"Pago em", fmt:dataTxt}, {k:"salValor", t:"Salário pago", fmt:din}, {k:"salData", t:"Pago em", fmt:dataTxt}],
      linhas:hist, chave:"id", escura:true, grade:true, semContagem:true, semLimpar:true, semMao:true, limite:100, vazio:"Nenhum mês lançado ainda."}))];
  return e(FichaMoldura,{t:"Salário e bônus · "+x.nome, largo:true, fechar:pp.fechar, esquerda:esquerda, direita:direita, rodape:[e(Botao,{key:"f", principal:true, onClick:pp.fechar}, "Fechar")]});
}
// ---------- Puxar do Financeiro: lê as contas PAGAS do mês (DevMaster, só leitura) e mostra a prévia antes de gravar ----------
var NAT = {"3.01.01.02":"sal", "3.01.01.11":"adiant", "3.01.01.12":"bonus", "3.01.01.21":"bonus", "3.01.01.01":"benef", "3.01.01.05":"benef"};
var NAT_NOME = {sal:"Salário (5º dia útil)", adiant:"Adiantamento (dia 20)", bonus:"Bônus", benef:"Benefícios (vale alimentação e transporte)"};
var norm = function(s){ return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim(); };
function planoDoMes(c, esc, pagas){
  var mes = chaveMes(esc), colabs = colaboradoresRh(c.s).map(function(x){ return {id:x.id, nome:x.nome, n:norm(x.nome)}; }), por = {}, sem = [], total = {sal:0, adiant:0, bonus:0, benef:0};
  pagas.forEach(function(p){ var tipo = NAT[String(p[1])]; if(!tipo || String(p[8]).slice(0, 7)!==mes) return;
    var nome = norm(p[7]).replace(/^(pix|ted|dinheiro)\s+/, ""), valor = Number(p[10]) || 0, dia = String(p[8]).slice(0, 10);
    var achou = colabs.filter(function(x){ return x.n===nome; }); if(!achou.length) achou = colabs.filter(function(x){ return nome.length>6 && (x.n.indexOf(nome)>=0 || nome.indexOf(x.n)>=0); });
    if(achou.length!==1){ sem.push({nome:String(p[7]), tipo:tipo, valor:valor}); return; }
    var o = por[achou[0].id] = por[achou[0].id] || {id:achou[0].id, nome:achou[0].nome, advValor:0, advData:"", salValor:0, salData:"", bonus:0, beneficios:0};
    total[tipo] += valor;
    if(tipo==="sal"){ o.salValor += valor; if(dia>o.salData) o.salData = dia; }
    else if(tipo==="adiant"){ o.advValor += valor; if(dia>o.advData) o.advData = dia; }
    else if(tipo==="bonus") o.bonus += valor; else o.beneficios += valor; });
  return {pessoas:Object.keys(por).map(function(k){ return por[k]; }).sort(function(a, b){ return a.nome.localeCompare(b.nome, "pt-BR"); }), sem:sem, total:total, mes:mes};
}
// meses a puxar: só o escolhido, ou do começo do ano até o escolhido
function mesesAte(esc, todos){ var ini = todos ? 1 : esc.mes, l = []; for(var m = ini; m<=esc.mes; m++) l.push({ano:esc.ano, mes:m}); return l; }
function patchDe(o){ var patch = {}; if(o.salValor){ patch.salValor = Math.round(o.salValor*100)/100; patch.salData = o.salData; } if(o.advValor){ patch.advValor = Math.round(o.advValor*100)/100; patch.advData = o.advData; } if(o.bonus) patch.bonus = Math.round(o.bonus*100)/100; if(o.beneficios) patch.beneficios = Math.round(o.beneficios*100)/100; return patch; }
function SalImportar(pp){
  var c = pp.c, esc = pp.esc, st = useState({fase:"lendo", pagas:null, erro:""}), s = st[0], setS = st[1], gv = useState(false), gravado = gv[0], setGravado = gv[1], td = useState(false), todos = td[0], setTodos = td[1];
  React.useEffect(function(){ chamar("GET", "/contas-dm").then(function(r){ setS({fase:"pronto", pagas:r.pagas || [], erro:""}); }, function(x){ setS({fase:"erro", pagas:null, erro:String((x && x.message) || x || "Não foi possível ler o Financeiro.")}); }); }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  var meses = mesesAte(esc, todos), planos = s.pagas ? meses.map(function(m){ return planoDoMes(c, m, s.pagas); }) : [], titulo = todos ? "janeiro a "+MESES[esc.mes-1]+" de "+esc.ano : MESES[esc.mes-1]+" de "+esc.ano;
  var soma = function(f){ return planos.reduce(function(t2, p){ return t2+f(p); }, 0); }, totalPessoas = soma(function(p){ return p.pessoas.length; }), totalSem = soma(function(p){ return p.sem.length; }), valorSem = soma(function(p){ return p.sem.reduce(function(t2, x){ return t2+x.valor; }, 0); });
  var gravar = function(){ var itens = []; planos.forEach(function(p){ p.pessoas.forEach(function(o){ var patch = patchDe(o); if(Object.keys(patch).length) itens.push({mes:p.mes, id:o.id, patch:patch}); }); }); rhOp(c, "pag_lote", {itens:itens}); setGravado(true); };
  var linhas = planos.map(function(p, i){ return {id:p.mes, mes:MESES[meses[i].mes-1]+" de "+meses[i].ano, pessoas:p.pessoas.length, sal:p.total.sal, adiant:p.total.adiant, bonus:p.total.bonus, benef:p.total.benef, sem:p.sem.length}; });
  var corpo = s.fase==="lendo" ? e("span",{className:"text-[13px]"}, "Lendo as contas pagas no Financeiro…")
    : s.fase==="erro" ? e("div",{className:"flex flex-col gap-1 text-[13px]"}, e("span",null, "Não consegui ler o Financeiro."), e("span",{className:"text-amber-400"}, s.erro), e("span",null, "Só a diretoria e o Financeiro leem as contas pagas."))
    : e("div",{className:"flex flex-col gap-2"}, e("div",{className:"flex flex-wrap items-center gap-2"}, e("span",{className:"text-[11px] font-semibold uppercase"}, "Período"), e(SegAzulJ,{opcoes:[["mes", MESES[esc.mes-1]+" de "+esc.ano], ["ano", "Janeiro a "+MESES[esc.mes-1]+" de "+esc.ano]], atual:todos ? "ano" : "mes", onMudar:function(v){ setTodos(v==="ano"); setGravado(false); }})),
      e("span",{className:"text-[13px]"}, "Contas pagas de "+titulo+" encontradas no Financeiro. A natureza Salário entra como salário do 5º dia útil e a natureza Adiantamento, como adiantamento do dia 20. Ao gravar, o valor pago, o dia, o bônus e os benefícios de cada pessoa nesses meses são substituídos pelos do Financeiro. Comissão, adicionais, descontos e observação ficam como estão."),
      e(TabelaPlanilha,{cols:[{k:"mes", t:"Mês"}, {k:"pessoas", t:"Pessoas"}, {k:"sal", t:"Salário (5º dia útil)", fmt:din}, {k:"adiant", t:"Adiantamento (dia 20)", fmt:din}, {k:"bonus", t:"Bônus", fmt:din}, {k:"benef", t:"Benefícios", fmt:din}, {k:"sem", t:"Sem pessoa no cadastro"}], linhas:linhas, chave:"id", escura:true, grade:true, semContagem:true, semLimpar:true, semMao:true, limite:24, vazio:"Nada encontrado."}),
      e(FichaPar,{t:"Lançamentos de pessoas a gravar", v:String(totalPessoas)}), e(FichaPar,{t:"Pagamentos sem pessoa correspondente no cadastro (não entram)", v:totalSem+" · "+BK(valorSem), cor:totalSem ? "text-amber-400" : ""}),
      gravado && e("span",{className:"text-[13px] text-emerald-400"}, "Gravado: "+titulo+"."));
  return e(Janela,{t:"Puxar do Financeiro · "+titulo, sub:"Leitura das contas pagas. Nada muda antes de você gravar.", fechar:pp.fechar, colunas:[e("div",{key:"corpo"}, corpo)],
    rodape:[e(Botao,{key:"c", onClick:pp.fechar}, gravado ? "Fechar" : "Cancelar"), s.pagas && !gravado && e(Botao,{key:"g", principal:true, desabilitado:!totalPessoas, onClick:gravar}, todos ? "Gravar os meses" : "Gravar no mês")]});
}
function SegAzulJ(p){ return e("div",{role:"group", className:"inline-flex overflow-hidden rounded-md border border-white/30"}, p.opcoes.map(function(o, i){ var on = o[0]===p.atual; return e("button",{key:o[0], type:"button", "aria-pressed":on, onClick:function(){ p.onMudar(o[0]); }, className:"h-8 whitespace-nowrap px-3 text-[13px] "+(i ? "border-l border-white/30 " : "")+(on ? "bg-white text-[#1f3a75]" : "bg-white/15 text-white hover:bg-white/25")}, o[1]); })); }
function SalJanelas(pp){ return pp.pessoa ? e(SalCard,{c:pp.c, esc:pp.esc, id:pp.pessoa, fechar:pp.fecharPessoa}) : null; }

export { salDados, SalJanelas, SalImportar, planoDoMes };

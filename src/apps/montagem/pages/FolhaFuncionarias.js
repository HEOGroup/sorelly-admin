// Sorelly Admin · montagem — pages/FolhaFuncionarias.js
// Contas a pagar → "Funcionários e representantes" (menu do topo). Duas partes: Funcionários (salário base do RH, salário + adiantamento, VR, VT, 13º, bônus, hora extra do RH, negociação de cada um) e Representantes (comissão do consignado + combustível).
// Só a supervisão vê (tem salário). Dados: contas da folha do DevMaster (domain/contas-empresa.js) + cadastro e horas extras do RH (domain/rh.js).
// INSS e IRRF por funcionária NÃO existem no sistema (o DevMaster só tem a guia total): vêm do holerite, que o RH precisa mandar. Ver docs/negocio/RELATORIO-DE-CUSTOS.md.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Abas, Faixa, Indicador, Pagina, Tab, Td, LINHA, ESTADO } from "@/apps/montagem/components/padrao";
import { G, NEGOCIACOES, filtrar, itensEmpresa, meses, setClasse, setBaixas, setLancamentos, setPf, totais } from "@/apps/montagem/domain/contas-empresa";
import { grupoDe } from "@/apps/montagem/domain/equipe";
import { hojeYm, nomeMes } from "@/apps/montagem/domain/financeiro-familiar";
import { REMUNERACAO } from "@/apps/montagem/domain/remuneracao";
import { colaboradoresRh, formatHoras, valorHoraExtra } from "@/apps/montagem/domain/rh";
import { BKC as BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { INPUT } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var TabN = function(p){ return e(Tab, Object.assign({normal:true}, p)); };
var IndicadorN = function(p){ return e(Indicador, Object.assign({normal:true}, p)); };
var LARANJA = "#F97316";
var AZUL = "#3B82F6";
var COR_SAL = "#60A5FA";   // cor do salário (adiantamento + salário)
var r2 = function(n){ return Math.round((n||0)*100)/100; };
var sa = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\d+/g, "").replace(/\s+/g, " ").trim(); };
var br = function(iso){ return iso ? iso.split("-").reverse().join("/") : "—"; };
var nomeLimpo = function(n){ return String(n).replace(/^pix\s+/i, "").replace(/\s+·.*$/, "").replace(/\s+\d+$/, "").trim(); };
// o que é cada conta, na ordem em que aparece
var TIPOS = [["3.01.01.02", "Salário"], ["3.01.01.11", "Adiantamento"], ["3.01.01.01", "VR (vale alimentação)"], ["3.01.01.05", "VT (vale transporte)"], ["3.01.01.16", "13º salário"]];
var tipoDe = function(i){ var t = TIPOS.find(function(x){ return x[0]===i.nat; }); return t ? t[1] : i.natNome; };
var ordemTipo = function(i){ var k = TIPOS.findIndex(function(x){ return x[0]===i.nat; }); return k<0 ? 9 : k; };

var remDe = function(k){ if(REMUNERACAO[k]) return REMUNERACAO[k]; var ks = Object.keys(REMUNERACAO); for(var i = 0; i<ks.length; i++) if((REMUNERACAO[ks[i]].apelidos || []).indexOf(k)>=0) return REMUNERACAO[ks[i]]; return null; };
function acharColab(colabs, nome){
  var k = sa(nome), exato = colabs.find(function(c){ return sa(c.nome)===k; }); if(exato) return exato;
  var w = k.split(" "), mesmos = colabs.filter(function(c){ return sa(c.nome).split(" ")[0]===w[0]; });
  var ach = mesmos.filter(function(c){ var v = sa(c.nome).split(" "); return w.slice(1).some(function(t){ return t.length>3 && v.indexOf(t)>0; }); });
  return ach.length===1 ? ach[0] : mesmos.length===1 ? mesmos[0] : null;
}

// negociação combinada com a pessoa (ex.: bônus do Nickolas): motivo, regra, cada parcela e quanto falta
function Negociacao(p){
  var n = NEGOCIACOES[p.chave]; if(!n) return null;
  var parcelas = itensEmpresa().filter(function(i){ return sa(nomeLimpo(i.nome))===p.chave && n.filtro.test(i.nome) && String(i.venc).slice(0,7)===p.mes; }).sort(function(a, b){ return (a.venc||"").localeCompare(b.venc||""); });
  if(!parcelas.length) return null;
  var tot = r2(parcelas.reduce(function(t, i){ return t+i.valor; }, 0)), pago = r2(parcelas.filter(function(i){ return i.status==="pago"; }).reduce(function(t, i){ return t+i.valor; }, 0));
  return e("tr",{key:"neg|"+p.chave}, e("td",{colSpan:p.colunas, className:"bg-[#B8892B]/10 p-3 text-left"},
    e("div",{className:"text-[13px] font-bold"}, "Negociação · "+n.titulo),
    e("div",{className:"text-[12px] text-white/75"}, "Motivo: "+n.motivo+" · "+n.regra),
    e("div",{className:"mt-2 flex flex-wrap gap-2"}, parcelas.map(function(i){ var ok = i.status==="pago"; return e("span",{key:i.id, className:"rounded-lg px-2.5 py-1 text-[12px] font-bold", style:{background:(ok ? ESTADO.ok : ESTADO.ruim)+"22", color:ok ? ESTADO.ok : ESTADO.ruim}}, br(i.venc)+" · "+BK(i.valor)+" · "+(ok ? "pago"+(/DIN/.test(i.pref) ? " em dinheiro" : "") : "pendente")); })),
    e("div",{className:"mt-2 text-[12.5px] text-white/85"}, "Neste mês "+BK(tot)+" · ", e("span",{style:{color:ESTADO.ok}}, "Pago "+BK(pago)), " · ", e("span",{style:{color:ESTADO.ruim}}, "Falta pagar "+BK(r2(tot-pago)))),
    n.nota && e("div",{className:"text-[12px] text-white/60"}, n.nota)));
}

// remuneração mês a mês (holerite resumido) de quem o RH já mandou; primeiro exemplo: Edna
function Remuneracao(p){
  var d = remDe(p.chave); if(!d) return null;
  var MES = {"01":"Janeiro","02":"Fevereiro","03":"Março","04":"Abril","05":"Maio","06":"Junho","07":"Julho","08":"Agosto","09":"Setembro","10":"Outubro","11":"Novembro","12":"Dezembro"};
  var min = function(h){ var m = /^(\d+):(\d+)$/.exec(h||""); return m ? Number(m[1])*60+Number(m[2]) : 0; }, fh = function(t){ return String(Math.floor(t/60)).padStart(2,"0")+":"+String(t%60).padStart(2,"0"); };
  var soma = function(k){ return r2(d.meses.reduce(function(t, m){ return t+(m[k]||0); }, 0)); }, dinh = function(v){ return v>0 ? BK(v) : "—"; };
  var linhas = [
    ["Salário-base", function(m){ return dinh(m.salarioBase); }, "—"],
    ["Adiantamento salarial", function(m){ return dinh(m.adiantamento); }, BK(soma("adiantamento"))],
    ["Pagamento de salário", function(m){ return dinh(m.salario); }, BK(soma("salario"))],
    ["Horas extras (horas)", function(m){ return m.heHoras || "—"; }, fh(d.meses.reduce(function(t, m){ return t+min(m.heHoras); }, 0))],
    ["Horas extras (R$, já inclusas no salário)", function(m){ return dinh(m.heValor); }, BK(soma("heValor")), LARANJA],
    ["Diferença salarial (já inclusa no salário)", function(m){ return dinh(m.dif); }, BK(soma("dif"))],
    ["Bônus", function(m){ return dinh(m.bonus); }, BK(soma("bonus")), null, false, "bonus"],
    ["Pagamento de férias", function(m){ return dinh(m.ferias); }, BK(soma("ferias")), null, false, "ferias"],
    ["Vale-refeição", function(m){ return dinh(m.vr); }, BK(soma("vr"))],
    ["Vale-transporte", function(m){ return dinh(m.vt); }, BK(soma("vt")), null, false, "vt"],
    ["1ª parcela do 13º salário", function(m){ return dinh(m.decimo); }, BK(soma("decimo"))],
    ["Salário bruto (vencimentos)", function(m){ return dinh(m.bruto); }, BK(soma("bruto")), null, false, "bruto"],
    ["Reflexo da hora extra no DSR", function(m){ return dinh(m.dsr); }, BK(soma("dsr")), LARANJA, false, "dsr"],
    ["INSS (descontado dela)", function(m){ return dinh(m.inss); }, BK(soma("inss")), null, false, "inss"],
    ["Taxa negocial (descontada dela)", function(m){ return dinh(m.taxaNegocial); }, BK(soma("taxaNegocial")), null, false, "taxaNegocial"],
    ["FGTS (a empresa paga, além do salário)", function(m){ return dinh(m.fgts); }, BK(soma("fgts")), null, false, "fgts"],
    ["Total recebido", function(m){ return BK(m.total); }, BK(soma("total")), null, true],
    ["Total sem o 13º", function(m){ return BK(r2(m.total-(m.decimo||0))); }, BK(r2(soma("total")-soma("decimo"))), null, true],
    ["Hora extra sobre o salário-base", function(m){ return m.salarioBase>0 ? (m.heValor/m.salarioBase*100).toLocaleString("pt-BR",{minimumFractionDigits:1, maximumFractionDigits:1})+"%" : "—"; }, "—", LARANJA]
  ];
  var prim = d.meses[0], ult = d.meses[d.meses.length-1], vezes = prim && prim.heValor>0 ? ult.heValor/prim.heValor : 0;
  return e("tr",{key:"rem|"+p.chave}, e("td",{colSpan:p.colunas, className:"bg-white/5 p-3 text-left"},
    e("div",{className:"text-[13px] font-bold"}, "Remuneração · "+p.nome+" · "+(d.meses.length>1 ? MES[prim.ym.slice(5)]+" a " : "")+MES[ult.ym.slice(5)]+"/"+ult.ym.slice(0,4)),
    e("div",{className:"mt-2 overflow-x-auto"}, e("table",{className:"w-full text-[12.5px]"},
      e("thead",null, e("tr",{className:"text-white/60"}, e("th",{className:"px-2 py-1 text-left font-semibold"}, ""), d.meses.map(function(m){ return e("th",{key:m.ym, className:"px-2 py-1 text-right font-semibold"}, MES[m.ym.slice(5)]); }), e("th",{className:"px-2 py-1 text-right font-semibold"}, d.meses.length>1 ? d.meses.length+" meses" : "Total"))),
      e("tbody",null, linhas.filter(function(l){ return !l[5] || d.meses.some(function(m){ return m[l[5]]>0; }); }).map(function(l){ return e("tr",{key:l[0], className:"border-t border-white/10 "+(l[4] ? "bg-white/5 font-bold" : "")}, e("td",{className:"px-2 py-1 text-left"}, l[0]), d.meses.map(function(m){ return e("td",{key:m.ym, className:"px-2 py-1 text-right tabular-nums", style:l[3] ? {color:l[3]} : undefined}, l[1](m)); }), e("td",{className:"px-2 py-1 text-right tabular-nums", style:l[3] ? {color:l[3]} : undefined}, l[2])); })))),
    vezes>1 && e("div",{className:"mt-2 text-[12.5px] font-bold", style:{color:LARANJA}}, "A hora extra de "+MES[ult.ym.slice(5)]+" ("+BK(ult.heValor)+") foi "+vezes.toLocaleString("pt-BR",{minimumFractionDigits:1, maximumFractionDigits:1})+" vezes a de "+MES[prim.ym.slice(5)]+" ("+BK(prim.heValor)+")."),
    (d.observacoes || []).map(function(o, k){ return e("div",{key:k, className:"text-[12px] text-white/65"}, o); }),
    e("div",{className:"text-[11px] text-white/45"}, "Fonte: "+d.fonte)));
}

function Funcionarios(p){
  var cx = use(), s = cx.state;
  var sa0 = useState({}), abertas = sa0[0], setAbertas = sa0[1];
  var colabs = colaboradoresRh(s), horas = (s.rh && s.rh.horas) || [], tiposHE = (s.rh && s.rh.config && s.rh.config.tiposHE) || [];
  var itens = filtrar(p.mes, "", p.busca, "", "sorelly").filter(function(i){ return /^3\.01\.01/.test(i.nat) && !/^3\.01\.01\.(06|14|17)$/.test(i.nat) && i.setor; });
  var por = {};
  itens.forEach(function(i){ var n = nomeLimpo(i.nome), k = sa(n); (por[k] = por[k] || {nome:n, itens:[]}).itens.push(i); });
  // quem tem o relatório de remuneração do RH naquele mês (ex.: Edna em julho, agosto e setembro) usa os valores do relatório
  Object.keys(REMUNERACAO).forEach(function(k){ var d = REMUNERACAO[k]; if(!por[k] && !Object.keys(por).some(function(kk){ return remDe(kk)===d; }) && d.meses.some(function(m){ return m.ym===p.mes; }) && (!p.busca || sa(d.nome).indexOf(sa(p.busca))>=0)) por[k] = {nome:d.nome || k, itens:[]}; });
  var linhas = Object.keys(por).map(function(k){
    var g = por[k], c = acharColab(colabs, g.nome);
    var soma = function(fn){ return r2(g.itens.filter(fn).reduce(function(t, i){ return t+i.valor; }, 0)); };
    var nat = function(l){ return function(i){ return l.indexOf(i.nat)>=0; }; };
    var adiant = soma(nat(["3.01.01.11"])), sal = soma(nat(["3.01.01.02"])), vr = soma(nat(["3.01.01.01"])), vt = soma(nat(["3.01.01.05"])), dec = soma(nat(["3.01.01.16"])), bonus = soma(nat(["3.01.01.12"])), bonusAd = soma(nat(["3.01.01.21"]));
    var outros = soma(function(i){ return ["3.01.01.11", "3.01.01.02", "3.01.01.01", "3.01.01.05", "3.01.01.16", "3.01.01.12", "3.01.01.21"].indexOf(i.nat)<0; });
    var t = totais(g.itens), base = c && c.salario ? c.salario : 0, he = 0, hh = 0, total = t.total, pago = t.pago, falta = t.apagar, doRh = false;
    if(c) horas.filter(function(h){ return h.colabId===c.id && String(h.data).slice(0,7)===p.mes; }).forEach(function(h){ var tp = tiposHE.find(function(x){ return x.id===h.tipoId; }) || {pct:50}; hh += h.horas; he += valorHoraExtra(base, h.horas, tp.pct); });
    var rm = remDe(k) && remDe(k).meses.find(function(m){ return m.ym===p.mes; });
    if(rm){ doRh = true; base = rm.salarioBase || base; adiant = rm.adiantamento; sal = rm.salario; vr = rm.vr; vt = rm.vt; dec = rm.decimo; bonus = rm.bonus || 0; bonusAd = 0; outros = rm.ferias || 0; he = rm.heValor; hh = (function(h){ var m = /^(\d+):(\d+)$/.exec(h||""); return m ? Number(m[1])+Number(m[2])/60 : 0; })(rm.heHoras); total = rm.total; pago = rm.total; falta = 0; }
    return {k:k, nome:g.nome, itens:g.itens, doRh:doRh, setor:c ? c.setor : (g.itens[0] ? g.itens[0].setor : ""), funcao:c && c.funcao ? c.funcao : "", base:base, adiant:adiant, sal:sal, vr:vr, vt:vt, dec:dec, bonus:bonus, bonusAd:bonusAd, outros:outros, total:total, pago:pago, falta:falta, he:r2(he), hh:hh};
  }).sort(function(a, b){ return b.total-a.total; });
  var soma = function(k){ return r2(linhas.reduce(function(t, x){ return t+(x[k]||0); }, 0)); };
  var alterna = function(k){ var o = Object.assign({}, abertas); o[k] = !o[k]; setAbertas(o); };
  var din = function(v, cor){ return e(Td,{dinheiro:true, cor:cor}, v>0 ? BK(v) : "—"); };
  var out = [];
  linhas.forEach(function(x){
    var ab = !!abertas[x.k];
    out.push(e("tr",{key:x.k, onClick:function(){ alterna(x.k); }, className:LINHA+" cursor-pointer hover:bg-white/5"},
      e(Td,{forte:true, className:"text-left"}, (ab ? "▲ " : "▾ ")+x.nome, NEGOCIACOES[x.k] && e("span",{className:"ml-2 rounded-full bg-[#B8892B]/30 px-2 py-0.5 text-[10.5px] font-bold text-[#F3D98B]"}, "negociação"), e("div",{className:"text-[11px] font-normal text-white/50"}, [x.setor, x.funcao].filter(Boolean).join(" · "))),
      din(x.base), e(Td,{dinheiro:true, forte:true}, BK(x.total)), din(x.adiant, COR_SAL), din(x.sal, COR_SAL), din(x.vr), din(x.vt),
      e(Td,{dinheiro:true, cor:x.he>0 ? LARANJA : undefined}, x.he>0 ? BK(x.he)+" ("+formatHoras(x.hh)+")" : "—"),
      din(x.bonus), din(x.bonusAd), din(x.dec), din(x.outros), din(x.pago, "ok"), din(x.falta, "ruim")));
    if(ab){
      if(NEGOCIACOES[x.k]) out.push(e(Negociacao,{key:"n"+x.k, chave:x.k, mes:p.mes, colunas:14}));
      if(remDe(x.k)) out.push(e(Remuneracao,{key:"r"+x.k, chave:x.k, nome:x.nome, colunas:14}));
      x.itens.slice().sort(function(a, b){ return ordemTipo(a)-ordemTipo(b) || (a.venc||"").localeCompare(b.venc||""); }).forEach(function(i){
        var pago = i.status==="pago";
        out.push(e("tr",{key:x.k+"|"+i.id, className:LINHA+" bg-black/30"},
          e(Td,{className:"text-left"}, e("div",{style:{marginLeft:"18px"}}, e("div",{className:"text-[12.5px]"}, x.nome), e("div",{className:"text-[11px]", style:{color:pago ? ESTADO.ok : ESTADO.ruim}}, tipoDe(i)+" · "+(pago ? "Pago em "+br(i.baixa) : "Vence "+br(i.venc))))),
          e(Td,null, ""), e(Td,{dinheiro:true}, BK(i.valor)), e(Td,null, ""), e(Td,null, ""), e(Td,null, ""), e(Td,null, ""), e(Td,null, ""), e(Td,null, ""), e(Td,null, ""), e(Td,null, ""), e(Td,null, ""),
          e(Td,{dinheiro:true, cor:"ok"}, pago ? BK(i.valor) : "—"), e(Td,{dinheiro:true, cor:"ruim"}, pago ? "—" : BK(i.valor))));
      });
    }
  });
  out.unshift(e("tr",{key:"t", className:LINHA+" bg-white/10"}, e(Td,{forte:true, className:"text-left"}, "Total ("+linhas.length+" nomes)"), e(Td,{dinheiro:true, forte:true}, BK(soma("base"))), e(Td,{dinheiro:true, forte:true}, BK(soma("total"))), ["adiant", "sal", "vr", "vt", "he", "bonus", "bonusAd", "dec", "outros"].map(function(k){ return e(Td,{key:k, dinheiro:true, forte:true, cor:k==="adiant" || k==="sal" ? COR_SAL : undefined}, BK(soma(k))); }), e(Td,{dinheiro:true, cor:"ok", forte:true}, BK(soma("pago"))), e(Td,{dinheiro:true, cor:"ruim", forte:true}, BK(soma("falta")))));
  var TH = "px-2 py-1.5 text-center text-[12px] font-bold ", grupo = function(t, n, cor){ return e("th",{colSpan:n, className:TH+"border-b border-white/15", style:{color:cor || "rgba(255,255,255,.55)"}}, t); }, col = function(t, cor, sub){ return e("th",{className:TH, style:{color:cor || "rgba(255,255,255,.85)"}}, t, sub && e("div",{className:"text-[10.5px] font-normal text-white/45"}, sub)); };
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Faixa,{n:4},
      e(IndicadorN,{t:"Custo dos funcionários no mês", v:BK(soma("total")), cor:"total", sub:linhas.length+" nomes"}),
      e(IndicadorN,{t:"Salário (adiantamento + salário)", v:BK(r2(soma("adiant")+soma("sal"))), cor:COR_SAL, sub:"o salário junto"}),
      e(IndicadorN,{t:"13º salário", v:BK(soma("dec")), cor:"info", sub:"no mês"}),
      e(IndicadorN,{t:"Horas extras", v:BK(soma("he")), cor:soma("he")>0 ? LARANJA : "neutro", sub:"do RH; sem lançamento = zero"})),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Funcionários", dir:BK(soma("total"))}, e("div",{className:"p-2"},
      e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"},
        e("thead",null,
          e("tr",null, grupo("", 1), grupo("Contrato", 1), grupo("Recebido", 1), grupo("SALÁRIO: os dois juntos são o salário", 2, COR_SAL), grupo("ALÉM DO SALÁRIO", 7, "#F3D98B"), grupo("SITUAÇÃO", 2)),
          e("tr",null, col("Funcionária"), col("Salário base", null, "do contrato"), col("Total recebido", null, "tudo que recebeu"), col("Adiantamento", COR_SAL, "40%, dia 20"), col("Salário", COR_SAL, "o resto, mês seguinte"), col("VR"), col("VT"), col("Horas extras", LARANJA), col("Bônus", null, "metas"), col("Bônus adicional", LARANJA, "extra por fora"), col("13º"), col("Outros"), col("Pago", ESTADO.ok), col("Falta pagar", ESTADO.ruim))),
        e("tbody",null, out))),
      e("p",{className:"mt-2 px-1 text-[12px] text-white/60"}, "Clique numa funcionária para ver as linhas. Salário base é o salário do contrato. O adiantamento (40% do salário base, pago no dia 20) e o salário (o resto, pago no mês seguinte, já com os descontos e com as horas extras) são o salário junto. Quando o RH manda o relatório da pessoa, a linha usa os valores dele. INSS, IRRF e FGTS por pessoa dependem do holerite."))));
}

function Representantes(p){
  var sa0 = useState({}), abertas = sa0[0], setAbertas = sa0[1];
  var itens = filtrar(p.mes, "", p.busca, "", "sorelly").filter(function(i){ return i.grupo===G.rep; });
  var por = {};
  itens.forEach(function(i){ var n = nomeLimpo(i.nome), k = sa(n); (por[k] = por[k] || {nome:n, itens:[]}).itens.push(i); });
  var linhas = Object.keys(por).map(function(k){
    var g = por[k], soma = function(fn){ return r2(g.itens.filter(fn).reduce(function(t, i){ return t+i.valor; }, 0)); }, t = totais(g.itens);
    return {k:k, nome:g.nome, itens:g.itens, com:soma(function(i){ return /^4\.(02|20)/.test(i.nat); }), comb:soma(function(i){ return /^4\.03/.test(i.nat); }), total:t.total, pago:t.pago, falta:t.apagar};
  }).sort(function(a, b){ return b.total-a.total; });
  var soma = function(k){ return r2(linhas.reduce(function(t, x){ return t+(x[k]||0); }, 0)); };
  var alterna = function(k){ var o = Object.assign({}, abertas); o[k] = !o[k]; setAbertas(o); };
  var din = function(v, cor){ return e(Td,{dinheiro:true, cor:cor}, v>0 ? BK(v) : "—"); };
  var out = [];
  linhas.forEach(function(x){
    var ab = !!abertas[x.k];
    out.push(e("tr",{key:x.k, onClick:function(){ alterna(x.k); }, className:LINHA+" cursor-pointer hover:bg-white/5"}, e(Td,{forte:true, className:"text-left"}, (ab ? "▲ " : "▾ ")+x.nome, e("span",{className:"ml-2 text-[11px] font-normal text-white/45"}, x.itens.length+" contas")), din(x.com), din(x.comb), e(Td,{dinheiro:true, forte:true}, BK(x.total)), din(x.pago, "ok"), din(x.falta, "ruim")));
    if(ab) x.itens.slice().sort(function(a, b){ return (a.venc||"").localeCompare(b.venc||""); }).forEach(function(i){
      var pago = i.status==="pago";
      out.push(e("tr",{key:x.k+"|"+i.id, className:LINHA+" bg-black/30"}, e(Td,{className:"text-left"}, e("div",{style:{marginLeft:"18px"}}, e("div",{className:"text-[12.5px]"}, x.nome), e("div",{className:"text-[11px]", style:{color:pago ? ESTADO.ok : ESTADO.ruim}}, i.natNome+" · "+(pago ? "Pago em "+br(i.baixa) : "Vence "+br(i.venc))))), e(Td,null, ""), e(Td,null, ""), e(Td,{dinheiro:true}, BK(i.valor)), e(Td,{dinheiro:true, cor:"ok"}, pago ? BK(i.valor) : "—"), e(Td,{dinheiro:true, cor:"ruim"}, pago ? "—" : BK(i.valor))));
    });
  });
  out.push(e("tr",{key:"t", className:LINHA+" bg-white/10"}, e(Td,{forte:true, className:"text-left"}, "Total ("+linhas.length+" representantes)"), e(Td,{dinheiro:true, forte:true}, BK(soma("com"))), e(Td,{dinheiro:true, forte:true}, BK(soma("comb"))), e(Td,{dinheiro:true, forte:true}, BK(soma("total"))), e(Td,{dinheiro:true, cor:"ok", forte:true}, BK(soma("pago"))), e(Td,{dinheiro:true, cor:"ruim", forte:true}, BK(soma("falta")))));
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Faixa,{n:3}, e(IndicadorN,{t:"Representantes no mês", v:BK(soma("total")), cor:"total", sub:linhas.length+" representantes"}), e(IndicadorN,{t:"Comissão do consignado", v:BK(soma("com")), cor:"info", sub:"acerto, reposição"}), e(IndicadorN,{t:"Combustível", v:BK(soma("comb")), cor:"info", sub:"das representantes"})),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Representantes", dir:BK(soma("total"))}, e("div",{className:"p-2"}, e(TabN,{cols:["Representante", "Comissão consignado", "Combustível", "Total", "Pago", "Falta pagar"]}, out))));
}

// tela da aba: mês, busca e duas partes
function PessoasRep(){
  var cx = use(), s = cx.state, veSalario = grupoDe(s.usuario)==="supervisao";
  setClasse((s.cpe||{}).classe); setLancamentos((s.cpe||{}).lanc); setBaixas((s.cpe||{}).baixas); setPf(s.pf);
  var ms = meses(), ini = ms.indexOf(hojeYm())>=0 ? hojeYm() : (ms[ms.length-1] || "");
  var sm = useState(ini), mes = sm[0], setMes = sm[1], sb = useState(""), busca = sb[0], setBusca = sb[1], sp = useState("func"), parte = sp[0], setParte = sp[1];
  var cab = e(PageHead,{t:"Contas a pagar · Funcionários e representantes", sub:"Quanto custa cada funcionária e cada representante, com a negociação de cada um"});
  if(!veSalario) return e(Pagina,null, cab, e("p",{className:"rounded-xl bg-muted/30 px-4 py-5 text-center text-[14px]"}, "Só a supervisão vê o salário e a negociação de cada pessoa."));
  var campo = function(rot, el){ return e("label",{className:"flex flex-col gap-0.5"}, e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-white/70"}, rot), el); };
  return e(Pagina,null, cab,
    e(Abas,{abas:[["func", "Funcionários"], ["rep", "Representantes"]], atual:parte, onMudar:setParte, cor:AZUL}),
    e("div",{className:"grid w-full grid-cols-1 gap-2 rounded-xl bg-black/25 px-3 py-2 ring-1 ring-white/10 sm:grid-cols-2"},
      campo("Mês", e("select",{value:mes, "aria-label":"Mês", className:INPUT+" h-9! w-full cursor-pointer", onChange:function(ev){ setMes(ev.target.value); }}, ms.map(function(m){ return e("option",{key:m, value:m}, nomeMes(m)); }))),
      campo("Buscar", e("input",{value:busca, placeholder:"Nome, setor ou valor", "aria-label":"Buscar", className:INPUT+" h-9! w-full", onChange:function(ev){ setBusca(ev.target.value); }}))),
    parte==="func" ? e(Funcionarios,{mes:mes, busca:busca}) : e(Representantes,{mes:mes, busca:busca}));
}

export { PessoasRep };

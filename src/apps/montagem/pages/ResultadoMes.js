// Sorelly Admin · montagem — pages/ResultadoMes.js
// Financeiro › Resultado do mês (Marcus, 27/10/2026): a visão-mãe do dinheiro. RECEBER (DevMaster) × PAGAR (admin antigo) e o que ENTROU DE VERDADE nas contas.
// "Cansei de operar no negativo, quero ter controle total." Regras e fontes: docs/negocio/RESULTADO-DO-MES.md (números reais em RESULTADO-DO-MES.local.md, fora do Git).
//   Receber  = recebido na venda (Pix, link, cartão, dinheiro) + acerto - loja de meses antigos que pagou no mês; revendedoras e funcionárias (grupo do cadastro) separadas. Vem de /api/contas-receber.
//   Pagar    = pago e falta pagar do mês, do admin antigo (s.contasPagar, faturamento_contas_mes); sem esse dado, a soma dos dias lançados.
//   Entrou de verdade = variação do saldo das contas bancárias + contas pagas no mesmo período. A diferença para o DevMaster é dinheiro que entrou e ainda não foi baixado (ou o contrário: conferir).
// Próxima etapa: previsão de acertos dos próximos meses × contas a pagar de cada mês (saldo previsto mês a mês).
import { Pagina } from "@/apps/montagem/components/padrao";
import { AbasTela, FileiraCampos, H, TabelaCampos, brl } from "@/apps/montagem/components/padrao-fin";
import { filtrar, servidorEm, setBaixas, setClasse, setLancamentos, setPf, totais } from "@/apps/montagem/domain/contas-empresa";
import { contasDoMes, fatEfetivo, projetarVariosAnos, QUEDA_JANEIRO, resumoMensalRevendedoras } from "@/apps/montagem/domain/financeiro";
import { isoDia, provaDoMes } from "@/apps/montagem/domain/saldos-contas";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { Lw } from "@/apps/montagem/pages/ContasReceber";
import { Painel, Sel } from "@/apps/montagem/pages/RevendedorasAtivas";
import { use } from "@/apps/montagem/state/context";
import { e, useEffect, useState } from "@/shared/react";
import React from "react";

var MES_LONGO = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
var dm = function(iso){ return iso ? iso.slice(8, 10)+"/"+iso.slice(5, 7)+"/"+iso.slice(0, 4) : ""; };
var forte = "bg-[#B8862B]/20 font-semibold", verde = function(t){ return e("span",{className:"font-semibold text-success"}, t); }, ambar = function(t){ return e("span",{className:"font-semibold text-warning"}, t); }, verm = function(t){ return e("span",{className:"font-semibold text-destructive"}, t); };

// Previsão (Marcus, 27/10/2026): quanto ainda entra e sai neste mês e nos 3 seguintes, para saber se o saldo fica positivo.
// Acertos = revendedoras com DATA PREVISTA de acerto no mês (DevMaster, kits abertos; /api/acertos-previstos) × meta (98%). Meses sem data ainda: kits entregues no mês anterior
// (acertos + revendedoras novas) × ciclo medido (30/45/60 dias). Revendedoras novas pelo crescimento da Visão geral; em dezembro só até o dia 15.
// Média por acerto = faturado SÓ dos acertos das revendedoras (sem funcionárias) ÷ revendedoras que acertaram, dos últimos 3 meses fechados do contas a receber; nunca "entrou ÷ acertos".
// Entrada = acertos × média × % pago na hora + inadimplência antiga recebida (média) + funcionárias (média). Saída = a pagar do admin antigo. Contexto: docs/negocio/REVENDEDORAS-E-PREVISAO.md
function PrevisaoMeses(p){
  var d = p.d, s = p.s, sc = p.sc, hojeD = p.hojeD, ano = p.ano, mA = hojeD.getMonth();
  var sa = useState("5"), altaA = sa[0], setAltaA = sa[1], sb = useState("12"), altaB = sb[0], setAltaB = sb[1], sj = useState("17"), altaJ = sj[0], setAltaJ = sj[1], sd = useState("50"), cresDez = sd[0], setCresDez = sd[1];
  var sp = useState(null), ap = sp[0], setAp = sp[1], svm = useState(false), verMais = svm[0], setVerMais = svm[1];
  useEffect(function(){ if(apiAtiva()) chamar("GET", "/acertos-previstos").then(setAp).catch(function(){ setAp({erro:true}); }); }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  var mp = Number(s.metaPct), metaPct = mp>=97 && mp<=99 ? mp : 98, fd = fatEfetivo(s), se = Object.assign({}, s, {faturamentoDiario:fd});
  // histórico: até 3 meses fechados antes do atual (com revendedoras que acertaram)
  var fat = 0, nn = 0, rec = 0, fun = 0, ant = 0, qm = 0;
  for(var mi = mA; mi>=Math.max(1, mA-2); mi--){ var kn = d.K.n[mi] || {}, kt = d.K.t[mi] || {}; if(!kn.n) continue; fat += kn.fat; nn += kn.n; rec += kn.rec; fun += (kt.rec || 0)-(kn.rec || 0); ant += (d.A.t.cx || [])[mi-1] || 0; qm++; }
  if(!qm || !nn) return e(Painel,{t:"Previsão dos próximos meses", v:"Sem meses fechados"}, e("p",{className:"px-3 py-2 text-center text-[13px] text-foreground"}, "Faltam meses fechados no contas a receber."));
  if(!ap) return e(Painel,{t:"Previsão dos próximos meses", v:"Lendo os acertos previstos…"}, e("p",{role:"status", className:"px-3 py-2 text-center text-[13px] text-foreground"}, "Lendo a data prevista de acerto na DevMaster."));
  if(ap.erro || !ap.porMes) return e(Painel,{t:"Previsão dos próximos meses", v:"Sem acertos previstos"}, e("p",{role:"alert", className:"px-3 py-2 text-center text-[13px] font-semibold text-destructive"}, "Não consegui ler a data prevista de acerto na DevMaster."));
  var media = fat/nn, pago = fat>0 ? rec/fat : 0, funMed = fun/qm, antMed = ant/qm, pct = metaPct/100;
  var pv = projetarVariosAnos(se, ano, 24, 2, metaPct).porMes, ymDe = function(k){ return (ano+Math.floor(k/12))+"-"+String(k%12+1).padStart(2, "0"); };
  // mês atual: o que ainda falta entrar e pagar
  var kA = d.K.n[mA+1] || {}, mediaA = kA.n ? kA.fat/kA.n : media, pagoA = kA.fat>0 ? kA.rec/kA.fat : pago;
  var restAc = Math.round((ap.restoMes || 0)*pct), diasMes = new Date(ano, mA+1, 0).getDate(), restDias = Math.max(0, diasMes-hojeD.getDate());
  var entA = restAc*mediaA*pagoA+(antMed+funMed)*restDias/diasMes;
  var pmA = ((s.contasPagar || {})[String(ano)] || {})[mA] || {}, tA = totais(filtrar(ano+"-"+String(mA+1).padStart(2, "0"), "", "", "", "", "")), srvA = !!servidorEm() && tA.n>0, pagoA2 = srvA ? tA.pago : ((pmA.pago || 0)>0 ? pmA.pago : (contasDoMes(s, String(ano), mA).pago || 0)), totalA = srvA ? tA.pago+tA.apagar : Math.max((pmA.pago || 0)+(pmA.apagar || 0), tA.pago+tA.apagar), faltaA = Math.max(0, totalA-pagoA2);   // contas do mês ainda em lançamento: vale o maior entre o admin antigo e a DevMaster (mesma regra dos meses seguintes)
  var prA = provaDoMes(sc, ano, mA, 0, 0, isoDia(hojeD)), saldo0 = prA.fim ? prA.fim.real : null;
  var saldoA = saldo0===null ? null : saldo0+entA-faltaA;
  // próximos 3 meses
  // Razão de outubro (Marcus, 28/10/2026): acertos do mês ÷ revendedoras no dia 1 do mês; vale para os meses seguintes.
  var iniMes = (resumoMensalRevendedoras(s, ano)[mA] || {}).ini || 0, fmA = (s.fechaMes || {})[ano+"-"+String(mA+1).padStart(2, "0")] || {}, ksA = Object.keys(fd).filter(function(x){ return x.slice(0, 7)===ano+"-"+String(mA+1).padStart(2, "0"); }).sort();
  var prevA = (ksA.length ? (fd[ksA[ksA.length-1]].acertos || 0) : 0)+(Number(fmA.carregar) || 0)+(Number(fmA.aRealizar) || 0), razao = iniMes>0 ? prevA*pct/iniMes : 0;
  var cols = [], acum = saldoA, cresD = (Number(cresDez) || 0)/100;
  for(var j = 1; j<=(p.modo==="linhas" ? (11-mA)+12 : 5); j++){   // aba Resumo: de hoje até dezembro de 2027; aba Previsão: 5 meses
    var k = mA+j, anoJ = ano+Math.floor(k/12), mJ = k%12, conhecido = (ap.porMes || {})[ymDe(k)] || 0;
    var revJ = ((pv[k] || {}).revendedoras || 0);
    if(k>11) revJ = revJ-(1-cresD)*(((pv[12] || {}).revendedoras || 0)-((pv[11] || {}).revendedoras || 0))-QUEDA_JANEIRO;   // dezembro cresce menos (só até o dia 15) e janeiro perde revendedoras; vale daí em diante
    var ac = Math.round(revJ*razao);
    var m = mediaA*(1+((Number(j===1 ? altaA : j===2 ? altaB : altaJ) || 0)/100));   // fevereiro e março seguem a alta de janeiro
    var venda = ac*m*pagoA, ent = venda+antMed+funMed, apJ = ((s.contasPagar || {})[String(anoJ)] || {})[mJ], adm = apJ && (apJ.apagar || apJ.pago) ? (apJ.apagar || 0) : 0, lanc = totais(filtrar(ymDe(k), "", "", "", "", "")).total;
    var ap2 = lanc>0 ? lanc : adm, est = lanc>0;   // 10/11/2026 (Marcus: tudo vem da DevMaster pelo admin novo): vale o lançado na DevMaster; o admin antigo só entra se a DevMaster não tem nada no mês   // 10/11/2026 (Marcus: dezembro estava errado, R$ 2,67 mi): mês que vem vale o valor do admin antigo (o mesmo da aba Previsão); a lista da DevMaster junta cheques e títulos atrasados no mês e inflava a conta. Sem admin, vale o lançado (com ≥)
    var res = ap2===null ? null : ent-ap2; if(acum!==null && res!==null) acum += res; else acum = null;
    cols.push({lanc:lanc, nome:MES_LONGO[mJ]+"/"+anoJ, ac:ac, rev:Math.round(revJ), conhecido:conhecido, m:m, venda:venda, ent:ent, ap:ap2, est:est, res:res, saldo:acum});
  }
  var G = "1.9fr repeat(6, 1fr)", sinal = function(v){ return v===null ? "—" : v<0 ? verm(brl(v)) : verde(brl(v)); };
  var campo = function(rot, val, set){ return e("label",{className:"flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[.05em] text-foreground"}, rot, e("input",{type:"number", value:val, onChange:function(ev){ set(ev.target.value); }, className:H+" w-20 rounded-md border border-border bg-card px-2 text-right text-[13px] normal-case text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"})); };
  var ult = cols[cols.length-1].saldo;
  // Modo "linhas" (aba Resumo, 03/11/2026): só as linhas dos meses que vêm (Entra, Sai, Resultado), dentro do bloco "Meses ao redor".
  if(p.modo==="linhas"){
    var semBase = !(razao>0);
    return e(React.Fragment,null, cols.map(function(c, ci){ var linha = e(FileiraCampos,{key:"fv"+c.nome, tom:"#A78BFA", cells:[c.nome, {v:"Previsto", cor:"#A78BFA"}, semBase ? "—" : brl(c.ent), (c.est ? "≥ " : "")+brl(c.ap), semBase ? "—" : sinal(c.res)]});
      var novoAno = c.nome.slice(-4)!==String(ano) && (ci===0|| c.nome.slice(-4)!==cols[ci-1].nome.slice(-4)) && c.nome.slice(-4)!==String(ano);   // faixa com o ano quando a lista passa para 2027
      return novoAno ? e(React.Fragment,{key:"fa"+c.nome}, e(FileiraCampos,{total:true, tom:"#A78BFA", cells:[{v:c.nome.slice(-4), cor:"#A78BFA"}, "", "", "", ""]}), linha) : linha; }),
      semBase && e("p",{className:"border-t border-[#2a2c31] px-3 py-1.5 text-center text-[11px] text-foreground"}, "Falta lançar o faturamento do mês em Faturamento para calcular a entrada dos próximos meses. A saída mostrada é só o que já está lançado."));
  }
  var painelMeses = e(Painel,{t:"Próximos meses · quanto ainda entra e sai", v:ult===null ? "Sem saldo" : "Saldo em "+cols[4].nome+": "+brl(ult), vermelho:ult!==null && ult<0},
    e("div",{className:"flex flex-wrap items-center gap-3 px-3 py-1.5"},
      campo(MES_LONGO[(mA+1)%12]+" · alta %", altaA, setAltaA), campo(MES_LONGO[(mA+2)%12]+" · alta %", altaB, setAltaB), campo(MES_LONGO[(mA+3)%12]+" · alta %", altaJ, setAltaJ), campo("Dezembro · crescimento %", cresDez, setCresDez)),
    Lw(G, ["Linha", MES_LONGO[mA]+" · o que falta"].concat(cols.map(function(c){ return c.nome; })), true, "ph"),
    Lw(G, ["Revendedoras no dia 1", String(iniMes)].concat(cols.map(function(c){ return String(c.rev); })), false, "pb"),
    Lw(G, ["Razão de acertos ("+metaPct+"% dos previstos ÷ revendedoras)", (razao*100).toFixed(1).replace(".", ",")+"%"].concat(cols.map(function(){ return (razao*100).toFixed(1).replace(".", ",")+"%"; })), false, "pz"),
    Lw(G, ["Revendedoras com acerto previsto (DevMaster)", String(ap.restoMes || 0)].concat(cols.map(function(c){ return String(c.conhecido); })), false, "pk"),
    Lw(G, ["Acertos esperados", String(restAc)].concat(cols.map(function(c){ return String(c.ac); })), false, "pa"),
    Lw(G, ["Média por acerto (só revendedoras)", brl(mediaA)].concat(cols.map(function(c){ return brl(c.m); })), false, "pm"),
    Lw(G, ["% pago na hora", Math.round(pagoA*100)+"%"].concat(cols.map(function(){ return Math.round(pagoA*100)+"%"; })), false, "pp"),
    Lw(G, ["Entrada dos acertos", brl(restAc*mediaA*pagoA)].concat(cols.map(function(c){ return brl(c.venda); })), false, "pv"),
    Lw(G, ["Mais: inadimplência antiga recebida (média)", brl(antMed*restDias/diasMes)].concat(cols.map(function(){ return brl(antMed); })), false, "pi"),
    Lw(G, ["Mais: funcionárias (média)", brl(funMed*restDias/diasMes)].concat(cols.map(function(){ return brl(funMed); })), false, "pf"),
    Lw(G, ["Entrada prevista", verde(brl(entA))].concat(cols.map(function(c){ return verde(brl(c.ent)); })), false, "pe", null, forte),
    Lw(G, ["Menos: falta pagar", ambar(brl(faltaA))].concat(cols.map(function(c){ return ambar((c.est ? "≥ " : "")+brl(c.ap)); })), false, "pg"),
    Lw(G, ["Resultado do mês", sinal(entA-faltaA)].concat(cols.map(function(c){ return sinal(c.res); })), false, "pr", null, forte),
    Lw(G, ["Saldo das contas no fim do mês", saldoA===null ? "—" : sinal(saldoA)].concat(cols.map(function(c){ return sinal(c.saldo); })), false, "ps", null, forte),
    e("p",{className:"px-3 py-1.5 text-center text-[11px] text-foreground"}, "Acertos: data de devolução prevista dos kits abertos na DevMaster, lida às "+new Date(ap.geradoEm).toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit"})+". Meses seguintes: revendedoras no dia 1 × a razão de acertos do mês atual; dezembro cresce "+cresDez+"% do normal (só até o dia 15) e janeiro perde "+QUEDA_JANEIRO+" revendedoras. Média, % pago na hora, inadimplência antiga e funcionárias: média dos últimos "+qm+" meses fechados. Saldo parte de "+(saldo0===null ? "—" : brl(saldo0))+" agora. Contas a pagar de cada mês: tudo lido da DevMaster pelo admin novo (já pago e em aberto). Com ≥ é só o que já está lançado até hoje; os meses mais longe ainda recebem contas novas."));
  // MÊS ATUAL (Marcus, 28/10/2026): só o que falta; no fim, o que entrou, o que falta e o resultado do pago e a pagar
  var C3p = "2.4fr 1.2fr 2.6fr", pagoMes = pagoA2, entrouMes = (prA.variacao===null || prA.variacao===undefined) ? null : prA.variacao+pagoMes;
  var acFeitos = ksA.length ? (fd[ksA[ksA.length-1]].acertos || 0) : 0, recFat = ksA.length ? (fd[ksA[ksA.length-1]].recebido || 0) : 0, carA = Number(fmA.carregar) || 0, arA = Number(fmA.aRealizar) || 0, alvoA = Math.round(prevA*pct), nA = function(v){ return Math.round(v || 0).toLocaleString("pt-BR"); };
  var entTotal = entrouMes===null ? null : entrouMes+entA, saiTotal = pagoMes+faltaA, resFinal = entTotal===null ? null : entTotal-saiTotal;
  var painelMes = e(Painel,{t:"Previsão · o que falta em "+MES_LONGO[mA], v:"Resultado final: "+(resFinal===null ? "sem saldo" : brl(resFinal)), vermelho:resFinal!==null && resFinal<0},
    Lw(C3p, ["Linha", "Valor", "De onde vem"], true, "mh"),
    Lw(C3p, ["ACERTOS DO MÊS", "", ""], true, "ma"),
    Lw(C3p, ["Acertos realizados", nA(acFeitos), ksA.length ? "Faturamento lançado até "+dm(ksA[ksA.length-1]) : "Nada lançado neste mês"], false, "a1"),
    Lw(C3p, ["Vendas no Carregar", ambar(nA(carA)), "Vendas ainda sem valor lançado; não estão dentro dos acertos realizados"], false, "a2"),
    Lw(C3p, ["Acertos a realizar", nA(arA), "Revendedoras que ainda vão acertar até o fim do mês (lançado em Faturamento)"], false, "a3"),
    Lw(C3p, ["Total de acertos do mês", nA(prevA), "Realizados mais Carregar mais a realizar"], false, "a4", null, forte),
    Lw(C3p, ["Acertos esperados a "+metaPct+"%", nA(alvoA), "Total do mês vezes a meta"], false, "a5"),
    Lw(C3p, ["Faturamento lançado no mês", verde(brl(recFat)), "Acumulado lançado em Faturamento"], false, "a6"),
    Lw(C3p, ["Média por acerto (notas fiscais)", acFeitos>0 ? brl(recFat/acFeitos) : "—", "Faturamento lançado dividido pelos acertos realizados"], false, "a7"),
    Lw(C3p, ["Média real recebida por acerto", kA.n ? verde(brl(kA.rec/kA.n)) : "—", "Pago na hora pelas revendedoras dividido pelas que acertaram (DevMaster)"], false, "a8", null, forte),
    Lw(C3p, ["O QUE FALTA", "", ""], true, "mq"),
    Lw(C3p, ["Acertos que ainda faltam", String(restAc), "Revendedoras com data de acerto prevista no mês na DevMaster, vezes a meta de "+metaPct+"%"], false, "m1"),
    Lw(C3p, ["Falta entrar dos acertos", verde(brl(restAc*mediaA*pagoA)), "Acertos que faltam vezes a média ("+brl(mediaA)+") e o % pago na hora ("+Math.round(pagoA*100)+"%)"], false, "m2"),
    Lw(C3p, ["Falta entrar da inadimplência antiga e funcionárias", verde(brl((antMed+funMed)*restDias/diasMes)), "Média dos últimos meses, pelos dias que faltam"], false, "m3"),
    Lw(C3p, ["Total que falta entrar", verde(brl(entA)), "Soma das duas linhas acima"], false, "m4", null, forte),
    Lw(C3p, ["Total que falta pagar", ambar(brl(faltaA)), "O maior entre o admin antigo e o que já está lançado na DevMaster, menos o já pago (as contas do mês ainda estão sendo lançadas)"], false, "m5", null, forte),
    Lw(C3p, ["Resultado do que falta", sinal(entA-faltaA), "Falta entrar menos falta pagar"], false, "m6", null, forte),
    Lw(C3p, ["FECHAMENTO DO MÊS", "", ""], true, "mf"),
    Lw(C3p, ["Acertos do mês", nA(prevA), "Realizados "+nA(acFeitos)+" mais Carregar "+nA(carA)+" mais a realizar "+nA(arA)], false, "f0"),
    Lw(C3p, ["Entrou no mês", entrouMes===null ? "—" : verde(brl(entrouMes)), "Variação do saldo das contas mais o que foi pago"], false, "f1"),
    Lw(C3p, ["Falta entrar", verde(brl(entA)), "Linha acima"], false, "f2"),
    Lw(C3p, ["Entrada total do mês", entTotal===null ? "—" : verde(brl(entTotal)), "Entrou mais o que falta entrar"], false, "f3", null, forte),
    Lw(C3p, ["Pago no mês", brl(pagoMes), "Baixas do mês na DevMaster (ou o total do admin antigo, sem a DevMaster)"], false, "f4"),
    Lw(C3p, ["Falta pagar", ambar(brl(faltaA)), "Linha acima"], false, "f5"),
    Lw(C3p, ["Saída total do mês", brl(saiTotal), "Pago mais o que falta pagar"], false, "f6", null, forte),
    Lw(C3p, ["Resultado final do mês", resFinal===null ? "—" : sinal(resFinal), "Entrada total menos saída total"], false, "f7", null, forte));
  return e("div",{className:"flex flex-col gap-2.5"}, painelMes,
    e("button",{type:"button", onClick:function(){ setVerMais(!verMais); }, className:H+" self-start rounded-md border border-border px-3 text-[13px] hover:bg-white/10"}, verMais ? "Esconder os próximos meses" : "Ver os próximos meses"),
    verMais && painelMeses);
}

function AbaResultadoMes(){
  var cx = use(), s = cx.state, sc = s.saldosContas, hojeD = new Date(), hoje = isoDia(hojeD), ano = hojeD.getFullYear();
  setClasse((s.cpe||{}).classe); setLancamentos((s.cpe||{}).lanc); setBaixas((s.cpe||{}).baixas); setPf(s.pf);   // as mesmas contas e baixas da tela Contas a pagar (antes esta tela não aplicava as baixas dadas no sistema)
  var sm = useState(String(hojeD.getMonth()+1)), mes = sm[0], setMes = sm[1], sd = useState(null), d = sd[0], setD = sd[1], se = useState(""), erro = se[0], setErro = se[1], sab = useState("res"), aba = sab[0], setAba = sab[1];
  var carrega = function(forcar){ chamar("GET", "/contas-receber"+(forcar ? "?atualizar=1" : "")).then(function(x){ setD(x); setErro(x.erro && !x.pronto ? x.erro : ""); }).catch(function(x){ setErro(x.message); }); };
  useEffect(function(){ if(apiAtiva()) carrega(false); }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(function(){ if(!d || (d.pronto && !d.atualizando)) return; var id = setTimeout(function(){ carrega(false); }, 4000); return function(){ clearTimeout(id); }; }, [d]);   // eslint-disable-line react-hooks/exhaustive-deps
  var sn = useState(null), apN = sn[0], setApN = sn[1];
  useEffect(function(){ if(apiAtiva()) chamar("GET", "/acertos-previstos").then(setApN).catch(function(){ setApN({erro:true}); }); }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  if(!apiAtiva()) return e(Pagina,null, e("p",{className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Esta tela lê a DevMaster pelo servidor. Entre no sistema com o servidor ligado."));
  if(erro && !d) return e(Pagina,null, e("p",{role:"alert", className:"rounded-lg bg-destructive/15 px-3 py-2 text-center text-[13px] font-semibold text-destructive"}, erro));
  if(!d || !d.pronto) return e(Pagina,null, e("p",{role:"status", className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Lendo os títulos a receber da DevMaster… "+(d && d.etapa ? d.etapa+" · "+(d.pct || 0)+"%" : "a primeira vez demora alguns minutos")));

  var mi = Number(mes), m0 = mi-1, Kt = d.K.t[mi] || {}, Kn = d.K.n[mi] || {}, cxT = (d.A.t.cx || [])[m0] || 0, cxN = (d.A.n.cx || [])[m0] || 0;
  // RECEBER
  var recRev = Kn.rec || 0, recFun = (Kt.rec || 0)-(Kn.rec || 0), antRev = cxN, antFun = cxT-cxN, recVenda = Kt.rec || 0, esperado = recVenda+cxT;
  var inadMes = Kt.ace || 0, inadAberto = Kt.s || 0, faturado = Kt.fat || 0;
  // PAGAR (admin antigo)
  // PAGAR: MESMA regra do alto da tela Contas a pagar (02/11/2026): com a DevMaster lida pelo servidor, valem as baixas e os títulos dela (mais os pagamentos dados no sistema); sem ela, o admin antigo; sem os dois, a soma dos dias.
  var ymP = ano+"-"+String(mi).padStart(2, "0"), tP = totais(filtrar(ymP, "", "", "", "", "")), srvP = !!servidorEm() && tP.n>0;
  var pm = ((s.contasPagar || {})[String(ano)] || {})[m0] || {}, somaDias = contasDoMes(s, String(ano), m0).pago || 0, doAdmin = !srvP && (pm.pago || 0)>0, pago = srvP ? tP.pago : doAdmin ? pm.pago : somaDias, listaAp = tP.apagar || 0;
  var falta = srvP ? tP.apagar : listaAp>0 ? listaAp : doAdmin ? (pm.apagar || 0) : (contasDoMes(s, String(ano), m0).apagar || 0);
  // mês em andamento (Marcus, 02/11/2026: novembro): as contas do mês ainda estão sendo lançadas na DevMaster; vale o MAIOR entre ela e o admin antigo, igual aos meses seguintes da Previsão. Mês fechado: o que foi pago e o que falta.
  var totPag = (m0 < hojeD.getMonth() || srvP) ? pago+falta : Math.max((pm.pago || 0)+(pm.apagar || 0), pago+falta), faltaMostra = Math.max(0, totPag-pago);
  // ENTROU DE VERDADE
  var pr = provaDoMes(sc, ano, m0, 0, 0, hoje), temSaldo = pr.variacao!==null && pr.variacao!==undefined, entrou = temSaldo ? pr.variacao+pago : null, dif = entrou===null ? null : entrou-esperado;
  // FATURAMENTO (o que o Marcus lança em Faturamento): acertos feitos, Carregar, a realizar e a previsão do mês
  var ymSel = ano+"-"+String(mi).padStart(2, "0"), fdS = fatEfetivo(s), ksF = Object.keys(fdS).filter(function(x){ return x.slice(0, 7)===ymSel; }).sort(), ultF = ksF.length ? fdS[ksF[ksF.length-1]] : {};
  var fmF = (s.fechaMes || {})[ymSel] || {}, nF = function(v){ return Math.round(v || 0).toLocaleString("pt-BR"); }, acF = ultF.acertos || 0, recF = ultF.recebido || 0, carF = Number(fmF.carregar) || 0, arF = Number(fmF.aRealizar) || 0;
  var mpF = Number(s.metaPct), pctF = (mpF>=97 && mpF<=99 ? mpF : 98), totF = acF+carF+arF, alvoF = Math.round(totF*pctF/100), medF = acF>0 ? recF/acF : 0, prevF = alvoF*medF;
  var fechado = m0 < hojeD.getMonth(), resReal = recF-totPag;
  // MÊS EM ANDAMENTO (Marcus, 02/11/2026: "faz o de novembro, eu já te dei os números"): o que ainda falta entrar até o fim do mês, igual à aba Previsão
  // (acertos com data prevista na DevMaster × meta × média do mês × % pago na hora, mais a média de inadimplência antiga e funcionárias pelos dias que faltam)
  var faltaEnt = null;
  if(!fechado && apN && apN.restoMes!==undefined){
    var pctN = ((Number(s.metaPct)>=97 && Number(s.metaPct)<=99) ? Number(s.metaPct) : 98)/100, nN = 0, fN = 0, recN = 0, funN = 0, antN = 0, qN = 0;
    for(var mm = m0; mm>=Math.max(1, m0-2); mm--){ var knN = d.K.n[mm] || {}, ktN = d.K.t[mm] || {}; if(!knN.n) continue; fN += knN.fat; nN += knN.n; recN += knN.rec; funN += (ktN.rec || 0)-(knN.rec || 0); antN += (d.A.t.cx || [])[mm-1] || 0; qN++; }
    if(qN && nN){ var kcN = d.K.n[mi] || {}, mediaN = kcN.n ? kcN.fat/kcN.n : fN/nN, pagoN = kcN.fat>0 ? kcN.rec/kcN.fat : (fN>0 ? recN/fN : 0), diasN = new Date(ano, mi, 0).getDate(), restDiasN = Math.max(0, diasN-hojeD.getDate());
      faltaEnt = Math.round((apN.restoMes || 0)*pctN)*mediaN*pagoN+(antN+funN)/qN*restDiasN/diasN; }
  }
  var entradaF = recF+(faltaEnt || 0), entradaR = esperado+(faltaEnt || 0), resF = (faltaEnt!==null ? entradaF : prevF)-totPag, resRec = entradaR-totPag, resMostra = fechado ? resReal : resF;   // mês que já passou: sem a parte de previsão (a realizar, Carregar, esperados)
  var C3 = "2.4fr 1.2fr 2.6fr";

  // RESUMO (Marcus, 03/11/2026, versão 3 de 2 blocos): à esquerda o mês escolhido (nota fiscal x dinheiro x diferença); à direita os meses ao redor (fechados, em andamento e os que vêm).
  // Nota fiscal = "Faturamento lançado" (Faturamento). Dinheiro = o que a DevMaster mostra recebido nas contas. A mesma conta dos quadros das outras abas.
  var curM = hojeD.getMonth()+1;
  var saiMes = function(mm){
    var ymX = ano+"-"+String(mm).padStart(2, "0"), tX = totais(filtrar(ymX, "", "", "", "", "")), srvX = !!servidorEm() && tX.n>0, pmX = ((s.contasPagar || {})[String(ano)] || {})[mm-1] || {}, cdX = contasDoMes(s, String(ano), mm-1);
    var doX = !srvX && (pmX.pago || 0)>0, pagoX = srvX ? tX.pago : doX ? pmX.pago : (cdX.pago || 0), lapX = tX.apagar || 0, faltaX = srvX ? tX.apagar : lapX>0 ? lapX : doX ? (pmX.apagar || 0) : (cdX.apagar || 0);
    return (mm-1 < hojeD.getMonth() || srvX) ? pagoX+faltaX : Math.max((pmX.pago || 0)+(pmX.apagar || 0), pagoX+faltaX);
  };
  var faltaEntMes = function(mmi){   // mesma conta da aba Previsão, para o mês em andamento
    if(!apN || apN.restoMes===undefined) return 0;
    var pctX = ((Number(s.metaPct)>=97 && Number(s.metaPct)<=99) ? Number(s.metaPct) : 98)/100, nX = 0, fX = 0, recX = 0, funX = 0, antX = 0, qX = 0;
    for(var mx = mmi-1; mx>=Math.max(1, mmi-3); mx--){ var knX = d.K.n[mx] || {}, ktX = d.K.t[mx] || {}; if(!knX.n) continue; fX += knX.fat; nX += knX.n; recX += knX.rec; funX += (ktX.rec || 0)-(knX.rec || 0); antX += (d.A.t.cx || [])[mx-1] || 0; qX++; }
    if(!qX || !nX) return 0;
    var kcX = d.K.n[mmi] || {}, medX = kcX.n ? kcX.fat/kcX.n : fX/nX, pgX = kcX.fat>0 ? kcX.rec/kcX.fat : (fX>0 ? recX/fX : 0), dX = new Date(ano, mmi, 0).getDate(), rdX = Math.max(0, dX-hojeD.getDate());
    return Math.round((apN.restoMes || 0)*pctX)*medX*pgX+(antX+funX)/qX*rdX/dX;
  };
  var sinalR = function(v){ return v===null ? "—" : v<0 ? verm(brl(v)) : verde(brl(v)); };
  var tagR = function(t, tracejado){ return e("span",{className:"rounded border px-1.5 text-[11px] font-semibold text-primary "+(tracejado ? "border-dashed border-primary" : "border-primary")}, t); };
  var notaEnt = ksF.length ? (fechado ? recF : entradaF) : null, dinhEnt = fechado ? esperado : entradaR;
  var resNota = notaEnt===null ? null : notaEnt-totPag, resDin = dinhEnt-totPag, difRes = resNota===null ? null : resDin-resNota;
  // RESUMO em layout D (Marcus, 10/11/2026: "está difícil de identificar as coisas"): três grupos (ENTRA, SAI, RESULTADO), o total de cada grupo em faixa escura e uma coluna de grupo à esquerda.
  var COLR = [{t:"Grupo", w:"16%"}, {t:"Linha", w:"24%"}, {t:"Notas Fiscais", w:"20%"}, {t:"Contas a Receber", w:"20%"}, {t:"Diferença", w:"1fr"}];
  var temNota = notaEnt!==null, travessao = "—", TOMR = {a:"#60A5FA", e:"#34D399", s:"#FB923C", r:"#E8B84B"}, fR = function(k, grupo, linha, nota, dinh, dif, total){ var tom = TOMR[k.charAt(0)]; return e(FileiraCampos,{key:k, total:total, tom:tom, cells:[grupo ? {v:grupo, cor:tom} : "", linha, nota, dinh, dif]}); };   // cor por grupo (Marcus, 10/11/2026): acertos azul, entra verde, sai laranja, resultado dourado
  var linhasRes = [];
  // ACERTOS (Marcus, 10/11/2026: "em cima do que entra coloca a quantidade de acertos e a média"): notas fiscais = Faturamento lançado; contas a receber = clientes com título no mês na DevMaster (sem funcionárias) e o que pagaram na hora
  var nAcCR = Kn.n || 0, medNF = acF>0 ? recF/acF : null, medCR = nAcCR>0 ? (Kn.rec || 0)/nAcCR : null, pctAc = pctF/100;
  var nAcPrevNF = totF>0 ? alvoF : null, nAcPrevCR = nAcPrevNF;   // Marcus, 10/11/2026: "o previsto do mês tem que ser igual" nas duas colunas; vale o previsto do Faturamento (feitos + Carregar + a realizar, vezes a meta). Antes a coluna Contas a Receber usava a data prevista da DevMaster e dava 3 acertos a mais
  var medPrevNF = nAcPrevNF ? notaEnt/nAcPrevNF : null, medPrevCR = nAcPrevCR ? dinhEnt/nAcPrevCR : null;
  var contaDif = function(a, b){ return a===null || b===null ? travessao : (b-a)>0 ? "+"+(b-a) : String(b-a); }, moedaDif = function(a, b){ return a===null || b===null ? travessao : sinalR(b-a); }, moeda = function(v){ return v===null ? travessao : brl(v); };
  linhasRes.push(fR("a1", "ACERTOS", fechado ? "Acertos no mês" : "Acertos feitos", ksF.length ? nF(acF) : travessao, nF(nAcCR), ksF.length ? contaDif(acF, nAcCR) : travessao));
  linhasRes.push(fR("a2", "", "Média por acerto", moeda(medNF), moeda(medCR), moedaDif(medNF, medCR)));
  if(!fechado){
    linhasRes.push(fR("a3", "", "Acertos previstos no mês", nAcPrevNF===null ? travessao : nF(nAcPrevNF), nAcPrevCR===null ? travessao : nF(nAcPrevCR), contaDif(nAcPrevNF, nAcPrevCR)));
    linhasRes.push(fR("a4", "", "Média prevista por acerto", moeda(medPrevNF), moeda(medPrevCR), moedaDif(medPrevNF, medPrevCR)));
  }
  if(!fechado){
    linhasRes.push(fR("e1", "ENTRA", "Recebido até hoje", ksF.length ? brl(recF) : travessao, brl(esperado), ksF.length ? sinalR(esperado-recF) : travessao));
    linhasRes.push(fR("e2", "", "Falta receber", temNota ? brl(faltaEnt || 0) : travessao, brl(faltaEnt || 0), temNota ? brl(0) : travessao));
  }
  linhasRes.push(fR("e3", fechado ? "ENTRA" : "", fechado ? "Entrou no mês" : "Total que entra", temNota ? brl(notaEnt) : travessao, brl(dinhEnt), temNota ? sinalR(dinhEnt-notaEnt) : travessao, true));
  if(!fechado){
    linhasRes.push(fR("s1", "SAI", "Pago até hoje", temNota ? brl(totPag-faltaMostra) : travessao, brl(totPag-faltaMostra), temNota ? brl(0) : travessao));
    linhasRes.push(fR("s2", "", "Falta pagar", temNota ? brl(faltaMostra) : travessao, brl(faltaMostra), temNota ? brl(0) : travessao));
  }
  linhasRes.push(fR("s3", fechado ? "SAI" : "", fechado ? "Saiu no mês" : "Total que sai", temNota ? brl(totPag) : travessao, brl(totPag), temNota ? brl(0) : travessao, true));
  if(!fechado) linhasRes.push(fR("r1", "RESULTADO", "Resultado até hoje", ksF.length ? sinalR(recF-(totPag-faltaMostra)) : travessao, sinalR(esperado-(totPag-faltaMostra)), ksF.length ? sinalR(esperado-recF) : travessao));
  linhasRes.push(fR("r2", fechado ? "RESULTADO" : "", fechado ? "Resultado do mês" : "Resultado previsto", sinalR(resNota), sinalR(resDin), sinalR(difRes), true));
  var COLM = [{t:"Mês", w:"19%"}, {t:"Situação", w:"15%"}, {t:"Entra", w:"21%"}, {t:"Sai", w:"23%"}, {t:"Resultado", w:"1fr"}];
  var linhasMeses = [];
  for(var mm = 1; mm<=curM; mm++){   // desde janeiro do ano (Marcus, 10/11/2026)
    var entM = (d.K.t[mm] || {}).rec+((d.A.t.cx || [])[mm-1] || 0)+(mm===curM ? faltaEntMes(mm) : 0), saiM = saiMes(mm);
    linhasMeses.push(e(FileiraCampos,{key:"o"+mm, total:mm===mi, tom:mm===curM ? "#FBBF24" : undefined, title:"Abrir "+MES_LONGO[mm-1], onClick:(function(x){ return function(){ setMes(String(x)); }; })(mm), cells:[MES_LONGO[mm-1]+"/"+ano, mm===curM ? {v:"Em andamento", cor:"#FBBF24"} : "Fechado", brl(entM || 0), brl(saiM), sinalR((entM || 0)-saiM)]}));
  }
  var resumo = e("div",{className:"grid grid-cols-1 items-start gap-2.5"},
    e(Painel,{t:MES_LONGO[m0]+"/"+ano, v:(fechado ? "Resultado " : "Resultado previsto ")+brl(resDin), vermelho:resDin<0},
      e("div",{className:"p-2"},
        e(TabelaCampos,{cols:COLR, minW:"34rem"}, linhasRes),
        e("p",{className:"px-1 pt-2 text-center text-[11px] text-foreground"}, "Notas Fiscais: faturamento lançado em Faturamento. Contas a Receber: o que a DevMaster mostra recebido nas contas. Diferença: Contas a Receber menos Notas Fiscais. Média prevista: total que entra dividido pelos acertos previstos."),
        notaEnt===null && e("p",{className:"px-1 pt-1 text-center text-[11px] text-foreground"}, "Este mês ainda não tem nota fiscal lançada em Faturamento. Só existe o dinheiro."))),
    e(Painel,{t:"Meses ao redor", v:"Clique em um mês para abrir"},
      e("div",{className:"p-2"},
        e(TabelaCampos,{cols:COLM, minW:"40rem"}, linhasMeses, e(PrevisaoMeses,{modo:"linhas", d:d, s:s, sc:sc, hojeD:hojeD, ano:ano})),
        e("p",{className:"px-1 pt-2 text-center text-[11px] text-foreground"}, "Fechado: o que já aconteceu. Em andamento: o mês de hoje, com a previsão do que falta. Previsto: meses que vêm. O sinal ≥ no Sai mostra que só entrou o que já está lançado; ainda entram contas novas."))));

  // FATURAMENTO E RECEBER em layout D (Marcus, 10/11/2026): um bloco embaixo do outro, texto de "De onde vem" curto e em uma linha só; início do mês e adiadas no topo.
  var COLO = [{t:"Grupo", w:"15%"}, {t:"Linha", w:"27%"}, {t:"Valor", w:"15%"}, {t:"De onde vem", w:"1fr"}];
  var TOMO = {i:"#A78BFA", a:"#60A5FA", f:"#34D399", c:"#FB923C", r:"#E8B84B", v1:"#34D399", v2:"#34D399", v3:"#FBBF24", v4:"#FBBF24", v5:"#FBBF24", m:"#60A5FA", p:"#A78BFA", z:"#E8B84B"};
  var fO = function(k, grupo, linha, valor, onde, total){ var tom = TOMO[k] || TOMO[k.charAt(0)]; return e(FileiraCampos,{key:k, total:total, tom:tom, cells:[grupo ? {v:grupo, cor:tom} : "", linha, valor, onde]}); };
  var mmF = ((s.metaMensal || {})[String(ano)] || {})[m0] || {}, iniF = Number(mmF.base) || 0, prevIniF = Number(mmF.inicio) || 0;
  var adiadasF = (prevIniF>0 && totF>0) ? Math.max(0, prevIniF-totF) : null, ultDiaF = ksF.length ? dm(ksF[ksF.length-1]).slice(0, 5) : "";
  var lf = [];
  if(iniF>0 || prevIniF>0){
    lf.push(fO("i1", "INÍCIO DO MÊS", "Revendedoras no início", iniF>0 ? nF(iniF) : "—", "Total do dia 1º, lido da DevMaster"));
    lf.push(fO("i2", "", "Acertos previstos no início", prevIniF>0 ? nF(prevIniF) : "—", "Abertura do mês: revendedoras com acerto previsto até o fim do mês"));
    if(!fechado) lf.push(fO("i3", "", "Já adiadas (saíram do previsto)", adiadasF===null ? "—" : nF(adiadasF), "Previsto do início menos o total de acertos de hoje"));
  }
  lf.push(fO("a1", "ACERTOS", "Acertos feitos", nF(acF), ksF.length ? "Faturamento lançado até "+ultDiaF : "Nada lançado neste mês"));
  if(!fechado){
    lf.push(fO("a2", "", "Vendas no Carregar", ambar(nF(carF)), "Vendas ainda sem valor; ficam fora dos acertos feitos"));
    lf.push(fO("a3", "", "Acertos a realizar", nF(arF), "Revendedoras que ainda vão acertar até o fim do mês"));
    lf.push(fO("a4", "", "Total de acertos do mês", nF(totF), "Feitos mais Carregar mais a realizar", true));
    lf.push(fO("a5", "", "Acertos esperados a "+pctF+"%", nF(alvoF), "Total do mês vezes a meta"));
  }
  lf.push(fO("f1", "FATURAMENTO", "Faturamento lançado", verde(brl(recF)), "Acumulado lançado em Faturamento (notas fiscais)"));
  lf.push(fO("f2", "", "Média por acerto", brl(medF), "Faturamento lançado dividido pelos acertos feitos"));
  lf.push(fO("f3", "", "Média recebida na hora", Kn.n ? verde(brl(Kn.rec/Kn.n)) : "—", "Pago na hora dividido pelas revendedoras que acertaram (DevMaster)"));
  lf.push(fO("f4", "", "Pago na hora", Kn.fat>0 ? Math.round(Kn.rec/Kn.fat*100)+"%" : "—", "Parte do faturado que entrou na hora; o resto vira acerto com loja"));
  if(!fechado){
    lf.push(fO("f5", "", "Faturamento previsto", verde(brl(prevF)), "Acertos esperados vezes a média"));
    if(faltaEnt!==null){
      lf.push(fO("f6", "", "Falta entrar até o fim do mês", verde(brl(faltaEnt)), "Previsão da aba Previsão: acertos que faltam, média e % pago na hora"));
      lf.push(fO("f7", "", "Entrada total prevista", verde(brl(entradaF)), "Faturamento lançado mais o que falta entrar", true));
    }
  }
  lf.push(fO("c1", "CONTAS A PAGAR", "Já pago no mês", verde(brl(pago)), srvP ? "Baixas do mês na DevMaster e pagamentos dados no sistema" : "ATENÇÃO: DevMaster não carregou; valor do admin antigo"));
  lf.push(fO("c2", "", "Falta pagar no mês", ambar(brl(faltaMostra)), fechado ? "Títulos em aberto do mês" : "Maior valor entre a DevMaster e o admin antigo"));
  lf.push(fO("c3", "", "Total de contas a pagar", brl(totPag), "Já pago mais o que falta pagar", true));
  lf.push(fO("r1", "RESULTADO", fechado ? "Resultado do mês" : "Resultado previsto", resMostra<0 ? verm(brl(resMostra)) : verde(brl(resMostra)), fechado ? "Faturamento lançado menos as contas a pagar" : "Faturamento previsto menos as contas a pagar", true));
  var painelFat = e(Painel,{t:"Faturamento · "+MES_LONGO[m0], v:ksF.length ? nF(acF)+" acertos feitos · "+brl(recF) : "Sem faturamento lançado"}, e("div",{className:"p-2"}, e(TabelaCampos,{cols:COLO, minW:"44rem"}, lf)));
  var lr = [];
  lr.push(fO("v1", "RECEBIDO NA VENDA", "Revendedoras", brl(recRev), "Pix, link, cartão e dinheiro pagos na hora, sem funcionárias"));
  lr.push(fO("v2", "", "Funcionárias", brl(recFun), "Compras pagas na hora (grupo Funcionários do cadastro)"));
  lr.push(fO("v3", "INADIMPLÊNCIA ANTIGA", "Revendedoras", brl(antRev), "Acerto com loja de meses e anos anteriores pago neste mês"));
  lr.push(fO("v4", "", "Funcionárias", brl(antFun), "Acerto com loja antigo de funcionárias pago neste mês"));
  lr.push(fO("v5", "", "Esperado entrar nas contas", brl(esperado), "Soma das quatro linhas acima", true));
  lr.push(fO("m1", "FATURADO", "Todas as vendas do mês", brl(faturado), "Recebido na venda mais o acerto com loja lançado no mês"));
  lr.push(fO("m2", "", "Inadimplência do mês", verm(brl(inadMes)), "Vendido no mês e não pago na hora, com funcionárias"));
  lr.push(fO("m3", "", "Ainda em aberto", verm(brl(inadAberto)), "O que continua sem baixa agora"));
  if(!fechado && faltaEnt!==null){
    lr.push(fO("p1", "PREVISÃO", "Falta entrar até o fim do mês", verde(brl(faltaEnt)), "Mesma previsão da aba Previsão"));
    lr.push(fO("p2", "", "Entrada total prevista", verde(brl(entradaR)), "Esperado entrar mais o que falta entrar", true));
  }
  lr.push(fO("z1", "RESULTADO", "Total de contas a pagar", brl(totPag), "Já pago mais o que falta pagar (aba Pagar)"));
  lr.push(fO("z2", "", fechado ? "Resultado do mês" : "Resultado previsto", resRec<0 ? verm(brl(resRec)) : verde(brl(resRec)), fechado ? "Esperado entrar menos as contas a pagar" : "Entrada total prevista menos as contas a pagar", true));
  var painelRec = e(Painel,{t:"Receber · DevMaster · "+MES_LONGO[m0], v:brl(esperado)+" esperado"}, e("div",{className:"p-2"}, e(TabelaCampos,{cols:COLO, minW:"44rem"}, lr)));

  return e(Pagina,null,
    e("div",{className:"flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/60 p-2"},
      Sel(null, mes, MES_LONGO.slice(0, hojeD.getMonth()+1).map(function(n, i){ return [String(i+1), n+"/"+ano]; }), setMes, "Mês"),
      e("button",{type:"button", title:"Atualizar da DevMaster", "aria-label":"Atualizar da DevMaster", onClick:function(){ carrega(true); }, className:H+" w-8 rounded-md border border-border text-[15px] hover:bg-white/10"}, "↻"),
      e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em] "+(d.atualizando ? "text-warning" : "text-muted-foreground"), role:"status"}, d.atualizando ? "Atualizando da DevMaster… "+(d.pct || 0)+"%" : "DevMaster · "+new Date(d.geradoEm).toLocaleString("pt-BR", {day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit"})+(pr.fim ? " · saldo das contas até "+dm(pr.fim.data) : ""))),
    e(AbasTela,{abas:[["res", "Resumo"], ["rec", "Faturamento e receber"], ["pag", "Pagar"], ["ent", "Entrou nas contas"], ["prev", "Previsão"]], atual:aba, onMudar:setAba}),
    aba==="res" && resumo,
    e("div",{className:"grid grid-cols-1 gap-2.5"},
      aba==="rec" && painelFat,
      aba==="rec" && painelRec,
      aba==="pag" && e(Painel,{t:"Pagar · "+(srvP || listaAp>0 ? "DevMaster" : "admin antigo")+" · "+MES_LONGO[m0], v:brl(totPag)+" no mês"},
        Lw(C3, ["Linha", "Valor", "De onde vem"], true, "h"),
        Lw(C3, ["Já pago no mês", verde(brl(pago)), srvP ? "Baixas do mês pela data de débito na DevMaster, mais os pagamentos dados no sistema" : doAdmin ? "Total do mês do admin antigo (faturamento_contas_mes)" : "Soma dos dias lançados em contas pagas"], false, "p1"),
        Lw(C3, ["Falta pagar no mês", ambar(brl(faltaMostra)), srvP ? "Títulos em aberto que vencem no mês, na DevMaster" : doAdmin ? "A pagar do mês no admin antigo" : "A pagar das contas da lista"], false, "p2"),
        Lw(C3, ["Total do mês a pagar", brl(totPag), "Já pago mais o que falta"], false, "p3", null, forte))),
    aba==="ent" && e(Painel,{t:"Entrou de verdade nas contas · "+MES_LONGO[m0], v:entrou===null ? "Sem saldo lançado" : brl(entrou)},
      Lw(C3, ["Linha", "Valor", "De onde vem"], true, "h"),
      Lw(C3, ["Saldo das contas no início do mês", pr.ini ? brl(pr.ini.real) : "—", pr.ini ? "Fechamento de "+dm(pr.ini.data)+" (contas bancárias, sem as bloqueadas)" : "Sem saldo lançado antes do mês"], false, "e1"),
      Lw(C3, ["Saldo das contas agora", pr.fim ? brl(pr.fim.real) : "—", pr.fim ? "Fechamento de "+dm(pr.fim.data) : "Sem saldo lançado no mês"], false, "e2"),
      Lw(C3, ["Resultado do mês até agora (variação do saldo)", temSaldo ? (pr.variacao<0 ? verm(brl(pr.variacao)) : verde(brl(pr.variacao))) : "—", "Saldo agora menos saldo do início: o que sobrou (verde) ou faltou (vermelho) nas contas"], false, "e3", null, forte),
      Lw(C3, ["Mais: contas pagas no mês", brl(pago), "O que saiu das contas para pagar contas"], false, "e4"),
      Lw(C3, ["Entrou de verdade", entrou===null ? "—" : verde(brl(entrou)), "Variação do saldo mais contas pagas"], false, "e5", null, forte),
      Lw(C3, ["Menos: esperado entrar (DevMaster)", brl(esperado), "Quadro Receber acima"], false, "e6"),
      Lw(C3, [dif===null ? "Diferença" : dif>=0 ? "Diferença a favor: entrou nas contas e a DevMaster ainda não baixou" : "Diferença contra: baixado na DevMaster e ainda não entrou nas contas", dif===null ? "—" : (dif>=0 ? verde(brl(dif)) : verm(brl(dif))), dif===null ? "" : dif>=0 ? "Dinheiro que já está nas contas e o DevMaster ainda não baixou" : "Conferir pagamentos ainda não lançados em contas pagas, e o saldo do dia"], false, "e7", null, forte)),
    aba==="prev" && e(PrevisaoMeses,{d:d, s:s, sc:sc, hojeD:hojeD, ano:ano}),
    erro && e("p",{role:"alert", className:"rounded-lg bg-destructive/15 px-3 py-2 text-center text-[13px] font-semibold text-destructive"}, erro));
}
export { AbaResultadoMes };

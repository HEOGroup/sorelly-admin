// Sorelly Admin · montagem — pages/ResultadoMes.js
// Financeiro › Resultado do mês (Marcus, 27/10/2026): a visão-mãe do dinheiro. RECEBER (DevMaster) × PAGAR (admin antigo) e o que ENTROU DE VERDADE nas contas.
// "Cansei de operar no negativo, quero ter controle total." Regras e fontes: docs/negocio/RESULTADO-DO-MES.md (números reais em RESULTADO-DO-MES.local.md, fora do Git).
//   Receber  = recebido na venda (Pix, link, cartão, dinheiro) + acerto - loja de meses antigos que pagou no mês; revendedoras e funcionárias (grupo do cadastro) separadas. Vem de /api/contas-receber.
//   Pagar    = pago e falta pagar do mês, do admin antigo (s.contasPagar, faturamento_contas_mes); sem esse dado, a soma dos dias lançados.
//   Entrou de verdade = variação do saldo das contas bancárias + contas pagas no mesmo período. A diferença para o DevMaster é dinheiro que entrou e ainda não foi baixado (ou o contrário: conferir).
// Próxima etapa: previsão de acertos dos próximos meses × contas a pagar de cada mês (saldo previsto mês a mês).
import { Pagina } from "@/apps/montagem/components/padrao";
import { AbasTela, H, brl } from "@/apps/montagem/components/padrao-fin";
import { filtrar, totais } from "@/apps/montagem/domain/contas-empresa";
import { contasDoMes, fatEfetivo, projetarVariosAnos, QUEDA_JANEIRO, resumoMensalRevendedoras } from "@/apps/montagem/domain/financeiro";
import { isoDia, provaDoMes } from "@/apps/montagem/domain/saldos-contas";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { Lw } from "@/apps/montagem/pages/ContasReceber";
import { Painel, Sel } from "@/apps/montagem/pages/RevendedorasAtivas";
import { use } from "@/apps/montagem/state/context";
import { e, useEffect, useState } from "@/shared/react";

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
  var pv = projetarVariosAnos(se, ano, 16, 2, metaPct).porMes, ymDe = function(k){ return (ano+Math.floor(k/12))+"-"+String(k%12+1).padStart(2, "0"); };
  // mês atual: o que ainda falta entrar e pagar
  var kA = d.K.n[mA+1] || {}, mediaA = kA.n ? kA.fat/kA.n : media, pagoA = kA.fat>0 ? kA.rec/kA.fat : pago;
  var restAc = Math.round((ap.restoMes || 0)*pct), diasMes = new Date(ano, mA+1, 0).getDate(), restDias = Math.max(0, diasMes-hojeD.getDate());
  var entA = restAc*mediaA*pagoA+(antMed+funMed)*restDias/diasMes;
  var pmA = ((s.contasPagar || {})[String(ano)] || {})[mA] || {}, listaA = totais(filtrar(ano+"-"+String(mA+1).padStart(2, "0"), "", "", "", "", "")).apagar || 0, faltaA = listaA>0 ? listaA : (pmA.apagar || 0);
  var prA = provaDoMes(sc, ano, mA, 0, 0, isoDia(hojeD)), saldo0 = prA.fim ? prA.fim.real : null;
  var saldoA = saldo0===null ? null : saldo0+entA-faltaA;
  // próximos 3 meses
  // Razão de outubro (Marcus, 28/10/2026): acertos do mês ÷ revendedoras no dia 1 do mês; vale para os meses seguintes.
  var iniMes = (resumoMensalRevendedoras(s, ano)[mA] || {}).ini || 0, fmA = (s.fechaMes || {})[ano+"-"+String(mA+1).padStart(2, "0")] || {}, ksA = Object.keys(fd).filter(function(x){ return x.slice(0, 7)===ano+"-"+String(mA+1).padStart(2, "0"); }).sort();
  var prevA = (ksA.length ? (fd[ksA[ksA.length-1]].acertos || 0) : 0)+(Number(fmA.carregar) || 0)+(Number(fmA.aRealizar) || 0), razao = iniMes>0 ? prevA*pct/iniMes : 0;
  var cols = [], acum = saldoA, cresD = (Number(cresDez) || 0)/100;
  for(var j = 1; j<=5; j++){
    var k = mA+j, anoJ = ano+Math.floor(k/12), mJ = k%12, conhecido = (ap.porMes || {})[ymDe(k)] || 0;
    var revJ = ((pv[k] || {}).revendedoras || 0);
    if(k>11) revJ = revJ-(1-cresD)*(((pv[12] || {}).revendedoras || 0)-((pv[11] || {}).revendedoras || 0))-QUEDA_JANEIRO;   // dezembro cresce menos (só até o dia 15) e janeiro perde revendedoras; vale daí em diante
    var ac = Math.round(revJ*razao);
    var m = mediaA*(1+((Number(j===1 ? altaA : j===2 ? altaB : altaJ) || 0)/100));   // fevereiro e março seguem a alta de janeiro
    var venda = ac*m*pagoA, ent = venda+antMed+funMed, apJ = ((s.contasPagar || {})[String(anoJ)] || {})[mJ], adm = apJ && (apJ.apagar || apJ.pago) ? (apJ.apagar || 0) : 0, lanc = totais(filtrar(ymDe(k), "", "", "", "", "")).total;
    var ap2 = Math.max(adm, lanc), est = adm<lanc*0.999 || adm===0;   // admin antigo quando é maior; senão o que já está lançado (planilhas do DevMaster): contas de mês distante ainda estão sendo lançadas
    var res = ap2===null ? null : ent-ap2; if(acum!==null && res!==null) acum += res; else acum = null;
    cols.push({lanc:lanc, nome:MES_LONGO[mJ]+"/"+anoJ, ac:ac, rev:Math.round(revJ), conhecido:conhecido, m:m, venda:venda, ent:ent, ap:ap2, est:est, res:res, saldo:acum});
  }
  var G = "1.9fr repeat(6, 1fr)", sinal = function(v){ return v===null ? "—" : v<0 ? verm(brl(v)) : verde(brl(v)); };
  var campo = function(rot, val, set){ return e("label",{className:"flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[.05em] text-foreground"}, rot, e("input",{type:"number", value:val, onChange:function(ev){ set(ev.target.value); }, className:H+" w-20 rounded-md border border-border bg-card px-2 text-right text-[13px] normal-case text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"})); };
  var ult = cols[cols.length-1].saldo;
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
    e("p",{className:"px-3 py-1.5 text-center text-[11px] text-foreground"}, "Acertos: data de devolução prevista dos kits abertos na DevMaster, lida às "+new Date(ap.geradoEm).toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit"})+". Meses seguintes: revendedoras no dia 1 × a razão de acertos do mês atual; dezembro cresce "+cresDez+"% do normal (só até o dia 15) e janeiro perde "+QUEDA_JANEIRO+" revendedoras. Média, % pago na hora, inadimplência antiga e funcionárias: média dos últimos "+qm+" meses fechados. Saldo parte de "+(saldo0===null ? "—" : brl(saldo0))+" agora. Contas a pagar de cada mês: o maior entre o admin antigo e o que já está lançado nas planilhas do DevMaster; com ≥ é só o lançado até hoje, e ainda entram contas novas (o resultado desse mês é o melhor caso)."));
  // MÊS ATUAL (Marcus, 28/10/2026): só o que falta; no fim, o que entrou, o que falta e o resultado do pago e a pagar
  var C3p = "2.4fr 1.2fr 2.6fr", pagoMes = (pmA.pago || 0)>0 ? pmA.pago : (contasDoMes(s, String(ano), mA).pago || 0), entrouMes = (prA.variacao===null || prA.variacao===undefined) ? null : prA.variacao+pagoMes;
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
    Lw(C3p, ["Total que falta pagar", ambar(brl(faltaA)), "Títulos em aberto do mês"], false, "m5", null, forte),
    Lw(C3p, ["Resultado do que falta", sinal(entA-faltaA), "Falta entrar menos falta pagar"], false, "m6", null, forte),
    Lw(C3p, ["FECHAMENTO DO MÊS", "", ""], true, "mf"),
    Lw(C3p, ["Acertos do mês", nA(prevA), "Realizados "+nA(acFeitos)+" mais Carregar "+nA(carA)+" mais a realizar "+nA(arA)], false, "f0"),
    Lw(C3p, ["Entrou no mês", entrouMes===null ? "—" : verde(brl(entrouMes)), "Variação do saldo das contas mais o que foi pago"], false, "f1"),
    Lw(C3p, ["Falta entrar", verde(brl(entA)), "Linha acima"], false, "f2"),
    Lw(C3p, ["Entrada total do mês", entTotal===null ? "—" : verde(brl(entTotal)), "Entrou mais o que falta entrar"], false, "f3", null, forte),
    Lw(C3p, ["Pago no mês", brl(pagoMes), "Total do mês do admin antigo"], false, "f4"),
    Lw(C3p, ["Falta pagar", ambar(brl(faltaA)), "Linha acima"], false, "f5"),
    Lw(C3p, ["Saída total do mês", brl(saiTotal), "Pago mais o que falta pagar"], false, "f6", null, forte),
    Lw(C3p, ["Resultado final do mês", resFinal===null ? "—" : sinal(resFinal), "Entrada total menos saída total"], false, "f7", null, forte));
  return e("div",{className:"flex flex-col gap-2.5"}, painelMes,
    e("button",{type:"button", onClick:function(){ setVerMais(!verMais); }, className:H+" self-start rounded-md border border-border px-3 text-[13px] hover:bg-white/10"}, verMais ? "Esconder os próximos meses" : "Ver os próximos meses"),
    verMais && painelMeses);
}

function AbaResultadoMes(){
  var cx = use(), s = cx.state, sc = s.saldosContas, hojeD = new Date(), hoje = isoDia(hojeD), ano = hojeD.getFullYear();
  var sm = useState(String(hojeD.getMonth()+1)), mes = sm[0], setMes = sm[1], sd = useState(null), d = sd[0], setD = sd[1], se = useState(""), erro = se[0], setErro = se[1], sab = useState("rec"), aba = sab[0], setAba = sab[1];
  var carrega = function(forcar){ chamar("GET", "/contas-receber"+(forcar ? "?atualizar=1" : "")).then(function(x){ setD(x); setErro(x.erro && !x.pronto ? x.erro : ""); }).catch(function(x){ setErro(x.message); }); };
  useEffect(function(){ if(apiAtiva()) carrega(false); }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(function(){ if(!d || (d.pronto && !d.atualizando)) return; var id = setTimeout(function(){ carrega(false); }, 4000); return function(){ clearTimeout(id); }; }, [d]);   // eslint-disable-line react-hooks/exhaustive-deps
  if(!apiAtiva()) return e(Pagina,null, e("p",{className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Esta tela lê a DevMaster pelo servidor. Entre no sistema com o servidor ligado."));
  if(erro && !d) return e(Pagina,null, e("p",{role:"alert", className:"rounded-lg bg-destructive/15 px-3 py-2 text-center text-[13px] font-semibold text-destructive"}, erro));
  if(!d || !d.pronto) return e(Pagina,null, e("p",{role:"status", className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Lendo os títulos a receber da DevMaster… "+(d && d.etapa ? d.etapa+" · "+(d.pct || 0)+"%" : "a primeira vez demora alguns minutos")));

  var mi = Number(mes), m0 = mi-1, Kt = d.K.t[mi] || {}, Kn = d.K.n[mi] || {}, cxT = (d.A.t.cx || [])[m0] || 0, cxN = (d.A.n.cx || [])[m0] || 0;
  // RECEBER
  var recRev = Kn.rec || 0, recFun = (Kt.rec || 0)-(Kn.rec || 0), antRev = cxN, antFun = cxT-cxN, recVenda = Kt.rec || 0, esperado = recVenda+cxT;
  var inadMes = Kt.ace || 0, inadAberto = Kt.s || 0, faturado = Kt.fat || 0;
  // PAGAR (admin antigo)
  var pm = ((s.contasPagar || {})[String(ano)] || {})[m0] || {}, somaDias = contasDoMes(s, String(ano), m0).pago || 0, doAdmin = (pm.pago || 0)>0, pago = doAdmin ? pm.pago : somaDias, listaAp = totais(filtrar(ano+"-"+String(mi).padStart(2, "0"), "", "", "", "", "")).apagar || 0;   // lista de títulos em aberto lida da DevMaster (28/10/2026): é mais nova que o número parado do admin antigo
  var falta = listaAp>0 ? listaAp : doAdmin ? (pm.apagar || 0) : (contasDoMes(s, String(ano), m0).apagar || 0);
  // ENTROU DE VERDADE
  var pr = provaDoMes(sc, ano, m0, 0, 0, hoje), temSaldo = pr.variacao!==null && pr.variacao!==undefined, entrou = temSaldo ? pr.variacao+pago : null, dif = entrou===null ? null : entrou-esperado;
  // FATURAMENTO (o que o Marcus lança em Faturamento): acertos feitos, Carregar, a realizar e a previsão do mês
  var ymSel = ano+"-"+String(mi).padStart(2, "0"), fdS = fatEfetivo(s), ksF = Object.keys(fdS).filter(function(x){ return x.slice(0, 7)===ymSel; }).sort(), ultF = ksF.length ? fdS[ksF[ksF.length-1]] : {};
  var fmF = (s.fechaMes || {})[ymSel] || {}, nF = function(v){ return Math.round(v || 0).toLocaleString("pt-BR"); }, acF = ultF.acertos || 0, recF = ultF.recebido || 0, carF = Number(fmF.carregar) || 0, arF = Number(fmF.aRealizar) || 0;
  var mpF = Number(s.metaPct), pctF = (mpF>=97 && mpF<=99 ? mpF : 98), totF = acF+carF+arF, alvoF = Math.round(totF*pctF/100), medF = acF>0 ? recF/acF : 0, prevF = alvoF*medF, resF = prevF-(pago+falta);
  var C3 = "2.4fr 1.2fr 2.6fr";

  return e(Pagina,null,
    e("div",{className:"flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/60 p-2"},
      Sel("Janeiro", mes, MES_LONGO.slice(0, hojeD.getMonth()+1).map(function(n, i){ return [String(i+1), n+"/"+ano]; }), setMes, "Mês"),
      e("button",{type:"button", title:"Atualizar da DevMaster", "aria-label":"Atualizar da DevMaster", onClick:function(){ carrega(true); }, className:H+" w-8 rounded-md border border-border text-[15px] hover:bg-white/10"}, "↻"),
      e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em] "+(d.atualizando ? "text-warning" : "text-muted-foreground"), role:"status"}, d.atualizando ? "Atualizando da DevMaster… "+(d.pct || 0)+"%" : "DevMaster · "+new Date(d.geradoEm).toLocaleString("pt-BR", {day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit"})+(pr.fim ? " · saldo das contas até "+dm(pr.fim.data) : ""))),
    e(AbasTela,{abas:[["rec", "Faturamento e receber"], ["pag", "Pagar"], ["ent", "Entrou nas contas"], ["prev", "Previsão"]], atual:aba, onMudar:setAba}),
    e("div",{className:"grid gap-2.5 "+(aba==="rec" ? "grid-cols-[repeat(auto-fit,minmax(30rem,1fr))]" : "grid-cols-1")},
      aba==="rec" && e(Painel,{t:"Faturamento · "+MES_LONGO[m0], v:ksF.length ? nF(acF)+" acertos feitos · "+brl(recF) : "Sem faturamento lançado"},
        Lw(C3, ["Linha", "Valor", "De onde vem"], true, "h"),
        Lw(C3, ["Acertos feitos no mês", nF(acF), ksF.length ? "Faturamento lançado até "+dm(ksF[ksF.length-1]) : "Nada lançado neste mês"], false, "f1"),
        Lw(C3, ["Vendas no Carregar", ambar(nF(carF)), "Vendas ainda sem valor lançado; não estão dentro dos acertos feitos"], false, "f2"),
        Lw(C3, ["Acertos ainda a realizar", nF(arF), "Revendedoras que ainda vão acertar até o fim do mês"], false, "f3"),
        Lw(C3, ["Total de acertos do mês", nF(totF), "Feitos mais Carregar mais a realizar"], false, "f4", null, forte),
        Lw(C3, ["Acertos esperados a "+pctF+"%", nF(alvoF), "Total do mês vezes a meta"], false, "f5"),
        Lw(C3, ["Faturamento lançado no mês", verde(brl(recF)), "Acumulado lançado em Faturamento"], false, "f6"),
        Lw(C3, ["Média por acerto (notas fiscais)", brl(medF), "Faturamento lançado dividido pelos acertos feitos, como no relatório de notas fiscais"], false, "f7"),
        Lw(C3, ["Média real recebida por acerto", Kn.n ? verde(brl(Kn.rec/Kn.n)) : "—", "O que as revendedoras pagaram na hora (Pix, link, cartão e dinheiro) dividido pelas revendedoras que acertaram, na DevMaster"], false, "f7b", null, forte),
        Lw(C3, ["Pago na hora", Kn.fat>0 ? Math.round(Kn.rec/Kn.fat*100)+"%" : "—", "Parte do faturado que entrou na hora; o resto vira acerto - loja"], false, "f7c"),
        Lw(C3, ["Faturamento previsto do mês", verde(brl(prevF)), "Acertos esperados vezes a média"], false, "f8"),
        Lw(C3, ["Resultado previsto do mês", resF<0 ? verm(brl(resF)) : verde(brl(resF)), "Faturamento previsto menos o total a pagar do mês (já pago mais o que falta)"], false, "f9", null, forte)),
      aba==="rec" && e(Painel,{t:"Receber · DevMaster · "+MES_LONGO[m0], v:brl(esperado)+" esperado"},
        Lw(C3, ["Linha", "Valor", "De onde vem"], true, "h"),
        Lw(C3, ["Recebido na venda · revendedoras", brl(recRev), "Pix, link, cartão e dinheiro pagos na hora, sem as funcionárias do cadastro"], false, "r1"),
        Lw(C3, ["Recebido na venda · funcionárias", brl(recFun), "Compras de funcionárias pagas na hora (grupo FUNCIONÁRIOS do cadastro)"], false, "r2"),
        Lw(C3, ["Inadimplência antiga recebida · revendedoras", brl(antRev), "Acerto - loja de meses e anos anteriores que foi pago neste mês"], false, "r3"),
        Lw(C3, ["Inadimplência antiga recebida · funcionárias", brl(antFun), "Acerto - loja antigo de funcionárias que foi pago neste mês"], false, "r4"),
        Lw(C3, ["Esperado entrar nas contas", brl(esperado), "Soma das quatro linhas acima"], false, "r5", null, forte),
        Lw(C3, ["Faturado no mês (todas as vendas)", brl(faturado), "Recebido na venda mais o acerto - loja lançado no mês"], false, "r6"),
        Lw(C3, ["Inadimplência do mês (acerto - loja lançado)", verm(brl(inadMes)), "Vendido no mês e não pago na hora, com as funcionárias"], false, "r7"),
        Lw(C3, ["Da inadimplência do mês, ainda em aberto", verm(brl(inadAberto)), "O que continua sem baixa agora"], false, "r8")),
      aba==="pag" && e(Painel,{t:"Pagar · "+(listaAp>0 ? "DevMaster" : "admin antigo")+" · "+MES_LONGO[m0], v:brl(pago+falta)+" no mês"},
        Lw(C3, ["Linha", "Valor", "De onde vem"], true, "h"),
        Lw(C3, ["Já pago no mês", verde(brl(pago)), doAdmin ? "Total do mês do admin antigo (faturamento_contas_mes)" : "Soma dos dias lançados em contas pagas"], false, "p1"),
        Lw(C3, ["Falta pagar no mês", ambar(brl(falta)), doAdmin ? "A pagar do mês no admin antigo" : "A pagar das contas da lista"], false, "p2"),
        Lw(C3, ["Total do mês a pagar", brl(pago+falta), "Já pago mais o que falta"], false, "p3", null, forte))),
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

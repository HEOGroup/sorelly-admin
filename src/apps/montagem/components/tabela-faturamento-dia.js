// Sorelly Admin · montagem — components/tabela-faturamento-dia.js
// Aba "Dia a dia" da tela Faturamento, no padrão do Financeiro de 12/11/2026 (a mesma peça da tela Contas a pagar: TabelaPlanilha dentro do bloco azul, filtro no nome de cada coluna).
// Três visões, escolhidas no botão da faixa azul de cima: Faturamento · Contas pagas · Saldo (faturamento do dia menos contas pagas, com o acumulado).
// Faturamento (pedido do Marcus, 12/11/2026): Dia · Acertos · Recebido · Média · Previsto · % do previsto · Faturamento previsto. Acertos e recebido são o ACUMULADO do mês até o dia.
// Previsto do dia = acertos feitos + Carregar + a realizar daquele dia (s.restanteDia); sem registro no dia, vale o último previsto anterior do mês, ou o do fechamento do mês (s.fechaMes).
// Faturamento previsto = média do dia × acertos previstos a X% (X = meta do mês, s.metaPct). Valor do dia = acumulado do dia − acumulado do dia anterior.
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { COR, Segmentado, corSinal, brl } from "@/apps/montagem/components/padrao-fin";
import { contasDoMes, fatEfetivo } from "@/apps/montagem/domain/financeiro";
import { filtrar, servidorEm, setBaixas, setClasse, setLancamentos, setPf, totais } from "@/apps/montagem/domain/contas-empresa";
import { BKC } from "@/apps/montagem/lib/format";
import { e, useState } from "@/shared/react";

var SEMANA = ["dom","seg","ter","qua","qui","sex","sáb"];
var p2 = function(n){ return String(n).padStart(2,"0"); };
var n0 = function(v){ return Math.round(v).toLocaleString("pt-BR"); };
var r2 = function(v){ return Math.round(v*100)/100; };
var ymd = function(a, m, d){ return a+"-"+p2(m+1)+"-"+p2(d); };

// monta as linhas do mês (ano, mes 0-11) a partir do acumulado; null se o mês não tem dia a dia (só o fechamento)
function montar(s, ano, mes){
  var fd = fatEfetivo(s), dias = new Date(ano, mes+1, 0).getDate(), regs = [];
  for(var d=1; d<=dias; d++){ if(fd[ymd(ano, mes, d)]) regs.push(d); }
  if(regs.length<3) return null;
  var ult = regs[regs.length-1], cpd = s.contasPagasDiario || {}, rd = s.restanteDia || {}, fm = (s.fechaMes || {})[ano+"-"+p2(mes+1)] || {};
  var pct = (s.metaPct || 98)/100, prevAnt = null, ini = ((((s.metaMensal || {})[ano] || {})[mes]) || {}).inicio || null;   // previsto do INÍCIO do mês (não muda): a coluna Diferença mostra quanto o previsto mudou desde então
  var pagoReal = function(iso){ var x = cpd[iso]; if(!x) return 0; return r2(Object.keys(x.cnpjs||{}).reduce(function(t, k){ return t+(x.cnpjs[k]||0); }, 0)+(x.contasPorFora||0)); };
  var linhas = [], cumR = 0, cumA = 0;
  for(var dia=1; dia<=ult; dia++){
    var iso = ymd(ano, mes, dia), x = fd[iso], tem = x && x.recebido!==undefined;
    var rr = tem ? (x.recebido||0) : cumR, aa = tem ? (x.acertos||0) : cumA, parcial = !!(x && x.parcial);
    var dr = r2(Math.max(0, rr-cumR)), da = Math.max(0, aa-cumA); cumR = Math.max(cumR, rr); cumA = Math.max(cumA, aa);
    var rs = rd[iso], prev = rs ? (rs.feitos||0)+(rs.carregar||0)+(rs.aRealizar||0) : prevAnt;
    if(dia===ult && !rs && (fm.aRealizar || fm.carregar)) prev = cumA+(fm.carregar||0)+(fm.aRealizar||0);   // 19/11/2026: o último dia vale o Carregar e o a realizar do fechamento do mês (gravados no servidor), não um previsto antigo guardado só neste navegador
    if(prev!==null) prevAnt = prev;
    var prevPct = prev ? Math.round(prev*pct) : null, media = cumA>0 ? Math.round(cumR/cumA*100+1e-6)/100 : 0;   // arredonda a metade para cima, como o relatório do Marcus (R$ 648,195 vira R$ 648,20)
    linhas.push({id:iso, dia:p2(dia)+"/"+p2(mes+1)+" · "+SEMANA[new Date(ano, mes, dia).getDay()]+(parcial ? " · hoje" : ""), da:da, dr:dr, a:cumA, r:cumR, media:media, mdia:(da>0 ? Math.round(dr/da*100+1e-6)/100 : 0), ini:ini, prev:prev, dif:(prev!==null && ini) ? prev-ini : null, prevPct:prevPct, fatPrev:prevPct ? r2(((dia===ult && fm.mediaPrev>0) ? fm.mediaPrev : media)*prevPct) : null, crA:(x && x.cr!==undefined ? x.cr : null), inaA:(x && x.ina!==undefined ? x.ina : null), contas:pagoReal(iso), car:(s.carregarDia||{})[iso], carr:(rs ? (rs.carregar||0) : ((s.carregarDia||{})[iso]||0)), arz:(prev===null ? null : Math.max(0, prev-cumA-(rs ? (rs.carregar||0) : ((s.carregarDia||{})[iso]||0))))});   // carr e arz: Carregar e A realizar do dia (aba Acertos)
  }
  return {linhas:linhas, ult:ult, pct:Math.round(pct*100)};
}

var VISOES = [["fat","Faturamento"],["contas","Contas pagas"],["vs","Saldo"]];

function DiaADia(p){
  var sbase = useState("nf"), base = sbase[0], setBase = sbase[1], spanRes = 3;
  var cpeS = (p.s && p.s.cpe) || {}; setClasse(cpeS.classe); setLancamentos(cpeS.lanc); setBaixas(cpeS.baixas); setPf(p.s && p.s.pf);   // as mesmas contas da tela Contas a pagar: baixas do Admin e Pix de Pagamentos a fornecedores (20/11/2026)
  var dados = montar(p.s, p.ano, p.mes), visao = p.visao || "fat";
  if(!dados) return e("p",{className:"px-4 py-6 text-center text-[13px] text-foreground"}, "Este mês só tem o fechamento (total do mês), sem o dia a dia.");
  var L = dados.linhas, ac = 0, sa = 0;
  var mostra = function(v, fmt){ return v===null || v===undefined ? "—" : fmt(v); };
  var cols, linhas;
  if(visao==="fat"){
    cols = [{k:"dia", t:"Dia"}, {k:"a", t:"Acertos", fmt:n0, sep:true}, {k:"r", t:"Valor", fmt:BKC, cor:function(l){ return l.r>0 ? COR.entra : ""; }}, {k:"media", t:"Média", fmt:function(v){ return v>0 ? BKC(v) : "—"; }}, {k:"da", t:"Acertos", fmt:n0, sep:true}, {k:"dr", t:"Valor", fmt:BKC, cor:function(l){ return l.dr>0 ? COR.entra : ""; }}, {k:"mdia", t:"Média", fmt:function(v){ return v>0 ? BKC(v) : "—"; }}, {k:"prev", sep:true, t:"Previsto agora", fmt:function(v){ return mostra(v, n0); }}, {k:"dif", t:"Diferença", fmt:function(v){ return mostra(v, function(x){ return (x>0 ? "+" : x<0 ? "−" : "")+n0(Math.abs(x)); }); }, cor:function(l){ return l.dif<0 ? COR.sai : l.dif>0 ? COR.entra : ""; }}, {k:"prevPct", t:dados.pct+"% do previsto", fmt:function(v){ return mostra(v, n0); }}, {k:"fatPrev", t:"Faturamento previsto", fmt:function(v){ return mostra(v, BKC); }},];
    linhas = L;
  } else if(visao==="res"){
    // RESULTADO DO MÊS (Marcus, 16/11/2026; 19/11/2026): três blocos por dia, cada um com Recebido · Contas · Resultado: DIA, MÊS CONSOLIDADO e PREVISTO FINAL DO MÊS.
    // Base do Recebido (botão em cima da tabela): Notas fiscais (relatório de notas fiscais) ou Contas a receber (o que a revendedora pagou na hora, sem acerto-loja); em Contas a receber entra a coluna Inadimplência (acerto-loja ainda em aberto) e o resultado é o valor real que bate com o saldo das contas.
    var cm = contasDoMes(p.s, String(p.ano), p.mes), tCm = totais(filtrar(p.ano+"-"+p2(p.mes+1), "", "", "", "", "")), totalContas = (!!servidorEm() && tCm.n>0) ? r2(tCm.total) : r2((cm.pago || 0)+(cm.apagar || 0)), ca = 0, crPrev = 0, inaPrev = 0, temCr = L.some(function(l){ return l.crA!==null; }), cr = base==="cr" && temCr, razCr = 1;
    var linhasB = L.map(function(l){ var crAc = l.crA!==null ? l.crA : crPrev, inaAc = l.inaA!==null ? l.inaA : inaPrev, drCr = r2(Math.max(0, crAc-crPrev)), diCr = r2(Math.max(0, inaAc-inaPrev)); crPrev = crAc; inaPrev = inaAc;
      return Object.assign({}, l, {drB:cr ? drCr : l.dr, rB:cr ? crAc : l.r, inaD:diCr, inaM:inaAc}); });
    var ultB = linhasB[linhasB.length-1]; razCr = (cr && ultB && ultB.r>0) ? ultB.rB/ultB.r : 1;
    linhas = linhasB.map(function(l){ ca = r2(ca+l.contas); var fp = (cr && l.fatPrev>0) ? r2(l.fatPrev*razCr) : l.fatPrev; return Object.assign({}, l, {cacum:ca, fatPrev:fp, falta:Math.max(0, r2(totalContas-ca)), contasPrev:!(l.fatPrev>0) ? 0 : totalContas, resD:r2(l.drB-l.contas), res:r2(l.rB-ca), resPrev:!(l.fatPrev>0) ? 0 : r2(fp-totalContas)}); });
    var colDia = [{k:"drB", t:"Recebido", fmt:BKC, sep:true, cor:function(l){ return l.drB>0 ? COR.entra : ""; }}].concat(cr ? [{k:"inaD", t:"Inadimplência", fmt:function(v){ return mostra(v, BKC); }, cor:function(l){ return l.inaD>0 ? COR.sai : ""; }}] : [], [{k:"contas", t:"Contas", fmt:BKC, cor:function(l){ return l.contas>0 ? COR.sai : ""; }}, {k:"resD", t:"Resultado", fmt:brl, cor:function(l){ return corSinal(l.resD); }}]);
    var colMes = [{k:"rB", t:"Recebido", fmt:BKC, sep:true, cor:function(l){ return l.rB>0 ? COR.entra : ""; }}].concat(cr ? [{k:"inaM", t:"Inadimplência", fmt:function(v){ return mostra(v, BKC); }, cor:function(l){ return l.inaM>0 ? COR.sai : ""; }}] : [], [{k:"cacum", t:"Contas", fmt:BKC, cor:function(l){ return l.cacum>0 ? COR.sai : ""; }}, {k:"res", t:"Resultado", fmt:brl, cor:function(l){ return corSinal(l.res); }}]);
    cols = [{k:"dia", t:"Dia"}].concat(colDia, colMes, [
      {k:"fatPrev", t:"Recebido", faixa:"#C4B5FD", fmt:function(v){ return mostra(v, BKC); }, sep:true, cor:function(l){ return l.fatPrev>0 ? COR.entra : ""; }}, {k:"contasPrev", t:"Contas", faixa:"#C4B5FD", fmt:BKC, cor:function(l){ return l.contasPrev>0 ? COR.sai : ""; }}, {k:"resPrev", t:"Resultado final", faixa:"#C4B5FD", fmt:function(v){ return mostra(v, brl); }, cor:function(l){ return l.resPrev===null ? "" : corSinal(l.resPrev); }}]);
    spanRes = cr ? 4 : 3;
    // DIAS QUE FALTAM (Marcus, 19/11/2026): linhas PREVISTAS até o fim do mês. Dia útil = segunda a sexta, menos feriado nacional: conta e recebimento NÃO andam em sábado, domingo e feriado.
    //   Recebido: o que falta para o faturamento previsto (média × acertos previstos), repartido pelo desenho do MÊS PASSADO (peso de cada dia da semana no recebimento do mês anterior).
    //   Contas: as contas em aberto, cada uma no seu vencimento; os Pix de revendedora a fornecedor e prestador (a revendedora paga direto, sem data certa) acompanham o ritmo do recebimento; vencimento em dia sem expediente passa para o próximo dia útil, e o que já venceu e segue aberto cai no primeiro dia útil que falta. A última linha fecha igual ao Previsto final.
    var ult0 = linhas[linhas.length-1], totDias = new Date(p.ano, p.mes+1, 0).getDate();
    if(ult0 && ult0.fatPrev>0 && dados.ult<totDias){
      var FER = ["01-01", "04-21", "05-01", "09-07", "10-12", "11-02", "11-15", "11-20", "12-25"], ehUtil = function(a, m0, d0){ var w = new Date(a, m0, d0).getDay(); return w>0 && w<6 && FER.indexOf(p2(m0+1)+"-"+p2(d0))<0; };
      var fut = [], proximoUtil = function(d0){ var q = d0; while(q<=totDias && !ehUtil(p.ano, p.mes, q)) q++; return q; };
      for(var dd=dados.ult+1; dd<=totDias; dd++) fut.push({iso:ymd(p.ano, p.mes, dd), dd:dd, dow:new Date(p.ano, p.mes, dd).getDay(), util:ehUtil(p.ano, p.mes, dd)});
      var utilFut = fut.filter(function(f){ return f.util; });
      var ma = p.mes===0 ? p.ano-1 : p.ano, mm0 = p.mes===0 ? 11 : p.mes-1, dAnt = montar(p.s, ma, mm0), pesoW = {1:0, 2:0, 3:0, 4:0, 5:0}, nW = {1:0, 2:0, 3:0, 4:0, 5:0};
      if(dAnt) dAnt.linhas.forEach(function(l2){ var w2 = new Date(l2.id+"T12:00:00").getDay(); if(w2>=1 && w2<=5 && l2.dr>0){ pesoW[w2] += l2.dr; nW[w2]++; } });
      var mediaW = {}; [1, 2, 3, 4, 5].forEach(function(w){ mediaW[w] = nW[w]>0 ? pesoW[w]/nW[w] : 0; });
      var semHist = [1, 2, 3, 4, 5].every(function(w){ return !(mediaW[w]>0); }), somaW = utilFut.reduce(function(t, f){ return t+(semHist ? 1 : (mediaW[f.dow] || 0)); }, 0);
      var primeiroUtil = utilFut.length ? utilFut[0].iso : null, apItens = filtrar(p.ano+"-"+p2(p.mes+1), "", "", "apagar", "", ""), pesoC = {}, somaPeso = 0;
      var pixTot = 0; apItens.forEach(function(it){ if(/^pix/i.test(String(it.nome || "")) || /^pix/i.test(String(it.natNome || ""))){ pixTot += it.valor; return; } var dv = it.venc || "", dN = (dv && dv.slice(0, 7)===p.ano+"-"+p2(p.mes+1)) ? Number(dv.slice(8, 10)) : 0, kF = (dN>dados.ult) ? ymd(p.ano, p.mes, proximoUtil(dN)) : primeiroUtil; if(!kF) return; pesoC[kF] = (pesoC[kF] || 0)+it.valor; somaPeso += it.valor; });
      // 20/11/2026 (Marcus: "não tem R$ 316 mil de conta na segunda, os salários foram pagos hoje"): as contas dos dias que faltam são as contas EM ABERTO de verdade (DevMaster + Admin), cada uma no seu vencimento (passado para o próximo dia útil), sem esticar nada. O total previsto de contas = o que já foi pago + o que está em aberto.
      var restoR = Math.max(0, r2(ult0.fatPrev-ult0.rB)), cumR2 = ult0.rB, cumC2 = ult0.cacum, ultimoUtil = utilFut.length ? utilFut[utilFut.length-1].iso : null, totalProj = r2(ult0.cacum+somaPeso+pixTot), pixResta = r2(pixTot);
      fut.forEach(function(f){ var dr2 = 0, ct = r2(pesoC[f.iso] || 0), pxd = 0;
        if(f.util && pixTot>0){ pxd = f.iso===ultimoUtil ? pixResta : r2(pixTot*(semHist ? 1 : (mediaW[f.dow] || 0))/(somaW || 1)); pixResta = r2(pixResta-pxd); ct = r2(ct+pxd); }
        if(f.util) dr2 = f.iso===ultimoUtil ? Math.max(0, r2(ult0.fatPrev-cumR2)) : r2(restoR*(semHist ? 1 : (mediaW[f.dow] || 0))/(somaW || 1));
        cumR2 = r2(cumR2+dr2); cumC2 = r2(cumC2+ct);
        linhas.push({id:f.iso, dia:p2(f.dd)+"/"+p2(p.mes+1)+" · "+SEMANA[f.dow]+(f.util ? "" : " · sem expediente")+" · previsto", drB:dr2, inaD:null, inaM:null, contas:ct, resD:r2(dr2-ct), rB:cumR2, cacum:cumC2, res:r2(cumR2-cumC2), fatPrev:ult0.fatPrev, contasPrev:totalProj, resPrev:r2(ult0.fatPrev-totalProj), proj:true}); });
      linhas.forEach(function(l3){ if(l3.fatPrev>0){ l3.contasPrev = totalProj; l3.resPrev = r2(l3.fatPrev-totalProj); } });
    }
  } else if(visao==="contas"){
    cols = [{k:"dia", t:"Dia"}, {k:"contas", t:"Contas pagas", fmt:BKC, cor:function(l){ return l.contas>0 ? COR.sai : ""; }}, {k:"acum", t:"Acumulado", fmt:BKC, cor:function(l){ return l.acum>0 ? COR.sai : ""; }}];
    linhas = L.map(function(l){ ac = r2(ac+l.contas); return Object.assign({}, l, {acum:ac}); });
  } else {
    cols = [{k:"dia", t:"Dia"}, {k:"da", t:"Acertos no dia", fmt:n0}, {k:"dr", t:"Faturamento do dia", fmt:BKC, cor:function(l){ return l.dr>0 ? COR.entra : ""; }}, {k:"contas", t:"Contas pagas", fmt:BKC, cor:function(l){ return l.contas>0 ? COR.sai : ""; }}, {k:"saldo", t:"Saldo do dia", fmt:brl, cor:function(l){ return corSinal(l.saldo); }}, {k:"acum", t:"Saldo acumulado", fmt:brl, cor:function(l){ return corSinal(l.acum); }}];
    linhas = L.map(function(l){ var sd = r2(l.dr-l.contas); sa = r2(sa+sd); return Object.assign({}, l, {saldo:sd, acum:sa}); });
  }
  // barra de grupos em cima do cabeçalho (Marcus, 16/11/2026): acertos e valor juntos, primeiro o ACUMULADO do mês e depois o do DIA
  var cab = visao==="fat" ? [[{t:"", span:1}, {t:"Acumulado do mês", span:3, sep:true}, {t:"No dia", span:3, sep:true}, {t:"Previsto", span:2, sep:true}, {t:"Previsão do mês", span:2}]] : visao==="res" ? [[{t:"", span:1}, {t:"Dia", span:spanRes, sep:true}, {t:"Mês consolidado", span:spanRes, sep:true}, {t:"Previsto final do mês", span:3, sep:true}]] : undefined;
  var tab = e(TabelaPlanilha,{key:visao+base, cols:cols, linhas:linhas, chave:"id", grade:true, semContagem:true, cabAcima:cab, linhaCls:function(l){ return l.proj ? "italic" : ""; }, vazio:"Nenhum dia lançado."});
  if(visao!=="res") return tab;
  return e("div",{className:"flex flex-col"}, e("div",{className:"flex items-center justify-center gap-2 border-b border-white/30 bg-[#17181c] px-2 py-1"}, e("span",{className:"text-[11px] font-semibold uppercase"}, "Recebido por"), e(Segmentado,{atual:base, onMudar:setBase, opcoes:[["nf", "Notas fiscais"], ["cr", "Contas a receber"]]})), tab);
}

// ACERTOS do mês dia a dia (Marcus, 16/11/2026: "no mesmo padrão do Faturamento"): feitos (acumulado e no dia), Carregar, A realizar e a meta do mês. Mesma tabela de planilha, com barra de grupos.
function DiaAcertos(p){
  var dados = montar(p.s, p.ano, p.mes);
  if(!dados) return e("p",{className:"px-4 py-6 text-center text-[13px] text-foreground"}, "Este mês só tem o fechamento (total do mês), sem o dia a dia.");
  var mostra = function(v, fmt){ return v===null || v===undefined ? "—" : fmt(v); };
  var linhas = dados.linhas.map(function(l){ return Object.assign({}, l, {falta:l.prevPct!==null ? Math.max(0, l.prevPct-l.a-(l.carr||0)) : null}); });
  var cols = [{k:"dia", t:"Dia"}, {k:"a", t:"Feitos acumulado", fmt:n0, sep:true}, {k:"da", t:"Feitos no dia", fmt:n0}, {k:"carr", t:"Vendas no Carregar", fmt:n0, sep:true}, {k:"arz", t:"A realizar", fmt:function(v){ return mostra(v, n0); }, sep:true},
    {k:"prev", t:"Previstos", fmt:function(v){ return mostra(v, n0); }, sep:true}, {k:"prevPct", t:dados.pct+"% do previsto", fmt:function(v){ return mostra(v, n0); }}, {k:"falta", t:"Falta para a meta", fmt:function(v){ return mostra(v, n0); }, cor:function(l){ return l.falta===null ? "" : l.falta>0 ? COR.sai : COR.entra; }}];
  var cab = [[{t:"", span:1}, {t:"Acertos feitos", span:2, sep:true}, {t:"Carregar", span:1, sep:true}, {t:"A realizar", span:1, sep:true}, {t:"Meta do mês", span:3, sep:true}]];
  return e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", grade:true, semContagem:true, cabAcima:cab, vazio:"Nenhum dia lançado."});
}

export { DiaADia, DiaAcertos, montar, VISOES };

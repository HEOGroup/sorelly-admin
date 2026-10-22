// Sorelly Admin · montagem — domain/pf.js
// Pagamentos a Fornecedores (portado do app HTML "PAG FORNECEDORES"): só cálculo e regras, nada de tela.
// Estado: um objeto `pf` (s.pf) com a mesma forma das variáveis do HTML. Todas as funções recebem o `pf` e NÃO mexem nele, exceto as marcadas "muda o pf" (sincronizar*, semear*, pt*Sync, tokenAcerto).
// As telas leem as funções puras; qualquer mudança passa por pfReduz(s, {op, ...}) (copia o pf, muda, sincroniza e devolve {patch, msg}).
// Dados reais (valores, revendedoras) ficam em pf-dados.local.js (gitignored); sem esse arquivo o estado nasce vazio.
// Funções que no HTML devolviam HTML (badge, prazoTxt...) aqui devolvem DADOS ({texto, cor}); cor: gray|green|red|orange|blue|purple|cyan|yellow.

import { impactoPedido, motivoImpacto } from "@/apps/montagem/domain/pf-limite";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";

// pagamentos novos que estão na planilha "Pag. Fornecedores Nova 2026" e ainda não estavam no sistema (arquivo local gitignored)
var ATU_PF = (function(){ try { var m = import.meta.glob("./pf-atualizacao.local.js", {eager:true}); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();
var TEM_ATU_PF = !!(ATU_PF && ATU_PF.lancamentos && ATU_PF.lancamentos.length);
var LOCAL = (function(){ try { var m = import.meta.glob("./pf-dados.local.js", {eager:true}); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();

// ---------- constantes (HTML 1300-1307, 3111-3116, 4045, 4152-4163, 4791, 5366, 5613) ----------
var FORMAS = {
  boleto:          {label:"Boleto",          nf:"com", cor:"blue"},
  pix_empresa:     {label:"Pix empresa",     nf:"com", cor:"cyan"},
  cartao:          {label:"Cartão",          nf:"com", cor:"purple"},
  cheque:          {label:"Cheque",          nf:"com", cor:"yellow"},
  pix_revendedora: {label:"Pix revendedora", nf:"sem", cor:"orange"}
};
var NF_LABEL = {com:"Com NF", sem:"Sem NF"};
var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var PERIODICIDADES = {
  d10:    {label:"A cada 10 dias", cortes:function(m){ return [10,20,ultDia(m)]; }},
  d15:    {label:"A cada 15 dias", cortes:function(m){ return [15,ultDia(m)]; }},
  mensal: {label:"Mensal",         cortes:function(m){ return [ultDia(m)]; }},
  custom: {label:"Livre",          cortes:function(m){ return [ultDia(m)]; }}
};
var F_TIPO = [["tudo","Tudo"],["sem","Só SEM NF (o que pagamos)"],["com","Só COM NF (controle)"]];
var F_PER  = [["3","3 meses"],["6","6 meses"],["12","12 meses"],["all","Todos"]];
var F_SIT  = [["tudo","Tudo"],["aberto","Em aberto"],["atraso","Em atraso"],["quitado","Quitado"]];
var FILTRO_PADRAO = {tipo:"tudo", per:"12", sit:"tudo"};
var LIMIAR_MES = 1.5, LIMIAR_JANELA = 1.6, DIAS_ALERTA_PROXIMO = 7;   // limiares dos alertas
var MQ_MAQUINAS = ["Cielo","Getnet","Link de pagamento Cielo","Link de pagamento Getnet"];
var PT_FORN = 2;   // a Point funciona como conta corrente (tela própria)
// prestador de serviço (pessoa que presta serviço e recebe por fora; pode ser funcionário ou sócio) é separado do fornecedor
var PREST_CATS = ["Segurança","Valor extra","Consultoria / assessoria","Serviço pontual","Outros"];
var VINCULOS = [["funcionario","Funcionário(a)"],["socio","Sócio / família"],["dentro","Prestador dentro da empresa"],["externo","Externo"]];
function ehPrestador(f){ return !!f && (f.tipo==="prestador" || /^Prestador/.test(f.cat||"")); }
var FORN_CATS = ["Fornecedor de peças","Galvânica / banho","Gráfica","Maquininha / cartão","Tecnologia / sistema","Outros"];
var CAMPOS_BUSCA = [["","Tudo","Buscar nome, conta ou valor"],["n","Nome","Buscar pelo nome da revendedora"],["c","Conta","Buscar pela conta"],["v","Valor","Buscar pelo valor — ex.: 1.914,00"]];

// ---------- helpers de texto/data (HTML 3093-3121, 4046, 4174-4175, 4836) ----------
function brl(v){ return (v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }
function nbr(v){ return (v||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}); }
function dbr(d){ return d ? d.split("-").reverse().join("/") : "—"; }
function p2(n){ return String(n).padStart(2,"0"); }
function isoLocal(d){ return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate()); }   // sem fuso (o HTML usava toISOString)
function hojeData(){ var d = new Date(); d.setHours(0,0,0,0); return d; }
function hojeIso(){ return isoLocal(hojeData()); }
function dias(d){ return d ? Math.round((new Date(d+"T00:00:00") - hojeData())/86400000) : null; }
function prazoTxt(d){   // HTML prazoTxt -> dados
  var n = dias(d);
  if(n===null) return {texto:"—", cor:"gray", dias:null};
  if(n<0)   return {texto:Math.abs(n)+" dias em atraso", cor:"red", dias:n};
  if(n===0) return {texto:"vence hoje", cor:"red", dias:n};
  if(n<=7)  return {texto:"em "+n+" dias", cor:"orange", dias:n};
  return {texto:"em "+n+" dias", cor:"gray", dias:n};
}
function ultDia(mes){ var a = mes.split("-").map(Number); return new Date(a[0],a[1],0).getDate(); }
function diaISO(mes, dia){ return mes+"-"+p2(Math.min(dia,ultDia(mes))); }
function addDias(iso, n){ var d = new Date(iso+"T00:00:00"); d.setDate(d.getDate()+n); return isoLocal(d); }
function addMeses(iso, n){ var d = new Date(iso+"T00:00:00"); d.setMonth(d.getMonth()+n); return isoLocal(d); }   // mesma regra do HTML (setMonth)
function mesLabel(iso){ var a = iso.split("-"); return MESES[parseInt(a[1],10)-1]+"/"+a[0]; }
function mesCurto(m){ var a = m.split("-"); return MESES[parseInt(a[1],10)-1].slice(0,3)+"/"+a[0].slice(2); }
function mesAtual(){ return hojeIso().slice(0,7); }
function mesMais(mes, n){ var a = mes.split("-").map(Number), d = new Date(a[0], a[1]-1+n, 1); return isoLocal(d).slice(0,7); }
function r2(v){ return Math.round(((+v)||0)*100)/100; }
function num(v){ var x = parseFloat(v); return isNaN(x) ? 0 : x; }
function soma(ls, f){ return ls.reduce(function(s,x){ return s+f(x); }, 0); }
function semanaAtual(){   // segunda a domingo da semana de hoje (HTML renderAlertas)
  var h = hojeData(), ini = new Date(h); ini.setDate(h.getDate()-((h.getDay()+6)%7));
  var fim = new Date(ini); fim.setDate(ini.getDate()+6);
  return {ini:isoLocal(ini), fim:isoLocal(fim)};
}

// ---------- cache por objeto pf (substitui _janCache/_mqMapa). Quem muda o pf à mão deve chamar invalidar(pf). ----------
var CACHES = new WeakMap();
function cache(pf){ var c = CACHES.get(pf); if(!c){ c = {jan:{}, mq:null}; CACHES.set(pf, c); } return c; }
function invalidar(pf){ CACHES.delete(pf); }

// ---------- estado ----------
function pfVazio(){
  return {fornecedores:[], pedidos:[], acertos:{}, pagamentos:[], lancamentos:[], tokensAcerto:{}, mqPassadas:[], mqFech:{}, mqBaixas:[], mqDist:{},
    ptSaldoIni:0, ptBoleto:{}, ptAberto:{}, mqFornId:1, seq:{L:1, F:1, P:1, Pg:1, mqP:1, mqB:1}};
}
function pfDeDados(d){   // converte o formato do arquivo local (seqL, seqF...) para o pf
  d = JSON.parse(JSON.stringify(d||{}));
  var v = pfVazio();
  ["fornecedores","pedidos","pagamentos","lancamentos","mqPassadas","mqBaixas"].forEach(function(k){ if(Array.isArray(d[k])) v[k] = d[k]; });
  ["acertos","tokensAcerto","mqFech","mqDist","ptBoleto","ptAberto"].forEach(function(k){ if(d[k] && typeof d[k]==="object") v[k] = d[k]; });
  if(d.ptSaldoIni!=null) v.ptSaldoIni = d.ptSaldoIni;
  if(d.mqFornId) v.mqFornId = d.mqFornId;
  v.seq = {L:d.seqL||1, F:d.seqF||1, P:d.seqP||d.seqPedidoInicial||1, Pg:d.seqPg||1, mqP:d.mqSeqP||1, mqB:d.mqSeqB||1};
  return v;
}
// separa fornecedor de prestador e cadastra quem recebe por fora (idempotente: roda em estado novo e antigo)
var PRESTADORES_INI = [["Amanda de Miranda","funcionario"],["Priscila","funcionario"],["Nickolas","socio"],["Lucas","socio"],["Lucas Castilho","dentro"]];
function pfMigrar(pf){
  pf.fornecedores.forEach(function(f){ if(!f.tipo){ f.tipo = /^Prestador/.test(f.cat||"") ? "prestador" : "fornecedor"; if(f.tipo==="prestador"){ f.vinculo = f.vinculo || "funcionario"; var resto = (f.cat||"").split("·").slice(1).join("").trim().toLowerCase(); f.cat = PREST_CATS.filter(function(x){ return x.toLowerCase()===resto; })[0] || "Outros"; } } });
  pf.fornecedores.forEach(function(f){ if(f.nome==="Lucas Castilho" && f.vinculo==="externo" && !pf.lcAjustado){ f.vinculo = "dentro"; } });
  pf.lcAjustado = true;
  if(!pf.prestSemeados){
    PRESTADORES_INI.forEach(function(x){
      if(pf.fornecedores.some(function(f){ return f.nome.toLowerCase()===x[0].toLowerCase(); })) return;
      pf.fornecedores.push({id:pf.seq.F++, nome:x[0], tipo:"prestador", vinculo:x[1], cat:"Outros", cnpj:"", formas:Object.keys(FORMAS), ciclo:{periodicidade:"mensal", cortes:[31], prazoDias:0}});
    });
    pf.prestSemeados = true;
  }
  // Helcio (serviço do fim de semana de 17-18/10/2026): R$ 990,00, já entrou R$ 618,80 de pix de revendedora; pagar até 25/10, pix mínimo R$ 200,00
  if(!pf.helcioSemeado){
    var hel = pf.fornecedores.filter(function(f){ return f.nome.toLowerCase()==="helcio"; })[0];
    if(!hel){ hel = {id:pf.seq.F++, nome:"Helcio", tipo:"prestador", vinculo:"externo", cat:"Serviço pontual", cnpj:"", formas:Object.keys(FORMAS), ciclo:{periodicidade:"mensal", cortes:[31], prazoDias:0}}; pf.fornecedores.push(hel); }
    pf.pedidos.push({id:pf.seq.P++, fornId:hel.id, numero:"Helcio · 10/2026", data:"2026-10-19", total:990, nfTipo:"sem", comNF:0, semNF:990, cnpj:"Sem NF", nfNum:"",
      descricao:"Serviço prestado no fim de semana (17 e 18/10/2026). Combinado: R$ 990,00 em pix de revendedora, pagar até 25/10/2026, com pix de no mínimo R$ 200,00.", limite:"2026-10-25", pixMin:200,
      parcelas:[{forma:"pix_revendedora", venc:"2026-10-19", valor:618.8, conta:"Pix de revendedora (lançado pelo Lucas)", status:"Pago"}, {forma:"pix_revendedora", venc:"2026-10-25", valor:371.2, conta:"", status:"Pendente"}]});
    var hPd = pf.pedidos[pf.pedidos.length-1]; invalidar(pf);
    hPd.parcelas.forEach(function(p){ if(p.status==="Pago"){ logPagamento(pf, hPd, p, FORMAS[p.forma], p.conta); lancarBaixaAuto(pf, hPd, p); } });
    pf.helcioSemeado = true;
  }
  // Ello Print (tintas da impressora, 19/10/2026): R$ 3.600,00 = 30% com NF no cartão à vista (CNPJ 46) + 70% sem NF por pix de revendedora até 01/11
  if(!pf.elloSemeado){
    var ello = pf.fornecedores.filter(function(f){ return f.nome.toLowerCase()==="ello print"; })[0];
    if(!ello){ ello = {id:pf.seq.F++, nome:"Ello Print", tipo:"fornecedor", cat:"Outros", cnpj:"", formas:Object.keys(FORMAS), ciclo:{periodicidade:"mensal", cortes:[31], prazoDias:0}}; pf.fornecedores.push(ello); }
    pf.pedidos.push({id:pf.seq.P++, fornId:ello.id, numero:"Ello Print · 20/10/2026", data:"2026-10-20", total:3600, nfTipo:"misto", comNF:1080, semNF:2520, cnpj:"CNPJ 46 · Sorelly Comércio", nfNum:"",
      descricao:"Refil de tinta Epson T544122 Preto (3 un, R$ 207,00); bolsas de tinta C5390/C5810/C5890: Preta 10K (3 un, R$ 1.197,00), Ciano 5K (2 un, R$ 732,00), Yellow 5K (2 un, R$ 732,00) e Magenta 5K (2 un, R$ 732,00). Faturado na Mayz (CNPJ 46): 30% com nota (R$ 1.080,00) no cartão de crédito à vista em 20/10; 70% sem nota (R$ 2.520,00) em pix de revendedora para a conta PF informada, quitando até 01/11/2026.",
      parcelas:[{forma:"cartao", venc:"2026-10-20", valor:1080, conta:"Cartão de crédito à vista · CNPJ 46 Mayz", status:"Pendente"}, {forma:"pix_revendedora", venc:"2026-11-01", valor:2520, conta:"", status:"Pendente"}]});
    invalidar(pf); pf.elloSemeado = true;
  }
  // pagamentos novos da planilha (Pontual, setembro e outubro/2026): entra só o que ainda não existe (mesmo fornecedor, data e valor), sem duplicar
  if(!pf.atuV1 && ATU_PF && Array.isArray(ATU_PF.lancamentos)){
    var temL = {}; pf.lancamentos.forEach(function(l){ var k = l.fornId+"|"+l.data+"|"+l.valor.toFixed(2); temL[k] = (temL[k]||0)+1; });
    ATU_PF.lancamentos.forEach(function(x){ var k = x.fornId+"|"+x.data+"|"+x.valor.toFixed(2); if(temL[k]>0){ temL[k]--; return; }
      pf.lancamentos.push({id:pf.seq.L++, fornId:x.fornId, mes:x.limite.slice(0,7), limite:x.limite, chave:x.fornId+"|"+x.limite, data:x.data, revendedora:x.revendedora, valor:x.valor, conta:x.conta||"", arqNome:"", arqTipo:"", arqData:"", conferido:false, conferidoEm:""}); });
    if(Array.isArray(ATU_PF.mqPassadas)){ var temP = {}; pf.mqPassadas.forEach(function(p){ var k = p.rev.toLowerCase().trim()+"|"+p.valor; temP[k] = (temP[k]||0)+1; });
      ATU_PF.mqPassadas.forEach(function(x){ var k = x.rev.toLowerCase().trim()+"|"+x.valor; if(temP[k]>0){ temP[k]--; return; } pf.mqPassadas.push(Object.assign({id:pf.seq.mqP++}, x)); }); }
    if(ATU_PF.mqFech) Object.keys(ATU_PF.mqFech).forEach(function(m){ if(!pf.mqFech[m]) pf.mqFech[m] = Object.assign({}, ATU_PF.mqFech[m]); });
    // o desconto de cartão de setembro (R$ 37.537,50) nasceu como "baixado" e por isso não entrava nas janelas; a planilha o conta como pago na 1ª dezena e no resto: tira a baixa automática para ele se distribuir sozinho
    pf.mqBaixas = pf.mqBaixas.filter(function(b){ return !(b.mes==="2026-09" && b.forma==="Desconto em conta" && b.conta==="Abatido na conta do banho" && !b.arqNome); });
    pf.atuV1 = true; invalidar(pf);
  }
  // Pontual, de nov/2026 em diante: a planilha "Pontual - Negociações PAG. 1.0" tem a relação completa de Pix e boleto por dia; troca as parcelas que ainda estão pendentes (as já pagas ficam)
  if(!pf.atuV2c && ATU_PF && Array.isArray(ATU_PF.parcelasPontualV2)){
    var pontF = pf.fornecedores.filter(function(f){ return f.nome==="Pontual"; })[0], MMM = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
    if(pontF){
      var porMes = {}; ATU_PF.parcelasPontualV2.forEach(function(x){ (porMes[x.mes] = porMes[x.mes]||[]).push(x); });
      Object.keys(porMes).sort().forEach(function(m){
        var num = "Pontual "+MMM[parseInt(m.slice(5), 10)-1]+"/"+m.slice(0,4), pd = pf.pedidos.filter(function(p){ return p.fornId===pontF.id && p.numero===num; })[0];
        if(!pd){ var molde = pf.pedidos.filter(function(p){ return p.fornId===pontF.id && /^Pontual /.test(p.numero); }).pop();
          pd = Object.assign({}, molde, {id:pf.seq.P++, numero:num, data:m+"-01", total:0, comNF:0, semNF:0, parcelas:[], obs:"Acerto mensal "+num+" (planilha de negociação da Pontual). Nao inclui desconto de cartao (aba maquininhas)"}); pf.pedidos.push(pd); }
        var fica = pd.parcelas.filter(function(q){ return q.status!=="Pendente"; }), novas = porMes[m].filter(function(x){ var i = fica.findIndex(function(q){ return q.venc===x.venc && Math.abs(q.valor-x.valor)<0.005 && (q.forma==="boleto")===(x.forma==="boleto"); }); if(i>=0){ fica.splice(i, 1); return false; } return true; });
        var mantidas = pd.parcelas.filter(function(q){ return q.status!=="Pendente"; });
        pd.parcelas = mantidas.concat(novas.map(function(x){ return {forma:x.forma, venc:x.venc, valor:x.valor, conta:x.forma==="boleto" ? "Boleto — CNPJ 46" : "Pix revendedora", status:"Pendente"}; })).sort(function(a, b){ return a.venc.localeCompare(b.venc); });
        pd.comNF = r2(soma(pd.parcelas.filter(function(q){ return q.forma==="boleto"; }), function(q){ return q.valor; })); pd.semNF = r2(soma(pd.parcelas.filter(function(q){ return q.forma!=="boleto"; }), function(q){ return q.valor; })); pd.total = r2(pd.comNF+pd.semNF);
        pd.obs = "Acerto mensal "+num+" — "+pd.parcelas.filter(function(q){ return q.forma!=="boleto"; }).length+" pix revendedora + "+pd.parcelas.filter(function(q){ return q.forma==="boleto"; }).length+" boletos (planilha de negociação da Pontual, 20/10/2026). Nao inclui desconto de cartao (aba maquininhas)";
      });
    }
    // parcelas soltas (ex.: Pix de junho que estava com data inexistente na planilha e já tinha sido pago) e cartões passados depois
    (ATU_PF.parcelasPontualExtra||[]).forEach(function(x){
      var pd = pf.pedidos.filter(function(p){ return p.fornId===(pontF && pontF.id) && p.numero==="Pontual "+MMM[parseInt(x.mes.slice(5), 10)-1]+"/"+x.mes.slice(0,4); })[0]; if(!pd) return;
      if(pd.parcelas.some(function(q){ return q.venc===x.venc && Math.abs(q.valor-x.valor)<0.005 && (q.forma==="boleto")===(x.forma==="boleto"); })) return;
      pd.parcelas.push({forma:x.forma, venc:x.venc, valor:x.valor, conta:x.forma==="boleto" ? "Boleto — CNPJ 46" : "Pix revendedora", status:x.status||"Pendente"});
      pd.parcelas.sort(function(a, b){ return a.venc.localeCompare(b.venc); });
      pd.comNF = r2(soma(pd.parcelas.filter(function(q){ return q.forma==="boleto"; }), function(q){ return q.valor; })); pd.semNF = r2(soma(pd.parcelas.filter(function(q){ return q.forma!=="boleto"; }), function(q){ return q.valor; })); pd.total = r2(pd.comNF+pd.semNF);
    });
    if(Array.isArray(ATU_PF.mqPassadasV4)){ var temP4 = {}; pf.mqPassadas.forEach(function(p){ var k = p.rev.toLowerCase().trim()+"|"+p.valor; temP4[k] = (temP4[k]||0)+1; });
      ATU_PF.mqPassadasV4.forEach(function(x){ var k = x.rev.toLowerCase().trim()+"|"+x.valor; if(temP4[k]>0){ temP4[k]--; return; } pf.mqPassadas.push(Object.assign({id:pf.seq.mqP++}, x)); }); }
    pf.atuV2c = true; invalidar(pf);
  }
  // Prestadores de outubro/2026 (resumo do mês da planilha): Higor, Lucas Castilho, Izadora e Priscila, tudo em pix de revendedora. Dados reais só no arquivo local.
  if(!pf.atuV3 && ATU_PF && Array.isArray(ATU_PF.prestadoresOut)){
    ATU_PF.prestadoresOut.forEach(function(x){
      var fo = pf.fornecedores.filter(function(g){ return g.nome.toLowerCase().indexOf(x.nome.toLowerCase())===0; })[0];
      if(!fo){ fo = {id:pf.seq.F++, nome:x.nome, tipo:"prestador", vinculo:x.vinculo||"externo", cat:x.cat||"Prestador de serviço", cnpj:"", formas:Object.keys(FORMAS), ciclo:{periodicidade:"mensal", cortes:[31], prazoDias:0}}; pf.fornecedores.push(fo); }
      var num = fo.nome+" · "+x.mes.slice(5)+"/"+x.mes.slice(0,4);
      if(pf.pedidos.some(function(p){ return p.fornId===fo.id && p.numero===num; })) return;
      var pd = {id:pf.seq.P++, fornId:fo.id, numero:num, data:x.mes+"-01", total:r2(soma(x.parcelas, function(q){ return q.valor; })), nfTipo:"sem", comNF:0, semNF:r2(soma(x.parcelas, function(q){ return q.valor; })), cnpj:"Sem NF", nfNum:"", descricao:x.obs||"", limite:x.parcelas[x.parcelas.length-1].venc, pixMin:0,
        parcelas:x.parcelas.map(function(q){ return {forma:"pix_revendedora", venc:q.venc, valor:q.valor, conta:"Pix revendedora", status:q.pago ? "Pago" : "Pendente"}; })};
      pf.pedidos.push(pd); invalidar(pf);
      pd.parcelas.forEach(function(q){ if(q.status==="Pago"){ logPagamento(pf, pd, q, FORMAS[q.forma], q.conta); lancarBaixaAuto(pf, pd, q); } });
    });
    pf.atuV3 = true; invalidar(pf);
  }
  // Point (planilha, 20/10/2026): pedidos de setembro (conta corrente), boleto e Pix pagos e os Pix de revendedora de setembro e outubro; entra só o que ainda não existe
  if(!pf.atuV5 && ATU_PF && (ATU_PF.pointSep || ATU_PF.lancamentosPoint)){
    var ptF = pf.fornecedores.filter(function(g){ return g.nome==="Point"; })[0];
    if(ptF){
      var S = ATU_PF.pointSep, pdS = S && pf.pedidos.filter(function(p){ return p.fornId===ptF.id && p.numero==="Point set/2026"; })[0];
      if(pdS && !(pdS.itens||[]).length){ pdS.itens = S.itens.map(function(i){ return {cod:i.cod, data:i.data, valor:i.valor}; }); if(S.pix && pdS.parcelas[0]) pdS.parcelas[0].valor = S.pix; pf.ptAberto[pdS.id] = false; ptSync(pdS); }
      if(S && S.boleto) Object.keys(S.boleto).forEach(function(m){ if(!pf.ptBoleto[m]) pf.ptBoleto[m] = S.boleto[m]; });
      var temPt = {}; pf.lancamentos.filter(function(l){ return l.fornId===ptF.id; }).forEach(function(l){ var k = l.data+"|"+l.valor.toFixed(2); temPt[k] = (temPt[k]||0)+1; });
      (ATU_PF.lancamentosPoint||[]).forEach(function(x){ var k = x.data+"|"+x.valor.toFixed(2); if(temPt[k]>0){ temPt[k]--; return; }
        pf.lancamentos.push({id:pf.seq.L++, fornId:ptF.id, mes:x.limite.slice(0,7), limite:x.limite, chave:ptF.id+"|"+x.limite, data:x.data, revendedora:x.revendedora, valor:x.valor, conta:x.conta||"", arqNome:"", arqTipo:"", arqData:"", conferido:false, conferidoEm:""}); });
    }
    pf.atuV5 = true; invalidar(pf);
  }
  // pedidos novos lançados à mão pelo Marcus (ex.: Pontual NF 11660): entram como pedido próprio; se o Pix já estava dentro do pedido do mês, sai de lá para não contar duas vezes
  if(!pf.atuV10 && ATU_PF && Array.isArray(ATU_PF.pedidosNovos)){
    (ATU_PF.removerParcelas||[]).forEach(function(r){ var fo0 = pf.fornecedores.filter(function(g){ return g.nome===r.fornNome; })[0]; if(!fo0) return;
      for(var pi = 0; pi<pf.pedidos.length; pi++){ var p0 = pf.pedidos[pi]; if(p0.fornId!==fo0.id) continue; var i0 = p0.parcelas.findIndex(function(z){ return z.status==="Pendente" && z.forma===r.forma && z.venc===r.venc && Math.abs(z.valor-r.valor)<0.005; });
        if(i0>=0){ p0.parcelas.splice(i0, 1); p0.comNF = r2(soma(p0.parcelas.filter(function(z){ return z.forma!=="pix_revendedora" && z.forma!=="pix_empresa"; }), function(z){ return z.valor; })); p0.semNF = r2(soma(p0.parcelas.filter(function(z){ return z.forma==="pix_revendedora" || z.forma==="pix_empresa"; }), function(z){ return z.valor; })); p0.total = r2(p0.comNF+p0.semNF); break; } } });
    ATU_PF.pedidosNovos.forEach(function(x){
      var fo = pf.fornecedores.filter(function(g){ return g.nome===x.fornNome; })[0]; if(!fo) return;
      if(pf.pedidos.some(function(p){ return p.fornId===fo.id && p.numero===x.numero; })) return;
      if(!x.semDedupe) x.parcelas.filter(function(q){ return q.forma!=="boleto"; }).forEach(function(q){
        pf.pedidos.forEach(function(p){ if(p.fornId!==fo.id || /^(NF|Pontual NF)/.test(p.numero)) return;
          var i = p.parcelas.findIndex(function(z){ return z.forma!=="boleto" && z.status==="Pendente" && z.venc===q.venc && Math.abs(z.valor-q.valor)<0.005; }); if(i<0 || q.__tirou) return;
          p.parcelas.splice(i, 1); q.__tirou = true;
          p.comNF = r2(soma(p.parcelas.filter(function(z){ return z.forma==="boleto"; }), function(z){ return z.valor; })); p.semNF = r2(soma(p.parcelas.filter(function(z){ return z.forma!=="boleto"; }), function(z){ return z.valor; })); p.total = r2(p.comNF+p.semNF); }); });
      pf.pedidos.push({id:pf.seq.P++, fornId:fo.id, numero:x.numero, data:x.data, total:x.total, nfTipo:"misto", comNF:x.comNF, semNF:x.semNF, cnpj:x.cnpj, nfNum:x.nfNum||"", descricao:x.descricao||"", limite:x.parcelas[x.parcelas.length-1].venc,
        parcelas:x.parcelas.map(function(q){ return {forma:q.forma, venc:q.venc, valor:q.valor, conta:q.forma==="boleto" ? "Boleto — "+x.cnpj : (q.forma==="cheque" ? "Cheque — "+x.cnpj : "Pix revendedora"), status:"Pendente"}; })});
    });
    pf.atuV10 = true; invalidar(pf);
  }
  // Pix de revendedora pagos a outros fornecedores (Mega Sul, Office Graf, Devmaster...) que a planilha tem e o sistema não; cai na dezena/quinzena do mês do pagamento
  if(!pf.atuV11 && ATU_PF && Array.isArray(ATU_PF.lancamentosForn)){
    invalidar(pf);
    var temF = {}; pf.lancamentos.forEach(function(l){ var k = l.fornId+"|"+l.data+"|"+l.valor.toFixed(2); temF[k] = (temF[k]||0)+1; });
    ATU_PF.lancamentosForn.forEach(function(x){
      var fo2 = pf.fornecedores.filter(function(g){ return g.nome===x.fornNome; })[0]; if(!fo2) return;
      var k = fo2.id+"|"+x.data+"|"+x.valor.toFixed(2); if(temF[k]>0){ temF[k]--; return; }
      var js = janelasDoForn(pf, fo2.id).filter(function(j){ return j.mes===x.mes; }), hint = x.limiteHint || x.data, jj = js.filter(function(j){ return j.limite>=hint; })[0] || js[js.length-1];
      var lim = jj ? jj.limite : diaISO(x.mes, 31);
      pf.lancamentos.push({id:pf.seq.L++, fornId:fo2.id, mes:x.mes, limite:lim, chave:fo2.id+"|"+lim, data:x.data, revendedora:x.revendedora, valor:x.valor, conta:x.conta||"", arqNome:"", arqTipo:"", arqData:"", conferido:false, conferidoEm:""}); });
    pf.atuV11 = true; invalidar(pf);
  }
  // passadas da maquininha de setembro e outubro (planilha "Pag. Fornecedores 2026", colunas L a Q, 19/10/2026): entra só o que ainda não existe (mesma revendedora e valor), sem duplicar
  if(!pf.mqImp2 && LOCAL && Array.isArray(LOCAL.mqExtra)){
    var chavesX = {}; LOCAL.mqExtra.forEach(function(x){ var k = x.rev.toLowerCase()+"|"+x.valor; chavesX[k] = (chavesX[k]||0)+1; });
    pf.mqPassadas = pf.mqPassadas.filter(function(p){ if(p.id>388 || p.data.slice(5,7)<"09") return true; var k = p.rev.toLowerCase()+"|"+p.valor; if(chavesX[k]>0){ chavesX[k]--; return true; } return false; });   // tira a passada antiga de set/out que não está na planilha (ex.: 341 no lugar de 314)
    var jaTem = {}; pf.mqPassadas.forEach(function(p){ var k = p.rev.toLowerCase()+"|"+p.valor; jaTem[k] = (jaTem[k]||0)+1; });
    var max = pf.mqPassadas.reduce(function(m, p){ return Math.max(m, p.id); }, 0); if(!(pf.seq.mqP>max)) pf.seq.mqP = max+1;
    LOCAL.mqExtra.forEach(function(x){ var k = x.rev.toLowerCase()+"|"+x.valor; if(jaTem[k]>0){ jaTem[k]--; return; } pf.mqPassadas.push(Object.assign({id:pf.seq.mqP++}, x)); });
    pf.mqImp2 = true; invalidar(pf);
  }
  return pf;
}
// negociações em aberto dos prestadores de serviço (para o bloco "O que estamos pagando" e o botão "Ver negociação")
function pendentesPrestadores(pf, hoje){
  return pf.pedidos.map(function(pd){
    var f = forn(pf, pd.fornId); if(!ehPrestador(f)) return null;
    var pago = soma(pd.parcelas.filter(function(p){ return p.status==="Pago"; }), function(p){ return p.valor; }), falta = pd.total-pago;
    if(falta<=0.005) return null;
    var dias = pd.limite ? Math.round((new Date(pd.limite+"T12:00:00")-new Date((hoje||"")+"T12:00:00"))/86400000) : null;
    return {pd:pd, f:f, pago:pago, falta:falta, dias:dias, atrasado:dias!==null && dias<0};
  }).filter(Boolean).sort(function(a, b){ return (a.pd.limite||"9999").localeCompare(b.pd.limite||"9999"); });
}
function pfInicial(dados){
  var base = dados || LOCAL;
  var pf = base ? pfDeDados(base) : pfVazio();
  pfMigrar(pf);
  semearLancamentos(pf); semearBaixasMq(pf); sincronizarTudo(pf);
  return pf;
}

// ---------- fornecedor e ciclo (HTML 3117-3170, 3209) ----------
function forn(pf, id){ return pf.fornecedores.find(function(f){ return f.id===id; }); }
function eSem(l){ return FORMAS[l.p.forma].nf==="sem"; }   // só o sem NF tem controle de baixa
function cicloDe(f){
  var c = f && f.ciclo;
  if(c && c.cortes && c.cortes.length) return c;
  return {periodicidade:"mensal", cortes:[31], prazoDias:0};
}
function cicloLabel(f){
  var c = cicloDe(f), base = (PERIODICIDADES[c.periodicidade]||PERIODICIDADES.custom).label;
  return base+" · "+c.cortes.join("/")+(c.prazoDias>0 ? " +"+c.prazoDias+"d" : "");
}
function cicloCor(f){ var p = cicloDe(f).periodicidade; return p==="d10" ? "purple" : p==="d15" ? "cyan" : p==="mensal" ? "blue" : "yellow"; }
function blocosDoMes(pf, fornId, mes){   // sobrescrita manual em `acertos` vale mais que o ciclo
  var ov = pf.acertos[fornId+"|"+mes];
  if(ov && ov.length) return ov.map(function(b){ return Object.assign({}, b); });
  var c = cicloDe(forn(pf, fornId));
  return c.cortes.slice().sort(function(a,b){ return a-b; }).map(function(d){
    var fim = diaISO(mes, d);
    return {fim:fim, limite: c.prazoDias>0 ? addDias(fim, c.prazoDias) : fim};
  });
}
function temOverride(pf, fornId, mes){ var o = pf.acertos[fornId+"|"+mes]; return !!(o && o.length); }
function distribuir(blocos, linhas){   // cada parcela cai na 1ª janela cujo corte >= vencimento; depois do último corte vai para a última
  var out = blocos.map(function(b){ return Object.assign({}, b, {itens:[]}); });
  if(!out.length) return out;
  linhas.forEach(function(l){
    var i = out.findIndex(function(b){ return l.p.venc <= b.fim; });
    if(i<0) i = out.length-1;
    out[i].itens.push(l);
  });
  out.forEach(function(b){
    var sem = b.itens.filter(eSem), com = b.itens.filter(function(l){ return !eSem(l); });
    b.total = soma(sem, function(l){ return l.p.valor; });                                                   // SEM NF (a pagar)
    b.pago = soma(sem.filter(function(l){ return l.p.status==="Pago"; }), function(l){ return l.p.valor; });
    b.aberto = b.total-b.pago;
    b.comNF = soma(com, function(l){ return l.p.valor; });                                                   // COM NF (registro)
    b.divida = b.aberto+b.comNF;
  });
  return out;
}
function chipClasse(b){   // '' | 'ok' | 'late' | 'soon'
  if(b.total<=0.005) return "";
  if(b.aberto<=0.005) return "ok";
  var n = dias(b.limite);
  return n<0 ? "late" : (n<=7 ? "soon" : "");
}

// ---------- janelas de pagamento (HTML 3311-3356) ----------
function calcJanelasDoForn(pf, fid){
  var f = forn(pf, fid); if(!f) return [];
  var porMes = {};
  pf.pedidos.forEach(function(pd){
    if(pd.fornId!==fid || pd.aprov==="pendente") return;   // pendente de aprovação (limite mensal) ainda não está lançado
    pd.parcelas.forEach(function(p, idx){
      if(FORMAS[p.forma].nf!=="sem") return;   // só sem NF / Pix entra na conta
      var mes = p.venc.slice(0,7);
      (porMes[mes] = porMes[mes]||[]).push({pd:pd, f:f, idx:idx, p:p});
    });
  });
  var out = [];
  Object.keys(porMes).forEach(function(mes){
    distribuir(blocosDoMes(pf, fid, mes), porMes[mes]).forEach(function(b){
      if(!b.itens.length) return;
      out.push(Object.assign({}, b, {fornId:fid, mes:mes, chave:fid+"|"+b.limite}));
    });
  });
  return out.sort(function(a,b){ return a.limite.localeCompare(b.limite); });
}
function janelasDoForn(pf, fid){
  var c = cache(pf);
  if(!c.jan[fid]) c.jan[fid] = calcJanelasDoForn(pf, fid);
  return c.jan[fid];
}
function lancDaJanela(pf, chave){ return pf.lancamentos.filter(function(l){ return l.chave===chave; }).sort(function(a,b){ return a.data.localeCompare(b.data); }); }
function pagoPix(pf, chave){ return soma(lancDaJanela(pf, chave), function(l){ return l.valor; }); }   // só o dinheiro que saiu por Pix
function pagoJanela(pf, chave){ return pagoPix(pf, chave)+mqAplicado(pf, chave); }                     // Pix + desconto da maquininha
function janelaPorChave(pf, chave){
  var fid = parseInt((chave||"").split("|")[0]);
  return fid ? janelasDoForn(pf, fid).find(function(x){ return x.chave===chave; }) : null;
}
function sincronizarJanela(pf, j){   // muda o pf: marca/desmarca as parcelas da janela conforme o total lançado, por ordem de vencimento
  var saldo = pagoJanela(pf, j.chave);
  j.itens.slice().sort(function(a,b){ return a.p.venc.localeCompare(b.p.venc); }).forEach(function(l){
    var cobre = saldo >= l.p.valor-0.005;
    if(cobre) saldo -= l.p.valor;
    if(cobre && l.p.status!=="Pago") l.p.status = "Pago";
    if(!cobre && l.p.status==="Pago") l.p.status = "Pendente";
  });
}
function sincronizarForn(pf, fid){   // muda o pf
  janelasDoForn(pf, fid).forEach(function(j){ sincronizarJanela(pf, j); });
  delete cache(pf).jan[fid];   // o pago/aberto das janelas muda junto com o status das parcelas
}
function ptSomaItens(pd){ return r2(soma(pd.itens||[], function(i){ return (+i.valor)||0; })); }
function ptSync(pd){   // HTML ptSync (muda o pedido da Point): mantém total / semNF / parcela coerentes
  pd.itens = pd.itens||[];
  var s = ptSomaItens(pd);
  if(!pd.parcelas.length) pd.parcelas = [{forma:"pix_revendedora", venc:pd.data.slice(0,7)+"-28", valor:0, conta:"Pix revendedora", status:"Pendente"}];
  var pix = r2(pd.parcelas[0].valor);
  pd.total = s>0 ? s : pix; pd.comNF = 0; pd.semNF = pix;
  pd.obs = pd.itens.length
    ? "Pedidos de "+mesLabel(pd.data)+": "+pd.itens.length+" pedido(s) = "+brl(s)+". Códigos: "+pd.itens.map(function(i){ return i.cod+" ("+brl(i.valor)+")"; }).join(" + ")+". O pix é o acerto mensal negociado, definido à parte."
    : "Sem pedidos lançados em "+mesLabel(pd.data)+". O pix é o acerto mensal negociado.";
}
function sincronizarTudo(pf){   // muda o pf. Ordem do renderAll: conta da maquininha primeiro, depois os demais; Point mantém a conta corrente em dia
  invalidar(pf);
  pf.pedidos.forEach(function(pd){ if(pd.fornId===PT_FORN) ptSync(pd); });
  invalidar(pf);
  var ids = pf.fornecedores.map(function(f){ return f.id; });
  if(ids.indexOf(pf.mqFornId)>=0) sincronizarForn(pf, pf.mqFornId);
  ids.forEach(function(id){ if(id!==pf.mqFornId) sincronizarForn(pf, id); });
  invalidar(pf);
  return pf;
}
// Carga: transforma parcelas pagas em lançamentos (fornecedores sem lançamentos reais). `iniciais` = lançamentos reais opcionais.
function semearLancamentos(pf, iniciais){   // muda o pf
  if(pf.lancamentos.length) return;
  iniciais = iniciais||[];
  var reais = {}; iniciais.forEach(function(l){ reais[l.fornId] = true; });
  iniciais.forEach(function(l){ pf.lancamentos.push(Object.assign({id:pf.seq.L++}, l, {arqNome:"", arqTipo:"", arqData:"", conferido:false, conferidoEm:""})); });
  invalidar(pf);
  Object.keys(reais).forEach(function(fid){ sincronizarForn(pf, +fid); });
  pf.fornecedores.forEach(function(f){
    if(reais[f.id]) return;
    janelasDoForn(pf, f.id).forEach(function(j){
      j.itens.filter(function(l){ return l.p.status==="Pago"; }).forEach(function(l){
        pf.lancamentos.push({id:pf.seq.L++, chave:j.chave, fornId:f.id, mes:j.mes, limite:j.limite, data:l.p.venc, revendedora:"—", valor:l.p.valor, conta:l.p.conta||"—", arqNome:"", arqTipo:"", arqData:"", conferido:false, conferidoEm:""});
      });
    });
  });
  invalidar(pf);
}
function statusJanela(j, pago){   // HTML statusJan -> {texto, cor}
  if(j.total-pago<=0.005) return {texto:"Quitado", cor:"green"};
  var n = dias(j.limite);
  if(n<0) return {texto:"Em atraso", cor:"red"};
  if(n<=7) return {texto:"Vence em breve", cor:"orange"};
  return {texto:"Em aberto", cor:"gray"};
}

// ---------- conta do fornecedor (HTML 3173-3205) ----------
function contaForn(pf, fid, mes){   // só a parte SEM NF, pelas janelas do ciclo
  var js = janelasDoForn(pf, fid).filter(function(j){ return !mes || j.mes===mes; });
  var total = 0, pago = 0, desc = 0, datas = [];
  js.forEach(function(j){
    var pg = Math.min(pagoJanela(pf, j.chave), j.total), ab = j.total-pg;
    total += j.total; pago += pg;
    desc += Math.min(mqAplicado(pf, j.chave), j.total);
    datas.push({venc:j.limite, valor:j.total, aberto:ab});
  });
  datas.sort(function(a,b){ return a.venc.localeCompare(b.venc); });
  var bruto = soma(pf.pedidos.filter(function(p){ return p.fornId===fid; }), function(p){ return p.total; });
  var emAberto = datas.filter(function(d){ return d.aberto>0.005; });
  return {total:total, pago:pago, desc:desc, aberto:total-pago, bruto:bruto, qtdDatas:js.length, datas:datas,
    dMin: emAberto.length ? emAberto[0].venc : null, dMax: datas.length ? datas[datas.length-1].venc : null};
}
function chipDesc(v){ return v>0.005 ? {texto:"💳", dica:"Inclui "+brl(v)+" de desconto da maquininha"} : null; }
function statusConta(c){   // -> {texto, cor}
  if(c.total<=0.005) return {texto:"Só com NF", cor:"gray"};
  if(c.aberto<=0.005) return {texto:"Quitado", cor:"green"};
  if(!c.dMax) return {texto:"Sem parcela lançada", cor:"gray"};
  var n = dias(c.dMax);
  if(n<0) return {texto:"Em atraso", cor:"red"};
  if(n<=7) return {texto:"Vence em breve", cor:"orange"};
  return {texto:"Em aberto", cor:"gray"};
}

// ---------- telas de Resumo e Lançamento (cálculo do renderResumo / renderCards, HTML 3233-3290 e 3404-3543) ----------
function mesesComLanc(pf, mesSel){   // meses com janela sem NF + o mês atual (+ o selecionado)
  var set = {}; set[mesAtual()] = 1; if(mesSel) set[mesSel] = 1;
  pf.fornecedores.forEach(function(f){ janelasDoForn(pf, f.id).forEach(function(j){ set[j.mes] = 1; }); });
  return Object.keys(set).sort();
}
function resumoMes(pf, mes){   // renderResumo: linhas por fornecedor + totais
  var contas = pf.fornecedores.map(function(f){ return {f:f, c:contaForn(pf, f.id, mes)}; }).filter(function(x){ return x.c.qtdDatas; });
  var abertas = contas.filter(function(x){ return x.c.aberto>0.005; });
  var total = soma(contas, function(x){ return x.c.total; }), pago = soma(contas, function(x){ return x.c.pago; });
  var ord = contas.slice().sort(function(a,b){
    var fa = a.c.aberto>0.005, fb = b.c.aberto>0.005;
    if(fa!==fb) return fa ? -1 : 1;
    return (a.c.dMin||"9999").localeCompare(b.c.dMin||"9999");
  });
  return {mes:mes, linhas:ord.map(function(x){ return {fornId:x.f.id, nome:x.f.nome, c:x.c, pct: x.c.total>0 ? x.c.pago/x.c.total*100 : 0, prazo: x.c.dMin ? prazoTxt(x.c.dMin) : null, status:statusConta(x.c), chip:chipDesc(x.c.desc)}; }),
    total:total, pago:pago, falta:total-pago, pct: total>0 ? pago/total*100 : 0, nDatas:soma(contas, function(x){ return x.c.qtdDatas; }),
    descTot:soma(contas, function(x){ return x.c.desc; }), nFornecedores:contas.length, nAbertas:abertas.length};
}
function mqRefTxt(pf, chave){
  var refs = [];
  mqMesesComSaldo(pf).sort().forEach(function(m){ mqDistribuicao(pf, m).forEach(function(d){ if(d.chave===chave) refs.push("saldo de "+mesCurto(m)); }); });
  return refs.join(" + ");
}
function cartoesLancamento(pf, mes){   // renderCards: grupos por fornecedor, com um card por janela
  var grupos = pf.fornecedores.map(function(f){ return {f:f, js:janelasDoForn(pf, f.id).filter(function(j){ return j.mes===mes; })}; }).filter(function(g){ return g.js.length; });
  grupos.forEach(function(g){
    g.cards = g.js.map(function(j){
      var pagoBruto = pagoJanela(pf, j.chave), pago = Math.min(pagoBruto, j.total), aberto = j.total-pago, n = dias(j.limite);
      var lancs = lancDaJanela(pf, j.chave), mq = mqAplicado(pf, j.chave);
      return {j:j, chave:j.chave, limite:j.limite, fim:j.fim, mes:j.mes, total:j.total, pagoBruto:pagoBruto, pago:pago, aberto:aberto, excesso:pagoBruto-pago, dias:n,
        pct: j.total>0 ? pago/j.total*100 : 0, situacao: aberto<=0.005 ? "" : (n<0 ? "late" : (n<=7 ? "soon" : "")), status:statusJanela(j, pago), prazo:prazoTxt(j.limite),
        lancs:lancs, aguardando:lancs.filter(function(l){ return !l.conferido; }).length, mq:mq, mqRef: mq>0.005 ? mqRefTxt(pf, j.chave) : ""};
    });
    g.total = soma(g.js, function(j){ return j.total; });
    g.pago = soma(g.js, function(j){ return Math.min(pagoJanela(pf, j.chave), j.total); });
    g.aberto = g.total-g.pago; g.pct = g.total>0 ? g.pago/g.total*100 : 0;
    var emAberto = g.js.filter(function(j){ return j.total-pagoJanela(pf, j.chave)>0.005; });
    g.prox = emAberto.length ? emAberto[0].limite : null;
    g.cicloTxt = cicloLabel(g.f);
  });
  grupos.sort(function(a,b){
    if(!!a.prox!==!!b.prox) return a.prox ? -1 : 1;
    return (a.prox||"9999").localeCompare(b.prox||"9999");
  });
  var tot = soma(grupos, function(g){ return g.total; }), pg = soma(grupos, function(g){ return g.pago; });
  return {mes:mes, grupos:grupos, ativos:grupos.filter(function(g){ return g.aberto>0.005; }), finalizados:grupos.filter(function(g){ return g.aberto<=0.005; }), total:tot, pago:pg, falta:tot-pg};
}
// busca na lista de pagamentos lançados (só dados; o filtro de tela guarda o f)
function normBusca(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/r\$/g,"").replace(/\s+/g," ").trim(); }
function buscaValor(l){ var v = (+l.valor).toFixed(2); return normBusca(brl(l.valor)+" "+v+" "+v.replace(".",",")+" "+String(+l.valor)); }
function buscaTxt(l){ return normBusca((l.revendedora||"")+" "+(l.conta||""))+" "+buscaValor(l); }
function filtrarLancamentos(lancs, f){   // f = {q, campo:''|n|c|v, d1, d2, st:''|'0'|'1'}
  f = f||{}; var termos = normBusca(f.q).split(" ").filter(Boolean);
  var lista = lancs.filter(function(l){
    var alvo = f.campo==="n" ? normBusca(l.revendedora) : f.campo==="c" ? normBusca(l.conta) : f.campo==="v" ? buscaValor(l) : buscaTxt(l);
    return (!f.d1 || l.data>=f.d1) && (!f.d2 || l.data<=f.d2) && (!f.st || (l.conferido?"1":"0")===f.st) && termos.every(function(t){ return alvo.indexOf(t)>=0; });
  });
  return {lista:lista, n:lista.length, total:lancs.length, soma:soma(lista, function(l){ return +l.valor||0; })};
}
function lancExcedente(pf, chave, valor){   // quanto o valor passa do que falta na janela (0 se couber)
  var fid = parseInt(chave.split("|")[0]), j = janelasDoForn(pf, fid).find(function(x){ return x.chave===chave; });
  var aberto = j ? Math.max(0, j.total-pagoJanela(pf, chave)) : 0;
  return {aberto:aberto, excesso:Math.max(0, valor-aberto), passa:valor-aberto>0.005};
}
function tokenAcerto(pf, chave){   // muda o pf: token do link do extrato do fornecedor
  if(!pf.tokensAcerto[chave]) pf.tokensAcerto[chave] = Math.random().toString(36).slice(2,8)+Math.random().toString(36).slice(2,8);
  return pf.tokensAcerto[chave];
}

// ---------- negociações: agregação (HTML 4174-4240) ----------
function coletar(pf, filtro, fornFiltro){   // todas as parcelas {pd,f,idx,p}, filtradas por tipo/fornecedor/situação/período
  filtro = Object.assign({}, FILTRO_PADRAO, filtro||{});
  var out = [];
  pf.pedidos.forEach(function(pd){
    if(fornFiltro && pd.fornId!==fornFiltro) return;
    var f = forn(pf, pd.fornId);
    pd.parcelas.forEach(function(p, idx){
      var l = {pd:pd, f:f, idx:idx, p:p}, sem = eSem(l);
      if(filtro.tipo==="sem" && !sem) return;
      if(filtro.tipo==="com" && sem) return;
      if(filtro.sit!=="tudo"){
        if(filtro.sit==="quitado" && !(sem && p.status==="Pago")) return;
        if(filtro.sit==="aberto" && !(sem && p.status!=="Pago")) return;
        if(filtro.sit==="atraso" && !(sem && p.status!=="Pago" && dias(p.venc)<0)) return;
      }
      out.push(l);
    });
  });
  if(filtro.per!=="all"){
    var lim = mesMais(mesAtual(), parseInt(filtro.per));
    return out.filter(function(l){ return l.p.venc.slice(0,7) < lim; });   // passados continuam visíveis
  }
  return out;
}
function agregar(pf, linhas){   // por mês, com janelas e quebra por fornecedor
  var meses = {};
  linhas.forEach(function(l){ var m = l.p.venc.slice(0,7); (meses[m] = meses[m]||{mes:m, linhas:[]}).linhas.push(l); });
  Object.keys(meses).forEach(function(k){
    var M = meses[k];
    var sem = M.linhas.filter(eSem), com = M.linhas.filter(function(l){ return !eSem(l); });
    M.semTotal = soma(sem, function(l){ return l.p.valor; });
    M.semPago = soma(sem.filter(function(l){ return l.p.status==="Pago"; }), function(l){ return l.p.valor; });
    M.semAberto = M.semTotal-M.semPago;
    M.semAtraso = soma(sem.filter(function(l){ return l.p.status!=="Pago" && dias(l.p.venc)<0; }), function(l){ return l.p.valor; });
    M.comTotal = soma(com, function(l){ return l.p.valor; });
    M.divida = M.semAberto+M.comTotal;   // em aberto SEM NF + total COM NF
    M.janelas = [];
    var porF = {};
    M.linhas.forEach(function(l){ (porF[l.pd.fornId] = porF[l.pd.fornId]||[]).push(l); });
    Object.keys(porF).forEach(function(fid){
      distribuir(blocosDoMes(pf, parseInt(fid), M.mes), porF[fid]).forEach(function(b){
        if(!b.itens.length) return;
        M.janelas.push(Object.assign({}, b, {fornId:parseInt(fid), mes:M.mes}));
      });
    });
    M.janelas.sort(function(a,b){ return a.limite.localeCompare(b.limite); });
    M.porFornecedor = {};
    Object.keys(porF).forEach(function(fid){
      var ls = porF[fid], sm = ls.filter(eSem), cm = ls.filter(function(l){ return !eSem(l); });
      var t = soma(sm, function(l){ return l.p.valor; }), pg = soma(sm.filter(function(l){ return l.p.status==="Pago"; }), function(l){ return l.p.valor; }), c = soma(cm, function(l){ return l.p.valor; });
      M.porFornecedor[fid] = {semTotal:t, semPago:pg, semAberto:t-pg, comTotal:c, divida:(t-pg)+c};
    });
  });
  return Object.keys(meses).sort().map(function(k){ return meses[k]; });
}

// ---------- alertas (lógica do renderAlertas, HTML 4243-4325) -> dados ----------
// Ativos: acertos em aberto com pagamento na semana atual. opc.antigos=true liga também os avisos que o HTML deixou desligados (if(false)). opc.fornFiltro = id.
function alertasDe(pf, ags, opc){
  opc = opc||{}; var A = [], sem = semanaAtual();
  var nomeF = function(id){ return (forn(pf, id)||{}).nome; };
  ags.forEach(function(M){ M.janelas.forEach(function(j){
    if(j.aberto<=0.005 || j.limite<sem.ini || j.limite>sem.fim) return;
    var jl = janelasDoForn(pf, j.fornId).find(function(x){ return x.limite===j.limite; });
    var falta = jl ? jl.total-pagoJanela(pf, jl.chave) : j.aberto;
    if(falta<=0.005) return;
    var n = dias(j.limite);
    A.push({tipo: n<0 ? "venceu_semana" : (n===0 ? "vence_hoje" : "semana"), cor: n<0 ? "red" : "orange",
      titulo: n<0 ? "Venceu nesta semana" : (n===0 ? "Pagamento vence hoje" : "Pagamento da semana"),
      texto: nomeF(j.fornId)+" · pagar até "+dbr(j.limite)+(n<0 ? " · "+Math.abs(n)+" dia(s) em atraso" : (n===0 ? "" : " · em "+n+" dia(s)")),
      valor:falta, mes:M.mes, fornId:j.fornId, limite:j.limite, dias:n});
  }); });
  A.sort(function(a,b){ return a.texto.localeCompare(b.texto); });
  if(opc.antigos){
    var comDiv = ags.filter(function(M){ return M.divida>0.005; });
    if(comDiv.length>2){
      var media = soma(comDiv, function(M){ return M.divida; })/comDiv.length;
      comDiv.filter(function(M){ return M.divida>media*LIMIAR_MES; }).forEach(function(M){
        A.push({tipo:"mes_sobrecarregado", cor:"yellow", titulo:"Mês sobrecarregado", texto:mesLabel(M.mes+"-01")+" está "+Math.round((M.divida/media-1)*100)+"% acima da média dos demais meses", valor:M.divida, mes:M.mes}); });
    }
    ags.forEach(function(M){
      var js = M.janelas.filter(function(j){ return j.divida>0.005; });
      if(js.length>2){
        var md = soma(js, function(j){ return j.divida; })/js.length;
        js.filter(function(j){ return j.divida>md*LIMIAR_JANELA; }).forEach(function(j){
          A.push({tipo:"janela_concentrada", cor:"yellow", titulo:"Janela concentrada", texto:dbr(j.limite)+" · "+nomeF(j.fornId)+" concentra parte grande do mês", valor:j.divida, mes:M.mes, fornId:j.fornId, limite:j.limite}); });
      }
      M.janelas.forEach(function(j){
        if(j.aberto<=0.005) return;
        var n = dias(j.limite);
        if(n<0) A.push({tipo:"acerto_vencido", cor:"red", titulo:"Acerto vencido", texto:nomeF(j.fornId)+" · limite "+dbr(j.limite)+" · "+Math.abs(n)+" dias em atraso", valor:j.aberto, mes:M.mes, fornId:j.fornId, limite:j.limite, dias:n});
        else if(n<=DIAS_ALERTA_PROXIMO) A.push({tipo:"acerto_proximo", cor:"orange", titulo:n===0 ? "Acerto vence hoje" : "Acerto próximo", texto:nomeF(j.fornId)+" · pagar até "+dbr(j.limite)+(n===0 ? "" : " · em "+n+" dia(s)"), valor:j.aberto, mes:M.mes, fornId:j.fornId, limite:j.limite, dias:n});
      });
    });
    var fId = opc.fornFiltro||null;
    pf.pedidos.filter(function(pd){ return (!fId || pd.fornId===fId) && !pd.parcelas.length; }).forEach(function(pd){
      A.push({tipo:"pedido_sem_parcela", cor:"orange", titulo:"Pedido sem parcela", texto:nomeF(pd.fornId)+" · pedido "+pd.numero+" lançado sem nenhuma parcela alocada", valor:pd.total, pedId:pd.id}); });
    pf.pedidos.filter(function(pd){ return (!fId || pd.fornId===fId) && pd.parcelas.length; }).forEach(function(pd){
      var aC = soma(pd.parcelas.filter(function(x){ return FORMAS[x.forma].nf==="com"; }), function(x){ return x.valor; });
      var aS = soma(pd.parcelas.filter(function(x){ return FORMAS[x.forma].nf==="sem"; }), function(x){ return x.valor; });
      var d = Math.abs(pd.comNF-aC)+Math.abs(pd.semNF-aS);
      if(d>0.005) A.push({tipo:"parcelas_nao_fecham", cor:"yellow", titulo:"Parcelas não fecham", texto:nomeF(pd.fornId)+" · pedido "+pd.numero+" — parcelas não batem com a divisão COM/SEM NF", valor:d, pedId:pd.id});
    });
  }
  return A;
}
function resumoAlertas(A){   // barra fechada: cor pela severidade e partes do texto
  var nRed = A.filter(function(a){ return a.cor==="red"; }).length, nOra = A.filter(function(a){ return a.cor==="orange"; }).length, sem = semanaAtual();
  var partes = ["semana de "+dbr(sem.ini)+" a "+dbr(sem.fim)];
  if(nRed) partes.push(nRed+" em atraso");
  if(nOra) partes.push(nOra+" a pagar");
  return {total:A.length, nRed:nRed, nOra:nOra, cor: nRed ? "red" : (nOra ? "orange" : "yellow"), partes:partes, semana:sem};
}

// ---------- painel de endividamento (cálculo do renderPainel/viewTempo/tabelaJanelas/viewMatriz, HTML 4331-4448) ----------
function painelTotais(ags){
  var totSem = soma(ags, function(M){ return M.semTotal; }), totCom = soma(ags, function(M){ return M.comTotal; }), totAb = soma(ags, function(M){ return M.semAberto; });
  return {totSem:totSem, totCom:totCom, totAb:totAb, divida:totAb+totCom};
}
function viewTempo(ags){   // meses com Pix em aberto no topo; quitados descem
  var T = function(k){ return soma(ags, function(M){ return M[k]; }); };
  var linha = function(M){ return {mes:M.mes, nJanelas:M.janelas.length, semAtraso:M.semAtraso, atraso:M.semAtraso>0.005, quitado:M.semAberto<=0.005, semAberto:M.semAberto, comTotal:M.comTotal, divida:M.divida}; };
  return {abertos:ags.filter(function(M){ return M.semAberto>0.005; }).map(linha), quitados:ags.filter(function(M){ return M.semAberto<=0.005; }).map(linha),
    totais:{nJanelas:soma(ags, function(M){ return M.janelas.length; }), semAberto:T("semAberto"), comTotal:T("comTotal"), divida:T("divida")}};
}
function tabelaJanelas(pf, ags){   // janelas agrupadas por fornecedor (maior dívida primeiro) + totais
  var grupos = {};
  ags.forEach(function(M){ M.janelas.forEach(function(j){ (grupos[j.fornId] = grupos[j.fornId]||[]).push(Object.assign({}, j, {mes:M.mes})); }); });
  var fids = Object.keys(grupos).map(Number).sort(function(a,b){ return soma(grupos[b], function(j){ return j.divida; })-soma(grupos[a], function(j){ return j.divida; }); });
  var out = fids.map(function(fid){
    var js = grupos[fid].slice().sort(function(a,b){ return a.limite.localeCompare(b.limite); }), f = forn(pf, fid);
    return {fornId:fid, nome:f ? f.nome : "—", ciclo:cicloLabel(f), sT:soma(js, function(j){ return j.total; }), sP:soma(js, function(j){ return j.pago; }), sA:soma(js, function(j){ return j.aberto; }), sC:soma(js, function(j){ return j.comNF; }),
      janelas:js.map(function(j){
        var n = dias(j.limite), quit = j.aberto<=0.005;
        return Object.assign({}, j, {nParcelas:j.itens.length, dias:n, cor: quit ? "green" : (n<0 ? "red" : (n<=DIAS_ALERTA_PROXIMO ? "orange" : "gray")),
          nota: quit ? "quitado" : (n<0 ? Math.abs(n)+"d em atraso" : (n===0 ? "vence hoje" : "em "+n+"d"))});
      })};
  });
  var T = function(k){ return soma(fids, function(fid){ return soma(grupos[fid], function(j){ return j[k]; }); }); };
  return {grupos:out, totais:{total:T("total"), pago:T("pago"), aberto:T("aberto"), comNF:T("comNF"), divida:T("divida")}};
}
function viewMatriz(pf, ags){   // fornecedor × mês (dívida)
  var set = {}; ags.forEach(function(M){ Object.keys(M.porFornecedor).forEach(function(k){ set[k] = 1; }); });
  var fids = Object.keys(set).map(Number);
  var todos = []; ags.forEach(function(M){ Object.keys(M.porFornecedor).forEach(function(k){ todos.push(M.porFornecedor[k].divida); }); });
  var max = Math.max.apply(null, todos.concat([1]));
  return {meses:ags.map(function(M){ return M.mes; }), max:max, fornecedores:fids.map(function(fid){
    var cels = ags.map(function(M){ var v = (M.porFornecedor[fid]||{}).divida||0; return {mes:M.mes, valor:v, vazio:v<=0.005, alto:v>0.005 && v>max*0.6}; });
    return {fornId:fid, nome:(forn(pf, fid)||{}).nome, celulas:cels, total:soma(cels, function(c){ return c.valor; })};
  }), totaisMes:ags.map(function(M){ return M.divida; }), totalGeral:soma(ags, function(M){ return M.divida; })};
}

// ---------- negociações: resumo por fornecedor e relação por mês (HTML 4049-4148, 4479-4626) ----------
function resumoNegociacao(pf, filtroId){
  var alvos = filtroId ? pf.fornecedores.filter(function(f){ return f.id===filtroId; }) : pf.fornecedores;
  var comPedido = alvos.filter(function(f){ return pf.pedidos.some(function(p){ return p.fornId===f.id; }); });
  var pagoDe = function(ps){ return soma(ps, function(p){ return soma(p.parcelas.filter(function(x){ return x.status==="Pago"; }), function(x){ return x.valor; }); }); };
  var alocDe = function(ps){ return soma(ps, function(p){ return soma(p.parcelas, function(x){ return x.valor; }); }); };
  if(!filtroId){
    var linhas = comPedido.map(function(f){
      var meus = pf.pedidos.filter(function(p){ return p.fornId===f.id; });
      var totalPed = soma(meus, function(p){ return p.total; }), pagoT = pagoDe(meus);
      return {fornId:f.id, nome:f.nome, nPedidos:meus.length, total:totalPed, comNF:soma(meus, function(p){ return p.comNF; }), semNF:soma(meus, function(p){ return p.semNF; }), pago:pagoT, divida:totalPed-pagoT, semParcela:totalPed-alocDe(meus)};
    });
    var tot = function(k){ return soma(pf.pedidos, function(p){ return p[k]; }); };
    return {modo:"todos", linhas:linhas, totais:{nPedidos:pf.pedidos.length, total:tot("total"), comNF:tot("comNF"), semNF:tot("semNF"), pago:pagoDe(pf.pedidos), divida:tot("total")-pagoDe(pf.pedidos), semParcela:tot("total")-alocDe(pf.pedidos)}};
  }
  return {modo:"um", itens:comPedido.map(function(f){
    var meus = pf.pedidos.filter(function(p){ return p.fornId===f.id; });
    var totalPed = soma(meus, function(p){ return p.total; }), pagoT = 0, abertoT = 0, semParc = 0, mensal = {};
    meus.forEach(function(p){
      var aloc = 0;
      p.parcelas.forEach(function(pc){
        aloc += pc.valor;
        var mes = pc.venc.slice(0,7);
        mensal[mes] = mensal[mes]||{com:0, sem:0, pago:0, aberto:0};
        mensal[mes][FORMAS[pc.forma].nf==="com" ? "com" : "sem"] += pc.valor;
        if(pc.status==="Pago"){ mensal[mes].pago += pc.valor; pagoT += pc.valor; } else { mensal[mes].aberto += pc.valor; abertoT += pc.valor; }
      });
      semParc += (p.total-aloc);
    });
    var chaves = Object.keys(mensal).sort();
    return {fornId:f.id, nome:f.nome, cat:f.cat, nPedidos:meus.length, total:totalPed, comNF:soma(meus, function(p){ return p.comNF; }), semNF:soma(meus, function(p){ return p.semNF; }),
      pago:pagoT, aberto:abertoT, divida:totalPed-pagoT, semParcela:semParc,
      mensal:chaves.map(function(m){ var d = mensal[m]; return {mes:m, com:d.com, sem:d.sem, total:d.com+d.sem, pago:d.pago, aberto:d.aberto}; }),
      totaisMensal:{com:soma(chaves, function(m){ return mensal[m].com; }), sem:soma(chaves, function(m){ return mensal[m].sem; }), total:soma(chaves, function(m){ return mensal[m].com+mensal[m].sem; }), pago:pagoT, aberto:abertoT}};
  })};
}
function parcelaSituacao(l){   // situação de uma parcela na lista (linhaParcela do HTML)
  var n = l.p.status==="Pago" ? null : dias(l.p.venc), late = (n!==null && n<0);
  return {dias:n, atrasada:late, cor: n===null ? "" : (n<0 ? "red" : (n<=7 ? "orange" : "")), statusTexto:l.p.status, statusCor: l.p.status==="Pago" ? "green" : (late ? "red" : "orange"), forma:FORMAS[l.p.forma], nfLabel:NF_LABEL[FORMAS[l.p.forma].nf]};
}
function pedidosSemParcela(pf, fornId){ return (fornId ? pf.pedidos.filter(function(p){ return p.fornId===fornId; }) : pf.pedidos).filter(function(pd){ return !pd.parcelas.length; }); }
function relacaoPorMes(pf, linhas, fornId){   // "Relação detalhada por mês": sem NF (controle), com NF (registro) e, com fornecedor filtrado, os blocos por data limite
  var porMes = {};
  linhas.forEach(function(l){ var mes = l.p.venc.slice(0,7); (porMes[mes] = porMes[mes]||[]).push(l); });
  return Object.keys(porMes).sort().map(function(mes){
    var todas = porMes[mes].slice().sort(function(a,b){ return a.p.venc.localeCompare(b.p.venc); });
    var ls = todas.filter(eSem), lsC = todas.filter(function(l){ return !eSem(l); });
    var total = soma(ls, function(l){ return l.p.valor; }), pago = soma(ls.filter(function(l){ return l.p.status==="Pago"; }), function(l){ return l.p.valor; });
    var r = {mes:mes, sem:ls, com:lsC, total:total, pago:pago, aberto:total-pago, registro:soma(lsC, function(l){ return l.p.valor; })};
    if(fornId){
      r.custom = temOverride(pf, fornId, mes);
      r.cicloTxt = cicloLabel(forn(pf, fornId)); r.cicloCor = cicloCor(forn(pf, fornId));
      r.blocos = distribuir(blocosDoMes(pf, fornId, mes), ls).map(function(b, i){
        var n = dias(b.limite);
        return Object.assign({}, b, {ordem:i+1, usado:b.itens.length>0, chip:chipClasse(b), dias:n, cor: b.aberto<=0.005 ? "green" : (n<0 ? "red" : (n<=7 ? "orange" : "gray")), prazo:prazoTxt(b.limite)});
      });
    }
    return r;
  });
}
function pedidoDetalhe(pf, pedId){   // modal de detalhe do pedido
  var pd = pf.pedidos.find(function(p){ return p.id===pedId; }); if(!pd) return null;
  var comAloc = soma(pd.parcelas.filter(function(p){ return FORMAS[p.forma].nf==="com"; }), function(p){ return p.valor; });
  var semAloc = soma(pd.parcelas.filter(function(p){ return FORMAS[p.forma].nf==="sem"; }), function(p){ return p.valor; });
  var pagoT = soma(pd.parcelas.filter(function(p){ return p.status==="Pago"; }), function(p){ return p.valor; });
  return {pd:pd, forn:forn(pf, pd.fornId), comAloc:comAloc, semAloc:semAloc, pago:pagoT, aberto:pd.total-pagoT, restCom:pd.comNF-comAloc, restSem:pd.semNF-semAloc,
    nfTipo:pd.nfTipo, parcelas:pd.parcelas.map(function(p, i){ var F = FORMAS[p.forma]; return {i:i, p:p, forma:F, nfLabel:NF_LABEL[F.nf], registro:F.nf==="com"}; })};
}
function dividirNF(tipo, total, editado, com, sem){   // recalcSplit: divisão do pedido em com/sem NF
  var t = num(total), c = num(com), s = num(sem);
  if(tipo==="com"){ c = t; s = 0; }
  else if(tipo==="sem"){ c = 0; s = t; }
  else if(editado==="com") s = Math.max(t-c, 0);
  else if(editado==="sem") c = Math.max(t-s, 0);
  return {total:t, com:c, sem:s, dif:t-(c+s), fecha:Math.abs(t-(c+s))<0.005};
}
function gerarParcelas(alvo, n, dataBase, forma){   // divide o valor em N parcelas mensais iguais (a última leva o resto)
  n = parseInt(n)||1; alvo = num(alvo); if(alvo<=0) return [];
  var unit = Math.floor(alvo/n*100)/100, resto = Math.round((alvo-unit*n)*100)/100, out = [];
  for(var i=0; i<n; i++) out.push({forma:forma||"pix_revendedora", venc:addMeses(dataBase||hojeIso(), i+1), valor: i===n-1 ? unit+resto : unit});
  return out;
}
function expandirParcelas(linhas){   // lerLinhas: cartão vira N parcelas mensais; conta ganha " · i/N"
  var out = [];
  (linhas||[]).forEach(function(r){
    var v = num(r.valor); if(v<=0) return;
    var forma = r.forma||"pix_revendedora", qtd = forma==="cartao" ? (parseInt(r.qtd)||1) : 1;
    for(var i=0; i<qtd; i++) out.push({forma:forma, venc:addMeses(r.venc, i), valor:v, conta:(r.conta||"—")+(qtd>1 ? " · "+(i+1)+"/"+qtd : ""), status:r.status||"Pendente"});
  });
  return out;
}
function saldoParcela(pf, pedId, forma, valor, qtd){   // renderSaldoParc
  var pd = pf.pedidos.find(function(p){ return p.id===pedId; }); if(!pd || !FORMAS[forma]) return null;
  var F = FORMAS[forma], alvo = F.nf==="com" ? pd.comNF : pd.semNF;
  var usado = soma(pd.parcelas.filter(function(p){ return FORMAS[p.forma].nf===F.nf; }), function(p){ return p.valor; });
  var q = F.nf==="com" && forma==="cartao" ? (parseInt(qtd)||1) : 1, val = num(valor)*q, sobra = alvo-usado-val;
  return {alvo:alvo, usado:usado, qtd:q, val:val, sobra:sobra, fecha:Math.abs(sobra)<0.005, excede:sobra<-0.005};
}
function formasDoPedido(pd){ return Object.keys(FORMAS).filter(function(k){ var nf = FORMAS[k].nf; return !(nf==="com" && pd.comNF<=0.005) && !(nf==="sem" && pd.semNF<=0.005); }); }

// ---------- datas limite do mês (HTML 4628-4721) ----------
function acertoPreset(pf, fornId, mes, r){   // blocos do preset (mensal/d15/d10) respeitando o prazo do ciclo
  var pz = cicloDe(forn(pf, fornId)).prazoDias||0;
  return PERIODICIDADES[r].cortes(mes).map(function(d){ var fim = diaISO(mes, d); return {fim:fim, limite: pz>0 ? addDias(fim, pz) : fim}; });
}
function acertoPresetAtivo(pf, fornId, mes, blocos){
  var pz = cicloDe(forn(pf, fornId)).prazoDias||0, b = blocos.slice().sort(function(a,c){ return a.fim.localeCompare(c.fim); });
  var rs = ["mensal","d15","d10"];
  for(var k=0; k<rs.length; k++){
    var alvo = PERIODICIDADES[rs[k]].cortes(mes).map(function(d){ return diaISO(mes, d); });
    if(b.length===alvo.length && b.every(function(x, i){ return x.fim===alvo[i] && x.limite===(pz>0 ? addDias(alvo[i], pz) : alvo[i]); })) return rs[k];
  }
  return "custom";
}
function acertoResumo(pf, fornId, mes, blocos){   // renderResumoAcerto: quanto cai em cada data
  blocos = blocos.filter(function(b){ return b.fim && b.limite; }).sort(function(a,b){ return a.fim.localeCompare(b.fim); });
  var ls = [];
  pf.pedidos.filter(function(p){ return p.fornId===fornId; }).forEach(function(pd){ pd.parcelas.forEach(function(p, idx){ if(p.venc.slice(0,7)===mes && FORMAS[p.forma].nf==="sem") ls.push({pd:pd, idx:idx, p:p}); }); });
  var dist = blocos.length ? distribuir(blocos, ls) : [];
  var totalMes = soma(ls, function(l){ return l.p.valor; }), alocado = soma(dist, function(b){ return b.total; });
  return {blocos:dist.map(function(b){ return {fim:b.fim, limite:b.limite, total:b.total, nParcelas:b.itens.length}; }), totalMes:totalMes, alocado:alocado, fecha:Math.abs(totalMes-alocado)<0.005, semDatas:!blocos.length};
}
function cortesDoPreset(r, mesRef){ return PERIODICIDADES[r].cortes(mesRef).map(function(d){ return d===ultDia(mesRef) ? 31 : d; }); }   // setPeriodicidade
function previewCiclo(cortes, prazo, mes){   // previewCiclo do cadastro de fornecedor
  mes = mes||mesAtual(); prazo = parseInt(prazo)||0;
  return cortes.map(function(d, i){ var fim = diaISO(mes, d); return {ordem:i+1, fim:fim, limite: prazo>0 ? addDias(fim, prazo) : fim}; });
}
function limpaCortes(lista){ return (lista||[]).map(function(x){ return parseInt(x); }).filter(function(n){ return n>=1 && n<=31; }).sort(function(a,b){ return a-b; }).filter(function(v, i, a){ return a.indexOf(v)===i; }); }

// ---------- MAQUININHA BANHO (HTML 4791-5350) ----------
function mqPassadasDoMes(pf, m){ return pf.mqPassadas.filter(function(p){ return p.data.slice(0,7)===m; }).sort(function(a,b){ return a.data.localeCompare(b.data); }); }
function mqSomaPassadas(pf, m){ return soma(mqPassadasDoMes(pf, m), function(p){ return p.valor; }); }
function mqBruto(pf, m){ var f = pf.mqFech[m]; return (f && f.bruto!=null) ? f.bruto : mqSomaPassadas(pf, m); }
function mqParcela(pf, m){ var f = pf.mqFech[m]; return (f && f.parcelas>0) ? f.liquido/f.parcelas : 0; }
function mqMesesDesconto(pf, m){ var f = pf.mqFech[m]; if(!f || !(f.parcelas>0)) return []; return Array.from({length:f.parcelas}, function(_, i){ return mesMais(m, i+1); }); }
function mqDescontoNoMes(pf, alvo){ var t = 0; Object.keys(pf.mqFech).forEach(function(m){ if(mqMesesDesconto(pf, m).indexOf(alvo)>=0) t += mqParcela(pf, m); }); return t; }
function mqOrigensDoMes(pf, alvo){
  var out = [];
  Object.keys(pf.mqFech).sort().forEach(function(m){ var ms = mqMesesDesconto(pf, m); if(ms.indexOf(alvo)>=0) out.push({comp:m, valor:mqParcela(pf, m), i:ms.indexOf(alvo)+1, n:pf.mqFech[m].parcelas}); });
  return out;
}
function mqBaixasDoMes(pf, m){ return pf.mqBaixas.filter(function(b){ return b.mes===m; }).sort(function(a,b){ return a.data.localeCompare(b.data); }); }
function mqBaixado(pf, m){ return soma(mqBaixasDoMes(pf, m), function(b){ return b.valor; }); }
function mqLinhas(pf, mesSel){   // meses que aparecem como linhas (competências); mesSel = mês escolhido na tela (opcional)
  var s = {}; Object.keys(pf.mqFech).forEach(function(m){ s[m] = 1; });
  pf.mqPassadas.forEach(function(p){ s[p.data.slice(0,7)] = 1; });
  s[mesAtual()] = 1; if(mesSel) s[mesSel] = 1;
  return Object.keys(s).sort();
}
function mqColunas(pf, mesSel){
  var s = {};
  mqLinhas(pf, mesSel).forEach(function(m){ mqMesesDesconto(pf, m).forEach(function(x){ s[x] = 1; }); });
  pf.mqBaixas.forEach(function(b){ s[b.mes] = 1; });
  s[mesAtual()] = 1; if(mesSel) s[mesSel] = 1;
  return Object.keys(s).sort();
}
function mqMesesSel(pf, mesSel){ var s = {}; mqLinhas(pf, mesSel).forEach(function(m){ s[m] = 1; }); mqColunas(pf, mesSel).forEach(function(m){ s[m] = 1; }); return Object.keys(s).sort(); }
function semearBaixasMq(pf){   // muda o pf. Na carga: meses de desconto já vencidos nascem baixados
  if(pf.mqBaixas.length) return;
  mqColunas(pf).filter(function(m){ return m<mesAtual(); }).forEach(function(m){
    var v = mqDescontoNoMes(pf, m); if(v<=0.005) return;
    pf.mqBaixas.push({id:pf.seq.mqB++, mes:m, data:diaISO(m, ultDia(m)), valor:v, forma:"Desconto em conta", conta:"Abatido na conta do banho", arqNome:"", arqData:""});
  });
}
function mqEhAuto(pf, m){ return !pf.mqDist[m]; }
function mqDisponivel(pf, m){ return mqDescontoNoMes(pf, m)-mqBaixado(pf, m); }   // baixas manuais saem do bolo
function mqJanelasDoMes(pf, m){ return janelasDoForn(pf, pf.mqFornId).filter(function(j){ return j.mes===m; }).sort(function(a,b){ return a.limite.localeCompare(b.limite); }); }
function mqOrdinal(pf, chave){
  var p = chave.split("|"), fid = parseInt(p[0]), lim = p[1];
  var j = janelasDoForn(pf, fid).find(function(x){ return x.chave===chave; });
  if(!j) return {txt:dbr(lim), mes:lim.slice(0,7)};
  var irmas = mqJanelasDoMes(pf, j.mes), i = irmas.findIndex(function(x){ return x.chave===chave; });
  var nome = (cicloDe(forn(pf, fid)).periodicidade==="d10" ? "ª dezena" : "º acerto");
  return {txt:(i+1)+nome+" · "+dbr(j.limite), mes:j.mes, j:j};
}
function mqManualNaJanela(pf, chave, exceto){   // soma personalizada aplicada na janela por QUALQUER mês
  var t = 0;
  Object.keys(pf.mqDist).forEach(function(m){ if(m===exceto) return; pf.mqDist[m].forEach(function(d){ if(d.chave===chave) t += d.valor; }); });
  return t;
}
function mqDistribuicao(pf, m){   // personalizada ou cascata automática (1ª dezena primeiro; o que passar desce)
  if(pf.mqDist[m]) return pf.mqDist[m].filter(function(d){ return d.valor>0.005 && d.chave && janelaPorChave(pf, d.chave); });
  var saldo = mqDisponivel(pf, m), out = [];
  mqJanelasDoMes(pf, m).forEach(function(j){
    if(saldo<=0.005) return;
    var devido = j.total-pagoPix(pf, j.chave)-mqManualNaJanela(pf, j.chave, m), v = Math.min(saldo, devido);
    if(v>0.005){ out.push({chave:j.chave, valor:v}); saldo -= v; }
  });
  return out;
}
function excedenteJanela(pf, chave, total){ return Math.max(0, pagoJanela(pf, chave)-total); }
function mqDistribuido(pf, m){ return soma(mqDistribuicao(pf, m), function(d){ return d.valor; }); }
function mqSobra(pf, m){ return mqDisponivel(pf, m)-mqDistribuido(pf, m); }
function mqMesesComSaldo(pf){
  var s = {}; Object.keys(pf.mqDist).forEach(function(m){ s[m] = 1; });
  mqColunas(pf).forEach(function(m){ if(mqDescontoNoMes(pf, m)>0.005) s[m] = 1; });
  return Object.keys(s);
}
function mqMapaAplicado(pf){   // desconto que entrou em cada janela (todos os meses), em cache por pf
  var c = cache(pf); if(c.mq) return c.mq;
  var mapa = {};
  mqMesesComSaldo(pf).forEach(function(m){ mqDistribuicao(pf, m).forEach(function(d){ mapa[d.chave] = (mapa[d.chave]||0)+d.valor; }); });
  c.mq = mapa; return mapa;
}
function mqAplicado(pf, chave){ return mqMapaAplicado(pf)[chave]||0; }
function mqCandidatas(pf, m){ return janelasDoForn(pf, pf.mqFornId).filter(function(j){ return j.mes>=mesMais(m,-2) && j.mes<=mesMais(m,3); }).sort(function(a,b){ return a.limite.localeCompare(b.limite); }); }
function mqSincronizarBruto(pf, mes, somaAntes){   // muda o pf: o bruto segue a soma das passadas, a menos que tenha sido ajustado à mão
  var f = pf.mqFech[mes]; if(!f || f.bruto==null) return;
  if(Math.abs(f.bruto-somaAntes)<0.005) f.bruto = mqSomaPassadas(pf, mes);
}
function mqPreviewFech(pf, mes, bruto, liquido, parcelas){   // previewFech
  var b = num(bruto), l = num(liquido), n = parseInt(parcelas)||0;
  if(!l || !n) return null;
  var p = l/n, atual = pf.mqFech[mes] && mqMesesDesconto(pf, mes);
  return {taxas:b-l, taxaPct: b>0 ? (b-l)/b*100 : null, parcela:p, meses:Array.from({length:n}, function(_, i){ var m = mesMais(mes, i+1); return {i:i+1, mes:m, totalMes:mqDescontoNoMes(pf, m)-(atual && atual.indexOf(m)>=0 ? mqParcela(pf, mes) : 0)+p}; })};
}
function mqPreviewDist(pf, mes, linhas){   // previewDist
  var ls = (linhas||[]).filter(function(d){ return d.chave && num(d.valor)>0.005; }).map(function(d){ return {chave:d.chave, valor:num(d.valor)}; });
  var disp = mqDisponivel(pf, mes), tot = soma(ls, function(d){ return d.valor; });
  return {disponivel:disp, distribuido:tot, passou:tot-disp>0.005, diferenca:Math.abs(disp-tot), linhas:ls.map(function(d){
    var j = janelaPorChave(pf, d.chave); if(!j) return null;
    var restante = j.total-pagoPix(pf, j.chave)-mqManualNaJanela(pf, d.chave, mes)-d.valor;
    return {chave:d.chave, txt:mqOrdinal(pf, d.chave).txt, valor:d.valor, restante:restante, quitada:restante<=0.005, sobra:restante<-0.005 ? -restante : 0};
  }).filter(Boolean)};
}

// ---------- POINT · conta corrente (HTML 5366-5529) ----------
function ptMeses(pf){ return pf.pedidos.filter(function(p){ return p.fornId===PT_FORN; }).sort(function(a,b){ return a.data.localeCompare(b.data); }); }
function ptPed(pf, id){ return pf.pedidos.find(function(p){ return p.id===id; }); }
function ptDados(pf){   // cálculo do renderPoint: bloco de pedidos (saldo) e bloco do pix mensal
  var lista = ptMeses(pf), acum = pf.ptSaldoIni, tPed = 0, nPed = 0;
  var ped = lista.map(function(pd){
    var s = ptSomaItens(pd), itens = pd.itens||[];
    acum = r2(acum+s); tPed += s; nPed += itens.length;
    return {id:pd.id, mes:pd.data.slice(0,7), data:pd.data, nItens:itens.length, itens:itens, soma:s, acumulado:acum, aberto:!!pf.ptAberto[pd.id]};
  });
  var saldo = pf.ptSaldoIni, tPix = 0, tBol = 0, tPago = 0, tAberto = 0;
  var pix = lista.map(function(pd){
    var mes = pd.data.slice(0,7), p = pd.parcelas[0]||{valor:0, venc:mes+"-28", status:"Pendente"};
    var s = ptSomaItens(pd), x = r2(p.valor), bol = r2(pf.ptBoleto[mes]||0);
    saldo = r2(saldo+s-x-bol); tPix += x; tBol += bol;
    if(p.status==="Pago") tPago += x; else tAberto += x;
    return {id:pd.id, mes:mes, data:pd.data, pix:x, venc:p.venc, status:p.status, boleto:bol, saldo:saldo};
  });
  return {saldoIni:pf.ptSaldoIni, pedidos:ped, totaisPedidos:{soma:tPed, nItens:nPed, saldo:acum}, pix:pix, totaisPix:{pix:tPix, boleto:tBol, pago:tPago, aberto:tAberto, saldo:saldo},
    jaPago:tPago+tBol, nMeses:lista.length, nPendentes:lista.filter(function(pd){ return pd.parcelas[0] && pd.parcelas[0].status!=="Pago"; }).length};
}

// ---------- ações (mutam o pf copiado; chamadas só pelo pfReduz) ----------
function acharJanelaDaParcela(pf, pd, p){
  var j = janelasDoForn(pf, pd.fornId).find(function(x){ return x.itens.some(function(l){ return l.p===p; }); });
  return j||null;
}
function lancarBaixaAuto(pf, pd, p){   // baixa de parcela sem NF vira um lançamento automático ('—'), porque o status vem dos lançamentos
  var j = acharJanelaDaParcela(pf, pd, p); if(!j) return false;
  pf.lancamentos.push({id:pf.seq.L++, chave:j.chave, fornId:pd.fornId, mes:j.mes, limite:j.limite, data:p.venc, revendedora:"—", valor:p.valor, conta:p.conta||"—", arqNome:"", arqTipo:"", arqData:"", conferido:false, conferidoEm:""});
  invalidar(pf); return true;
}
function estornarBaixaAuto(pf, pd, p){
  var j = acharJanelaDaParcela(pf, pd, p); if(!j) return false;
  var l = pf.lancamentos.find(function(x){ return x.chave===j.chave && x.revendedora==="—" && Math.abs(x.valor-p.valor)<0.005; });
  if(!l) return false;
  pf.lancamentos = pf.lancamentos.filter(function(x){ return x.id!==l.id; }); invalidar(pf); return true;
}
function logPagamento(pf, pd, p, F, conta){ pf.pagamentos.push({id:pf.seq.Pg++, fornId:pd.fornId, data:p.venc, desc:"Pedido "+pd.numero+" · "+F.label+" ("+NF_LABEL[F.nf]+")", conta:conta, valor:p.valor}); }
var DATA_OK = /^\d{4}-\d{2}-\d{2}$/;

function pfReduz(s, a){
  var pf = JSON.parse(JSON.stringify(s.pf||pfVazio())), msgAviso = "";
  var recusa = function(t, confirmar){ return {patch:{}, msg:t, confirmar:!!confirmar}; };   // confirmar:true = repita com forcar:true se o usuário concordar
  var ok = function(msg){ invalidar(pf); sincronizarTudo(pf); return {patch:{pf:pf}, msg:msg||"Salvo"}; };
  var F = function(id){ return forn(pf, id); };
  var ped = function(id){ return pf.pedidos.find(function(p){ return p.id===id; }); };
  invalidar(pf);
  switch(a.op){
    case "mut": { var r = a.fn(pf); invalidar(pf); return ok(typeof r==="string" ? r : "Salvo"); }

    // ---- lançamento de Pix (salvarLancamento / toggleConferido / estornarLancamento)
    case "lanc_add": {
      var v = num(a.valor); if(!(v>0)) return recusa("Informe o valor pago.");
      if(!a.data) return recusa("Informe a data do pagamento.");
      var rev = String(a.revendedora||"").trim(); if(!rev) return recusa("Informe o nome da revendedora.");
      if(!a.chave || a.chave.indexOf("|")<0) return recusa("Escolha a data de pagamento (janela).");
      var fid = parseInt(a.chave.split("|")[0]), limite = a.chave.split("|")[1], jn = janelasDoForn(pf, fid).find(function(x){ return x.chave===a.chave; });
      var ex = lancExcedente(pf, a.chave, v);
      if(ex.passa && !a.forcar) return recusa("O valor ultrapassa o que falta nesta data (saldo de "+brl(ex.aberto)+"). Lançar mesmo assim?", true);
      pf.lancamentos.push({id:pf.seq.L++, chave:a.chave, fornId:fid, mes: jn ? jn.mes : a.data.slice(0,7), limite:limite, data:a.data, revendedora:rev, valor:v, conta:String(a.conta||"").trim()||"—",
        arqNome:a.arqNome||"", arqTipo:a.arqTipo||"", arqData:a.arqData||"", conferido:false, conferidoEm:""});
      return ok("Pagamento lançado — "+brl(v)+" para "+rev+(a.arqNome ? " · comprovante anexado" : ""));
    }
    case "lanc_del": { var l1 = pf.lancamentos.find(function(x){ return x.id===a.id; }); if(!l1) return recusa("Pagamento não encontrado.");
      pf.lancamentos = pf.lancamentos.filter(function(x){ return x.id!==a.id; }); return ok("Pagamento estornado"); }
    case "lanc_conferido": { var l2 = pf.lancamentos.find(function(x){ return x.id===a.id; }); if(!l2) return recusa("Pagamento não encontrado.");
      var novo = (a.conferido===undefined) ? !l2.conferido : !!a.conferido;
      l2.conferido = novo; l2.conferidoEm = novo ? (a.em||hojeIso()) : "";
      return ok(novo ? "Pagamento conferido — "+brl(l2.valor)+" · "+(l2.revendedora||"") : "Conferência desfeita — voltou para Aguardando"); }
    case "token_acerto": { tokenAcerto(pf, a.chave); return ok("Link gerado"); }

    // ---- fornecedor (salvarFornecedor / excluirFornecedor / addFornRapido)
    case "forn_add": {
      var nome = String(a.nome||"").trim(); if(!nome) return recusa("Informe o nome do fornecedor.");
      if(a.rapido && pf.fornecedores.some(function(f){ return f.nome.toLowerCase()===nome.toLowerCase(); })) return recusa("Já existe um fornecedor com esse nome.");
      var cic = a.ciclo ? {periodicidade:a.ciclo.periodicidade||"custom", cortes:limpaCortes(a.ciclo.cortes).length ? limpaCortes(a.ciclo.cortes) : [31], prazoDias:parseInt(a.ciclo.prazoDias)||0} : {periodicidade:"mensal", cortes:[31], prazoDias:0};
      var ePrest = a.tipo==="prestador";
      var novoF = {id:pf.seq.F++, nome:nome, tipo:ePrest ? "prestador" : "fornecedor", cat:a.cat||(ePrest ? "Outros" : "Fornecedor de peças"), cnpj:a.cnpj||"", formas:Object.keys(FORMAS), ciclo:cic};
      if(ePrest) novoF.vinculo = a.vinculo||"externo";
      pf.fornecedores.push(novoF); return ok(a.rapido ? "Fornecedor "+nome+" cadastrado · ciclo mensal (ajuste na aba Fornecedores)" : (ePrest ? "Prestador cadastrado" : "Fornecedor cadastrado"));
    }
    case "forn_set": {
      var f1 = F(a.id); if(!f1) return recusa("Fornecedor não encontrado.");
      var p1 = a.patch||{};
      if(p1.nome!==undefined){ p1.nome = String(p1.nome).trim(); if(!p1.nome) return recusa("Informe o nome do fornecedor."); }
      if(p1.ciclo){ p1.ciclo = {periodicidade:p1.ciclo.periodicidade||"custom", cortes:limpaCortes(p1.ciclo.cortes).length ? limpaCortes(p1.ciclo.cortes) : [31], prazoDias:parseInt(p1.ciclo.prazoDias)||0}; }
      Object.assign(f1, p1); return ok("Fornecedor atualizado");
    }
    case "forn_del": {
      var f2 = F(a.id); if(!f2) return recusa("Fornecedor não encontrado.");
      if(pf.pedidos.some(function(p){ return p.fornId===a.id; })) return recusa("Este fornecedor tem pedidos lançados. Exclua os pedidos primeiro.");
      if(a.id===pf.mqFornId) return recusa("Este fornecedor recebe o desconto da maquininha. Troque a conta da maquininha antes de excluir.");   // trava a mais (o HTML deixava excluir)
      pf.fornecedores = pf.fornecedores.filter(function(f){ return f.id!==a.id; });
      pf.pagamentos = pf.pagamentos.filter(function(p){ return p.fornId!==a.id; });
      return ok("Fornecedor excluído");
    }

    // ---- pedido (salvarPedido / excluirPedido) e parcela (salvarParcela / togglePago)
    case "pedido_add": {
      var tipo = a.nfTipo||"misto", tot = num(a.total), c = num(a.comNF), s2 = num(a.semNF);
      if(tipo==="com"){ c = tot; s2 = 0; } else if(tipo==="sem"){ c = 0; s2 = tot; }
      if(tot<=0) return recusa("Informe o valor total do pedido.");
      if(Math.abs(tot-(c+s2))>0.005) return recusa('A soma de "com NF" + "sem NF" precisa fechar com o valor total do pedido.');
      var fid2 = parseInt(a.fornId); if(!F(fid2)) return recusa("Escolha o fornecedor.");
      if(!a.data || !DATA_OK.test(a.data)) return recusa("Informe a data do pedido.");
      var ePrest2 = ehPrestador(F(fid2)), pixMin = num(a.pixMin);
      if(ePrest2 && !(a.limite && DATA_OK.test(a.limite))) return recusa("Prestador de serviço precisa de uma data limite para pagar.");
      if(ePrest2 && pixMin<=0) return recusa("Prestador de serviço precisa do valor mínimo de pix.");
      var todas = expandirParcelas(a.linhas);
      if(todas.some(function(p){ return !FORMAS[p.forma] || !DATA_OK.test(p.venc); })) return recusa("Há parcela com forma de pagamento ou data inválida.");
      var pCom = c>0.005 ? todas.filter(function(p){ return FORMAS[p.forma].nf==="com"; }) : [], pSem = s2>0.005 ? todas.filter(function(p){ return FORMAS[p.forma].nf==="sem"; }) : [];
      var aCom = soma(pCom, function(p){ return p.valor; }), aSem = soma(pSem, function(p){ return p.valor; }), avisos = [];
      if(c>0.005 && Math.abs(c-aCom)>0.005) avisos.push("Com NF: alocado "+brl(aCom)+" de "+brl(c));
      if(s2>0.005 && Math.abs(s2-aSem)>0.005) avisos.push("Sem NF: alocado "+brl(aSem)+" de "+brl(s2));
      if(avisos.length && !a.forcar) return recusa("As parcelas não fecham com a divisão do pedido: "+avisos.join(" · ")+". Salvar mesmo assim?", true);
      var num1 = a.numero||"s/nº", parcelas = pCom.concat(pSem).sort(function(x,y){ return x.venc.localeCompare(y.venc); });
      var novoPd = {id:pf.seq.P++, fornId:fid2, numero:num1, data:a.data, total:tot, nfTipo:tipo, comNF:c, semNF:s2, cnpj: c<=0.005 ? "Sem NF" : (a.cnpj||""), nfNum: c<=0.005 ? "" : String(a.nfNum||"").trim(), parcelas:parcelas};
      if(a.descricao) novoPd.descricao = String(a.descricao).trim();
      if(ePrest2){ novoPd.limite = a.limite; novoPd.pixMin = pixMin; }
      var impLim = a.semLimite ? [] : impactoPedido(pf, novoPd);   // limite mensal de fornecedores: estourou o teto do mês ou da categoria = pendente até aprovar
      if(impLim.length){ novoPd.aprov = "pendente"; novoPd.aprovMotivo = motivoImpacto(impLim); }
      pf.pedidos.push(novoPd); invalidar(pf);
      if(!impLim.length) parcelas.forEach(function(p){ if(p.status==="Pago"){ logPagamento(pf, novoPd, p, FORMAS[p.forma], p.conta); if(FORMAS[p.forma].nf==="sem") lancarBaixaAuto(pf, novoPd, p); } });
      if(impLim.length) return ok("PENDENTE de aprovação: "+novoPd.aprovMotivo+". Não conta como lançado até o Marcus aprovar.");
      return ok("Pedido lançado — "+brl(tot)+" e "+parcelas.length+" parcela(s) em "+F(fid2).nome);
    }
    case "pedido_set": {
      var pd1 = ped(a.id); if(!pd1) return recusa("Pedido não encontrado.");
      var q = a.patch||{}; if(q.fornId!==undefined && q.fornId!==pd1.fornId) return recusa("Não dá para trocar o fornecedor de um pedido. Exclua e lance de novo.");
      var t2 = q.total!==undefined ? num(q.total) : pd1.total, c2 = q.comNF!==undefined ? num(q.comNF) : pd1.comNF, s3 = q.semNF!==undefined ? num(q.semNF) : pd1.semNF;
      if(t2<=0) return recusa("Informe o valor total do pedido.");
      if(Math.abs(t2-(c2+s3))>0.005) return recusa('A soma de "com NF" + "sem NF" precisa fechar com o valor total do pedido.');
      if(q.data!==undefined && !DATA_OK.test(q.data)) return recusa("Informe a data do pedido.");
      ["numero","data","cnpj","nfNum","nfTipo","obs","descricao","limite","pixMin"].forEach(function(k){ if(q[k]!==undefined) pd1[k] = q[k]; });
      pd1.total = t2; pd1.comNF = c2; pd1.semNF = s3; return ok("Pedido atualizado");
    }
    case "pedido_aprovar": { var pda = ped(a.id); if(!pda) return recusa("Pedido não encontrado."); if(!temAutorizacao("pf_limite_aprova", s.usuario)) return recusa("Só quem tem a autorização de aprovar o limite pode aprovar."); pda.aprov = "aprovado"; pda.aprovPor = a.por||""; pda.aprovEm = hojeIso(); return ok("Pedido aprovado e lançado — "+brl(pda.total)); }
    case "limite_set": { if(!temAutorizacao("pf_limite_aprova", s.usuario)) return recusa("Só quem tem a autorização de aprovar o limite pode mudar o limite."); var lim = pf.limite = pf.limite || {}, pa = a.patch||{}; if(pa.teto!==undefined) lim.teto = num(pa.teto); if(pa.cat) lim.cat = Object.assign({}, lim.cat||{}, pa.cat); if(pa.classe) lim.classe = Object.assign({}, lim.classe||{}, pa.classe); return ok("Limite salvo"); }
    case "pedido_del": { if(!ped(a.id)) return recusa("Pedido não encontrado."); pf.pedidos = pf.pedidos.filter(function(p){ return p.id!==a.id; }); return ok("Pedido excluído — conta recalculada"); }
    case "parcela_add": {
      var pd2 = ped(a.pedId); if(!pd2) return recusa("Pedido não encontrado.");
      var forma = a.forma, Fm = FORMAS[forma]; if(!Fm) return recusa("Escolha a forma de pagamento.");
      if(formasDoPedido(pd2).indexOf(forma)<0) return recusa("Este pedido não tem parte "+NF_LABEL[Fm.nf].toLowerCase()+".");
      var vv = num(a.valor); if(!(vv>0)) return recusa("Informe o valor da parcela.");
      if(!a.venc || !DATA_OK.test(a.venc)) return recusa("Informe o vencimento.");
      var qtd = forma==="cartao" ? (parseInt(a.qtd)||1) : 1, sp = saldoParcela(pf, a.pedId, forma, vv, qtd);
      if(sp.val-(sp.alvo-sp.usado)>0.005 && !a.forcar) return recusa("O valor ultrapassa a parte "+NF_LABEL[Fm.nf].toLowerCase()+" deste pedido (saldo de "+brl(sp.alvo-sp.usado)+"). Lançar mesmo assim?", true);
      var st = a.status||"Pendente", novas = [];
      for(var i=0; i<qtd; i++){
        var ct = (a.conta||"—")+(qtd>1 ? " · "+(i+1)+"/"+qtd : ""), np = {forma:forma, venc:addMeses(a.venc, i), valor:vv, conta:ct, status:st};
        pd2.parcelas.push(np); novas.push(np);
      }
      invalidar(pf);
      novas.forEach(function(np){ if(st==="Pago"){ logPagamento(pf, pd2, np, Fm, np.conta); if(Fm.nf==="sem") lancarBaixaAuto(pf, pd2, np); } });
      return ok(qtd>1 ? qtd+" parcelas lançadas" : "Parcela lançada");
    }
    case "parcela_set": {
      var pd3 = ped(a.pedId), pc = pd3 && pd3.parcelas[a.idx]; if(!pc) return recusa("Parcela não encontrada.");
      var pt = a.patch||{};
      if(pt.forma!==undefined && !FORMAS[pt.forma]) return recusa("Forma de pagamento inválida.");
      if(pt.valor!==undefined && !(num(pt.valor)>0)) return recusa("Informe o valor da parcela.");
      if(pt.venc!==undefined && !DATA_OK.test(pt.venc)) return recusa("Informe o vencimento.");
      ["forma","venc","conta"].forEach(function(k){ if(pt[k]!==undefined) pc[k] = pt[k]; });
      if(pt.valor!==undefined) pc.valor = num(pt.valor);
      return ok("Parcela atualizada");
    }
    case "parcela_del": {
      var pd4 = ped(a.pedId); if(!pd4 || !pd4.parcelas[a.idx]) return recusa("Parcela não encontrada.");
      pd4.parcelas.splice(a.idx, 1); return ok("Parcela excluída");
    }
    case "parcela_baixa": {   // togglePago: 'Dar baixa' / 'Estornar'. Sem NF vira lançamento automático; com NF é só registro
      var pd5 = ped(a.pedId), pc5 = pd5 && pd5.parcelas[a.idx]; if(!pc5) return recusa("Parcela não encontrada.");
      var F5 = FORMAS[pc5.forma];
      if(F5.nf==="com") return recusa("Parcela com NF é apenas registro — não tem controle de baixa");
      if(pc5.status==="Pago"){
        if(!estornarBaixaAuto(pf, pd5, pc5)) return recusa("Esta parcela foi paga por Pix lançado. Estorne o Pix na tela de Lançamento de pagamentos.");
        return ok("Parcela estornada — "+brl(pc5.valor)+" devolvido ao saldo");
      }
      if(!lancarBaixaAuto(pf, pd5, pc5)) return recusa("Não achei a data de pagamento desta parcela.");
      logPagamento(pf, pd5, pc5, F5, pc5.conta||"—");
      return ok("Baixa lançada — "+brl(pc5.valor)+" em "+((F(pd5.fornId)||{}).nome||""));
    }

    // ---- datas limite do mês (salvarAcerto / acertoVoltarPadrao)
    case "acerto_set": {
      var bl = (a.blocos||[]).filter(function(b){ return b.fim && b.limite; }).map(function(b){ return {fim:b.fim, limite:b.limite}; }).sort(function(x,y){ return x.fim.localeCompare(y.fim); });
      if(!bl.length) return recusa("Defina ao menos uma data limite.");
      if(!F(a.fornId) || !a.mes) return recusa("Escolha o fornecedor e o mês.");
      if(bl.some(function(b){ return b.fim.slice(0,7)!==a.mes; }) && !a.forcar) return recusa("Há data(s) de fechamento fora de "+mesLabel(a.mes+"-01")+". Salvar assim mesmo?", true);
      pf.acertos[a.fornId+"|"+a.mes] = bl;
      return ok(bl.length===1 ? "Data limite definida — pagamento único no mês" : bl.length+" datas limite definidas para o mês");
    }
    case "acerto_reset": { delete pf.acertos[a.fornId+"|"+a.mes]; return ok("Mês voltou ao ciclo do cadastro — "+cicloLabel(F(a.fornId))); }

    // ---- maquininha (salvarPassada / excluirPassada / salvarFechamento / limparFechamento / salvarDist / voltarAuto / salvarBaixa / estornarBaixa / setMqForn)
    case "mq_passada_add": case "mq_passada_set": {
      var edit = a.op==="mq_passada_set", atual = edit ? pf.mqPassadas.find(function(x){ return x.id===a.id; }) : null;
      if(edit && !atual) return recusa("Passada não encontrada.");
      var src = Object.assign({}, atual||{}, edit ? (a.patch||{}) : a);
      var dados = {data:src.data, rev:String(src.rev||"").trim(), valor:num(src.valor), band:src.band||"MASTERCARD", parc:src.parc||"1x", maq:src.maq||MQ_MAQUINAS[0]};
      if(!dados.data || !DATA_OK.test(dados.data)) return recusa("Informe a data.");
      if(!dados.rev) return recusa("Informe o nome da revendedora.");
      if(!(dados.valor>0)) return recusa("Informe o valor passado.");
      var mes = dados.data.slice(0,7), antes = mqSomaPassadas(pf, mes);
      if(edit) Object.assign(atual, dados); else pf.mqPassadas.push(Object.assign({id:pf.seq.mqP++}, dados));
      mqSincronizarBruto(pf, mes, antes);
      return ok(edit ? "Passada atualizada" : "Passada lançada — "+brl(dados.valor)+" · "+dados.rev);
    }
    case "mq_passada_del": {
      var pp = pf.mqPassadas.find(function(x){ return x.id===a.id; }); if(!pp) return recusa("Passada não encontrada.");
      var m3 = pp.data.slice(0,7), an = mqSomaPassadas(pf, m3);
      pf.mqPassadas = pf.mqPassadas.filter(function(x){ return x.id!==a.id; }); mqSincronizarBruto(pf, m3, an);
      return ok("Passada excluída");
    }
    case "mq_fech_set": {
      var b2 = num(a.bruto), l3 = parseFloat(a.liquido), n2 = parseInt(a.parcelas);
      if(!a.mes) return recusa("Escolha o mês.");
      if(!l3 || l3<=0) return recusa("Informe o valor líquido informado pelo fornecedor.");
      if(!n2 || n2<1) return recusa("Informe a média de parcelamento (Nx).");
      if(l3-b2>0.005 && !a.forcar) return recusa("O líquido é maior que o valor total passado. Salvar mesmo assim?", true);
      pf.mqFech[a.mes] = {bruto:b2, liquido:l3, parcelas:n2};
      return ok("Retorno salvo — "+brl(l3)+" em "+n2+"x de "+brl(l3/n2));
    }
    case "mq_fech_del": { if(!pf.mqFech[a.mes]) return recusa("Não há retorno nesse mês."); delete pf.mqFech[a.mes]; return ok("Retorno apagado"); }
    case "mq_baixa_add": {
      var vb = parseFloat(a.valor); if(!vb || vb<=0) return recusa("Informe o valor.");
      if(!a.data) return recusa("Informe a data."); if(!a.mes) return recusa("Escolha o mês.");
      var falta = Math.max(0, mqSobra(pf, a.mes));
      if(vb-falta>0.005 && !a.forcar) return recusa("O valor ultrapassa a sobra deste mês ("+brl(falta)+"). Lançar mesmo assim?", true);
      pf.mqBaixas.push({id:pf.seq.mqB++, mes:a.mes, data:a.data, valor:vb, forma:a.forma||"Desconto em conta", conta:String(a.conta||"").trim()||"—", arqNome:a.arqNome||"", arqData:a.arqData||""});
      return ok("Pagamento lançado — "+brl(vb)+(a.arqNome ? " · comprovante anexado" : ""));
    }
    case "mq_baixa_del": { var bx = pf.mqBaixas.find(function(x){ return x.id===a.id; }); if(!bx) return recusa("Lançamento não encontrado.");
      pf.mqBaixas = pf.mqBaixas.filter(function(x){ return x.id!==a.id; }); return ok("Lançamento estornado"); }
    case "mq_dist_set": {
      if(!a.mes) return recusa("Escolha o mês.");
      var ls = (a.linhas||[]).map(function(d){ return {chave:d.chave, valor:num(d.valor)}; }).filter(function(d){ return d.chave && d.valor>0.005; });
      var disp = mqDisponivel(pf, a.mes), tt = soma(ls, function(d){ return d.valor; });
      if(tt-disp>0.005 && !a.forcar) return recusa("A distribuição ("+brl(tt)+") passa do saldo do mês ("+brl(disp)+"). Salvar mesmo assim?", true);
      var juntas = {}; ls.forEach(function(d){ juntas[d.chave] = (juntas[d.chave]||0)+d.valor; });
      pf.mqDist[a.mes] = Object.keys(juntas).map(function(k){ return {chave:k, valor:juntas[k]}; });
      return ok("Desconto distribuído — "+brl(tt)+" em "+pf.mqDist[a.mes].length+" dezena(s)");
    }
    case "mq_dist_reset": { delete pf.mqDist[a.mes]; return ok("Desconto voltou ao automático"); }
    case "mq_forn_set": {
      var novoId = parseInt(a.id); if(!novoId || novoId===pf.mqFornId) return {patch:{}, msg:""};
      if(!F(novoId)) return recusa("Fornecedor não encontrado.");
      if(Object.keys(pf.mqDist).length && !a.forcar) return recusa("Trocar a conta apaga as distribuições personalizadas, que apontam para as dezenas da conta atual. Continuar?", true);
      pf.mqFornId = novoId; pf.mqDist = {};
      return ok("Desconto passa a abater na conta "+F(novoId).nome);
    }

    // ---- Point (ptSetIni / ptSetBoleto / ptSetAcerto / ptAddItem / ptSetItem / ptDelItem / ptNovoMes)
    case "pt_ini_set": { pf.ptSaldoIni = r2(a.valor); return ok("Saldo de abertura salvo"); }
    case "pt_boleto_set": { if(!a.mes) return recusa("Escolha o mês."); pf.ptBoleto[a.mes] = r2(a.valor); return ok("Boleto do mês salvo"); }
    case "pt_toggle": { pf.ptAberto[a.id] = !pf.ptAberto[a.id]; return ok(""); }
    case "pt_acerto_set": {   // campo: valor | venc | status
      var pdp = ped(a.id); if(!pdp || pdp.fornId!==PT_FORN) return recusa("Mês da Point não encontrado.");
      if(!pdp.parcelas.length) ptSync(pdp);
      var pa = pdp.parcelas[0];
      if(a.campo==="valor") pa.valor = r2(a.valor);
      else if(a.campo==="venc"){ if(!DATA_OK.test(a.valor||"")) return recusa("Informe a data."); pa.venc = a.valor; }
      else if(a.campo==="status"){
        ptSync(pdp); invalidar(pf);
        if(a.valor==="Pago" && pa.status!=="Pago"){ if(!lancarBaixaAuto(pf, pdp, pa)) return recusa("Não achei a data de pagamento desta parcela."); }
        else if(a.valor!=="Pago" && pa.status==="Pago"){ if(!estornarBaixaAuto(pf, pdp, pa)) return recusa("Este Pix foi pago por lançamento. Estorne o lançamento na tela de Lançamento de pagamentos."); }
      } else return recusa("Campo inválido.");
      ptSync(pdp);
      return ok(a.campo==="valor" ? "Pix de "+mesLabel(pdp.data)+" definido em "+brl(pa.valor) : "Salvo");
    }
    case "pt_item_add": { var pdi = ped(a.id); if(!pdi) return recusa("Mês da Point não encontrado."); pdi.itens = pdi.itens||[];
      pdi.itens.push({cod:a.cod||"", data:a.data||pdi.data.slice(0,7)+"-01", valor:r2(a.valor)}); pf.ptAberto[a.id] = true; ptSync(pdi); return ok("Pedido adicionado"); }
    case "pt_item_set": { var pds = ped(a.id); if(!pds || !pds.itens || !pds.itens[a.i]) return recusa("Pedido não encontrado.");
      pds.itens[a.i][a.campo] = (a.campo==="valor") ? r2(a.valor) : a.valor; ptSync(pds); return ok("Salvo"); }
    case "pt_item_del": { var pdd = ped(a.id); if(!pdd || !pdd.itens || !pdd.itens[a.i]) return recusa("Pedido não encontrado.");
      var cod = pdd.itens[a.i].cod||"sem código"; pdd.itens.splice(a.i, 1); ptSync(pdd); return ok("Pedido "+cod+" removido"); }
    case "pt_mes_novo": {
      var ms = ptMeses(pf), prox;
      if(ms.length){ var u = ms[ms.length-1].data.slice(0,7).split("-").map(Number); prox = isoLocal(new Date(u[0], u[1], 1)).slice(0,7); } else prox = mesAtual();
      if(ms.some(function(p){ return p.data.slice(0,7)===prox; })) return recusa("O mês "+mesLabel(prox+"-01")+" já existe");
      var nv = {id:++pf.seq.P, fornId:PT_FORN, numero:"Point "+mesLabel(prox+"-01"), data:prox+"-01", total:0, nfTipo:"sem", comNF:0, semNF:0, cnpj:(F(PT_FORN)||{}).cnpj||"", nfNum:"", obs:"", itens:[],
        parcelas:[{forma:"pix_revendedora", venc:prox+"-28", valor:0, conta:"Pix revendedora", status:"Pendente"}]};
      pf.pedidos.push(nv); ptSync(nv); pf.ptAberto[nv.id] = true;
      return ok("Mês "+mesLabel(prox+"-01")+" criado");
    }
  }
  return recusa("Ação desconhecida: "+a.op);
}

export {
  TEM_ATU_PF,
  FORMAS, NF_LABEL, MESES, PERIODICIDADES, F_TIPO, F_PER, F_SIT, FILTRO_PADRAO, LIMIAR_MES, LIMIAR_JANELA, DIAS_ALERTA_PROXIMO, MQ_MAQUINAS, PT_FORN, FORN_CATS, PREST_CATS, VINCULOS, ehPrestador, pfMigrar, pendentesPrestadores, CAMPOS_BUSCA,
  brl, nbr, dbr, dias, prazoTxt, ultDia, diaISO, addDias, addMeses, mesLabel, mesCurto, mesAtual, mesMais, hojeIso, semanaAtual, invalidar,
  pfVazio, pfInicial, pfDeDados, forn, eSem, cicloDe, cicloLabel, cicloCor, blocosDoMes, temOverride, distribuir, chipClasse,
  calcJanelasDoForn, janelasDoForn, lancDaJanela, pagoPix, pagoJanela, janelaPorChave, sincronizarJanela, sincronizarForn, sincronizarTudo, semearLancamentos, statusJanela,
  contaForn, chipDesc, statusConta, mesesComLanc, resumoMes, mqRefTxt, cartoesLancamento, normBusca, buscaValor, buscaTxt, filtrarLancamentos, lancExcedente, tokenAcerto,
  coletar, agregar, alertasDe, resumoAlertas, painelTotais, viewTempo, tabelaJanelas, viewMatriz, resumoNegociacao, parcelaSituacao, pedidosSemParcela, relacaoPorMes, pedidoDetalhe,
  dividirNF, gerarParcelas, expandirParcelas, saldoParcela, formasDoPedido, acertoPreset, acertoPresetAtivo, acertoResumo, cortesDoPreset, previewCiclo, limpaCortes,
  mqPassadasDoMes, mqSomaPassadas, mqBruto, mqParcela, mqMesesDesconto, mqDescontoNoMes, mqOrigensDoMes, mqBaixasDoMes, mqBaixado, mqLinhas, mqColunas, mqMesesSel, semearBaixasMq,
  mqEhAuto, mqDisponivel, mqJanelasDoMes, mqOrdinal, mqManualNaJanela, mqDistribuicao, excedenteJanela, mqDistribuido, mqSobra, mqMesesComSaldo, mqMapaAplicado, mqAplicado, mqCandidatas,
  mqSincronizarBruto, mqPreviewFech, mqPreviewDist,
  ptMeses, ptPed, ptSomaItens, ptSync, ptDados, pfReduz
};

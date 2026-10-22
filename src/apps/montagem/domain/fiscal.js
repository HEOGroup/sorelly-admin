import { globLocal } from "@/lib/glob-local";
// Sorelly Admin · montagem — domain/fiscal.js
// Fiscal (Financeiro), trazido do SorellyAdmin (docs/modulos/fiscal.md; calc.ts e usecases/fiscal). SÓ A LÓGICA: telas vêm depois.
// Controle dos CNPJs do grupo no Simples Nacional, por CNPJ e por ano: ILF (lastro ÷ venda), consumo do sublimite anual e se o que ainda cabe cobre as contas dos meses restantes.
// Estado s.fx (só neste navegador). Nasce VAZIO (repositório é público). Dados reais, se existirem, vêm só de domain/fiscal.local.js (gitignored):
//   export default {config?:{}, empresas:[{id,nome,razao,cnpj,cnpjId}], notas:[{empresaId,data,nf,fornecedor,cfop,uf,valor,classificacao}], saidas:[{empresaId,yearMonth,periodo,venda,brindes,trocas}], contas:[{empresaId,yearMonth,total}]}
// Formato de s.fx:
//   {v:1, seq, config:{sublimiteAnual, metaIlf, criticoIlf, minimoAtivo, riscoPct, usoLimitePct},
//    empresas:[{id, nome, razao, cnpj, cnpjId}], notas:[{id, empresaId, data, nf, fornecedor, cfop, uf, valor, classificacao, por, em}],
//    saidas:[{empresaId, yearMonth, periodo(0|1|2), venda, brindes, trocas, por, em}], contas:[{empresaId, yearMonth, total, por, em}], log:[{em, por, texto}]}
// Convergência com a tela "Limite de faturamento" (s.fiscal, domain/cnpjs.js): empresa.cnpjId = id do cadastro de CNPJs ("34","46","59","67","ho").
//   fiscalUnido(s, cnpjId) devolve o mesmo formato de fiscalAtual() ({data, fatAnual, brindesMes, entradaMes, entradaAnual}), vindo do s.fx quando há venda lançada
//   e senão do lançamento manual antigo (s.fiscal.hist). Contas a pagar por CNPJ: valor do s.fx vale; sem ele, lê s.contasCnpj (mesma fonte da tela Contas a pagar). Nada é lançado em dobro.
// Dinheiro em reais (números); ILF e metas como razão (0,30 = 30%). Datas ISO no fuso America/Sao_Paulo.

var LOCAL = (function(){ try { var m = globLocal("apps/montagem/domain/fiscal.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var p2 = function(n){ return String(n).padStart(2,"0"); };
var num = function(v){ var n = Number(typeof v==="string" ? v.replace(",", ".") : v); return isFinite(n) ? n : 0; };
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
var trim = function(v){ return String(v==null ? "" : v).trim(); };
var ehDia = function(v){ return /^\d{4}-\d{2}-\d{2}$/.test(String(v||"")); };
var ehYM = function(v){ return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(v||"")); };
var MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
var MES_CURTO = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
var CLASSIFICACOES = ["LASTRO", "NAO_LASTRO", "OPERACIONAL"];
var ROTULO_CLASSIFICACAO = {LASTRO:"LASTRO", NAO_LASTRO:"NÃO LASTRO", OPERACIONAL:"OPERACIONAL"};
var ROTULO_PERIODO = ["Dia 1–10", "Dia 11–20", "Dia 21–31"];

function hojeSP(){ try { var o = {}; new Intl.DateTimeFormat("en-CA", {timeZone:"America/Sao_Paulo", year:"numeric", month:"2-digit", day:"2-digit"}).formatToParts(new Date()).forEach(function(p){ o[p.type] = p.value; }); return o.year+"-"+o.month+"-"+o.day; } catch(e){ var d = new Date(); return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate()); } }
function agoraSP(){ return hojeSP()+"T"+(function(){ try { return new Intl.DateTimeFormat("pt-BR", {timeZone:"America/Sao_Paulo", hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false}).format(new Date()); } catch(e){ return "00:00:00"; } })(); }
function formatarReais(v){ return "R$ "+Number(v||0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); }
function formatarPct(r, casas){ return (Number(r||0)*100).toLocaleString("pt-BR", {minimumFractionDigits:casas==null ? 1 : casas, maximumFractionDigits:casas==null ? 1 : casas})+"%"; }
function yearMonth(ano, mes1){ return ano+"-"+p2(mes1); }
// período de 10 dias de um dia ISO: 0 = 1–10, 1 = 11–20, 2 = 21–31
function periodoDoDia(dia){ var d = Number(String(dia).slice(8,10)); return d<=10 ? 0 : d<=20 ? 1 : 2; }

// ---------- configuração ----------
var CONFIG_PADRAO = {sublimiteAnual:3600000, metaIlf:0.30, criticoIlf:0.15,
  minimoAtivo:1000,      // CNPJ com venda no ano abaixo disso = "sem movimento" (não dispara aviso)
  riscoPct:0.9,          // projeção acima de 90% do sublimite = ATENÇÃO
  usoLimitePct:0.85};    // contas futuras ≥ 85% do que ainda cabe = NO LIMITE

function fxDemo(){
  var s = {v:1, seq:0, config:clone(CONFIG_PADRAO), empresas:[], notas:[], saidas:[], contas:[], log:[]};
  if(LOCAL){
    if(LOCAL.config) Object.assign(s.config, LOCAL.config);
    (LOCAL.empresas||[]).forEach(function(d){ var o = clone(d); if(o.id==null) o.id = "e"+(++s.seq); o.cnpjId = o.cnpjId||""; s.empresas.push(o); });
    (LOCAL.notas||[]).forEach(function(d){ var o = clone(d); o.id = "n"+(++s.seq); s.notas.push(o); });
    (LOCAL.saidas||[]).forEach(function(d){ s.saidas.push(clone(d)); });
    (LOCAL.contas||[]).forEach(function(d){ s.contas.push(clone(d)); });
  }
  return s;
}
// completa campos novos de um estado salvo
function fxMigrar(fx){
  if(!fx) return fxDemo(); var base = fxDemo();
  Object.keys(base).forEach(function(k){ if(fx[k]===undefined) fx[k] = base[k]; });
  Object.keys(CONFIG_PADRAO).forEach(function(k){ if(fx.config[k]===undefined) fx.config[k] = CONFIG_PADRAO[k]; });
  fx.v = 1; return fx;
}

// ---------- regras puras ----------
// classificação do ILF: ≥ meta OK · ≥ crítico ATENÇÃO · abaixo CRÍTICO · sem venda "—"
function ilfClass(ilf, temReceita, meta, critico){
  if(!temReceita) return {cls:"grey", txt:"—"};
  if(ilf>=meta) return {cls:"ok", txt:"OK"};
  if(ilf>=critico) return {cls:"amber", txt:"ATENÇÃO"};
  return {cls:"red", txt:"CRÍTICO"};
}
// um mês de um CNPJ: notas do mês e os 3 períodos de saída (null se não lançado)
function mesCalc(notas, periodos, config){
  var entradas = r2(notas.reduce(function(t,n){ return t+n.valor; }, 0));
  var lastro = r2(notas.filter(function(n){ return n.classificacao==="LASTRO"; }).reduce(function(t,n){ return t+n.valor; }, 0));
  var soma = function(k){ return r2(periodos.reduce(function(t,p){ return t+(p ? p[k] : 0); }, 0)); };
  var venda = soma("venda"), brindes = soma("brindes"), trocas = soma("trocas");
  var ilf = venda>0 ? lastro/venda : 0;
  return {entradas:entradas, lastro:lastro, naoLastro:r2(entradas-lastro), venda:venda, brindes:brindes, trocas:trocas, saidas:r2(venda+brindes+trocas),
    ilf:ilf, gap: venda>0 ? r2(Math.max(0, venda*config.metaIlf-lastro)) : 0, st:ilfClass(ilf, venda>0, config.metaIlf, config.criticoIlf), notas:notas, periodos:periodos};
}
// os 12 meses (JAN→DEZ) de um CNPJ no ano
function mesesDoAno(fx, empresaId, ano){
  var notas = fx.notas.filter(function(n){ return n.empresaId===empresaId; }), saidas = fx.saidas.filter(function(x){ return x.empresaId===empresaId; });
  return [0,1,2,3,4,5,6,7,8,9,10,11].map(function(i){
    var ym = yearMonth(ano, i+1);
    var nm = notas.filter(function(n){ return String(n.data).slice(0,7)===ym; });
    var ps = [0,1,2].map(function(p){ return saidas.filter(function(x){ return x.yearMonth===ym && x.periodo===p; })[0] || null; });
    return mesCalc(nm, ps, fx.config);
  });
}
// último mês (1–12) com venda > 0 em QUALQUER CNPJ no ano (mínimo 1); vale para todos
function mesesDecorridos(fx, ano){
  var ult = 0;
  fx.saidas.forEach(function(x){ if(String(x.yearMonth).slice(0,4)===String(ano) && x.venda>0) ult = Math.max(ult, Number(String(x.yearMonth).slice(5,7))); });
  return Math.max(1, ult);
}
// todos os cálculos de um CNPJ no ano. dec = meses decorridos. contaFallback(empresa, ym) → valor ou undefined (lê s.contasCnpj)
function empCalc(fx, empresa, ano, dec, contaFallback){
  var cfg = fx.config, mc = mesesDoAno(fx, empresa.id, ano);
  var acum = r2(mc.reduce(function(t,x){ return t+x.venda; }, 0)), lastro = r2(mc.reduce(function(t,x){ return t+x.lastro; }, 0)), brindes = r2(mc.reduce(function(t,x){ return t+x.brindes; }, 0));
  var ilfAno = acum>0 ? lastro/acum : 0, gapAno = r2(Math.max(0, acum*cfg.metaIlf-lastro));
  var restante = r2(cfg.sublimiteAnual-acum), mesesRest = Math.max(1, 12-dec), mediaAtual = acum/dec, maxMes = restante/mesesRest, projecao = mediaAtual*12;
  var sub;
  if(acum>=cfg.sublimiteAnual) sub = {cls:"red", txt:"ESTOUROU"};
  else if(projecao>cfg.sublimiteAnual) sub = {cls:"red", txt:"CRÍTICO"};
  else if(projecao>cfg.sublimiteAnual*cfg.riscoPct) sub = {cls:"amber", txt:"ATENÇÃO"};
  else sub = {cls:"ok", txt:"OK"};
  var contasMes = [0,1,2,3,4,5,6,7,8,9,10,11].map(function(i){
    var ym = yearMonth(ano, i+1), c = fx.contas.filter(function(x){ return x.empresaId===empresa.id && x.yearMonth===ym; })[0];
    if(c) return c.total; var f = contaFallback ? contaFallback(empresa, ym) : undefined; return f==null ? 0 : f;
  });
  var contas = r2(contasMes.reduce(function(t,v){ return t+v; }, 0)), contasDec = r2(contasMes.slice(0, dec).reduce(function(t,v){ return t+v; }, 0)), contasFut = r2(contas-contasDec);
  var sobra = r2(acum-contasDec), cobertura = contasDec>0 ? acum/contasDec : 0;
  var folgaFiscal = r2(restante-contasFut), usoNecessario = restante>0 ? contasFut/restante : (contasFut>0 ? Infinity : 0);
  var capSt;
  if(contasFut<=0) capSt = {cls:"grey", txt:"—"};
  else if(folgaFiscal<0) capSt = {cls:"red", txt:"CONFLITO"};
  else if(usoNecessario>=cfg.usoLimitePct) capSt = {cls:"amber", txt:"NO LIMITE"};
  else capSt = {cls:"ok", txt:"CABE"};
  return {mc:mc, acum:acum, lastro:lastro, brindes:brindes, ilfAno:ilfAno, gapAno:gapAno, restante:restante, mesesRest:mesesRest, dec:dec, mediaAtual:mediaAtual, maxMes:maxMes, projecao:projecao, sub:sub,
    contasMes:contasMes, contas:contas, contasDec:contasDec, contasFut:contasFut, sobra:sobra, cobertura:cobertura, folgaFiscal:folgaFiscal, usoNecessario:usoNecessario, capSt:capSt,
    ilfSt:ilfClass(ilfAno, acum>0, cfg.metaIlf, cfg.criticoIlf)};
}
var temCnpj = function(emp){ return !!(trim(emp.cnpj) || trim(emp.cnpjId)); };

// ---------- leitura para as telas (recebem o estado inteiro s) ----------
function anoPadrao(s){ var fx = s.fx; var anos = {}; fx.saidas.forEach(function(x){ anos[String(x.yearMonth).slice(0,4)] = 1; }); fx.notas.forEach(function(n){ anos[String(n.data).slice(0,4)] = 1; });
  var hoje = hojeSP().slice(0,4); return anos[hoje] || !Object.keys(anos).length ? Number(hoje) : Number(Object.keys(anos).sort().pop()); }
// anos que têm lançamento (mais o atual), do mais novo ao mais antigo
function anosDisponiveis(s){ var fx = s.fx, a = {}; a[hojeSP().slice(0,4)] = 1; fx.saidas.forEach(function(x){ a[String(x.yearMonth).slice(0,4)] = 1; }); fx.notas.forEach(function(n){ a[String(n.data).slice(0,4)] = 1; }); fx.contas.forEach(function(c){ a[String(c.yearMonth).slice(0,4)] = 1; });
  return Object.keys(a).filter(Boolean).sort().reverse().map(Number); }
// contas a pagar da tela antiga (s.contasCnpj[ano][cnpjId][mes 0-11]) como fonte de reserva
function fallbackContas(s){ return function(emp, ym){ var id = emp.cnpjId; if(!id) return undefined; var an = (s.contasCnpj||{})[ym.slice(0,4)]; var v = an && an[id] ? an[id][Number(ym.slice(5,7))-1] : undefined; return v; }; }

// visão geral por CNPJ e consolidado do grupo
function fxVisaoGeral(s, ano){
  var fx = s.fx; ano = ano||anoPadrao(s); var dec = mesesDecorridos(fx, ano), fb = fallbackContas(s);
  var lista = fx.empresas.map(function(emp){ var k = empCalc(fx, emp, ano, dec, fb); return {empresa:emp, k:k, comCnpj:temCnpj(emp), ativo:k.acum>=fx.config.minimoAtivo}; });
  var tot = {venda:0, brindes:0, lastro:0, trocas:0, saidas:0, entradas:0, contas:0, contasDec:0, contasFut:0, restante:0};
  lista.forEach(function(x){ var k = x.k; tot.venda += k.acum; tot.brindes += k.brindes; tot.lastro += k.lastro; tot.trocas += k.mc.reduce(function(t,m){ return t+m.trocas; }, 0); tot.saidas += k.mc.reduce(function(t,m){ return t+m.saidas; }, 0);
    tot.entradas += k.mc.reduce(function(t,m){ return t+m.entradas; }, 0); tot.contas += k.contas; tot.contasDec += k.contasDec; tot.contasFut += k.contasFut; tot.restante += Math.max(0, k.restante); });
  Object.keys(tot).forEach(function(k){ tot[k] = r2(tot[k]); });
  var consolidado = Object.assign({}, tot, {ilf: tot.venda>0 ? tot.lastro/tot.venda : 0, gapLastro:r2(Math.max(0, tot.venda*fx.config.metaIlf-tot.lastro)), sobra:r2(tot.venda-tot.contasDec),
    cobertura: tot.contasDec>0 ? tot.venda/tot.contasDec : 0, folga:r2(tot.restante-tot.contasFut), ilfSt:ilfClass(tot.venda>0 ? tot.lastro/tot.venda : 0, tot.venda>0, fx.config.metaIlf, fx.config.criticoIlf),
    vendaPorMes:[0,1,2,3,4,5,6,7,8,9,10,11].map(function(i){ return r2(lista.reduce(function(t,x){ return t+x.k.mc[i].venda; }, 0)); })});
  var com = lista.filter(function(x){ return x.comCnpj; });
  var avisos = fxAvisos(lista, consolidado);
  return {ano:ano, dec:dec, config:fx.config, porEmpresa:lista, consolidado:consolidado, comCnpj:com, semCnpj:lista.filter(function(x){ return !x.comCnpj; }),
    ativos:com.filter(function(x){ return x.ativo; }), semMovimento:com.filter(function(x){ return !x.ativo; }), avisos:avisos};
}
// avisos de risco (CNPJ com CNPJ, venda ≥ mínimo e sublimite vermelho) e de conflito de contas (status vermelho); empresa sem CNPJ nunca dispara
function fxAvisos(lista, consolidado){
  var com = lista.filter(function(x){ return x.comCnpj; });
  var risco = com.filter(function(x){ return x.ativo && x.k.sub.cls==="red"; }).map(function(x){ return {empresaId:x.empresa.id, nome:x.empresa.nome, status:x.k.sub.txt, projecao:x.k.projecao, restante:x.k.restante,
    texto:x.empresa.nome+": sublimite em risco ("+x.k.sub.txt+"), projeção de "+formatarReais(x.k.projecao)+" no ano."}; });
  var conflito = com.filter(function(x){ return x.k.capSt.cls==="red"; }).map(function(x){ return {empresaId:x.empresa.id, nome:x.empresa.nome, excede:Math.abs(x.k.folgaFiscal),
    texto:x.empresa.nome+": as contas futuras excedem o que ainda cabe no sublimite em "+formatarReais(Math.abs(x.k.folgaFiscal))+"."}; });
  var grupoCobre = consolidado.contasFut>0 && consolidado.folga>=0;
  return {risco:risco, conflito:conflito, grupoCobre:grupoCobre, textoGrupo: conflito.length && grupoCobre ? "O grupo tem capacidade total suficiente ("+formatarReais(consolidado.folga)+" de folga): redirecione parte do faturamento para outro CNPJ." : ""};
}
// "Ainda cabe" por CNPJ: quanto falta para o sublimite, máximo por mês, projeção e cobertura das contas
function fxAindaCabe(s, ano){
  var vg = fxVisaoGeral(s, ano);
  return vg.comCnpj.map(function(x){ var k = x.k;
    var msg = k.contasFut<=0 ? "Sem contas futuras lançadas." : k.folgaFiscal<0 ? "Contas futuras de "+formatarReais(k.contasFut)+" excedem a capacidade em "+formatarReais(Math.abs(k.folgaFiscal))+"." : "Contas futuras de "+formatarReais(k.contasFut)+" consomem "+formatarPct(Math.min(k.usoNecessario, 9.99), 0)+" da capacidade restante.";
    return {empresaId:x.empresa.id, nome:x.empresa.nome, ativo:x.ativo, sublimite:vg.config.sublimiteAnual, vendaAno:k.acum, restante:k.restante, maxPorMes:k.maxMes, mesesRestantes:k.mesesRest, mediaMes:k.mediaAtual, projecao:k.projecao, sub:k.sub, contasFuturas:k.contasFut, folga:k.folgaFiscal, uso:k.usoNecessario, capSt:k.capSt, ilf:k.ilfAno, ilfSt:k.ilfSt, mensagem:msg}; });
}
// dashboard anual: ILF mês a mês por CNPJ + totais do ano + linha do grupo
function fxDashboardAnual(s, ano){
  var vg = fxVisaoGeral(s, ano), cfg = s.fx.config;
  var porEmpresa = vg.porEmpresa.map(function(x){ var k = x.k; return {empresaId:x.empresa.id, nome:x.empresa.nome, comCnpj:x.comCnpj, ativo:x.ativo,
    meses:k.mc.map(function(m, i){ return {mes:i+1, rotulo:MES_CURTO[i], venda:m.venda, lastro:m.lastro, entradas:m.entradas, brindes:m.brindes, trocas:m.trocas, ilf:m.venda>0 ? m.ilf : 0, gap:m.gap, st:m.st}; }),
    totais:{venda:k.acum, lastro:k.lastro, brindes:k.brindes, ilf:k.ilfAno, ilfSt:k.ilfSt, gap:k.gapAno, sub:k.sub, pctSublimite:cfg.sublimiteAnual>0 ? k.acum/cfg.sublimiteAnual : 0}}; });
  var grupo = [0,1,2,3,4,5,6,7,8,9,10,11].map(function(i){ var venda = r2(vg.porEmpresa.reduce(function(t,x){ return t+x.k.mc[i].venda; }, 0)), lastro = r2(vg.porEmpresa.reduce(function(t,x){ return t+x.k.mc[i].lastro; }, 0)); var ilf = venda>0 ? lastro/venda : 0;
    return {mes:i+1, rotulo:MES_CURTO[i], venda:venda, lastro:lastro, ilf:ilf, st:ilfClass(ilf, venda>0, cfg.metaIlf, cfg.criticoIlf)}; });
  return {ano:vg.ano, dec:vg.dec, meta:cfg.metaIlf, critico:cfg.criticoIlf, porEmpresa:porEmpresa, grupo:grupo, totaisGrupo:{venda:vg.consolidado.venda, lastro:vg.consolidado.lastro, ilf:vg.consolidado.ilf, ilfSt:vg.consolidado.ilfSt}};
}
// entradas (notas) de um CNPJ, mais novas primeiro, com filtro opcional por ano
function fxNotasDe(s, empresaId, ano){ return s.fx.notas.filter(function(n){ return n.empresaId===empresaId && (!ano || String(n.data).slice(0,4)===String(ano)); }).sort(function(a,b){ return a.data<b.data ? 1 : a.data>b.data ? -1 : 0; }); }
// saídas de um CNPJ num mês: os 3 períodos (null se vazio) e os totais
function fxSaidasDoMes(s, empresaId, ym){
  var ps = [0,1,2].map(function(p){ return s.fx.saidas.filter(function(x){ return x.empresaId===empresaId && x.yearMonth===ym && x.periodo===p; })[0] || null; });
  var t = function(k){ return r2(ps.reduce(function(a,p){ return a+(p ? p[k] : 0); }, 0)); };
  return {periodos:ps, venda:t("venda"), brindes:t("brindes"), trocas:t("trocas"), total:r2(t("venda")+t("brindes")+t("trocas"))};
}
// grade de contas a pagar: empresa × 12 meses (valor do s.fx; sem ele, o da tela Contas a pagar por CNPJ)
function fxGradeContas(s, ano){
  var fb = fallbackContas(s); ano = ano||anoPadrao(s);
  return s.fx.empresas.map(function(emp){ var meses = [0,1,2,3,4,5,6,7,8,9,10,11].map(function(i){ var ym = yearMonth(ano, i+1), c = s.fx.contas.filter(function(x){ return x.empresaId===emp.id && x.yearMonth===ym; })[0]; var f = fb(emp, ym);
    return {mes:i+1, ym:ym, valor: c ? c.total : (f==null ? 0 : f), origem: c ? "fiscal" : (f!=null ? "contas-a-pagar" : "vazio")}; });
    return {empresaId:emp.id, nome:emp.nome, meses:meses, total:r2(meses.reduce(function(t,m){ return t+m.valor; }, 0))}; });
}
// quantos lançamentos o CNPJ tem (a tela avisa antes de apagar)
function fxLancamentosDe(fx, empresaId){ return {notas:fx.notas.filter(function(n){ return n.empresaId===empresaId; }).length, saidas:fx.saidas.filter(function(n){ return n.empresaId===empresaId; }).length, contas:fx.contas.filter(function(n){ return n.empresaId===empresaId; }).length}; }

// ---------- convergência com s.fiscal (Limite de faturamento) ----------
// lançamento no formato antigo ({data, fatAnual, brindesMes, entradaMes, entradaAnual}) calculado do s.fx; null se o CNPJ não está ligado ou não tem venda no ano
function fxSnapshotLegado(s, cnpjId, ano){
  var fx = s.fx; if(!fx) return null; var emp = fx.empresas.filter(function(e){ return e.cnpjId===cnpjId; })[0]; if(!emp) return null;
  ano = ano||anoPadrao(s); var mc = mesesDoAno(fx, emp.id, ano), fat = r2(mc.reduce(function(t,m){ return t+m.venda; }, 0)); if(fat<=0) return null;
  var ult = 0; mc.forEach(function(m, i){ if(m.venda>0) ult = i; });
  var ultDia = new Date(Date.UTC(ano, ult+1, 0)).getUTCDate(), hoje = hojeSP(), fim = ano+"-"+p2(ult+1)+"-"+p2(ultDia);
  return {data: fim>hoje ? hoje : fim, fatAnual:fat, brindesMes:mc[ult].brindes, entradaMes:mc[ult].lastro, entradaAnual:r2(mc.reduce(function(t,m){ return t+m.lastro; }, 0)), origem:"fiscal"};
}
// o que a tela Limite de faturamento deve ler: o do s.fx quando existe e não é mais velho que o lançamento manual; senão o manual (s.fiscal.hist)
function fiscalUnido(s, cnpjId, fiscalAtualFn){
  var manual = fiscalAtualFn ? fiscalAtualFn(s.fiscal, cnpjId) : {data:"", fatAnual:0, brindesMes:0, entradaMes:0, entradaAnual:0};
  var novo = fxSnapshotLegado(s, cnpjId, manual.data ? Number(manual.data.slice(0,4)) : undefined);
  return novo && novo.data>=(manual.data||"") ? novo : manual;
}

// ---------- texto do resumo fiscal (WhatsApp) ----------
// RESUMO FISCAL <ano> – GRUPO SORELLY. mes1 (1–12) = mês da linha "Vendas em <mês>"; padrão = meses decorridos. Só CNPJs com CNPJ e com venda no ano ≥ mínimo, do maior para o menor.
function fxResumoTexto(s, ano, mes1){
  var vg = fxVisaoGeral(s, ano), cfg = s.fx.config, m = mes1 || vg.dec;
  var lista = vg.comCnpj.filter(function(x){ return x.ativo; }).sort(function(a,b){ return b.k.acum-a.k.acum; });
  var linhas = ["📊 RESUMO FISCAL "+vg.ano+" – GRUPO SORELLY", "Sublimite Simples: "+formatarReais(cfg.sublimiteAnual)];
  lista.forEach(function(x){ linhas.push("", "🏢 "+x.empresa.nome, "💰 Vendas no ano: "+formatarReais(x.k.acum), "📅 Vendas em "+MESES[m-1]+": "+formatarReais(x.k.mc[m-1].venda), "🎯 Falta p/ sublimite: "+formatarReais(Math.max(0, x.k.restante))); });
  return linhas.join("\n");
}

// ---------- operações (fxReduz) ----------
// a.op: "empresa_add" {nome, razao, cnpj, cnpjId} · "empresa_set" {id, nome?, razao?, cnpj?, cnpjId?} · "empresa_del" {id, confirmar} (apaga notas, saídas e contas dele; pede confirmar se houver lançamentos)
//       "nota_add" {empresaId, data, nf, fornecedor, cfop, uf, valor, classificacao} · "nota_del" {id}
//       "saida_set" {empresaId, yearMonth, periodo 0-2, venda, brindes, trocas} · "conta_set" {empresaId, yearMonth, total}
//       "config_set" {sublimiteAnual?, metaIlf?, criticoIlf?, minimoAtivo?, riscoPct?, usoLimitePct?}
// Toda ação grava a.por (quem fez) na linha e no registro (fx.log, últimos 300).
function fxReduz(s, a){
  var fx = clone(s.fx || fxDemo()), por = a.por||"—", agora = a.agora||agoraSP();
  var recusa = function(t){ return {patch:{}, msg:t}; };
  var ok = function(texto){ fx.log.push({em:agora, por:por, texto:texto}); if(fx.log.length>300) fx.log = fx.log.slice(-300); return {patch:{fx:fx}, msg:texto}; };
  var emp = function(id){ return fx.empresas.filter(function(e){ return e.id===id; })[0]; };
  var naoNeg = function(v){ var n = num(v); return n<0 ? null : r2(n); };
  switch(a.op){
    case "empresa_add": {
      var nome = trim(a.nome); if(!nome) return recusa("Digite o nome da empresa.");
      if(fx.empresas.some(function(e){ return e.nome.toLowerCase()===nome.toLowerCase(); })) return recusa("Já existe uma empresa com esse nome.");
      var e = {id:"e"+(++fx.seq), nome:nome, razao:trim(a.razao), cnpj:trim(a.cnpj), cnpjId:trim(a.cnpjId)};
      fx.empresas.push(e); return ok("Empresa "+nome+" adicionada ao Fiscal");
    }
    case "empresa_set": {
      var x = emp(a.id); if(!x) return recusa("Empresa não encontrada.");
      if(a.nome!==undefined){ var n2 = trim(a.nome); if(!n2) return recusa("O nome não pode ficar vazio."); x.nome = n2; }
      ["razao","cnpj","cnpjId"].forEach(function(k){ if(a[k]!==undefined) x[k] = trim(a[k]); });
      return ok("Empresa "+x.nome+" atualizada");
    }
    case "empresa_del": {
      var d = emp(a.id); if(!d) return recusa("Empresa não encontrada.");
      var l = fxLancamentosDe(fx, d.id), tem = l.notas+l.saidas+l.contas;
      if(tem>0 && !a.confirmar) return recusa("Esta empresa tem "+l.notas+" notas, "+l.saidas+" saídas e "+l.contas+" contas lançadas. Apagar leva tudo junto: confirme para continuar.");
      fx.empresas = fx.empresas.filter(function(e){ return e.id!==d.id; });
      fx.notas = fx.notas.filter(function(n){ return n.empresaId!==d.id; }); fx.saidas = fx.saidas.filter(function(n){ return n.empresaId!==d.id; }); fx.contas = fx.contas.filter(function(n){ return n.empresaId!==d.id; });
      return ok("Empresa "+d.nome+" removida do Fiscal"+(tem ? " com "+tem+" lançamentos" : ""));
    }
    case "nota_add": {
      var en = emp(a.empresaId); if(!en) return recusa("Escolha a empresa.");
      if(!ehDia(a.data)) return recusa("Informe a data da nota.");
      var valor = num(a.valor); if(!(valor>0)) return recusa("O valor da nota precisa ser maior que zero.");
      var cl = trim(a.classificacao)||"LASTRO"; if(CLASSIFICACOES.indexOf(cl)<0) return recusa("Classificação inválida (lastro, não lastro ou operacional).");
      var nota = {id:"n"+(++fx.seq), empresaId:en.id, data:a.data, nf:trim(a.nf), fornecedor:trim(a.fornecedor), cfop:trim(a.cfop), uf:trim(a.uf).toUpperCase(), valor:r2(valor), classificacao:cl, por:por, em:agora};
      fx.notas.push(nota); return ok("Nota de entrada de "+formatarReais(nota.valor)+" lançada em "+en.nome+" ("+ROTULO_CLASSIFICACAO[cl]+")");
    }
    case "nota_del": {
      var nd = fx.notas.filter(function(n){ return n.id===a.id; })[0]; if(!nd) return recusa("Nota não encontrada.");
      fx.notas = fx.notas.filter(function(n){ return n.id!==a.id; }); return ok("Nota de "+formatarReais(nd.valor)+" excluída");
    }
    case "saida_set": {
      var es = emp(a.empresaId); if(!es) return recusa("Escolha a empresa.");
      if(!ehYM(a.yearMonth)) return recusa("Mês inválido."); var per = Number(a.periodo); if(!(per===0 || per===1 || per===2)) return recusa("Período inválido (0, 1 ou 2).");
      var v = naoNeg(a.venda), b = naoNeg(a.brindes), t = naoNeg(a.trocas); if(v==null || b==null || t==null) return recusa("Venda, brindes e trocas não podem ser negativos.");
      var linha = fx.saidas.filter(function(x2){ return x2.empresaId===es.id && x2.yearMonth===a.yearMonth && x2.periodo===per; })[0];
      if(!linha){ linha = {empresaId:es.id, yearMonth:a.yearMonth, periodo:per}; fx.saidas.push(linha); }
      linha.venda = v; linha.brindes = b; linha.trocas = t; linha.por = por; linha.em = agora;
      return ok("Saída de "+es.nome+" · "+a.yearMonth+" · "+ROTULO_PERIODO[per]+" salva (venda "+formatarReais(v)+")");
    }
    case "conta_set": {
      var ec = emp(a.empresaId); if(!ec) return recusa("Escolha a empresa."); if(!ehYM(a.yearMonth)) return recusa("Mês inválido.");
      var tt = naoNeg(a.total); if(tt==null) return recusa("O valor das contas não pode ser negativo.");
      var c = fx.contas.filter(function(x3){ return x3.empresaId===ec.id && x3.yearMonth===a.yearMonth; })[0];
      if(!c){ c = {empresaId:ec.id, yearMonth:a.yearMonth}; fx.contas.push(c); }
      c.total = tt; c.por = por; c.em = agora; return ok("Contas de "+ec.nome+" em "+a.yearMonth+": "+formatarReais(tt));
    }
    case "config_set": {
      var cfg = fx.config, sub = a.sublimiteAnual!==undefined ? num(a.sublimiteAnual) : cfg.sublimiteAnual;
      if(!(sub>0)) return recusa("O sublimite precisa ser maior que zero.");
      var meta = a.metaIlf!==undefined ? num(a.metaIlf) : cfg.metaIlf, crit = a.criticoIlf!==undefined ? num(a.criticoIlf) : cfg.criticoIlf;
      if(meta<0 || meta>1 || crit<0 || crit>1) return recusa("Meta e crítico do ILF ficam entre 0% e 100%.");
      cfg.sublimiteAnual = sub; cfg.metaIlf = meta; cfg.criticoIlf = Math.min(crit, meta);   // o crítico nunca fica acima da meta
      ["minimoAtivo","riscoPct","usoLimitePct"].forEach(function(k){ if(a[k]!==undefined){ var n3 = num(a[k]); if(n3>=0) cfg[k] = n3; } });
      return ok("Configuração do Fiscal salva");
    }
    default: return recusa("Ação do Fiscal desconhecida.");
  }
}

export { fxDemo, fxMigrar, fxReduz, ilfClass, mesCalc, mesesDoAno, mesesDecorridos, empCalc, fxVisaoGeral, fxAvisos, fxAindaCabe, fxDashboardAnual, fxNotasDe, fxSaidasDoMes, fxGradeContas, fxLancamentosDe,
  fxSnapshotLegado, fiscalUnido, fxResumoTexto, anosDisponiveis, anoPadrao, periodoDoDia, yearMonth, CONFIG_PADRAO, CLASSIFICACOES, ROTULO_CLASSIFICACAO, ROTULO_PERIODO, MESES, MES_CURTO };

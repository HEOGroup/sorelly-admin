import { globLocal } from "@/lib/glob-local";
// Sorelly Admin · montagem — domain/contas-empresa.js
// Contas a pagar da EMPRESA por filial (CNPJ 34, 46, 59, 67 Axis e "Por fora"), a partir dos relatórios do DevMaster (por filial, passados pelo Marcus em 19/10/2026):
// "Baixas a Pagar por Natureza" = o que JÁ FOI PAGO e "Contas a Pagar por Natureza" = o que FALTA PAGAR (saldo). Dados reais em contas-empresa.local.js (fora do GitHub).
// Total do mês = pago + falta pagar. Natureza = código do plano de contas do DevMaster (ex.: 3.01.01.11); prefixo = tipo do título (cartão, imposto, pix...).
// Mês de um pagamento = mês da baixa; mês de uma conta a pagar = mês do vencimento (vencida de mês anterior fica no mês corrente e é sinalizada).

import { parcelasDe } from "@/apps/montagem/domain/financeiro-familiar";
import { funcionarios } from "@/apps/montagem/domain/pessoas";

// contas a pagar dos meses seguintes (nov/2026 a mar/2027), das planilhas do DevMaster: mesmo formato de "apagar"
var FUTURAS = (function(){ try { var m = globLocal("apps/montagem/domain/contas-empresa-meses.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();
// contas PAGAS de jan a set/2026 (relatório Baixas a Pagar por Data, 22/10/2026): mesmo formato de "itens"
var ANO = (function(){ try { var m = globLocal("apps/montagem/domain/contas-empresa-ano.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();
var LOCAL = (function(){ try { var m = globLocal("apps/montagem/domain/contas-empresa.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();

var FILIAIS = [["34","CNPJ 34","Sorelly Atacadista"], ["46","CNPJ 46","Mayz Comércio"], ["59","CNPJ 59","Serenity"], ["67","CNPJ 67","Axis Joias"], ["ho","H&O Apps","Empresa de aplicativos"], ["fora","Por fora","Pessoal, Pix e fora dos CNPJs"]];
var G = {folha:"Folha e pessoal", enc:"Encargos da folha", bruto:"Bruto", banho:"Banho", grafico:"Material gráfico e embalagem", outros:"Outros fornecedores", prest:"Prestadores de serviço", rep:"Representantes", comfunc:"Comissões de funcionários", seg:"Segurança", socios:"Sócios e despesas pessoais", mkt:"Sistemas e tecnologia", trafego:"Marketing e tráfego pago", fin:"Financeiro (empréstimos, juros)", imp:"Impostos", adm:"Administrativo", axis:"Axis e H&O"};
var GRUPOS = [G.folha, G.enc, G.bruto, G.banho, G.grafico, G.outros, G.prest, G.rep, G.comfunc, G.seg, G.socios, G.trafego, G.mkt, G.fin, G.imp, G.adm, G.axis];
// fornecedores conhecidos (20/10/2026): [teste no nome, nome único, grupo]. Um fornecedor = uma linha, mesmo pago por CNPJs e formas diferentes. Ellos (banho) NÃO é a Art Ello (bruto), só do mesmo grupo de empresas.
var FORNS = [[/ELLOS|GALVANOPLAST/i, "Ellos (banho)", G.banho], [/PONTUAL|CHP IND/i, "Pontual", G.banho], [/OFFICE ?GRAF/i, "Office Graf", G.grafico], [/MEGA ?SUL/i, "MegaSul", G.bruto], [/ART ELLO/i, "Art Ello", G.bruto], [/POINT/i, "Point", G.bruto], [/LINDA|LINN|LIIN/i, "Linda", G.bruto], [/TUCANO/i, "Tucano", G.bruto], [/CHARME/i, "Charme", G.bruto], [/XANGAI/i, "Xangai", G.bruto], [/RAMOS/i, "Ramos Laser", G.bruto], [/JOIAS (&|E) CIA/i, "Bruto Joias e Cia", G.bruto]];
function fornDe(nat, tit){ var t = String(nat||"")+" "+String(tit||""); for(var k = 0; k<FORNS.length; k++) if(FORNS[k][0].test(t)) return FORNS[k]; return null; }

// Texto do DevMaster vem TUDO EM MAIÚSCULO: aqui vira letra normal ("SALÁRIO" → "Salário", "PRÓ-LABORE MARCUS" → "Pró-labore Marcus"); siglas continuam em maiúsculo
var SIGLAS = {INSS:1, FGTS:1, DAS:1, IOF:1, BMW:1, IPVA:1, IPTU:1, ICMS:1, CNPJ:1, CPF:1, CLT:1, INPI:1, VT:1, VR:1, LTDA:1, SA:1, EPP:1, ME:1, II:1, III:1, IV:1, M2:1, X1:1, TIM:1, PJ:1, PF:1, RH:1, EUA:1, SP:1, PR:1, SC:1, ADM:1, NF:1, NFE:1, EIRELI:1, KOMMO:0, APP:0, CRM:1, PDV:1, GPS:1, DARF:1, DP:1};
var LIGACOES = {de:1, da:1, do:1, dos:1, das:1, e:1, em:1, com:1, para:1, a:1, o:1, no:1, na:1, por:1, ao:1};
function bonito(t){
  var s = String(t||"").trim().replace(/\s+/g, " ");
  if(!s || s!==s.toUpperCase()) return s;   // já está em letra normal: não mexe
  if(/^DAS[- ]SIMPLES/.test(s)) s = s.replace(/^DAS[- ]SIMPLES/, "DAS Simples");
  return s.toLowerCase().replace(/[a-zà-ú0-9]+/g, function(w, off, str){
    if(SIGLAS[w.toUpperCase()]===1) return w.toUpperCase();
    if(off>0 && str.charAt(off-1)==="-") return w;                 // depois do hífen fica minúsculo: "Pró-labore"
    if(off>0 && LIGACOES[w]) return w;                              // "de", "da", "e"...
    return w.charAt(0).toUpperCase()+w.slice(1);
  }).replace(/^Das Simples/, "DAS Simples");
}
var r2 = function(n){ return Math.round((n||0)*100)/100; };
var ym = function(iso){ return iso.slice(0,7); };

// itens que nascem como da família: pró-labore, despesas de casa e o financiamento imobiliário do Itaú
function ehPessoal(cod, nome){ return grupoDe(cod, nome)===G.socios || /IMOBILI[ÁA]RIO/i.test(nome); }
function grupoDe(cod, nome, tit){
  if(/PRÓ-LABORE/i.test(nome) || /^3\.13\./.test(cod) || /^3\.16\.08/.test(cod)) return G.socios;
  if(/HIGOR/i.test(tit||"") && /^3\.01\.01/.test(cod)) return G.seg;   // Higor é o segurança (salário em carteira + por fora + extras): tudo junto
  if(/^3\.01\.02/.test(cod)) return G.imp;
  if(/^3\.01\.01\.(06|14|17)$/.test(cod)) return G.enc;   // FGTS, INSS e medicina do trabalho
  if(/^3\.01\.01/.test(cod)) return G.folha;
  if(/^3\.06/.test(cod) || /DEVMASTER/i.test(nome)) return G.mkt;   // sistemas (DevMaster, Kommo, App Sorelly...)
  if(/ALUGUEL|CONDOM/i.test(nome) && !/M[ÁA]QUINA/i.test(nome)) return G.adm;   // aluguéis de todas as salas ficam juntos no Administrativo
  if(/^(11|12)\./.test(cod)) return G.axis;
  if(/^5\./.test(cod)){ var fd = fornDe(nome, tit); return fd ? fd[2] : /^5\.04/.test(cod) ? G.banho : /^5\.(01|17)/.test(cod) ? G.bruto : G.grafico; }
  if(/^4\.(02|03|20)/.test(cod)) return G.rep;   // comissão do consignado + combustível: representantes, juntos
  if(/^3\.23/.test(cod)) return G.trafego;   // marketing e tráfego pago (Facebook/Meta, Google...), cada um na sua natureza
  if(/^4\.(01|08|09)/.test(cod)) return G.mkt;   // ChatGPT/Claude, Google Workspace, Canva
  if(/^4\.12/.test(cod)) return G.comfunc;   // comissão atacado: vai junto das comissões de funcionários
  if(/^4\./.test(cod)) return G.adm;
  if(/^6\./.test(cod)) return G.fin;
  return G.adm;
}
// setor de cada funcionário (nome do DevMaster → setor do cadastro de pessoas); sem correspondência clara fica em "Sem setor definido"
var semAcento = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
var SETOR_DE = null;
// setor definido pelo Marcus (20/10/2026) para quem não bate com o cadastro de pessoas (nome escrito diferente, ou já saiu): Julia e Rebeca eram do Marketing (saíram, atualizar depois)
var SETOR_FIXO = {"thalyanny aparecida jacob":"Cadastro de revendedoras", "julia da silva zambonin":"Marketing", "rebeca marques melo":"Marketing", "thaina cristina idalgo":"RH", "helen garmier da silva":"Link de pagamento", "hellen garmier da silva":"Link de pagamento", "sthefany marques de aquino correa":"Atendimento de kits"};
// Link de pagamento e Kits novos ficam DENTRO do setor Cadastro de revendedoras
var SETOR_PAI = {"Link de pagamento":"Cadastro de revendedoras", "Kits novos e indicação":"Cadastro de revendedoras"};
function setorDe(nome){
  if(!SETOR_DE){ SETOR_DE = {}; funcionarios().forEach(function(f){ SETOR_DE[semAcento(f.nome)] = f.setor; }); }
  var k = semAcento(nome).replace(/\d+/g, "").replace(/\s+/g, " ").trim(); if(SETOR_FIXO[k]) return SETOR_FIXO[k];
  if(SETOR_DE[k]) return SETOR_DE[k];
  // nome escrito diferente no DevMaster (acento, sobrenome, número no fim): mesmo primeiro nome e mais um nome igual; ou o único com aquele primeiro nome
  var w = k.split(" "), mesmos = Object.keys(SETOR_DE).filter(function(x){ return x.split(" ")[0]===w[0]; });
  var ach = mesmos.filter(function(x){ var v = x.split(" "); return w.slice(1).some(function(t){ return t.length>3 && v.indexOf(t)>0; }); });
  if(ach.length===1) return SETOR_DE[ach[0]];
  return mesmos.length===1 ? SETOR_DE[mesmos[0]] : "Sem setor definido";
}
function setorExato(nome){ setorDe("x"); var k = semAcento(nome).replace(/\d+/g, "").replace(/\s+/g, " ").trim(); return SETOR_DE[k] || ""; }
// marca cada conta com o fornecedor único e com nota / sem nota (Pix = sem nota; boleto, cheque, transferência do CNPJ = com nota)
function decora(i){
  // CNPJ 46 (Patriarca): sala 703. As contas do CNPJ 34 são divididas em duas (salas 501/502 e 503/504) em baseItens.
  if(i.filial==="46" && /PATRIARCA/i.test(i.nome) && i.nat==="3.03") i.obs = "Sala 703";
  if(i.filial==="67" && /GALV[ÃA]O/i.test(i.nome)) i.obs = "Sala 203";   // Axis: a coluna Sala mostra SÓ a sala, sem endereço (regra do Marcus)
  if(i.filial==="59" && /THE WORLD/i.test(i.nome)) i.obs = "Sala 1401";   // Serenity
  var fd = (/^5\./.test(i.nat) || i.nat==="pf") ? fornDe(i.nat==="pf" ? "" : i.natNome, i.nat==="pf" ? i.forn : i.nome) : null;
  i.fornCanon = fd ? fd[1] : (i.nat==="pf" ? i.forn : i.natNome);
  i.nota = /PIX/i.test(i.natNome+" "+i.nome) ? "sem" : "com";
  // custo de pessoal por setor: só as contas de folha (3.01.01); FGTS, INSS e medicina não têm como dividir por setor
  if(/^4\.20/.test(i.nat)){ var sx = setorExato(String(i.nome).replace(/^pix\s+/i, "").trim()); if(sx) i.setor = sx; }   // comissão de reposição de quem é funcionário conta no setor dele
  if(/^3\.01\.01/.test(i.nat)) i.setor = /^3\.01\.01\.(06|14|17)$/.test(i.nat) ? "Encargos da folha (sem divisão por setor)" : setorDe(String(i.nome).replace(/^pix\s+/i, "").replace(/\s+·.*$/, "").trim());
  i.setorPai = SETOR_PAI[i.setor] || "";
  return i;
}

var _cache = null;
// Contas a pagar e pagas vindas do servidor (DevMaster, /api/contas-dm). Quando chegam, valem no lugar dos arquivos locais (que só existem no computador do Marcus).
var SERV = null;
function definirContasServidor(d){ SERV = d && d.apagar ? d : null; _cache = null; }
function servidorEm(){ return SERV ? SERV.geradoEm || "ok" : null; }   // hora da última leitura da DevMaster; null = ainda usa os arquivos locais
function baseItens(){
  if(_cache) return _cache;
  var pagas = ((SERV && SERV.pagas) || ((ANO && ANO.itens) || []).concat((LOCAL && LOCAL.itens) || [])).map(function(x, i){
    return {id:"p"+i, status:"pago", filial:x[0], nat:x[1], natNome:bonito(x[2]), pref:x[3], num:x[4], parc:x[5], forn:x[6], nome:bonito(x[7]), baixa:x[8], venc:x[9], valor:x[10], grupo:grupoDe(x[1], x[2], x[7]), pessoalPadrao:ehPessoal(x[1], x[2]), mes:ym(x[8]), outroMes:ym(x[9])!==ym(x[8])};
  });
  var mesRef = pagas.reduce(function(m, i){ return i.mes>m ? i.mes : m; }, "");
  var apagar = ((SERV && SERV.apagar) || ((LOCAL && LOCAL.apagar) || []).concat((FUTURAS && FUTURAS.apagar) || [])).map(function(x, i){
    var vm = ym(x[9]), ant = !!mesRef && vm<mesRef;
    return {id:"a"+i, status:"apagar", filial:x[0], nat:x[1], natNome:bonito(x[2]), pref:x[3], num:x[4], parc:x[5], forn:x[6], nome:bonito(x[7]), emissao:x[8], venc:x[9], valorTitulo:x[10], valor:x[11], atraso:x[12], grupo:grupoDe(x[1], x[2], x[7]), pessoalPadrao:ehPessoal(x[1], x[2]), mes:ant ? mesRef : vm, outroMes:ant};
  });
  _cache = pagas.concat(apagar);
  // CNPJ 34, Patriarca (20/10/2026): o aluguel (R$ 19.160,71) e o "condomínio" (R$ 13.141,08, que o Marcus mandou contar junto nos ALUGUÉIS) cobrem DUAS duplas de salas; cada conta é dividida ao meio: salas 501 e 502 / salas 503 e 504
  var dup = [];
  _cache.forEach(function(i){
    if(i.filial==="34" && /PATRIARCA/i.test(i.nome) && (i.nat==="3.03" || i.nat==="3.02")){
      var m = function(v){ return v==null ? v : Math.round(v*100)/100; }, h1 = m(Math.ceil(i.valor*100/2)/100), h2 = m(i.valor-h1), t1 = i.valorTitulo==null ? null : m(Math.ceil(i.valorTitulo*100/2)/100);
      dup.push(Object.assign({}, i, {id:i.id+"a", nat:"3.03", natNome:"Aluguel", valor:h1, valorTitulo:t1, obs:"Salas 501 e 502"}), Object.assign({}, i, {id:i.id+"b", nat:"3.03", natNome:"Aluguel", valor:h2, valorTitulo:t1==null ? null : m(i.valorTitulo-t1), obs:"Salas 503 e 504"}));
    } else dup.push(i);
  });
  _cache = dup;
  // H&O Apps (empresa de aplicativos) tem contas próprias: natureza 11.xx e o que cita H&O; "Pix Lucas Castilho" do app Sorelly era do Juan (demitido)
  _cache.forEach(function(i){ if(/^11\./.test(i.nat) || /H&O/i.test(i.nome)) i.filial = "ho"; if(i.nat==="3.06.17" && /lucas castilho/i.test(i.nome)) i.nome = i.nome.replace(/lucas castilho/i, "Juan"); });
  _cache.forEach(decora);
  var vistos = {}; _cache.forEach(function(i){ var base = [i.status, i.filial, i.nat, i.pref, i.num, i.parc, i.forn, i.valor.toFixed(2), i.baixa || i.venc].join("|"); vistos[base] = (vistos[base]||0)+1; i.chave = base+"#"+vistos[base]; });   // chave estável de cada conta (para o Marcus marcar Sorelly ou Família)
  return _cache;
}
// Classificação feita pelo Marcus por conta: "familia" ou "sorelly" (vale mais que o padrão do tipo de gasto). Vem de s.cpe.classe.
var CLASSE = {};
function setClasse(c){ CLASSE = c || {}; }
function ehFam(i){ var c = CLASSE[i.chave]; return c ? c==="familia" : i.pessoalPadrao; }
// Contas lançadas à mão no sistema (ex.: bônus mensal do Nickolas): vêm de s.cpe.lanc e entram junto com as do DevMaster
var LANC_ITENS = [];
function setLancamentos(l){
  var h = new Date(), hj = h.getFullYear()+"-"+String(h.getMonth()+1).padStart(2,"0")+"-"+String(h.getDate()).padStart(2,"0");
  LANC_ITENS = (l||[]).map(function(x){
    var ap = x.status!=="pago", atraso = ap && x.venc<hj ? Math.round((new Date(hj+"T12:00:00")-new Date(x.venc+"T12:00:00"))/86400000) : 0;
    return {id:"l"+x.id, status:ap ? "apagar" : "pago", filial:x.filial, nat:x.nat, natNome:x.natNome, pref:x.pref||"", num:"", parc:"", forn:x.forn||"", nome:x.nome, baixa:x.baixa||null, venc:x.venc, valor:x.valor, valorTitulo:x.valor, atraso:atraso, grupo:grupoDe(x.nat, String(x.natNome).toUpperCase(), x.nome), pessoalPadrao:!!x.fam, mes:(ap ? x.venc : (x.baixa||x.venc)).slice(0,7), outroMes:false, chave:"l|"+x.id, manual:true};
  }).map(decora);
}
// Pix revendedora lançado pela equipe em Pagamentos a fornecedores (Point, Pontual, MegaSul...): entra dentro do fornecedor e já conta como PAGO.
// O que o DevMaster já registrou (até a última baixa de Pix do fornecedor) vale o DevMaster; o Pix da equipe só conta depois disso, sem duplicar. Só fornecedores (prestadores não entram).
var PF_ITENS = [], PF_OCULTOS = {}, _pfSig = "";
function setPf(pf){
  var lanc = (pf && pf.lancamentos) || [], sig = lanc.length+"|"+(lanc.length ? lanc[lanc.length-1].id : "")+"|"+((pf && pf.fornecedores) || []).length;
  if(sig===_pfSig) return; _pfSig = sig; PF_ITENS = []; PF_OCULTOS = {};
  if(!lanc.length) return;
  var fn = {}; ((pf && pf.fornecedores) || []).forEach(function(f){ fn[f.id] = f; });
  // o DevMaster junta os Pix de um fornecedor num valor só e dá a baixa depois; por isso NÃO se compara pagamento a pagamento.
  // Regra: o Pix da equipe só conta DEPOIS da última baixa de Pix daquele fornecedor no DevMaster (o que o DevMaster já registrou, vale o DevMaster).
  var ultima = {}; baseItens().forEach(function(i){ if(i.status==="pago" && i.nota==="sem" && i.baixa && i.baixa>(ultima[i.fornCanon]||"")) ultima[i.fornCanon] = i.baixa; });
  // o que vale é o DevMaster (22/10/2026, pedido do Marcus): nada do que veio da planilha/Pagamentos a fornecedores entra até a data da última baixa do DevMaster
  var ultimaGeral = ""; baseItens().forEach(function(i){ if(i.status==="pago" && i.baixa && i.baixa>ultimaGeral) ultimaGeral = i.baixa; });
  lanc.forEach(function(l){
    var f = fn[l.fornId]; if(!f || f.tipo==="prestador" || !l.revendedora || l.revendedora==="—" || !(l.valor>0) || !l.data) return;
    var fd = fornDe("", f.nome), canon = fd ? fd[1] : f.nome;
    if(l.data<=(ultima[canon]||"") || l.data<=ultimaGeral) return;
    PF_ITENS.push(decora({id:"pf"+l.id, status:"pago", filial:"fora", nat:"pf", natNome:"Pix revendedora (Pagamentos a fornecedores)", pref:"PIX", num:"", parc:"", forn:f.nome, nome:"Pix "+f.nome+" · "+l.revendedora, baixa:l.data, venc:l.data, valor:l.valor, valorTitulo:l.valor, grupo:fd ? fd[2] : G.outros, pessoalPadrao:false, mes:String(l.data).slice(0,7), outroMes:false, chave:"pf|"+l.id, origem:"pf"}));
  });
}
// Baixas dadas no sistema (22/10/2026): pagamento de uma conta em aberto, com juros, multa e desconto; vem de s.cpe.baixas.
// Cada baixa = {id, chave (da conta), data, forma, conta, principal (quanto da conta ela quitou), juros, multa, desc, obs, por, em}.
// A conta quitada vira "pago" (valor = o que saiu do caixa); se sobrou, a conta continua "a pagar" só com o que falta.
var BAIXAS = [], _bxRef = null, _bxItens = null;
function setBaixas(b){ if(b!==_bxRef){ _bxRef = b; BAIXAS = b || []; _bxItens = null; } }
var pagoDe = function(b){ return r2((b.principal||0)+(b.juros||0)+(b.multa||0)-(b.desc||0)); };
function comBaixas(l){
  if(!BAIXAS.length) return l;
  var por = {}; BAIXAS.forEach(function(b){ (por[b.chave] = por[b.chave] || []).push(b); });
  var out = [];
  l.forEach(function(i){
    var bs = i.status==="apagar" ? por[i.chave] : null; if(!bs){ out.push(i); return; }
    var quitado = 0;
    bs.forEach(function(b){ quitado = r2(quitado+(b.principal||0)); out.push(Object.assign({}, i, {id:i.id+"~"+b.id, status:"pago", baixa:b.data, valor:pagoDe(b), valorTitulo:i.valorTitulo==null ? i.valor : i.valorTitulo, atraso:0, mes:String(b.data).slice(0,7), outroMes:String(i.venc).slice(0,7)!==String(b.data).slice(0,7), bx:b})); });
    var falta = r2(i.valor-quitado);
    if(falta>0.004) out.push(Object.assign({}, i, {valor:falta, valorTitulo:i.valorTitulo==null ? i.valor : i.valorTitulo, parcialPago:quitado}));
  });
  return out;
}
function itensEmpresa(){
  var l = LANC_ITENS.length ? baseItens().concat(LANC_ITENS) : baseItens();
  l = PF_ITENS.length ? l.filter(function(i){ return !PF_OCULTOS[i.id]; }).concat(PF_ITENS) : l;
  return comBaixas(l);
}
// bônus mensal do Nickolas até dezembro/2026: R$ 1.000 até o dia 15 e R$ 1.000 até o dia 30, sem nota (Por fora)
function bonusNickolas(){
  // combinado do Marcus (20/10/2026): R$ 2.000 por mês, R$ 1.000 no dia 10 e R$ 1.000 no dia 23, de outubro a dezembro; o de 10/10 foi pago em dinheiro. Em janeiro vê novas condições.
  var l = [];
  ["2026-10","2026-11","2026-12"].forEach(function(m){ ["10","23"].forEach(function(d){
    var pago = m==="2026-10" && d==="10";
    l.push(Object.assign({id:"nick2-"+m+"-"+d, filial:"fora", nat:"3.01.01.12", natNome:"Bônus", pref:pago ? "DIN" : "BON", nome:"Nickolas Leal · bônus mensal dia "+d+(pago ? " (dinheiro)" : ""), venc:m+"-"+d, valor:1000, status:pago ? "pago" : "apagar"}, pago ? {baixa:m+"-"+d} : {}));
  }); });
  return l;
}
// negociação de cada funcionário (combinados fora da folha): aparece na aba Funcionários e representantes, dentro da pessoa. A chave é o nome sem acento, em minúsculo.
var NEGOCIACOES = {"nickolas leal":{titulo:"Bônus Nickolas, out a dez/2026", motivo:"bom trabalho durante o ano", regra:"R$ 2.000 por mês: R$ 1.000 no dia 10 e R$ 1.000 no dia 23", combinado:6000, nota:"Em janeiro verificamos novas condições.", filtro:/b[oô]nus mensal/i}};
var temDados = function(){ return itensEmpresa().length>0; };
var meses = function(){ var o = {}; itensEmpresa().forEach(function(i){ o[i.mes] = 1; }); return Object.keys(o).sort(); };

// filtra por mês, filial ("" = todas), busca (título, natureza, valor) e situação ("" = todas, "pago", "apagar")
function filtrar(mes, filial, busca, status, quem, nota){   // quem: "sorelly" = só o que é da empresa, "familia" = só o que é da família, "" = tudo
  var q = semAcento(busca).trim();   // a busca também acha o SETOR (ex.: "encomendas" traz tudo da folha do setor)
  return itensEmpresa().filter(function(i){
    if(mes && i.mes!==mes) return false;
    if(filial && i.filial!==filial) return false;
    if(status && i.status!==status) return false;
    if(nota && i.nota!==nota) return false;
    if(quem==="sorelly" && ehFam(i)) return false;
    if(quem==="familia" && !ehFam(i)) return false;
    if(q && semAcento(i.nome+" "+i.natNome+" "+i.nat+" "+i.pref+" "+i.valor.toFixed(2).replace(".", ",")+" "+(i.setor||"")+" "+(i.setorPai||"")).indexOf(q)<0) return false;
    return true;
  });
}
var soma = function(l){ return r2(l.reduce(function(t, i){ return t+i.valor; }, 0)); };
function totais(l){ var p = l.filter(function(i){ return i.status==="pago"; }), a = l.filter(function(i){ return i.status==="apagar"; }); return {pago:soma(p), apagar:soma(a), total:soma(l), nPago:p.length, nApagar:a.length, n:l.length}; }

function porFilial(mes, busca, status, quem, nota){
  return FILIAIS.map(function(f){ var t = totais(filtrar(mes, f[0], busca, status, quem, nota)); return Object.assign({id:f[0], nome:f[1], desc:f[2]}, t); });
}
// grupos → naturezas → itens (cada nível com pago, a pagar e total)
function agrupar(lista){
  var g = {};
  lista.forEach(function(i){ var a = g[i.grupo] = g[i.grupo] || {grupo:i.grupo, nats:{}}; var n = a.nats[i.nat] = a.nats[i.nat] || {cod:i.nat, nome:i.natNome, itens:[]}; n.itens.push(i); });
  return GRUPOS.filter(function(k){ return g[k]; }).map(function(k){
    var nats = Object.keys(g[k].nats).map(function(c){ var n = g[k].nats[c], t = totais(n.itens); return Object.assign({cod:n.cod, nome:n.nome, itens:n.itens.sort(function(a, b){ return (a.status===b.status ? 0 : a.status==="apagar" ? -1 : 1) || (a.venc||"").localeCompare(b.venc||"") || b.valor-a.valor; })}, t); }).sort(function(a, b){ return b.total-a.total; });
    var t = totais(nats.reduce(function(l, x){ return l.concat(x.itens); }, []));
    return Object.assign({grupo:k, nats:nats}, t);
  }).sort(function(a, b){ return b.total-a.total; });
}

// ───────────── Família (Financeiro familiar) e conciliação com o DevMaster ─────────────
// Regra: o que é PESSOAL (pró-labore, casas, viagem, Pix revendedoras) existe nos dois sistemas. Quando a família é somada, o Financeiro familiar vale e o pessoal do DevMaster não entra na soma
// (senão contaria duas vezes). A conciliação mostra o que está nos dois, só no DevMaster e só no familiar, para conferir.
function famTotais(ff, mes){
  var ps = ff ? parcelasDe(ff, mes ? {ym:mes} : {}) : [];
  var pago = r2(ps.reduce(function(t, x){ return t+x.pago; }, 0)), falta = r2(ps.reduce(function(t, x){ return t+x.restante; }, 0)), total = r2(ps.reduce(function(t, x){ return t+x.valor; }, 0));
  return {pago:pago, apagar:falta, total:total, nPago:ps.filter(function(x){ return x.pago>0; }).length, nApagar:ps.filter(function(x){ return x.restante>0.005; }).length, n:ps.length, atrasado:r2(ps.filter(function(x){ return x.atrasada; }).reduce(function(t, x){ return t+x.restante; }, 0))};
}
var PESSOA_PIX = [["marcus", /MARCUS/i], ["anamaria", /ANAMARIA/i], ["marco", /MARCO ANTONIO/i], ["anabeatriz", /ANA BEATRIZ/i]];
var palavras = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/).filter(function(w){ return w.length>2; }); };
function conciliar(ff, mes){
  var famTodas = ff ? parcelasDe(ff, {}) : [];
  var fam = famTodas.filter(function(x){ return x.conta.categoria!=="PIX_REVENDEDORA" && x.conta.forma!=="PIX revendedoras"; }).map(function(x){ return {x:x, cents:Math.round(x.valor*100), usado:false}; });
  var dev = itensEmpresa().filter(function(i){ return ehFam(i) && !/PIX REVENDEDORAS/i.test(i.natNome); }).sort(function(a, b){ return b.valor-a.valor; });
  var pares = [], soDev = [];
  dev.forEach(function(i){
    var cents = Math.round(i.valor*100), vm = ym(i.venc), ws = palavras(i.nome+" "+i.natNome);
    var cand = fam.filter(function(f){ return !f.usado && f.x.ym===vm && Math.abs(f.cents-cents)<=1; });
    if(!cand.length){ soDev.push(i); return; }
    var melhor = cand.map(function(f){ var wf = palavras(f.x.conta.descricao+" "+(f.x.conta.beneficiario||"")); return {f:f, p:wf.filter(function(w){ return ws.indexOf(w)>=0; }).length}; }).sort(function(a, b){ return b.p-a.p; })[0].f;
    melhor.usado = true; pares.push({dev:i, fam:melhor.x});
  });
  var soFam = fam.filter(function(f){ return !f.usado; }).map(function(f){ return f.x; });
  var noMes = function(m){ return !mes || m===mes; };
  var pix = PESSOA_PIX.map(function(pp){
    var d = itensEmpresa().filter(function(i){ return /PIX REVENDEDORAS/i.test(i.natNome) && pp[1].test(i.natNome) && noMes(i.mes) && !(pp[0]==="marco" && /ANA BEATRIZ|ANAMARIA/i.test(i.natNome)); });
    var dp = r2(d.filter(function(i){ return i.status==="pago"; }).reduce(function(t, i){ return t+i.valor; }, 0)), df = r2(d.filter(function(i){ return i.status==="apagar"; }).reduce(function(t, i){ return t+i.valor; }, 0));
    var f = famTodas.filter(function(x){ return (x.conta.categoria==="PIX_REVENDEDORA" || x.conta.forma==="PIX revendedoras") && x.conta.personaId===pp[0] && noMes(x.ym); });
    var p = ff && ff.personas.find(function(q){ return q.id===pp[0]; });
    return {id:pp[0], nome:p ? p.nome : pp[0], devPago:dp, devFalta:df, devMeta:r2(dp+df), famMeta:r2(f.reduce(function(t, x){ return t+x.valor; }, 0)), famPago:r2(f.reduce(function(t, x){ return t+x.pago; }, 0))};
  });
  var fm = function(l, g){ return l.filter(function(x){ var m = g(x); return noMes(m); }); };
  var pa = fm(pares, function(x){ return x.fam.ym; }), sd = fm(soDev, function(x){ return ym(x.venc); }), sf = fm(soFam, function(x){ return x.ym; });
  return {pares:pa, soDev:sd, soFam:sf, pix:pix, valorPares:r2(pa.reduce(function(t, x){ return t+x.dev.valor; }, 0)), valorSoDev:r2(sd.reduce(function(t, x){ return t+x.valor; }, 0)), valorSoFam:r2(sf.reduce(function(t, x){ return t+x.valor; }, 0))};
}

function naturezasConhecidas(){ var o = {}; baseItens().forEach(function(i){ o[i.nat] = i.natNome; }); return Object.keys(o).sort().map(function(c){ return [c, o[c]]; }); }
export { servidorEm, definirContasServidor, NEGOCIACOES, G, SETOR_PAI, setorDe, setPf, naturezasConhecidas, setLancamentos, bonusNickolas, setClasse, setBaixas, pagoDe, ehFam, famTotais, conciliar, FILIAIS, GRUPOS, itensEmpresa, temDados, meses, filtrar, soma, totais, porFilial, agrupar, grupoDe };

// Sorelly Admin · montagem e bipagem — state/store.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { aplicaFila, filaRetornos } from "@/apps/montagem/domain/retornos";
import { VERSAO_DEMO, acertosDemo } from "@/apps/montagem/domain/acertos-demo";
import { rotDemo, rotMigrar } from "@/apps/montagem/domain/rotina";
import { pkSemearDemo } from "@/apps/montagem/domain/preferencias-rev";
import { VERSAO_INTERNOS, feitos19, internosDemo, termosDemo } from "@/apps/montagem/domain/internos-demo";
import { COMIS0 } from "@/apps/montagem/domain/comissoes";
import { CFG0, aplicaFaixas } from "@/apps/montagem/domain/config";
import { formasPagamentoPadrao, normalizarVersao, novaVersaoRegras, versaoVigente } from "@/apps/montagem/domain/consignado";
import { MONTADORAS, SUPERVISORA, nomeDe } from "@/apps/montagem/domain/equipe";
import { NOVAS0, RECUSAS0, VIRADA0, avalRepDemo } from "@/apps/montagem/domain/representantes";
import { agendDemo } from "@/apps/montagem/domain/agendamento";
import { RH_STAMP, rhAplicarAdmin, rhDemo } from "@/apps/montagem/domain/rh";
import { metasPadrao } from "@/apps/montagem/domain/metas-setor";
import { cpAjustar, cpDemo } from "@/apps/montagem/domain/controle-pagamentos";
import { dpDemo } from "@/apps/montagem/domain/direcionar-pix";
import { TEM_CHAVES_ADMIN, cpAplicarExtras, pxAplicarChavesAdmin, pxDemo, pxMigrar } from "@/apps/montagem/domain/pix-regras";
import { TEM_ATU_PF, pfInicial, pfMigrar } from "@/apps/montagem/domain/pf";
import { cfDemo, cfMigrar } from "@/apps/montagem/domain/cobranca-func";
import { clDemo, clSemear } from "@/apps/montagem/domain/cadastro-leads";
import { indDemo } from "@/apps/montagem/domain/indicacoes";
import { ceDemo, ceMigrar } from "@/apps/montagem/domain/compras-estoque";
import { gaDemo, gaMigrar } from "@/apps/montagem/domain/garantia";
import { mkDemo, mkMigrar } from "@/apps/montagem/domain/marketing";
import { fxDemo, fxMigrar } from "@/apps/montagem/domain/fiscal";
import { lpDemo, lpMigrar } from "@/apps/montagem/domain/link-pagamento";
import { erDemo, erMigrar } from "@/apps/montagem/domain/encomendas";
import { p45Migrar, p45Vazio } from "@/apps/montagem/domain/plano45-60";
import { exDemo, exMigrar } from "@/apps/montagem/domain/expositores";
import { eqDemo, eqMigrar } from "@/apps/montagem/domain/equipes";
import { infDemo, infMigrar } from "@/apps/montagem/domain/informativos";
import { pkDemo, pkMigrar } from "@/apps/montagem/domain/preferencias-kit";
import { grDemo, grMigrar } from "@/apps/montagem/domain/garantias-rev";
import { esDemo, esMigrar } from "@/apps/montagem/domain/estoque-sorelly";
import { avDemo, avMigrar } from "@/apps/montagem/domain/avaliacoes";
import { prDemo, prMigrar } from "@/apps/montagem/domain/producao";
import { cpcDemo, cpcMigrar } from "@/apps/montagem/domain/cadastro-pecas";
import { ppDemo, ppMigrar } from "@/apps/montagem/domain/pedidos-pecas";
import { bonusNickolas } from "@/apps/montagem/domain/contas-empresa";
import { ffDemo, ffLocal } from "@/apps/montagem/domain/financeiro-familiar";
import { HISTORICO0, PERFIL_MARCIA, REGISTROS0, histDemo, kitNormalDayanne, novoDia } from "@/apps/montagem/domain/seed";
import { ATU_DIAS, FAT_DIA_LOCAL, acumularFaturamento, FAT_NF_LOCAL, PAGOS_LOCAL, saldosContas0 } from "@/apps/montagem/domain/saldos-contas";
import { CONTAS_CNPJ0, FISCAL0 } from "@/apps/montagem/domain/cnpjs";
import { INAD_FIN0, COMPRAS_INT0 } from "@/apps/montagem/domain/inadimplencia-fin";
import { VERSAO_CPD, CONTAS_PAGAR_DEMO, CONTAS_PAGAS_DIARIO_DEMO, FATURAMENTO_DIARIO_DEMO, META_MENSAL_DEMO, VENDIDO_PONTA_DEMO } from "@/apps/montagem/domain/financeiro";
import { agendaHojeDemo, revInternasDemo } from "@/apps/montagem/domain/revendedoras-internas";
import { REVENDEDORAS_DIARIO_DEMO } from "@/apps/montagem/domain/revendedoras-diario";
import { media3 } from "@/apps/montagem/domain/vendas";
import { hoje, hora, isoDia } from "@/apps/montagem/lib/format";

// revendedoras internas de demonstração; quem é Kit 100% Prata já entra com a modalidade no cadastro (perfisRev)
var VERSAO_REVINT = 5; // 3 = sem os 4 atendimentos de demonstração de hoje (a agenda agora vem da lista de 14, 15 e 16/10)
function semearRevInternas(st){
  st.revInternas = revInternasDemo(); st.perfisRev = Object.assign({}, st.perfisRev); st.revIntV = VERSAO_REVINT;
  var vig = versaoVigente(st), agora = Date.now();
  var hojeDemo = [];   // agendaHojeDemo(...) desligada: a agenda de hoje vem de domain/internos-demo.js
  st.internos = hojeDemo.concat((st.internos||[]).filter(function(x){ return !x.demoHoje; }));
  if(hojeDemo.length){ st.intAbas = hojeDemo.slice(0,2).map(function(x){ return x.id; }); st.intSel = hojeDemo[0].id; }   // abre os dois primeiros de hoje, sem preenchimento
  st.revInternas.forEach(function(r){ if(r.prata && !(st.perfisRev[r.nome]||{}).modalidade) st.perfisRev[r.nome] = Object.assign({}, st.perfisRev[r.nome], {modalidade:"prata"}); });
}
var VERSAO_LISTAGENS = 12; // 9 = 4 representantes (Dayanne, Lysie, Jessica e Thalita), 3 acertos a realizar cada, nada bipado
var VERSAO_REPS = 2; // 2 = só 4 representantes (Dayanne, Lysie, Jessica e Thalita) nas avaliações, recusas e virada do mês
var CHAVE = "sorelly_montagem_v9"; // v4: tipos de item, condicionais, kit novo e retirada pelo app
// 20/10/2026 (Marcus): acumulado do mês dia 1 a 15 = 791 acertos e R$ 630.605,94; dia 1 a 16 = 868 e R$ 689.631,19; dia 19 = 1.008 e R$ 789.350,24 (17 e 18 foram fim de semana). O "Hoje" provisório sai: vale o fixado. Registro em FATURAMENTO-DIARIO.md
function aplicaFat20(s){
  var rv = Object.keys(s.revendedorasDiario||{}).sort(), rvN = rv.length ? s.revendedorasDiario[rv[rv.length-1]] : 0, fd = Object.assign({}, s.faturamentoDiario), cpd = Object.assign({}, s.contasPagasDiario);
  var ACU = {"2026-10-15":[630605.94, 791], "2026-10-16":[689631.19, 868], "2026-10-17":[689631.19, 868], "2026-10-18":[689631.19, 868], "2026-10-19":[789350.24, 1008]}, DIA = {"2026-10-15":[100029.55, 123], "2026-10-16":[59025.25, 77], "2026-10-17":[0, 0], "2026-10-18":[0, 0], "2026-10-19":[99719.05, 140]};
  Object.keys(ACU).forEach(function(k){ fd[k] = Object.assign({}, fd[k], {recebido:ACU[k][0], acertos:ACU[k][1], revendedoras:(fd[k]||{}).revendedoras || rvN, fixadoEm:Date.now()}); cpd[k] = Object.assign({cnpjs:{}, contasPorFora:0}, cpd[k], {faturado:DIA[k][0], acertos:DIA[k][1]}); });
  s.faturamentoDiario = fd; s.contasPagasDiario = cpd; s.fatHoje = null; s.fatHoje19V = Math.max(s.fatHoje19V||0, 3); s.fechaMes = Object.assign({"2026-10":{aRealizar:908, carregar:16}}, s.fechaMes); s.metaPct = s.metaPct || 97;   // previstos do Marcus: 16 do Carregar + 908 a realizar; previsão a 96/97/98%, valendo 97
  return s;
}
// 20/10/2026, "Hoje" (acompanhamento, passado pelo Marcus): 1.120 acertos, R$ 887.486,78 acumulado do mês, média R$ 792,40; 7 vendas no Carregar sem valor (contam como feitas, fora da média); 783 acertos a realizar. Total do mês = 1.120 + 7 + 783 = 1.910. Previsão a 97%. Registro em FATURAMENTO-DIARIO.md
// 21/10/2026 (Marcus): 20/10 FIXADO = 1.124 acertos e R$ 888.787,53 acumulados no mês (média R$ 790,74); dia 20 = 116 acertos e R$ 99.437,29. O "Hoje" provisório de 20/10 sai. Carregar (7) e a realizar (783) seguem valendo até ele mandar outros.
// 22/10/2026 (Marcus): 21/10 FECHADO = 1.176 acertos e R$ 928.995,38 acumulados no mês (média R$ 789,96); dia 21 = 52 acertos e R$ 40.207,85. O "Hoje" provisório sai. Carregar (7) e a realizar (783) seguem os últimos que ele passou. Registro em FATURAMENTO-DIARIO.md
function aplicaFat21(s){
  var rv = Object.keys(s.revendedorasDiario||{}).sort(), rvN = rv.length ? s.revendedorasDiario[rv[rv.length-1]] : 0, k = "2026-10-21";
  s.faturamentoDiario = Object.assign({}, s.faturamentoDiario); s.faturamentoDiario[k] = Object.assign({}, s.faturamentoDiario[k], {recebido:928995.38, acertos:1176, revendedoras:(s.faturamentoDiario[k]||{}).revendedoras || rvN, fixadoEm:Date.now()});
  s.contasPagasDiario = Object.assign({}, s.contasPagasDiario); s.contasPagasDiario[k] = Object.assign({cnpjs:{}, contasPorFora:0}, s.contasPagasDiario[k], {faturado:40207.85, acertos:52});
  if(s.fatHoje && s.fatHoje.data<=k) s.fatHoje = null;
  return s;
}
function aplicaFat20b(s){
  var rv = Object.keys(s.revendedorasDiario||{}).sort(), rvN = rv.length ? s.revendedorasDiario[rv[rv.length-1]] : 0, k = "2026-10-20";
  s.faturamentoDiario = Object.assign({}, s.faturamentoDiario); s.faturamentoDiario[k] = Object.assign({}, s.faturamentoDiario[k], {recebido:888787.53, acertos:1124, revendedoras:(s.faturamentoDiario[k]||{}).revendedoras || rvN, fixadoEm:Date.now()});
  s.contasPagasDiario = Object.assign({}, s.contasPagasDiario); s.contasPagasDiario[k] = Object.assign({cnpjs:{}, contasPorFora:0}, s.contasPagasDiario[k], {faturado:99437.29, acertos:116});
  if(s.fatHoje && s.fatHoje.data<=k) s.fatHoje = null;
  return s;
}
// 22/10/2026 (Marcus, à noite): "Hoje" (acompanhamento) = 1.241 acertos, R$ 982.434,43 acumulados no mês, média R$ 791,65 (dia 22 = 65 acertos e R$ 53.439,05 sobre o fechamento de 21/10). Vira o oficial do dia 22 quando o Marcus fechar. Carregar (7) e a realizar (783) seguem os últimos que ele passou. Registro em FATURAMENTO-DIARIO.md
function aplicaHoje22(s){
  s.fatHoje = {data:"2026-10-22", recebido:982434.43, acertos:1241, em:Date.now()};
  return s;
}
// 22/10/2026: previsto de contas a pagar lido do admin antigo (faturamento_contas_mes, atualizado 22/10 20:21): outubro pagas R$ 1.141.034,30 + a pagar R$ 379.495,29; novembro a pagar R$ 1.451.402,56; dezembro a pagar R$ 1.500.553,11. O pago de outubro na tela continua sendo a soma dos dias lançados (regra de 09/10).
function aplicaContas22(s){
  s.contasPagar = Object.assign({}, s.contasPagar); var a = Object.assign({}, s.contasPagar["2026"] || {});
  a[9] = {pago:1141034.30, apagar:379495.29, fixado:false}; a[10] = {pago:0, apagar:1451402.56, fixado:false}; a[11] = {pago:0, apagar:1500553.11, fixado:false};
  s.contasPagar["2026"] = a; return s;
}
function aplicaHoje20(s){
  s.fatHoje = {data:"2026-10-20", recebido:887486.78, acertos:1120, em:Date.now()};
  s.fechaMes = Object.assign({}, s.fechaMes, {"2026-10":{aRealizar:783, carregar:7}}); s.metaPct = s.metaPct || 97;
  return s;
}
// 20/10/2026: contas pagas de TODOS os dias de outubro iguais à tela contas-diario do admin antigo (total R$ 810.459,59). Vale sobre o que veio de outras fontes.
function aplicaPagosAdmin(s){
  if(!PAGOS_LOCAL) return s;
  var cpd = Object.assign({}, s.contasPagasDiario);
  Object.keys(PAGOS_LOCAL).forEach(function(d){ var p = PAGOS_LOCAL[d]; cpd[d] = Object.assign({cnpjs:{}, contasPorFora:0}, cpd[d], {cnpjs:Object.assign({}, p.cnpjs), contasPorFora:p.contasPorFora}); });
  Object.keys(cpd).forEach(function(d){ if(d>"2026-10-19" && d<"2026-11" && !PAGOS_LOCAL[d]) delete cpd[d]; });   // dias de exemplo depois do último dia pago no admin (20 e 30/10) saem
  s.contasPagasDiario = cpd; return s;
}
function novo(){
  var d = novoDia();
  var rv0 = novaVersaoRegras();
  var st = {v:4, cfg:JSON.parse(JSON.stringify(CFG0)), montadoras:JSON.parse(JSON.stringify(MONTADORAS)),
    regrasConsignado:{versoes:[rv0], atualId:rv0.id}, acertosConsignado:[], entregasKN:{}, comis:JSON.parse(JSON.stringify(COMIS0)), internos:[], formasPagamento:formasPagamentoPadrao(),
    listagens:d.listagens, kits:d.kits, registros:REGISTROS0.slice(), historico:HISTORICO0.slice(), histListagens:histDemo(), histV:3, repsV:VERSAO_REPS, novas:JSON.parse(JSON.stringify(NOVAS0)), retPend:[],
    avalRep:avalRepDemo(), recusas:RECUSAS0.slice(), virada:JSON.parse(JSON.stringify(VIRADA0)), bloqueioNovas:{Jessica:true},
    perfisRev:{
      "Simone Prestes":{profissao:"Manicure", fone1:"(41) 00000-0041", agendado:{data:(function(){ var x = new Date(); x.setDate(x.getDate()+2); return isoDia(x); })(), hora:"10:00"}},
      "Andrielle Taborda":{profissao:"Nail Designer", enderecoTrabalho:"Studio Bella Nails · Rua Francisco Derosso, 2145 - Xaxim, Curitiba - PR",
        condicionaisAbertas:[{numero:"091719", pecas:131},{numero:"092240", pecas:6},{numero:"099999", pecas:100}],
        expositores:[{id:"exp-acrilico", nome:"Expositor acrílico grande", qtd:1},{id:"exp-pulseira", nome:"Expositor de pulseira", qtd:1}]},
      "Beatriz Nogueira":{profissao:"Nail Designer", enderecoCasa:"Rua Fictícia S, 210 - Centro, Curitiba - PR", enderecoTrabalho:"Studio Bella Nails · Rua Francisco Derosso, 2145 - Xaxim, Curitiba - PR", fone1:"(41) 00000-0088", fone2:"(41) 99900-0088", refs:[{nome:"Maria Aparecida", rel:"Mãe", fone:"(41) 99812-3344"}, {nome:"João Carlos", rel:"Esposo", fone:"(41) 98745-6120"}, {nome:"Rosângela Silva", rel:"Irmã", fone:"(41) 99133-8870"}]},
      "Márcia Camargo":JSON.parse(JSON.stringify(PERFIL_MARCIA)),
      "Silvana Ramos":{profissao:"Cabeleireira", enderecoTrabalho:"Studio Concept Hair · Rua Chile, 1670 - Rebouças, Curitiba - PR"},
      "Amanda Ribeiro":{profissao:"Gerente de Loja", enderecoTrabalho:"Boutique Maison · Avenida República Argentina, 2870 - Portão, Curitiba - PR"},
      "Daniela Moreira":{profissao:"Desempregada", enderecoTrabalho:"Não se aplica"}
    },
    contasPagar:JSON.parse(JSON.stringify(CONTAS_PAGAR_DEMO)), verFinanceiro:"total",
    faturamentoDiario:JSON.parse(JSON.stringify(FATURAMENTO_DIARIO_DEMO)), metaMensal:JSON.parse(JSON.stringify(META_MENSAL_DEMO)),
    revendedorasDiario:JSON.parse(JSON.stringify(REVENDEDORAS_DIARIO_DEMO)), vendidoPonta:JSON.parse(JSON.stringify(VENDIDO_PONTA_DEMO)),
    contasPagasDiario:JSON.parse(JSON.stringify(CONTAS_PAGAS_DIARIO_DEMO)), inadFin:JSON.parse(JSON.stringify(INAD_FIN0)), comprasInt:JSON.parse(JSON.stringify(COMPRAS_INT0)), cpdV:VERSAO_CPD, negPix:{Thalita:{modo:"pct", valor:100, vigencia:"fixo", mes:"", extra:0, extraTxt:""}}, fatHojeV:8, fatHoje:null, fat14FixV:2, rev14V:1, fatHoje14V:1, revAtualizadoEm:{"2026-10-14":1792022400000},
    saldosContas:saldosContas0(), saldosV:10,     fiscal:JSON.parse(JSON.stringify(FISCAL0)), contasCnpj:JSON.parse(JSON.stringify(CONTAS_CNPJ0)),
    avisosCfg:{media_alta:[11,16,17]}, alertas:[],
    mesFechado:null, visao:"supervisao", bipadora:9, usuario:16, logado:true, aba:"painel", celular:1, telaCel:"proximo",
    abertas:{L1:true, L2:true}, kitAberto:null, extrato:null, filtroReg:"todas", aviso:null, demoAcertos:VERSAO_DEMO, demoListagens:VERSAO_LISTAGENS, lysieDemoV:1, lysieNovasV:1, dayanneNormalV:1};
  st.acertosConsignado = acertosDemo(st);   // 10 acertos do mês (pedido do Marcus)
  if(FAT_DIA_LOCAL){ st.fatDiaV = 3; st.fatDia = Object.assign({}, FAT_DIA_LOCAL); st.faturamentoDiario = acumularFaturamento(st.fatDia, st.faturamentoDiario); }   // acertos e faturamento de 01 a 13/10 dia a dia, também no estado novo
  st.fatHoje = {data:"2026-10-15", recebido:603200.74, acertos:755, em:Date.now()}; st.fat15V = 1;   // hoje (15/10), acompanhamento do dia
  st.datasPag = {geral:15, setores:{}};   // dia do mês em que as comissões são pagas (Financeiro → Comissões → Datas de pagamento)
  st.pf = pfInicial();   // Pagamentos a fornecedores: dados reais do arquivo local (ou vazio)
  st.rot = rotDemo();   // Rotina do dia: combinados por pessoa e checks
  st.cf = cfDemo();   // Cobrança de funcionárias (vazio)
  st.cl = clDemo();   // Aprovação de cadastros (vazio; dados reais só no arquivo local)
  st.ind = indDemo();   // Indicações (vazio; dados reais só no arquivo local)
  st.ex = exDemo();   // Expositores (vazio; dados reais só no arquivo local)
  st.lp = lpDemo();   // Link de pagamento e maquininhas (vazio; dados reais só no arquivo local)
  st.er = erDemo();   // Encomendas e reposições (vazio; dados reais só no arquivo local)
  st.p45 = p45Vazio();   // Agendamento → Plano 45/60 (vazio; dados reais só no arquivo local)
  st.ga = gaDemo();   // Garantia (só o link do site externo)
  st.mk = mkDemo();   // Marketing (vazio; dados reais só no arquivo local)
  st.ce = ceDemo();   // Compras e Estoque interno de materiais (vazio; dados reais só no arquivo local)
  st.fx = fxDemo();   // Fiscal (vazio; dados reais só no arquivo local)
  st.inf = infDemo();   // Folders e informativos dos apps da revendedora e da representante
  st.eq = eqDemo();   // Equipes: departamentos sem pessoas (pessoas reais só no arquivo local)
  st.gr = grDemo();   // Garantias e condicionais do app da revendedora (reclamações; chave das condicionais)
  st.pk = pkDemo();   // Preferências do Kit (vazio; dados reais só no arquivo local)
  st.av = avDemo();   // Avaliações (vazio; dados reais só no arquivo local)
  st.es = esDemo();   // Estoque Sorelly (geral de peças; vazio, dados reais só no arquivo local)
  st.cpc = cpcDemo();   // Cadastro de peças (lotes, custo e preço; vazio, dados de teste só no arquivo local)
  st.pp = ppDemo();   // Pedidos de peças da produção ao cadastro (vazio)
  st.pr = prDemo();   // Produção de peças (vazio; dados reais só no arquivo local)
  st.px = pxDemo();   // Chaves Pix e regras (contas automáticas do atendimento interno)
  st.dp = dpDemo(); st.cp = cpAjustar(cpDemo()); st.cpV3 = 1;   // Controle de pagamentos (Financeiro): destinos e orientações
  st.cpe = {classe:{}, lanc:bonusNickolas()};   // Contas a pagar: o que o Marcus marcou como Sorelly ou Família em cada conta do DevMaster
  st.ff = ffDemo();   // Financeiro Familiar: vazio (só os sócios lançam)
  st.rh = rhDemo();   // Recursos Humanos: configurador padrão, sem presença lançada
  st.metasSet = metasPadrao();   // metas mensais do Cadastro e da Inadimplência (Financeiro → Comissões)
  st.agend = agendDemo(st);   // setor de Agendamento: meses fechados, mês aberto, cotas e saldos de demonstração
  var di = internosDemo(st); st.internos = di.internos; st.acertosConsignado = st.acertosConsignado.concat(di.acertos); st.lancFin = di.lancFin; st.intAbas = []; st.intSel = null; st.demoInternos = VERSAO_INTERNOS; var tdn = termosDemo(st); Object.keys(tdn).forEach(function(n){ st.perfisRev[n] = Object.assign({}, st.perfisRev[n], tdn[n]); });   // listagem do atendimento interno (02/10 feita, 05/10 agenda)
  semearRevInternas(st);   // depois dos internos de demonstração: coloca 4 atendimentos marcados para hoje
  st.pk = pkSemearDemo(st).pk;   // Preferências do kit: ~65% das revendedoras já preenchidas (demonstração)
  if(TEM_CHAVES_ADMIN){ st.px = pxAplicarChavesAdmin(st.px, st.saldosContas.contas, "Marcus", Date.now()); st.pixAdminV = 2; st.cp = cpAplicarExtras(st.cp, "Marcus", Date.now()); st.pixExtrasV = 2; }   // chaves Pix lidas do admin antigo (bancos, pessoal, prestador e fornecedores)
  if(RH_STAMP){ st.rh = rhAplicarAdmin(st.rh); st.rhAdminStamp = RH_STAMP; }   // presença do RH lida do admin antigo
  aplicaPagosAdmin(st); st.cpdAdminV = 2; st.cpdLocalV = 2;
  aplicaFat20(st); st.fat20FixV = 1; aplicaHoje20(st); st.hoje20V = 1; aplicaFat20b(st); st.fat20bV = 1; aplicaFat21(st); st.fat21V = 1; aplicaHoje22(st); st.hoje22V = 1; aplicaContas22(st); st.cp22V = 1;   // faturamento fixado até 19/10 (também no estado novo)
  st.filaSimV = 3; st.filaSimulada = Math.max(0, 10 - filaRetornos(st).length); st.filaNivel = -1; st.alertas = (st.alertas||[]).filter(function(x){ return x.tipo!=="fila_retorno"; }); st = aplicaFila(st);   // 14/10/2026: só 10 kits aguardando bipagem (sem alerta)
  return st;
}
function inicial(){
  try { var j = localStorage.getItem(CHAVE); if(j){ var s = JSON.parse(j); if(s && s.v===4){ s.aviso=null;
    // listagens de demonstração antigas são trocadas pelas novas (dias 6, 7 e 8, nada bipado)
    if(s.demoListagens!==VERSAO_LISTAGENS){ var dn = novoDia(); s.listagens = dn.listagens; s.kits = dn.kits; s.retPend = []; s.entregasKN = {}; s.abertas = {L1:true, L2:true}; s.kitAberto = null; s.demoListagens = VERSAO_LISTAGENS; s.perfisRev = Object.assign({}, s.perfisRev, {"Beatriz Nogueira":{profissao:"Nail Designer", enderecoCasa:"Rua Fictícia S, 210 - Centro, Curitiba - PR", enderecoTrabalho:"Studio Bella Nails · Rua Francisco Derosso, 2145 - Xaxim, Curitiba - PR", fone1:"(41) 00000-0088", fone2:"(41) 99900-0088", refs:[{nome:"Maria Aparecida", rel:"Mãe", fone:"(41) 99812-3344"}, {nome:"João Carlos", rel:"Esposo", fone:"(41) 98745-6120"}, {nome:"Rosângela Silva", rel:"Irmã", fone:"(41) 99133-8870"}]}}); }
    // campos novos da configuração entram com o padrão em dados já salvos
    ["tabelaAtiva","tabelaKitBaixo","minVendaApp","limiteMelhores","categorias","pecasKit","pecasSugCat","reposicaoMax","limiteMarcus","limiteAnaliseVendas","comissoesRev","limiteEncomendas","limiteMesaMaior"].forEach(function(f){ if(s.cfg[f]===undefined) s.cfg[f] = JSON.parse(JSON.stringify(CFG0[f])); });
    // 20/10/2026: setor Encomendas acabou; as 3 montam de R$ 3.000 para cima e a mesa maior (Agatha) fica com vendas acima de R$ 4.000 (uma vez só, depois o Configurador manda)
    if(!s.cfg.encMesa20){ s.cfg.limiteEncomendas = CFG0.limiteEncomendas; s.cfg.limiteMesaMaior = CFG0.limiteMesaMaior; s.cfg.encMesa20 = true; }
    aplicaFaixas(s.cfg);   // 20/10/2026: anéis em faixa (mínimo a máximo)
    // 20/10/2026: no estoque baixo, vendas a partir de R$ 4.000 mantêm o valor do estoque alto (uma vez só, depois o Configurador manda)
    if(!s.cfg.baixoAlto4000){ (s.cfg.tabelaKitBaixo||[]).forEach(function(b){ if(b.min>=4000){ var a = (s.cfg.tabelaKit||[]).find(function(x){ return x.min===b.min; }); if(a) b.kit = a.kit; } }); s.cfg.baixoAlto4000 = true; }
    // 19/10/2026: as 3 montadoras do setor Encomendas (Elen, Agatha, Eduarda Gabriela) entram em quem já tem estado salvo
    MONTADORAS.filter(function(m){ return m.encomendas; }).forEach(function(m){ var ex = (s.montadoras||[]).find(function(x){ return x.id===m.id; }); if(!ex) s.montadoras.push(JSON.parse(JSON.stringify(m))); else ex.encomendas = true; });
    ["valorBipNormal","valorBipEspecial","limiteBipEspecial","perdaFalta"].forEach(function(f){ if(s.cfg[f]===undefined) s.cfg[f] = CFG0[f]; });
    // histórico antigo (sem data completa e sem kits) é trocado pela demonstração nova; o que foi concluído de verdade fica
    // histórico de demonstração v2 (4 a 5 listagens por representante); o que foi concluído de verdade hoje fica
    if(s.histV!==3){ s.histListagens = (s.histListagens||[]).filter(function(h){return h.hoje && h.lid;}).concat(histDemo()); s.histV = 3; }
    if(!s.revInternas || s.revIntV!==VERSAO_REVINT) semearRevInternas(s);
    if(!s.avisosCfg) s.avisosCfg = {media_alta:[11,16,17]};
    if(!s.alertas) s.alertas = [];
    if(s.cfg.prazoPedidoHoras===undefined) s.cfg.prazoPedidoHoras = 48;
    ["perdaRecusa","recusasBloqueio","perdaDiaParado","diasParadosTolerancia"].forEach(function(f){ if(s.cfg[f]===undefined) s.cfg[f] = CFG0[f]; });
    if(s.repsV!==VERSAO_REPS){ s.repsV = VERSAO_REPS; s.avalRep = avalRepDemo(); s.recusas = RECUSAS0.slice(); s.virada = JSON.parse(JSON.stringify(VIRADA0)); s.bloqueioNovas = {Jessica:true}; }
    if(!s.avalRep){ s.avalRep = avalRepDemo(); s.recusas = RECUSAS0.slice(); s.virada = JSON.parse(JSON.stringify(VIRADA0)); s.bloqueioNovas = {Jessica:true}; }
    if(!s.contasPagar){ s.contasPagar = JSON.parse(JSON.stringify(CONTAS_PAGAR_DEMO)); s.verFinanceiro = "total"; }
    if(!s.faturamentoDiario) s.faturamentoDiario = JSON.parse(JSON.stringify(FATURAMENTO_DIARIO_DEMO));
    if(!s.revendedorasDiario) s.revendedorasDiario = JSON.parse(JSON.stringify(REVENDEDORAS_DIARIO_DEMO));
    if(!s.vendidoPonta) s.vendidoPonta = JSON.parse(JSON.stringify(VENDIDO_PONTA_DEMO));
    if(!s.metaMensal) s.metaMensal = JSON.parse(JSON.stringify(META_MENSAL_DEMO));
    if(!s.contasPagasDiario) s.contasPagasDiario = JSON.parse(JSON.stringify(CONTAS_PAGAS_DIARIO_DEMO));
    if(!s.inadFin) s.inadFin = JSON.parse(JSON.stringify(INAD_FIN0));
    if(!s.comprasInt) s.comprasInt = JSON.parse(JSON.stringify(COMPRAS_INT0));
    // dias de outubro passados pelo Marcus (contas pagas por CNPJ, faturado e acertos) e o registro oficial de 08/10 entram nos dados já salvos
    if(s.cpMesV!==2){ s.cpMesV = 2; s.contasPagar = s.contasPagar || {}; s.contasPagar["2026"] = JSON.parse(JSON.stringify(CONTAS_PAGAR_DEMO["2026"])); }   // outubro/2026 da Nayale
    if(s.setembroTravadoV!==1){ s.setembroTravadoV = 1; var r30 = (s.faturamentoDiario||{})["2026-09-30"] || {}; s.faturamentoDiario = Object.assign({}, s.faturamentoDiario, {"2026-09-30":Object.assign({}, r30, {recebido:1427724.88, acertos:1778, revendedoras:r30.revendedoras||2023, travado:true})}); }   // Setembro travado
    if(FAT_NF_LOCAL && s.fatNFV!==1){ s.fatNFV = 1; Object.keys(FAT_NF_LOCAL).forEach(function(d){ if(s.faturamentoDiario && s.faturamentoDiario[d]) s.faturamentoDiario[d] = Object.assign({}, s.faturamentoDiario[d], {recebido:FAT_NF_LOCAL[d]}); }); }   // faturamento de setembro = relatório de notas fiscais
    if(PAGOS_LOCAL && s.cpdLocalV!==2){ s.cpdLocalV = 2; s.contasPagasDiario = s.contasPagasDiario || {}; Object.keys(PAGOS_LOCAL).forEach(function(d){ s.contasPagasDiario[d] = Object.assign({cnpjs:{}, contasPorFora:0, faturado:0}, s.contasPagasDiario[d], {cnpjs:Object.assign({}, PAGOS_LOCAL[d].cnpjs), contasPorFora:PAGOS_LOCAL[d].contasPorFora}); }); }   // contas pagas de 01 a 13/10 conferidas (arquivo local)
    if(s.cpdV!==VERSAO_CPD){ s.cpdV = VERSAO_CPD; Object.keys(CONTAS_PAGAS_DIARIO_DEMO).filter(function(k){ return k>="2026-10-01"; }).forEach(function(k){ s.contasPagasDiario[k] = JSON.parse(JSON.stringify(CONTAS_PAGAS_DIARIO_DEMO[k])); }); s.faturamentoDiario["2026-10-08"] = Object.assign({}, FATURAMENTO_DIARIO_DEMO["2026-10-08"]); }   // o faturamento de hoje NÃO é mexido aqui: vem da migração fatHojeV (13/10: R$ 355.743,30 e 473 acertos)
    // faturamento de hoje (13/10/2026, passado pelo Marcus): R$ 355.743,30 e 473 acertos (média R$ 752,10); provisório até fixar o dia
    if(s.fatHojeV!==8){ s.fatHojeV = 8; s.fatHoje = {data:"2026-10-14", recebido:475034.23, acertos:600, em:Date.now()}; s.revendedorasDiario = Object.assign({}, s.revendedorasDiario, {"2026-10-13":2069}); }   // 13/10 fechado: R$ 426.110,24, 526 acertos, 2.069 revendedoras
    if(FAT_DIA_LOCAL && s.fatDiaV!==3){ s.fatDiaV = 3; s.fatDia = Object.assign({}, s.fatDia, FAT_DIA_LOCAL); s.faturamentoDiario = acumularFaturamento(s.fatDia, s.faturamentoDiario); var ult = Object.keys(FAT_DIA_LOCAL).sort().pop(); s.fatHoje = {data:ult, recebido:s.faturamentoDiario[ult].recebido, acertos:s.faturamentoDiario[ult].acertos, em:Date.now()}; }   // faturamento de 01 a 13/10 dia a dia
    if(s.rev14V!==1){ s.rev14V = 1; s.revendedorasDiario = Object.assign({}, s.revendedorasDiario, {"2026-10-14":2077}); }   // 14/10/2026: 2.077 revendedoras (passado pelo Marcus)
    if(s.fatHoje14V!==1){ s.fatHoje14V = 1; s.fatHoje = {data:"2026-10-14", recebido:475034.23, acertos:600, em:Date.now()}; }   // "Hoje" de 14/10/2026 passado pelo Marcus: R$ 475.034,23 · 600 acertos · média R$ 791,72 (vem DEPOIS do faturamento dia a dia acima, que termina em 13/10)
    // 14/10/2026 FECHADO (passado pelo Marcus): R$ 530.573,39 acumulado do mês e 668 acertos; 2.077 revendedoras. Travado como registro oficial: a próxima atualização (hoje, 15/10) parte daqui.
    if(s.fat14FixV!==1){ s.fat14FixV = 1; var tf = Date.now(); s.faturamentoDiario = Object.assign({}, s.faturamentoDiario, {"2026-10-14":{recebido:530573.39, acertos:668, revendedoras:2077, fixadoEm:tf}}); s.revendedorasDiario = Object.assign({}, s.revendedorasDiario, {"2026-10-14":2077}); s.revAtualizadoEm = Object.assign({}, s.revAtualizadoEm||{}, {"2026-10-14":tf}); if(s.fatHoje && s.fatHoje.data==="2026-10-14") s.fatHoje = null; }
    // 15/10/2026 FECHADO (passado pelo Marcus): R$ 630.605,94 acumulado do mês, 791 acertos, média R$ 797,23; 2.078 revendedoras. O dia 15/10 sai pela diferença do 14/10 (R$ 100.032,55 e 123 acertos)
    if(s.fat15FixV!==1){ s.fat15FixV = 1; var tf15 = Date.now(); s.faturamentoDiario = Object.assign({}, s.faturamentoDiario, {"2026-10-15":{recebido:630605.94, acertos:791, revendedoras:2078, fixadoEm:tf15}}); s.revendedorasDiario = Object.assign({}, s.revendedorasDiario, {"2026-10-15":2078}); s.revAtualizadoEm = Object.assign({}, s.revAtualizadoEm||{}, {"2026-10-15":tf15}); s.contasPagasDiario = Object.assign({}, s.contasPagasDiario, {"2026-10-15":Object.assign({cnpjs:{}, contasPorFora:0}, (s.contasPagasDiario||{})["2026-10-15"], {faturado:100032.55, acertos:123})}); if(s.fatHoje && s.fatHoje.data<="2026-10-15") s.fatHoje = null; }
    // 19/10/2026 ATUAL ("Hoje", acompanhamento; passado pelo Marcus): R$ 733.699,19 acumulado do mês, 931 acertos, média R$ 788,08; 2.082 revendedoras
    // 19/10/2026, nova atualização do "Hoje" (passada pelo Marcus): R$ 776.012,44 · 980 acertos · média R$ 791,85
    if(!s.fatHoje19V){ s.fatHoje19V = 2; s.fatHoje = {data:"2026-10-19", recebido:776012.44, acertos:980, em:Date.now()}; s.revendedorasDiario = Object.assign({}, s.revendedorasDiario, {"2026-10-19":2082}); s.revAtualizadoEm = Object.assign({}, s.revAtualizadoEm||{}, {"2026-10-19":Date.now()}); }
    // 19/10/2026 (Marcus): 997 acertos, R$ 785.494,64, média R$ 787,86; 16 vendas do Carregar sem valor (contam como feitas) e 908 acertos a realizar no mês. Total do mês = 997+16+908 = 1.921 (no lugar dos 1.976 do Agendamento). Previsão por 96/97/98%, padrão 97.
    if(s.fatHoje19V!==3){ s.fatHoje19V = 3; s.fechaMes = Object.assign({}, s.fechaMes, {"2026-10":{aRealizar:908, carregar:16}}); s.metaPct = 97; }
    // 13/10/2026 fechou em R$ 426.110,24 e 526 acertos (passado pelo Marcus): vale este acumulado, e o dia 14/10 sai pela diferença (R$ 104.463,15 e 142 acertos)
    if(s.fat13FixV!==1){ s.fat13FixV = 1; var r13 = (s.faturamentoDiario||{})["2026-10-13"] || {}; s.faturamentoDiario = Object.assign({}, s.faturamentoDiario, {"2026-10-13":Object.assign({}, r13, {recebido:426110.24, acertos:526, revendedoras:2069})}); s.contasPagasDiario = Object.assign({}, s.contasPagasDiario, {"2026-10-14":Object.assign({cnpjs:{}, contasPorFora:0}, (s.contasPagasDiario||{})["2026-10-14"], {faturado:104463.15, acertos:142})}); }
    // 19/10/2026 (Marcus): acumulado do mês FIXADO até o dia 19: 1.008 acertos e R$ 789.350,24 (média R$ 783,09). Registro diário em FATURAMENTO-DIARIO.md
    if(s.fat19FixV!==1){ s.fat19FixV = 1; var fd19 = Object.assign({}, s.faturamentoDiario), ant19 = Object.keys(fd19).filter(function(k){ return k>="2026-10-01" && k<"2026-10-19"; }).sort(), rv19 = Object.keys(s.revendedorasDiario||{}).sort(); fd19["2026-10-19"] = Object.assign({}, fd19["2026-10-19"], {recebido:789350.24, acertos:1008, revendedoras:rv19.length ? s.revendedorasDiario[rv19[rv19.length-1]] : ((fd19["2026-10-19"]||{}).revendedoras||0), fixadoEm:Date.now()}); s.faturamentoDiario = fd19; if(ant19.length){ var p19 = fd19[ant19[ant19.length-1]]; s.contasPagasDiario = Object.assign({}, s.contasPagasDiario, {"2026-10-19":Object.assign({cnpjs:{}, contasPorFora:0}, (s.contasPagasDiario||{})["2026-10-19"], {faturado:Math.round((789350.24-(p19.recebido||0))*100)/100, acertos:1008-(p19.acertos||0)})}); } }
    // 20/10/2026 (Marcus): acumulado do mês dia 1 a 15 = 791 acertos e R$ 630.605,94; dia 1 a 16 = 868 e R$ 689.631,19; dia 19 = 1.008 e R$ 789.350,24 (17 e 18 foram fim de semana). O "Hoje" provisório de 19/10 sai: vale o fixado.
    if(s.fat20FixV!==1){ s.fat20FixV = 1; aplicaFat20(s); }
    if(s.hoje20V!==1){ s.hoje20V = 1; aplicaHoje20(s); }
    if(s.fat20bV!==1){ s.fat20bV = 1; aplicaFat20b(s); }
    if(s.fat21V!==1){ s.fat21V = 1; aplicaFat21(s); }
    if(s.hoje22V!==1){ s.hoje22V = 1; aplicaHoje22(s); }
    if(s.cp22V!==1){ s.cp22V = 1; aplicaContas22(s); }
    if(s.cpdAdminV!==2){ s.cpdAdminV = 2; aplicaPagosAdmin(s); }
    if(TEM_CHAVES_ADMIN && s.pixAdminV!==2 && s.px && s.saldosContas){ s.pixAdminV = 2; s.px = pxAplicarChavesAdmin(JSON.parse(JSON.stringify(s.px)), s.saldosContas.contas, "Marcus", Date.now()); }
    if(TEM_CHAVES_ADMIN && s.pixExtrasV!==2 && s.cp){ s.pixExtrasV = 2; s.cp = cpAplicarExtras(s.cp, "Marcus", Date.now()); }
    if(RH_STAMP && s.rhAdminStamp!==RH_STAMP && s.rh){ s.rh = rhAplicarAdmin(s.rh); s.rhAdminStamp = RH_STAMP; }
    // valor correto do fechamento de 14/10 (Marcus, 15/10): R$ 530.576,39 e 668 acertos, média R$ 794,28; o dia sai pela diferença do 13/10 (R$ 104.466,15 e 142 acertos). Sem arredondar.
    if(s.fat14FixV!==2){ s.fat14FixV = 2; var r14 = (s.faturamentoDiario||{})["2026-10-14"] || {}; s.faturamentoDiario = Object.assign({}, s.faturamentoDiario, {"2026-10-14":Object.assign({}, r14, {recebido:530576.39, acertos:668, revendedoras:2077, fixadoEm:r14.fixadoEm||Date.now()})}); s.contasPagasDiario = Object.assign({}, s.contasPagasDiario, {"2026-10-14":Object.assign({cnpjs:{}, contasPorFora:0}, (s.contasPagasDiario||{})["2026-10-14"], {faturado:104466.15, acertos:142})}); if(s.fatHoje && s.fatHoje.data==="2026-10-14") s.fatHoje = null; }
    if(s.fat15V!==1){ s.fat15V = 1; s.fatHoje = {data:"2026-10-15", recebido:603200.74, acertos:755, em:Date.now()}; }   // hoje (15/10): 755 acertos, R$ 603.200,74 recebido, média R$ 798,94 (o fechamento do dia 14 já está: 668 acertos, R$ 530.576,39)
    if(!s.rh) s.rh = rhDemo();
    if(!s.metasSet) s.metasSet = metasPadrao();
    if(!s.cpe) s.cpe = {classe:{}, lanc:[]}; if(!s.cpe.lanc) s.cpe.lanc = [];
    if(!s.cpeNick){ s.cpeNick = true; var ja = s.cpe.lanc.map(function(x){ return x.id; }); s.cpe = Object.assign({}, s.cpe, {lanc:s.cpe.lanc.concat(bonusNickolas().filter(function(x){ return ja.indexOf(x.id)<0; }))}); }   // bônus mensal do Nickolas (19/10/2026)
    if(!s.cpeNick2){ s.cpeNick2 = true; var vn = s.cpe.lanc.filter(function(x){ return !/^nick-/.test(x.id); }), jn = vn.map(function(x){ return x.id; }); s.cpe = Object.assign({}, s.cpe, {lanc:vn.concat(bonusNickolas().filter(function(x){ return jn.indexOf(x.id)<0; }))}); }   // dia 10 e 23, e o de 10/10 pago em dinheiro (20/10/2026)
    if(s.ff && !s.ffImp4){ s.ffImp4 = true; var ffZ = ffLocal(); if(ffZ){ var tira = ffZ.removerDividas||[]; s.ff.dividas = (s.ff.dividas||[]).filter(function(x){ return tira.indexOf(x.id)<0; });
      (ffZ.dividas||[]).filter(function(x){ return /^x_/.test(x.id) && !s.ff.dividas.some(function(k){ return k.id===x.id; }); }).forEach(function(x){ s.ff.dividas.push(x); });
      (ffZ.repasses||[]).filter(function(x){ return /^x_/.test(x.id) && !(s.ff.repasses||[]).some(function(k){ return k.id===x.id; }); }).forEach(function(x){ s.ff.repasses.push(x); }); } }   // 68 Gang (3 orçamentos), Amanda e demais ajustes passados pelo Marcus
    if(s.ff && !s.ffImp6){ s.ffImp6 = true; var ffV = ffLocal(); if(ffV && ffV.sync1){ var sy = ffV.sync1;   // atualização do admin antigo (21/10/2026): pagamentos de agosto e outubro e o Pix do Marcus passam a bater com o admin antigo
      (ffV.contas||[]).forEach(function(c){ if((sy.novas||[]).indexOf(c.id)>=0 && !s.ff.contas.some(function(k){ return k.id===c.id; })) s.ff.contas.push(c); });
      (sy.pares||[]).forEach(function(pr){ (ffV.contas||[]).filter(function(c){ return c.personaId===pr[0]; }).forEach(function(c){ var par = (ffV.parcelas[c.id]||{})[pr[1]]; if(par){ s.ff.parcelas[c.id] = s.ff.parcelas[c.id]||{}; s.ff.parcelas[c.id][pr[1]] = par; } }); });
      Object.keys(sy.contaCat||{}).forEach(function(id){ var cc = s.ff.contas.find(function(k){ return k.id===id; }); if(cc) cc.categoria = sy.contaCat[id]; });
      (sy.remover||[]).forEach(function(r){ if(s.ff.parcelas[r[0]]) delete s.ff.parcelas[r[0]][r[1]]; });
      (sy.pixAdd||[]).forEach(function(x){ if(!s.ff.pix.some(function(k){ return k.id===x.id; })) s.ff.pix.push(x); });
      if(!(s.ff.categorias||[]).some(function(c){ return c.chave==="PIX_ITAU_BLACK"; })) s.ff.categorias.push({chave:"PIX_ITAU_BLACK", nome:"Pix Itaú Black"});
      (sy.pixSet||[]).forEach(function(x){ var p = s.ff.pix.find(function(k){ return k.id===x.id; }); if(p) p.valor = x.valor; }); } }
    if(s.ff && !s.ffImp5){ s.ffImp5 = true; var ffW = ffLocal(); if(ffW){   // 68 Gang por código do orçamento (21/10/2026): cada dívida ganha código/título e cada envio aponta para a sua dívida
      (ffW.dividas||[]).filter(function(x){ return x.codigo || x.divId; }).forEach(function(x){ var at = (s.ff.dividas||[]).find(function(k){ return k.id===x.id; }); if(at) Object.assign(at, x); else s.ff.dividas.push(x); });
      (ffW.repasses||[]).filter(function(x){ return x.divId; }).forEach(function(x){ var at = (s.ff.repasses||[]).find(function(k){ return k.id===x.id; }); if(at) at.divId = x.divId; else s.ff.repasses.push(x); }); } }
    if(s.ff && !s.ffImp3){ s.ffImp3 = true; s.ff.pixMeta =Object.assign({}, s.ff.pixMeta, {"anabeatriz|2026-10":7000}); }   // Marcus (19/10/2026): meta de Pix revendedoras da Ana Beatriz sobe para R$ 7.000
    if(!s.ff) s.ff = ffDemo(); else if(!s.ffImp1){ s.ffImp1 = true; var ffR = ffLocal(); if(ffR && !(s.ff.contas||[]).length && !(s.ff.pix||[]).length) s.ff = ffR; }   // dados reais do familiar (só entra se o familiar ainda estiver vazio)
    if(s.ff && !s.ffImp3){ s.ffImp3 = true; var ffY = ffLocal(); if(ffY){ (ffY.dividas||[]).filter(function(x){ return /^x_/.test(x.id) && !(s.ff.dividas||[]).some(function(k){ return k.id===x.id; }); }).forEach(function(x){ s.ff.dividas.push(x); var pr = (s.ff.prest||[]).find(function(q){ return q.id===x.prestId; }); if(pr) pr.ativo = true; }); } }   // dívidas que o Marcus passou à mão (ex.: Amanda, total R$ 350)
    if(s.ff && !s.ffImp2){ s.ffImp2 = true; var ffX = ffLocal(); if(ffX){ ffX.contas.filter(function(c){ return /^x_/.test(c.id) && !s.ff.contas.some(function(k){ return k.id===c.id; }); }).forEach(function(c){ s.ff.contas.push(c); s.ff.parcelas[c.id] = ffX.parcelas[c.id]; }); } }   // contas que o Marcus passou e não existem no admin antigo (ex.: aluguel Uphills)
    if(!s.cp) s.cp = cpDemo();
    if(!s.dp) s.dp = dpDemo();   // Direcionar Pix (23/10/2026): pedidos de teste vindos das mensagens das atendentes
    if(s.cp && s.cpV3!==1){ s.cp = cpAjustar(s.cp); s.cpV3 = 1; }
    if(!s.px) s.px = pxDemo();
    s.px = pxMigrar(s.px, s);   // traz as contas Pix reais (sem chave) do arquivo local, uma vez
    s.rot = rotMigrar(s.rot);   // Rotina do dia
    s.cf = cfMigrar(s.cf);   // Cobrança de funcionárias: cria ou completa com os dados do arquivo local
    if(!s.cl) s.cl = clDemo();
    s.cl = clSemear(s.cl);   // 20 candidatas de demonstração na fila de aprovação (uma vez só)
    if(!s.ind) s.ind = indDemo();
    s.ex = exMigrar(s.ex);   // Expositores: cria vazio ou completa campos novos
    s.lp = lpMigrar(s.lp);
    // meta do Link de pagamento de OUTUBRO/2026 (Helen): Bronze 70 mil = R$ 300 até Diamante 88 mil = R$ 1.000 (substitui as faixas antigas da planilha)
    if(s.lpMetaV!==1){ s.lpMetaV = 1; s.lp.config = Object.assign({}, s.lp.config, {bonus:{faixas:[{min:88000, valor:1000}, {min:82500, valor:800}, {min:78000, valor:600}, {min:75000, valor:450}, {min:70000, valor:300}], obs:"Meta de outubro/2026 (Bronze, Prata, Ouro, Platina e Diamante). A meta muda todo mês: ajuste aqui."}}); }   // Link de pagamento e maquininhas: cria vazio ou completa campos novos
    s.er = erMigrar(s.er);   // Encomendas e reposições: cria vazio ou completa campos novos
    s.p45 = p45Migrar(s.p45);   // Agendamento → Plano 45/60: cria vazio ou completa campos novos
    s.ga = gaMigrar(s.ga);   // Garantia: cria com o link padrão ou completa campos novos
    s.mk = mkMigrar(s.mk);   // Marketing: cria vazio ou completa campos novos
    s.ce = ceMigrar(s.ce);   // Compras e Estoque de materiais: cria vazio ou completa campos novos
    s.fx = fxMigrar(s.fx);   // Fiscal: cria vazio ou completa campos novos
    s.inf = infMigrar(s.inf);   // Folders e informativos: cria com as regras do acerto ou completa campos novos
    s.eq = eqMigrar(s.eq);  // Equipes (organograma): cria com a estrutura ou completa campos novos
    s.gr = grMigrar(s.gr);   // Garantias do app da revendedora: cria vazio ou completa campos novos
    s.pk = pkMigrar(s.pk);   // Preferências do Kit: cria vazio ou completa campos novos
    s.av = avMigrar(s.av);   // Avaliações: cria vazio ou completa campos novos
    s.es = esMigrar(s.es);   // Estoque Sorelly: cria vazio ou completa campos novos
    s.cpc = cpcMigrar(s.cpc);   // Cadastro de peças: cria com os dados de teste ou completa campos novos
    s.pp = ppMigrar(s.pp);   // Pedidos de peças: cria vazio ou completa campos novos
    s.pr = prMigrar(s.pr);   // Produção de peças: cria vazio ou completa campos novos
    if(!s.pf) s.pf = pfInicial(); else if(!s.pf.prestSemeados || !s.pf.helcioSemeado || !s.pf.elloSemeado || !s.pf.mqImp2 || (!s.pf.atuV1 && TEM_ATU_PF) || (!s.pf.atuV2c && TEM_ATU_PF) || (!s.pf.atuV5 && TEM_ATU_PF) || (!s.pf.atuV10 && TEM_ATU_PF) || (!s.pf.atuV11 && TEM_ATU_PF) || (!s.pf.atuV3 && TEM_ATU_PF) || !s.pf.lcAjustado || s.pf.fornecedores.some(function(f){ return !f.tipo; })) s.pf = pfMigrar(JSON.parse(JSON.stringify(s.pf)));
    if(s.rh && !s.rh.contratos){ s.rh.contratos = []; s.rh.modelos = []; s.rh.colunasRep = []; }   // Contratos do RH chegaram depois
    if(!s.datasPag) s.datasPag = {geral:15, setores:{}};
    if(!s.agend) s.agend = agendDemo(s);
    if(s.agend && !s.agend.remarc){ s.agend.remarc = []; s.agend.diario = undefined; s.agend.v = 2; }   // v2: acertos realizados vêm do faturamento; remarcações entram   // Agendamento (acertos) chegou depois: monta com o que já existe
    if(s.agend && s.agend.config && !s.agend.sabrinaSaiu){ s.agend.sabrinaSaiu = true; (s.agend.config.representantes||[]).forEach(function(r){ if(/^Sabrina da Silva/.test(r.nome)) r.ativo = false; }); }   // Sabrina saiu da empresa (19/10/2026): fica no histórico, sem cota
    if(s.reposV!==1){ s.reposV = 1; if(s.comis && s.comis.reposicao===15) s.comis.reposicao = 20; }   // reposição entregue passou de R$ 15 para R$ 20 (20/10/2026); quem já salvou outro valor não muda
    if(s.dayanneNormalV!==1){ s.dayanneNormalV = 1; var lDay = (s.listagens||[]).find(function(x){ return x.rep==="Dayanne"; });
      if(lDay && !(s.kits||[]).some(function(k){ return k.rev==="Márcia Camargo"; })){ var lDay2 = Object.assign({}, lDay), kDay = kitNormalDayanne(lDay2); s.listagens = s.listagens.map(function(x){ return x.id===lDay.id ? lDay2 : x; }); s.kits = (s.kits||[]).concat([kDay]); }
      s.perfisRev = Object.assign({}, s.perfisRev, {"Márcia Camargo":Object.assign({}, PERFIL_MARCIA, (s.perfisRev||{})["Márcia Camargo"])}); }
    if(s.lysieNovasV!==1){ s.lysieNovasV = 1; var nv0 = (s.novas||[]).slice(); NOVAS0.filter(function(n){ return n.rep==="Lysie" && !nv0.some(function(x){ return x.id===n.id; }); }).forEach(function(n){ nv0.push(JSON.parse(JSON.stringify(n))); }); s.novas = nv0; }
    if(s.lysieDemoV!==1){ s.lysieDemoV = 1; var dSim = new Date(); dSim.setDate(dSim.getDate()+2); s.perfisRev = Object.assign({}, s.perfisRev, {"Simone Prestes":Object.assign({}, (s.perfisRev||{})["Simone Prestes"], {agendado:{data:isoDia(dSim), hora:"10:00"}, profissao:"Manicure", fone1:"(41) 00000-0041"})}); }
    if(!s.negPix) s.negPix = {Thalita:{modo:"pct", valor:100, vigencia:"fixo", mes:"", extra:0, extraTxt:""}};   // negociação do Pix direto: Thalita recebe 100% da comissão por Pix direto
    if(!s.regrasConsignado){ var rv0b = novaVersaoRegras(); s.regrasConsignado = {versoes:[rv0b], atualId:rv0b.id}; }
    else s.regrasConsignado = Object.assign({}, s.regrasConsignado, {versoes:(s.regrasConsignado.versoes||[]).map(normalizarVersao)});
    // exemplo de condicionais em aberto (demonstração) para a Andrielle, caso o estado salvo seja anterior a ele
    if(s.perfisRev && s.perfisRev["Andrielle Taborda"] && !s.perfisRev["Andrielle Taborda"].condicionaisAbertas)
      s.perfisRev["Andrielle Taborda"].condicionaisAbertas = [{numero:"091719", pecas:131},{numero:"092240", pecas:6},{numero:"099999", pecas:100}];
    if(s.perfisRev && s.perfisRev["Andrielle Taborda"] && !s.perfisRev["Andrielle Taborda"].expositores)
      s.perfisRev["Andrielle Taborda"].expositores = [{id:"exp-acrilico", nome:"Expositor acrílico grande", qtd:1},{id:"exp-pulseira", nome:"Expositor de pulseira", qtd:1}];
    if(!s.fiscal || !s.fiscal.hist) s.fiscal = JSON.parse(JSON.stringify(FISCAL0));
    if(!s.saldosContas || s.saldosV!==10){ var scAntes = s.saldosContas, scNovo = saldosContas0(); s.saldosV = 10; if(scAntes){ Object.keys(scAntes.saldos||{}).forEach(function(k){ if(k>"2026-10-13" && ATU_DIAS.indexOf(k)<0) scNovo.saldos[k] = scAntes.saldos[k]; }); scNovo.fechamentos = scAntes.fechamentos || {}; if(scAntes.contas){ var cSeed = scNovo.contas; scNovo.contas = scAntes.contas.slice(); cSeed.forEach(function(c){ if(!scNovo.contas.some(function(x){ return x.id===c.id; })) scNovo.contas.push(c); }); } if(scAntes.blocos){ var bSeed = scNovo.blocos; scNovo.blocos = scAntes.blocos.slice(); bSeed.forEach(function(b){ if(!scNovo.blocos.some(function(x){ return x.id===b.id; })){ var ib = scNovo.blocos.findIndex(function(x){ return x.id==="BLOQ"; }); scNovo.blocos.splice(ib<0 ? scNovo.blocos.length : ib, 0, b); } }); } scNovo.aportes = scAntes.aportes || {}; } s.saldosContas = scNovo; }   // v2: contas, limites e saldos reais de 30/09 e 13/10
    if(!s.contasCnpj) s.contasCnpj = JSON.parse(JSON.stringify(CONTAS_CNPJ0));
    if(!s.acertosConsignado) s.acertosConsignado = [];
    if(!s.internos) s.internos = [];
    if(!s.entregasKN) s.entregasKN = {};
    if(!s.lancFin) s.lancFin = [];
    if(s.demoInternos!==VERSAO_INTERNOS){ s.demoInternos = VERSAO_INTERNOS; var di2 = internosDemo(s); s.intAbas = []; s.intSel = null; s.lancFin = di2.lancFin.concat((s.lancFin||[]).filter(function(x){ return !x.demo; }));
      s.internos = di2.internos.concat(s.internos.filter(function(x){ return !x.demo; }));
      s.acertosConsignado = s.acertosConsignado.filter(function(r){ return !(r.demo && r.origem==="interno"); }).concat(di2.acertos);
      if(!s.perfisRev) s.perfisRev = {}; if(s.perfisRev["Camille Vitória Peixoto"] && (s.perfisRev["Camille Vitória Peixoto"].termoConsignado||{}).origem==="interno"){ s.perfisRev["Camille Vitória Peixoto"] = Object.assign({}, s.perfisRev["Camille Vitória Peixoto"]); delete s.perfisRev["Camille Vitória Peixoto"].termoConsignado; } var td2 = termosDemo(s); Object.keys(td2).forEach(function(n){ s.perfisRev[n] = Object.assign({}, s.perfisRev[n], td2[n]); }); }
    if(!s.demo19 && (s.internos||[]).some(function(x){ return x.real; })){ var f19 = feitos19(s); if(f19.internos.length){ s.demo19 = 1; s.internos = s.internos.concat(f19.internos); s.acertosConsignado = f19.acertos.concat(s.acertosConsignado||[]); } }   // 10 atendimentos feitos em 19/10
    if((s.kits||[]).length){ var sp = pkSemearDemo(s); s.pk = sp.pk; }   // 10 revendedoras do app com as preferências preenchidas (19/10/2026)
    if(!s.formasPagamento) s.formasPagamento = formasPagamentoPadrao();
    if(!s.formasPagamento.some(function(f){ return f.k==="pix_representante"; })){   // forma nova: Pix direto para a representante
      var nova = formasPagamentoPadrao().find(function(f){ return f.k==="pix_representante"; }), ip = s.formasPagamento.findIndex(function(f){ return f.k==="pix"; });
      s.formasPagamento.splice(ip>=0 ? ip+1 : s.formasPagamento.length, 0, nova); }
    if(!s.perfisRev) s.perfisRev = {};
    if(!s.usuario) s.usuario = SUPERVISORA.id;
    s.logado = true;   // sem tela de entrada
    if(!s.comis) s.comis = JSON.parse(JSON.stringify(COMIS0));
    if(s.comis.fixoV!==2){ s.comis.fixoV = 2; s.comis.combSemEnvio = COMIS0.combSemEnvio; }   // valor fixo do combustível sem km no prazo baixou para R$ 200,00
    if(s.demoAcertos!==VERSAO_DEMO){ s.demoAcertos = VERSAO_DEMO; s.acertosConsignado = acertosDemo(s).concat((s.acertosConsignado||[]).filter(function(r){ return !r.demo; })); }
    if(s.filaSimV!==3){ s.filaSimV = 3; s.filaSimulada = Math.max(0, 10 - filaRetornos(s).length); s.filaNivel = -1; s.alertas = (s.alertas||[]).filter(function(x){ return x.tipo!=="fila_retorno"; }); s = aplicaFila(s); }   // simulação: 45 kits aguardando bipagem (3 reais + 34) e o alerta já sobe
    s.visao = "supervisao";
    return s; } } } catch(x){}
  return novo();
}
function mapKit(s, id, fn){ return s.kits.map(function(k){ return k.id===id ? Object.assign({},k,fn(k)) : k; }); }
function com(s, patch, txt, tom){ var n = Object.assign({}, s, patch); if(txt) n.aviso = {txt:txt, tom:tom||"ok", t:Date.now()}; return n; }
function kitDe(s,id){ return s.kits.find(function(k){return k.id===id;}); }
function ajustaDiv(s, montId, delta){
  return s.montadoras.map(function(m){ return m.id!==montId ? m :
    Object.assign({}, m, {mes:Object.assign({}, m.mes, {div:Math.max(0, m.mes.div+delta)})}); });
}
function registroListagem(l, kits, agora){
  var ks = kits.filter(function(k){return k.lid===l.id;});
  return {id:l.id+"-"+agora, lid:l.id, hoje:true, ts:agora, data:new Date(agora).toLocaleDateString("pt-BR"), rep:l.rep, destino:l.destino, viagem:l.viagem,
    horario:l.horario, concluida:hora(agora), qtd:ks.length, total:ks.reduce(function(t,k){return t+(k.valor||0);},0),
    divs:ks.filter(function(k){return k.divReg;}).length, retiradas:l.retiradas.length+1,
    atrasados:ks.filter(function(k){return k.atrasado;}).length,
    kits:ks.map(function(k){ return {rev:k.rev, prio:k.prio, valor:k.valor, real:k.valorReal, div:k.divReg, atrasado:k.atrasado,
      media: k.vendas && k.vendas.length ? media3(k.vendas) : null, tipoKit:k.tipoKit, cond:k.cond, aval:k.aval, confRev:k.confRev||null,
      mont:nomeDe(k.montId), tempoM:k.tempoM, fimM:hora(k.fimM), bip:nomeDe(k.bipId), tempoB:k.fimB&&k.iniB?k.fimB-k.iniB:null, fimB:hora(k.fimB), ret:hora(k.retEm)}; })};
}

export { CHAVE, novo, inicial, mapKit, com, kitDe, ajustaDiv, registroListagem };
